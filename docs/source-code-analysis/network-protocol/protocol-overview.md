# Redis协议概述

## 概述

RESP（REdis Serialization Protocol）自 Redis 1.2 引入、2.0 成为标准通信协议。它是一种"二进制安全的文本协议"：报文由类型字节、行文本和长度前缀组成，既可以直接用 `nc` 读写，又能承载任意字节序列。本章按类型逐个说明报文格式，全部示例均可在本地实例上复现。

## 请求格式：inline 与 multibulk

客户端发请求有两种形态：

**内联协议（inline）**：把命令按空格拼接，以 `\r\n` 结尾，仅供人工调试使用。

```text
PING\r\n            ->  +PONG\r\n
SET bd:k v1\r\n     ->  +OK\r\n
```

**多批量协议（multibulk）**：生产客户端统一使用。首行 `*N` 声明参数个数，随后每个参数用 `$len` 声明字节长度：

```text
*2\r\n$4\r\nECHO\r\n$5\r\nhello\r\n    ->  $5\r\nhello\r\n
```

两者由解析器看首字节是否为 `*` 来区分（`networking.c` 的 `processMultibulkBuffer()` 与 `processInlineBuffer()`）。

## 回复类型一览（RESP2）

| 类型字节 | 含义 | 示例 |
|----------|------|------|
| `+` | 简单字符串（状态） | `+OK\r\n`、`+PONG\r\n` |
| `-` | 错误 | `-ERR unknown command 'NOSUCHCMD'` |
| `:` | 整数 | `:1\r\n`（DEL 的返回值） |
| `$` | 批量字符串 | `$5\r\nhello\r\n`；不存在为 `$-1\r\n` |
| `*` | 数组 | `*2\r\n$2\r\nv1\r\n$2\r\nv2\r\n`；空数组 `*0\r\n`，nil 数组 `*-1\r\n` |

一个 `SET/GET/DEL` 组合的原始字节流（本地实测）：

```text
SET bd:raw hello   ->  +OK\r\n
GET bd:raw         ->  $5\r\nhello\r\n
DEL bd:raw         ->  :1\r\n
```

## RESP3 新增类型

RESP3（Redis 6.0 起，客户端用 `HELLO 3` 协商）补齐了 RESP2 在语义上的缺口。服务器在 RESP2 会话里会自动把这些类型"降级"成 RESP2 等价物。用 `DEBUG PROTOCOL` 可以逐个观察（需 `enable-debug-command yes`，8.0.5 支持的子命令为 `string|integer|double|bignum|null|array|set|map|attrib|push|verbatim|true|false`）：

```text
DEBUG PROTOCOL string    ->  $11\r\nHello World\r\n          批量字符串
DEBUG PROTOCOL integer   ->  :12345\r\n                       整数
DEBUG PROTOCOL double    ->  ,3.141\r\n                       浮点
DEBUG PROTOCOL bignum    ->  (1234567999999999999999999999999999999\r\n  大整数
DEBUG PROTOCOL null      ->  _\r\n                            空值
DEBUG PROTOCOL true      ->  #t\r\n                           布尔真
DEBUG PROTOCOL false     ->  #f\r\n                           布尔假
DEBUG PROTOCOL array     ->  *3\r\n:0\r\n:1\r\n:2\r\n         数组
DEBUG PROTOCOL map       ->  %3\r\n:0\r\n#f\r\n:1\r\n#t\r\n:2\r\n#f\r\n   映射
DEBUG PROTOCOL set       ->  ~3\r\n:0\r\n:1\r\n:2\r\n         集合
DEBUG PROTOCOL verbatim  ->  =29\r\ntxt:This is a verbatim\nstring\r\n     带格式提示的字符串
```

RESP3 会话中 `HSET` 返回 `:1`、`CONFIG GET` 返回 map `%`、`SINTERCARD` 等命令的语义更精确。同一命令在 RESP2 会话下的表现：

```text
DEBUG PROTOCOL map（RESP2 会话） ->  *6\r\n:0\r\n:0\r\n:1\r\n:1\r\n:2\r\n:0\r\n
```

即 map 被摊平成 6 元素数组，布尔值退化为 0/1 整数。

## push 与 attribute

push 消息（`>`）是 RESP3 最重要的增强：服务器可以在命令回复之外，主动向客户端插入"带外"数据。pub/sub 是典型场景，RESP2 会话中订阅确认与消息和普通回复混在数组里，客户端只能靠内容猜；RESP3 下则是明确的 push 类型：

```text
SUBSCRIBE bd:chan（RESP3）  ->  >3\r\n$9\r\nsubscribe\r\n$7\r\nbd:chan\r\n:1\r\n
PUBLISH 后收到              ->  >3\r\n$7\r\nmessage\r\n$7\r\nbd:chan\r\n$2\r\nhi\r\n
```

attribute（`|`）允许服务器在正常回复前附带元数据（如 `key-popularity`），规范要求客户端必须能跳过它继续读真正的回复。

## 协议协商：HELLO

`HELLO [protover [AUTH user pass] [SETNAME name]]` 返回服务器信息并切换协议版本，RESP2 下返回扁平数组，RESP3 下返回 map：

```text
HELLO 3   ->  %7\r\n$6\r\nserver\r\n$5\r\nredis\r\n$7\r\nversion\r\n$5\r\n8.0.5\r\n$5\r\nproto\r\n:3\r\n...
HELLO     ->  *14\r\n...proto\r\n:2\r\n...                       （默认 RESP2）
HELLO 3 AUTH u p   ->  -WRONGPASS invalid username-password pair or user is disabled.
```

`HELLO 2` 可随时降回 RESP2；协商结果记录在 `client->resp`，之后所有 `addReply*` 输出都按它分支。

## 错误与空值的约定

- 错误报文以 `-` 开头，如 `-ERR wrong number of arguments for 'echo' command`、`-WRONGTYPE ...`、`-MOVED 8338 127.0.0.1:16401`。错误前缀（`ERR`、`WRONGTYPE`、`MOVED`）是客户端程序化判断错误类别的依据。
- RESP2 用 `$-1`/`*-1` 表示空，RESP3 用 `_`；`BLPOP` 超时、不存在的键等场景都依赖这一区分。

## 小结

RESP 用不到 20 种报文形态覆盖了 Redis 全部交互：请求侧 inline/multibulk 二选一，回复侧由类型字节驱动。RESP2 与 RESP3 的差别集中在"类型保真度"上——map/set/bool/double/push 让客户端不再猜测，也让服务器能把 pub/sub 等带外消息显式标记出来。熟悉这些字节形态后，下一章进入 `networking.c`，看它们是如何被逐字节解析与拼装的。
