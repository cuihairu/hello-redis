# Advanced Features

This section records a few categories of common issues in Redis production use: persistence, high availability, performance optimization, and security configuration. The related configuration choices and trade-offs come from real use and gathering reference material.

---

## Persistence

Redis provides two main persistence mechanisms to ensure that data can be recovered after a restart or crash. In operations I focus mainly on configuring these mechanisms and the boundaries of recovery.

- **RDB snapshots**: Redis achieves persistence by creating point-in-time snapshots of the data. Covers how to configure RDB snapshots and their role in data recovery.
- **AOF logs**: Redis achieves persistence by recording every write operation. Covers how AOF logs work, plus tuning options related to file size and performance.
- **Persistence configuration and strategy**: Trade-offs between persistence strategy configuration, performance, and data safety.

## High Availability

Redis provides several mechanisms to ensure high system availability. High-availability configuration is used to keep data available and consistent during failures.

- **Master-slave replication**: The principles and configuration of master-slave replication, and data synchronization between instances.
- **Sentinel mode**: Redis Sentinel mode monitors Redis instances, performs automatic failover, and notifies administrators.
- **Cluster mode**: Redis Cluster mode provides sharding, distributing data across multiple nodes to achieve high availability and load balancing.

## Performance Optimization

These notes focus on performance bottlenecks in production, and the optimization strategies used to improve Redis throughput and response speed.

- **Memory optimization**: Maximum-memory configuration and memory-usage management.
- **Command optimization**: Performance characteristics of commonly used commands and bottlenecks that are easy to hit.
- **Redis performance monitoring and tuning**: Redis performance monitoring metrics and notes on tuning based on observed results.

## Security

Ensuring Redis security is an important step in protecting data from unauthorized access. Covers Redis security configuration and hardening approaches.

- **Authentication and authorization**: Configuring Redis authentication and access control so that only authorized users can access data.
- **Network security**: Discusses how to protect Redis instances from network attacks, including using encryption and configuring firewalls.
- **Data encryption**: Redis data-encryption options and their scope of protection.


## References

- [Redis Operations Manual · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
