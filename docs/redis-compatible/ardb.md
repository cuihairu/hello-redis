# Ardb

Ardb is a Redis-compatible NoSQL database written in C++. It lets you choose LevelDB, RocksDB, or LMDB as the underlying persistent storage engine. Its core positioning is "Redis syntax + disk storage", which fits scenarios where the data set is larger than memory but you still want to keep using Redis commands.

## Key features

- **Multiple engine options**: pass `storage-engine` (rocksdb/leveldb/lmdb) as a startup argument, and pick based on your read/write profile.
- **Protocol compatibility**: implements the Redis protocol, supporting common capabilities such as String, Hash, List, Set, ZSet, BitMap, HyperLogLog, and Lua scripting.
- **Master-slave replication**: supports master-slave synchronization based on snapshots and incremental logs, configurable via the `SLAVEOF` command.
- **Multithreading**: network and command handling support multithreaded configuration (`worker-threads`).

## Quick start

```bash
# Build (requires cmake, boost)
git clone https://github.com/yinqiwen/ardb.git
cd ardb && make

# Start (listens on 16379 by default)
./src/ardbd

# Connect with redis-cli
redis-cli -p 16379
127.0.0.1:16379> set hello world
OK
127.0.0.1:16379> zadd rank 100 alice
(integer) 1
127.0.0.1:16379> zrevrange rank 0 -1 withscores
```

## Differences from Redis

- **Different management commands**: for example, the output format of `INFO` and the configuration commands (`CONFIG`) do not fully match Redis, so monitoring tools need to be adapted.
- **Some command semantics differ**: big-key traversal, expiration precision, and persistence file formats all differ from Redis, so RDB/AOF files cannot be swapped directly (Ardb provides its own backup mechanism).
- **Community activity**: Ardb is updated less frequently than Redis. Before adopting it, evaluate how well its maintenance status matches your business needs.

## Use cases

- **Cold data and log-style KV**: storage needs where latency requirements are not extreme but the data volume is large.
- **Testing and development environments**: simulate the Redis interface at low cost and run large-scale integration tests backed by disk capacity.

Project URL: <https://github.com/yinqiwen/ardb>

## References

- Redis official site (no authoritative source found; to be verified)
- [ArDB repository](https://github.com/yinqiwen/ardb)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
