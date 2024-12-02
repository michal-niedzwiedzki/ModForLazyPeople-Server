import {MflpClient} from "../Client"
import {Party} from "../partyHandler"
import WebSocket from "ws"
import {WebsocketWriter} from "../WebsocketWriter"
import {generateKey, getClientByUsername, getClientByWebsocket, getClientPermissionLevel} from "../utils"
import {Command, Payload} from "./Command"

export class AcceptClientCommand extends Command {

    private readonly connectedClients: Array<MflpClient>
    private partyMap: Map<MflpClient, Party>
    private pendingInvites: Map<MflpClient, Party>
    private parties: Array<Party>

    constructor(connectedClients: Array<MflpClient>, partyMap: Map<MflpClient, Party>, pendingInvites: Map<MflpClient, Party>, parties: Array<Party>) {
        super()
        this.connectedClients = connectedClients
        this.partyMap = partyMap
        this.pendingInvites = pendingInvites
        this.parties = parties
    }

    public canHandle(payload: Payload): boolean {
        return payload?.type === "PARTY" && payload?.body?.cmd === "ACCEPT"
    }

    public handle(payload: Payload, ws: WebSocket, writer: WebsocketWriter): void {
        const executor: MflpClient = getClientByWebsocket(this.connectedClients, ws) as MflpClient
        if (this.partyMap.has(executor)) return writer.sendError("9", executor.ws)
        if (!this.pendingInvites.has(executor)) return writer.sendError("7", executor.ws)

        const party = this.pendingInvites.get(executor)
        if (!party) return writer.sendError("8", executor.ws)

        party.players.push(executor)

        const data: string = JSON.stringify({
            header: "SUCCESS",
            code: "0",
            type: "PARTY",
            body: {
                cmd: "PLAYER_ACCEPT",
                party: {
                    owner: party.owner.username,
                    moderators: party.moderators.map((moderator: MflpClient) => moderator.username),
                    players: party.players.map((player: MflpClient) => player.username),
                },
                joining_player: executor.username,
            },
        })

        writer.broadcastToParty(party, data)

        this.partyMap.set(executor, party)
        this.pendingInvites.delete(executor)
    }

}