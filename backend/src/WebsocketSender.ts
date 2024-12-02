import {Party} from "./partyHandler";
import WebSocket from "ws";

export class WebsocketSender {
    broadcastToParty(party: Party, data: string) {
        party.owner.ws.send(data);
        party.moderators.forEach(moderator => moderator.ws.send(data));
        party.players.forEach(player => player.ws.send(data));
    }

    sendToSocket(ws: WebSocket, data: string) {
        ws.send(data);
    }

    sendError(errorCode: string, ws: WebSocket) {
        ws.send(JSON.stringify({
            header: "ERROR",
            code: errorCode,
            type: "STATUS",
            body: {}
        }))
    }
}