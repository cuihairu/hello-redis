# 其他哈希命令

除了 `HSET` 和 `HGET`，哈希类型还提供批量读写、删除、计数、遍历等命令。下面列出最常用的 12 条。

## 1. HMGET

- **功能**: 一次获取多个字段的值。
- **语法**: `HMGET key field [field ...]`
- **说明**: 按传入顺序返回，不存在的字段对应位置为 `nil`。
- **示例**:
  ```plaintext
  HMGET ba:h:user:1000 name age email
  ```

## 2. HGETALL

- **功能**: 返回哈希表中所有字段和值。
- **语法**: `HGETALL key`
- **说明**: 返回"字段、值"交替排列的数组；字段非常多时建议改用 `HSCAN` 分批遍历。
- **示例**:
  ```plaintext
  HGETALL ba:h:user:1000
  ```

## 3. HDEL

- **功能**: 删除一个或多个字段。
- **语法**: `HDEL key field [field ...]`
- **说明**: 返回实际删除的字段数量，不存在的字段自动忽略；删除全部字段后整个键也会消失。
- **示例**:
  ```plaintext
  HDEL ba:h:user:1000 age city
  ```

## 4. HLEN

- **功能**: 返回哈希表中字段的数量。
- **语法**: `HLEN key`
- **说明**: 键不存在时返回 0，时间复杂度 O(1)。
- **示例**:
  ```plaintext
  HLEN ba:h:user:1000
  ```

## 5. HEXISTS

- **功能**: 判断字段是否存在。
- **语法**: `HEXISTS key field`
- **说明**: 存在返回 1，不存在返回 0。
- **示例**:
  ```plaintext
  HEXISTS ba:h:user:1000 name
  ```

## 6. HSTRLEN

- **功能**: 返回字段值的字节长度。
- **语法**: `HSTRLEN key field`
- **说明**: 只返回长度，不传输值本身；字段不存在时返回 0（Redis 3.2 起支持）。
- **示例**:
  ```plaintext
  HSTRLEN ba:h:user:1000 name
  ```

## 7. HKEYS

- **功能**: 返回哈希表中所有字段名。
- **语法**: `HKEYS key`
- **说明**: 大哈希建议用 `HSCAN` 代替，避免一次性返回阻塞。
- **示例**:
  ```plaintext
  HKEYS ba:h:user:1000
  ```

## 8. HVALS

- **功能**: 返回哈希表中所有字段的值。
- **语法**: `HVALS key`
- **说明**: 只返回值列表，不含字段名。
- **示例**:
  ```plaintext
  HVALS ba:h:user:1000
  ```

## 9. HINCRBY

- **功能**: 将字段的整数值增加指定步长。
- **语法**: `HINCRBY key field increment`
- **说明**: 字段不存在时先按 0 处理；`increment` 可为负数；字段值不是整数时报错。
- **示例**:
  ```plaintext
  HSET ba:h:article:1 likes 10
  HINCRBY ba:h:article:1 likes -3
  ```

## 10. HINCRBYFLOAT

- **功能**: 将字段的数值增加指定浮点步长。
- **语法**: `HINCRBYFLOAT key field increment`
- **说明**: 支持浮点增量，返回计算后的新值字符串。
- **示例**:
  ```plaintext
  HSET ba:h:account:1 balance 100
  HINCRBYFLOAT ba:h:account:1 balance -10.5
  ```

## 11. HSETNX

- **功能**: 仅当字段不存在时设置值。
- **语法**: `HSETNX key field value`
- **说明**: 设置成功返回 1，字段已存在返回 0 且不覆盖原值，每次只能处理一个字段。
- **示例**:
  ```plaintext
  HSETNX ba:h:user:1000 name Alice
  ```

## 12. HRANDFIELD

- **功能**: 随机返回字段名或"字段-值"对。
- **语法**: `HRANDFIELD key [count [WITHVALUES]]`
- **说明**: `count` 为正数时返回不超过 count 个不重复字段，为负数时返回 |count| 个允许重复的字段；带 `WITHVALUES` 时同时返回对应的值（Redis 6.2 起支持）。
- **示例**:
  ```plaintext
  HRANDFIELD ba:h:user:1000 2 WITHVALUES
  ```

## 补充说明

- `HMSET` 自 Redis 4.0 起标记为废弃但仍可用，多字段写入统一改用 `HSET` 即可。
- `HSCAN key cursor [MATCH pattern] [COUNT count]` 用于增量遍历大哈希，用法与 `SCAN` 一致。
- 对哈希字段做计数时务必使用 `HINCRBY`/`HINCRBYFLOAT`，不要用 `HGET` 加 `HSET` 组合，避免并发丢失更新。

## 小结

这批命令覆盖了哈希的批量读取、字段删除、存在性判断、原子计数和随机取样等场景。核心原则是：单字段用 `HGET`，多字段用 `HMGET`，全量遍历优先 `HSCAN`，数值变更一律用 `HINCRBY` 系列。
