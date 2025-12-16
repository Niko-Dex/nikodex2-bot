const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const adminIdList = process.env.ADMIN_ID_LIST.split(';')
const { exec, spawn } = require('node:child_process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('website')
        .setDescription('Updates either the backend or frontend')
        .addSubcommand(s => s
            .setName("frontend")
            .setDescription("Pulls the frontend. Make sure you stop it first.")
        )
        .addSubcommand(s => s
            .setName("backend")
            .setDescription("Pulls the backend. Make sure you stop it first.")
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
            const frontendUpdater = spawn(`${process.env["FRONTEND_UPDATE_PATH"]}`, [], { detached: true, shell: true});
        }
        async function backend() {
            const backendUpdater = spawn(`${process.env["BACKEND_UPDATE_PATH"]}`, [], { detached: true, shell: true});
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