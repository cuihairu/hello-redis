# 实时分析

实时看板、访问统计、活跃用户数，共同点是数据持续流入、指标持续刷新。Redis 的内存计算让这类指标的单次更新在微秒级完成。

## 这页的视角

本文关注持续写入到指标刷新的处理链路，重点是 Streams 承接事件、消费者异步聚合。PV、UV、排行榜等常用命令与数据结构示例见[实时分析要点](real-time-analytics.md)。

## 深入阅读

- Streams + ZSET 的完整数据处理链路见[实时数据处理](real-time-analysis/data-processing.md)；
- 指标聚合与看板设计见[实时看板](real-time-analysis/dashboard.md)。

## 参考资料

- [Redis 开发文档 · 场景](https://redis.io/docs/latest/develop/use-cases/)
- [Redis 开发文档 · Streams](https://redis.io/docs/latest/develop/data-types/streams/)

<!-- BACKLINKS-AUTO -->
## 相关页面

- [README](README.md)
