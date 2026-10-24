# Multithreading and Concurrency Control

## Overview

The statement "Redis is single-threaded" needs to be made precise: **command execution is single-threaded**, but I/O reads and writes, background tasks, and persistence child processes are not. Understanding which code runs on which thread is a prerequisite for analyzing performance and concurrency problems. This chapter gives the full picture; the *Thread Model* and *Concurrency Control Mechanisms* chapters develop the details.

## Thread landscape

| Thread | Introduced in | Responsibility | Source |
|--------|---------------|----------------|--------|
| Main thread | - | Event loop (`aeMain`), command execution (`call`), expiry and eviction | `ae.c`, `server.c` |
| I/O thread | 6.0 | Network read/write and protocol parsing in parallel (8.0 rewrote this so each thread owns its own event loop) | `iothread.c`, `networking.c` |
| bio thread | 2.6 | Closing files, AOF fsync, lazily freeing large objects | `bio.c` |
| Child process | - | BGSAVE (`fork` + copy-on-write), AOF rewrite, module fork | `rdb.c`, `aof.c` |

## I/O threads: io-threads

Redis 6.0 introduced `io-threads`, parallelizing "read request - parse" and "write reply"; command execution remains concentrated in the main thread, so the data structures do not need to be locked. Key configuration:

- 6.x/7.x: `io-threads N` (default 1, i.e. off); `io-threads-do-reads` defaults to `no`, meaning reads stay in the main thread and only writes are multithreaded. Both are `IMMUTABLE_CONFIG` in `config.c`, so changing them requires a restart.
- 8.0: the I/O thread model is rewritten (`src/iothread.c`, each thread owns its own event loop and clients are assigned to threads by `assignClientToIOThread()`); `io-threads-do-reads` is removed, and `io-threads` still cannot be changed online.

Measured on Redis 8.0.5:

```bash
$ redis-cli -p 6399 config get io-threads
io-threads
1
$ redis-cli -p 16390 config set io-threads 4
ERR CONFIG SET failed (possibly related to argument 'io-threads') - can't set immutable config
$ redis-cli -p 6399 info server | grep -E 'multiplexing_api|io_threads'
multiplexing_api:epoll
io_threads_active:0
```

`io_threads_active:0` means the thread pool is on standby (it is not woken when the load is too low); the `io-thread=` field in `CLIENT LIST` shows which thread each client is assigned to, all 0 when disabled.

## Background threads: bio

`bio.c` maintains three task queues (their numbers are fixed in `bio.h`):

- `BIO_CLOSE_FILE`: asynchronously `close()`s files, avoiding blocking when deleting large files;
- `BIO_AOF_FSYNC`: the AOF `fdatasync`, paired with `appendfsync everysec`;
- `BIO_LAZY_FREE`: lazily frees large objects (`UNLINK`, `FLUSHDB ASYNC`, expiry/eviction of large keys).

The effect of `UNLINK` is directly observable: build a hash with 500,000 fields, delete it, and `lazyfreed_objects` in `INFO memory` goes from 0 to 1, memory usage drops from 14.48MB to 1.41MB, while the command itself returns within 31ms (measured locally).

## Child processes and copy-on-write

Both RDB save and AOF rewrite create child processes with `fork()`: the parent and child start sharing physical memory pages, and only written pages are actually copied (copy-on-write). The cost of BGSAVE therefore depends mainly on "write frequency," not dataset size; `current_cow_size`/`rdb_last_cow_size`/`aof_last_cow_size` in `INFO persistence` record the scale of the copy, and fork duration and count are `latest_fork_usec`/`total_forks` in `INFO stats`.

## Concurrency control: trading single-threadedness for locks

Precisely because command execution is serial, Redis can deliver:

- Single-command atomicity: `INCR` and `HINCRBY` do not need CAS;
- Transactions queue execution with `MULTI`/`EXEC` and use `WATCH` for optimistic locking (`multi.c`; on conflict `EXEC` returns nil);
- Blocking commands (`BLPOP` and so on) park the client on `blocked.c`'s wait queue and are woken by `signalKeyAsReady()` when the key changes; the main thread remains the only executor;
- Lua scripts monopolize the server while running; after a timeout (`busy-reply-threshold`, formerly `lua-time-limit`, default 5000ms) other clients receive `-BUSY`, which can be handled with `SCRIPT KILL` (when the script has not yet written data) or `SHUTDOWN NOSAVE`. Note that `EVAL` itself has no TIMEOUT option.

## Operational observation points

```bash
redis-cli -p 6399 info clients          # connection count, blocked_clients
redis-cli -p 6399 client list | head -3 # the io-thread=, flags=, multi= fields, etc.
redis-cli -p 6399 info memory | grep lazy   # lazyfree_pending_objects / lazyfreed_objects
redis-cli -p 6399 info persistence | grep -E 'rdb_bgsave_in_progress|latest_fork_usec'
```

## Summary

Redis's concurrency model in one sentence: **single-threaded data plane (lock-free), multithreaded control plane (I/O, background tasks, child processes)**. I/O threads extend network throughput, bio isolates the "dirty work," and fork extends the parallelism of persistence; and every modification to the data structures is performed only by the main thread. The next two chapters dive into thread creation and scheduling details, and into the concurrency-control primitives built on top of this model.

## References

- [Redis source repository](https://github.com/redis/redis)
- [bio.c (background threads)](https://github.com/redis/redis/blob/unstable/src/bio.c)
- [networking.c](https://github.com/redis/redis/blob/unstable/src/networking.c)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
