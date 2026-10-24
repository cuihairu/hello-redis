# Performance Optimization

## Overview

Redis's performance model is simple: single-threaded execution + in-memory operations + an event loop. As a result, any optimization problem can be reduced to three categories — **how long this command takes to run (CPU)**, **how much data it touches (memory)**, and **how many I/O waits it incurs (network/disk)**. At the source-code level, these three map to command implementations, data-structure encodings, and the buffering strategy in `networking.c`/`aof.c`. This chapter is the overview; methods and tooling are in *Bottleneck Analysis*, and the list of levers is in *Optimization Strategies*.

## Where the performance ceiling comes from

Local measurements (Redis 8.0.5, 20 clients, 20k requests on the same host):

```bash
$ redis-benchmark -p 6399 -n 20000 -c 20 -q -t ping,ping_inline
PING_INLINE: 55555.55 requests per second, p50=0.215 msec
PING_MBULK: 54945.05 requests per second, p50=0.215 msec
```

Pure PING reaching over 50k per second shows the bottleneck is basically not in protocol parsing, but in "per-command actual work + network round trip." In real workloads, what usually slows Redis down is:

1. **O(N) commands**: `KEYS`, `SMEMBERS` on large sets, `HGETALL` on large hashes, `LRANGE 0 -1` on long lists — single-command time is proportional to element count and directly occupies the main thread;
2. **Large-key delete/expire/evict**: synchronously freeing objects of tens of MB blocks for milliseconds to seconds;
3. **fork**: the fork for BGSAVE/AOF rewrite has a noticeable stall on large-memory instances (`latest_fork_usec`);
4. **Slow disk**: AOF `appendfsync everysec` meeting disk jitter;
5. **Network**: one RTT per command (pipeline can amortize this).

## Three observation entry points

Every execution path in the source is instrumented with statistics, forming three mutually corroborating layers of evidence:

```bash
# 1) Command-level average latency (INFO commandstats)
$ redis-cli -p 6399 info commandstats | head -4
cmdstat_get:calls=1,usec=8,usec_per_call=8.00,rejected_calls=0,failed_calls=0
cmdstat_rpush:calls=145,usec=1935,usec_per_call=13.34,rejected_calls=0,failed_calls=0

# 2) Slowest samples (SLOWLOG)
$ redis-cli -p 6399 config get slowlog-log-slower-than   # default 10000 microseconds
$ redis-cli -p 6399 slowlog get 5

# 3) Event-level spikes (LATENCY)
$ redis-cli -p 16390 config set latency-monitor-threshold 100
$ redis-cli -p 16390 latency latest
```

The three layers correspond to the same stretch of code inside `call()` (timing for `INFO commandstats`, `slowlogPushEntryIfNeeded()` pushing into the slow log, `latencyAddSample()` sampling), so you can pin down "which command is slow, how slow the worst is, and which event."

## Memory perspective

Encoding is the first lever for memory optimization: small collections use `listpack` and automatically upgrade to `hashtable`/`skiplist` past a threshold. Local measurements of some switching points:

```text
set-max-listpack-entries 128    -> a 200-member SET is encoded as hashtable
zset-max-listpack-entries 128   -> a 200-member ZSET is encoded as skiplist
hash-max-listpack-entries 512   -> a 200-field HASH is still listpack
```

Analysis tools:

```bash
redis-cli -p 6399 memory usage bd:list        # bytes of a single key
redis-cli -p 6399 object encoding bd:zset     # listpack / skiplist
redis-cli -p 6399 info memory | grep -E 'used_memory_human|mem_fragmentation_ratio|mem_allocator'
# used_memory_human:4.99M
# mem_fragmentation_ratio:1.84
# mem_allocator:jemalloc-5.3.0
```

For large keys and memory distribution, use `redis-cli --bigkeys` (by element count) and `redis-cli --memkeys` (by byte count) to sample; both are built on `SCAN` and are safe for an online service (measured output includes summaries like "Biggest list found bd:list has 8 items").

## Latency perspective

The `LATENCY` system records per event (`latencyAddSample()` in `latency.c`); common events include `command`, `fork`, `expire-cycle`, `expire-del`/`evict-del`, `aof-write`, `aof-fsync-always`, `aof-rename`, `rdb-unlink-temp-file`, and so on. `LATENCY DOCTOR` aggregates diagnostic advice (measured output includes entries like "Check your Slow Log to understand what are the commands you are running which are too slow to execute"). Delete-style blocking can be moved to the background with `UNLINK`/`lazyfree-lazy-expire` (the `BIO_LAZY_FREE` queue in bio), and the `lazyfreed_objects` counter rises accordingly.

## Network perspective

- **pipeline**: 200 SET commands locally measured drop from 19.7ms (one by one) to 1.9ms (sent once);
- **Large value**: `proto-max-bulk-len` caps a single argument at 512MB, but in practice a value of a few hundred KB significantly increases copying and bandwidth;
- **Slow clients**: the output buffer limit (`client-output-buffer-limit`) prevents a slow consumer from blowing out memory.

## Summary

Performance optimization in Redis is an engineering practice of "measure first, then act": `INFO`/`SLOWLOG`/`LATENCY` supply quantitative evidence, encoding and pipeline provide low-cost wins, and lazy-free plus cluster sharding provide structural gains. The next chapter lays out a full triage path by bottleneck type.

## References

- [Redis source repository](https://github.com/redis/redis)
- [Redis Operations Manual · Optimization](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/)
- [ae.c (event loop)](https://github.com/redis/redis/blob/unstable/src/ae.c)

## Related pages

- [architecture](architecture.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [architecture](architecture.md)
