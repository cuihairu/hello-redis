# 第5部分：运维与管理

本部分介绍 Redis 在生产环境中的日常运维与管理工作，包括实例的运维操作、数据备份与恢复、日志管理、集群维护，以及监控与故障排除的方法和工具。

## 内容导航

### [Redis运维](redis-operations.md)

介绍 Redis 实例的日常运维操作：启动与关闭、运行时配置管理、客户端连接管理等。

- [Redis备份与恢复](backup-and-restore.md)：RDB/AOF 的备份策略与恢复流程。
- [Redis日志管理](logging.md)：日志级别、慢日志与滚动清理。
- [Redis集群管理](cluster-management.md)：集群的创建、扩容、槽迁移与节点维护。

### [监控与故障排除](monitoring-and-troubleshooting.md)

建立 Redis 的监控体系，并掌握常见故障的定位与处理方法。

- [Redis监控工具](monitoring-tools.md)：redis-cli 自带命令、Redis Exporter 与 Prometheus/Grafana。
- [常见问题与解决方法](common-issues.md)：内存、连接、持久化、集群等典型问题速查。
- [性能调优与故障排查](performance-tuning.md)：从配置、命令、网络到持久化的系统性优化。
