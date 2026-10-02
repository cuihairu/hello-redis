## EVAL 命令

`EVAL` 命令是 Redis 中用于执行 Lua 脚本的核心命令。它可以将 Lua 脚本直接传递给 Redis，并立即执行。使用 `EVAL` 命令可以方便地在 Redis 服务器端执行复杂的逻辑操作。

### 语法

```bash
EVAL script numkeys key [key ...] arg [arg ...]
```

- `script`：要执行的 Lua 脚本内容，作为字符串传递。
- `numkeys`：脚本中需要访问的键的数量。
- `key [key ...]`：传递给脚本的 Redis 键名列表。
- `arg [arg ...]`：传递给脚本的其他参数。

### 示例

以下示例展示了如何使用 `EVAL` 命令来执行一个简单的 Lua 脚本，该脚本将两个 Redis 键的值相加，并返回结果：

```bash
SET key1 10
SET key2 20
EVAL "return redis.call('GET', KEYS[1]) + redis.call('GET', KEYS[2])" 2 key1 key2
```

第三个命令的返回值为 `30`。在这个示例中：
- `script` 是 `"return redis.call('GET', KEYS[1]) + redis.call('GET', KEYS[2])"`，它通过 `redis.call` 函数获取 `key1` 和 `key2` 的值并相加（Lua 会把返回的数字字符串隐式转换为数字）。
- `numkeys` 是 `2`，表示该脚本访问了两个 Redis 键。
- `key1` 和 `key2` 是传递给脚本的两个 Redis 键名。

注意：`key1` 和 `key2` 必须事先存在且存储的是数字内容，否则脚本会在做算术运算时抛出错误（例如键不存在时 `GET` 返回 `false`，对 `false` 做加法会报错）。

### 注意事项

- 脚本的执行是原子操作，执行过程中不会被其他命令中断。
- `EVAL` 命令在每次调用时都会重新编译和执行脚本，因此对于需要频繁执行的脚本，建议使用 `EVALSHA` 命令来避免重复编译。
- 脚本执行完后，Redis 会自动把它缓存起来（生成的 SHA1 可用 `SCRIPT LOAD` 或 `EVAL` 的返回值查到），供后续 `EVALSHA` 使用。