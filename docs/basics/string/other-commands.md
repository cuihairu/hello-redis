# 其他字符串命令

除了 `SET` 和 `GET`，Redis 字符串还提供批量读写、追加、计数和子串操作等命令。下面列出最常用的 11 条。

## 1. MSET
- **功能**: 一次性设置多个键值对。
- **语法**: `MSET key value [key value ...]`
- **说明**: 原子操作，所有键同时设置成功，不会出现部分写入。
- **示例**:
  ```plaintext
  MSET ba:str:k1 v1 ba:str:k2 v2
  ```

## 2. MGET
- **功能**: 一次性获取多个键的值。
- **语法**: `MGET key [key ...]`
- **说明**: 按传入顺序返回结果，不存在的键对应位置返回 `nil`。
- **示例**:
  ```plaintext
  MGET ba:str:k1 ba:str:k2 ba:str:missing
  ```

## 3. APPEND
- **功能**: 把值追加到已有字符串末尾。
- **语法**: `APPEND key value`
- **说明**: 键不存在时相当于 `SET`，返回追加后字符串的总长度。
- **示例**:
  ```plaintext
  APPEND ba:str:log "first;"
  APPEND ba:str:log "second;"
  ```

## 4. STRLEN
- **功能**: 获取字符串值的字节长度。
- **语法**: `STRLEN key`
- **说明**: 键不存在时返回 0；中文等非 ASCII 字符按 UTF-8 字节数计算，例如 `你好` 为 6。
- **示例**:
  ```plaintext
  STRLEN ba:str:log
  ```

## 5. INCR
- **功能**: 将整数值加 1。
- **语法**: `INCR key`
- **说明**: 键不存在时先按 0 处理再加 1；值不是整数时返回错误，常用于计数器。
- **示例**:
  ```plaintext
  SET ba:str:views 10
  INCR ba:str:views
  ```

## 6. INCRBY
- **功能**: 将整数值增加指定步长。
- **语法**: `INCRBY key increment`
- **说明**: `increment` 可以为负数；对应还有 `DECR`（减 1）和 `DECRBY`（按步长减少）。
- **示例**:
  ```plaintext
  INCRBY ba:str:views 100
  DECRBY ba:str:views 20
  ```

## 7. INCRBYFLOAT
- **功能**: 将数值增加指定浮点步长。
- **语法**: `INCRBYFLOAT key increment`
- **说明**: 支持浮点数和科学计数法输入，返回计算后的新值；多次累加可能产生浮点精度尾数。
- **示例**:
  ```plaintext
  SET ba:str:price 10.5
  INCRBYFLOAT ba:str:price 0.1
  ```

## 8. GETRANGE
- **功能**: 获取字符串指定范围内的子串。
- **语法**: `GETRANGE key start end`
- **说明**: 索引从 0 开始，`start` 和 `end` 都支持负数（从末尾倒数），闭区间包含 `end`。
- **示例**:
  ```plaintext
  SET ba:str:greeting "Hello World"
  GETRANGE ba:str:greeting 0 4
  GETRANGE ba:str:greeting -5 -1
  ```

## 9. SETRANGE
- **功能**: 从指定偏移量开始覆写字符串内容。
- **语法**: `SETRANGE key offset value`
- **说明**: 返回修改后字符串的总长度；若偏移量超过原长度，中间会填充零字节。
- **示例**:
  ```plaintext
  SET ba:str:greeting "Hello World"
  SETRANGE ba:str:greeting 6 Redis
  ```

## 10. GETSET
- **功能**: 设置新值并返回旧值。
- **语法**: `GETSET key value`
- **说明**: 自 Redis 6.2 起官方建议改用 `SET key value GET`，效果相同。
- **示例**:
  ```plaintext
  GETSET ba:str:greeting "Hi Redis"
  ```

## 11. SETNX
- **功能**: 仅当键不存在时设置值。
- **语法**: `SETNX key value`
- **说明**: 自 Redis 2.6.12 起已标记为废弃，建议改用 `SET key value NX`；两者返回值不同（`SETNX` 返回 1 或 0，`SET ... NX` 返回 `OK` 或 `nil`）。
- **示例**:
  ```plaintext
  SETNX ba:str:only-once v1
  SETNX ba:str:only-once v2
  ```

## 小结

这些命令覆盖了字符串类型的典型进阶用法：`MSET`/`MGET` 用于批量读写以减少网络往返，`INCR` 系列用于原子计数，`GETRANGE`/`SETRANGE` 用于按偏移量处理内容。带过期时间或条件写入的需求，统一使用 `SET` 的选项即可。
