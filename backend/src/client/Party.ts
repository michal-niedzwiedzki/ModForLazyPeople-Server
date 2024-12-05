import { Client } from "."

export interface Party {
    partyId: string // 16 chars long hexadecimal string
    owner: Client
    moderators: Array<Client>
    players: Array<Client>
}
