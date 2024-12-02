import WebSocket from "ws"

export interface MflpClient {
    key: string,
    ws: WebSocket,
    username: string;
}