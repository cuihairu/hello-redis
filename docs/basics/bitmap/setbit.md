# SETBIT

`SETBIT` 用于设置指定键所存储的字符串值中某个偏移量上的比特位。位图并不是一种独立的数据类型，而是直接构建在字符串之上的位操作：把一个字符串看作一串连续的二进制位，`SETBIT` 负责把其中某一位置为 0 或 1。

每个比特位只占 1 bit 内存，`SETBIT` 适合用极小的空间记录海量的二进制状态，例如用户每日签到、功能开关、活动资格标记。

## 语法

```plaintext
SETBIT key offset value
```

## 参数说明

- `key`：目标键。键不存在时，Redis 会先创建一个空字符串，再执行位设置。
- `offset`：比特位偏移量，从 0 开始计数，取值范围为 `0` 到 `2^32 - 1`（即 4294967295）。
- `value`：要写入的比特值，只能是 `0` 或 `1`。

## 返回值

该偏移量上原来的比特值（0 或 1）。

## 示例

以下命令可以直接在 `redis-cli` 中执行，注释中为实测返回结果：

```plaintext
# 设置偏移量 7 的位，返回旧值；键不存在时旧值为 0
SETBIT bb:bitmap:setbit 7 1
# (integer) 0

# 继续设置偏移量 2 和 0
SETBIT bb:bitmap:setbit 2 1
# (integer) 0
SETBIT bb:bitmap:setbit 0 1
# (integer) 0

# 此时位图中共有 3 个值为 1 的位
BITCOUNT bb:bitmap:setbit
# (integer) 3

# 整个字符串只占用 1 个字节（8 个比特位）
STRLEN bb:bitmap:setbit
# (integer) 1

# 对同一个偏移量重复写入，返回上一次写入的值 1
SETBIT bb:bitmap:setbit 7 1
# (integer) 1
```

位图的偏移量在字节内部按"高位在前"的顺序排列，即偏移量 0 是第一个字节的最高位：

```plaintext
SETBIT bb:bitmap:byte 1 1
# (integer) 0
SETBIT bb:bitmap:byte 2 1
# (integer) 0
GET bb:bitmap:byte
# "`"              # 0x60，即二进制 01100000
```

## 常见错误

```plaintext
# value 只能是 0 或 1
SETBIT bb:bitmap:setbit 9 5
# (error) ERR bit is not an integer or out of range

# 偏移量不能为负数
SETBIT bb:bitmap:setbit -1 1
# (error) ERR bit offset is not an integer or out of range

# 偏移量不能超过 2^32 - 1
SETBIT bb:bitmap:setbit 4294967296 1
# (error) ERR bit offset is not an integer or out of range
```

## 注意事项

- 写入较大偏移量时，Redis 会自动把字符串扩展到能覆盖该偏移量的长度，中间未设置的位全部为 0。对一个不存在的键直接写入极大的偏移量，会一次性分配数百 MB 内存，生产环境务必避免。
- 存储 N 个比特位约需要 `N / 8` 字节，1 亿个用户的每日签到标记只需要约 12 MB。
- `SETBIT` 返回旧值，可以据此判断某一位是否第一次被置为 1，实现「只统计一次」的逻辑。

## 相关页面

- [GETBIT](./getbit.md)：读取指定偏移量上的比特位。
- [其他位图命令](./other-commands.md)：`BITCOUNT`、`BITOP`、`BITPOS`、`BITFIELD` 等。
- 返回专题目录：[Redis 位图](../bitmap.md)。
