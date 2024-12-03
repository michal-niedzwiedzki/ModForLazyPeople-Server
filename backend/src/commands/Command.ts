import { Errors, errorToMessage } from "../server/Errors"
import { State } from "../server/State"
import { WebsocketWriter } from "../WebsocketWriter"
import WebSocket from "ws"

export abstract class Command {

  public abstract canHandle(payload: Payload): boolean;

  public abstract handle(
    payload: Payload,
    state: State,
    ws: WebSocket,
    writer: WebsocketWriter
  ): void
}

// TODO: add type for cmd

export interface Payload {
  clientKey: string
  minecraftId: string
  type: "STATUS" | "PARTY"
  body: {
    cmd: string
    user?: string
  }
}

export class Response {

  public readonly payload: Payload
  public readonly code: Errors
  public readonly status: string
  public readonly body: object

  constructor(payload: Payload, code: Errors, body?: object) {
    this.payload = payload
    this.code = code
    this.status = errorToMessage(code)
    this.body = body ?? payload.body
  }

  public toString(): string {
    return JSON.stringify(this)
  }
}
