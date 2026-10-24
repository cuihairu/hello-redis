# Master-Slave Replication

Redis master-slave replication is one of the foundational mechanisms for achieving high availability and data backup. Through replication, Redis synchronizes data from one master node to one or more slave nodes, enabling data backup and read-write separation. Below are detailed introductions to master-slave replication:

## 1. How Master-Slave Replication Works

- **Master node**: the master node is the source of data; all write operations are performed on the master.
- **Slave node**: the slave node replicates data from the master and keeps the data in sync. All read operations can be performed on the slave nodes to reduce the load on the master.

**Data synchronization process**:

1. **Initial synchronization**:
   - The slave node connects to the master node and requests a data sync.
   - The master node generates a data snapshot (RDB) and sends the snapshot to the slave node.
   - The slave node receives the snapshot and loads the data into its local database.

2. **Incremental synchronization**:
   - After the initial sync, the master node sends all data changes (write operations) to the slave node.
   - The slave node applies these changes to its local database to keep the data in real-time sync.

## 2. Configuring Master and Slave Nodes

To configure Redis master-slave replication, set the master node information in the slave node's configuration file:

**Slave node configuration**:

```plaintext
slaveof <master-ip> <master-port>
```

Here, `<master-ip>` is the master node's IP address and `<master-port>` is the master node's port number.

**Master node configuration** (usually no special configuration is required, but it can be set):

The master node's default configuration is usually sufficient to support master-slave replication, but some options can be set to adjust replication behavior:

```plaintext
# Maximum number of slave node connections allowed
maxclients 10000
```

## 3. Data Synchronization and Consistency

- **Full synchronization**: when a slave node first connects to the master node, a full sync is performed and the slave node receives the master's current data snapshot.
- **Incremental synchronization**: after the full sync, the master node sends the write operation log to the slave node, which applies these logs to its local data.

**Latency issues**:
- Data synchronization may have latency, and the slave node's data may lag slightly behind the master. This latency can be optimized by adjusting network configuration and Redis parameters.

## 4. Failover

Master-slave replication itself does not provide an automatic failover mechanism. If the master node fails, a slave node must be manually promoted to the new master. Redis Sentinel mode or Redis Cluster mode can be used to achieve automatic failover.

## 5. Load Balancing

By distributing read operations to slave nodes, the load on the master node can be effectively reduced and the system's read performance improved. The application must support read-write separation, sending write operations to the master node and read operations to the slave nodes.

## 6. Common Commands

- **View replication status**:
  ```plaintext
  INFO replication
  ```
  This command displays the replication status of the master and slave nodes.

- **Manually trigger a full synchronization**:
  ```plaintext
  REPLICAOF NO ONE
  REPLICAOF <master-ip> <master-port>
  ```
  This disconnects the current slave node from its master and reconnects to perform a full sync. `SLAVEOF` is the old command name from before 5.0 and has identical functionality; new scripts should write `REPLICAOF` consistently.

- **Partial synchronization (PSYNC)**:
  After a slave node disconnects and reconnects, it automatically sends a `PSYNC <replicationid> <offset>` request to the master, attempting to resume synchronization from the last position; if the master does not have enough replication backlog buffer, it falls back to a full synchronization. This command is sent automatically by the slave node and does not need to be executed manually.

## Summary

Redis master-slave replication is the foundational mechanism for data backup and read-write separation. Through replication, data can be synchronized from the master node to multiple slave nodes, improving data reliability and the system's read performance. Although master-slave replication itself does not provide automatic failover, it can be used together with Redis Sentinel mode or Redis Cluster mode to achieve higher availability and fault tolerance.

## References

- [Redis Operations Manual · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis Operations Manual · Replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
