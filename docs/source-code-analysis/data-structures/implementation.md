# Concrete data structure implementations

## Overview

This section digs into the source implementation of five core underlying structures: sds, dict, listpack, quicklist, and skiplist, then briefly covers intset and rax. Each structure comes with its key struct definitions, core functions, and ready-to-run verification commands. The code excerpts below are based on the Redis 8.0 source.

## sds: simple dynamic strings

src/sds.c, src/sds.h. sds places a header in front of the char pointer; the header comes in 5 tiers by string length, so short strings waste no memory:

```c
struct sdshdr8 {
    uint8_t len;      /* used length */
    uint8_t alloc;    /* total allocated length, excluding header and trailing \0 */
    unsigned char flags;
    char buf[];
};
```

Of the 5 header types (sdshdr5/8/16/32/64), sdshdr5 packs the length into the flags field (capped at 31 bytes); the other 4 differ only in the bit width of len and alloc (8/16/32/64 bits). This yields three properties:

- `sdslen()` is O(1) (an inline function in src/sds.h that reads the header directly);
- `sdsavail()` reports the remaining space, and `sdscatlen()` checks whether a grow is needed before appending;
- binary safe — `\0` can appear in the middle of `buf`.

Key functions: `sdsnewlen()` (create), `sdscatlen()` (append), `sdsfree()` (free), `sdsrange()` (trim).

## dict: a hash table with incremental rehash

src/dict.c, src/dict.h. The core struct holds two tables at the same time:

```c
typedef struct dict {
    dictEntry **ht_table[2];
    unsigned long ht_used[2];
    long rehashidx;   /* rehashidx == -1 means no rehash in progress */
    ...
} dict;
```

Growing is triggered by `dictExpand()`, while the actual migration is spread across `dictRehash(d, n)`: each call moves at most n non-empty buckets (`serverCron` and the regular operation path advance it by time slice and single step respectively, and `_dictRehashStepIfNeeded()` guarantees each keyspace operation moves just one small step). During a rehash, lookups check ht_table[0] first and then ht_table[1]; new insertions always go into ht_table[1]. Shrinking goes through `dictResize()`, with the same logic.

The `dictScan()` implementation is clever too: it exploits the fact that table sizes are powers of two to do "reverse binary iteration", guaranteeing no element is missed while the table grows or shrinks. The keyspace, the expiry table, the command table, and pub/sub subscriptions are all built on top of dict.

## listpack: a compact list

src/listpack.c, src/listpack.h. A listpack is one contiguous block of memory: total byte count + a sequence of elements + an end marker, with each element carrying its own length and encoding (small integers are inlined directly, strings are tiered by length). Since 7.0 it has fully replaced ziplist; a node does not record the previous node's length, so there is no cascade-update problem.

Core functions: `lpNew()` allocates, `lpAppend()` / `lpAppendInteger()` / `lpPrepend()` append, `lpInsert()` inserts at any position, `lpGet()` / `lpGetValue()` read, `lpNext()` / `lpPrev()` / `lpFirst()` / `lpLast()` iterate, and `lpLength()` counts. The small-data forms of hashes (field names and values alternating), sorted sets (members and scores alternating), and string sets (plain elements) are all stored as such a contiguous listpack:

```bash
$ redis-cli -p 6399 hset bc:i1 f1 v1 f2 v2
(integer) 2
$ redis-cli -p 6399 object encoding bc:i1
listpack
$ redis-cli -p 6399 hlen bc:i1
(integer) 2
```

## quicklist: a linked list of listpacks

src/quicklist.c, src/quicklist.h. A quicklist is a doubly linked list where each node is a listpack:

```c
typedef struct quicklistNode {
    struct quicklistNode *prev;
    struct quicklistNode *next;
    unsigned char *entry;   /* points to the listpack */
    size_t sz;              /* listpack size in bytes */
    unsigned int count : 16;
    unsigned int encoding : 2;  /* RAW=1 / LZF=2 */
    unsigned int container : 2; /* PLAIN=1 / PACKED=2 */
    ...
} quicklistNode;
```

`quicklistPush()` picks `quicklistPushHead()` or `quicklistPushTail()` based on the insertion position; before inserting, `_quicklistNodeAllowInsert()` checks whether the target node can still fit it — the threshold comes from `list-max-listpack-size` (a negative value is a byte cap: -1 means 4KB, -2 means 8KB). If it does not fit, a new node is opened; middle nodes can additionally be LZF-compressed per `list-compress-depth` (encoding becomes LZF).

```bash
$ redis-cli -p 6399 rpush bc:i2 a b c
(integer) 3
$ redis-cli -p 6399 object encoding bc:i2
listpack
$ redis-cli -p 6399 llen bc:i2
(integer) 3
```

With very few elements the whole quicklist is a single listpack node, so the encoding still shows listpack; only after a single node exceeds 8KB does it become a multi-node quicklist.

## skiplist: the sorted set index

src/t_zset.c. The skiplist encoding of a zset maintains two structures side by side: a skip list (`zskiplist`, serving score-range queries) and a dict (serving O(1) member-to-score lookups). A skip list node's level is generated level by level by `zslRandomLevel()` with 1/4 probability (`ZSKIPLIST_MAXLEVEL` is the cap); insertion goes through `zslInsert()`, and `zslGetRank()`, range traversal, and friends are all O(log N).

The switch to the skiplist encoding happens when the element count exceeds `zset-max-listpack-entries` (default 128) or a member length exceeds `zset-max-listpack-value` (default 64), carried out by `zsetConvert()`:

```bash
$ redis-cli -p 6399 zadd bc:i3 1 a 2 b
(integer) 2
$ redis-cli -p 6399 object encoding bc:i3
listpack
$ redis-cli -p 6399 del bc:i3
(integer) 1
```

## intset and rax

- **intset** (src/intset.c): a sorted integer array; `intsetAdd()` inserts via binary search; when an integer exceeds the current bit width, `intsetUpgradeAndAdd()` upgrades the whole set (16-bit up to 64-bit). All-integer sets within `set-max-intset-entries` (default 512) use it, and `OBJECT ENCODING` reports intset;
- **rax** (src/rax.c): a radix tree; `raxInsert()` and `raxSeek()` support path compression and range iteration. The Stream message-ID index (tree created by `raxNew()`) and parts of the cluster statistics both rely on it.

## Summary

The trade-off logic across these structures is very clear: single values use sds, mappings use dict (with incremental rehash to keep tail latency in check), small sequences use listpack to save memory, large sequences use quicklist to balance both-end operations against memory, and skiplist covers dict's weak spot for ordering. When reading the source, work through each file in the order "struct definition → create/insert → iterate/lookup → free", and cross-check on a live instance with `OBJECT ENCODING` and `MEMORY USAGE`.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [overview](overview.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
- [overview](overview.md)
