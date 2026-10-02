# 签到

签到（如每日签到、连续签到奖励）的特点是每个用户每天只有一个比特的信息量。使用位图（Bitmap）存储，一个用户一年的签到记录只需要 365 个比特（约 46 字节），同时 `BITCOUNT`、`BITPOS` 等命令可以快速完成统计。

## 数据结构设计

键名形如 `sign:{用户ID}:{年月}`，位偏移为"日期 - 1"（1 号是第 0 位），位的值 1 表示当天已签到。

## 命令演示

```bash
# 用户 42 在 2024 年 6 月 1 日、2 日、3 日签到
SETBIT sign:42:202406 0 1
SETBIT sign:42:202406 1 1
SETBIT sign:42:202406 2 1

# 查询 6 月 2 日是否签到
GETBIT sign:42:202406 1          # 1

# 本月签到天数
BITCOUNT sign:42:202406          # 3

# 第一次签到的日期（从第 0 位起第一个 1 的位置）
BITPOS sign:42:202406 1          # 0
```

## Python 示例

```python
import datetime
import redis

r = redis.Redis(decode_responses=True)


def sign_key(user_id, day):
    return f'sign:{user_id}:{day:%Y%m}'


def sign_in(user_id, day=None):
    day = day or datetime.date.today()
    offset = day.day - 1
    if r.getbit(sign_key(user_id, day), offset):
        return False            # 当天已签到
    r.setbit(sign_key(user_id, day), offset, 1)
    return True


def month_count(user_id, day):
    return r.bitcount(sign_key(user_id, day))


def first_sign_day(user_id, day):
    pos = r.bitpos(sign_key(user_id, day), 1)
    return None if pos == -1 else pos + 1


def today_signed(user_id, day=None):
    day = day or datetime.date.today()
    return bool(r.getbit(sign_key(user_id, day), day.day - 1))


if __name__ == '__main__':
    d = datetime.date(2024, 6, 1)
    print(sign_in(42, d))               # True
    print(sign_in(42, d))               # False，重复签到
    print(month_count(42, d))           # 1
    print(first_sign_day(42, d))        # 1（6 月 1 日）
    print(today_signed(42, d))          # True
```

## 连续签到天数

`BITFIELD` 支持（在较新版本中）从某一位开始向高位读取若干位，配合按天递减的偏移即可统计连续签到：

```
# 读取 6 月 1 日及其后 31 天的位（unsigned 32 位），再在应用层统计二进制表示
BITFIELD sign:42:202406 GET u32 0
```

连续签到需要跨月时，可同时读取上月与当月两个位图后在应用层拼接计算。

## 扩展

- **补签**：直接 `SETBIT` 指定日期的位为 1，并记录补签次数（`INCR sign:makeup:{用户ID}:{年月}`）。
- **签到总人数统计**：如果还需要"今天有多少人签到"，可以再用一个以用户 ID 为偏移的全局位图 `sign:users:{日期}`，签到成功时同时置位并 `BITCOUNT`。
