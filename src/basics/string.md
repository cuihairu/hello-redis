### Redis 字符串（String）

#### 概述

Redis 字符串是 Redis 中最基本的数据类型，它是二进制安全的，可以包含任何类型的数据（如文本、图像、序列化的对象等）。Redis 字符串的操作非常高效，是 Redis 的默认数据类型。

#### 常用命令

##### 1. **`SET`**

- **功能**: 设置键的值
- **语法**: `SET key value [EX seconds] [PX milliseconds] [NX|XX]`
- **说明**:
  - `EX seconds`: 设置键值对的过期时间（单位：秒）。
  - `PX milliseconds`: 设置键值对的过期时间（单位：毫秒）。
  - `NX`: 只有在键不存在时才设置。
  - `XX`: 只有在键存在时才设置。
- **示例**:
  ```plaintext
  SET name "Alice"
  SET session "abc123" EX 3600
  SET key "value" NX
  ```

##### 2. **`GET`**

- **功能**: 获取键的值
- **语法**: `GET key`
- **说明**: 如果键不存在，返回 `nil`。
- **示例**:
  ```plaintext
  GET name
  ```

##### 3. **`DEL`**

- **功能**: 删除键
- **语法**: `DEL key [key ...]`
- **说明**: 删除一个或多个键。如果键不存在，则忽略。
- **示例**:
  ```plaintext
  DEL name
  DEL key1 key2
  ```

##### 4. **`EXPIRE`**

- **功能**: 设置键的过期时间
- **语法**: `EXPIRE key seconds`
- **说明**: 设置键的过期时间（单位：秒），过期后键将被自动删除。
- **示例**:
  ```plaintext
  EXPIRE session 3600
  ```

##### 5. **`TTL`**

- **功能**: 获取键的剩余生存时间
- **语法**: `TTL key`
- **说明**: 返回键的剩余生存时间（单位：秒）。如果键没有设置过期时间，返回 `-1`。
- **示例**:
  ```plaintext
  TTL session
  ```

##### 6. **`APPEND`**

- **功能**: 将值追加到键的现有值后面
- **语法**: `APPEND key value`
- **说明**: 如果键不存在，则创建键并设置其值。
- **示例**:
  ```plaintext
  APPEND name " Smith"
  ```

##### 7. **`STRLEN`**

- **功能**: 获取键的值的长度
- **语法**: `STRLEN key`
- **说明**: 返回键的值的长度（单位：字节）。
- **示例**:
  ```plaintext
  STRLEN name
  ```

##### 8. **`GETSET`**

- **功能**: 获取键的旧值并设置新值
- **语法**: `GETSET key value`
- **说明**: 将键的值设置为新值，并返回旧值。
- **示例**:
  ```plaintext
  GETSET name "Bob"
  ```

##### 9. **`MSET`**

- **功能**: 批量设置多个键值对
- **语法**: `MSET key1 value1 [key2 value2 ...]`
- **说明**: 同时设置多个键值对，所有键的值都将被设置。
- **示例**:
  ```plaintext
  MSET key1 "value1" key2 "value2"
  ```

##### 10. **`MGET`**

- **功能**: 批量获取多个键的值
- **语法**: `MGET key1 [key2 ...]`
- **说明**: 获取一个或多个键的值。
- **示例**:
  ```plaintext
  MGET key1 key2
  ```

##### 11. **`PSETEX`**

- **功能**: 设置键的值并设置过期时间（单位：毫秒）
- **语法**: `PSETEX key milliseconds value`
- **说明**: 设置键的值，并在指定时间后过期（单位：毫秒）。
- **示例**:
  ```plaintext
  PSETEX temp_key 5000 "temporary"
  ```

##### 12. **`SETRANGE`**

- **功能**: 通过偏移量设置键的值的部分内容
- **语法**: `SETRANGE key offset value`
- **说明**: 从指定的偏移量开始设置键的值的部分内容。如果偏移量超出当前值的长度，将在偏移量与值之间插入零字节。
- **示例**:
  ```plaintext
  SETRANGE key 10 "new_value"
  ```

##### 13. **`GETRANGE`**

- **功能**: 获取键的值的子串
- **语法**: `GETRANGE key start end`
- **说明**: 获取键的值的指定范围的子串。
- **示例**:
  ```plaintext
  GETRANGE key 0 5
  ```

### 示例操作

```plaintext
# 设置键值对
SET user:1000 "Alice"

# 获取键值对
GET user:1000

# 追加值到现有键
APPEND user:1000 " Smith"

# 批量设置键值对
MSET user:1001 "Bob" user:1002 "Charlie"

# 批量获取键的值
MGET user:1001 user:1002

# 设置键的过期时间
EXPIRE user:1000 3600

# 获取键的剩余生存时间
TTL user:1000

# 设置键的值并获取旧值
GETSET user:1000 "David"

# 获取键的值的长度
STRLEN user:1000

# 设置键的部分内容
SETRANGE user:1000 10 "new_value"

# 获取键的值的子串
GETRANGE user:1000 0 5
```

### 小结

Redis 字符串是 Redis 中最基本且最常用的数据类型，支持多种高效的操作。它适用于多种场景，如缓存、计数器等。掌握这些基本操作将有助于你高效地使用 Redis 进行数据存储和处理。