# Glossary

The canonical English term, a one-line definition, the authoritative source and related pages for core Redis terminology.

**Maintenance note**: every new entry must cite a clickable authoritative source; if you cannot find one, write "no authoritative source found (to verify)" — never invent links from memory.

## Persistence

### AOF (Append-Only File)
One of Redis's persistence mechanisms: every write command is appended to a log, which is replayed on restart to restore the data.
**Source**: [Redis ops manual · Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
**Source**: [aof.c (AOF implementation)](https://github.com/redis/redis/blob/unstable/src/aof.c)
**Related pages**: [AOF log](/advanced/aof-log), [AOF persistence implementation](/source-code-analysis/persistence/aof)

### Persistence
The process of writing in-memory data to disk; Redis offers RDB and AOF, plus a hybrid mode.
**Source**: [Redis ops manual · Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
**Related pages**: [Persistence](/advanced/persistence), [RDB snapshot](/advanced/rdb-snapshot), [AOF log](/advanced/aof-log)

### Snapshot (RDB)
A binary image of the entire Redis dataset at a point in time, produced by `SAVE`/`BGSAVE`; used for persistence and replication.
**Source**: [Redis ops manual · Persistence (RDB)](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
**Related pages**: [RDB snapshot](/advanced/rdb-snapshot), [RDB persistence implementation](/source-code-analysis/persistence/rdb)

### RDB (Redis Database)
Redis's binary full-snapshot persistence format: compact files and fast restore, well suited to backup and disaster recovery.
**Source**: [Redis ops manual · Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
**Source**: [rdb.c (RDB implementation)](https://github.com/redis/redis/blob/unstable/src/rdb.c)
**Related pages**: [RDB snapshot](/advanced/rdb-snapshot), [RDB persistence implementation](/source-code-analysis/persistence/rdb)

### COW (Copy-On-Write)
When a forked child process performs an RDB save or AOF rewrite, parent and child share physical pages; a page is copied only when it is modified, which reduces memory overhead.
**Source**: [Redis ops manual · Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
**Related pages**: [RDB snapshot](/advanced/rdb-snapshot), [Persistence](/advanced/persistence)

## Memory and Eviction

### Max memory (maxmemory)
The ceiling on memory a Redis instance may use; once it is exceeded, eviction is applied according to `maxmemory-policy`.
**Source**: [Redis ops manual · Configuration](https://redis.io/docs/latest/operate/oss_and_stack/management/config/)
**Related pages**: [Redis configuration file in detail](/basics/configuration-file), [Memory management](/source-code-analysis/memory-management)

### Eviction
The mechanism that deletes keys according to a keyspace policy once memory reaches the maxmemory ceiling; supports policies such as LRU and LFU.
**Source**: [Redis ops manual · Optimization](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/)
**Source**: [expire.c (expiry and eviction)](https://github.com/redis/redis/blob/unstable/src/expire.c)
**Related pages**: [Memory optimization strategies](/source-code-analysis/memory-management/optimization), [Redis configuration file in detail](/basics/configuration-file)

### LRU / LFU (Least Recently/Frequently Used)
Two memory eviction policies: LRU evicts the least recently used keys, LFU evicts the least frequently accessed keys (4.0+).
**Source**: [Redis ops manual · Optimization](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/)
**Related pages**: [Memory management](/source-code-analysis/memory-management), [Redis configuration file in detail](/basics/configuration-file)

### TTL (Time To Live)
The remaining lifetime of a key; it is deleted automatically when it expires. Check it with `TTL`, set it with `EXPIRE`.
**Source**: EXPIRE command (no authoritative source found (to verify))
**Source**: TTL command (no authoritative source found (to verify))
**Related pages**: [Redis key operations](/basics/key-operations), [Memory management](/source-code-analysis/memory-management)

## Data Types

### Hash
A mapping data type from fields to values, well suited to storing objects, with single-field read and write.
**Source**: [Redis dev docs · Hashes](https://redis.io/docs/latest/develop/data-types/hashes/)
**Related pages**: [Redis hash](/basics/hash), [Shopping cart](/use-cases/shopping-cart)

### HyperLogLog (HLL)
A probabilistic data structure for cardinality estimation: about 12 KB of fixed memory estimates the number of distinct elements in a huge set.
**Source**: [Redis dev docs · Probabilistic](https://redis.io/docs/latest/develop/data-types/probabilistic/)
**Related pages**: [Redis HyperLogLog](/basics/hyperloglog), [Real-time analytics](/use-cases/real-time-analytics)

### GEO (Geospatial)
A geospatial data structure built on sorted sets and GeoHash, supporting radius and range queries.
**Source**: [Redis dev docs · Geospatial](https://redis.io/docs/latest/develop/data-types/geospatial/)
**Related pages**: [Redis geospatial data](/basics/geospatial), [Geospatial indexing](/use-cases/geospatial-indexing)

### GeoHash
A geocoding algorithm that encodes 2D latitude/longitude into a single integer, making it easy to sort a sorted set by location.
**Source**: [Redis dev docs · Geospatial](https://redis.io/docs/latest/develop/data-types/geospatial/)
**Related pages**: [Redis geospatial data](/basics/geospatial), [Case study: location-based services](/use-cases/geolocation-services/location-based)

### SDS (Simple Dynamic String)
Redis's internal binary-safe string implementation: it records the length and preallocates space, avoiding buffer overflows.
**Source**: [sds.c (SDS implementation)](https://github.com/redis/redis/blob/unstable/src/sds.c)
**Related pages**: [Data structure implementation](/source-code-analysis/data-structures/implementation), [Data structures and algorithms](/source-code-analysis/data-structures)

### listpack
A compact sequential storage encoding that fully replaced ziplist starting with Redis 7, eliminating the cascading-update problem.
**Source**: [listpack.c (listpack implementation)](https://github.com/redis/redis/blob/unstable/src/listpack.c)
**Related pages**: [Data structure implementation](/source-code-analysis/data-structures/implementation), [Data structures and algorithms](/source-code-analysis/data-structures)

### ziplist
The compact sequential encoding used before listpack; it suffers from cascading updates and was phased out starting with Redis 7.
**Source**: [ziplist.c (ziplist implementation)](https://github.com/redis/redis/blob/unstable/src/ziplist.c)
**Related pages**: [Data structures and algorithms](/source-code-analysis/data-structures), [Data structure implementation](/source-code-analysis/data-structures/implementation)

### Skiplist
The multi-level index structure behind sorted sets, supporting O(log N) lookup and range queries.
**Source**: [t_zset.c (skiplist implementation)](https://github.com/redis/redis/blob/unstable/src/t_zset.c)
**Source**: [Redis dev docs · Sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)
**Related pages**: [Data structure implementation](/source-code-analysis/data-structures/implementation), [Redis sorted set](/basics/zset)

## Cluster and High Availability

### Cluster
Redis's official multi-node sharding solution: data is distributed across hash slots, and automatic failover is supported.
**Source**: [Redis cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)
**Related pages**: [Redis Cluster mode](/advanced/cluster), [Redis cluster implementation](/source-code-analysis/cluster)

### Sharding
The mechanism of distributing data across multiple nodes; Redis Cluster uses a fixed 16384 hash slots to carry the shards.
**Source**: [Redis cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)
**Related pages**: [Redis Cluster mode](/advanced/cluster), [Redis cluster implementation](/source-code-analysis/cluster)

### Slot
Redis Cluster has a fixed 16384 hash slots; a key is placed on a slot and node by CRC16 modulo.
**Source**: [Redis cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)
**Related pages**: [Redis Cluster mode](/advanced/cluster), [Redis cluster implementation](/source-code-analysis/cluster)

### Replication
The primary node synchronizes data changes to multiple replicas, providing read/write splitting and data redundancy.
**Source**: [Redis ops manual · Replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/)
**Related pages**: [Master-slave replication](/advanced/replication), [Data sharding and replication](/source-code-analysis/cluster/sharding-replication)

### Sentinel
Redis's official high-availability solution: it monitors the master-slave topology and automatically performs failover and configuration delivery.
**Source**: [Redis ops manual · Sentinel](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/)
**Related pages**: [Sentinel mode](/advanced/sentinel), [High availability](/advanced/high-availability)

### Redlock
An algorithm for distributed locks across multiple independent Redis instances, avoiding lock loss caused by a single point of failure.
**Source**: [Redis official patterns · Distributed locks](https://redis.io/docs/latest/develop/use/patterns/distributed-locks/)
**Related pages**: [Distributed locks](/use-cases/distributed-locks), [Basic principles of implementing a distributed lock](/development/distributed-lock)

## Performance and Operations

### Slow Log
Records commands whose execution time exceeds `slowlog-log-slower-than`, used to locate performance bottlenecks.
**Source**: SLOWLOG GET command (no authoritative source found (to verify))
**Related pages**: [Redis performance monitoring and tuning](/advanced/performance-monitoring), [Redis cluster monitoring and troubleshooting](/operations/monitoring-and-troubleshooting)

### Latency Spike
A brief spike in latency; common triggers include fork, disk flushing and slow commands.
**Source**: [Redis ops manual · Debugging (latency)](https://redis.io/docs/latest/operate/oss_and_stack/management/debugging/)
**Related pages**: [Redis performance monitoring and tuning](/advanced/performance-monitoring), [Redis cluster monitoring and troubleshooting](/operations/monitoring-and-troubleshooting)

### Progressive Rehashing
When a dictionary resizes, keys are migrated gradually, one bucket per operation, so a single rehash never blocks the main thread.
**Source**: [dict.c (progressive rehash implementation)](https://github.com/redis/redis/blob/unstable/src/dict.c)
**Related pages**: [Data structure implementation](/source-code-analysis/data-structures/implementation), [Data structures and algorithms](/source-code-analysis/data-structures)

## Commands and Protocol

### ACL (Access Control List)
A multi-user permission model introduced in Redis 6, granting fine-grained authorization per user, command and key pattern.
**Source**: ACL LIST command (no authoritative source found (to verify))
**Related pages**: [Authentication and authorization](/advanced/authentication-and-authorization), [What's new in Redis 6](/advanced-topics/redis-6-features)

### RESP (Redis Serialization Protocol)
The communication protocol between Redis clients and servers, with RESP2 and RESP3 versions.
**Source**: [RESP protocol specification](https://redis.io/docs/latest/develop/reference/protocol-spec/)
**Related pages**: [Redis protocol overview](/source-code-analysis/network-protocol/protocol-overview), [Network protocol](/source-code-analysis/network-protocol)

### Transaction
A group of commands wrapped in `MULTI`/`EXEC` that execute atomically, without other clients' commands interleaved in between.
**Source**: MULTI command (no authoritative source found (to verify))
**Related pages**: [Redis basic operations](/basics/basic-operations), [Developing with Redis](/development/using-redis)

### Pipeline
The client sends multiple commands at once and reads the responses in batch, reducing network round-trip overhead.
**Source**: [Redis dev docs · Using commands](https://redis.io/docs/latest/develop/using-commands/)
**Related pages**: [Network protocol](/source-code-analysis/network-protocol), [Redis basic operations](/basics/basic-operations)

### Pub/Sub
A channel-based message broadcast mechanism: producers publish to channels, subscribers receive in real time.
**Source**: [Redis dev docs · Pub/Sub](https://redis.io/docs/latest/develop/pubsub/)
**Related pages**: [Case study: real-time chat application](/use-cases/chat-system/real-time-chat), [Message queues](/use-cases/message-queues)

### Sharded Pub/Sub
Shard-level Pub/Sub introduced in Redis 7: messages are delivered only within the shard that owns the key (7.0+).
**Source**: [Redis dev docs · Pub/Sub](https://redis.io/docs/latest/develop/pubsub/)
**Related pages**: [Case study: real-time chat application](/use-cases/chat-system/real-time-chat), [Redis Cluster mode](/advanced/cluster)

### Lua Script
Run multiple commands atomically on the server with `EVAL`, reducing round trips and guaranteeing atomicity.
**Source**: [Redis dev docs · Lua scripting introduction](https://redis.io/docs/latest/develop/programmability/eval-intro/)
**Related pages**: [EVAL command](/scripts/lua/eval), [EVALSHA command](/scripts/lua/evalsha)

### Script Cache
The server caches the SHA1 digest of Lua scripts; `EVALSHA` replays a script directly by digest.
**Source**: EVALSHA command (no authoritative source found (to verify))
**Related pages**: [EVALSHA command](/scripts/lua/evalsha), [EVAL command](/scripts/lua/eval)

## Concepts and Community Terms

### Cache Penetration
Requests for data that does not exist, bypassing the cache and hitting the database. (Common community term; no dedicated Redis official page, to verify)
**Source**: [Redis dev docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
**Related pages**: [Caching](/use-cases/caching), [1. Cache layer integration](/development/cache-integration)

### Cache Breakdown
A hot key expires and a burst of requests hits the origin at the same instant. (Common community term; no dedicated Redis official page, to verify)
**Source**: [Redis dev docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
**Related pages**: [Caching](/use-cases/caching), [1. Cache layer integration](/development/cache-integration)

### Cache Avalanche
A large number of keys expire at once and overwhelm the database. (Common community term; no dedicated Redis official page, to verify)
**Source**: [Redis dev docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
**Related pages**: [Caching](/use-cases/caching), [1. Cache layer integration](/development/cache-integration)

### Consistent Hashing
A hash sharding scheme that balances the amount of data migrated when nodes are added or removed. (Redis Cluster uses hash slots rather than consistent hashing, to verify)
**Source**: [Redis cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)
**Related pages**: [Redis Cluster mode](/advanced/cluster), [Redis cluster implementation](/source-code-analysis/cluster)

### Rank
The position of an element in a sorted set (zero-based), queryable with `ZRANK`/`ZREVRANK`.
**Source**: [Redis dev docs · Sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)
**Source**: ZREVRANGE command (no authoritative source found (to verify))
**Related pages**: [Leaderboards](/use-cases/leaderboards), [Connecting to Redis](/use-cases/ranking-and-counting/ranking)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [knowledge](/knowledge.md)
