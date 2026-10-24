# Redis Backup and Restore

## Overview

Backup and restore are an important part of Redis operations, ensuring data safety and consistency. With a sensible backup strategy and restore procedure, you can bring services back quickly after data loss or a system failure, reducing risk.

## Data Backup

### RDB Backup Strategy

Redis uses RDB (Redis Database) snapshotting for data backup, suited to persisting data to disk.

- **Periodic backup**: configure the `save` directive to control how often snapshots are generated. For example, `save 900 1` means a snapshot is taken when at least 1 write operation has occurred within 900 seconds.
- **Manual backup**: use the `BGSAVE` command to trigger an RDB snapshot in the background, stored by default as `dump.rdb` in the Redis data directory.
- **Incremental backup**: when needed, combine snapshot files with AOF files to achieve incremental backups.

### AOF Backup Strategy

AOF (Append-Only File) appends every write operation to a log file, supporting more frequent data persistence.

- **Periodic backup**: use the `AOF` file to record all operation logs. Back up the AOF file regularly, for example by copying it with `cp` or `rsync`.
- **AOF rewrite**: use the `BGREWRITEAOF` command to rewrite the AOF file periodically, clearing out unnecessary operation logs and reducing file size.

### Backup Tools and Scripts

- **Backup scripts**: write automated scripts that back up Redis data on a schedule. Scripts can be built from the `redis-cli` command-line tool and system commands, for example:

    ```bash
    #!/bin/bash
    TIMESTAMP=$(date +"%F_%T")
    BACKUP_DIR="/path/to/backup"
    mkdir -p "$BACKUP_DIR"
    cp /var/lib/redis/dump.rdb "$BACKUP_DIR/dump_$TIMESTAMP.rdb"
    cp /var/lib/redis/appendonly.aof "$BACKUP_DIR/appendonly_$TIMESTAMP.aof"
    ```

- **Backup tools**: use `rsync` for backups to keep them consistent and reliable:

    ```bash
    rsync -av /var/lib/redis/ /path/to/backup/
    ```

## Data Restore

### Restore from RDB

- **Restore steps**: copy the backed-up RDB file into the Redis data directory, then restart the Redis instance:

    ```bash
    cp /path/to/backup/dump.rdb /var/lib/redis/
    systemctl restart redis
    ```

- **Restore verification**: check that the restored data is complete; you can query data with the `redis-cli` tool to verify.

### Restore from AOF

- **Restore steps**: copy the backed-up AOF file into the Redis data directory, then restart the Redis instance:

    ```bash
    cp /path/to/backup/appendonly.aof /var/lib/redis/
    systemctl restart redis
    ```

- **Restore verification**: inspect the data after the AOF restore to confirm data consistency.

### Restore Process Best Practices

- **Backup verification**: verify the validity of backup files periodically to make sure backups are complete.
- **Restore testing**: run restore drills regularly to confirm the backup and restore process works reliably.
- **Multiple backup strategies**: use several backup strategies (such as combining RDB and AOF) to improve the flexibility and reliability of data restore.


## References


<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
