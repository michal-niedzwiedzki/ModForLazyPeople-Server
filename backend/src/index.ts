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
import {findKeyForEntry, generateKey, KeylessPayload, MflpError, Payload} from "./utils";
import { handleStatus } from "./statusHandler";
import { handleParty } from "./partyHandler";

export const websocketServer = new WebSocket.Server({ port: 8080 });
export const socketPerKeyMap = new Map<string, WebSocket>(); // KEY, Socket
export const usernamePerKeyMap = new Map<string, string>(); // KEY, Username

console.log("Starting WebSocket Server.");

function clientHandshake(client: WebSocket) {
    const generatedKey = generateKey(32);
    socketPerKeyMap.set(generatedKey, client);

    client.send(JSON.stringify(generatedKey));
}

function partClient(client: WebSocket) {
    const key: string = findKeyForEntry(socketPerKeyMap, client);
    if (key) {
        socketPerKeyMap.delete(key);
    } else {
        new MflpError("Could not find key for disconnecting websocket.");
    }
}

websocketServer.on('connection', (ws) => {
    clientHandshake(ws);

    ws.on('message', (message: string) => {
        const payload: Payload = JSON.parse(message);
        const keylessPayload: KeylessPayload = { minecraftId: payload.minecraftId, type: payload.type, body: payload.body };

        if (!socketPerKeyMap.has(payload.clientKey)) {
            new MflpError("Invalid client key.");
            ws.send("Invalid key.");
            return;
        }

        switch (payload.type) {
            case "STATUS":
                // @ts-ignore
                handleStatus(payload, ws);
                break;
            case "PARTY":
                handleParty(payload, keylessPayload);
                break;
        }
    })
    ws.on('close', () => {
        partClient(ws);
    })
})

