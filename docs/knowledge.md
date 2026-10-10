# 知识点总纲

本页把散在七大部分正文页的知识收拢成一页：核心概念、权威书籍要点、官方文档要点、应用场景、常见坑。每条标注来源页并链接回原文，正文页查无实据的条目标「来源未考」。源码分析篇以 Redis 8.0 分支为准，页内标「实测」的数字来自本机运行实例；示例与配置默认值基于 Redis 8.x（口径见[参考文献](/appendix/references)）。

## 核心概念

### 数据类型与编码

九种数据结构（字符串、哈希、列表、集合、有序集合、位图、地理空间、HyperLogLog、流）覆盖绝大多数业务形状，选型速查见[使用场景总览](/use-cases/redis-use-cases)。

- 字符串二进制安全，单值上限 512 MB；短字符串用 embstr 编码（上限 44 字节），对象头与 SDS 同块分配，超长转 raw（见[字符串](/basics/string)、[核心数据结构](/advanced-topics/core-data-structures)）。
- Redis 不用 C 字符串而用 SDS：头部长度字段让 strlen 成 O(1)，预分配与惰性释放减少重分配（见[核心数据结构](/advanced-topics/core-data-structures)）。
- 紧凑编码 listpack 自 7.0 起全面取代 ziplist，从结构上消除级联更新；编码切换是单向的，listpack 升到 hashtable/skiplist 后即使删光元素也不回退（见[数据结构实现](/source-code-analysis/data-structures/implementation)）。
- zset 的 skiplist 编码同时维护跳表与字典：跳表管范围查询与排名（每层 1/4 概率升层），字典管成员到分数的 O(1) 查询（见[数据结构与算法](/source-code-analysis/data-structures/implementation)）。
- 字典扩容用渐进式 rehash：两表并存、每次操作顺带迁一个桶，`rehashidx == -1` 表示不在 rehash 中；`SCAN` 的反向二进制迭代保证扩缩容途中不漏元素（见[数据结构实现](/source-code-analysis/data-structures/implementation)）。
- HyperLogLog 固定约 12 KB 内存估算任意基数，标准误差约 0.81%；位图 offset 上限 2^32-1，1 亿用户每日签到约 12 MB；GEO 底层是有序集合，分数是 GeoHash 编码的 52 位整数，可以直接用 ZRANGE/ZREM 操作（见[HyperLogLog](/basics/hyperloglog/pfadd)、[位图](/basics/bitmap/setbit)、[地理空间](/basics/geospatial/geoadd)）。

### 线程模型

「Redis 是单线程的」只对命令执行成立。一个 redis-server 进程含四类执行流：主线程、bio 后台线程、持久化子进程、可选 I/O 线程（见[线程模型](/source-code-analysis/multithreading/model)）。

- 主线程跑事件循环，`serverCron` 以默认 `hz = 10` 的频率做后台工作；关文件、AOF fsync、大键异步释放由 bio 的三条任务队列承担（编号 0/1/2）（见[线程模型](/source-code-analysis/multithreading/model)）。
- I/O 线程默认关闭（`io-threads 1`），6.x/7.x 里是重启才能改的不可变配置；8.0 重构为每线程独立事件循环并移除 `io-threads-do-reads`（见[线程模型](/source-code-analysis/multithreading/model)）。
- BGSAVE 与 AOF 重写走 fork + 写时复制，成本随写入频率涨、不随数据集大小涨；`latest_fork_usec` 可查最近一次 fork 耗时（见[多线程](/source-code-analysis/multithreading)）。
- 命令链路：`readQueryFromClient()` → `processInputBuffer()` → `processCommand()` → `call()` 执行，`beforeSleep()` 里用 `writeToClient()` 刷出（见[架构概述](/source-code-analysis/architecture/overview)）。

### 持久化

- RDB 是时间点快照，默认三条 save 规则（900 秒 1 写、300 秒 10 写、60 秒 10000 写）；丢失窗口等于快照间隔，`save 900 1` 最坏丢约 15 分钟数据。文件头是 REDIS + 版本号（8.0 为 12），尾 8 字节 CRC64（见[RDB 快照](/advanced/rdb-snapshot)、[RDB 实现](/source-code-analysis/persistence/rdb)）。
- AOF 记写命令，`appendfsync` 三档：`always` 每次同步、`everysec`（默认，最多丢约 1 秒）、`no`（约 30 秒一次）；7.0 起 multi-part AOF 把 base、incr、manifest 分文件管理，`aof-use-rdb-preamble` 默认 yes（见[AOF 日志](/advanced/aof-log)、[AOF 实现](/source-code-analysis/persistence/aof)）。

### 高可用与扩展

- 主从复制：断线重连自动 `PSYNC` 增量续传，复制积压缓冲区不够就退化为全量同步；复制本身不带故障转移（见[主从复制](/advanced/replication)）。
- 哨兵用 quorum 判主客观下线并自动切换，但数据仍是单份全量；集群用 16384 个槽做分片，同时解决水平扩展与高可用（见[哨兵模式](/advanced/sentinel)、[常见问题](/appendix/faq)）。
- 集群键归属 = CRC16(key 有效部分) & 16383，`{tag}` 可强制同槽；故障判定从 PFAIL 升级到 FAIL 需多数主节点确认，副本获多数派投票后接管槽、配置纪元 +1（见[集群实现](/source-code-analysis/cluster/architecture)）。
- 官方建议主节点不超过 1000 个，生产常见几十个；主节点数低于 50% 时集群进入故障状态（见[集群模式](/advanced/cluster)、[常见问题](/appendix/faq)）。

### 内存与淘汰

- 默认分配器 jemalloc（实测 `jemalloc-5.3.0`）；`maxmemory` 默认 0（不限制）、策略默认 `noeviction`（写报 OOM），不配置就根本不淘汰（见[内存管理](/source-code-analysis/memory-management)、[内存优化](/advanced/memory-optimization)）。
- 淘汰策略共 8 种（noeviction、allkeys/volatile × lru/lfu/random、volatile-ttl）；LRU/LFU 元数据存在对象头的 24 位字段里（见[内存优化策略](/source-code-analysis/memory-management/optimization)）。
- `mem_fragmentation_ratio` = used_memory_rss / used_memory：大于 1 多是分配器碎片，小于 1 说明发生了 swap（见[内存管理](/source-code-analysis/memory-management)）。

### 脚本与事务

- Lua 脚本执行期间不插入其他命令，这是原子性的全部来源；脚本不回滚，中途出错已执行的写命令照旧生效（见[脚本功能介绍](/scripts/scripts-introduction)）。
- 脚本没有单脚本超时参数：跑满 `busy-reply-threshold`（默认 5000 毫秒）后其他客户端收到 BUSY 错误，只能 `SCRIPT KILL`（脚本尚未写过数据时）或 `SHUTDOWN NOSAVE`（见[脚本执行原理](/scripts/execution-principles)）。
- EVALSHA 用 SHA1 复用编译缓存，内容改一个空格校验和就变；未缓存时返回 NOSCRIPT，客户端应捕获并重新 SCRIPT LOAD 再重试（见[EVALSHA](/scripts/lua/evalsha)）。
- MULTI/EXEC 排队连续执行、期间不插入他人命令，但不支持回滚；协议层解析错误直接断连，语义错误只让 EXEC 返回 EXECABORT（见[命令解析](/source-code-analysis/command-processing/parsing)、[常见问题](/appendix/faq)）。

## 权威书籍要点

书目集中在[参考文献](/appendix/references)一页，正文页没有逐条引用章节，表中「对应知识点」取书目页的一句定位，未引章节细节：

| 书名 | 作者 | 对应知识点 | 站内出处 |
| --- | --- | --- | --- |
| 《Redis 设计与实现》 | 黄健宏 | 以源码为线索讲解数据结构、持久化与集群实现，与源码分析篇互为对照 | [参考文献](/appendix/references) |
| 《Redis 深度历险：核心原理与应用实践》 | 钱文品 | 侧重工程应用与业务场景，与使用场景篇互补 | [参考文献](/appendix/references) |
| 《Redis 实战》（Redis in Action） | Josiah Carlson | 案例驱动的经典入门书 | [参考文献](/appendix/references) |
| 《分布式系统：概念与设计》 | Coulouris 等 | 复制、一致性与共识的背景读物，进阶篇高可用内容的理论底座 | [参考文献](/appendix/references) |

Redlock 算法出自 Redis 作者 Antirez（Salvatore Sanfilippo），Redis 本身也是他 2009 年用 C 创建的（见[分布式锁](/use-cases/distributed-locks)、[历史与发展](/basics/history-and-development)）。

## 官方文档要点（带链接）

- [Redis 官方文档](https://redis.io/docs/latest/)：全站口径的第一落点；[命令参考](https://redis.io/docs/latest/commands/)与[配置项参考](https://redis.io/docs/latest/operate/oss_and_stack/management/config/)覆盖命令语义与默认值。出处：[参考文献](/appendix/references)、[命令参考页](/appendix/command-reference)。
- [RESP 协议说明](https://redis.io/docs/latest/develop/reference/protocol-spec/)：RESP2/RESP3 类型前缀的官方口径；站内对照页在[网络协议](/source-code-analysis/network-protocol/protocol-overview)（RESP3 的 null `_`、map `%`、push `>` 等前缀）。
- [集群规范](https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/)：16384 槽与 MOVED/ASK 语义的官方说明（见[集群实现](/source-code-analysis/cluster/architecture)）。
- [源码仓库](https://github.com/redis/redis)：源码分析篇的对照对象，以 8.0 分支为准；模块开发需要的 [redismodule.h](https://raw.githubusercontent.com/redis/redis/8.0/src/redismodule.h) 直接从仓库取（见[模块实现](/source-code-analysis/modules/implementation)）。
- [Redis 模块 API 文档](https://redis.io/docs/latest/develop/reference/modules/)：模块类型名必须恰好 9 字符这类约束的出处（见[模块系统](/source-code-analysis/modules/overview)）。
- 工具：[RedisInsight](https://redis.io/redisinsight/)（官方 GUI 客户端）、[redis_exporter](https://github.com/oliver006/redis_exporter)（Prometheus 采集）、[redis-rdb-tools](https://github.com/sripathikrishnan/redis-rdb-tools)（离线解析 RDB）（见[监控工具](/operations/monitoring-tools)）。
- 客户端库：Java 的 [Jedis](https://github.com/xetorthio/jedis)、[Lettuce](https://github.com/lettuce-core/lettuce-core)、[Redisson](https://github.com/redisson/redisson)，Python 的 [redis-py](https://github.com/redis/redis-py)，Go 的 [go-redis](https://github.com/go-redis/redis)，Node 的 [node-redis](https://github.com/redis/node-redis)；完整清单见[客户端库](/development/client-libraries)。
- GeoHash 编码由 Gustavo Niemeyer 于 2008 年提出（geohash.org），Redis GEO 命令基于其思想对经纬度做 52 位整数编码（见[参考文献](/appendix/references)、[地理空间](/basics/geospatial/geoadd)）。
- Windows 官方不出安装包，走 WSL 或社区移植版 [MicrosoftArchive/redis](https://github.com/microsoftarchive/redis/releases)（见[Windows 安装](/basics/installation-on-windows)）。

## 应用场景

场景做法集中在[使用场景篇](/use-cases/README)与[开发与集成篇](/development/README)，收拢如下：

| 场景 | 核心做法 | 出处 |
| --- | --- | --- |
| 缓存 | Cache-Aside：读未命中回源写缓存，写先更新数据库再删除缓存；穿透用空值短 TTL 或布隆过滤器，击穿用互斥锁，雪崩用 TTL 加随机抖动 | [缓存](/use-cases/caching) |
| 会话 | Hash 存多字段 + EXPIRE 滑动续期（30 分钟无操作才过期）；会话 ID 用足够长随机串，密码只存加盐慢哈希 | [会话存储](/use-cases/session-storage)、[认证与会话](/use-cases/session-management/authentication) |
| 实时分析 | UV 用 HyperLogLog（12 KB / 0.81% 误差）；热点计数分片 `stats:{date}:{0-9}` 再汇总相加 | [实时分析](/use-cases/real-time-analytics) |
| 消息队列 | 简单队列 LPUSH + BRPOP（取出即删、无确认）；可靠队列用 Stream 消费组 + XACK + XPENDING/XCLAIM；延迟消息用 ZSET 按时间戳轮询 | [消息队列](/use-cases/message-queues) |
| 排行榜 | ZADD + ZRANGE ... REV（6.2 起 `ZREVRANGE` 已废弃），排名查询 O(log N)；同分按时间用「分数 × 大基数 + 时间差补数」编码进一个 double（超 2^53 丢精度） | [排行榜](/use-cases/leaderboards) |
| 计数与发号 | INCR/DECR 单线程内原子、无需加锁；步长发号 `INCRBY id:order 1000` 分段领取；限流四策略：固定窗口、滑动窗口（ZSET）、漏桶、令牌桶 | [计数器](/use-cases/counters)、[全局 ID](/use-cases/global-id)、[限流策略](/use-cases/rate-limiting/strategies) |
| 签到 | 一年 365 个位（约 46 字节）；`BITOP AND` 求连续签到与留存 | [签到](/use-cases/check-ins) |
| 附近的人 | GEOADD + GEOSEARCH；多边形围栏超出 GEO 能力时换 Tile38 | [地理空间](/basics/geospatial/geoadd)、[Tile38](/redis-compatible/tile38) |
| 分布式锁 | SET NX EX 原子加锁、释放前比对持有者；Redlock 多实例多数派，但有时钟漂移、不可重入等固有缺陷 | [分布式锁](/use-cases/distributed-locks) |
| 库存扣减 | Lua 把「读库存—判断余量—扣减」合并成原子操作，库存为 0 返回失败防超卖 | [脚本功能介绍](/scripts/scripts-introduction) |

阅读路径按需取用：查缓存一致性从[缓存策略与实践](/use-cases/cache/strategies)进；查高可用从[主从复制](/advanced/replication) → [哨兵模式](/advanced/sentinel) → [集群模式](/advanced/cluster)顺序读；查源码从[架构概述](/source-code-analysis/architecture/overview)进，沿命令链路、数据结构、持久化、集群走下去。

## 常见坑误区

### 命令与数据类型

| 坑 | 事实与正确做法 | 出处 |
| --- | --- | --- |
| SET 覆盖掉 TTL | SET 默认清除原有过期时间，要保留显式加 KEEPTTL | [SET](/basics/string/set) |
| KEYS 遍历 | O(N) 且中途不释放 CPU，键多时阻塞一切请求；遍历用 SCAN | [命令优化](/advanced/command-optimization) |
| SMEMBERS 大集合 | 全量返回并阻塞；增量用 SSCAN | [SMEMBERS](/basics/set/smembers) |
| LPUSH 参数顺序 | 多值插入时最后一个参数离头部最近，与书写顺序相反 | [LPUSH](/basics/list/lpush) |
| GEOADD 传反经纬度 | 参数顺序是经度在前、纬度在后，与口头习惯相反 | [GEOADD](/basics/geospatial/geoadd) |
| ZRANGE 找不到第一名 | 默认升序，与排行榜直觉相反；6.2 起排行榜查询统一进 ZRANGE 加 REV | [ZRANGE](/basics/zset/zrange) |
| SETBIT 大偏移 | offset 1 亿会一次性分配约 12.5 MB；键要按合理维度拆分 | [SETBIT](/basics/bitmap/setbit) |
| 大键同步删除 | DEL 阻塞主线程，用 UNLINK 走后台释放 | [优化策略](/source-code-analysis/performance/strategies) |
| 对列表 GET 报 WRONGTYPE | 不是返回 nil 而是类型错误；先 TYPE 确认再操作 | [GET](/basics/string/get) |
| HGET 后 HSET 改数值字段 | 两步之间并发会丢失更新；数值变更用 HINCRBY/HINCRBYFLOAT | [HINCRBY](/basics/hash/other-commands) |
| LPOP 带不带 count 混用 | 返回结构不同：单值 vs 数组，客户端要分别处理 | [LPOP](/basics/list/lpop) |
| XREAD 用 $ 阻塞 | 阻塞间隙写入的旧条目会被跳过；重要场景记录上次读到的 ID | [XREAD](/basics/streams/xread) |
| XADD 精确 MAXLEN | 极端情况拖慢写入；生产用 MAXLEN ~ 近似修剪 | [XADD](/basics/streams/xadd) |
| 多键 PFCOUNT 当只读 | 执行中可能修改内部表示，只读副本上不宜执行 | [PFCOUNT](/basics/hyperloglog/pfcount) |
| BITFIELD 默认 WRAP | 溢出回绕；计数场景用 OVERFLOW SAT 封顶 | [BITFIELD](/basics/bitmap/other-commands) |

### 持久化与高可用

| 坑 | 事实与正确做法 | 出处 |
| --- | --- | --- |
| 以为 RDB 不丢数据 | 丢失窗口等于快照间隔 | [RDB 快照](/advanced/rdb-snapshot) |
| 以为 BGSAVE 零开销 | fork 在大内存实例上有短暂停顿，成本随写入频率涨 | [持久化](/advanced/persistence) |
| 以为主从自动切主 | 复制不带故障转移，要哨兵或集群 | [主从复制](/advanced/replication) |
| 哨兵连不上主节点 | 主节点配了 requirepass 时必须填 `sentinel auth-pass` | [哨兵模式](/advanced/sentinel) |
| 集群半数主节点挂了还指望可用 | 主节点低于半数集群进入故障状态 | [集群模式](/advanced/cluster) |
| 集群副本读报 MOVED | 副本读要先 READONLY（普通主从不需要） | [分片与复制](/source-code-analysis/cluster/sharding-replication) |
| 还在用 redis-trib.rb | 5.0 起已移除，用 redis-cli --cluster | [高可用](/advanced/high-availability) |
| 想 CONFIG SET io-threads | 6.x/7.x 是不可变配置，报 can't set immutable config，重启才生效 | [线程模型](/source-code-analysis/multithreading/model) |

### 脚本与事务

| 坑 | 事实与正确做法 | 出处 |
| --- | --- | --- |
| 指望脚本回滚 | Lua 与 MULTI/EXEC 都不回滚；先做参数校验再写入 | [脚本功能介绍](/scripts/scripts-introduction) |
| 键名放 ARGV | 单实例能跑，上集群就报错；键一律走 KEYS 声明 | [脚本集成](/scripts/lua-redis-integration) |
| 脚本里 math.random 写结果 | 副本间数据不一致；随机值由客户端生成、经 ARGV 传入 | [脚本集成](/scripts/lua-redis-integration) |
| 沙箱里调 print | Lua 沙箱只开 string、table、math、cjson、cmsgpack、struct、bit 七个库；调试靠返回值 | [脚本附录](/scripts/appendix) |
| pcall 返回值直接取 err | 空结果返回 false、报错才返回带 err 的表；先判 type 再访问 | [常见问题与调试](/scripts/lua/troubleshooting) |
| INCR 后才 EXPIRE | 两步之间有竞态，最坏结果是该键没有 TTL；用兜底 EXPIRE 或 Lua 合并 | [计数器](/use-cases/counters) |
| EVALSHA 撞 NOSCRIPT | 捕获后重新 SCRIPT LOAD 再重试 | [EVALSHA](/scripts/lua/evalsha) |

### 缓存与业务

| 坑 | 事实与正确做法 | 出处 |
| --- | --- | --- |
| 穿透、击穿、雪崩混着说 | 穿透是查不存在的数据绕过缓存；击穿是单个热点键过期瞬间回源洪峰；雪崩是大量键同时过期压垮数据库 | [常见问题](/appendix/faq) |
| 先删缓存再更新库 | 推荐 Cache-Aside「先更新数据库，再删除缓存」，删除失败进重试队列或短 TTL 兜底 | [常见问题](/appendix/faq) |
| 会话密码存 SHA-256 | 快速哈希易被暴力枚举，用 bcrypt、scrypt 或 Argon2 加盐慢哈希 | [认证与会话](/use-cases/session-management/authentication) |
| 拿 Redlock 当银弹 | 时钟漂移、网络延迟、不可重入、过期时间设置不当四个固有缺陷 | [分布式锁](/use-cases/distributed-locks) |
| 碎片率小于 1 不管 | 说明 swap 已发生，先查宿主机内存 | [内存管理](/source-code-analysis/memory-management) |

### 兼容与选型

| 坑 | 事实与正确做法 | 出处 |
| --- | --- | --- |
| 把 Pika、SSDB 当全功能替代 | Lua、事务、Stream、Pub/Sub 支持不全或语义不同；迁移前按命令清单核对 | [Pika](/redis-compatible/pika)、[SSDB](/redis-compatible/ssdb) |
| 兼容性只测 SET/GET | 用真实业务的命令清单验证 | [开源项目](/redis-compatible/open-source-projects) |
| 以为 Valkey 与 Redis 完全同步 | Valkey 8 起各有新命令新配置，切换前做兼容性验证 | [Valkey](/redis-compatible/valkey) |
| 代理方案零成本 | 代理本身是新的单点，要评估运维复杂度与故障模式 | [开源项目](/redis-compatible/open-source-projects) |
| 还在用 RPOPLPUSH | 6.2 起 LMOVE 取代，弹出即转移 | [LMOVE](/basics/list/other-commands) |
| GEORADIUS 系列当新写法 | 6.2 起标记 deprecated，统一迁移到 GEOSEARCH | [GEOSEARCH](/basics/geospatial/other-commands) |
| SETNX/SETEX/PSETEX/GETSET 旧写法 | 功能已被 SET 的选项覆盖，新代码统一用 SET 加选项 | [SET](/basics/string/set) |
| 还在用 SLAVEOF | 5.0 起以 REPLICAOF 为准，SLAVEOF 只是旧别名 | [主从复制](/advanced/replication) |

## 来源与口径

- **正文页即来源**：本页每条知识点回链的页面就是它的出处；正文页没有的说法不收，查无实据的标「来源未考」。
- **版本口径**：源码分析篇以 Redis 8.0 分支为准；版本敏感条目（GETSET 6.2 过期、ZRANGE 6.2 合并、LMOVE/GEOSEARCH 6.2、ZADD GT/LT 6.2、listpack 7.0 替代 ziplist、multi-part AOF 7.0、Functions 7.0、SINTERCARD 7.0）已随文标注版本号，跨版本使用前用 `COMMAND INFO` 与[命令参考](https://redis.io/docs/latest/commands/)核对。
- **实测数字**：源码篇页内标「实测」的数字（如 `COMMAND COUNT` 265、hz 10、纯 PING 55555 RPS、200 条 SET 走 pipeline 从 19.7ms 降到 1.9ms）为本机运行实例实取；其余数字以官方文档为准。
- **趋势口径**：[未来发展](/advanced-topics/future-development)页是趋势性描述（如 Redis 8 向量集），具体特性以官方发布说明为准，本页未将其计入正式知识点。
- **书籍**：四本书只在参考文献页收录，正文页未逐条引用章节细节，表中定位取自书目页原句。

## 参考资料

- [参考文献](/appendix/references)——官方文档、规范、书目与工具清单
- [常见问题](/appendix/faq)——持久化、淘汰、事务、缓存三大问题速查
- [术语表](/appendix/glossary)——槽、COW、listpack、Redlock 等术语定义
- 各部分入口：[基础知识](/basics/README)、[脚本功能](/scripts/README)、[进阶功能](/advanced/README)、[开发与集成](/development/README)、[运维与管理](/operations/README)、[源码分析](/source-code-analysis/README)、[使用场景](/use-cases/README)、[兼容项目](/redis-compatible/README)
