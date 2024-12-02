<h1>ModForLazyPeople-Server</h1>

<h1>Protocol.md</h1>
The server uses a new structure for sending and receiving data which goes like so:

<h2>Handshake</h2> When connecting for the first time the client will send additional info
using headers, like the minecraft username in the `username: <username>` field of the header. The server
will put the username, along with the web socket and generated 32 character long key, and it will send the
key back to the client for following requests.
The full header looks like this:

```
username: <username>
```

<h2>Client-side requests</h2> The client will always use the following format:

```
key: <32 char long key>
type: "STATUS" or "PARTY" // Depending on the operation the client wants to execute.
body: {
      // Status body
      cmd: "CLIENT_JOIN" or "CLIENT_PART" or "REQUEST_LIST" // Depending on the status operation.

      // Party body
      cmd: <Any of the party commands spelled with upper case letters>
      <additional data> like a username or message
}
```

<h2>Server-side responses</h2> In the case of an error, the server will send a response looking like this
one:

```
header: "ERROR" or "SUCCESS"
code: <Any error code other than 0 will be interpreted by the client> or "0" for success
type: "STATUS" or "PARTY" // Depending on the operation the client requested.
body: {
      // Status body
      cmd: "CLIENT_JOIN" or "CLIENT_PART" or "REQUEST_LIST"
      clients: string[] // For list requests
      client: <username> // If command is join or part

      // Party body
      cmd: <Any of the party commands (possibly with a little different wording)>
      <any additional data> E.g. The message sent from a player, the player which sent it.
}
```

Party updates look like so:

```
header: "SUCCESS"
code: "0"
type: "PARTY"
body: {
    cmd: <party command>
    party: {
        owner: <owner username>
        moderators: [ usernames ]
        players: [ players ]
    }
    #if player joined/left
    leaving/joining_player: <username>
    // leaving, joining, declining, kicked, promoted,
    // demoted, chatting
}
```

<h2>Errors</h2> The list of errors that the client can receive.

```
0: SUCCESS

1: INVALID_COMMAND
2: INVALID_USER
8: INVALID_PARTY

3: SELF_INVITE
4: NO_PERMISSION
5: INVITE_TIMEOUT
6: NOT_IN_PARTY
7: NO_PENDING_INVITE

9: ALREADY_IN_PARTY
10: SELF_DEMOTE
11: BAD_MESSAGE
```

<h2>Party codes</h2> The list of commands the client can
receive when a party command happens:

```
CLIENT_INVITED
CLIENT_KICK

PLAYER_LEFT
PLAYER_ACCEPT
PLAYER_DECLINE
PLAYER_KICK
PLAYER_PROMOTE
PLAYER_DEMOTE

INVITE_SUCCESS
PARTY_CHAT
```