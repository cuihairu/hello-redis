# Redis Command Reference

Below are common commands organized by category (based on Redis 7/8). For full parameter details, see the [official command docs](https://redis.io/docs/latest/commands/). Trying commands in `redis-cli` is the most direct way to learn them.

## Connection and Server

| Command | Description |
| --- | --- |
| `AUTH [username] password` | Authentication (ACL username optional) |
| `PING [message]` | Connectivity test |
| `SELECT index` | Switch database (0-15) |
| `INFO [section]` | Server status information |
| `CONFIG GET/SET parameter [value]` | View / set configuration |
| `DBSIZE` | Number of keys in the current database |
| `FLUSHDB [ASYNC]` | Flush the current database (async execution optional) |
| `KEYS pattern` | Pattern-match keys (disabled in production; use `SCAN`) |
| `SCAN cursor [MATCH p] [COUNT n]` | Incremental key traversal |
| `EXISTS key` / `TYPE key` / `TTL key` | Whether the key exists / type / remaining TTL |
| `EXPIRE key seconds` / `PERSIST key` | Set expiry / remove expiry |
| `RENAME key newkey` / `DEL key` | Rename / delete |
| `DUMP key` / `RESTORE key ttl payload` | Serialize and export / import |
| `OBJECT ENCODING key` | View the key's underlying encoding |

## String

| Command | Description |
| --- | --- |
| `SET key value [EX s\|PX ms] [NX\|XX]` | Set the key's value, optionally with expiry and conditions |
| `GET key` | Get the value |
| `SETNX key value` | Set only if the key does not exist (deprecated since 2.6.12; use `SET ... NX`) |
| `GETSET key value` | Get the old value and set the new value (deprecated since 6.2; use `SET key value GET`) |
| `MSET k1 v1 k2 v2` / `MGET k1 k2` | Batch set / get |
| `INCR key` / `DECR key` | Atomic increment / decrement |
| `INCRBY key n` / `INCRBYFLOAT key f` | Increment by a step / by a float |
| `APPEND key value` | Append |
| `STRLEN key` | Length |
| `GETRANGE key s e` / `SETRANGE key offset v` | Substring read / write |
| `SETBIT key offset v` / `GETBIT key offset` | Bit operations |
| `BITCOUNT key [BYTE\|BIT]` | Count set bits |
| `BITOP AND\|OR\|XOR\|NOT dest key...` | Bitwise operations |
| `GETEX key [EX s]` | Get the value and set / query expiry |

## Hash

| Command | Description |
| --- | --- |
| `HSET key field value [field value ...]` | Set one or more fields |
| `HGET key field` / `HMGET key f1 f2` | Get field(s) |
| `HGETALL key` | All field values (use with care on large hashes) |
| `HDEL key field [field ...]` | Delete field(s) |
| `HINCRBY key field n` | Atomic field increment |
| `HLEN key` / `HEXISTS key field` | Field count / whether it exists |
| `HKEYS key` / `HVALS key` | All fields / all values |
| `HSCAN cursor [MATCH p] [COUNT n]` | Incremental hash traversal |

## List

| Command | Description |
| --- | --- |
| `LPUSH key v1 v2` / `RPUSH key v1 v2` | Left / right push |
| `LPOP key` / `RPOP key` | Left / right pop |
| `LLEN key` | Length |
| `LRANGE key start stop` | Range read |
| `LINDEX key index` / `LSET key i v` | Read / write by index |
| `BLPOP key timeout` / `BRPOP key timeout` | Blocking pop (queue consumption) |
| `LREM key count value` | Delete specified elements |
| `LTRIM key start stop` | Trim to keep a range (length-limited queue) |

## Set and Sorted Set

| Command | Description |
| --- | --- |
| `SADD key m1 m2` / `SREM key m1` | Add / remove members |
| `SMEMBERS key` / `SISMEMBER key m` | All members / check membership |
| `SCARD key` | Member count |
| `SINTER k1 k2` / `SUNION k1 k2` / `SDIFF k1 k2` | Intersection / union / difference |
| `SINTERCARD n k1 k2 [LIMIT n]` | Intersection cardinality (7.0+) |
| `SRANDMEMBER key [count]` | Random members (without removing) |
| `SPOP key [count]` | Random members and remove them |
| `SSCAN key cursor` | Incremental traversal |
| `ZADD key score m [score m ...]` | Add / update member scores |
| `ZINCRBY key n member` | Increment score |
| `ZSCORE key m` / `ZREVRANK key m` | Score / reverse rank |
| `ZRANGE key s e [WITHSCORES] [REV]` | Fetch by rank (ascending / descending; since 6.2 `ZREVRANGE` is deprecated, use the `REV` option) |
| `ZRANGE key max min BYSCORE REV` | Fetch by score range (descending; since 6.2 `ZREVRANGEBYSCORE` is deprecated) |
| `ZCOUNT key min max` | Count by score range |
| `ZREM key m` / `ZCARD key` | Remove / member count |
| `ZINTERSTORE/ZUNIONSTORE dest n k1 k2` | Store the result of a set operation |

## General, Scripting, and Transactions

| Command | Description |
| --- | --- |
| `MULTI ... EXEC / DISCARD` | Transactions (commands are queued and then executed atomically) |
| `WATCH key ...` | Watch keys before a transaction (optimistic locking) |
| `EVAL script numkeys key... arg...` | Execute a Lua script |
| `EVALSHA sha numkeys ...` | Execute a script by SHA |
| `SCRIPT LOAD/EXISTS/FLUSH` | Script cache management |
| `FUNCTION LOAD/FCALL/FUNCTION LIST` | Server-side functions (7.0+) |
| `PUBLISH channel message` / `SUBSCRIBE ch...` | Publish / subscribe |
| `UNLINK key` | Asynchronous delete (recommended for large keys) |

## Geospatial and Cardinality Estimation

| Command | Description |
| --- | --- |
| `GEOADD key lon lat m [lon lat m ...]` | Add coordinates |
| `GEOSEARCH key FROMLONLAT lon lat BYRADIUS r unit` | Nearby search |
| `GEODIST key m1 m2 [unit]` | Distance between two points |
| `GEOPOS key m` | Member coordinates |
| `PFADD key m1 m2` / `PFCOUNT key` | HyperLogLog add / cardinality estimate |
| `PFMERGE dest k1 k2` | Merge HyperLogLogs |

## Stream

| Command | Description |
| --- | --- |
| `XADD key * field value ... [MAXLEN n]` | Append a message |
| `XRANGE key start end` | Read by ID range |
| `XREAD [COUNT n] [BLOCK ms] STREAMS key id` | Read messages |
| `XGROUP CREATE key group id` | Create a consumer group |
| `XREADGROUP GROUP g c COUNT n STREAMS key >` | Consume within a group |
| `XACK key group id` | Acknowledge a message |
| `XPENDING key group` | List pending messages |
| `XLEN key` / `XTRIM key MAXLEN n` | Length / trim |

## Cluster and Operations

| Command | Description |
| --- | --- |
| `CLUSTER INFO` / `CLUSTER NODES` | Cluster status / nodes |
| `CLUSTER SLOTS` | Slot distribution (deprecated since 7.0; new clients use `CLUSTER SHARDS`) |
| `SLOWLOG GET n` | Slow queries |
| `LATENCY LATEST/HISTORY event` | Latency monitoring |
| `MEMORY USAGE key` | Estimate key memory usage |
| `MONITOR` | Real-time command stream (for debugging) |

A practical tip to go with the quick reference: typing `COMMAND INFO <command>` in `redis-cli` shows the argument count and documentation, while `COMMAND DOCS <command>` outputs the full documentation (7.0+).

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis command index](https://redis.io/docs/latest/commands/)

## Related pages

- [README](README.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [knowledge](/knowledge.md)
