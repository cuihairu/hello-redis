### 命令解析

#### 概述

命令解析是 Redis 命令处理流程中的第一步，负责将客户端发送的原始字节流转换为可执行的命令结构。Redis 使用 RESP（REdis Serialization Protocol）作为其底层通信协议。命令解析的核心实现在 `src/networking.c` 中，特别是 `readQueryFromClient()`、`processMultibulkBuffer()` 等函数。

Redis 支持 RESP2 和 RESP3 两个协议版本。客户端可以通过 `HELLO` 命令协商使用的协议版本（例如 `HELLO 3` 切换到 RESP3）。协议版本的不同会影响某些类型的序列化和解析方式，但命令的执行流程基本保持一致。

#### 关键流程与实现要点

**1. RESP 协议格式**

RESP 协议是基于文本的简单协议，主要类型如下：

- **简单字符串（Simple Strings）**：以 `+` 开头，后跟字符串内容，以 `\r\n` 结尾。例如：`+OK\r\n`。
- **错误（Errors）**：以 `-` 开头，表示错误消息，如 `-ERR unknown command\r\n`。
- **整数（Integers）**：以 `:` 开头，后跟整数值，如 `:1000\r\n`。
- **大块字符串（Bulk Strings）**：以 `$` 开头，后跟字符串长度和实际内容。例如：`$5\r\nhello\r\n`。空字符串为 `$0\r\n\r\n`，`nil`（空值）在 RESP2 中表示为 `$-1\r\n`。
- **数组（Arrays）**：以 `*` 开头，后跟数组元素个数和各个元素的序列化内容。例如，命令 `SET key value` 在 RESP2 中表示为 `*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n`。

RESP3 在 RESP2 基础上新增了布尔值、双精度浮点数、大整数、映射（Map）、集合（Set）、推送（Push）、Verbatim 字符串等类型。`HELLO` 命令用于在客户端与服务器之间协商协议版本。

**2. 数据读取**

当客户端套接字有数据可读时，事件循环触发读事件，调用 `readQueryFromClient()`（`src/networking.c`）：

- 该函数从套接字读取尽可能多的数据，避免频繁的系统调用。
- 读取到的数据追加到客户端的输入缓冲区（`client->querybuf`）。
- 读取完成后，调用命令解析函数处理缓冲区中的数据。

```plaintext
readQueryFromClient() [networking.c]
  └─> 从 socket 读取数据到 client->querybuf
  └─> processInputBuffer(client)
```

**3. 命令解析处理**

`processInputBuffer()`（通常通过 `readQueryFromClient()` 间接调用，相关逻辑在 `networking.c` 中处理）负责判断当前协议状态并进行解析：

- Redis 解析的是 RESP 数组格式的命令请求。客户端发送的命令总是以 `*`（数组）开头的多条目请求（multibulk）。
- 对于多 bulk 请求的解析，主要由 `processMultibulkBuffer()`（`src/networking.c`）完成。该函数从输入缓冲区中解析出数组的元素个数（argc）以及每个元素的字符串值（argv）。
- 解析过程中会处理大块字符串（`$`）的长度字段和实际内容字段，确保正确处理跨缓冲区的部分数据（虽然单次读取已尽量读取完整数据，但仍需处理边界情况）。
- 解析完成后，会构建出 `argv`（字符串数组）和 `argc`（参数个数），并将其传递给命令处理函数 `processCommand()`（`src/server.c`）。

**4. 解析的关键函数**

- `readQueryFromClient(client *c)`：从客户端套接字读取原始数据，是协议解析的入口。
- `processMultibulkBuffer(client *c)`：解析 RESP 数组格式的命令请求，提取命令和参数。
- `sdscatlen()`、`sdsnewlen()` 等 SDS 操作：用于管理输入缓冲区和解析过程中的字符串数据（SDS 定义于 `src/sds.c`）。

**5. 解析过程中的注意事项**

- **缓冲区管理**：输入缓冲区采用 SDS（Simple Dynamic String）实现，可以动态扩展以容纳大请求。
- **部分请求处理**：如果接收到的请求不完整（例如只收到 `$5\r\nhe`），解析函数会暂时停止，等待下一次可读事件继续读取剩余数据。
- **协议错误处理**：当遇到格式错误的 RESP 数据时，Redis 会向客户端返回协议错误（`-ERR Protocol error`）并可能关闭连接，具体行为依赖于配置和错误类型。

```plaintext
客户端请求（RESP2）: *3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n
解析结果: argc=3, argv=["SET", "key", "value"]
```

### 小结

Redis 的命令解析建立在 RESP 协议之上，通过简洁的解析逻辑将字节流转换为命令参数数组。`processMultibulkBuffer()` 是解析的核心函数，它处理 RESP 数组和大块字符串的结构，确保命令能够被正确提取。RESP2 和 RESP3 的共存为协议演进提供了灵活性，而缓冲区的动态管理则保证了对不同大小请求的鲁棒处理。理解命令解析过程，是掌握 Redis 网络层工作原理的重要一步。