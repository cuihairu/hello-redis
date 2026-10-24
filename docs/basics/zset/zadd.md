# ZADD

`ZADD` adds one or more members and their scores to a sorted set. A sorted set is ordered by score, and members with the same score are arranged lexicographically by member, making it the core structure for leaderboards, delayed queues, and similar scenarios.

## Syntax

```plaintext
ZADD key [NX|XX] [GT|LT] [CH] [INCR] score member [score member ...]
```

## Parameters

- `key`: the key name of the sorted set.
- `score`: the member's score, a double-precision floating point number, supporting `-inf` and `+inf`.
- `member`: the member, a binary-safe string, unique within the set.
- `NX`: add only new members; do not update the score of members that already exist.
- `XX`: update only the score of members that already exist; do not add new members.
- `GT`: update only when the new score is greater than the current score (supported from Redis 6.2).
- `LT`: update only when the new score is less than the current score (supported from Redis 6.2).
- `CH`: change the return value to "the number of members modified" (added + score changed).
- `INCR`: run in incremental mode, in which only one member can be scored; the behavior is equivalent to `ZINCRBY`.

## Return value

- By default returns the number of **newly added** members.
- With `CH`, returns the number of members modified (added or score changed).
- With `INCR`, returns the member's new score (as a string); with `NX` when the member already exists, no increment is applied and `nil` is returned.

## Examples

```plaintext
# Add members
ZADD ba:z:board 100 alice
ZADD ba:z:board 90 bob 95 carol

# View rankings and scores
ZRANGE ba:z:board 0 -1 WITHSCORES

# Update an existing member's score, returns 0 (no new members added)
ZADD ba:z:board 92 bob

# Update only when the new score is higher
ZADD ba:z:board GT 120 alice

# Use CH to see the number of members that actually changed
ZADD ba:z:board CH 130 alice 70 dave

# Add only new members; the existing alice is not updated, returns 0
ZADD ba:z:board NX 10 alice

# Incremental scoring, equivalent to ZINCRBY, returns the new score
ZADD ba:z:board INCR 5 bob

# Returns an error when the score is not a valid number
ZADD ba:z:board abc nobody

# Clean up the example key
DEL ba:z:board
```

## Notes

- `NX` and `XX` are mutually exclusive; `GT`/`LT` cannot be used together with `NX`, otherwise `ERR GT, LT, and/or NX options at the same time are not compatible` is returned.
- Scores are double-precision floating point numbers, so integer arithmetic beyond 2^53 loses precision; when precise large integers are needed, use a string key with `INCR` instead.
- Members are unique while scores may repeat; ordering is by "score first, lexicographic order second".
- When updating the score of an existing member, the member moves to a new position in the ordering, and read-command results change accordingly.
- With `INCR`, only one member can be scored at a time, and it cannot be combined with `CH`.

## Summary

`ZADD` covers three categories of write needs — "new additions, conditional updates, and increments" — through its `NX`/`XX`/`GT`/`LT`/`CH`/`INCR` options. By default it returns the number added, `CH` changes it to return the number modified, and `INCR` returns the new score directly; these three points are the easiest to confuse in application code.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- ZADD (no authoritative source found; to be verified)

## Related pages

- [other-commands](other-commands.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [other-commands](other-commands.md)
