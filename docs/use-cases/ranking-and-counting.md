# 排行榜与计数器

排行榜和计数器是 Redis 高频场景：ZSET 天然有序，INCR 原子累加，单机就能撑起高并发写入。

## 排行榜

- `ZADD` 写入成员与分数，`ZINCRBY` 累加分数；
- 取榜单头部用 `ZREVRANGE`（分数从高到低）；6.2 起推荐统一用 `ZRANGE ... REV`，旧命令 `ZREVRANGE`、`ZRANGEBYSCORE` 已废弃；
- 查排名与分数用 `ZREVRANK` + `ZSCORE`；7.2 的 `ZRANK` 带 `WITHSCORE` 一次取回排名和分数。

## 计数器

- 点赞、浏览、库存扣减用 `INCR`/`INCRBY`，原子操作无锁；
- 批量计数用 Hash（`HINCRBY`），一次读取一个对象的全部计数。

## 深入阅读

- 榜单实现、同分排序、分页与性能优化见[排行榜实现](ranking-and-counting/ranking.md)；
- 计数器进阶：计数同步、分片与持久化见[计数器应用实例](counters.md)。
