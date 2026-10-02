# 参考文献

## 官方文档与站点

- Redis 官方文档：<https://redis.io/docs/latest/>
- 命令参考：<https://redis.io/docs/latest/commands/>
- 配置项参考：<https://redis.io/docs/latest/operate/oss_and_stack/management/config/>
- 源码仓库：<https://github.com/redis/redis>
- Redis 模块 API 文档：<https://redis.io/docs/latest/develop/reference/modules/>

## 规范与协议

- RESP 协议说明：<https://redis.io/docs/latest/develop/reference/protocol-spec/>
- Redis 集群规范（Cluster Spec）：<https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/>
- GeoHash 编码：由 Gustavo Niemeyer 于 2008 年提出（geohash.org），Redis GEO 命令基于其思想对经纬度做 52 位整数编码

## 书籍

- 《Redis 设计与实现》—— 黄健宏：以源码为线索讲解数据结构、持久化与集群实现。
- 《Redis 深度历险：核心原理与应用实践》—— 钱文品：侧重工程应用与业务场景。
- 《Redis 实战》（Redis in Action）—— Josiah Carlson：以案例驱动的经典入门书。
- 《分布式系统：概念与设计》—— Coulouris 等：理解复制、一致性与共识的背景读物。

## 社区与博客

- Redis 官方博客：<https://redis.io/blog/>
- Redis 中文社区与教程站点（如 redis.cn）：命令与配置的中文翻译参考。
- 各客户端库的官方仓库（go-redis、redis-py、node-redis、Lettuce、Jedis 等）的 issue 与讨论区：常见兼容性问题的第一手资料。

## 大会与视频

- RedisConf（Redis 官方年度大会）的历届演讲录像。
- QCon、ArchSummit 等会议中关于 Redis 集群治理、大 key 治理、缓存架构的分享。

## 实用工具

- RedisInsight：官方 GUI 客户端 <https://redis.io/redisinsight/>
- redis_exporter：Prometheus 指标采集 <https://github.com/oliver006/redis_exporter>
- rdb_tools：离线解析 RDB 统计内存 <https://github.com/sripathikrishnan/redis-rdb-tools>

提示：外部链接会随版本演进变化，请以 Redis 官方站点当前内容为准；本书示例基于 Redis 8.x 验证。
