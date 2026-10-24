# Other Open-Source Projects Compatible with Redis

Around the Redis protocol and API, the community has many compatible implementations, proxies, and tools: some focus on multithreaded performance or data capacity, while others offer protocol-level client implementations. Below are a few projects I have followed:

- [Valkey](valkey.md): A high-performance in-memory database forked from Redis 7.2 and hosted by the Linux Foundation.
- [KeyDB](keydb.md): A fork of the Redis codebase with multithreading and master-replica improvements.
- [Dragonfly](dragonfly.md): A multithreaded Redis/Memcached-compatible server using a shared-nothing architecture.
- [SSDB](ssdb.md): A persistent key-value service based on LevelDB/RocksDB that provides a Redis-like interface.
- [Pika](pika.md): A high-capacity Redis-compatible store based on RocksDB, open-sourced by 360.
- [Ardb](ardb.md): A Redis-compatible database that uses RocksDB as its backend.
- [Tile38](tile38.md): A spatial database focused on geospatial queries, compatible with the Redis protocol.
- [Predis](predis.md): A Redis client library for PHP (a protocol-compatible client).
- [Medis](medis.md): A graphical desktop Redis client for developers.
- [Compatible Projects Overview](open-source-projects.md): A summary comparison of compatible implementations, proxies, and tools.

## Selection Considerations

- **Protocol compatibility:** Confirm that required features such as commands, Lua scripting, transactions, and Streams are supported, and run a smoke test with your existing client first.
- **Operations ecosystem:** Check whether Sentinel, Cluster, persistence, and backup tools are available, and whether there are corresponding monitoring metrics.
- **License and maintenance:** Pay attention to the open-source license and community activity to avoid choosing an unmaintained project.
- **Clear benefits:** It is only worth introducing an alternative implementation when single-instance memory capacity, multicore throughput, or cost has become a clear bottleneck.

## References

- Redis official site (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [ecosystem](/advanced-topics/ecosystem.md)
- [knowledge](/knowledge.md)
