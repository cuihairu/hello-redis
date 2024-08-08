### Redis 有序集合（Sorted Set）

#### 概述

Redis 有序集合（Sorted Set）是 Redis 的一种数据结构，它是一个有序的集合，其中的每个成员都有一个分数（score）。成员按分数排序，分数相同的成员按字典顺序排序。Sorted Set 支持多种高效的操作，例如范围查询和排名计算，非常适用于需要按顺序处理数据的场景。

#### 常用命令

##### 1. **`ZADD`**

- **功能**: 向有序集合中添加一个或多个成员及其分数
- **语法**: `ZADD key [NX|XX] [CH] [INCR] score member [score member ...]`
- **说明**:
  - `NX`：仅当成员不存在时添加
  - `XX`：仅当成员已存在时更新
  - `CH`：返回被修改的成员数量
  - `INCR`：对成员的分数进行增量操作
- **示例**:
  ```plaintext
  ZADD myzset 1 "one"
  ZADD myzset 2 "two" 3 "three"
  ```

##### 2. **`ZREM`**

- **功能**: 移除有序集合中的一个或多个成员
- **语法**: `ZREM key member [member ...]`
- **说明**: 如果成员存在于集合中，则将其移除。如果集合不存在，则返回 0。
- **示例**:
  ```plaintext
  ZREM myzset "two"
  ```

##### 3. **`ZRANGE`**

- **功能**: 返回有序集合中指定范围的成员
- **语法**: `ZRANGE key start stop [WITHSCORES]`
- **说明**:
  - `start` 和 `stop` 指定成员的范围，索引从 0 开始。
  - `WITHSCORES`：附带分数一起返回
- **示例**:
  ```plaintext
  ZRANGE myzset 0 -1
  ZRANGE myzset 0 -1 WITHSCORES
  ```

##### 4. **`ZREVRANGE`**

- **功能**: 返回有序集合中指定范围的成员，按分数降序排列
- **语法**: `ZREVRANGE key start stop [WITHSCORES]`
- **说明**: 与 `ZRANGE` 类似，但按降序排列。
- **示例**:
  ```plaintext
  ZREVRANGE myzset 0 -1
  ZREVRANGE myzset 0 -1 WITHSCORES
  ```

##### 5. **`ZRANK`**

- **功能**: 获取有序集合中成员的排名（从低到高）
- **语法**: `ZRANK key member`
- **说明**: 返回成员的排名，如果成员不存在，则返回 `nil`。
- **示例**:
  ```plaintext
  ZRANK myzset "one"
  ```

##### 6. **`ZREVRANK`**

- **功能**: 获取有序集合中成员的排名（从高到低）
- **语法**: `ZREVRANK key member`
- **说明**: 返回成员的排名，如果成员不存在，则返回 `nil`。
- **示例**:
  ```plaintext
  ZREVRANK myzset "one"
  ```

##### 7. **`ZSCORE`**

- **功能**: 获取有序集合中成员的分数
- **语法**: `ZSCORE key member`
- **说明**: 返回成员的分数，如果成员不存在，则返回 `nil`。
- **示例**:
  ```plaintext
  ZSCORE myzset "one"
  ```

##### 8. **`ZCARD`**

- **功能**: 获取有序集合中的成员数量
- **语法**: `ZCARD key`
- **说明**: 返回集合中的成员数量。
- **示例**:
  ```plaintext
  ZCARD myzset
  ```

##### 9. **`ZCOUNT`**

- **功能**: 计算有序集合中指定分数范围内的成员数量
- **语法**: `ZCOUNT key min max`
- **说明**: 计算分数在 `min` 和 `max` 之间的成员数量。
- **示例**:
  ```plaintext
  ZCOUNT myzset 1 2
  ```

##### 10. **`ZREMRangeByScore`**

- **功能**: 移除有序集合中分数在指定范围内的成员
- **语法**: `ZREMRANGEBYSCORE key min max`
- **说明**: 删除分数在 `min` 和 `max` 之间的所有成员。
- **示例**:
  ```plaintext
  ZREMRANGEBYSCORE myzset 1 2
  ```

##### 11. **`ZREMRANGEBYRANK`**

- **功能**: 移除有序集合中指定排名范围内的成员
- **语法**: `ZREMRANGEBYRANK key start stop`
- **说明**: 删除排名在 `start` 和 `stop` 之间的成员。
- **示例**:
  ```plaintext
  ZREMRANGEBYRANK myzset 0 1
  ```

##### 12. **`ZUNIONSTORE`**

- **功能**: 将多个有序集合的并集存储到一个新的集合中
- **语法**: `ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]`
- **说明**: 
  - `WEIGHTS`：为每个集合指定权重
  - `AGGREGATE`：指定合并时的聚合方式，默认为 `SUM`
- **示例**:
  ```plaintext
  ZUNIONSTORE unionset 2 set1 set2
  ```

##### 13. **`ZINTERSTORE`**

- **功能**: 将多个有序集合的交集存储到一个新的集合中
- **语法**: `ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]`
- **说明**: 
  - `WEIGHTS`：为每个集合指定权重
  - `AGGREGATE`：指定合并时的聚合方式，默认为 `SUM`
- **示例**:
  ```plaintext
  ZINTERSTORE interset 2 set1 set2
  ```

#### 示例操作

```plaintext
# 向有序集合中添加元素
ZADD myzset 1 "one"
ZADD myzset 2 "two"
ZADD myzset 3 "three"

# 移除有序集合中的元素
ZREM myzset "two"

# 获取有序集合中指定范围的成员
ZRANGE myzset 0 -1
ZRANGE myzset 0 -1 WITHSCORES

# 获取成员的排名（从低到高）
ZRANK myzset "one"

# 获取成员的排名（从高到低）
ZREVRANK myzset "one"

# 获取成员的分数
ZSCORE myzset "one"

# 计算指定分数范围内的成员数量
ZCOUNT myzset 1 3

# 移除分数在指定范围内的成员
ZREMRANGEBYSCORE myzset 1 2

# 移除指定排名范围内的成员
ZREMRANGEBYRANK myzset 0 1

# 将多个有序集合的并集存储到一个新的集合中
ZUNIONSTORE unionset 2 set1 set2

# 将多个有序集合的交集存储到一个新的集合中
ZINTERSTORE interset 2 set1 set2
```

### 小结

Redis 有序集合是一个非常强大的数据结构，适用于需要按顺序处理数据的场景，如排行榜、排名系统等。通过掌握这些常用命令，可以高效地管理和操作 Redis 中的有序集合数据。