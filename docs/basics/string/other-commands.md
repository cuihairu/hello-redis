# 其他字符串命令

除了 `SET` 和 `GET`，字符串类型还有批量读写、追加、计数和子串操作等命令。这一页按用途分组列出最常用的 11 条。

## 批量读写

### MSET

一次设置多个键值对，语法 `MSET key value [key value ...]`，返回 `OK`。它是原子操作，所有键同时设置成功，不会出现部分写入。

```plaintext
MSET ba:str:k1 v1 ba:str:k2 v2
```

### MGET

一次获取多个键的值，语法 `MGET key [key ...]`，时间复杂度 O(N)。按传入顺序返回结果，不存在的键对应位置返回 `nil`。循环调用多次 `GET` 的代码都应改成一条 `MGET`，省掉多次网络往返。

```plaintext
MGET ba:str:k1 ba:str:k2 ba:str:missing
```

## 追加与长度

### APPEND

把值追加到已有字符串末尾，语法 `APPEND key value`，时间复杂度 O(1)。键不存在时相当于 `SET`，返回追加后字符串的总长度。

```plaintext
APPEND ba:str:log "first;"
APPEND ba:str:log "second;"
```

### STRLEN

返回字符串值的字节长度，语法 `STRLEN key`，时间复杂度 O(1)，键不存在时返回 0。中文等非 ASCII 字符按 UTF-8 字节数计算，例如 `你好` 是 6 个字节，拿它当「字符数」用会得出错误结论。

```plaintext
STRLEN ba:str:log
```

## 计数

### INCR

将整数值加 1，语法 `INCR key`，时间复杂度 O(1)，返回加完后的新值。键不存在时先按 0 处理再加 1；值不是整数时返回错误。这是计数器场景的标准写法。

```plaintext
SET ba:str:views 10
INCR ba:str:views
```

### INCRBY

将整数值增加指定步长，语法 `INCRBY key increment`。`increment` 可以为负数；对应还有 `DECR`（减 1）和 `DECRBY`（按步长减少），行为一致。

```plaintext
INCRBY ba:str:views 100
DECRBY ba:str:views 20
```

### INCRBYFLOAT

将数值增加指定浮点步长，语法 `INCRBYFLOAT key increment`，支持浮点数和科学计数法输入，返回计算后的新值。多次累加可能产生浮点精度尾数，金额等要求精确的场景要留意。

```plaintext
SET ba:str:price 10.5
INCRBYFLOAT ba:str:price 0.1
```

## 子串操作

### GETRANGE

获取字符串指定范围内的子串，语法 `GETRANGE key start end`，时间复杂度 O(N)。索引从 0 开始，`start` 和 `end` 都支持负数（从末尾倒数），闭区间包含 `end`。

```plaintext
SET ba:str:greeting "Hello World"
GETRANGE ba:str:greeting 0 4
GETRANGE ba:str:greeting -5 -1
```

### SETRANGE

从指定偏移量开始覆写字符串内容，语法 `SETRANGE key offset value`，返回修改后字符串的总长度。偏移量超过原长度时，中间会填充零字节。

```plaintext
SET ba:str:greeting "Hello World"
SETRANGE ba:str:greeting 6 Redis
```

## 已被 SET 取代的命令

### GETSET

设置新值并返回旧值，语法 `GETSET key value`。自 Redis 6.2 起官方建议改用 `SET key value GET`，效果相同。

```plaintext
GETSET ba:str:greeting "Hi Redis"
```

### SETNX

仅当键不存在时设置值，语法 `SETNX key value`。自 Redis 2.6.12 起已标记为废弃，新代码统一用 `SET key value NX`。两者返回值不同：`SETNX` 返回 1 或 0，`SET ... NX` 返回 `OK` 或 `nil`。

```plaintext
SETNX ba:str:only-once v1
SETNX ba:str:only-once v2
```

## 小结

这些命令覆盖了字符串的典型进阶用法：`MSET`/`MGET` 批量读写以减少网络往返，`INCR` 系列做原子计数，`GETRANGE`/`SETRANGE` 按偏移量处理内容。带过期时间或条件写入的需求，统一交给 `SET` 的选项。
