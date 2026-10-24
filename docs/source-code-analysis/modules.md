# Module System

## Overview

The module system (introduced in 2.0, a single `src/module.c` file of over ten thousand lines) lets third parties compile new data types, commands, and API extensions directly into the Redis process as shared libraries: modules share the same event loop and the same memory as the core, with no inter-process communication overhead, and are therefore "lock-free" in the same way as the core — all module callbacks run in the main thread. This chapter is the overview of the modules section; see *Module System Overview* and *Custom Module Implementation* for details.

## How a module "moves in" to Redis

A module is a regular shared library (`.so`) that exports `RedisModule_OnLoad` (and optionally `RedisModule_OnUnload`). The server calls `dlopen()` to open the file, locates the entry point, and runs it (`moduleLoad()`, `module.c` around line 12461). Commands registered by a successfully loaded module enter the command table immediately, indistinguishable from built-in commands:

```bash
$ redis-cli -p 16390 module load /tmp/mod/bd_hello.so
OK
$ redis-cli -p 16390 bd.hello
Hello from module
$ redis-cli -p 16390 command count
266
```

Command and type registration are managed through the `MODULE` subcommand family:

```bash
$ redis-cli -p 6399 module list        # the instance ships with vectorset (a Redis 8 built-in module)
name
vectorset
ver
1
```

For security, `MODULE LOAD`/`UNLOAD` is gated by `enable-module-command` (disabled by default, can be set to `yes`/`local`); when it is not enabled the command returns:

```text
ERR MODULE command not allowed. If the enable-module-command option is set to "local", you can run it from a local connection, ...
```

## What a module can provide

1. **New commands**: `RedisModule_CreateCommand()` registers a handler function, written the same way as core commands (argc check, `addReply*`, read/write keys). Measured: after registration `COMMAND COUNT` increases, and `COMMAND INFO bd.hello` shows flags and ACL category.
2. **New data types**: `RedisModule_CreateDataType()` registers a 9-character type name with `rdb_save`/`rdb_load`/`free`/`mem_usage`/`digest` callbacks, so RDB, AOF, replication, `TYPE`, and `OBJECT ENCODING` all work automatically. Measured type name and encoding:
   ```text
   TYPE bd:c        ->  bdcount-t
   OBJECT ENCODING  ->  raw
   MEMORY USAGE     ->  40
   ```
3. **Async capabilities**: timers (`RedisModule_CreateTimer`), blocking commands (`RedisModule_BlockClient`), keyspace event subscriptions, and thread-safe contexts for self-created threads (`RedisModule_GetThreadSafeContext`, `RedisModule_ThreadSafeContextLock`).
4. **In-process integration**: module config options (from 7.0, `RedisModule_RegisterBoolConfig` and similar), server event subscriptions, the `INFO modules` section (measured output `module:name=bd_hello,ver=1,api=1,filters=0,usedby=[],using=[],options=[]`), and inter-module dependencies (the `using`/`usedby` fields).

## API acquisition mechanism

`redismodule.h` does not link to any symbols directly: `RedisModule_Init()` first calls the `RedisModule_GetApi("RedisModule_XXX")` supplied by the server, filling in the function-pointer table one by one. This indirection layer is the foundation of module ABI stability — changes to server-side function signatures do not affect already-compiled modules, and modules compiled against an older header can still load on a newer version (the API version number `REDISMODULE_APIVER_1` records this compatibility).

## Relationship with persistence and replication

Module-type data enters RDB via the `rdb_save` callback and is restored by the `rdb_load` callback; AOF rewrite goes through command replay (the module command itself is written to the AOF). This creates two operational constraints (both measured locally):

- **Replicas / new instances must load the same module first**, otherwise the module type in the RDB is not recognized and synchronization fails outright:
  ```text
  # Internal error in RDB reading offset 0 -> The RDB file contains module data
  I can't load: no matching module type 'bdcount-t'
  ```
- **A module holding module-type keys cannot be `MODULE UNLOAD`ed**:
  ```text
  ERR Error unloading module: the module exports one or more module-side data types, can't unload
  ```

## Summary

The design core of the module system is "same process, same event loop, one set of introspection APIs": the command table, data types, RDB/AOF, replication, and `INFO`/`COMMAND` introspection treat modules exactly like core constructs. The cost is that you must stay consistent with the core threading model — all callbacks run in the main thread, and any blocking there blocks the whole server, which is why the module documentation keeps hammering on "do not do time-consuming work in callbacks."

## References

- [Redis source repository](https://github.com/redis/redis)
- [Module API reference](https://redis.io/docs/latest/develop/reference/modules/)

## Related pages

- [architecture](architecture.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [architecture](architecture.md)
