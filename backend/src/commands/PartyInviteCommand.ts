import { MflpClient } from "../Client";
import { Party } from "../partyHandler";
import WebSocket from "ws";
import { WebsocketWriter } from "../WebsocketWriter";
import {
  getClientPermissionLevel,
} from "../utils";
import { Command, Payload, Response } from "./Command";
import { State } from "../server/State";
import { Errors } from "../server/Errors";

export class PartyInviteCommand extends Command {

  public canHandle(payload: Payload): boolean {
    return payload?.type === "PARTY" && payload?.body?.cmd === "INVITE";
  }

  public handle(
    payload: Payload,
    state: State,
    ws: WebSocket,
    writer: WebsocketWriter
  ): void {
    const user = state.getClientByUsername(payload.body?.user);
    if (!user) return writer.error(ws, Errors.INVALID_USER);

    const executor = state.getClientByWebSocket(ws)
    if (user == executor) return writer.error(ws, Errors.SELF_INVITE);

    const sendInviteSuccess = (party: Party) => {
      this.pendingInvites.set(user, party);
      writer.send(
        user.ws,
        new Response(payload, Errors.SUCCESS)
      );
      writer.broadcastToParty(party, new Response(payload, Errors.SUCCESS, {
          cmd: "INVITE_SUCCESS",
          user: user.username,
      }))
    };

    const sendInviteTimeout = (party: Party) => {
      if (this.pendingInvites.has(user)) {
        this.pendingInvites.delete(user);

        writer.error("5", party.owner.ws);
        party.moderators.forEach((moderator: MflpClient) =>
          writer.error("5", moderator.ws)
        );
        party.players.forEach((player: MflpClient) =>
          writer.error("5", player.ws)
        );
      }
    };

    if (this.partyMap.has(user)) {
      const party: Party | undefined = this.partyMap.get(user);

      if (party) {
        const permissionLevel = getClientPermissionLevel(executor, party);

        if (permissionLevel > 0) {
          sendInviteTimeout(party);
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
        moderators: new Array<MflpClient>(),
        players: new Array<MflpClient>(),
      };

      sendInviteTimeout(party);
      sendInviteSuccess(party);

      this.parties.push(party);
      this.partyMap.set(executor, party);
    }
  }
}
