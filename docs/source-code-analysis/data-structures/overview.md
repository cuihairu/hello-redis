# Redis数据结构概述

## 概述

Redis 对使用者暴露的是 `TYPE` 命令返回的五种基础类型，对内则由 `OBJECT ENCODING` 返回的一组底层编码实现。这种“一个类型对应多个编码”的设计是 Redis 内存与性能兼顾的关键：数据小的时候用紧凑的连续内存结构，数据大了自动切换到通用结构。本节梳理这两层模型，以及编码切换在源码中的触发点。

## 类型与编码的对应关系

| TYPE | 可能的 encoding | 底层实现 | 源码文件 |
| --- | --- | --- | --- |
| string | int / embstr / raw | long long / 连续内存的 sds / 独立 sds | src/object.c、src/sds.c |
| list | listpack / quicklist | listpack 或 quicklist（其节点内是 listpack） | src/t_list.c、src/quicklist.c、src/listpack.c |
| hash | listpack / hashtable | listpack 或 dict | src/t_hash.c、src/dict.c |
| set | intset / listpack / hashtable | 有序整数数组 / listpack / dict | src/t_set.c |
| zset | listpack / skiplist | listpack 或“跳表 + dict”组合 | src/t_zset.c |
| stream | stream | rax + listpack | src/t_stream.c |

用真实实例可以逐一验证：

```bash
$ redis-cli -p 6399 set bc:o1 100
OK
$ redis-cli -p 6399 type bc:o1
string
$ redis-cli -p 6399 object encoding bc:o1
int
```

## 为什么要有多个编码

以哈希为例，`HSET` 一个只有两个字段的哈希时使用 listpack：所有字段名和值连续存放在一块内存里，没有指针、没有哈希桶，内存开销接近数据本身。一旦字段数超过 `hash-max-listpack-entries`（默认 512）或单个值超过 `hash-max-listpack-value`（默认 64 字节），src/t_hash.c 会调用 `hashTypeConvert()` 切换到 hashtable，用 O(1) 查找换取额外开销。

```bash
$ redis-cli -p 6399 hset bc:o2 a 1 b 2
(integer) 2
$ redis-cli -p 6399 object encoding bc:o2
listpack
$ redis-cli -p 6399 config get hash-max-listpack-entries
1) "hash-max-listpack-entries"
2) "512"
```

## 编码切换的触发点

切换逻辑分散在各类型实现里，共同点是“**只升不降**”：

- 字符串：`SET` 路径上由 `tryObjectEncoding()`（src/object.c）尝试压缩为 int 或 embstr；长度超过 44 字节（`OBJ_ENCODING_EMBSTR_SIZE_LIMIT`）就用 raw；
- 列表：src/t_list.c 在 push 时检查 `list-max-listpack-size`，节点内 listpack 超限后拆分或改用 PLAIN 节点（见 src/quicklist.c 的 `_quicklistNodeAllowInsert()`）；
- 集合：元素全为整数且数量在 `set-max-intset-entries` 内用 intset，否则按 `set-max-listpack-entries` 决定 listpack 或 hashtable；
- 有序集合：元素数超过 `zset-max-listpack-entries` 或成员超过 `zset-max-listpack-value` 时，`zsetConvert()`（src/t_zset.c）切换到 skiplist。

```bash
$ redis-cli -p 6399 zadd bc:o3 1 a 2 b
(integer) 2
$ redis-cli -p 6399 object encoding bc:o3
listpack
$ redis-cli -p 6399 del bc:o3
(integer) 1
```

## 7.0 的一个重要变化：ziplist 退场

Redis 7.0 之前，小哈希、小列表、小有序集合都用 ziplist（src/ziplist.c）。ziplist 的级联更新问题（prevlen 字段连锁扩展）在高写入场景下会放大延迟，于是 7.0 引入 listpack 完全取代了它：每个元素只记录自身长度，不再记录前驱长度，从结构上消除了级联更新。今天 quicklist 的节点内容也是 listpack，7.x 之后的源码里 `OBJECT ENCODING` 不会再返回 ziplist。

## 如何观察编码

- `TYPE key`：查看逻辑类型；
- `OBJECT ENCODING key`：查看当前编码；
- `OBJECT REFCOUNT key` / `OBJECT IDLETIME key` / `OBJECT FREQ key`：引用计数与访问统计（FREQ 仅在 LFU 策略下有效）；
- `MEMORY USAGE key`：按当前编码递归估算内存。

```bash
$ redis-cli -p 6399 object idletime bc:o2
(integer) 0
$ redis-cli -p 6399 del bc:o1 bc:o2
(integer) 2
```

## 小结

把“类型—编码—结构”三层对应关系记住，再对照上表找到各自源码文件，就能在阅读任何一条 `t_*.c` 命令实现时迅速明白它在操作哪种结构。下一节将逐一拆解这些底层结构的具体实现细节。
