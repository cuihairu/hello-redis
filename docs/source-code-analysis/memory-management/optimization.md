# Memory optimization strategies

## Overview

Redis memory optimization is not about a single switch; it is decided jointly by three layers: encoding choice + config thresholds + eviction and expiry. At the source level: src/object.c decides which encoding a `robj` uses; the per-type implementations (src/t_hash.c, src/t_zset.c, src/t_list.c, src/t_set.c) decide when to switch between compact and general-purpose encodings; src/evict.c and src/expire.c decide what gets reclaimed when memory is tight. This section walks through the layers and gives reproducible measurement commands.

## Layer 1: string encodings

Strings are where all optimization starts. Strings no longer than 44 bytes use the embstr encoding, with the `robj` and the sds allocated in one contiguous block, saving an allocation; integers are stored directly in the `robj` (int encoding); everything else uses raw. The threshold comes from `OBJ_ENCODING_EMBSTR_SIZE_LIMIT 44` in src/object.c:

```bash
$ redis-cli -p 6399 set bc:s1 hello
OK
$ redis-cli -p 6399 object encoding bc:s1
embstr
$ redis-cli -p 6399 set bc:s2 $(python3 -c "print('a'*45)")
OK
$ redis-cli -p 6399 object encoding bc:s2
raw
```

The `SET` command path calls `tryObjectEncoding()` (src/object.c), which converts strings representable as integers to the int encoding — so store numeric values as the plain integer string, not with leading zeros or padding spaces.

## Layer 2: collection encodings and thresholds

Since Redis 7.0, ziplist is gone entirely: lists, hashes, and sorted sets uniformly use listpack (src/listpack.c) for small data, and sets use intset (src/intset.c) for small integer sets. The thresholds for switching to general-purpose encodings come from config; you can read the instance's current values directly:

```bash
$ redis-cli -p 6399 config get hash-max-listpack-entries
1) "hash-max-listpack-entries"
2) "512"
$ redis-cli -p 6399 config get zset-max-listpack-entries
1) "zset-max-listpack-entries"
2) "128"
$ redis-cli -p 6399 config get list-max-listpack-size
1) "list-max-listpack-size"
2) "-2"
```

A negative `list-max-listpack-size` means a byte limit (-1 is 4KB, -2 is 8KB); once the listpack inside a quicklist node exceeds it, the node is split. You can observe the encoding switch point empirically:

```bash
$ redis-cli -p 6399 zadd bc:small 1 a 2 b
(integer) 2
$ redis-cli -p 6399 object encoding bc:small
listpack
$ redis-cli -p 6399 zadd bc:big $(python3 -c "print(' '.join('%d m%d'%(i,i) for i in range(140)))")
(integer) 140
$ redis-cli -p 6399 object encoding bc:big
skiplist
```

140 elements exceeds `zset-max-listpack-entries = 128`, so `zsetConvert()` in src/t_zset.c switches the encoding to skiplist (backed by a skip list + dict combination). Note that this switch is one-way: removing elements does not fall back to listpack.

## Layer 3: measuring and locating big keys

`memory usage` internally uses `objectComputeSize()` (src/object.c) to estimate object size recursively; `redis-cli --bigkeys` and `--memkeys` sample with `SCAN` instead. Once a suspicious key is located, use `OBJECT ENCODING` to judge whether restructuring is worthwhile — for example, merging "many scattered string keys" into one hash (the listpack encoding saves a lot of key headers and sds overhead):

```bash
$ redis-cli -p 6399 memory usage bc:big
(integer) 14040
$ redis-cli -p 6399 del bc:big
(integer) 1
```

## Layer 4: expiry and eviction working together

- Keys set with `expire` are deleted lazily by `expireIfNeeded()` in src/db.c and by periodic sampling in `activeExpireCycle()` in src/expire.c; `expired_keys` in `INFO stats` shows the cleanup volume;
- once memory reaches `maxmemory`, `performEvictions()` in src/evict.c evicts per `maxmemory-policy`, with LRU/LFU information stored in the 24-bit `lru` field of `robj` (src/server.h defines `LRU_BITS 24`);
- if the business allows, `UNLINK` plus `lazyfree-lazy-eviction yes` and `lazyfree-lazy-expire yes` move the freeing cost off the main thread.

```bash
$ redis-cli -p 6399 set bc:ttl 1 EX 120
OK
$ redis-cli -p 6399 ttl bc:ttl
(integer) 120
$ redis-cli -p 6399 del bc:ttl
(integer) 1
```

## A practical optimization checklist

- Keep short strings within 44 bytes to enjoy embstr;
- replace many scattered string keys with one listpack-encoded hash;
- control collection element counts and per-element sizes to avoid entering hashtable/skiplist encodings too early;
- for append/pop-only lists, `list-max-listpack-size -2` (the default) is usually already optimal;
- for large-value scenarios, evaluate splitting the key or switching to a dedicated structure such as Stream;
- judge fragmentation from `mem_fragmentation_ratio` and the `allocator_*` fields of `INFO memory`; if needed, restart during off-peak hours or enable `activedefrag`.

## Summary

In the source, memory optimization maps to one clear chain: `tryObjectEncoding()` compacts individual strings, configs such as `*_max_listpack_*` control collection encoding switch points, `objectComputeSize()` provides measurement, and `performEvictions()` and `activeExpireCycle()` provide reclamation. Once you understand this chain, any production "why is memory growing" question can be located in three steps: encoding, thresholds, eviction policy.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [allocating](allocating.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
- [allocating](allocating.md)
