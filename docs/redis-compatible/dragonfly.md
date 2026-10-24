# Dragonfly

Dragonfly is an in-memory data store written in C++, compatible with the Redis and Memcached APIs. It uses a "shared-nothing" multithreaded architecture, with the goal of supporting more memory and higher throughput on a single node.

## Architecture features

- **Shared-nothing multithreading**: each thread exclusively owns a portion of the key space and its data structures, so no global lock is needed. Compared with Redis's single-threaded model, it can use multiple cores to handle more concurrent requests.
- **Dash table**: uses a hash table optimized for multithreading to replace the traditional chained hash, supporting incremental resizing without global pauses.
- **Efficient replication**: uses versioned replication (VSF - Versioned Snapshot Log); replica nodes do not depend on a backlog buffer when syncing, so the cost of reconnecting after a disconnect is low.
- **Memory efficiency**: the implementation uses a "memory compaction + lazy reclamation" strategy, and official data shows lower memory usage than Redis for the same amount of data.

## Quick start

```bash
# Docker approach (most common)
docker run --network=host --ulimit memlock=-1 docker.dragonflydb.io/dragonflydb/dragonfly

# Connect directly with redis-cli (default port 6379)
redis-cli
127.0.0.1:6379> SET greeting hello
127.0.0.1:6379> GET greeting
```

Dragonfly uses the Redis protocol directly, so mainstream client libraries can connect without changes.

## Compatibility with Redis

- **Supported**: String, Hash, List, Set, Sorted Set, Bitmap, HyperLogLog, Stream, publish/subscribe, Lua scripting (`EVAL`), transactions, `KEYS`/`SCAN`, and more.
- **Partially supported or different**: cluster mode (can be implemented via the officially recommended proxy or client-side sharding), some management commands and configuration item names differ, and RDB/AOF are compatible but the snapshot mechanism is its own implementation (`--snapshot_cron`, `--save_schedule`).
- **Not aiming for full parity**: Dragonfly explicitly targets "compatibility with commonly used APIs", so before migrating you should check a compatibility checklist against the commands your business actually uses.

## Use cases

- **Single-instance data beyond Redis's comfort zone (tens of GB or more)**: a single Dragonfly node can support TB-scale memory.
- **High-concurrency reads and writes that need to use multiple cores**: take advantage of the CPU horizontally without splitting data across multiple Redis instances.
- **Migration assessment points**: Lua script compatibility, the persistence recovery workflow, monitoring metrics integration (its Prometheus metrics differ from Redis's), and the license (Dragonfly uses BSL 1.1; see the timeline for the switch to Apache 2.0 in its repository).

## References

- Redis official site (no authoritative source found; to be verified)
- [Dragonfly official site](https://www.dragonflydb.io/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
