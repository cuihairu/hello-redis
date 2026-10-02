# 其他兼容Redis的开源项目

围绕 Redis 协议与 API，社区涌现了大量兼容实现、代理与工具。它们有的追求更高的多线程性能，有的追求更大的数据容量，有的则是协议层面的客户端实现。本部分介绍其中的典型项目：

- [Valkey](valkey.md)：Redis 7.2 分叉、Linux 基金会托管的高性能内存数据库。
- [KeyDB](keydb.md)：在 Redis 代码基础上增加多线程与主从复制改进的分支。
- [Dragonfly](dragonfly.md)：采用共享无（shared-nothing）架构的多线程 Redis/Memcached 兼容服务器。
- [SSDB](ssdb.md)：基于 LevelDB/RocksDB 的持久化键值服务，提供类 Redis 接口。
- [Pika](pika.md)：360 开源的基于 RocksDB 的大容量 Redis 兼容存储。
- [Ardb](ardb.md)：使用 RocksDB 作为后端的 Redis 兼容数据库。
- [Tile38](tile38.md)：专注地理空间查询、兼容 Redis 协议的空间数据库。
- [Predis](predis.md)：PHP 语言的 Redis 客户端库（协议兼容客户端）。
- [Medis](medis.md)：面向开发者的 Redis 桌面图形化客户端。
- [兼容项目总览](open-source-projects.md)：兼容实现、代理与工具的汇总对比。

## 选型要点

- **协议兼容性**：确认所需命令、Lua 脚本、事务、Streams 等特性是否被支持，先用现有客户端跑一遍冒烟测试。
- **运维生态**：哨兵、集群、持久化与备份工具是否齐备，是否有对应的监控指标。
- **许可与维护**：关注开源许可协议与社区活跃度，避免选到无人维护的项目。
- **收益是否明确**：只有在单实例内存容量、多核吞吐或成本成为明确瓶颈时，才值得引入替代实现。
