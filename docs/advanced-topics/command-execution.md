# 命令执行与事件处理

本篇介绍一条命令从到达 Redis 到返回结果的完整路径，以及支撑它的事件循环机制。

## 命令表

Redis 7.0 之前命令元信息由 `redisCommand` 结构的静态数组维护，7.0 起改为 `redisCommandTable` 结构化命令表，包含命令名、参数个数、参数标志（如 `write`、`readonly`、`noscript`）、实现函数指针等。启动时命令表被构建成字典，`processCommand` 用命令名 O(1) 查找对应实现。

可以通过 `COMMAND`、`COMMAND INFO <命令>`、`COMMAND COUNT` 查看命令表内容。

## 执行流程

一条命令的处理大致经过以下阶段：

1. **读取与解析**：事件循环发现客户端套接字可读，读取字节流并按 RESP 协议解析出参数数组；
2. **查找命令**：`lookupCommand` 在命令表中找到命令结构；
3. **校验**：参数个数、`MULTI` 事务状态、`maxmemory` 内存限制、只读从节点拒绝写、ACL 权限、命令是否允许在脚本/事务中等；
4. **执行**：调用命令实现函数（如 `setCommand`），操作键空间并准备回复；
5. **回复**：把响应写入客户端输出缓冲区，注册写事件，等套接字可写时发出；
6. **传播**：写命令被追加到 AOF 缓冲，并转发给从节点与发布订阅。

超过 `slowlog-log-slower-than`（默认 10 毫秒）的命令会记入慢日志（`SLOWLOG GET`）。

## 事件循环（ae.c）

Redis 自带的事件库把 epoll/kqueue/select/evport 封装成统一接口：

- **文件事件**：可读时调用 `readQueryFromClient`，可写时调用 `writeToClient`；
- **时间事件**：默认每 100 毫秒一次的 `serverCron`，负责过期键主动删除、`replCron`/`clusterCron`、哈希表渐进式 rehash 步进、客户端超时清理等。

每轮循环先处理文件事件，再检查时间事件是否到期；`hz` 配置（默认 10，即每秒 10 次）控制 `serverCron` 的频率。

## 客户端缓冲区

每个客户端连接有两类缓冲：

- **查询缓冲区**：暂存客户端发来但尚未处理的请求，过大（`client-query-buffer-limit`，默认 1 GB）会断开连接；
- **输出缓冲区**：分为固定大小（普通客户端）与可配置的 `client-output-buffer-limit`（默认值：普通客户端不限制，从节点 256 MB 硬限制/64 MB 60 秒软限制，pubsub 客户端 32 MB 硬限制/8 MB 60 秒软限制），超限即断开，防止慢消费者拖垮内存。

## 阻塞点与异步化

会阻塞主线程的常见操作及缓解手段：

| 阻塞点 | 缓解方式 |
| --- | --- |
| 大键的同步删除 | 用 `UNLINK`（Redis 4.0+）异步删除 |
| `KEYS`、`SMEMBERS` 等全量遍历 | 用 `SCAN`/`SSCAN` 等渐进式命令 |
| `BGSAVE`/AOF 重写时的 fork | 控制 `save` 频率；大实例拆分；使用 AOF everysec |
| Lua 脚本执行时间 | 脚本必须短小；Redis 7.0 的 `busy-reply-threshold` 可在脚本阻塞时返回 BUSY |

## 与客户端的调试命令

```bash
CLIENT LIST              # 查看连接与缓冲区状态
CLIENT INFO              # 当前连接信息
MONITOR                  # 实时查看所有命令（调试用，勿在生产常开）
LATENCY HISTORY event    # 延迟事件历史
SLOWLOG GET 10           # 最近 10 条慢查询
```

理解执行路径后，排查延迟问题的思路就很直接：先看慢日志定位慢命令，再用 `LATENCY` 与 `CLIENT LIST` 区分是命令本身慢、持久化抖动还是网络/缓冲区问题。
