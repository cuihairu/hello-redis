# 兼容Redis的开源项目

除了前面介绍的具体项目，围绕 Redis 协议还有大量开源实现与周边工具。本篇按类别汇总，便于按需求检索。

## 内存型兼容实现

| 项目 | 语言 | 特点 |
| --- | --- | --- |
| Valkey | C | Redis 7.2 分叉，BSD 许可，8.x 引入增强多线程 I/O |
| KeyDB | C++ | Redis 分支，多线程 I/O 与 Active Replication |
| Dragonfly | C++ | 共享无多线程，单节点支持 TB 级内存 |
| MemoryDB 类云服务 | - | 云厂商托管的 Redis 兼容服务（如 ElastiCache、MemoryDB） |

## 磁盘型 / 大容量兼容实现

| 项目 | 引擎 | 特点 |
| --- | --- | --- |
| Pika | RocksDB | 360 开源，TB 级容量，常用 Redis 命令兼容 |
| SSDB | LevelDB/RocksDB | 类 Redis 接口的持久化 KV |
| Ardb | RocksDB/LevelDB/LMDB | 多引擎可选的 Redis 兼容服务 |
| TiKV | RocksDB | 分布式 KV，兼容部分 Redis 协议（Redis API 支持有限） |

## 专业领域兼容实现

| 项目 | 领域 | 说明 |
| --- | --- | --- |
| Tile38 | 地理空间 | 地理围栏与空间查询，Redis 协议通信 |
| Garnet | 内存 KV | 微软研究院用 C# 实现的高吞吐 Redis 兼容服务 |
| Vert.x Redis 等 | 嵌入式/框架内嵌 | 框架内提供的 Redis 协议服务实现 |

## 代理与分片中间件

- **Twemproxy（nutcracker）**：Twitter 开源的轻量代理，支持 Redis/Memcached 协议，提供一致性哈希分片；
- **Codis**：代理 + 控制台的 Redis 分片方案，支持在线迁移（Go 编写，已停止积极维护但仍被广泛了解）；
- **Predixy**：高性能 Redis 集群代理，支持完整 Redis 协议的多租户转发。

## 客户端库

| 语言 | 库 |
| --- | --- |
| Python | redis-py（含 asyncio）、aioredis（已并入 redis-py） |
| Java | Jedis、Lettuce、Redisson、Spring Data Redis |
| Go | go-redis |
| Node.js | node-redis、ioredis |
| PHP | phpredis（扩展）、Predis（纯 PHP） |
| C/C++ | hiredis、redis-plus-plus |
| .NET | StackExchange.Redis、FreeRedis |

## 图形化与管理工具

- **RedisInsight**：官方 GUI，含慢查询分析与集群视图；
- **Another Redis Desktop Manager**：开源轻量桌面客户端；
- **Medis**：macOS 体验良好的桌面客户端。

## 运维与测试工具

- **redis-benchmark**：官方基准测试工具；
- **memtier_benchmark**：Redis Labs 开源的压测工具，支持更复杂的读写比例与数据模型；
- **redis-rdb-tools**：离线解析 RDB，统计内存与大键；
- **redis_exporter**：Prometheus 指标采集器；
- **YCSB / romper 等通用 KV 压测框架**：跨实现对比性能时使用。

## 选型小结

1. 先确认瓶颈类型：内存容量（考虑 Pika/Dragonfly）、多核吞吐（Valkey/Dragonfly/KeyDB）、许可（Valkey）或功能（模块/专业数据库）；
2. 兼容性用真实业务命令清单验证，而非只跑 `SET/GET`；
3. 代理类方案要评估运维复杂度与故障模式（代理本身是新的单点）。
