import { Client } from "../client/Client"
import { Party } from "../partyHandler"
import { randomBytes } from "crypto"
import WebSocket from "ws"

export class State {
  private clients: Array<Client> = []
  private parties: Array<Party> = []
  private partyMap: Map<Client, Party> = new Map<Client, Party>()
  private invites: Map<Client, Party> = new Map<Client, Party>()

  public generateKey(length: number): string {
    return randomBytes(length).toString("hex")
  }

  public isValidKey(key: string): boolean {
    return this.clients.some((client) => client.key === key)
  }

  public connect(client: Client): this {
    this.clients.push(client)
    return this
  }

  public disconnect(ws: WebSocket): this {
    const client = this.getClientByWebSocket(ws)
    if (!!client) this.clients = this.clients.filter((c) => c !== client)
    return this
  }

  public getClientByWebSocket(ws: WebSocket): Client | undefined {
    return this.clients.find((client) => (client.ws === ws))
  }

  public getClientByUsername(username: string | undefined): Client | undefined {
    return this.clients.find((client) => (client.username === username))
  }

  public hasParty(client: Client | undefined): boolean {
    return !!client && this.partyMap.has(client)
  }

  public hasPendingInvite(client: Client | undefined): boolean {
    return !!client && this.invites.has(client)
  }

  public getInvitingParty(client: Client | undefined) {
    if (!!client ) return this.invites.get(client)
    else return undefined
  }

}