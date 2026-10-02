# HyperLogLog 其他命令

#### 概述

Redis HyperLogLog 主要的命令是 `PFADD` 和 `PFCOUNT`，此外还有 `PFMERGE` 用于合并多个 HyperLogLog 结构。HyperLogLog 专注于基数估计，因此命令相对精简。

#### 常用命令

##### 1. `PFMERGE`

- **功能**: 合并多个 HyperLogLog
- **语法**: `PFMERGE destkey sourcekey [sourcekey ...]`
- **说明**:
  - 将多个源 HyperLogLog 合并到目标 `destkey` 中。
  - 合并后的 `destkey` 将包含所有源 HyperLogLog 中的元素集合的基数估计。
  - 如果 `destkey` 不存在，会自动创建一个新的 HyperLogLog。
  - 该操作是不可逆的，会覆盖 `destkey` 原有的内容（如果存在）。
- **示例**:
  ```plaintext
  PFMERGE hll_all hll1 hll2 hll3
  ```

#### 示例操作

```plaintext
# 准备多个 HyperLogLog
127.0.0.1:6399> PFADD china "bj" "sh" "gz" "cd"
(integer) 1
127.0.0.1:6399> PFADD japan "tokyo" "osaka" "kyoto"
(integer) 1
127.0.0.1:6399> PFADD korea "seoul" "busan"
(integer) 1

# 分别统计基数
127.0.0.1:6399> PFCOUNT china
(integer) 4
127.0.0.1:6399> PFCOUNT japan
(integer) 3
127.0.0.1:6399> PFCOUNT korea
(integer) 2

# 合并多个 HyperLogLog
127.0.0.1:6399> PFMERGE asia china japan korea
OK

# 统计合并后的基数
127.0.0.1:6399> PFCOUNT asia
(integer) 9

# 也可以直接用 PFCOUNT 合并统计
127.0.0.1:6399> PFCOUNT china japan korea
(integer) 9

# 合并到已存在的 key
127.0.0.1:6399> PFADD extra "hk" "tw"
(integer) 1
127.0.0.1:6399> PFMERGE asia extra
OK
127.0.0.1:6399> PFCOUNT asia
(integer) 11
```

### 小结

`PFMERGE` 命令是 HyperLogLog 的合并工具，在需要对分片数据进行汇总统计（如按地区、按时间段统计独立用户总数）时非常有用。值得注意的是，`PFCOUNT` 也支持传入多个 key 直接进行合并统计，两者的效果类似，但 `PFMERGE` 可以将合并结果持久化到一个新的 HyperLogLog 中，便于后续复用。