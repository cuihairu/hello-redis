# Redis生态系统

围绕核心 Redis，社区形成了包含模块、客户端、工具、代理、兼容实现在内的完整生态。

## 1. Redis 官方模块（Redis Stack / RedisBloom 等）

Redis 通过模块 API 扩展了核心不具备的数据类型，较成熟的模块包括：

- **RedisJSON**：`JSON.SET`/`JSON.GET` 的文档型存储，支持 JSONPath 查询；
- **RediSearch**：倒排索引与全文检索，支持中文分词扩展、地理与向量查询；
- **RedisTimeSeries**：时序数据的写入、降采样与降频聚合；
- **RedisBloom**：布隆过滤器、Cuckoo 过滤器、Top-K、Count-Min Sketch；
- **RedisGears**：服务端事件驱动的计算编排（现称 RedisGears 2）。

这些能力原先打包为 Redis Stack 发布（也可单独编译为模块）；自 Redis 8.0 起，多数模块代码已随开源版本一起发布。加载方式：

```bash
# redis.conf 或启动参数
loadmodule /path/to/libredisearch.so
redis-server --loadmodule /path/to/libredisearch.so
```

## 2. 模块开发

使用 Redis Modules API（C 语言，另有其他语言封装）可以自定义命令与数据类型：

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

## 3. 客户端库

各语言的成熟客户端：Python 的 `redis-py`、Java 的 Jedis/Lettuce/Spring Data Redis、Go 的 go-redis、Node.js 的 node-redis/ioredis、C 的 hiredis 等，详见[客户端库](../development/client-libraries.md)。

## 4. 代理与分片

- **Twemproxy（nutcracker）**：Twitter 开源的 Redis/Memcached 代理，客户端协议兼容，减少连接数；
- **Codis**：豌豆荚开源的 Redis 集群代理方案，提供自动分片与迁移；
- **Redis Cluster 自身**：官方分片方案，客户端需支持集群协议（或使用代理简化客户端）。

## 5. 监控与运维工具

- **redis_exporter + Prometheus + Grafana**：指标采集与可视化；
- **RedisInsight**：官方 GUI 客户端，支持浏览键、分析慢查询、集群视图；
- **rdb 工具**（rdb_tools）：离线解析 RDB 文件，统计内存分布；
- **redis-cli 自带工具**：`redis-cli --stat`、`--hotkeys`、`--memkeys`、`MEMORY DOCTOR`。

## 6. 兼容实现

KeyDB、Valkey、Dragonfly、Pika、SSDB 等项目在协议或 API 层与 Redis 兼容，可按需选型，详见[其他兼容Redis的开源项目](../redis-compatible/README.md)。

## 小结

选型时建议分三层考虑：核心缓存/队列需求直接用原生 Redis + 成熟客户端；扩展数据类型优先使用模块；规模或成本驱动时再评估兼容实现与代理方案。
