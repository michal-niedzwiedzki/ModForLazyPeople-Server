import {MflpClient} from "./Client"
import {Party} from "./partyHandler"

export function getClientPermissionLevel(client: MflpClient, party: Party): number {
    if (client == party.owner) return 2
    if (party.moderators.includes(client)) return 1
    if (party.players.includes(client)) return 0
    return -1
}
