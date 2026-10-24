# SADD

`SADD` adds one or more members to a set. Sets are unordered collections of strings whose members are naturally unique; duplicate members are ignored automatically. This makes `SADD` the entry-point command for deduplication, tags, whitelists, and similar structures.

## Syntax

```plaintext
SADD key member [member ...]
```

## Parameters

- `key`: the key name of the set.
- `member`: one or more members to add, binary-safe.
- Members that repeat within the same call are only counted once.

## Return value

Returns the number of members actually **newly added**: already-existing members are ignored and not counted in the return value.

## Examples

```plaintext
# First-time add
SADD ba:s:lang zh

# Adding zh again returns 0; adding en returns 1
SADD ba:s:lang en zh

# Add multiple members at once
SADD ba:s:lang fr de en

# View the set contents
SMEMBERS ba:s:lang

# View the set size
SCARD ba:s:lang

# Running SADD on a string key returns a WRONGTYPE error
SET ba:s:notaset plain
SADD ba:s:notaset m

# Clean up the sample keys
DEL ba:s:lang ba:s:notaset
```

## Use cases

- **Deduplication sets**: A user's access IPs, device IDs, and so on naturally need to be unique.
- **Tags and categories**: Attach multi-select tags to users or articles.
- **Boolean flags**: Set membership represents a "processed" state, checked in O(1) with `SISMEMBER`.
- **Raffle pool**: Members join the set; `SPOP` randomly pops the winner.

## Notes

- Members are "unordered"; the return order of `SMEMBERS` is not guaranteed to match insertion order.
- Running `SADD` on a non-set key returns a `WRONGTYPE` error rather than overwriting data.
- Numeric-looking members are stored as strings; `SADD myset 1` and `SADD myset "1"` are the same member.
- When adding a large number of members, passing multiple members in a single `SADD` is more efficient than looping over single calls.
- Use `SREM` to remove members; use `SISMEMBER` to check whether a member is in the set (`SMISMEMBER` for multiple members).

## Summary

`SADD` is the standard write command for the set type. It returns the count of newly added members and provides deduplication naturally. Combined with `SISMEMBER`, `SCARD`, `SPOP`, and other commands, sets can be used as tag sets, whitelists, and raffle pools.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- SADD (no authoritative source found (to verify))

## Related pages

- [other-commands](other-commands.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [other-commands](other-commands.md)
