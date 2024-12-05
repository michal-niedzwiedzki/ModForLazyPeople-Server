/**
 *    <h1>ModForLazyPeople-Server</h1>
 *
 *    The following code and any of the files in this project
 *    are the code for the server for the minecraft mod:
 *    <a href="https://modrinth.com/mod/modforlazypeople">ModForLazyPeople</a>.
 *
 *    The server uses a new structure for sending and receiving data which is described
 *    in detail in `Protocol.md`
 */

import WebSocket from "ws"

import { Client, Payload } from "./client"
import { Errors, State, Writer } from "./server"
import * as cmd from "./commands"

const server = new WebSocket.Server({ port: 8080 })
const writer = new Writer(server)
const state = new State()
const registry = new cmd.CommandRegistry()
  .add(new cmd.StatusJoinCommand())
  .add(new cmd.PartyInviteCommand())
  .add(new cmd.PartyLeaveCommand())
  .add(new cmd.PartyAcceptCommand()
)

function clientHandshake(ws: WebSocket, username: string) {
  const client: Client = {
    key: state.generateKey(32),
    ws: ws,
    username: username,
  }

  state.connect(client)
  writer.send(client.ws, client.key)
}

server.on("connection", (ws, request) => {
  const username = request.headers["username"]
  if (!username) return ws.close(401) // No JSON data in handshake

  try {
    const usernameJsonData = JSON.parse(
      Array.isArray(username) ? username[0] : username
    )
    clientHandshake(ws, usernameJsonData.username)
  } catch (err) {
    return ws.close(401) // Invalid JSON data in handshake
  }

  ws.on("message", (message: string) => {
    const payload: Payload = JSON.parse(message)
    if (!state.isValidKey(payload.clientKey)) return writer.error(ws, Errors.INVALID_CLIENT_KEY)

    const command = registry.retrieve(payload)
    if (command) command.handle(payload, state, ws, writer)
  })

  ws.on("close", () => state.disconnect(ws))
})
