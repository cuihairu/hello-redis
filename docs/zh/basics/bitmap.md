# Redis 位图（Bitmap）

## 概述

Redis 位图（Bitmap）是 Redis 中的一个数据结构，用于以紧凑的形式表示大量的二进制位。每一位（bit）可以是 0 或 1，非常适合用于表示开关状态、标记、计数等场景。位图通过对单个比特位的操作来实现空间效率的优化，适合用于处理大规模的标记数据。

## 结构图

![Redis Bitmap 结构](/structures/bitmap.png)

## 常用命令

### 1. **`SETBIT`**

- **功能**: 设置位图中指定偏移量的比特位的值
- **语法**: `SETBIT key offset value`
- **说明**: 
  - `offset`：比特位的偏移量，从 0 开始
  - `value`：要设置的值，0 或 1
- **示例**:
  ```plaintext
  SETBIT mybitmap 7 1
  ```

### 2. **`GETBIT`**

- **功能**: 获取位图中指定偏移量的比特位的值
- **语法**: `GETBIT key offset`
- **说明**: 返回指定偏移量的比特位的值，0 或 1。
- **示例**:
  ```plaintext
  GETBIT mybitmap 7
  ```

### 3. **`BITCOUNT`**

- **功能**: 计算位图中值为 1 的比特位的数量
- **语法**: `BITCOUNT key [start end]`
- **说明**:
  - `start` 和 `end`：可选参数，指定要计数的范围（字节）
- **示例**:
  ```plaintext
  BITCOUNT mybitmap
  BITCOUNT mybitmap 0 1
  ```

### 4. **`BITOP`**

- **功能**: 对多个位图执行按位操作（如 AND、OR、XOR）
- **语法**: `BITOP operation destkey key [key ...]`
- **说明**:
  - `operation`：指定按位操作类型（AND、OR、XOR、NOT）
  - `destkey`：结果存储的目标键
- **示例**:
  ```plaintext
  BITOP AND destkey key1 key2
  BITOP OR destkey key1 key2
  BITOP XOR destkey key1 key2
  BITOP NOT destkey key
  ```

### 5. **`BITPOS`**

- **功能**: 查找位图中第一个匹配指定值的比特位的偏移量
- **语法**: `BITPOS key bit [start end]`
- **说明**:
  - `bit`：要查找的值（0 或 1）
  - `start` 和 `end`：可选参数，指定查找的范围（字节）
- **示例**:
  ```plaintext
  BITPOS mybitmap 1
  BITPOS mybitmap 0 0 1
  ```

## 示例操作

```plaintext
# 设置位图中第 7 位为 1
SETBIT mybitmap 7 1

# 获取位图中第 7 位的值
GETBIT mybitmap 7

# 计算位图中值为 1 的比特位数量
BITCOUNT mybitmap

# 对多个位图执行按位 OR 操作，将结果存储到 destkey
BITOP OR destkey key1 key2

# 查找位图中第一个值为 1 的比特位的偏移量
BITPOS mybitmap 1
```

## 特点

- **按位存储**：一个键存二进制位串，1 位 = 1 bit，2^32 位约 512MB。
- **极省内存**：100 万用户签到位约 122KB（10^6 bit ÷ 8）。
- **位运算**：`BITOP` 支持 AND/OR/XOR/NOT，跨键批量运算。
- **统计快**：`BITCOUNT` 统计 1 的个数，`BITPOS` 找首个 1。

## 使用场景

- **用户行为跟踪**：可以用位图记录用户的行为状态，例如是否在某天登录过。
- **广告点击统计**：通过位图记录用户对广告的点击状态。
- **权限标记**：用位图标记用户的权限或访问控制位。
- **内存效率**：使用位图处理大量二进制状态数据，减少内存占用。

```plaintext
# 1. 签到：某用户第 N 天签到
SETBIT sign:2026:alice 285 1        # 第 286 天
BITCOUNT sign:2026:alice            # 本年签到天数

# 2. 日活统计：一个 offset 一个用户
SETBIT dau:2026-10-12 10086 1
BITCOUNT dau:2026-10-12

# 3. 两个集合求交：同时在线
BITOP AND both:online online:a online:b

# 4. 布隆过滤器底层（RediSearchBloom / RedisBloom 的位数组）
```

## 小结

Redis 位图是一种内存高效的二进制数据结构，非常适合用于存储和处理大量的二进制标记数据。位图命令适合用较少内存处理大量二进制标记与统计。

## 参考资料

- [Redis 开发文档](https://redis.io/docs/latest/develop/)
- [Redis 开发文档 · Strings（位图）](https://redis.io/docs/latest/develop/data-types/strings/)

<!-- BACKLINKS-AUTO -->
## 相关页面

- [README](README.md)
- [getbit](/zh/basics/bitmap/getbit.md)
- [other-commands](/zh/basics/bitmap/other-commands.md)
- [setbit](/zh/basics/bitmap/setbit.md)
