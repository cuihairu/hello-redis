# Sentinel Mode

Redis Sentinel mode is a high availability solution provided by Redis, designed to monitor the running status of Redis instances and perform automatic failover. With Sentinel mode, when a master node fails, a slave node can be automatically promoted to the new master, thereby improving Redis's availability and reliability. Below are detailed introductions to Sentinel mode:

## 1. How Sentinel Mode Works

- **Sentinel instances**: Sentinel instances are processes dedicated to monitoring Redis master and slave nodes. They can perform health checks on the master node, failover, configuration updates, and other operations.

- **Master and slave nodes**: the master node is responsible for handling write and read operations, and slave nodes replicate data from the master and handle read operations.

- **Monitoring**: Sentinel instances periodically check the status of master and slave nodes to ensure they are running normally. If the master fails, Sentinels detect the problem and trigger failover.

- **Failover**: when Sentinel instances detect that the master node is unavailable, they elect a slave node as the new master and update the configuration of the other slave nodes and applications so they connect to the new master.

- **Notification**: Sentinel instances notify applications of master node changes so that applications can take corresponding actions, such as reconnecting to the new master.

## 2. Configuring Sentinel Mode

To configure Redis Sentinel mode, specify the master node information and the information of other Sentinel instances in each Sentinel instance's configuration file. Below are the basic configuration steps for Sentinel mode:

**Sentinel configuration file (sentinel.conf)**:

```plaintext
# Monitor the master node
sentinel monitor mymaster <master-ip> <master-port> 2

# Master node failover configuration
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 10000
sentinel parallel-syncs mymaster 1

# Master node password authentication (required when the master is configured with requirepass)
sentinel auth-pass mymaster <master-password>
```

- `sentinel monitor mymaster <master-ip> <master-port> 2`: specifies the master node to monitor and the number of Sentinels required (2 Sentinels) to perform failover.
- `sentinel down-after-milliseconds mymaster 5000`: specifies the time after which the master node is considered failed (5000 milliseconds).
- `sentinel failover-timeout mymaster 10000`: specifies the failover timeout (10000 milliseconds).
- `sentinel parallel-syncs mymaster 1`: specifies the maximum number of slave nodes that synchronize with the new master during failover.

**Starting Sentinel**:

```bash
redis-server /path/to/sentinel.conf --sentinel
```

## 3. Failover Process

1. **Monitoring**: Sentinel instances monitor the master node and check whether it has failed.
2. **Failure detection**: when the master node fails, Sentinel instances start the failover process.
3. **Election of a new master**: Sentinel instances elect one slave node from the slave nodes as the new master.
4. **Configuration update**: update the configuration of the other slave nodes and applications to the new master.
5. **Notification to applications**: Sentinel instances notify applications of the master node change.

## 4. Common Commands

- **View master status**:
  ```plaintext
  SENTINEL MASTER mymaster
  ```
  This command returns the master node's status information.

- **Get slave node information**:
  ```plaintext
  SENTINEL REPLICAS mymaster
  ```
  This command returns information about all slave nodes (Redis 5.0+ uses REPLICAS instead of SLAVES).

- **Manual failover**:
  ```plaintext
  SENTINEL failover mymaster
  ```
  This command forces a failover.

## 5. High Availability and Fault Tolerance

Through Sentinel mode, Redis achieves high availability and fault tolerance. Sentinels can automatically detect master node failures and perform failover, ensuring the system keeps running. Sentinel mode can also be combined with Redis Cluster mode to further improve the system's scalability and reliability.

## Summary

Redis Sentinel mode is a high availability solution that provides monitoring, failover, and notification functionality. By configuring Sentinel instances and master-slave nodes, Redis can automatically perform failover when the master node fails and notify applications of the new master's information. Sentinel mode is an important mechanism for achieving Redis high availability and is suitable for scenarios that require high reliability.

## References

- [Redis Operations Manual · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis Operations Manual · Sentinel](https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
