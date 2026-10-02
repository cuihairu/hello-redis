# 优化策略

## 概述

本章把常见优化手段按"改客户端、改数据结构、改服务器配置、改架构"四层组织。每条策略都给出可验证的命令与预期收益，便于在目标环境先测量、后落地。

## 客户端层：减少往返

**pipeline** 是性价比最高的优化。本地实测 200 条 SET：

```text
逐条发送：19.7 ms（200 次 RTT）
管道一次：1.9 ms（1 次网络批处理）
```

`redis-cli --pipe` 可以验证批量注入（实测 `errors: 0, replies: 3`）。注意 pipeline 只省网络往返，不提供原子性；需要原子语义时用事务或脚本。

**连接复用**：短连接的成本是 TCP 握手 + 首包延迟，长连接 + 连接池是默认做法；`CLIENT LIST` 中 `age`/`idle` 字段可评估连接质量。

## 数据结构层：用对编码与命令

1. **避免 O(N) 命令**：`KEYS` 换 `SCAN`（实测同键空间 60 键、游标 2 次迭代完成，服务不阻塞）；
2. **控制集合大小**：大哈希/大集合用分片键（`bd:{user}:h1`、`bd:{user}:h2`）拆分；
3. **选小编码**：小对象优先 `listpack`。阈值可调（实测默认值）：
   ```text
   hash-max-listpack-entries  512
   set-max-listpack-entries   128
   zset-max-listpack-entries  128
   list-max-listpack-size     -2   （按 8KB 限制）
   ```
   超阈值后编码自动升级（实测 200 成员 SET -> `hashtable`，200 成员 ZSET -> `skiplist`），升级是单向的，改回阈值不会自动降级；
4. **删除用 UNLINK**：大键走 `BIO_LAZY_FREE` 后台释放（`lazyfree.c` 的 `freeObjAsync()`），实测 50 万字段哈希 `UNLINK` 命令 31ms 返回、`lazyfreed_objects` 加一、内存随后从 14.48MB 降到 1.41MB。相关配置 `lazyfree-lazy-expire`、`lazyfree-lazy-server-del`、`lazyfree-lazy-eviction` 默认都是 `no`，删除密集的业务可打开。

## 服务器层：配置调优

- **慢日志与延迟监控**：`CONFIG SET slowlog-log-slower-than 10000`、`CONFIG SET latency-monitor-threshold 100`（默认 0 关闭），先有数据再谈优化；
- **过期策略**：`hz`（默认 10）决定主动过期周期的频率，`active-expire-effort`（默认 1，最大 10）加大每轮扫描强度；键尽量带随机化 TTL，避免同一秒大量过期；
- **内存上限与驱逐**：给实例设 `maxmemory` 与合适的 `maxmemory-policy`（默认 `noeviction`），观察 `INFO stats` 的 `evicted_keys`；
- **持久化权衡**：`appendfsync everysec` 是吞吐与安全的折中，`always` 每写一次 fsync（`LATENCY` 会记 `aof-fsync-always` 事件）；
- **输出缓冲限额**：`client-output-buffer-limit`（实测默认 `normal 0 0 0 slave 268435456 67108864 60 pubsub 33554432 8388608 60`）防止慢客户端吃内存。

## I/O 线程：何时打开

`io-threads` 把网络读写与解析并行化，命令执行仍是单线程。两点实践结论（以 8.0.5 实测为准）：

1. **默认关闭（io-threads 1）且需重启生效**：`CONFIG SET io-threads 4` 报 `ERR CONFIG SET failed ... can't set immutable config`；
2. **只有在 CPU 未饱和、网络包量大时才有收益**：单机 QPS 5 万+（实测 `redis-benchmark` PING 55555 rps）以内通常不需要。

验证状态：`INFO server` 的 `io_threads_active` 与 `CLIENT LIST` 的 `io-thread=` 字段。

## 架构层：水平扩展

单实例 CPU 打满后，垂直手段（更大缓存、更小 value、pipeline）都到顶时，用集群分片把 16384 个槽摊到多机：

- 写容量与内存容量线性扩展；
- 多键操作需同槽（哈希标签 `{tag}` 聚合），业务键设计要前置考虑；
- 副本提供读扩展与故障接管，`READONLY` 才能在副本读（实测无 `READONLY` 返回 `MOVED`）；
- `WAIT n timeout` 可换取更强的副本确认（实测副本在线返回 1，全部下线时被 `min-replicas-to-write` 拦截为 `-NOREPLICAS Not enough good replicas to write.`）。

## 脚本与事务的取舍

- 简单原子操作用 `MULTI/EXEC`（入队零开销，无脚本解释成本）；
- 需要条件逻辑时用 Lua，但要控制脚本耗时：超过 `busy-reply-threshold`（默认 5000ms）服务器进入 BUSY，其他客户端被阻塞；
- 大循环逻辑尽量移到客户端分批执行，脚本只做"读-改-写"的最小闭环。

## 落地顺序建议

1. 先开观测：慢日志、延迟监控、`INFO commandstats`；
2. 客户端侧收效快：pipeline、连接池、去掉 O(N) 命令；
3. 数据结构侧次之：拆大键、调编码阈值、`UNLINK`；
4. 配置侧按需：lazy-free、过期强度、持久化策略；
5. 最后才考虑 io-threads 与集群分片这类结构性改动。

## 小结

优化策略的本质是"把工作从主线程挪走"：pipeline 挪走网络等待，`UNLINK` 挪走内存释放，io-threads 挪走字节流处理，集群挪走容量上限——唯独命令执行始终留在单线程里。策略选型的依据永远来自测量：`SLOWLOG`、`LATENCY`、`INFO` 三者给出证据链，再按上面的顺序逐层落地。
