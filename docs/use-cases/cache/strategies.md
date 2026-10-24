# Cache Strategies and Practices

Caching is an important tool for improving system performance and response speed. The following are key caching strategies and practices that help you use caching effectively to optimize your system:

This page breaks down problems and trade-offs by strategy; for Flask scenario cases see [Web app caching](web-app.md), and for the overview see [Caching](../cache.md).

### Cache penetration

**Problem**:
Cache penetration occurs when the requested data exists in neither the cache nor the database, so the request goes straight to the database, bypassing the cache entirely.

**Solutions**:
- **Bloom filter**: use a Bloom filter to pre-check whether data exists, avoiding invalid database queries. A Bloom filter is a probabilistic data structure that quickly judges whether an element might be in a set.
- **Null caching**: store a specific marker in the cache indicating that the data was not found. For requests matching this marker, return an error or default value directly instead of touching the database. Set a short TTL on the null marker (e.g. 60 seconds) so it does not hold memory long-term.

### Cache avalanche

**Problem**:
When large amounts of cached data expire at the same time, a large number of requests may hit the database simultaneously, causing a spike in database load.

**Solutions**:
- **Randomize expiration times**: set random expiration times for different pieces of data so they do not all expire together.
- **Cache warm-up**: load frequently used data into the cache at system startup, avoiding the load peak caused by a cold cache.
- **Multi-level caching**: combine local and remote caches to reduce load pressure on a single cache system.

### Cache breakdown

**Problem**:
Cache breakdown refers to the moment cached data expires and multiple requests reach the database at once, causing database load to spike.

**Solutions**:
- **Mutex**: use a distributed lock so only one request at a time can access the database and update the cache, while other requests wait for the cache update to finish.
- **Logical expiration**: do not set a real TTL on the cache; carry a logical expiration time inside the value. Once logical expiration is detected, rebuild asynchronously while continuing to serve the stale value, so requests are not all pushed onto the database.

### Cache update strategies

- **Cache-Aside**: the most common approach. Read: check the cache first, and on a miss query the database and backfill. Write: update the database first, then delete the cache. Deleting rather than updating the cache avoids dirty data under concurrent writes and keeps the implementation simplest.
- **Write-Through**: the write updates both the database and the cache, usually proxied by the cache layer. Consistency is good, but every write still hits the database, which puts pressure on it when writes and reads are both heavy.
- **Write-Behind (write-back / lazy write)**: the write only updates the cache, and a background job writes back to the database asynchronously in batches. Write performance is highest, but a crash can lose data that has not been flushed, so it suits counters, likes, and other workloads that tolerate data loss.

### Cache eviction strategies

Redis eviction behavior is governed by `maxmemory-policy`. When memory reaches the `maxmemory` limit, keys are evicted according to the policy:

| Policy | Behavior | Use case |
| --- | --- | --- |
| `noeviction` | Do not evict; write commands error out | Data must not be lost and errors are tolerable |
| `allkeys-lru` | Evict the least recently used among all keys | General-purpose cache, most commonly used |
| `allkeys-lfu` | Evict the least frequently accessed among all keys (4.0+) | Hot data with widely differing access frequencies |
| `volatile-lru` | Evict LRU among keys with a TTL | Only evict keys that have an expiration |
| `volatile-lfu` | Evict LFU among keys with a TTL (4.0+) | Same as above, but by access frequency |
| `allkeys-random` / `volatile-random` | Evict randomly | No clear pattern in the access pattern |
| `volatile-ttl` | Evict the key with the shortest remaining TTL among keys with a TTL | Want to evict soon-to-expire keys first |

Setting it up: `CONFIG SET maxmemory-policy allkeys-lru`, or write it into the config file.

### Real-world examples

- **Page caching**: store dynamically generated page content in Redis to reduce page generation time and improve response speed.
- **Data caching**: cache frequently queried database results, such as user profiles and popular articles, to cut repeated database queries.
- **Distributed caching**: share a Redis cache across multiple servers so every server sees consistent cached data, improving system reliability and consistency.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](/use-cases/README.md)
- [cache](/use-cases/cache.md)
- [caching](/use-cases/caching.md)
