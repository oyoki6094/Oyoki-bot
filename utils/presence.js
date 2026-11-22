// --- Détection de présence ---
// Si TOI (le vrai propriétaire, depuis ton téléphone) envoies un message,
// on considère que tu es actif et on met l'IA en pause pendant un moment.
// On distingue "toi" de "le bot" grâce à la liste des messages envoyés par le bot (markBotSent).

const PAUSE_WINDOW_MS = 10 * 60 * 1000 // 10 minutes de pause après une activité détectée

let lastOwnerActivity = 0
const botSentIds = new Set()
const BOT_SENT_LIMIT = 500

export function markBotSent(id) {
    if (!id) return
    botSentIds.add(id)
    if (botSentIds.size > BOT_SENT_LIMIT) {
        const first = botSentIds.values().next().value
        botSentIds.delete(first)
    }
}

export function noteIfOwnerActivity(message) {
    if (!message.key.fromMe) return
    if (botSentIds.has(message.key.id)) return // c'est un message envoyé par le bot, pas par toi

    const hasText = message.message?.conversation || message.message?.extendedTextMessage?.text
    if (!hasText) return

    lastOwnerActivity = Date.now()
}

export function isOwnerActive() {
    return Date.now() - lastOwnerActivity < PAUSE_WINDOW_MS
}

export default { markBotSent, noteIfOwnerActivity, isOwnerActive }