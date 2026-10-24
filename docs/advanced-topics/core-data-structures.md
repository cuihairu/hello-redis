# Core data structures and algorithms

Redis exposes data types such as String, List, Hash, Set, and Sorted Set to users; internally they are implemented by a set of carefully designed base structures. Understanding these structures explains how the encoding of each type (see `OBJECT ENCODING`) changes and what its performance characteristics are.

## SDS: simple dynamic string

Redis does not use C strings directly, but uses SDS (Simple Dynamic String) instead:

- The header records the length `len` and the remaining space `alloc`, so `strlen` is O(1);
- It is binary-safe and can store any byte, including `\0`;
- Pre-allocation and lazy release reduce the number of memory reallocations when the string grows.

## Dictionary: progressive rehash

The keyspace itself is one big dictionary (dict), using separate chaining to resolve collisions. When it needs to expand, it does not move all keys at once; instead it maintains two hash tables and spreads the rehash across subsequent insert/delete/update/lookup operations, avoiding a long block:

- `rehashidx` changing from -1 to 0 means the rehash has started;
- Each operation migrates one bucket along the way;
- On a lookup, ht[0] is checked first; during a rehash, ht[1] is checked too.

A rehash is triggered when the load factor gets too low (shrink) or too high (expand); the thresholds are determined by the `expand`/`shrink` policy.

## Compressed lists and listpack

Small Hashes, Sorted Sets, and the like use compact sequential storage to save memory:

- **ziplist**: contiguous memory plus variable-length encoding, with the tail recording offsets to make reverse traversal easy, but it has the "cascade update" problem (a change in the length of one node triggers a chain of modifications to the nodes after it);
- **listpack** (from Redis 7.0): each node only records its own length, eliminating cascade updates altogether; from Redis 7.0 on, listpack gradually replaces ziplist (for example, the Hash encoding `listpack`).

The conversion thresholds are controlled by settings such as `hash-max-listpack-entries` and `hash-max-listpack-value` (formerly `*-max-ziplist-*`); once a threshold is crossed, the structure converts to the target one (for example, a Hash becomes a dictionary).

## quicklist and skiplist

- **List** is backed by quicklist: a doubly linked list made of multiple listpack (or, in older versions, ziplist) nodes, balancing memory compactness with insert performance; `list-compress-depth` can apply LZF compression to the middle nodes.
- **Sorted Set** uses both a dictionary and a skiplist when there are many elements: the dictionary supports O(1) lookups of a member's score, and the skiplist supports O(log N) range queries and ranks. A skiplist achieves average O(log N) lookups through multi-level indexes; it is simpler to implement than a balanced tree, and range traversal is more natural.

## Other structures

- **intset**: when all members are integers and the count is small, a Set is stored as an integer array and lookups are binary search; once a non-integer member appears, it is upgraded to a dictionary (the `intset` encoding corresponds to an integer set with a very small memory footprint).
- **embstr and raw**: short strings (within the default 44 bytes) use `embstr` encoding, where the object header and the SDS are allocated in the same block of memory; once they are too long they convert to `raw`.
- **LFU/LRU eviction metadata**: each object's 24-bit lru field carries either the LRU clock or LFU's logarithmic count and decay time (`OBJECT FREQ` shows the access frequency).

## Observing encodings with commands

```bash
SET s hello                 # embstr
APPEND s world              # raw (exceeds the threshold)
HSET h f v                  # listpack (small hash)
ZADD z 1 a                  # listpack (small sorted set)
SADD i 1 2 3                # intset
OBJECT ENCODING s
OBJECT ENCODING h
MEMORY USAGE h              # Estimate the key's memory usage
```

## Summary

Redis' memory efficiency comes from a two-track strategy of "compact encodings for small data, high-performance structures for large data." Operationally this shows up as: keeping a single key small lets the data stay in memory-saving encodings such as listpack/intset for a long time; once a threshold is crossed, the encoding conversion brings changes in memory and performance.

## References

- [Redis source repository](https://github.com/redis/redis)
- [object.c (object system)](https://github.com/redis/redis/blob/unstable/src/object.c)
- [dict.c (dictionary)](https://github.com/redis/redis/blob/unstable/src/dict.c)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [architecture-and-design](architecture-and-design.md)
- [knowledge](/knowledge.md)
