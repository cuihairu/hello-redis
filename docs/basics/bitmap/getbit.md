# GETBIT

#### 概述

`GETBIT` 用于读取指定键所存储的字符串值中某个偏移量上的比特位，返回该位的值（0 或 1）。它是位图读取操作的基础命令，通常与 `SETBIT` 配对使用：`SETBIT` 负责写入某一位，`GETBIT` 负责查询某一位。

#### 语法与参数

```plaintext
GETBIT key offset
```

- **`key`**：目标键。
- **`offset`**：比特位偏移量，从 0 开始计数，取值范围为 `0` 到 `2^32 - 1`。

**返回值**：指定偏移量上的比特值（0 或 1）。需要注意两种"读不到"的情况都返回 `0`，而不是报错：

- 键不存在；
- 偏移量超出了字符串当前的实际长度。

#### 示例

以下命令可以直接在 `redis-cli` 中执行，注释中为实测返回结果：

```plaintext
# 先写入两位，便于观察
SETBIT bb:bitmap:getbit 3 1
# (integer) 0

# 读取刚刚设置的位
GETBIT bb:bitmap:getbit 3
# (integer) 1

# 读取未设置过的位
GETBIT bb:bitmap:getbit 4
# (integer) 0

# 偏移量超出字符串实际长度，同样返回 0
GETBIT bb:bitmap:getbit 100
# (integer) 0

# 键不存在时，任何偏移量都返回 0
GETBIT bb:bitmap:missing 5
# (integer) 0
```

`GETBIT` 也可以直接读取普通字符串值的内容。例如字符 `A` 的 ASCII 码是 65，二进制为 `01000001`：

```plaintext
SET bb:bitmap:byte A
# OK
GETBIT bb:bitmap:byte 0
# (integer) 0
GETBIT bb:bitmap:byte 1
# (integer) 1
GETBIT bb:bitmap:byte 7
# (integer) 1
```

#### 常见错误

```plaintext
# 偏移量不能为负数
GETBIT bb:bitmap:getbit -1
# (error) ERR bit offset is not an integer or out of range

# 偏移量必须是整数
GETBIT bb:bitmap:getbit abc
# (error) ERR bit offset is not an integer or out of range
```

#### 注意事项

- **不存在的键不报错**：对不存在的键执行 `GETBIT` 一律返回 0，因此业务上可以把 0 当作默认状态，无需提前初始化。
- **性能恒定**：`GETBIT` 的时间复杂度为 O(1)，无论位图多大，读取一位的开销都相同。
- **高位在前**：与 `SETBIT` 一致，偏移量 0 对应第一个字节的最高位。
- **批量统计**：需要统计"有多少位为 1"时，应使用 `BITCOUNT` 而不是循环调用 `GETBIT`。

#### 相关页面

- [SETBIT](./setbit.md)：设置指定偏移量上的比特位。
- [其他位图命令](./other-commands.md)：`BITCOUNT`、`BITOP`、`BITPOS`、`BITFIELD` 等。
- 返回专题目录：[Redis 位图](../bitmap.md)。
