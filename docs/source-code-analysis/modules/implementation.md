# 自定义模块的实现

## 概述

本章用一个完整可运行的小模块走通"编写 -> 编译 -> 加载 -> 自测"闭环。示例代码在 Redis 8.0.5 上实际编译并验证过，所有报错信息都是真实输出。读完你可以照着把任何想法变成模块命令。

## 环境准备

需要服务器开启模块加载能力（默认关闭）：

```bash
mkdir -p /tmp/mod && cd /tmp/mod
curl -o redismodule.h https://raw.githubusercontent.com/redis/redis/8.0/src/redismodule.h
# 启动自建实例（enable-module-command yes；enable-debug-command yes 便于后续 DEBUG RELOAD）
redis-server --port 16390 --enable-module-command yes --enable-debug-command yes \
  --save '' --appendonly no --daemonize yes --dir /tmp/redis-verify-a
```

`enable-module-command` 未开启时，`MODULE LOAD` 会返回：

```text
ERR MODULE command not allowed. If the enable-module-command option is set to "local", ...
```

## 示例一：命令注册与内存管理

最小但完整的命令模块：

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

要点：`RedisModule_Init` 通过 `GetApi` 拿到全部函数指针并上报模块名与版本；`CreateCommand` 的三个 key 参数（firstkey/lastkey/keystep）对无键命令填 0；`AutoMemory` 让 `RedisModule_PoolAlloc/OpenKey` 分配的资源在命令返回时自动释放。编译就是一条常规命令：

```bash
gcc -fPIC -shared -o bd_hello.so bd_hello.c -I/tmp/mod
redis-cli -p 16390 module load /tmp/mod/bd_hello.so    # OK
redis-cli -p 16390 bd.hello                            # Hello from module
redis-cli -p 16390 bd.hello x
# ERR wrong number of arguments for 'bd.hello' command
redis-cli -p 16390 command count                        # 267（加载模块 +2）
```

注意 flags 字符串必须是规范词表中的名字，写错（比如把 `deny-oom` 写成 `denyoom`）会导致该条 `CreateCommand` 返回错误、命令静默消失——排查命令"加载成功却找不到"时先看这里。

## 示例二：自定义数据类型

模块类型让数据自动获得 RDB/AOF/复制支持。结构体与五个核心回调：

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

在 `OnLoad` 中注册（类型名必须恰好 9 个字符，源码用 `strlen(name) != 9` 直接拒绝）：

```c
RedisModuleTypeMethods tm = {
    .version = REDISMODULE_TYPE_METHOD_VERSION,
    .rdb_load = CounterRdbLoad, .rdb_save = CounterRdbSave,
    .free = CounterFree, .mem_usage = CounterMemUsage, .digest = CounterDigest,
};
CounterType = RedisModule_CreateDataType(ctx, "bdcount-t", 0, &tm);
if (CounterType == NULL) return REDISMODULE_ERR;
```

再实现两条命令（`bd.counter` 建键、`bd.incrby` 增量），编译加载后自测：

```text
bd.counter bd:c                     ->  OK
bd.incrby bd:c 5                    ->  5
bd.incrby bd:c 5                    ->  10
bd.incrby bd:c -2                   ->  8
TYPE bd:c                           ->  bdcount-t
OBJECT ENCODING bd:c                ->  raw
MEMORY USAGE bd:c                   ->  41
DEBUG RELOAD                        ->  OK
bd.incrby bd:c 0                    ->  8     （RDB 往返后值仍在）
```

## 常见错误与自检清单

开发时踩过的坑（均为实测输出）：

1. **类型名长度**：`bd-count-t`（10 字符）注册失败，日志报 `Module ... initialization failed. Module not loaded`，对外表现为 `ERR Error loading the extension. Please check the server logs.`。
2. **错误处理**：命令里必须处理"值为 NULL"等边界——把空值当结构体解引用会直接让服务器 `SIGSEGV`（Redis 崩溃报告会标注 `A Redis module was involved, please open in the module's repo`）。
3. **WRONGTYPE 分支**：对非模块类型键操作要自己返回错误：`WRONGTYPE key is not a bd.counter`。
4. **卸载限制**：含模块类型键时 `MODULE UNLOAD` 返回 `ERR Error unloading module: the module exports one or more module-side data types, can't unload`，需先删键或直接停服。
5. **副本与启动加载**：含模块类型数据的 RDB 在缺模块的实例上无法加载（`The RDB file contains module data I can't load: no matching module type '...'`），副本要加 `--loadmodule /path/mod.so` 或在配置文件里 `loadmodule`，保证启动顺序先于数据加载。
6. **自测用 DEBUG**：`DEBUG RELOAD`（需 `enable-debug-command yes`）是最省事的持久化往返测试；它会生成 `dump.rdb`，若实例带模块类型数据，下次启动前要么先加载模块，要么删掉这个 RDB。

## 小结

写模块本质上是"用核心的视角实现命令"：初始化时注册、执行时遵守单线程约定、数据类型五件套（load/save/free/mem/digest）决定能否被持久化与自省。把示例扩展成生产模块时，下一步通常是 `RedisModule_BlockClient` 实现阻塞语义、`RedisModule_CreateTimer` 做周期任务，以及用 `RedisModule_SubscribeToServerEvent` 感知主从切换。
