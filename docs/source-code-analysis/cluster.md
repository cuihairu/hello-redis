# Redis集群实现

## 概述

Redis 集群把 16384 个哈希槽（slot）分布到若干主节点上，每个节点只负责一部分键，从而突破单机内存与吞吐上限。集群不是"多个独立 Redis 的集合"：节点间用一条专用总线互连，交换 gossip 与故障信息；客户端被重定向驱动，形成"智能客户端 + 服务器路由"的组合。实现主体是 `src/cluster_legacy.c`（8.0 中约 6500 行，含全部集群协议与故障判定）与 `src/cluster.c`（`CLUSTER` 子命令）。

## 核心概念

- **槽**：`CLUSTER_SLOTS = 16384`（`cluster.h`）。键归属槽号 = CRC16(键中"有效部分") & 16383，有效部分是 `{tag}` 内的字节（无大括号则为整个键）。
- **节点 ID**：每个节点启动时生成 40 位十六进制 SHA1 ID，独立于 IP/端口，是 gossip 协议中的稳定标识。
- **集群总线**：服务端口 + 1000 的 TCP/UDP 端口。本地实测节点行：
  ```text
  2cd48fc... 127.0.0.1:16400@26400 myself,master - 0 0 1 connected 0-5460
  ```
  即服务端口 16400、总线端口 26400（默认配置下对应 6379 与 16379）。
- **epoch**：`currentEpoch`（全局任期号）与 `configEpoch`（槽配置版本），共同保证"谁拥有槽"的最终一致。

## 启用与初始化

配置文件加 `cluster-enabled yes`，重启后生成 `nodes.conf`（保存节点 ID 与槽状态；`cluster.conf` 之类的参数文件不可靠，`nodes.conf` 才是持久状态）。初始化流程在 `clusterInit()`（`cluster_legacy.c` 约 948 行），随后 `serverCron` 每轮调用 `clusterCron()`（约 4656 行）发送 PING/PONG、检查超时与槽覆盖。

本地用六个实例搭出一个最小集群（3 主 3 从）：

```bash
redis-cli --cluster create 127.0.0.1:16400 127.0.0.1:16401 127.0.0.1:16402 \
  127.0.0.1:16403 127.0.0.1:16404 127.0.0.1:16405 --cluster-replicas 1
# [OK] All nodes agree about slots configuration.
# [OK] All 16384 slots covered.
```

## 健康与状态观察

```bash
$ redis-cli -p 16400 cluster info
cluster_state:ok
cluster_slots_assigned:16384
cluster_slots_ok:16384
cluster_known_nodes:6
cluster_size:3
cluster_current_epoch:6
cluster_stats_messages_ping_sent:12
cluster_stats_messages_pong_sent:14
cluster_stats_messages_received:26
```

`cluster_stats_messages_*` 是总线收发计数，可直接观测 gossip 是否活跃。`cluster nodes` 每行格式为 `ID ip:port@bus [flags] [master] ping时间 pong时间 配置纪元 连接状态 [槽范围]`，`myself` 标识当前节点。

## 路由：MOVED 与 ASK

节点收到不属于自己的槽的请求时返回重定向：

```text
SET bd:movedkey1 v（发往非属主）  ->  MOVED 2998 127.0.0.1:16400
MGET 跨槽                          ->  CROSSSLOT Keys in request don't hash to the same slot
```

`redis-cli -c` 会自动跟随 `MOVED` 并把命令重发。`ASK` 出现在槽迁移过程中，见《数据分片与复制》。

## 故障检测与主从切换

判定链路（`cluster_legacy.c`）：`clusterCron` 周期 PING -> 超过 `cluster-node-timeout` 记为 PFAIL（疑似失败）-> 多数主节点也记为 PFAIL 才升级为 FAIL 并广播 -> 副本发起选举（`clusterHandleSlaveFailover()`、`clusterSendFailoverAuth()`），获得多数派投票后接管槽。本地实测杀掉一个主节点后 6 秒内：

```text
219aad1... 127.0.0.1:16402@26402 master,fail - ... 3 disconnected
4fcb36f... 127.0.0.1:16405@26405 master - ... 11 connected 10923-16383
```

原副本接管了全部槽，`cluster_state` 始终为 `ok`（`cluster-require-full-coverage yes` 也因槽有人接管而未触发全阻塞）。手动切换用 `CLUSTER FAILOVER`（在副本上执行，实测返回 `OK` 并在 2 秒内完成角色对调）。

## 客户端与运维工具

- 智能客户端缓存 `CLUSTER SLOTS`/`CLUSTER SHARDS` 拓扑，本地算槽、直接连属主，只在拓扑变化时处理 MOVED/ASK；
- `redis-cli --cluster` 系列工具封装了常见操作，实测 `redis-cli --cluster check 127.0.0.1:16400` 会列出每个节点的槽分布与键数并校验一致性；
- 关键配置：`cluster-node-timeout`（默认 15000ms，本地为了测试用 3000）、`cluster-require-full-coverage yes`、`cluster-allow-reads-when-down no`、`cluster-migration-barrier`（槽迁移时目标节点必须有的副本数门槛）。

## 小结

集群实现的骨架是"槽表 + gossip + epoch 选举"：数据面靠 CRC16 + MOVED/ASK 把请求导向属主，控制面靠总线广播与多数派投票决定槽归属与故障切换。理解 `cluster_legacy.c` 中 `clusterProcessPacket()`（约 2721 行）处理的每一种消息类型，就理解了集群所有看似"神秘"的行为。
