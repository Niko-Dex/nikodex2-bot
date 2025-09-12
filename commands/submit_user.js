const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
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
        )
        .addSubcommand(s => s
            .setName("clear_timeout")
            .setDescription("Remove current timeout for a user (should only be use for testing purpose).")
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

        async function getInfo() {
            const embed = new EmbedBuilder()
                .setColor(userInfo["banner_color"])
                .setTitle("User Info")
                .setThumbnail(`https://cdn.discordapp.com/avatars/${userInfo["id"]}/${userInfo["avatar"]}.webp?size=1024`)
                .addFields({
                    name: "Username",
                    value: `${userInfo["username"]}#${userInfo["discriminator"]}`,
                    inline: true
                })
                .addFields({
                    name: "Global Name",
                    value: userInfo["global_name"],
                    inline: true
                })
                .setTimestamp()
                .setFooter({ text: 'kbity kbity kbity' })

            const info = await getSubmitUserInfo(providedUserId)
            if (!info) {
                embed.addFields({
                    name: "Submit status",
                    value: "User has not submit entry yet.",
                    inline: true
                })
            } else {
                embed
                    .addFields({
                        name: "Submit status",
                        value: "User has submitted an entry.",
                        inline: true
                    })
                    .addFields({
                        name: "Last submitted on",
                        value: `<t:${Math.round(info["last_submit_on"] / 1000)}>`,
                        inline: true
                    })
                    .addFields({
                        name: "Is banned",
                        value: info["is_banned"] ? "**yes**" : "nope",
                        inline: true
                    })

                if (info["is_banned"]) {
                    embed.addFields({
                        name: "Ban reason",
                        value: info["ban_reason"]
                    })
                }
            }

            await interaction.reply({
                embeds: [embed]
            })
        }

        async function ban() {
            const info = await getSubmitUserInfo(providedUserId)
            let prevValue = {
                last_submit_on: info ? info["last_submit_on"] : 0,
            }

            const reason = interaction.options.getString("reason")
            await postSubmitUserInfo(providedUserId, {
                last_submit_on: prevValue["last_submit_on"],
                is_banned: true,
                ban_reason: reason
            })
            await interaction.reply(`User \`${providedUserId}\` has been BANNED for: \`${reason}\``)
        }

        async function unban() {
            const info = await getSubmitUserInfo(providedUserId)
            let prevValue = {
                last_submit_on: info ? info["last_submit_on"] : 0,
            }

            await postSubmitUserInfo(providedUserId, {
                last_submit_on: prevValue["last_submit_on"],
                is_banned: false,
                ban_reason: ""
            })
            await interaction.reply(`User \`${providedUserId}\` has been unbanned!`)
        }

        async function clearTimeout() {
            const info = await getSubmitUserInfo(providedUserId)
            let prevValue = {
                is_banned: info ? info["is_banned"] : false,
                ban_reason: info ? info["ban_reason"] : "",
            }

            await postSubmitUserInfo(providedUserId, {
                last_submit_on: 0,
                is_banned: prevValue["is_banned"],
                ban_reason: prevValue["ban_reason"]
            })
            await interaction.reply(`Rate-limit for user \`${providedUserId}\` has been CLEARED!`)
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
            case "clear_timeout":
                await clearTimeout()
                break
        }
    }
}