# 附录

本附录汇总了使用 Redis 脚本功能时最常查阅的内容，包括脚本相关命令速查、Lua 环境提供的 API 与标准库，以及与脚本行为相关的配置项，便于在编写和调试脚本时快速定位。

## 1. 脚本相关命令速查

| 命令 | 作用 | 引入版本 |
| --- | --- | --- |
| `EVAL script numkeys key [key ...] arg [arg ...]` | 直接执行 Lua 脚本 | 2.6.0 |
| `EVALSHA sha1 numkeys key [key ...] arg [arg ...]` | 按 SHA1 校验和执行已缓存的脚本 | 2.6.0 |
| `EVALSHA_RO sha1 numkeys key [key ...] arg [arg ...]` | 只读方式执行已缓存脚本 | 7.0.0 |
| `EVAL_RO script numkeys key [key ...] arg [arg ...]` | 只读方式执行脚本 | 7.0.0 |
| `SCRIPT LOAD script` | 加载脚本到脚本缓存，返回 SHA1 校验和 | 2.6.0 |
| `SCRIPT EXISTS sha1 [sha1 ...]` | 检查脚本是否已在缓存中 | 2.6.0 |
| `SCRIPT FLUSH [ASYNC \| SYNC]` | 清空脚本缓存 | 2.6.0 |
| `SCRIPT KILL` | 终止正在执行的、尚未写入数据的脚本 | 2.6.0 |
| `SCRIPT DEBUG YES \| NO \| SYNC` | 开启/关闭 Lua 调试器（LDB）支持 | 3.2.0 |
| `FUNCTION LOAD [REPLACE] code` | 加载 Redis Function 库 | 7.0.0 |
| `FUNCTION LIST [LIBRARYNAME pattern] [WITHCODE]` | 列出已加载的 Function 库 | 7.0.0 |
| `FUNCTION FCALL function numkeys key [key ...] arg [arg ...]` | 执行 Function 中的函数 | 7.0.0 |
| `FUNCTION FCALL_RO ...` | 以只读模式执行 Function | 7.0.0 |
| `FUNCTION DELETE library-name` | 删除 Function 库 | 7.0.0 |
| `FUNCTION FLUSH [ASYNC \| SYNC]` | 清空所有 Function 库 | 7.0.0 |

## 2. Lua 环境提供的 API

- `redis.call(command, arg, ...)`：执行 Redis 命令，出错时中断脚本并返回错误。
- `redis.pcall(command, arg, ...)`：与 `redis.call` 相同，但出错时返回带 `err` 字段的表而不中断脚本。
- `redis.sha1hex(string)`：返回字符串的 SHA1 十六进制校验和。
- `redis.error_reply(message)`：构造错误回复（返回带 `err` 字段的表）。
- `redis.status_reply(message)`：构造状态回复（返回带 `ok` 字段的表）。
- `redis.setresp(version)`：切换脚本使用的 RESP 协议版本（`2` 或 `3`）。
- `redis.breakpoint()`：配合 Lua 调试器（LDB）设置断点。
- `redis.debug(command, arg, ...)`：配合 LDB 使用，用于在调试时读写服务器内部数据。
- `redis.replicate_commands()`：自 Redis 7.0 起效果复制（effects replication）已是唯一行为，该函数保留但不再有实际作用。

## 3. Lua 环境可用的标准库

Redis 内嵌 Lua 5.1 环境，出于安全考虑移除了 `os`、`io`、`dofile`、`loadfile` 等能力，仅开放以下库：

- `string`：字符串处理（`string.format`、`string.sub` 等）。
- `table`：表操作（`table.insert`、`table.remove`、`table.sort`、`table.concat`）。
- `math`：数学运算（`math.random`、`math.floor` 等）。
- `cjson`：JSON 与 Lua 表之间的编解码（`cjson.encode`、`cjson.decode`）。
- `cmsgpack`：MessagePack 编解码。
- `struct`：二进制数据的打包与解包。
- `bit`：按位运算。

## 4. 回复值转换速查

Redis 回复到 Lua 值：

| Redis 回复 | Lua 值 |
| --- | --- |
| 整数回复 | 数字（number） |
| 批量字符串回复 | 字符串（string） |
| 多条批量回复 | 数组（table），其中的 `nil` 元素会被转换为 `false` |
| 状态回复 | 带 `ok` 字段的表，如 `{ok="OK"}` |
| 错误回复 | 中断脚本（`redis.call`）或带 `err` 字段的表（`redis.pcall`） |
| 空批量回复（nil） | `false` |

Lua 值到 Redis 回复：

| Lua 值 | Redis 回复 |
| --- | --- |
| 数字 | 整数回复（小数部分被截断，如 `return 3.7` 返回 `3`） |
| 字符串 | 批量字符串回复 |
| `true` | 整数回复 `1` |
| `false` | 空批量回复（nil） |
| 顺序数组 | 多条批量回复 |
| `{ok="..."}` 表 | 状态回复 |
| `{err="..."}` 表 | 错误回复 |

## 5. 与脚本相关的配置项

- `busy-reply-threshold`（旧名 `lua-time-limit`，默认 5000 毫秒）：脚本连续占用服务器的时限。超过阈值后其他客户端会收到 `BUSY` 错误，可用 `SCRIPT KILL`（脚本尚未写入数据时）或 `SHUTDOWN NOSAVE` 处理。
- `enable-debug-command`：使用 `DEBUG` 类命令（配合 LDB 调试）时需要的开关，取值 `yes`、`no` 或 `local`。
- `enable-protected-configs`：控制能否在运行期修改受保护的配置项。

## 6. 编写脚本的检查清单

1. 是否通过 `KEYS` 传递键名（集群模式下脚本只能访问 `KEYS` 中声明的键）。
2. 脚本是否足够简短，避免长循环与大集合的全量遍历。
3. 是否对 `redis.pcall` 的返回值做了 `err` 字段判断。
4. 脚本内容变更后，是否重新计算 SHA1 并重新加载。
5. 生产环境是否使用 `SCRIPT LOAD` + `EVALSHA`（或 `FUNCTION LOAD` + `FCALL`）来减少网络传输。
