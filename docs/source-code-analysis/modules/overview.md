# 模块系统概述

## 概述

模块系统要回答的问题是：如何在不 fork 内核的前提下，让 Redis 支持全文检索、JSON、时序这类新数据结构。Redis 的选择是进程内扩展：模块是 `.so` 动态库，通过 `dlopen()` 加载，借由一套 C API 直接读写键空间。整套实现集中在 `src/module.c`（8.0 中约 14500 行）。

## 架构与加载流程

```text
redis-server                 module.so
    |                             |
    |-- dlopen(path) ----------->|
    |-- dlsym("RedisModule_OnLoad")
    |-- call OnLoad(ctx, argv, argc)
    |       |-- RedisModule_Init(ctx, name, ver, APIVER_1)
    |       |-- RedisModule_CreateCommand(...)
    |       '-- RedisModule_CreateDataType(...)
    |<-- REDISMODULE_OK（失败则卸载并拒绝加载）
```

`moduleLoad()`（`module.c` 约 12461 行）负责整条链路：打开文件、找到入口、执行、把注册结果挂进 `server.moduleapi`/命令表/类型表，并把模块信息记录到 `server.modules` 链表（`INFO modules` 的来源）。加载失败的典型报错是 `ERR Error loading the extension. Please check the server logs.`，真实原因要看服务器日志（本地实测：类型名长度不等于 9 时，日志出现 `Module ... initialization failed. Module not loaded`）。

模块也可通过配置文件在启动时加载：

```text
loadmodule /usr/lib/redis/modules/my_module.so arg1 arg2
```

## API 的获取与版本

`redismodule.h` 声明了数百个 `RedisModule_*` 函数，但模块并不直接链接它们。`RedisModule_Init()` 内部逐个调用 `RedisModule_GetApi("名字", &指针)`，由服务器把函数地址填进模块自己的函数指针表（`moduleRegisterApi()` 注册，`module.c` 维护这张表）。这样带来的性质：

- **ABI 稳定**：只要 API 版本（`REDISMODULE_APIVER_1`）不变，旧模块可在新内核上运行；
- **可裁剪**：服务器未实现的 API 调用会返回错误而不是崩溃；
- **可观测**：`INFO modules` 的 `api=1` 字段就是模块请求的 API 版本（本地实测 `module:name=bd_hello,ver=1,api=1,filters=0,usedby=[],using=[],options=[]`）。

## 能力面一览

| 能力 | 入口 API | 典型用途 |
|------|----------|----------|
| 新命令 | `RedisModule_CreateCommand` | 业务原语、聚合命令 |
| 新数据类型 | `RedisModule_CreateDataType`（类型名必须恰为 9 字符，源码 `strlen(name) != 9` 直接拒绝） | 全文索引、JSON、向量 |
| 键空间事件 | `RedisModule_SubscribeToKeyspaceEvent` | 缓存失效联动 |
| 定时器 | `RedisModule_CreateTimer` | 周期任务 |
| 阻塞命令 | `RedisModule_BlockClient` / `RedisModule_BlockClientOnKeys` | 类似 BLPOP 的模块命令 |
| 后台线程协作 | `RedisModule_GetThreadSafeContext` + `RedisModule_ThreadSafeContextLock` | 模块自建线程，回主线程前加锁 |
| 服务器事件 | `RedisModule_SubscribeToServerEvent` | 感知持久化、主从切换 |
| 配置项 | `RedisModule_RegisterBoolConfig` 等（7.0+） | 模块参数进入 CONFIG 体系 |
| fork 协作 | `RedisModule_Fork` | 模块自己的后台快照 |

命令注册时可以声明 flags（`readonly`/`write`/`deny-oom`/`fast` 等）与 key 规格参数（firstkey/lastkey/keystep），使集群路由、ACL 类别、`COMMAND GETKEYS` 对模块命令同样有效。

## 与核心子系统的一致性

模块类型数据享有"一等公民"待遇：

- RDB：`rdb_save`/`rdb_load` 回调，RDB 里记录类型名与编码版本；
- AOF：命令本身重放，重写时走 `aof_rewrite` 回调；
- 复制：模块命令照常传播，因此副本必须加载同一模块才能回放（本地实测：副本缺模块时全量同步报 `The RDB file contains module data I can't load: no matching module type '...'`）；
- 自省：`TYPE` 显示类型名、`OBJECT ENCODING` 显示模块编码、`MEMORY USAGE` 调用 `mem_usage` 回调；
- 生命周期：含模块类型键的模块不能 `MODULE UNLOAD`（实测报 `Error unloading module: the module exports one or more module-side data types, can't unload`）。

## 生态与运行约束

社区模块（RediSearch、RedisJSON、RedisTimeSeries 等）与 8.0 起内置的 vectorset 都基于同一套 API。共同约束来自线程模型：**所有模块回调都在主线程执行**，回调中的任何阻塞或长计算都会卡住整个服务器；耗时工作必须用后台线程或定时器拆分。此外模块与核心共享地址空间，一个崩溃的模块就是一次服务器崩溃，因此官方对模块代码质量的要求接近核心本身。

## 小结

模块系统用"函数指针表 + 生命周期回调"两件事搭起了扩展框架：前者解决 ABI 兼容，后者把持久化、复制、自省这些核心职责无缝接给第三方代码。理解了 `OnLoad` 里注册的命令与类型如何进入服务器的统一命令表，就能把任何模块源码当作"普通命令实现"来读。
