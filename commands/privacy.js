import configmanager from '../utils/configmanager.js'

function ensureUser(number) {
    if (!configmanager.config.users[number]) {
        configmanager.config.users[number] = {}
    }
}

async function reply(client, remoteJid, text) {
    await client.sendMessage(remoteJid, { text })
}

export async function setAutolike(client, message, args) {
    const number = client.user.id.split(':')[0]
    const remoteJid = message.key.remoteJid
    ensureUser(number)
    const choice = (args[0] || '').toLowerCase()

    if (choice === 'on') {
        configmanager.config.users[number].autolike = true
        configmanager.save()
        await reply(client, remoteJid, '✅ Auto-like des statuts *activé*. Chaque statut reçu sera automatiquement liké.\n⚠️ Note : réagir à un statut te rend visible dans sa liste "vu par" — c\'est une limite de WhatsApp, pas du bot.')
    } else if (choice === 'off') {
        configmanager.config.users[number].autolike = false
        configmanager.save()
        await reply(client, remoteJid, '🚫 Auto-like des statuts *désactivé*.')
    } else {
        await reply(client, remoteJid, 'Utilise : *.autolike on* ou *.autolike off*')
    }
}

export async function setGhostStatus(client, message, args) {
    const number = client.user.id.split(':')[0]
    const remoteJid = message.key.remoteJid
    ensureUser(number)
    const choice = (args[0] || '').toLowerCase()

    if (choice === 'on') {
        configmanager.config.users[number].ghoststatus = true
        configmanager.save()
        await reply(client, remoteJid, '👻 Mode fantôme *activé*. Chaque statut reçu te sera transféré en privé, sans jamais être ouvert — invisible à 100%.')
    } else if (choice === 'off') {
        configmanager.config.users[number].ghoststatus = false
        configmanager.save()
        await reply(client, remoteJid, '🚫 Mode fantôme *désactivé*.')
    } else {
        await reply(client, remoteJid, 'Utilise : *.ghoststatus on* ou *.ghoststatus off*')
    }
}

export async function setReadReceipt(client, message, args) {
    const number = client.user.id.split(':')[0]
    const remoteJid = message.key.remoteJid
    ensureUser(number)
    const choice = (args[0] || '').toLowerCase()

    if (choice === 'on') {
        configmanager.config.users[number].readreceipt = true
        configmanager.save()
        await reply(client, remoteJid, '✅ Accusés de lecture (coches bleues) *activés*. Les messages que tu reçois seront marqués comme lus.')
    } else if (choice === 'off') {
        configmanager.config.users[number].readreceipt = false
        configmanager.save()
        await reply(client, remoteJid, '🚫 Accusés de lecture (coches bleues) *désactivés*. Tu pourras lire sans que les coches passent au bleu.\nℹ️ Les coches grises (envoyé/livré) restent gérées par WhatsApp lui-même, le bot ne peut pas les retirer.')
    } else {
        await reply(client, remoteJid, 'Utilise : *.readreceipt on* ou *.readreceipt off*')
    }
}

export default { setAutolike, setGhostStatus, setReadReceipt }