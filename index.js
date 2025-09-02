const dotenv = require('dotenv');
dotenv.config();
const fs = require('node:fs')
const path = require('node:path')

const { Client, Events, GatewayIntentBits, MessageFlags, Collection, 
    EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle} = require('discord.js')
const token = process.env.DISCORD_TOKEN
const express = require('express')
const cors = require('cors')
const formidable = require('express-formidable');
const { getDiscordUser } = require('./helper');

const app = express()
app.use(cors())
app.use(formidable())
const port = process.env.PORT

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const adminIdList = process.env.ADMIN_ID_LIST.split(';')

const foldersPath = path.join(__dirname, 'commands');
const commandFolder = fs.readdirSync(foldersPath);

for (const file of commandFolder) {
    const filePath = path.join(foldersPath, file);
    const command = require(filePath)
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

client.once(Events.ClientReady, readyClient => {
    console.log(`[Nikodex2-bot] Ready! Logged in as ${readyClient.user.tag}`)
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName)

    if (!command) {
        console.error(`No matching command was found: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
    }
})

app.get('/', (req, res) => {
    res.send('The NikodexV2 discord bot is running on this port. This is NOT the frontend!')
})

app.post('/upload', async (req, res) => {
    const token = req.headers.authorization ?? ""
    const user = await getDiscordUser(token)
    if (!user) {
        res.status(401).send(JSON.stringify({ msg: `Unauthenticated!` }))
    }

    const abilities = req.fields['abilities'].split('|||');
    console.log(abilities);

    let abilitiesFields = []
    for (const element of abilities) {
        abilitiesFields.push({ name: 'Ability', value: element })
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
})

app.listen(port, () => {
  console.log(`[Nikodex2-bot] Bot's server listening on port ${port}`)
})

client.login(token)