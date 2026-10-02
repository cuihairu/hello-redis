# 打卡

打卡与签到类似，都是"某人在某天是否完成了某个动作"，区别在于打卡通常强调出勤率、加班时长等统计口径，数据往往需要按天按人聚合后再查询。

## 方案一：位图按天记录（推荐）

以天为键、用户 ID 为位偏移，可以快速回答"今天有多少人打了卡"，以及"某人打了多少天"：

```bash
# 2024-06-03 当天打卡：用户 42、43 打卡
SETBIT clockin:20240603 42 1
SETBIT clockin:20240603 43 1

# 当天打卡总人数
BITCOUNT clockin:20240603          # 2

# 某人今年的打卡天数（按用户 ID 建键，位偏移为一年中的第几天）
SETBIT clockin:user:42:2024 153 1   # 第 154 天打卡
BITCOUNT clockin:user:42:2024       # 1
```

这种方案适合只需要"是否打卡"的场景，位图单键内存极小。

## 方案二：哈希记录明细

如果需要记录上下班时间、工时等字段，则使用哈希更合适：

```bash
# 员工 42 在 2024-06-03 的打卡记录
HSET clockin:42:2024-06-03 in 09:02 out 18:31 minutes 569

# 查询某天的打卡情况
HGETALL clockin:42:2024-06-03
```

## Python 示例：判断迟到

```python
import datetime
import redis

r = redis.Redis(decode_responses=True)
WORK_START = datetime.time(9, 30)


def clock_in(user_id, now=None):
    now = now or datetime.datetime.now()
    day = now.strftime('%Y-%m-%d')
    key = f'clockin:{user_id}:{day}'

    if r.hexists(key, 'in'):          # 当天已打过上班卡
        return False, None
    late = now.time() > WORK_START
    r.hset(key, mapping={
        'in': now.strftime('%H:%M'),
        'late': int(late),
    })
    r.setbit(f'clockin:users:{day}', user_id, 1)  # 同步维护当日打卡人数位图
    return True, late


def clock_out(user_id, now=None):
    now = now or datetime.datetime.now()
    key = f'clockin:{user_id}:{now:%Y-%m-%d}'
    if not r.hexists(key, 'in'):
        return False
    r.hset(key, 'out', now.strftime('%H:%M'))
    return True


def today_count(day=None):
    day = day or datetime.date.today()
    return r.bitcount(f'clockin:users:{day:%Y-%m-%d}')


if __name__ == '__main__':
    stamp = datetime.datetime(2024, 6, 3, 9, 2)
    print(clock_in(42, stamp))   # (True, False)
    print(clock_in(42, stamp))   # (False, None) 已打过卡
    print(today_count(datetime.date(2024, 6, 3)))  # 1
```

## 实践建议

- 明细数据（几点打的卡）与统计位图分开存储，明细用于展示，位图用于快速统计。
- 按天建键并设置较长的 TTL（如 90 天），历史数据定期归档到数据库后删除。
- 位偏移依赖用户 ID，若用户 ID 不连续（如雪花 ID很大），不要用全局位图按 ID 置位，改用"按用户建键"的方案一。
