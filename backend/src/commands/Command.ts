import WebSocket from "ws"

import { Payload } from "../client"
import { State, Writer } from "../server"

export abstract class Command {

  public abstract canHandle(payload: Payload): boolean;

  public abstract handle(
    payload: Payload,
    state: State,
    ws: WebSocket,
    writer: Writer
  ): void
}
