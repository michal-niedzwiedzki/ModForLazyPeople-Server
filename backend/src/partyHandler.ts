import {
    generateKey,
    getClientByUsername,
    getClientByWebsocket,
    getClientPermissionLevel,
    Payload,
} from "./utils"
import WebSocket from "ws"
import {MflpClient} from "./Client"
import {WebsocketWriter} from "./WebsocketWriter"

let parties: Array<Party> = []
const partyMap: Map<MflpClient, Party> = new Map<MflpClient, Party>()
const pendingInvites: Map<MflpClient, Party> = new Map<MflpClient, Party>()

interface PartyBody {
    cmd: string;
    user?: string; // The user you want to invite/kick etc.
    message?: string;
}

export interface Party {
    partyId: string; // 16 chars long hexadecimal string
    owner: MflpClient;
    moderators: Array<MflpClient>;
    players: Array<MflpClient>;
}

function decline(executor: MflpClient, writer: WebsocketWriter) {
    if (pendingInvites.has(executor)) {
        const party: Party | undefined = pendingInvites.get(executor)

        if (partyMap.has(executor)) {
            writer.sendError("9", executor.ws)
            return
        }
        if (!party) {
            writer.sendError("8", executor.ws)
            return
        }

        const data: string = JSON.stringify({
            header: "SUCCESS",
            code: "0",
            type: "PARTY",
            body: {
                cmd: "PLAYER_DECLINE",
                party: {
                    owner: party.owner.username,
                    moderators: party.moderators.map((moderator: MflpClient) => moderator.username),
                    players: party.players.map((player: MflpClient) => player.username),
                },
                declining_player: executor.username,
            },
        })

        writer.broadcastToParty(party, data)

        pendingInvites.delete(executor)
    } else {
        writer.sendError("7", executor.ws)
    }
}

function kick(user: MflpClient, executor: MflpClient, sender: WebsocketWriter) {
    function checkKickPermissions(party: Party): boolean {
        if (user == party.owner) return false
        if (party.moderators.includes(user) && executor == party.owner) return true
        return party.players.includes(user) && (party.moderators.includes(executor) || party.owner == executor)
    }

    if (partyMap.has(executor) && partyMap.has(user)) {
        const userParty: Party = partyMap.get(user) as Party
        const executorParty: Party = partyMap.get(executor) as Party

        if (userParty == executorParty) {
            if (checkKickPermissions(userParty)) {
                partyMap.delete(user)

                const data: string = JSON.stringify({
                    header: "SUCCESS",
                    code: "0",
                    type: "PARTY",
                    body: {
                        cmd: "PLAYER_KICK",
                        party: {
                            owner: executorParty.owner.username,
                            moderators: executorParty.moderators.map(moderator => moderator.username),
                            players: executorParty.players.map(player => player.username),
                        },
                        kicked_player: user.username,
                    },
                })

                sender.broadcastToParty(executorParty, data)
                sender.sendToSocket(user.ws, JSON.stringify({
                    header: "SUCCESS",
                    code: "0",
                    type: "PARTY",
                    body: {
                        cmd: "CLIENT_KICK",
                    },
                }))
            } else {
                sender.sendError("4", executor.ws)
            }
        } else {
            sender.sendError("8", executor.ws)
            return
        }
    } else {
        sender.sendError("6", executor.ws)
        return
    }
}

function promote(user: MflpClient, executor: MflpClient, sender: WebsocketWriter) {
    if (!(partyMap.has(user) && partyMap.has(executor))) {
        sender.sendError("6", executor.ws)
        return
    }

    const userParty: Party = partyMap.get(user) as Party
    const party: Party = partyMap.get(executor) as Party

    if (userParty !== party) {
        sender.sendError("8", executor.ws)
        return
    }

    if (getClientPermissionLevel(executor, party) == 2) {
        sender.sendError("4", executor.ws)
        return
    }

    if (party.moderators.includes(user)) {
        party.owner = user
        party.moderators = party.moderators.filter(mod => mod !== user)
        party.moderators.push(executor)
    } else if (party.players.includes(user)) {
        party.moderators.push(user)
        party.players = party.players.filter(player => player !== user)
    }

    const data: string = JSON.stringify({
        header: "SUCCESS",
        code: "0",
        type: "PARTY",
        body: {
            cmd: "PLAYER_PROMOTE",
            party: {
                owner: party.owner,
                moderators: party.moderators.map(mod => mod.username),
                players: party.players.map(player => player.username),
            },
            promoted_player: user,
        },
    })

    sender.broadcastToParty(party, data)
}

function demote(user: MflpClient, executor: MflpClient, sender: WebsocketWriter) {
    if (!(partyMap.has(user) && partyMap.has(executor))) {
        sender.sendError("6", executor.ws)
        return
    }

    const userParty: Party = partyMap.get(user) as Party
    const party: Party = partyMap.get(executor) as Party

    if (userParty !== party) {
        sender.sendError("8", executor.ws)
        return
    }

    if (getClientPermissionLevel(executor, party) == 2) {
        sender.sendError("4", executor.ws)
        return
    }

    if (party.moderators.includes(user)) {
        party.players.push(user)
        party.moderators = party.moderators.filter(mod => mod !== user)
    }

    const data: string = JSON.stringify({
        header: "SUCCESS",
        code: "0",
        type: "PARTY",
        body: {
            cmd: "PLAYER_DEMOTE",
            party: {
                owner: party.owner,
                moderators: party.moderators.map(mod => mod.username),
                players: party.players.map(player => player.username),
            },
            demoted_player: user,
        },
    })

    sender.broadcastToParty(party, data)
}

function chat(executor: MflpClient, message: string, sender: WebsocketWriter) {
    if (!partyMap.has(executor)) {
        sender.sendError("6", executor.ws)
        return
    }

    const data: string = JSON.stringify({
        header: "SUCCESS",
        code: "0",
        type: "PARTY",
        body: {
            cmd: "PARTY_CHAT",
            chatting_player: executor.username,
            message: message,
        },
    })

    sender.broadcastToParty(partyMap.get(executor) as Party, data)
}

export function handleParty(payload: Payload, ws: WebSocket, connectedClients: Array<MflpClient>,
                            writer: WebsocketWriter) {
    const body: PartyBody = payload.body as PartyBody

    const cmd: string = body.cmd
    const user: MflpClient | undefined = getClientByUsername(connectedClients, body.user)
    const executor: MflpClient = getClientByWebsocket(connectedClients, ws) as MflpClient
    const message: string | undefined = body.message

    switch (cmd) {
        case "ACCEPT":
            accept(executor, writer)
            break
        case "DECLINE":
            decline(executor, writer)
            break
        case "KICK":
            if (!user) {
                writer.sendError("2", ws)
                return
            }

            kick(user, executor, writer)
            break
        case "PROMOTE":
            if (!user) {
                writer.sendError("2", ws)
                return
            }

            promote(user, executor, writer)
            break
        case "DEMOTE":
            if (!user) {
                writer.sendError("2", ws)
                return
            }
            if (user == executor) {
                writer.sendError("10", ws) // send self invite error
                return
            }

            demote(user, executor, writer)
            break
        case "CHAT":
            if (!message) {
                writer.sendError("11", ws)
                return
            }

            chat(executor, message, writer)
            break
        default:
            writer.sendError("1", ws)
            return
    }
}