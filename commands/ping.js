const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong!'),
    async execute(interaction) {
        await interaction.reply("Pong!");
        console.log("'/ping' at " + interaction.channel.name + "(" + interaction.channel.id + ")" + " in " + interaction.guild.name + "(" + interaction.guild.id);
    }
}