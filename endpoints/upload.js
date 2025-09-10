const sharp = require('sharp');
const { getDiscordUser } = require('../helper');
const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client} = require('discord.js')
const adminIdList = process.env.ADMIN_ID_LIST.split(';')

/**
 * @param {string} str
 * @returns {number}
 */
function getStrLenInBytes(str) {
    return new TextEncoder().encode(str).length
}

/**
 * 
 * @param {import("express").Request} req 
 */
async function validateSubmit(req) {
    // validate name (max 120 bytes)
    if (getStrLenInBytes(req.fields["name"]) > 120) {
        return "Length for name exceeded 120 bytes!"
    }

    // validate short description (max 250 bytes)
    if (getStrLenInBytes(req.fields["description"]) > 250) {
        return "Length for short description exceeded 250 bytes!"
    }

    // validate description (max 1000 bytes)
    if (getStrLenInBytes(req.fields["full_desc"]) > 1000) {
        return "Length for description exceeded 1000 bytes!"
    }

    // validate abilities (max 20 abilities, max 500 bytes/ASCII characters across all abilities)
    const abilities = req.fields["abilities"].split("|||")
    if (abilities.length > 20) {
        return "Number of abilities exceeded 20 abilities!"
    }

    let abilitiesCnt = 0
    for (let i of abilities) {
        abilitiesCnt += getStrLenInBytes(i)
    }
    if (abilitiesCnt > 500) {
        return "Total length for all abilities exceeded 500 bytes!"
    }

    // validate image (max 2MB, max dimension of 1024x1024)
    const imageFile = req.files['files[0]']
    if (imageFile.size > 2 * 1024 * 1024) {
        return "Size for image exceeded 2MB!"
    }

    const imageMetadata = await sharp(imageFile.path).metadata()
    if (imageMetadata.width > 1024 || imageMetadata.height > 1024) {
        return "Dimension for image exceeded 1024x1024!"
    }
    return null
}

/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {Client} client 
 */

async function upload(req, res, client) {
    const token = req.headers.authorization ?? ""
    const user = await getDiscordUser(token)
    if (!user) {
        res.status(401).send(JSON.stringify({ detail: `Unauthenticated!` }))
        return
    }

    const errMsg = await validateSubmit(req)
    if (errMsg) {
        res.status(400).send(JSON.stringify({ detail: errMsg }))
        return
    }

    const abilities = req.fields['abilities'].split('|||');

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
            .setDescription(req.fields['full_desc'])
            .addFields({ name: 'Author', value: `${user['username']} (${user['id']})` })
            .addFields({ name: 'Short Description', value: `${req.fields['description']}` })
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
        res.status(400).send(JSON.stringify({ detail: `Error! ${error}` }))
    }

    res.status(200).send(JSON.stringify(req.fields));
}

module.exports = {
    upload
}