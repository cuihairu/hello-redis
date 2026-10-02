# ZADD

`ZADD` 向有序集合添加一个或多个成员及其分数（score）。有序集合按分数排序，分数相同的成员按成员的字典序排列，是排行榜、延时队列等场景的核心结构。

## 语法

```plaintext
ZADD key [NX|XX] [GT|LT] [CH] [INCR] score member [score member ...]
```

## 参数说明

- `key`: 有序集合的键名。
- `score`: 成员的分数，双精度浮点数，支持 `-inf` 和 `+inf`。
- `member`: 成员，二进制安全的字符串，集合内唯一。
- `NX`: 只添加新成员，不更新已存在成员的分数。
- `XX`: 只更新已存在成员的分数，不添加新成员。
- `GT`: 只在新分数大于当前分数时更新（Redis 6.2 起支持）。
- `LT`: 只在新分数小于当前分数时更新（Redis 6.2 起支持）。
- `CH`: 将返回值改为"被修改的成员数量"（新增数 + 分数变化数）。
- `INCR`: 以增量方式执行，此时只能给一个成员打分，行为等价于 `ZINCRBY`。

## 返回值

- 默认返回**新增**成员的数量。
- 使用 `CH` 时返回被修改（新增或分数变化）的成员数量。
- 使用 `INCR` 时返回成员的新分数（字符串形式）；带 `NX` 且成员已存在时不执行增量，返回 `nil`。

## 示例

```plaintext
# 添加成员
ZADD ba:z:board 100 alice
ZADD ba:z:board 90 bob 95 carol

# 查看排名与分数
ZRANGE ba:z:board 0 -1 WITHSCORES

# 更新已有成员分数，返回 0（没有新增成员）
ZADD ba:z:board 92 bob

# 只在新分数更高时更新
ZADD ba:z:board GT 120 alice

# 带上 CH 查看实际发生变化的成员数
ZADD ba:z:board CH 130 alice 70 dave

# 只添加新成员，已存在的 alice 不会被更新，返回 0
ZADD ba:z:board NX 10 alice

# 增量加分，等价于 ZINCRBY，返回新分数
ZADD ba:z:board INCR 5 bob

# 分数不是合法数字时返回错误
ZADD ba:z:board abc nobody

# 清理示例键
DEL ba:z:board
```

## 注意事项

- `NX` 与 `XX` 互斥；`GT`/`LT` 不能与 `NX` 同时使用，否则返回 `ERR GT, LT, and/or NX options at the same time are not compatible`。
- 分数是双精度浮点数，超过 2^53 的整数运算会丢失精度，需要精确大整数时应改用字符串键配合 `INCR`。
- 成员唯一而分数可以重复，排序以"分数优先、字典序次之"为准。
- 更新已存在成员的分数时，成员会移动到新的排序位置，读取类命令的结果随之变化。
- 使用 `INCR` 时一次只能给一个成员加分，且不能与 `CH` 搭配使用。

## 小结

`ZADD` 通过 `NX/XX/GT/LT/CH/INCR` 选项覆盖了"新增、条件更新、增量"三类写入需求。默认返回新增数量，`CH` 改为返回修改数量，`INCR` 直接返回新分数，这三点在业务代码中最容易混淆。
