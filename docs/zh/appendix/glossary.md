# 术语表

Redis 核心术语的中英对照、一句话定义、权威出处与相关页。

**维护口径**：新增条目必须给出可点的权威出处；查不到就写「未找到权威出处（待核）」，不得凭印象编造链接。

## 持久化

### AOF（Append-Only File（仅追加文件））
Redis 的持久化方式之一，以追加方式记录每条写命令，重启时重放恢复数据。
**出处**：[Redis 运维手册 · 持久化](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
**出处**：[aof.c（AOF 实现）](https://github.com/redis/redis/blob/unstable/src/aof.c)
**相关页**：[AOF日志](/zh/advanced/aof-log)、[AOF持久化实现](/zh/source-code-analysis/persistence/aof)

### 持久化（Persistence）
把内存数据写入磁盘的过程，Redis 提供 RDB 与 AOF 两种方式及混合模式。
**出处**：[Redis 运维手册 · 持久化](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
**相关页**：[持久化](/zh/advanced/persistence)、[RDB快照](/zh/advanced/rdb-snapshot)、[AOF日志](/zh/advanced/aof-log)

### 快照（Snapshot（RDB））
某一时刻 Redis 全量数据的二进制镜像，由 `SAVE`/`BGSAVE` 生成，用于持久化与复制。
**出处**：[Redis 运维手册 · 持久化（RDB）](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
**相关页**：[RDB快照](/zh/advanced/rdb-snapshot)、[RDB持久化实现](/zh/source-code-analysis/persistence/rdb)

### RDB（Redis Database）
Redis 的二进制全量快照持久化格式，文件紧凑、恢复快，适合备份与灾难恢复。
**出处**：[Redis 运维手册 · 持久化](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
**出处**：[rdb.c（RDB 实现）](https://github.com/redis/redis/blob/unstable/src/rdb.c)
**相关页**：[RDB快照](/zh/advanced/rdb-snapshot)、[RDB持久化实现](/zh/source-code-analysis/persistence/rdb)

### COW（Copy-On-Write（写时复制））
fork 子进程做 RDB/AOF 重写时，父子共享物理页，页被修改时才复制，减少内存开销。
**出处**：[Redis 运维手册 · 持久化](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)
**相关页**：[RDB快照](/zh/advanced/rdb-snapshot)、[持久化](/zh/advanced/persistence)

## 内存与淘汰

### 最大内存（maxmemory）
Redis 实例允许使用的内存上限，超过后按 `maxmemory-policy` 执行淘汰。
**出处**：[Redis 运维手册 · 配置](https://redis.io/docs/latest/operate/oss_and_stack/management/config/)
**相关页**：[Redis 配置文件详解](/zh/basics/configuration-file)、[内存管理](/zh/source-code-analysis/memory-management)

### 淘汰（Eviction）
内存达到 maxmemory 上限后按键空间策略删除键的机制，支持 LRU/LFU 等策略。
**出处**：[Redis 运维手册 · 优化](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/)
**出处**：[expire.c（过期与淘汰）](https://github.com/redis/redis/blob/unstable/src/expire.c)
**相关页**：[内存优化策略](/zh/source-code-analysis/memory-management/optimization)、[Redis 配置文件详解](/zh/basics/configuration-file)

### LRU / LFU（Least Recently/Frequently Used）
两种内存淘汰策略：LRU 淘汰最久未使用键，LFU 淘汰访问频率最低键（4.0+）。
**出处**：[Redis 运维手册 · 优化](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/)
**相关页**：[内存管理](/zh/source-code-analysis/memory-management)、[Redis 配置文件详解](/zh/basics/configuration-file)

### 过期时间（TTL（Time To Live））
键的剩余生存时间，到期自动删除，可用 `TTL` 查看、`EXPIRE` 设置。
**出处**：EXPIRE 命令（未找到权威出处（待核））
**出处**：TTL 命令（未找到权威出处（待核））
**相关页**：[Redis 键的操作](/zh/basics/key-operations)、[内存管理](/zh/source-code-analysis/memory-management)

## 数据类型

### Hash（Hash）
字段到值的映射数据类型，适合存储对象，支持单字段读写。
**出处**：[Redis 开发文档 · Hashes](https://redis.io/docs/latest/develop/data-types/hashes/)
**相关页**：[Redis 哈希（Hash）](/zh/basics/hash)、[购物车](/zh/use-cases/shopping-cart)

### HyperLogLog（HyperLogLog（HLL））
概率型基数估算数据结构，固定约 12KB 内存估算大量不重复元素数量。
**出处**：[Redis 开发文档 · Probabilistic](https://redis.io/docs/latest/develop/data-types/probabilistic/)
**相关页**：[Redis HyperLogLog](/zh/basics/hyperloglog)、[实时分析](/zh/use-cases/real-time-analytics)

### GEO（Geospatial（地理空间））
基于有序集合与 GeoHash 实现的地理位置数据结构，支持半径与范围查询。
**出处**：[Redis 开发文档 · Geospatial](https://redis.io/docs/latest/develop/data-types/geospatial/)
**相关页**：[Redis 地理空间数据](/zh/basics/geospatial)、[地理空间索引](/zh/use-cases/geospatial-indexing)

### GeoHash（GeoHash）
把二维经纬度编码为单一整数的地理编码算法，便于有序集合按地理位置排序。
**出处**：[Redis 开发文档 · Geospatial](https://redis.io/docs/latest/develop/data-types/geospatial/)
**相关页**：[Redis 地理空间数据](/zh/basics/geospatial)、[实际案例：基于位置的服务](/zh/use-cases/geolocation-services/location-based)

### SDS（Simple Dynamic String）
Redis 内部的二进制安全字符串实现，记录长度、预留空间，避免缓冲区溢出。
**出处**：[sds.c（SDS 实现）](https://github.com/redis/redis/blob/unstable/src/sds.c)
**相关页**：[具体数据结构实现](/zh/source-code-analysis/data-structures/implementation)、[数据结构与算法](/zh/source-code-analysis/data-structures)

### listpack（listpack）
紧凑顺序存储编码，Redis 7 起替代 ziplist，避免连锁更新问题。
**出处**：[listpack.c（listpack 实现）](https://github.com/redis/redis/blob/unstable/src/listpack.c)
**相关页**：[具体数据结构实现](/zh/source-code-analysis/data-structures/implementation)、[数据结构与算法](/zh/source-code-analysis/data-structures)

### ziplist（ziplist）
listpack 之前的紧凑顺序编码，存在连锁更新问题，Redis 7 起逐步移除。
**出处**：[ziplist.c（ziplist 实现）](https://github.com/redis/redis/blob/unstable/src/ziplist.c)
**相关页**：[数据结构与算法](/zh/source-code-analysis/data-structures)、[具体数据结构实现](/zh/source-code-analysis/data-structures/implementation)

### 跳表（Skiplist）
有序集合底层的多级索引结构，支持 O(log N) 查找与范围查询。
**出处**：[t_zset.c（跳表实现）](https://github.com/redis/redis/blob/unstable/src/t_zset.c)
**出处**：[Redis 开发文档 · Sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)
**相关页**：[具体数据结构实现](/zh/source-code-analysis/data-structures/implementation)、[Redis 有序集合（Sorted Set）](/zh/basics/zset)

## 集群与高可用

### 集群（Cluster）
Redis 官方多节点分片方案，数据按哈希槽分布，支持自动故障转移。
**出处**：[Redis 集群规范](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)
**相关页**：[Redis 集群模式（Cluster Mode）](/zh/advanced/cluster)、[Redis集群实现](/zh/source-code-analysis/cluster)

### 分片（Sharding）
把数据分布到多个节点的机制，Redis 集群固定 16384 个哈希槽承载分片。
**出处**：[Redis 集群规范](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)
**相关页**：[Redis 集群模式（Cluster Mode）](/zh/advanced/cluster)、[Redis集群实现](/zh/source-code-analysis/cluster)

### 槽（Slot）
Redis 集群固定 16384 个哈希槽，键经 CRC16 取模后落到对应槽与节点。
**出处**：[Redis 集群规范](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)
**相关页**：[Redis 集群模式（Cluster Mode）](/zh/advanced/cluster)、[Redis集群实现](/zh/source-code-analysis/cluster)

### 主从复制（Replication）
主节点把数据变更同步到多个从节点，实现读写分离与数据冗余。
**出处**：[Redis 运维手册 · 复制](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/)
**相关页**：[主从复制（Master-Slave Replication）](/zh/advanced/replication)、[数据分片与复制](/zh/source-code-analysis/cluster/sharding-replication)

### 哨兵（Sentinel）
Redis 官方高可用方案，监控主从拓扑并自动完成故障转移与配置提供。
**出处**：[Redis 运维手册 · Sentinel](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/)
**相关页**：[哨兵模式（Sentinel Mode）](/zh/advanced/sentinel)、[高可用性](/zh/advanced/high-availability)

### 红锁（Redlock）
在多个独立 Redis 实例上实现分布式锁的算法，避免单点故障导致锁失效。
**出处**：[Redis 官方模式 · 分布式锁](https://redis.io/docs/latest/develop/use/patterns/distributed-locks/)
**相关页**：[分布式锁](/zh/use-cases/distributed-locks)、[实现分布式锁的基本原理](/zh/development/distributed-lock)

## 性能与运维

### 慢日志（Slow Log）
记录执行时间超过 `slowlog-log-slower-than` 的命令，用于定位性能瓶颈。
**出处**：SLOWLOG GET 命令（未找到权威出处（待核））
**相关页**：[Redis 性能监控与调优](/zh/advanced/performance-monitoring)、[Redis 集群的监控与故障排除](/zh/operations/monitoring-and-troubleshooting)

### 毛刺（Latency Spike）
短暂出现的延迟尖峰，常见诱因包括 fork、刷盘与慢命令。
**出处**：[Redis 运维手册 · 调试（延迟）](https://redis.io/docs/latest/operate/oss_and_stack/management/debugging/)
**相关页**：[Redis 性能监控与调优](/zh/advanced/performance-monitoring)、[Redis 集群的监控与故障排除](/zh/operations/monitoring-and-troubleshooting)

### 渐进式 rehash（Progressive Rehashing）
字典扩容时分摊到每次操作逐步迁移键，避免一次性 rehash 阻塞主线程。
**出处**：[dict.c（渐进式 rehash 实现）](https://github.com/redis/redis/blob/unstable/src/dict.c)
**相关页**：[具体数据结构实现](/zh/source-code-analysis/data-structures/implementation)、[数据结构与算法](/zh/source-code-analysis/data-structures)

## 命令与协议

### ACL（Access Control List（访问控制列表））
Redis 6 引入的多用户权限模型，按用户、命令、键模式细粒度授权。
**出处**：ACL LIST 命令（未找到权威出处（待核））
**相关页**：[身份验证与授权](/zh/advanced/authentication-and-authorization)、[Redis 6的新特性](/zh/advanced-topics/redis-6-features)

### RESP（Redis Serialization Protocol）
Redis 客户端与服务端之间的通信协议，含 RESP2 与 RESP3 两个版本。
**出处**：[RESP 协议规范](https://redis.io/docs/latest/develop/reference/protocol-spec/)
**相关页**：[Redis协议概述](/zh/source-code-analysis/network-protocol/protocol-overview)、[网络协议](/zh/source-code-analysis/network-protocol)

### 事务（Transaction）
以 `MULTI`/`EXEC` 包裹的一组命令原子执行，期间不穿插其他客户端命令。
**出处**：MULTI 命令（未找到权威出处（待核））
**相关页**：[Redis 基本操作](/zh/basics/basic-operations)、[使用 Redis 开发](/zh/development/using-redis)

### 管道（Pipeline）
客户端一次发送多条命令并批量读取响应，减少网络往返开销。
**出处**：[Redis 开发文档 · 使用命令](https://redis.io/docs/latest/develop/using-commands/)
**相关页**：[网络协议](/zh/source-code-analysis/network-protocol)、[Redis 基本操作](/zh/basics/basic-operations)

### 发布订阅（Pub/Sub）
基于频道的消息广播机制，生产者向频道发布，订阅者实时接收。
**出处**：[Redis 开发文档 · Pub/Sub](https://redis.io/docs/latest/develop/pubsub/)
**相关页**：[实际案例：实时聊天应用](/zh/use-cases/chat-system/real-time-chat)、[消息队列](/zh/use-cases/message-queues)

### 分片 Pub/Sub（Sharded Pub/Sub）
Redis 7 引入的分片级 Pub/Sub，消息只在键所属分片内投递（7.0+）。
**出处**：[Redis 开发文档 · Pub/Sub](https://redis.io/docs/latest/develop/pubsub/)
**相关页**：[实际案例：实时聊天应用](/zh/use-cases/chat-system/real-time-chat)、[Redis 集群模式（Cluster Mode）](/zh/advanced/cluster)

### Lua 脚本（Lua Script）
用 `EVAL` 在服务端原子执行多条命令，减少往返并保证原子性。
**出处**：[Redis 开发文档 · Lua 脚本入门](https://redis.io/docs/latest/develop/programmability/eval-intro/)
**相关页**：[EVAL 命令](/zh/scripts/lua/eval)、[EVALSHA 命令](/zh/scripts/lua/evalsha)

### 脚本缓存（Script Cache）
服务端缓存 Lua 脚本的 SHA1 摘要，`EVALSHA` 直接按摘要重放脚本。
**出处**：EVALSHA 命令（未找到权威出处（待核））
**相关页**：[EVALSHA 命令](/zh/scripts/lua/evalsha)、[EVAL 命令](/zh/scripts/lua/eval)

## 概念与社区术语

### 缓存穿透（Cache Penetration）
请求不存在的数据，绕过缓存直达数据库。（社区通用术语，Redis 官方无专页，待核）
**出处**：[Redis 开发文档 · 场景](https://redis.io/docs/latest/develop/use-cases/)
**相关页**：[缓存](/zh/use-cases/caching)、[1. 缓存层集成](/zh/development/cache-integration)

### 缓存击穿（Cache Breakdown）
热点键过期瞬间大量请求同时回源。（社区通用术语，Redis 官方无专页，待核）
**出处**：[Redis 开发文档 · 场景](https://redis.io/docs/latest/develop/use-cases/)
**相关页**：[缓存](/zh/use-cases/caching)、[1. 缓存层集成](/zh/development/cache-integration)

### 缓存雪崩（Cache Avalanche）
大量键同时过期导致数据库被压垮。（社区通用术语，Redis 官方无专页，待核）
**出处**：[Redis 开发文档 · 场景](https://redis.io/docs/latest/develop/use-cases/)
**相关页**：[缓存](/zh/use-cases/caching)、[1. 缓存层集成](/zh/development/cache-integration)

### 一致性哈希（Consistent Hashing）
平衡节点增减时数据迁移量的哈希分片方案。（Redis 集群用哈希槽而非一致性哈希，待核）
**出处**：[Redis 集群规范](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)
**相关页**：[Redis 集群模式（Cluster Mode）](/zh/advanced/cluster)、[Redis集群实现](/zh/source-code-analysis/cluster)

### 排名（Rank）
有序集合中的位置（0 起始），可用 `ZRANK`/`ZREVRANK` 查询。
**出处**：[Redis 开发文档 · Sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)
**出处**：ZREVRANGE 命令（未找到权威出处（待核））
**相关页**：[排行榜](/zh/use-cases/leaderboards)、[连接到 Redis](/zh/use-cases/ranking-and-counting/ranking)

<!-- BACKLINKS-AUTO -->
## 相关页面

- [README](README.md)
- [knowledge](/zh/knowledge.md)
