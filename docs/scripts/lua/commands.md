# Lua 脚本基本命令

在 Redis 中使用 Lua 脚本时，有几条基本命令非常重要，它们用于执行脚本、加载脚本以及管理脚本缓存。这些命令为 Lua 脚本的灵活性和高效性提供了支持。

## EVAL 命令

`EVAL` 命令是执行 Lua 脚本的核心命令。它将 Lua 脚本直接传递给 Redis，并立即执行。

### 语法

```bash
EVAL script numkeys key [key ...] arg [arg ...]
```

- `script`：待执行的 Lua 脚本，以字符串形式提供。
- `numkeys`：传递给脚本的键名数量。
- `key [key ...]`：传递给脚本的 Redis 键名。
- `arg [arg ...]`：传递给脚本的参数。

### 示例

```bash
EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 mykey myvalue
```

该命令使用 Lua 脚本将键 `mykey` 的值设置为 `myvalue`。

## EVALSHA 命令

`EVALSHA` 命令与 `EVAL` 类似，但它通过脚本的 SHA1 哈希值来执行脚本。这对于频繁执行的脚本来说非常高效，因为脚本只需加载一次即可多次执行。

### 语法

```bash
EVALSHA sha1 numkeys key [key ...] arg [arg ...]
```

- `sha1`：预加载脚本的 SHA1 哈希值。
- `numkeys`：传递给脚本的键名数量。
- `key [key ...]`：传递给脚本的 Redis 键名。
- `arg [arg ...]`：传递给脚本的参数。

### 示例

```bash
EVALSHA "2b3a1b3d8f5b6a4c7e76f762c1f4bcf3e1d3f5f4" 1 mykey myvalue
```

此命令执行预加载的 SHA1 值为 `2b3a1b3d8f5b6a4c7e76f762c1f4bcf3e1d3f5f4` 的脚本。

## SCRIPT LOAD 命令

`SCRIPT LOAD` 命令用于将 Lua 脚本加载到 Redis 缓存中，并返回该脚本的 SHA1 哈希值。通过 `SCRIPT LOAD` 预加载脚本，可以在后续使用 `EVALSHA` 命令执行脚本。

### 语法

```bash
SCRIPT LOAD script
```

- `script`：待加载的 Lua 脚本。

### 示例

```bash
SCRIPT LOAD "return redis.call('SET', KEYS[1], ARGV[1])"
```

该命令将脚本加载到 Redis 缓存中，并返回脚本的 SHA1 哈希值。

## SCRIPT EXISTS 命令

`SCRIPT EXISTS` 命令用于检查 Redis 缓存中是否存在指定 SHA1 哈希值的脚本。

### 语法

```bash
SCRIPT EXISTS sha1 [sha1 ...]
```

- `sha1 [sha1 ...]`：要检查的脚本 SHA1 哈希值。

### 示例

```bash
SCRIPT EXISTS "2b3a1b3d8f5b6a4c7e76f762c1f4bcf3e1d3f5f4"
```

此命令检查缓存中是否存在 SHA1 值为 `2b3a1b3d8f5b6a4c7e76f762c1f4bcf3e1d3f5f4` 的脚本。

## SCRIPT FLUSH 命令

`SCRIPT FLUSH` 命令用于清除 Redis 缓存中的所有 Lua 脚本。这个命令在不再需要已加载的脚本时非常有用。

### 语法

```bash
SCRIPT FLUSH
```

### 示例

```bash
SCRIPT FLUSH
```

此命令将清除所有已加载的 Lua 脚本缓存。

通过这些基本命令，您可以灵活地在 Redis 中使用 Lua 脚本，实现复杂的数据操作和逻辑处理。接下来的小节将进一步探讨 Lua 脚本的编写技巧和调试方法。