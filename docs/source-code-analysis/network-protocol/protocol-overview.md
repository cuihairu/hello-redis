# Redis Protocol Overview

## Overview

RESP (REis Serialization Protocol) was introduced in Redis 1.2 and became the standard communication protocol in 2.0. It is a "binary-safe text protocol": messages consist of type bytes, line text, and length prefixes, so they can be read and written directly with `nc` while still carrying arbitrary byte sequences. This chapter walks through the message format of each type; every example can be reproduced on a local instance.

## Request format: inline and multibulk

Clients send requests in two forms:

**Inline protocol**: join the command on spaces and terminate with `\r\n`; for manual debugging only.

```text
PING\r\n            ->  +PONG\r\n
SET bd:k v1\r\n     ->  +OK\r\n
```

**Multibulk protocol**: used uniformly by production clients. The first line `*N` declares the argument count, and each subsequent argument declares its byte length with `$len`:

```text
*2\r\n$4\r\nECHO\r\n$5\r\nhello\r\n    ->  $5\r\nhello\r\n
```

The parser distinguishes the two by checking whether the first byte is `*` (`processMultibulkBuffer()` and `processInlineBuffer()` in `networking.c`).

## Reply types at a glance (RESP2)

| Type byte | Meaning | Example |
|-----------|---------|---------|
| `+` | Simple string (status) | `+OK\r\n`, `+PONG\r\n` |
| `-` | Error | `-ERR unknown command 'NOSUCHCMD'` |
| `:` | Integer | `:1\r\n` (the return value of DEL) |
| `$` | Bulk string | `$5\r\nhello\r\n`; nonexistent is `$-1\r\n` |
| `*` | Array | `*2\r\n$2\r\nv1\r\n$2\r\nv2\r\n`; empty array `*0\r\n`, nil array `*-1\r\n` |

The raw byte stream of a `SET`/`GET`/`DEL` sequence (observed locally):

```text
SET bd:raw hello   ->  +OK\r\n
GET bd:raw         ->  $5\r\nhello\r\n
DEL bd:raw         ->  :1\r\n
```

## New types in RESP3

RESP3 (since Redis 6.0; clients negotiate it with `HELLO 3`) fills the semantic gaps in RESP2. In a RESP2 session the server automatically "downgrades" these types to their RESP2 equivalents. Use `DEBUG PROTOCOL` to observe them one by one (requires `enable-debug-command yes`; the subcommands supported in 8.0.5 are `string|integer|double|bignum|null|array|set|map|attrib|push|verbatim|true|false`):

```text
DEBUG PROTOCOL string    ->  $11\r\nHello World\r\n          bulk string
DEBUG PROTOCOL integer   ->  :12345\r\n                       integer
DEBUG PROTOCOL double    ->  ,3.141\r\n                       double
DEBUG PROTOCOL bignum    ->  (1234567999999999999999999999999999999\r\n  big number
DEBUG PROTOCOL null      ->  _\r\n                            null
DEBUG PROTOCOL true      ->  #t\r\n                           boolean true
DEBUG PROTOCOL false     ->  #f\r\n                           boolean false
DEBUG PROTOCOL array     ->  *3\r\n:0\r\n:1\r\n:2\r\n         array
DEBUG PROTOCOL map       ->  %3\r\n:0\r\n#f\r\n:1\r\n#t\r\n:2\r\n#f\r\n   map
DEBUG PROTOCOL set       ->  ~3\r\n:0\r\n:1\r\n:2\r\n         set
DEBUG PROTOCOL verbatim  ->  =29\r\ntxt:This is a verbatim\nstring\r\n     verbatim string with format hint
```

In a RESP3 session, commands such as `HSET` (returns `:1`), `CONFIG GET` (returns a map `%`), and `SINTERCARD` have more precise semantics. The same command under a RESP2 session:

```text
DEBUG PROTOCOL map (RESP2 session) ->  *6\r\n:0\r\n:0\r\n:1\r\n:1\r\n:2\r\n:0\r\n
```

That is, the map is flattened into a 6-element array and boolean values degrade to 0/1 integers.

## push and attribute

Push messages (`>`) are RESP3's most important enhancement: outside of command replies, the server can proactively insert "out-of-band" data into the client. pub/sub is the typical case — in a RESP2 session, subscription confirmations and messages are mixed into arrays alongside normal replies, so the client can only guess from content; in RESP3 they are an explicit push type:

```text
SUBSCRIBE bd:chan (RESP3)  ->  >3\r\n$9\r\nsubscribe\r\n$7\r\nbd:chan\r\n:1\r\n
PUBLISH then received      ->  >3\r\n$7\r\nmessage\r\n$7\r\nbd:chan\r\n$2\r\nhi\r\n
```

Attribute (`|`) lets the server attach metadata (such as `key-popularity`) before the normal reply; the spec requires that clients be able to skip it and keep reading the actual reply.

## Protocol negotiation: HELLO

`HELLO [protover [AUTH user pass] [SETNAME name]]` returns server information and switches the protocol version; under RESP2 it returns a flat array, and under RESP3 a map:

```text
HELLO 3   ->  %7\r\n$6\r\nserver\r\n$5\r\nredis\r\n$7\r\nversion\r\n$5\r\n8.0.5\r\n$5\r\nproto\r\n:3\r\n...
HELLO     ->  *14\r\n...proto\r\n:2\r\n...                       (default RESP2)
HELLO 3 AUTH u p   ->  -WRONGPASS invalid username-password pair or user is disabled.
```

`HELLO 2` can downgrade back to RESP2 at any time; the negotiated result is recorded in `client->resp`, and all subsequent `addReply*` output branches on it.

## Conventions for errors and null values

- Error messages start with `-`, such as `-ERR wrong number of arguments for 'echo' command`, `-WRONGTYPE ...`, `-MOVED 8338 127.0.0.1:16401`. The error prefix (`ERR`, `WRONGTYPE`, `MOVED`) is what clients use to classify errors programmatically.
- RESP2 uses `$-1`/`*-1` for null, RESP3 uses `_`; scenarios such as `BLPOP` timeout and nonexistent keys all depend on this distinction.

## Summary

RESP covers all of Redis's interactions with fewer than 20 message forms: on the request side you choose between inline and multibulk, and on the reply side the type byte drives everything. The difference between RESP2 and RESP3 is concentrated in "type fidelity" — map/set/bool/double/push mean clients no longer have to guess, and they let the server mark out-of-band messages like pub/sub explicitly. Once you are familiar with these byte forms, the next chapter moves into `networking.c` to see how they are parsed and assembled byte by byte.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [implementation](implementation.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
- [implementation](implementation.md)
