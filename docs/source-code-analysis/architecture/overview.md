# Redis Architecture Overview

## Overview

From a source perspective, Redis is a single-process program "with the event loop as its skeleton and the keyspace as its heart." This section gives the architectural panorama: how the main loop drives everything, which functions a single command passes through from raw byte stream to storage, and which source files hold each subsystem.

Everything below is based on Redis 8.0 (7.x is essentially the same), and all commands have been verified on a real instance.

## From main() to the Event Loop

The startup sequence of `main()` (src/server.c) is roughly:

1. `initServerConfig()`: populate the global `server` (`struct redisServer`, defined in src/server.h) with default configuration;
2. parse command-line arguments and load `redis.conf` (src/config.c);
3. `initServer()`: create the event loop, initialize database structures, and register the listening socket and time events;
4. restore data: prefer loading AOF (`aofLoadManifestFromDisk()` + `loadAppendOnlyFiles()` in src/aof.c); otherwise load `dump.rdb` (`rdbLoad()` in src/rdb.c);
5. `aeMain(server.el)` enters the main loop, until `aeStop()` is called.

The entry point for time events is `serverCron()`, registered by `aeCreateTimeEvent()`, running at a default `hz = 10` frequency; it handles background tasks such as expired key cleanup, `save` condition checks, client timeouts, and replication heartbeats:

```bash
$ redis-cli -p 6399 config get hz
1) "hz"
2) "10"
$ redis-cli -p 6399 info server | grep uptime_in_seconds
uptime_in_seconds:1746
```

## A Complete Command Lifecycle

Taking `SET key value` as an example, it passes through this chain of functions:

1. `readQueryFromClient()` (src/networking.c): socket becomes readable, bytes are read into `client->querybuf`;
2. `processInputBuffer()`: splits `argv` per the RESP2/RESP3 protocol;
3. `processCommand()` (src/server.c): looks up the command table and does ACL, memory, read-only replica, and other pre-checks;
4. `call()` → `setCommand()` (src/t_string.c) → `setGenericCommand()` → `lookupKeyWrite()` / `dbAdd()` (src/db.c): actually modify the keyspace;
5. `propagate()`: propagate write commands to AOF and replicas;
6. `beforeSleep()` (src/server.c): before returning to the epoll wait, flush `client->buf` and the output buffer to the client via `writeToClient()` (src/networking.c).

The whole process runs in the main thread (when I/O threads are not enabled), so Redis command execution is inherently serial. This is why transactions, Lua scripts, and single-key atomicity can be implemented so simply.

## Thread and Child Process Division of Labor

| Execution flow | Source location | Responsibility |
| --- | --- | --- |
| Main thread | ae.c / networking.c / server.c | Event loop, protocol parsing, command execution, replies |
| bio background threads | bio.c | Closing files, AOF fsync, lazy free (`BIO_CLOSE_FILE`, `BIO_AOF_FSYNC`, `BIO_LAZY_FREE`) |
| RDB child process | rdb.c | The child forked by `rdbSaveBackground()` writes the snapshot |
| AOF rewrite child process | aof.c | The child forked by `rewriteAppendOnlyFileBackground()` rewrites the AOF |
| I/O threads (optional) | networking.c | Share read, write, and parsing; visible as `io_threads_active` in `INFO server` |

```bash
$ redis-cli -p 6399 info server | grep -E 'io_threads_active|multiplexing_api'
io_threads_active:0
multiplexing_api:epoll
```

## How Data Looks in Memory

- Each client connection is a `client` struct (src/server.h), with one input and one output buffer;
- Each database is a `redisDb`; in 8.0 the keyspace is `kvstore *keys` and the expiry table is `kvstore *expires`;
- Each value is an `robj` (src/object.c), with type, encoding, and reference count;
- All allocations go through src/zmalloc.c, defaulting to jemalloc, observable at runtime via `INFO memory`:

```bash
$ redis-cli -p 6399 info memory | grep -E 'used_memory_human|mem_allocator'
used_memory_human:1.09M
mem_allocator:jemalloc-5.3.0
```

## Observability Points at the Architecture Level

- `INFO server`: process, version, multiplexing API, uptime;
- `INFO clients`: connection count, blocked client count;
- `INFO stats`: `total_commands_processed`, ops per second, network throughput;
- `CLIENT LIST`: each connection's age, idle time, and last command;
- `COMMAND COUNT` / `COMMAND INFO <cmd>`: command table contents.

```bash
$ redis-cli -p 6399 info stats | grep -E 'total_commands_processed|instantaneous_ops_per_sec'
total_commands_processed:45855
instantaneous_ops_per_sec:0
```

## Summary

Redis architecture compresses into one sentence: **one main-thread event loop (ae.c) ties together the network protocol (networking.c), the command table (server.c), and the keyspace (db.c/dict.c), while persistence (rdb.c/aof.c) and slow operations (bio.c, lazyfree.c) are pushed out to thread pools and child processes**. Following this main line when looking at specific subsystems lets you place them in the overall architecture.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [components](components.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [components](components.md)
