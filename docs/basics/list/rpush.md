# RPUSH

`RPUSH` inserts one or more values at the tail (right side) of a list. It is the enqueuing command that best matches the "first-in-first-out" intuition. Both head and tail insertion have O(1) time complexity.

## Syntax

```plaintext
RPUSH key value [value ...]
```

## Parameters

- `key`: the key name of the list.
- `value`: one or more values to insert, binary-safe.
- When multiple values are given, they are appended to the tail one by one in argument order, so the last argument ends up at the very end of the list.

## Return value

Returns the length of the list after the insertion completes. Running it on a non-list key returns a `WRONGTYPE` error.

## Examples

```plaintext
# Append a, then b in order
RPUSH ba:l:queue a
RPUSH ba:l:queue b

# Append multiple values at once; result is a b c d
RPUSH ba:l:queue c d

# View the whole list
LRANGE ba:l:queue 0 -1

# Combined with LPOP to implement a FIFO queue; fetches a first
LPOP ba:l:queue

# Tail insert only when the key exists
RPUSHX ba:l:queue z
RPUSHX ba:l:nonotexist z

# View the list length
LLEN ba:l:queue

# Clean up the sample keys
DEL ba:l:queue ba:l:nonotexist
```

## Use cases

- **Message queue (FIFO)**: `RPUSH` enqueues, `LPOP` dequeues; use `BLPOP` when you need a blocking wait.
- **Logs and audit trails**: Append records in chronological order, page through them with `LRANGE`.
- **Ordered collection**: The only difference from `LPUSH` is the insertion end — `RPUSH` keeps "first-come at the front".

## Notes

- If the key does not exist, a list is created automatically; if the key exists but is not a list, a `WRONGTYPE` error is raised.
- `RPUSHX` inserts only when the key already exists; it does not create a new key. Suitable for appending to an already-initialized list.
- A single list can hold at most 4294967295 (2^32 - 1) elements.
- The longer the list, the higher the cost of large-range `LRANGE` reads and `LINDEX` random access; for very large lists, use `LTRIM` to cap the length or switch to a different structure.
- `RPUSH` and `LPUSH` can be mixed on the same list; element order is determined entirely by which end you insert at.

## Summary

`RPUSH` is the tail-insertion command, commonly paired with `LPOP`/`BLPOP` to form a FIFO queue. When inserting multiple values at once, they are arranged in argument order — the opposite of `LPUSH`'s "reversed" effect.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- RPUSH (no authoritative source found (to verify))

## Related pages

- [lpop](lpop.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [lpop](lpop.md)
