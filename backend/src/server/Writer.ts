import WebSocket from "ws"

import { Client, Party } from "../client"
import { State } from "./State"

export class Writer {

  private server: WebSocket.Server

  constructor(server: WebSocket.Server) {
    this.server = server
  }

  broadcastToParty(party: Party, data: string | number | object) {
    if (data instanceof Object) data = JSON.stringify(data)
    party.owner.ws.send(data)
    party.moderators.forEach(moderator => moderator.ws.send(data))
    party.players.forEach(player => player.ws.send(data))
  }

  broadcastToAll(state: State, data: string | number | object) {
    if (data instanceof Object) data = JSON.stringify(data)
    state.getClients().forEach((client: Client) => client.ws.send(data))
  }

  send(ws: WebSocket, data: object | string | object) {
    if (data instanceof Object) data = JSON.stringify(data)
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
