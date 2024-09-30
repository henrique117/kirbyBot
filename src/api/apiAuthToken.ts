import Axios from 'axios'

export default async function getAuthToken(): Promise<string> {
    const body = {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_ID_SECRET,
        grant_type: 'client_credentials',
        scope: 'public'
    }

    try {
        const response = await Axios.post('https://osu.ppy.sh/oauth/token', body, {
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const { access_token } = response.data

        return access_token
    } catch (error) {
        return 'Error fetching access token'
    }
}