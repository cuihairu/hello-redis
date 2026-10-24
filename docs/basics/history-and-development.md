# Redis History and Development

Redis is an open-source, in-memory data structure store created by Salvatore Sanfilippo (alias antirez) in 2009. It was designed as a simple yet powerful way to work with a variety of data structures, with high performance and high availability. Here is an overview of its history and evolution.

## Early development

- **2009**:
  - The first version of Redis was released. Initially, Redis was a key-value store written in C, aimed at workloads with very high performance requirements.

- **2010**:
  - Redis 1.0 was released, introducing RDB snapshots for persistence.
  - Support began for Redis's richer data structures, such as lists (List) and sets (Set).

## Version evolution

- **2010**:
  - Redis 2.0 was released, bringing the hash (Hash) type, pub/sub (Pub/Sub), and blocking pop commands (BLPOP, BRPOP).

- **2011**:
  - Redis 2.2 was released, introducing `WATCH`-based check-and-set transactions and similar features.
  - Redis 2.4 was released, moving AOF rewriting into a background child process and improving memory management and persistence options.

- **2012**:
  - Redis 2.6 was released, with built-in Lua scripting support (`EVAL`, `EVALSHA`, `SCRIPT LOAD`). Lua scripting has been the primary way to extend Redis ever since.

- **2014**:
  - Redis 2.8.9 introduced the HyperLogLog data structure (`PFADD`, `PFCOUNT`, `PFMERGE`); the 2.8 series also brought replication improvements such as partial resynchronization (PSYNC).

- **2015**:
  - Redis 3.0 was released, marking the introduction of Redis Cluster mode. Redis Cluster supports data sharding and high availability in distributed environments, letting data be sharded automatically across many nodes.

- **2016**:
  - Redis 3.2 was released, introducing geospatial features (`GEOADD`, `GEOPOS`, `GEODIST`, `GEOHASH`, `GEORADIUS`, `GEORADIUSBYMEMBER`), transaction improvements, and other performance optimizations and new commands. Note: the stream (Stream) data structure was not introduced in this version — it shipped with 5.0.

- **2017**:
  - Redis 4.0 was released, introducing the module system (Modules), lazy freeing, PSYNC2, and RDB-AOF hybrid persistence, bringing more efficient memory usage and data persistence mechanisms.

- **2018**:
  - Redis 5.0 was released, introducing new data structures (such as Stream) and better support for Redis Cluster mode, further improving performance and functionality.

- **2019**:
  - Redis 5.0.8 was released, focused mainly on bug fixes and minor improvements. The Redis 5.x series continued to support the existing feature set.

- **2020**:
  - Redis 6.0 was released, introducing multithreaded network I/O, ACL (access control lists), client-side caching, and the RESP3 protocol. Multithreaded I/O improved Redis's performance under heavy load (the module system had already been introduced in 4.0).

- **2021**:
  - Redis 6.2 was released, introducing enhanced module support, new commands, and improved performance, further strengthening Redis's capabilities and flexibility.

- **2022**:
  - Redis 7.0 was released, bringing further feature improvements and performance optimizations, including an improved module system and new data structure features.

## Key developments

1. **Modularity**:
   - Redis evolved from a simple key-value store into a feature-rich database with modular extension. The Redis module system lets users create and integrate custom data structures and features.

2. **Cluster support**:
   - Cluster mode lets Redis provide high availability and data sharding in distributed environments — a major milestone in its development.

3. **Multithreading and performance optimization**:
   - Multithreaded I/O support and other performance optimizations make Redis perform well under heavy load and with complex operations.

4. **Community and ecosystem**:
   - Redis has an active open-source community and a broad ecosystem. Many enterprises and open-source projects rely on Redis and have contributed substantial resources and code to its development.

Redis's continued development and community support have made it an indispensable component of modern software architecture, suitable for everything from simple caching to complex real-time data processing.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis source repository](https://github.com/redis/redis)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
