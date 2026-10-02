# XADD

#### 概述

`XADD` 用于向流（Stream）中追加一条条目。条目由一个唯一的 ID 和若干"字段-值"对组成，`XADD` 总是把新条目放到流的尾部，因此流天然按时间有序。流是 Redis 5.0 引入的数据结构，常被用作消息队列、事件日志和实时数据管道。

#### 语法与参数

```plaintext
XADD key [NOMKSTREAM] [MAXLEN|MINID [=|~] threshold [LIMIT count]] *|id field value [field value ...]
```

- **`key`**：流键。默认情况下键不存在时会自动创建。
- **`NOMKSTREAM`**：键不存在时不创建键，直接返回 nil。
- **`MAXLEN threshold`**：修剪选项，写入后把流长度裁剪到 threshold 以内；`~` 表示近似修剪（允许略超，性能更好）。
- **`MINID threshold`**：修剪选项，删除 ID 小于 threshold 的条目。
- **`*`**：让服务器自动生成 ID，格式为 `毫秒时间戳-序号`，同一毫秒内自动递增序号，保证严格递增。
- **`id`**：显式指定条目 ID，必须大于流中现存的最大 ID。
- **`field value`**：条目的字段名和字段值，至少一组，可有多组。

**返回值**：新条目的 ID；配合 `NOMKSTREAM` 且键不存在时返回 nil。

#### 示例

以下命令可以直接在 `redis-cli` 中执行，注释中为实测返回结果：

```plaintext
# 自动生成 ID
XADD bb:stream:orders * user u1 amount 100
# "1790907027436-0"        # 形如 毫秒时间戳-序号

# 显式指定 ID，便于后续按固定 ID 演示
XADD bb:stream:log 1-1 user u1 action login
# "1-1"
XADD bb:stream:log 1-2 user u2 action buy
# "1-2"

# 使用 毫秒-号 的省略写法，序号自动补 0
XADD bb:stream:log 2-* user u3 action logout
# "2-0"
```

ID 必须严格递增，违反时会被拒绝：

```plaintext
# 与已有 ID 重复
XADD bb:stream:log 1-2 user u2 action buy
# (error) ERR The ID specified in XADD is equal or smaller than the target stream top item

# 小于流中最大的 ID
XADD bb:stream:log 1-2 x y
# (error) ERR The ID specified in XADD is equal or smaller than the target stream top item

# 特殊 ID 0-0 永远非法
XADD bb:stream:log 0-0 x y
# (error) ERR The ID specified in XADD must be greater than 0-0

# ID 格式不合法
XADD bb:stream:log abc-0 x y
# (error) ERR Invalid stream ID specified as stream command argument
```

修剪选项与边界行为：

```plaintext
# NOMKSTREAM：键不存在时不创建
XADD bb:stream:nx NOMKSTREAM * a 1
# (nil)
EXISTS bb:stream:nx
# (integer) 0

# MAXLEN：保留最近的 3 条
XADD bb:stream:trim 1-1 n 1
XADD bb:stream:trim 1-2 n 2
XADD bb:stream:trim 1-3 n 3
XADD bb:stream:trim MAXLEN 3 1-4 n 4
# "1-4"
XLEN bb:stream:trim
# (integer) 3
XRANGE bb:stream:trim - +
# 1) 1) "1-2"
#    2) 1) "n"
#       2) "2"
# ...（1-1 已被裁剪）

# 近似修剪：~ 允许实际长度略大于给定值，换取更好的性能
XADD bb:stream:approx MAXLEN ~ 3 * n 1

# MINID：删除所有 ID 小于 1-4 的条目
XADD bb:stream:trim MINID 1-4 1-6 n 6
# "1-6"

# 对普通字符串键执行 XADD 会报类型错误
SET bb:stream:str v
XADD bb:stream:str * a b
# (error) WRONGTYPE Operation against a key holding the wrong kind of value
```

#### 注意事项

- **字段是键值对而不是 JSON**：条目内的字段按写入顺序保存。应避免在同一条 `XADD` 中重复书写同一个字段名——实测 Redis 会原样保留多组同名键值对（例如 `a 1 a 2` 会同时返回两组），读取端容易产生歧义。
- **ID 与时间的关系**：自动 ID 的毫秒部分取服务器时钟，如果服务器时间回拨，Redis 仍会用"上一个 ID + 1"的策略保证 ID 递增。
- **修剪开销**：精确修剪（不带 `~`）在极端情况下可能拖慢写入，生产环境推荐 `MAXLEN ~` 并把阈值设得略高于业务需求。
- **消费者组**：`XADD` 只关心写入；读取侧的消费者组、确认等概念见 [其他流命令](./other-commands.md)。

#### 相关页面

- [XREAD](./xread.md)：从流中读取条目。
- [其他流命令](./other-commands.md)：`XRANGE`、`XLEN`、消费者组相关命令等。
- 返回专题目录：[Redis 流（Streams）](../streams.md)。
