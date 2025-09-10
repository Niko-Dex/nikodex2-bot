module.exports = {
    async getDiscordUser(discord_token) {
        const disc = await fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `Bearer ${discord_token}`
            }
        })

        if (disc.ok) {
            return await disc.json()
        } else {
            return null
        }
    },
    async getSubmitUserInfo(user_id) {
        const apiUri = process.env.API_URI
        const API_BOT_SHARED_SECRET = process.env.API_BOT_SHARED_SECRET
        const res = await fetch(`${apiUri}/discord_bot/submit_user?user_id=${user_id}`, {
            headers: {
                "Authorization": API_BOT_SHARED_SECRET ?? ""
            }
        })

        if (res.status == 401) {
            throw new Error("Shared secret mismatch!")
        }

        if (res.status == 404) {
            return null
        }

        return await res.json()
    },
    async postSubmitUserInfo(user_id, data) {
        const apiUri = process.env.API_URI
        const API_BOT_SHARED_SECRET = process.env.API_BOT_SHARED_SECRET
        const res = await fetch(`${apiUri}/discord_bot/submit_user?user_id=${user_id}`, {
            method: "POST",
            headers: {
                "Authorization": API_BOT_SHARED_SECRET ?? "",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        if (res.status == 401) {
            throw new Error("Shared secret mismatch!")
        }

        return await res.json()
    }
}