# Redis整体架构

## 概述

Redis 是一个基于内存的键值数据库，它的整体架构可以概括为：**单线程命令执行 + 事件驱动模型 + IO 多路复用**。与传统的多线程数据库不同，Redis 把命令解析、执行、回复发送都安排在主线程中顺序完成，从而避免了锁竞争和上下文切换的开销；而磁盘 IO（AOF 落盘、关闭文件）、大对象释放等慢操作则交给后台线程。本节从源码角度梳理 Redis 的分层结构与各子系统的协作方式。

阅读本文时，建议对照 [redis/redis 仓库](https://github.com/redis/redis) 的 `src/` 目录，本文提到的文件名与函数名均以 8.0 分支为准（7.x 中基本一致）。

## 进程与线程模型

一个 `redis-server` 进程内部包含以下执行流：

- **主线程**：运行事件循环 `aeMain()`（src/ae.c），负责所有客户端命令的读取、执行与回复。
- **后台线程（bio）**：由 `bioInit()`（src/bio.c）创建，处理 `BIO_CLOSE_FILE`（关闭重写产生的旧文件）、`BIO_AOF_FSYNC`（AOF fsync）、`BIO_LAZY_FREE`（异步释放大对象）等任务，8.0 中还增加了 `BIO_CLOSE_AOF` 等作业类型。
- **子进程**：由 `rdbSaveBackground()`（src/rdb.c）与 `rewriteAppendOnlyFileBackground()`（src/aof.c）通过 `fork()` 创建，分别负责 RDB 快照与 AOF 重写。
- **可选的 I/O 线程**：配置 `io-threads` 大于 1 时，套接字读写与协议解析可以分散到多个线程并行处理（8.0 重写了这套异步 I/O threading 实现），但命令执行仍固定在主线程，以保持单线程语义。

可以通过 `INFO` 直接观察这些执行流是否在工作：

```bash
$ redis-cli -p 6399 info server | grep -E 'redis_version|multiplexing_api'
redis_version:8.0.5
multiplexing_api:epoll
$ redis-cli -p 6399 info clients | grep connected_clients
connected_clients:1
```

## 事件循环与命令链路

主线程的核心是 `aeEventLoop`（src/ae.c）：

1. `main()`（src/server.c）依次调用 `initServerConfig()`、`initServer()` 完成配置与服务器状态初始化；
2. `initServer()` 用 `aeCreateFileEvent()` 把监听套接字的 `AE_READABLE` 事件与接受连接的回调绑定（src/socket.c 的 `connSocketAcceptHandler`，内部经 src/networking.c 的 `acceptCommonHandler()` 创建客户端），并调用 `aeCreateTimeEvent()` 注册时间事件 `serverCron()`；
3. `aeMain()` 循环调用 `aeProcessEvents()`，底层由 `aeApiPoll()`（Linux 下为 epoll 封装）等待就绪事件；
4. 客户端可读时进入 `readQueryFromClient()`（src/networking.c），数据在 `processInputBuffer()` 中按 RESP 协议解析成 `argv`，随后进入 `processCommand()` 查表执行；
5. 命令处理函数（如 `setCommand`，src/t_string.c）通过 `lookupKeyWrite()`（src/db.c）访问键空间，写完后由 `beforeSleep()` 中的 `writeToClient()` 把回复缓冲区刷给客户端。

用 `COMMAND` 系列命令可以在运行时查看这张命令表（8.0 中命令表定义为 `redisCommandTable`）：

```bash
$ redis-cli -p 6399 command count
(integer) 265
$ redis-cli -p 6399 command info get
get
2
readonly
fast
1
1
1
@read
@string
@fast
...
```

（`COMMAND INFO` 的返回包含命令名、arity、标志位、参数数量与命令组，末尾是 ACL 可读性与键位置规格；`...` 处为省略的剩余字段。）

## 键空间与对象系统

所有键值都存放在 `redisDb`（src/server.h）中。8.0 里键空间已从单个 `dict` 演进为 `kvstore *keys` 与 `kvstore *expires` 两个分片哈希集合，前者保存数据、后者保存过期时间。每个值都是 `robj`（src/object.c 的 `createObject()`），由引用计数管理生命周期，底层编码可以是 sds、listpack、quicklist、skiplist、intset、rax 等。这套“类型 + 编码”的双层设计是理解 Redis 源码的主线，详见本部分的数据结构章节。

## 持久化与内存子系统

- **持久化**：RDB 由 src/rdb.c 实现（`rdbSave()`、`rdbSaveBackground()`、`rdbLoadRio()`），AOF 由 src/aof.c 实现（`feedAppendOnlyFile()`、`flushAppendOnlyFile()`、`rewriteAppendOnlyFileBackground()`）。两者都依赖 `fork()` 与写时复制（COW）。
- **内存**：src/zmalloc.c 在 malloc 之上做了统一包装（`zmalloc()`、`zfree()`、`zmalloc_used_memory()`），并统计 `INFO memory` 中的各项指标；默认分配器是 jemalloc。
- **过期与淘汰**：src/db.c 中的 `expireIfNeeded()` 负责惰性删除，src/expire.c 中的 `activeExpireCycle()` 负责定期删除，内存达到 `maxmemory` 后由 src/evict.c 的 `performEvictions()` 按策略淘汰。

```bash
$ redis-cli -p 6399 info memory | grep -E 'used_memory_human|mem_allocator'
used_memory_human:1.09M
mem_allocator:jemalloc-5.3.0
```

## 观测架构行为的常用命令

- `INFO <section>`：查看 server、clients、memory、persistence、stats、keyspace 等各子系统状态。
- `CLIENT LIST` / `CLIENT ID`：观察客户端连接与命令处理状态。
- `LATENCY LATEST`：查看延迟事件记录。
- `CONFIG GET hz`：查看 `serverCron()` 的执行频率（默认每秒 10 次）。

```bash
$ redis-cli -p 6399 config get hz
1) "hz"
2) "10"
$ redis-cli -p 6399 info stats | grep instantaneous_ops_per_sec
instantaneous_ops_per_sec:1
```

## 小结

Redis 整体架构的关键词是“分层”与“协作”：主线程用事件循环串起网络 IO 与命令执行，保证单线程内的原子性与可预期延迟；后台线程与子进程承担慢速 IO 与持久化；内存分配、对象系统、键空间则作为公共基础设施支撑上层所有命令。读懂 `server.c` 的 `main()` → `aeMain()` 这条主线，再顺着 `readQueryFromClient()` → `processCommand()` → `call()` 的命令链路往下钻，就能覆盖 Redis 源码的绝大部分内容。
