const {
  EmbedBuilder,
  AttachmentBuilder,
  Client,
  Colors,
  ButtonBuilder,
} = require("discord.js");
const { text } = require("express");

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Client} client
 */

async function audit(req, res, client) {
  try {
    let embed = new EmbedBuilder()
      .setTitle(`${req.fields["title"]}`)
      .setDescription(`${req.fields["msg"]}`);

    if (req.fields["fields[n]"]) {
      const n = Number.parseInt(req.fields["fields[n]"]);
      console.log(n);
      for (let i = 0; i < n; i++) {
        const arr = req.fields[`fields[${i}]`].split(";");
        if (arr.length != 2) {
          console.log("Arr len is not 2, maybe a ; is missing?");
        } else {
          embed = embed.addFields({
            name: arr[0],
            value: arr[1],
          });
        }
      }
    }
    const channel = client.channels.cache.get(
      process.env["SUBMISSIONS_CHANNEL"],
    );
    const nikoId = req.fields["noikId"];
    if (nikoId) {
      try {
        await fetch(`${process.env["API_URI"]}/image?id=${nikoId}`)
          .then((response) => {
            if (!response.ok) throw "The response is not OK";
            return response.blob();
          })
          .then(async (blob) => {
            const arrayBuf = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);
            const attachment = new AttachmentBuilder(buffer);
            embed.setThumbnail(`attachment://file.jpg`);
            embed.setFooter({ text: `Niko ID: ${nikoId}` });
            channel.send({ embeds: [embed], files: [attachment] });
            res.send("Successful Niko Audit!");
          });
      } catch {
        channel.send({ embeds: [embed] });
        res.send("Audit OK, No Image.");
      }
    } else {
      channel.send({ embeds: [embed] });
      res.send("Successful audit!");
    }
  } catch (e) {
    res
      .status(404)
      .send(JSON.stringify({ detail: `Problem while auditing! ${e}` }));
  }
}

module.exports = {
  audit,
};
