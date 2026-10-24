# Redis HyperLogLog

## 概述

HyperLogLog 是一种用于估计基数（即不同元素的数量）的数据结构，特别适合处理大数据量的场景。它以概率性方式工作，能够在相对较小的内存开销下，提供对大量数据的高效估计。Redis 的 HyperLogLog 实现使用了 `pfadd`、`pfcount` 和 `pfmerge` 等命令来进行操作。

## 结构图

![Redis HyperLogLog 结构](/structures/hyperloglog.png)

## 常用命令

### 1. **`PFADD`**

- **功能**: 将一个或多个元素添加到 HyperLogLog 中
- **语法**: `PFADD key element [element ...]`
- **说明**:
  - `key`：HyperLogLog 键
  - `element`：要添加的元素
- **示例**:
  ```plaintext
  PFADD myhyperloglog "element1" "element2" "element3"
  ```

### 2. **`PFCOUNT`**

- **功能**: 返回 HyperLogLog 中估计的唯一元素数量
- **语法**: `PFCOUNT key [key ...]`
- **说明**:
  - `key`：HyperLogLog 键
- **示例**:
  ```plaintext
  PFCOUNT myhyperloglog
  ```

### 3. **`PFMERGE`**

- **功能**: 合并多个 HyperLogLog 键的数据到一个新的 HyperLogLog 键中
- **语法**: `PFMERGE destkey sourcekey [sourcekey ...]`
- **说明**:
  - `destkey`：合并后的 HyperLogLog 键
  - `sourcekey`：要合并的 HyperLogLog 键
- **示例**:
  ```plaintext
  PFMERGE mergedhyperloglog myhyperloglog1 myhyperloglog2
  ```

## 示例操作

```plaintext
# 添加元素到 HyperLogLog
PFADD myhyperloglog "user1" "user2" "user3"

# 获取 HyperLogLog 中的唯一元素数量
PFCOUNT myhyperloglog

# 合并多个 HyperLogLog 键到一个新键中
PFMERGE mergedhyperloglog myhyperloglog1 myhyperloglog2
```

## 特点

- **固定 12KB**：`PFADD` 写入或统计 100 万个元素，占用都不变。
- **概率型**：标准误差约 0.81%，修正模式更小；只统计基数，不存元素本身。
- **只增不减**：寄存器只取最大值，不能删除单个元素（没有 `PFREM` 语义）。
- **可合并**：`PFMERGE` 合并多个 HLL，等于求并集基数。

## 使用场景

- **网站访问统计**：估计唯一访问者的数量，适用于处理大规模网站数据。
- **数据去重**：在处理流量数据时，快速估计不重复的事件或用户。
- **日志分析**：在大规模日志数据中，估计不同日志来源的数量。
- **社交网络分析**：估算社交网络中的独立用户数或活动量。

```plaintext
# 1. 日活 / 独立访客（UV），比 SET 省内存
PFADD uv:2026-10-12 "user-1" "user-2" "user-1"
PFCOUNT uv:2026-10-12     # 2（去重）

# 2. 页面 / 渠道去重计数
PFADD channel:weixin:2026-10 "uid-1" "uid-2"
PFADD channel:web:2026-10 "uid-2" "uid-3"
PFMERGE uv:2026-10 channel:weixin:2026-10 channel:web:2026-10
PFCOUNT uv:2026-10        # 3（跨渠道去重）

# 3. 实时去重检查（允许误差）
PFCOUNT active:hour
```

## 小结

Redis 的 HyperLogLog 实现提供了一种高效的方式来估计大规模数据集中的唯一元素数量。通过 `PFADD`、`PFCOUNT` 和 `PFMERGE` 等命令，用户可以有效地管理和查询 HyperLogLog 数据。由于其概率性特征，HyperLogLog 可以在大数据量的情况下保持较低的内存占用。

## 参考资料

- [Redis 开发文档](https://redis.io/docs/latest/develop/)
- [Redis 开发文档 · Probabilistic](https://redis.io/docs/latest/develop/data-types/probabilistic/)

<!-- BACKLINKS-AUTO -->
## 相关页面

- [glossary](/zh/appendix/glossary.md)
- [README](README.md)
- [other-commands](/zh/basics/hyperloglog/other-commands.md)
- [pfadd](/zh/basics/hyperloglog/pfadd.md)
- [pfcount](/zh/basics/hyperloglog/pfcount.md)
