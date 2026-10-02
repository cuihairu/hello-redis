# SSDB

SSDB 是一个使用 C++ 开发的高性能 NoSQL 数据库，采用 LevelDB/RocksDB 作为底层存储引擎，把数据落在磁盘上，同时提供与 Redis 高度相似的命令接口。它适合"数据量远超内存、又想继续使用 Redis 式 API"的场景。

## 主要特点

- **磁盘存储**：数据持久保存在磁盘，内存只做缓存，容量不受内存限制，成本远低于纯内存方案。
- **类 Redis 接口**：支持 String、Hash、List、ZSet、Map 等类型，命令名与 Redis 基本一致。
- **主从复制**：内置主从同步，可做读写分离与容灾。
- **PHP/Java/Python 等多语言客户端**。

## 快速上手

```bash
# 编译安装
wget --no-check-certificate https://github.com/ideawu/ssdb/archive/master.zip
unzip master.zip && cd ssdb-master && make

# 启动（默认端口 8888）
./ssdb-server ssdb.conf

# 连接
./ssdb-cli -p 8888
ssdb 127.0.0.1:8888> set k v
ok
ssdb 127.0.0.1:8888> get k
v
```

## 与 Redis 命令对照

| 功能 | Redis | SSDB |
| --- | --- | --- |
| 字符串 | `SET` / `GET` | `set` / `get` |
| 哈希 | `HSET` / `HGET` | `hset` / `hget` |
| 列表 | `LPUSH` / `LRANGE` | `qpush` / `qrange`（队列命名） |
| 有序集合 | `ZADD` / `ZRANGE` | `zset` / `zrange` |
| 过期 | `EXPIRE` | `expire`（粒度和行为与 Redis 有差异） |

注意：SSDB 的列表命令前缀是 `q`（queue），如 `qpush`、`qpop`、`qrange`，与 Redis 的 `LPUSH`/`LRANGE` 不完全一致。

## 适用场景与注意点

- **海量 KV、历史数据存储**：如日志索引、爬虫数据、用户行为明细，容量可达 TB 级。
- **性能预期**：读性能接近内存缓存，写性能受磁盘限制；对延迟极其敏感的热数据仍建议放 Redis。
- **兼容性差异**：Lua 脚本、事务、Stream、发布订阅等 Redis 特性不支持或语义不同，不能当作"全功能 Redis 替代品"。
- **运维**：需要关注 RocksDB 的 compaction 与磁盘空间；主从切换需自行配合脚本或使用其 sentinel 类工具（ssdb 的主从为手动/脚本管理）。

项目地址：<https://github.com/ideawu/ssdb>
