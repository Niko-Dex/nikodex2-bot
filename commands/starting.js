const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const adminIdList = process.env.ADMIN_ID_LIST.split(';')
const { getSubmitUserInfo, postSubmitUserInfo } = require("../helper")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Starts either the backend or frontend')
        .addSubcommand(s => s
            .setName("frontend")
            .setDescription("Starts the frontend. Make sure you stop it first.")
        )
        .addSubcommand(s => s
            .setName("backend")
            .setDescription("Starts the backend. Make sure you stop it first.")
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

        const providedUserId = interaction.options.getString("user_id")
        const userRes = await fetch(`https://discord.com/api/v9/users/${providedUserId}`, {
            headers: {
                Authorization: `Bot ${process.env["DISCORD_TOKEN"]}`
            }
        })

        if (!userRes.ok) {
            await interaction.reply({
                content: "Unknown Discord user!",
                flags: [ MessageFlags.Ephemeral ]
            })
            return
        }

        const userInfo = await userRes.json()

        async function frontend() {
            const frontendProcess = spawn(`cmd /k ${process.env["FRONTEND_START_PATH"]}`, [], { detached: true, shell: true});
        }
        async function backend() {
            const backendProcess = spawn(`cmd /k ${process.env["BACKEND_START_PATH"]}`, [], { detached: true, shell: true});
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