# KeyDB

KeyDB is a fork of the Redis source code (later maintained by Snap Inc.) whose goal is to "raise single-node throughput with multithreading while staying Redis-compatible". It is compatible with the Redis protocol and most commands, so it can replace an existing deployment directly.

## Key features

- **Multithreading**: processes I/O from multiple connections in parallel via a network thread pool; command execution still maintains consistency through KeyDB's mechanism, and the thread count is configurable via `server-threads`.
- **Redis compatibility**: uses the same client protocol and data types, so redis-cli and mainstream client libraries work directly.
- **Active Replication**: supports multi-master replication, where multiple nodes can accept writes at the same time.
- **Optional storage engine**: supports Flash Storage (put cold data on flash, paired with SSD) to lower memory costs.
- **Enhancements such as subkey expiration**: offers finer-grained `EXPIRE` options and some extension commands.

## Quick start

```bash
# Install from the official Debian/Ubuntu repository
sudo apt install keydb

# Or Docker
docker run -d --name keydb -p 6379:6379 eqalpha/keydb

# Start (the command-line interface is compatible with redis-server)
keydb-server /etc/keydb/keydb.conf --server-threads 4
```

Connect with redis-cli to verify:

```bash
redis-cli
127.0.0.1:6379> SET k v
127.0.0.1:6379> GET k
```

## Differences from Redis

| Aspect | KeyDB | Redis |
| --- | --- | --- |
| Network handling | Multithreaded (`server-threads`) | Single-threaded (optional `io-threads`) |
| Multi-master replication | Supports Active Replication | Not supported (master-slave/cluster only) |
| Persistence | Compatible with RDB/AOF, plus Flash Storage | RDB/AOF |
| Scripting and transactions | Compatible | Compatible |

## Use cases and notes

- **Single-instance CPU not saturated, with a large number of connections**: multithreaded I/O can raise throughput and reduce the number of shards.
- **Multi-master writes needed**: Active Replication suits writes from multiple data centers, but you need to understand the conflict resolution semantics (by version and timestamp).
- **Verify compatibility first**: KeyDB's version iterations are not in sync with the Redis mainline, so support for new commands (such as Redis 7 Functions) needs to be tested on the version you use.
- **License change**: after 6.3.x, KeyDB switched to a BSPL license (attribution required). Read its LICENSE before commercial use.

## References

- Redis official site (no authoritative source found; to be verified)
- [KeyDB documentation](https://docs.keydb.dev/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [other](/basics/other.md)
- [README](README.md)
