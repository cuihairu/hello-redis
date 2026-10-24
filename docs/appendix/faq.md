# Frequently Asked Questions

## Persistence

**Q: How do I choose between RDB and AOF?**
RDB is a point-in-time snapshot — fast to restore and compact, but you lose any data written between two snapshots. AOF records write commands; with `appendfsync everysec` you lose at most about 1 second of data. In most cases you enable both: AOF protects your data, and RDB is used for fast recovery and backups. See [RDB snapshots](../advanced/rdb-snapshot.md) and [AOF logs](../advanced/aof-log.md).

**Q: Redis lost its data after a restart?**
First check whether persistence is enabled (`rdb_last_save_status` and `aof_enabled` in `INFO persistence`), and whether `dir` points to the persistence directory. For cache-only workloads, data loss is acceptable, and leaving persistence off is normal.

## Memory and Eviction

**Q: What happens when memory is full?**
Once `maxmemory` is reached, keys are evicted according to `maxmemory-policy`. Caches commonly use `allkeys-lru`; when data loss is not allowed, use `noeviction` (write commands return an OOM error), and you should scale up as soon as possible.

**Q: Lots of keys but not enough memory — how do I investigate?**
Use `redis-cli --bigkeys`, `--memkeys`, or `MEMORY USAGE` to find large keys; check for large collections, cache keys with no TTL, and lists that grow without bound. You can also export an RDB and run `rdb_tools` offline to analyze it.

**Q: If I set a TTL on a key, will it be deleted automatically?**
Yes. Expired keys are cleaned up by lazy deletion (a key is removed when it is found to be expired on access) together with active deletion (`activeExpireCycle` samples periodically), so memory is reclaimed promptly. But be aware of edge cases, such as an expired key being overwritten by `RENAME`.

## Caching

**Q: What is the difference between cache penetration, breakdown, and avalanche?**
Penetration is querying data that does not exist, bypassing the cache; breakdown is a single hot key expiring and a burst of requests going to the origin all at once; avalanche is many keys expiring at the same time, overwhelming the database. The respective countermeasures are caching empty values / Bloom filters, rebuilding under a mutex lock or keeping the key unexpired, and adding random jitter to TTLs. See [Caching](../use-cases/caching.md).

**Q: Should I update the database first or delete the cache first?**
The recommendation is "update the database first, then delete the cache" (Cache-Aside). If the delete fails you may read a stale value; fall back to a retry queue or a short TTL.

## High Availability and Clusters

**Q: What is the difference between Sentinel and Cluster?**
Sentinel addresses high availability (automatic failover and configuration provisioning), but the data is still a single full copy on one primary. Cluster addresses both horizontal scaling (sharding across 16,384 slots) and high availability (replication plus failover).

**Q: What is the maximum number of nodes in a Redis cluster?**
The theoretical limit is constrained by the total number of slots and the number of primary nodes. The official recommendation is to keep primaries at 1,000 or fewer; production clusters commonly run with a few dozen primaries.

**Q: I get an error running `redis-cli -c cluster reshard`?**
The syntax is wrong: `cluster reshard` is not a subcommand of `CLUSTER`, and `-c` only makes `redis-cli` follow `MOVED` redirects. To move slots, use the cluster management tool: `redis-cli --cluster reshard <node-address>:<port>`.

## Commands and Performance

**Q: Why shouldn't I use `KEYS`?**
`KEYS` is O(N) and does not yield the CPU midway, so it blocks all requests once you have many keys. Use `SCAN` for incremental traversal instead, or maintain a business index in a set or hash.

**Q: Is `MULTI/EXEC` atomic?**
Commands in a transaction are queued and executed consecutively at `EXEC`, with no other client's commands interleaved in between — so yes, it is atomic. But transactions do not support rollback: if a command errors at runtime (such as running `INCR` on a string), the remaining commands still run.

**Q: Can `INCR` return duplicates?**
No. Redis executes single-threaded and `INCR` is an atomic increment, so even concurrent calls from multiple instances return unique values — it can be used directly as an ID generator.

**Q: How do you define and handle a big key?**
As a rule of thumb, treat a String over 10 KB or a collection with more than 5,000 elements as a big key. They slow down commands, cause uneven memory use, and block deletions. Fixes: split them (shard by segment or partition), use compressed storage, and delete with `UNLINK` so the deletion runs asynchronously.

## Clients

**Q: How do I size a connection pool?**
More connections is not always better; Redis's throughput bottleneck is often per-instance command handling. Rule of thumb: 8-32 connections for small apps; when you need heavy pipelining, reduce the connection count and increase the pipeline depth.

**Q: The client receives a `MOVED`/`ASK` error?**
This means the requested key is not on the current node. The client should connect in cluster mode (for example, `NewClusterClient` in go-redis, or node-redis's cluster support), or route through a proxy.

**Q: What causes an `error READONLY`?**
The primary you were connected to failed over: the former primary became a replica and rejects writes. The client should re-discover the new primary address via Sentinel notifications or the cluster's redirect mechanism.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis operations manual: troubleshooting](https://redis.io/docs/latest/operate/oss_and_stack/management/troubleshooting/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [knowledge](/knowledge.md)
