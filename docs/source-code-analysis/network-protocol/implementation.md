# Implementation Details

## Overview

Behind the protocol format is a buffer-management scheme built around the `client` struct: the input side has a query buffer (querybuf), and the output side has a static reply buffer and a reply linked list. This chapter walks `networking.c` (about 4600 lines in 8.0) along the path of "one request from the network card to the reply being written out," and gives metrics you can observe on a local instance.

## Read path: readQueryFromClient

When a client socket is readable, the event loop calls `readQueryFromClient()` (around line 2900 in 8.0):

1. Reserve a read buffer of `readlen = PROTO_IOBUF_LEN` (16KB); if that client was parsing a large argument last round (`bulklen >= PROTO_MBULK_BIG_ARG`, 32KB), grow the buffer directly to the argument size, avoiding repeated reallocations.
2. `read()` into `c->querybuf` (an sds string), updating `c->last_interaction`.
3. Call `processInputBuffer()`: loop calling `processInlineBuffer()` or `processMultibulkBuffer()`, and for each complete command parsed, `processCommandAndResetClient()` -> `processCommand()`.
4. If a parsed argument body exceeds `proto-max-bulk-len` (default 512MB, measured `CONFIG GET proto-max-bulk-len` returns 536870912), disconnect; the total query buffer is limited by `client-query-buffer-limit` (default 1GB, measured 1073741824), and the single-line limit for inline requests is `PROTO_INLINE_MAX_SIZE` (64KB).

## Parser: processMultibulkBuffer

`processMultibulkBuffer()` (around line 2459) advances the state machine in two stages:

- First read `*N\r\n` to get the argument count `multibulklen`, then parse each `$len\r\n`;
- Normal arguments get a new sds copied out from querybuf; when the argument body reaches `PROTO_MBULK_BIG_ARG` (32KB, the constant defined in `server.h`), take the "zero-copy" path: first trim querybuf down to the argument start with `sdsrange`, and when only this argument body remains in the buffer, hand the querybuf's sds pointer directly to `argv[i]`, saving one large memory copy.

These two paths explain why Redis parsing a large value (such as a 1MB SET) does not cause an obvious memory doubling. The sign that parsing is complete is `processMultibulkBuffer()` consuming all `multibulklen` arguments and returning `C_OK`; then `processInputBuffer()` removes the consumed bytes with `sdsrange(c->querybuf, c->qb_pos, -1)` and zeroes `qb_pos`, avoiding large blocks staying resident long-term — the `qbuf`/`qbuf-free` fields in `CLIENT LIST` are the watermark of this space:

```text
id=4296 ... qbuf=26 qbuf-free=20448 argv-mem=10 ... rbs=16384 rbp=16384 ...
```

## Write path: prepareClientToWrite and the reply buffer

The `addReply*` family first goes through `prepareClientToWrite()` (around line 328) to mark the client as "has replies pending," then calls `addReplyToBufferOrList()`:

- Prefer writing into the static reply buffer `c->buf` (16KB, corresponding to `obl` in `CLIENT LIST`);
- If it does not fit, append to the `c->reply` reply linked list (corresponding to `oll` and the total bytes in `omem`).

The actual write-out happens in the event loop's `beforeSleep`: `handleClientsWithPendingWrites()` (around line 2214 in `networking.c`) first tries `writeToClient()` directly (around line 2116), and only registers an AE_WRITABLE write event when it cannot write everything (kernel send buffer full), waiting for the next writable event to continue. In `CLIENT LIST`, `events=r` means only a read event is attached; the appearance of `w` means that client has entered the "cannot write everything" state.

## Output buffer limits

To prevent slow clients from dragging down memory, each client type has an independent output buffer limit (`client-output-buffer-limit`):

```bash
$ redis-cli -p 6399 config get client-output-buffer-limit
normal 0 0 0 slave 268435456 67108864 60 pubsub 33554432 8388608 60
```

Meaning: normal clients are unlimited; replica-type clients have a hard limit of 256MB and a soft limit of 64MB sustained for 60 seconds before disconnecting; pubsub-type is 32MB/8MB/60 seconds. The check logic runs in the `serverCron` cycle, and clients over the limit are closed asynchronously.

## Multithreaded I/O integration point

6.0 introduced io-threads; 8.0 refactored them into "an independent event loop per thread" and split them out into `src/iothread.c`: `assignClientToIOThread()` assigns a client to some I/O thread, and each thread completes reading and parsing on its own `aeEventLoop`, while command execution remains centralized on the main thread (`enqueuePendingClientsToMainThread()` queues the parsed clients back for return). The `io-thread=0` field in `CLIENT LIST` shows client ownership, 0 meaning the main thread; with multithreaded I/O not enabled, all are 0.

## Measured: observing buffer and connection metrics

```bash
# Connection count, blocked count, max client count
redis-cli -p 6399 info clients

# Input/output buffer and memory usage of a single connection
redis-cli -p 6399 client list | head -3

# In a RESP3 session (redis-cli -3), the resp field is 3
redis-cli -3 -p 6399 client info | tr ' ' '\n' | grep resp=

# Bulk-inject commands, observe --pipe reaping all replies at once
printf 'SET bd:pipe1 1\r\nGET bd:pipe1\r\nDEL bd:pipe1\r\n' | redis-cli -p 6399 --pipe
# All data transferred. Waiting for the last reply...
# Last reply received from server.
# errors: 0, replies: 3
```

## Summary

The design points of `networking.c` can be summarized in three sentences: reads use an elastic sds buffer and grow on demand; parsing is a stateful, interruptible state machine (an incomplete request waits for the next read event); output goes to a static buffer first, then a linked list, and is protected by per-category limits. Corresponding the `qbuf/obl/oll/omem` fields of `CLIENT LIST` to these three mechanisms, you can validate your understanding at any time with production data while reading the source.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [protocol-overview](protocol-overview.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [protocol-overview](protocol-overview.md)
