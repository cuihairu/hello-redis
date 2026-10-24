# Redis Overall Architecture

## Overview

Redis is an in-memory key-value database, and its overall architecture can be summarized as: **single-threaded command execution + event-driven model + I/O multiplexing**. Unlike traditional multithreaded databases, Redis performs command parsing, execution, and reply sending sequentially in the main thread, avoiding lock contention and context-switch overhead; slow operations such as disk I/O (AOF fsync, closing files) and freeing large objects are handed off to background threads. This section walks through Redis's layered structure and how its subsystems cooperate, from a source perspective.

When reading this, it helps to consult the `src/` directory of the [redis/redis repository](https://github.com/redis/redis). The file and function names here are based on the 8.0 branch (7.x is essentially the same).

## Process and Thread Model

A `redis-server` process contains the following execution flows:

- **Main thread**: runs the event loop `aeMain()` (src/ae.c), responsible for reading, executing, and replying to all client commands.
- **Background threads (bio)**: created by `bioInit()` (src/bio.c), handling tasks such as `BIO_CLOSE_FILE` (closing old files from a rewrite), `BIO_AOF_FSYNC` (AOF fsync), and `BIO_LAZY_FREE` (asynchronously freeing large objects); 8.0 also adds job types such as `BIO_CLOSE_AOF`.
- **Child processes**: created by `rdbSaveBackground()` (src/rdb.c) and `rewriteAppendOnlyFileBackground()` (src/aof.c) via `fork()`, handling RDB snapshots and AOF rewrites respectively.
- **Optional I/O threads**: when `io-threads` is set greater than 1, socket read/write and protocol parsing can be spread across multiple threads in parallel (8.0 rewrote this async I/O threading implementation), but command execution remains fixed in the main thread to preserve single-threaded semantics.

You can use `INFO` to observe whether these execution flows are working:

```bash
$ redis-cli -p 6399 info server | grep -E 'redis_version|multiplexing_api'
redis_version:8.0.5
multiplexing_api:epoll
$ redis-cli -p 6399 info clients | grep connected_clients
connected_clients:1
```

## Event Loop and Command Path

The core of the main thread is `aeEventLoop` (src/ae.c):

1. `main()` (src/server.c) calls `initServerConfig()` and `initServer()` in turn to initialize configuration and server state;
2. `initServer()` binds the `AE_READABLE` event of the listening socket to the accept callback via `aeCreateFileEvent()` (`connSocketAcceptHandler` in src/socket.c, which internally creates clients through `acceptCommonHandler()` in src/networking.c), and registers the time event `serverCron()` via `aeCreateTimeEvent()`;
3. `aeMain()` loops calling `aeProcessEvents()`, whose underlying layer uses `aeApiPoll()` (an epoll wrapper on Linux) to wait for ready events;
4. When a client is readable, `readQueryFromClient()` (src/networking.c) runs, the data is parsed into `argv` per the RESP protocol in `processInputBuffer()`, and then enters `processCommand()` for table lookup and execution;
5. Command handler functions (such as `setCommand` in src/t_string.c) access the keyspace via `lookupKeyWrite()` (src/db.c); after writing, `writeToClient()` inside `beforeSleep()` flushes the reply buffer to the client.

The `COMMAND` family of commands can inspect this command table at runtime (in 8.0 the command table is defined as `redisCommandTable`):

```bash
$ redis-cli -p 6399 command count
(integer) 265
$ redis-cli -p 6399 command info get
get
2
readonly
fast
1
1
1
@read
@string
@fast
...
```

(The `COMMAND INFO` return includes the command name, arity, flags, parameter count, and command group, ending with ACL readability and key position specs; `...` marks omitted trailing fields.)

## Keyspace and Object System

All key-value pairs live in `redisDb` (src/server.h). In 8.0 the keyspace has evolved from a single `dict` into two sharded hash collections: `kvstore *keys` and `kvstore *expires`, the former holding data and the latter holding expiry times. Every value is an `robj` (`createObject()` in src/object.c), with its lifecycle managed by reference counting, and the underlying encoding can be sds, listpack, quicklist, skiplist, intset, rax, and so on. This two-layer "type + encoding" design is the main thread for understanding Redis source; see the Data Structures section in this part for details.

## Persistence and Memory Subsystems

- **Persistence**: RDB is implemented in src/rdb.c (`rdbSave()`, `rdbSaveBackground()`, `rdbLoadRio()`); AOF is implemented in src/aof.c (`feedAppendOnlyFile()`, `flushAppendOnlyFile()`, `rewriteAppendOnlyFileBackground()`). Both rely on `fork()` and copy-on-write (COW).
- **Memory**: src/zmalloc.c wraps malloc with a unified interface (`zmalloc()`, `zfree()`, `zmalloc_used_memory()`) and tracks the various `INFO memory` metrics; the default allocator is jemalloc.
- **Expiry and eviction**: `expireIfNeeded()` in src/db.c handles lazy deletion, `activeExpireCycle()` in src/expire.c handles periodic deletion, and once memory reaches `maxmemory`, `performEvictions()` in src/evict.c evicts according to the policy.

```bash
$ redis-cli -p 6399 info memory | grep -E 'used_memory_human|mem_allocator'
used_memory_human:1.09M
mem_allocator:jemalloc-5.3.0
```

## Common Commands for Observing Architectural Behavior

- `INFO <section>`: inspect server, clients, memory, persistence, stats, keyspace, and other subsystem states.
- `CLIENT LIST` / `CLIENT ID`: observe client connections and command processing state.
- `LATENCY LATEST`: view recorded latency events.
- `CONFIG GET hz`: view the `serverCron()` execution frequency (10 times per second by default).

```bash
$ redis-cli -p 6399 config get hz
1) "hz"
2) "10"
$ redis-cli -p 6399 info stats | grep instantaneous_ops_per_sec
instantaneous_ops_per_sec:1
```

## Summary

The key words for Redis's overall architecture are "layering" and "cooperation": the main thread uses the event loop to tie together network I/O and command execution, guaranteeing atomicity and predictable latency within a single thread; background threads and child processes take on slow I/O and persistence; memory allocation, the object system, and the keyspace act as shared infrastructure supporting every upper-layer command. Reading the `main()` → `aeMain()` main line in `server.c`, then drilling down the command path `readQueryFromClient()` → `processCommand()` → `call()`, covers most of the Redis source.

## References

- [Redis source repository](https://github.com/redis/redis)
- [server.h (core data structures)](https://github.com/redis/redis/blob/unstable/src/server.h)

## Related pages

- [cluster](cluster.md)
- [command-processing](command-processing.md)
- [modules](modules.md)
- &#8203;performance<!-- EN-LINK: performance.md -->
- [persistence](persistence.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [cluster](cluster.md)
- [command-processing](command-processing.md)
- [modules](modules.md)
- &#8203;performance<!-- EN-LINK: performance.md -->
- [persistence](persistence.md)
