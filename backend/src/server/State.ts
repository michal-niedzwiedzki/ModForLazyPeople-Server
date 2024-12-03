import { MflpClient } from "../Client"
import { Party } from "../partyHandler"
import { randomBytes } from "crypto"
import WebSocket from "ws"

export class State {
  private clients: Array<MflpClient> = []
  private parties: Array<Party> = []
  private partyMap: Map<MflpClient, Party> = new Map<MflpClient, Party>()
  private invites: Map<MflpClient, Party> = new Map<MflpClient, Party>()

  public generateKey(length: number): string {
    return randomBytes(length).toString("hex")
  }

  public isValidKey(key: string): boolean {
    return this.clients.some((client) => client.key === key)
  }

  public connect(client: MflpClient): this {
    this.clients.push(client)
    return this
  }

  public disconnect(ws: WebSocket): this {
    const client = this.getClientByWebSocket(ws)
    if (!!client) this.clients = this.clients.filter((c) => c !== client)
    return this
  }

  public getClientByWebSocket(ws: WebSocket): MflpClient | undefined {
    return this.clients.find((client) => (client.ws === ws))
  }

  public getClientByUsername(username: string | undefined): MflpClient | undefined {
    return this.clients.find((client) => (client.username === username))
  }

  public hasParty(client: MflpClient | undefined): boolean {
    return !!client && this.partyMap.has(client)
  }

  public hasPendingInvite(client: MflpClient | undefined): boolean {
    return !!client && this.invites.has(client)
  }

  public getInvitingParty(client: MflpClient | undefined) {
    if (!!client ) return this.invites.get(client)
    else return undefined
  }

}