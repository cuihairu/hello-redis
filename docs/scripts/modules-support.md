# Redis 模块与脚本支持

Redis 的扩展机制分为两条路线：一条是用内置的 Lua 引擎在运行时执行逻辑（脚本），另一条是用 Redis Modules API 在编译期扩展服务器本身（模块）。两者可以结合使用：模块注册新的数据类型和命令，脚本再通过 `redis.call` 调用这些新命令。

## 1. 两条扩展路线的对比

| 维度 | Lua 脚本 | Redis 模块 |
| --- | --- | --- |
| 实现语言 | Lua | C / C++ |
| 加载方式 | `EVAL` / `SCRIPT LOAD` 运行时 | `loadmodule` 配置或 `--loadmodule` 启动参数 |
| 是否需要编译 | 否 | 是，需编译 `.so` |
| 扩展范围 | 组合已有命令，不新增命令或类型 | 可新增命令、数据类型、事件回调 |
| 安全性 | 沙箱执行，无法访问文件和网络 | 与服务器同权限，需严格审核 |
| 适合场景 | 组合逻辑、原子操作、限流、去重 | 高性能数据结构、全文检索、时序数据 |

## 2. Lua 脚本侧的能力

### 2.1 可调用范围

脚本只能调用 Redis 已有的命令，不能新增命令。脚本可用能力包括：

- 读写任意已声明的键
- 调用所有常规命令（含 `EVAL`，但受深度限制）
- 使用 `cjson` / `cmsgpack` 做序列化
- 使用 `string` / `table` / `math` / `bit` 做计算

### 2.2 脚本中调用模块命令

模块注册的命令对脚本完全透明，和普通命令一样用 `redis.call` 调用。唯一限制是：模块命令必须在其注册时声明的 key 位置上正确报告 `arity` 和 key 位置，否则集群模式下的路由会出错。

```lua
-- 假设已加载 RedisJSON
if redis.call('JSON.SET', KEYS[1], '$', ARGV[1]) then
    return redis.call('JSON.GET', KEYS[1], '$.name')
end
return redis.error_reply('JSON.SET failed')
```

### 2.3 模块命令的确定性

Redis 会把脚本视为**确定性操作**来判断能否安全复制。为了正确处理时间与随机数，模块应当：

- 用 `RedisModule_Milliseconds()`、`RedisModule_CallReplyMilliSecondsTimer()` 等模块 API 代替 Lua 的时间函数
- 用 `RedisModule_GetRandomBytes()`、`RedisModule_GetRandomHexChars()` 代替 `math.random`

模块 API 提供的随机数是"可复制"的：主节点生成后会随写命令一起复制到副本，从而保证主从一致性。这一点 Lua 内置的 `math.random` 做不到。

## 3. 模块侧的能力

### 3.1 加载方式

```bash
# 方式一：配置文件
loadmodule /path/to/redisjson.so

# 方式二：启动参数
redis-server --loadmodule /path/to/redisjson.so
```

运行时加载使用 `MODULE LOAD`，但**不支持加载定义新数据类型的模块**（Redis 文档明确限制），因此生产环境应在启动时加载。

```plaintext
> MODULE LIST
1) 1) "name"
   2) "ReJSON"
   3) "ver"
   4) (integer) 20611
   5) "path"
   6) "/opt/redis-stack/lib/redisjson.so"
   7) "args"
   8) (empty array)
```

相关命令：

| 命令 | 作用 |
| --- | --- |
| `MODULE LIST` | 列出已加载模块 |
| `MODULE LOAD path [arg ...]` | 加载模块（不支持带新数据类型的模块） |
| `MODULE UNLOAD name [FORCE]` | 卸载模块（会一并删除该模块类型的数据） |
| `MODULE LOADEX path [CONFIG name value ...]` | 加载模块并直接下发模块配置 |

### 3.2 典型能力

模块 API（`RedisModule_*`）覆盖：

- **命令注册**：`RedisModule_CreateCommand`
- **数据类型**：`RedisModule_CreateDataType` + `RedisModule_OpenKey`
- **事件订阅**：`RedisModule_SubscribeToServerEvent`（连接、认证、持久化、客户端命令、空洞通知等）
- **阻塞客户端**：`RedisModule_BlockClient` / `RedisModule_UnblockClient` / `RedisModule_BlockedClientDisconnected`
- **定时器**：`RedisModule_CreateTimer`
- **配置项**：`RedisModule_RegisterNumericConfig` / `RedisModule_RegisterStringConfig` + `RedisModule_LoadConfigs`
- **线程回调**：`RedisModule_ThreadSafeContextLock` / `RedisModule_ThreadSafeContextUnlock`（阻塞模块内部的多线程回调必须显式加锁）

### 3.3 官方模块

| 模块 | 提供能力 |
| --- | --- |
| RedisJSON | 原生 JSON 数据类型与 `JSON.*` 命令，支持 JSONPath |
| RediSearch | 全文检索、向量检索，`FT.*` 命令 |
| RedisTimeSeries | 时间序列，`TS.*` 命令 |
| RedisBloom | 布隆过滤器、计数布隆过滤器、TopN、t-Sketch |
| RedisGraph | 图数据库，Cypher 查询（官方已停止维护，社区版不再推荐用于新项目） |

## 4. 两者结合的典型模式

### 4.1 JSON 文档的原子更新

模块提供细粒度的 JSON 命令，脚本提供原子性，二者结合可避免读-改-写竞态：

```lua
-- 原子地把 counter 加一，键不存在时初始化为 0
local cur = redis.call('JSON.GET', KEYS[1], '$.count')
if cur == false then
    redis.call('JSON.SET', KEYS[1], '$', cjson.encode({count = 1}))
    return 1
end
local doc = cjson.decode(cur)
doc.count = doc.count + 1
redis.call('JSON.SET', KEYS[1], '$', cjson.encode(doc))
return doc.count
```

### 4.2 检索结果的权限过滤

```lua
-- 只有当用户在白名单中才返回检索结果
local allowed = redis.call('SISMEMBER', KEYS[1], ARGV[1])
if allowed == 0 then
    return redis.error_reply('not permitted')
end
return redis.call('FT.SEARCH', KEYS[2], ARGV[2])
```

### 4.3 用脚本保护模块命令

`FT.AGGREGATE`、`TS.RANGE` 这类聚合查询可能耗时长，可放进脚本并对返回值做裁剪，但**不能**真正缩短执行时间——脚本执行期间实例仍然不可用。真正的时长控制要靠模块自身的超时参数，或改用增量式遍历。

## 5. 开发与部署注意事项

1. **不要用脚本代替限流治理**：脚本只能保证单个实例内的原子性，集群与主从异步复制都无法提供跨节点的强一致。
2. **模块必须写 key 规格**：`RedisModule_SetCommandInfo` 或在命令回调中正确处理 key 参数，否则集群路由和 `ACL` 都会出错。
3. **阻塞回调要加锁**：模块内部起线程执行阻塞操作时，必须用线程安全上下文锁，否则会破坏主线程状态。
4. **验证模块与 Redis 版本兼容**：模块声明的 API 版本必须被目标 Redis 支持，否则加载会失败。
5. **模块与脚本的可移植性**：脚本依赖具体模块，迁移时需同时确认模块已加载。

## 6. 小结

脚本解决"原子地组合已有命令"，模块解决"新增命令与数据类型"。二者不是替代关系：模块提供能力边界，脚本提供原子性与灵活性。实际工程中，应优先用脚本解决组合逻辑问题，只有当现有命令在性能上确实无法满足时，才值得引入模块。