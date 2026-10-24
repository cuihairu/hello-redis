# Thread Model

## Overview

A Redis process contains only a small handful of threads, but each class has a clear division of labor. This chapter walks through thread creation, wake-up, and cooperation in the order "main event-loop thread -> I/O threads -> bio background threads -> persistence child processes"; all function names and constants are taken from the 8.0 source.

## Main thread and event loop

The main thread runs inside the event loop implemented in `ae.c`: `initServer()` creates `server.el`, registers the `beforeSleep`/`afterSleep` callbacks (`aeSetBeforeSleepProc()`), and then `aeMain()` (`ae.c` around line 492) enters an infinite loop:

```c
void aeMain(aeEventLoop *eventLoop) {
    eventLoop->stop = 0;
    while (!eventLoop->stop) {
        aeProcessEvents(eventLoop, AE_ALL_EVENTS|AE_CALL_BEFORE_SLEEP|AE_CALL_AFTER_SLEEP);
    }
}
```

`aeProcessEvents()` (around line 360) does four things per round: process due time events, `aeApiPoll()` waiting for I/O events (the epoll wrapper is in `ae_epoll.c`), run the read callback (`readQueryFromClient`), and run the write callback. The core of time events is `serverCron()` (`server.c` around line 1376), which runs `hz` times per second by default (default 10; an observed `CONFIG GET hz` returns 10), handling periodic work such as expired-key sampling, client timeouts, output buffer checks, and `BGSAVE` startup.

The multiplexing backend is chosen at compile time: Linux uses `ae_epoll.c`, BSD/macOS uses `ae_kqueue.c`, with `ae_select.c` as the fallback. You can confirm it at runtime from `INFO server`:

```text
multiplexing_api:epoll
```

## I/O threads: two shapes from 6.0 to 8.0

**6.0/7.x shape**: the main thread and the `io-threads` worker threads share a single pending-client list. In the write phase the main thread assigns clients to each thread for `writeToClient()`; the read phase can optionally parallelize `readQueryFromClient()` + parsing (controlled by `io-threads-do-reads`, default `no`). Note that both of these configs have been registered as `IMMUTABLE_CONFIG` since 6.0 (see `config.c`), so changes only take effect after a restart and cannot be set via `CONFIG SET`.

**8.0 shape**: the refactored `src/iothread.c` gives each I/O thread its own event loop (the `IOThread` struct); clients are bound to a thread via `assignClientToIOThread()`, where both reading and parsing complete, then `enqueuePendingClientsToMainThread()` hands the client back to the main thread for command execution; replies are still written out by each thread. Both reading and writing are parallel, so the old `io-threads-do-reads` was removed, and `io-threads` is now an immutable config that requires a restart.

Observed on 8.0.5 (`CONFIG SET` executed on a self-hosted instance):

```bash
$ redis-cli -p 6399 config get io-threads
io-threads
1
$ redis-cli -p 16390 config set io-threads 4
ERR CONFIG SET failed (possibly related to argument 'io-threads') - can't set immutable config
$ redis-cli -p 6399 info server | grep io_threads
io_threads_active:0
$ redis-cli -p 6399 client list | head -1
id=4296 ... io-thread=0 ...
```

`io_threads_active:0` and `io-thread=0` indicate a pure single-threaded state. 8.0's `initThreadedIO()` (`iothread.c`) returns immediately without creating any threads when `io_threads_num <= 1`, leaving `io_threads_active` at 0; once `io-threads > 1`, it is set to 1 at startup and an independent event loop is created for each thread (thread numbers 1 through N-1, with 0 reserved for the main thread), and exceeding the `IO_THREADS_MAX_NUM` limit causes an immediate exit at startup.

## bio: three background threads

`bioInit()` in `bio.c` creates `BIO_NUM_OPS` pthreads at server startup, each consuming its own job linked list:

| Job type | Value | Typical source |
|----------|-------|----------------|
| `BIO_CLOSE_FILE` | 0 | Deleting AOF/RDB files and temporary files |
| `BIO_AOF_FSYNC` | 1 | Flushing `appendfsync everysec/always` to disk |
| `BIO_LAZY_FREE` | 2 | `UNLINK`, `FLUSHDB ASYNC`, large-key expiry/eviction |

The job submission interface is `bioSubmitJob()`; lazy freeing uses `bioCreateLazyFreeJob()` (which takes a free function and an argument), and file closing uses `bioCreateCloseJob()`. Threads synchronize with the main thread via a mutex plus condition variable, and the `bio_jobs_counter[]` counters are atomic variables, so the main thread only needs an atomic read to tell whether a queue is backing up. `lazyfree_pending_objects` in `INFO memory` is exactly the backlog of the `BIO_LAZY_FREE` queue (observed locally: it grew from 0 after UNLINK and then returned to zero, with `lazyfreed_objects` incrementing by one).

## Persistence child processes

`redisFork()` (`server.c`) creates a child process to run `rdbSaveBackground()` (`rdb.c`) or an AOF rewrite. Child and parent share physical pages, and a page is copied by the kernel only when written (copy-on-write), so the fewer writes the parent makes, the less extra memory after the fork. Child exit is reaped by the main thread in `checkChildrenDone()`, called from `serverCron()`, using `waitpid(-1, &statloc, WNOHANG)`, and it updates `INFO persistence` fields such as `rdb_last_bgsave_status`, `rdb_bgsave_in_progress`, and `aof_rewrite_in_progress`.

## Client pause: another form of "thread coordination"

`CLIENT PAUSE <timeout>` makes the main thread suspend all (or write-type) commands in `beforeSleep`; it is commonly used during failover to guarantee topology consistency. Observed locally (self-hosted instance):

```bash
$ redis-cli -p 16390 client pause 400 &
$ # run PING from another connection 150ms later
PING elapsed: 0.315 s     # normally <1ms, blocked about 300ms by the pause
```

The implementation simply sets the `clients_are_paused` flag; when `processCommand()` checks it at entry, the client is put onto the wait list directly.

## Summary

The guiding principle of the thread model is "do not add a lock if you can avoid it": command execution happens only in the main thread, I/O threads touch only byte streams and never the keyspace, bio touches only the file system and memory release, and child processes copy data via COW. Cross-referencing fields in `INFO` such as `io_threads_active`, `lazyfree_pending_objects`, and `rdb_bgsave_in_progress` lets you quantify the active state of each thread.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [concurrency](concurrency.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [concurrency](concurrency.md)
