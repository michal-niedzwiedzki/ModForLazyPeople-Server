import WebSocket from "ws"
import {WebsocketWriter} from "../WebsocketWriter"
import {Command, Payload} from "./Command"

export class ClientJoinCommand extends Command {

    public canHandle(payload: Payload): boolean {
        return payload?.type === "STATUS" && payload?.body?.cmd === "CLIENT_JOIN"
    }

    public handle(payload: Payload, ws: WebSocket, writer: WebsocketWriter): void {
        // websocketServer.clients.forEach((socket: WebSocket) => {
        //     socket.send(JSON.stringify({
        //         header: "SUCCESS",
        //         code: "0",
        //         type: "STATUS",
        //         body: {
        //             cmd: "CLIENT_JOIN",
        //             client: username
        //         }
        //     }));
        // });
        // printAdded(username);
    }

}