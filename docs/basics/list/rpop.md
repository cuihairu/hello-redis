# RPOP

`RPOP` 移除并返回列表尾部的元素。与 `LPOP` 对称，常用于从队列另一端消费，或配合 `LPUSH` 实现栈。时间复杂度为 O(1)。

## 语法

```plaintext
RPOP key [count]
```

## 参数说明

- `key`: 列表的键名。
- `count`: 可选，一次弹出多个元素（Redis 6.2 起支持），必须为非负整数。

## 返回值

- 不带 `count` 时，返回尾部元素的值；列表不存在或为空时返回 `nil`。
- 带 `count` 时，返回从尾部开始弹出的元素数组（按尾部到头部的顺序）；列表不存在时返回空数组。
- 对非列表类型的键执行会返回 `WRONGTYPE` 错误。

## 示例

```plaintext
# 准备示例列表，结果为 a b c d
RPUSH ba:l:log a b c d

# 弹出尾部元素，返回 d
RPOP ba:l:log

# 剩余元素为 a b c
LRANGE ba:l:log 0 -1

# 一次弹出两个，返回 c 和 b
RPOP ba:l:log 2

# 配合 LPUSH 实现后进先出
LPUSH ba:l:call first
LPUSH ba:l:call second
RPOP ba:l:call

# 列表为空时返回 nil
RPOP ba:l:log

# 清理示例键
DEL ba:l:log ba:l:call
```

## 使用场景

- **栈（LIFO）**: `LPUSH` 压栈、`RPOP` 弹栈，后进先出。
- **多端消费**: 一个列表同时被多个消费者处理时，一部分用 `LPOP`、一部分用 `RPOP`，减少竞争。
- **配额回收**: 把超量的历史记录从尾部弹出丢弃，配合 `LTRIM` 效果类似但语义不同。

## 注意事项

- 弹出后列表为空时键会被自动删除。
- 带 `count` 时返回数组的排列顺序是"从尾部往头部"，与 `LPOP ... count` 的方向相反，注意业务侧的顺序处理。
- 需要阻塞等待新元素时，应使用 `BRPOP` 而不是轮询 `RPOP`。
- "从 source 尾部弹出并压入 destination 头部"这一原子操作，推荐使用 `LMOVE source destination RIGHT LEFT`（旧命令 `RPOPLPUSH` 自 Redis 6.2 起标记为废弃，仍可用）。
- 对空列表执行 `RPOP` 只是返回 `nil`，不会报错。

## 小结

`RPOP` 从列表尾部弹出元素，与 `LPOP` 一起构成列表的两端消费能力。与 `LPUSH` 组合即得到栈结构；涉及跨列表的原子搬运时，优先使用 `LMOVE`。
