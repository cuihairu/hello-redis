# GEOADD

#### 概述

`GEOADD` 用于把一个或多个"经度 + 纬度 + 成员"写入指定的地理空间键。Redis 底层使用有序集合存储地理空间数据：成员作为有序集合的 member，其分数是一个经过 GeoHash 编码的 52 位整数，因此地理空间键可以直接使用 `ZRANGE`、`ZREM` 等有序集合命令操作。

#### 语法与参数

```plaintext
GEOADD key [NX|XX] [CH] longitude latitude member [longitude latitude member ...]
```

- **`key`**：地理空间键。
- **`NX`**：只新增，不更新已存在成员的坐标。
- **`XX`**：只更新已存在成员的坐标，不新增成员。
- **`CH`**：返回"实际发生变更"的成员数量（新增或坐标被更新）。缺省时返回新增成员的数量。
- **`longitude`**：经度，有效范围为 -180 到 180 度。
- **`latitude`**：纬度，有效范围为 -85.05112878 到 85.05112878 度（对应 Web 墨卡托投影的边界）。
- **`member`**：成员名称，通常用来存地点 ID 或名称。

**返回值**：默认返回新增成员的数量；带 `CH` 时返回新增与被更新坐标的成员总数。

#### 示例

以下命令可以直接在 `redis-cli` 中执行，注释中为实测返回结果：

```plaintext
# 逐个添加成员
GEOADD bb:geo:sicily 13.361389 38.115556 Palermo
# (integer) 1
GEOADD bb:geo:sicily 15.087269 37.502669 Catania
# (integer) 1

# 地理空间键本质是有序集合
TYPE bb:geo:sicily
# zset

# 直接用有序集合命令查看，分数是 GeoHash 编码后的整数
ZRANGE bb:geo:sicily 0 -1 WITHSCORES
# 1) "Palermo"
# 2) "3479099956230698"
# 3) "Catania"
# 4) "3479447370796909"
```

坐标超出范围会直接报错，命令不执行：

```plaintext
GEOADD bb:geo:sicily 181 38 BadLon
# (error) ERR invalid longitude,latitude pair 181.000000,38.000000
GEOADD bb:geo:sicily 13 86 BadLat
# (error) ERR invalid longitude,latitude pair 13.000000,86.000000
```

`NX`、`XX` 与 `CH` 选项的行为：

```plaintext
# NX：Palermo 已存在，忽略更新，返回 0
GEOADD bb:geo:sicily NX 13.9 38.9 Palermo
# (integer) 0

# XX：Agrigento 不存在，跳过新增，返回 0
GEOADD bb:geo:sicily XX 14.5 37.1 Agrigento
# (integer) 0
ZCARD bb:geo:sicily
# (integer) 2

# CH：写入与现有值完全相同的坐标不算变更，返回 0
GEOADD bb:geo:sicily CH 13.361389 38.115556 Palermo
# (integer) 0
```

#### 注意事项

- **先经度后纬度**：参数顺序是 `longitude latitude`，与日常"纬度在前"的口头习惯相反，写反会被当作非法坐标或静默存错位置。
- **范围限制**：极地地区（纬度绝对值超过 85.05112878 度）无法存储，这是 GeoHash 编码方案本身的限制。
- **不要用 `DEL` 之外的方式清理**：想删除某个成员应使用 `ZREM key member`，删除整个键才用 `DEL`。
- **距离计算**：`GEODIST` 使用球面距离公式估算，结果与真实地表距离存在少量误差。

#### 相关页面

- [GEORADIUS](./georadius.md)：按圆形区域查询成员。
- [其他地理空间命令](./other-commands.md)：`GEOPOS`、`GEODIST`、`GEOSEARCH` 等。
- 返回专题目录：[Redis 地理空间数据](../geospatial.md)。
