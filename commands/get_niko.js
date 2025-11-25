const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const apiUri = process.env.API_URI
const Buffer = require('buffer').Buffer

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getniko')
        .setDescription('Replies with details of that Nikosona!')
        .addStringOption(o => o
            .setName("nikosona")
            .setDescription("The name of the Nikosona you want to get.")
            .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.reply("Looking for the Niko..");
        try {
            const niko = interaction.options.getString("nikosona");
            const reslist = await fetch(`${apiUri}/nikos/name?name=${niko}`);
            const res = await reslist.json();
            const resJson = res[0]
            if (res.status > 299) {
                await interaction.editReply(`Result is not OK: HTTP ${res.status}`);
                return;
            }

            const blobRes = await fetch(`${apiUri}/image?id=${resJson['id']}`);
            if (blobRes.status > 299) {
                await interaction.editReply(`Result is not OK: HTTP ${res.status}`);
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
