# Main Components and Modules

## Overview

Redis's source is not large (8.0 has roughly a hundred `.c` files under `src/`), but the division of responsibilities is very clear: each component is an independent file centered on one kind of function, cooperating through the global `struct redisServer` in `server.h` and a unified set of interfaces. This section inventories the main components by functional domain, marking their source location and key functions for quick lookup.

## Core Skeleton

| Component | Source file | Key functions |
| --- | --- | --- |
| Main program and server state | src/server.c, src/server.h | `main()`, `initServer()`, `initServerConfig()`, `serverCron()`, `processCommand()`, `call()`, `beforeSleep()` |
| Event loop | src/ae.c, src/ae.h | `aeCreateFileEvent()`, `aeCreateTimeEvent()`, `aeProcessEvents()`, `aeMain()` |
| Network and protocol | src/networking.c | `createClient()`, `readQueryFromClient()`, `processInputBuffer()`, `addReply()`, `writeToClient()`, `freeClient()` |

The `struct redisServer` in `server.h` is the shared state of the whole program: configuration, the database array, the command table, replication state, AOF state, and more all hang off it. When reading source and you meet an unfamiliar global variable, search `server.h` first for its definition.

## Commands and Business Logic

- **Strings**: src/t_string.c, `setCommand()`, `getCommand()`, `setGenericCommand()`, `getGenericCommand()`;
- **Hashes**: src/t_hash.c, `hsetCommand()`, `hashTypeSet()`, `hashTypeGetFromListpack()`, `hashTypeConvert()`; 8.0 also introduces hash field expiry (the `hashTypeSetEx*` family);
- **Lists / sets / sorted sets**: src/t_list.c, src/t_set.c, src/t_zset.c (skiplist implementation `zslCreate()`, `zslInsert()`, `zslRandomLevel()`);
- **Other data types**: src/t_string.c (bitmaps/counters), src/t_stream.c (Stream), src/geo.c (GEO, with src/geohash.c and src/geohash_helper.c underneath);
- **Keyspace and transactions**: src/db.c (`lookupKeyRead()`, `lookupKeyWrite()`, `dbAdd()`, `dbDelete()`), src/multi.c (`MULTI`/`EXEC`), src/script.c (Lua).

```bash
$ redis-cli -p 6399 command count
(integer) 265
$ redis-cli -p 6399 command info set
set
-3
write
denyoom
1
1
1
@write
@string
@slow
...
```

The output is, in order: command name, arity (`-3` means at least 3 elements), flags, parameter count, and command group (`@write`, `@string`).

## Low-Level Data Structures

- **sds**: src/sds.c, src/sds.h, length-aware dynamic strings (`sdsnewlen()`, `sdscatlen()`);
- **dict**: src/dict.c, the keyspace hash table with incremental rehashing (`dictExpand()`, `dictRehash()`, `dictScan()`);
- **listpack**: src/listpack.c, contiguous-memory encoding that replaced ziplist (`lpNew()`, `lpAppend()`, `lpInsert()`, `lpGet()`);
- **quicklist**: src/quicklist.c, src/quicklist.h, a doubly linked list of listpack nodes (`quicklistPush()`, `quicklistCreate()`);
- **intset**: src/intset.c, a small integer set (`intsetAdd()`, `intsetUpgradeAndAdd()`);
- **rax**: src/rax.c, a radix tree (used by Stream message IDs, etc.; `raxInsert()`, `raxSeek()`);
- **Object layer**: src/object.c, `createObject()`, `tryObjectEncoding()`, reference counting (`decrRefCount()`).

## Persistence and Background

| Component | Source file | Key functions |
| --- | --- | --- |
| RDB | src/rdb.c | `rdbSave()`, `rdbSaveBackground()`, `rdbSaveRio()`, `rdbLoadRio()` |
| AOF | src/aof.c | `feedAppendOnlyFile()`, `flushAppendOnlyFile()`, `rewriteAppendOnlyFileBackground()` |
| Background thread pool | src/bio.c | `bioInit()`, `bioSubmitJob()`, `bioCreateLazyFreeJob()`, `bioPendingJobsOfType()` |
| Lazy free | src/lazyfree.c | `freeObjAsync()`, `emptyDbAsync()` |

```bash
$ redis-cli -p 6399 config get save
1) "save"
2) ""
$ redis-cli -p 6399 config get appendfsync
1) "appendfsync"
2) "everysec"
$ redis-cli -p 6399 config get aof-use-rdb-preamble
1) "aof-use-rdb-preamble"
2) "yes"
```

In the example above, the instance's `save` is an empty string, meaning the automatic RDB snapshot conditions are turned off and only manual `BGSAVE` is possible; `appendfsync` stays at the default sync-per-second, and `aof-use-rdb-preamble` is enabled by default.

## Operations and Security

- **Configuration**: src/config.c, the `CONFIG GET`/`SET` implementation; src/debug.c provides the `DEBUG` command (restricted by `enable-debug-command` by default);
- **Persistence operations**: the two offline tools `redis-check-rdb` (src/redis-check-rdb.c) and `redis-check-aof` (src/redis-check-aof.c);
- **Access control**: src/acl.c;
- **Cluster and replication**: src/replication.c, src/cluster.c, src/cluster_legacy.c (split in 8.0), src/sentinel.c;
- **Module system**: src/module.c;
- **Monitoring and latency**: src/latency.c, src/bio.c.

## Observing Each Component: Examples

```bash
$ redis-cli -p 6399 info keyspace
# Keyspace
db0:keys=87,expires=1,avg_ttl=3423934,subexpiry=0
$ redis-cli -p 6399 info commandstats | head -4
# Commandstats
cmdstat_sunionstore:calls=7,usec=66,usec_per_call=9.43,rejected_calls=0,failed_calls=0
cmdstat_zrem:calls=21,usec=150,usec_per_call=7.14,rejected_calls=0,failed_calls=1
cmdstat_zrevrange:calls=6,usec=49,usec_per_call=8.17,rejected_calls=0,failed_calls=0
```

Each `INFO` section maps to a set of source files: `persistence` comes from state fields in rdb.c/aof.c, `commandstats` comes from counters accumulated in `call()`, `clients` comes from the connection list in networking.c, and `memory` comes from cumulative variables in zmalloc.c.

## Summary

A recommended path for reading Redis source: start with `server.c` for a global picture, then drill into `t_*.c` by command type; when memory and encoding issues come up, consult `object.c`, `dict.c`, `listpack.c`; when persistence and sync are involved, go into `rdb.c`, `aof.c`, `bio.c`. Paired with read-only commands such as `INFO`, `COMMAND`, and `CONFIG GET`, you can verify each component's behavior on a running instance.

## References

- [Redis source repository](https://github.com/redis/redis)

## Related pages

- [overview](overview.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [overview](overview.md)
