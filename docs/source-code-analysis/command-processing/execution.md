### 命令执行

#### 概述

命令解析完成后，Redis 会将提取出的命令名称和参数数组传递给命令执行层。命令执行的核心入口是 `processCommand()`（`src/server.c`），最终通过 `call()` 函数调用具体命令的处理函数。这个过程不仅负责执行命令本身，还需要处理权限校验、参数校验、副作用（脏计数、传播、通知）、事务、发布订阅等诸多逻辑。

每个内置命令都有对应的处理函数定义在各自的命令实现文件中，例如字符串命令在 `src/t_string.c`，哈希命令在 `src/t_hash.c`，列表命令在 `src/t_list.c`，集合在 `src/t_set.c`，有序集合在 `src/t_zset.c`，键管理命令在 `src/db.c` 等。

#### 关键流程与实现要点

**1. 命令查找与校验（processCommand）**

`processCommand()`（`src/server.c`）是命令执行的总控函数，其主要步骤如下：

- **命令查找**：根据 `argv[0]`（命令名称），在命令表 `redisCommandTable` 中查找对应的 `redisCommand` 结构。如果未找到，则返回 `-ERR unknown command`。
- **参数校验（arity）**：检查命令所需的参数数量。`cmd->arity` 表示命令期望的参数个数（包括命令名本身）。如果 `arity >= 0`，则要求 `argc == arity`；如果 `arity < 0`，则表示命令至少需要 `-(arity)` 个参数。
- **连接与权限校验**：检查客户端是否已通过认证（`AUTH`）、是否符合 ACL（访问控制列表）权限、是否在事务中等状态。
- **只读/写命令校验**：对于处于只读模式（replica）或配置了只读限制的场景，`CMD_WRITE` 标志的命令可能会被拒绝执行。
- **其他校验**：如集群模式下的键所在槽位校验、内存不足时对某些命令的限制（`CMD_DENYOOM` 标志）等。

校验通过后，`processCommand()` 会调用 `call()` 函数执行命令。

**2. 命令执行（call 函数）**

`call()`（`src/server.c`）是实际执行命令的核心函数。它在执行命令处理函数之前和之后负责处理各种副作用：

- **监视器（Monitor）处理**：如果有监视器客户端，记录当前命令的执行信息。
- **脏计数更新**：对于写命令（带有 `CMD_WRITE` 标志），会增加服务器的脏计数 `server.dirty++`。这个计数用于判断是否需要触发 RDB 快照保存（`bgsave`）或 AOF 重写等持久化操作。
- **命令传播（propagate）**：对于需要传播的写命令，`call()` 会调用 `propagate()`（`src/server.c`）将命令追加到 AOF 文件，并将命令发送给所有连接的副本（replicas）。传播的时机和方式取决于命令标志和当前上下文（如是否在事务中、是否是 Lua 脚本执行等）。
- **键空间通知**：在键被修改、过期、删除等操作发生时，调用 `signalModifiedKey()` 和 `notifyKeyspaceEvent()`（`src/server.c`）向订阅了 `__keyspace@<db>__` 或 `__keyevent@<db>__` 通道的客户端发送通知。
- **调用命令处理函数**：最终执行 `c->cmd->proc(c)`，即调用命令表中注册的具体处理函数。处理函数通过客户端对象 `c` 获取命令参数（`c->argv`、`c->argc`）和数据库等上下文信息。
- **统计信息更新**：更新命令执行统计（如调用次数、总执行时间等），这些信息可通过 `INFO commandstats` 查看。

```plaintext
processCommand(c)
  ├─> 查找命令表
  ├─> 检查 arity、认证、ACL、flags
  └─> call(c, CMD_CALL_FULL)

call(c, flags)
  ├─> 处理 monitor、stats
  ├─> 如果是写命令：server.dirty++
  ├─> propagate() 传播到 AOF 和 replicas
  ├─> signalModifiedKey() / notifyKeyspaceEvent()
  ├─> c->cmd->proc(c)  执行具体命令
  └─> 处理后续统计和通知
```

**3. 命令处理函数的实现**

各类型命令的处理函数遵循一定的模式：

- **参数获取**：从 `client->argv[1...]` 获取参数（`argv[0]` 是命令名）。
- **键操作**：大部分命令需要操作数据库中的键。Redis 通过 `lookupKey()`、`setKey()`、`dbAdd()`、`dbDelete()` 等数据库操作函数（定义于 `src/db.c`）来读写键空间。
- **对象操作**：键值对以 `robj`（Redis Object）形式存储。命令需要根据对象的类型和编码进行相应处理，相关函数位于 `src/object.c`。
- **结果回复**：命令执行完成后，使用 `addReply()`、`addReplyString()`、`addReplyLongLong()`、`addReplyBulk()` 等函数（`src/networking.c`）向客户端输出缓冲区写入响应结果。

例如，字符串的 `GET` 命令（在 `src/t_string.c` 中实现的 `getCommand()`）会查找键对应的值对象，检查类型是否为字符串，然后将值以 bulk string 形式回复给客户端。

**4. 事务、脚本与特殊情况**

- **事务（MULTI/EXEC）**：在事务状态下，命令不会立即执行，而是被放入事务队列，待 `EXEC` 时批量执行。相关逻辑在 `src/multi.c` 中处理。
- **Lua 脚本（EVAL/EVALSHA）**：脚本执行是原子性的，在脚本运行期间，Redis 会进入特殊模式，避免其他命令干扰。脚本引擎相关代码位于 `src/script.c` 和 `src/eval.c`。
- **订阅/发布（PUB/SUB）**：发布订阅命令的执行逻辑与普通键空间操作不同，主要在 `src/pubsub.c` 中实现。
- **阻塞命令**：某些命令（如 `BLPOP`、`BRPOP`、`XREAD BLOCK` 等）在条件不满足时会阻塞客户端，而不是立即返回结果。阻塞处理逻辑在 `src/blocked.c` 中实现。

### 小结

Redis 的命令执行是一个严谨而高效的过程。`processCommand()` 负责全面的校验和准备工作，`call()` 则统一处理所有命令的副作用（脏计数、传播、通知），确保了系统行为的一致性。具体命令处理函数则专注于业务逻辑的实现。通过这种清晰的分层设计，Redis 能够在保持单线程执行简单性的同时，正确处理事务、复制、持久化、通知等复杂的系统特性。理解这一执行流程，对于分析任何 Redis 命令的源码实现都至关重要。