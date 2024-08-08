### Redis 集合（Set）

#### 概述

Redis 集合是一种无序的数据结构，可以存储多个唯一的字符串值。集合不允许重复的元素，并且提供了多种操作集合的方法。它们特别适用于需要去重或执行集合运算（如交集、并集、差集）的场景。

#### 常用命令

##### 1. **`SADD`**

- **功能**: 向集合中添加一个或多个成员
- **语法**: `SADD key member [member ...]`
- **说明**: 如果集合不存在，则创建一个新的集合。如果集合已存在，则将新的成员添加到集合中。已经存在的成员将被忽略。
- **示例**:
  ```plaintext
  SADD myset "apple"
  SADD myset "banana" "cherry"
  ```

##### 2. **`SREM`**

- **功能**: 移除集合中的一个或多个成员
- **语法**: `SREM key member [member ...]`
- **说明**: 如果成员存在于集合中，则将其移除。如果集合不存在，则返回 0。
- **示例**:
  ```plaintext
  SREM myset "banana"
  ```

##### 3. **`SMEMBERS`**

- **功能**: 返回集合中的所有成员
- **语法**: `SMEMBERS key`
- **说明**: 返回集合中的所有成员。如果集合为空，则返回空集合。
- **示例**:
  ```plaintext
  SMEMBERS myset
  ```

##### 4. **`SISMEMBER`**

- **功能**: 判断一个成员是否是集合中的元素
- **语法**: `SISMEMBER key member`
- **说明**: 如果成员在集合中，则返回 1；否则返回 0。
- **示例**:
  ```plaintext
  SISMEMBER myset "apple"
  ```

##### 5. **`SCARD`**

- **功能**: 返回集合中的成员数量
- **语法**: `SCARD key`
- **说明**: 返回集合的大小，即成员的数量。
- **示例**:
  ```plaintext
  SCARD myset
  ```

##### 6. **`SDIFF`**

- **功能**: 返回多个集合的差集
- **语法**: `SDIFF key [key ...]`
- **说明**: 返回第一个集合和所有其他集合的差集。
- **示例**:
  ```plaintext
  SDIFF set1 set2
  ```

##### 7. **`SDIFFSTORE`**

- **功能**: 将多个集合的差集存储到一个新的集合中
- **语法**: `SDIFFSTORE destination key [key ...]`
- **说明**: 将差集存储到 `destination` 集合中。
- **示例**:
  ```plaintext
  SDIFFSTORE diffset set1 set2
  ```

##### 8. **`SINTER`**

- **功能**: 返回多个集合的交集
- **语法**: `SINTER key [key ...]`
- **说明**: 返回所有集合的交集。
- **示例**:
  ```plaintext
  SINTER set1 set2
  ```

##### 9. **`SINTERSTORE`**

- **功能**: 将多个集合的交集存储到一个新的集合中
- **语法**: `SINTERSTORE destination key [key ...]`
- **说明**: 将交集存储到 `destination` 集合中。
- **示例**:
  ```plaintext
  SINTERSTORE interset set1 set2
  ```

##### 10. **`SUNION`**

- **功能**: 返回多个集合的并集
- **语法**: `SUNION key [key ...]`
- **说明**: 返回所有集合的并集。
- **示例**:
  ```plaintext
  SUNION set1 set2
  ```

##### 11. **`SUNIONSTORE`**

- **功能**: 将多个集合的并集存储到一个新的集合中
- **语法**: `SUNIONSTORE destination key [key ...]`
- **说明**: 将并集存储到 `destination` 集合中。
- **示例**:
  ```plaintext
  SUNIONSTORE unionset set1 set2
  ```

##### 12. **`SMOVE`**

- **功能**: 将成员从一个集合移动到另一个集合
- **语法**: `SMOVE source destination member`
- **说明**: 将 `member` 从 `source` 集合移动到 `destination` 集合。如果 `member` 不在 `source` 集合中，则不执行任何操作。
- **示例**:
  ```plaintext
  SMOVE set1 set2 "apple"
  ```

##### 13. **`SRANDMEMBER`**

- **功能**: 随机返回集合中的一个或多个成员
- **语法**: `SRANDMEMBER key [count]`
- **说明**: 返回集合中的随机成员。如果 `count` 为负数，则返回一个随机成员，不去重。
- **示例**:
  ```plaintext
  SRANDMEMBER myset
  SRANDMEMBER myset 3
  ```

##### 14. **`SPOP`**

- **功能**: 从集合中移除并返回一个随机成员
- **语法**: `SPOP key [count]`
- **说明**: 移除并返回集合中的一个或多个随机成员。如果 `count` 为负数，则返回多个成员。
- **示例**:
  ```plaintext
  SPOP myset
  SPOP myset 2
  ```

#### 示例操作

```plaintext
# 向集合中添加元素
SADD myset "apple"
SADD myset "banana" "cherry"

# 从集合中移除元素
SREM myset "banana"

# 获取集合中的所有成员
SMEMBERS myset

# 检查元素是否在集合中
SISMEMBER myset "apple"

# 获取集合的成员数量
SCARD myset

# 获取集合的差集
SDIFF set1 set2

# 将差集存储到新集合
SDIFFSTORE diffset set1 set2

# 获取集合的交集
SINTER set1 set2

# 将交集存储到新集合
SINTERSTORE interset set1 set2

# 获取集合的并集
SUNION set1 set2

# 将并集存储到新集合
SUNIONSTORE unionset set1 set2

# 将元素从一个集合移动到另一个集合
SMOVE set1 set2 "apple"

# 随机返回集合中的一个或多个成员
SRANDMEMBER myset
SRANDMEMBER myset 3

# 从集合中移除并返回一个随机成员
SPOP myset
SPOP myset 2
```

### 小结

Redis 集合是一种强大的数据结构，适用于去重、集合运算等需求。通过掌握这些常用命令，可以有效地管理和操作 Redis 中的集合数据。