import WebSocket from "ws"

import { Command } from "./Command"
import { Payload, Feedback } from "../client"
import { Errors, State, Writer } from "../server"

export class StatusJoinCommand extends Command {

  public canHandle(payload: Payload): boolean {
    return payload?.type === "STATUS" && payload?.body?.cmd === "CLIENT_JOIN"
  }

  public handle(
    payload: Payload,
    state: State,
    ws: WebSocket,
    writer: Writer
  ): void {
    writer.broadcastToAll(state, new Feedback(payload, Errors.SUCCESS, {
      cmd: "CLIENT_JOIN",
      client: payload.body.user,
    }))
  }

}
