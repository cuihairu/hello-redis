# Redis data structure overview

## Overview

What Redis exposes to users is the five basic types returned by the `TYPE` command; internally they are realized by a set of underlying encodings returned by `OBJECT ENCODING`. This "one type, many encodings" design is the key to Redis balancing memory and performance: small data uses a compact contiguous-memory structure, and once data grows it switches automatically to a general-purpose structure. This section walks through these two layers and where encoding switches are triggered in the source.

## Mapping between type and encoding

| TYPE | Possible encoding | Underlying implementation | Source file |
| --- | --- | --- | --- |
| string | int / embstr / raw | long long / contiguous-memory sds / standalone sds | src/object.c, src/sds.c |
| list | listpack / quicklist | listpack or quicklist (whose nodes are listpack) | src/t_list.c, src/quicklist.c, src/listpack.c |
| hash | listpack / hashtable | listpack or dict | src/t_hash.c, src/dict.c |
| set | intset / listpack / hashtable | ordered integer array / listpack / dict | src/t_set.c |
| zset | listpack / skiplist | listpack or a "skiplist + dict" combination | src/t_zset.c |
| stream | stream | rax + listpack | src/t_stream.c |

Each row can be verified one by one with real instances:

```bash
$ redis-cli -p 6399 set bc:o1 100
OK
$ redis-cli -p 6399 type bc:o1
string
$ redis-cli -p 6399 object encoding bc:o1
int
```

## Why there are multiple encodings

Take the hash as an example. When `HSET` stores a hash with only two fields, it uses listpack: all field names and values are laid out contiguously in a single block of memory, with no pointers and no hash buckets, so the memory overhead approaches the data itself. Once the number of fields exceeds `hash-max-listpack-entries` (default 512) or a single value exceeds `hash-max-listpack-value` (default 64 bytes), src/t_hash.c calls `hashTypeConvert()` to switch to hashtable, trading extra overhead for O(1) lookup.

```bash
$ redis-cli -p 6399 hset bc:o2 a 1 b 2
(integer) 2
$ redis-cli -p 6399 object encoding bc:o2
listpack
$ redis-cli -p 6399 config get hash-max-listpack-entries
1) "hash-max-listpack-entries"
2) "512"
```

## Where encoding switches are triggered

The switching logic is scattered across each type's implementation, and what they share is "**upgrade only, never downgrade**":

- string: on the `SET` path, `tryObjectEncoding()` (src/object.c) attempts to compress into int or embstr; beyond 44 bytes (`OBJ_ENCODING_EMBSTR_SIZE_LIMIT`) it falls back to raw;
- list: src/t_list.c checks `list-max-listpack-size` on push, and once the listpack inside a node exceeds it, the node is split or a PLAIN node is used instead (see `_quicklistNodeAllowInsert()` in src/quicklist.c);
- set: if all elements are integers and the count stays within `set-max-intset-entries`, intset is used; otherwise `set-max-listpack-entries` decides between listpack and hashtable;
- sorted set: once the element count exceeds `zset-max-listpack-entries` or a member exceeds `zset-max-listpack-value`, `zsetConvert()` (src/t_zset.c) switches to skiplist.

```bash
$ redis-cli -p 6399 zadd bc:o3 1 a 2 b
(integer) 2
$ redis-cli -p 6399 object encoding bc:o3
listpack
$ redis-cli -p 6399 del bc:o3
(integer) 1
```

## An important change in 7.0: ziplist is retired

Before Redis 7.0, small hashes, small lists, and small sorted sets all used ziplist (src/ziplist.c). Ziplist's cascading update problem (chained growth of the `prevlen` field) amplifies latency under heavy writes, so 7.0 introduced listpack to fully replace it: each element records only its own length, not the preceding element's, which eliminates cascading updates structurally. Today the node content of quicklist is also listpack, and from 7.x on `OBJECT ENCODING` no longer returns ziplist in the source.

## How to observe encodings

- `TYPE key`: view the logical type;
- `OBJECT ENCODING key`: view the current encoding;
- `OBJECT REFCOUNT key` / `OBJECT IDLETIME key` / `OBJECT FREQ key`: reference count and access statistics (FREQ is only meaningful under the LFU policy);
- `MEMORY USAGE key`: recursively estimate memory according to the current encoding.

```bash
$ redis-cli -p 6399 object idletime bc:o2
(integer) 0
$ redis-cli -p 6399 del bc:o1 bc:o2
(integer) 2
```

## Summary

Keep the three-layer mapping "type — encoding — structure" in mind, and use the table above to locate each one's source file, so that when reading any `t_*.c` command implementation you can tell quickly which structure it operates on. The next section breaks down the concrete implementation details of these low-level structures one by one.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [implementation](implementation.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [implementation](implementation.md)
