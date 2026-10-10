# Redis命令参考

以下按类别整理常用命令（以 Redis 7/8 为准），完整参数说明见[官方命令文档](https://redis.io/docs/latest/commands/)。命令行中用 `redis-cli` 实测是学习命令最直接的方式。

## 连接与服务器

| 命令 | 说明 |
| --- | --- |
| `AUTH [username] password` | 认证（ACL 用户名可选） |
| `PING [message]` | 连通性测试 |
| `SELECT index` | 切换数据库（0~15） |
| `INFO [section]` | 服务器状态信息 |
| `CONFIG GET/SET parameter [value]` | 查看/设置配置 |
| `DBSIZE` | 当前库键数量 |
| `FLUSHDB [ASYNC]` | 清空当前库（异步执行可选） |
| `KEYS pattern` | 模式匹配键（生产禁用，用 `SCAN`） |
| `SCAN cursor [MATCH p] [COUNT n]` | 渐进式遍历键 |
| `EXISTS key` / `TYPE key` / `TTL key` | 键是否存在/类型/剩余生存时间 |
| `EXPIRE key seconds` / `PERSIST key` | 设置过期/移除过期 |
| `RENAME key newkey` / `DEL key` | 重命名/删除 |
| `DUMP key` / `RESTORE key ttl payload` | 序列化导出/导入 |
| `OBJECT ENCODING key` | 查看键的底层编码 |

## 字符串（String）

| 命令 | 说明 |
| --- | --- |
| `SET key value [EX s\|PX ms] [NX\|XX]` | 设置键值，可带过期与条件 |
| `GET key` | 获取值 |
| `SETNX key value` | 仅键不存在时设置（2.6.12 起废弃，用 `SET ... NX`） |
| `GETSET key value` | 取旧值并设新值（6.2 起废弃，用 `SET key value GET`） |
| `MSET k1 v1 k2 v2` / `MGET k1 k2` | 批量设置/获取 |
| `INCR key` / `DECR key` | 原子自增/自减 |
| `INCRBY key n` / `INCRBYFLOAT key f` | 按步长/浮点自增 |
| `APPEND key value` | 追加 |
| `STRLEN key` | 长度 |
| `GETRANGE key s e` / `SETRANGE key offset v` | 子串读写 |
| `SETBIT key offset v` / `GETBIT key offset` | 位操作 |
| `BITCOUNT key [BYTE\|BIT]` | 置位计数 |
| `BITOP AND\|OR\|XOR\|NOT dest key...` | 位运算 |
| `GETEX key [EX s]` | 取值并设置/查询过期 |

## 哈希（Hash）

| 命令 | 说明 |
| --- | --- |
| `HSET key field value [field value ...]` | 设置一个或多个字段 |
| `HGET key field` / `HMGET key f1 f2` | 获取字段 |
| `HGETALL key` | 所有字段值（大哈希慎用） |
| `HDEL key field [field ...]` | 删除字段 |
| `HINCRBY key field n` | 字段原子自增 |
| `HLEN key` / `HEXISTS key field` | 字段数/是否存在 |
| `HKEYS key` / `HVALS key` | 所有字段/所有值 |
| `HSCAN cursor [MATCH p] [COUNT n]` | 渐进遍历哈希 |

## 列表（List）

| 命令 | 说明 |
| --- | --- |
| `LPUSH key v1 v2` / `RPUSH key v1 v2` | 左/右推入 |
| `LPOP key` / `RPOP key` | 左/右弹出 |
| `LLEN key` | 长度 |
| `LRANGE key start stop` | 范围读取 |
| `LINDEX key index` / `LSET key i v` | 按下标读/写 |
| `BLPOP key timeout` / `BRPOP key timeout` | 阻塞弹出（队列消费） |
| `LREM key count value` | 删除指定元素 |
| `LTRIM key start stop` | 裁剪保留区间（限长队列） |

## 集合（Set）与有序集合（Sorted Set）

| 命令 | 说明 |
| --- | --- |
| `SADD key m1 m2` / `SREM key m1` | 增删成员 |
| `SMEMBERS key` / `SISMEMBER key m` | 全部成员/判断存在 |
| `SCARD key` | 成员数 |
| `SINTER k1 k2` / `SUNION k1 k2` / `SDIFF k1 k2` | 交/并/差集 |
| `SINTERCARD n k1 k2 [LIMIT n]` | 交集基数（7.0+） |
| `SRANDMEMBER key [count]` | 随机取（不删除） |
| `SPOP key [count]` | 随机取并删除 |
| `SSCAN key cursor` | 渐进遍历 |
| `ZADD key score m [score m ...]` | 添加/更新成员分数 |
| `ZINCRBY key n member` | 分数自增 |
| `ZSCORE key m` / `ZREVRANK key m` | 分数/倒序名次 |
| `ZRANGE key s e [WITHSCORES] [REV]` | 按排名取（升/降序；6.2 起 `ZREVRANGE` 已废弃，用 `REV` 选项） |
| `ZRANGE key max min BYSCORE REV` | 按分数区间取（降序；6.2 起 `ZREVRANGEBYSCORE` 已废弃） |
| `ZCOUNT key min max` | 分数区间计数 |
| `ZREM key m` / `ZCARD key` | 删除/成员数 |
| `ZINTERSTORE/ZUNIONSTORE dest n k1 k2` | 集合运算并存储 |

## 通用、脚本与事务

| 命令 | 说明 |
| --- | --- |
| `MULTI ... EXEC / DISCARD` | 事务（命令排队后原子执行） |
| `WATCH key ...` | 事务前监控键（乐观锁） |
| `EVAL script numkeys key... arg...` | 执行 Lua 脚本 |
| `EVALSHA sha numkeys ...` | 按 SHA 执行脚本 |
| `SCRIPT LOAD/EXISTS/FLUSH` | 脚本缓存管理 |
| `FUNCTION LOAD/FCALL/FUNCTION LIST` | 服务端函数（7.0+） |
| `PUBLISH channel message` / `SUBSCRIBE ch...` | 发布订阅 |
| `UNLINK key` | 异步删除（推荐删除大键） |

## 地理空间与基数估计

| 命令 | 说明 |
| --- | --- |
| `GEOADD key lon lat m [lon lat m ...]` | 添加坐标 |
| `GEOSEARCH key FROMLONLAT lon lat BYRADIUS r unit` | 附近查询 |
| `GEODIST key m1 m2 [unit]` | 两点距离 |
| `GEOPOS key m` | 成员坐标 |
| `PFADD key m1 m2` / `PFCOUNT key` | HyperLogLog 添加/基数估算 |
| `PFMERGE dest k1 k2` | 合并 HyperLogLog |

## 流（Stream）

| 命令 | 说明 |
| --- | --- |
| `XADD key * field value ... [MAXLEN n]` | 追加消息 |
| `XRANGE key start end` | 按 ID 区间读取 |
| `XREAD [COUNT n] [BLOCK ms] STREAMS key id` | 读取消息 |
| `XGROUP CREATE key group id` | 创建消费组 |
| `XREADGROUP GROUP g c COUNT n STREAMS key >` | 组内消费 |
| `XACK key group id` | 确认消息 |
| `XPENDING key group` | 查看待确认消息 |
| `XLEN key` / `XTRIM key MAXLEN n` | 长度/裁剪 |

## 集群与运维

| 命令 | 说明 |
| --- | --- |
| `CLUSTER INFO` / `CLUSTER NODES` | 集群状态/节点 |
| `CLUSTER SLOTS` | 槽位分布（7.0 起废弃，新客户端用 `CLUSTER SHARDS`） |
| `SLOWLOG GET n` | 慢查询 |
| `LATENCY LATEST/HISTORY event` | 延迟监控 |
| `MEMORY USAGE key` | 键内存估算 |
| `MONITOR` | 实时命令流（调试用） |

配合速查的实践技巧：在 `redis-cli` 中输入 `COMMAND INFO <命令>` 可查看参数个数与文档，`COMMAND DOCS <命令>` 输出完整文档（7.0+）。
