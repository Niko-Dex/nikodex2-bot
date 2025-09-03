const { Events } = require("discord.js")

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`[Nikodex2-bot] Ready! Logged in as ${client.user.tag}`);
    }
}