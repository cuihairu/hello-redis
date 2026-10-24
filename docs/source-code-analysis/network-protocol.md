# Network Protocol

## Overview

Everything Redis does over the wire is built on a custom application-layer text protocol: RESP (REdis Serialization Protocol). Clients encode commands as RESP requests and write them to the TCP connection; the server parses them, executes the command, then encodes the result as a RESP reply and writes it back. Understanding RESP is a prerequisite for understanding `networking.c`: in this 4,000+ line file, the read buffer, protocol parsing, reply buffer, and output buffer limits all revolve around the same `client` struct.

This chapter is the entry point to the network protocol section, split into three layers:

- **The protocol itself**: the wire formats and types of RESP2 and RESP3 (see *Redis Protocol Overview*).
- **Implementation mechanics**: how the read buffer, parser, reply buffer, and io-threads cooperate (see *Implementation Details*).
- **Engineering practice**: how to observe protocol behavior with the command line and raw sockets.

## Why a text protocol

RESP chose the "human-readable, binary-safe text" route, and the engineering benefits are very direct:

1. **Very low parsing cost**: every reply starts with a type byte (such as `+`, `:`, `$`), so you read line by line until `\r\n` — no full lexical analysis like XML or JSON is needed.
2. **Easy to debug**: `nc`, `telnet`, even `printf` can talk to the server directly.
3. **Binary-safe**: the multibulk format declares each chunk's byte count with a length prefix, so values may contain `\r\n` and null bytes.

The cost is a slightly larger payload, but with connection reuse and pipelining, in most scenarios the bottleneck is not the protocol itself.

## Protocol evolution: RESP2 and RESP3

Redis has supported RESP3 since 6.0; clients upgrade via `HELLO 3`, and the protocol version is recorded in `client->resp`:

```bash
$ redis-cli -p 6399 hello 3
server redis
version 8.0.5
proto 3
id 1235
mode standalone
role master
modules name vectorset
ver 1
path
args
```

The core additions of RESP3 over RESP2:

| Type | Prefix | Downgrade in RESP2 |
|------|--------|--------------------|
| null | `_` | Empty multibulk `$-1` / `*-1` |
| boolean | `#` | Integer 0/1 |
| double | `,` | Bulk string |
| big number | `(` | Bulk string |
| map | `%` | Flat array |
| set | `~` | Array |
| push | `>` | Array (2.x-style pubsub message) |
| verbatim string | `=` | Bulk string |
| attribute | `\|` | Ignored (per spec, clients must be able to skip it) |

The resp2/resp3 dual track means the same command implementation must perform type conversion on output; that conversion logic is concentrated in the `addReply*` family of functions in `networking.c`.

## Source locations at a glance

- `src/networking.c`: the core of the protocol implementation. `readQueryFromClient()` (around line 2900 in 8.0) is the read event callback; `processInlineBuffer()` and `processMultibulkBuffer()` handle parsing; `writeToClient()` and `prepareClientToWrite()` handle replies.
- `src/connection.c`, `src/socket.c`: the connection abstraction layer, unifying socket/TLS behind a `connection` interface.
- `src/ae.c`, `src/ae_epoll.c`: the event loop, which decides when to read and when to write.
- `src/iothread.c` (newly split out in 8.0): multithreaded I/O, where clients are assigned onto each thread's own event loop.
- `src/server.c`: after parsing completes, control enters `processCommand()` and `call()`, which belongs to the command processing chapter.

## A minimal verification: raw socket dialogue

Without any client library, send a command directly using the inline protocol:

```bash
$ printf 'PING\r\n' | nc 127.0.0.1 6399
+PONG
```

The server's `PING\r\n` has no `*` prefix, so `processInlineBuffer()` splits it into argv on spaces. Now send a multibulk request (issue `HELLO 2` first to avoid RESP3 replies interfering with the display):

```text
*2\r\n$4\r\nECHO\r\n$5\r\nhello\r\n   ->   $5\r\nhello\r\n
```

Note that the inline protocol cannot express arguments containing spaces: `ECHO hello world` gets split into three arguments and returns `-ERR wrong number of arguments for 'echo' command`. This is also why Redis officially requires that production clients always use multibulk.

## Useful commands for observing the protocol

```bash
# view the current connection count and buffer watermarks
redis-cli -p 6399 info clients
redis-cli -p 6399 client list | head -3

# redis-cli shows the raw protocol text (-3 switches to RESP3)
redis-cli -3 -p 6399 client info | tr ' ' '\n' | grep resp=
# resp=3
```

To observe the new RESP3 types byte by byte, the most convenient tool is `DEBUG PROTOCOL`, but it requires the server to explicitly enable `enable-debug-command` (shared instances usually have it off; a self-hosted instance can be started with `redis-server --enable-debug-command yes`):

```bash
$ redis-cli -p 16390 debug protocol map      # local self-hosted instance
1) 0
2) (false)
...
```

## Summary

RESP is a minimalist protocol designed for "millions of round trips per second": type byte + line text + length prefix. It leaves the complexity to the implementations on both ends — clients must handle the RESP2/RESP3 dual track and new types like push/attribute, and the server must complete "read-parse-execute-reply" within a single event loop. The next two chapters unfold the protocol format details and the internal implementation mechanics of `networking.c`.

## References

- [Redis source repository](https://github.com/redis/redis)
- [RESP protocol spec](https://redis.io/docs/latest/develop/reference/protocol-spec/)
- [networking.c](https://github.com/redis/redis/blob/unstable/src/networking.c)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
