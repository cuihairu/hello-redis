# 地理位置服务

附近的人、附近的店、配送范围判断，本质都是同一类查询：给定坐标与半径，找出范围内的点。Redis 用 GEO 命令在 ZSET 上完成这件事，GeoHash 编码后按范围搜索。

## 核心做法

- `GEOADD` 把经纬度写入有序集合，内部按 52 位 GeoHash 编码存成分数；
- 查询用 `GEOSEARCH`：指定中心坐标与半径，返回距离范围内的点，可选按距离排序和返回条数；
- 已废弃的 `GEORADIUS`、`GEORADIUSBYMEMBER` 在 6.2 被 `GEOSEARCH` 统一取代。

## 注意事项

- 纬度上限是 85.05112878，超过这个值 GeoHash 编码无意义；
- GEO 依赖 ZSET，删除点位用 `ZREM`，不要用不存在的结构；
- 范围查询的结果是 GeoHash 网格近似值，需要精确距离时用 `GEODIST` 复核。

## 深入阅读

- 存储、查询、附近的人完整实现见[基于位置的服务](geolocation-services/location-based.md)；
- GeoHash 原理与 GEO 命令详解见[地理位置索引](geospatial-indexing.md)。
