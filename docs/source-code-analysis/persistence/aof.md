# AOF Persistence Implementation

## Overview

AOF (Append Only File) appends every write command to the log file in RESP text form; on restart, replaying the commands restores the data. Compared with RDB's periodic snapshots, its loss window is determined by the fsync strategy, with a worst case of just 1 second lost. The implementation is concentrated in src/aof.c, refactored in 7.0 into multi-part AOF (base + incremental + manifest). This section walks the source in the order write → flush → rewrite → recover.

## Write path: from command to aof_buf

After a write command executes successfully, `call()` (src/server.c) hands the command to AOF through `propagate()` (internally `propagateNow()`), which enters `feedAppendOnlyFile()` (src/aof.c): it formats the command as-is into RESP protocol text (the current implementation performs no AOF-specific rewriting, only auto-appending a `SELECT` when the target database changes; with `aof-timestamp-enabled` on it also writes a timestamp comment), then appends it to the global buffer `server.aof_buf` (sds type, src/server.h).

The actual flush to disk happens in `beforeSleep()`: the main thread calls `flushAppendOnlyFile(0)` before each return to the event loop to wait, writing `aof_buf` to the file and deciding whether to fsync based on `appendfsync`:

- `AOF_FSYNC_ALWAYS`: fsync immediately after writing, guaranteeing the data is on disk before the command returns;
- `AOF_FSYNC_EVERYSEC`: the default strategy, with a background thread (the `BIO_AOF_FSYNC` job in src/bio.c) fsyncing once per second; if the main thread finds the previous fsync still in progress it defers the write (this is the source of the `aof_delayed_fsync` counter);
- `AOF_FSYNC_NO`: never fsync proactively, leaving flushing to the operating system.

```bash
$ redis-cli -p 6399 config get appendfsync
1) "appendfsync"
2) "everysec"
$ redis-cli -p 6399 config get appenddirname
1) "appenddirname"
2) "appendonlydir"
$ redis-cli -p 6399 config get appendfilename
1) "appendfilename"
2) "appendonly.aof"
$ redis-cli -p 6399 config get aof-load-truncated
1) "aof-load-truncated"
2) "yes"
```

## multi-part AOF: file layout

From 7.0 on, AOF is no longer a single file but a set of files under the `appenddirname` directory (default `appendonlydir`):

- `appendonly.aof.<seq>.base.rdb`: the base file, the full snapshot at the time of the last rewrite; RDB binary format when `aof-use-rdb-preamble yes` (default), otherwise AOF command format;
- `appendonly.aof.<seq>.incr.aof`: the incremental file, recording all write commands after the base;
- `appendonly.aof.manifest`: the manifest, describing the currently valid files line by line, for example:

```
file appendonly.aof.2.base.rdb seq 2 type b
file appendonly.aof.3.incr.aof seq 3 type i
```

`type` takes the values b (base), i (incremental), and h (history). At startup `aofLoadManifestFromDisk()` parses the manifest, then `loadAppendOnlyFiles()` loads the base and all incr files in order; `openNewIncrAofForAppend()` switches to a new incremental file when a rewrite begins; `aofDelHistoryFiles()` cleans up obsolete files.

## AOF rewrite

AOF grows without bound; rewriting compresses the log by deriving the minimal command set from the current dataset. Both the `BGREWRITEAOF` command and the automatic conditions (the growth ratio of `auto-aof-rewrite-percentage` relative to `aof_base_size`, and the minimum triggering size `auto-aof-rewrite-min-size`, checked in `serverCron()`) lead to `rewriteAppendOnlyFileBackground()` (src/aof.c):

1. The parent first calls `openNewIncrAofForAppend()` to open a new incremental file, after which new writes no longer go to the old file but are appended directly to the new incr file;
2. It forks a child, which walks the current keyspace via `rewriteAppendOnlyFile()` (internally `rewriteAppendOnlyFileRio()`) to generate a new base file;
3. After the child finishes, the parent's `backgroundRewriteDoneHandler()` builds a temporary manifest from the new base + new incr, `rename()`s it atomically over the real manifest, then deletes the old files;
4. If the service is interrupted during a rewrite, the old base + old incr + new incr still form complete data, so the whole process is safe.

Unlike before 7.0, the parent no longer maintains a huge in-memory rewrite buffer, avoiding memory amplification during a rewrite.

## Mixed persistence and recovery

`aof-use-rdb-preamble yes` (default) makes the base file use the RDB format: on recovery, `rdbLoadRio()` loads the base first, then the commands in the incr file are replayed, gaining both RDB's load speed and AOF's loss window. Loading is handled by `loadSingleAppendOnlyFile()` for the command portion; when an incomplete trailing command is encountered, it is governed by `aof-load-truncated` (default yes): allow truncating the load with a warning, or fail to start. A corrupted AOF can be repaired with the offline tool `redis-check-aof`, which accepts both a manifest and a single aof file; `--fix` discards the last incomplete command; with no arguments it prints the usage:

```bash
$ redis-check-aof
Usage: redis-check-aof [--fix|--truncate-to-timestamp $timestamp] <file.manifest|file.aof>
```

## Runtime observability

```bash
$ redis-cli -p 6399 info persistence | grep -E '^(aof_enabled|aof_rewrite_in_progress|aof_rewrite_scheduled|aof_last_bgrewrite_status)'
aof_enabled:0
aof_rewrite_in_progress:0
aof_rewrite_scheduled:0
aof_last_bgrewrite_status:ok
```

On this instance AOF is not enabled, so fields such as `aof_current_size`, `aof_base_size`, `aof_pending_bio_fsync`, and `aof_delayed_fsync` are not visible; after enabling it they appear in `INFO persistence`, representing the current file size, the base size at the last rewrite, the number of jobs awaiting background fsync, and the number of deferred fsyncs respectively.

## Summary

The keywords of the AOF implementation are "buffer + interval-based flushing + periodic rewrite": `aof_buf` aggregates commands, `beforeSleep` flushes them uniformly, `BIO_AOF_FSYNC` moves fsync out of the main thread, and the multi-part structure turns a rewrite into a pure file replacement. To read the source, enter the write path at `feedAppendOnlyFile()`, the rewrite path at `rewriteAppendOnlyFileBackground()`, and finally compare against the manifest example in the header comment of `aof.c` to understand when files switch.

## References

- [Redis source repository](https://github.com/redis/redis)
- [aof.c](https://github.com/redis/redis/blob/unstable/src/aof.c)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
