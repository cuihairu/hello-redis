# GEORADIUS

#### 概述

`GEORADIUS` 以给定的经纬度为圆心、指定距离为半径，返回地理空间键中落在该圆形区域内的成员，并且支持按距离排序、返回距离或坐标等附加信息。它是"附近的人""附近的门店"这类位置查询的经典实现命令。

（该命令自 Redis 6.2 起已被标记为 deprecated，官方建议新代码使用功能等价、语法更清晰的 `GEOSEARCH`；旧命令目前仍然可用。）

#### 语法与参数

```plaintext
GEORADIUS key longitude latitude radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count [ANY]] [ASC|DESC] [STORE key|STOREDIST key]
```

- **`key`**：地理空间键。
- **`longitude` / `latitude`**：圆心的经度和纬度。
- **`radius`**：半径数值，配合后面的单位使用。
- **`m|km|ft|mi`**：距离单位，分别是米、千米、英尺、英里。
- **`WITHDIST`**：同时返回成员与圆心的距离，距离值会保留两位小数。
- **`WITHCOORD`**：同时返回成员的经纬度坐标。
- **`WITHHASH`**：同时返回成员的 GeoHash 编码整数（即有序集合的分数）。
- **`COUNT count`**：最多返回 count 个成员；加 `ANY` 时不保证是最近的，而是返回先找到的 count 个，速度更快。
- **`ASC` / `DESC`**：按距离由近到远 / 由远到近排序。
- **`STORE` / `STOREDIST`**：把结果（成员或成员与距离）写入目标有序集合。

**返回值**：成员列表，或带附加信息的嵌套数组；没有成员落在半径内时返回空数组。

#### 示例

先准备数据（与官方文档一致的西西里岛两个城市）：

```plaintext
GEOADD bb:geo:sicily 13.361389 38.115556 Palermo
GEOADD bb:geo:sicily 15.087269 37.502669 Catania
```

以下查询可以直接在 `redis-cli` 中执行，注释中为实测返回结果：

```plaintext
# 返回半径内的成员及其距离
GEORADIUS bb:geo:sicily 15 37 200 km WITHDIST
# 1) 1) "Palermo"
#    2) "190.4424"
# 2) 1) "Catania"
#    2) "56.4413"

# 同时返回距离与坐标
GEORADIUS bb:geo:sicily 15 37 200 km WITHDIST WITHCOORD
# 1) 1) "Palermo"
#    2) "190.4424"
#    3) 1) "13.361389338970184"
#       2) "38.1155563954963"
# 2) 1) "Catania"
#    2) "56.4413"
#    3) 1) "15.087267458438873"
#       2) "37.50266842333162"

# 返回 GeoHash 编码整数
GEORADIUS bb:geo:sicily 15 37 200 km WITHHASH
# 1) 1) "Palermo"
#    2) (integer) 3479099956230698
# 2) 1) "Catania"
#    2) (integer) 3479447370796909

# 只取最近的一个
GEORADIUS bb:geo:sicily 15 37 200 km COUNT 1 ASC WITHDIST
# 1) 1) "Catania"
#    2) "56.4413"

# 没有成员落在半径内时返回空数组
GEORADIUS bb:geo:sicily 15 37 1 km
# (empty array)
```

#### 迁移到 GEOSEARCH

`GEOSEARCH` 用 `FROMLONLAT` 或 `FROMMEMBER` 指定中心点，不再把中心坐标与查询范围混在一起，语义更直观，上面的第一条查询等价于：

```plaintext
GEOSEARCH bb:geo:sicily FROMLONLAT 15 37 BYRADIUS 200 km WITHDIST ASC
# 1) 1) "Catania"
#    2) "56.4413"
# 2) 1) "Palermo"
#    2) "190.4424"
```

#### 注意事项

- **单位必须写**：`m|km|ft|mi` 是必填参数，缺省会报参数错误。
- **先排序再截断**：`COUNT` 最好与 `ASC` 搭配使用，否则拿到的"前 N 个"不一定是最近的 N 个。
- **性能**：`GEOADD` 写入后查询基于有序集合的范围查找完成，半径越大、候选成员越多，扫描成本越高；海量数据下应控制半径或配合 `COUNT`。
- **旧代码兼容**：`GEORADIUSBYMEMBER` 也同样被标记为 deprecated，可统一迁移到 `GEOSEARCH`。

#### 相关页面

- [GEOADD](./geoadd.md)：写入地理空间数据。
- [其他地理空间命令](./other-commands.md)：`GEOPOS`、`GEODIST`、`GEOSEARCH` 等。
- 返回专题目录：[Redis 地理空间数据](../geospatial.md)。
