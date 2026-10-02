# SPOP

`SPOP` 从集合中随机移除并返回一个或多个成员。与 `SRANDMEMBER` 的区别在于：`SPOP` 会把成员从集合中删除，`SRANDMEMBER` 只读取不删除。

## 语法

```plaintext
SPOP key [count]
```

## 参数说明

- `key`: 集合的键名。
- `count`: 可选，一次移除并返回的成员数量，必须为正整数（Redis 3.2 起支持）。

## 返回值

- 不带 `count` 时，返回被移除的单个成员；集合不存在或已空时返回 `nil`。
- 带 `count` 时，返回被移除成员组成的数组；集合不存在时返回空数组，集合成员少于 `count` 时返回全部成员。
- `count` 不是正整数（例如 0 或负数）时，返回错误 `ERR value is out of range, must be positive`。

## 示例

```plaintext
# 准备示例集合
SADD ba:s:lottery user:1 user:2 user:3 user:4 user:5

# 随机移除并返回一个成员
SPOP ba:s:lottery

# 查看剩余成员
SMEMBERS ba:s:lottery

# 一次随机移除两个成员，返回数组
SPOP ba:s:lottery 2

# count 超过剩余成员数量时，只返回现有成员
SPOP ba:s:lottery 10

# count 为负数会直接报错
SADD ba:s:lottery user:9
SPOP ba:s:lottery -1

# 清理示例键
DEL ba:s:lottery
```

## 使用场景

- **抽奖与随机派发**: 候选名单放入集合，`SPOP` 抽出后自动从池中消失，不会重复中奖。
- **任务随机分配**: 把任务标识放入集合，多个 worker 各自 `SPOP` 认领，天然避免重复处理。
- **限量的随机样本**: 反复 `SPOP` 取样，集合即为不放回的抽样池。

## 注意事项

- `SPOP` 是写命令，成员被返回的同时就从集合中删除；只想"看看"随机成员应使用 `SRANDMEMBER`。
- `count` 参数只能是非负整数，且实际返回数量不会超过集合现有成员数。
- 随机性由 Redis 内部决定，不保证均匀到每一次调用，适合抽奖类业务而不适合密码学用途。
- 移除全部成员后键会被自动删除。
- 由于弹出哪个成员不可预测，业务代码不要假设返回顺序或成员分布。

## 小结

`SPOP` 集随机选择与删除于一体，是"不放回抽样"的标准实现。记住两个关键点：`count` 必须为正整数，返回即删除；与 `SRANDMEMBER`（只读不删，负数 count 允许重复）的语义差异要区分清楚。
