# 线程模型

## 概述

Redis 进程内只有一小撮线程，但每一类都有明确分工。本章按"事件循环主线程 -> I/O 线程 -> bio 后台线程 -> 持久化子进程"的顺序梳理线程的创建、唤醒与协作方式，所有函数名与常量均以 8.0 源码为准。

## 主线程与事件循环

主线程跑在 `ae.c` 实现的事件循环里：`initServer()` 创建 `server.el`，注册 `beforeSleep`/`afterSleep` 回调（`aeSetBeforeSleepProc()`），然后 `aeMain()`（`ae.c` 约 492 行）进入死循环：

```c
void aeMain(aeEventLoop *eventLoop) {
    eventLoop->stop = 0;
    while (!eventLoop->stop) {
        aeProcessEvents(eventLoop, AE_ALL_EVENTS|AE_CALL_BEFORE_SLEEP|AE_CALL_AFTER_SLEEP);
    }
}
```

`aeProcessEvents()`（约 360 行）每一轮做四件事：处理到期时间事件、`aeApiPoll()` 等待 I/O 事件（epoll 封装在 `ae_epoll.c`）、执行读回调（`readQueryFromClient`）、执行写回调。时间事件的核心是 `serverCron()`（`server.c` 约 1376 行），默认每秒 `hz` 次（默认 10，实测 `CONFIG GET hz` 为 10），负责过期键采样、客户端超时、输出缓冲检查、`BGSAVE` 启动等周期性工作。

多路复用后端由编译期选择：Linux 用 `ae_epoll.c`，BSD/macOS 用 `ae_kqueue.c`，回退 `ae_select.c`。运行时可从 `INFO server` 确认：

```text
multiplexing_api:epoll
```

## I/O 线程：从 6.0 到 8.0 的两次形态

**6.0/7.x 形态**：主线程与 `io-threads` 个工作线程共享一个待处理客户端列表。写阶段主线程把客户端分给各线程 `writeToClient()`，读阶段可选地并行 `readQueryFromClient()+解析`（由 `io-threads-do-reads` 控制，默认 `no`）。注意这两个配置从 6.0 起就注册为 `IMMUTABLE_CONFIG`（见 `config.c`），修改后必须重启才能生效，不能 `CONFIG SET`。

**8.0 形态**：重构后的 `src/iothread.c` 给每个 I/O 线程一个独立的事件循环（`IOThread` 结构），客户端通过 `assignClientToIOThread()` 被绑定到某个线程，读、解析都在该线程完成，随后 `enqueuePendingClientsToMainThread()` 把客户端排队交回主线程执行命令；回复仍由各线程写出。读与写都并行，因此旧的 `io-threads-do-reads` 被移除，`io-threads` 也变成需要重启的不可变配置。

在 8.0.5 上的实测（`CONFIG SET` 在自建实例上执行）：

```bash
$ redis-cli -p 6399 config get io-threads
io-threads
1
$ redis-cli -p 16390 config set io-threads 4
ERR CONFIG SET failed (possibly related to argument 'io-threads') - can't set immutable config
$ redis-cli -p 6399 info server | grep io_threads
io_threads_active:0
$ redis-cli -p 6399 client list | head -1
id=4296 ... io-thread=0 ...
```

`io_threads_active:0` 与 `io-thread=0` 表示当前是纯单线程状态。8.0 的 `initThreadedIO()`（`iothread.c`）在 `io_threads_num <= 1` 时直接返回、不创建任何线程，`io_threads_active` 保持 0；一旦 `io-threads > 1`，启动时即置 1 并为每个线程创建独立事件循环（线程编号 1 到 N-1，0 号留给主线程），超出 `IO_THREADS_MAX_NUM` 上限则启动即退出。

## bio：三个后台线程

`bio.c` 的 `bioInit()` 在服务器启动时创建 `BIO_NUM_OPS` 个 pthread，每个线程消费自己的任务链表：

| 任务类型 | 值 | 典型来源 |
|----------|----|----------|
| `BIO_CLOSE_FILE` | 0 | 删除 AOF/RDB 文件、临时文件 |
| `BIO_AOF_FSYNC` | 1 | `appendfsync everysec/always` 的落盘 |
| `BIO_LAZY_FREE` | 2 | `UNLINK`、`FLUSHDB ASYNC`、大键过期/驱逐 |

任务提交接口是 `bioSubmitJob()`，惰性释放用 `bioCreateLazyFreeJob()`（接受一个释放函数与参数），文件关闭用 `bioCreateCloseJob()`。线程与主线程之间用 mutex +条件变量同步，计数器 `bio_jobs_counter[]` 是原子变量，因此主线程只需原子读就能判断队列是否积压。`INFO memory` 中的 `lazyfree_pending_objects` 就是 `BIO_LAZY_FREE` 队列的积压量（本地实测 UNLINK 后从 0 增长再归零，`lazyfreed_objects` 加一）。

## 持久化子进程

`redisFork()`（`server.c`）创建子进程执行 `rdbSaveBackground()`（`rdb.c`）或 AOF 重写。子进程与父进程共享物理页，写入页才被内核复制（copy-on-write），因此父进程写越少，fork 后的额外内存越少。子进程退出由主线程在 `serverCron()` 调用的 `checkChildrenDone()` 中用 `waitpid(-1, &statloc, WNOHANG)` 收割，并更新 `INFO persistence` 的 `rdb_last_bgsave_status`、`rdb_bgsave_in_progress`、`aof_rewrite_in_progress` 等字段。

## 客户端暂停：另一种"线程协调"

`CLIENT PAUSE <timeout>` 让主线程在 `beforeSleep` 中挂起所有（或写类）命令，常用于主从切换时保证拓扑一致。本地实测（自建实例）：

```bash
$ redis-cli -p 16390 client pause 400 &
$ # 150ms 后在另一连接执行 PING
PING elapsed: 0.315 s     # 正常 <1ms，被暂停阻塞约 300ms
```

实现上就是把 `clients_are_paused` 置位，`processCommand()` 入口检查到后直接把客户端挂入等待列表。

## 小结

线程模型的原则是"能不加锁就不加锁"：命令执行只在主线程，I/O 线程只碰字节流不碰键空间，bio 只碰文件系统与内存释放，子进程靠 COW 复制数据。对照 `INFO` 中 `io_threads_active`、`lazyfree_pending_objects`、`rdb_bgsave_in_progress` 等字段，可以把每个线程的活动状态量化出来。
