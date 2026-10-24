# Bit statistics

A bitmap is not a standalone data type; it is a set of commands that operate on individual bits, using the string (String) type as the carrier. It is extremely memory efficient when you need to store large numbers of boolean states: the check-in status of 10 million users takes up only about 1.2 MB.

## Core commands

```bash
# Set / read bit N (N starts at 0)
SETBIT dau:2024-06-03 1001 1
GETBIT dau:2024-06-03 1001     # 1

# Count the number of bits set
BITCOUNT dau:2024-06-03

# Count the number of bits set (with a byte range, which speeds up some counts)
BITCOUNT dau:2024-06-03 0 -1 BYTE
```

## Aggregating bitmaps across days

One bitmap key per day lets you perform logical operations across days:

```bash
SETBIT dau:2024-06-03 1001 1
SETBIT dau:2024-06-04 1001 1
SETBIT dau:2024-06-04 1002 1

# AND: users active on both days
BITOP AND dau:both dau:2024-06-03 dau:2024-06-04
BITCOUNT dau:both            # 1 (user 1001)

# OR: users active on either of the two days
BITOP OR dau:any dau:2024-06-03 dau:2024-06-04
BITCOUNT dau:any             # 2

# NOT: invert (note that this inverts by byte, so the result is only meaningful within the specified byte range)
BITOP NOT dau:not dau:2024-06-03
```

## BITPOS and BITFIELD

```bash
# Position of the first bit set
BITPOS dau:2024-06-03 1       # 1001

# Start searching from a given position
BITPOS dau:2024-06-03 1 125   # find the first 1 after byte 125

# Read multiple bit fields in one call (unsigned 8-bit integer)
BITFIELD dau:2024-06-03 GET u8 1001
```

## Typical applications

- **DAU counting**: `SETBIT dau:{date} {user_id} 1`, then count the day's total with `BITCOUNT` — no de-duplicating set needed.
- **Consecutive active days**: `BITOP AND` the week's 7 bitmaps together, then `BITCOUNT` the result to get the number of users active for 7 days in a row.
- **User retention**: the size of `BITOP AND dau:day1 dau:day2` is the retention count.
- **Marking the top N of a leaderboard**: mark leaderboard results into a fixed bitmap to answer "did it make the hot list" quickly.

## Notes

- Bit offsets are relative to the byte string, and a single bitmap key tops out at 512 MB (2^32 bits) in theory; in practice just create one key per day or per month.
- A very large offset allocates a large string of mostly empty bytes: `SETBIT k 100000000 1` costs about 12.5 MB, so always split keys along sensible dimensions.
- When user IDs are not contiguous (such as snowflake IDs), do not use the ID directly as an offset — apply a modulo, or switch to HyperLogLog for cardinality counting.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Strings (bitmaps)](https://redis.io/docs/latest/develop/data-types/strings/)
- SETBIT (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
