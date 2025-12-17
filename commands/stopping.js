const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const adminIdList = process.env.ADMIN_ID_LIST.split(';')
const { getSubmitUserInfo, postSubmitUserInfo } = require("../helper")
const { frontendProcess, backendProcess } = require("../commands/starting")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops either the backend or frontend')
        .addSubcommand(s => s
            .setName("frontend")
            .setDescription("Stops the frontend.")
        )
        .addSubcommand(s => s
            .setName("backend")
            .setDescription("Stops the backend.")
        ),
    /**
     * 
     * @param {import('discord.js').Interaction} interaction 
     */
    async execute(interaction) {
        if (!adminIdList.includes(interaction.user.id)) {
            await interaction.reply({
                content: "Who are you again?",
                flags: [ MessageFlags.Ephemeral ]
            })
            return
        }
        
        async function frontend() {
            frontendProcess.kill()
        }
        async function backend() {
            backendProcess.kill()
        }

        switch (interaction.options.getSubcommand()) {
            case "frontend":
                await frontend()
                break
            case "backend":
                await backend()
                break
        }
    }
}