import configmanager from '../utils/configmanager.js'

function ensureUser(number) {
    if (!configmanager.config.users[number]) {
        configmanager.config.users[number] = {}
    }
}

async function reply(client, remoteJid, text) {
    await client.sendMessage(remoteJid, { text })
}

export async function setAi(client, message, args) {
    const number = client.user.id.split(':')[0]
    const remoteJid = message.key.remoteJid
    ensureUser(number)
    const choice = (args[0] || '').toLowerCase()

    if (choice === 'on') {
        configmanager.config.users[number].aiEnabled = true
        configmanager.save()
        await reply(client, remoteJid, "🤖 Réponse automatique par IA *activée*. Je répondrai à ta place quand tu n'es pas actif, et je te signalerai ce qui a besoin de toi.")
    } else if (choice === 'off') {
        configmanager.config.users[number].aiEnabled = false
        configmanager.save()
        await reply(client, remoteJid, '🚫 Réponse automatique par IA *désactivée*.')
    } else {
        await reply(client, remoteJid, 'Utilise : *.ia on* ou *.ia off*')
    }
}

export async function setStyle(client, message, args) {
    const number = client.user.id.split(':')[0]
    const remoteJid = message.key.remoteJid
    ensureUser(number)
    const style = args.join(' ').trim()

    if (!style) {
        await reply(client, remoteJid, "Décris ton style d'écriture, exemple :\n*.setstyle Je parle en français familier, avec des emojis, phrases courtes, parfois du camfranglais*")
        return
    }

    configmanager.config.users[number].aiStyle = style
    configmanager.save()
    await reply(client, remoteJid, "✍️ Style d'écriture enregistré pour l'IA.")
}

export async function setOwnerName(client, message, args) {
    const number = client.user.id.split(':')[0]
    const remoteJid = message.key.remoteJid
    ensureUser(number)
    const name = args.join(' ').trim()

    if (!name) {
        await reply(client, remoteJid, 'Utilise : *.setname Oyoki*')
        return
    }

    configmanager.config.users[number].aiOwnerName = name
    configmanager.save()
    await reply(client, remoteJid, `✅ L'IA te présentera comme *${name}*.`)
}

export default { setAi, setStyle, setOwnerName }