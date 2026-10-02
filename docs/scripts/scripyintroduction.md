# 脚本功能介绍

Redis 的脚本功能允许把一段逻辑放进服务器端一次性执行，从而把"多次网络往返 + 客户端自行保证一致性"变成"一次往返 + 服务器端原子完成"。本章介绍脚本能力的基本形态、典型用途与边界。

## 1. 脚本提供什么

### 1.1 原子性

脚本执行期间，Redis 主线程被独占，其他客户端的命令会排队等待。这保证了脚本内部的多条命令不会被其他命令穿插执行。

需要注意的是"原子"并不等于"回滚"：脚本执行中途报错时，此前已执行的写入不会被撤销。脚本设计时应尽量把校验放在所有写操作之前。

### 1.2 减少网络往返

假设需要完成"读取计数器 → 加一 → 设置过期时间 → 返回结果"四步操作：

- 客户端方案：4 次往返，还需要客户端加锁或重试以保证并发正确性
- 脚本方案：1 次往返，服务端串行执行

在跨地域或高延迟链路上，这一项往往比 CPU 开销更关键。

### 1.3 服务端计算

脚本可以读写多个键并做判断、加减、序列化等运算，不必把数据取回客户端再传回。例如把一组散列字段聚合成一个 JSON 字符串。

## 2. 两种脚本类型

Redis 的"脚本"实际包含两条不同的扩展路线：

| 类型 | 载体 | 入口命令 |
| --- | --- | --- |
| Lua 脚本 | Redis 内置 Lua 5.1 解释器 | `EVAL`、`EVALSHA`、`SCRIPT LOAD` |
| 模块 | C/C++ 编译的 `.so` | `loadmodule`、`MODULE LOAD` |

Lua 脚本只能组合已有命令；模块可以新增命令和数据类型。详见 [Redis 模块与脚本支持](modules-support.md)。

## 3. 核心命令

| 命令 | 用途 |
| --- | --- |
| `EVAL script numkeys key [key ...] arg [arg ...]` | 执行脚本并返回结果 |
| `EVALSHA sha1 numkeys key [key ...] arg [arg ...]` | 用 SHA1 执行已缓存脚本 |
| `SCRIPT LOAD script` | 预加载脚本，返回 SHA1 |
| `SCRIPT EXISTS sha1 [sha1 ...]` | 检查脚本是否已缓存 |
| `SCRIPT FLUSH [ASYNC \| SYNC]` | 清空脚本缓存 |
| `SCRIPT DEBUG YES \| SYNC \| NO` | 单步调试脚本（会阻塞服务器） |
| `SCRIPT KILL` | 终止尚未写入数据的脚本 |
| `FUNCTION LOAD` / `FCALL` | Redis 7 引入的函数库机制，等价于带库管理的 `SCRIPT LOAD` + `EVALSHA` |

### 3.1 KEYS 与 ARGV 的划分

所有要访问的键必须通过 `numkeys` 声明并从 `KEYS` 数组读取，其余值从 `ARGV` 读取。绝不要把值拼进脚本文本或用字符串拼接构造键名。

```plaintext
> EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 mykey myvalue
OK
```

### 3.2 预加载与 NOSCRIPT 回退

高频调用的脚本应先用 `SCRIPT LOAD` 加载，再用 `EVALSHA` 调用。客户端必须处理 `NOSCRIPT` 错误（脚本因重启、切换或 `SCRIPT FLUSH` 而失效），回退到 `EVAL` 并重新记录 SHA1。

```plaintext
> SCRIPT LOAD "return redis.call('SET', KEYS[1], ARGV[1])"
"d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37"

> EVALSHA d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37 1 mykey myvalue
OK
```

## 4. 典型用途

| 用途 | 实现要点 |
| --- | --- |
| 原子计数器 | `INCR` + `EXPIRE` 放在同一脚本 |
| 固定窗口限流 | `INCR` 后判断是否首次并设置过期时间，超限返回 0 |
| 幂等去重 | `SET key val NX EX ttl`，成功即占位 |
| 分布式锁 | `SET key token NX EX ttl`，释放时校验 token |
| 乐观锁 CAS | 比对旧值，匹配才写入 |
| 队列取任务 | `LPOP`/`RPOPLPUSH` 或 `XREADGROUP` 组合 |

具体脚本见 [Lua 与 Redis 的集成](lua-redis-integration.md)。

## 5. 明确的限制

1. **脚本执行期间实例不可用**：这是 Lua 脚本最重要的约束。长脚本必须拆小。
2. **没有超时参数**：`EVAL` 不支持 `TIMEOUT`，只能通过 `busy-reply-threshold` 让其他客户端收到 `BUSY`，脚本本身仍会跑完。
3. **沙箱无文件系统与网络**：`print`、`io`、`dofile`、`os.execute` 均不可用。
4. **集群下只能访问已声明的键**：跨槽操作会失败，应使用哈希标签把相关键放到同一槽。
5. **主从异步复制**：脚本的执行结果按普通写命令异步传播，脚本本身不提供跨副本的一致性保证。需要强一致时应配合 `WAIT` / `WAITAOF`。

## 6. 与事务的取舍

`MULTI`/`EXEC` 同样提供原子性，但无法在服务端做条件判断。脚本相当于"带逻辑的事务"，在需要 `if/else`、循环、计算时必须用脚本。两者对数据的回滚语义一致：**都不回滚**。

选择建议：

- 只是打包批量命令 → 用 `MULTI`/`EXEC` 或 pipeline
- 需要根据读取结果决定后续写入 → 用脚本
- 需要跨多个键的原子操作且逻辑复杂 → 脚本，但必须控制执行时间

## 7. 小结

脚本功能的价值在于把"网络往返"和"并发正确性"这两件事交给服务器。正确使用它的前提是尊重单线程约束：控制脚本长度、只访问已声明的键、正确处理 `redis.pcall` 的两种返回形态、并为 `EVALSHA` 实现 `NOSCRIPT` 回退。