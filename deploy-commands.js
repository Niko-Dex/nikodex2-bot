const dotenv = require('dotenv');
dotenv.config();
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
const token = process.env.DISCORD_TOKEN
const clientId = process.env.CLIENT_ID

commands = []

const foldersPath = path.join(__dirname, 'commands');
const commandFolder = fs.readdirSync(foldersPath);

for (const file of commandFolder) {
    const filePath = path.join(foldersPath, file);
    const command = require(filePath)
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON())
    }
}

const rest = new REST().setToken(token);

(async() => {
    try {
        console.log('Started refreshing slash commands');

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );

        console.log(`Successfully refreshed ${data.length} slash commands`);
    } catch (error) {
        console.error(error);
    }
})();