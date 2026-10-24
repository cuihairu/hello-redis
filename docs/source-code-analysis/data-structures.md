# Data structures and algorithms

## Overview

Redis exposes five basic types to the outside world (string, list, hash, set, zset) plus extensions such as stream, bitmap, hyperloglog, and geo, backed internally by a carefully chosen set of data structures. Understanding them comes down to keeping two layers apart: the **low-level structures** (sds, dict, listpack, quicklist, skiplist, intset, rax) and the **object encoding** (the `encoding` field of `robj` in src/object.c). This section gives the full picture and the entry points for reading.

## Low-level data structure inventory

| Structure | Source file | Key functions | Characteristics |
| --- | --- | --- | --- |
| sds dynamic string | src/sds.c, src/sds.h | `sdsnewlen()`, `sdscatlen()`, `sdslen()` | binary-safe, O(1) length, tiered headers (sdshdr5/8/16/32/64) |
| dict hash table | src/dict.c, src/dict.h | `dictExpand()`, `dictRehash()`, `dictScan()` | chaining, incremental rehash |
| listpack | src/listpack.c | `lpNew()`, `lpAppend()`, `lpInsert()`, `lpGet()` | compact list in contiguous memory, replaced ziplist from 7.0 |
| quicklist | src/quicklist.c, src/quicklist.h | `quicklistCreate()`, `quicklistPush()` | doubly-linked list of listpack nodes, supports LZF compression |
| skiplist | src/t_zset.c | `zslCreate()`, `zslInsert()`, `zslRandomLevel()` | ordered index for sorted sets, average O(log N) |
| intset | src/intset.c | `intsetAdd()`, `intsetFind()`, `intsetUpgradeAndAdd()` | ordered integer array, bit width upgrades on demand |
| rax radix tree | src/rax.c | `raxNew()`, `raxInsert()`, `raxSeek()` | message index for streams, cluster slot statistics, and more |

## Object encoding: implementation details of types

`robj` (src/object.c) carries two fields, `type` and `encoding`; `TYPE` returns the former, `OBJECT ENCODING` returns the latter. The same type can switch between encodings automatically — this is Redis's core memory-saving mechanism:

- string: int, embstr (44 bytes or less, `OBJ_ENCODING_EMBSTR_SIZE_LIMIT`), raw;
- list: listpack (few and small elements), quicklist;
- hash: listpack, hashtable;
- set: intset, listpack (small string sets, governed by `set-max-listpack-entries`), hashtable;
- zset: listpack, skiplist.

```bash
$ redis-cli -p 6399 set bc:d1 12345
OK
$ redis-cli -p 6399 object encoding bc:d1
int
$ redis-cli -p 6399 hset bc:d2 f1 v1
(integer) 1
$ redis-cli -p 6399 object encoding bc:d2
listpack
```

## Algorithmic highlights

- **Incremental rehash** (`dictRehash()` in src/dict.c): on resize both the old and new tables are kept alive (`d->ht_table[0]`, `d->ht_table[1]`), moving a fixed number of buckets per operation to avoid a long block;
- **Probabilistic leveling of the skiplist** (`zslRandomLevel()` in src/t_zset.c): levels are drawn randomly by a power-law distribution, simple to implement with a small constant;
- **Bit-width upgrades in intset** (`intsetUpgradeAndAdd()` in src/intset.c): automatic upgrade from int16 up to int64, avoiding pre-allocated wasted memory;
- **Node splitting and compression in quicklist** (`_quicklistNodeAllowInsert()` in src/quicklist.c): node size is governed by `list-max-listpack-size`, with optional LZF compression for the inner nodes at both ends;
- **Path compression in rax** (src/rax.c): shared prefixes plus compressed nodes, well suited to long, similar keys such as message IDs.

## Verifying encoding with commands

`OBJECT ENCODING` is the most direct observation point, and combined with `MEMORY USAGE` it quantifies the memory difference between encodings:

```bash
$ redis-cli -p 6399 sadd bc:d3 1 2 3
(integer) 3
$ redis-cli -p 6399 object encoding bc:d3
intset
$ redis-cli -p 6399 rpush bc:d4 a b c
(integer) 3
$ redis-cli -p 6399 object encoding bc:d4
listpack
$ redis-cli -p 6399 memory usage bc:d4
(integer) 64
$ redis-cli -p 6399 del bc:d1 bc:d2 bc:d3 bc:d4
(integer) 4
```

Two caveats: encoding switches are one-way — once upgraded from listpack to hashtable, deleting elements does not downgrade it; and the set of return values from `OBJECT ENCODING` evolves across versions, so ziplist will not appear after 7.0.

## Reading suggestions

Reading the source in the order "object layer first, structure layer second" is the most efficient: start with `createObject()` and the various `create*Object()` factory functions in src/object.c to learn the possible values of the encoding field; then follow a concrete command (such as `hashTypeSet()` in src/t_hash.c) and observe how it branches across different encodings; finally dive into the structure implementations (src/dict.c, src/listpack.c). This way, every structure you read maps immediately onto observable command behavior.

## Summary

Redis's data structure system is a sandwich of "type system + multiple encodings + low-level structures": the upper type layer is stable for users, the middle encoding layer switches automatically with data size, and the low-level structures each cover their optimal scenario. The output of `OBJECT ENCODING` corresponds to the encoding constants in the source, and can serve as an index into the Redis 8.0 data structure implementation.

## References

- [Redis source repository](https://github.com/redis/redis)
- [object.c (object system)](https://github.com/redis/redis/blob/unstable/src/object.c)
- [dict.c (dictionary)](https://github.com/redis/redis/blob/unstable/src/dict.c)
- [sds.c (simple dynamic string)](https://github.com/redis/redis/blob/unstable/src/sds.c)
- [listpack.c](https://github.com/redis/redis/blob/unstable/src/listpack.c)
- [quicklist.c](https://github.com/redis/redis/blob/unstable/src/quicklist.c)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
