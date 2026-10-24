# Outlook for Redis 7

Redis 7.0 (released April 2022) and its subsequent minor versions turned several of the capabilities from the early "outlook" into reality. This page follows the actually released Redis 7 features as its main thread, recording the changes worth checking when upgrading from 6.x.

## 1. Functions: a persistable function library

Lua scripts (`EVAL`) have a long-standing pain point: the script is carried by the client, so it has to be reloaded after the server restarts. Functions register functions on the server and persist them with RDB/AOF:

```bash
FUNCTION LOAD "#!lua name=mylib\nredis.register_function('pingk', function(keys, args) return redis.call('GET', keys[1]) end)"
FCALL pingk 1 mykey
FUNCTION LIST
```

Functions support library-level management (`FUNCTION DELETE`, `FUNCTION DUMP`/`RESTORE`), making them more suitable as a long-term part of the server-side API.

## 2. Multi-Part AOF

The previous AOF mixed "base data + incremental commands" into a single file, and required maintaining a temporary manifest during rewrites. Redis 7 splits the AOF into multiple parts:

- The directory named by `appenddirname` holds the base RDB/AOF files and the incremental AOF files;
- A manifest file records the version and order of each part;
- A rewrite no longer blocks writes to the old files, and no longer needs the `aof-use-rdb-preamble` trade-off.

## 3. Sharded Pub/Sub

In cluster mode, ordinary Pub/Sub messages are broadcast to all nodes, wasting bandwidth for no reason. The new sharded commands keep messages within the shard that owns the key:

```bash
SSUBSCRIBE channel          # Subscribe (within the shard)
SPUBLISH channel message    # Publish (within the shard)
SUNSUBSCRIBE channel
```

Routing is by slot, consistent with the cluster's `MOVED`/`ASK` semantics.

## 4. listpack fully replaces ziplist

Compact encodings for types such as Hash and Sorted Set uniformly switch to listpack, eliminating ziplist's cascade update problem; `list-max-listpack-size`, `hash-max-listpack-entries`, and the like become the new config names (the old names are kept as aliases).

## 5. Other important changes

- **`LCS` command**: computes the longest common subsequence of strings, replacing `STRALGO LCS` from 6.x.
- **`SINTERCARD`**: returns only the cardinality of the intersection, not the members, and a LIMIT can be set (new in 7.0).
- **ACL v2**: supports selectors for finer-grained combinations of command privileges.
- **Improved `XAUTOCLAIM`**, **`COMMAND DOCS`**, and better command metadata documentation.
- **Experimental `CLIENT NO-EVICT`**: marks a critical connection so it cannot be disconnected by memory eviction.

## Upgrade notes

- The AOF file format changed: run `BGREWRITEAOF` before upgrading, and complete one full load test on the new version;
- Code using `STRALGO` needs to migrate to `LCS`;
- Clients and proxies need to confirm their support for Sharded Pub/Sub and Functions commands;
- Old config names (`*-max-ziplist-*`) still work in the config file, but switching to the listpack names is recommended.

Overall, Redis 7's direction is "productizing the common pain points of developers": persisting scripts, simplifying AOF, propagating in-cluster messages on demand, and safer memory structures. Subsequent versions (8.x) continue evolving in query capabilities (vector search), defaulting to multi-threaded I/O, and the like.

## References

- [Redis source repository](https://github.com/redis/redis)
- [Redis Functions and programmability](https://redis.io/docs/latest/develop/interact/programmability/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
