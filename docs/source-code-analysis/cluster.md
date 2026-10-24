# Redis Cluster Implementation

## Overview

Redis Cluster spreads 16384 hash slots across several master nodes, with each node responsible for only a slice of the keys, which is what breaks past the single-node memory and throughput ceiling. A cluster is not "a collection of independent Redis instances": nodes are interconnected over a dedicated bus where they exchange gossip and failure information, and clients are driven by redirections, forming a "smart client + server-side routing" combination. The bulk of the implementation lives in `src/cluster_legacy.c` (about 6500 lines in 8.0, covering the whole cluster protocol and failure detection) and `src/cluster.c` (the `CLUSTER` subcommands).

## Core concepts

- **Slots**: `CLUSTER_SLOTS = 16384` (`cluster.h`). A key's slot number = CRC16(the "valid part" of the key) & 16383, where the valid part is the bytes inside `{tag}` (the entire key if there are no braces).
- **Node ID**: each node generates a 40-hex-digit SHA1 ID at startup. It is independent of IP/port and is the stable identifier in the gossip protocol.
- **Cluster bus**: the TCP/UDP port at service port + 1000. A node line observed locally:
  ```text
  2cd48fc... 127.0.0.1:16400@26400 myself,master - 0 0 1 connected 0-5460
  ```
  That is, service port 16400 and bus port 26400 (6379 and 16379 respectively under the default configuration).
- **epoch**: `currentEpoch` (the global term number) and `configEpoch` (the slot configuration version) together guarantee eventual consistency on "who owns a slot".

## Enabling and initialization

Add `cluster-enabled yes` to the config file; after a restart, `nodes.conf` is generated (it holds node IDs and slot state; a parameter file such as `cluster.conf` is not reliable — `nodes.conf` is the durable state). Initialization happens in `clusterInit()` (around line 948 of `cluster_legacy.c`); afterwards `serverCron` calls `clusterCron()` (around line 4656) every round to send PING/PONG and check timeouts and slot coverage.

A minimal cluster built locally from six instances (3 masters, 3 replicas):

```bash
redis-cli --cluster create 127.0.0.1:16400 127.0.0.1:16401 127.0.0.1:16402 \
  127.0.0.1:16403 127.0.0.1:16404 127.0.0.1:16405 --cluster-replicas 1
# [OK] All nodes agree about slots configuration.
# [OK] All 16384 slots covered.
```

## Health and state observation

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

`cluster_stats_messages_*` are bus send/receive counters, so you can directly observe whether gossip is active. Each line of `cluster nodes` has the format `ID ip:port@bus [flags] [master] ping-time pong-time config-epoch connection-state [slot-ranges]`, and `myself` marks the current node.

## Routing: MOVED and ASK

When a node receives a request for a slot it does not own, it returns a redirection:

```text
SET bd:movedkey1 v (sent to a non-owner)  ->  MOVED 2998 127.0.0.1:16400
MGET across slots                         ->  CROSSSLOT Keys in request don't hash to the same slot
```

`redis-cli -c` automatically follows `MOVED` and re-sends the command. `ASK` appears during slot migration — see *Data sharding and replication*.

## Failure detection and failover

The decision chain (in `cluster_legacy.c`): `clusterCron` PINGs periodically -> no reply within `cluster-node-timeout` means the node is marked PFAIL (suspected failure) -> only when a majority of masters have also marked it PFAIL is it upgraded to FAIL and broadcast -> replicas start an election (`clusterHandleSlaveFailover()`, `clusterSendFailoverAuth()`), and the winner of a majority of votes takes over the slots. After killing one master locally, within 6 seconds:

```text
219aad1... 127.0.0.1:16402@26402 master,fail - ... 3 disconnected
4fcb36f... 127.0.0.1:16405@26405 master - ... 11 connected 10923-16383
```

The former replica took over all the slots and `cluster_state` stayed `ok` the whole time (`cluster-require-full-coverage yes` did not trigger a full block either, because the slots had a new owner). Manual failover uses `CLUSTER FAILOVER` (run on a replica; it returned `OK` and completed the role swap within 2 seconds in testing).

## Clients and operational tooling

- Smart clients cache the `CLUSTER SLOTS`/`CLUSTER SHARDS` topology, compute the slot locally, and connect directly to the owner; they only deal with MOVED/ASK when the topology changes;
- The `redis-cli --cluster` tool family wraps the common operations; in testing, `redis-cli --cluster check 127.0.0.1:16400` listed each node's slot distribution and key count and verified consistency;
- Key settings: `cluster-node-timeout` (default 15000ms; set to 3000 locally for testing), `cluster-require-full-coverage yes`, `cluster-allow-reads-when-down no`, and `cluster-migration-barrier` (the threshold of replicas the destination node must have while a slot is migrating).

## Summary

The skeleton of the cluster implementation is "slot table + gossip + epoch election": the data plane steers requests to the owner with CRC16 plus MOVED/ASK, while the control plane decides slot ownership and failover with bus broadcasts and majority voting. Understand every message type handled by `clusterProcessPacket()` (around line 2721) in `cluster_legacy.c`, and you understand all of the cluster's seemingly "mysterious" behavior.

## References

- [Redis source repository](https://github.com/redis/redis)
- [cluster.c](https://github.com/redis/redis/blob/unstable/src/cluster.c)
- [Redis Cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)

## Related pages

- [architecture](architecture.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [architecture](architecture.md)
