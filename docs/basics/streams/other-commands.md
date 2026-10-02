# 其他流命令

#### 概述

除 `XADD` 与 `XREAD` 外，流还提供查询、裁剪和消费者组三大类命令：查询类用于浏览与统计流内容，裁剪类控制流的长度，消费者组让多个消费者协作处理同一条流，实现"一条条目只被处理一次"的语义。

#### 查询与裁剪命令

- **`XLEN key`**：返回流中的条目数量；流不存在时返回 0。
- **`XRANGE key start end [COUNT count]`**：按 ID 范围读取条目，`XREVRANGE` 为倒序；特殊 ID `-` 表示最小 ID，`+` 表示最大 ID，范围为闭区间。
- **`XDEL key id [id ...]`**：删除指定 ID 的条目，返回实际删除的数量。
- **`XTRIM key MAXLEN|MINID [=|~] threshold [LIMIT count]`**：按长度或最小 ID 裁剪流，返回被删除的条目数；`~` 为近似裁剪，允许实际结果略超阈值（实测对小流甚至可能不裁剪）。

假设流 `bb:stream:mq` 中已有条目 `1-1`、`1-2`、`1-3`，以下为实测结果：

```plaintext
XLEN bb:stream:mq
# (integer) 3
XRANGE bb:stream:mq - +
# 1) 1) "1-1"
#    2) 1) "task"
#       2) "t1"
# ...（共 3 条）
XRANGE bb:stream:mq 1-2 +
# 1) 1) "1-2" ...
# 2) 1) "1-3" ...
XREVRANGE bb:stream:mq + - COUNT 2
# 1) 1) "1-3" ...
# 2) 1) "1-2" ...
XDEL bb:stream:mq 1-2
# (integer) 1
XTRIM bb:stream:mq MAXLEN 2
# (integer) 1
XLEN bb:stream:mq
# (integer) 2
```

#### 消费者组命令

- **`XGROUP CREATE key group id [MKSTREAM]`**：创建消费者组；起始 ID `0` 表示从第一条开始，`$` 表示只消费新条目，`MKSTREAM` 可在流不存在时自动创建。
- **`XREADGROUP GROUP group consumer [COUNT n] STREAMS key id`**：以消费者身份读取；`>` 表示只取从未投递过的新条目，读到的条目进入该消费者的待确认列表（PEL）。
- **`XPENDING key group [start end count]`**：查看待确认条目；扩展形式直接写"起止 ID 数量"，没有 COUNT 关键字。
- **`XACK key group id [id ...]`**：确认条目处理完毕，移出待确认列表。
- **`XAUTOCLAIM key group consumer min-idle start [COUNT n]`**：把空闲超过阈值的条目转移给指定消费者，用于接管宕机消费者遗留的任务。
- **`XINFO GROUPS key` / `XINFO STREAM key`**：查看组与流的内部状态，常用于运维排查。

消费者组实现"一条条目只投递给组内一个消费者"的语义：读取后需要确认，未确认的条目可以被其他消费者认领重试。以下流程沿用 `bb:stream:mq`（条目 `1-3`、`1-4`），注释为实测结果：

```plaintext
XGROUP CREATE bb:stream:mq bb:workers 0
# OK
XREADGROUP GROUP bb:workers alice COUNT 1 STREAMS bb:stream:mq >
# 1) 1) "bb:stream:mq"
#    2) 1) 1) "1-3"
#          2) 1) "task"
#             2) "t3"
XREADGROUP GROUP bb:workers bob COUNT 1 STREAMS bb:stream:mq >
# 1) 1) "bb:stream:mq"
#    2) 1) 1) "1-4"
#          2) 1) "task"
#             2) "t4"
XPENDING bb:stream:mq bb:workers
# 1) (integer) 2
# 2) "1-3"
# 3) "1-4"
# 4) 1) 1) "alice"  2) "1"
#    2) 1) "bob"    2) "1"
XPENDING bb:stream:mq bb:workers - + 10
# 1) 1) "1-3"
#    2) "alice"
#    3) (integer) 66     # 空闲毫秒数
#    4) (integer) 1      # 投递次数
# ...（1-4 属于 bob）
XACK bb:stream:mq bb:workers 1-3
# (integer) 1
XAUTOCLAIM bb:stream:mq bb:workers alice 0 0-0 COUNT 10
# 1) "0-0"                # 下一次扫描起点
# 2) 1) 1) "1-4"          # alice 认领了 bob 未确认的条目
#       2) 1) "task"
#          2) "t4"
# 3) (empty array)        # 本次发现已删除的条目
XINFO GROUPS bb:stream:mq
# 1)  1) "name"       2) "bb:workers"
#     3) "consumers"  4) (integer) 2
# ...（还有 pending、last-delivered-id 等字段）
XINFO STREAM bb:stream:mq
#  1) "length"
#  2) (integer) 2
# ...
```

#### 注意事项

- **组内语义**：`XREADGROUP` 读过的条目不会消失，只有 `XACK` 之后才移出待确认列表；处理失败时用 `XAUTOCLAIM` 或 `XCLAIM` 转交给其他消费者重试。
- **裁剪与消费者组**：`XDEL`、`XTRIM` 删除的条目仍保留在待确认列表中，消费端需要处理"条目已被删除"的情况。
- **组必须先建**：向不存在的组读取会报 `NOGROUP` 错误，服务启动时应确保组存在。

#### 相关页面

- [XADD](./xadd.md)：向流中追加条目。
- [XREAD](./xread.md)：从流中读取条目。
- 返回专题目录：[Redis 流（Streams）](../streams.md)。
