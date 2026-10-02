# 内存管理

## 概述

Redis 是内存数据库，内存既是它的性能来源，也是最主要的资源约束。源码层面的内存管理由三部分组成：统一的分配封装（src/zmalloc.c）、对象与编码的内存优化（src/object.c 及各 t_*.c）、以及达到 `maxmemory` 之后的淘汰逻辑（src/evict.c）。本节梳理这三层的关系，并给出可在实例上直接验证的观测手段。

## 两个关键指标：used_memory 与 used_memory_rss

`INFO memory` 中最重要的两个字段来自不同的统计路径：

- `used_memory`：由 `zmalloc_used_memory()`（src/zmalloc.c）维护的“Redis 自己申请了多少字节”，包含键值对象、客户端缓冲区、复制积压缓冲区等，但不包含分配器碎片与元数据；
- `used_memory_rss`：从操作系统视角看到的常驻内存（Linux 下 `zmalloc_get_rss()` 读取 `/proc/<pid>/stat` 的第 24 个字段再乘以页大小），包含分配器碎片、页对齐浪费等。

两者之比就是 `mem_fragmentation_ratio`，小于 1 说明发生了 swap，远大于 1（如 1.5 以上）说明碎片严重：

```bash
$ redis-cli -p 6399 info memory | grep -E 'used_memory:|used_memory_rss_human|mem_fragmentation_ratio|mem_allocator'
used_memory:1138208
used_memory_rss_human:8.82M
mem_fragmentation_ratio:3.89
mem_allocator:jemalloc-5.3.0
```

`INFO memory` 还暴露了分配器侧的统计：`allocator_allocated`、`allocator_active`、`allocator_resident`，分别对应“应用请求的字节”“分配器实际持有的 active 页”“归还给操作系统的程度”。三者之间的差距可以用来判断碎片来自哪一层。

## 分配器：默认 jemalloc

Redis 编译时通过 `MALLOC` 变量选择分配器，Linux 默认 jemalloc，可换 libc 或 tcmalloc。`redis-server -v` 会直接打印：

```bash
$ redis-server -v
Redis server v=8.0.5 sha=00000000:0 malloc=jemalloc-5.3.0 bits=64 build=9729964261b8fc0f
```

src/zmalloc.c 在 `USE_JEMALLOC` 生效时把标准 `malloc` 宏替换为 `je_malloc`，因此所有 Redis 内存申请都进入 jemalloc 的 size class 管理，这也是 `zmalloc_size()` 能以 O(1) 得到真实占用（`malloc_usable_size` 语义）的原因。分配与释放机制的细节见《内存分配和释放机制》。

## 内存从哪里来：对象与编码

每个键值对在内存中的构成为：键的 sds + `robj` 结构 + 值本身的存储。`OBJECT ENCODING` 能看到值的具体编码，同一逻辑数据不同编码的内存差异可达数倍：

```bash
$ redis-cli -p 6399 set bc:mm hello
OK
$ redis-cli -p 6399 object encoding bc:mm
embstr
$ redis-cli -p 6399 memory usage bc:mm
(integer) 64
```

小对象走 embstr/int/listpack 等紧凑编码，元素增多后切换为 raw/quicklist/hashtable 等通用编码，切换阈值由 `hash-max-listpack-entries`、`zset-max-listpack-entries`、`list-max-listpack-size` 等配置控制。优化策略见《内存优化策略》。

## maxmemory 与淘汰

写命令在 `processCommand()`（src/server.c）前置检查阶段会判断内存是否超过 `maxmemory`，超过则进入 `performEvictions()`（src/evict.c）按 `maxmemory-policy` 淘汰，策略包括 noeviction、allkeys-lru、volatile-lru、allkeys-lfu、volatile-lfu、allkeys-random、volatile-random、volatile-ttl 共 8 种。LRU/LFU 信息存在 `robj` 的 24 位 lru 字段中：

```bash
$ redis-cli -p 6399 config get maxmemory
1) "maxmemory"
2) "0"
$ redis-cli -p 6399 config get maxmemory-policy
1) "maxmemory-policy"
2) "noeviction"
$ redis-cli -p 6399 object idletime bc:mm
(integer) 3
```

`object idletime` 返回秒级空闲时间；若策略切到 LFU，可用 `OBJECT FREQ` 查看访问频次（非 LFU 策略下会返回错误，提示未开启频次统计）。

## 过期键与惰性释放

- **过期**：src/db.c 的 `expireIfNeeded()` 在读写路径上惰性删除过期键，src/expire.c 的 `activeExpireCycle()` 由 `serverCron()` 周期性调用做主动抽样删除；
- **惰性释放**：`UNLINK`、`FLUSHDB ASYNC` 等把大对象释放交给后台线程（src/lazyfree.c 的 `freeObjAsync()`、`emptyDbAsync()`，经 src/bio.c 的 `bioCreateLazyFreeJob()` 进入 `BIO_LAZY_FREE` 队列），避免主线程阻塞。

## 常用观测命令汇总

```bash
$ redis-cli -p 6399 memory usage bc:mm        # 单个 key 的近似内存占用
$ redis-cli -p 6399 memory stats | head -8    # 各类内存构成
peak.allocated
1284096
total.allocated
1284048
startup.allocated
670832
replication.backlog
0
$ redis-cli -p 6399 memory doctor             # 诊断建议
Hi Sam, this instance is empty or is using very little memory, my issues detector can't be used in these conditions. ...
```

`memory doctor` 会基于 `memory stats` 给出碎片、peer 内存、大 key 等方面的结论，空实例或内存过小时只会返回提示信息。

## 小结

Redis 的内存管理可以概括为“一个计量层 + 一个分配层 + 一个策略层”：zmalloc.c 统一计量与分配（默认 jemalloc），object.c 与各类型实现用编码切换控制单个对象的体积，evict.c 与 expire.c 在全局与键两个粒度上回收内存。排查内存问题时，按 `INFO memory` → `memory stats` → `memory usage <key>` → `OBJECT ENCODING <key>` 的顺序逐层下钻，通常能快速定位大头。
