import ai from './ai.js'
import presence from './presence.js'
import configmanager from './configmanager.js'

export async function handleIncoming(client, message, rawText, number) {
    const userConfig = configmanager.config.users[number]
    if (!userConfig?.aiEnabled) return
    if (presence.isOwnerActive()) return // le propriétaire est déjà actif, on ne se mêle pas de la conversation

    const remoteJid = message.key.remoteJid

    try {
        const result = await ai.generateReply(remoteJid, rawText, userConfig)

        if (result.needsOwner) {
            const ownerJid = number + '@s.whatsapp.net'
            await client.sendMessage(ownerJid, {
                text: `🔔 *Besoin de toi*\n👤 ${message.pushName || remoteJid}\n💬 "${rawText}"\n\n🤖 Raison : ${result.reason || 'nécessite ta décision'}`,
            })
        }

        if (result.reply) {
            await client.sendMessage(remoteJid, { text: result.reply })
        }
    } catch (e) {
        console.error('⚠️ IA: échec de la réponse automatique ->', e.message)
    }
}

export default { handleIncoming }