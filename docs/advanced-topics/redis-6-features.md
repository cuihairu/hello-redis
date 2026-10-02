# Redis 6的新特性

Redis 6.0（2020 年 4 月发布）是一次大版本升级，核心变化集中在安全、协议与多线程三个方面。

## 1. ACL 访问控制列表

之前 Redis 只有一个全局密码（`requirepass`），无法区分用户权限。Redis 6 引入多用户模型：

```bash
ACL SETUSER alice on >strong_password ~app:* +get +set +del
ACL SETUSER readonly_user on >pass ~cache:* +@read -@write
ACL LIST                 # 查看所有用户
ACL WHOAMI               # 当前用户
AUTH alice strong_password
```

- `~app:*` 限定可访问的键模式；
- `+get +set` 或 `+@read -@write` 控制命令或命令类别；
- `ACL CAT`、`ACL GETUSER`、`ACL DELUSER` 用于管理；配置持久化在 `aclfile` 指定的文件或 redis.conf 中。

## 2. RESP3 协议

RESP3 是对 RESP2 的扩展，新增 Map、Set、Double、Boolean 等数据类型，并支持服务端主动推送（push 消息），为客户端缓存（Client-side Caching）提供失效通知。客户端可用 `HELLO 3` 切换到 RESP3，`HELLO` 不带参数则显示当前连接的协议版本与认证信息。

## 3. 客户端缓存

服务端可以跟踪客户端读取过的键，键被修改时主动推送失效消息，客户端据此淘汰本地缓存，减少网络往返：

```bash
CLIENT TRACKING on      # 开启（REDIRECT 模式可将通知转发给另一连接）
GET key1                # 客户端记录该键
# 其他连接修改 key1 后，本连接会收到 invalidate 消息
```

支持默认模式与广播（`BCAST`）模式，适合读多写少的场景。

## 4. 多线程 I/O

命令执行仍是单线程，但网络读写与协议解析可以交给多个 I/O 线程并行处理：

```plaintext
io-threads 4
io-threads-do-reads yes
```

官方测试表明在大吞吐场景下可以获得约一倍的性能提升。默认关闭，仅在 CPU 核数充裕、网络为瓶颈时开启。

## 5. 其他改进

- **`STRALGO LCS`**：计算最长公共子序列（Redis 7.0 中被移除，功能由 `LCS` 命令替代）。
- **`LFU` 淘汰策略改进、更精确的内存统计**：`MEMORY STATS` 输出更完善。
- **Redis Cluster 代理支持、TLS 支持**（6.0 默认可用）以及大量稳定性修复。
- **新版 `redis-cli` 的集群管理**：`redis-cli --cluster` 已完全取代 `redis-trib.rb`。

## 升级建议

- 使用 ACL 逐步替代裸 `requirepass`，为不同业务分配只读/读写账号；
- 评估 I/O 线程：小实例或 CPU 紧张的机器不需要开启；
- 客户端需要升级到支持 RESP3 与客户端缓存的版本才能使用对应特性，旧客户端以 RESP2 兼容模式工作。
