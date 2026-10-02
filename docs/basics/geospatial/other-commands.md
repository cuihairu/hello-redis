# 其他地理空间命令

#### 概述

地理空间模块除 `GEOADD` 与 `GEORADIUS` 外，还提供了一组互补的命令：读取成员坐标、计算两点距离、查看 GeoHash 编码，以及更现代的范围查询命令 `GEOSEARCH` 与 `GEOSEARCHSTORE`。它们覆盖了位置服务开发中最常见的需求。

#### 常用命令

##### 1. **`GEOPOS`**

- **功能**：返回成员的经纬度坐标。
- **语法**：`GEOPOS key member [member ...]`

```plaintext
GEOPOS bb:geo:sicily Palermo Catania
# 1) 1) "13.361389338970184"
#    2) "38.1155563954963"
# 2) 1) "15.087267458438873"
#    2) "37.50266842333162"
```

注意返回值与写入时的小数位数可能略有差异，这是 GeoHash 编码解码带来的精度损失，误差在厘米级。

##### 2. **`GEODIST`**

- **功能**：计算两个成员之间的球面距离。
- **语法**：`GEODIST key member1 member2 [m|km|ft|mi]`
- **说明**：缺省单位为米；任一成员不存在时返回 nil。

```plaintext
GEODIST bb:geo:sicily Palermo Catania km
# "166.2742"
GEODIST bb:geo:sicily Palermo Catania mi
# "103.3182"
GEODIST bb:geo:sicily Palermo Nowhere km
# (nil)
```

##### 3. **`GEOHASH`**

- **功能**：返回成员的 GeoHash 字符串（11 个字符的 Base32 编码）。

```plaintext
GEOHASH bb:geo:sicily Palermo
# 1) "sqc8b49rny0"
```

##### 4. **`GEORADIUSBYMEMBER`**

（该命令自 Redis 6.2 起已被标记为 deprecated，建议使用 `GEOSEARCH ... FROMMEMBER` 替代，目前仍然可用。）

- **功能**：与 `GEORADIUS` 类似，但以键中已存在的成员为圆心。
- **语法**：`GEORADIUSBYMEMBER key member radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count [ANY]] [ASC|DESC]`

```plaintext
GEORADIUSBYMEMBER bb:geo:sicily Palermo 200 km WITHDIST
# 1) 1) "Palermo"
#    2) "0.0000"
# 2) 1) "Catania"
#    2) "166.2742"
```

##### 5. **`GEOSEARCH`**

- **功能**：Redis 6.2 引入的范围查询命令，统一取代 `GEORADIUS` 与 `GEORADIUSBYMEMBER`。
- **语法**：`GEOSEARCH key [FROMMEMBER member | FROMLONLAT lon lat] [BYRADIUS radius unit | BYBOX width unit height unit] [ASC|DESC] [COUNT count [ANY]] [WITHCOORD] [WITHDIST] [WITHHASH]`
- **说明**：既支持圆形区域 `BYRADIUS`，也支持矩形区域 `BYBOX`。

```plaintext
# 以指定坐标为中心
GEOSEARCH bb:geo:sicily FROMLONLAT 15 37 BYRADIUS 200 km WITHDIST ASC COUNT 2
# 1) 1) "Catania"
#    2) "56.4413"
# 2) 1) "Palermo"
#    2) "190.4424"

# 以键中的成员为中心
GEOSEARCH bb:geo:sicily FROMMEMBER Catania BYRADIUS 300 km WITHDIST
# 1) 1) "Palermo"
#    2) "166.2742"
# 2) 1) "Catania"
#    2) "0.0000"
```

##### 6. **`GEOSEARCHSTORE`**

- **功能**：把 `GEOSEARCH` 的结果保存到目标有序集合，可选 `STOREDIST` 把分数替换为距离。
- **语法**：`GEOSEARCHSTORE destination source [FROMMEMBER member | FROMLONLAT lon lat] [BYRADIUS radius unit | BYBOX width unit height unit] [ASC|DESC] [COUNT count [ANY]] [STOREDIST]`

```plaintext
GEOSEARCHSTORE bb:geo:dest bb:geo:sicily FROMLONLAT 15 37 BYRADIUS 400 km ASC COUNT 5 STOREDIST
# (integer) 2
ZRANGE bb:geo:dest 0 -1 WITHSCORES
# 1) "Catania"
# 2) "56.4412578701582"
# 3) "Palermo"
# 4) "190.44242984775784"
```

#### 小结

- 读坐标用 `GEOPOS`，算距离用 `GEODIST`，看编码用 `GEOHASH`。
- 范围查询优先使用 `GEOSEARCH` / `GEOSEARCHSTORE`；`GEORADIUS` 与 `GEORADIUSBYMEMBER` 已标记 deprecated，仅建议在维护旧代码时继续使用。
- 需要持久化查询结果或在服务端复用时，用 `GEOSEARCHSTORE` 配合 `STOREDIST` 可以直接得到按距离排序的有序集合。

#### 相关页面

- [GEOADD](./geoadd.md)：写入地理空间数据。
- [GEORADIUS](./georadius.md)：传统的圆形区域查询命令。
- 返回专题目录：[Redis 地理空间数据](../geospatial.md)。
