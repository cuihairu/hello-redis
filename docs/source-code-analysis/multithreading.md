# 多线程与并发控制

## 概述

"Redis 是单线程的"这句话需要精确化：**命令执行是单线程的**，但 I/O 读写、后台任务、持久化子进程都不是。理解哪些代码跑在哪个线程上，是分析性能与并发问题的前提。本章给出全景图，细节由《线程模型》与《并发控制机制》两章展开。

## 线程全景

| 线程 | 引入版本 | 职责 | 源码 |
|------|----------|------|------|
| 主线程 | - | 事件循环（`aeMain`）、命令执行（`call`）、过期与驱逐 | `ae.c`、`server.c` |
| I/O 线程 | 6.0 | 并行完成网络读/写与协议解析（8.0 重构为每线程独立事件循环） | `iothread.c`、`networking.c` |
| bio 线程 | 2.6 | 关闭文件、AOF fsync、惰性释放大对象 | `bio.c` |
| 子进程 | - | BGSAVE（`fork` + copy-on-write）、AOF 重写、模块 fork | `rdb.c`、`aof.c` |

## I/O 线程：io-threads

Redis 6.0 引入 `io-threads`，把"读请求-解析"与"写回复"并行化，命令执行仍集中在主线程，因此不需要给数据结构加锁。关键配置：

- 6.x/7.x：`io-threads N`（默认 1，即关闭）；`io-threads-do-reads` 默认 `no`，即读在主线程、只有写在多线程。两者在 `config.c` 中均为 `IMMUTABLE_CONFIG`，改动必须重启。
- 8.0：I/O 线程模型重写（`src/iothread.c`，每个线程拥有自己的事件循环，客户端被 `assignClientToIOThread()` 分配到线程），`io-threads-do-reads` 被移除，`io-threads` 依旧不可在线修改。

在 Redis 8.0.5 上的实测：

```bash
$ redis-cli -p 6399 config get io-threads
io-threads
1
$ redis-cli -p 16390 config set io-threads 4
ERR CONFIG SET failed (possibly related to argument 'io-threads') - can't set immutable config
$ redis-cli -p 6399 info server | grep -E 'multiplexing_api|io_threads'
multiplexing_api:epoll
io_threads_active:0
```

`io_threads_active:0` 说明线程池处于待命状态（负载不足时不唤醒）；`CLIENT LIST` 的 `io-thread=` 字段显示每个客户端归属哪个线程，未启用时全为 0。

## 后台线程：bio

`bio.c` 维护三条任务队列（`bio.h` 中编号固定）：

- `BIO_CLOSE_FILE`：异步 `close()` 文件，避免删除大文件时阻塞；
- `BIO_AOF_FSYNC`：AOF 的 `fdatasync`，配合 `appendfsync everysec`；
- `BIO_LAZY_FREE`：惰性释放大对象（`UNLINK`、`FLUSHDB ASYNC`、过期/驱逐大键）。

`UNLINK` 的效果可以直接观测：构造 50 万字段的哈希后删除，`INFO memory` 中 `lazyfreed_objects` 从 0 变 1，内存占用从 14.48MB 降到 1.41MB，而命令本身 31ms 内返回（本地实测）。

## 子进程与 copy-on-write

RDB 保存与 AOF 重写都用 `fork()` 创建子进程：父子进程开始共享物理内存页，只有被写的页才真正复制（copy-on-write）。因此 BGSAVE 的成本主要取决于"写入频率"，而非数据集大小；`INFO persistence` 的 `current_cow_size`/`rdb_last_cow_size`/`aof_last_cow_size` 记录了复制规模，fork 耗时与次数在 `INFO stats` 的 `latest_fork_usec`/`total_forks`。

## 并发控制：用单线程换掉锁

正因为命令执行串行，Redis 才能做到：

- 单命令原子：`INCR`、`HINCRBY` 不需要 CAS；
- 事务用 `MULTI/EXEC` 排队执行，配合 `WATCH` 做乐观锁（`multi.c`，冲突时 `EXEC` 返回 nil）；
- 阻塞命令（`BLPOP` 等）把客户端挂到 `blocked.c` 的等待队列，键变化时由 `signalKeyAsReady()` 唤醒，主线程仍是唯一执行者；
- Lua 脚本执行期间独占服务器，超时（`busy-reply-threshold`，旧名 `lua-time-limit`，默认 5000ms）后其他客户端收到 `-BUSY`，可用 `SCRIPT KILL`（脚本尚未写过数据时）或 `SHUTDOWN NOSAVE` 处理。注意 `EVAL` 本身没有 TIMEOUT 选项。

## 运维视角的观察点

```bash
redis-cli -p 6399 info clients          # 连接数、blocked_clients
redis-cli -p 6399 client list | head -3 # io-thread=、flags=、multi= 等字段
redis-cli -p 6399 info memory | grep lazy   # lazyfree_pending_objects / lazyfreed_objects
redis-cli -p 6399 info persistence | grep -E 'rdb_bgsave_in_progress|latest_fork_usec'
```

## 小结

把 Redis 的并发模型总结成一句话：**数据面单线程（免锁），控制面多线程（I/O、后台任务、子进程）**。I/O 线程扩展的是网络吞吐，bio 扩展的是"脏活"的隔离，fork 扩展的是持久化的并行度；而所有对数据结构的修改永远只有主线程在执行。后续两章分别深入线程的创建与调度细节，以及在这套模型之上的并发控制原语。
