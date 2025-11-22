const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const apiUri = process.env.API_URI
const Buffer = require('buffer').Buffer

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getnotd')
        .setDescription('Replies with the Niko of the Day!'),

    async execute(interaction) {
        await interaction.reply("Looking for the Niko..");
        try {
            const niko = interaction.options.getString("nikosona");
            const res =  await fetch(`https://nikodex.net/api/data/random_notd`);
            const resJson = await res.json();
            if (res.status > 299) {
                await interaction.editReply(`Result is not OK: HTTP ${res.status}`);
                return;
            }

            const blobRes = await fetch(`${apiUri}/image?id=${resJson['id']}`);
            if (blobRes.status > 299) {
                await interaction.editReply(`Result is not OK: HTTP ${blobRes.status}`);
                return;
            }
            const blob = await blobRes.blob();
            const arrayBuf = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);

            const fields = [];
            for (const element of resJson['abilities']) {
                fields.push({ name: 'Ability', value: element.name })
            }

            const file = new AttachmentBuilder(buffer);
            let embed = new EmbedBuilder()
                .setTitle(resJson['name'])
                .setDescription(resJson['description'])
                .addFields(
                    { name: 'Author', value: `${resJson['author_name']}` },
                    { name: 'Full Description', value: `${resJson['full_desc']}` }
                )
                .setThumbnail(`attachment://file.jpg`)
                .setTimestamp()
                .setFooter({ text: `ID: ${resJson['id']}` })

            embed = embed.addFields(fields)

            await interaction.editReply({ content: 'Niko found!', embeds: [embed], files: [file] });
        } catch (error) {
            console.log(`Error: ${error}`);
            await interaction.editReply(`There was an error in TWM!`);
        }
    }
}
