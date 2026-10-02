# PFCOUNT

#### 概述

`PFCOUNT` 命令用于获取 HyperLogLog 的基数估计值，也就是集合中不重复元素的近似数量。它是 HyperLogLog 的查询命令，通常与 `PFADD` 配合使用。

#### 常用命令

##### `PFCOUNT`

- **功能**: 获取 HyperLogLog 的基数估计值
- **语法**: `PFCOUNT key [key ...]`
- **说明**:
  - 返回存储在 `key` 中的 HyperLogLog 的近似基数。
  - 如果指定了多个 `key`，会先将多个 HyperLogLog 合并（类似于 `PFMERGE` 的效果），然后返回合并后的近似基数。
  - 如果键不存在，返回 `0`。
  - 误差率约为 0.81%，适合对精确度要求不是 100% 的统计场景。
- **示例**:
  ```plaintext
  PFCOUNT hll
  PFCOUNT hll1 hll2
  ```

#### 示例操作

```plaintext
# 添加元素并统计基数
127.0.0.1:6399> PFADD page1 "ip1" "ip2" "ip3" "ip1"
(integer) 1
127.0.0.1:6399> PFCOUNT page1
(integer) 3

# 添加更多不重复元素
127.0.0.1:6399> PFADD page1 "ip4" "ip5"
(integer) 1
127.0.0.1:6399> PFCOUNT page1
(integer) 5

# 统计空的 HyperLogLog
127.0.0.1:6399> PFCOUNT empty_hll
(integer) 0

# 多个 key 的合并统计
127.0.0.1:6399> PFADD day1 "u1" "u2" "u3"
(integer) 1
127.0.0.1:6399> PFADD day2 "u3" "u4" "u5"
(integer) 1
127.0.0.1:6399> PFCOUNT day1 day2
(integer) 5
```

### 小结

`PFCOUNT` 命令用于获取 HyperLogLog 的近似去重计数。它既可以统计单个 HyperLogLog 的基数，也可以合并多个 HyperLogLog 并统计总基数，这在按天、按小时统计 UV 并需要合并总 UV 的场景中特别实用。虽然不是精确值，但在大数据量下的高效性和低内存占用是其核心优势。