# 缓存

缓存带来命中率与回源压力之间的取舍：例如命中率从 90% 提高到 99% 时，未命中回源量会降至原来的十分之一。缓存也增加了与数据库不一致、过期集中、无效请求回源等维护成本。

## 这页的视角

Cache-Aside 与这三类问题的定义和处理方式统一整理在[Cache-Aside 与缓存三大问题](caching.md)；本页保留场景收益与成本的概览。

## 深入阅读

- Cache-Aside 读写模式、Python 完整示例和三个问题的对策，见[Cache-Aside 与缓存三大问题](caching.md)；
- 穿透、雪崩、击穿的展开解法（布隆过滤器、空值缓存、多级缓存），见[缓存策略与实践](cache/strategies.md)；
- 页面缓存、数据缓存、分布式缓存的 Flask 案例，见[实际案例：Web应用缓存](cache/web-app.md)。

## 参考资料

- [Redis 开发文档 · 场景](https://redis.io/docs/latest/develop/use-cases/)

<!-- BACKLINKS-AUTO -->
## 相关页面

- [README](README.md)
