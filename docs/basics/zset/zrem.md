# ZREM

`ZREM` 从有序集合中移除一个或多个成员。时间复杂度为 O(M log N)，N 是集合成员数，M 是被移除的成员数。

## 语法

```plaintext
ZREM key member [member ...]
```

## 参数说明

- `key`: 有序集合的键名。
- `member`: 要移除的一个或多个成员。

## 返回值

返回实际被移除的成员数量。不存在的成员会被忽略，不计入返回值；键不存在时返回 0。对非有序集合类型的键执行会返回 `WRONGTYPE` 错误。

## 示例

```plaintext
# 准备示例数据
ZADD ba:z:board 100 alice 90 bob 95 carol

# 移除单个成员，返回 1
ZREM ba:z:board bob

# 剩余成员
ZRANGE ba:z:board 0 -1 WITHSCORES

# 移除多个成员，不存在的成员被忽略，返回 1
ZREM ba:z:board carol ghost

# 键不存在时返回 0
ZREM ba:z:nomember alice

# 全部成员移除后键自动删除
ZREM ba:z:board alice
EXISTS ba:z:board

# 按分数范围批量删除应使用 ZREMRANGEBYSCORE
ZADD ba:z:board 1 low 2 mid 3 high
ZREMRANGEBYSCORE ba:z:board 1 2

# 清理示例键
DEL ba:z:board ba:z:nomember
```

## 相关命令

- `ZREMRANGEBYSCORE`: 按分数区间批量删除成员。
- `ZREMRANGEBYRANK`: 按排名下标区间批量删除成员。
- `ZPOPMIN` / `ZPOPMAX`: 弹出分数最低或最高的成员，返回值中带分数。
- `ZSCORE`: 查询成员当前的分数。

## 注意事项

- `ZREM` 只能按"成员"删除，无法按分数或排名删除，后两者分别使用 `ZREMRANGEBYSCORE` 和 `ZREMRANGEBYRANK`。
- 移除全部成员后，键会被自动删除，相关 TTL 也不再存在。
- 不存在的成员不会报错，因此可以放心批量传入，用返回值判断实际删除了多少个。
- 更新成员分数不需要先 `ZREM` 再 `ZADD`，直接 `ZADD` 同名成员即可覆盖分数。
- 删除操作会改变剩余成员的排名，依赖 `ZRANK` 结果的业务要在删除后重新读取。

## 小结

`ZREM` 是有序集合按成员删除的标准命令，返回实际删除数量，宽松地处理不存在的成员。按分数或排名的批量清理分别交给 `ZREMRANGEBYSCORE` 和 `ZREMRANGEBYRANK`。
