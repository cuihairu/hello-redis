# SET

`SET` 是 Redis 中最核心、使用频率最高的写入命令，用于将 `key` 的值设置为字符串 `value`。无论 `key` 之前存储的是字符串、列表还是哈希，`SET` 都会直接将其覆盖为字符串类型，因此它既是写入命令，也是"重置"命令。

## 语法

```plaintext
SET key value [EX seconds | PX milliseconds | EXAT unix-time-seconds | PXAT unix-time-milliseconds | KEEPTTL] [NX | XX] [GET]
```

## 参数说明

- `key`: 要设置的键名。
- `value`: 要写入的字符串值，二进制安全，最大 512 MB。
- `EX seconds`: 设置过期时间，单位为秒。
- `PX milliseconds`: 设置过期时间，单位为毫秒。
- `EXAT unix-time-seconds`: 设置以秒为单位的绝对 Unix 时间戳作为过期时间。
- `PXAT unix-time-milliseconds`: 设置以毫秒为单位的绝对 Unix 时间戳作为过期时间。
- `KEEPTTL`: 覆盖值时保留 `key` 原有的过期时间。
- `NX`: 只有当 `key` 不存在时才执行设置。
- `XX`: 只有当 `key` 已经存在时才执行设置。
- `GET`: 设置成功后返回旧值，`key` 原本不存在时返回 `nil`（Redis 6.2 起支持）。

## 返回值

- 设置成功返回 `OK`。
- 使用 `NX` 但 `key` 已存在，或使用 `XX` 但 `key` 不存在时，返回 `nil`，设置不生效。
- 使用 `GET` 时返回旧值（不存在则为 `nil`）。

## 示例

```plaintext
# 最基本的设置
SET ba:str:name Alice

# 设置值并指定 3600 秒后过期
SET ba:str:session abc123 EX 3600

# 毫秒级过期时间
SET ba:str:captcha 6688 PX 60000

# 仅当键不存在时设置，分布式锁的常见写法
SET ba:str:lock holder-1001 NX

# 仅当键已存在时更新，键不存在则什么都不做
SET ba:str:name Bob XX

# 设置新值的同时取回旧值
SET ba:str:name Carol GET

# 覆盖值的同时保留原有的过期时间
SET ba:str:session new-token KEEPTTL

# 查看剩余过期时间，验证 KEEPTTL 生效
TTL ba:str:session
```

## 注意事项

- 默认情况下，`SET` 会清除 `key` 原有的过期时间；若想保留，必须显式使用 `KEEPTTL`。
- `SET` 会把任意类型的键覆盖为字符串类型，对已有列表、哈希等数据使用 `SET` 前要确认。
- `SET key value NX EX seconds` 是原子操作，常用于实现分布式锁；相比旧的 `SETNX` 加 `EXPIRE` 两步写法，不会出现加锁后未设置过期时间的中间状态。
- `NX` 与 `XX` 互斥，只能二选一。
- 旧命令 `SETNX`、`SETEX`、`PSETEX`、`GETSET` 的功能都已被 `SET` 的选项覆盖（自 6.2 起 `GETSET` 官方建议改用 `SET ... GET`）。

## 小结

`SET` 通过丰富的选项覆盖了字符串写入的绝大多数场景：普通赋值、带过期时间的缓存写入、`NX/XX` 的条件写入以及取回旧值。优先使用一条 `SET` 命令及其选项，而不是拆分成多条旧命令。
