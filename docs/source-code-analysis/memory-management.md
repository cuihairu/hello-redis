# Memory management

## Overview

Redis is an in-memory database: memory is both the source of its performance and its tightest resource constraint. At the source level, memory management consists of three parts: the unified allocation wrapper (src/zmalloc.c), memory optimization through objects and encodings (src/object.c plus the various t_*.c files), and the eviction logic that kicks in once `maxmemory` is reached (src/evict.c). This section untangles how these three layers relate and gives observation methods you can verify directly on a live instance.

## Two key metrics: used_memory and used_memory_rss

The two most important fields in `INFO memory` come from different accounting paths:

- `used_memory`: "how many bytes Redis itself has allocated", maintained by `zmalloc_used_memory()` (src/zmalloc.c); it covers key-value objects, client buffers, the replication backlog, and more, but not allocator fragmentation or metadata;
- `used_memory_rss`: resident memory as the operating system sees it (on Linux, `zmalloc_get_rss()` reads field 24 of `/proc/<pid>/stat` and multiplies by the page size); it includes allocator fragmentation, page-alignment waste, and more.

The ratio of the two is `mem_fragmentation_ratio`: below 1 means swapping has kicked in, well above 1 (say 1.5 or more) means severe fragmentation:

```bash
$ redis-cli -p 6399 info memory | grep -E 'used_memory:|used_memory_rss_human|mem_fragmentation_ratio|mem_allocator'
used_memory:1138208
used_memory_rss_human:8.82M
mem_fragmentation_ratio:3.89
mem_allocator:jemalloc-5.3.0
```

`INFO memory` also exposes allocator-side statistics: `allocator_allocated`, `allocator_active`, and `allocator_resident` — corresponding to "bytes requested by the application", "active pages actually held by the allocator", and "how much has been given back to the OS". The gaps between the three tell you which layer the fragmentation comes from.

## The allocator: jemalloc by default

Redis picks the allocator at compile time via the `MALLOC` variable; jemalloc is the Linux default, and libc or tcmalloc can be swapped in. `redis-server -v` prints it directly:

```bash
$ redis-server -v
Redis server v=8.0.5 sha=00000000:0 malloc=jemalloc-5.3.0 bits=64 build=9729964261b8fc0f
```

When `USE_JEMALLOC` is in effect, src/zmalloc.c replaces the standard `malloc` macro with `je_malloc`, so every Redis memory request lands under jemalloc's size class management — which is also why `zmalloc_size()` can report the real footprint in O(1) (with `malloc_usable_size` semantics). For the details of the allocation and freeing mechanics, see *Memory allocation and freeing*.

## Where the memory goes: objects and encodings

In memory, each key-value pair is made of: the key's sds + the `robj` struct + the storage for the value itself. `OBJECT ENCODING` shows the value's concrete encoding; for the same logical data, memory can differ several-fold between encodings:

```bash
$ redis-cli -p 6399 set bc:mm hello
OK
$ redis-cli -p 6399 object encoding bc:mm
embstr
$ redis-cli -p 6399 memory usage bc:mm
(integer) 64
```

Small objects take compact encodings such as embstr/int/listpack; once elements multiply they switch to general-purpose encodings such as raw/quicklist/hashtable, with the switching thresholds controlled by configs like `hash-max-listpack-entries`, `zset-max-listpack-entries`, and `list-max-listpack-size`. For optimization strategies, see *Memory optimization strategies*.

## maxmemory and eviction

During the pre-check stage of `processCommand()` (src/server.c), write commands check whether memory has exceeded `maxmemory`; if it has, `performEvictions()` (src/evict.c) evicts according to `maxmemory-policy`. The policies are noeviction, allkeys-lru, volatile-lru, allkeys-lfu, volatile-lfu, allkeys-random, volatile-random, and volatile-ttl — 8 in total. LRU/LFU information lives in the 24-bit lru field of `robj`:

```bash
$ redis-cli -p 6399 config get maxmemory
1) "maxmemory"
2) "0"
$ redis-cli -p 6399 config get maxmemory-policy
1) "maxmemory-policy"
2) "noeviction"
$ redis-cli -p 6399 object idletime bc:mm
(integer) 3
```

`object idletime` returns the idle time in seconds; if the policy is switched to LFU, `OBJECT FREQ` shows the access frequency (under non-LFU policies it returns an error saying frequency tracking is not enabled).

## Expired keys and lazy freeing

- **Expiry**: `expireIfNeeded()` in src/db.c lazily deletes expired keys on the read/write paths, while `activeExpireCycle()` in src/expire.c is called periodically by `serverCron()` for active sampled deletion;
- **Lazy freeing**: `UNLINK`, `FLUSHDB ASYNC`, and friends hand large-object frees to a background thread (`freeObjAsync()` and `emptyDbAsync()` in src/lazyfree.c, which go through `bioCreateLazyFreeJob()` in src/bio.c into the `BIO_LAZY_FREE` queue), keeping the main thread from blocking.

## Commonly used observation commands

```bash
$ redis-cli -p 6399 memory usage bc:mm        # approximate memory usage of a single key
$ redis-cli -p 6399 memory stats | head -8    # memory breakdown by category
peak.allocated
1284096
total.allocated
1284048
startup.allocated
670832
replication.backlog
0
$ redis-cli -p 6399 memory doctor             # diagnostic advice
Hi Sam, this instance is empty or is using very little memory, my issues detector can't be used in these conditions. ...
```

Based on `memory stats`, `memory doctor` draws conclusions about fragmentation, peer memory, big keys, and more; on an empty instance or one using very little memory it just returns a notice.

## Summary

Redis memory management boils down to "one accounting layer + one allocation layer + one policy layer": zmalloc.c handles accounting and allocation uniformly (jemalloc by default), object.c and the per-type implementations use encoding switches to control each object's size, and evict.c and expire.c reclaim memory at both global and per-key granularity. When troubleshooting memory problems, drill down layer by layer in the order `INFO memory` → `memory stats` → `memory usage <key>` → `OBJECT ENCODING <key>`, and the biggest consumer usually shows up quickly.

## References

- [Redis source repository](https://github.com/redis/redis)
- [object.c (object system and reference counting)](https://github.com/redis/redis/blob/unstable/src/object.c)
- [expire.c (expiry deletion)](https://github.com/redis/redis/blob/unstable/src/expire.c)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
