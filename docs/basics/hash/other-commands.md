# 其他哈希命令

除了 `HSET` 和 `HGET`，哈希类型还有批量读取、字段管理、原子计数等命令。这一页按用途分组列出最常用的 11 条。

## 批量读取

### HMGET

一次获取多个字段的值，语法 `HMGET key field [field ...]`，时间复杂度 O(N)。按传入顺序返回，不存在的字段对应位置为 `nil`。循环调用多次 `HGET` 的代码都应改成一条 `HMGET`。

```plaintext
HMGET ba:h:user:1000 name age email
```

### HGETALL

返回哈希表中所有字段和值，语法 `HGETALL key`，时间复杂度 O(N)。结果是「字段、值」交替排列的数组；字段非常多时建议改用 `HSCAN` 分批遍历，避免一次性返回阻塞后续命令。

```plaintext
HGETALL ba:h:user:1000
```

## 字段管理

### HDEL

删除一个或多个字段，语法 `HDEL key field [field ...]`，返回实际删除的字段数量。不存在的字段自动忽略；删除全部字段后整个键也会消失。

```plaintext
HDEL ba:h:user:1000 age city
```

### HLEN

返回哈希表中字段的数量，语法 `HLEN key`，时间复杂度 O(1)，键不存在时返回 0。

```plaintext
HLEN ba:h:user:1000
```

### HEXISTS

判断字段是否存在，语法 `HEXISTS key field`，存在返回 1，不存在返回 0。只关心「有没有」而不需要值时，它比 `HGET` 更省传输。

```plaintext
HEXISTS ba:h:user:1000 name
```

### HKEYS / HVALS

`HKEYS` 返回所有字段名，`HVALS` 返回所有字段值，时间复杂度都是 O(N)。大哈希建议用 `HSCAN` 代替，避免一次性返回。

```plaintext
HKEYS ba:h:user:1000
HVALS ba:h:user:1000
```

## 原子计数

### HINCRBY

将字段的整数值增加指定步长，语法 `HINCRBY key field increment`。字段不存在时先按 0 处理，`increment` 可为负数，字段值不是整数时报错。

```plaintext
HSET ba:h:article:1 likes 10
HINCRBY ba:h:article:1 likes -3
```

### HINCRBYFLOAT

将字段的数值增加指定浮点步长，语法 `HINCRBYFLOAT key field increment`，支持浮点增量，返回计算后的新值字符串。

```plaintext
HSET ba:h:account:1 balance 100
HINCRBYFLOAT ba:h:account:1 balance -10.5
```

## 条件写入与随机取样

### HSETNX

仅当字段不存在时设置值，语法 `HSETNX key field value`。设置成功返回 1，字段已存在返回 0 且不覆盖原值，每次只能处理一个字段。

```plaintext
HSETNX ba:h:user:1000 name Alice
```

### HRANDFIELD

随机返回字段名或「字段-值」对，语法 `HRANDFIELD key [count [WITHVALUES]]`（Redis 6.2 起支持）。`count` 为正数时返回不超过 count 个不重复字段，为负数时返回 |count| 个允许重复的字段；带 `WITHVALUES` 时同时返回对应的值。

```plaintext
HRANDFIELD ba:h:user:1000 2 WITHVALUES
```

## 补充说明

- 旧命令 `HMSET` 自 Redis 4.0 起标记为废弃但仍可用，多字段写入统一改用 `HSET`。
- `HSCAN key cursor [MATCH pattern] [COUNT count]` 用于增量遍历大哈希，用法与 `SCAN` 一致。
- 对哈希字段做计数务必走 `HINCRBY`/`HINCRBYFLOAT`，不要用 `HGET` 加 `HSET` 组合，并发下会丢失更新。

## 小结

这批命令覆盖了哈希的批量读取、字段删除、存在性判断、原子计数和随机取样。单字段用 `HGET`，多字段用 `HMGET`，全量遍历优先 `HSCAN`，数值变更一律用 `HINCRBY` 系列。
