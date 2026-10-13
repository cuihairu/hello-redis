# Redis 流（Streams）

## 概述

Redis 流（Streams）是 Redis 5.0 引入的一种新的数据结构，用于处理流式数据。它允许以时间序列的形式存储和处理数据，适合用来管理事件日志、消息队列和实时数据流等场景。Redis 流的设计理念借鉴了传统的消息队列系统，同时提供了强大的数据访问和管理能力。

## 结构图

![Redis Stream 结构](/structures/streams.png)

## 常用命令

### 1. **`XADD`**

- **功能**: 向流中添加一个新的条目
- **语法**: `XADD key ID field value [field value ...]`
- **说明**:
  - `key`：流的键
  - `ID`：条目的唯一标识符（可以是自动生成的时间戳）
  - `field value`：条目的字段和值
- **示例**:
  ```plaintext
  XADD mystream * field1 value1 field2 value2
  ```

### 2. **`XRANGE`**

- **功能**: 获取流中指定范围的条目
- **语法**: `XRANGE key start end [COUNT count]`
- **说明**:
  - `key`：流的键
  - `start`：起始条目的 ID（可以是时间戳或特殊标识符，如 `-` 表示最早的条目）
  - `end`：结束条目的 ID（可以是时间戳或特殊标识符，如 `+` 表示最新的条目）
  - `COUNT count`：限制返回条目的数量（可选）
- **示例**:
  ```plaintext
  XRANGE mystream - +
  ```

### 3. **`XREAD`**

- **功能**: 从流中读取数据
- **语法**: `XREAD [BLOCK milliseconds] [COUNT count] STREAMS key [key ...] id [id ...]`
- **说明**:
  - `BLOCK milliseconds`：阻塞时间（毫秒），直到有新条目可用（可选）
  - `COUNT count`：限制返回的条目数量（可选）
  - `key`：流的键
  - `id`：读取的起始条目的 ID
- **示例**:
  ```plaintext
  XREAD BLOCK 5000 COUNT 10 STREAMS mystream 0
  ```

### 4. **`XDEL`**

- **功能**: 从流中删除指定的条目
- **语法**: `XDEL key id [id ...]`
- **说明**:
  - `key`：流的键
  - `id`：要删除的条目的 ID
- **示例**:
  ```plaintext
  XDEL mystream 1609459200000-0
  ```

### 5. **`XTRIM`**

- **功能**: 修剪流，删除旧的条目
- **语法**: `XTRIM key <MAXLEN | MINID> [= | ~] threshold [LIMIT count]`
- **说明**:
  - `key`：流的键
  - `MAXLEN [= | ~] threshold`：按长度裁剪，只保留最新的 `threshold` 个条目（`~` 表示近似裁剪，默认）
  - `MINID [= | ~] id`：按 ID 裁剪，只保留 ID 大于等于指定值的条目
  - `LIMIT count`：限制本次最多裁剪的条目数量，**仅在 `~` 形式下可用**，否则报 `ERR syntax error, LIMIT cannot be used without the special ~ option`
- **示例**:
  ```plaintext
  XTRIM mystream MAXLEN 1000
  ```

## 示例操作

```plaintext
# 向流中添加条目
XADD mystream * field1 value1 field2 value2

# 获取流中所有条目
XRANGE mystream - +

# 从流中读取数据（阻塞5秒）
XREAD BLOCK 5000 COUNT 10 STREAMS mystream 0

# 从流中删除指定条目
XDEL mystream 1609459200000-0

# 修剪流，只保留最新的1000条记录
XTRIM mystream MAXLEN 1000
```

## 特点

- **追加日志**：条目按 ID（时间戳-序号）单调递增，`XADD` 尾部追加 O(1)。
- **消费者组**：`XGROUP` 建组，组内每条消息只投递一次，组间互不影响。
- **断点续读**：`last-delivered-id` 记录进度，重启后 `XREADGROUP` 从断点继续。
- **pending 列表（PEL）**：已投递未 `XACK` 的消息留在 PEL，可 `XAUTOCLAIM` 超时转手重试。
- **可裁剪**：`XTRIM MAXLEN` 限制长度，或 `XADD MAXLEN` 追加即裁剪。

## 使用场景

- **消息队列**：用作高性能、持久化的消息队列，支持按顺序处理消息。
- **实时数据流**：存储和处理实时生成的数据流，如用户活动日志、传感器数据等。
- **事件日志**：记录系统事件和操作日志，以便后续分析和审计。
- **分布式系统**：在分布式系统中实现事件发布-订阅模式，传递和处理事件。

```plaintext
# 1. 事件流 / 消息队列
XADD events * type "order.created" id 10086
XREADGROUP GROUP g1 c1 COUNT 10 BLOCK 2000 STREAMS events >   # 消费新消息
XACK events g1 1791799001000-0                                 # 确认消费

# 2. 多组独立消费：A 组审计、B 组通知，互不干扰
XGROUP CREATE events g-a 0
XGROUP CREATE events g-b 0

# 3. 断点续读 + 失败重投（PEL）
XAUTOCLAIM events g1 c2 60000 0-0                              # 认领超时未确认消息

# 4. 限制长度防膨胀
XADD events MAXLEN 100000 * type "tick"
```

## 小结

Redis 流是一种强大的数据结构，适用于处理和管理时间序列数据。通过 `XADD`、`XRANGE`、`XREAD`、`XDEL` 和 `XTRIM` 等命令，用户可以高效地操作和查询流数据。Redis 流的高性能和灵活性使其在实时数据处理、消息队列和事件日志等应用场景中表现出色。

## 参考资料

- [Redis 开发文档](https://redis.io/docs/latest/develop/)
- [Redis 开发文档 · Streams](https://redis.io/docs/latest/develop/data-types/streams/)

<!-- BACKLINKS-AUTO -->
## 相关页面

- [README](README.md)
- [other-commands](/basics/streams/other-commands.md)
- [xadd](/basics/streams/xadd.md)
- [xread](/basics/streams/xread.md)
