# Data Sharding and Replication

## Overview

The cluster's data plane is the superposition of two mechanisms: **sharding** (the distribution and migration of 16384 slots among master nodes) and **replication** (master-replica synchronization inside a shard). The former answers "where does the data live, and how do you move it"; the latter answers "how do you keep the data in multiple copies". This chapter verifies each one with reproducible local experiments.

## Slots and the key mapping

The key-to-slot mapping is in `keyHashSlot()` (an inline function in `cluster.h`): CRC16 the key, then `& 0x3FFF` (i.e. modulo 16384). If the key contains `{...}`, only the "hash tag" inside the braces is hashed; an empty `{}` or an unmatched `}` falls back to hashing the whole key:

```bash
$ redis-cli -p 16400 cluster keyslot "bd:{user1000}.following"
3443
$ redis-cli -p 16400 cluster keyslot "bd:{user1000}.followers"   # same tag -> same slot
3443
$ redis-cli -p 16400 cluster keyslot "bd:nobraces"               # no tag, hash the whole key
981
```

The hash tag is the only way to pin several keys to the same slot, and both multi-key commands and Lua scripts depend on it. Multi-key operations spanning slots are rejected (in testing):

```text
MGET bd:{tag}a bd:nobraces   ->  CROSSSLOT Keys in request don't hash to the same slot
```

## MOVED: steady-state routing

When a request reaches a node that does not own the slot, it returns `MOVED <slot> <ip:port>` (in testing, `SET bd:movedkey1 v` sent to the wrong node returned `MOVED 2998 127.0.0.1:16400`). Two client strategies:

- **Plain clients**: re-issue the request after receiving MOVED (`redis-cli` does this by default);
- **Smart clients**: pull the topology with `CLUSTER SLOTS`/`CLUSTER SHARDS` at startup, compute the slot locally and connect directly to the owner; redirection only happens after the topology changes. What `redis-cli -c` demonstrates is automatic following:

```bash
$ redis-cli -c -p 16401 set bd:movedkey1 v
OK
$ redis-cli -c -p 16402 get bd:movedkey1
"v"
```

## ASK: temporary routing during migration

Slot migration has three steps: the source node issues `CLUSTER SETSLOT <slot> MIGRATING <target-id>`, the destination node issues `IMPORTING <source-id>`, and then keys are moved one by one with `MIGRATE`. The full chain, observed locally (slot 8338 moving from 16401 to 16400):

```text
16401: MIGRATE 127.0.0.1 16400 "bd:{tag}a" 0 5000   ->  OK
16401: GET bd:{tag}a                                ->  ASK 8338 127.0.0.1:16400
16400: GET bd:{tag}c (no ASKING, key not local)     ->  MOVED 8338 127.0.0.1:16401
16400: after ASKING, GET bd:{tag}c                  ->  (nil)
16400: after ASKING, GET bd:{tag}a                  ->  "v1"
```

The semantic difference: `MOVED` means "this slot belongs to someone else permanently — update your topology", while `ASK` means "go ask the target node for this one request, and you must send `ASKING` first". Only after the client sets the `ASKING` flag will the destination node temporarily serve that importing slot. After migration completes, `CLUSTER SETSLOT <slot> NODE <target-id>` is sent to every node (in testing, running it on a replica reports `ERR Please use SETSLOT only with masters.` — it must go to a master).

Manual migration is not recommended in production; use the official tooling:

```bash
$ redis-cli --cluster reshard 127.0.0.1:16400 \
    --cluster-from <source-id> --cluster-to <target-id> \
    --cluster-slots 1 --cluster-yes
# Ready to move 1 slots. ... Moving slot 0 from 127.0.0.1:16400 to 127.0.0.1:16401
```

Internally the tool is exactly the MIGRATING/IMPORTING/MIGRATE/SETSLOT sequence above, plus a gossip broadcast and a verification at each step.

## The replication chain inside a shard

Cluster replicas share the same replication protocol as ordinary master-replica pairs (`replication.c`):

1. The replica sends `PSYNC <replid> <offset>`;
2. When the master cannot resume, it replies `FULLRESYNC <replid> <offset>`, runs BGSAVE to produce an RDB and sends it to the replica, with write commands going into the replication buffer in the meantime;
3. When it can resume (`masterTryPartialResynchronization()`, around line 816), only the backlog delta is resent. The log after a replica restart, observed locally:

```text
MASTER <-> REPLICA sync started
Trying a partial resynchronization (request 5ecd2a0d...:109).
Successful partial resynchronization with master.
```

4. Steady-state increments flow through the replication backlog buffer (`repl-backlog-size` defaults to 1MB; 1048576 observed).

Observing master/replica state (in testing):

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

`WAIT n timeout` blocks until n replicas acknowledge (returned 1 in testing). `min-replicas-to-write`/`min-replicas-max-lag` refuse writes when replicas lag too far; after a replica went offline in testing:

```text
SET bd:mr2 ...   ->  NOREPLICAS Not enough good replicas to write.
```

Reading from a replica in a cluster requires `READONLY` (ordinary master-replica does not) — this is a safety valve specific to clusters.

## The boundaries of consistency and capacity

- **Capacity**: the slot count is fixed at 16384 — scaling out means migrating slots in, scaling in means migrating them out. A single key cannot be split; a hot key can only be split into sub-keys using hash tags.
- **Consistency**: replication is asynchronous, so a master failure may lose the last few milliseconds of writes; a replica election requires a majority of masters to be online; with `cluster-require-full-coverage yes` (the default), if any slot is left without an owner, every read and write returns `-CLUSTERDOWN Hash slot not served` (see `cluster.c`).
- **Multi-key operations**: all keys must be in the same slot. The ASK window during a `MIGRATE` is the only state in which slot ownership can be temporarily ambiguous.

## Summary

The seam between sharding and replication is "the owner of a slot can change hands": the routing layer hides the migration details behind MOVED/ASK, and the replication layer guarantees the new owner has complete data. Read the four states of `CLUSTER SETSLOT` (STABLE/NODE/MIGRATING/IMPORTING) and the two outcomes of `PSYNC` (FULLRESYNC/CONTINUE) as two state diagrams, and there is no black box left in the cluster's data plane.

## References

- [Redis source repository](https://github.com/redis/redis)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
