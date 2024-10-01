import Axios from 'axios'
import getAuthToken from './apiAuthToken'
import fs from 'fs/promises'
import path from 'path'

export default class APICalls {
    private token: Promise<string>
    constructor() {
        this.token = getAuthToken()
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
                console.log(Math.floor(score.accuracy * 10000) / 10000)
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

    public async postJSONFile(data: any, name: string): Promise<string> {
        const fileName = name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '_')
        const filePath = path.resolve(__dirname, `../${fileName}.json`)

        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2))
            return filePath
        } catch (error) {
            return 'Error ao salvar arquivo!'
        }
    }
}