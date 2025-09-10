const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const adminIdList = process.env.ADMIN_ID_LIST.split(';')
const { getSubmitUserInfo, postSubmitUserInfo } = require("../helper")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('submit_user')
        .setDescription('Get/set metadata about a Discord user on the submit page')
        .addSubcommand(s => s
            .setName("info")
            .setDescription("Get info about a user who has submit to the Nikodex (if exists)")
            .addStringOption(o => o
                .setName("user_id")
                .setDescription("The user's ID")
                .setRequired(true)
            )
        )
        .addSubcommand(s => s
            .setName("ban")
            .setDescription("Ban a user from submitting to the Nikodex.")
            .addStringOption(o => o
                .setName("user_id")
                .setDescription("The user's ID")
                .setRequired(true)
            )
            .addStringOption(o => o
                .setName("reason")
                .setDescription("Ban reason")
                .setRequired(true)
            )
        )
        .addSubcommand(s => s
            .setName("unban")
            .setDescription("Unban a user from submitting to the Nikodex.")
            .addStringOption(o => o
                .setName("user_id")
                .setDescription("The user's ID")
                .setRequired(true)
            )
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

        async function getInfo() {
            const info = await getSubmitUserInfo(interaction.options.getString("user_id"))
            if (!info) {
                await interaction.reply("I don't know this user! (user not submitted on the webpage yet)")
                return
            }
            await interaction.reply(`User ID: \`${info["user_id"]}\`\nLast submitted a Nikosona on: \`${new Date(info["last_submit_on"]).toString()}\`\nStatus: \`${info["is_banned"] ? "BANNED" : "not banned"}\`\nBan reason (if banned): \`${info["ban_reason"]}\``)
        }

        async function ban() {
            const userId = interaction.options.getString("user_id")
            const reason = interaction.options.getString("reason")
            await postSubmitUserInfo(userId, {
                last_submit_on: 0,
                is_banned: true,
                ban_reason: reason
            })
            await interaction.reply(`User \`${userId}\` has been BANNED for: \`${reason}\``)
        }

        async function unban() {
            const userId = interaction.options.getString("user_id")
            await postSubmitUserInfo(userId, {
                last_submit_on: 0,
                is_banned: false,
                ban_reason: ""
            })
            await interaction.reply(`User \`${userId}\` has been unbanned!`)
        }

        switch (interaction.options.getSubcommand()) {
            case "info":
                await getInfo()
                break
            case "ban":
                await ban()
                break
            case "unban":
                await unban()
                break
        }
    }
}