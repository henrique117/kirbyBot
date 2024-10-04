import Axios from 'axios'
import getAuthToken from './apiAuthToken'
import fs from 'fs/promises'
import path from 'path'
import * as Interfaces from '../interfaces/interfaces.export'

export default class APICalls {
    private token: Promise<string>
    private matches: Interfaces.MatchesInterfaces[]
    private counter: number

    constructor() {
        this.token = getAuthToken()
        this.matches = []
        this.counter = 0
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
        const fileName = name
        const filePath = path.resolve(__dirname, `../${fileName}.txt`)

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
            return 'Error ao salvar arquivo!'
        }
    }

    public async getQueryMp(event: any, queryParams?: string, params?: string): Promise<any[]> {
        const mpFound: Interfaces.MatchesInterfaces[] = []
        let messageContent
        try {
            messageContent = await event.channel.send('Loading links...')
            await this.recursiveSearch()
        } finally {
            if(queryParams) {
                if((queryParams === '-name' || '-n') && params) {
                    this.matches.forEach((lobby: Interfaces.MatchesInterfaces) => {
                        if(lobby.name.toLowerCase().includes(params.toLowerCase())) mpFound.push(lobby)
                    })
                }
            } else {
                this.matches.forEach((lobby: Interfaces.MatchesInterfaces) => {
                    mpFound.push(lobby)
                })
            }
    
            return [await this.postTXTFile(mpFound, `Matches&params=${queryParams ? `${queryParams}=${params}` : 'null'}`), messageContent]
        }
    }

    private async recursiveSearch(cursor_string?: string): Promise<any> {
        try {
            const response = await Axios.get(`https://osu.ppy.sh/api/v2/matches?limit=50&sort_id=id_desc${cursor_string ? `&cursor_string=${cursor_string}` : ''}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${await this.getAuth()}`
                }
            })

            response.data.matches.forEach((lobby: Interfaces.MatchesInterfaces) => {
                this.matches.push(lobby)
                if(this.matches[this.matches.length - 1] == lobby) return
            })
            
            if(this.counter >= 10000) {
                this.counter = 0
                return
            }

            if(response.data.cursor_string) {
                this.counter++
                await this.recursiveSearch(response.data.cursor_string)
            }

        } catch(error) {
            console.error(error)
        }
    }
}