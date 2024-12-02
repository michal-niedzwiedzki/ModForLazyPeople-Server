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
import WebSocket from 'ws';
import { getClientByWebsocket, generateKey, isValidKey, MflpError, Payload } from "./utils";
import { handleStatus } from "./statusHandler";
import { handleParty } from "./partyHandler";
import { MflpClient } from "./Client";
import { WebsocketSender } from "./WebsocketSender";

const websocketServer = new WebSocket.Server({ port: 8080 });
let connectedClients: Array<MflpClient> = []

const sender: WebsocketSender = new WebsocketSender();

console.log("Starting WebSocket Server.");

function clientHandshake(ws: WebSocket, username: string) {
    const generatedKey = generateKey(32);
    const client: MflpClient = { key: generatedKey, ws: ws, username: username } as MflpClient;

    connectedClients.push(client)
    sender.sendToSocket(client.ws, JSON.stringify(generatedKey));
}

function partClient(clientWs: WebSocket) {
    const client: MflpClient | undefined = getClientByWebsocket(connectedClients, clientWs)
    if (client) {
        connectedClients = connectedClients.filter(c => c !== client);
    } else {
        new MflpError("Could not find client for disconnecting websocket.");
    }
}

websocketServer.on('connection', (ws, request) => {
    const usernameJson = request.headers['username'];

    if (usernameJson) {
        try {
            const usernameJsonData = JSON.parse(Array.isArray(usernameJson) ? usernameJson[0] : usernameJson);
            clientHandshake(ws, usernameJsonData.username);
        } catch (err) {
            new MflpError("Invalid json data in handshake!");
            return;
        }
    } else {
        new MflpError("No Json data in handshake!");
        return;
    }

    ws.on('message', (message: string) => {
        const payload: Payload = JSON.parse(message);

        if (isValidKey(connectedClients, payload.clientKey)) {
            new MflpError("Invalid client key.");
            sender.sendToSocket(ws, "Invalid key.");
            return;
        }

        switch (payload.type) {
            case "STATUS":
                handleStatus(payload, ws, websocketServer, connectedClients, sender);
                break;
            case "PARTY":
                handleParty(payload, ws, connectedClients, sender);
                break;
        }
    })
    ws.on('close', () => {
        partClient(ws);
    })
})

