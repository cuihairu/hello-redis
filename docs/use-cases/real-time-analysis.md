# 实时分析

实时看板、访问统计、活跃用户数，共同点是数据持续流入、指标持续刷新。Redis 的内存计算让这类指标的单次更新在微秒级完成。

## 实现方式

- 计数类指标（PV、UV、点赞数）用 `INCR`、`PFINCRBY` 直接累加；UV 用 HyperLogLog 去重计数；
- 时间窗口指标（最近 5 分钟活跃）用 Streams 承接写入，消费者异步聚合到 ZSET 或 Hash；
- 排行榜与 TOP N 用 ZSET 维护，`ZRANGE` 取头部。

## 选型速查

| 需求 | 结构 |
| --- | --- |
| 简单计数 | String（INCR） |
| 去重计数 | HyperLogLog（PFADD） |
| 按时间排序 | ZSET（分数为时间戳） |
| 事件流写入 | Streams |

## 深入阅读

- Streams + ZSET 的完整数据处理链路见[实时数据处理](real-time-analysis/data-processing.md)；
- 指标聚合与看板设计见[实时看板](real-time-analysis/dashboard.md)。
