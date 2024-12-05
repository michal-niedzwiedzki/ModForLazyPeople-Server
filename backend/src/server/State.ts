import WebSocket from "ws"
import { randomBytes } from "crypto"

import { Client, Party } from "../client"

export class State {
  private clients: Array<Client> = []
  private parties: Array<Party> = []
  private membership: Map<Client, Party> = new Map<Client, Party>()
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

  public getClients(): Array<Client> {
    return this.clients
  }

  public getClientByWebSocket(ws: WebSocket): Client | undefined {
    return this.clients.find((client) => (client.ws === ws))
  }

  public getClientByUsername(username: string | undefined): Client | undefined {
    return this.clients.find((client) => (client.username === username))
  }

  public getParties(): Array<Party> {
    return this.parties
  }

  public hasParty(client: Client | undefined): boolean {
    return !!client && this.membership.has(client)
  }

  public hasPendingInvite(client: Client | undefined): boolean {
    return !!client && this.invites.has(client)
  }

  public getInvitingParty(client: Client | undefined) {
    if (!!client) return this.invites.get(client)
    else return undefined
  }

  public invite(client: Client, party: Party): this {
    this.invites.set(client, party)
    return this
  }

  public uninvite(client: Client): this {
    this.invites.delete(client)
    return this
  }

  public join(client: Client, party: Party): this {
    this.membership.set(client, party)
    return this
  }

  public kick(client: Client): this {
    this.membership.delete(client)
    return this
  }

}
