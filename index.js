const dotenv = require('dotenv');
dotenv.config();
const fs = require('node:fs')
const path = require('node:path')

const { Client, Events, GatewayIntentBits, MessageFlags, Collection, EmbedBuilder, AttachmentBuilder } = require('discord.js')
const token = process.env.DISCORD_TOKEN
const express = require('express')
const cors = require('cors')
const formidable = require('express-formidable');
const { getDiscordUser } = require('./helper');

const app = express()
app.use(cors())
app.use(formidable())
const port = 3000

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

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
    res.send('Hello World!')
})

app.post('/msg', (req, res) => {
    client.channels.cache.get('1408078874213875726')
    .send('If you are seeing this then i successfully sent a msg because of a POST to localhost:3000/msg');
    res.send('Sent message to discord channel');
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

        client.channels.cache.get(process.env['SUBMISSIONS_CHANNEL'])
        .send({ embeds: [embed], files: [file] })

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