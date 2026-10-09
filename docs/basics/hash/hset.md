# HSET

`HSET` 用于为哈希表中的一个或多个字段设置值。哈希非常适合存储对象，例如用户资料、商品属性，一个键即可聚合多个字段，避免为每个属性单独创建字符串键。

## 语法

```plaintext
HSET key field value [field value ...]
```

## 参数说明

- `key`: 哈希表的键名。
- `field`: 字段名，哈希内部的子键。
- `value`: 字段对应的值，二进制安全。
- 支持一次写入多对 `field value`（Redis 4.0 起支持多字段写法；旧命令 `HMSET` 自 4.0 起标记为废弃，仍可用，等价于多字段 `HSET`）。

## 返回值

返回本次执行**新建**字段的数量。字段已存在时只是覆盖值，不计入返回值。

## 示例

```plaintext
# 设置单个字段
HSET ba:h:user:1000 name Alice

# 一次设置多个字段
HSET ba:h:user:1000 age 30 city Hangzhou

# 覆盖已有字段，返回 0（没有新建字段）
HSET ba:h:user:1000 name Bob

# 查看整个哈希
HGETALL ba:h:user:1000

# 键不存在时会自动创建哈希
HSET ba:h:user:1001 name Carol

# 字段与值必须成对出现，否则报参数错误
HSET ba:h:user:1000 onlyfield

# 清理示例键
DEL ba:h:user:1000 ba:h:user:1001
```

## 注意事项

- `field value` 必须成对给出，数量为奇数时会返回 `ERR wrong number of arguments for 'hset' command`。
- 对非哈希类型的键执行 `HSET` 会返回 `WRONGTYPE` 错误。
- 哈希内部对小的键值对采用紧凑编码（listpack），内存开销低于为每个属性单独建字符串键；但单个哈希的字段数和值大小仍受整体 512 MB 键值上限约束。
- 只想在字段不存在时设置值，应使用 `HSETNX`，它会返回 1（设置成功）或 0（字段已存在，未修改）。
- 修改数值类字段应使用 `HINCRBY` 或 `HINCRBYFLOAT`，不要先 `HGET` 再 `HSET`，否则并发下会丢失更新。

## 小结

`HSET` 是哈希类型的标准写入命令，支持单字段与多字段两种写法，返回新建字段数量。旧命令 `HMSET` 已废弃，新代码统一使用 `HSET` 即可。
