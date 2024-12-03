import WebSocket from "ws";
import { WebsocketWriter } from "../WebsocketWriter";
import { Command, Payload } from "./Command";
import { State } from "../server/State";

export class StatusJoinCommand extends Command {

  public canHandle(payload: Payload): boolean {
    return payload?.type === "STATUS" && payload?.body?.cmd === "CLIENT_JOIN";
  }

  public handle(
    payload: Payload,
    state: State,
    ws: WebSocket,
    writer: WebsocketWriter
  ): void {
    writer.broadcastToAll(state, JSON.stringify({
          header: "SUCCESS",
          code: "0",
          type: "STATUS",
          body: {
            cmd: "CLIENT_JOIN",
            client: payload.body.user,
          }}))
        }
       
}
