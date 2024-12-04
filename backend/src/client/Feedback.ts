import { Errors, errorToMessage } from "../server"
import { Payload } from "./Payload"

export class Feedback {

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

}
