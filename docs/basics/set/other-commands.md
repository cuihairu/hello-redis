# 其他集合命令

除了 `SADD`、`SMEMBERS`、`SPOP`，集合类型还有成员删除、存在性判断、随机取样和交并差运算等命令。这一页按用途分组列出最常用的 11 条。

## 成员管理

### SREM

移除一个或多个成员，语法 `SREM key member [member ...]`，返回实际移除的数量，不存在的成员自动忽略。

```plaintext
SADD ba:s:tags java redis
SREM ba:s:tags java kafka
```

### SCARD

返回集合的成员数量，语法 `SCARD key`，时间复杂度 O(1)，键不存在时返回 0。统计规模用它，读内容用 `SMEMBERS`。

```plaintext
SCARD ba:s:tags
```

### SISMEMBER

判断单个成员是否存在，语法 `SISMEMBER key member`，时间复杂度 O(1)。存在返回 1，不存在返回 0。布尔标记（「已处理」「已点赞」）场景的标准写法。

```plaintext
SISMEMBER ba:s:tags redis
```

### SMISMEMBER

批量判断多个成员是否存在，语法 `SMISMEMBER key member [member ...]`，按传入顺序返回 1 或 0 组成的数组（Redis 6.2 起支持）。逐个调用 `SISMEMBER` 的代码都应改成一条。

```plaintext
SMISMEMBER ba:s:tags redis kafka
```

### SRANDMEMBER

随机返回成员但不删除，语法 `SRANDMEMBER key [count]`。`count` 为正数时返回不超过 count 个不重复成员，为负数时返回 |count| 个允许重复的成员，不带 count 返回单个成员。

```plaintext
SRANDMEMBER ba:s:tags 2
SRANDMEMBER ba:s:tags -5
```

### SMOVE

把成员从一个集合原子地移动到另一个集合，语法 `SMOVE source destination member`。成功返回 1；成员不在 source 中返回 0；即使 destination 已包含该成员也返回 1。

```plaintext
SADD ba:s:done ok
SMOVE ba:s:tags ba:s:done java
```

## 交并差运算

### SINTER

返回多个集合的交集，语法 `SINTER key [key ...]`。只读计算，不修改任何集合。

```plaintext
SADD ba:s:a 1 2 3
SADD ba:s:b 2 3 4
SINTER ba:s:a ba:s:b
```

### SINTERCARD

只返回交集的成员数量，不返回成员本身，语法 `SINTERCARD numkeys key [key ...] [LIMIT limit]`（Redis 7.0 起支持）。第一个参数是参与运算的键数量；`LIMIT` 达到上限即提前返回，适合只关心「是否相交」的场景。

```plaintext
SINTERCARD 2 ba:s:a ba:s:b LIMIT 10
```

### SUNION

返回多个集合的并集，语法 `SUNION key [key ...]`，合并所有集合的成员并自动去重。

```plaintext
SUNION ba:s:a ba:s:b
```

### SDIFF

返回第一个集合相对于后续集合的差集，语法 `SDIFF key [key ...]`。结果与键的传入顺序有关，`SDIFF a b` 与 `SDIFF b a` 通常不同。

```plaintext
SDIFF ba:s:a ba:s:b
```

### SINTERSTORE

计算交集并把结果存入 destination，语法 `SINTERSTORE destination key [key ...]`。对应还有 `SUNIONSTORE`、`SDIFFSTORE`；destination 可以是参与运算的键之一，旧集合因此会被覆盖。

```plaintext
SINTERSTORE ba:s:result ba:s:a ba:s:b
```

## 补充说明

- `SSCAN key cursor [MATCH pattern] [COUNT count]` 用于增量遍历大集合，避免 `SMEMBERS` 一次性阻塞。
- 集合运算的时间复杂度与参与集合的大小相关，大集合运算建议放到 `*STORE` 版本加从节点执行，或先用 `SINTERCARD` 估算规模。

## 小结

成员级别的操作（`SREM`、`SISMEMBER`、`SMOVE`）解决单点问题，集合级别的运算（`SINTER`、`SUNION`、`SDIFF` 及对应 `*STORE` 命令）解决关系计算问题。需要随机但保留成员用 `SRANDMEMBER`，随机且删除用 `SPOP`。
