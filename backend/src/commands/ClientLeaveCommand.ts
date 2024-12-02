import {MflpClient} from "../Client"
import {Party} from "../partyHandler"
import WebSocket from "ws"
import {WebsocketWriter} from "../WebsocketWriter"
import {generateKey, getClientByUsername, getClientByWebsocket, getClientPermissionLevel} from "../utils"
import {Command, Payload} from "./Command"

export class ClientLeaveCommand extends Command {

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
        return payload?.type === "PARTY" && payload?.body?.cmd === "LEAVE"
    }

    public handle(payload: Payload, ws: WebSocket, writer: WebsocketWriter): void {
        const user = getClientByUsername(this.connectedClients, payload.body?.user as string)
        if (!user) return

        const executor: MflpClient = getClientByWebsocket(this.connectedClients, ws) as MflpClient
        if (user == executor) return writer.sendError("3", ws) // send self invite error

        const party = this.partyMap.get(executor)
        if (!party) return writer.sendError("6", executor.ws)

        const update = (partyMap: Map<MflpClient, Party>, party: Party) => {
            const data: string = JSON.stringify({
                header: "SUCCESS",
                code: "0",
                type: "PARTY",
                body: {
                    cmd: "PLAYER_LEFT",
                    party: {
                        owner: party.owner.username,
                        moderators: party.moderators.map((moderator: MflpClient) => moderator.username),
                        players: party.players.map((player: MflpClient) => player.username),
                    },
                    leaving_player: executor.username,
                },
            })

            writer.broadcastToParty(party, data)
            partyMap.delete(executor)
            return partyMap
        }

        if (party.owner === executor) {
            if (party.moderators.at(0)) {
                party.owner = party.moderators.at(0) as MflpClient
                party.moderators = party.moderators.filter((moderator: MflpClient) => moderator !== party.owner)
                this.partyMap = update(this.partyMap, party)
            } else if (party.players.at(0)) {
                party.owner = party.players.at(0) as MflpClient
                party.players = party.players.filter((player: MflpClient) => player !== party.owner)
                this.partyMap = update(this.partyMap, party)
            } else {
                this.parties = this.parties.filter(p => p !== party)
            }
        } else if (party.moderators.includes(executor)) {
            party.moderators = party.moderators.filter((moderator: MflpClient) => moderator !== executor)
            this.partyMap = update(this.partyMap, party)
        } else if (party.players.includes(executor)) {
            party.players = party.players.filter((player: MflpClient) => player !== executor)
            this.partyMap = update(this.partyMap, party)
        }
    }

}