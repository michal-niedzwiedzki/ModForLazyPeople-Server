import {MflpClient} from "../Client"
import {Party} from "../partyHandler"
import WebSocket from "ws"
import {WebsocketWriter} from "../WebsocketWriter"
import {generateKey, getClientByUsername, getClientByWebsocket, getClientPermissionLevel} from "../utils"
import {Command, Payload} from "./Command"

export class InviteClientCommand extends Command {

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
        return payload?.type === "PARTY" && payload?.body?.cmd === "INVITE"
    }

    public handle(payload: Payload, ws: WebSocket, writer: WebsocketWriter): void {
        const user = getClientByUsername(this.connectedClients, payload.body?.user as string)
        if (!user) return writer.sendError("2", ws)

        const executor: MflpClient = getClientByWebsocket(this.connectedClients, ws) as MflpClient
        if (user == executor) return writer.sendError("3", ws) // send self invite error

        const sendInviteSuccess = (party: Party) => {
            this.pendingInvites.set(user, party)
            writer.sendToSocket(user.ws, JSON.stringify({
                header: "SUCCESS", code: "0", type: "PARTY", body: {
                    cmd: "CLIENT_INVITED",
                },
            }))
            const data = JSON.stringify({
                header: "SUCCESS", code: "0", type: "PARTY", body: {
                    cmd: "INVITE_SUCCESS",
                    user: user.username,
                },
            })
            writer.broadcastToParty(party, data)
        }

        const sendInviteTimeout = (party: Party) => {
            if (this.pendingInvites.has(user)) {
                this.pendingInvites.delete(user)

                writer.sendError("5", party.owner.ws)
                party.moderators.forEach((moderator: MflpClient) => writer.sendError("5", moderator.ws))
                party.players.forEach((player: MflpClient) => writer.sendError("5", player.ws))
            }
        }

        if (this.partyMap.has(user)) {
            const party: Party | undefined = this.partyMap.get(user)

            if (party) {
                const permissionLevel = getClientPermissionLevel(executor, party)

                if (permissionLevel > 0) {
                    sendInviteTimeout(party)
                    sendInviteSuccess(party)
                } else {
                    writer.sendError("4", executor.ws)
                }
            }
        } else {
            const partyId: string = generateKey(16)
            const party: Party = {
                partyId: partyId,
                owner: executor,
                moderators: new Array<MflpClient>(),
                players: new Array<MflpClient>(),
            }

            sendInviteTimeout(party)
            sendInviteSuccess(party)

            this.parties.push(party)
            this.partyMap.set(executor, party)
        }

    }

}