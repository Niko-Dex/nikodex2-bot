const { SlashCommandBuilder, MessageFlags} = require('discord.js');
const adminIdList = process.env.ADMIN_ID_LIST.split(';')
const uri = process.env.MYSQL_URI.split(';')
const user = process.env.MYSQL_USER.split(';')
const pass = process.env.MYSQL_PASS.split(';')
const mysqldump = require('mysqldump')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('backs up the sql data'),
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
        } else {
            mysqldump({
                connection: {
                    host: uri,
                    user: user,
                    password: pass,
                    database: 'nikodex',
                },
                dumpToFile: './dump.sql',
            });
            channel.send({
                content: 'mySQL data backup:', // Optional message content
                files: ['./dump.sql']
            })
        }
    }
}