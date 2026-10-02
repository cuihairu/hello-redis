# SADD

`SADD` 向集合中添加一个或多个成员。集合是无序的字符串集合，成员天然唯一，重复的成员会被自动忽略，因此 `SADD` 是实现去重、标签、白名单等结构的入口命令。

## 语法

```plaintext
SADD key member [member ...]
```

## 参数说明

- `key`: 集合的键名。
- `member`: 要添加的一个或多个成员，二进制安全。
- 同一次调用中重复出现的成员只会计入一次。

## 返回值

返回本次实际**新增**的成员数量：已经存在的成员会被忽略，不计入返回值。

## 示例

```plaintext
# 首次添加
SADD ba:s:lang zh

# 重复添加 zh 返回 0，同时新增 en 返回 1
SADD ba:s:lang en zh

# 一次添加多个成员
SADD ba:s:lang fr de en

# 查看集合内容
SMEMBERS ba:s:lang

# 查看集合大小
SCARD ba:s:lang

# 对字符串类型的键执行 SADD 会报 WRONGTYPE 错误
SET ba:s:notaset plain
SADD ba:s:notaset m

# 清理示例键
DEL ba:s:lang ba:s:notaset
```

## 使用场景

- **去重集合**: 同一用户的访问 IP、设备号等天然需要唯一。
- **标签与分类**: 为用户或文章挂上可多选的标签。
- **布尔标记**: 集合成员表示"已处理"状态，配合 `SISMEMBER` O(1) 判断。
- **抽奖池**: 成员加入集合，`SPOP` 随机弹出中奖者。

## 注意事项

- 成员是"无序"的，`SMEMBERS` 的返回顺序不保证与插入顺序一致。
- 对非集合类型的键执行 `SADD` 返回 `WRONGTYPE` 错误，而不是覆盖数据。
- 数字形式的成员会被以字符串形式存储，`SADD myset 1` 与 `SADD myset "1"` 是同一个成员。
- 添加大量成员时，一次 `SADD` 传入多个成员比循环单次调用更高效。
- 移除成员使用 `SREM`，判断成员是否在集合中使用 `SISMEMBER`（多成员用 `SMISMEMBER`）。

## 小结

`SADD` 是集合类型的标准写入命令，返回新增成员数量，天然实现去重。配合 `SISMEMBER`、`SCARD`、`SPOP` 等命令，可以把集合用作标签集、白名单和抽奖池。
