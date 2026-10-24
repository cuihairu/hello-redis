# Clock-ins

Clock-ins are similar to check-ins: both answer "did this person complete this action on this day." The difference is that clock-ins usually emphasize metrics such as attendance rate and overtime hours, so the data often has to be aggregated per person per day before it is queried.

## Option 1: a bitmap keyed by day (recommended)

Using the day as the key and the user ID as the bit offset answers "how many people clocked in today" and "how many days did this person clock in" quickly:

```bash
# Clock-ins on 2024-06-03: users 42 and 43 clock in
SETBIT clockin:20240603 42 1
SETBIT clockin:20240603 43 1

# Total clock-ins that day
BITCOUNT clockin:20240603          # 2

# How many days this person clocked in this year (keyed by user ID, bit offset is the day of the year)
SETBIT clockin:user:42:2024 153 1   # clocked in on day 154
BITCOUNT clockin:user:42:2024       # 1
```

This approach fits scenarios that only need "clocked in or not," and a single bitmap key costs very little memory.

## Option 2: a hash for the details

If you need to record fields such as clock-in/clock-out times or work hours, a hash is the better fit:

```bash
# Employee 42's clock-in record on 2024-06-03
HSET clockin:42:2024-06-03 in 09:02 out 18:31 minutes 569

# Look up the clock-in record for a given day
HGETALL clockin:42:2024-06-03
```

## Python example: detecting lateness

```python
import datetime
import redis

r = redis.Redis(decode_responses=True)
WORK_START = datetime.time(9, 30)


def clock_in(user_id, now=None):
    now = now or datetime.datetime.now()
    day = now.strftime('%Y-%m-%d')
    key = f'clockin:{user_id}:{day}'

    if r.hexists(key, 'in'):          # already clocked in this day
        return False, None
    late = now.time() > WORK_START
    r.hset(key, mapping={
        'in': now.strftime('%H:%M'),
        'late': int(late),
    })
    r.setbit(f'clockin:users:{day}', user_id, 1)  # maintain the daily clock-in count bitmap in sync
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
    print(clock_in(42, stamp))   # (False, None), already clocked in
    print(today_count(datetime.date(2024, 6, 3)))  # 1
```

## Practical tips

- Store the detail data (what time they clocked in) separately from the statistics bitmap: the details are for display, the bitmap is for fast counting.
- Key by day and set a fairly long TTL (e.g. 90 days); periodically archive historical data to a database and then delete it.
- The bit offset depends on the user ID. If user IDs are not contiguous (e.g. Snowflake IDs are very large), do not set bits by ID in a global bitmap; use the per-user key scheme in Option 1 instead.

## References

- [Redis dev docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis dev docs · Strings (bitmaps)](https://redis.io/docs/latest/develop/data-types/strings/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
