"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const apiAuthToken_1 = __importDefault(require("./apiAuthToken"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crud_1 = require("../database/crud");
class APICalls {
    constructor() {
        (0, crud_1.getLastMatch)((err, rows) => {
            if (err) {
                console.error(err.message);
            }
            else {
                if (rows) {
                    this.lastMatchSaved = rows[0].id;
                }
            }
        });
        this.token = (0, apiAuthToken_1.default)();
    }
    async getUserById(id) {
        const response = await axios_1.default.get(`https://osu.ppy.sh/api/v2/users/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await this.getAuth()}`
            }
        });
        return response.data.username;
    }
    getLastMatch() {
        return this.lastMatchSaved;
    }
    async getAuth() {
        return this.token;
    }
    async getMatchById(matchId) {
        try {
            const response = await axios_1.default.get(`https://osu.ppy.sh/api/v2/matches/${matchId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${await this.getAuth()}`
                }
            });
            return response.data;
        }
        catch (error) {
            return { error: 'MP link not found' };
        }
    }
    async getMatchScoresById(matchId, warmups) {
        const response = await this.getMatchById(matchId);
        const mapsPlayed = [];
        response.events.map((event) => {
            if (event.detail.type === 'other')
                mapsPlayed.push(event);
        });
        const callback = {
            match_name: response.match.name,
            scores: []
        };
        mapsPlayed.map((map) => {
            const scores = [];
            map.game.scores.map((score) => {
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
                });
            });
            callback.scores.push({
                beatmap_id: map.game.beatmap.id,
                beatmap_link: `https://osu.ppy.sh/beatmapsets/${map.game.beatmap.beatmapset_id}#osu/${map.game.beatmap.id}`,
                scoring_type: map.game.scoring_type,
                scores: scores
            });
        });
        if (warmups) {
            for (let i = 0; i < warmups; i++)
                callback.scores.shift();
        }
        return await this.postJSONFile(callback, response.match.name);
    }
    async postJSONFile(data, name) {
        const fileName = name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '_');
        const filePath = path_1.default.resolve(__dirname, `../${fileName}.json`);
        try {
            await promises_1.default.writeFile(filePath, JSON.stringify(data, null, 2));
            return filePath;
        }
        catch (error) {
            console.error(error);
            return 'Error ao salvar arquivo!';
        }
    }
    async postTXTFile(data, name) {
        const filePath = path_1.default.resolve(__dirname, `../${name}.txt`);
        const array = [];
        data.forEach((lobby) => {
            array.push(`${lobby.name}: https://osu.ppy.sh/community/matches/${lobby.id}`);
        });
        const content = array.join('\n');
        try {
            await promises_1.default.writeFile(filePath, content, 'utf8');
            return filePath;
        }
        catch (error) {
            console.error(error);
            return 'Error on saving file!';
        }
    }
    async getQueryMp(event, queryParams, params) {
        let messageContent;
        messageContent = await event.channel.send('Loading links...');
        try {
            await this.recursiveSearch();
            const data = await (0, crud_1.getQueryMatches)(queryParams, params);
            messageContent?.edit('Preparing the txt file');
            return [await this.postTXTFile(data, `matches_found_params=${params}`), messageContent];
        }
        catch (err) {
            console.error(err);
            return 'Error fetching matches';
        }
    }
    async recursiveSearch(cursor_string) {
        try {
            const response = await axios_1.default.get(`https://osu.ppy.sh/api/v2/matches?limit=50&sort=id_desc${cursor_string ? `&cursor_string=${cursor_string}` : ''}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${await this.getAuth()}`
                }
            });
            let shouldStop = false;
            for (const lobby of response.data.matches) {
                if (lobby.id !== this.lastMatchSaved) {
                    (0, crud_1.addMatch)(lobby.id, lobby.start_time, lobby.name);
                }
                else {
                    shouldStop = true;
                    await new Promise((resolve, reject) => {
                        (0, crud_1.getLastMatch)((err, rows) => {
                            if (err) {
                                console.error(err.message);
                                reject(err);
                            }
                            else {
                                this.lastMatchSaved = rows[0].id;
                                resolve();
                            }
                        });
                    });
                    break;
                }
            }
            if (!shouldStop)
                await this.recursiveSearch(response.data.cursor_string);
        }
        catch (error) {
            console.error(error);
        }
    }
}
exports.default = APICalls;
