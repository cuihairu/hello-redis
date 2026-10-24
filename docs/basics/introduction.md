# Introduction

Redis is an open-source, high-performance key-value store. It is known for fast reads and writes and a rich set of data structures, and is commonly used as a database, a cache, and a message broker. Redis is designed to deliver extreme performance while keeping data durable and reliable. These notes cover the essentials: what Redis is, where it came from, and what it is good at.

## What is Redis

Redis (Remote Dictionary Server) is an open-source, in-memory data structure store that supports multiple data types — strings, hashes, lists, sets, and sorted sets among them. It is typically used as a database, cache, and message broker. Thanks to its performance characteristics, Redis is widely used wherever data must be served quickly: real-time analytics, caching layers, and distributed applications.

**Key traits**:
- **High performance**: Redis sustains millions of operations per second with millisecond-level response times.
- **Persistence**: multiple persistence mechanisms keep data safe across restarts.
- **Rich data structures**: strings, hashes, lists, sets, sorted sets, bitmaps, geospatial data, streams, and more.
- **In-memory storage**: data lives primarily in memory, which is what makes reads and writes so fast.
- **Transactions**: multiple commands can be grouped and executed atomically.
- **Pub/Sub**: publish/subscribe messaging for broadcasts and real-time notifications.
- **High availability and distribution**: master-slave replication, Sentinel, and Cluster mode.

## Redis History and Development

Redis was originally developed by Salvatore Sanfilippo (aka antirez) in 2009, starting as a lightweight in-memory database for workloads that demanded very fast data access. As it matured, Redis gained persistence, distributed-system support, and many more data structures.

**Notable versions and changes**:
- **Redis 1.0**: the first stable release — basic key-value storage (RDB snapshots and sorted sets were already in place around this time).
- **Redis 2.0**: introduced the hash type, pub/sub, and the blocking pop commands (BLPOP/BRPOP).
- **Redis 3.0**: introduced Cluster mode for distributed data storage.
- **Redis 4.0**: added the module system, letting users extend Redis.
- **Redis 5.0**: introduced the stream data structure, strengthening real-time data flow support.
- **Redis 6.0**: multithreaded network I/O, ACL access control, client-side caching, and the RESP3 protocol.
- **Redis 7.0**: Functions, sharded pub/sub, and multi-part AOF — better performance and reliability.

## Features and Use Cases

These traits make Redis a fit for many workloads, including:

- **Caching**: keep frequently accessed data in Redis to speed up applications.
- **Session storage**: store user session data for distributed session management in web apps.
- **Leaderboards and counters**: sorted sets and counters power real-time rankings.
- **Message queues**: lists and streams work well as message queue systems.
- **Real-time analytics**: ingest and process live data for monitoring and analysis.
- **Geospatial indexing**: built-in geospatial support for location services and mapping.

By design, Redis plays an important role in modern software architecture — especially wherever data access must be fast and low-latency. These notes record the basic usage of Redis along with the capabilities and limits I have hit in real applications.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
