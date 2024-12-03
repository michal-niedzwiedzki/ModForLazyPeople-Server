export enum Errors {
    SUCCESS = 0,

    INVALID_CLIENT_KEY = -1,
    E_CLIENT_NOT_CONNECTED = -2,

    INVALID_COMMAND = 1,
    INVALID_USER = 2,
    INVALID_PARTY = 8,

    SELF_INVITE = 3,
    NO_PERMISSION = 4,
    INVITE_TIMEOUT = 5,
    NOT_IN_PARTY = 6,
    NO_PENDING_INVITE = 7,

    ALREADY_IN_PARTY = 9,
    SELF_DEMOTE = 10,
    BAD_MESSAGE = 11,
}

const messages: { [e: number]: string } = {
    0: "Success",

    1: "Invalid command",
    2: "Invalid user",
    8: "Invalid party",

    3: "Self invite",
    4: "No permission",
    5: "Invitation expired",
    6: "User not in party",
    7: "No pending invite",

    9: "Already in party",
    10: "Self demote",
    11: "Bad invite",
}

export const errorToMessage = (e: number): string => e in messages ? messages[e] : "Unknown error"