# Optimization Strategies

## Overview

This chapter organizes the common optimization levers into four layers: "change the client, change the data structures, change the server configuration, change the architecture." Each strategy comes with a verifiable command and the expected gain, so you can measure first and roll out in your target environment.

## Client layer: reduce round trips

**pipeline** is the best value-for-effort optimization. Local measurements on 200 SET commands:

```text
one by one: 19.7 ms (200 round trips)
piped once: 1.9 ms (1 network batch)
```

`redis-cli --pipe` can verify bulk injection (measured `errors: 0, replies: 3`). Note that pipeline only saves network round trips; it provides no atomicity — for atomic semantics use transactions or scripts.

**Connection reuse**: the cost of a short connection is TCP handshake + first-packet latency; long-lived connections + a connection pool are the default. The `age`/`idle` fields in `CLIENT LIST` help assess connection quality.

## Data-structure layer: use the right encoding and commands

1. **Avoid O(N) commands**: replace `KEYS` with `SCAN` (measured: the same 60-key keyspace finished in 2 cursor iterations without blocking the service);
2. **Control collection size**: split large hashes/large sets with sharded keys (`bd:{user}:h1`, `bd:{user}:h2`);
3. **Prefer small encodings**: small objects should stay on `listpack`. Thresholds are tunable (measured defaults):
   ```text
   hash-max-listpack-entries  512
   set-max-listpack-entries   128
   zset-max-listpack-entries  128
   list-max-listpack-size     -2   (limit by 8KB)
   ```
   Past the threshold the encoding upgrades automatically (measured: a 200-member SET -> `hashtable`, a 200-member ZSET -> `skiplist`); the upgrade is one-way — lowering the threshold back does not downgrade automatically;
4. **Delete with UNLINK**: large keys are freed in the background via `BIO_LAZY_FREE` (`freeObjAsync()` in `lazyfree.c`); measured: a hash with 500k fields — the `UNLINK` command returned in 31ms, `lazyfreed_objects` incremented by one, and memory then dropped from 14.48MB to 1.41MB. The related options `lazyfree-lazy-expire`, `lazyfree-lazy-server-del`, and `lazyfree-lazy-eviction` all default to `no`; delete-heavy workloads can turn them on.

## Server layer: configuration tuning

- **Slow log and latency monitoring**: `CONFIG SET slowlog-log-slower-than 10000`, `CONFIG SET latency-monitor-threshold 100` (default 0 means off) — get data before talking about optimization;
- **Expiration policy**: `hz` (default 10) controls how often the active expiration cycle runs, and `active-expire-effort` (default 1, max 10) raises the per-cycle scan intensity; give keys randomized TTLs to avoid a mass expiry in the same second;
- **Memory cap and eviction**: set `maxmemory` and an appropriate `maxmemory-policy` (default `noeviction`) for the instance, and watch `evicted_keys` in `INFO stats`;
- **Persistence trade-off**: `appendfsync everysec` is the compromise between throughput and safety; `always` fsyncs on every write (`LATENCY` records an `aof-fsync-always` event);
- **Output buffer limits**: `client-output-buffer-limit` (measured default `normal 0 0 0 slave 268435456 67108864 60 pubsub 33554432 8388608 60`) stops slow clients from eating memory.

## I/O threads: when to enable

`io-threads` parallelizes network reads/writes and parsing; command execution stays single-threaded. Two practical findings (measured on 8.0.5):

1. **Off by default (io-threads 1) and a restart is required**: `CONFIG SET io-threads 4` returns `ERR CONFIG SET failed ... can't set immutable config`;
2. **Only pays off when CPU is not saturated and packet volume is high**: within a single-instance QPS of 50k+ (measured `redis-benchmark` PING at 55555 rps) you usually do not need it.

Verify status: `io_threads_active` in `INFO server` and the `io-thread=` field in `CLIENT LIST`.

## Architecture layer: scale out

Once a single instance's CPU is pegged and the vertical levers (bigger cache, smaller values, pipeline) are exhausted, use cluster sharding to spread the 16384 slots across machines:

- Write capacity and memory capacity scale linearly;
- Multi-key operations require same-slot keys (use hash tags `{tag}` to group); design business keys with this in mind up front;
- Replicas provide read scaling and failover — you must issue `READONLY` to read from a replica (measured: without `READONLY` it returns `MOVED`);
- `WAIT n timeout` buys stronger replica confirmation (measured: returns 1 with a replica online; with all replicas down it is rejected by `min-replicas-to-write` with `-NOREPLICAS Not enough good replicas to write.`).

## Scripts vs transactions

- For simple atomic operations use `MULTI/EXEC` (queueing is free; no script-interpreter cost);
- Use Lua when you need conditional logic, but keep script runtime in check: past `busy-reply-threshold` (default 5000ms) the server goes BUSY and other clients get blocked;
- Move heavy loop logic to the client in batches; a script should only do the minimal read-modify-write loop.

## Suggested rollout order

1. Turn on observability first: slow log, latency monitoring, `INFO commandstats`;
2. Client side pays off fastest: pipeline, connection pooling, removing O(N) commands;
3. Data-structure side next: split large keys, tune encoding thresholds, `UNLINK`;
4. Configuration side as needed: lazy-free, expiration effort, persistence policy;
5. Only then consider structural changes like io-threads and cluster sharding.

## Summary

The essence of optimization strategy is "move work off the main thread": pipeline moves off network waiting, `UNLINK` moves off memory freeing, io-threads moves off byte-stream processing, the cluster moves off the capacity ceiling — only command execution always stays on the single thread. Strategy selection always rests on measurement: `SLOWLOG`, `LATENCY`, and `INFO` supply the chain of evidence, then roll out layer by layer in the order above.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [bottlenecks](bottlenecks.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [bottlenecks](bottlenecks.md)
