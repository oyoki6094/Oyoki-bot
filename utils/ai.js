import axios from 'axios'
import fs from 'fs'

// --- Cerveau de l'IA ---
// Utilise Groq (https://console.groq.com), gratuit à vie, sans carte bancaire.
// La clé API se configure dans ai.config.json à la racine du projet.

const AI_CONFIG_PATH = 'ai.config.json'

function loadAiConfig() {
    try {
        return JSON.parse(fs.readFileSync(AI_CONFIG_PATH, 'utf-8'))
    } catch (e) {
        return { groqApiKey: '', model: 'openai/gpt-oss-120b' }
    }
}

// Historique court par discussion, pour que l'IA garde le contexte de la conversation
const history = new Map()
const HISTORY_LIMIT = 10

function pushHistory(remoteJid, role, text) {
    if (!history.has(remoteJid)) history.set(remoteJid, [])
    const arr = history.get(remoteJid)
    arr.push({ role, content: text })
    while (arr.length > HISTORY_LIMIT) arr.shift()
}

export async function generateReply(remoteJid, incomingText, userConfig) {
    const aiConfig = loadAiConfig()
    if (!aiConfig.groqApiKey) {
        throw new Error('Clé API Groq manquante dans ai.config.json')
    }

    const style = userConfig?.aiStyle ||
        "Écris des messages courts, naturels, en français, avec quelques emojis, comme dans une vraie conversation WhatsApp."
    const ownerName = userConfig?.aiOwnerName || 'le propriétaire du numéro'

    const systemPrompt =
`Tu es l'assistant personnel WhatsApp de ${ownerName}. Il n'est pas disponible et tu réponds à sa place à ses correspondants.
Style à imiter : ${style}

Réponds UNIQUEMENT avec un objet JSON strict, sans texte autour, au format exact :
{"reply": "texte de la réponse à envoyer (laisse vide si tu ne dois rien envoyer)", "needsOwner": true ou false, "reason": "courte explication si needsOwner est true, sinon chaîne vide"}

Mets needsOwner à true si le message parle d'argent, d'un rendez-vous ou d'une date précise à confirmer, d'une urgence, d'un sujet personnel ou sensible, ou si tu n'es pas sûr de quoi répondre.
Dans ce cas, "reply" peut rester une phrase courte et neutre du type "Je te reviens très vite dès que possible 🙏", ou vide.`

    const previous = history.get(remoteJid) || []
    const messages = [
        { role: 'system', content: systemPrompt },
        ...previous,
        { role: 'user', content: incomingText },
    ]

    const { data } = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: aiConfig.model || 'openai/gpt-oss-120b',
            messages,
            temperature: 0.8,
            response_format: { type: 'json_object' },
        },
        {
            headers: {
                Authorization: `Bearer ${aiConfig.groqApiKey}`,
                'Content-Type': 'application/json',
            },
        }
    )

    const raw = data?.choices?.[0]?.message?.content || '{}'
    let parsed
    try {
        parsed = JSON.parse(raw)
    } catch (e) {
        parsed = { reply: '', needsOwner: true, reason: 'Réponse IA illisible, à vérifier manuellement.' }
    }

    pushHistory(remoteJid, 'user', incomingText)
    if (parsed.reply) pushHistory(remoteJid, 'assistant', parsed.reply)

    return parsed
}

export default { generateReply }