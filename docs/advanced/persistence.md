# Persistence

Redis's persistence mechanisms let you recover data after the Redis server restarts or crashes. When I troubleshoot data recovery and loss windows, I focus on how these two mechanisms work, their configuration options, and their applicable scenarios: RDB snapshots and AOF logs.

---

## RDB snapshots

RDB (Redis DataBase) snapshots are a persistence mechanism provided by Redis, achieving data persistence by periodically saving a snapshot of the database.

- **How it works**: An RDB snapshot saves the current state of the Redis database as a binary file. Redis generates a snapshot at predetermined time intervals or when certain conditions are met, and the snapshot file can be used to restore the database state.
- **Configuration**: You can specify the conditions for generating a snapshot via the `save` option in the `redis.conf` configuration file. For example, `save 900 1` means a snapshot is generated if there is at least one write operation within 900 seconds. You can adjust these settings according to your business needs.
- **Advantages**: RDB snapshots are well suited for periodic backups and recover relatively fast. When using `BGSAVE` to generate a snapshot in the background, the main thread is not blocked (there is only a brief delay when forking the child process), so the impact on Redis performance is small. Using `SAVE` to generate a snapshot synchronously blocks the main thread, but it guarantees data consistency.
- **Disadvantages**: RDB snapshots are a time-based persistence mechanism, and the data loss window is the time interval between the last snapshot and the failure. When using `BGSAVE`, the main thread is not blocked, but forking the child process on a large-memory instance can cause a brief delay; using `SAVE` to generate a snapshot synchronously blocks other operations, which may affect high-throughput applications.

**Related commands:**
- `BGSAVE`: Asynchronously save the current database snapshot in the background.
- `SAVE`: Synchronously save the current database snapshot; other commands are blocked while it runs.

---

## AOF logs

AOF (Append-Only File) logs are another persistence mechanism in Redis, achieving data persistence by recording every write operation on the database.

- **How it works**: AOF appends each write operation to the log file. When Redis starts up, it replays the operations in the AOF file to restore the database state. The AOF file can be configured to sync after every write operation, once per second, or never.
- **Configuration**: You can enable AOF persistence via the `appendonly` option in the `redis.conf` configuration file, and use the `appendfsync` option to control the sync strategy. For example, `appendfsync everysec` means the AOF file is synced once per second.
- **Advantages**: AOF provides stronger data durability guarantees, and you can balance performance against data safety by configuring the sync strategy. Even after a Redis crash, the most data possible can be recovered.
- **Disadvantages**: AOF files grow over time, which may slow down recovery. To optimize AOF file size, Redis provides an AOF rewrite mechanism to periodically compress the log file.

**Related commands:**
- `BGREWRITEAOF`: Asynchronously rewrite the AOF file in the background, compressing the log file and reducing its size.

---

## Persistence configuration and strategy

- **Configuration**: Choosing the right persistence strategy is key to ensuring the reliability of Redis data. You can choose RDB, AOF, or both together according to your business needs. RDB is suited for data backup and recovery, while AOF is suited for scenarios that need minimal data loss.
- **Strategy selection**: In general, using RDB and AOF together provides higher data durability and flexibility. RDB is used for fast recovery, and AOF is used to minimize data loss.

In practice, you should choose the most suitable persistence configuration based on your system's performance requirements, data safety needs, and backup strategy. Proper configuration and management ensure the high availability and data reliability of Redis.

## References

- [Redis Operations Manual · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis Operations Manual · Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
