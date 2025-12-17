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
                console.log("'/" + interaction.commandName + "' at " + interaction.guild.name + "(" + interaction.guild.id + ")" + " in " + interaction.channel.name + "(" + interaction.channel.id + ")" + " from " + interaction.user.username + "(" + interaction.user.id + ")");
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
            }
        }
    }
}