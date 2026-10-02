# ZRANGE

`ZRANGE` 返回有序集合中指定范围的成员。自 Redis 6.2 起，它统一了旧的 `ZRANGEBYSCORE`、`ZREVRANGE` 等命令，通过选项即可按下标、分数或字典序取区间。

## 语法

```plaintext
ZRANGE key start stop [BYSCORE | BYLEX] [REV] [LIMIT offset count] [WITHSCORES]
```

## 参数说明

- `key`: 有序集合的键名。
- `start stop`: 范围端点。按下标（默认）或按 `REV` 反向时是 0 开始的下标，支持负数从尾部倒数；`BYSCORE`/`BYLEX` 时则是分数或字典序端点。
- `BYSCORE`: 按分数区间取成员，端点可写 `+inf`、`-inf`，加 `(` 前缀表示开区间。
- `BYLEX`: 按成员的字典序取区间，端点用 `[`（含）或 `(`（不含）前缀。
- `REV`: 反向（从高到低）取值，此时 `start` 是范围中较高的一端。
- `LIMIT offset count`: 仅与 `BYSCORE`、`BYLEX` 搭配，`offset` 从 0 开始，`count` 为负数表示返回剩余全部成员。
- `WITHSCORES`: 结果中同时返回每个成员的分数。

## 返回值

返回成员组成的数组；带 `WITHSCORES` 时返回"成员、分数"交替排列的数组。键不存在时返回空数组。

## 示例

```plaintext
# 准备示例数据
ZADD ba:z:board 80 dave 90 bob 95 carol 100 alice

# 按下标取全部成员（分数从低到高）
ZRANGE ba:z:board 0 -1

# 附带分数
ZRANGE ba:z:board 0 -1 WITHSCORES

# 负数下标，取最后两名
ZRANGE ba:z:board -2 -1

# 反向取分数最高的两名
ZRANGE ba:z:board 0 1 REV WITHSCORES

# 按分数区间取成员，"(90" 表示不含 90 分
ZRANGE ba:z:board (90 100 BYSCORE WITHSCORES

# 按分数区间反向取，并只取前两个
ZRANGE ba:z:board +inf 90 BYSCORE REV LIMIT 0 2 WITHSCORES

# 按字典序取区间
ZADD ba:z:lex 0 a 0 b 0 c 0 d
ZRANGE ba:z:lex [a (c BYLEX

# 下标越界时返回空数组
ZRANGE ba:z:lex 100 200

# 清理示例键
DEL ba:z:board ba:z:lex
```

## 注意事项

- 不带 `REV` 时结果按分数从低到高排列，与直觉上的"排行榜第一名在前"相反，通常排行榜要用 `REV`。
- `LIMIT` 只能在 `BYSCORE` 或 `BYLEX` 模式下使用，按下标取值时不支持。
- `BYLEX` 要求所有成员分数相同才有意义，否则结果不按预期排序。
- `BYSCORE` 模式下使用 `REV` 时，端点也要反过来写（先写高分端）。
- 旧命令 `ZRANGEBYSCORE`、`ZREVRANGE`、`ZRANGEBYLEX` 自 Redis 6.2 起标记为废弃，仍可用，建议统一改用 `ZRANGE` 加选项的写法。

## 小结

`ZRANGE` 是有序集合最重要的读取命令：按下标取区间是默认行为，`BYSCORE`/`BYLEX` 扩展到按分数和字典序，`REV` 与 `LIMIT` 负责反向和分页。掌握端点写法（负数下标、`(` 开区间、`+inf`）即可覆盖排行榜的全部查询需求。
