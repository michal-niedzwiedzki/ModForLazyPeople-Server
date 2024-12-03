import { MflpClient } from "./Client"
import {Party} from "./partyHandler"
import WebSocket from "ws"
import { State } from "./server/State"

export class WebsocketWriter {

    private server: WebSocket.Server

    constructor(server: WebSocket.Server) {
        this.server = server
    }

    broadcastToParty(party: Party, data: string | number | Response) {
        party.owner.ws.send(data)
        party.moderators.forEach(moderator => moderator.ws.send(data))
        party.players.forEach(player => player.ws.send(data))
    }

    broadcastToAll(state: State, data: string | number) {
        state.clients.forEach((client: MflpClient) => client.ws.send(data))
    }

    send(ws: WebSocket, data: object | string) {
        ws.send(JSON.stringify(data))
    }

    error(ws: WebSocket, errorCode: number) {
        ws.send(JSON.stringify({
            header: "ERROR",
            code: errorCode,
            type: "STATUS",
            body: {},
        }))
    }
}