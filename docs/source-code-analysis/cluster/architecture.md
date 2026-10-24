# Cluster Architecture

## Overview

The cluster architecture can be summarized in one sentence: **several "master-replica" shards form a fully interconnected network, each shard owning its own range of slots; nodes do not rely on a central coordinator but reach consensus through gossip**. This chapter breaks down node roles, the bus protocol, the state data structures, and the failover mechanism.

## Shards and node roles

- One shard = 1 master + 0..n replicas. The master exclusively owns the slots, and replicas serve reads and take over on failure.
- Every node has a unique 160-bit ID (`CLUSTER_NAMELEN 40` in `cluster.h`), and its runtime role is decided by flags (`master`/`slave`/`myself`/`fail`, etc.), which can change at any time via `CLUSTER FAILOVER`/`CLUSTER REPLICATE`.
- A replica only serves reads for the slots its master owns: before `READONLY` is issued on the replica, requests are MOVED back to the master (in testing, `GET bd:{aa}key` returned `MOVED 1180 127.0.0.1:16400`); after `READONLY`, the same connection can read `r1`. Writes always get `MOVED` (in testing).

The role view of the local six-node cluster (excerpt from `CLUSTER NODES`):

```text
2cd48fc... 127.0.0.1:16400@26400 myself,master - 0 0 10 connected 1-5460 8338
cca7fcf... 127.0.0.1:16403@26403 slave 2cd48fc... 0 0 10 connected
a124ed8... 127.0.0.1:16401@26401 master - 0 8 connected 0 5461-8337 8339-10922
```

Note `16400@26400`: the part after `@` is the bus port (service port + 10000, i.e. `CLUSTER_PORT_INCR` in `cluster_legacy.h`). It must be consistent across the whole cluster, otherwise the handshake fails.

## The fully interconnected bus: the gossip protocol

The cluster has no registry. Every pair of nodes establishes a `clusterLink` (bus connection) and periodically exchanges gossip:

- **PING/PONG**: `clusterCron()` picks a few random nodes each tick and sends PING, embedding a summary of "the nodes I know" (`clusterMsgDataGossip`); the peer uses it to learn new nodes and refresh their last-active time;
- **MEET**: the first message when joining a cluster; it broadcasts the new node to the whole network;
- **FAIL**: once a majority of masters have marked a node PFAIL, FAIL is broadcast and the whole network marks it in sync;
- **FAILOVER_AUTH/FAILOVER_AUTH_ACK**: the voting messages for a replica election;
- **UPDATE/MODULE/PUBLISHSHARD**: slot configuration correction, module-defined messages, and pub/sub fan-out within a shard.

The full set of message types is in `cluster_legacy.h` (in 8.0, from `CLUSTERMSG_TYPE_PING` to `PUBLISHSHARD` there are 11 kinds). `clusterProcessPacket()` (around line 2721 of `cluster_legacy.c`) is the single entry point for bus messages, and `clusterSendPing()` (around line 3611) does the packing. Bus message counters can be observed in `CLUSTER INFO`:

```text
cluster_stats_messages_ping_sent:12
cluster_stats_messages_pong_sent:14
cluster_stats_messages_meet_received:5
cluster_stats_messages_received:26
```

## State data structures

- `clusterNode`: one per known node — ID, address, flags, last ping/pong time, `configEpoch`, slot bitmap (16384 bits), and link list;
- `clusterState`: the global state from this node's perspective — `currentEpoch`, `known_nodes`, the owner pointers for all 16384 slots, and the in-flight slot state (importing/migrating);
- `nodes.conf`: persists the `clusterNode` relationships (IDs, slots, replica links) to disk, so state is restored after a restart without re-running `CLUSTER MEET`.

Slot ownership uses a bitmap rather than an array, so 16384 slots take only 2KB, and `CLUSTER COUNTKEYSINSLOT`/`GETKEYSINSLOT` iterate that slot's key space directly.

## Failure detection: PFAIL -> FAIL -> election

1. No PONG received within `cluster-node-timeout` -> mark the node **PFAIL** locally (`markNodeAsFailingIfNeeded()`, around line 1883);
2. Gossip spreads the PFAIL. If a **majority of masters** (more than half of the known masters) have marked it PFAIL, it is upgraded to **FAIL** and broadcast with `clusterSendFail()`;
3. A replica of that shard detects the master FAIL and starts an election: `clusterRequestFailoverAuth()`, with the masters replying via `clusterSendFailoverAuth()`;
4. The replica that wins a majority of votes is promoted to master (`clusterHandleSlaveFailover()`, `clusterFailoverReplaceYourMaster()`), and the configuration epoch is incremented by 1;
5. `resetManualFailover()` clears the manual-failover state.

A real crash, observed: after killing the master of slots `10923-16383`, within 6 seconds its replica appeared as `master` in `CLUSTER NODES` and took over all the slots, the former master was marked `master,fail ... disconnected`, and `cluster_state` stayed `ok` throughout:

```bash
$ redis-cli -p 16400 cluster info | grep cluster_state
cluster_state:ok
$ redis-cli -p 16400 cluster nodes | grep fail
219aad1... 127.0.0.1:16402@26402 master,fail - ... disconnected
```

Manual failover (`CLUSTER FAILOVER`) does not go through crash detection: it coordinates directly with the master to finish offset synchronization and then swaps roles, returning `OK`. In testing it completed within 2 seconds.

## Configuration and fault-tolerance boundaries

| Setting | Default | Effect |
|------|------|------|
| `cluster-node-timeout` | 15000 | Timeout for declaring PFAIL (3000 used for local testing) |
| `cluster-require-full-coverage` | yes | If any slot has no owner, the whole cluster refuses to serve |
| `cluster-allow-reads-when-down` | no | Whether reads are still allowed when a slot is down |
| `cluster-migration-barrier` | 1 | Minimum number of replicas the destination node must keep after the slot moves away |
| `cluster-replica-validity-factor` | 10 | Slack factor for judging whether a replica's data is stale (if 0, it can always be elected) |
| `cluster-config-file` | nodes.conf | Persistence file for node IDs and slot state (cannot be changed online) |

## Summary

The essence of the cluster architecture is "no center + majority": the data plane routes in O(1) off the slot bitmap, and the control plane uses epochs and voting to avoid split brain. When reading `cluster_legacy.c`, I would follow three threads — "message types -> state machine -> epoch changes" — and any given failover can be traced to the corresponding code along that thread.

## References

- [Redis source repository](https://github.com/redis/redis)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
