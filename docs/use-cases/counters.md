# Counters

Commands such as `INCR` and `DECR` are atomic operations executed inside Redis's single thread, which makes them a natural fit for counters: no locking is needed, and concurrent lost updates cannot happen.

See [Ranking and counters](ranking-and-counting.md) for the scenario index and [Leaderboards](leaderboards.md) for the leaderboard commands and sorting. This page concentrates on periodic counters, sharding, and persistence.

## Basic usage

```bash
SET page:home:pv 0
INCR page:home:pv            # 1
INCR page:home:pv            # 2
GET page:home:pv             # "2"

DECR stock:1001              # stock deduction; once it goes negative, the item is sold out
```

## Periodic counting with a TTL

Setting a TTL on a counter key gives you a "per-minute/per-day" counter that resets itself. For example, limiting the same IP to at most 100 requests per minute:

```python
import redis

r = redis.Redis(decode_responses=True)


def allow(ip):
    key = f'rate:{ip}'
    current = r.incr(key)
    if current == 1:
        r.expire(key, 60)  # the clock starts only when the first request arrives
    return current <= 100
```

Note that you must `INCR` first and set the expiration when the result is 1. The two steps are not atomic with respect to each other, but if the process dies in between, the worst outcome is that the key has no TTL — you can fall back on `EXPIRE`, or in code re-set the expiration for keys whose `TTL` is -1.

## Daily statistics

Putting the date in the key name keeps historical statistics around without overwriting each other:

```bash
INCR stats:pv:2024-06-01
INCR stats:uv_est:2024-06-01   # combined with PFADD for a UV estimate
PFADD stats:uv:2024-06-01 user:42 user:43
PFCOUNT stats:uv:2024-06-01
```

## Exact stock deduction

When implementing flash-sale stock with a counter, you must prevent it from going negative. A Lua script turns "check + deduct" into one atomic operation:

```bash
EVAL "local s = redis.call('GET', KEYS[1])
if tonumber(s or '0') <= 0 then return 0 end
return redis.call('DECR', KEYS[1])" 1 stock:1001
```

This stops deducting once the stock is 0, and returning 0 means the purchase attempt failed.

## Usage tips

- Counter keys likewise need a TTL or periodic archiving (write to a database, then delete) so keys do not grow without bound.
- A high-frequency increment key is a classic hot key. If a single key is under too much pressure, split it into several shard keys (e.g. `page:home:pv:0` through `:9`, written to at random) and aggregate afterwards.
- Use `INCRBYFLOAT` when you need floating-point counting.

## References

- [Redis dev docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- INCR (no authoritative source found (to verify))

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](README.md)
- [ranking-and-counting](ranking-and-counting.md)
- &#8203;redis-use-cases<!-- EN-LINK: redis-use-cases.md -->
