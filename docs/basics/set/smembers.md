# SMEMBERS

`SMEMBERS` 返回集合中的全部成员。时间复杂度为 O(N)，N 是集合的成员数量。

## 语法

```plaintext
SMEMBERS key
```

## 参数说明

- `key`: 集合的键名。

## 返回值

- 返回包含所有成员的数组，顺序不保证与插入顺序一致。
- 键不存在时返回空数组。
- 键存在但不是集合类型时，返回 `WRONGTYPE` 错误。

## 示例

```plaintext
# 准备示例集合
SADD ba:s:framework spring
SADD ba:s:framework netty redis

# 返回全部成员（顺序可能与插入顺序不同）
SMEMBERS ba:s:framework

# 不存在的键返回空数组
SMEMBERS ba:s:nonotexist

# 大集合建议用 SSCAN 增量遍历
SSCAN ba:s:framework 0 COUNT 10

# 判断单个成员是否存在用 SISMEMBER，成本 O(1)
SISMEMBER ba:s:framework netty

# 清理示例键
DEL ba:s:framework ba:s:nonotexist
```

## 与其他读取命令的对比

- `SCARD`: 只返回成员数量，成本 O(1)，统计规模时优先使用。
- `SISMEMBER`: 只判断某个成员是否存在，成本 O(1)。
- `SRANDMEMBER`: 随机返回部分成员，不删除。
- `SSCAN`: 渐进式遍历，适合成员非常多、不允许长时间阻塞的场景。
- `SINTER`/`SUNION`/`SDIFF`: 返回多个集合运算的结果，而不是单个集合的内容。

## 注意事项

- `SMEMBERS` 会一次性返回全部成员并阻塞后续命令，集合达到十万、百万级成员时应改用 `SSCAN` 分批读取。
- 返回顺序不确定，不要依赖顺序做业务逻辑；需要顺序时改用有序集合（ZSet）或列表。
- 空数组与 `nil` 不同：键不存在时 `SMEMBERS` 返回的是空数组，客户端应按"空集合"处理。
- 需要随机取样时用 `SRANDMEMBER`，不要把整个集合读回客户端再随机。

## 小结

`SMEMBERS` 是集合的全量读取命令，简单直观，但只适合小集合。生产环境中对大集合应使用 `SSCAN` 增量遍历，判断成员是否存在则交给 `SISMEMBER`。
