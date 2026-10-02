# Redis架构概述

## 概述

从源码角度看，Redis 是一个“以事件循环为骨架、以键空间为心脏”的单进程程序。本节给出架构全景：主循环如何驱动一切、一次命令从字节流到落库要经过哪些函数、各个子系统在哪些源码文件中。

以下内容基于 Redis 8.0（7.x 基本一致），所有命令均在真实实例上验证过。

## 从 main() 到事件循环

`main()`（src/server.c）的启动顺序大致为：

1. `initServerConfig()`：填充全局 `server`（`struct redisServer`，定义在 src/server.h）的默认配置；
2. 解析命令行参数、加载 `redis.conf`（src/config.c）；
3. `initServer()`：创建事件循环、初始化数据库结构、注册监听套接字与时间事件；
4. 恢复数据：优先加载 AOF（src/aof.c 的 `aofLoadManifestFromDisk()` + `loadAppendOnlyFiles()`），否则加载 `dump.rdb`（src/rdb.c 的 `rdbLoad()`）；
5. `aeMain(server.el)` 进入主循环，直到 `aeStop()` 被调用。

时间事件的入口是 `serverCron()`，由 `aeCreateTimeEvent()` 注册，默认以 `hz = 10` 的频率执行，负责过期键清理、`save` 条件检查、客户端超时、复制心跳等后台任务：

```bash
$ redis-cli -p 6399 config get hz
1) "hz"
2) "10"
$ redis-cli -p 6399 info server | grep uptime_in_seconds
uptime_in_seconds:1746
```

## 一次命令的完整生命周期

以 `SET key value` 为例，穿过以下函数链：

1. `readQueryFromClient()`（src/networking.c）：socket 可读，把字节读入 `client->querybuf`；
2. `processInputBuffer()`：按 RESP2/RESP3 协议切分出 `argv`；
3. `processCommand()`（src/server.c）：查命令表、做 ACL、内存、只读副本等前置检查；
4. `call()` → `setCommand()`（src/t_string.c）→ `setGenericCommand()` → `lookupKeyWrite()` / `dbAdd()`（src/db.c）：真正修改键空间；
5. `propagate()`：把写命令传播给 AOF 与从节点；
6. `beforeSleep()`（src/server.c）：在回到 epoll 等待之前，把 `client->buf` 与输出缓冲区通过 `writeToClient()`（src/networking.c）刷出。

整个过程都在主线程内完成（未开启 I/O 线程时），因此 Redis 的命令执行天然串行，这也是事务、Lua 脚本、单 key 原子性得以简化实现的原因。

## 线程与子进程分工

| 执行流 | 源码位置 | 职责 |
| --- | --- | --- |
| 主线程 | ae.c / networking.c / server.c | 事件循环、协议解析、命令执行、回复 |
| bio 后台线程 | bio.c | 关闭文件、AOF fsync、惰性释放（`BIO_CLOSE_FILE`、`BIO_AOF_FSYNC`、`BIO_LAZY_FREE`） |
| RDB 子进程 | rdb.c | `rdbSaveBackground()` fork 出的子进程写快照 |
| AOF 重写子进程 | aof.c | `rewriteAppendOnlyFileBackground()` fork 出的子进程重写 AOF |
| I/O 线程（可选） | networking.c | 分担读、写与解析，`INFO server` 中 `io_threads_active` 可见 |

```bash
$ redis-cli -p 6399 info server | grep -E 'io_threads_active|multiplexing_api'
io_threads_active:0
multiplexing_api:epoll
```

## 数据在内存中的形态

- 每个客户端连接是 `client` 结构（src/server.h），输入输出各有一个缓冲区；
- 每个数据库是 `redisDb`，8.0 中键空间为 `kvstore *keys`、过期表为 `kvstore *expires`；
- 每个值是 `robj`（src/object.c），带类型、编码与引用计数；
- 所有分配经由 src/zmalloc.c，默认走 jemalloc，运行时可用 `INFO memory` 观察：

```bash
$ redis-cli -p 6399 info memory | grep -E 'used_memory_human|mem_allocator'
used_memory_human:1.09M
mem_allocator:jemalloc-5.3.0
```

## 架构层面的可观测点

- `INFO server`：进程、版本、多路复用 API、运行时长；
- `INFO clients`：连接数、阻塞客户端数；
- `INFO stats`：`total_commands_processed`、每秒 OPS、网络吞吐；
- `CLIENT LIST`：每个连接的年龄、空闲时间、最近命令；
- `COMMAND COUNT` / `COMMAND INFO <cmd>`：命令表内容。

```bash
$ redis-cli -p 6399 info stats | grep -E 'total_commands_processed|instantaneous_ops'
total_commands_processed:1193
instantaneous_ops_per_sec:1
instantaneous_input_kbps:0.01
```

## 小结

Redis 架构可以压缩成一句话：**一条主线程事件循环（ae.c）串起网络协议（networking.c）、命令表（server.c）、键空间（db.c/dict.c）三大环节，持久化（rdb.c/aof.c）与慢操作（bio.c、lazyfree.c）则被推到线程池与子进程中**。掌握了这条主线，阅读具体子系统源码时就能随时定位它在架构中的位置。
