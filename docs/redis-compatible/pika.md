# Pika

Pika 是 360 数据平台团队开源的大容量、持久化 Redis 兼容存储，基于 RocksDB 引擎实现，目标是解决"Redis 数据量大、内存成本高"的问题，同时尽量保持 Redis 的接口与生态兼容。

## 主要特点

- **RocksDB 存储**：数据落盘，内存中只保留热数据索引，单实例可支撑 TB 级数据。
- **兼容 Redis 协议**：支持 String、Hash、List、Set、ZSet、BitMap、Stream 等数据类型的常用命令，主流客户端可直接连接。
- **主从复制 + 哨兵兼容**：支持全量/增量同步，可与 Redis 哨兵配合实现故障转移。
- **多线程**：网络 I/O 与命令执行的多线程模型，突破单线程 CPU 瓶颈。

## 快速上手

```bash
# 编译或下载发布包（提供 CentOS/Ubuntu 二进制包）
./pika -c conf/pika.conf      # 默认端口 9221

# 使用 redis-cli 连接
redis-cli -p 9221
127.0.0.1:9221> set hello world
OK
127.0.0.1:9221> get hello
"world"
127.0.0.1:9221> hset user:1 name alice age 20
(integer) 2
127.0.0.1:9221> hgetall user:1
1) "name"
2) "alice"
3) "age"
4) "20"
```

## 与 Redis 的关系

| 维度 | Redis | Pika |
| --- | --- | --- |
| 存储介质 | 内存（RDB/AOF 落盘） | RocksDB 落盘，内存做缓存 |
| 单实例容量 | 受内存限制（通常 < 100 GB） | TB 级 |
| 延迟 | 亚毫秒 | 通常高于 Redis（磁盘 I/O 参与） |
| 兼容性 | 完整 | 常用命令兼容，管理命令与部分特性不同 |

## 适用场景与注意点

- **替代"Redis 集群存冷数据"**：大量低频访问的数据（如历史订单、用户画像标签）从 Redis 迁到 Pika 可显著降成本。
- **读写比例高的业务**：写多且延迟敏感的场景需要实测，RocksDB 的写放大可能成为瓶颈。
- **命令兼容性**：Lua 脚本、发布订阅等支持有限或语义有差异，迁移前按命令清单核对；`pika` 版本迭代较快，注意查看其 wiki 的兼容性说明。
- **运维**：关注磁盘容量与 compaction、主从同步带宽、以及与 Redis 版本协议的对应关系。

项目地址：<https://github.com/OpenAtomFoundation/pika>
