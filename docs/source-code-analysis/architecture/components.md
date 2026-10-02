# 主要组件和模块

## 概述

Redis 的源码并不庞大（8.0 中 `src/` 下约百余个 `.c` 文件），但职责划分非常清晰：每个组件围绕一类功能独立成文件，再通过 `server.h` 中的全局 `struct redisServer` 与统一的接口协作。本节按功能域盘点主要组件，标注其源码位置与关键函数，便于按图索骥。

## 核心骨架

| 组件 | 源码文件 | 关键函数 |
| --- | --- | --- |
| 主程序与服务器状态 | src/server.c、src/server.h | `main()`、`initServer()`、`initServerConfig()`、`serverCron()`、`processCommand()`、`call()`、`beforeSleep()` |
| 事件循环 | src/ae.c、src/ae.h | `aeCreateFileEvent()`、`aeCreateTimeEvent()`、`aeProcessEvents()`、`aeMain()` |
| 网络与协议 | src/networking.c | `createClient()`、`readQueryFromClient()`、`processInputBuffer()`、`addReply()`、`writeToClient()`、`freeClient()` |

`server.h` 中的 `struct redisServer` 是整个程序的共享状态：配置项、数据库数组、命令表、复制状态、AOF 状态等都挂在这里。读源码时遇到不认识的全局变量，优先在 `server.h` 中搜索定义。

## 命令与业务逻辑

- **字符串**：src/t_string.c，`setCommand()`、`getCommand()`、`setGenericCommand()`、`getGenericCommand()`；
- **哈希**：src/t_hash.c，`hsetCommand()`、`hashTypeSet()`、`hashTypeGetFromListpack()`、`hashTypeConvert()`；8.0 还引入了哈希字段过期（`hashTypeSetEx*` 系列）；
- **列表 / 集合 / 有序集合**：src/t_list.c、src/t_set.c、src/t_zset.c（跳表实现 `zslCreate()`、`zslInsert()`、`zslRandomLevel()`）；
- **其他数据类型**：src/t_string.c（位图/计数器）、src/t_stream.c（Stream）、src/geo.c（GEO，底层为 src/geohash.c、src/geohash_helper.c）；
- **键空间与事务**：src/db.c（`lookupKeyRead()`、`lookupKeyWrite()`、`dbAdd()`、`dbDelete()`）、src/multi.c（`MULTI/EXEC`）、src/script.c（Lua）。

```bash
$ redis-cli -p 6399 command count
(integer) 265
$ redis-cli -p 6399 command info set
1) 1) "set"
   2) (integer) 1
   3) 1) write
   2) denyoom
   3) fast
   ...
```

## 底层数据结构

- **sds**：src/sds.c、src/sds.h，带显式长度的动态字符串（`sdsnewlen()`、`sdscatlen()`）；
- **dict**：src/dict.c，键空间的哈希表与渐进式 rehash（`dictExpand()`、`dictRehash()`、`dictScan()`）；
- **listpack**：src/listpack.c，替代 ziplist 的连续内存编码（`lpNew()`、`lpAppend()`、`lpInsert()`、`lpGet()`）；
- **quicklist**：src/quicklist.c、src/quicklist.h，双向链表 + listpack 节点（`quicklistPush()`、`quicklistCreate()`）；
- **intset**：src/intset.c，小整数集合（`intsetAdd()`、`intsetUpgradeAndAdd()`）；
- **rax**：src/rax.c，基数树（Stream 消息 ID 等使用，`raxInsert()`、`raxSeek()`）；
- **对象层**：src/object.c，`createObject()`、`tryObjectEncoding()`、引用计数（`decrRefCount()`）。

## 持久化与后台

| 组件 | 源码文件 | 关键函数 |
| --- | --- | --- |
| RDB | src/rdb.c | `rdbSave()`、`rdbSaveBackground()`、`rdbSaveRio()`、`rdbLoadRio()` |
| AOF | src/aof.c | `feedAppendOnlyFile()`、`flushAppendOnlyFile()`、`rewriteAppendOnlyFileBackground()` |
| 后台线程池 | src/bio.c | `bioInit()`、`bioSubmitJob()`、`bioCreateLazyFreeJob()`、`bioPendingJobsOfType()` |
| 惰性释放 | src/lazyfree.c | `freeObjAsync()`、`emptyDbAsync()` |

```bash
$ redis-cli -p 6399 config get appendfsync aof-use-rdb-preamble save
1) "appendfsync"
2) "everysec"
3) "aof-use-rdb-preamble"
4) "yes"
5) "save"
6) ""
```

上例显示该实例 `save` 为空字符串，即自动 RDB 快照条件被关闭，只能手动触发 `BGSAVE`。

## 运维与安全

- **配置**：src/config.c，`CONFIG GET/SET` 的实现；
- **持久化运维**：src/debug.c、src/rdb.c（`redis-check-rdb` 由 rdb.c 的命令行入口提供）、`redis-check-aof` 工具；
- **访问控制**：src/acl.c；
- **集群与复制**：src/replication.c、src/cluster.c、src/cluster_legacy.c（8.0 拆分）、src/sentinel.c；
- **模块系统**：src/module.c；
- **监控与延迟**：src/latency.c、src/bio.c。

## 观测各组件的示例

```bash
$ redis-cli -p 6399 info keyspace
# Keyspace
db0:keys=3,expires=0,avg_ttl=0,subexpiry=0
$ redis-cli -p 6399 info commandstats | head -4
# Commandstats
cmdstat_sethexint:calls=1,usec=30,usec_per_call=30.00,rejected_calls=0,failed_calls=0
...
```

`INFO` 的每个 section 都对应一组源码：`persistence` 来自 rdb.c/aof.c 的状态字段，`commandstats` 来自 `call()` 中的统计累加，`clients` 来自 networking.c 的连接列表，`memory` 来自 zmalloc.c 的累计变量。

## 小结

阅读 Redis 源码的推荐路径是：先用 `server.c` 建立全局认知，再按命令类型下钻到 `t_*.c`，遇到内存与编码问题回查 `object.c`、`dict.c`、`listpack.c`，涉及落盘与同步时进入 `rdb.c`、`aof.c`、`bio.c`。配合 `INFO`、`COMMAND`、`CONFIG GET` 等只读命令，可以在运行实例上验证每个组件的行为。
