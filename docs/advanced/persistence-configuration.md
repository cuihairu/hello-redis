# Persistence Configuration and Strategy

Redis provides multiple persistence mechanisms for persisting data from memory to disk. The main ones are RDB (Redis DataBase) snapshots and AOF (Append-Only File) logs. Reasonable configuration and selection of the persistence strategy is key to ensuring data safety and performance. The following is a detailed explanation of persistence configuration and strategy.

## RDB configuration and strategy

**RDB** (Redis DataBase) snapshots are Redis's default persistence mechanism, achieving persistence by periodically saving data snapshots to disk. Its configuration and strategy include:

1. **Configuration options**:
   - `save <seconds> <changes>`: Defines when an RDB snapshot is created. The parameters `<seconds>` and `<changes>` set the snapshot to be created when the given number of write operations occurs within the given number of seconds. For example:
     ```plaintext
     save 900 1
     save 300 10
     save 60 10000
     ```
     The above configuration means a snapshot is created when there is 1 modification within 900 seconds, 10 modifications within 300 seconds, or 10000 modifications within 60 seconds.

   - `rdbcompression yes`: Enables compression of the RDB file. Enabled by default to save disk space.
   - `rdbchecksum yes`: Enables a checksum for the RDB file. Enabled by default to ensure file integrity.

2. **RDB snapshot triggers**:
   - **Periodic trigger**: Automatically creates snapshots according to the `save` rules in the configuration file.
   - **Manual trigger**: You can use the `BGSAVE` command to generate an RDB snapshot in the background, or use the `SAVE` command for a blocking snapshot.

3. **RDB file storage**:
   - The snapshot file is stored by default in the Redis data directory, with the file name `dump.rdb`.
   - You can specify the data directory via the `dir` configuration option.

4. **Data recovery**:
   - When Redis starts up, it automatically loads the `dump.rdb` file to restore the database state.

**Advantages**:
- Redis can maintain high performance when creating snapshots.
- The file is smaller (via compression).

**Disadvantages**:
- Data recovery only goes back to the time of the last snapshot, and recent modifications may be lost.
- The snapshot creation process may cause a brief performance dip.

## AOF configuration and strategy

**AOF** (Append-Only File) logs are another persistence mechanism in Redis, achieving persistence by recording every write operation into a log file. Its configuration and strategy include:

1. **Configuration options**:
   - `appendonly yes`: Enables AOF persistence.
   - `appendfsync always`: Syncs to disk immediately after every write operation, ensuring data is not lost but affecting performance.
   - `appendfsync everysec`: Syncs to disk once per second, striking a balance between performance and data safety.
   - `appendfsync no`: Disables AOF syncing (not recommended), which may lead to data loss.

2. **AOF file management**:
   - **File growth**: AOF files grow continuously with write operations. You can use the `BGREWRITEAOF` command to trigger a background AOF file rewrite, generating a new, smaller AOF file.
   - **AOF rewrite**: An AOF file rewrite saves the current database state into a new AOF file and replaces the old file. This process does not affect Redis's normal operation.

3. **Data recovery**:
   - When Redis starts up, if an AOF file exists, it restores the database state by replaying the commands in the AOF file.

**Advantages**:
- Provides higher data durability, recording every write operation.
- Finer-grained recovery, with data restored to the state of the last write operation.

**Disadvantages**:
- AOF files may be large and need periodic rewriting.
- The performance overhead of write operations is higher, especially with the `appendfsync always` configuration.

## Combined configuration

Redis allows both RDB and AOF persistence mechanisms to be enabled simultaneously, and using the two together lets you balance performance and safety while ensuring data durability. Here is an example of combined configuration:

```plaintext
# Enable RDB snapshots
save 900 1
save 300 10
save 60 10000
rdbcompression yes

# Enable AOF persistence
appendonly yes
appendfsync everysec
```

## Persistence strategy selection

1. **High data safety requirements**:
   - It is recommended to enable AOF and configure `appendfsync everysec`, which can provide relatively high data durability.

2. **Performance first**:
   - You can use RDB persistence, or configure AOF with `appendfsync no` (not recommended) to get better performance, suitable for scenarios with a higher tolerance for data loss.

3. **Balance between data safety and performance**:
   - Enable both RDB and AOF persistence simultaneously, balancing performance and data safety by configuring `appendfsync everysec` and periodic snapshots.

Reasonably configuring Redis's persistence strategy can optimize performance while ensuring data safety. Selecting the persistence strategy suited to your own application scenario is key to keeping Redis running efficiently and stably.

## References

- [Redis Operations Manual · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis Operations Manual · Configuration](https://redis.io/docs/latest/operate/oss_and_stack/management/config/)
- [Redis Operations Manual · Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)

## Related pages

- [aof-log](aof-log.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [aof-log](aof-log.md)
