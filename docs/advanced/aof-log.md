# AOF Logs

AOF (Append-Only File) logs are another persistence mechanism provided by Redis, aimed at achieving data persistence by appending every write operation to a log file. This approach complements RDB snapshots and provides higher data safety, and is especially suited for application scenarios with high data durability requirements.

## How it works

1. **Log recording**: When Redis executes each write operation, it appends that operation's command to the AOF file. The AOF file records every write operation on the database and can be used to rebuild the database state.

2. **Rewrite mechanism**: To avoid the AOF file growing without limit, Redis provides an AOF file rewrite feature. Redis periodically writes the current database state into a new AOF file and replaces the old file with the new one. This process is called an AOF file rewrite (AOF Rewrite), and it does not affect Redis's normal operation.

3. **Data recovery**: When Redis starts up, if an AOF file exists, it restores the database state by replaying the commands recorded in the log. The AOF file recovery process is sequential, ensuring accuracy and completeness during recovery.

## Configuration and operations

- **Configuration options**:
  You can set AOF persistence-related options in the `redis.conf` configuration file, for example:
  ```plaintext
  appendonly yes
  appendfsync everysec
  ```
  - `appendonly yes`: Enables AOF persistence.
  - `appendfsync always`: Syncs to disk after every write operation (may affect performance).
  - `appendfsync everysec`: Syncs to disk once per second (a balance between performance and data safety).
  - `appendfsync no`: Does not perform AOF syncing (not recommended, poor data safety).

- **Commands**:
  - `BGREWRITEAOF`: Starts the AOF file rewrite process. Redis generates a new AOF file in the background and replaces the old AOF file with it.
  - `INFO persistence`: View the runtime state of AOF and RDB persistence (such as `aof_enabled` and `aof_rewrite_in_progress`).
  - `CONFIG SET appendonly yes`: Dynamically turn on AOF while running (no Redis restart required).

- **AOF rewrite process**:
  1. Redis starts a new process in the background to perform the AOF file rewrite.
  2. The new process writes the current database state into a new AOF file.
  3. After the rewrite completes, Redis replaces the old file with the new AOF file and deletes the old file.

## Advantages and disadvantages

- **Advantages**:
  - **High data safety**: AOF records every write operation and can provide higher data durability than RDB snapshots, with a smaller data loss window.
  - **Finer-grained recovery**: Each command in the AOF file can precisely restore the data to a particular state.

- **Disadvantages**:
  - **Performance overhead**: Because every write operation is recorded into the AOF file, this may impact Redis performance. `appendfsync everysec` can find a balance between performance and data safety.
  - **AOF file growth**: AOF files grow continuously; although the rewrite mechanism can control the file size, handling large AOF files may take a longer time.

## Use cases

AOF logs are suited for the following scenarios:
- **High data durability requirements**: When data needs to be strictly persisted and the risk of data loss reduced.
- **Frequent write operations**: When every write operation needs to be recorded so that the database state can be rebuilt after a system crash.
- **Real-time recovery**: When you need to quickly recover to a specific state; AOF's command-recording feature provides this capability.

## Examples

The following shows how to manage AOF logs in Redis:

1. **Enable AOF persistence**:
   Set the following in the `redis.conf` configuration file:
   ```plaintext
   appendonly yes
   appendfsync everysec
   ```

2. **Manually trigger an AOF rewrite**:
   ```shell
   redis-cli BGREWRITEAOF
   ```

3. **Check the AOF file state**:
   You can use the `INFO` command in `redis-cli` to view the AOF persistence state:
   ```shell
   redis-cli INFO persistence
   ```

By effectively configuring and managing AOF logs, you can ensure the persistence of Redis data and improve the reliability and data safety of the system.

## References

- [Redis Operations Manual · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis Operations Manual · Persistence (AOF)](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)

## Related pages

- &#8203;data-encryption<!-- EN-LINK: data-encryption.md -->
- &#8203;network-security<!-- EN-LINK: network-security.md -->
- [performance-optimization](performance-optimization.md)
- [persistence-configuration](persistence-configuration.md)
- &#8203;security<!-- EN-LINK: security.md -->

<!-- BACKLINKS-AUTO -->
## Related pages

- &#8203;data-encryption<!-- EN-LINK: data-encryption.md -->
- &#8203;network-security<!-- EN-LINK: network-security.md -->
- [performance-optimization](performance-optimization.md)
- [persistence-configuration](persistence-configuration.md)
- &#8203;security<!-- EN-LINK: security.md -->
- [faq](/appendix/faq.md)
- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
