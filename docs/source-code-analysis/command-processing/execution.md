# 命令执行

## 概述

`call()`（`server.c` 约 3635 行）是 Redis 的"执行中枢"：所有命令——包括模块命令与 Lua 脚本——最终都通过它运行。它不只调用处理函数，还统一负责计时、统计、慢日志、延迟采样与主从/AOF 传播。读源码时抓住 `call()` 的 flags 机制，就抓住了"执行一个命令到底发生多少件事"。

## call() 的骨架

```c
void call(client *c, int flags) {
    ...
    c->cmd->proc(c);                       /* 真正执行 */
    ...
    if (flags & CMD_CALL_STATS) { ... }    /* commandstats 计时 */
    if (flags & CMD_CALL_SLOWLOG) slowlogPushEntryIfNeeded(...);
    if (flags & CMD_CALL_STATS) latencyAddSample(...);
    if (flags & CMD_CALL_PROPAGATE) { /* AOF + 副本 */ }
    ...
}
```

flags 由 `processCommand()` 传入，最常见的组合是 `CMD_CALL_FULL`（统计+慢日志+延迟+传播全开）。几个关键点：

- **执行前后的上下文**：`call()` 之前 `c->cmd`、`c->argc/argv` 已就绪；执行后 `commandProcessed()` 负责重置客户端、更新主从复制偏移。
- **传播目标**：写命令通过 `replicationFeedSlaves()`（`replication.c`）发给副本，并写入 AOF 缓冲（`propagateNow()`）；命令执行过程中"衍生"的命令（如过期触发的 DEL、`EXPIRE` 语义展开）用 `alsoPropagate()` 排队，在 `afterCommand()`（约 3900 行）里统一落盘，保证原子性与顺序一致。
- **脏数据计数**：`server.dirty` 变化用于触发 RDB 保存条件；键空间通知（`notifyKeyspaceEvent()`）也在这里发出。

## 统计与可观测性

每条命令的耗时都进入 `INFO commandstats`（本地实测样例）：

```text
cmdstat_get:calls=1,usec=8,usec_per_call=8.00,rejected_calls=0,failed_calls=0
cmdstat_rpush:calls=145,usec=1935,usec_per_call=13.34,rejected_calls=0,failed_calls=0
```

`rejected_calls`/`failed_calls` 区分"被前置检查拒绝"与"执行中报错"，排查客户端误用时非常有用。全局吞吐看 `INFO stats`：

```text
total_commands_processed:44878
instantaneous_ops_per_sec:22104
```

## 慢日志：slowlog.c

执行时间超过 `slowlog-log-slower-than`（默认 10000 微秒，实测 `CONFIG GET slowlog-log-slower-than` 为 10000）的命令由 `slowlogPushEntryIfNeeded()`（`slowlog.c` 约 103 行）记入环形队列，长度受 `slowlog-max-len`（默认 128）限制：

```bash
$ redis-cli -p 16390 config get slowlog-log-slower-than slowlog-max-len
slowlog-log-slower-than
10000
slowlog-max-len
128
$ redis-cli -p 16390 debug sleep 0.02      # 自建实例
OK
$ redis-cli -p 16390 slowlog len
2
$ redis-cli -p 16390 slowlog get 2
1
1790906194
50093
debug
sleep
0.05
127.0.0.1:40740

0
1790906194
20089
debug
sleep
0.02
127.0.0.1:40724
```

慢日志记录的是"命令对象本身 + 耗时 + 客户端地址"，不复制参数大对象，因此自身开销极小。

## 延迟监控：latency.c

`call()` 结束后 `latencyAddSample(event, latency)`（`latency.c` 约 63 行）按事件名（如 `command`）聚合样本，超过 `latency-monitor-threshold` 才记录，可通过 `LATENCY LATEST/HISTORY/DOCTOR` 查询：

```bash
$ redis-cli -p 16390 config set latency-monitor-threshold 100
OK
$ redis-cli -p 16390 debug sleep 0.2
OK
$ redis-cli -p 16390 latency latest
command
1790906205
200
200
```

事件名不止 `command`，还有 `fork`、`aof-fsync` 等，由各子系统自行上报，是定位毛刺的第一入口。

## 事务中的执行：MULTI/EXEC

`MULTI` 把客户端置为 `CLIENT_MULTI`，后续命令不再立即执行，而是 `queueMultiCommand()`（`multi.c` 约 40 行）追加到 `c->mstate.commands` 队列并回复 `QUEUED`；`EXEC` 在 `execCommand()`（约 128 行）中逐条以相同的 `call()` 路径执行。本地实测：

```text
MULTI        ->  +OK
SET bd:tx 1  ->  +QUEUED
INCR bd:tx   ->  +QUEUED
GET bd:tx    ->  +QUEUED
EXEC         ->  *3\r\n+OK\r\n:2\r\n$1\r\n2\r\n
```

入队阶段的错误（如 arity 不对）会让 `EXEC` 直接放弃：实测先 `GET`（无参数）入队返回错误，再 `EXEC` 得到 `-EXECABORT Transaction discarded because of previous errors.`。执行阶段的错误（如 `INCR` 一个字符串键）不会回滚已执行的命令——Redis 事务没有回滚语义。

## 小结

`call()` 是一个"带副作用的函数调用器"：执行函数本体只是其中一步，统计、慢日志、延迟采样与传播同样重要。排查性能问题时的三层证据——`INFO commandstats`（平均耗时）、`SLOWLOG GET`（最慢样本）、`LATENCY LATEST`（事件级毛刺）——全部由这同一段代码产生，因此三者之间天然可以相互印证。
