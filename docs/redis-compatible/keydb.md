# KeyDB

KeyDB 是基于 Redis 源码的分支（后由 Snap Inc. 维护），目标是"保持 Redis 兼容性的同时，用多线程提升单节点吞吐"。它兼容 Redis 的协议与大部分命令，可以直接替换现有部署。

## 主要特点

- **多线程**：通过网络线程池并行处理多个连接的 I/O，命令执行仍按 KeyDB 的机制保持一致性，`server-threads` 可配置线程数。
- **兼容 Redis**：使用相同的客户端协议与数据类型，redis-cli、主流客户端库均可直接使用。
- **Active Replication**：支持多主（multi-master）复制，多个节点可同时接受写入。
- **存储引擎可选**：支持 Flash Storage（把冷数据放到闪存，配合 SSD）降低内存成本。
- **子键过期等增强**：提供 `EXPIRE` 粒度更细的选项与部分扩展命令。

## 快速上手

```bash
# Debian/Ubuntu 官方源安装
sudo apt install keydb

# 或 Docker
docker run -d --name keydb -p 6379:6379 eqalpha/keydb

# 启动（命令行接口与 redis-server 兼容）
keydb-server /etc/keydb/keydb.conf --server-threads 4
```

使用 redis-cli 连接验证：

```bash
redis-cli
127.0.0.1:6379> SET k v
127.0.0.1:6379> GET k
```

## 与 Redis 的差异

| 方面 | KeyDB | Redis |
| --- | --- | --- |
| 网络处理 | 多线程（`server-threads`） | 单线程（可选 `io-threads`） |
| 多主复制 | 支持 Active Replication | 不支持（仅主从/集群） |
| 持久化 | 兼容 RDB/AOF，另支持 Flash Storage | RDB/AOF |
| 脚本与事务 | 兼容 | 兼容 |

## 适用场景与注意点

- **单实例 CPU 未打满、连接数大**：多线程 I/O 可以提高吞吐，减少分片数量。
- **需要多主写入**：Active Replication 适合多机房写入的场景，但要理解冲突解决语义（按版本与时间戳）。
- **兼容性验证先行**：KeyDB 的版本迭代与 Redis 主线不同步，新命令（如 Redis 7 的 Functions）支持情况需在所用版本上实测。
- **许可变化**：KeyDB 在 6.3.x 后转向 BSPL 许可（要求署名），商业使用前请阅读其 LICENSE。
