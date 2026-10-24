# Redis Cluster Management

## Overview

Redis Cluster is a distributed deployment mode of Redis used to increase data storage capacity and system availability. Redis Cluster distributes data across multiple nodes through sharding, achieving horizontal scaling. Managing a Redis Cluster involves deployment, monitoring, maintenance, and failure handling.

## Cluster Architecture

### Node Types

- **Master**: stores data and handles client read/write requests.
- **Slave**: syncs data from the master, serves as the master's backup, and is promoted to master when the master fails.

### Data Sharding

Redis Cluster distributes data across different master nodes through data sharding. Each master is responsible for storing and operating on one shard. Redis uses hash slots to implement sharding, with each master managing a certain range of hash slots.

### Elections and Failover

When a master fails, Redis Cluster automatically elects a new master from among the slaves and promotes it to master, keeping the cluster highly available.

## Cluster Deployment

### Deployment Steps

1. **Prepare the nodes**: set up Redis instances and prepare at least 3 masters and 3 slaves.
2. **Configure the nodes**: edit the `redis.conf` configuration file to enable cluster mode and set the node port.

   Example configuration:

   ```bash
   cluster-enabled yes
   cluster-config-file nodes.conf
   cluster-node-timeout 5000
   ```

3. **Start the Redis instances**: start a Redis instance on each node and make sure every instance runs in cluster mode.

4. **Create the cluster**: use the `redis-cli` tool to create the cluster, specifying each node's address.

   Example command for creating a cluster:

   ```bash
   redis-cli --cluster create <node1>:6379 <node2>:6379 <node3>:6379 <node4>:6379 <node5>:6379 <node6>:6379 --cluster-replicas 1
   ```

### Node Configuration

Each node's `redis.conf` configuration file needs to enable cluster mode and set the cluster-related parameters.

```bash
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
cluster-announce-ip <your-public-ip>
cluster-announce-port 6379
cluster-announce-bus-port 16379
```

## Cluster Management

### Cluster Status Monitoring

Use the `redis-cli` tool to check the cluster status and get node information and health.

```bash
redis-cli -c cluster info
redis-cli -c cluster nodes
```

### Resharding

When the number of nodes changes, the data needs to be resharded to stay balanced. Use the `redis-cli` tool to perform the reshard operation.

```bash
redis-cli --cluster reshard <node-ip>:<port>
```

### Adding and Removing Nodes

- **Add a node**: add a new master or slave node to the cluster.

  Example command for adding a node:

  ```bash
  redis-cli --cluster add-node <new-node-ip>:6379 <existing-node-ip>:6379
  ```

- **Remove a node**: remove a node from the cluster that is no longer needed.

  Example command for removing a node:

  ```bash
  redis-cli --cluster del-node <existing-node-ip>:6379 <node-id>
  ```

### Failure Handling and Recovery

- **Node failure**: when a master fails, Redis Cluster automatically elects a new master from the slaves.

- **Manual recovery**: if automatic failover fails, you can trigger a failover manually.

  Example manual failover command (run on the slave):

  ```bash
  redis-cli -c -h <node-ip> -p <node-port> CLUSTER FAILOVER
  ```

## Cluster Performance Tuning

### Adjusting Cluster Configuration

Adjust configuration parameters to improve performance based on the cluster's load.

### Monitoring and Tuning

Use Redis cluster monitoring tools (such as `Prometheus`, `Grafana`, and `Redis CLI`) to monitor cluster performance and optimize based on the actual situation.

### High Availability Configuration

Make sure the cluster's masters and slaves are configured sensibly and that the latency between masters and slaves stays minimal, to improve the cluster's high availability.


## References


<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
