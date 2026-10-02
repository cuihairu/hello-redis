# PFADD

#### 概述

Redis HyperLogLog 是一种基数估计算法，用于估算一个集合中不重复元素的数量。它的特点是空间占用极小（通常只需要 12KB），但估算结果具有一定的误差（标准误差约为 0.81%）。`PFADD` 命令用于向 HyperLogLog 中添加元素，用于构建要统计的集合。

#### 常用命令

##### `PFADD`

- **功能**: 向 HyperLogLog 添加一个或多个元素
- **语法**: `PFADD key element [element ...]`
- **说明**:
  - 将指定的元素添加到 HyperLogLog 结构中。
  - 如果 `key` 不存在，会自动创建一个空的 HyperLogLog。
  - 如果至少有一个元素被添加到了 HyperLogLog 的内部结构中，返回 `1`；否则返回 `0`（所有元素都已经被观察过，基数没有变化）。
  - HyperLogLog 不是精确计数，而是近似基数估计。
- **示例**:
  ```plaintext
  PFADD hll "a" "b" "c"
  PFADD hll "c" "d"
  ```

#### 示例操作

```plaintext
# 向 HyperLogLog 添加元素
127.0.0.1:6399> PFADD visitors "user1"
(integer) 1
127.0.0.1:6399> PFADD visitors "user2" "user3"
(integer) 1

# 添加重复元素（基数不变）
127.0.0.1:6399> PFADD visitors "user1"
(integer) 0

# 添加更多元素
127.0.0.1:6399> PFADD visitors "user4" "user5" "user2"
(integer) 1

# 获取基数估计值
127.0.0.1:6399> PFCOUNT visitors
(integer) 5
```

### 小结

`PFADD` 命令是 HyperLogLog 的添加操作，用于收集需要去重统计的元素。HyperLogLog 非常适合用于统计 UV（独立访客）、独立 IP 数等需要大规模去重但对精度要求不是绝对严格的场景。它的优势是极低的内存占用。