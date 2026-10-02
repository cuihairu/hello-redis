# 并发控制机制

## 概述

Redis 没有行锁、没有 MVCC，却要同时面对成千上万的客户端。它的答案是：**让所有命令在一个线程里串行执行，然后在语义层提供并发原语**——原子命令、事务、乐观锁、脚本原子执行与异步删除。本章逐个拆解这些机制的源码实现与实测行为。

## 单命令原子性

因为 `call()` 一次只跑一条命令，任何命令看到的都是"上一个命令完全结束"后的状态：`INCR` 读-改-写不会被插入，`HINCRBYFLOAT` 同理。源码上不需要任何锁（`server.db` 等结构只在主线程访问），这也是 Redis 代码里几乎没有 mutex 保护键空间的原因。唯一的共享状态用原子变量（`redisAtomic`）或短临界区处理，如 bio 计数、`INFO` 统计。

## 事务：MULTI/EXEC 与 multi.c

`multi.c` 实现的事务是"延迟执行 + 顺序保证"：

1. `MULTI`（`multiCommand()`，约 92 行）给客户端打上 `CLIENT_MULTI` 标志；
2. 之后的命令不再进入 `call()`，而是 `queueMultiCommand()`（约 40 行）追加到 `c->mstate.commands`，回复 `QUEUED`；
3. `EXEC`（`execCommand()`，约 128 行）先检查 `CLIENT_DIRTY_EXEC`（入队出错或被 `WATCH` 的键被改过），干净则逐条执行，最后统一传播为 `MULTI...EXEC` 块给副本与 AOF。

实测入队期错误的处理：

```text
MULTI       ->  +OK
GET         ->  -ERR wrong number of arguments for 'get' command
EXEC        ->  -EXECABORT Transaction discarded because of previous errors.
```

而执行期错误（例如对字符串键 `INCR`）只影响该条命令，不回滚前面的命令。

## 乐观锁：WATCH

`WATCH`（`watchCommand()`，`multi.c` 约 459 行）把键登记到两处：客户端侧的 `client->watched_keys` 链表与数据库侧的 `db->watched_keys` 字典（键 -> `watchedKey` 列表）。任何写命令收尾时 `signalModifiedKey()`（`db.c` 约 730 行）调用 `touchWatchedKey()`，把监视该键的客户端打上 `CLIENT_DIRTY_CAS`；`EXEC` 看到该标志直接返回 nil 数组。用两条连接实测（本地自建实例）：

```text
A: WATCH bd:watched   ->  +OK
B: SET bd:watched x   ->  +OK
A: MULTI / SET bd:watched a ->  +OK / +QUEUED
A: EXEC               ->  *-1        （nil，事务被放弃）
```

第二次未被打断的 `EXEC` 返回 `*1\r\n+OK\r\n`。`UNWATCH` 清空登记；连接断开时 `unwatchAllKeys()` 兜底。这套机制配合 `MULTI` 就是 CAS 循环，适合低冲突场景。

## 脚本原子性与超时

Lua 脚本（`EVAL`/`EVALSHA`）在主线程独占执行，期间其他客户端排队。为防止脚本失控，`busy-reply-threshold`（旧名 `lua-time-limit`，两者默认都是 5000ms，实测 `CONFIG GET busy-reply-threshold lua-time-limit` 均返回 5000）超时后：

- 服务器开始对其他客户端回复 `-BUSY Redis is busy running a script...`；
- 只有 `SCRIPT KILL`（脚本尚未执行过写操作时可用）或 `SHUTDOWN NOSAVE` 能终止；
- 注意 `EVAL` 命令本身没有 TIMEOUT 参数，无法给单个脚本设定时限。

超时判断在脚本引擎的 `scriptInterrupt()`（`script.c` 约 120 行）中：脚本每次回调计时，超过 `server.busy_reply_threshold` 就进入 BUSY 状态；若脚本已被主从复制上下文锁定，则返回 `-UNKILLABLE`。

## 阻塞命令：blocked.c

`BLPOP`/`BRPOP`/`BLMOVE`/`BZPOPMIN` 及 `XREAD BLOCK` 并不会忙等。`blockForKeys()`（`blocked.c` 约 379 行）把客户端从事件循环摘除、登记到"键 -> 等待者"的字典；键发生写操作时 `signalKeyAsReady()`（约 562 行）把键放进 `db->ready_keys`，`handleClientsBlockedOnKeys()`（约 326 行）在命令执行完的收尾阶段唤醒等待者重试。`blockClient()`/`unblockClient()`（68/165 行）负责标志位与超时处理。

观测方法（本地自建实例）：

```bash
$ redis-cli -p 16390 blpop bd:nosuch 1     # 另一连接观察
$ redis-cli -p 16390 info clients | grep blocked
blocked_clients:1
```

超时后返回空值：原始字节实测 RESP2 为 `*-1\r\n`（nil 数组），RESP3 为 `_\r\n`（null）。

## 暂停与限流类控制

- `CLIENT PAUSE <ms> [WRITE|ALL]`：全局暂停，实测 400ms 暂停让 `PING` 从亚毫秒变成 315ms；主从切换脚本用它冻结写入。
- `CLIENT KILL` / 连接超时（`timeout` 配置）：从 `serverCron` 侧强制回收客户端。
- `min-replicas-to-write`/`min-replicas-max-lag`：副本不足时拒绝写（实测返回 `-NOREPLICAS Not enough good replicas to write.`），属于"以可用性换一致性"的并发开关。

## 异步删除：UNLINK 与惰性释放

大键的同步删除会造成毫秒级甚至秒级停顿。`UNLINK` 只把键从键空间摘除，真正的内存释放在 `BIO_LAZY_FREE` 线程完成（`lazyfree.c` 的 `freeObjAsync()`/`lazyfreeFreeObject()`；`db.c` 的 `dbAsyncDelete()`）。释放与否由 `lazyfreeGetFreeEffort()` 估算——小对象仍然同步删，避免线程切换得不偿失。实测：50 万字段的哈希 `UNLINK` 命令本身约 31ms 返回，`lazyfreed_objects` 计数加一，内存随后从 14.48MB 降到 1.41MB。`lazyfree-lazy-expire`、`lazyfree-lazy-server-del`（默认均为 `no`）可以把过期与隐式删除也切成异步。

## 小结

Redis 的并发控制是"分层"的：最底层靠单线程执行消除竞态；中间层用 `MULTI/EXEC + WATCH` 提供事务与 CAS；上层用阻塞命令、暂停、副本水位与异步删除控制延迟与可用性。读源码时抓住两个入口——`processCommand()` 的前置检查与 `blocked.c` 的挂起/唤醒——就能解释绝大多数"客户端视角的并发行为"。
