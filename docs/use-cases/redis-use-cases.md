# Redis use cases

Redis is an in-memory, high-performance key-value database with read and write latency typically in the sub-millisecond range. Thanks to its rich set of data structures and atomic operations, it is widely used in the following typical scenarios:

- **Caching**: keep hot data in Redis to reduce the load on the backend database and speed up API responses. See [caching](caching.md).
- **Session storage**: store user sessions centrally, with TTLs for automatic expiration. See [session storage](session-storage.md).
- **Counters**: use the atomicity of `INCR` for traffic, inventory, rate limiting, and other counts. See [counters](counters.md).
- **Leaderboards**: sorted sets natively support score-based sorting and rank queries. See [leaderboards](leaderboards.md).
- **Likes and check-ins**: sets and bitmaps are well suited for recording "who liked this" and "was someone checked in on a given day" respectively. See [likes](likes.md) and [check-ins](check-ins.md).
- **Message queues**: lists and Streams provide queueing capabilities ranging from simple queues to consumer groups. See [message queues](message-queues.md).
- **Geospatial indexing**: the GEO command family supports storing longitude and latitude plus searching for nearby places. See [geospatial indexing](geospatial-indexing.md).
- **Social relationships**: sets are well suited for expressing relationships such as follows, fans, and mutual friends. See [follows, recommendation models, and friend relationships](user-follow-recommendation-relationships.md).
- **E-commerce**: shopping carts, product tags, product filtering, globally unique IDs, lotteries, and so on. See [shopping cart](shopping-cart.md), [product tags](product-tags.md), [product filtering](product-filtering.md), [global IDs](global-id.md), and [lottery](lottery.md).

## Choosing a data structure

When using Redis, first pick the data structure that best fits the business semantics, rather than treating every piece of data as a string:

| Scenario | Recommended data structure | Core commands |
| --- | --- | --- |
| Caching | String / Hash | `SET`, `GET`, `TTL` |
| Leaderboards | Sorted Set | `ZADD`, `ZRANGE ... REV`, `ZINCRBY` |
| Deduplication and relationships | Set | `SADD`, `SINTER`, `SISMEMBER` |
| Queues | List / Stream | `LPUSH`, `BRPOP`, `XADD`, `XREADGROUP` |
| Check-ins, status bits | Bitmap | `SETBIT`, `BITCOUNT` |
| Cardinality statistics | HyperLogLog | `PFADD`, `PFCOUNT` |
| Nearby people, stores | GEO | `GEOADD`, `GEOSEARCH` |

## Notes

- **Set an expiration**: apart from persistent queues, most cache-like keys should have a TTL to avoid unbounded memory growth.
- **Keep big keys in check**: the number of members in a single set or hash should stay within reason to avoid slow commands that block the main thread.
- **Don't treat Redis as the only store**: Redis is typically a cache or auxiliary store; important data should still be written to a durable database as a backup.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](README.md)
