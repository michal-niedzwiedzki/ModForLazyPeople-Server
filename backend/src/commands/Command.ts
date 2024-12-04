import { Errors, errorToMessage } from "../server/Errors"
import { State } from "../server/State"
import { Writer } from "../server/Writer"
import WebSocket from "ws"

export abstract class Command {

  public abstract canHandle(payload: Payload): boolean;

  public abstract handle(
    payload: Payload,
    state: State,
    ws: WebSocket,
    writer: Writer
  ): void
}
