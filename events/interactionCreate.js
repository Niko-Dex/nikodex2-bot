const { Events } = require("discord.js")

module.exports = {
    name: Events.InteractionCreate,
    /**
     * 
     * @param {import("discord.js").Interaction} interaction 
     * @returns 
     */
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName)

            if (!command) {
                console.error(`No matching command was found: ${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
                console.log("'/" + interaction.commandName + "' at " + interaction.channel.name + "(" + interaction.channel.id + ")" + " in " + interaction.guild.name + "(" + interaction.guild.id + ")" + " from " + interaction.user.username + "(" + interaction.user.id + ")");
            } catch (error) {
                console.error(error);
            }
        }
    }
}