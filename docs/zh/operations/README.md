# 运维与管理

这里整理生产环境中 Redis 实例的运维经验，涉及备份恢复、日志、集群维护、监控与故障排查。

## 内容导航

### [Redis运维](redis-operations.md)

记录 Redis 实例的日常操作：启动与关闭、运行时配置和客户端连接管理。

- [Redis备份与恢复](backup-and-restore.md)：RDB/AOF 的备份策略与恢复流程。
- [Redis日志管理](logging.md)：日志级别、慢日志与滚动清理。
- [Redis集群管理](cluster-management.md)：集群的创建、扩容、槽迁移与节点维护。

### [监控与故障排除](monitoring-and-troubleshooting.md)

监控指标、常见故障的定位过程和处理记录。

- [Redis监控工具](monitoring-tools.md)：redis-cli 自带命令、Redis Exporter 与 Prometheus/Grafana。
- [常见问题与解决方法](common-issues.md)：内存、连接、持久化、集群等典型问题速查。
- [性能调优与故障排查](performance-tuning.md)：从配置、命令、网络到持久化的系统性优化。

## 参考资料


<!-- BACKLINKS-AUTO -->
## 相关页面

- [knowledge](/zh/knowledge.md)
