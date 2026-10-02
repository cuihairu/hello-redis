# Dragonfly

Dragonfly 是一个用 C++ 编写的内存数据存储，兼容 Redis 与 Memcached 的 API，采用"共享无（shared-nothing）多线程"架构，目标是单节点支撑更大的内存与更高的吞吐。

## 架构特点

- **共享无多线程**：每个线程独占一部分键空间与数据结构，不需要全局锁；相比 Redis 的单线程模型，能利用多核处理更多并发请求。
- **Dash 表**：使用针对多线程优化的哈希表替代传统的链地址哈希，支持渐进式扩容且无全局停顿。
- **高效复制**：采用基于版本的复制（VSF - Versioned Snapshot Log），从节点同步时不依赖积压缓冲区，断线重连代价低。
- **内存效率**：实现上有"内存紧凑 + 惰性回收"策略，官方数据表明同等数据量下内存占用低于 Redis。

## 快速上手

```bash
# Docker 方式（最常用）
docker run --network=host --ulimit memlock=-1 docker.dragonflydb.io/dragonflydb/dragonfly

# 客户端直接用 redis-cli 连接（默认端口 6379）
redis-cli
127.0.0.1:6379> SET greeting hello
127.0.0.1:6379> GET greeting
```

Dragonfly 直接使用 Redis 的协议，主流客户端库无需改动即可连接。

## 与 Redis 的兼容性

- **支持**：String、Hash、List、Set、Sorted Set、Bitmap、HyperLogLog、Stream、发布订阅、Lua 脚本（`EVAL`）、事务、`KEYS`/`SCAN` 等。
- **部分支持或不同**：集群模式（可通过官方推荐的代理或客户端分片实现）、部分管理命令与配置项命名不同、RDB/AOF 兼容但快照机制为自主实现（`--snapshot_cron`、`--save_schedule`）。
- **不追求完全一致**：Dragonfly 明确以"常用 API 兼容"为目标，迁移前应针对业务使用的命令做兼容性清单核对。

## 适用场景

- **单实例数据量超出 Redis 舒适区（几十 GB 以上）**：Dragonfly 单节点可支撑 TB 级内存。
- **高并发读写、需要利用多核**：无需把数据拆成多个 Redis 实例即可横向利用 CPU。
- **迁移评估要点**：Lua 脚本兼容性、持久化恢复流程、监控指标对接（其 Prometheus 指标与 Redis 不同）、以及许可证（Dragonfly 采用 BSL 1.1，转 Apache 2.0 的时间表见其仓库说明）。
