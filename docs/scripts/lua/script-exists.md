## SCRIPT EXISTS 命令

`SCRIPT EXISTS` 命令用于检查指定的 Lua 脚本是否已经存在于 Redis 的脚本缓存中。它返回一个布尔值，指示脚本是否已被加载。这个命令对于验证脚本的存在性和优化脚本的管理很有帮助。

### 语法

```bash
SCRIPT EXISTS script_sha1 [script_sha1 ...]
```

- `script_sha1`：要检查的 Lua 脚本的 SHA1 校验和，可以一次检查多个 SHA1 校验和。

### 返回值

- 一个数组，包含每个 SHA1 校验和是否存在的布尔值。`1` 表示存在，`0` 表示不存在。

### 示例

先用 `SCRIPT LOAD` 加载一个脚本，拿到它的 SHA1 校验和（例如脚本 `return redis.call('SET', KEYS[1], ARGV[1])` 对应的校验和是 `d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37`），再用一个随机拼出来的校验和一起检查：

```bash
SCRIPT EXISTS d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37 a3b8d30a5f32e6d4b0c15c9bafab06ec4c9207e1
```

返回值：

```bash
1) (integer) 1
2) (integer) 0
```

这表示第一个 SHA1 校验和的脚本存在，而第二个不在缓存中。

### 示例场景

使用 `SCRIPT EXISTS` 可以帮助你在执行 `EVALSHA` 命令之前确认脚本是否已经存在于缓存中，从而避免因脚本未被加载而导致的 `NOSCRIPT` 错误。

### 注意事项

- `SCRIPT EXISTS` 命令仅检查脚本是否已存在于 Redis 的脚本缓存中，不会改变缓存的状态。
- 如果你有多个脚本需要检查，可以将它们的 SHA1 校验和一起传递给 `SCRIPT EXISTS`，命令会返回每个脚本的存在性。

### 优势

使用 `SCRIPT EXISTS` 可以有效地管理和验证 Redis 脚本的存在性，有助于优化脚本的执行流程和减少潜在的错误。