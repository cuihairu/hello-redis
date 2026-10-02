# 具体实现细节

## 概述

协议格式的背后是一套围绕 `client` 结构体的缓冲区管理：输入侧有查询缓冲区（querybuf），输出侧有静态回复缓冲与回复链表。本章沿着"一个请求从网卡到回复写完"的路径走读 `networking.c`（8.0 版本约 4600 行），并给出可以在本地实例上观察的指标。

## 读路径：readQueryFromClient

客户端 socket 可读时，事件循环调用 `readQueryFromClient()`（8.0 中约 2900 行处）：

1. 按 `readlen = PROTO_IOBUF_LEN`（16KB）预留读缓冲；若该客户端上一轮在解析一个大参数（`bulklen >= PROTO_MBULK_BIG_ARG`，32KB），则把缓冲区直接扩到参数大小，避免反复扩容。
2. `read()` 到 `c->querybuf`（sds 字符串），更新 `c->last_interaction`。
3. 调用 `processInputBuffer()`：循环调用 `processInlineBuffer()` 或 `processMultibulkBuffer()`，每解析出一个完整命令就 `processCommandAndResetClient()` -> `processCommand()`。
4. 解析中遇到参数体超过 `proto-max-bulk-len`（默认 512MB，实测 `CONFIG GET proto-max-bulk-len` 返回 536870912）即断开；查询缓冲区总量受 `client-query-buffer-limit`（默认 1GB，实测 1073741824）限制，内联请求单行上限 `PROTO_INLINE_MAX_SIZE`（64KB）。

## 解析器：processMultibulkBuffer

`processMultibulkBuffer()`（约 2459 行）分两级推进状态机：

- 先读 `*N\r\n` 得到参数个数 `multibulklen`，逐个解析 `$len\r\n`；
- 普通参数从 querybuf 拷贝出新的 sds；当参数体达到 `PROTO_MBULK_BIG_ARG`（32KB，常量定义在 `server.h`）时走"零拷贝"路径：先用 `sdsrange` 把 querybuf 修剪到参数起点，等缓冲区中恰好只剩这个参数体时，直接把 querybuf 的 sds 指针交给 `argv[i]`，省去一次大块内存拷贝。

这两条路径解释了为什么 Redis 解析大 value（如 1MB 的 SET）不会发生明显的内存翻倍。解析完成的标志是 `processMultibulkBuffer()` 消费完 `multibulklen` 个参数并返回 `C_OK`；随后 `processInputBuffer()` 用 `sdsrange(c->querybuf, c->qb_pos, -1)` 移除已消费字节并把 `qb_pos` 归零，避免大块内存长期驻留——`CLIENT LIST` 里的 `qbuf`/`qbuf-free` 字段就是这块空间的水位：

```text
id=4296 ... qbuf=26 qbuf-free=20448 argv-mem=10 ... rbs=16384 rbp=16384 ...
```

## 写路径：prepareClientToWrite 与回复缓冲

`addReply*` 系列先经 `prepareClientToWrite()`（约 328 行）把客户端标记为"有回复待写"，再调用 `addReplyToBufferOrList()`：

- 优先写入静态回复缓冲 `c->buf`（16KB，对应 `CLIENT LIST` 的 `obl`）；
- 放不下则追加到 `c->reply` 回复链表（对应 `oll` 与 `omem` 字节总量）。

真正的落盘发生在事件循环的 `beforeSleep`：`handleClientsWithPendingWrites()`（`networking.c` 约 2214 行）先尝试直接 `writeToClient()`（约 2116 行），写不完（内核发送缓冲满）才注册 AE_WRITABLE 写事件，等下一次可写事件继续。`CLIENT LIST` 中 `events=r` 表示只挂了读事件，出现 `w` 说明该客户端进入了"写不完"状态。

## 输出缓冲区限制

为防止慢客户端拖垮内存，每类客户端有独立的输出缓冲上限（`client-output-buffer-limit`）：

```bash
$ redis-cli -p 6399 config get client-output-buffer-limit
normal 0 0 0 slave 268435456 67108864 60 pubsub 33554432 8388608 60
```

含义：普通客户端不限制；副本类硬上限 256MB、软上限 64MB 持续 60 秒即断开；pubsub 类 32MB/8MB/60 秒。检查逻辑在 `serverCron` 周期里执行，超限客户端会被异步关闭。

## 多线程 I/O 的接入点

6.0 引入 io-threads，8.0 将其重构为"每线程独立事件循环"并拆分到 `src/iothread.c`：`assignClientToIOThread()` 把客户端分配到某个 I/O 线程，各线程在各自的 `aeEventLoop` 上完成读入与解析，命令执行仍集中在主线程（`enqueuePendingClientsToMainThread()` 把解析好的客户端排队交回）。`CLIENT LIST` 的 `io-thread=0` 字段显示客户端归属，0 表示主线程；未启用多线程 I/O 时全部为 0。

## 实测：观察缓冲与连接指标

```bash
# 连接数、阻塞数、最大客户端数
redis-cli -p 6399 info clients

# 单个连接的输入/输出缓冲与内存占用
redis-cli -p 6399 client list | head -3

# RESP3 会话（redis-cli -3）中 resp 字段为 3
redis-cli -3 -p 6399 client info | tr ' ' '\n' | grep resp=

# 批量注入命令，观察 --pipe 一次性收割全部回复
printf 'SET bd:pipe1 1\r\nGET bd:pipe1\r\nDEL bd:pipe1\r\n' | redis-cli -p 6399 --pipe
# All data transferred. Waiting for the last reply...
# Last reply received from server.
# errors: 0, replies: 3
```

## 小结

`networking.c` 的设计要点可以概括为三句话：读入用 sds 弹性缓冲并按需扩容；解析是有状态可中断的状态机（一个不完整的请求会等到下一个读事件）；输出先静态缓冲后链表，并受分类限额保护。把 `CLIENT LIST` 的 `qbuf/obl/oll/omem` 字段与这三条机制对应起来，就能在读源码时随时用生产数据验证自己的理解。
