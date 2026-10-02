# Ardb

Ardb 是一个使用 C++ 编写的 Redis 兼容 NoSQL 数据库，底层可选用 LevelDB、RocksDB 或 LMDB 作为持久化存储引擎。它以"Redis 语法 + 磁盘存储"为核心定位，适合数据量大于内存、又希望沿用 Redis 命令的场景。

## 主要特点

- **多引擎可选**：启动参数指定 `storage-engine`（rocksdb/leveldb/lmdb），按业务读写特征选择。
- **协议兼容**：实现了 Redis 协议，支持 String、Hash、List、Set、ZSet、BitMap、HyperLogLog 与 Lua 脚本等常用能力。
- **主从复制**：支持基于快照与增量日志的主从同步，可用 `SLAVEOF` 命令配置。
- **多线程**：网络与命令处理支持多线程配置（`worker-threads`）。

## 快速上手

```bash
# 编译（依赖 cmake、boost）
git clone https://github.com/yinqiwen/ardb.git
cd ardb && make

# 启动（默认监听 16379）
./src/ardbd

# 用 redis-cli 连接
redis-cli -p 16379
127.0.0.1:16379> set hello world
OK
127.0.0.1:16379> zadd rank 100 alice
(integer) 1
127.0.0.1:16379> zrevrange rank 0 -1 withscores
```

## 与 Redis 的差异

- **管理命令不同**：如 `INFO` 的输出格式、配置命令（`CONFIG`）与 Redis 不完全一致，监控工具需适配。
- **部分命令语义差异**：大键遍历、过期精度、持久化文件格式均与 Redis 不同，RDB/AOF 文件不能直接互换（Ardb 提供自身的备份方式）。
- **社区活跃度**：Ardb 更新频率低于 Redis，选型前应评估维护状态与自家业务需求的匹配度。

## 适用场景

- **冷数据、日志类 KV**：对延迟要求不极端、但数据量大的存储需求。
- **测试与开发环境**：以较低成本模拟 Redis 接口，配合磁盘容量跑大数据量集成测试。

项目地址：<https://github.com/yinqiwen/ardb>
