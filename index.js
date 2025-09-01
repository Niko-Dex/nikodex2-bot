const dotenv = require('dotenv');
dotenv.config();
const fs = require('node:fs')
const path = require('node:path')

const { Client, Events, GatewayIntentBits, MessageFlags, Collection } = require('discord.js')
const token = process.env.DISCORD_TOKEN

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

client.login(token)