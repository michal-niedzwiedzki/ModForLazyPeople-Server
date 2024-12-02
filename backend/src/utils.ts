import {randomBytes} from "crypto";
import {MflpClient} from "./Client";
import WebSocket from 'ws';
import {Party} from "./partyHandler";

export function isValidKey(clients: Array<MflpClient>, key: string): boolean {
    clients.forEach(client => {
        if (client.key === key) return true;
    })
    return false;
}


export function generateKey(length: number): string {
    return randomBytes(length).toString('hex')
}

export function getClientByWebsocket(clients: Array<MflpClient>, ws: WebSocket): MflpClient | undefined {
    clients.forEach(client => {
        if (client.ws == ws) return client;
    })
    return undefined;
}

export function getClientByUsername(clients: Array<MflpClient>, username: string | undefined): MflpClient | undefined {
    if (!username) return undefined;

    clients.forEach(client => {
        if (client.username == username) return client;
    })
    return undefined;
}

export function getClientPermissionLevel(client: MflpClient, party: Party): number {
    if (client == party.owner) return 2;
    if (party.moderators.includes(client)) return 1;
    if (party.players.includes(client)) return 0;
    return -1;
}

/**
 *  Small class for throwing nice errors.
 */
export class MflpError {
    constructor(public message: string) {
        console.log("\x1b[31mAn error has occured!");
        console.log("Message: " + message + "\x1b[0m");
    }
}

/**
 *  Structs for different payloads
 */
export interface Payload {
    clientKey: string;
    minecraftId: string;
    type: "STATUS" | "PARTY";
    body: any;
}