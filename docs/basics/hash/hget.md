# HGET

`HGET` 用于读取哈希表中指定单个字段的值。时间复杂度为 O(1)。需要一次读取多个字段时应使用 `HMGET`，需要全部字段时使用 `HGETALL`。

## 语法

```plaintext
HGET key field
```

## 参数说明

- `key`: 哈希表的键名。
- `field`: 要读取的字段名。

## 返回值

- 字段存在时，返回该字段的值。
- 字段不存在，或 `key` 本身不存在时，返回 `nil`。
- `key` 存储的不是哈希类型时，返回 `WRONGTYPE` 错误。

## 示例

```plaintext
# 准备示例数据
HSET ba:h:user:1000 name Alice age 30 city Hangzhou

# 读取单个字段
HGET ba:h:user:1000 name

# 读取不存在的字段，返回 nil
HGET ba:h:user:1000 email

# 读取不存在的键的字段，同样返回 nil
HGET ba:h:user:9999 name

# 对字符串类型执行 HGET 会报 WRONGTYPE 错误
SET ba:h:notahash plain
HGET ba:h:notahash anyfield

# 批量读取多个字段用 HMGET
HMGET ba:h:user:1000 name age email

# 读取全部字段用 HGETALL
HGETALL ba:h:user:1000

# 清理示例键
DEL ba:h:user:1000 ba:h:notahash
```

## 相关命令

- `HMGET`: 一次读取多个字段，缺失的字段对应位置返回 `nil`。
- `HGETALL`: 一次返回所有字段和值，字段很多时慎用，可用 `HSCAN` 分批遍历。
- `HEXISTS`: 只判断字段是否存在，不返回值。
- `HSTRLEN`: 返回字段值的字节长度，不传输值本身。

## 注意事项

- `HGET` 只能命中单个字段，循环调用多次 `HGET` 的场景应改为一次 `HMGET`，减少网络往返。
- `nil` 同时表示"键不存在"和"字段不存在"两种情况，业务上如需区分，可先执行 `EXISTS` 判断键。
- 哈希的字段名与值都是二进制安全的字符串，字段名本身不区分类型。
- 对字段做数值运算时不要用 `HGET` 配合 `HSET`，应使用 `HINCRBY` 保证原子性。

## 小结

`HGET` 是哈希类型的单字段读取命令，语义与字符串的 `GET` 类似，只是多了字段维度。批量取值用 `HMGET`，全量读取用 `HGETALL`，三者结合可以覆盖绝大多数读取场景。
