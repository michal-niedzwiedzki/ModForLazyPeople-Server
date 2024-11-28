import {getAllEntries, Payload} from "./utils";
import {usernamePerKeyMap, websocketServer} from "./index";

interface StatusBody {
    cmd: string;
    username: string;
}

function printAdded(username: string) {
    console.log("\x1b[32mClient joined: " + username);
}

function printRemoved(username: string) {
    console.log("\x1b[31mClient left: " + username);
}

export function handleStatus(payload: Payload, ws: WebSocket) {
    const key: string = payload.clientKey;
    const body: StatusBody = payload.body as StatusBody;

    const cmd: string = body.cmd;
    const username: string = body.username;

    switch (cmd) {
        case "CLIENT_JOIN":
            usernamePerKeyMap.set(key, username);
            websocketServer.clients.forEach((client) => {
                client.send(JSON.stringify({
                    header: "SUCCESS",
                    code: "0",
                    type: "STATUS",
                    body: {
                        cmd: "CLIENT_JOIN",
                        client: username
                    }
                }));
            });
            printAdded(username);
            return;
        case "CLIENT_PART":
            usernamePerKeyMap.delete(key);
            websocketServer.clients.forEach((client) => {
                client.send(JSON.stringify({
                    header: "SUCCESS",
                    code: "0",
                    type: "STATUS",
                    body: {
                        cmd: "CLIENT_PART",
                        client: username
                    }
                }));
            })
            printRemoved(username);
            return;
        case "REQUEST_LIST":
            ws.send(JSON.stringify({
                header: "SUCCESS",
                code: "0",
                type: "STATUS",
                body: {
                    cmd: "REQUEST_LIST",
                    clients: getAllEntries(usernamePerKeyMap)
                }
            }));
            return;
    }
    ws.send(JSON.stringify({
        header: "ERROR",
        code: "1",
        type: "STATUS",
        body: {}
    }))
}