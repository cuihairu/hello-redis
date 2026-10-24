# Pika

Pika is a high-capacity, persistent Redis-compatible store open-sourced by the 360 data platform team, implemented on the RocksDB engine. It aims to solve the problem of "Redis data growing large and memory costs climbing" while staying as compatible as possible with the Redis interface and ecosystem.

## Key features

- **RocksDB storage**: data is written to disk, and only hot data indexes are kept in memory; a single instance can support TB-scale data.
- **Redis protocol compatibility**: supports the common commands for data types such as String, Hash, List, Set, ZSet, BitMap, and Stream; mainstream clients can connect directly.
- **Master-slave replication + Sentinel compatibility**: supports full/incremental synchronization and can work with Redis Sentinel to perform failover.
- **Multithreading**: a multithreaded model for network I/O and command execution that breaks past the single-threaded CPU bottleneck.

## Quick start

```bash
# Build or download a release package (binary packages are provided for CentOS/Ubuntu)
./pika -c conf/pika.conf      # default port 9221

# Connect with redis-cli
redis-cli -p 9221
127.0.0.1:9221> set hello world
OK
127.0.0.1:9221> get hello
"world"
127.0.0.1:9221> hset user:1 name alice age 20
(integer) 2
127.0.0.1:9221> hgetall user:1
1) "name"
2) "alice"
3) "age"
4) "20"
```

## Relationship to Redis

| Dimension | Redis | Pika |
| --- | --- | --- |
| Storage medium | Memory (RDB/AOF written to disk) | RocksDB on disk, with memory as cache |
| Single-instance capacity | Limited by memory (usually < 100 GB) | TB scale |
| Latency | Sub-millisecond | Usually higher than Redis (disk I/O is involved) |
| Compatibility | Full | Common commands compatible; management commands and some features differ |

## Use cases and notes

- **Replace "Redis cluster storing cold data"**: moving a large volume of infrequently accessed data (such as historical orders or user profile tags) from Redis to Pika can cut costs significantly.
- **Workloads with a high write proportion**: scenarios that write a lot and are latency-sensitive need to be tested in practice, since RocksDB write amplification may become a bottleneck.
- **Command compatibility**: support for Lua scripting, publish/subscribe, and so on is limited or has semantic differences; check against a command checklist before migrating. The `pika` version iterates quickly, so review the compatibility notes in its wiki.
- **Operations**: pay attention to disk capacity and compaction, master-slave sync bandwidth, and how it maps to the Redis version protocol.

Project URL: <https://github.com/OpenAtomFoundation/pika>

## References

- Redis official site (no authoritative source found; to be verified)
- [Pika (PikiwiDB)](https://github.com/OpenAtomFoundation/pikiwidb)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](README.md)
