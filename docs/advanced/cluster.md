# Redis Cluster Mode

Redis Cluster mode is a distributed deployment solution provided by Redis for distributing data across multiple Redis instances to achieve high availability and horizontal scaling. Redis Cluster mode can handle large amounts of data and high-concurrency requests, and can guarantee data durability and availability when nodes fail. Below are detailed introductions to Redis Cluster mode:

## 1. How Redis Cluster Mode Works

- **Data sharding**: Redis Cluster stores sharded data on different nodes, with each node storing a subset of the data. Data is evenly distributed across the nodes in the cluster.

- **Node types**:
  - **Master node**: handles read and write requests and stores data shards.
  - **Slave node**: synchronizes data from the master node and provides load balancing for read requests and failover recovery.

- **Data distribution**: Redis Cluster uses hash slots to assign data. There are a total of 16384 hash slots in the cluster, and data is distributed across different master nodes through hash slots.

- **Failure recovery**: the cluster monitors the status of master nodes and, when a master fails, automatically promotes a slave node to the new master to ensure the system's high availability.

- **Request routing**: client requests are routed to the appropriate node, and nodes in the cluster use hash slots to locate data.

## 2. Configuring Redis Cluster

**Step 1: Prepare the configuration files**

Each Redis node needs to be configured for Redis Cluster mode. Enable Cluster mode in the Redis configuration file and set the relevant parameters. Below is an example Redis configuration file:

```plaintext
# Enable Cluster mode
cluster-enabled yes

# Cluster configuration file path
cluster-config-file nodes.conf

# Timeout for determining node failure (milliseconds)
cluster-node-timeout 5000
cluster-slave-validity-factor 10

# Configure the node's maximum memory
maxmemory 2gb

# Configure persistence
appendonly yes
```

**Step 2: Start the Redis instances**

Start each Redis instance and ensure they can communicate with each other. The following command can be used to start a Redis instance:

```bash
redis-server /path/to/redis.conf
```

**Step 3: Create the cluster**

Use Redis's built-in tool `redis-cli` to create the cluster. Below is an example command for creating a cluster:

```bash
redis-cli --cluster create <node1-ip>:<node1-port> <node2-ip>:<node2-port> <node3-ip>:<node3-port> <node4-ip>:<node4-port> <node5-ip>:<node5-port> <node6-ip>:<node6-port> --cluster-replicas 1
```

This command creates a cluster with 3 master nodes and 3 slave nodes.

## 3. Cluster Management

**View cluster status**:

```bash
redis-cli -c -h <node-ip> -p <node-port> cluster info
```

**View cluster nodes**:

```bash
redis-cli -c -h <node-ip> -p <node-port> cluster nodes
```

**Add a new node**:

```bash
redis-cli --cluster add-node <new-node-ip>:<new-node-port> <existing-node-ip>:<existing-node-port>
```

**Delete a node**:

```bash
redis-cli --cluster del-node <existing-node-ip>:<existing-node-port> <node-id>
```

**Reshard slots**:

```bash
redis-cli --cluster reshard <existing-node-ip>:<existing-node-port>
```

## 4. Cluster Failure Recovery

- **Master node failure**: when a master node fails, Redis Cluster automatically promotes a slave node to the new master. If the number of master nodes in the cluster drops below 50%, the cluster enters a failure state.

- **Slave node failure**: a slave node failure does not affect the overall availability of the cluster, but it may affect data backup and load balancing.

## 5. Common Issues and Notes

- **Node communication**: ensure that all nodes can communicate with each other, and that firewall settings allow communication between nodes.

- **Data migration**: data migration may cause a performance drop; it is recommended to perform it during off-peak periods.

- **Configuration synchronization**: all nodes in the cluster need to keep consistent configuration; ensure the configuration files are correct.

## 6. Summary

Redis Cluster mode provides a high availability and scalability solution; by distributing data across multiple nodes, Redis Cluster can handle large amounts of data and high-concurrency requests. By properly configuring and managing a Redis Cluster, you can build an efficient and reliable distributed data storage solution.

## References

- [Redis Operations Manual · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis Operations Manual · Scaling](https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/)
- [Redis Cluster Specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
