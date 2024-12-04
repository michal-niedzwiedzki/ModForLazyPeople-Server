import WebSocket from "ws"

export interface Client {
    key: string,
    ws: WebSocket,
    username: string;
}