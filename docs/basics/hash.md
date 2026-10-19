# Redis 哈希（Hash）

## 概述

Redis 哈希是一种以键值对形式存储字段和值的数据结构。哈希是一个非常适合存储对象的结构，例如用户信息或商品属性。每个哈希都是由一个键（即哈希的名字）和若干个字段值对组成。

## 结构图

![Redis Hash 结构](/structures/hash.png)

## 常用命令

### 1. **`HSET`**

- **功能**: 设置哈希表中的字段值
- **语法**: `HSET key field value`
- **说明**: 如果哈希表不存在，则会创建一个新的哈希表。如果字段已存在，则会覆盖旧值。
- **示例**:
  ```plaintext
  HSET user:1000 name "Alice"
  HSET user:1000 age 30
  ```

### 2. **`HGET`**

- **功能**: 获取哈希表中指定字段的值
- **语法**: `HGET key field`
- **说明**: 如果字段不存在，返回 `nil`。
- **示例**:
  ```plaintext
  HGET user:1000 name
  ```

### 3. **`HDEL`**

- **功能**: 删除哈希表中的指定字段
- **语法**: `HDEL key field [field ...]`
- **说明**: 删除一个或多个字段。如果字段不存在，则忽略。
- **示例**:
  ```plaintext
  HDEL user:1000 age
  ```

### 4. **`HGETALL`**

- **功能**: 获取哈希表中所有字段及其值
- **语法**: `HGETALL key`
- **说明**: 返回哈希表中所有字段和对应的值。
- **示例**:
  ```plaintext
  HGETALL user:1000
  ```

### 5. **`HKEYS`**

- **功能**: 获取哈希表中所有字段的名称
- **语法**: `HKEYS key`
- **说明**: 返回哈希表中所有字段的名称。
- **示例**:
  ```plaintext
  HKEYS user:1000
  ```

### 6. **`HVALS`**

- **功能**: 获取哈希表中所有字段的值
- **语法**: `HVALS key`
- **说明**: 返回哈希表中所有字段的值。
- **示例**:
  ```plaintext
  HVALS user:1000
  ```

### 7. **`HLEN`**

- **功能**: 获取哈希表中字段的数量
- **语法**: `HLEN key`
- **说明**: 返回哈希表中字段的数量。
- **示例**:
  ```plaintext
  HLEN user:1000
  ```

### 8. **`HINCRBY`**

- **功能**: 增加哈希表中指定字段的整数值
- **语法**: `HINCRBY key field increment`
- **说明**: 如果字段不存在，则创建该字段并将其值设置为 `increment`。支持负数。
- **示例**:
  ```plaintext
  HINCRBY user:1000 age 1
  ```

### 9. **`HMSET`**

- **功能**: 同时设置哈希表中多个字段的值
- **语法**: `HMSET key field1 value1 [field2 value2 ...]`
- **说明**: 一次性设置多个字段的值。自 Redis 4.0 起该命令已被标记为过期，建议使用 `HSET key field1 value1 [field2 value2 ...]` 代替（`HSET` 本身即支持一次设置多个字段）。
- **示例**:
  ```plaintext
  HMSET user:1000 name "Alice" age 30
  ```

### 10. **`HMGET`**

- **功能**: 获取哈希表中多个字段的值
- **语法**: `HMGET key field1 [field2 ...]`
- **说明**: 获取一个或多个字段的值。
- **示例**:
  ```plaintext
  HMGET user:1000 name age
  ```

### 11. **`HSCAN`**

- **功能**: 遍历哈希表中的字段和字段值
- **语法**: `HSCAN key cursor [MATCH pattern] [COUNT count]`
- **说明**: 用于遍历哈希表中的字段，支持模式匹配和限制返回的字段数量。
- **示例**:
  ```plaintext
  HSCAN user:1000 0 MATCH name*
  ```

## 示例操作

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
HSET user:1000 name "Alice" age 30

# 获取哈希表中多个字段的值
HMGET user:1000 name age

# 遍历哈希表中的字段和字段值
HSCAN user:1000 0 MATCH name*
```

## 特点

- **字段级读写**：`HGET`/`HSET` 只取需要的字段，比整读 JSON 省带宽。
- **field 唯一无序**：同一 key 下 field 不可重复，遍历顺序不保证。
- **内存紧凑**：小哈希（field 数 ≤ hash-max-listpack-entries，默认 128）用 listpack 编码，比字符串存 JSON 更省。
- **字段自增**：`HINCRBY` 对单个字段原子加减。
- **无整体过期**：过期是键级的，不能给单个 field 设 TTL。

## 使用场景

```plaintext
# 1. 对象存储：单个字段可改，不必重写整个对象
HSET user:1001 name Alice
HSET user:1001 email alice@example.com
HGET user:1001 email

# 2. 购物车：商品数量用字段计数
HSET cart:u1001 sku:1001 2
HINCRBY cart:u1001 sku:1001 1   # 再买 1 件

# 3. 配置集合：按字段读取局部配置
HGETALL app:config
```

## 小结

Redis 哈希是一种非常灵活的数据结构，适用于存储和操作复杂的对象数据。我在 Redis 中使用哈希存放对象字段时，常用操作及访问方式如下文所述。

## 参考资料

- [Redis 开发文档](https://redis.io/docs/latest/develop/)
- [Redis 开发文档 · Hashes](https://redis.io/docs/latest/develop/data-types/hashes/)

<!-- BACKLINKS-AUTO -->
## 相关页面

- [glossary](/appendix/glossary.md)
- [README](README.md)
