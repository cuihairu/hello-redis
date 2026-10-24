# Source Code Analysis Overview

## Overview

These notes trace the core implementation through the Redis 7.x/8.x source. Redis is a high-performance in-memory key-value database, and many of its design trade-offs leave clues in how the code is organized. The notes cover data structures, command processing, persistence, and memory management, for reference when I use, tune, or customize Redis.

Everything in this chapter is analyzed against the Redis source. The main source file paths involved include `src/server.c`, `src/networking.c`, `src/ae.c`, `src/dict.c`, `src/sds.c`, `src/rdb.c`, `src/aof.c`, `src/zmalloc.c`, `src/t_zset.c`, `src/listpack.c`, `src/quicklist.c`, and `src/object.c`.

## Core Topics

Ten topics are organized so far:

**1. Architecture**
- Redis's overall design philosophy and core components
- The single-threaded command execution model and event-driven mechanism
- How the network layer cooperates with the core server loop

**2. Command Processing**
- The flow of command parsing, lookup, validation, and execution
- The RESP (REdis Serialization Protocol) implementation
- Command table and command attribute management

**3. Data Structures**
- The design and role of the Redis object (robj) system
- Underlying implementations of strings, hashes, lists, sets, sorted sets, and other types
- Efficient memory designs (SDS, dict, listpack, quicklist, skiplist, intset, etc.)

**4. Persistence**
- The RDB snapshot generation, save, and load mechanisms
- The AOF (Append-Only File) append, rewrite, and recovery process
- Features such as mixed RDB-AOF persistence

**5. Memory Management**
- The Redis memory allocator (zmalloc) implementation
- The `maxmemory` limit and eviction policies
- Memory statistics, defragmentation, and optimization techniques

**6. Multi-threading**
- The design principle that command execution remains single-threaded
- I/O threads parallelizing network read/write
- Background threads (bio threads) handling persistence, async free, and similar tasks

**7. Network Protocol**
- The RESP2 and RESP3 protocol formats and their differences
- Parsing client requests and serializing responses
- Protocol negotiation (the `HELLO` command) implementation details

**8. Modules**
- The Redis module system extension mechanism
- Module command registration and lifecycle management
- Interaction with the core API

**9. Cluster**
- Redis Cluster topology and sharding mechanisms
- Hash slot allocation and resharding
- Basic implementation ideas for failure detection, failover, and data migration

**10. Performance**
- The design trade-offs behind Redis's high performance
- Event loop, system calls, and latency optimization
- Performance monitoring metrics and tuning directions

## Page Organization

Pages are split by topic:

- **Top-level files** (such as `architecture.md`, `command-processing.md`): give an overview of the topic as a chapter introduction plus several numbered sections, for quick orientation.
- **Subdirectory files** (such as `architecture/overview.md`, `command-processing/parsing.md`): dive into specific flows and implementation points, with source file paths and key functions for low-level detail.

I usually start from each topic's top-level page to locate an issue, then look up the corresponding detailed implementation. Pages use a similar structure and try to preserve source paths, key functions, and reproducible observations.

## References

- [Redis source repository](https://github.com/redis/redis)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
