# Command parsing

## Overview

Command parsing solves one problem: slicing the byte stream into `argv`. Redis supports two request formats — the inline protocol used for manual debugging and the multibulk protocol required by clients — and both are dispatched by first byte in `processInputBuffer()` in `networking.c`. The parser is "interruptible": when the buffer holds only a partial request, its state is saved and resumed on the next read event, never blocking the event loop.

## Inline protocol: processInlineBuffer

`processInlineBuffer()` (around line 2341) handles requests with no `*` prefix, typically from `nc`/`telnet`:

```bash
$ printf 'PING\r\n' | nc 127.0.0.1 6399
+PONG
$ printf 'SET bd:proto v1\r\nGET bd:proto\r\n' | nc 127.0.0.1 6399
+OK
$2
v1
```

The implementation splits on whitespace with `sdssplitargs()` and supports quote-wrapped arguments. Two hard limits:

- a single line longer than `PROTO_INLINE_MAX_SIZE` (64KB) is cut directly;
- mismatched quotes or an illegal escape report `-ERR unbalanced quotes in request`.

Because it splits on spaces, the inline protocol cannot naturally express arguments containing spaces — `ECHO hello world` is split into 3 arguments and returns `-ERR wrong number of arguments for 'echo' command` (local measured).

## Multibulk protocol: processMultibulkBuffer

`processMultibulkBuffer()` (around line 2459) is the real parsing workhorse, advancing state in two layers:

```text
*3\r\n          <- multibulklen = 3
$3\r\nSET\r\n   <- bulklen = 3, take 3 bytes starting from qb_pos
$4\r\nbd:k\r\n
$2\r\nv1\r\n
```

Key implementation details:

1. **State lives on the client**: `c->multibulklen` (how many arguments remain) and `c->bulklen` (how many bytes the current argument still needs). When the buffer runs out of data, it simply `break`s and waits for the next read event, never rescanning the part already parsed (the `qb_pos` cursor advances).
2. **The normal path copies**: once the data is complete it goes through `createStringObject(querybuf + qb_pos, bulklen)`, copying the argument into an independent `robj` string, and the querybuf cursor skips past `bulklen+2`.
3. **Zero-copy for large arguments**: when all of "not a replication client, `qb_pos == 0`, `bulklen >= PROTO_MBULK_BIG_ARG` (32KB), and the buffer holds exactly this one remaining argument" hold, the sds pointer of querybuf is handed directly to `argv[i]`, then `sdsnewlen` allocates a fresh buffer to keep parsing, avoiding a whole-block copy of a large value. The argument body lengths are written into `c->argv_len_sum`.
4. **Legality checks**: if `*N` is not a number or exceeds `INT_MAX`, `$len` is negative or exceeds `proto-max-bulk-len` (default 512MB), or an unauthenticated client sends more than 10 arguments or a single argument over 16384 bytes, `read_error` is set and the connection is closed; the protocol error log prints the buffer contents near the error position using `PROTO_DUMP_LEN` (128 bytes), making it easy to locate a client bug.

## Parsing errors and command lookup failures

After a successful parse, lookup begins; when `lookupCommand()` finds nothing it returns a helpful error (measured):

```text
NOSUCHCMD                    ->  -ERR unknown command 'NOSUCHCMD', with args beginning with:
GET foo (too many arguments) ->  -ERR wrong number of arguments for 'get' command
```

Note the difference between the two kinds of failure: a parsing error happens before `argv` is sliced (protocol layer), while arity/unknown-command errors happen at the `processCommand()` check stage (semantic layer). Inside a `MULTI` transaction the latter only marks `CLIENT_DIRTY_EXEC`, causing `EXEC` to return `EXECABORT Transaction discarded because of previous errors.`, whereas the former (a protocol error) closes the connection outright.

## Pipelining: sending many commands at once

The parser naturally supports "many requests packed into one buffer" — that is the foundation of pipelines. This can be verified with `redis-cli --pipe` (it reads in all the commands, sends them, and then tallies the replies):

```bash
$ printf 'SET bd:pipe1 1\r\nGET bd:pipe1\r\nDEL bd:pipe1\r\n' | redis-cli -p 6399 --pipe
All data transferred. Waiting for the last reply...
Last reply received from server.
errors: 0, replies: 3
```

Compared with one round trip at a time, 200 SETs dropped from 19.7ms to 1.9ms in a local measured run — the entire gain comes from fewer network round trips and fewer system calls, while the server-side parsing logic is identical.

## Observing the state machine with a raw socket

The byte sequence below demonstrates how the parser waits when "half a request arrives first and the rest arrives later" (the parser does not error between the two `send` calls; it executes only once the data is complete):

```bash
python3 - <<'EOF'
import socket
s = socket.create_connection(("127.0.0.1", 6399), timeout=2)
s.sendall(b'*2\r\n$4\r\nECHO\r\n')      # command name only, argument missing
import time; time.sleep(0.2)
s.sendall(b'$5\r\nhello\r\n')           # argument supplied
print(s.recv(64))                       # b'$5\r\nhello\r\n'
EOF
```

## Summary

Command parsing is the process of translating a "protocol specification" into a "state machine": two entry points (inline/multibulk), two cursors (`qb_pos`, `bulklen`), and two performance paths (fast copy for small arguments, zero-copy for large ones). It promises the layer above "one complete argv per return", and promises the layer below "never block waiting for data". Once you understand that, the boundary in the event loop between "where you read to" and "where you execute to" is clear.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [execution](execution.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [execution](execution.md)
