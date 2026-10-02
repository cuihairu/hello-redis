### 命令处理

#### 1. 概述

Redis 的命令处理是整个系统的核心工作流程之一，负责将客户端发送的协议数据解析成具体命令，并执行相应的操作。这个过程涉及 RESP 协议解析、命令查找、参数校验、权限检查、命令执行、传播以及回复发送等多个环节。

命令处理的主要入口位于 `src/networking.c` 和 `src/server.c` 中。客户端请求首先由网络层读取并解析，然后传递给 `processCommand()`（`src/server.c`）进行处理，最后通过 `call()` 函数执行具体的命令处理函数。

#### 2. 命令处理的整体流程

Redis 的命令处理流程大致可以分为以下几个步骤：

1. **连接建立**：客户端通过 TCP 或 Unix 域套接字连接到 Redis，`acceptTcpHandler()`（`src/networking.c`）创建客户端对象并注册读事件。
2. **请求读取**：当数据可读时，`readQueryFromClient()`（`src/networking.c`）从套接字读取数据到客户端的输入缓冲区。
3. **协议解析**：读取的数据按照 RESP 协议格式进行解析。对于 RESP2 的多行命令（multibulk），解析由 `processMultibulkBuffer()`（`src/networking.c`）完成，提取出命令名称和参数数组。
4. **命令查找与校验**：解析得到的命令数组传递给 `processCommand()`（`src/server.c`）。该函数首先查找命令表（`redisCommandTable`）获取对应的命令结构，然后进行 arity（参数数量）、flags、认证、ACL 等校验。
5. **命令执行**：校验通过后，调用 `call()`（`src/server.c`）执行命令。`call()` 会处理脏计数（`server.dirty++`）、命令传播（AOF/replicas）、键空间通知等副作用，然后调用命令的处理函数（`c->cmd->proc()`）。
6. **结果回复**：命令处理函数通过 `addReply()` 系列函数（`src/networking.c`）将结果写入客户端的输出缓冲区，随后由事件循环触发写事件将响应发送给客户端。

#### 3. 关键数据结构与函数

命令处理过程中涉及的关键要点包括：

- **RESP 协议**：Redis 使用 RESP（REdis Serialization Protocol）作为客户端-服务器通信协议。RESP2 支持简单字符串（+）、错误（-）、整数（:）、大块字符串（$）和数组（*）；RESP3 在此基础上扩展了更多类型。协议协商通过 `HELLO` 命令实现。
- **命令表**：`redisCommandTable` 位于 `src/server.c`，包含所有内置命令的定义。每个条目是 `struct redisCommand`，记录了命令名、处理函数指针、参数个数要求（arity）、命令标志（flags）等信息。
- **命令标志（flags）**：命令标志决定了命令的行为特性，例如 `CMD_WRITE` 表示写命令（会修改数据）、`CMD_READONLY` 表示只读、`CMD_FAST` 表示执行快速、`CMD_DENYOOM` 表示在内存不足时仍可执行等。这些标志在 `call()` 中用于决定是否需要传播、是否触发通知等逻辑。
- **脏计数与传播**：当写命令执行后，会增加服务器的脏计数（`server.dirty++`），用于判断是否需要触发 RDB 保存或 AOF 重写等操作。同时，`propagate()`（`src/server.c`）负责将命令传播到 AOF 文件和所有副本（replicas）。
- **键空间通知**：`notifyKeyspaceEvent()`（`src/server.c`）在键被修改、过期等事件发生时发送通知，用于支持 `KEYSPACE`、`KEYEVENT` 通道的发布订阅机制。

#### 4. I/O 线程对命令处理的影响

需要特别注意的是：Redis 的命令执行本身始终在主线程中进行。自 Redis 6 引入的 `io-threads` 只负责并行化套接字的读取（read）和写入（write）操作。也就是说，I/O 线程可以同时读取多个客户端的请求数据并解析成命令，但实际调用 `call()` 执行命令的操作仍由主线程串行完成。这一设计保证了命令执行的原子性和确定性，同时提升了网络吞吐量。

### 小结

Redis 的命令处理流程是一个清晰的管道式设计：网络 I/O → RESP 解析 → 命令查找与校验 → `call()` 执行 → 副作用处理（传播、通知、脏计数）→ 响应发送。这个流程的每个环节都经过精心设计，在保持简单性的同时实现了高性能和可靠性。理解命令处理流程是深入分析 Redis 各种数据类型命令实现的关键基础。