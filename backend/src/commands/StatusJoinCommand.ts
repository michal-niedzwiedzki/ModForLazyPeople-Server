import WebSocket from "ws"

import { Command } from "./Command";
import { Client, Payload, Feedback } from "../client"
import { Errors, State, Writer } from "../server";


export class StatusJoinCommand extends Command {

  public canHandle(payload: Payload): boolean {
    return payload?.type === "STATUS" && payload?.body?.cmd === "CLIENT_JOIN";
  }

  public handle(
    payload: Payload,
    state: State,
    ws: WebSocket,
    writer: Writer
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
