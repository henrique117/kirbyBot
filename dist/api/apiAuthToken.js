"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getAuthToken;
const axios_1 = __importDefault(require("axios"));
async function getAuthToken() {
    const body = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_ID_SECRET,
        grant_type: 'client_credentials',
        scope: 'public'
    };
    try {
        const response = await axios_1.default.post('https://osu.ppy.sh/oauth/token', body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const { access_token } = response.data;
        return access_token;
    }
    catch (error) {
        return 'Error fetching access token';
    }
}
