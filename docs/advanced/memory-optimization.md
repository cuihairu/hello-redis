# Redis Memory Optimization

Redis is an efficient in-memory data structure store. Optimizing memory usage can significantly improve Redis performance and reduce system costs. The following is a detailed guide to Redis memory optimization:

## 1. Configuring max memory

**1.1 Setting max memory**

Configure the `maxmemory` parameter to limit the maximum memory Redis uses. This prevents Redis from consuming too much memory and affecting other processes on the system.

```plaintext
maxmemory 2gb
```

**1.2 Choosing an eviction policy**

Redis provides several memory eviction policies to free memory effectively when the memory limit is reached. Common policies include:

- **noeviction**: After reaching max memory, write operations are refused.
- **allkeys-lru**: Evict the least recently used key from all keys.
- **volatile-lru**: Evict the least recently used key among keys with an expiration set.
- **allkeys-random**: Evict a random key from all keys.
- **volatile-random**: Evict a random key among keys with an expiration set.
- **volatile-ttl**: Evict the keys with the shortest remaining time-to-live among keys with an expiration set.

```plaintext
maxmemory-policy allkeys-lru
```

## 2. Optimizing data structures

**2.1 Choosing the right data type**

Choose the right Redis data structure for the use case to reduce memory usage. For example:

- **String**: Suitable for simple key-value storage. Note that large strings can consume a lot of memory.
- **Hash**: Suitable for objects with multiple fields, more memory-efficient than using multiple strings.
- **List**: Suitable for ordered collections of elements, a good fit for message queues and similar applications.
- **Set**: Suitable for collections of unique elements, with support for set operations.
- **Sorted set**: Suitable for collections that need ordering, such as leaderboards.
- **Bitmap**: Suitable for large-scale boolean data storage.
- **HyperLogLog**: Suitable for cardinality estimation, using very little memory.

**2.2 Compressing data**

Compress data at the application layer, especially when storing many large strings or hashes, to effectively reduce memory usage. Common compression libraries include `lz4`, `zlib`, and `gzip`.

**2.3 Using appropriate data structure options**

- **Hash field compression**: When a hash has few fields and small field values, Redis stores the hash using a compact listpack encoding (ziplist in older versions). You can control the conversion threshold with `hash-max-listpack-entries` and `hash-max-listpack-value` (before Redis 7.0 the corresponding config names were `hash-max-ziplist-entries` and `hash-max-ziplist-value`).
- **List compression**: Lists also use listpack/ziplist encoding when small (`list-max-listpack-size`, formerly `list-max-ziplist-size`); for larger quicklist lists, you can also compress the inner nodes with LZF via `list-compress-depth` (since Redis 5.0), keeping the two end nodes uncompressed for fast access.

```plaintext
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
```

## 3. Memory analysis and monitoring

**3.1 Using the `MEMORY STATS` command**

Get detailed information about Redis memory usage, including various memory statistics such as total memory and memory used by the allocator.

```bash
redis-cli MEMORY STATS
```

**3.2 Using the `MEMORY USAGE` command**

Check the memory usage of a specific key. This helps you identify keys that consume a lot of memory.

```bash
redis-cli MEMORY USAGE <key>
```

**3.3 Using Redis memory analysis tools**

- **Redis Desktop Manager**: A GUI management tool that provides visual memory usage analysis.
- **RDM**: Redis Desktop Manager, which lets you view and manage Redis data and shows memory usage.

## 4. Memory management tips

**4.1 Optimizing memory allocation**

Redis uses Jemalloc as the default memory allocator, which offers good performance and memory utilization. If you use the default allocator, you can consider tuning Jemalloc's configuration to optimize performance.

**4.2 Cleaning up expired keys regularly**

- **Set expiration times**: Set a reasonable expiration time for keys you no longer need; Redis automatically deletes a key when it expires.

```bash
EXPIRE mykey 3600
```

- **Use expiration policies**: Redis supports two expiration policies: lazy deletion (check the expiration time when a key is accessed) and periodic deletion (periodically scan and delete expired keys).

```plaintext
hz 10
```

**4.3 Avoiding large keys**

Avoid storing overly large keys or values. Split large objects into smaller key-value pairs to reduce memory pressure.

## 5. Summary

Redis memory optimization covers setting memory limits sensibly, choosing the right data structures, using compression, and memory analysis and monitoring. By configuring and optimizing Redis precisely, you can significantly improve performance and reduce memory consumption. Based on your actual application needs, combined with the strategies above, you can achieve efficient Redis memory management.

## References

- [Redis Operating Guide · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis Operating Guide · Optimization](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
