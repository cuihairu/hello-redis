### 数据结构

#### 1. 概述

Redis 的强大之处在于它提供了丰富的数据类型，而这些数据类型的高性能实现依赖于一套精心设计的底层数据结构。Redis 并非直接使用操作系统提供的通用数据结构，而是根据内存效率、访问性能和实际使用场景，定制化实现了多种底层结构。

Redis 的数据结构体系主要由两层构成：**对象系统（Redis Object）** 和**底层编码（encoding）**。键和值都以 `robj`（Redis Object）形式表示，`robj` 包含了类型（type）、编码方式（encoding）、引用计数（refcount）、指向底层数据的指针等信息。这种设计使得同一种数据类型可以根据元素数量或大小选择最合适的底层编码，从而在性能和内存占用之间取得平衡。

#### 2. Redis 对象系统

Redis 对象系统的核心实现在 `src/object.c` 和 `src/server.h` 中：

- **`robj` 结构**：代表一个 Redis 对象，统一了所有数据类型的表示方式。它包含 `type`（REDIS_STRING、REDIS_LIST、REDIS_SET、REDIS_ZSET、REDIS_HASH 等）、`encoding`（底层编码方式）、`lru`（LRU 信息）、`refcount`（引用计数）和 `ptr`（指向底层数据结构的指针）。
- **引用计数（reference counting）**：用于内存管理和对象共享。当对象被引用时 `refcount++`，不再引用时 `refcount--`，当 `refcount == 0` 时对象会被释放。这种机制避免了不必要的内存拷贝，在某些场景下也能实现对象复用。
- **编码多态（encoding polymorphism）**：同一个数据类型可以有多种底层编码方式。例如，字符串（String）可以编码为 `OBJ_ENCODING_RAW`（SDS）、`OBJ_ENCODING_EMBSTR`（嵌入式 SDS）或 `OBJ_ENCODING_INT`（整数）；列表（List）可以使用 `OBJ_ENCODING_LISTPACK` 或 `OBJ_ENCODING_QUICKLIST` 等。

#### 3. 核心底层数据结构

Redis 的主要底层数据结构包括：

| 数据结构 | 源文件 | 作用 |
|---|---|---|
| **SDS（Simple Dynamic String）** | `src/sds.c`, `src/sds.h` | Redis 的动态字符串实现，替代了 C 字符串，支持二进制安全、动态扩展和长度预分配。 |
| **dict（Hash Table）** | `src/dict.c`, `src/dict.h` | 通用哈希表实现，用于实现键空间（database）、哈希类型（Hash）、集合类型（Set）等，支持渐进式 rehash。 |
| **listpack** | `src/listpack.c`, `src/listpack.h` | 紧凑的列表压缩结构，用于存储小型列表、哈希和有序集合的元素，具有更高的内存效率。 |
| **ziplist（legacy）** | `src/ziplist.c`, `src/ziplist.h` | 较早的压缩列表实现，在 Redis 7.x 中部分场景被 listpack 取代或作为兼容存在。 |
| **quicklist / quicklist2** | `src/quicklist.c` | 列表（List）类型的底层实现，将多个 listpack（或节点）链接起来，兼顾顺序访问和内存效率。 |
| **intset** | `src/intset.c`, `src/intset.h` | 整数集合，用于存储只包含整数元素的小型集合（Set），在元素数量较少且全为整数时节省内存。 |
| **skiplist** | `src/t_zset.c`（与 zset 一起实现） | 跳跃表，用于有序集合（Sorted Set/ZSET）的有序结构，支持范围查询和 O(log N) 的插入/删除。 |
| **HyperLogLog 表示** | `src/hll.c` | HyperLogLog 基数估计算法的实现，使用稀疏（sparse）和稠密（dense）两种表示方式。 |
| **geohash** | `src/geohash.c` | 地理坐标编码，用于 GEO 类型的实现（GEO 底层基于 ZSET + geohash）。 |

#### 4. 数据类型与底层编码映射

不同数据类型根据数据规模和特征选择不同的底层编码：

- **String**：`OBJ_ENCODING_INT`（整数值）、`OBJ_ENCODING_EMBSTR`（短字符串，≤ 44 字节左右）、`OBJ_ENCODING_RAW`（一般 SDS）。
- **List**：`OBJ_ENCODING_LISTPACK`、`OBJ_ENCODING_QUICKLIST`（Redis 7+ 常用的实现方式）。
- **Hash**：当元素较少且值较小时使用 `OBJ_ENCODING_LISTPACK`，元素增多时会转换为 `OBJ_ENCODING_HT`（基于 dict）。
- **Set**：当所有元素都是整数且数量较少时使用 `OBJ_ENCODING_INTSET`，否则使用 `OBJ_ENCODING_HT`（基于 dict）。
- **ZSET（Sorted Set）**：元素较少时使用 `OBJ_ENCODING_LISTPACK`（同时保存成员和值），元素较多时使用 `OBJ_ENCODING_SKIPLIST`（跳表 + dict 的组合，以支持 O(1) 按成员查找分值）。
- **Stream**：底层基于 listpack 和基数树（radix tree）索引实现，相关逻辑主要在 `src/t_stream.c` 中。

#### 5. 设计思想

Redis 的数据结构设计体现了以下思想：

- **内存优化优先**：通过紧凑编码（listpack、intset、embstr）减少内存开销，特别适合小数据集。
- **性能与内存的动态平衡**：采用编码转换（encoding conversion）机制，在数据量变化时自动切换到更合适的底层编码。
- **渐进式操作**：例如 dict 的渐进式 rehash（`_dictRehashStep`、`dictNext`）避免了大哈希表重建时的长时间阻塞。
- **二进制安全**：所有字符串处理都基于 SDS，支持存储任意二进制数据（如图片、序列化对象等）。

### 小结

Redis 的数据结构体系是其高性能和多样化功能的基础。通过对象系统将类型抽象与底层编码解耦，再结合针对性的底层数据结构（SDS、dict、listpack、quicklist、skiplist、intset 等），Redis 能够根据不同场景自动优化内存和性能。这种设计既保证了 API 的简洁性，又实现了极致的效率。理解这些数据结构的实现细节，有助于更好地理解 Redis 各种数据类型的行为特征和性能瓶颈。