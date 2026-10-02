# 数据结构与算法

## 概述

Redis 对外暴露的是五种基础类型（string、list、hash、set、zset）加上 stream、bitmap、hyperloglog、geo 等扩展，内部则由一套精心挑选的数据结构支撑。理解它们的关键在于分清两个层次：**底层结构**（sds、dict、listpack、quicklist、skiplist、intset、rax）与**对象编码**（src/object.c 中 `robj` 的 encoding 字段）。本节给出全景图与阅读入口。

## 底层数据结构清单

| 结构 | 源码文件 | 关键函数 | 特点 |
| --- | --- | --- | --- |
| sds 动态字符串 | src/sds.c、src/sds.h | `sdsnewlen()`、`sdscatlen()`、`sdslen()` | 二进制安全，O(1) 长度，头部分级（sdshdr5/8/16/32/64） |
| dict 哈希表 | src/dict.c、src/dict.h | `dictExpand()`、`dictRehash()`、`dictScan()` | 链地址法，渐进式 rehash |
| listpack | src/listpack.c | `lpNew()`、`lpAppend()`、`lpInsert()`、`lpGet()` | 连续内存的紧凑列表，7.0 起取代 ziplist |
| quicklist | src/quicklist.c、src/quicklist.h | `quicklistCreate()`、`quicklistPush()` | 双向链表套 listpack 节点，支持 LZF 压缩 |
| 跳表 | src/t_zset.c | `zslCreate()`、`zslInsert()`、`zslRandomLevel()` | 有序集合的有序索引，平均 O(log N) |
| intset | src/intset.c | `intsetAdd()`、`intsetFind()`、`intsetUpgradeAndAdd()` | 有序整数数组，按需升级位宽 |
| rax 基数树 | src/rax.c | `raxNew()`、`raxInsert()`、`raxSeek()` | Stream 的消息索引、集群槽位统计等 |

## 对象编码：类型的实现细节

`robj`（src/object.c）持有 type 与 encoding 两个字段，`TYPE` 返回前者，`OBJECT ENCODING` 返回后者。同一类型可以在编码之间自动切换，这是 Redis 省内存的核心手段：

- string：int、embstr（小于等于 44 字节，`OBJ_ENCODING_EMBSTR_SIZE_LIMIT`）、raw；
- list：listpack（元素少且小时）、quicklist；
- hash：listpack、hashtable；
- set：intset、listpack（小字符串集合，`set-max-listpack-entries` 控制）、hashtable；
- zset：listpack、skiplist。

```bash
$ redis-cli -p 6399 set bc:d1 12345
OK
$ redis-cli -p 6399 object encoding bc:d1
int
$ redis-cli -p 6399 hset bc:d2 f1 v1
(integer) 1
$ redis-cli -p 6399 object encoding bc:d2
listpack
```

## 算法层面的看点

- **渐进式 rehash**（src/dict.c 的 `dictRehash()`）：扩容时同时保留新旧两张表（`d->ht_table[0]`、`d->ht_table[1]`），每次操作搬移固定数量的桶，避免长阻塞；
- **跳表的概率分层**（src/t_zset.c 的 `zslRandomLevel()`）：以幂次定律随机生成层数，实现简单且常数小；
- **intset 的位宽升级**（src/intset.c 的 `intsetUpgradeAndAdd()`）：从 int16 到 int64 自动升级，避免预先浪费内存；
- **quicklist 的节点拆分与压缩**（src/quicklist.c 的 `_quicklistNodeAllowInsert()`）：以 `list-max-listpack-size` 控制节点大小，两端中间节点可选 LZF 压缩；
- **rax 的路径压缩**（src/rax.c）：前缀共享 + 压缩节点，适合消息 ID 这种长且相近的 key。

## 用命令验证编码

`OBJECT ENCODING` 是最直接的观测入口，配合 `MEMORY USAGE` 能量化每种编码的内存差异：

```bash
$ redis-cli -p 6399 sadd bc:d3 1 2 3
(integer) 3
$ redis-cli -p 6399 object encoding bc:d3
intset
$ redis-cli -p 6399 rpush bc:d4 a b c
(integer) 3
$ redis-cli -p 6399 object encoding bc:d4
listpack
$ redis-cli -p 6399 memory usage bc:d4
(integer) 64
$ redis-cli -p 6399 del bc:d1 bc:d2 bc:d3 bc:d4
(integer) 4
```

需要注意：编码切换是单向的，从 listpack 升级到 hashtable 后即使删掉元素也不会回退；另外 `OBJECT ENCODING` 的返回值集合随版本演进，7.0 之后不会再看到 ziplist。

## 阅读建议

按“先对象层、后结构层”的顺序读源码效率最高：先看 src/object.c 的 `createObject()` 与各 `create*Object()` 工厂函数，弄清编码字段取值；再顺着具体命令（如 src/t_hash.c 的 `hashTypeSet()`）观察它在不同编码下的分支；最后深入结构实现（src/dict.c、src/listpack.c）。这样每读一个结构都能立刻对应到可观测的命令行为。

## 小结

Redis 的数据结构体系是“类型系统 + 多编码 + 底层结构”的三明治：上层类型对用户稳定，中间编码按数据规模自动切换，底层结构各自承担最优场景。掌握 `OBJECT ENCODING` 与源码中编码常量的对应关系，就掌握了阅读 8.0 源码数据结构部分的地图。
