# Concurrency Control

## Overview

Redis has no row locks and no MVCC, yet it has to face tens of thousands of clients at once. Its answer is: **run every command serially in a single thread, and provide concurrency primitives at the semantic layer** — atomic commands, transactions, optimistic locking, atomic script execution, and asynchronous deletion. This chapter dissects the source implementation and observed behavior of each of these mechanisms.

## Single-command atomicity

Because `call()` runs only one command at a time, any command sees the state "after the previous command has fully finished": `INCR`'s read-modify-write is never interleaved, and the same holds for `HINCRBYFLOAT`. The source needs no locks at all (`server.db` and similar structures are accessed only from the main thread), which is also why there is almost no mutex protection around the keyspace in Redis code. The only shared state is handled with atomic variables (`redisAtomic`) or short critical sections, such as the bio counters and `INFO` statistics.

## Transactions: MULTI/EXEC and multi.c

The transactions implemented in `multi.c` are "deferred execution + ordering guarantees":

1. `MULTI` (`multiCommand()`, around line 92) sets the `CLIENT_MULTI` flag on the client;
2. subsequent commands no longer enter `call()`; instead `queueMultiCommand()` (around line 40) appends them to `c->mstate.commands` and replies `QUEUED`;
3. `EXEC` (`execCommand()`, around line 128) first checks `CLIENT_DIRTY_EXEC` (an enqueue-time error, or a `WATCH`ed key was modified); if clean, it executes each command in turn, then propagates them as a single `MULTI...EXEC` block to replicas and the AOF.

Observed handling of enqueue-time errors:

```text
MULTI       ->  +OK
GET         ->  -ERR wrong number of arguments for 'get' command
EXEC        ->  -EXECABORT Transaction discarded because of previous errors.
```

Execution-time errors (for example `INCR` on a string key) affect only that one command; they do not roll back earlier commands.

## Optimistic locking: WATCH

`WATCH` (`watchCommand()`, `multi.c` around line 459) registers the key in two places: the client-side `client->watched_keys` linked list and the database-side `db->watched_keys` dict (key -> `watchedKey` list). When any write command finishes, `signalModifiedKey()` (`db.c` around line 730) calls `touchWatchedKey()`, which sets `CLIENT_DIRTY_CAS` on clients watching that key; `EXEC` sees the flag and returns a nil array immediately. Observed with two connections (local self-hosted instance):

```text
A: WATCH bd:watched   ->  +OK
B: SET bd:watched x   ->  +OK
A: MULTI / SET bd:watched a ->  +OK / +QUEUED
A: EXEC               ->  *-1        (nil, transaction abandoned)
```

The second, uninterrupted `EXEC` returns `*1\r\n+OK\r\n`. `UNWATCH` clears the registration; on disconnect `unwatchAllKeys()` cleans up as a backstop. Combined with `MULTI` this mechanism is a CAS loop, suitable for low-contention scenarios.

## Script atomicity and timeout

Lua scripts (`EVAL`/`EVALSHA`) run exclusively in the main thread; other clients queue up in the meantime. To prevent runaway scripts, after `busy-reply-threshold` (formerly `lua-time-limit`; both default to 5000ms, and an observed `CONFIG GET busy-reply-threshold lua-time-limit` returns 5000 for both) times out:

- the server starts replying `-BUSY Redis is busy running a script...` to other clients;
- only `SCRIPT KILL` (usable while the script has not yet performed a write) or `SHUTDOWN NOSAVE` can terminate it;
- note that the `EVAL` command itself has no TIMEOUT argument, so you cannot set a deadline for an individual script.

The timeout check lives in the script engine's `scriptInterrupt()` (`script.c` around line 120): the script is timed on every callback, and once it exceeds `server.busy_reply_threshold` it enters the BUSY state; if the script is already locked by the replication context, it returns `-UNKILLABLE`.

## Blocking commands: blocked.c

`BLPOP`/`BRPOP`/`BLMOVE`/`BZPOPMIN` and `XREAD BLOCK` do not busy-wait. `blockForKeys()` (`blocked.c` around line 379) removes the client from the event loop and registers it in a "key -> waiters" dict; when a key is written to, `signalKeyAsReady()` (around line 562) puts the key into `db->ready_keys`, and `handleClientsBlockedOnKeys()` (around line 326) wakes the waiters to retry during the wrap-up phase after command execution. `blockClient()`/`unblockClient()` (lines 68/165) handle the flags and timeout processing.

How to observe it (local self-hosted instance):

```bash
$ redis-cli -p 16390 blpop bd:nosuch 1     # observe from another connection
$ redis-cli -p 16390 info clients | grep blocked
blocked_clients:1
```

On timeout it returns a nil value: the raw bytes observed are `*-1\r\n` (nil array) in RESP2 and `_\r\n` (null) in RESP3.

## Pause and rate-limiting controls

- `CLIENT PAUSE <ms> [WRITE|ALL]`: a global pause; an observed 400ms pause turned `PING` from sub-millisecond to 315ms. Failover scripts use it to freeze writes.
- `CLIENT KILL` / connection timeout (the `timeout` config): force-collect clients from the `serverCron` side.
- `min-replicas-to-write`/`min-replicas-max-lag`: reject writes when replicas are insufficient (observed to return `-NOREPLICAS Not enough good replicas to write.`); a concurrency switch that trades availability for consistency.

## Asynchronous deletion: UNLINK and lazy freeing

Synchronously deleting a large key can cause stalls of milliseconds, even seconds. `UNLINK` only removes the key from the keyspace; the actual memory release happens in the `BIO_LAZY_FREE` thread (`freeObjAsync()`/`lazyfreeFreeObject()` in `lazyfree.c`; `dbAsyncDelete()` in `db.c`). Whether to free at all is estimated by `lazyfreeGetFreeEffort()` — small objects are still deleted synchronously, since the thread switch would not be worth it. Observed: the `UNLINK` command itself for a hash with 500k fields returned in about 31ms, the `lazyfreed_objects` counter went up by one, and memory then dropped from 14.48MB to 1.41MB. `lazyfree-lazy-expire` and `lazyfree-lazy-server-del` (both default to `no`) can also make expiry and implicit deletion asynchronous.

## Summary

Redis's concurrency control is layered: the lowest layer eliminates races through single-threaded execution; the middle layer provides transactions and CAS via `MULTI/EXEC + WATCH`; the upper layer controls latency and availability through blocking commands, pauses, replica watermarks, and asynchronous deletion. When reading the source, grab two entry points — the pre-checks in `processCommand()` and the suspend/resume in `blocked.c` — and you can explain most of the "concurrency behavior as seen from the client".

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [model](model.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [model](model.md)
