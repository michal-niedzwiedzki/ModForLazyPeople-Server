import {Payload} from "./utils"
import WebSocket from "ws"
import {MflpClient} from "./Client"
import {WebsocketWriter} from "./WebsocketWriter"

interface StatusBody {
    cmd: string;
    username: string;
}

function printAdded(username: string) {
    console.log("\x1b[32mClient joined: " + username)
}

function printRemoved(username: string) {
    console.log("\x1b[31mClient left: " + username)
}

export function handleStatus(payload: Payload, ws: WebSocket, websocketServer: WebSocket.Server,
                             connectedClients: Array<MflpClient>, sender: WebsocketWriter) {
    const body: StatusBody = payload.body as StatusBody

    const cmd: string = body.cmd
    const username: string = body.username

    switch (cmd) {
        case "CLIENT_JOIN":
            websocketServer.clients.forEach((socket: WebSocket) => {
                socket.send(JSON.stringify({
                    header: "SUCCESS",
                    code: "0",
                    type: "STATUS",
                    body: {
                        cmd: "CLIENT_JOIN",
                        client: username,
                    },
                }))
            })
            printAdded(username)
            return
        case "CLIENT_PART":
            websocketServer.clients.forEach((client) => {
                client.send(JSON.stringify({
                    header: "SUCCESS",
                    code: "0",
                    type: "STATUS",
                    body: {
                        cmd: "CLIENT_PART",
                        client: username,
                    },
                }))
            })
            printRemoved(username)
            return
        case "REQUEST_LIST":
            sender.sendToSocket(ws, JSON.stringify({
                header: "SUCCESS",
                code: "0",
                type: "STATUS",
                body: {
                    cmd: "REQUEST_LIST",
                    clients: connectedClients.map(client => client.username),
                },
            }))
            return
    }
    sender.sendToSocket(ws, JSON.stringify({
        header: "ERROR",
        code: "1",
        type: "STATUS",
        body: {},
    }))
}