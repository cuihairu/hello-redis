# ZRANGE

`ZRANGE` returns members within a specified range of a sorted set. Since Redis 6.2 it has unified the older `ZRANGEBYSCORE`, `ZREVRANGE` and other commands; with options you can fetch ranges by index, score, or lexicographic order.

## Syntax

```plaintext
ZRANGE key start stop [BYSCORE | BYLEX] [REV] [LIMIT offset count] [WITHSCORES]
```

## Parameters

- `key`: the key name of the sorted set.
- `start stop`: the range endpoints. With index (the default) or with `REV` reversed, these are 0-based indices, and negative numbers count from the end; with `BYSCORE`/`BYLEX` they are score or lexicographic endpoints.
- `BYSCORE`: fetch members by score interval; endpoints can be written as `+inf` or `-inf`, and a `(` prefix denotes an open (exclusive) interval.
- `BYLEX`: fetch a range by lexicographic order of members; endpoints use a `[` (inclusive) or `(` (exclusive) prefix.
- `REV`: fetch in reverse (high to low) order; `start` is then the higher end of the range.
- `LIMIT offset count`: only used with `BYSCORE` or `BYLEX`; `offset` starts at 0, and a negative `count` means return all remaining members.
- `WITHSCORES`: also return the score of each member in the result.

## Return value

Returns an array of members; with `WITHSCORES` it returns an array alternating "member, score". When the key does not exist, an empty array is returned.

## Examples

```plaintext
# Prepare example data
ZADD ba:z:board 80 dave 90 bob 95 carol 100 alice

# Get all members by index (scores from low to high)
ZRANGE ba:z:board 0 -1

# With scores
ZRANGE ba:z:board 0 -1 WITHSCORES

# Negative indices, get the last two
ZRANGE ba:z:board -2 -1

# Get the two highest-scoring members in reverse
ZRANGE ba:z:board 0 1 REV WITHSCORES

# Get members by score interval; "(90" means excluding 90
ZRANGE ba:z:board (90 100 BYSCORE WITHSCORES

# Get by score interval in reverse, taking only the first two
ZRANGE ba:z:board +inf 90 BYSCORE REV LIMIT 0 2 WITHSCORES

# Get a range by lexicographic order
ZADD ba:z:lex 0 a 0 b 0 c 0 d
ZRANGE ba:z:lex [a (c BYLEX

# Out-of-range indices return an empty array
ZRANGE ba:z:lex 100 200

# Clean up the example keys
DEL ba:z:board ba:z:lex
```

## Notes

- Without `REV`, results are ordered by score from low to high, the opposite of the intuitive "leaderboard first place first"; leaderboards usually need `REV`.
- `LIMIT` is only available in `BYSCORE` or `BYLEX` mode; it is not supported when fetching by index.
- `BYLEX` is only meaningful when all members have the same score; otherwise results are not sorted as expected.
- When using `REV` in `BYSCORE` mode, the endpoints must also be written in reverse (the high-score end first).
- The older commands `ZRANGEBYSCORE`, `ZREVRANGE`, and `ZRANGEBYLEX` have been marked deprecated since Redis 6.2; they still work, but it is recommended to use the `ZRANGE` plus options form uniformly.

## Summary

`ZRANGE` is the most important read command for sorted sets: fetching a range by index is the default behavior, `BYSCORE`/`BYLEX` extend it to score and lexicographic order, and `REV` and `LIMIT` handle reversal and pagination. The endpoint forms (negative indices, `(` open interval, `+inf`) cover the common range queries on leaderboards.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- ZRANGE (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
