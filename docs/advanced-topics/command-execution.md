# Command execution and event handling

This page walks through the complete path a command takes from arriving at Redis to returning its result, along with the event loop mechanism that supports it.

## Command table

Before Redis 7.0, command metadata was maintained in a static array of `redisCommand` structures; from 7.0 on it became the structured `redisCommandTable`, containing the command name, number of arguments, argument flags (such as `write`, `readonly`, `noscript`), and the implementation function pointer. At startup the command table is built into a dictionary, and `processCommand` uses the command name to look up the implementation in O(1).

You can inspect the command table with `COMMAND`, `COMMAND INFO <command>`, and `COMMAND COUNT`.

## Execution flow

A command's handling roughly goes through the following stages:

1. **Read and parse**: the event loop detects that a client socket is readable, reads the byte stream, and parses it into an argument array according to the RESP protocol;
2. **Look up the command**: `lookupCommand` finds the command structure in the command table;
3. **Validate**: argument count, `MULTI` transaction state, `maxmemory` memory limit, read-only replicas rejecting writes, ACL permissions, whether the command is allowed inside a script/transaction, and so on;
4. **Execute**: call the command implementation function (such as `setCommand`), operate on the keyspace, and prepare the reply;
5. **Reply**: write the response into the client output buffer, register a write event, and send it when the socket becomes writable;
6. **Propagate**: a write command is appended to the AOF buffer and forwarded to replicas and to publish/subscribe.

Commands exceeding `slowlog-log-slower-than` (default 10 milliseconds) are recorded in the slow log (`SLOWLOG GET`).

## Event loop (ae.c)

The event library that ships with Redis wraps epoll/kqueue/select/evport into a unified interface:

- **File events**: on readable, `readQueryFromClient` is called; on writable, `writeToClient` is called;
- **Time events**: `serverCron`, run once every 100 milliseconds by default, handles active expiration of keys, `replCron`/`clusterCron`, incremental steps of dictionary progressive rehash, and client timeout cleanup, among other things.

Each round of the loop first handles file events, then checks whether time events are due; the `hz` setting (default 10, i.e. 10 times per second) controls the frequency of `serverCron`.

## Client buffers

Each client connection has two kinds of buffers:

- **Query buffer**: temporarily holds requests sent by the client but not yet processed; if it grows too large (`client-query-buffer-limit`, default 1 GB) the connection is dropped;
- **Output buffer**: divided into a fixed size (for ordinary clients) and the configurable `client-output-buffer-limit` (defaults: no limit for ordinary clients, 256 MB hard limit / 64 MB 60-second soft limit for replicas, 32 MB hard limit / 8 MB 60-second soft limit for pubsub clients). Exceeding the limit drops the connection, preventing slow consumers from dragging down memory.

## Blocking points and how to make things asynchronous

Common operations that block the main thread, and how to mitigate them:

| Blocking point | Mitigation |
| --- | --- |
| Synchronous deletion of large keys | Use `UNLINK` (Redis 4.0+) to delete asynchronously |
| Full traversals such as `KEYS`, `SMEMBERS` | Use progressive commands such as `SCAN`/`SSCAN` |
| The fork during `BGSAVE`/AOF rewrite | Control `save` frequency; split large instances; use AOF everysec |
| Lua script execution time | Keep scripts short; Redis 7.0's `busy-reply-threshold` can return BUSY when a script blocks |

## Debugging commands for clients

```bash
CLIENT LIST              # Inspect connections and buffer state
CLIENT INFO              # Current connection info
MONITOR                  # Watch all commands in real time (debugging only; do not leave on in production)
LATENCY HISTORY event    # Latency event history
SLOWLOG GET 10           # The 10 most recent slow queries
```

Once you understand the execution path, diagnosing latency problems is straightforward: start with the slow log to locate slow commands, then use `LATENCY` and `CLIENT LIST` to tell whether the command itself is slow, whether it is persistence jitter, or whether it is a network/buffer problem.

## References

- [Redis source repository](https://github.com/redis/redis)
- [ae.c (event loop)](https://github.com/redis/redis/blob/unstable/src/ae.c)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [architecture-and-design](architecture-and-design.md)
