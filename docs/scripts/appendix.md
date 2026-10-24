# Appendix

This appendix collects the material most often consulted when working with Redis scripting: a quick reference for script-related commands, the APIs and standard libraries the Lua environment provides, and the configuration options tied to script behavior — all in one place so you can find things fast while writing and debugging scripts.

## 1. Script-related Commands Quick Reference

| Command | Purpose | Introduced in |
| --- | --- | --- |
| `EVAL script numkeys key [key ...] arg [arg ...]` | Execute a Lua script directly | 2.6.0 |
| `EVALSHA sha1 numkeys key [key ...] arg [arg ...]` | Execute a cached script by its SHA1 checksum | 2.6.0 |
| `EVALSHA_RO sha1 numkeys key [key ...] arg [arg ...]` | Execute a cached script in read-only mode | 7.0.0 |
| `EVAL_RO script numkeys key [key ...] arg [arg ...]` | Execute a script in read-only mode | 7.0.0 |
| `SCRIPT LOAD script` | Load a script into the script cache and return its SHA1 checksum | 2.6.0 |
| `SCRIPT EXISTS sha1 [sha1 ...]` | Check whether scripts are already in the cache | 2.6.0 |
| `SCRIPT FLUSH [ASYNC \| SYNC]` | Flush the script cache | 2.6.0 |
| `SCRIPT KILL` | Terminate a running script that has not written any data yet | 2.6.0 |
| `SCRIPT DEBUG YES \| NO \| SYNC` | Turn the Lua debugger (LDB) support on or off | 3.2.0 |
| `FUNCTION LOAD [REPLACE] code` | Load a Redis Function library | 7.0.0 |
| `FUNCTION LIST [LIBRARYNAME pattern] [WITHCODE]` | List the loaded Function libraries | 7.0.0 |
| `FUNCTION FCALL function numkeys key [key ...] arg [arg ...]` | Call a function inside a Function | 7.0.0 |
| `FUNCTION FCALL_RO ...` | Run a Function in read-only mode | 7.0.0 |
| `FUNCTION DELETE library-name` | Delete a Function library | 7.0.0 |
| `FUNCTION FLUSH [ASYNC \| SYNC]` | Flush all Function libraries | 7.0.0 |

## 2. APIs Provided by the Lua Environment

- `redis.call(command, arg, ...)`: executes a Redis command; on error it aborts the script and returns the error.
- `redis.pcall(command, arg, ...)`: same as `redis.call`, but on error it returns a table with an `err` field instead of aborting the script.
- `redis.sha1hex(string)`: returns the SHA1 hex checksum of a string.
- `redis.error_reply(message)`: builds an error reply (a table with an `err` field).
- `redis.status_reply(message)`: builds a status reply (a table with an `ok` field).
- `redis.setresp(version)`: switches the RESP protocol version the script uses (`2` or `3`).
- `redis.breakpoint()`: sets a breakpoint in conjunction with the Lua debugger (LDB).
- `redis.debug(command, arg, ...)`: used with LDB to read and write internal server data during debugging.
- `redis.replicate_commands()`: since Redis 7.0, effects replication has been the only behavior, so this function is kept for compatibility but no longer does anything.

## 3. Standard Libraries Available in the Lua Environment

Redis embeds Lua 5.1 and, for security, strips out capabilities such as `os`, `io`, `dofile`, and `loadfile`, exposing only the following libraries:

- `string`: string processing (`string.format`, `string.sub`, and so on).
- `table`: table operations (`table.insert`, `table.remove`, `table.sort`, `table.concat`).
- `math`: math operations (`math.random`, `math.floor`, and so on).
- `cjson`: encoding and decoding between JSON and Lua tables (`cjson.encode`, `cjson.decode`).
- `cmsgpack`: MessagePack encoding and decoding.
- `struct`: packing and unpacking binary data.
- `bit`: bitwise operations.

## 4. Reply Value Conversion Quick Reference

Redis replies to Lua values:

| Redis reply | Lua value |
| --- | --- |
| Integer reply | number |
| Bulk string reply | string |
| Multi-bulk reply | array (table), where `nil` elements are converted to `false` |
| Status reply | a table with an `ok` field, such as `{ok="OK"}` |
| Error reply | aborts the script (`redis.call`) or a table with an `err` field (`redis.pcall`) |
| Nil bulk reply | `false` |

Lua values to Redis replies:

| Lua value | Redis reply |
| --- | --- |
| Number | integer reply (the fractional part is truncated, so `return 3.7` returns `3`) |
| String | bulk string reply |
| `true` | integer reply `1` |
| `false` | nil bulk reply |
| Ordered array | multi-bulk reply |
| `{ok="..."}` table | status reply |
| `{err="..."}` table | error reply |

## 5. Configuration Options Related to Scripting

- `busy-reply-threshold` (formerly `lua-time-limit`, default 5000 milliseconds): how long a script may monopolize the server. Once the threshold is exceeded, other clients receive a `BUSY` error, which can be handled with `SCRIPT KILL` (if the script has not written any data yet) or `SHUTDOWN NOSAVE`.
- `enable-debug-command`: the switch required to use `DEBUG`-class commands (used together with LDB debugging); takes `yes`, `no`, or `local`.
- `enable-protected-configs`: controls whether protected configuration options can be changed at runtime.

## 6. Script Writing Checklist

1. Are key names passed through `KEYS`? (in cluster mode a script can only access the keys declared in `KEYS`.)
2. Is the script short enough, avoiding long loops and full scans of large collections?
3. Do you check the `err` field on the return value of `redis.pcall`?
4. After the script body changes, have you recomputed the SHA1 and reloaded it?
5. In production, are you using `SCRIPT LOAD` + `EVALSHA` (or `FUNCTION LOAD` + `FCALL`) to cut down on network traffic?

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

## Related pages

- [introduction](introduction.md)
- [modules-support](modules-support.md)
- [performance](performance.md)
- [security-and-performance](security-and-performance.md)
- [security](security.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [introduction](introduction.md)
- [modules-support](modules-support.md)
- [performance](performance.md)
- [security-and-performance](security-and-performance.md)
- [security](security.md)
