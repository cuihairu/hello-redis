# 命令处理流程

## 概述

一个 `GET bd:k` 从字节流到回复，要穿过 Redis 的整条主干：事件循环取事件、读缓冲、协议解析、命令表查找、前置检查、执行、传播与统计，最后回复写回。这条主干几乎全部集中在 `server.c`（`processCommand()`、`call()`）与 `networking.c`（读写事件）中。本章是总览，细节分别在《命令解析》与《命令执行》两章展开。

## 全流程步骤

1. **事件就绪**：`ae.c` 的 `aeMain()` -> `aeProcessEvents()` 通过 `aeApiPoll()`（epoll 实现在 `ae_epoll.c`）拿到可读事件，回调 `readQueryFromClient()`。
2. **读入与解析**：数据进入 `c->querybuf`，`processMultibulkBuffer()`/`processInlineBuffer()` 切出 `argv`（每项是一个 `robj` 字符串对象）。
3. **命令查找**：`processCommand()` 调用 `lookupCommand()`（`server.c` 约 3306 行）在 `server.commands` 字典中匹配；字典内容来自 `commands.def` 生成的 `redisCommandTable[]`，每条包含处理函数、arity、flags、key 规格与 ACL 类别。
4. **前置检查**：认证、`CLIENT PAUSE` 暂停状态、内存上限与驱逐、 arity、只读副本拒绝写、`MULTI` 排队、ACL 权限、脚本/事务上下文等。任一不通过即直接回错。
5. **执行**：进入 `call()`（`server.c` 约 3635 行），`c->cmd->proc(c)` 真正执行；同时驱动统计、慢日志、延迟监控与传播。
6. **传播**：`call()` 内部把命令写入 AOF 缓冲并 `replicationFeedSlaves()` 同步给副本，`alsoPropagate()`/`afterCommand()` 处理命令执行期间产生的额外命令（如 EXPIRE 触发的 DEL）。
7. **回复**：`addReply*` 填充输出缓冲；`beforeSleep` 阶段 `handleClientsWithPendingWrites()` 写回客户端。

## 命令表长什么样

命令表在 `server.c` 中以 `extern struct redisCommand redisCommandTable[]` 引用（定义在生成的 `commands.def`）。用 `COMMAND` 子命令可以直接观察元数据：

```bash
$ redis-cli -p 6399 command count
265

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

输出依次是命令名、arity（2 表示恰好两个参数）、flags、首键下标、末键下标、步长，以及 ACL 类别（`@read @string @fast`）。`COMMAND LIST` 可按模式过滤，`COMMAND GETKEYS` 能验证 key 提取规则：

```bash
$ redis-cli -p 6399 command getkeys mset bd:a 1 bd:b 2
bd:a
bd:b
$ redis-cli -p 6399 command getkeys eval "return 1" 2 bd:x bd:y
bd:x
bd:y
```

这些 key 规格正是集群模式判断"该命令应路由到哪个节点"的依据。

## 前置检查与错误反馈

`processCommand()` 的检查顺序决定了常见报错的先后：未认证时只允许 `AUTH`/`HELLO`/`QUIT` 等；OOM 状态下拒绝写命令（`-OOM command not allowed when used memory > 'maxmemory'`）；只读副本上拒绝写（`-READONLY You can't write against a read only replica.`）；找不到命令时报错并尽力给出最接近的命令名。集群模式下若槽不归本节点管，`processCommand()` 返回 `-MOVED <slot> <ip:port>`，由客户端完成重定向。

## 执行与统计

`call()` 用 flags（`CMD_CALL_FULL` 等）控制副作用开关，核心动作包括：

- `monotonic` 时钟计时，写入 `INFO commandstats` 的 `usec_per_call`；
- 超过 `slowlog-log-slower-than`（默认 10000 微秒）则 `slowlogPushEntryIfNeeded()` 入慢日志；
- `latencyAddSample()` 记录延迟事件（阈值 `latency-monitor-threshold`）；
- `dirty` 计数与 `replicationFeedSlaves()` 传播；
- `COMMAND COUNT`、`INFO stats` 的 `total_commands_processed` 在这里递增。

实测一个慢命令的痕迹：

```bash
$ redis-cli -p 16390 debug sleep 0.05        # 自建实例，enable-debug-command yes
OK
$ redis-cli -p 16390 slowlog get 1
1
1790906194
50093
debug
sleep
0.05
127.0.0.1:40740
```

依次为：条目 id、Unix 时间戳、耗时 50093（微秒）、命令及参数、来源地址。50093 微秒超过了 10000 微秒的阈值，因此被记录。

## 观察整条链路的常用命令

```bash
redis-cli -p 6399 info stats | grep -E 'total_commands_processed|instantaneous_ops_per_sec'
redis-cli -p 6399 info commandstats | head -8
redis-cli -p 6399 client info          # 当前连接最近执行的命令（cmd= 字段）
redis-cli -p 6399 slowlog get 3
```

## 小结

命令处理流程是一条严格串行的流水线：事件驱动读入 -> 解析 -> 查表 -> 检查 -> `call()` 执行 -> 传播 -> 回复。所有"为什么这个命令被拒绝""为什么这条命令没有写进 AOF"的问题，答案都在 `processCommand()` 与 `call()` 的这条路径上。理解它之后，才能进一步讨论多线程 I/O、阻塞命令与事务这些"主干上的分叉"。
