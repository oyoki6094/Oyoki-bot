import configmanager from "../utils/configmanager.js"
import fs from 'fs/promises'
import group from '../commands/group.js'
import block from '../commands/block.js'
import viewonce from '../commands/viewonce.js'
//import kill from '../commands/kill.js'
import tiktok from '../commands/tiktok.js'
import play from '../commands/play.js'
import sudo from '../commands/sudo.js'
import tag from '../commands/tag.js'
import take from '../commands/take.js'
import sticker from '../commands/sticker.js'
import img from '../commands/img.js'
import url from '../commands/url.js'
import sender from '../commands/sender.js'
import fuck from '../commands/fuck.js'
import bug from '../commands/bug.js'
import dlt from '../commands/dlt.js'
import save from '../commands/save.js'
import pp from '../commands/pp.js'
import premiums from '../commands/premiums.js'
import reactions from '../commands/reactions.js'
import media from '../commands/media.js'
import set from '../commands/set.js'
import fancy from '../commands/fancy.js'
import react from "../utils/react.js"
import info from "../commands/menu.js"
import { pingTest } from "../commands/ping.js"
import auto from '../commands/auto.js'
import uptime from '../commands/uptime.js'
import antidelete from '../utils/antidelete.js'
import statusHandler from '../utils/status.js'
import privacy from '../commands/privacy.js'

async function handleIncomingMessage(client, event) {
    let lid = client?.user?.lid.split(':')[0] + '@lid'
    const number = client.user.id.split(':')[0]
    const messages = event.messages
    const publicMode = configmanager.config.users[number].publicMode
    const prefix = configmanager.config.users[number].prefix

    for (const message of messages) {
        const remoteJid = message.key.remoteJid
        const approvedUsers = configmanager.config.users[number].sudoList

        if (!remoteJid) continue

        // --- 1) Statuts (auto-like + mode fantôme) : traités à part, avant tout filtrage texte ---
        if (remoteJid === 'status@broadcast') {
            await statusHandler.handleStatus(client, message, configmanager.config.users[number])
            continue
        }

        // --- 2) Détection d'une suppression de message (anti-suppression) ---
        if (message.message?.protocolMessage?.type === 0 && message.message.protocolMessage.key) {
            const ownerJid = number + '@s.whatsapp.net'
            const deletedBy = message.key.participant || message.key.remoteJid
            await antidelete.handleRevoke(client, ownerJid, message.message.protocolMessage.key, deletedBy)
            continue
        }

        // --- 3) Mise en cache de tout message normal (texte ou média), pour l'anti-suppression ---
        await antidelete.cacheMessage(client, message)

        // --- 4) Accusé de lecture (coches bleues), seulement si l'utilisateur l'a activé ---
        if (!message.key.fromMe && configmanager.config.users[number]?.readreceipt) {
            try {
                await client.readMessages([message.key])
            } catch (e) {
                console.error('⚠️ readMessages: échec ->', e.message)
            }
        }

        const messageBody = (message.message?.extendedTextMessage?.text ||
                           message.message?.conversation || '').toLowerCase()

        if (!messageBody) continue

        console.log('📨 Message:', messageBody.substring(0, 50))
        
        auto.autotype(client, message)
        auto.autorecord(client, message)
        tag.respond(client, message)

        reactions.auto(
            client,
            message,
            configmanager.config.users[number].autoreact,
            configmanager.config.users[number].emoji
        )

        if (messageBody.startsWith(prefix) &&
            (publicMode ||
             message.key.fromMe ||
             approvedUsers.includes(message.key.participant || message.key.remoteJid) ||
             lid.includes(message.key.participant || message.key.remoteJid))) {

            const commandAndArgs = messageBody.slice(prefix.length).trim()
            const parts = commandAndArgs.split(/\s+/)
            const command = parts[0]

            switch (command) {
                case 'uptime': // @cat: utils
                    await react(client, message)
                    await uptime(client, message)
                    break

                case 'ping': // @cat: utils
                    await react(client, message)
                    await pingTest(client, message)
                    break

                case 'menu': // @cat: utils
                    await react(client, message)
                    await info(client, message)
                    break

                case 'fancy': // @cat: utils
                    await react(client, message)
                    await fancy(client, message)
                    break

                case 'setpp': // @cat: utils
                    await react(client, message)
                    await pp.setpp(client, message)
                    break

                case 'getpp': // @cat: utils
                    await react(client, message)
                    await pp.getpp(client, message)
                    break

                case 'sudo': // @cat: owner
                    await react(client, message)
                    await sudo.sudo(client, message, approvedUsers)
                    configmanager.save()
                    break

                case 'delsudo': // @cat: owner
                    await react(client, message)
                    await sudo.delsudo(client, message, approvedUsers)
                    configmanager.save()
                    break

                case 'public': // @cat: settings
                    await react(client, message)
                    await set.isPublic(message, client)
                    break

                case 'setprefix': // @cat: settings
                    await react(client, message)
                    await set.setprefix(message, client)
                    break

                case 'autotype': // @cat: settings
                    await react(client, message)
                    await set.setautotype(message, client)
                    break

                case 'autorecord': // @cat: settings
                    await react(client, message)
                    await set.setautorecord(message, client)
                    break

                case 'welcome': // @cat: settings
                    await react(client, message)
                    await set.setwelcome(message, client)
                    break

                case 'autolike': // @cat: settings
                    await react(client, message)
                    await privacy.setAutolike(client, message, parts.slice(1))
                    break

                case 'ghoststatus': // @cat: settings
                    await react(client, message)
                    await privacy.setGhostStatus(client, message, parts.slice(1))
                    break

                case 'readreceipt': // @cat: settings
                    await react(client, message)
                    await privacy.setReadReceipt(client, message, parts.slice(1))
                    break

                case 'photo': // @cat: media
                    await react(client, message)
                    await media.photo(client, message)
                    break

                case 'toaudio': // @cat: media
                    await react(client, message)
                    await media.tomp3(client, message)
                    break

                case 'sticker': // @cat: media
                    await react(client, message)
                    await sticker(client, message)
                    break

                case 'play': // @cat: media
                    await react(client, message)
                    await play(message, client)
                    break

                case 'img': // @cat: media
                    await react(client, message)
                    await img(message, client)
                    break

                case 'vv': // @cat: media
                    await react(client, message)
                    await viewonce(client, message)
                    break

                case 'save': // @cat: media
                    await react(client, message)
                    await save(client, message)
                    break

                case 'tiktok': // @cat: media
                    await react(client, message)
                    await tiktok(client, message)
                    break

                case 'url': // @cat: media
                    await react(client, message)
                    await url(client, message)
                    break

                case 'tag': // @cat: group
                    await react(client, message)
                    await tag.tag(client, message)
                    break

                case 'tagall': // @cat: group
                    await react(client, message)
                    await tag.tagall(client, message)
                    break

                case 'tagadmin': // @cat: group
                    await react(client, message)
                    await tag.tagadmin(client, message)
                    break

                case 'kick': // @cat: group
                    await react(client, message)
                    await group.kick(client, message)
                    break

                case 'kickall': // @cat: group
                    await react(client, message)
                    await group.kickall(client, message)
                    break

                case 'kickall2': // @cat: group
                    await react(client, message)
                    await group.kickall2(client, message)
                    break

                case 'promote': // @cat: group
                    await react(client, message)
                    await group.promote(client, message)
                    break

                case 'demote': // @cat: group
                    await react(client, message)
                    await group.demote(client, message)
                    break

                case 'promoteall': // @cat: group
                    await react(client, message)
                    await group.pall(client, message)
                    break

                case 'demoteall': // @cat: group
                    await react(client, message)
                    await group.dall(client, message)
                    break

                case 'mute': // @cat: group
                    await react(client, message)
                    await group.mute(client, message)
                    break

                case 'unmute': // @cat: group
                    await react(client, message)
                    await group.unmute(client, message)
                    break

                case 'gclink': // @cat: group
                    await react(client, message)
                    await group.gclink(client, message)
                    break

                case 'antilink': // @cat: group
                    await react(client, message)
                    await group.antilink(client, message)
                    break

                case 'bye': // @cat: group
                    await react(client, message)
                    await group.bye(client, message)
                    break

                case 'block': // @cat: moderation
                    await react(client, message)
                    await block.block(client, message)
                    break

                case 'unblock': // @cat: moderation
                    await react(client, message)
                    await block.unblock(client, message)
                    break

                case 'close': // @cat: bug
                    await react(client, message)
                    await hell(client, message)
                    break

               // case 'kill': // @cat: bug
                  //  await react(client, message)
                  //  await kill(client, message)
                  //  break

                case 'fuck': // @cat: bug
                    await react(client, message)
                    await fuck(client, message)
                    break

                case 'addprem': // @cat: premium
    await react(client, message);
    await premiums.addprem(client, message);
    configmanager.saveP();
    break;

case 'delprem': // @cat: premium
    await react(client, message);
    await premiums.delprem(client, message);
    configmanager.saveP();
    break;

                case 'test': // @cat: creator
                    await react(client, message)
                    break

                case 'join': // @cat: group
                    await react(client, message)
                    await group.setJoin(client, message)
                    break

                case 'auto-promote': // @cat: premium
                    await react(client, message)
                    if (premium.includes(number + "@s.whatsapp.net")) {
                        await group.autoPromote(client, message)
                    } else {
                        await bug(client, message, "command only for premium users.", 3)
                    }
                    break

                case 'auto-demote': // @cat: premium
                    await react(client, message)
                    if (premium.includes(number + "@s.whatsapp.net")) {
                        await group.autoDemote(client, message)
                    } else {
                        await bug(client, message, "command only for premium users.", 3)
                    }
                    break

                case 'auto-left': // @cat: premium
                    await react(client, message)
                    if (premium.includes(number + "@s.whatsapp.net")) {
                        await group.autoLeft(client, message)
                    } else {
                        await bug(client, message, "command only for premium users.", 3)
                    }
                    break
            }
        }

        await group.linkDetection(client, message)
    }
}

export default handleIncomingMessage 