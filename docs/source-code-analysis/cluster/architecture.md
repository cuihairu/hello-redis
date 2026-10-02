# 集群架构

## 概述

集群架构可以用一句话概括：**若干"主-从"分片（shard）组成全互联网络，每个分片独占一段槽；节点之间不依赖中心协调器，靠 gossip 达成一致**。本章拆解节点角色、总线协议、状态数据结构与故障切换机制。

## 分片与节点角色

- 一个分片 = 1 个 master + 0..n 个 replica，master 独占槽，replica 承担读与故障接管。
- 每个节点有唯一的 160 位 ID（`cluster.h` 的 `CLUSTER_NAMELEN 40`），运行时角色由 flags 决定（`master`/`slave`/`myself`/`fail` 等），可随时通过 `CLUSTER FAILOVER`/`CLUSTER REPLICATE` 变化。
- 副本只负责自己 master 所属槽的读：在副本上执行 `READONLY` 之前请求会被 MOVED 送回主节点（实测 `GET bd:{aa}key` 返回 `MOVED 1180 127.0.0.1:16400`），`READONLY` 之后同连接可读到 `r1`；写始终 `MOVED`（实测）。

本地六节点集群的角色视图（`CLUSTER NODES` 节选）：

```text
2cd48fc... 127.0.0.1:16400@26400 myself,master - 0 0 10 connected 1-5460 8338
cca7fcf... 127.0.0.1:16403@26403 slave 2cd48fc... 0 0 10 connected
a124ed8... 127.0.0.1:16401@26401 master - 0 8 connected 0 5461-8337 8339-10922
```

注意 `16400@26400`：`@` 后是总线端口（服务端口 + 10000，即 `cluster_legacy.h` 的 `CLUSTER_PORT_INCR`），全集群必须一致，否则握手失败。

## 全互联总线：gossip 协议

集群没有注册中心。每对节点建立 `clusterLink`（总线连接），周期性互发 gossip：

- **PING/PONG**：`clusterCron()` 每个 tick 挑选若干随机节点发 PING，内嵌"我认识的节点"摘要（`clusterMsgDataGossip`），对端据此学习新节点、刷新最后活跃时间；
- **MEET**：加入集群的第一条消息，把新节点广播给全网；
- **FAIL**：多数主节点把某节点判为 PFAIL 后广播 FAIL，全网同步标记；
- **FAILOVER_AUTH/FAILOVER_AUTH_ACK**：副本选举的投票消息；
- **UPDATE/MODULE/PUBLISHSHARD**：槽配置校正、模块自定义消息、分片内 pub/sub 扩散。

完整消息类型见 `cluster_legacy.h`（8.0 中 `CLUSTERMSG_TYPE_PING` 到 `PUBLISHSHARD` 共 11 种）。`clusterProcessPacket()`（`cluster_legacy.c` 约 2721 行）是总线消息的统一入口，`clusterSendPing()`（约 3611 行）负责组包。总线消息计数可在 `CLUSTER INFO` 观察：

```text
cluster_stats_messages_ping_sent:12
cluster_stats_messages_pong_sent:14
cluster_stats_messages_meet_received:5
cluster_stats_messages_received:26
```

## 状态数据结构

- `clusterNode`：每个已知节点一份——ID、地址、flags、最后 ping/pong 时间、`configEpoch`、槽位图（16384 位）、链接列表；
- `clusterState`：本节点视角的全局状态——`currentEpoch`、`known_nodes`、16384 个槽的属主指针、迁移中的槽状态（importing/migrating）；
- `nodes.conf`：把 `clusterNode` 关系（ID、槽、副本关系）落盘，重启后恢复，无需重新 `CLUSTER MEET`。

槽位图用位图而非数组，16384 槽只占 2KB，`CLUSTER COUNTKEYSINSLOT`/`GETKEYSINSLOT` 直接遍历该槽键空间。

## 故障检测：PFAIL -> FAIL -> 选举

1. `cluster-node-timeout` 内未收到 PONG -> 本地标记 **PFAIL**（`markNodeAsFailingIfNeeded()`，约 1883 行）；
2. gossip 把 PFAIL 传播出去；若**多数主节点**（超过半数已知主节点）都把它标为 PFAIL，则升级 **FAIL** 并 `clusterSendFail()` 广播；
3. 该分片副本检测到 master FAIL，发起选举：`clusterRequestFailoverAuth()`，主节点回 `clusterSendFailoverAuth()`；
4. 获得多数派投票的副本提升为 master（`clusterHandleSlaveFailover()`、`clusterFailoverReplaceYourMaster()`），配置纪元 +1；
5. `resetManualFailover()` 清理手工切换状态。

实测一次真实崩溃：杀掉槽 `10923-16383` 的 master 后 6 秒内，其副本在 `CLUSTER NODES` 中变为 `master` 并接管全部槽，原 master 标记 `master,fail ... disconnected`，`cluster_state` 全程 `ok`：

```bash
$ redis-cli -p 16400 cluster info | grep cluster_state
cluster_state:ok
$ redis-cli -p 16400 cluster nodes | grep fail
219aad1... 127.0.0.1:16402@26402 master,fail - ... disconnected
```

手工切换（`CLUSTER FAILOVER`）不走崩溃判定，直接与 master 协调完成偏移同步后对调，返回 `OK`，实测 2 秒内完成。

## 配置与容错边界

| 配置 | 默认 | 作用 |
|------|------|------|
| `cluster-node-timeout` | 15000 | 判定 PFAIL 的超时（本地测试用 3000） |
| `cluster-require-full-coverage` | yes | 任一槽无人覆盖则整个集群拒答 |
| `cluster-allow-reads-when-down` | no | 槽 down 时是否仍允许读 |
| `cluster-migration-barrier` | 1 | 槽迁走后目标节点至少保留的副本数 |
| `cluster-replica-validity-factor` | 10 | 判定副本数据过期的松弛系数（为 0 则总能被选） |
| `cluster-config-file` | nodes.conf | 节点 ID 与槽状态的持久化文件（不可在线修改） |

## 小结

集群架构的精髓是"无中心 + 多数派"：数据面用槽位图做 O(1) 路由，控制面用 epoch 与投票避免脑裂。读 `cluster_legacy.c` 时建议按"消息类型 -> 状态机 -> epoch 变更点"三条线索展开，任何一次故障切换都能在这条线索上找到对应代码。
