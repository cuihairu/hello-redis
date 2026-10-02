# Lua 与 Redis 的集成

Redis 内置了 Lua 解释器，脚本通过 `EVAL`、`EVALSHA` 或 `FCALL` 命令在服务器端执行。要写出正确、高效的脚本，关键是理解"脚本如何拿到输入"、"脚本如何调用 Redis 命令"以及"两者的值如何互相转换"这三个问题。

## 1. 输入参数：KEYS 与 ARGV

调用脚本时，命令行上的参数被分为两部分：

- `KEYS` 数组：脚本将要访问的 Redis 键名，对应命令中的 `numkeys` 参数。
- `ARGV` 数组：其余的普通参数（值、限制、标记等）。

```bash
EVAL "return KEYS[1] .. '=' .. ARGV[1]" 1 user:1000 Alice
```

返回 `user:1000=Alice`。注意 `KEYS` 必须显式声明，原因有两个：

1. **集群兼容**：Redis 集群要求脚本只能访问 `KEYS` 中声明的键，否则脚本会在集群上执行失败。
2. **路由依据**：集群模式下需要根据 `KEYS` 判断脚本应当发往哪个分片节点。

错误示范（把键名放在 `ARGV` 中传入）：

```bash
EVAL "return redis.call('GET', ARGV[1])" 0 user:1000
```

单实例下这条命令能返回结果，但一旦迁移到集群就会因为"脚本访问了未声明的键"而报错。

## 2. 调用 Redis 命令：redis.call 与 redis.pcall

脚本内通过 `redis.call` 或 `redis.pcall` 执行任意 Redis 命令：

```lua
-- 设置键并返回结果
redis.call('SET', KEYS[1], ARGV[1])

-- 读取哈希字段
local value = redis.call('HGET', KEYS[1], 'name')
return value
```

两者区别在于**错误处理方式**：

- `redis.call`：命令返回错误时，直接中断脚本并向客户端返回该错误。
- `redis.pcall`：捕获错误，返回带 `err` 字段的 Lua 表，脚本可以继续执行。

```lua
local result = redis.pcall('GET', KEYS[1])
if type(result) == 'table' and result.err then
    -- 命令执行出错，这里可以做降级处理
    return 'error: ' .. result.err
end
return result
```

## 3. 值的相互转换

Redis 回复会被转换为 Lua 值：

| Redis 回复 | Lua 值 |
| --- | --- |
| 整数回复 | 数字（number） |
| 批量字符串 | 字符串（string） |
| 多条批量回复 | 数组（table），数组中的 nil 元素变为 `false` |
| 状态回复 | 带 `ok` 字段的表，如 `{ok="OK"}` |
| 错误回复 | `redis.call` 中断脚本 / `redis.pcall` 返回带 `err` 字段的表 |
| 空回复（nil） | `false` |

脚本的返回值同样会被转换为 Redis 回复：

| Lua 返回值 | Redis 回复 |
| --- | --- |
| 数字 | 整数回复（小数被截断，`return 3.7` 得到 `3`） |
| 字符串 | 批量字符串回复 |
| `true` | 整数回复 `1` |
| `false` | nil 回复 |
| 顺序数组 `{1,2,3}` | 多条批量回复 |
| `{ok="OK"}` | 状态回复 `OK` |
| `{err="..."}` 或调用 `error()` | 错误回复 |

因此要注意两点：脚本内 `redis.call('SET', ...)` 拿到的是 `{ok="OK"}` 这样的状态表，直接把它 `return` 出去，客户端看到的是状态回复 `OK`；需要返回业务结果时应显式 `return` 具体的值。此外，Redis 回复没有浮点类型，需要精确小数时应自行格式化成字符串返回。

## 4. 脚本的原子性与副作用

- 脚本执行期间，服务器不会处理其他客户端发来的命令，脚本内多条命令对外表现为一个原子操作。
- Redis 7.0 之前，脚本可能先执行 `MULTI/EXEC` 事务来复制"命令序列"；如今脚本一律按**效果复制（effects replication）**传播，即只复制脚本执行后产生的写命令，`redis.replicate_commands()` 保留但不再起作用。
- 脚本执行完的写操作会立即生效且**不会回滚**：脚本中途出错时，已执行的写命令仍然保留。因此要在脚本中自行校验参数、先判断再写入。

```lua
-- 先校验参数，再写入，避免半途出错留下脏数据
if ARGV[1] == nil or ARGV[1] == '' then
    return redis.error_reply('value is required')
end
redis.call('SET', KEYS[1], ARGV[1])
return 'OK'
```

## 5. 脚本与复制

- **单实例/主从**：脚本执行产生的写操作会被传播到副本。
- **集群**：所有需要访问的键必须放在 `KEYS` 中并落在同一个槽位（可用哈希标签 `{user:1000}` 强制同槽）。
- **写命令的确定性**：如需使用随机数（`math.random`）产生写入结果，应在脚本开始时调用 `math.randomseed` 并把随机结果记录下来，或者直接在客户端生成随机值再通过 `ARGV` 传入。

## 6. 辅助函数

- `redis.sha1hex('任意字符串')`：返回 SHA1 十六进制值，可用于调试脚本缓存。
- `redis.error_reply('message')` / `redis.status_reply('message')`：构造标准回复。
- `redis.setresp(3)`：脚本内切换到 RESP3 协议解析回复，可拿到 map、double、bool 等类型。
- `cjson.encode` / `cjson.decode`：在脚本中直接处理 JSON。

```bash
EVAL "return redis.sha1hex('foo')" 0
```

返回 `0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33`。

## 7. 小结

把 Redis 当成脚本的"运行时"来理解：`KEYS`/`ARGV` 是函数入参，`redis.call` 是函数体里的数据库访问层，返回值转换是序列化边界。遵循"键走 `KEYS`、值走 `ARGV`、先校验后写入、保持脚本简短"这四条原则，就能写出在单实例与集群下都稳定可用的 Lua 脚本。
