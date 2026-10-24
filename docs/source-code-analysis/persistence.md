# Persistence Mechanisms

## Overview

Redis data lives in memory; persistence solves the problem of not losing data after a process restart or a machine power loss. At the source-code level, two subsystems handle it: RDB (src/rdb.c) produces a full binary snapshot at a point in time, and AOF (src/aof.c) appends every write command to the log in RESP protocol form. The two can be used independently, or both enabled at once (on restart, AOF is loaded preferentially).

## RDB: a full snapshot via fork + copy-on-write

There are three ways it is triggered: the configured `save` condition, a manual `SAVE`/`BGSAVE`, and internal scenarios such as a full master–replica sync. The core path is `rdbSaveBackground()` (src/rdb.c) calling `redisFork(CHILD_TYPE_RDB)`; the child writes the in-memory data into `temp-<pid>.rdb`, and once done `rename()` atomically replaces the real file. The parent keeps serving normally, paying only at the moment of the fork, after which it shares memory pages via the operating system's copy-on-write (COW).

`serverCron()` (src/server.c) walks `server.saveparams` and triggers automatically when the condition "at least M modifications within N seconds" is met:

```bash
$ redis-cli -p 6399 config get save
1) "save"
2) ""
```

In the example above this instance's `save` is an empty string, meaning automatic snapshots are disabled and can only be triggered manually. A classic setting looks like `save 900 1` (at least one modification within 900 seconds). An RDB file begins with the RDB version number (12 in 8.0) and ends with an 8-byte CRC64 checksum; the `redis-check-rdb` tool can check file integrity offline.

## AOF: command log and three fsync strategies

Once `appendonly yes` is set, every write command is written into the `server.aof_buf` buffer by `feedAppendOnlyFile()` (src/aof.c) after it executes successfully, and `beforeSleep()` calls `flushAppendOnlyFile()` to flush it to disk before returning to the event loop. The fsync frequency is governed by `appendfsync`:

- `always`: sync on every write, the safest and the slowest;
- `everysec`: once per second, performed by a background thread (`BIO_AOF_FSYNC` in src/bio.c), the default, losing at most 1 second of data;
- `no`: never fsync proactively, leaving it to the operating system, which typically flushes about every 30 seconds, the fastest and the least safe.

```bash
$ redis-cli -p 6399 config get appendonly
1) "appendonly"
2) "no"
$ redis-cli -p 6399 config get appendfsync
1) "appendfsync"
2) "everysec"
$ redis-cli -p 6399 config get aof-use-rdb-preamble
1) "aof-use-rdb-preamble"
2) "yes"
```

## multi-part AOF: file layout from 7.0 on

Redis 7.0 splits the single AOF file into three parts, base + incremental + manifest, all living under the `appenddirname` directory (default `appendonlydir`):

- `appendonly.aof.<seq>.base.rdb`: the full snapshot at the time of the rewrite; RDB format when `aof-use-rdb-preamble` is on, otherwise AOF command format;
- `appendonly.aof.<seq>.incr.aof`: all incremental write commands after the base; there can be more than one when a rewrite fails and is retried;
- `appendonly.aof.manifest`: the manifest file, recording each file's sequence number and type line by line, for example `file appendonly.aof.2.base.rdb seq 2 type b` (b for base, h for history, i for incremental).

The corresponding source: `aofLoadManifestFromDisk()` reads the manifest at startup, `openNewIncrAofForAppend()` switches to a new incremental file when a rewrite begins, and `aofDelHistoryFiles()` cleans up old files. To back up, just package the whole directory (taking care to avoid a moment when a rewrite is in progress).

## Trade-offs between RDB and AOF

| Dimension | RDB | AOF |
| --- | --- | --- |
| Data safety | data between two snapshots is lost | at most 1 second lost (everysec) |
| File size | small, compact binary | large, command text (rewritable to shrink) |
| Restore speed | fast, loads directly into memory | slow, requires replaying commands |
| Impact on a live service | one fork, COW occupies memory | continuous disk writes, another fork on rewrite |
| Typical use | disaster recovery, fast restart | primary persistence mechanism |

When both are enabled, restart recovery prefers AOF, because it is usually more complete.

## Runtime observability

```bash
$ redis-cli -p 6399 info persistence | grep -E '^(loading|rdb_changes_since_last_save|rdb_bgsave_in_progress|rdb_last_bgsave_status|rdb_saves|aof_enabled|aof_rewrite_in_progress)'
loading:0
rdb_changes_since_last_save:1149
rdb_bgsave_in_progress:0
rdb_last_bgsave_status:ok
rdb_saves:0
aof_enabled:0
aof_rewrite_in_progress:0
$ redis-cli -p 6399 lastsave
(integer) 1790903507
```

`rdb_changes_since_last_save` is the number of modifications since the last successful snapshot, and is the basis for evaluating the automatic `save` condition; `lastsave` returns the Unix timestamp of the last successful snapshot. With AOF enabled, fields such as `aof_current_size`, `aof_base_size`, and `aof_pending_bio_fsync` also appear.

## Summary

RDB and AOF share the same fork + COW skeleton in the source: rdb.c produces the full snapshot, and aof.c appends the command log and rewrites it periodically. The multi-part AOF in 7.0 unifies "snapshot + incremental" into three kinds of files, base/incr/manifest; mixed persistence (`aof-use-rdb-preamble`, on by default since 5.0) decides whether the base file uses RDB or command format. The next two sections go deeper into the implementation details of RDB and AOF respectively.

## References

- [Redis source repository](https://github.com/redis/redis)
- [rdb.c](https://github.com/redis/redis/blob/unstable/src/rdb.c)
- [aof.c](https://github.com/redis/redis/blob/unstable/src/aof.c)
- [Redis Operations Manual · Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)

## Related pages

- [architecture](architecture.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [architecture](architecture.md)
