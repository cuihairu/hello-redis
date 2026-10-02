# 计数器

`INCR`、`DECR` 等命令是单线程内执行的原子操作，天然适合做计数器：不需要加锁，也不会出现并发丢失更新的问题。

## 基本用法

```bash
SET page:home:pv 0
INCR page:home:pv            # 1
INCR page:home:pv            # 2
GET page:home:pv             # "2"

DECR stock:1001              # 库存扣减，减到负数说明售罄
```

## 带过期时间的周期计数

给计数键设置 TTL，就能实现"每分钟/每天"的自动重置计数。例如限制同一 IP 每分钟最多访问 100 次：

```python
import redis

r = redis.Redis(decode_responses=True)


def allow(ip):
    key = f'rate:{ip}'
    current = r.incr(key)
    if current == 1:
        r.expire(key, 60)  # 第一个请求到达时才开始计时
    return current <= 100
```

注意要先 `INCR` 再判断是否为 1 来设置过期时间，两步之间虽然不是原子的，但即使进程在中间失败，最坏结果是该键没有 TTL，可以用 `EXPIRE` 兜底或在代码里对 `TTL` 为 -1 的键补设。

## 按天统计

以日期作为键名的一部分，可以保留历史统计而不互相覆盖：

```bash
INCR stats:pv:2024-06-01
INCR stats:uv_est:2024-06-01   # 配合 PFADD 做 UV 估算
PFADD stats:uv:2024-06-01 user:42 user:43
PFCOUNT stats:uv:2024-06-01
```

## 精确库存扣减

用计数器实现秒杀库存时，要防止减成负数。可以配合 Lua 脚本把"判断+扣减"变成原子操作：

```bash
EVAL "local s = redis.call('GET', KEYS[1])
if tonumber(s or '0') <= 0 then return 0 end
return redis.call('DECR', KEYS[1])" 1 stock:1001
```

这样在库存为 0 时不会继续扣减，返回 0 表示抢购失败。

## 使用建议

- 计数键同样要考虑 TTL 或定期归档（写入数据库后删除），避免键无限增长。
- 高频自增键是典型热点键，若单键压力过大，可以拆成多个分片键（如 `page:home:pv:0` 到 `:9` 随机写入）再汇总。
- 需要浮点计数时使用 `INCRBYFLOAT`。
