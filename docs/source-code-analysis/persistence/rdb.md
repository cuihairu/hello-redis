# RDB Persistence Implementation

## Overview

RDB is Redis's full persistence: it serializes all data in memory at a point in time into a compact binary file (default `dump.rdb`). The implementation is concentrated in src/rdb.c, with writing and loading each taking about half the code. Its core mechanism is `fork()` + copy-on-write (COW): the main process only does the fork, while the actual serialization happens in the child, so service is barely interrupted. This section breaks the source down into four parts: trigger, write, file format, and load.

## Trigger paths

All three entry points ultimately converge on the same function:

1. **Automatic trigger**: `serverCron()` (src/server.c) walks `server.saveparams`, and when the `save <seconds> <changes>` condition is met (e.g. `save 900 1` means at least one modification within 900 seconds) and more than the threshold time has passed since the last successful snapshot, it calls `rdbSaveBackground()`;
2. **Manual trigger**: the `BGSAVE` command calls `rdbSaveBackground()` directly; `SAVE` runs `rdbSave()` synchronously in the main thread, during which no other commands can be processed;
3. **Internal scenarios**: full master–replica sync, `SHUTDOWN` (when save is configured), and so on also produce an RDB.

```bash
$ redis-cli -p 6399 config get save
1) "save"
2) ""
$ redis-cli -p 6399 lastsave
(integer) 1790903507
```

`save` being empty means this instance has automatic snapshots disabled; `lastsave` returns the Unix timestamp of the last successful snapshot.

## Background save flow

The key steps of `rdbSaveBackground()` (src/rdb.c):

1. `redisFork(CHILD_TYPE_RDB)` creates the child, after which parent and child share physical memory pages;
2. The child marks the global state as `CHILD_TYPE_RDB`, calls `dismissMemoryInChild()` to release memory it no longer needs (such as copies of client buffers, see src/server.c), then runs `rdbSave()`;
3. `rdbSave()` first writes the temporary file `temp-<pid>.rdb`; serialization is done by `rdbSaveRio()`, and on success `rename()` atomically replaces the real file;
4. The child reports the COW size to the parent over a pipe (`sendChildCowInfo(CHILD_INFO_TYPE_RDB_COW_SIZE, "RDB")`), and the parent updates `current_cow_size` and `rdb_last_cow_size` in `INFO persistence` accordingly;
5. The parent's `serverCron()` reaps the child via `waitpid()` and records `rdb_last_bgsave_status`.

The cost of COW shows up in `INFO persistence`: `current_fork_perc` and `current_cow_size` reflect the fork and copy overhead. The larger the dataset and the more writes, the more memory COW amplifies.

## File format

An RDB file is a sequence of opcodes, beginning with the magic string `REDIS` followed by a 4-digit version number (`snprintf(magic,...,"REDIS%04d",RDB_VERSION)`; `RDB_VERSION` is 12 in 8.0, see src/rdb.h). The body in turn contains:

- `RDB_OPCODE_AUX` (250): auxiliary fields, such as `redis-ver` and `aof-preamble`;
- `RDB_OPCODE_SELECTDB` (254): switch the database number;
- `RDB_OPCODE_RESIZEDB` (251): a hint for the number of keys and the number of keys with expiration, useful for pre-allocation;
- `RDB_OPCODE_EXPIRETIME_MS` (252) / `EXPIRETIME` (253): the expiration time for the following key;
- `RDB_OPCODE_IDLE` (248) / `RDB_OPCODE_FREQ` (249): LRU idle time and LFU frequency;
- The key–value pairs themselves: the key is a string, and the value is written by `rdbSaveObject()` according to type and encoding, with long strings optionally LZF-compressed;
- `RDB_OPCODE_EOF` (255): the end-of-file marker;
- The final 8 bytes are the CRC64 checksum (written in `rdbSaveRio()` after `memrev64ifbe(&cksum)`).

With `rdb_checksum yes` (default), the CRC64 is written and verified; the `redis-check-rdb` binary in the build artifacts (source src/redis-check-rdb.c) can check any RDB file offline by passing the filename as an argument (with no arguments it prints the usage):

```bash
$ redis-check-rdb
Usage: redis-check-rdb <rdb-file-name>
```

## Loading flow

At startup `main()` calls `rdbLoad()` (src/rdb.c), which internally loops over opcodes via `rdbLoadRio()` and rebuilds the keyspace. During loading, `INFO persistence` shows `loading:1`, and the progress fields `loading_total_bytes`, `loading_loaded_bytes`, and `loading_start_time` are filled in turn; `rdb_last_load_keys_loaded` records the number of keys loaded. Version checking happens in `rdbLoadRio()`: a file with a version less than 1 or greater than the current `RDB_VERSION` is rejected outright with an error, while the rest (i.e. at or below the current version) can be read.

## Usage notes

- The snapshot interval determines the loss window: with `save 900 1`, up to about 15 minutes of data is lost in the worst case;
- Fork latency correlates with dataset size and can be quantified via `latest_fork_usec` in `INFO stats`;
- COW can momentarily double memory, so large instances should trigger `BGSAVE` during off-peak periods;
- Being a single file, RDB is well suited to off-site disaster recovery and version rollback; CRC64 can be verified before transfer.

```bash
$ redis-cli -p 6399 info stats | grep latest_fork_usec
latest_fork_usec:0
$ redis-cli -p 6399 info persistence | grep -E '^(rdb_changes_since_last_save|rdb_last_bgsave_status|rdb_last_save_time)'
rdb_changes_since_last_save:5942
rdb_last_bgsave_status:ok
rdb_last_save_time:1790903507
```

## Summary

The implementation points of RDB can be compressed into one sentence: **use fork to obtain a consistent snapshot, use COW to keep online service uninterrupted, and use compact binary plus CRC64 to gain a small size and integrity**. To read the source, enter at `rdbSaveBackground()` and go through `rdbSave()` → `rdbSaveRio()` → each `rdbSave*Object()` in order, then look at the symmetric path `rdbLoad()` → `rdbLoadRio()` → each `rdbLoad*Object()`, and you cover the entire implementation.

## References

- [Redis source repository](https://github.com/redis/redis)
- [rdb.c](https://github.com/redis/redis/blob/unstable/src/rdb.c)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
