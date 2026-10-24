# RDB Snapshots

RDB (Redis DataBase) snapshots are a persistence mechanism in Redis, achieving data persistence by periodically saving the database state as a binary snapshot file. RDB snapshots are suited for scenarios that need periodic data backups and fast data recovery after a system crash.

## How it works

1. **Generating snapshots**: An RDB snapshot is created by saving the current state of the Redis database to disk as a binary file. Redis can generate snapshots asynchronously in the background, avoiding blocking the main thread and thus reducing the impact on performance.

2. **Save conditions**: Snapshot generation is based on time or write-operation conditions. The `save` option in the Redis configuration file lets users specify the conditions for generating a snapshot. For example, `save 900 1` means that if there is at least one write operation within 900 seconds, Redis generates a snapshot.

3. **Snapshot file**: The generated snapshot file is usually named `dump.rdb` and stored in the Redis data directory. The file contains the complete state of the Redis database and can be used to restore the database.

4. **Data recovery**: When Redis starts up, if it finds a `dump.rdb` file, it automatically loads the data from that file, restoring the database to the state at the time of the snapshot.

## Configuration and operations

- **Configuration options**: Set the RDB snapshot generation conditions in the `redis.conf` configuration file. For example:
  ```plaintext
  save 900 1
  save 300 10
  save 60 10000
  ```
  The above configuration means:
  - If there is at least 1 write operation within 900 seconds, generate a snapshot.
  - If there are at least 10 write operations within 300 seconds, generate a snapshot.
  - If there are at least 10000 write operations within 60 seconds, generate a snapshot.

- **Commands**:
  - `BGSAVE`: Asynchronously generate an RDB snapshot in the background. Redis forks a child process to perform the save operation, and the main process continues to handle client requests.
  - `SAVE`: Synchronously generate an RDB snapshot; other commands are blocked while it runs. This command is suitable for scenarios that need an immediate snapshot, but it may impact Redis performance.
  - `LASTSAVE`: Returns the timestamp of the last successful RDB snapshot.

## Advantages and disadvantages

- **Advantages**:
  - **Small performance impact**: Because snapshot generation happens in the background, it does not affect the performance of the main thread.
  - **Fast recovery**: RDB snapshot files are usually small, and recovery is relatively fast.
  - **Suited for backups**: RDB snapshots are well suited for periodic backups, making fast recovery easy when data is lost or the system crashes.

- **Disadvantages**:
  - **Data loss window**: RDB snapshots are time-based, and the data loss window is the time interval between the last snapshot and the occurrence of the failure. Data lost within that interval may not be recoverable.
  - **Blocking operations**: Although snapshot generation is asynchronous, Redis must fork a child process during the process, which may have some performance impact, especially under high load.

## Use cases

RDB snapshots are suited for the following scenarios:
- **Periodic backups**: When data needs to be backed up periodically to prevent data loss.
- **Data recovery**: When data needs to be recovered quickly after a system crash or failure.
- **Low tolerance for data loss**: When a small amount of data loss between the last snapshot and the failure is acceptable.

## Examples

The following shows how to generate and inspect RDB snapshots in Redis:

1. **Generate a snapshot**:
   ```shell
   redis-cli BGSAVE
   ```

2. **Inspect the snapshot file**:
   Check the `dump.rdb` file in the Redis data directory (usually `/var/lib/redis` or `/usr/local/var/db/redis`).

3. **Check the time of the last snapshot**:
   ```shell
   redis-cli LASTSAVE
   ```

By understanding and configuring RDB snapshots, you can effectively manage Redis data persistence and improve the safety and reliability of the data.

## References

- [Redis Operations Manual · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis Operations Manual · Persistence (RDB)](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [faq](/appendix/faq.md)
- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
