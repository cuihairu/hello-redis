# LPUSH

`LPUSH` 将一个或多个值插入到列表的头部（左侧）。Redis 列表是按插入顺序排列的字符串集合，底层为快速列表（listpack/quicklist），头部和尾部插入都是 O(1)。

## 语法

```plaintext
LPUSH key value [value ...]
```

## 参数说明

- `key`: 列表的键名。
- `value`: 要插入的一个或多个值，二进制安全。
- 给定多个值时，按参数顺序依次插入到头部，因此最后一个参数会出现在列表最前面。

## 返回值

返回插入操作完成后列表的长度。对非列表类型的键执行会返回 `WRONGTYPE` 错误。

## 示例

```plaintext
# 依次插入 a、b
LPUSH ba:l:stack a
LPUSH ba:l:stack b

# 一次插入两个值，c 先入、d 后入，所以 d 在最前面
LPUSH ba:l:stack c d

# 查看整个列表，结果为 d c b a
LRANGE ba:l:stack 0 -1

# 查看列表长度
LLEN ba:l:stack

# 只在键存在时执行头部插入（键不存在时不创建，返回 0）
LPUSHX ba:l:stack z
LPUSHX ba:l:nolist z

# 清理示例键
DEL ba:l:stack ba:l:nolist
```

## 使用场景

- **栈（LIFO）**: `LPUSH` 配合 `LPOP`，后进先出。
- **最新动态列表**: 每条新记录 `LPUSH` 进头部，`LRANGE key 0 9` 取最新 10 条，再配合 `LTRIM` 固定列表长度，就是一个轻量的"最近 N 条"缓存。
- **任务收集**: 生产者把任务压入头部，消费者从尾部 `RPOP` 取走。

## 注意事项

- 键不存在时会先创建空列表再插入；键存在但不是列表类型时报 `WRONGTYPE` 错误。
- 需要判断"键是否存在才插入"时使用 `LPUSHX`，它不会创建新键。
- 单个列表最多能存储 4294967295（2^32 - 1）个元素。
- `LPUSH` 后元素在头部的排列顺序容易搞混：多个值是一次性传入时，最后一个值离头部最近。
- 如果插入和弹出需要阻塞等待，客户端应改用 `BLPOP`/`BRPOP`，避免自己写轮询。

## 小结

`LPUSH` 是列表头部插入的标准命令，配合 `LRANGE`、`LPOP`、`LTRIM` 可以实现栈、最新动态列表等典型结构。多个值一起插入时注意参数顺序与最终排列是相反的。
