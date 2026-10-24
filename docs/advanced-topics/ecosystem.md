# Redis ecosystem

Around the core Redis, the community has grown a complete ecosystem including modules, clients, tools, proxies, and compatible implementations.

## 1. Official Redis modules (Redis Stack / RedisBloom, etc.)

Through the module API, Redis extends the data types that the core does not have. The more mature modules include:

- **RedisJSON**: document-oriented storage with `JSON.SET`/`JSON.GET`, supporting JSONPath queries;
- **RediSearch**: inverted indexes and full-text search, supporting Chinese word segmentation extensions, geo, and vector queries;
- **RedisTimeSeries**: writing, downsampling, and low-frequency aggregation of time-series data;
- **RedisBloom**: Bloom filters, Cuckoo filters, Top-K, and Count-Min Sketch;
- **RedisGears**: server-side event-driven compute orchestration (now called RedisGears 2).

These capabilities were originally released as part of Redis Stack (and can also be compiled as standalone modules); from Redis 8.0 on, most module code has been released together with the open-source version. How to load them:

```bash
# redis.conf or startup arguments
loadmodule /path/to/libredisearch.so
redis-server --loadmodule /path/to/libredisearch.so
```

## 2. Module development

Using the Redis Modules API (C, with wrappers in other languages) you can define your own commands and data types:

```c
#include "redismodule.h"
int HelloCommand(RedisModuleCtx *ctx, RedisModuleString **argv, int argc) {
    RedisModule_ReplyWithSimpleString(ctx, "Hello");
    return REDISMODULE_OK;
}
int RedisModule_OnLoad(RedisModuleCtx *ctx, RedisModuleString **argv, int argc) {
    if (RedisModule_Init(ctx, "hello", 1, REDISMODULE_APIVER_1) == REDISMODULE_ERR)
        return REDISMODULE_ERR;
    RedisModule_CreateCommand(ctx, "hello.say", HelloCommand, "readonly", 1, 1, 1);
    return REDISMODULE_OK;
}
```

## 3. Client libraries

Mature clients in each language: `redis-py` for Python, Jedis/Lettuce/Spring Data Redis for Java, go-redis for Go, node-redis/ioredis for Node.js, hiredis for C, and so on. See [Client libraries](../development/client-libraries.md) for details.

## 4. Proxies and sharding

- **Twemproxy (nutcracker)**: a Redis/Memcached proxy open-sourced by Twitter, protocol-compatible with clients, reducing the number of connections;
- **Codis**: a Redis cluster proxy solution open-sourced by Wandoujia, providing automatic sharding and migration;
- **Redis Cluster itself**: the official sharding solution; clients must support the cluster protocol (or use a proxy to simplify the client).

## 5. Monitoring and operations tools

- **redis_exporter + Prometheus + Grafana**: metrics collection and visualization;
- **RedisInsight**: the official GUI client, supporting key browsing, slow query analysis, and a cluster view;
- **rdb tools** (rdb_tools): offline parsing of RDB files, statistics on memory distribution;
- **Tools built into redis-cli**: `redis-cli --stat`, `--hotkeys`, `--memkeys`, `MEMORY DOCTOR`.

## 6. Compatible implementations

Projects such as KeyDB, Valkey, Dragonfly, Pika, and SSDB are compatible with Redis at the protocol or API level; you can choose based on your needs. See [Other open-source projects compatible with Redis](../redis-compatible/README.md) for details.

## Summary

When choosing, consider it in three layers: for core cache/queue needs, use plain Redis + a mature client; for extended data types, prefer modules; and when scale or cost is the driver, evaluate compatible implementations and proxy solutions.

## References

- [Redis source repository](https://github.com/redis/redis)
- [Redis development docs · use cases](https://redis.io/docs/latest/develop/use-cases/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
