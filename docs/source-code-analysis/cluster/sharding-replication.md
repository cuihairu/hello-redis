# 数据分片与复制

## 概述

集群的数据面由两套机制叠加：**分片**（16384 个槽在主节点间的分布与迁移）和**复制**（分片内部的 master-replica 同步）。前者解决"数据放哪、怎么搬"，后者解决"数据怎么保多份"。本章用可复现的本地实验逐个验证。

## 槽与键的映射

键到槽的映射在 `keyHashSlot()`（`cluster.h` 中的内联函数）：对键做 CRC16 后 `& 0x3FFF`（即取模 16384）；若键含 `{...}`，只对大括号内的"哈希标签"计算，`{}` 为空或缺少配对 `}` 时退回整键哈希：

```bash
$ redis-cli -p 16400 cluster keyslot "bd:{user1000}.following"
3443
$ redis-cli -p 16400 cluster keyslot "bd:{user1000}.followers"   # 同标签 -> 同槽
3443
$ redis-cli -p 16400 cluster keyslot "bd:nobraces"               # 无标签算全键
981
```

哈希标签是唯一能把多个键固定到同一槽的手段，多键命令与 Lua 脚本都依赖它。跨槽的多键操作会被拒绝（实测）：

```text
MGET bd:{tag}a bd:nobraces   ->  CROSSSLOT Keys in request don't hash to the same slot
```

## MOVED：稳态路由

请求到达非属主节点时，返回 `MOVED <slot> <ip:port>`（实测 `SET bd:movedkey1 v` 发给错误节点得到 `MOVED 2998 127.0.0.1:16400`）。两类客户端策略：

- **普通客户端**：收到 MOVED 后重新请求（`redis-cli` 默认如此）；
- **智能客户端**：启动时 `CLUSTER SLOTS`/`CLUSTER SHARDS` 拉拓扑，本地算槽直连属主；只有拓扑变化后才走重定向。`redis-cli -c` 演示的是自动跟随：

```bash
$ redis-cli -c -p 16401 set bd:movedkey1 v
OK
$ redis-cli -c -p 16402 get bd:movedkey1
"v"
```

## ASK：迁移中的临时路由

槽迁移分三步：源节点 `CLUSTER SETSLOT <slot> MIGRATING <target-id>`，目标节点 `IMPORTING <source-id>`，然后逐键 `MIGRATE`。本地实测完整链路（槽 8338 从 16401 迁到 16400）：

```text
16401: MIGRATE 127.0.0.1 16400 "bd:{tag}a" 0 5000   ->  OK
16401: GET bd:{tag}a                                ->  ASK 8338 127.0.0.1:16400
16400: GET bd:{tag}c（未 ASKING，键不在本地）        ->  MOVED 8338 127.0.0.1:16401
16400: ASKING 后 GET bd:{tag}c                      ->  (nil)
16400: ASKING 后 GET bd:{tag}a                      ->  "v1"
```

语义差别：`MOVED` 表示"槽永久归别人，更新你的拓扑"；`ASK` 表示"只这一次去问目标节点，且必须先发 `ASKING`"。客户端带 `ASKING` 标志后，目标节点才允许临时服务这个 importing 槽。迁移完成后向全部节点下发 `CLUSTER SETSLOT <slot> NODE <target-id>`（实测副本上执行会报 `ERR Please use SETSLOT only with masters.`，必须发给主节点）。

生产环境不建议手工迁移，用官方工具：

```bash
$ redis-cli --cluster reshard 127.0.0.1:16400 \
    --cluster-from <source-id> --cluster-to <target-id> \
    --cluster-slots 1 --cluster-yes
# Ready to move 1 slots. ... Moving slot 0 from 127.0.0.1:16400 to 127.0.0.1:16401
```

工具内部就是上述 MIGRATING/IMPORTING/MIGRATE/SETSLOT 流程，外加每步的 gossip 广播与校验。

## 分片内的复制链路

集群副本与普通主从共用同一套复制协议（`replication.c`）：

1. 副本发 `PSYNC <replid> <offset>`；
2. master 无法续传时回 `FULLRESYNC <replid> <offset>`，BGSAVE 生成 RDB 传给副本，期间写命令进入复制缓冲；
3. 能续传时（`masterTryPartialResynchronization()`，约 816 行）只补发 backlog 增量。本地实测副本重启后的日志：

```text
MASTER <-> REPLICA sync started
Trying a partial resynchronization (request 5ecd2a0d...:109).
Successful partial resynchronization with master.
```

4. 稳态增量走复制积压缓冲（backlog，`repl-backlog-size` 默认 1MB，实测 1048576）。

观测主从状态（实测）：

```bash
$ redis-cli -p 16401 info replication
role:master
connected_slaves:1
slave0:ip=127.0.0.1,port=16404,state=online,offset=266,lag=0
master_replid:838ff8db...
repl_backlog_size:1048576
$ redis-cli -p 16390 set bd:repl v2
OK
$ redis-cli -p 16390 wait 1 2000
1
```

`WAIT n timeout` 阻塞等待 n 个副本确认（实测返回 1）；`min-replicas-to-write`/`min-replicas-max-lag` 在副本落后过多时拒绝写，实测副本下线后：

```text
SET bd:mr2 ...   ->  NOREPLICAS Not enough good replicas to write.
```

集群中的副本读需要 `READONLY`（普通主从不需要），这是集群特有的安全阀。

## 一致性与容量的边界

- **容量**：槽数固定 16384，扩容即迁移槽、缩容即迁出槽；单键不可拆分，热点键只能靠哈希标签拆分子键。
- **一致性**：异步复制，master 故障时可能丢最后若干毫秒写入；副本选举要求多数主节点在线；`cluster-require-full-coverage yes`（默认）时若有槽无人接管，全部读写返回 `-CLUSTERDOWN Hash slot not served`（见 `cluster.c`）。
- **多键操作**：所有键必须同槽；`MIGRATE` 期间的 ASK 窗口是唯一允许"槽归属暂时两可"的状态。

## 小结

分片与复制的衔接点是"槽的属主可以换人"：路由层用 MOVED/ASK 屏蔽迁移细节，复制层保证新属主有完整数据。把 `CLUSTER SETSLOT` 的四种状态（STABLE/NODE/MIGRATING/IMPORTING）与 `PSYNC` 的两种结果（FULLRESYNC/CONTINUE）当作两张状态图来读，集群的数据面就没有黑盒了。
