const sharp = require('sharp');
const { fileTypeFromFile } = require("file-type")
const { getDiscordUser, getSubmitUserInfo, postSubmitUserInfo } = require('../helper');
const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, PollLayoutType} = require('discord.js')
const adminIdList = process.env.ADMIN_ID_LIST.split(';')
const cooldown = 1 * 60 * 60 * 1000 // 1 hour / person

const allowedImageTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/bmp'
]);

/**
 * @param {string | undefined} str
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
    if (!req.fields) return

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

    // validate image (max 2MB, max dimension of 256x256)
    const imageFile = req.files['files[0]']
    if (imageFile.size > 2 * 1024 * 1024) {
        return "Size for image exceeded 2MB!"
    }

    try {
        const type = await fileTypeFromFile(imageFile.path)

        if (!type || !allowedImageTypes.has(type.mime)) {
            return "Invalid file type! (only png, jpg, jpeg, webp, or bmp are allowed)"
        }

        const imageMetadata = await sharp(imageFile.path).metadata()
        if (imageMetadata.width > 256 || imageMetadata.height > 256) {
            return "Dimension for image exceeded 256x256!"
        }
    } catch (e) {
        return "Problem while processing uploaded file. " + e
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

    const submitInfo = await getSubmitUserInfo(user["id"])
    if (submitInfo) {
        if (submitInfo["is_banned"]) {
            res.status(403).send(JSON.stringify({ detail: `You've been banned with the reason: ${submitInfo["ban_reason"] ?? ""}` }))
            return
        }
        if (submitInfo["last_submit_on"] + cooldown > Date.now()) {
            res.status(429).send(JSON.stringify({ detail: "You've already sent a Niko! Please wait at least an hour before submitting." }))
            return
        }
    }

    const errMsg = await validateSubmit(req)
    if (errMsg) {
        res.status(400).send(JSON.stringify({ detail: errMsg }))
        return
    }

    const abilities = req.fields['abilities'].split('|||');

    let abilitiesFields = []
    if (req.fields['abilities']) {
        for (let i = 0; i < abilities.length; i++) {
            abilitiesFields.push({ name: `Ability #${i + 1}`, value: abilities[i] })
        }
    }

    const image = await sharp(req.files['files[0]'].path).toFormat("png").toBuffer()
    let file = new AttachmentBuilder(image)
        .setName("image.png")

    let embed = new EmbedBuilder()
        .setTitle(`Submission: ${req.fields['name']}`)
        .setDescription(req.fields['full_desc'])
        .addFields({ name: 'Author', value: `${user['username']} (${user['id']})` })
        .addFields({ name: 'Short Description', value: `${req.fields['description']}` })
        .setImage(`attachment://image.png`)

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

pollQuestion = { text: 'Should we add this Niko?' };
pollAnswers = [{ text: 'Yes', emoji: '🟩' },{ text: 'No', emoji: '🟥' }];

    try {
        const dmUser = await client.users.fetch(user['id'])
        const sentEmbed = await client.channels.cache.get(process.env['SUBMISSIONS_CHANNEL'])
            .send({ embeds: [embed], files: [file], components: [actionRow] }, { poll: {question: [pollQuestion]}, answers: [pollAnswers], allowMultiselect: false, duration: 24, layoutType: PollLayoutType.Default})
    
        await postSubmitUserInfo(user["id"], {
            "last_submit_on": Date.now(),
            "is_banned": false,
            "ban_reason": ""
        })

        const filter = (interaction) => adminIdList.includes(interaction.user.id);
        sentEmbed.awaitMessageComponent({ filter, time: 7 * 24 * 60 * 60 * 1000 })
            .then(async componentInp => {
                const accepted = componentInp.customId === 'accept'
                await componentInp.update({ content: `This niko was ${accepted ? "accepted" : "denied"} by <@${componentInp.user.id}>!`, components: [] })
                await dmUser.dmChannel.send(`Your nikosona was ${accepted ? "accepted" : "denied"}: ${req.fields['name']}`)
            })
            .catch(e => {
                console.log(e)
            })
    } catch (e) {
        console.log(e)
        res.status(400).send(JSON.stringify({ detail: `Problem while submitting! ${e}` }))
    }

    try {
        const dmUser = await client.users.fetch(user['id'])
        await dmUser.createDM(true)
        await dmUser.dmChannel.send(`Your Nikosona submission was sent: ${req.fields['name']}`)
        res.status(200).send(JSON.stringify(req.fields));
    } catch (e) {
        console.log(e)
        res.status(400).send(JSON.stringify({ detail: `Your Nikosona submission was sent, but you turned off DM, so we can't send you status about your submission!` }))
    }
}

module.exports = {
    upload
}