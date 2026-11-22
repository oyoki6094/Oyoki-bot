import { downloadMediaMessage } from 'baileys'

// --- Gestion des statuts ---
// autolike     : réagit automatiquement à chaque statut reçu (⚠️ te rend visible dans "vu par",
//                c'est une limitation de WhatsApp lui-même : réagir = avoir "vu").
// ghoststatus  : transfère une copie du statut dans ton propre chat, pour que tu puisses
//                le consulter SANS jamais ouvrir le statut original -> 100% invisible.

export async function handleStatus(client, message, userConfig) {
    const number = client.user.id.split(':')[0]
    const ownerJid = number + '@s.whatsapp.net'
    const from = message.pushName || message.key.participant || 'Contact inconnu'

    if (userConfig?.ghoststatus) {
        try {
            const caption = `👻 *Statut (mode fantôme)*\n👤 De : ${from}`
            const msg = message.message

            if (msg?.imageMessage) {
                const buffer = await downloadMediaMessage(message, 'buffer', {})
                await client.sendMessage(ownerJid, {
                    image: buffer,
                    caption: `${caption}${msg.imageMessage.caption ? `\n${msg.imageMessage.caption}` : ''}`,
                })
            } else if (msg?.videoMessage) {
                const buffer = await downloadMediaMessage(message, 'buffer', {})
                await client.sendMessage(ownerJid, {
                    video: buffer,
                    caption: `${caption}${msg.videoMessage.caption ? `\n${msg.videoMessage.caption}` : ''}`,
                })
            } else {
                const text = msg?.extendedTextMessage?.text || msg?.conversation || ''
                if (text) {
                    await client.sendMessage(ownerJid, { text: `${caption}\n\n📝 ${text}` })
                }
            }
        } catch (e) {
            console.error('⚠️ ghoststatus: échec du transfert ->', e.message)
        }
    }

    if (userConfig?.autolike) {
        try {
            const emoji = userConfig.statusEmoji || '❤️'
            await client.sendMessage(
                message.key.remoteJid,
                { react: { text: emoji, key: message.key } },
                { statusJidList: [message.key.participant] }
            )
        } catch (e) {
            console.error('⚠️ auto-like statut: échec ->', e.message)
        }
    }
}

export default { handleStatus }