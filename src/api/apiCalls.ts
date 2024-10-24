import Axios from 'axios'
import getAuthToken from './apiAuthToken'
import fs from 'fs/promises'
import path from 'path'
import * as Interfaces from '../interfaces/interfaces.export'
import { addMatch, getLastMatch, getQueryMatches } from '../database/crud'

export default class APICalls {
    private token: Promise<string>
    private lastMatchSaved!: number

    constructor() {
        getLastMatch((err: any, rows: any) => {
            if(err) {
                console.error(err.message)
            } else {
                if(rows) {
                    this.lastMatchSaved = rows[0].id
                }
            }
        })
        this.token = getAuthToken()
    }

    public async getUserById(id: number): Promise<any> {
        const response = await Axios.get(`https://osu.ppy.sh/api/v2/users/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await this.getAuth()}`
            }
        })

        return response.data.username
    }

    public getLastMatch(): number {
        return this.lastMatchSaved
    }

    private async getAuth(): Promise<string> {
        return this.token
    }

    public async getMatchById(matchId: number): Promise<any> {
        try {
            const response = await Axios.get(`https://osu.ppy.sh/api/v2/matches/${matchId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${await this.getAuth()}`
                }
            })
            
            return response.data
    
        } catch(error) {
            return {error: 'MP link not found'}
        }
    }

    public async getMatchScoresById(matchId: number, warmups?: number): Promise<any> {
        const response = await this.getMatchById(matchId)
        const mapsPlayed: any[] = []


        response.events.map((event: any) => {
            if(event.detail.type === 'other') mapsPlayed.push(event)
        })

        const callback: any = {
            match_name: response.match.name,
            scores: []
        }

        mapsPlayed.map((map: any) => {
            const scores: any[] = []
            map.game.scores.map((score: any) => {
                scores.push({
                    acc: Math.floor(score.accuracy * 10000) / 10000,
                    max_combo: score.max_combo,
                    mods: score.mods,
                    score: score.score,
                    user_id: score.user_id,
                    scoring_type: score.scoring_type,
                    statistics: {
                        n300: score.statistics.count_300,
                        n100: score.statistics.count_100,
                        n50: score.statistics.count_50,
                        n0: score.statistics.count_miss
                    }
                })
            })
            
            callback.scores.push({
                beatmap_id: map.game.beatmap.id,
                beatmap_link: `https://osu.ppy.sh/beatmapsets/${map.game.beatmap.beatmapset_id}#osu/${map.game.beatmap.id}`,
                scoring_type: map.game.scoring_type,
                scores: scores
            })
        })

        if(warmups) {
            for (let i = 0; i < warmups; i++) callback.scores.shift()
        }

        return await this.postJSONFile(callback, response.match.name)
    }

    private async postJSONFile(data: any, name: string): Promise<string> {
        const fileName = name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '_')
        const filePath = path.resolve(__dirname, `../${fileName}.json`)

        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2))
            return filePath
        } catch (error) {
            console.error(error)
            return 'Error ao salvar arquivo!'
        }
    }

    private async postTXTFile(data: Interfaces.MatchesInterfaces[], name: string): Promise<string> {
        const filePath = path.resolve(__dirname, `../${name}.txt`)

        const array: string[] = []

        data.forEach((lobby: Interfaces.MatchesInterfaces) => {
            array.push(`${lobby.name}: https://osu.ppy.sh/community/matches/${lobby.id}`)
        })

        const content = array.join('\n')

        try {
            await fs.writeFile(filePath, content, 'utf8')
            return filePath
        } catch (error){
            console.error(error)
            return 'Error on saving file!'
        }
    }

    public async getQueryMp(event: any, queryParams: string, params: string): Promise<any> {
        let messageContent: any
        messageContent = await event.channel.send('Loading links...')
    
        try {
            await this.recursiveSearch()
    
            const data: Interfaces.MatchesInterfaces[] = await getQueryMatches(queryParams, params)
    
            messageContent?.edit('Preparing the txt file')
    
            return [await this.postTXTFile(data, `matches_found_params=${params}`), messageContent]
        } catch (err) {
            console.error(err)
            return 'Error fetching matches'
        }
    }
    

    private async recursiveSearch(cursor_string?: string): Promise<any> {
        try {
            const response = await Axios.get(`https://osu.ppy.sh/api/v2/matches?limit=50&sort=id_desc${cursor_string ? `&cursor_string=${cursor_string}` : ''}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${await this.getAuth()}`
                }
            })

            let shouldStop = false

            for (const lobby of response.data.matches) {
                if (lobby.id !== this.lastMatchSaved) {
                    addMatch(lobby.id, lobby.start_time, lobby.name)
                } else {
                    shouldStop = true
    
                    await new Promise<void>((resolve, reject) => {
                        getLastMatch((err: any, rows: any) => {
                            if (err) {
                                console.error(err.message)
                                reject(err)
                            } else {
                                this.lastMatchSaved = rows[0].id
                                resolve()
                            }
                        })
                    })
                    break
                }
            }

            if(!shouldStop) await this.recursiveSearch(response.data.cursor_string)

        } catch(error) {
            console.error(error)
        }
    }

    public async get5digitsOnline(): Promise<any> {

        try {
            let page = 1
            let isFinished = false
            const players: any[] = []

            while(!isFinished) {
                try {
                    const response = await Axios.get(`https://osu.ppy.sh/api/v2/rankings/osu/performance`, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${await this.getAuth()}`
                        },
                        params: {
                            country: 'BR',
                            page: page
                        }
                    })

                    const data = response.data.ranking

                    data.forEach((player: any) => {
                        if(player.global_rank < 100000 && player.global_rank > 9999 && player.user.is_online == true) players.push(`${player.user.username}: https://osu.ppy.sh/users/${player.user.id}`)
                    })

                    if (data[data.length - 1].global_rank > 99999) {
                        isFinished = true
                    } else {
                        page++
                    }

                } catch {
                    console.log('Houve um erro ao achar os players')
                }
            }

            return players
        } catch {
            console.log('erro')
        }
    }
}