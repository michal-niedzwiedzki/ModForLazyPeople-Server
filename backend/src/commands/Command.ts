import {WebsocketWriter} from "../WebsocketWriter"
import WebSocket from "ws"

export abstract class Command {

    public abstract canHandle(payload: Payload): boolean;

    public abstract handle(payload: Payload, ws: WebSocket, writer: WebsocketWriter): void;

}

export interface Payload {
    clientKey: string;
    minecraftId: string;
    type: "STATUS" | "PARTY";
    body: {
        cmd: string;
        user?: string;
    }
}

