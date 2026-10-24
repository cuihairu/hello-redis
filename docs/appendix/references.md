# References

## Official docs and sites

- Redis official documentation: <https://redis.io/docs/latest/>
- Command reference: <https://redis.io/docs/latest/commands/>
- Configuration reference: <https://redis.io/docs/latest/operate/oss_and_stack/management/config/>
- Source repository: <https://github.com/redis/redis>
- Redis module API docs: <https://redis.io/docs/latest/develop/reference/modules/>

## Specifications and protocols

- RESP protocol specification: <https://redis.io/docs/latest/develop/reference/protocol-spec/>
- Redis cluster specification (Cluster Spec): <https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/>
- GeoHash encoding: proposed by Gustavo Niemeyer in 2008 (geohash.org); the Redis GEO commands are based on its idea, encoding latitude/longitude as a 52-bit integer

## Books

- "Redis Design and Implementation" — Huang Jianhong: uses the source code as a thread to walk through data structures, persistence and cluster implementation.
- "Redis in Depth: Core Principles and Practical Application" — Qian Wenpin: focuses on engineering practice and business scenarios.
- "Redis in Action" — Josiah Carlson: a classic, example-driven introduction.
- "Distributed Systems: Concepts and Design" — Coulouris et al.: background reading on replication, consistency and consensus.

## Community and blogs

- Redis official blog: <https://redis.io/blog/>
- Redis Chinese community and tutorial sites (such as redis.cn, external link): Chinese translations of commands and configuration, for reference.
- Issue trackers and discussion boards of the official client libraries (go-redis, redis-py, node-redis, Lettuce, Jedis, etc.): first-hand material on common compatibility issues.

## Conferences and videos

- Recorded talks from past editions of RedisConf, the official annual Redis conference.
- Talks at QCon, ArchSummit and similar conferences on Redis cluster governance, big-key governance and cache architecture.

## Practical tools

- RedisInsight: official GUI client <https://redis.io/redisinsight/>
- redis_exporter: Prometheus metrics collection <https://github.com/oliver006/redis_exporter>
- rdb_tools: offline parsing of RDB files and memory statistics <https://github.com/sripathikrishnan/redis-rdb-tools>

Note: external links change as versions evolve; defer to the current content on the official Redis site. The examples in these notes are verified against Redis 8.x.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [knowledge](/knowledge.md)
