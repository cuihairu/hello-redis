## EVALSHA 命令

`EVALSHA` 命令与 `EVAL` 命令类似，用于执行 Lua 脚本，但有一个重要区别：`EVALSHA` 通过脚本的 SHA1 校验和来执行已缓存的脚本，而不是直接传递脚本的内容。这避免了每次执行脚本时重新编译的开销，从而提高了性能。

### 语法

```bash
EVALSHA sha1 numkeys key [key ...] arg [arg ...]
```

- `sha1`：脚本的 SHA1 校验和。
- `numkeys`：脚本中需要访问的键的数量。
- `key [key ...]`：传递给脚本的 Redis 键名列表。
- `arg [arg ...]`：传递给脚本的其他参数。

### 示例

假设我们之前使用 `SCRIPT LOAD` 命令将以下 Lua 脚本加载到 Redis，并获取了对应的 SHA1 校验和：

```bash
SCRIPT LOAD "return redis.call('GET', KEYS[1]) + redis.call('GET', KEYS[2])"
```

假设返回的 SHA1 校验和是 `a42059b356c875f0717db19a51f6aaca9ae659ea`，我们可以使用 `EVALSHA` 命令执行这个脚本：

```bash
EVALSHA a42059b356c875f0717db19a51f6aaca9ae659ea 2 key1 key2
```

在这个示例中：
- `sha1` 是脚本的 SHA1 校验和 `a42059b356c875f0717db19a51f6aaca9ae659ea`。
- `numkeys` 是 `2`，表示该脚本访问了两个 Redis 键。
- `key1` 和 `key2` 是传递给脚本的两个 Redis 键名。

### 注意事项

- `EVALSHA` 仅能执行已经被 Redis 缓存的脚本。如果脚本未被缓存，Redis 将返回错误 `NOSCRIPT`，此时可以使用 `EVAL` 或先通过 `SCRIPT LOAD` 进行加载。
- 使用 `EVALSHA` 可以避免重复编译脚本，因此在频繁执行相同脚本时具有显著的性能优势。
- 如果脚本内容发生变化，需重新计算 SHA1 校验和并重新加载脚本。

### 性能对比

相比于 `EVAL`，`EVALSHA` 省去了脚本的编译步骤，尤其在脚本内容较大或需要频繁执行时，能带来显著的性能提升。为了最优性能，推荐在需要多次调用相同脚本时使用 `EVALSHA`。
