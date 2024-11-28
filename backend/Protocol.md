<h1>ModForLazyPeople-Server</h1>
The server uses a new structure for sending and receiving data which goes like so:

<h2>Handshake</h2> when connecting for the first time, which calls
`WebSocket.on('connection')` gets sent back a 32 char long hexadecimal key which will be used
and verified for any operations that the client tries to execute.

<h2>Client-side requests</h2> the client will use the following format:
```
key: <32 char long key>
type: "STATUS" or "PARTY" // Depending on the operation the client wants to execute.
body: {
      // Status body
      cmd: "CLIENT_JOIN" or "CLIENT_PART" or "REQUEST_LIST" // Depending on the status operation.
      username: <username>

      // Party body
      cmd: <Any of the party commands spelled with upper case letters>
      <additional data> like a username or message
}
```
<h2>Server-side responses</h2> in the case of an error, the server will send a response looking as such:
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
<h2>Errors</h2>
```
0: SUCCESS
1: INVALID_COMMAND
```