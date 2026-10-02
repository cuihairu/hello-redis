### 数据结构概览

#### 概述

Redis 数据结构的概览从宏观角度介绍对象系统如何组织底层结构，以及各数据类型的整体实现思路。Redis 中的每个键值对都存储在数据库的键空间（keyspace）中，键是一个字符串（SDS 表示的 `robj`），值是任意一种 Redis 类型的 `robj`。

Redis 对象（`robj`）定义于 `src/server.h`，其设计目的是将类型信息和编码信息抽象出来，使得命令处理层可以统一处理不同底层编码的对象，同时也为内存管理（引用计数）和 LRU 淘汰提供支持。

#### 关键流程与实现要点

**1. Redis 对象（robj）**

`robj` 是 Redis 的核心抽象：

- **type**：标识对象类型（`OBJ_STRING`、`OBJ_LIST`、`OBJ_SET`、`OBJ_ZSET`、`OBJ_HASH`、`OBJ_STREAM`、`OBJ_MODULE` 等）。
- **encoding**：标识底层编码方式（如 `OBJ_ENCODING_RAW`、`OBJ_ENCODING_INT`、`OBJ_ENCODING_HT`、`OBJ_ENCODING_LISTPACK`、`OBJ_ENCODING_SKIPLIST` 等）。
- **refcount**：引用计数，用于对象共享和垃圾回收。当 `refcount` 减至 0 时，对象会被释放。
- **lru**：记录对象最近被访问的时间，用于 LRU/LFU 内存淘汰策略的决策。
- **ptr**：指向底层实际数据结构的指针。

对象的创建和管理主要通过 `src/object.c` 中的函数完成，如 `createObject()`、`makeObjectShared()`、`decrRefCount()`、`incrRefCount()` 等。

**2. 字符串（String）**

字符串是最基础的数据类型：

- **整数编码**：当字符串值可以表示为长整数时，Redis 会使用 `OBJ_ENCODING_INT` 编码，直接将整数值存储在 `ptr` 中，以节省内存。
- **嵌入式字符串（EMBSTR）**：对于长度较短（通常 ≤ 44 字节）的字符串，使用 `OBJ_ENCODING_EMBSTR`。EMBSTR 将 `robj` 结构和 SDS 结构连续分配在一块内存中，减少了内存分配次数和内存碎片。
- **原始字符串（RAW）**：对于较长的字符串，使用 `OBJ_ENCODING_RAW`，`ptr` 指向独立分配的 SDS 结构。

字符串的底层实现是 SDS（`src/sds.c`）。SDS 相比 C 字符串的优势包括：记录长度（`len`）、可用空间（`alloc`）、二进制安全、预分配策略以减少内存重分配次数。

**3. 哈希（Hash）**

哈希类型用于存储字段-值对：

- **小型哈希**：当哈希中的字段和值总数较少且每个元素较小时，采用 `OBJ_ENCODING_LISTPACK` 编码。listpack 以紧凑的方式依次存储字段和值，适合内存敏感的小型数据。
- **哈希表编码**：当哈希规模超过阈值（由配置或内部策略决定）时，转换为 `OBJ_ENCODING_HT`，底层使用 `dict`（`src/dict.c`）实现。dict 提供 O(1) 平均时间复杂度的查找、插入和删除操作，并支持渐进式 rehash。

**4. 列表（List）**

列表是有序的字符串序列：

- **底层实现**：在 Redis 7.x 中，列表主要使用 `OBJ_ENCODING_QUICKLIST`（`src/quicklist.c`）实现。Quicklist 将多个节点串联，每个节点内部通常存储一个 listpack，从而在顺序访问性能和内存压缩之间取得平衡。
- **设计考量**：这种设计既支持头尾快速插入（LPUSH/RPUSH）、范围查询（LRANGE），又能通过压缩节点内的元素来减少内存占用。

**5. 集合（Set）**

集合是无序的唯一元素集合：

- **整数集合**：当集合中的所有元素都是整数，并且元素数量不超过一定阈值时，使用 `OBJ_ENCODING_INTSET`（`src/intset.c`）。intset 是一种紧凑的有序整数数组，支持二分查找，适合纯整数的小型集合。
- **哈希表**：当集合包含非整数元素，或元素数量超过阈值时，使用 `OBJ_ENCODING_HT`（基于 dict）。在这种编码下，dict 的键存储集合元素，值为 `NULL`，从而实现集合的去重和 O(1) 平均查找。

**6. 有序集合（Sorted Set / ZSET）**

有序集合的每个成员都关联一个分值（score），并按分值排序：

- **小型 ZSET**：元素较少时，使用 `OBJ_ENCODING_LISTPACK`。listpack 中交替存储成员和分值（member, score, member, score, ...），既保持紧凑，又能支持按分值排序的范围操作。
- **跳表 + 字典**：元素较多时，使用 `OBJ_ENCODING_SKIPLIST`。底层组合了跳跃表（skiplist）和字典（dict）。跳表用于按分值排序和范围查询（ZRANGE、ZRANGEBYSCORE），字典用于 O(1) 平均时间复杂度的按成员查找分值（ZSCORE）。这两个结构共享相同的元素数据，以避免内存重复。

跳跃表的实现位于 `src/t_zset.c` 中，是 ZSET 高性能排序的关键。

### 小结

Redis 的数据结构概览展示了对象系统如何通过类型和编码的抽象，将多样化的数据类型映射到不同的底层实现上。字符串、哈希、列表、集合、有序集合等类型都根据数据特征选择最优编码，在内存效率和访问性能之间取得平衡。理解这种分层设计，是深入分析各数据结构具体实现的前提。