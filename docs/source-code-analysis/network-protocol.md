# 网络协议

## 概述

Redis 的一切交互都建立在一个自定义的应用层文本协议之上：RESP（REdis Serialization Protocol）。客户端把命令编码成 RESP 请求写入 TCP 连接，服务器解析后执行命令，再把结果编码成 RESP 回复写回。读懂 RESP，是读懂 `networking.c` 的前提：这个 4000 多行的文件里，读缓冲、协议解析、回复缓冲、输出缓冲区限制全部围绕同一组 `client` 结构体展开。

本章是网络协议部分的入口，分为三个层面：

- **协议本身**：RESP2 与 RESP3 的报文格式与类型（见《Redis协议概述》）。
- **实现机制**：读缓冲、解析器、回复缓冲、io-threads 如何协作（见《具体实现细节》）。
- **工程实践**：如何用命令行与原始套接字观察协议行为。

## 为什么是文本协议

RESP 选择"人类可读的二进制安全文本"路线，工程上的收益非常直接：

1. **解析成本极低**：每个回复以一个类型字节开头（如 `+`、`:`、`$`），逐行读直到 `\r\n` 即可，不需要 XML/JSON 那样的完整词法分析。
2. **调试友好**：`nc`、`telnet` 甚至 `printf` 就能直接和服务器对话。
3. **二进制安全**：多批量（multibulk）格式用前缀长度声明每段数据的字节数，值中可以包含 `\r\n` 与空字节。

代价是体积略大，但配合连接复用与 pipeline，在绝大多数场景下瓶颈并不在协议本身。

## 协议演进：RESP2 与 RESP3

Redis 从 6.0 起支持 RESP3，客户端通过 `HELLO 3` 升级，协议版本记录在 `client->resp` 中：

```bash
$ redis-cli -p 6399 hello 3
server redis
version 8.0.5
proto 3
id 1235
mode standalone
role master
modules name vectorset
ver 1
path
args
```

RESP3 相对 RESP2 的核心增量：

| 类型 | 前缀 | RESP2 下的降级方式 |
|------|------|--------------------|
| null | `_` | 空多批量 `$-1` / `*-1` |
| boolean | `#` | 整数 0/1 |
| double | `,` | 批量字符串 |
| big number | `(` | 批量字符串 |
| map | `%` | 扁平数组 |
| set | `~` | 数组 |
| push | `>` | 数组（2.x 风格 pubsub 消息） |
| verbatim string | `=` | 批量字符串 |
| attribute | `\|` | 忽略（按规范客户端必须可跳过） |

resp2/resp3 双轨意味着同一份命令实现在输出时要做类型转换，这些转换逻辑集中在 `networking.c` 的 `addReply*` 系列函数中。

## 源码位置总览

- `src/networking.c`：协议实现的核心。`readQueryFromClient()`（8.0 中约 2900 行处）是读事件回调；`processInlineBuffer()`、`processMultibulkBuffer()` 负责解析；`writeToClient()`、`prepareClientToWrite()` 负责回复。
- `src/connection.c`、`src/socket.c`：连接抽象层，把 socket/TLS 统一成 `connection` 接口。
- `src/ae.c`、`src/ae_epoll.c`：事件循环，决定"什么时候读、什么时候写"。
- `src/iothread.c`（8.0 新拆分）：多线程 I/O，客户端被分配到各线程自己的事件循环上。
- `src/server.c`：解析完成后进入 `processCommand()` 与 `call()`，属于命令处理流程章节。

## 一个最小验证：原始套接字对话

不借助任何客户端库，直接用内联协议（inline protocol）发命令：

```bash
$ printf 'PING\r\n' | nc 127.0.0.1 6399
+PONG
```

服务器收到的 `PING\r\n` 没有 `*` 前缀，会被 `processInlineBuffer()` 按空格切分成 argv。再发一个多批量请求（先 `HELLO 2` 避免 RESP3 回复干扰展示）：

```text
*2\r\n$4\r\nECHO\r\n$5\r\nhello\r\n   ->   $5\r\nhello\r\n
```

注意内联协议无法表达含空格的参数：`ECHO hello world` 会被切成三个参数并报 `-ERR wrong number of arguments for 'echo' command`。这也是 Redis 官方要求"生产客户端一律使用 multibulk"的原因。

## 观察协议的实用命令

```bash
# 查看当前连接数与缓冲区水位
redis-cli -p 6399 info clients
redis-cli -p 6399 client list | head -3

# redis-cli 显示协议原始文本（-3 切换 RESP3）
redis-cli -3 -p 6399 client info | tr ' ' '\n' | grep resp=
# resp=3
```

要逐字节观察 RESP3 新类型，最方便的是 `DEBUG PROTOCOL`，但它需要服务器显式开启 `enable-debug-command`（共享实例通常关闭，自建实例可加 `redis-server --enable-debug-command yes` 启动）：

```bash
$ redis-cli -p 16390 debug protocol map      # 本地自建实例
1) 0
2) (false)
...
```

## 小结

RESP 是一套为"每秒百万次往返"设计的极简协议：类型字节 + 行文本 + 长度前缀。它把复杂度留给了两端实现——客户端要处理 RESP2/RESP3 双轨与 push/attribute 等新类型，服务器要在单次事件循环里完成"读入-解析-执行-回复"。后续两章分别展开协议格式细节与 `networking.c` 内部的实现机制。
