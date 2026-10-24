# Bottleneck Analysis

## Overview

The goal of bottleneck analysis is single: **find the path that is occupying the main thread or the disk**. Because command execution is single-threaded, "slowness" in Redis can always be pinned to a specific call stack — the analysis tools (`SLOWLOG`, `LATENCY`, `INFO`, sampling scans) are all breakpoints on that main thread from different angles. This chapter gives a triage flow in the form "symptom -> tool -> source-code landing point."

## Step one: confirm the bottleneck is in Redis

```bash
redis-cli -p 6399 --latency          # continuous round-trip latency, look at the min/avg/max distribution
redis-cli -p 6399 info stats | grep -E 'instantaneous_ops_per_sec|total_net_input_bytes'
redis-cli -p 6399 info clients       # connected_clients / blocked_clients / maxclients
```

If `--latency` shows millisecond-level jitter while QPS is not high, the problem is usually CPU contention, fork, disk, or network; if a single core is pinned, keep looking at commands.

## Step two: find slow commands (SLOWLOG)

`slowlogPushEntryIfNeeded()` in `slowlog.c` records commands that exceed `slowlog-log-slower-than` (default 10000 microseconds) into a ring queue (`slowlog-max-len` defaults to 128). Measured sample:

```bash
$ redis-cli -p 16390 slowlog get 2
1
1790906194
50093
debug
sleep
0.05
127.0.0.1:40740
```

The third line, 50093 microseconds, is the real elapsed time. Common high-risk commands: `KEYS *`, `HGETALL` on a large hash, `SMEMBERS` on a large set, `LRANGE` over a long range, `ZRANGE ... WITHSCORES` over a large range, and `DEL` (anything other than `UNLINK`) on a large key. After locating one, check `INFO commandstats` to confirm that command's `usec_per_call`:

```text
cmdstat_rpush:calls=145,usec=1935,usec_per_call=13.34,rejected_calls=0,failed_calls=0
```

## Step three: locate event spikes (LATENCY)

The slow log records "which command," while latency monitoring records "which event." After enabling the threshold (`CONFIG SET latency-monitor-threshold 100`, default 0 means off), measured:

```bash
$ redis-cli -p 16390 latency latest
command
1790906205
200
200
$ redis-cli -p 16390 latency history command
1790906205
200
1790906205
200
```

`LATENCY DOCTOR` summarizes remediation advice per event; a measured excerpt:

```text
Dave, I have observed latency spikes in this Redis instance...
1. command: 1 latency spikes (average 200ms, mean deviation 0ms, period 1.00 sec)...
- Deleting, expiring or evicting (because of maxmemory policy) large objects is a blocking operation...
```

Event names live at the `latencyAddSampleIfNeeded` call sites in `latency.c`: `command`, `fork`, `expire-cycle`, `expire-del`/`evict-del`, `aof-write*`, `aof-fsync-always`, and so on. If `fork` is the big share, look at `latest_fork_usec`/`total_forks` in `INFO stats` and `current_cow_size`, `rdb_last_cow_size` in `INFO persistence`.

## Step four: find large keys and memory hotspots

```bash
redis-cli -p 6399 --bigkeys          # sample by element count, output the largest key per type and the distribution
redis-cli -p 6399 --memkeys          # sample by byte count
```

A local measured summary (a small keyspace of 64 keys):

```text
Sampled 64 keys in the keyspace!
Biggest list found "bd:list" has 8 items / 88 bytes
61 strings with 182 bytes (95.31% of keys, avg size 2.98)
```

A large key is itself slow, but the side effects are more dangerous: its deletion (`DEL`/expiration/eviction) blocks, its RDB backup slows down fork, and it occupies bandwidth in the replication stream. Pair this with `MEMORY DOCTOR` (an empty instance reports "this instance is empty or is using very little memory, my issues detector can't be used") and `INFO memory` to judge fragmentation:

```text
used_memory_human:4.99M
mem_fragmentation_ratio:1.84
allocator_frag_ratio:1.06
mem_allocator:jemalloc-5.3.0
```

## Step five: scan the keyspace (SCAN)

When you need to tally or analyze the keyspace, use `SCAN` rather than `KEYS` — `SCAN` walks by cursor and hashtable bucket order, non-blocking and incremental. Local measured full iteration:

```text
SCAN cursor loop MATCH bd:scan:* COUNT 50  ->  keys=60 iters=2
KEYS bd:scan:*                          ->  60 rows
```

The two results match, but `SCAN` splits a single traversal into 2 round trips — that is the safe way to go for a large keyspace.

## Step six: persistence and disk

```bash
redis-cli -p 6399 info persistence | grep -E 'rdb_bgsave_in_progress|rdb_last_bgsave_status|aof_rewrite_in_progress'
redis-cli -p 6399 info stats | grep -E 'latest_fork_usec|total_forks'
redis-cli -p 6399 config get save appendonly    # confirm whether persistence is enabled
```

A high-frequency `BGSAVE` (or too-small `save` points) drives the fork count up; AOF `appendfsync always` turns every write into an fsync; when the disk is slow these all show up as periodic stalls of the main thread, corresponding to the `fork`/`aof-write*` events in `LATENCY`.

## Triage checklist (by priority)

1. QPS in `INFO stats` and the connection counts in `INFO clients` — rule out client-side problems;
2. `SLOWLOG GET` — find O(N) commands and large-key operations;
3. `LATENCY LATEST/HISTORY/DOCTOR` — distinguish command, fork, and disk events;
4. `--bigkeys`/`--memkeys`/`MEMORY USAGE` — find large keys and memory hotspots;
5. `INFO persistence` — fork and persistence frequency;
6. `INFO memory` — fragmentation ratio and `maxmemory` eviction (`evicted_keys`).

## Summary

Bottleneck analysis is not mystical: slow commands go to the slow log, event spikes go to latency monitoring, structural problems go to sampling scans, and disk problems go to fork and AOF metrics. The four tools correspond to four source-code instrumentation points — `call()`, `latencyAddSample()`, `SCAN`, and `INFO` — and chaining them takes you from symptom straight to code.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [strategies](strategies.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [strategies](strategies.md)
