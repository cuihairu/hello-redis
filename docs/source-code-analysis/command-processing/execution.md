# Command execution

## Overview

`call()` (around line 3635 in `server.c`) is Redis's "execution hub": every command — including module commands and Lua scripts — ultimately runs through it. It does more than call the handler function; it also centrally handles timing, statistics, the slow log, latency sampling, and primary/replica + AOF propagation. When reading the source, grasp the flags mechanism of `call()` and you have grasped "how many things actually happen when a command executes".

## The skeleton of call()

```c
void call(client *c, int flags) {
    ...
    c->cmd->proc(c);                       /* actual execution */
    ...
    if (flags & CMD_CALL_STATS) { ... }    /* commandstats timing */
    if (flags & CMD_CALL_SLOWLOG) slowlogPushEntryIfNeeded(...);
    if (flags & CMD_CALL_STATS) latencyAddSample(...);
    if (flags & CMD_CALL_PROPAGATE) { /* AOF + replicas */ }
    ...
}
```

flags are passed in by `processCommand()`; the most common combination is `CMD_CALL_FULL` (statistics + slow log + latency + propagation all on). A few key points:

- **Context before and after execution**: before `call()`, `c->cmd` and `c->argc/argv` are already in place; after execution, `commandProcessed()` resets the client and updates the replication offset.
- **Propagation targets**: write commands are sent to replicas via `replicationFeedSlaves()` (`replication.c`) and written to the AOF buffer (`propagateNow()`); commands "derived" during command execution (such as a DEL triggered by expiry, or the semantic expansion of `EXPIRE`) are queued with `alsoPropagate()` and flushed together in `afterCommand()` (around line 3900), guaranteeing atomicity and ordering consistency.
- **Dirty-data counting**: changes to `server.dirty` trigger RDB save conditions; keyspace notifications (`notifyKeyspaceEvent()`) are also emitted here.

## Statistics and observability

The elapsed time of every command goes into `INFO commandstats` (local measured sample):

```text
cmdstat_get:calls=1,usec=8,usec_per_call=8.00,rejected_calls=0,failed_calls=0
cmdstat_rpush:calls=145,usec=1935,usec_per_call=13.34,rejected_calls=0,failed_calls=0
```

`rejected_calls`/`failed_calls` distinguish "rejected by a pre-check" from "errored during execution" — very useful when diagnosing client misuse. For global throughput, look at `INFO stats`:

```text
total_commands_processed:44878
instantaneous_ops_per_sec:22104
```

## Slow log: slowlog.c

Commands whose execution time exceeds `slowlog-log-slower-than` (default 10000 microseconds; a measured `CONFIG GET slowlog-log-slower-than` returns 10000) are recorded by `slowlogPushEntryIfNeeded()` (around line 103 in `slowlog.c`) into a ring queue, capped by `slowlog-max-len` (default 128):

```bash
$ redis-cli -p 16390 config get slowlog-log-slower-than slowlog-max-len
slowlog-log-slower-than
10000
slowlog-max-len
128
$ redis-cli -p 16390 debug sleep 0.02      # own instance
OK
$ redis-cli -p 16390 slowlog len
2
$ redis-cli -p 16390 slowlog get 2
1
1790906194
50093
debug
sleep
0.05
127.0.0.1:40740

0
1790906194
20089
debug
sleep
0.02
127.0.0.1:40724
```

The slow log records "the command object itself + elapsed time + client address"; it does not copy large argument objects, so its own overhead is minimal.

## Latency monitoring: latency.c

After `call()` finishes, `latencyAddSample(event, latency)` (around line 63 in `latency.c`) aggregates samples by event name (such as `command`); a sample is recorded only once it exceeds `latency-monitor-threshold`, and can be queried with `LATENCY LATEST/HISTORY/DOCTOR`:

```bash
$ redis-cli -p 16390 config set latency-monitor-threshold 100
OK
$ redis-cli -p 16390 debug sleep 0.2
OK
$ redis-cli -p 16390 latency latest
command
1790906205
200
200
```

Event names are not limited to `command`; there are also `fork`, `aof-fsync`, and so on, each reported by its own subsystem. This is the first entry point for locating spikes.

## Execution inside transactions: MULTI/EXEC

`MULTI` sets the client to `CLIENT_MULTI`; subsequent commands are not executed immediately but are appended to the `c->mstate.commands` queue by `queueMultiCommand()` (around line 40 in `multi.c`), replying `QUEUED`; `EXEC` then executes each one through the same `call()` path inside `execCommand()` (around line 128). Local measured run:

```text
MULTI        ->  +OK
SET bd:tx 1  ->  +QUEUED
INCR bd:tx   ->  +QUEUED
GET bd:tx    ->  +QUEUED
EXEC         ->  *3\r\n+OK\r\n:2\r\n$1\r\n2\r\n
```

An error at the enqueue stage (such as wrong arity) makes `EXEC` give up outright: a measured run that enqueues a bare `GET` (no arguments) returns an error, and the following `EXEC` yields `-EXECABORT Transaction discarded because of previous errors.` An error at the execution stage (such as `INCR` on a string key) does not roll back commands already executed — Redis transactions have no rollback semantics.

## Summary

`call()` is a "function invoker with side effects": calling the handler body is only one of its steps; statistics, slow log, latency sampling, and propagation are equally important. The three layers of evidence for diagnosing performance problems — `INFO commandstats` (average elapsed time), `SLOWLOG GET` (slowest samples), `LATENCY LATEST` (event-level spikes) — all come from this same piece of code, so they naturally corroborate each other.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [parsing](parsing.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [parsing](parsing.md)
