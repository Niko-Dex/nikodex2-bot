const { getDiscordUser } = require('../helper');
const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js')
const adminIdList = process.env.ADMIN_ID_LIST.split(';')

async function upload(req, res, client) {
    const token = req.headers.authorization ?? ""
    const user = await getDiscordUser(token)
    if (!user) {
        res.status(401).send(JSON.stringify({ msg: `Unauthenticated!` }))
    }

    const abilities = req.fields['abilities'].split('|||');
    console.log(abilities);

    let abilitiesFields = []
    if (req.fields['abilities']) {
        for (const element of abilities) {
            abilitiesFields.push({ name: 'Ability', value: element })
        }
    }

    const originalFileName = req.files['files[0]'].name;

    try {
        let file = new AttachmentBuilder(req.files['files[0]'].path);
        file.setName(originalFileName)
        let embed = new EmbedBuilder()
            .setTitle(`Submission: ${req.fields['name']}`)
            .setDescription(`${req.fields['description']}`)
            .addFields({ name: 'Author', value: `${user['username']} (${user['id']})` })
            .addFields({ name: 'Full Description', value: `${req.fields['full_desc']}` })
            .setImage(`attachment://${originalFileName}`)

        embed = embed.addFields(abilitiesFields);

        const acceptButton = new ButtonBuilder()
            .setCustomId("accept")
            .setLabel("Accept")
            .setStyle(ButtonStyle.Success)

        const denyButton = new ButtonBuilder()
            .setCustomId("deny")
            .setLabel("Deny")
            .setStyle(ButtonStyle.Danger)

        const actionRow = new ActionRowBuilder()
            .addComponents(acceptButton, denyButton)

        client.channels.cache.get(process.env['SUBMISSIONS_CHANNEL'])
        .send({ embeds: [embed], files: [file], components: [actionRow] })
        .then(message => {
            const filter = (interaction) => adminIdList.includes(interaction.user.id);
            message.awaitMessageComponent({ filter, time: 7 * 24 * 60 * 60 * 1000 })
                .then(async interaction => {
                    if (interaction.customId === 'accept') {
                        client.users.fetch(user['id'])
                        .then(async u => {
                            await u.createDM(true)
                            await u.dmChannel.send(`Your nikosona was accepted: ${req.fields['name']}`)
                        })
                        await interaction.update({ content: 'This niko was accepted!', components: [] })
                    }
                    else if (interaction.customId === 'deny') {
                        client.users.fetch(user['id'])
                        .then(async u => {
                            await u.createDM(true)
                            await u.dmChannel.send(`Your nikosona was denied: ${req.fields['name']}`)
                        })
                        await interaction.update({ content: 'This niko was denied!', components: [] })
                    }
                })
                .catch(console.error);
        })

        client.users.fetch(user['id'])
        .then(async u => {
            await u.createDM(true)
            await u.dmChannel.send(`Your nikosona submission was sent: ${req.fields['name']}`)
        })
        .catch(e => console.log(e))
    } catch (error) {
        console.log(error)
        res.status(400).send(JSON.stringify({ msg: `Error! ${error}` }))
    }

    res.send(JSON.stringify(req.fields));
}

module.exports = {
    upload
}