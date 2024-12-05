import WebSocket from "ws"

import { Command } from "./Command";
import { Client, Payload, Feedback, Party } from "../client"
import { Errors, State, Writer } from "../server";

export class PartyInviteCommand extends Command {

  public canHandle(payload: Payload): boolean {
    return payload?.type === "PARTY" && payload?.body?.cmd === "INVITE";
  }

  public handle(
    payload: Payload,
    state: State,
    ws: WebSocket,
    writer: Writer
  ): void {
    const user = state.getClientByUsername(payload.body?.user);
    if (!user) return writer.error(ws, Errors.INVALID_USER);

    const executor = state.getClientByWebSocket(ws)
    if (user == executor) return writer.error(ws, Errors.SELF_INVITE);

    const sendInviteSuccess = (party: Party) => {
      writer.send(
        user.ws,
        new Feedback(payload, Errors.SUCCESS)
      );
      writer.broadcastToParty(party, new Feedback(payload, Errors.SUCCESS, {
          cmd: "INVITE_SUCCESS",
          user: user.username,
      }))
    };

    if (this.partyMap.has(user)) {
      const part = this.partyMap.get(user);

      if (party) {
        const permissionLevel = getClientPermissionLevel(executor, party);

        if (permissionLevel > 0) {
          if (state.isUserInParty(user, party)) {
            state.uninvite(user)
            writer.error(party.owner.ws, Errors.INVITE_TIMEOUT)
            party.moderators.forEach((moderator) => writer.error(moderator.ws, Errors.INVITE_TIMEOUT))
            party.players.forEach((player) => writer.error(player.ws, Errors.INVITE_TIMEOUT))
          }
          sendInviteSuccess(party);
        } else {
          writer.error("4", executor.ws);
        }
      }
    } else {
      const partyId: string = generateKey(16);
      const party: Party = {
        partyId: partyId,
        owner: executor,
        moderators: new Array<Client>(),
        players: new Array<Client>(),
      };

      if (state.isUserInParty(user, party)) {
        state.uninvite(user)
        writer.error(party.owner.ws, Errors.INVITE_TIMEOUT)
        party.moderators.forEach((moderator) => writer.error(moderator.ws, Errors.INVITE_TIMEOUT))
        party.players.forEach((player) => writer.error(player.ws, Errors.INVITE_TIMEOUT))
      }
      sendInviteSuccess(party);

      this.parties.push(party);
      this.partyMap.set(executor, party);
    }
  }
}
