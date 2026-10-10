# 实时分析

实时分析要求数据"边发生边统计"，延迟在秒级以内。Redis 的命令都是内存中直接完成的，可以作为实时指标的汇总层：业务事件发生时先写 Redis，再由定时任务把聚合结果落到数据库。

## 常用数据结构

| 指标 | 结构 | 命令 |
| --- | --- | --- |
| 点击量、订单数 | String | `INCR` / `INCRBY` |
| 独立访客（UV） | HyperLogLog | `PFADD` / `PFCOUNT` |
| 热搜榜、实时排名 | Sorted Set | `ZINCRBY` / `ZRANGE ... REV` |
| 分时段统计 | Hash | `HINCRBY` |
| 状态明细、去重 | Set | `SADD` / `SCARD` |

## 命令演示

```bash
# 事件计数：每分钟页面 PV
INCR stats:pv:2024-06-03:14

# UV 估算（标准误差约 0.81%，内存占用固定 12 KB 左右）
PFADD stats:uv:2024-06-03 user:1 user:2 user:3
PFCOUNT stats:uv:2024-06-03

# 实时热搜：每次搜索给关键词加一分
ZINCRBY hot:search 1 "redis 教程"

# 小时维度分布（哈希字段为 0~23）
HINCRBY stats:hourly:2024-06-03 14 1
```

## Python 示例：事件聚合与导出

```python
import time
import redis

r = redis.Redis(decode_responses=True)


def on_event(kind, user_id=None):
    now = time.localtime()
    date, hour = time.strftime('%Y-%m-%d', now), now.tm_hour
    pipe = r.pipeline()
    pipe.incr(f'stats:{kind}:daily:{date}')
    pipe.incr(f'stats:{kind}:hourly:{date}:{hour}')
    if user_id:
        pipe.pfadd(f'stats:uv:{kind}:{date}', user_id)
    pipe.zincrby('stats:top:keywords', 1, kind)
    pipe.execute()


def snapshot(date):
    kinds = ['pageview', 'order', 'search']
    return {
        kind: {
            'daily': int(r.get(f'stats:{kind}:daily:{date}') or 0),
            'uv': r.pfcount(f'stats:uv:{kind}:{date}'),
        }
        for kind in kinds
    }


def export_to_db(date):
    data = snapshot(date)
    # 把 data 写入数据库的统计表，然后按需保留或删除 Redis 键
    return data


if __name__ == '__main__':
    for _ in range(5):
        on_event('pageview', user_id='u1')
    on_event('pageview', user_id='u2')
    print(snapshot('2024-06-03'))
```

## 设计要点

- 高频事件只写 Redis，每分钟用 `GET`/`HGETALL` 把聚合结果批量搬进数据库，数据库只承受低频写入。
- UV 用 HyperLogLog 而不是 Set：Set 精确去重但内存随基数线性增长，HyperLogLog 固定约 12 KB，换 0.81% 的误差。
- 键名里带上日期，按天清理和跨天对比都方便，历史键要么设 TTL，要么导出后删掉。
- 单键 `INCR` 是热点时拆成 `stats:x:{date}:0` 到 `:9` 十个键分摊，汇总时相加。
- 分析数据丢几秒能接受就不用管持久化，不能接受就开 AOF everysec，代价是写放大。
