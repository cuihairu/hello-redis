# 术语表

列出本书出现的术语与缩写，帮助快速对照理解（按主题分组排列）。

| 术语 | 英文/缩写 | 说明 |
| --- | --- | --- |
| AOF | Append-Only File | 追加式持久化文件，记录写命令 |
| ACL | Access Control List | 访问控制列表（Redis 6+ 的多用户权限模型） |
| 分片 | Sharding | 把数据分布到多个节点，集群按槽位分片 |
| 槽 | Slot | Redis 集群固定 16384 个哈希槽，键经 CRC16 取模落槽 |
| 缓存穿透 | Cache Penetration | 请求不存在的数据，绕过缓存直达数据库 |
| 缓存击穿 | Cache Breakdown | 热点键过期瞬间大量请求回源 |
| 缓存雪崩 | Cache Avalanche | 大量键同时过期导致数据库被压垮 |
| COW | Copy-On-Write | 写时复制，`BGSAVE` fork 子进程时采用 |
| 淘汰 | Eviction | 内存达到上限后按策略删除键 |
| 快照 | Snapshot | RDB 方式的定时全量数据镜像 |
| GEO | Geospatial | 基于有序集合的地理位置命令集 |
| GeoHash | GeoHash | 把经纬度编码为单一整数的地理编码算法 |
| Hash | Hash | 哈希（字段-值映射）数据类型 |
| HyperLogLog | HLL | 基数估算算法，固定内存估算去重数量 |
| 集群 | Cluster | 官方多节点分片与自动故障转移方案 |
| 渐进式 rehash | Progressive Rehashing | 字典扩容时分摊到多次操作的键迁移 |
| 慢日志 | Slow Log | 记录超过阈值的慢命令（`SLOWLOG`） |
| listpack | listpack | 紧凑顺序存储编码，Redis 7 起替代 ziplist |
| LRU / LFU | Least Recently/Frequently Used | 最近最少使用/最不经常使用淘汰策略 |
| Lua 脚本 | Lua Script | 用 `EVAL` 在服务端原子执行多条命令 |
| 最大内存 | maxmemory | 实例允许使用的内存上限 |
| 毛刺 | Latency Spike | 短暂出现的延迟尖峰（如 fork、刷盘引起） |
| 主从复制 | Replication | 一个主节点数据同步到多个从节点 |
| 哨兵 | Sentinel | 主从自动故障转移与配置提供的高可用方案 |
| 发布订阅 | Pub/Sub | 频道消息广播机制（另有分片 Pub/Sub） |
| 脚本缓存 | Script Cache | `EVALSHA` 使用的服务端 Lua 脚本缓存 |
| 分片 Pub/Sub | Sharded Pub/Sub | 消息只在所属分片内投递（7.0+） |
| SDS | Simple Dynamic String | Redis 内部的二进制安全字符串实现 |
| 持久化 | Persistence | RDB/AOF 把内存数据落盘的过程 |
| 管道 | Pipeline | 一次发送多条命令减少网络往返 |
| 排名 | Rank | 有序集合中的位置（0 起始） |
| 事务 | Transaction | `MULTI/EXEC` 命令批量原子执行 |
| 过期时间 | TTL | 键的剩余生存时间（Time To Live） |
| 跳表 | Skiplist | 有序集合的多级索引结构，支持 O(log N) 范围查询 |
| 一致性哈希 | Consistent Hashing | 平衡节点增减时数据迁移量的哈希分片方案 |
| RDB | Redis Database | AOF 之外的另一种持久化格式（二进制快照） |
| RESP | Redis Serialization Protocol | Redis 客户端-服务端通信协议（RESP2/RESP3） |
| ziplist | ziplist | listpack 之前的紧凑编码，存在连锁更新问题 |
| 红锁 | Redlock | 在多个 Redis 实例上实现的分布式锁算法 |
