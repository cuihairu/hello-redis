# Lua 与 Redis 的集成

Redis 内置了 Lua 5.1 解释器，允许把一段逻辑直接放到服务器端执行。理解 Lua 运行环境与 Redis 的集成方式，是编写可靠脚本的前提。

## 1. Lua 运行环境

脚本在 Redis 主线程中执行，因此脚本运行期间 Redis 不会响应其他命令。这一点既是脚本提供原子性的原因，也是编写脚本时必须注意的性能约束。

Redis 为脚本提供了两组特殊的全局变量：

- `KEYS`：脚本被访问的键名数组。通过 `EVAL`/`EVALSHA` 的 `numkeys` 参数声明。
- `ARGV`：除键名以外的全部参数数组，按出现顺序排列。

以及一个 `redis` 表，包含所有可用的命令接口。

### 1.1 KEYS 与 ARGV

```bash
EVAL script numkeys key [key ...] arg [arg ...]
```

在 Redis 7 及以上版本中，脚本访问 `numkeys` 声明之外的键会破坏集群模式的键路由约定，因此务必把所有要访问的键通过 `KEYS` 传入，把值通过 `ARGV` 传入。

```plaintext
> EVAL "return {KEYS[1], KEYS[2], ARGV[1], ARGV[2]}" 2 k1 k2 v1 v2
1) "k1"
2) "k2"
3) "v1"
4) "v2"
```

### 1.2 redis.call 与 redis.pcall

- `redis.call(cmd, arg...)`：执行命令。如果命令返回错误，会把错误作为 Lua 错误抛出并中止脚本执行。
- `redis.pcall(cmd, arg...)`：执行命令并**捕获错误**，不会中止脚本。

两者还支持若干可选参数，用于指定超时与只读模式：

- `redis.call(cmd, {timeout=0, pcalls=0}, arg...)`：`timeout` 以毫秒为单位指定 `BUSY` 超时阈值，`pcalls` 开启伪随机模式。
- `redis.setresp(depth)`：设置 `redis.call` 的回复转换深度，只接受 `2`（默认）或 `3`。`2` 会把嵌套结构转换成普通 Lua 数组（纯数字索引）；`3` 按 RESP3 类型转换，映射类回复会被包装进 `map` 字段等具名结构，因此访问方式与 `2` 不同。除非确实需要 RESP3 语义，否则应保持默认的 `2`，否则已有脚本很容易取不到值。

`redis.pcall` 的返回值有两种形态，这是最容易写错的地方：

| 情况 | 返回值 |
| --- | --- |
| 命令成功，结果非空 | 对应的 Lua 值（字符串、整数、数组或状态回复表） |
| 命令成功，但结果为空（如 `GET` 不存在的键） | Lua 布尔值 `false` |
| 命令真正报错（如 `WRONGTYPE`） | 带 `err` 字段的表 |

因此判断错误时必须先检查类型：

```lua
local result = redis.pcall('INCR', KEYS[1])
if type(result) == 'table' and result.err then
    return redis.error_reply('Error: ' .. result.err)
end
return result
```

如果直接写 `if result.err then`，当 `result` 是布尔值时会抛出 `attempt to index local 'result' (a boolean value)`。

### 1.3 其他 redis 表成员

| 成员 | 作用 |
| --- | --- |
| `redis.status_reply(str)` | 返回简单状态回复（`+str`），成功时常用 `OK` |
| `redis.error_reply(str)` | 返回错误回复（`-str`），需要提前中断时使用 |
| `redis.sha1hex(str)` | 计算字符串的 SHA1，可用来校验传入的脚本 |
| `redis.breakpoint()` / `redis.debug()` | 配合 `SCRIPT DEBUG` 使用 |
| `redis.replicate_commands()` | 开启确定性命令以外的命令（Redis 3.2 起默认开启，Redis 5 起为唯一行为） |
| `redis.set_repl(repl_mode)` | 控制命令是否复制到副本与 AOF |
| `redis.log(loglevel, msg)` | 写入 Redis 日志，等价于 Lua 的 `print` |

返回值的转换规则：

- Redis 整数 → Lua 数字（double）
- Redis 批量字符串 → Lua 字符串
- Redis 数组 → Lua table
- Redis 状态回复 → 带 `ok` 字段的 table
- Redis 错误回复 → 带 `err` 字段的 table

Lua 数字转回 Redis 时会丢失小数部分，返回值应为字符串或整数。

## 2. 可用的 Lua 库

Redis 脚本沙箱只开放了一部分标准库。以下函数可以直接使用：

- `string`、`table`、`math`、`bit`
- `cjson`（JSON 编解码，接口为 `cjson.encode` / `cjson.decode`）
- `cmsgpack`（MessagePack 编解码，接口为 `cmsgpack.pack` / `cmsgpack.unpack`）
- `os`（时间与日期相关函数，但**没有** `os.execute`）
- 基础函数：`type`、`tonumber`、`tostring`、`pcall`、`error`、`assert`、`select`、`next`、`pairs`、`ipairs`、`rawequal`、`rawget`、`rawset`、`unpack`、`loadstring`、`setmetatable`、`getmetatable`、`collectgarbage`

以下常见全局变量**不存在**，调用它们会报 `Script attempted to access nonexistent global variable 'xxx'`：

- `print`（请改用 `redis.log`）
- `dofile`、`loadfile`
- `setfenv`、`getfenv`
- `newproxy`
- `io` 库（不能进行任何文件读写）
- `require` / 模块加载机制

没有 `io` 库意味着脚本完全无法访问文件系统，也无法发起网络请求，这是脚本沙箱的安全基础。

## 3. 脚本的原子性与并发

脚本执行期间，Redis 会把执行脚本期间发生的所有写命令缓冲起来，脚本结束后再统一传播给 AOF 和副本，而不是简单地"要么全做要么全不做"。

这一点非常重要：

- 脚本被 `SCRIPT KILL` 终止时，脚本在终止前已经产生的写入**会被保留**。
- 脚本执行到一半**报错**时，同样不会回滚此前的写入，Redis 会带着错误继续执行脚本中剩余的调用（直到遇到真正的致命错误）。

如果需要"全部成功或全部不执行"，应当改用 `MULTI`/`EXEC` 事务，并注意 `EXEC` 执行时某条命令运行出错并不会回滚其他命令——`MULTI` 只保证命令的顺序性和隔离性，不提供失败回滚。

### 3.1 超时与 SCRIPT KILL

`EVAL` 没有 `TIMEOUT` 选项。相关的阈值由 `busy-reply-threshold` 控制（默认 5000 毫秒，旧配置名 `lua-time-limit`）：

```bash
redis-cli CONFIG GET busy-reply-threshold
```

脚本运行时间超过阈值后，**其他客户端**的命令会收到：

```plaintext
-BUSY Redis is busy running a script. You can only call SCRIPT KILL or SHUTDOWN NOSAVE.
```

脚本本身不会被自动终止。可用 `SCRIPT KILL` 终止，但仅当脚本尚未进行任何写入时才会成功：

```plaintext
> SCRIPT KILL
OK
```

如果脚本已经写入过数据，`SCRIPT KILL` 会失败：

```plaintext
> SCRIPT KILL
UNKILLABLE Sorry the script already executed write commands against the dataset. You can either wait the script termination or kill the server in a hard way using the SHUTDOWN NOSAVE command.
```

此时只能等待脚本自然结束，或用 `SHUTDOWN NOSAVE` 强行关闭实例。注意被 `SCRIPT KILL` 中断的脚本，此前已产生的写入仍然保留。

## 4. 脚本缓存与 SHA1

`EVAL` 在执行时会把脚本体一并缓存，并返回其 SHA1 校验和，后续可改用 `EVALSHA` 调用，省去脚本传输与编译。

```bash
redis-cli -p 6379 SCRIPT LOAD "return redis.call('SET', KEYS[1], ARGV[1])"
# "d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37"

redis-cli -p 6379 EVALSHA d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37 1 mykey myvalue
# OK
```

如果 SHA1 不在缓存中，`EVALSHA` 返回 `NOSCRIPT`，此时客户端应回退到 `EVAL` 重新加载。

管理缓存的相关命令：

| 命令 | 作用 |
| --- | --- |
| `SCRIPT LOAD script` | 加载脚本并返回 SHA1 |
| `SCRIPT EXISTS sha1 [sha1 ...]` | 检查脚本是否已缓存，返回 0/1 数组 |
| `SCRIPT FLUSH [ASYNC \| SYNC]` | 清空脚本缓存，`SYNC` 为默认行为 |

注意 `SCRIPT FLUSH` 在主从和集群环境下只清空当前节点。

## 5. 常见脚本模式

### 5.1 滑动窗口限流

利用 `INCR` 加 `EXPIRE` 实现固定窗口限流，键通过 `KEYS[1]` 传入，阈值与窗口通过 `ARGV` 传入：

```lua
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local current = redis.call('INCR', key)
if current == 1 then
    redis.call('EXPIRE', key, window)
end

if current > limit then
    return 0
end
return 1
```

```plaintext
> EVAL "..." 1 rate:user:1 3 60   # 1
> EVAL "..." 1 rate:user:1 3 60   # 1
> EVAL "..." 1 rate:user:1 3 60   # 1
> EVAL "..." 1 rate:user:1 3 60   # 0
```

### 5.2 幂等去重

用 `SET` 的 `NX` 选项加过期时间实现"抢占式去重"，比 `SETNX` + `EXPIRE` 两条命令更安全（原子完成）：

```lua
local ok = redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', tonumber(ARGV[2]))
if ok then
    return 1
end
return 0
```

### 5.3 乐观锁（CAS）

```lua
local current = redis.call('GET', KEYS[1])
if current == false then
    redis.call('SET', KEYS[1], ARGV[1])
    return 1
end
if current == ARGV[2] then
    redis.call('SET', KEYS[1], ARGV[3])
    return 1
end
return 0
```

比对失败时返回 0，由客户端决定重试或放弃。

### 5.4 加锁

```lua
local lock = redis.call('SET', KEYS[1], ARGV[1], 'NX', 'EX', tonumber(ARGV[2]))
if not lock then
    return 0
end
-- 临界区
return 1
```

锁的释放必须校验持有者，避免误删他人持有的锁（见 5.5）。锁只适合放在单个 Redis 实例上，Redis Cluster 与主从异步复制都不保证分布式锁的强一致。

### 5.5 带校验的安全释放

```lua
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
```

### 5.6 分页遍历

在脚本中遍历集合时必须设置上限，否则会长时间阻塞主线程：

```lua
local cursor = ARGV[1]
local res = redis.call('SSCAN', KEYS[1], cursor, 'COUNT', 100)
return res
```

## 6. 调试

### 6.1 开启调试模式

```plaintext
> SCRIPT DEBUG YES
> EVAL "local t = {} for i=1,3 do t[i] = redis.call('GET', KEYS[1] .. i) end return t" 2 k1 k2
-> local t = {}
-> for i=1,3 do
-> t[i] = redis.call('GET', KEYS[1] .. i)
```

调试模式是阻塞式的，会显著拖慢服务器，仅应在测试环境使用。

### 6.2 排查 NOSCRIPT

客户端缓存的 SHA1 可能因为 `SCRIPT FLUSH`、重启或主从切换而失效。健壮的客户端应当捕获 `NOSCRIPT` 后回退到 `EVAL`，并更新本地 SHA1。

### 6.3 定位脚本报错

脚本错误信息形如：

```plaintext
ERR user_script:1: attempt to index local 'result' (a boolean value)
```

其中 `user_script:1` 指明是脚本第 1 行。把脚本保存成文件后，可以用本地 `luac -p` 做语法检查：

```bash
luac -p myscript.lua
```

## 7. 编写规范

1. 只用 `KEYS` 访问键，只用 `ARGV` 传值，不要在脚本中拼接键名。
2. 不要把用户输入直接拼进脚本文本，一律通过 `ARGV` 传入，避免脚本注入。
3. 所有遍历（`SMEMBERS`、`HGETALL`、`LRANGE 0 -1`、`KEYS`）都要加数量上限，改用 `SSCAN`/`HSCAN`/`ZSCAN`/`SCAN`。
4. 注意 `redis.call` 与 `redis.pcall` 的返回形态差异，判断 `err` 前先检查类型。
5. 不要在脚本里做长时间的纯计算，脚本执行期间整个实例不可用。
6. 高频调用的脚本务必用 `SCRIPT LOAD` + `EVALSHA`，并实现 `NOSCRIPT` 回退。