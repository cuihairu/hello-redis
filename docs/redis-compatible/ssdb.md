# SSDB

SSDB is a high-performance NoSQL database written in C++. It uses LevelDB/RocksDB as its underlying storage engine, storing data on disk while exposing a command interface that is highly similar to Redis. It fits the scenario of "data volume far exceeds memory, yet you still want to keep using a Redis-style API."

## Main features

- **Disk storage**: data is persisted on disk, memory serves only as a cache, capacity is not limited by memory, and the cost is far lower than pure in-memory solutions.
- **Redis-like interface**: supports types such as String, Hash, List, ZSet and Map, with command names mostly identical to Redis.
- **Master-replica replication**: built-in master-replica synchronization, usable for read/write splitting and disaster recovery.
- **Multilingual clients**: PHP, Java, Python and more.

## Quick start

```bash
# compile and install
wget --no-check-certificate https://github.com/ideawu/ssdb/archive/master.zip
unzip master.zip && cd ssdb-master && make

# start (default port 8888)
./ssdb-server ssdb.conf

# connect
./ssdb-cli -p 8888
ssdb 127.0.0.1:8888> set k v
ok
ssdb 127.0.0.1:8888> get k
v
```

## Command mapping against Redis

| Function | Redis | SSDB |
| --- | --- | --- |
| String | `SET` / `GET` | `set` / `get` |
| Hash | `HSET` / `HGET` | `hset` / `hget` |
| List | `LPUSH` / `LRANGE` | `qpush` / `qrange` (queue naming) |
| Sorted set | `ZADD` / `ZRANGE` | `zset` / `zrange` |
| Expiration | `EXPIRE` | `expire` (granularity and behavior differ from Redis) |

Note: SSDB's list commands use the `q` (queue) prefix, such as `qpush`, `qpop` and `qrange`, which do not map exactly onto Redis's `LPUSH`/`LRANGE`.

## Applicable scenarios and caveats

- **Massive KV, historical data storage**: for example log indexes, crawler data, and detailed user behavior records, with capacity reaching the TB scale.
- **Performance expectations**: read performance is close to an in-memory cache, while write performance is limited by disk; data that is extremely latency-sensitive should still live in Redis.
- **Compatibility differences**: Redis features such as Lua scripts, transactions, Streams, and pub/sub are either unsupported or differ in semantics, so SSDB cannot be treated as a "full-featured Redis replacement."
- **Operations**: you need to watch RocksDB compaction and disk space; master-replica failover must be handled by your own scripts, or by its Sentinel-like tooling (SSDB master-replica management is manual / script-driven).

Project URL: <https://github.com/ideawu/ssdb>

## References

- Redis official site (no authoritative source found; to be verified)
- [SSDB official site](https://ssdb.io/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](README.md)
