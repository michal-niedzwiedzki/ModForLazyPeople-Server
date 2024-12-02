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

// Imports
import WebSocket from "ws"
import {getClientByWebsocket, generateKey, isValidKey, MflpError} from "./utils"
import {handleStatus} from "./statusHandler"
import {handleParty, Party} from "./partyHandler"
import {MflpClient} from "./Client"
import {WebsocketWriter} from "./WebsocketWriter"
import {CommandRegistry} from "./commands/CommandRegistry"
import {InviteClientCommand} from "./commands/InviteClientCommand"
import {ClientJoinCommand} from "./commands/ClientJoinCommand"
import {Payload} from "./commands/Command"
import {ClientLeaveCommand} from "./commands/ClientLeaveCommand"
import {AcceptClientCommand} from "./commands/AcceptClientCommand"

const websocketServer = new WebSocket.Server({port: 8080})
let connectedClients: Array<MflpClient> = []
let parties: Array<Party> = []
const partyMap: Map<MflpClient, Party> = new Map<MflpClient, Party>()
const pendingInvites: Map<MflpClient, Party> = new Map<MflpClient, Party>()

const writer: WebsocketWriter = new WebsocketWriter()

const registry = new CommandRegistry()
registry.add(new ClientJoinCommand())
registry.add(new InviteClientCommand(connectedClients, partyMap, pendingInvites, parties))
registry.add(new ClientLeaveCommand(connectedClients, partyMap, pendingInvites, parties))
registry.add(new AcceptClientCommand(connectedClients, partyMap, pendingInvites, parties))

console.log("Starting WebSocket Server.")

function clientHandshake(ws: WebSocket, username: string) {
    const generatedKey = generateKey(32)
    const client: MflpClient = {key: generatedKey, ws: ws, username: username} as MflpClient

    connectedClients.push(client)
    writer.sendToSocket(client.ws, JSON.stringify(generatedKey))
}

function partClient(clientWs: WebSocket) {
    const client: MflpClient | undefined = getClientByWebsocket(connectedClients, clientWs)
    if (client) {
        connectedClients = connectedClients.filter(c => c !== client)
    } else {
        new MflpError("Could not find client for disconnecting websocket.")
    }
}

websocketServer.on("connection", (ws, request) => {
    const usernameJson = request.headers["username"]

    if (usernameJson) {
        try {
            const usernameJsonData = JSON.parse(Array.isArray(usernameJson) ? usernameJson[0] : usernameJson)
            clientHandshake(ws, usernameJsonData.username)
        } catch (err) {
            new MflpError("Invalid json data in handshake!")
            ws.close(401)
            return
        }
    } else {
        new MflpError("No Json data in handshake!")
        ws.close(401)
        return
    }

    ws.on("message", (message: string) => {
        const payload: Payload = JSON.parse(message)

        if (isValidKey(connectedClients, payload.clientKey)) {
            new MflpError("Invalid client key.")
            writer.sendToSocket(ws, "Invalid key.")
            return
        }

        const command = registry.retrieve(payload)
        if (command) command.handle(payload, ws, writer)
    })
    ws.on("close", () => {
        partClient(ws)
    })
})

