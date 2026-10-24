# What is Redis

Redis (Remote Dictionary Server) is an open-source, in-memory data structure store, known for its performance, high availability, and rich data structures. It is commonly used as a cache, a database, and a message broker, and shows up widely in any scenario that needs fast data access.

## Main features

1. **In-memory storage**:
   - Redis keeps data in memory, which is what gives it extremely fast read and write speeds. The primary data store is memory, but Redis also supports persisting data to disk so nothing is lost.

2. **Rich data structures**:
   - Redis supports a range of data structures, including:
     - **String**: the basic key-value structure.
     - **Hash**: a collection of field-value pairs, useful for modeling objects.
     - **List**: an ordered collection of strings, insertable and removable from both ends.
     - **Set**: an unordered collection of strings with no duplicate elements.
     - **Sorted Set**: a collection of strings with weights, orderable by weight.
     - **Bitmap**: efficient storage and manipulation of bit arrays.
     - **Geospatial data**: storing and querying geographic locations.
     - **HyperLogLog**: an algorithm for cardinality estimation — counting distinct elements.
     - **Stream**: a structure for processing data and event streams.

3. **High performance**:
   - Redis handles millions of operations per second. Its single-threaded model, built on an event-driven loop, is how it reaches that level of performance.

4. **Persistence**:
   - Redis offers several persistence mechanisms, including:
     - **RDB (snapshots)**: periodically save a snapshot of the data to disk.
     - **AOF (append-only file)**: log every write operation so data can be replayed on recovery.

5. **High availability**:
   - Redis supports master-slave replication, the Sentinel mechanism, and Cluster mode, providing data redundancy and high availability.

6. **Transaction support**:
   - Redis supports transactions, achieving atomic execution of multiple commands through the `MULTI`, `EXEC`, `DISCARD`, and `WATCH` commands.

7. **Publish/subscribe**:
   - Redis supports the pub/sub pattern, allowing messages to be broadcast to and received by multiple clients.

8. **Script support**:
   - Redis can run Lua scripts for complex operations, which adds a lot of flexibility.

## Use cases

1. **Caching**:
   - Redis is widely used as a cache, storing frequently accessed data to improve application response times.

2. **Session storage**:
   - In web applications, Redis can store user session data for distributed session management.

3. **Leaderboards**:
   - Redis sorted sets are a natural fit for building real-time leaderboards.

4. **Message queues**:
   - Redis lists and streams work well as message queues and task scheduling systems.

5. **Real-time analytics**:
   - Redis can process and analyze data in real time, for example for live monitoring and data aggregation.

6. **Geospatial applications**:
   - Redis geospatial indexing supports location-based services such as location tracking and place search.

Redis's design makes it excellent in many high-performance, high-availability workloads, and it is an indispensable part of modern software architecture.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
