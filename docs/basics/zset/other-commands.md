# Other sorted set commands

Besides `ZADD`, `ZRANGE`, and `ZREM`, sorted sets also offer commands for score lookups, ranking, incremental updates, range deletion, and set operations. This page groups the 11 most commonly used ones by purpose.

## Scores and ranks

### ZSCORE

Returns a member's score. Syntax `ZSCORE key member`. Returns `nil` if the member or key does not exist.

```plaintext
ZSCORE ba:z:board alice
```

### ZMSCORE

Returns the scores of multiple members in one call. Syntax `ZMSCORE key member [member ...]` (supported since Redis 6.2). Results come back in the order the members were passed; members that do not exist return `nil` in the corresponding position.

```plaintext
ZMSCORE ba:z:board alice bob ghost
```

### ZCARD

Returns the number of members in a sorted set. Syntax `ZCARD key`, with O(1) time complexity; returns 0 if the key does not exist.

```plaintext
ZCARD ba:z:board
```

### ZCOUNT

Counts the members whose scores fall within a range. Syntax `ZCOUNT key min max`. The interval is inclusive; prefixing an endpoint with `(` makes it exclusive. `+inf` and `-inf` are supported.

```plaintext
ZCOUNT ba:z:board (90 +inf
```

### ZRANK

Returns a member's rank in ascending score order (starting at 0). Syntax `ZRANK key member [WITHSCORE]`. Returns `nil` if the member does not exist; with `WITHSCORE` the score is returned as well (supported since Redis 7.2). The symmetric descending command is `ZREVRANK`. This is the "where do I stand" command for a leaderboard — mind the ascending direction; you will usually pair it with `ZREVRANK`.

```plaintext
ZRANK ba:z:board bob WITHSCORE
```

### ZINCRBY

Increases a member's score. Syntax `ZINCRBY key increment member`. `increment` may be negative; if the member does not exist it is treated as having a score of 0 before the increment is applied, which is functionally equivalent to `ZADD key INCR ...`. The atomic way to add points — use it for scoring on a leaderboard.

```plaintext
ZINCRBY ba:z:board 5 bob
```

## Popping and range deletion

### ZPOPMIN

Removes and returns one or more members with the lowest scores. Syntax `ZPOPMIN key [count]`. Returns an array alternating between members and scores; returns an empty array if the set is empty.

```plaintext
ZPOPMIN ba:z:board 1
```

### ZPOPMAX

Removes and returns one or more members with the highest scores. Syntax `ZPOPMAX key [count]`. Symmetric to `ZPOPMIN`; useful for taking the current top scorer off the board, for example after awarding a prize.

```plaintext
ZPOPMAX ba:z:board
```

### ZREMRANGEBYSCORE

Deletes all members whose scores fall within a range. Syntax `ZREMRANGEBYSCORE key min max`. Endpoints support the `(` exclusive form. Returns the number of members removed; commonly used to clean up expired entries in a delayed queue.

```plaintext
ZREMRANGEBYSCORE ba:z:board 1 2
```

### ZREMRANGEBYRANK

Deletes all members whose ranks fall within a given index range. Syntax `ZREMRANGEBYRANK key start stop`. Indices start at 0 and negative values count from the end; `ZREMRANGEBYRANK key 100 -1` keeps the top 100 members and deletes the rest — the standard way to cap the length of a leaderboard.

```plaintext
ZREMRANGEBYRANK ba:z:board 100 -1
```

## Set operations

### ZUNIONSTORE

Computes the union of multiple sorted sets and stores the result in `destination`. Syntax `ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]`. The first argument is the number of keys taking part in the operation; `WEIGHTS` assigns a weight to each set, and `AGGREGATE` specifies how scores are aggregated, defaulting to `SUM`. Returns the number of members in the result set.

```plaintext
ZUNIONSTORE ba:z:total 2 ba:z:week1 ba:z:week2 WEIGHTS 1 2 AGGREGATE SUM
```

## Additional notes

- `ZINTERSTORE` works exactly like `ZUNIONSTORE`, except it computes the intersection. Since Redis 6.2, read-only `ZUNION`/`ZINTER`/`ZDIFF` are also available and do not persist the result.
- `ZRANGEBYLEX` for lexicographic ranges, `ZRANGEBYSCORE` for score ranges, and the reverse `ZREVRANGE` are all deprecated since Redis 6.2 in favor of `ZRANGE` with the `BYLEX`, `BYSCORE`, and `REV` options.
- `ZRANGESTORE` can store a range query's result directly into a new key, and `ZRANDMEMBER` is used for random sampling.

## Summary

The score and rank commands (`ZSCORE`, `ZRANK`, `ZINCRBY`) support the core reads and writes of a leaderboard. The pop and cleanup commands (`ZPOPMIN`/`ZPOPMAX`, `ZREMRANGEBYSCORE`/`ZREMRANGEBYRANK`) support delayed queues and leaderboard maintenance. `ZUNIONSTORE`/`ZINTERSTORE` handle cross-set aggregation. Convergence onto `ZRANGE` for interval reads is the current recommended approach.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

## Related pages

- &#8203;zadd<!-- EN-LINK: zadd.md -->
- [zrem](zrem.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- &#8203;zadd<!-- EN-LINK: zadd.md -->
- [zrem](zrem.md)
