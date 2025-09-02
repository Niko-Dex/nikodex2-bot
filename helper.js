module.exports = {
    async isValidDiscordUser(discord_token) {
        const disc = await fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `Bearer ${discord_token}`
            }
        })

        return disc.ok
    }
}