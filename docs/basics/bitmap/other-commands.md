# 其他位图命令

#### 概述

除了 `SETBIT` 和 `GETBIT`，Redis 还提供了一组围绕位图（字符串的位视图）的命令，用于统计、查找、按位运算以及把字符串当作整数计数器使用。这些命令让位图可以承担签到统计、活跃用户去重、权限标记等更完整的业务能力。

#### 常用命令

##### 1. **`BITCOUNT`**

- **功能**：统计位图中值为 1 的比特位数量。
- **语法**：`BITCOUNT key [start end [BYTE|BIT]]`
- **说明**：
  - 不带范围参数时统计整个键；
  - `start`、`end` 为范围，默认单位是字节（BYTE），可以传负数表示从末尾倒数；
  - Redis 7.0 起支持第三个参数 `BYTE` 或 `BIT`，显式指定范围按字节还是按位解释。
- **示例**（实测返回结果见注释，键中第 0、2、9 位被置为 1）：

```plaintext
SETBIT bb:bitmap:online 0 1
SETBIT bb:bitmap:online 2 1
SETBIT bb:bitmap:online 9 1

BITCOUNT bb:bitmap:online
# (integer) 3
BITCOUNT bb:bitmap:online 0 0
# (integer) 2
BITCOUNT bb:bitmap:online 1 1
# (integer) 1
BITCOUNT bb:bitmap:online 0 -1 BYTE
# (integer) 3
BITCOUNT bb:bitmap:online 0 7 BIT
# (integer) 2
```

##### 2. **`BITPOS`**

- **功能**：查找位图中第一个值为指定比特的偏移量。
- **语法**：`BITPOS key bit [start [end [BYTE|BIT]]]`
- **说明**：
  - `bit` 只能是 0 或 1；
  - 可选的 `start`、`end` 限定查找范围，默认按字节解释；
  - 找不到返回 -1；对不存在的键查找 1 返回 -1，查找 0 返回 0（空字符串的第一个 0 位于偏移量 0）。

```plaintext
BITPOS bb:bitmap:online 1
# (integer) 0
BITPOS bb:bitmap:online 0
# (integer) 1
BITPOS bb:bitmap:online 1 1 1
# (integer) 9
```

##### 3. **`BITOP`**

- **功能**：对一个或多个位图执行按位运算，结果保存到目标键。
- **语法**：`BITOP operation destkey key [key ...]`
- **说明**：
  - `operation` 支持 `AND`、`OR`、`XOR`、`NOT`；
  - `NOT` 只能作用于单个键；
  - 返回值是结果字符串的长度（字节），较短的键按 0 位补齐。

```plaintext
# bb:bitmap:d1 的第 0、2 位为 1，bb:bitmap:d2 的第 2 位为 1
BITOP AND bb:bitmap:and bb:bitmap:d1 bb:bitmap:d2
# (integer) 1        BITCOUNT bb:bitmap:and  -> 1
BITOP OR bb:bitmap:or bb:bitmap:d1 bb:bitmap:d2
# (integer) 1        BITCOUNT bb:bitmap:or   -> 2
BITOP XOR bb:bitmap:xor bb:bitmap:d1 bb:bitmap:d2
# (integer) 1        BITCOUNT bb:bitmap:xor  -> 1
BITOP NOT bb:bitmap:not bb:bitmap:d1
# (integer) 1        BITCOUNT bb:bitmap:not  -> 6
```

##### 4. **`BITFIELD`**

- **功能**：把字符串的任意位段当作指定类型的有符号/无符号整数来读、写和自增。
- **语法**：`BITFIELD key [GET type offset] [SET type offset value] [INCRBY type offset increment [OVERFLOW wrap|sat|fail]]`
- **说明**：
  - `type` 形如 `i5`（5 位有符号整数）、`u8`（8 位无符号整数），单个键最多 64 位；
  - `INCRBY` 返回自增后的新值；
  - 溢出策略默认为 `WRAP`（回绕），可选 `SAT`（封顶）与 `FAIL`（返回 nil）。

```plaintext
BITFIELD bb:bitmap:bf INCRBY i5 0 14
# 1) (integer) 14
BITFIELD bb:bitmap:bf INCRBY i5 0 1
# 1) (integer) 15
BITFIELD bb:bitmap:bf INCRBY i5 0 1
# 1) (integer) -16        # 5 位有符号整数在 15 之后回绕到 -16

BITFIELD bb:bitmap:ovf SET u4 0 15
# 1) (integer) 0
BITFIELD bb:bitmap:ovf OVERFLOW FAIL INCRBY u4 0 1
# 1) (nil)                # 溢出时返回 nil，不写入
BITFIELD bb:bitmap:ovf OVERFLOW SAT INCRBY u4 0 1
# 1) (integer) 15         # 溢出时停留在最大值
BITFIELD bb:bitmap:ovf INCRBY u4 0 1
# 1) (integer) 0          # 默认 WRAP，15 + 1 回绕到 0
```

##### 5. **`BITFIELD_RO`**

- **功能**：`BITFIELD` 的只读版本，仅支持 `GET` 子命令，可以安全地在只读副本上执行。

```plaintext
BITFIELD bb:bitmap:ro SET u8 0 202
# 1) (integer) 0
BITFIELD_RO bb:bitmap:ro GET u8 0
# 1) (integer) 202
```

#### 小结

位图命令围绕"位"这一最小单位提供了完整的统计与运算能力：`BITCOUNT` 负责计数，`BITPOS` 负责定位，`BITOP` 支持多个位图之间的逻辑运算，`BITFIELD` 则把位图升级为紧凑的整数数组。组合使用它们，可以在极低的内存开销下实现签到、去重、过滤等常见需求。

#### 相关页面

- [SETBIT](./setbit.md)：设置指定偏移量上的比特位。
- [GETBIT](./getbit.md)：读取指定偏移量上的比特位。
- 返回专题目录：[Redis 位图](../bitmap.md)。
