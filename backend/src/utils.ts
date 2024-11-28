import {randomBytes} from "crypto";

/**
 *
 * @param input Map, the map you want to search;
 * @param searching Any, the value you are searching for returning the key. Returns undefined if not found.
 */
export function findKeyForEntry(input: Map<any, any>, searching: any): any | undefined {
    input.forEach((key, value) => {
        if (value == searching) return key;
    });
    return undefined;
}

export function getAllEntries(input: Map<any, any>): Array<any> {
    const arr: Array<any> = [];

    input.forEach((key, value) => arr.push(value));

    return arr;
}


export function generateKey(length: number): string {
    return randomBytes(length).toString('hex')
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

export interface KeylessPayload {
    minecraftId: string;
    type: "STATUS" | "PARTY";
    body: any;
}