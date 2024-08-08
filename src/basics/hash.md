### Redis 哈希（Hash）

#### 概述

Redis 哈希是一种以键值对形式存储字段和值的数据结构。哈希是一个非常适合存储对象的结构，例如用户信息或商品属性。每个哈希都是由一个键（即哈希的名字）和若干个字段值对组成。

#### 常用命令

##### 1. **`HSET`**

- **功能**: 设置哈希表中的字段值
- **语法**: `HSET key field value`
- **说明**: 如果哈希表不存在，则会创建一个新的哈希表。如果字段已存在，则会覆盖旧值。
- **示例**:
  ```plaintext
  HSET user:1000 name "Alice"
  HSET user:1000 age 30
  ```

##### 2. **`HGET`**

- **功能**: 获取哈希表中指定字段的值
- **语法**: `HGET key field`
- **说明**: 如果字段不存在，返回 `nil`。
- **示例**:
  ```plaintext
  HGET user:1000 name
  ```

##### 3. **`HDEL`**

- **功能**: 删除哈希表中的指定字段
- **语法**: `HDEL key field [field ...]`
- **说明**: 删除一个或多个字段。如果字段不存在，则忽略。
- **示例**:
  ```plaintext
  HDEL user:1000 age
  ```

##### 4. **`HGETALL`**

- **功能**: 获取哈希表中所有字段及其值
- **语法**: `HGETALL key`
- **说明**: 返回哈希表中所有字段和对应的值。
- **示例**:
  ```plaintext
  HGETALL user:1000
  ```

##### 5. **`HKEYS`**

- **功能**: 获取哈希表中所有字段的名称
- **语法**: `HKEYS key`
- **说明**: 返回哈希表中所有字段的名称。
- **示例**:
  ```plaintext
  HKEYS user:1000
  ```

##### 6. **`HVALS`**

- **功能**: 获取哈希表中所有字段的值
- **语法**: `HVALS key`
- **说明**: 返回哈希表中所有字段的值。
- **示例**:
  ```plaintext
  HVALS user:1000
  ```

##### 7. **`HLEN`**

- **功能**: 获取哈希表中字段的数量
- **语法**: `HLEN key`
- **说明**: 返回哈希表中字段的数量。
- **示例**:
  ```plaintext
  HLEN user:1000
  ```

##### 8. **`HINCRBY`**

- **功能**: 增加哈希表中指定字段的整数值
- **语法**: `HINCRBY key field increment`
- **说明**: 如果字段不存在，则创建该字段并将其值设置为 `increment`。支持负数。
- **示例**:
  ```plaintext
  HINCRBY user:1000 age 1
  ```

##### 9. **`HMSET`**

- **功能**: 同时设置哈希表中多个字段的值
- **语法**: `HMSET key field1 value1 [field2 value2 ...]`
- **说明**: 一次性设置多个字段的值。
- **示例**:
  ```plaintext
  HMSET user:1000 name "Alice" age 30
  ```

##### 10. **`HMGET`**

- **功能**: 获取哈希表中多个字段的值
- **语法**: `HMGET key field1 [field2 ...]`
- **说明**: 获取一个或多个字段的值。
- **示例**:
  ```plaintext
  HMGET user:1000 name age
  ```

##### 11. **`HSCAN`**

- **功能**: 遍历哈希表中的字段和字段值
- **语法**: `HSCAN key cursor [MATCH pattern] [COUNT count]`
- **说明**: 用于遍历哈希表中的字段，支持模式匹配和限制返回的字段数量。
- **示例**:
  ```plaintext
  HSCAN user:1000 0 MATCH name*
  ```

#### 示例操作

```plaintext
# 设置哈希表字段的值
HSET user:1000 name "Alice"
HSET user:1000 age 30

# 获取哈希表字段的值
HGET user:1000 name

# 删除哈希表中的字段
HDEL user:1000 age

# 获取哈希表中的所有字段和值
HGETALL user:1000

# 获取哈希表中的所有字段名
HKEYS user:1000

# 获取哈希表中的所有字段值
HVALS user:1000

# 获取哈希表中的字段数量
HLEN user:1000

# 增加哈希表中指定字段的整数值
HINCRBY user:1000 age 1

# 同时设置哈希表中多个字段的值
HMSET user:1000 name "Alice" age 30

# 获取哈希表中多个字段的值
HMGET user:1000 name age

# 遍历哈希表中的字段和字段值
HSCAN user:1000 0 MATCH name*
```

### 小结

Redis 哈希是一种非常灵活的数据结构，适用于存储和操作复杂的对象数据。通过掌握哈希表的常用操作，可以高效地管理和访问存储在 Redis 中的对象数据。