const { EmbedBuilder } = require('discord.js')

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */

async function audit(req, res, client) {
    try {
        let embed = new EmbedBuilder()
        .setTitle(`${req.fields['title']}`)
        .setDescription(`${req.fields['msg']}`)

        if (req.fields['fields[n]']) {
            const n = Number.parseInt(req.fields['fields[n]']);
            console.log(n);
            for (let i = 0; i < n; i++) {
                const arr = req.fields[`fields[${i}]`].split(';')
                if (arr.length != 2) {
                    console.log('Arr len is not 2, maybe a ; is missing?')
                }
                else {
                    embed = embed.addFields({
                        name: arr[0], value: arr[1]
                    })
                }
            }
        }

        client.channels.cache.get(process.env['SUBMISSIONS_CHANNEL'])
        .send({ embeds: [embed]})

        res.send('Successful audit!')
    }
    catch (e) {
        res.status(404).send(JSON.stringify({ detail: `Problem while auditing! ${e}` }))
    }
}

module.exports = {
    audit
}
