# 地理空间索引

Redis 的 GEO 功能基于有序集合实现，可以存储经纬度并进行半径范围、范围内的点等地理查询，适合"附近的门店/人"这类 LBS 场景。完整的实现可参阅[基于位置的服务](geolocation-services/location-based.md)。

## 基本命令

```bash
# 写入坐标：GEOADD key 经度 纬度 成员（可一次写入多个）
GEOADD shops 116.481028 39.998943 shop:1 116.464608 39.914886 shop:2

# 查询以 (116.481028, 39.998943) 为圆心、10 km 内的门店，按距离升序
GEOSEARCH shops FROMLONLAT 116.481028 39.998943 BYRADIUS 10 km ASC WITHCOORD WITHDIST

# 查询长方形区域内的点（GeoHash 九宫格）
GEOSEARCH shops FROMLONLAT 116.481028 39.998943 BYBOX 10 10 km ASC

# 计算两点间距离（默认米，可指定单位）
GEODIST shops shop:1 shop:2 km

# 查询成员坐标
GEOPOS shops shop:1

# 删除成员（GEO 无专用删除命令，使用集合的 ZREM）
ZREM shops shop:2
```

## 数据结构与限制

- GEO 值存储在有序集合中，命令 `GEOADD` 实际上是 `ZADD` 的封装，分数为 GeoHash 编码后的 52 位整数。
- 由于 GeoHash 的精度限制，`GEOPOS`/`GEODIST` 的最大误差约为 0.6%，需要精确距离时应在应用层重新计算。
- 成员名是唯一的，重复 `GEOADD` 同名成员会更新其坐标。

## Python 示例：查询附近门店

```python
import redis

r = redis.Redis(decode_responses=True)


def add_shop(shop_id, lon, lat):
    r.geoadd('shops', [lon, lat, shop_id])


def nearby(lon, lat, radius_km=5, count=10):
    return r.geosearch(
        'shops',
        longitude=lon, latitude=lat,
        radius=radius_km, unit='km',
        sort='ASC', count=count,
        withcoord=True, withdist=True,
    )


if __name__ == '__main__':
    add_shop('shop:1', 116.481028, 39.998943)
    add_shop('shop:2', 116.464608, 39.914886)
    for name, dist, (lon, lat) in nearby(116.481028, 39.998943, radius_km=10):
        print(name, dist, lon, lat)  # shop:1 在圆心，距离 0.0 km
```

## 实践建议

- **先粗筛后精排**：GEOSEARCH 筛出候选集后，如有业务过滤条件（库存、营业状态），再在应用层二次过滤。
- **附近无结果时扩大半径**：常用"5 km → 10 km → 50 km"的渐进式扩大策略。
- **大量静态地理数据**：如地图瓦片、行政区划等，更适合使用专业地理数据库（PostGIS 等），Redis GEO 适合中小规模的动态点数据。
