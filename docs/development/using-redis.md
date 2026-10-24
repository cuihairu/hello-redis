# Developing with Redis

My notes on the common concepts, development patterns, and considerations I run into when using Redis in projects.

## 1. **Core concepts**

- **Key-value storage**: Redis is an in-memory key-value database that supports multiple data structures such as strings, hashes, lists, sets, sorted sets, and so on. The differences between data structures affect storage choices in a project.
- **Persistence options**: Redis provides two persistence mechanisms, RDB snapshots and AOF logs. Developers need to choose the persistence scheme that fits their requirements, to ensure data durability and reliability.
- **High availability and distribution**: Redis supports high-availability and distributed solutions such as master-slave replication, Sentinel mode, and Cluster mode. These mechanisms affect an application's reliability and how it scales.

## 2. **Common development patterns**

- **Caching**: Redis is commonly used to cache hot data, reducing database load and improving application response speed. Common caching patterns include setting expiry times, cache warm-up, and cache invalidation strategies.
- **Message queues**: Redis' list and stream data structures are well suited as message queues. Developers can use Redis list commands (such as `LPUSH` and `BRPOP`) or stream commands (such as `XADD` and `XREAD`) to implement async processing and task scheduling.
- **Session storage**: Redis is commonly used to store user session data. Thanks to its high performance and in-memory storage, Redis can read and write session information quickly, which improves the user experience.

## 3. **Best practices**

- **Choose the right data structure**: Pick the most suitable Redis data structure for the actual use case. For example, use a list for queue operations and a hash to store object properties.
- **Set expiry times sensibly**: Set an appropriate expiry time for cached data to balance the cache hit rate and memory use. Avoid overly long expiry times so that cached data does not go stale.
- **Use transactions and pipelines**: When batch operations on Redis data are needed, use transactions (`MULTI` and `EXEC`) and pipelines (`PIPELINE`) to improve efficiency and consistency.
- **Monitoring and tuning**: Regularly monitor a Redis instance's performance metrics (such as memory use and hit rate) and tune performance based on that data. Use Redis' built-in tools and third-party monitoring tools to collect performance data.

## 4. **Considerations**

- **Data durability**: Make sure Redis' persistence configuration meets the application's data durability requirements. Choose an RDB, AOF, or combined RDB-plus-AOF persistence strategy according to the data's importance and the use case.
- **Memory management**: Redis stores data in memory, so make sure to configure enough memory and manage memory use sensibly to prevent out-of-memory conditions.
- **Security**: Configure Redis' access control and authentication so that only authorized users can access the Redis instance. Improve security with password protection, access control lists (ACLs), and similar measures.


## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis development docs · Use commands](https://redis.io/docs/latest/develop/using-commands/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](README.md)
