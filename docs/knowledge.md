# Knowledge Overview

This page gathers knowledge scattered across the body pages of the seven main parts onto one page: core concepts, key points from canonical books, key points from official documentation, application scenarios, and common pitfalls. Every item names its source page and links back to the original text; items that cannot be substantiated in a body page are marked "source unverified". The source-code analysis part follows the Redis 8.0 branch, and numbers marked "measured" in those pages come from a locally running instance; examples and configuration defaults are based on Redis 8.x (see [References](/appendix/references) for the conventions).

## Core concepts

### Data types and encodings

The nine data structures (string, hash, list, set, sorted set, bitmap, geospatial, HyperLogLog, stream) cover the vast majority of business shapes; see [Use cases overview](/use-cases/redis-use-cases) for a quick selection guide.

- Strings are binary safe, with a single-value limit of 512 MB; short strings use the embstr encoding (limit 44 bytes), where the object header and the SDS are allocated in the same block, and overly long strings switch to raw (see [String](/basics/string), [Core data structures](/advanced-topics/core-data-structures)).
- Redis uses SDS instead of C strings: the length field in the header makes strlen O(1), and preallocation plus lazy freeing reduce reallocations (see [Core data structures](/advanced-topics/core-data-structures)).
- The compact encoding listpack fully replaced ziplist as of 7.0, eliminating cascading updates at the structural level; encoding conversion is one-way — once a listpack is upgraded to hashtable/skiplist it never falls back, even if every element is deleted (see [Data structure implementation](/source-code-analysis/data-structures/implementation)).
- The zset skiplist encoding maintains a skiplist and a dictionary at the same time: the skiplist handles range queries and ranks (each level is promoted with 1/4 probability), the dictionary handles O(1) member-to-score lookups (see [Data structures and algorithms](/source-code-analysis/data-structures/implementation)).
- Dictionary resizing uses progressive rehashing: two tables coexist and each operation migrates one bucket along the way; `rehashidx == -1` means no rehash is in progress. The reverse binary iteration of `SCAN` guarantees no element is missed while the table grows or shrinks (see [Data structure implementation](/source-code-analysis/data-structures/implementation)).
- HyperLogLog estimates arbitrary cardinality in a fixed ~12 KB of memory with a standard error of about 0.81%; bitmap offsets top out at 2^32-1, and daily check-ins for 100 million users take about 12 MB; GEO sits on top of a sorted set whose score is a 52-bit integer encoded by GeoHash, so ZRANGE/ZREM work on it directly (see [HyperLogLog](/basics/hyperloglog/pfadd), [Bitmap](/basics/bitmap/setbit), [Geospatial](/basics/geospatial/geoadd)).

### Threading model

"Redis is single-threaded" holds only for command execution. A redis-server process contains four kinds of execution flows: the main thread, the bio background threads, persistence child processes, and optional I/O threads (see [Threading model](/source-code-analysis/multithreading/model)).

- The main thread runs the event loop, and `serverCron` does background work at the default `hz = 10` frequency; closing files, AOF fsync, and asynchronous release of large keys are handled by bio's three task queues (numbered 0/1/2) (see [Threading model](/source-code-analysis/multithreading/model)).
- I/O threads are disabled by default (`io-threads 1`) and in 6.x/7.x they are an immutable configuration that requires a restart to change; 8.0 refactored them into a per-thread event loop and removed `io-threads-do-reads` (see [Threading model](/source-code-analysis/multithreading/model)).
- BGSAVE and AOF rewrite go through fork + copy-on-write: the cost grows with write frequency, not with dataset size; `latest_fork_usec` reports the duration of the most recent fork (see [Multithreading](/source-code-analysis/multithreading)).
- Command path: `readQueryFromClient()` → `processInputBuffer()` → `processCommand()` → `call()` executes it, and `beforeSleep()` flushes replies with `writeToClient()` (see [Architecture overview](/source-code-analysis/architecture/overview)).

### Persistence

- RDB is a point-in-time snapshot with three default save rules (1 write in 900 seconds, 10 writes in 300 seconds, 10000 writes in 60 seconds); the loss window equals the snapshot interval, so `save 900 1` can lose about 15 minutes of data at worst. The file header is REDIS + a version number (12 for 8.0), and the tail is an 8-byte CRC64 (see [RDB snapshot](/advanced/rdb-snapshot), [RDB implementation](/source-code-analysis/persistence/rdb)).
- AOF records write commands; `appendfsync` has three levels: `always` (fsync every write), `everysec` (default, loses at most about 1 second), `no` (roughly once every 30 seconds). Since 7.0, multi-part AOF manages base, incr, and manifest as separate files, and `aof-use-rdb-preamble` defaults to yes (see [AOF log](/advanced/aof-log), [AOF implementation](/source-code-analysis/persistence/aof)).

### High availability and scaling

- Master-slave replication: on reconnect after a broken link, `PSYNC` resumes incrementally automatically, falling back to a full sync when the replication backlog is insufficient; replication itself carries no failover (see [Master-slave replication](/advanced/replication)).
- Sentinel uses quorum to declare subjective and objective down states and switches over automatically, but the data is still a single full copy; Cluster shards data across 16384 slots, solving horizontal scaling and high availability together (see [Sentinel mode](/advanced/sentinel), [FAQ](/appendix/faq)).
- Cluster key placement = CRC16(the effective part of the key) & 16383, and `{tag}` forces keys into the same slot; failure detection escalates from PFAIL to FAIL only when a majority of masters confirm it, and a replica takes over the slots after winning a majority vote, bumping the config epoch by 1 (see [Cluster implementation](/source-code-analysis/cluster/architecture)).
- The official recommendation is no more than 1000 masters, while production commonly runs a few dozen; when fewer than 50% of the masters remain, the cluster enters a fail state (see [Cluster mode](/advanced/cluster), [FAQ](/appendix/faq)).

### Memory and eviction

- The default allocator is jemalloc (measured: `jemalloc-5.3.0`); `maxmemory` defaults to 0 (unlimited) and the policy defaults to `noeviction` (writes fail with OOM) — with no configuration nothing is ever evicted (see [Memory management](/source-code-analysis/memory-management), [Memory optimization](/advanced/memory-optimization)).
- There are 8 eviction policies in total (noeviction, allkeys/volatile × lru/lfu/random, volatile-ttl); LRU/LFU metadata lives in the 24-bit fields of the object header (see [Memory optimization strategies](/source-code-analysis/memory-management/optimization)).
- `mem_fragmentation_ratio` = used_memory_rss / used_memory: above 1 usually means allocator fragmentation, below 1 means swap has happened (see [Memory management](/source-code-analysis/memory-management)).

### Scripting and transactions

- No other commands are interleaved while a Lua script runs — that is the entire source of its atomicity; scripts do not roll back, and writes already executed before a mid-script error remain in effect (see [Scripting introduction](/scripts/scripts-introduction)).
- There is no per-script timeout parameter: once a script runs past `busy-reply-threshold` (default 5000 ms) other clients get BUSY errors, and the only options are `SCRIPT KILL` (only if the script has not written data yet) or `SHUTDOWN NOSAVE` (see [Script execution principles](/scripts/execution-principles)).
- EVALSHA reuses the compiled cache via SHA1 — changing a single space in the body changes the checksum; when the script is not cached the server returns NOSCRIPT, and the client should catch it, SCRIPT LOAD again, and retry (see [EVALSHA](/scripts/lua/evalsha)).
- MULTI/EXEC queues commands and executes them consecutively with no other client's commands interleaved, but does not support rollback; a protocol-level parsing error drops the connection outright, while a semantic error only makes EXEC return EXECABORT (see [Command parsing](/source-code-analysis/command-processing/parsing), [FAQ](/appendix/faq)).

## Key points from canonical books

The book list lives on the [References](/appendix/references) page; the body pages do not cite chapters one by one, and the "Knowledge covered" column below takes its one-line positioning from the bibliography entry, without chapter-level details:

| Book | Author | Knowledge covered | On-site source |
| --- | --- | --- | --- |
| Redis Design and Implementation | Huang Jianhong | Walks through data structures, persistence, and cluster implementation via the source code; read alongside the source-code analysis part | [References](/appendix/references) |
| Redis in Depth: Core Principles and Practice | Qian Wenpin | Focuses on engineering practice and business scenarios, complementing the use-cases part | [References](/appendix/references) |
| Redis in Action | Josiah Carlson | The classic case-driven introduction | [References](/appendix/references) |
| Distributed Systems: Concepts and Design | Coulouris et al. | Background reading on replication, consistency, and consensus; the theory under the high-availability content of the advanced part | [References](/appendix/references) |

The Redlock algorithm comes from Redis's author Antirez (Salvatore Sanfilippo), who also created Redis itself in C in 2009 (see [Distributed locks](/use-cases/distributed-locks), [History and development](/basics/history-and-development)).

## Key points from official documentation (with links)

- [Official Redis documentation](https://redis.io/docs/latest/): the first stop for anything site-wide; the [command reference](https://redis.io/docs/latest/commands/) and the [configuration reference](https://redis.io/docs/latest/operate/oss_and_stack/management/config/) cover command semantics and defaults. Sources: [References](/appendix/references), [Command reference page](/appendix/command-reference).
- [RESP protocol specification](https://redis.io/docs/latest/develop/reference/protocol-spec/): the official word on RESP2/RESP3 type prefixes; the on-site comparison page is [Network protocol](/source-code-analysis/network-protocol/protocol-overview) (RESP3 prefixes such as null `_`, map `%`, push `>`).
- [Cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/): the official description of the 16384 slots and MOVED/ASK semantics (see [Cluster implementation](/source-code-analysis/cluster/architecture)).
- [Source repository](https://github.com/redis/redis): the reference for the source-code analysis part, following the 8.0 branch; [redismodule.h](https://raw.githubusercontent.com/redis/redis/8.0/src/redismodule.h), needed for module development, comes straight from the repository (see [Module implementation](/source-code-analysis/modules/implementation)).
- [Redis Modules API documentation](https://redis.io/docs/latest/develop/reference/modules/): the source of constraints such as module type names having to be exactly 9 characters (see [Module system](/source-code-analysis/modules/overview)).
- Tools: [RedisInsight](https://redis.io/redisinsight/) (official GUI client), [redis_exporter](https://github.com/oliver006/redis_exporter) (Prometheus export), [redis-rdb-tools](https://github.com/sripathikrishnan/redis-rdb-tools) (offline RDB parsing) (see [Monitoring tools](/operations/monitoring-tools)).
- Client libraries: for Java, [Jedis](https://github.com/xetorthio/jedis), [Lettuce](https://github.com/lettuce-core/lettuce-core), and [Redisson](https://github.com/redisson/redisson); for Python, [redis-py](https://github.com/redis/redis-py); for Go, [go-redis](https://github.com/go-redis/redis); for Node, [node-redis](https://github.com/redis/node-redis). The full list is on [Client libraries](/development/client-libraries).
- GeoHash encoding was proposed by Gustavo Niemeyer in 2008 (geohash.org), and Redis GEO commands encode latitude/longitude as 52-bit integers based on the idea (see [References](/appendix/references), [Geospatial](/basics/geospatial/geoadd)).
- There is no official Windows installer; use WSL or the community port [MicrosoftArchive/redis](https://github.com/microsoftarchive/redis/releases) (see [Installation on Windows](/basics/installation-on-windows)).

## Application scenarios

The how-to for each scenario lives in the [use-cases part](/use-cases/README) and the [development and integration part](/development/README); gathered here:

| Scenario | Core approach | Source |
| --- | --- | --- |
| Caching | Cache-Aside: on read miss, fetch from the store and fill the cache; on write, update the database first, then delete the cache entry. Penetration: short-TTL empty values or a Bloom filter; breakdown: mutex locks; avalanche: TTL with random jitter | [Caching](/use-cases/caching) |
| Sessions | Hash stores multiple fields + EXPIRE for sliding renewal (expires only after 30 idle minutes); session IDs are sufficiently long random strings, and passwords are stored only as salted slow hashes | [Session storage](/use-cases/session-storage), [Authentication and sessions](/use-cases/session-management/authentication) |
| Real-time analytics | UV counts via HyperLogLog (12 KB / 0.81% error); hot counters sharded as `stats:{date}:{0-9}` then summed | [Real-time analytics](/use-cases/real-time-analytics) |
| Message queues | Simple queue: LPUSH + BRPOP (pop deletes, no acknowledgement); reliable queue: Stream consumer groups + XACK + XPENDING/XCLAIM; delayed messages: poll a ZSET by timestamp | [Message queues](/use-cases/message-queues) |
| Leaderboards | ZADD + ZRANGE ... REV (since 6.2, `ZREVRANGE` is deprecated), rank queries are O(log N); tie-breaking by time encodes "score × large base + time complement" into a single double (precision is lost beyond 2^53) | [Leaderboards](/use-cases/leaderboards) |
| Counters and ID issuance | INCR/DECR are atomic within the single thread, no locks needed; batch ID issuance grabs segments with `INCRBY id:order 1000`; four rate-limiting strategies: fixed window, sliding window (ZSET), leaky bucket, token bucket | [Counters](/use-cases/counters), [Global ID](/use-cases/global-id), [Rate-limiting strategies](/use-cases/rate-limiting/strategies) |
| Check-ins | 365 bits per year (about 46 bytes); `BITOP AND` computes streaks and retention | [Check-ins](/use-cases/check-ins) |
| People nearby | GEOADD + GEOSEARCH; when polygon fences exceed GEO's abilities, switch to Tile38 | [Geospatial](/basics/geospatial/geoadd), [Tile38](/redis-compatible/tile38) |
| Distributed locks | SET NX EX acquires atomically, compare the holder before releasing; Redlock goes multi-instance with a majority, but carries inherent flaws such as clock drift and no reentrancy | [Distributed locks](/use-cases/distributed-locks) |
| Inventory deduction | Lua merges "read stock — check remaining — deduct" into one atomic operation, failing at 0 stock to prevent overselling | [Scripting introduction](/scripts/scripts-introduction) |

Reading paths, as needed: for cache consistency, start at [Cache strategies and practice](/use-cases/cache/strategies); for high availability, read [Master-slave replication](/advanced/replication) → [Sentinel mode](/advanced/sentinel) → [Cluster mode](/advanced/cluster) in order; for source code, start at [Architecture overview](/source-code-analysis/architecture/overview) and follow the command path, data structures, persistence, and cluster.

## Common pitfalls and misconceptions

### Commands and data types

| Pitfall | Facts and the right way | Source |
| --- | --- | --- |
| SET wipes the TTL | SET clears the existing expiry by default; add KEEPTTL explicitly to keep it | [SET](/basics/string/set) |
| Iterating with KEYS | O(N) and never yields the CPU mid-scan; with many keys it blocks every request; use SCAN to iterate | [Command optimization](/advanced/command-optimization) |
| SMEMBERS on large sets | Returns everything and blocks; use SSCAN to read incrementally | [SMEMBERS](/basics/set/smembers) |
| LPUSH argument order | With multiple values, the last argument ends up closest to the head — the reverse of writing order | [LPUSH](/basics/list/lpush) |
| Swapping lat/lng in GEOADD | The argument order is longitude first, latitude second — the opposite of how people say it | [GEOADD](/basics/geospatial/geoadd) |
| ZRANGE does not return the top rank | The default order is ascending — counter-intuitive for leaderboards; since 6.2, leaderboard queries go through ZRANGE with REV | [ZRANGE](/basics/zset/zrange) |
| SETBIT with a large offset | offset 100 million allocates about 12.5 MB in one go; split keys along sensible dimensions | [SETBIT](/basics/bitmap/setbit) |
| Deleting large keys synchronously | DEL blocks the main thread; use UNLINK to free in the background | [Optimization strategies](/source-code-analysis/performance/strategies) |
| GET on a list fails with WRONGTYPE | You get a type error, not nil; check with TYPE first | [GET](/basics/string/get) |
| HGET then HSET to change a numeric field | Concurrent writes between the two steps lose updates; change numbers with HINCRBY/HINCRBYFLOAT | [HINCRBY](/basics/hash/other-commands) |
| Mixing LPOP with and without count | The return shapes differ — single value vs array — and the client must handle both | [LPOP](/basics/list/lpop) |
| Blocking XREAD with $ | Entries written while blocked are skipped; for important cases, track the last-seen ID | [XREAD](/basics/streams/xread) |
| Exact MAXLEN in XADD | Can slow writes in the worst case; use approximate trimming with MAXLEN ~ in production | [XADD](/basics/streams/xadd) |
| Treating multi-key PFCOUNT as read-only | It may modify the internal representation while running; avoid it on read-only replicas | [PFCOUNT](/basics/hyperloglog/pfcount) |
| BITFIELD defaults to WRAP | Overflows wrap around; cap counters with OVERFLOW SAT | [BITFIELD](/basics/bitmap/other-commands) |

### Persistence and high availability

| Pitfall | Facts and the right way | Source |
| --- | --- | --- |
| Assuming RDB loses no data | The loss window equals the snapshot interval | [RDB snapshot](/advanced/rdb-snapshot) |
| Assuming BGSAVE is free | fork stalls briefly on instances with large memory, and the cost grows with write frequency | [Persistence](/advanced/persistence) |
| Assuming master-slave fails over automatically | Replication has no failover; you need Sentinel or Cluster | [Master-slave replication](/advanced/replication) |
| Sentinel cannot reach the primary | When the primary sets requirepass, `sentinel auth-pass` must be filled in | [Sentinel mode](/advanced/sentinel) |
| Expecting availability with half the masters down | With fewer than half the masters left, the cluster enters a fail state | [Cluster mode](/advanced/cluster) |
| Replica reads in cluster mode fail with MOVED | Issue READONLY before reading from a replica (plain master-slave does not need this) | [Sharding and replication](/source-code-analysis/cluster/sharding-replication) |
| Still using redis-trib.rb | Removed as of 5.0; use redis-cli --cluster | [High availability](/advanced/high-availability) |
| Trying to CONFIG SET io-threads | In 6.x/7.x it is an immutable config and fails with can't set immutable config; a restart is required | [Threading model](/source-code-analysis/multithreading/model) |

### Scripting and transactions

| Pitfall | Facts and the right way | Source |
| --- | --- | --- |
| Expecting scripts to roll back | Neither Lua nor MULTI/EXEC rolls back; validate arguments before writing | [Scripting introduction](/scripts/scripts-introduction) |
| Passing key names via ARGV | Works on a single instance, breaks on a cluster; declare keys through KEYS, always | [Script integration](/scripts/lua-redis-integration) |
| Writing math.random results in a script | Replicas end up inconsistent; generate random values on the client and pass them in via ARGV | [Script integration](/scripts/lua-redis-integration) |
| Calling print inside the sandbox | The Lua sandbox only opens seven libraries: string, table, math, cjson, cmsgpack, struct, bit; debug via return values | [Scripting appendix](/scripts/appendix) |
| Reading err straight off a pcall return | An empty result returns false, only an error returns a table carrying err; check the type before accessing | [Troubleshooting and debugging](/scripts/lua/troubleshooting) |
| EXPIRE only after INCR | A race sits between the two steps; the worst case is a key with no TTL. Add a fallback EXPIRE or merge in Lua | [Counters](/use-cases/counters) |
| EVALSHA hitting NOSCRIPT | Catch it, SCRIPT LOAD again, then retry | [EVALSHA](/scripts/lua/evalsha) |

### Caching and business logic

| Pitfall | Facts and the right way | Source |
| --- | --- | --- |
| Conflating penetration, breakdown, and avalanche | Penetration: querying non-existent data bypasses the cache; breakdown: a single hot key expires and a request flood hits the store; avalanche: many keys expire at once and overwhelm the database | [FAQ](/appendix/faq) |
| Deleting the cache before updating the database | The recommended Cache-Aside is "update the database first, then delete the cache"; on delete failure, push to a retry queue or fall back to a short TTL | [FAQ](/appendix/faq) |
| Storing session passwords as SHA-256 | Fast hashes are easy to brute-force; use salted slow hashes such as bcrypt, scrypt, or Argon2 | [Authentication and sessions](/use-cases/session-management/authentication) |
| Treating Redlock as a silver bullet | Four inherent flaws: clock drift, network latency, no reentrancy, and badly chosen expiry times | [Distributed locks](/use-cases/distributed-locks) |
| Ignoring a fragmentation ratio below 1 | It means swap has happened; check host memory first | [Memory management](/source-code-analysis/memory-management) |

### Compatibility and choosing alternatives

| Pitfall | Facts and the right way | Source |
| --- | --- | --- |
| Treating Pika or SSDB as a drop-in replacement | Lua, transactions, Stream, and Pub/Sub support is partial or semantically different; verify against the command list before migrating | [Pika](/redis-compatible/pika), [SSDB](/redis-compatible/ssdb) |
| Testing compatibility with only SET/GET | Validate with the command list of your real workload | [Open-source projects](/redis-compatible/open-source-projects) |
| Assuming Valkey and Redis stay fully in sync | From Valkey 8 on, each has its own new commands and configs; run compatibility checks before switching | [Valkey](/redis-compatible/valkey) |
| Assuming a proxy costs nothing | The proxy itself is a new single point of failure; evaluate operational complexity and failure modes | [Open-source projects](/redis-compatible/open-source-projects) |
| Still using RPOPLPUSH | Replaced by LMOVE as of 6.2 — pop and transfer in one step | [LMOVE](/basics/list/other-commands) |
| Treating the GEORADIUS family as current | Deprecated since 6.2; migrate to GEOSEARCH across the board | [GEOSEARCH](/basics/geospatial/other-commands) |
| Legacy SETNX/SETEX/PSETEX/GETSET | Their functionality is covered by SET's options; use SET with options in all new code | [SET](/basics/string/set) |
| Still using SLAVEOF | REPLICAOF is the standard as of 5.0; SLAVEOF is just a legacy alias | [Master-slave replication](/advanced/replication) |

## Sources and conventions

- **Body pages are the source**: for every knowledge point on this page, the page it links back to is its source; claims absent from the body pages are not included, and anything that cannot be traced is marked "source unverified".
- **Version conventions**: the source-code analysis part follows the Redis 8.0 branch; version-sensitive items (GETSET deprecated in 6.2, ZRANGE merged in 6.2, LMOVE/GEOSEARCH 6.2, ZADD GT/LT 6.2, listpack replacing ziplist in 7.0, multi-part AOF 7.0, Functions 7.0, SINTERCARD 7.0) carry their version numbers inline. Before using them across versions, verify with `COMMAND INFO` and the [command reference](https://redis.io/docs/latest/commands/).
- **Measured numbers**: figures marked "measured" in the source-code part (e.g. `COMMAND COUNT` 265, hz 10, plain PING at 55555 RPS, 200 SETs via pipeline dropping from 19.7ms to 1.9ms) were taken from a locally running instance; all other numbers follow the official documentation.
- **Trend conventions**: the [Future development](/advanced-topics/future-development) page is a trend-level description (e.g. Redis 8 vector sets); specific features are governed by the official release notes, and this page does not count them as formal knowledge points.
- **Books**: the four books are listed only on the references page; the body pages do not cite chapter details one by one, and the positioning in the table takes the references page's original wording.

## References

- [References](/appendix/references) — official docs, specifications, book list, and tools
- [FAQ](/appendix/faq) — quick answers on persistence, eviction, transactions, and the three big cache problems
- [Glossary](/appendix/glossary) — definitions for slot, COW, listpack, Redlock, and other terms
- Section entries: [Basics](/basics/README), [Scripting](/scripts/README), [Advanced](/advanced/README), [Development and integration](/development/README), [Operations and management](/operations/README), [Source-code analysis](/source-code-analysis/README), [Use cases](/use-cases/README), [Compatible projects](/redis-compatible/README)
