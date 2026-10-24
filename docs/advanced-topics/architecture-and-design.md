# Redis architecture and design

Redis is an in-memory key-value database whose design goal is to deliver sub-millisecond read and write latency while keeping things simple and reliable. The overall architecture helps you analyze slow queries, blocking, and persistence-related jitter in day-to-day operations.

## Top-level structure

The Redis server can be roughly divided into four layers:

1. **Network layer**: an event-driven model based on I/O multiplexing (epoll/kqueue/select), responsible for listening on connections, reading requests, and writing back responses.
2. **Protocol layer**: parses the RESP (REdis Serialization Protocol) protocol, turning the byte stream sent by the client back into commands and arguments.
3. **Command execution layer**: looks up the command implementation function via the command table (`redisCommandTable` in Redis 7.0 and later), then performs argument validation, permission checks, and execution.
4. **Storage layer**: the keyspace composed of various data structures (SDS, dictionaries, skiplists, listpack, and so on), together with expiration, eviction, persistence, replication, and other mechanisms.

## Single-threaded model

Redis command execution is single-threaded: all client commands run serially in one main thread. This gives two important properties:

- **No locking needed**: commands are naturally mutually exclusive, so compound operations such as `INCR` are naturally atomic.
- **No slow operations allowed**: any time-consuming command (for example, running `KEYS`, `SMEMBERS`, or `HGETALL` on a key with millions of members) blocks every subsequent request — this is the fundamental reason `KEYS` is banned in production and large keys must be split.

Single-threaded does not mean the whole process has only one thread. The following work happens in other threads:

- **Background threads**: since Redis 4.0, `UNLINK` (asynchronous deletion of large keys), the fsync flush of `BGREWRITEAOF`/`BGSAVE`, and similar tasks are handled by background threads.
- **I/O threads**: since Redis 6.0, `io-threads` can be configured so that network reads/writes and protocol parsing run in parallel; command execution still stays on the main thread.

## Event loop

Redis uses its own event library (ae.c) to wrap the operating system's I/O multiplexing. The main loop handles two kinds of events:

- **File events**: a socket becomes readable/writable, meaning a client request has arrived or a response can be sent;
- **Time events**: periodic tasks, such as active expiration of keys (`activeExpireCycle`), cluster heartbeats, `replCron`, and the like.

Each round of the main loop first handles time events that are due, then handles file events; the events are independent of each other, so any callback that takes too long drags up overall latency.

## The relationship between in-memory storage and persistence

All data lives in memory; persistence (RDB/AOF) is only the mechanism that asynchronously writes the in-memory state to disk:

- RDB uses `BGSAVE` to fork a child process to produce a snapshot, relying on copy-on-write (COW) to avoid blocking the main thread;
- AOF appends to a buffer on the main thread, and a background thread performs the fsync.

So the trade-off in persistence configuration is essentially between "how much data we can afford to lose on a crash" and "the latency spikes caused by fork and flush."

## Interaction with clients

The protocol between a client and Redis is a simple request-response one, with two batch optimizations supported at the same time:

- **Pipelining**: the client sends multiple commands at once, and the server replies in order, saving network round trips (RTT);
- **Transactions/scripts**: `MULTI/EXEC` guarantees serial execution of commands, while a Lua script bundles multiple commands into a single atomic operation in one round trip.

## Summary

"In-memory storage + single-threaded command execution + event-driven I/O" are the three pillars of Redis' high performance, and they are also the root of its usage constraints (avoid slow commands, avoid large keys, data volume is limited by memory). For more implementation details, see [core data structures and algorithms](core-data-structures.md) and [command execution and event handling](command-execution.md).

## References

- [Redis source repository](https://github.com/redis/redis)
- [server.h (core data structures)](https://github.com/redis/redis/blob/unstable/src/server.h)

## Related pages

- [README](README.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
