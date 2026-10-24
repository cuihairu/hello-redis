# SMEMBERS

`SMEMBERS` returns all members in a set. The time complexity is O(N), where N is the number of members in the set.

## Syntax

```plaintext
SMEMBERS key
```

## Parameters

- `key`: the key name of the set.

## Return value

- Returns an array containing all members; the order is not guaranteed to match the insertion order.
- Returns an empty array when the key does not exist.
- Returns a `WRONGTYPE` error when the key exists but is not of type set.

## Examples

```plaintext
# Prepare a sample set
SADD ba:s:framework spring
SADD ba:s:framework netty redis

# Return all members (order may differ from insertion order)
SMEMBERS ba:s:framework

# A non-existent key returns an empty array
SMEMBERS ba:s:nonotexist

# For large sets, prefer SSCAN to iterate incrementally
SSCAN ba:s:framework 0 COUNT 10

# To check whether a single member exists, use SISMEMBER, at O(1)
SISMEMBER ba:s:framework netty

# Clean up the sample keys
DEL ba:s:framework ba:s:nonotexist
```

## Comparison with other read commands

- `SCARD`: returns only the member count, at O(1); prefer it for measuring size.
- `SISMEMBER`: only checks whether a single member exists, at O(1).
- `SRANDMEMBER`: returns a random subset of members without removing them.
- `SSCAN`: incremental iteration, suited to sets with a very large number of members where a long blocking call is not acceptable.
- `SINTER`/`SUNION`/`SDIFF`: return the result of an operation across multiple sets, not the contents of a single set.

## Notes

- `SMEMBERS` returns all members at once and blocks subsequent commands; once a set reaches hundreds of thousands or millions of members, switch to `SSCAN` to read in batches.
- The return order is not deterministic, so do not rely on it for business logic; if you need ordering, use a sorted set (ZSet) or a list instead.
- An empty array is different from `nil`: when the key does not exist, `SMEMBERS` returns an empty array, and clients should treat it as "an empty set".
- If you only need a random sample, use `SRANDMEMBER`; do not read the whole set back to the client and then pick randomly.

## Summary

`SMEMBERS` is the full-read command for sets: simple and straightforward, but suitable only for small sets. In production, use `SSCAN` for incremental iteration over large sets, and leave existence checks to `SISMEMBER`.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- SMEMBERS (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
