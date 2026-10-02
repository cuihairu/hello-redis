# 性能优化

## 概述

Redis 的性能模型很简单：单线程执行 + 内存操作 + 事件循环，因此优化问题总可以归约为三类——**这条命令要跑多久（CPU）**、**要访问多少数据（内存）**、**要等多少次 I/O（网络/磁盘）**。源码层面，这三类分别对应命令实现、数据结构编码与 `networking.c`/`aof.c` 的缓冲策略。本章是总览，方法与工具在《性能瓶颈分析》，手段清单在《优化策略》。

## 性能上限从哪来

本地实测（Redis 8.0.5，同机 20 客户端 2 万请求）：

```bash
$ redis-benchmark -p 6399 -n 20000 -c 20 -q -t ping,ping_inline
PING_INLINE: 55555.55 requests per second, p50=0.215 msec
PING_MBULK: 54945.05 requests per second, p50=0.215 msec
```

纯 PING 能到每秒 5 万+，说明瓶颈基本不在协议解析，而在"每命令的实际工作 + 网络往返"。实际业务中拖慢 Redis 的通常是：

1. **O(N) 命令**：`KEYS`、`SMEMBERS` 大集合、`HGETALL` 大哈希、`LRANGE 0 -1` 长列表——单命令时间与元素数成正比，会直接占住主线程；
2. **大键删除/过期/驱逐**：同步释放几十 MB 的对象会阻塞毫秒到秒级；
3. **fork**：BGSAVE/AOF 重写的 fork 在大内存实例上有明显停顿（`latest_fork_usec`）；
4. **慢盘**：AOF `appendfsync everysec` 遇到磁盘抖动；
5. **网络**：每命令一次 RTT（可用 pipeline 摊薄）。

## 三个观测入口

源码里每个执行路径都埋了统计点，形成互相印证的三层证据：

```bash
# 1) 命令级平均耗时（INFO commandstats）
$ redis-cli -p 6399 info commandstats | head -4
cmdstat_get:calls=1,usec=8,usec_per_call=8.00,rejected_calls=0,failed_calls=0
cmdstat_rpush:calls=145,usec=1935,usec_per_call=13.34,rejected_calls=0,failed_calls=0

# 2) 最慢样本（SLOWLOG）
$ redis-cli -p 6399 config get slowlog-log-slower-than   # 默认 10000 微秒
$ redis-cli -p 6399 slowlog get 5

# 3) 事件级毛刺（LATENCY）
$ redis-cli -p 16390 config set latency-monitor-threshold 100
$ redis-cli -p 16390 latency latest
```

三层对应 `call()` 中同一段代码（`INFO commandstats` 计时、`slowlogPushEntryIfNeeded()` 入慢日志、`latencyAddSample()` 采样），因此能定位到"慢的是哪条命令、最慢到多少、什么事件"。

## 内存视角

编码（encoding）是内存优化的第一杠杆：小集合用 `listpack`，超阈值自动升级 `hashtable`/`skiplist`。本地实测一组切换点：

```text
set-max-listpack-entries 128    -> 200 个成员的 SET 编码为 hashtable
zset-max-listpack-entries 128   -> 200 个成员的 ZSET 编码为 skiplist
hash-max-listpack-entries 512   -> 200 个字段的 HASH 仍是 listpack
```

分析工具：

```bash
redis-cli -p 6399 memory usage bd:list        # 单键字节数
redis-cli -p 6399 object encoding bd:zset     # listpack / skiplist
redis-cli -p 6399 info memory | grep -E 'used_memory_human|mem_fragmentation_ratio|mem_allocator'
# used_memory_human:4.99M
# mem_fragmentation_ratio:1.84
# mem_allocator:jemalloc-5.3.0
```

大键与内存分布用 `redis-cli --bigkeys`（按元素数）与 `redis-cli --memkeys`（按字节数）采样，两者都基于 `SCAN`，对在线服务安全（实测输出含"Biggest list found bd:list has 8 items"之类摘要）。

## 延迟视角

`LATENCY` 体系按事件记录（`latency.c` 的 `latencyAddSample()`），常见事件有 `command`、`fork`、`expire-cycle`、`expire-del`/`evict-del`、`aof-write`、`aof-fsync-always`、`aof-rename`、`rdb-unlink-temp-file` 等；`LATENCY DOCTOR` 汇总诊断建议（实测输出包含"Check your Slow Log to understand what are the commands you are running which are too slow to execute"等条目）。删除类阻塞可用 `UNLINK`/`lazyfree-lazy-expire` 转后台（bio 的 `BIO_LAZY_FREE` 队列），实测 `lazyfreed_objects` 计数随之增长。

## 网络视角

- **pipeline**：200 条 SET 本地实测从 19.7ms（逐条）降到 1.9ms（一次发送）；
- **大 value**：`proto-max-bulk-len` 限制单参数 512MB，实际上几百 KB 的 value 就会显著增加拷贝与带宽；
- **慢客户端**：输出缓冲限额（`client-output-buffer-limit`）防止慢消费者把内存打爆。

## 小结

性能优化在 Redis 里是"先测量、后动手"的工程：`INFO`/`SLOWLOG`/`LATENCY` 提供量化证据，编码与 pipeline 提供低成本收益，lazy-free 与集群分片提供结构性收益。下一章按瓶颈类型给出完整的排查路径。
