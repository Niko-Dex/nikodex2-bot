const dotenv = require('dotenv');
dotenv.config();
const fs = require('node:fs')
const path = require('node:path')

const { Client, GatewayIntentBits, Collection } = require('discord.js')
const token = process.env.DISCORD_TOKEN
const express = require('express')
const cors = require('cors')
const formidable = require('express-formidable');
const { upload } = require('./endpoints/upload');

const app = express()
app.use(cors())
app.use(formidable())
const port = process.env.PORT

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsFolder = path.join(__dirname, 'commands');
const commands = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));

for (const file of commands) {
    const filePath = path.join(commandsFolder, file);
    const command = require(filePath)
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

const eventsFolder = path.join(__dirname, "events")
const events = fs.readdirSync(eventsFolder).filter(file => file.endsWith('.js'))
for (const file of events) {
    const filePath = path.join(eventsFolder, file)
    const event = require(filePath)
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args))
    } else {
        client.on(event.name, (...args) => event.execute(...args))
    }
}

app.get('/', (req, res) => {
    res.send('The NikodexV2 discord bot is running on this port. This is NOT the frontend!')
})

app.post('/upload', async (req, res) => {
    await upload(req, res, client)
})

app.listen(port, () => {
  console.log(`[Nikodex2-bot] Bot's server listening on port ${port}`)
})

client.login(token)