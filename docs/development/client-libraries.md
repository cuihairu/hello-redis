# Redis Client Libraries

When using Redis, client libraries are the bridge between your code and a Redis instance. Every language and platform has its own Redis client libraries, which provide APIs and tools for interacting with Redis. Below are some commonly used Redis client libraries and their characteristics.

## 1. **Java**

- **Jedis**: A clean and full-featured Java Redis client that supports most Redis commands. It provides a synchronous API and suits latency-sensitive applications.
  - [Jedis GitHub](https://github.com/xetorthio/jedis)

- **Lettuce**: An asynchronous and reactive Redis client that supports all Redis features. It is implemented on Netty and suits high-concurrency scenarios.
  - [Lettuce GitHub](https://github.com/lettuce-core/lettuce-core)

- **Redisson**: Provides advanced Redis features and a distributed object model, supporting distributed locks, distributed collections, and more. It also provides a variety of synchronous and asynchronous APIs.
  - [Redisson GitHub](https://github.com/redisson/redisson)

## 2. **Python**

- **redis-py**: The officially supported Python Redis client, full-featured and easy to use, supporting most of Redis' features and data structures.
  - [redis-py GitHub](https://github.com/redis/redis-py)

- **hiredis**: An efficient C extension used to speed up the Redis client in Python; it is typically used together with redis-py to improve performance.
  - [hiredis GitHub](https://github.com/redis/hiredis)

## 3. **Node.js**

- **node-redis**: The official Redis client for Node.js, supporting all Redis features including pipelines and transactions.
  - [node-redis GitHub](https://github.com/redis/node-redis)

- **ioredis**: A powerful, high-performance Node.js Redis client that supports all Redis features, including cluster and Sentinel modes.
  - [ioredis GitHub](https://github.com/luin/ioredis)

## 4. **Go**

- **go-redis**: The official Redis client for Go, supporting most Redis features including transactions, pipelines, and cluster.
  - [go-redis GitHub](https://github.com/go-redis/redis)

- **redigo**: A Redis client officially supported for Go, providing basic Redis operations.
  - [redigo GitHub](https://github.com/gomodule/redigo)

## 5. **Ruby**

- **redis-rb**: The official Redis client for Ruby, full-featured and supporting most Redis features.
  - [redis-rb GitHub](https://github.com/redis/redis-rb)

## 6. **PHP**

- **phpredis**: The official Redis client for PHP, offering rich features and high performance.
  - [phpredis GitHub](https://github.com/phpredis/phpredis)

- **Predis**: A pure-PHP Redis client that supports all Redis features and is easy to install and configure.
  - [Predis GitHub](https://github.com/predis/predis)

## 7. **C#**

- **StackExchange.Redis**: The official Redis client for .NET, powerful and supporting many Redis features.
  - [StackExchange.Redis GitHub](https://github.com/StackExchange/StackExchange.Redis)

## 8. **Other languages**

- **C**: [hiredis](https://github.com/redis/hiredis)
- **Rust**: [redis-rs](https://github.com/mitsuhiko/redis-rs)
- **Swift**: [SwiftRedis](https://github.com/Redbird/SwiftRedis)

Each client library has its own unique characteristics and strengths; developers can choose the most suitable one based on project needs. When choosing a Redis client library, consider the following factors:

- **Supported Redis versions and features**: Ensure the client library supports the Redis version and features you need.
- **Performance**: Choose a client library that fits the performance requirements of the application.
- **Community and docs**: Choose a client library with an active community and good documentation, so it is easy to get support and solve problems.
- **Language features**: The client library should be compatible with the programming language and framework the project uses.

By using an appropriate Redis client library, you can integrate Redis into an application effectively and achieve high-performance data storage and management.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis clients](https://redis.io/docs/latest/develop/clients/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [ecosystem](/advanced-topics/ecosystem.md)
- [README](README.md)
- [knowledge](/knowledge.md)
