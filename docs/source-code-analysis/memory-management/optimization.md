# 内存优化策略

## 概述

Redis 的内存优化不是靠某个开关，而是由“编码选择 + 配置阈值 + 淘汰与过期机制”三层共同决定的。源码层面：src/object.c 决定一个 `robj` 用什么编码；各类型实现（src/t_hash.c、src/t_zset.c、src/t_list.c、src/t_set.c）决定何时在紧凑编码与通用编码之间切换；src/evict.c 与 src/expire.c 决定内存紧张时回收什么。本节按层展开，并给出可复现的测量命令。

## 第一层：字符串编码

字符串是所有优化的起点。长度不超过 44 字节的字符串用 embstr 编码，`robj` 与 sds 分配在同一块连续内存里，省一次分配；整数直接存进 `robj`（int 编码）；其余用 raw。阈值来自 src/object.c 的 `OBJ_ENCODING_EMBSTR_SIZE_LIMIT 44`：

```bash
$ redis-cli -p 6399 set bc:s1 hello
OK
$ redis-cli -p 6399 object encoding bc:s1
embstr
$ redis-cli -p 6399 set bc:s2 $(python3 -c "print('a'*45)")
OK
$ redis-cli -p 6399 object encoding bc:s2
raw
```

`SET` 命令路径上会调用 `tryObjectEncoding()`（src/object.c），把可表示为整数的字符串转为 int 编码，因此数字串应尽量以字符串形式存整数，而不是前导零或带空格的形式。

## 第二层：集合类编码与阈值

Redis 7.0 起 ziplist 被彻底移除，列表、哈希、有序集合的小数据统一使用 listpack（src/listpack.c），集合的小整数集合用 intset（src/intset.c）。切换到通用编码的阈值由配置决定，可直接读取实例当前值：

```bash
$ redis-cli -p 6399 config get hash-max-listpack-entries
1) "hash-max-listpack-entries"
2) "512"
$ redis-cli -p 6399 config get zset-max-listpack-entries
1) "zset-max-listpack-entries"
2) "128"
$ redis-cli -p 6399 config get list-max-listpack-size
1) "list-max-listpack-size"
2) "-2"
```

`list-max-listpack-size` 取负值时表示按字节限制（-1 为 4KB，-2 为 8KB），quicklist 节点内的 listpack 超过该值就会拆分节点。用实测可以观察编码切换点：

```bash
$ redis-cli -p 6399 zadd bc:small 1 a 2 b
(integer) 2
$ redis-cli -p 6399 object encoding bc:small
listpack
$ redis-cli -p 6399 zadd bc:big $(python3 -c "print(' '.join('%d m%d'%(i,i) for i in range(140)))")
(integer) 140
$ redis-cli -p 6399 object encoding bc:big
skiplist
```

140 个元素超过 `zset-max-listpack-entries = 128`，于是 src/t_zset.c 中的 `zsetConvert()` 把编码切到 skiplist（底层是跳表 + dict 的组合）。注意这种切换是单向的：删掉元素后不会退回 listpack。

## 第三层：测量与定位大 key

`memory usage` 内部使用 `objectComputeSize()`（src/object.c）递归估算对象大小；`redis-cli --bigkeys`、`--memkeys` 则基于 `SCAN` 抽样统计。定位到可疑键后，再用 `OBJECT ENCODING` 判断是否值得调整结构，例如把“多个分散的字符串键”合并成一个哈希（listpack 编码下能省下大量键头与 sds 开销）：

```bash
$ redis-cli -p 6399 memory usage bc:big
(integer) 14040
$ redis-cli -p 6399 del bc:big
(integer) 1
```

## 第四层：过期与淘汰配合

- `expire` 设置的键由 src/db.c 的 `expireIfNeeded()` 惰性删除、src/expire.c 的 `activeExpireCycle()` 周期抽样删除，`INFO stats` 的 `expired_keys` 可观察清理量；
- 内存达到 `maxmemory` 后，src/evict.c 的 `performEvictions()` 按 `maxmemory-policy` 淘汰，LRU/LFU 信息存放在 `robj` 的 24 位 `lru` 字段（src/server.h 定义 `LRU_BITS 24`）；
- 若业务允许，`UNLINK` 与 `lazyfree-lazy-eviction yes`、`lazyfree-lazy-expire yes` 能把释放开销移出主线程。

```bash
$ redis-cli -p 6399 set bc:ttl 1 EX 120
OK
$ redis-cli -p 6399 ttl bc:ttl
(integer) 120
$ redis-cli -p 6399 del bc:ttl
(integer) 1
```

## 一份实用的优化清单

- 短字符串保持 44 字节以内，享受 embstr；
- 用一个 listpack 编码的哈希代替大量零散字符串键；
- 控制集合类元素数与单元素大小，避免过早进入 hashtable/skiplist 编码；
- 列表只做追加/弹出时，`list-max-listpack-size -2`（默认）通常已是最优；
- 大 value 场景评估是否拆 key，或改用 Stream 等专用结构；
- 结合 `INFO memory` 的 `mem_fragmentation_ratio` 与 `allocator_*` 字段判断碎片，必要时在低峰期重启或开启 `activedefrag`。

## 小结

内存优化在源码里对应一条清晰的链路：`tryObjectEncoding()` 压缩单个字符串，`*_max_listpack_*` 等配置控制集合编码切换点，`objectComputeSize()` 提供度量，`performEvictions()` 与 `activeExpireCycle()` 提供回收。理解了这条链路，线上任何“内存为什么涨”的问题都可以沿着编码、阈值、淘汰策略三步定位。
