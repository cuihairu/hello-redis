# Redis Modules and Scripting Support

Redis's extensibility comes from two main lines: the **module system (Modules)** adds new data types and commands to Redis, while **scripting (Lua scripts and Functions)** lets multiple commands execute atomically on the server side. The two can work together: scripts can call module commands, and modules can register their own script functions. This page covers how they relate and common ways to combine them.

## 1. What the module system provides

A module is a compiled dynamic library (a `.so` file), loaded with `MODULE LOAD` or specified at startup with `--loadmodule`:

```bash
redis-server --loadmodule /path/to/module.so
```

Once loaded, you can view it with `MODULE LIST` and unload it with `MODULE UNLOAD`. Modules typically provide three kinds of capability:

- **New commands**: such as `JSON.SET` and `JSON.GET` provided by RedisJSON.
- **New data types**: a module can register a custom data type with `RedisModule_CreateDataType`, participating in RDB/AOF persistence and replication.
- **New scripting capabilities**: a module can register a function library for scripts or clients to call.

## 2. Calling module commands from scripts

Inside a Lua script, module commands are no different from native commands — they are called through `redis.call` just the same:

```lua
-- KEYS[1] holds the JSON document, ARGV[1] is the JSON string to write
redis.call('JSON.SET', KEYS[1], '$', ARGV[1])
return redis.call('JSON.GET', KEYS[1], '$.name')
```

Notes:

- The module command must be available on the server; otherwise the script errors out immediately (`unknown command`).
- In cluster mode, module commands likewise require that keys be declared through `KEYS`.
- A module command's flags (read-only/write, whether it deniesoom) affect how the script behaves on read-only replicas and inside transactions; confirm the attributes of the commands you use before writing the script.

## 3. Redis Functions: the modular form of scripts

Redis 7.0 introduced Functions to solve the problem that "bare scripts are hard to manage." A Function is a script **loaded, named, and versioned at the library level**:

```bash
redis-cli FUNCTION LOAD REPLACE "#!lua name=mylib
redis.register_function('get_user', function(keys, args)
    return redis.call('HGET', keys[1], args[1])
end)"
```

Invoking it:

```bash
redis-cli FCALL get_user 1 user:1000 name
```

Related commands (all introduced in 7.0): `FUNCTION LOAD`, `FUNCTION LIST`, `FUNCTION FCALL`, `FUNCTION FCALL_RO`, `FUNCTION DELETE`, `FUNCTION FLUSH`, `FUNCTION DUMP`, `FUNCTION RESTORE`.

Compared with `EVAL`, the advantages of Functions:

- Scripts have names and a library structure, making them easy to reuse and reference in your application.
- Functions are synced to replicas along with replication and persistence, so there is no need to load Lua source code manually on every server.
- `FCALL_RO` read-only execution is supported, making it convenient to run analytics functions on replicas.

## 4. Common module-and-script combinations

| Scenario | Module capability | Role of the script |
| --- | --- | --- |
| Atomic updates to a JSON document | RedisJSON's `JSON.SET`/`JSON.NUMINCRBY` | Merges "read-check-write-back" into a single atomic operation |
| Writing for full-text search | RediSearch index commands | Maintains business keys and index keys in sync within the script |
| Time-series writes | RedisTimeSeries's `TS.ADD` | Batch-writes while applying throttling/aggregation checks |

Before using module commands, refer to the official documentation of the corresponding module to verify command names, parameters, and return value formats; the output of module commands (especially JSONPath-style commands) may differ between RESP2 and RESP3.

## 5. Summary

Modules are responsible for "extending what Redis can do," while scripts are responsible for "combining those capabilities into atomic operations." Good practice is: leave data modeling to module commands, multi-step business logic to scripts or Functions, and always declare keys through `KEYS` and keep scripts short.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

## Related pages

- [appendix](appendix.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [appendix](appendix.md)
