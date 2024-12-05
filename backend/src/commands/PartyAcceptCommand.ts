import WebSocket from "ws"

import { Command } from "./Command"
import { Client, Payload, Feedback } from "../client"
import { Errors, State, Writer } from "../server"

export class PartyAcceptCommand extends Command {

  public canHandle(payload: Payload): boolean {
    return payload?.type === "PARTY" && payload?.body?.cmd === "ACCEPT";
  }

  public handle(
    payload: Payload,
    state: State,
    ws: WebSocket,
    writer: Writer
  ): void {
    const executor = state.getClientByWebSocket(ws)
    if (!executor) return // FIXME write to ws some meaningful error

    if (!state.hasParty(executor)) return writer.error(executor!.ws, Errors.ALREADY_IN_PARTY)
    if (!state.hasPendingInvite(executor)) return writer.error(executor!.ws, Errors.NO_PENDING_INVITE)

    const party = state.getInvitingParty(executor)
    if (!party) return writer.error(executor!.ws, Errors.INVALID_PARTY)

    party.players.push(executor)
    state.join(executor, party);
    state.uninvite(executor)

    writer.broadcastToParty(party, new Feedback(payload, Errors.SUCCESS, {
        cmd: "PLAYER_ACCEPT",
        party: {
          owner: party.owner.username,
          moderators: party.moderators.map((moderator) => moderator.username),
          players: party.players.map((player) => player.username),
        },
        joining_player: executor.username,
    }));
  }
}
