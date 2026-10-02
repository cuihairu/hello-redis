# RPUSH

`RPUSH` 将一个或多个值插入到列表的尾部（右侧），是最符合"先进先出"直觉的入队命令。头部、尾部插入的时间复杂度都是 O(1)。

## 语法

```plaintext
RPUSH key value [value ...]
```

## 参数说明

- `key`: 列表的键名。
- `value`: 要插入的一个或多个值，二进制安全。
- 给定多个值时按参数顺序依次追加到尾部，因此最后一个参数排在列表末尾。

## 返回值

返回插入操作完成后列表的长度。对非列表类型的键执行会返回 `WRONGTYPE` 错误。

## 示例

```plaintext
# 按顺序追加 a、b
RPUSH ba:l:queue a
RPUSH ba:l:queue b

# 一次追加多个值，结果为 a b c d
RPUSH ba:l:queue c d

# 查看整个列表
LRANGE ba:l:queue 0 -1

# 配合 LPOP 实现先进先出队列，先取出 a
LPOP ba:l:queue

# 只在键存在时执行尾部插入
RPUSHX ba:l:queue z
RPUSHX ba:l:nonotexist z

# 查看列表长度
LLEN ba:l:queue

# 清理示例键
DEL ba:l:queue ba:l:nonotexist
```

## 使用场景

- **消息队列（FIFO）**: `RPUSH` 入队，`LPOP` 出队；需要阻塞等待时改用 `BLPOP`。
- **日志与流水记录**: 按时间顺序追加记录，`LRANGE` 分页读取。
- **有序收集**: 与 `LPUSH` 的区别只在插入端，`RPUSH` 保持"先来的在前面"。

## 注意事项

- 键不存在时自动创建列表；键存在但类型不是列表时报 `WRONGTYPE` 错误。
- `RPUSHX` 只在键已存在时插入，不会创建新键，适合对已初始化列表的追加操作。
- 单个列表最多存储 4294967295（2^32 - 1）个元素。
- 列表越长，`LRANGE` 大范围取值和 `LINDEX` 随机访问的成本越高；超大列表应配合 `LTRIM` 控制长度或改用其他结构。
- `RPUSH` 与 `LPUSH` 可以混用于同一个列表，元素顺序完全由插入端决定。

## 小结

`RPUSH` 是列表尾部插入命令，常与 `LPOP`/`BLPOP` 组成先进先出队列。多个值一次插入时按参数顺序排列，与 `LPUSH` 的"倒序"效果正好相反。
