import { downloadMediaMessage } from 'baileys'

// --- Anti-suppression ---
// On garde une copie de chaque message reçu en mémoire (texte + média)
// pendant un temps limité, pour pouvoir le renvoyer si quelqu'un le supprime.

const CACHE_LIMIT = 300 // nombre maximum de messages gardés en mémoire
const CACHE_TTL_MS = 3 * 60 * 60 * 1000 // 3 heures

const cache = new Map()

function cleanup() {
    const now = Date.now()
    for (const [id, entry] of cache) {
        if (now - entry.time > CACHE_TTL_MS) cache.delete(id)
    }
    while (cache.size > CACHE_LIMIT) {
        const oldestKey = cache.keys().next().value
        cache.delete(oldestKey)
    }
}

setInterval(cleanup, 10 * 60 * 1000)

function getMediaType(message) {
    if (!message) return null
    if (message.imageMessage) return 'imageMessage'
    if (message.videoMessage) return 'videoMessage'
    if (message.audioMessage) return 'audioMessage'
    if (message.stickerMessage) return 'stickerMessage'
    if (message.documentMessage) return 'documentMessage'
    return null
}

// Appelée pour CHAQUE message reçu (sauf statuts et messages de suppression)
export async function cacheMessage(client, msg) {
    try {
        if (!msg.message || !msg.key?.id) return
        if (msg.key.remoteJid === 'status@broadcast') return
        if (msg.message.protocolMessage) return // c'est une notification de suppression, pas un message normal

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            ''

        const mediaType = getMediaType(msg.message)
        let buffer = null

        if (mediaType) {
            try {
                buffer = await downloadMediaMessage(msg, 'buffer', {})
            } catch (e) {
                console.error('⚠️ antidelete: échec du téléchargement média ->', e.message)
            }
        }

        cache.set(msg.key.id, {
            remoteJid: msg.key.remoteJid,
            participant: msg.key.participant || msg.key.remoteJid,
            fromMe: msg.key.fromMe,
            pushName: msg.pushName || '',
            text,
            mediaType,
            buffer,
            time: Date.now(),
        })

        cleanup()
    } catch (e) {
        console.error('⚠️ antidelete: erreur de mise en cache ->', e.message)
    }
}

async function resend(client, ownerJid, entry, deletedBy) {
    const who = entry.fromMe ? 'toi-même' : (entry.participant || entry.remoteJid)
    const when = new Date(entry.time).toLocaleString('fr-FR')

    const header =
        `🛡️ *ANTI-SUPPRESSION*\n\n` +
        `👤 Expéditeur original : ${who}\n` +
        `💬 Discussion : ${entry.remoteJid}\n` +
        `🕒 Envoyé le : ${when}\n` +
        `🗑️ Supprimé par : ${deletedBy || who}`

    try {
        if (entry.mediaType && entry.buffer) {
            const mediaField = entry.mediaType.replace('Message', '') // imageMessage -> image, etc.
            await client.sendMessage(ownerJid, {
                [mediaField]: entry.buffer,
                caption: `${header}${entry.text ? `\n\n📝 Légende : ${entry.text}` : ''}`,
            })
        } else {
            await client.sendMessage(ownerJid, {
                text: `${header}${entry.text ? `\n\n📝 Message :\n${entry.text}` : '\n\n_(message sans contenu récupérable)_'}`,
            })
        }
    } catch (e) {
        console.error('⚠️ antidelete: échec du renvoi ->', e.message)
    }
}

// Appelée quand une suppression (protocolMessage de type REVOKE) est détectée
export async function handleRevoke(client, ownerJid, deletedKey, deletedBy) {
    const entry = cache.get(deletedKey.id)
    if (!entry) return // on n'avait pas ce message en cache (trop vieux, ou bot redémarré entre-temps)
    await resend(client, ownerJid, entry, deletedBy)
}

export default { cacheMessage, handleRevoke }