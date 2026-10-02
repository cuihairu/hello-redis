# Redis 7的展望

Redis 7.0（2022 年 4 月发布）及其后续小版本，把早期"展望"中的多项能力变成了现实。本篇以实际发布的 Redis 7 特性为主线，帮助读者了解从 6.x 升级时的变化。

## 1. Functions：可持久化的函数库

Lua 脚本（`EVAL`）有个长期痛点：脚本由客户端携带，服务端重启后需要重新加载。Functions 把函数注册到服务端并随 RDB/AOF 持久化：

```bash
FUNCTION LOAD "#!lua name=mylib\nredis.register_function('pingk', function(keys, args) return redis.call('GET', keys[1]) end)"
FCALL pingk 1 mykey
FUNCTION LIST
```

Functions 支持库粒度的管理（`FUNCTION DELETE`、`FUNCTION DUMP`/`RESTORE`），更适合作为服务端 API 的长期组成部分。

## 2. Multi-Part AOF

之前的 AOF 由"基础数据 + 增量命令"混在同一个文件中，重写期间需要维护临时清单。Redis 7 把 AOF 拆成多个部分：

- `appenddirname` 指定的目录存放 base RDB/AOF 文件与增量 AOF 文件；
- 一个 manifest（清单）文件记录各部分的版本与顺序；
- 重写不再阻塞旧文件的写入，也不再需要 `aof-use-rdb-preamble` 相关的折中。

## 3. Sharded Pub/Sub（分片发布订阅）

集群模式下，普通 Pub/Sub 的消息会广播到所有节点，造成不必要的带宽浪费。新的分片命令把消息限制在键所在分片内：

```bash
SSUBSCRIBE channel          # 订阅（分片内）
SPUBLISH channel message    # 发布（分片内）
SUNSUBSCRIBE channel
```

按槽路由，与集群的 `MOVED`/`ASK` 语义一致。

## 4. listpack 全面替代 ziplist

Hash、Sorted Set 等类型的紧凑编码统一改用 listpack，消除 ziplist 的连锁更新问题；`list-max-listpack-size`、`hash-max-listpack-entries` 等成为新的配置名（旧名保留为别名）。

## 5. 其他重要变化

- **`LCS` 命令**：计算字符串最长公共子序列，替代 6.x 的 `STRALGO LCS`。
- **`SINTERCARD`**：只返回交集基数不返回成员，可设 LIMIT（7.0 新增）。
- **ACL v2**：支持 selectors（选择器）实现更细的命令权限组合。
- **`XAUTOCLAIM` 改进、`COMMAND DOCS`**、更完善的命令元数据文档化。
- **实验性 `CLIENT NO-EVICT`**：把关键连接标记为不可被内存淘汰断开。

## 升级注意事项

- AOF 文件格式变化：升级前先执行 `BGREWRITEAOF`，并在新版本上完成一次全量加载测试；
- 使用了 `STRALGO` 的代码需迁移到 `LCS`；
- 客户端与代理需确认对 Sharded Pub/Sub、Functions 命令的支持情况；
- 配置文件中旧配置名（`*-max-ziplist-*`）仍可用，但建议改为 listpack 命名。

总体来看，Redis 7 的方向是"把开发者的常见痛点产品化"：脚本持久化、AOF 简化、集群内消息按需传播，以及更安全的内存结构。后续版本（8.x）则在查询能力（向量检索）、多线程 I/O 默认化等方向继续演进。
