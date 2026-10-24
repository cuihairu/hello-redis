# Leaderboards

Every member of a sorted set carries a score, Redis keeps them sorted by score automatically, and rank queries complete in O(log N). That makes the sorted set the structure of choice for leaderboards such as game scoreboards and sales rankings.

For a scenario index see [leaderboards and counters](ranking-and-counting.md); for periodic aggregation and sharding of counters see [counters](counters.md). This page focuses on leaderboard commands, sorting, and queries.

## Basic commands

```bash
# Enter the board: add or update the score
ZADD leaderboard 1500 alice
ZADD leaderboard 1800 bob
ZADD leaderboard 1200 carol

# Score change: add points (atomic increment)
ZINCRBY leaderboard 100 alice

# Query the top 10 (REV for high to low, WITHSCORES returns the scores too)
ZRANGE leaderboard 0 9 REV WITHSCORES

# Query your own rank (0 means first place)
ZREVRANK leaderboard alice

# Query your own score
ZSCORE leaderboard alice

# Count how many fall within a score range
ZCOUNT leaderboard 1500 2000
```

## Python example

```python
import redis

r = redis.Redis(decode_responses=True)


def add_score(user, delta):
    r.zincrby('leaderboard', delta, user)


def top_n(n=10):
    return r.zrange('leaderboard', 0, n - 1, desc=True, withscores=True)


def rank_of(user):
    rank = r.zrevrank('leaderboard', user)  # starts at 0
    return None if rank is None else rank + 1


if __name__ == '__main__':
    add_score('alice', 1500)
    add_score('bob', 1800)
    add_score('alice', 100)          # alice becomes 1600
    print(top_n(3))
    # [('bob', 1800.0), ('alice', 1600.0)]
    print(rank_of('alice'))          # 2
```

## Common extensions

- **Resetting the board (monthly/weekly boards)**: include the period in the key name, such as `leaderboard:2024-06`, and it switches automatically across periods; set a TTL on the old board and it cleans itself up.
- **Breaking ties by time**: encode the score and a timestamp into a single number (score multiplied by a large base plus the complement of the time delta) so whoever reached the score first ranks higher.
- **Million-scale boards**: deep paging with `ZRANGE` (large offsets) walks many elements, so deep paging can fall back to caching on the application side; when you only need to show the top N, keep a separate Top N list.
- **Command evolution**: since Redis 6.2, `ZREVRANGE`, `ZRANGEBYSCORE`, and `ZREVRANGEBYSCORE` are deprecated; use `ZRANGE` with the `REV` and `BYSCORE` options instead. The examples here already use the new syntax.

## Compared with a plain list approach

Sorting can also be done with `LIST` or with `ORDER BY` in a database, but every score change forces a re-sort or a round trip to the store. A sorted set maintains the sort at write time, rank reads are O(log N), and the more skewed the read/write ratio, the bigger the advantage.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
- [README](README.md)
- [redis-use-cases](redis-use-cases.md)
