# Check-ins

A check-in (such as a daily check-in or consecutive check-in rewards) carries only one bit of information per user per day. Stored as a bitmap (Bitmap), one user's year of check-in records needs only 365 bits (about 46 bytes), and commands such as `BITCOUNT` and `BITPOS` can complete the statistics quickly.

## Data structure design

The key name looks like `sign:{user_id}:{year_month}`, the bit offset is "day - 1" (the 1st is bit 0), and a bit value of 1 means the user checked in on that day.

## Command examples

```bash
# User 42 checks in on June 1, 2, and 3, 2024
SETBIT sign:42:202406 0 1
SETBIT sign:42:202406 1 1
SETBIT sign:42:202406 2 1

# Check whether June 2 was checked in
GETBIT sign:42:202406 1          # 1

# Number of check-in days this month
BITCOUNT sign:42:202406          # 3

# Date of the first check-in (position of the first 1 from bit 0)
BITPOS sign:42:202406 1          # 0
```

## Python example

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
        return False            # already checked in today
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
    print(sign_in(42, d))               # False, duplicate check-in
    print(month_count(42, d))           # 1
    print(first_sign_day(42, d))        # 1 (June 1)
    print(today_signed(42, d))          # True
```

## Consecutive check-in days

`BITFIELD` (supported in newer versions) can read a run of bits starting from a given bit toward higher bits; combined with an offset that decreases day by day, it can count consecutive check-ins:

```
# Read the bits for June 1 and the next 31 days (unsigned 32 bits), then count the binary representation in the application layer
BITFIELD sign:42:202406 GET u32 0
```

When the streak needs to span months, read both last month's and the current month's bitmaps and concatenate them in the application layer.

## Extensions

- **Make-up check-in**: directly `SETBIT` the bit for the given date to 1, and record the number of make-up check-ins (`INCR sign:makeup:{user_id}:{year_month}`).
- **Total check-in count**: if you also need "how many people checked in today", add a global bitmap `sign:users:{date}` with the user ID as the bit offset; on a successful check-in, set the bit and run `BITCOUNT` at the same time.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Strings (bitmap)](https://redis.io/docs/latest/develop/data-types/strings/)
- SETBIT (no authoritative source found — to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](README.md)
- [redis-use-cases](redis-use-cases.md)
