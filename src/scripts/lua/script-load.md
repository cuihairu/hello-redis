## SCRIPT LOAD 命令

`SCRIPT LOAD` 命令用于将 Lua 脚本的内容加载到 Redis 中，并返回该脚本的 SHA1 校验和。通过使用 `SCRIPT LOAD`，可以提前将脚本加载到 Redis 的脚本缓存中，从而在后续使用 `EVALSHA` 命令时提高执行效率。

### 语法

```bash
SCRIPT LOAD script
```

- `script`：要加载的 Lua 脚本内容。

### 示例

假设有一个简单的 Lua 脚本如下：

```lua
return redis.call('SET', KEYS[1], ARGV[1])
```

我们可以使用 `SCRIPT LOAD` 命令将其加载到 Redis：

```bash
SCRIPT LOAD "return redis.call('SET', KEYS[1], ARGV[1])"
```

执行后，Redis 将返回该脚本的 SHA1 校验和，例如：

```bash
"5a2c30b16738e836c32e3912f8e6f3b195cd13e9"
```

此时，你可以使用 `EVALSHA` 命令来执行这个脚本，而无需再次传递脚本内容。

### 示例场景

使用 `SCRIPT LOAD` 后，可以在需要执行同一脚本多次时，只使用 SHA1 校验和来调用：

```bash
EVALSHA 5a2c30b16738e836c32e3912f8e6f3b195cd13e9 1 mykey myvalue
```

这比每次都使用 `EVAL` 传递脚本内容更高效，特别是在脚本内容较大或频繁调用的情况下。

### 注意事项

- `SCRIPT LOAD` 返回的 SHA1 校验和可以用于 `EVALSHA` 命令，但在脚本内容改变后，必须重新使用 `SCRIPT LOAD` 加载并获得新的 SHA1 校验和。
- 如果你尝试使用 `EVALSHA` 执行一个未被加载或缓存的脚本，Redis 会返回 `NOSCRIPT` 错误，提示你该脚本尚未加载。

### 优势

通过预加载脚本并使用 SHA1 校验和来执行，可以减少网络带宽的使用和 Redis 的处理开销，这在高频率执行的场景下能带来显著的性能提升。