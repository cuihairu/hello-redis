# Operations & Administration

These notes collect operations experience for Redis instances in production, covering backup and restore, logging, cluster maintenance, monitoring, and troubleshooting.

## Contents

### [Redis Operations](redis-operations.md)

Day-to-day operations for Redis instances: starting and stopping, runtime configuration, and client connection management.

- [Redis Backup and Restore](backup-and-restore.md): RDB/AOF backup strategies and restore procedures.
- [Redis Logging](logging.md): log levels, slow logs, and rotation cleanup.
- [Redis Cluster Management](cluster-management.md): cluster creation, scaling, slot migration, and node maintenance.

### [Monitoring & Troubleshooting](monitoring-and-troubleshooting.md)

Monitoring metrics, the process of locating common failures, and records of how they were handled.

- [Redis Monitoring Tools](monitoring-tools.md): built-in redis-cli commands, Redis Exporter, and Prometheus/Grafana.
- [Common Issues and Solutions](common-issues.md): quick reference for typical issues with memory, connections, persistence, clusters, and more.
- [Performance Tuning & Troubleshooting](performance-tuning.md): systematic optimization spanning configuration, commands, networking, and persistence.

## References


<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
