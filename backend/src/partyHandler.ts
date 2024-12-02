import {
    generateKey,
    getClientByUsername,
    getClientByWebsocket,
    getClientPermissionLevel,
    Payload,
} from "./utils";
import WebSocket from "ws";
import { MflpClient } from "./Client";
import { WebsocketSender } from "./WebsocketSender";

let parties: Array<Party> = [];
const partyMap: Map<MflpClient, Party> = new Map<MflpClient, Party>();
const pendingInvites: Map<MflpClient, Party> = new Map<MflpClient, Party>();

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


function invite(user: MflpClient, executor: MflpClient, sender: WebsocketSender) { // The user that is being invited
    function sendInviteSuccess(party: Party) {
        pendingInvites.set(user, party);

        sender.sendToSocket(user.ws, JSON.stringify({ header: "SUCCESS", code: "0", type: "PARTY", body: {
                cmd: "CLIENT_INVITED"
            }}))
        const data = JSON.stringify({ header: "SUCCESS", code: "0", type: "PARTY", body: {
                cmd: "INVITE_SUCCESS",
                user: user.username
            }});

        sender.broadcastToParty(party, data)
    }

    function sendInviteTimeout(party: Party) {
        if (pendingInvites.has(user)) {
            pendingInvites.delete(user);

            sender.sendError("5", party.owner.ws)
            party.moderators.forEach((moderator: MflpClient) => sender.sendError("5", moderator.ws))
            party.players.forEach((player: MflpClient) => sender.sendError("5", player.ws))
        }
    }

    if (partyMap.has(user)) {
        const party: Party | undefined = partyMap.get(user);

        if (party) {
            const permissionLevel = getClientPermissionLevel(executor, party);

            if (permissionLevel > 0) {
                sendInviteTimeout(party)
                sendInviteSuccess(party);
            } else {
                sender.sendError("4", executor.ws);
            }
        }
    } else {
        const partyId: string = generateKey(16);
        const party: Party = { partyId: partyId, owner: executor, moderators: new Array<MflpClient>(),
                players: new Array<MflpClient>() };

        sendInviteTimeout(party);
        sendInviteSuccess(party);

        parties.push(party);
        partyMap.set(executor, party);
    }
}

function leave(executor: MflpClient, sender: WebsocketSender) {
    function update(party: Party) {
        const data: string = JSON.stringify({
            header: "SUCCESS",
            code: "0",
            type: "PARTY",
            body: {
                cmd: "PLAYER_LEFT",
                party: {
                    owner: party.owner.username,
                    moderators: party.moderators.map((moderator: MflpClient) => moderator.username),
                    players: party.players.map((player: MflpClient) => player.username)
                },
                leaving_player: executor.username
            }
        });

        sender.broadcastToParty(party, data);
        partyMap.delete(executor);
    }

    const party: Party | undefined = partyMap.get(executor)

    if (!party) {
        sender.sendError("6", executor.ws)
        return;
    }

    if (party.owner === executor) {
        if (party.moderators.at(0)) {
            party.owner = party.moderators.at(0) as MflpClient;
            party.moderators = party.moderators.filter((moderator: MflpClient) => moderator !== party.owner);
            update(party);
        } else if (party.players.at(0)) {
            party.owner = party.players.at(0) as MflpClient;
            party.players = party.players.filter((player: MflpClient) => player !== party.owner);
            update(party);
        } else {
            parties = parties.filter(p => p !== party);
        }
    } else if (party.moderators.includes(executor)) {
        party.moderators = party.moderators.filter((moderator: MflpClient) => moderator !== executor);
        update(party);
    } else if (party.players.includes(executor)) {
        party.players = party.players.filter((player: MflpClient) => player !== executor);
        update(party);
    }
}

function accept(executor: MflpClient, sender: WebsocketSender) {
    if (pendingInvites.has(executor)) {
        const party: Party | undefined = pendingInvites.get(executor);

        if (partyMap.has(executor)) {
            sender.sendError("9", executor.ws);
            return;
        }
        if (!party) {
            sender.sendError("8", executor.ws);
            return;
        }

        party.players.push(executor);

        const data: string = JSON.stringify({
            header: "SUCCESS",
            code: "0",
            type: "PARTY",
            body: {
                cmd: "PLAYER_ACCEPT",
                party: {
                    owner: party.owner.username,
                    moderators: party.moderators.map((moderator: MflpClient) => moderator.username),
                    players: party.players.map((player: MflpClient) => player.username)
                },
                joining_player: executor.username
            }
        })

        sender.broadcastToParty(party, data);

        partyMap.set(executor, party);
        pendingInvites.delete(executor);
    } else {
        sender.sendError("7", executor.ws)
    }
}

function decline(executor: MflpClient, sender: WebsocketSender) {
    if (pendingInvites.has(executor)) {
        const party: Party | undefined = pendingInvites.get(executor);

        if (partyMap.has(executor)) {
            sender.sendError("9", executor.ws);
            return;
        }
        if (!party) {
            sender.sendError("8", executor.ws);
            return;
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
                    players: party.players.map((player: MflpClient) => player.username)
                },
                declining_player: executor.username
            }
        })

        sender.broadcastToParty(party, data);

        pendingInvites.delete(executor);
    } else {
        sender.sendError("7", executor.ws);
    }
}

function kick(user: MflpClient, executor: MflpClient, sender: WebsocketSender) {
    function checkKickPermissions(party: Party): boolean {
        if (user == party.owner) return false;
        if (party.moderators.includes(user) && executor == party.owner) return true;
        return party.players.includes(user) && (party.moderators.includes(executor) || party.owner == executor);
    }

    if (partyMap.has(executor) && partyMap.has(user)) {
        const userParty: Party = partyMap.get(user) as Party;
        const executorParty: Party = partyMap.get(executor) as Party;

        if (userParty == executorParty) {
            if (checkKickPermissions(userParty)) {
                partyMap.delete(user);

                const data: string = JSON.stringify({
                    header: "SUCCESS",
                    code: "0",
                    type: "PARTY",
                    body: {
                        cmd: "PLAYER_KICK",
                        party: {
                            owner: executorParty.owner.username,
                            moderators: executorParty.moderators.map(moderator => moderator.username),
                            players: executorParty.players.map(player => player.username)
                        },
                        kicked_player: user.username
                    }
                })

                sender.broadcastToParty(executorParty, data);
                sender.sendToSocket(user.ws, JSON.stringify({
                    header: "SUCCESS",
                    code: "0",
                    type: "PARTY",
                    body: {
                        cmd: "CLIENT_KICK",
                    }
                }));
            } else {
                sender.sendError("4", executor.ws);
            }
        } else {
            sender.sendError("8", executor.ws);
            return;
        }
    } else {
        sender.sendError("6", executor.ws);
        return;
    }
}

function promote(user: MflpClient, executor: MflpClient, sender: WebsocketSender) {
    if (!(partyMap.has(user) && partyMap.has(executor))) {
        sender.sendError("6", executor.ws);
        return;
    }

    const userParty: Party = partyMap.get(user) as Party;
    const party: Party = partyMap.get(executor) as Party;

    if (userParty !== party) {
        sender.sendError("8", executor.ws);
        return;
    }

    if (getClientPermissionLevel(executor, party) == 2) {
        sender.sendError("4", executor.ws);
        return;
    }

    if (party.moderators.includes(user)) {
        party.owner = user;
        party.moderators = party.moderators.filter(mod => mod !== user);
        party.moderators.push(executor);
    } else if (party.players.includes(user)) {
        party.moderators.push(user);
        party.players = party.players.filter(player => player !== user);
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
                players: party.players.map(player => player.username)
            },
            promoted_player: user
        }
    });

    sender.broadcastToParty(party, data);
}

function demote(user: MflpClient, executor: MflpClient, sender: WebsocketSender) {
    if (!(partyMap.has(user) && partyMap.has(executor))) {
        sender.sendError("6", executor.ws);
        return;
    }

    const userParty: Party = partyMap.get(user) as Party;
    const party: Party = partyMap.get(executor) as Party;

    if (userParty !== party) {
        sender.sendError("8", executor.ws);
        return;
    }

    if (getClientPermissionLevel(executor, party) == 2) {
        sender.sendError("4", executor.ws);
        return;
    }

    if (party.moderators.includes(user)) {
        party.players.push(user);
        party.moderators = party.moderators.filter(mod => mod !== user);
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
                players: party.players.map(player => player.username)
            },
            demoted_player: user
        }
    });

    sender.broadcastToParty(party, data);
}

function chat(executor: MflpClient, message: string, sender: WebsocketSender) {
    if (!partyMap.has(executor)) {
        sender.sendError("6", executor.ws);
        return;
    }

    const data: string = JSON.stringify({
        header: "SUCCESS",
        code: "0",
        type: "PARTY",
        body: {
            cmd: "PARTY_CHAT",
            chatting_player: executor.username,
            message: message
        }
    });

    sender.broadcastToParty(partyMap.get(executor) as Party, data);
}

export function handleParty(payload: Payload, ws: WebSocket, connectedClients: Array<MflpClient>,
                            sender: WebsocketSender) {
    const body: PartyBody = payload.body as PartyBody;

    const cmd: string = body.cmd;
    const user: MflpClient | undefined = getClientByUsername(connectedClients, body.user);
    const executor: MflpClient = getClientByWebsocket(connectedClients, ws) as MflpClient;
    const message: string | undefined = body.message;

    switch (cmd) {
        case "INVITE":
            if (!user) {
                sender.sendError("2", ws);
                return;
            }

            if (user == executor) {
                sender.sendError("3", ws); // send self invite error
                return;
            }
            invite(user, executor, sender);
            break;
        case "LEAVE":
            leave(executor, sender);
            break;
        case "ACCEPT":
            accept(executor, sender);
            break;
        case "DECLINE":
            decline(executor, sender);
            break;
        case "KICK":
            if (!user) {
                sender.sendError("2", ws);
                return;
            }

            kick(user, executor, sender);
            break;
        case "PROMOTE":
            if (!user) {
                sender.sendError("2", ws);
                return;
            }

            promote(user, executor, sender);
            break;
        case "DEMOTE":
            if (!user) {
                sender.sendError("2", ws);
                return;
            }
            if (user == executor) {
                sender.sendError("10", ws); // send self invite error
                return;
            }

            demote(user, executor, sender);
            break;
        case "CHAT":
            if (!message) {
                sender.sendError("11", ws);
                return;
            }

            chat(executor, message, sender);
            break;
        default:
            sender.sendError("1", ws);
            return;
    }
}