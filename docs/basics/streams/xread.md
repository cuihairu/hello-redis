# XREAD

`XREAD` 用于从一个或多个流中读取条目，是流最基本的读取命令。它支持两种典型用法：从某个 ID 之后读历史数据，以及监听新条目（可配合阻塞参数）。多个客户端可以各自独立地读取同一条流而互不影响。

## 语法

```plaintext
XREAD [COUNT count] [BLOCK milliseconds] STREAMS key [key ...] id [id ...]
```

## 参数说明

- `COUNT count`：每个流最多返回多少条条目。
- `BLOCK milliseconds`：阻塞模式。目标数据不可用时挂起连接，最多等待指定的毫秒数；`BLOCK 0` 表示无限期阻塞，直到读到新条目。不指定该参数则立即返回。
- `STREAMS`：固定关键字，之后依次给出若干流键和与之对应的起始 ID，键与 ID 的数量必须相等。
- `id`：起始 ID，返回所有**严格大于**该 ID 的条目。常用两种特殊值：
  - `0`：从头开始，返回流中所有（或 COUNT 限制内）的条目；
  - `$`：只读取调用之后新写入的条目，等价于「当前最大 ID 之后」。

## 返回值

流名与条目的嵌套数组；没有任何可读数据且未阻塞时返回 nil。

## 示例

先准备一个包含两条条目的流，以下命令可以直接在 `redis-cli` 中执行，注释中为实测返回结果：

```plaintext
XADD bb:stream:orders 1-1 user u1 amount 100
# "1-1"
XADD bb:stream:orders 1-2 user u2 amount 200
# "1-2"

# 从头读取全部条目
XREAD COUNT 10 STREAMS bb:stream:orders 0
# 1) 1) "bb:stream:orders"
#    2) 1) 1) "1-1"
#          2) 1) "user"
#             2) "u1"
#             3) "amount"
#             4) "100"
#       2) 1) "1-2"
#          2) 1) "user"
#             2) "u2"
#             3) "amount"
#             4) "200"

# COUNT 1：只取第一条
XREAD COUNT 1 STREAMS bb:stream:orders 0
# 1) 1) "bb:stream:orders"
#    2) 1) 1) "1-1"
#          ...

# 从 1-1 之后读，只返回 1-2
XREAD STREAMS bb:stream:orders 1-1

# 没有比 1-2 更新的条目，立即返回 nil
XREAD STREAMS bb:stream:orders 1-2
# (nil)

# $ 表示只读新条目，当前没有新条目，返回 nil
XREAD STREAMS bb:stream:orders $
# (nil)

# 流不存在时返回 nil，XREAD 不会自动创建键
XREAD STREAMS bb:stream:missing 0
# (nil)

# 同时读取多个流，每个流使用独立的起始 ID
XADD bb:stream:pay 5-1 order o1 status paid
XREAD COUNT 1 STREAMS bb:stream:orders bb:stream:pay 0 0
# 1) 1) "bb:stream:orders"
#    2) 1) 1) "1-1"
#          ...
# 2) 1) "bb:stream:pay"
#    2) 1) 1) "5-1"
#          ...
```

## 阻塞读取

阻塞模式常用于「等待新消息」的消费者场景。在第一个终端执行：

```plaintext
# BLOCK 0 表示无限阻塞，直到有新条目到达
XREAD BLOCK 0 STREAMS bb:stream:orders $
```

此时该命令会挂起。然后在第二个终端写入一条新条目：

```plaintext
XADD bb:stream:orders 1-3 user u3 amount 300
# "1-3"
```

第一个终端会立即返回这条新条目：

```plaintext
1) 1) "bb:stream:orders"
   2) 1) 1) "1-3"
         2) 1) "user"
            2) "u3"
            3) "amount"
            4) "300"
```

设置有限的阻塞时间（例如 `BLOCK 200`）时，超时后返回 nil，适合轮询型消费者。

## 注意事项

- `$` 的起点是调用时刻的最新位置：多个消费者都用 `$` 阻塞时，阻塞期间写入的条目都能读到；但如果阻塞间隙有旧条目写入且未被读取，重新用 `$` 调用会跳过它们，重要场景应记录上一次读到的 ID。
- `XREAD` 不改变流状态：它不标记、不确认条目，多个消费者读同一条流都能读到全部数据；需要「一条消息只被一个消费者处理」时，应使用消费者组（`XREADGROUP`）。
- `BLOCK 0` 会一直占用一个连接，客户端需要有断线重连逻辑；连接池场景要控制阻塞客户端的数量。
- `COUNT`、`BLOCK` 必须写在 `STREAMS` 之前，键与 ID 在 `STREAMS` 之后成对出现。

## 相关页面

- [XADD](./xadd.md)：向流中追加条目。
- [其他流命令](./other-commands.md)：`XRANGE`、消费者组与 `XREADGROUP` 等。
- 返回专题目录：[Redis 流（Streams）](../streams.md)。
