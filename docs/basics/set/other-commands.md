# Other set commands

Beyond `SADD`, `SMEMBERS`, and `SPOP`, the set type also has commands for member deletion, existence checks, random sampling, and set operations (intersection, union, difference). This page lists the 11 most common ones, grouped by purpose.

## Member management

### SREM

Remove one or more members. Syntax `SREM key member [member ...]`. Returns the actual number of members removed; members that do not exist are ignored automatically.

```plaintext
SADD ba:s:tags java redis
SREM ba:s:tags java kafka
```

### SCARD

Return the number of members in a set. Syntax `SCARD key`. Time complexity O(1); returns 0 if the key does not exist. Use it to count the size; use `SMEMBERS` to read the contents.

```plaintext
SCARD ba:s:tags
```

### SISMEMBER

Check whether a single member exists. Syntax `SISMEMBER key member`. Time complexity O(1). Returns 1 if present, 0 if absent. The standard idiom for boolean flags (e.g. "processed", "liked").

```plaintext
SISMEMBER ba:s:tags redis
```

### SMISMEMBER

Batch-check whether multiple members exist. Syntax `SMISMEMBER key member [member ...]`. Returns an array of 1s and 0s in the order the members were passed (supported since Redis 6.2). Any code that calls `SISMEMBER` one member at a time should be rewritten as a single call.

```plaintext
SMISMEMBER ba:s:tags redis kafka
```

### SRANDMEMBER

Randomly return members without removing them. Syntax `SRANDMEMBER key [count]`. With a positive `count`, returns up to `count` distinct members; with a negative count, returns |count| members with repetition allowed; without `count`, returns a single member.

```plaintext
SRANDMEMBER ba:s:tags 2
SRANDMEMBER ba:s:tags -5
```

### SMOVE

Atomically move a member from one set to another. Syntax `SMOVE source destination member`. Returns 1 on success; returns 0 if the member is not in `source`; returns 1 even if `destination` already contains the member.

```plaintext
SADD ba:s:done ok
SMOVE ba:s:tags ba:s:done java
```

## Set operations

### SINTER

Return the intersection of multiple sets. Syntax `SINTER key [key ...]`. A read-only computation; it does not modify any set.

```plaintext
SADD ba:s:a 1 2 3
SADD ba:s:b 2 3 4
SINTER ba:s:a ba:s:b
```

### SINTERCARD

Return only the number of members in the intersection, not the members themselves. Syntax `SINTERCARD numkeys key [key ...] [LIMIT limit]` (supported since Redis 7.0). The first argument is the number of keys participating in the operation; `LIMIT` returns early once the cap is reached, which suits scenarios where you only care about "do they intersect".

```plaintext
SINTERCARD 2 ba:s:a ba:s:b LIMIT 10
```

### SUNION

Return the union of multiple sets. Syntax `SUNION key [key ...]`. Merges all members from all sets and automatically deduplicates.

```plaintext
SUNION ba:s:a ba:s:b
```

### SDIFF

Return the difference of the first set relative to the subsequent sets. Syntax `SDIFF key [key ...]`. The result depends on the order the keys are passed; `SDIFF a b` and `SDIFF b a` are usually different.

```plaintext
SDIFF ba:s:a ba:s:b
```

### SINTERSTORE

Compute the intersection and store the result in `destination`. Syntax `SINTERSTORE destination key [key ...]`. The corresponding commands are `SUNIONSTORE` and `SDIFFSTORE`; `destination` can be one of the keys involved in the operation, in which case the old set is overwritten.

```plaintext
SINTERSTORE ba:s:result ba:s:a ba:s:b
```

## Additional notes

- `SSCAN key cursor [MATCH pattern] [COUNT count]` iterates over a large set incrementally, avoiding the one-shot blocking of `SMEMBERS`.
- The time complexity of set operations depends on the size of the sets involved. For large-set operations, consider running them on a replica using the `*STORE` variants, or first estimate the size with `SINTERCARD`.

## Summary

Member-level operations (`SREM`, `SISMEMBER`, `SMOVE`) solve single-point problems, while set-level operations (`SINTER`, `SUNION`, `SDIFF` and their corresponding `*STORE` commands) solve relational computation problems. Use `SRANDMEMBER` when you need randomness without removing members, and `SPOP` when you want randomness with removal.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

## Related pages

- &#8203;sadd<!-- EN-LINK: sadd.md -->
- &#8203;spop<!-- EN-LINK: spop.md -->

<!-- BACKLINKS-AUTO -->
## Related pages

- &#8203;sadd<!-- EN-LINK: sadd.md -->
- &#8203;spop<!-- EN-LINK: spop.md -->
