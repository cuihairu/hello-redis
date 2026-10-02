# Redis 模块与脚本支持

Redis 的扩展能力来自两条主线：**模块系统（Modules）** 为 Redis 增加新的数据类型与命令，**脚本（Lua 脚本与 Functions）** 让多条命令在服务器端原子执行。两者可以互相配合：脚本可以调用模块命令，模块也可以注册自己的脚本函数。本页介绍它们的关系与常见的组合用法。

## 1. 模块系统能提供什么

模块是编译好的动态库（`.so` 文件），通过 `MODULE LOAD` 加载，或在启动时用 `--loadmodule` 指定：

```bash
redis-server --loadmodule /path/to/module.so
```

加载后可以用 `MODULE LIST` 查看，用 `MODULE UNLOAD` 卸载。模块通常提供三类能力：

- **新命令**：如 RedisJSON 提供的 `JSON.SET`、`JSON.GET`。
- **新数据类型**：模块可以用 `RedisModule_CreateDataType` 注册自定义数据类型，参与 RDB/AOF 持久化与复制。
- **新的脚本能力**：模块可以注册函数库，供脚本或客户端调用。

## 2. 脚本调用模块命令

在 Lua 脚本里，模块命令与原生命令没有区别，同样通过 `redis.call` 调用：

```lua
-- KEYS[1] 存放 JSON 文档，ARGV[1] 是要写入的 JSON 字符串
redis.call('JSON.SET', KEYS[1], '$', ARGV[1])
return redis.call('JSON.GET', KEYS[1], '$.name')
```

注意事项：

- 模块命令必须在服务器上可用，否则脚本会直接报错（`unknown command`）。
- 集群模式下，模块命令同样要求键通过 `KEYS` 声明。
- 模块命令的 flags（只读/写、是否 deniesoom）会影响脚本在只读副本、事务中的行为，编写脚本前应确认所用命令的属性。

## 3. Redis Functions：脚本的模块化形态

Redis 7.0 引入了 Functions，用来解决"裸脚本难以管理"的问题。Function 是**以库为单位加载、命名、版本化**的脚本：

```bash
redis-cli FUNCTION LOAD REPLACE "#!lua name=mylib
redis.register_function('get_user', function(keys, args)
    return redis.call('HGET', keys[1], args[1])
end)"
```

调用：

```bash
redis-cli FCALL get_user 1 user:1000 name
```

相关命令（均为 7.0 引入）：`FUNCTION LOAD`、`FUNCTION LIST`、`FUNCTION FCALL`、`FUNCTION FCALL_RO`、`FUNCTION DELETE`、`FUNCTION FLUSH`、`FUNCTION DUMP`、`FUNCTION RESTORE`。

与 `EVAL` 相比，Functions 的优势：

- 脚本有名字和库结构，便于在应用中复用与引用。
- Function 会随复制与持久化同步到副本，无需在每台服务器上手工加载 Lua 源码。
- 支持 `FCALL_RO` 只读执行，方便在副本上跑分析类函数。

## 4. 常见模块与脚本的组合场景

| 场景 | 模块能力 | 脚本的作用 |
| --- | --- | --- |
| JSON 文档的原子更新 | RedisJSON 的 `JSON.SET`/`JSON.NUMINCRBY` | 把"读取-判断-写回"合并成一次原子操作 |
| 全文检索写入 | RediSearch 的索引命令 | 在脚本中同步维护业务键与索引键 |
| 时间序列写入 | RedisTimeSeries 的 `TS.ADD` | 批量写入并做限流/聚合判断 |

使用模块命令前，请以对应模块的官方文档为准核对命令名、参数与返回值格式；模块命令的输出（尤其是 JSONPath 类命令）在 RESP2 与 RESP3 下可能不同。

## 5. 小结

模块负责"扩展 Redis 能做什么"，脚本负责"把这些能力组合成原子操作"。良好的实践是：数据建模交给模块命令，多步业务逻辑交给脚本或 Function，并始终通过 `KEYS` 声明键、保持脚本简短。
