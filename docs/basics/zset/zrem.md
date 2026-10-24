# ZREM

`ZREM` removes one or more members from a sorted set. Time complexity is O(M log N), where N is the number of members in the set and M is the number of members being removed.

## Syntax

```plaintext
ZREM key member [member ...]
```

## Parameters

- `key`: The key of the sorted set.
- `member`: One or more members to remove.

## Return value

Returns the number of members actually removed. Members that do not exist are ignored and do not count toward the return value; returns 0 if the key does not exist. Running it against a key that is not a sorted set returns a `WRONGTYPE` error.

## Examples

```plaintext
# Prepare example data
ZADD ba:z:board 100 alice 90 bob 95 carol

# Remove a single member, returns 1
ZREM ba:z:board bob

# Remaining members
ZRANGE ba:z:board 0 -1 WITHSCORES

# Remove multiple members; nonexistent members are ignored, returns 1
ZREM ba:z:board carol ghost

# Returns 0 when the key does not exist
ZREM ba:z:nomember alice

# The key is deleted automatically once all members are removed
ZREM ba:z:board alice
EXISTS ba:z:board

# For bulk deletion by score range, use ZREMRANGEBYSCORE
ZADD ba:z:board 1 low 2 mid 3 high
ZREMRANGEBYSCORE ba:z:board 1 2

# Clean up the example keys
DEL ba:z:board ba:z:nomember
```

## Related commands

- `ZREMRANGEBYSCORE`: Bulk-delete members by score interval.
- `ZREMRANGEBYRANK`: Bulk-delete members by rank index interval.
- `ZPOPMIN` / `ZPOPMAX`: Pop the member with the lowest or highest score, with the score included in the return value.
- `ZSCORE`: Look up a member's current score.

## Notes

- `ZREM` can only delete by member; it cannot delete by score or rank — use `ZREMRANGEBYSCORE` and `ZREMRANGEBYRANK` for those, respectively.
- Once all members are removed, the key is deleted automatically and any associated TTL is gone too.
- Nonexistent members do not raise an error, so you can safely pass a large batch and inspect the return value to see how many were actually removed.
- To update a member's score you do not need to `ZREM` first and then `ZADD` — just `ZADD` the same member again to overwrite the score.
- Deletions shift the ranks of the remaining members, so any logic that relies on `ZRANK` results should re-read them after a deletion.

## Summary

`ZREM` is the standard command for deleting from a sorted set by member. It returns the number actually deleted and handles nonexistent members leniently. Bulk cleanup by score or rank is handled by `ZREMRANGEBYSCORE` and `ZREMRANGEBYRANK`, respectively.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- ZREM (no authoritative source found; to be verified)

## Related pages

- [other-commands](other-commands.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [other-commands](other-commands.md)
