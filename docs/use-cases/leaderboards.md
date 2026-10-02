# 排行榜

有序集合（Sorted Set）的每个成员都带有一个分数，Redis 会按分数自动排序，并能在 O(log N) 时间内完成排名查询，因此它是实现排行榜（如游戏积分榜、销量榜）的首选结构。

## 基本命令

```bash
# 上榜：添加或更新分数
ZADD leaderboard 1500 alice
ZADD leaderboard 1800 bob
ZADD leaderboard 1200 carol

# 分数变化：加分（原子自增）
ZINCRBY leaderboard 100 alice

# 查询前 10 名（分数从高到低，WITHSCORES 同时返回分数）
ZREVRANGE leaderboard 0 9 WITHSCORES

# 查询自己的名次（0 表示第一名）
ZREVRANK leaderboard alice

# 查询自己的分数
ZSCORE leaderboard alice

# 查询某个分数区间的人数
ZCOUNT leaderboard 1500 2000
```

## Python 示例

```python
import redis

r = redis.Redis(decode_responses=True)


def add_score(user, delta):
    r.zincrby('leaderboard', delta, user)


def top_n(n=10):
    return r.zrevrange('leaderboard', 0, n - 1, withscores=True)


def rank_of(user):
    rank = r.zrevrank('leaderboard', user)  # 从 0 开始
    return None if rank is None else rank + 1


if __name__ == '__main__':
    add_score('alice', 1500)
    add_score('bob', 1800)
    add_score('alice', 100)          # alice 变成 1600
    print(top_n(3))
    # [('bob', 1800.0), ('alice', 1600.0)]
    print(rank_of('alice'))          # 2
```

## 常见扩展

- **榜单置零（月榜/周榜）**：在键名中加入周期，如 `leaderboard:2024-06`，跨周期自动切换，旧榜单设置 TTL 后自动清理。
- **相同分数按时间排序**：可以把分数与时间戳编码成一个数值（分数乘以大基数加上时间差的补数），保证先达到者排名靠前。
- **百万级榜单**：`ZREVRANGE` 分页深度过大时会遍历较多元素，深分页可改用业务侧缓存；只需展示前 N 名时，可另存一份 Top N 列表。

## 与普通列表方案的对比

用 `LIST` 或在数据库里 `ORDER BY` 也能实现排序，但每次分数变化都需要重新排序或回库查询；有序集合则把排序维护在写入时完成，读取排名是 O(log N)，读写比例越高优势越明显。
