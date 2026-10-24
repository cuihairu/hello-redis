# Module System Overview

## Overview

The question the module system sets out to answer is: how do you get Redis to support new data structures like full-text search, JSON, and time series without forking the kernel. Redis's answer is in-process extension: a module is a `.so` shared library loaded via `dlopen()`, reading and writing the keyspace directly through a C API. The whole implementation is concentrated in `src/module.c` (around 14500 lines in 8.0).

## Architecture and loading flow

```text
redis-server                 module.so
    |                             |
    |-- dlopen(path) ----------->|
    |-- dlsym("RedisModule_OnLoad")
    |-- call OnLoad(ctx, argv, argc)
    |       |-- RedisModule_Init(ctx, name, ver, APIVER_1)
    |       |-- RedisModule_CreateCommand(...)
    |       '-- RedisModule_CreateDataType(...)
    |<-- REDISMODULE_OK (on failure, unload and refuse to load)
```

`moduleLoad()` (`module.c` around line 12461) owns the whole chain: open the file, find the entry point, run it, hook the registration results into `server.moduleapi`/the command table/the type table, and record module metadata on the `server.modules` linked list (the source of `INFO modules`). A typical load-failure error is `ERR Error loading the extension. Please check the server logs.`; the real cause is in the server log (measured locally: when the type name length is not 9, the log shows `Module ... initialization failed. Module not loaded`).

Modules can also be loaded at startup from the config file:

```text
loadmodule /usr/lib/redis/modules/my_module.so arg1 arg2
```

## API acquisition and versioning

`redismodule.h` declares hundreds of `RedisModule_*` functions, but a module does not link them directly. Internally `RedisModule_Init()` calls `RedisModule_GetApi("name", &ptr)` one by one, and the server fills the function addresses into the module's own function-pointer table (registered by `moduleRegisterApi()`, with `module.c` maintaining the table). This gives the system the following properties:

- **ABI stability**: as long as the API version (`REDISMODULE_APIVER_1`) does not change, older modules keep working on a newer kernel;
- **Graceful degradation**: calls to APIs the server does not implement return an error rather than crashing;
- **Observability**: the `api=1` field in `INFO modules` is the API version the module requested (measured locally `module:name=bd_hello,ver=1,api=1,filters=0,usedby=[],using=[],options=[]`).

## Capability matrix

| Capability | Entry API | Typical use |
|------------|-----------|-------------|
| New commands | `RedisModule_CreateCommand` | Business primitives, aggregate commands |
| New data types | `RedisModule_CreateDataType` (type name must be exactly 9 characters; the source `strlen(name) != 9` rejects it outright) | Full-text index, JSON, vectors |
| Keyspace events | `RedisModule_SubscribeToKeyspaceEvent` | Cache invalidation hooks |
| Timers | `RedisModule_CreateTimer` | Periodic tasks |
| Blocking commands | `RedisModule_BlockClient` / `RedisModule_BlockClientOnKeys` | Module commands analogous to BLPOP |
| Background thread cooperation | `RedisModule_GetThreadSafeContext` + `RedisModule_ThreadSafeContextLock` | Module-owned threads; lock before returning to the main thread |
| Server events | `RedisModule_SubscribeToServerEvent` | Observe persistence and failover |
| Config options | `RedisModule_RegisterBoolConfig` and similar (7.0+) | Module parameters enter the CONFIG system |
| Fork cooperation | `RedisModule_Fork` | The module's own background snapshots |

When registering a command you can declare flags (`readonly`/`write`/`deny-oom`/`fast`, etc.) and key-spec parameters (firstkey/lastkey/keystep), so cluster routing, ACL categories, and `COMMAND GETKEYS` work for module commands just as they do for core commands.

## Consistency with core subsystems

Module-type data enjoys "first-class citizen" treatment:

- RDB: `rdb_save`/`rdb_load` callbacks; the RDB records the type name and encoding version;
- AOF: the command itself is replayed; rewrite goes through the `aof_rewrite` callback;
- Replication: module commands propagate normally, so a replica must load the same module to be able to replay them (measured locally: when a replica is missing the module, a full sync reports `The RDB file contains module data I can't load: no matching module type '...'`);
- Introspection: `TYPE` shows the type name, `OBJECT ENCODING` shows the module encoding, and `MEMORY USAGE` calls the `mem_usage` callback;
- Lifecycle: a module holding module-type keys cannot be `MODULE UNLOAD`ed (measured error `Error unloading module: the module exports one or more module-side data types, can't unload`).

## Ecosystem and runtime constraints

Community modules (RediSearch, RedisJSON, RedisTimeSeries, and so on) and vectorset, built in from 8.0, all share the same API. The shared constraint comes from the threading model: **all module callbacks run in the main thread**, so any blocking or long computation in a callback stalls the entire server; time-consuming work must be split onto background threads or timers. In addition, modules share the core's address space, so a crashing module is a server crash — which is why the official guidance holds module code quality to nearly the same standard as the core itself.

## Summary

The module system builds its extension framework out of two things — "a function-pointer table + lifecycle callbacks": the former solves ABI compatibility, the latter hands core responsibilities such as persistence, replication, and introspection to third-party code seamlessly. Once you understand how the commands and types registered in `OnLoad` enter the server's unified command table, you can read any module's source as "an ordinary command implementation."

## References

- [Redis source repository](https://github.com/redis/redis)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
