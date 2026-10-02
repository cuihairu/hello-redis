# 核心数据结构与算法

Redis 对外提供 String、List、Hash、Set、Sorted Set 等数据类型，对内则由一组精心设计的基础结构实现。理解这些结构，可以解释每个类型的编码（`OBJECT ENCODING`）变化及其性能特征。

## SDS：简单动态字符串

Redis 不直接使用 C 字符串，而是使用 SDS（Simple Dynamic String）：

- 头部记录长度 `len` 与剩余空间 `alloc`，`strlen` 是 O(1)；
- 二进制安全，可以保存 `\0` 在内的任意字节；
- 通过预分配与惰性释放减少扩容时的内存重分配次数。

## 字典：渐进式 rehash

键空间本身就是一个大字典（dict），基于链地址法解决冲突。扩容时不一次性搬移所有键，而是维护两张哈希表，把 rehash 分摊到后续的每次增删改查中，避免长时间阻塞：

- `rehashidx` 从 -1 变为 0 表示 rehash 开始；
- 每次操作顺带迁移一个桶（bucket）；
- 查找时先查 ht[0]，rehash 期间再查 ht[1]。

当负载因子过低（缩容）或过高（扩容）时触发 rehash，阈值由 `expand`/`shrink` 策略决定。

## 压缩列表与 listpack

小体积的 Hash、Sorted Set 等会用紧凑的顺序存储来节省内存：

- **ziplist**：连续内存 + 变长编码，尾部记录偏移便于反向遍历，但存在"连锁更新"问题（前一节点长度变化会引起后续节点连锁修改）；
- **listpack**（Redis 7.0 起）：每个节点只记录自身长度，彻底消除连锁更新，Redis 7.0 起逐步替代 ziplist（如 Hash 编码 `listpack`）。

转换阈值由 `hash-max-listpack-entries`、`hash-max-listpack-value`（旧名 `*-max-ziplist-*`）等配置控制，超过阈值后转换为目标结构（如 Hash 转为字典）。

## quicklist 与 skiplist

- **List** 的底层是 quicklist：由多个 listpack（旧版 ziplist）节点组成的双向链表，兼顾内存紧凑与插入性能；`list-compress-depth` 可以对中间节点做 LZF 压缩。
- **Sorted Set** 在元素较多时同时使用字典与跳表（skiplist）：字典支持 O(1) 按成员查分数，跳表支持 O(log N) 范围查询与排名。跳表通过多级索引实现平均 O(log N) 的查找，实现比平衡树简单且范围遍历更自然。

## 其他结构

- **intset**：全部为整数且数量较少时，Set 使用整数数组存储，查找为二分；出现非整数成员后升级为字典（`intset` 编码可对应内存极小的整型集合）。
- **embstr 与 raw**：短字符串（默认 44 字节内）以 `embstr` 编码，对象头与 SDS 分配在同一块内存；超长后转为 `raw`。
- **LFU/LRU 淘汰元数据**：每个对象的 24 位 lru 字段同时承载 LRU 时钟或 LFU 的对数计数与衰减时间（`OBJECT FREQ` 可查看访问频率）。

## 用命令观察编码

```bash
SET s hello                 # embstr
APPEND s world              # raw（超过阈值）
HSET h f v                  # listpack（小哈希）
ZADD z 1 a                  # listpack（小有序集合）
SADD i 1 2 3                # intset
OBJECT ENCODING s
OBJECT ENCODING h
MEMORY USAGE h              # 估算键占用内存
```

## 小结

Redis 的内存效率来自"小数据用紧凑编码、大数据用高性能结构"的双轨策略。运维上表现为：控制单键大小可以让数据长期停留在 listpack/intset 等省内存的编码上；而一旦超过阈值，编码转换会带来内存与性能的变化。
