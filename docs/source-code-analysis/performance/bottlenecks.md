# 性能瓶颈分析

## 概述

瓶颈分析的目标只有一个：**找到那条占住主线程或占住磁盘的路径**。因为命令执行单线程，Redis 的"慢"永远可以定位到具体调用栈——分析工具（`SLOWLOG`、`LATENCY`、`INFO`、采样扫描）也都是从不同角度对这条主线程做断点。本章按"现象 -> 工具 -> 源码落点"给出排查流程。

## 第一步：确认瓶颈在不在 Redis

```bash
redis-cli -p 6399 --latency          # 连续往返延迟，看 min/avg/max 分布
redis-cli -p 6399 info stats | grep -E 'instantaneous_ops_per_sec|total_net_input_bytes'
redis-cli -p 6399 info clients       # connected_clients / blocked_clients / maxclients
```

若 `--latency` 毫秒级抖动而 QPS 不高，问题多在 CPU 争抢、fork、磁盘或网络；若 CPU 打满单核，继续看命令。

## 第二步：找慢命令（SLOWLOG）

`slowlog.c` 的 `slowlogPushEntryIfNeeded()` 把超过 `slowlog-log-slower-than`（默认 10000 微秒）的命令记入环形队列（`slowlog-max-len` 默认 128）。实测样例：

```bash
$ redis-cli -p 16390 slowlog get 2
1
1790906194
50093
debug
sleep
0.05
127.0.0.1:40740
```

第三行 50093 微秒即真实耗时。常见高危命令：`KEYS *`、`HGETALL` 大哈希、`SMEMBERS` 大集合、`LRANGE` 长区间、`ZRANGE ... WITHSCORES` 大区间、`UNLINK` 之外的 `DEL` 大键。定位后看 `INFO commandstats` 确认该命令的 `usec_per_call`：

```text
cmdstat_rpush:calls=145,usec=1935,usec_per_call=13.34,rejected_calls=0,failed_calls=0
```

## 第三步：定位事件毛刺（LATENCY）

慢日志记录"哪条命令"，延迟监控记录"哪个事件"。开启阈值后（`CONFIG SET latency-monitor-threshold 100`，默认 0 即关闭），实测：

```bash
$ redis-cli -p 16390 latency latest
command
1790906205
200
200
$ redis-cli -p 16390 latency history command
1790906205
200
1790906205
200
```

`LATENCY DOCTOR` 汇总各事件的处置建议，实测片段：

```text
Dave, I have observed latency spikes in this Redis instance...
1. command: 1 latency spikes (average 200ms, mean deviation 0ms, period 1.00 sec)...
- Deleting, expiring or evicting (because of maxmemory policy) large objects is a blocking operation...
```

事件名见 `latency.c` 的 `latencyAddSampleIfNeeded` 调用点：`command`、`fork`、`expire-cycle`、`expire-del`/`evict-del`、`aof-write*`、`aof-fsync-always` 等。若 `fork` 是大头，看 `INFO stats` 的 `latest_fork_usec`/`total_forks` 与 `INFO persistence` 的 `current_cow_size`、`rdb_last_cow_size`。

## 第四步：找大键与内存热点

```bash
redis-cli -p 6399 --bigkeys          # 按元素数采样，输出各类型最大键与分布
redis-cli -p 6399 --memkeys          # 按字节数采样
```

本地实测摘要（64 个键的小键空间）：

```text
Sampled 64 keys in the keyspace!
Biggest list found "bd:list" has 8 items / 88 bytes
61 strings with 182 bytes (95.31% of keys, avg size 2.98)
```

大键本身慢，附带效应更危险：它的删除（`DEL`/过期/驱逐）阻塞、它的 RDB 备份拖慢 fork、它在复制流里占用带宽。配合 `MEMORY DOCTOR`（空实例会提示 "this instance is empty or is using very little memory, my issues detector can't be used"）与 `INFO memory` 判断碎片：

```text
used_memory_human:4.99M
mem_fragmentation_ratio:1.84
allocator_frag_ratio:1.06
mem_allocator:jemalloc-5.3.0
```

## 第五步：扫键空间（SCAN）

需要统计/分析键空间时用 `SCAN` 而不是 `KEYS`——`SCAN` 基于游标与哈希表桶序遍历，不阻塞、渐进式。本地实测全量迭代：

```text
SCAN 游标循环 MATCH bd:scan:* COUNT 50  ->  keys=60 iters=2
KEYS bd:scan:*                          ->  60 行
```

两个结果一致，但 `SCAN` 把单次遍历拆成了 2 次往返，对大键空间才是安全做法。

## 第六步：持久化与磁盘

```bash
redis-cli -p 6399 info persistence | grep -E 'rdb_bgsave_in_progress|rdb_last_bgsave_status|aof_rewrite_in_progress'
redis-cli -p 6399 info stats | grep -E 'latest_fork_usec|total_forks'
redis-cli -p 6399 config get save appendonly    # 确认持久化是否开启
```

高频 `BGSAVE`（或过小的 `save` 点）会让 fork 次数飙升；AOF `appendfsync always` 把每次写变成一次 fsync；磁盘慢时这些都表现为主线程周期性停顿，`LATENCY` 中对应 `fork`/`aof-write*` 事件。

## 排查清单（按优先级）

1. `INFO stats` 的 QPS 与 `INFO clients` 的连接数——排除客户端侧问题；
2. `SLOWLOG GET`——找 O(N) 命令与大键操作；
3. `LATENCY LATEST/HISTORY/DOCTOR`——区分命令、fork、磁盘事件；
4. `--bigkeys`/`--memkeys`/`MEMORY USAGE`——找大键与内存热点；
5. `INFO persistence`——fork 与持久化频率；
6. `INFO memory`——碎片率与 `maxmemory` 驱逐（`evicted_keys`）。

## 小结

瓶颈分析没有玄学：慢命令看慢日志，事件毛刺看延迟监控，结构问题看采样扫描，磁盘问题看 fork 与 AOF 指标。四个工具分别对应 `call()`、`latencyAddSample()`、`SCAN` 与 `INFO` 四处源码埋点，把它们串起来就能从现象直接落到代码。
