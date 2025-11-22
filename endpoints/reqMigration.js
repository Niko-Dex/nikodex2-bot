const { getDiscordUser } = require('../helper');
const { EmbedBuilder, Client} = require('discord.js')

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Client} client
 */

async function reqMigration(req, res, client) {
    const token = req.headers.authorization ?? ""
    const user = await getDiscordUser(token)
    if (!user) {
        res.status(401).send(JSON.stringify({ detail: `Unauthenticated!` }))
        return
    }

    const nikodex_user_id = req.fields['user_id'];
    const username = req.fields['username'];
    const discord_id = req.fields['discord_id'];
    const discord_username = req.fields['discord_username'];
    const nikos = req.fields['nikos'];

    if (nikos.length <= 0) {
        res.status(400).send(JSON.stringify({ detail: `Problem while submitting! There are no nikos submitted!` }));
        return
    }

    const nikos_list = req.fields['nikos'].split('|');

    try {
        let embed = new EmbedBuilder()
        .setTitle(`Migration request from ${username}!`)
        .setDescription("A user has requested to migrate their nikos to their user account")
        .addFields({
            name: 'User', value: `${username} (ID: ${nikodex_user_id})`
        })
        .addFields({
            name: 'Discord User', value: `${discord_username} (${discord_id})`
        })
        .addFields({
            name: 'Nikos (IDs, seperated by ;)', value: `${nikos_list.join("; ")}` })

        await client.channels.cache.get(process.env['SUBMISSIONS_CHANNEL'])
        .send({ embeds: [embed] })
    }
    catch (e) {
        console.log(e)
        res.status(400).send(JSON.stringify({ detail: `Problem while submitting! ${e}` }));
        return
    }

    res.send({
        msg: `Nikos requested: ${nikos_list.join("; ")}`
    })
}

module.exports = {
    reqMigration
}
