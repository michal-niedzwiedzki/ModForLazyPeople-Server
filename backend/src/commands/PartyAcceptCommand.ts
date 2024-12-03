import { MflpClient } from "../Client"
import WebSocket from "ws"
import { WebsocketWriter } from "../WebsocketWriter"
import { Command, Payload } from "./Command";
import { State } from "../server/State";
import { Errors } from "../server/Errors";

export class PartyAcceptCommand extends Command {

  public canHandle(payload: Payload): boolean {
    return payload?.type === "PARTY" && payload?.body?.cmd === "ACCEPT";
  }

  public handle(
    payload: Payload,
    state: State,
    ws: WebSocket,
    writer: WebsocketWriter
  ): void {
    const executor = state.getClientByWebSocket(ws);
    if (!state.hasParty(executor)) return writer.error(executor!.ws, Errors.ALREADY_IN_PARTY);
    if (!state.hasPendingInvite(executor)) return writer.error(executor!.ws, Errors.NO_PENDING_INVITE);

    const party = state.getInvitingParty(executor)
    if (!party) return writer.error(executor!.ws, Errors.INVALID_PARTY);

    party.players.push(executor);

    const data: string = JSON.stringify({
      header: "SUCCESS",
      code: "0",
      type: "PARTY",
      body: {
        cmd: "PLAYER_ACCEPT",
        party: {
          owner: party.owner.username,
          moderators: party.moderators.map(
            (moderator: MflpClient) => moderator.username
          ),
          players: party.players.map((player: MflpClient) => player.username),
        },
        joining_player: executor.username,
      },
    });

    writer.broadcastToParty(party, data);

    this.partyMap.set(executor, party);
    this.pendingInvites.delete(executor);
  }
}
