# Custom Module Implementation

## Overview

This chapter walks the full "write -> compile -> load -> self-test" loop with a small, complete, runnable module. The example code has been compiled and verified against Redis 8.0.5, and every error message is a real output. After reading you should be able to turn any idea into a module command the same way.

## Environment setup

You need the server with module loading enabled (off by default):

```bash
mkdir -p /tmp/mod && cd /tmp/mod
curl -o redismodule.h https://raw.githubusercontent.com/redis/redis/8.0/src/redismodule.h
# start a dedicated instance (enable-module-command yes; enable-debug-command yes makes later DEBUG RELOAD easier)
redis-server --port 16390 --enable-module-command yes --enable-debug-command yes \
  --save '' --appendonly no --daemonize yes --dir /tmp/redis-verify-a
```

When `enable-module-command` is not enabled, `MODULE LOAD` returns:

```text
ERR MODULE command not allowed. If the enable-module-command option is set to "local", ...
```

## Example 1: Command registration and memory management

A minimal but complete command module:

```c
#include "redismodule.h"

static int bdHelloCmd(RedisModuleCtx *ctx, RedisModuleString **argv, int argc) {
    if (argc != 1) return RedisModule_WrongArity(ctx);
    RedisModule_AutoMemory(ctx);
    return RedisModule_ReplyWithSimpleString(ctx, "Hello from module");
}

int RedisModule_OnLoad(RedisModuleCtx *ctx, RedisModuleString **argv, int argc) {
    if (RedisModule_Init(ctx, "bd_hello", 1, REDISMODULE_APIVER_1) == REDISMODULE_ERR)
        return REDISMODULE_ERR;
    if (RedisModule_CreateCommand(ctx, "bd.hello", bdHelloCmd,
            "readonly fast", 0, 0, 0) == REDISMODULE_ERR)
        return REDISMODULE_ERR;
    return REDISMODULE_OK;
}
```

Key points: `RedisModule_Init` fetches every function pointer through `GetApi` and reports the module name and version; `CreateCommand`'s three key parameters (firstkey/lastkey/keystep) take 0 for keyless commands; `AutoMemory` makes resources allocated by `RedisModule_PoolAlloc`/`OpenKey` release automatically when the command returns. Compiling is just a regular command:

```bash
gcc -fPIC -shared -o bd_hello.so bd_hello.c -I/tmp/mod
redis-cli -p 16390 module load /tmp/mod/bd_hello.so    # OK
redis-cli -p 16390 bd.hello                            # Hello from module
redis-cli -p 16390 bd.hello x
# ERR wrong number of arguments for 'bd.hello' command
redis-cli -p 16390 command count                        # 266 (+1 after loading the 1 module command)
```

Note that the flags string must use names from the canonical vocabulary; a typo (say writing `denyoom` instead of `deny-oom`) makes that `CreateCommand` call return an error and the command silently disappear — when you are debugging a command that "loaded but is not found," check this first.

## Example 2: Custom data type

A module type gives data RDB/AOF/replication support automatically. The struct and the five core callbacks:

```c
static RedisModuleType *CounterType;
typedef struct { long long value; } BdCounter;

static void *CounterRdbLoad(RedisModuleIO *rdb, int encver) {
    BdCounter *c = RedisModule_Alloc(sizeof(*c));
    c->value = RedisModule_LoadUnsigned(rdb);
    return c;
}
static void CounterRdbSave(RedisModuleIO *rdb, void *obj) {
    RedisModule_SaveUnsigned(rdb, ((BdCounter *)obj)->value);
}
static void CounterFree(void *obj) { RedisModule_Free(obj); }
static size_t CounterMemUsage(const void *obj) { return sizeof(BdCounter); }
static void CounterDigest(RedisModuleDigest *digest, void *obj) {
    RedisModule_DigestAddLongLong(digest, ((BdCounter *)obj)->value);
    RedisModule_DigestEndSequence(digest);
}
```

Register it in `OnLoad` (the type name must be exactly 9 characters; the source rejects it via `strlen(name) != 9`):

```c
RedisModuleTypeMethods tm = {
    .version = REDISMODULE_TYPE_METHOD_VERSION,
    .rdb_load = CounterRdbLoad, .rdb_save = CounterRdbSave,
    .free = CounterFree, .mem_usage = CounterMemUsage, .digest = CounterDigest,
};
CounterType = RedisModule_CreateDataType(ctx, "bdcount-t", 0, &tm);
if (CounterType == NULL) return REDISMODULE_ERR;
```

Then implement two commands (`bd.counter` creates the key, `bd.incrby` increments it) and self-test after compiling and loading:

```text
bd.counter bd:c                     ->  OK
bd.incrby bd:c 5                    ->  5
bd.incrby bd:c 5                    ->  10
bd.incrby bd:c -2                   ->  8
TYPE bd:c                           ->  bdcount-t
OBJECT ENCODING bd:c                ->  raw
MEMORY USAGE bd:c                   ->  40
DEBUG RELOAD                        ->  OK
bd.incrby bd:c 0                    ->  8     (value survives the RDB round trip)
```

## Common errors and a self-check list

Pitfalls hit during development (all measured outputs):

1. **Type-name length**: `bd-count-t` (10 characters) fails to register; the log reports `Module ... initialization failed. Module not loaded`, and the externally visible error is `ERR Error loading the extension. Please check the server logs.`.
2. **Error handling**: commands must handle edge cases such as "the value is NULL" — dereferencing a null value as a struct crashes the server with `SIGSEGV` (the Redis crash report will note `A Redis module was involved, please open in the module's repo`).
3. **WRONGTYPE branch**: operations on non-module-type keys must return your own error: `WRONGTYPE key is not a bd.counter`.
4. **Unload limit**: when module-type keys exist, `MODULE UNLOAD` returns `ERR Error unloading module: the module exports one or more module-side data types, can't unload`; you must delete the keys first or stop the server.
5. **Replicas and startup loading**: an RDB containing module-type data cannot be loaded on an instance missing the module (`The RDB file contains module data I can't load: no matching module type '...'`); replicas must add `--loadmodule /path/mod.so` or `loadmodule` in the config file, ensuring the load order precedes data loading.
6. **Use DEBUG for self-testing**: `DEBUG RELOAD` (requires `enable-debug-command yes`) is the easiest persistence round-trip test; it produces `dump.rdb`, and if the instance holds module-type data, you must either load the module before the next startup or delete that RDB.

## Summary

Writing a module is essentially "implementing commands from the core's perspective": register at initialization, honor the single-threaded convention at execution time, and the data type's five-piece set (load/save/free/mem/digest) determines whether it can be persisted and introspected. When extending the example into a production module, the next steps are usually `RedisModule_BlockClient` for blocking semantics, `RedisModule_CreateTimer` for periodic tasks, and `RedisModule_SubscribeToServerEvent` to observe failover.

## References

- [Redis source repository](https://github.com/redis/redis)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
