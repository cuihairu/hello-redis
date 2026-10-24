# High Availability

Redis's high availability (HA) design aims to ensure the system keeps running when a failure occurs and can recover quickly. Redis provides several mechanisms to achieve high availability: master-slave replication, Sentinel mode, and Cluster mode. Below are detailed introductions to these mechanisms:

## 1. Master-Slave Replication

Master-slave replication is Redis's basic high availability mechanism, achieved by replicating data across multiple Redis instances. The master node synchronizes data changes to slave nodes, which can serve as backups and take over work when the master fails.

**Configuration options**:

- **Configure master and slave nodes**:
  Set the `slaveof` option in the slave node's configuration file:
  ```plaintext
  slaveof <master-ip> <master-port>
  ```
  This makes the slave node connect to the specified master node and begin replicating data.

- **Data synchronization**:
  The slave node periodically pulls a data snapshot from the master and applies the data change log locally.

- **Failover**:
  When the master fails, one slave node must be manually promoted to the new master. This can be done automatically through Redis Sentinel mode or Redis Cluster mode.

**Advantages**:
- Data backup: the slave node holds a copy of the master node's data.
- Load balancing: read operations can be distributed to slave nodes, reducing the load on the master.

**Disadvantages**:
- Latency: synchronizing data from the master to the slave may have latency.
- Failover requires manual intervention or an additional mechanism (such as Sentinel mode) to automate it.

## 2. Sentinel Mode

Redis Sentinel mode is a high availability solution for managing master-slave replication, providing automatic failover and monitoring.

**Key features**:

- **Monitoring**: Sentinel nodes continuously monitor the health status of the master node.
- **Notification**: When a master node failure is detected, Sentinels send alert notifications.
- **Automatic failover**: When the master fails, Sentinels automatically select a slave node and promote it to the new master, while updating the other slave nodes to replicate from the new master.
- **Configuration provisioning**: Sentinel nodes can provide the address of the new master to clients so that clients can reconnect to the new master.

**Configuration options**:

- **Configure Sentinel nodes**:
  Set `sentinel monitor` in the Sentinel configuration file, specifying the master node and its IP and port:
  ```plaintext
  sentinel monitor mymaster <master-ip> <master-port> <quorum>
  ```
  Here `<quorum>` is the number of Sentinel nodes that must agree before a master node failure is recognized.

- **Configure automatic failover**:
  Sentinels perform failover automatically when the master fails. The failover timeout can be set with `sentinel failover-timeout`:
  ```plaintext
  sentinel failover-timeout mymaster 180000
  ```

**Advantages**:
- Automation: provides automatic failover and configuration updates.
- Flexibility: master and slave nodes can be managed and maintained dynamically.

**Disadvantages**:
- Complexity: configuring and maintaining Sentinel mode can be relatively complex.
- Extra overhead: additional Sentinel nodes must be deployed to achieve high availability.

## 3. Cluster Mode

Redis Cluster mode is the distributed high availability solution provided by Redis, enabling data sharding and distributed failover.

**Key features**:

- **Data sharding**: data is distributed across multiple Redis nodes, supporting horizontal scaling.
- **Automatic failover**: when a node fails, Cluster mode can automatically migrate the failed node's data to other nodes and recover from the failure.
- **High availability**: achieved through a combination of multiple master and slave nodes.

**Configuration options**:

- **Configure nodes**:
  Configure the `cluster-enabled` option on each Redis node to enable Cluster mode, and configure cluster node information:
  ```plaintext
  cluster-enabled yes
  cluster-config-file nodes.conf
  cluster-node-timeout 15000
  ```

- **Node sharding**:
  Use the `redis-cli --cluster` command to initialize and manage the cluster (for example `redis-cli --cluster create <ip>:<port> ... --cluster-replicas 1`). The `redis-trib.rb` tool in older versions (Redis 4.x) is deprecated and was removed in Redis 5.0 and later.

**Advantages**:
- Scalability: supports data sharding and horizontal scaling.
- Automation: provides automatic failover and node management.

**Disadvantages**:
- Complexity: configuring and managing Cluster mode is relatively complex.
- Resource overhead: more nodes and resources are needed to maintain cluster high availability.

## Summary

Redis's high availability mechanisms include master-slave replication, Sentinel mode, and Cluster mode. Each mechanism has its own characteristics and applicable scenarios:

- **Master-slave replication**: suitable for data backup and load balancing, but failover requires an additional mechanism.
- **Sentinel mode**: provides automatic failover and monitoring, suitable for scenarios that need high availability.
- **Cluster mode**: supports data sharding and distributed high availability, suitable for application scenarios that need horizontal scaling.

Choosing the appropriate high availability approach based on actual requirements can effectively improve the reliability and stability of a Redis system.

## References

- [Redis Operations Manual · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis Operations Manual · Replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/)
- [Redis Operations Manual · Sentinel](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
