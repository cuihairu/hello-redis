# Redis使用场景

Redis 是一款基于内存的高性能键值数据库，读写延迟通常在亚毫秒级别。凭借丰富的数据结构和原子操作，它被广泛用于以下典型场景：

- **缓存**：将热点数据放在 Redis 中，减轻后端数据库的负载，加速接口响应。请参阅[缓存](caching.md)。
- **会话存储**：集中保存用户会话，配合过期时间实现自动失效。请参阅[会话存储](session-storage.md)。
- **计数器**：利用 `INCR` 的原子性实现访问量、库存、限流等计数。请参阅[计数器](counters.md)。
- **排行榜**：有序集合天然支持按分数排序与排名查询。请参阅[排行榜](leaderboards.md)。
- **点赞与签到**：集合与位图分别适合记录"谁点赞了"和"某天是否签到"。请参阅[点赞](likes.md)、[签到](check-ins.md)。
- **消息队列**：列表和 Streams 提供从简单队列到消费组的多层次的队列能力。请参阅[消息队列](message-queues.md)。
- **地理空间索引**：GEO 系列命令支持经纬度存储与附近检索。请参阅[地理空间索引](geospatial-indexing.md)。
- **社交关系**：集合适合表达关注、粉丝、共同好友等关系。请参阅[用户关注、推荐模型、好友关系](user-follow-recommendation-relationships.md)。
- **电商场景**：购物车、商品标签、商品筛选、全局唯一 ID、抽奖等。请参阅[购物车](shopping-cart.md)、[商品标签](product-tags.md)、[商品筛选](product-filtering.md)、[全局ID](global-id.md)、[抽奖](lottery.md)。

## 选型建议

使用 Redis 时，应先根据业务语义选择最贴合的数据结构，而不是把所有数据都当作字符串处理：

| 场景 | 推荐数据结构 | 核心命令 |
| --- | --- | --- |
| 缓存 | String / Hash | `SET`、`GET`、`TTL` |
| 排行榜 | Sorted Set | `ZADD`、`ZRANGE ... REV`、`ZINCRBY` |
| 去重与关系 | Set | `SADD`、`SINTER`、`SISMEMBER` |
| 队列 | List / Stream | `LPUSH`、`BRPOP`、`XADD`、`XREADGROUP` |
| 签到、状态位 | Bitmap | `SETBIT`、`BITCOUNT` |
| 基数统计 | HyperLogLog | `PFADD`、`PFCOUNT` |
| 附近的人、门店 | GEO | `GEOADD`、`GEOSEARCH` |

## 注意事项

- **设置过期时间**：除持久化队列外，大多数缓存类键都应设置 TTL，避免内存无限增长。
- **控制大键**：单个集合或哈希的成员数应控制在合理范围，避免阻塞主线程的慢命令。
- **不要把 Redis 当唯一存储**：Redis 通常作为缓存或辅助存储，重要数据仍应落库备份。
