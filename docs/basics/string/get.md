# GET

`GET` 用于读取指定 `key` 存储的字符串值，是 Redis 中最基本的读取命令。时间复杂度为 O(1)。

## 语法

```plaintext
GET key
```

## 参数说明

- `key`: 要读取的键名。

## 返回值

- `key` 存在且值是字符串时，返回对应的字符串值。
- `key` 不存在时，返回 `nil`。
- `key` 存储的不是字符串类型（例如列表、哈希、集合）时，返回错误 `WRONGTYPE Operation against a key holding the wrong kind of value`。

## 示例

```plaintext
# 先写入一个字符串
SET ba:str:greeting "Hello Redis"

# 读取该字符串
GET ba:str:greeting

# 键不存在时返回 nil
GET ba:str:missing

# 对列表类型执行 GET 会报 WRONGTYPE 错误
LPUSH ba:str:queue task1
GET ba:str:queue

# 清理示例键
DEL ba:str:greeting ba:str:missing ba:str:queue
```

## 相关命令

- `MGET`: 一次读取多个键的值，比循环执行多次 `GET` 更省网络往返。
- `GETRANGE`: 读取字符串的指定子串。
- `STRLEN`: 读取字符串的字节长度。
- `SET ... GET`: 在写入新值的同时取回旧值（Redis 6.2 起）。

## 注意事项

- `GET` 只能读取字符串类型的键，读取其他类型的键会直接报错，而不是返回 `nil`。业务上可以先用 `TYPE` 命令确认键类型。
- Redis 字符串是二进制安全的，`GET` 返回的内容可能包含任意字节；在 redis-cli 中会按文本展示。
- 单个字符串值最大为 512 MB，读取超大值会占用大量网络带宽和客户端内存，应尽量避免。
- 判断"键是否存在"时应使用 `EXISTS` 命令，因为 `GET` 返回 `nil` 既可能是键不存在，也可能是值恰好为空串以外的场景混淆，语义不如 `EXISTS` 明确。

## 小结

`GET` 是字符串类型的读取入口，简单高效。使用时注意它对非字符串类型会报 `WRONGTYPE` 错误、对不存在的键返回 `nil`，批量读取场景应改用 `MGET`。
