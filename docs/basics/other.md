# Other Redis-compatible open source projects

In the Redis ecosystem, besides Redis itself, there are many open source projects that are compatible with the Redis protocol or use Redis. These projects extend Redis's functionality, providing different features and optimizations for various application scenarios. Below is an introduction to some popular Redis-compatible open source projects.

---

## 1. KeyDB
- **Overview**: KeyDB is a high-performance, multithreaded key-value database that is compatible with the Redis protocol. It provides all of Redis's features and adds some unique ones.
- **Features**:
  - Multithreading support
  - Compatible with the Redis protocol
  - Native TLS support
  - Built-in replication and failover
- **Installation and configuration**: [Install and configure KeyDB](../redis-compatible/keydb.md)
- **Use cases**: High-performance data storage and caching

## 2. RedisGraph
- **Overview**: RedisGraph is a graph-database-based Redis module that supports efficient graph data queries and graph algorithms.
- **Features**:
  - Supports the Cypher query language
  - Efficient graph data storage
  - Supports complex graph queries and analysis
- **Installation and configuration**: See the official Redis documentation for the RedisGraph project
- **Use cases**: Social network analysis, recommendation systems

## 3. RedisJSON
- **Overview**: RedisJSON is a Redis module that provides native support for JSON data, including storing, retrieving, and manipulating JSON data.
- **Features**:
  - Supports the JSONPath query language
  - Atomic operations on JSON data
  - Efficient JSON data processing
- **Installation and configuration**: See the official Redis documentation for the RedisJSON project
- **Use cases**: JSON data management and processing

## 4. RedisSearch
- **Overview**: RedisSearch is a Redis module that provides full-text search and data indexing, supporting fast text search and analysis.
- **Features**:
  - Supports complex query conditions
  - Supports full-text search and data indexing
  - Efficient search engine
- **Installation and configuration**: See the official Redis documentation for the RedisSearch project
- **Use cases**: Search engines, log analysis

## 5. RedisTimeSeries
- **Overview**: RedisTimeSeries is a Redis module designed specifically for time-series data, providing efficient time-series data storage and queries.
- **Features**:
  - Supports time-series data storage
  - Efficient data insertion and queries
  - Built-in data aggregation and analysis
- **Installation and configuration**: See the official Redis documentation for the RedisTimeSeries project
- **Use cases**: Monitoring data, IoT data analysis

## 6. RedisAI
- **Overview**: RedisAI is a Redis module that allows machine learning model inference to run inside Redis, supporting frameworks such as TensorFlow and PyTorch.
- **Features**:
  - Supports model loading and inference
  - Integrates TensorFlow and PyTorch
  - Efficient model inference
- **Installation and configuration**: See the official Redis documentation for the RedisAI project
- **Use cases**: Real-time machine learning inference

## 7. RedisBloom
- **Overview**: RedisBloom is a Redis module that implements Bloom filters, counting Bloom filters, and other probabilistic data structures, suitable for big data processing.
- **Features**:
  - Bloom filters and counting Bloom filters
  - Efficient probabilistic data structures
  - Supports large-scale data processing
- **Installation and configuration**: See the official Redis documentation for the RedisBloom project
- **Use cases**: Data deduplication, traffic monitoring


## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis command index](https://redis.io/docs/latest/commands/)

## Related pages

- [basic-operations](basic-operations.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [basic-operations](basic-operations.md)
