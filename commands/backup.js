const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const adminIdList = process.env.ADMIN_ID_LIST.split(";");
const uri = process.env.MYSQL_URI;
const user = process.env.MYSQL_USER;
const pass = process.env.MYSQL_PASS;
const mysqldump = require("mysqldump");
const port = process.env.MYSQL_PORT;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("backup")
    .setDescription("backs up the sql data"),
  /**
   *
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    if (!adminIdList.includes(interaction.user.id)) {
      await interaction.reply({
        content: "Who are you again?",
        flags: [MessageFlags.Ephemeral],
      });
      return;
    } else {
      try {
        await mysqldump({
          connection: {
            host: uri,
            user: user,
            password: pass,
            database: "nikodex",
            port: port,
          },
          dumpToFile: "./dump.sql",
        });
        await interaction.reply({
          content: "mySQL data backup:", // Optional message content
          files: ["./dump.sql"],
        });
      } catch (e) {
        console.log(e);
      }
    }
  },
};
