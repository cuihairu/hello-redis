# SPOP

`SPOP` randomly removes and returns one or more members from a set. The difference from `SRANDMEMBER` is that `SPOP` deletes the members from the set, whereas `SRANDMEMBER` only reads them without deleting.

## Syntax

```plaintext
SPOP key [count]
```

## Parameters

- `key`: the key name of the set.
- `count`: optional, the number of members to remove and return at once; must be a positive integer (supported from Redis 3.2).

## Return value

- Without `count`, returns the single removed member; returns `nil` when the set does not exist or is already empty.
- With `count`, returns an array of the removed members; returns an empty array when the set does not exist, and returns all members when the set has fewer than `count` members.
- When `count` is not a positive integer (for example 0 or a negative number), returns the error `ERR value is out of range, must be positive`.

## Examples

```plaintext
# Prepare a sample set
SADD ba:s:lottery user:1 user:2 user:3 user:4 user:5

# Randomly remove and return one member
SPOP ba:s:lottery

# View the remaining members
SMEMBERS ba:s:lottery

# Randomly remove two members at once, returning an array
SPOP ba:s:lottery 2

# When count exceeds the remaining member count, only the existing members are returned
SPOP ba:s:lottery 10

# A negative count raises an error directly
SADD ba:s:lottery user:9
SPOP ba:s:lottery -1

# Clean up the sample key
DEL ba:s:lottery
```

## Use cases

- **Lottery and random dispatch**: put the candidate list in a set; once `SPOP` draws one it disappears from the pool, so nobody wins twice.
- **Random task assignment**: put task identifiers in a set, and let multiple workers each `SPOP` to claim one — duplicate processing is avoided naturally.
- **Limited random samples**: repeatedly `SPOP` to draw samples; the set itself becomes a sampling pool without replacement.

## Notes

- `SPOP` is a write command: the member is removed from the set at the same time it is returned. If you only want to "look at" random members, use `SRANDMEMBER`.
- The `count` parameter must be a positive integer, and the number actually returned never exceeds the set's current member count.
- Randomness is decided internally by Redis and is not guaranteed to be uniform on every call, so it suits lottery-style business but not cryptographic use.
- Once every member is removed, the key is deleted automatically.
- Because which member is popped is unpredictable, business code should not assume the return order or the distribution of members.

## Summary

`SPOP` combines random selection with deletion, and is the standard implementation of "sampling without replacement". Remember two key points: `count` must be a positive integer, and returning a member deletes it. Keep it clearly distinguished from `SRANDMEMBER` (read-only, no deletion, negative count allows duplicates).

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- SPOP (no authoritative source found; to be verified)

## Related pages

- [other-commands](other-commands.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [other-commands](other-commands.md)
