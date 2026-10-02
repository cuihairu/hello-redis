# 具体数据结构实现

## 概述

本节深入五种核心底层结构的源码实现：sds、dict、listpack、quicklist、skiplist，最后简要说明 intset 与 rax。每种结构都给出关键数据结构定义、核心函数与可直接运行的验证命令。以下代码引用基于 Redis 8.0 源码。

## sds：简单动态字符串

src/sds.c、src/sds.h。sds 在 char 指针前面放一个 header，header 按字符串长度分成 5 档，短字符串不浪费内存：

```c
struct sdshdr8 {
    uint8_t len;      /* 已使用长度 */
    uint8_t alloc;    /* 不含头和结尾 \0 的总分配长度 */
    unsigned char flags;
    char buf[];
};
```

5 种 header（sdshdr5/8/16/32/64）中，sdshdr5 把长度压缩进 flags 字段（长度上限 31 字节），其余 4 种的区别只是 len 与 alloc 的位宽（8/16/32/64 位）。这样带来三个性质：

- `sdslen()` 是 O(1)（src/sds.h 内联函数，直接读 header）；
- `sdsavail()` 能知道剩余空间，`sdscatlen()` 追加前先检查是否需要扩容；
- 二进制安全，`buf` 中间可以出现 `\0`。

关键函数：`sdsnewlen()`（创建）、`sdscatlen()`（追加）、`sdsfree()`（释放）、`sdsrange()`（裁剪）。

## dict：渐进式 rehash 哈希表

src/dict.c、src/dict.h。核心结构同时持有两张表：

```c
typedef struct dict {
    dictEntry **ht_table[2];
    unsigned long ht_used[2];
    long rehashidx;   /* rehashidx == -1 表示不在 rehash 中 */
    ...
} dict;
```

扩容由 `dictExpand()` 触发，真正的搬移分散在 `dictRehash(d, n)` 中：每次最多搬 n 个非空桶（`serverCron` 与常规操作路径分别以时间片和单步方式推进，`_dictRehashStepIfNeeded()` 保证每次键空间操作只搬一小步）。rehash 期间查找会先查 ht_table[0] 再查 ht_table[1]，新增一律进入 ht_table[1]。缩容走 `dictResize()`，逻辑相同。

`dictScan()` 的实现也很巧妙：利用表大小为 2 的幂的特性做“反向二进制迭代”，保证扩缩容过程中不会漏掉元素。键空间、过期表、命令表、订阅关系全部建立在 dict 之上。

## listpack：紧凑列表

src/listpack.c、src/listpack.h。listpack 是一块连续内存：总字节数 + 元素序列 + 结尾标记，每个元素自带长度与编码（小整数直接内联，字符串按长度分档）。7.0 起它全面取代 ziplist，节点中不记录前驱长度，因此没有级联更新问题。

核心函数：`lpNew()` 分配、`lpAppend()` / `lpAppendInteger()` / `lpPrepend()` 追加、`lpInsert()` 任意位置插入、`lpGet()` / `lpGetValue()` 读取、`lpNext()` / `lpPrev()` / `lpFirst()` / `lpLast()` 遍历、`lpLength()` 统计。哈希（字段名与值交替）、有序集合（成员与 score 交替）、字符串集合（纯元素）的小数据形态都以这种连续 listpack 保存：

```bash
$ redis-cli -p 6399 hset bc:i1 f1 v1 f2 v2
(integer) 2
$ redis-cli -p 6399 object encoding bc:i1
listpack
$ redis-cli -p 6399 hlen bc:i1
(integer) 2
```

## quicklist：链表套 listpack

src/quicklist.c、src/quicklist.h。quicklist 是双向链表，每个节点是一个 listpack：

```c
typedef struct quicklistNode {
    struct quicklistNode *prev;
    struct quicklistNode *next;
    unsigned char *entry;   /* 指向 listpack */
    size_t sz;              /* listpack 字节数 */
    unsigned int count : 16;
    unsigned int encoding : 2;  /* RAW=1 / LZF=2 */
    unsigned int container : 2; /* PLAIN=1 / PACKED=2 */
    ...
} quicklistNode;
```

`quicklistPush()` 根据插入位置选择 `quicklistPushHead()` 或 `quicklistPushTail()`，插入前用 `_quicklistNodeAllowInsert()` 判断目标节点是否还能装下——阈值来自 `list-max-listpack-size`（负值表示字节上限，-1 为 4KB、-2 为 8KB）。装不下就新开节点；中间节点还可按 `list-compress-depth` 用 LZF 压缩（encoding 变为 LZF）。

```bash
$ redis-cli -p 6399 rpush bc:i2 a b c
(integer) 3
$ redis-cli -p 6399 object encoding bc:i2
listpack
$ redis-cli -p 6399 llen bc:i2
(integer) 3
```

元素很少时整个 quicklist 只有一个 listpack 节点，因此编码仍显示 listpack；单节点超过 8KB 后才体现为多个节点的 quicklist。

## skiplist：有序集合的索引

src/t_zset.c。zset 的 skiplist 编码同时维护两个结构：跳表（`zskiplist`，负责按 score 范围查询）和 dict（负责成员到 score 的 O(1) 查询）。跳表节点层数由 `zslRandomLevel()` 按 1/4 概率逐层生成（`ZSKIPLIST_MAXLEVEL` 为上限），插入通过 `zslInsert()` 完成，`zslGetRank()`、范围遍历等都是 O(log N)。

切换到 skiplist 编码发生在元素数超过 `zset-max-listpack-entries`（默认 128）或成员长度超过 `zset-max-listpack-value`（默认 64）时，由 `zsetConvert()` 完成：

```bash
$ redis-cli -p 6399 zadd bc:i3 1 a 2 b
(integer) 2
$ redis-cli -p 6399 object encoding bc:i3
listpack
$ redis-cli -p 6399 del bc:i3
(integer) 1
```

## intset 与 rax

- **intset**（src/intset.c）：有序整数数组，`intsetAdd()` 二分插入；遇到超出当前位宽的整数时 `intsetUpgradeAndAdd()` 整体升级（16 位到 64 位）。全整数且数量在 `set-max-intset-entries`（默认 512）内的集合用它，`OBJECT ENCODING` 显示 intset；
- **rax**（src/rax.c）：基数树，`raxInsert()`、`raxSeek()` 支持路径压缩与范围迭代，Stream 的消息 ID 索引（`raxNew()` 建树）以及集群的部分统计都依赖它。

## 小结

这几种结构的取舍逻辑非常清晰：单值用 sds，映射关系用 dict（配合渐进式 rehash 防止长尾延迟），小规模序列用 listpack 省内存，大规模序列用 quicklist 兼顾两端操作与内存，排序需求用 skiplist 补 dict 的短板。阅读源码时建议按“结构定义 → 创建/插入 → 迭代/查找 → 释放”的顺序过每个文件，并用 `OBJECT ENCODING` 与 `MEMORY USAGE` 在真实实例上对照验证。
