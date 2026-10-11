# Redis 地理空间数据

## 概述

Redis 的地理空间数据功能使得可以存储和操作地理位置数据（如经纬度坐标）。这些功能主要依赖于 Redis 的有序集合（sorted set）和 GeoHash 编码。Redis 提供了若干命令来处理地理空间数据，支持存储、查询和计算位置距离等操作。

## 结构图

![Redis Geospatial 结构](/structures/geospatial.png)

## 常用命令

### 1. **`GEOADD`**

- **功能**: 向指定的地理空间键添加地理位置数据
- **语法**: `GEOADD key longitude latitude member [longitude latitude member ...]`
- **说明**:
  - `key`：地理空间键
  - `longitude`：经度
  - `latitude`：纬度
  - `member`：成员名称
- **示例**:
  ```plaintext
  GEOADD places 13.361389 38.115556 "Palermo"
  GEOADD places 15.087269 37.502669 "Catania"
  ```

### 2. **`GEOPOS`**

- **功能**: 获取地理空间键中指定成员的位置
- **语法**: `GEOPOS key member [member ...]`
- **说明**: 返回每个成员的经纬度坐标
- **示例**:
  ```plaintext
  GEOPOS places "Palermo"
  ```

### 3. **`GEODIST`**

- **功能**: 计算地理空间键中两个成员之间的距离
- **语法**: `GEODIST key member1 member2 [unit]`
- **说明**:
  - `unit`：可选参数，单位可以是 `m`（米）、`km`（千米）、`mi`（英里）、`ft`（英尺）
- **示例**:
  ```plaintext
  GEODIST places "Palermo" "Catania" km
  ```

### 4. **`GEORADIUS`**

- **功能**: 从地理空间键中获取指定半径范围内的成员
- **语法**: `GEORADIUS key longitude latitude radius [unit] [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count] [ASC|DESC]`
- **说明**:
  - `radius`：半径范围
  - `unit`：单位（可选），默认为米
  - `WITHCOORD`：返回坐标信息
  - `WITHDIST`：返回距离信息
  - `WITHHASH`：返回 GeoHash 编码
  - `COUNT`：返回的最大成员数
  - `ASC` 或 `DESC`：排序方式
- **示例**:
  ```plaintext
  GEORADIUS places 15 37 200 km WITHCOORD WITHDIST
  ```

### 5. **`GEORADIUSBYMEMBER`**

- **功能**: 从地理空间键中获取指定成员周围的成员
- **语法**: `GEORADIUSBYMEMBER key member radius [unit] [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count] [ASC|DESC]`
- **说明**: 与 `GEORADIUS` 类似，但以指定成员为中心
- **示例**:
  ```plaintext
  GEORADIUSBYMEMBER places "Palermo" 100 km WITHCOORD WITHDIST
  ```

## 示例操作

```plaintext
# 向地理空间键 "places" 添加两个地理位置数据
GEOADD places 13.361389 38.115556 "Palermo"
GEOADD places 15.087269 37.502669 "Catania"

# 获取 "Palermo" 的位置
GEOPOS places "Palermo"

# 计算 "Palermo" 和 "Catania" 之间的距离
GEODIST places "Palermo" "Catania" km

# 获取 "Palermo" 周围 200 公里范围内的成员，并返回坐标和距离
GEORADIUS places 13.361389 38.115556 200 km WITHCOORD WITHDIST

# 获取 "Palermo" 周围 100 公里范围内的成员，并返回坐标和距离
GEORADIUSBYMEMBER places "Palermo" 100 km WITHCOORD WITHDIST
```

> 注意：`GEORADIUS` 和 `GEORADIUSBYMEMBER` 自 Redis 6.2 起已被标记为**废弃**（deprecated），新代码建议使用 `GEOSEARCH`。由于 `GEORADIUS` 带 `STORE`/`STOREDIST` 选项会被判定为写命令，因此在只读副本上会报错，需要改用只读变体 `GEORADIUS_RO`、`GEORADIUSBYMEMBER_RO`。

`GEOSEARCH` 的语法把「从哪个中心点出发」和「按什么范围搜索」分成两组选项，且 `FROMLONLAT` 是单个令牌：

```plaintext
GEOSEARCH key <FROMMEMBER member | FROMLONLAT longitude latitude> <BYRADIUS radius m|km|ft|mi | BYBOX width height m|km|ft|mi> [ASC|DESC] [COUNT count [ANY]] [WITHCOORD] [WITHDIST] [WITHHASH]
GEOSEARCHSTORE destination key <FROMMEMBER member | FROMLONLAT longitude latitude> <BYRADIUS ... | BYBOX ...> [ASC|DESC] [COUNT count [ANY]] [STOREDIST]
```

示例：

```plaintext
GEOADD Sicily 13.361389 38.115556 "Palermo"
GEOADD Sicily 15.087269 37.502669 "Catania"

# 等价于 GEORADIUS Sicily 15 37 200 km WITHDIST
GEOSEARCH Sicily FROMLONLAT 15 37 BYRADIUS 200 km ASC WITHDIST

# 以某个成员为中心搜索
GEOSEARCH Sicily FROMMEMBER Palermo BYRADIUS 100 km ASC WITHDIST

# 矩形范围搜索
GEOSEARCH Sicily FROMLONLAT 15 37 BYBOX 400 400 km ASC

# 把结果存入新的地理空间键
GEOSEARCHSTORE dest Sicily FROMLONLAT 15 37 BYRADIUS 200 km ASC
```

## 特点

- **本质是 ZSet**：经纬度编码成 geohash 52 位整数当 score 存进有序集合。
- **半径检索**：`GEORADIUS` 按经纬度 + 半径找范围内成员，可附带 `WITHDIST`/`COUNT`。
- **距离计算**：`GEODIST` 返回两坐标球面距离（米/公里）。
- **精度**：约厘米级，超出地名级场景（城际）足够，不适合工程测量。

## 使用场景

- **位置查询**：找出附近的商店、餐厅或其他兴趣点。
- **物流和配送**：计算配送范围、估算运输距离。
- **社交网络**：为用户提供基于位置的推荐或匹配服务。
- **导航**：支持路线规划和导航功能。

```plaintext
# 1. 附近的人 / 门店
GEOADD shops 116.397 39.909 "shop:1" 116.405 39.915 "shop:2"
GEORADIUS shops 116.39 39.91 5 km WITHDIST COUNT 10

# 2. 电子围栏：判断是否进入区域
GEORADIUS fence:office 116.397 39.909 0.5 km

# 3. 两点距离
GEODIST shop:1 shop:2 km
```

## 小结

Redis 的地理空间数据功能为处理地理位置数据提供了强大的支持。通过使用 Redis 的地理空间命令，可以高效地存储、查询和计算地理位置信息。