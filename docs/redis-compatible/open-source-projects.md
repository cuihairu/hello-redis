# Redis-compatible open source projects

In addition to the specific projects introduced above, there are many open source implementations and surrounding tools built around the Redis protocol. This page groups them by category to make it easier to search for what you need.

## In-memory compatible implementations

| Project | Language | Features |
| --- | --- | --- |
| Valkey | C | Fork of Redis 7.2, BSD license, 8.x introduces enhanced multithreaded I/O |
| KeyDB | C++ | Redis fork with multithreaded I/O and Active Replication |
| Dragonfly | C++ | Shared-nothing multithreading, single node supporting TB-scale memory |
| MemoryDB-like cloud services | - | Cloud-vendor-managed Redis-compatible services (such as ElastiCache, MemoryDB) |

## Disk-based / high-capacity compatible implementations

| Project | Engine | Features |
| --- | --- | --- |
| Pika | RocksDB | Open-sourced by 360, TB-scale capacity, common Redis commands compatible |
| SSDB | LevelDB/RocksDB | Persistent KV with a Redis-like interface |
| Ardb | RocksDB/LevelDB/LMDB | Redis-compatible service with multiple selectable engines |
| TiKV | RocksDB | Distributed KV, compatible with part of the Redis protocol (limited Redis API support) |

## Domain-specific compatible implementations

| Project | Domain | Notes |
| --- | --- | --- |
| Tile38 | Geospatial | Geofencing and spatial queries, communicating over the Redis protocol |
| Garnet | In-memory KV | High-throughput Redis-compatible service implemented in C# by Microsoft Research |
| Vert.x Redis and others | Embedded/in-framework | Redis protocol service implementations provided within frameworks |

## Proxy and sharding middleware

- **Twemproxy (nutcracker)**: a lightweight proxy open-sourced by Twitter, supporting the Redis/Memcached protocols and providing consistent hashing sharding;
- **Codis**: a proxy + console Redis sharding solution supporting online migration (written in Go, no longer actively maintained but still widely known);
- **Predixy**: a high-performance Redis cluster proxy supporting multi-tenant forwarding of the full Redis protocol.

## Client libraries

| Language | Libraries |
| --- | --- |
| Python | redis-py (including asyncio), aioredis (now merged into redis-py) |
| Java | Jedis, Lettuce, Redisson, Spring Data Redis |
| Go | go-redis |
| Node.js | node-redis, ioredis |
| PHP | phpredis (extension), Predis (pure PHP) |
| C/C++ | hiredis, redis-plus-plus |
| .NET | StackExchange.Redis, FreeRedis |

## GUI and management tools

- **RedisInsight**: the official GUI, including slow query analysis and a cluster view;
- **Another Redis Desktop Manager**: an open source, lightweight desktop client;
- **Medis**: a desktop client with a good macOS experience.

## Operations and testing tools

- **redis-benchmark**: the official benchmarking tool;
- **memtier_benchmark**: a load-testing tool open-sourced by Redis Labs, supporting more complex read/write ratios and data models;
- **redis-rdb-tools**: parses RDB offline to count memory and big keys;
- **redis_exporter**: a Prometheus metrics collector;
- **YCSB / romper and other general KV load-testing frameworks**: used when comparing performance across implementations.

## Selection summary

1. First identify the bottleneck type: memory capacity (consider Pika/Dragonfly), multicore throughput (Valkey/Dragonfly/KeyDB), license (Valkey), or features (modules/specialized databases);
2. Verify compatibility with your real business command checklist, not just `SET`/`GET`;
3. Proxy-based solutions need an assessment of operational complexity and failure modes (the proxy itself becomes a new single point).

## References

- Redis official site (no authoritative source found; to be verified)
- [Redis source repository](https://github.com/redis/redis)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](README.md)
