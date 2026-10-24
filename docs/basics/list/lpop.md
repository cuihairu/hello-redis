# LPOP

`LPOP` removes and returns the element at the head of the list. It is the standard command for dequeue and stack-pop operations. Time complexity is O(1).

## Syntax

```plaintext
LPOP key [count]
```

## Parameters

- `key`: the key name of the list.
- `count`: optional, pops multiple elements at once (supported since Redis 6.2), must be a non-negative integer.

## Return value

- Without `count`, returns the value of the head element; returns `nil` if the list does not exist or is empty.
- With `count`, returns an array of elements in head-to-tail order; returns an empty array if the list does not exist.
- Running it on a non-list key returns a `WRONGTYPE` error.

## Examples

```plaintext
# Prepare a sample list; result is a b c d
RPUSH ba:l:job a b c d

# Pop the head element; returns a
LPOP ba:l:job

# Remaining elements are b c d
LRANGE ba:l:job 0 -1

# Pop two at once; returns b and c
LPOP ba:l:job 2

# When count exceeds remaining count, only existing elements are returned
LPOP ba:l:job 10

# Returns nil when the list is empty
LPOP ba:l:job

# When the key does not exist: without count returns nil, with count returns an empty array
LPOP ba:l:job
LPOP ba:l:job 2

# Clean up the sample key
DEL ba:l:job
```

## Use cases

- **Queue consumption**: `RPUSH` enqueues, `LPOP` dequeues, forming a FIFO queue.
- **Stack operations**: Combined with `LPUSH` to implement LIFO.
- **Batch task retrieval**: Use the `count` parameter to grab multiple tasks at once, reducing command round trips.

## Notes

- When popping leaves the list empty, the key is automatically deleted; subsequent `EXISTS` on it returns 0.
- `LPOP` with `count` returns a different structure than without `count` (array vs single value); client code must handle them separately.
- When you need to wait rather than return `nil` immediately on an empty list, use the blocking version `BLPOP`.
- For an atomic "pop from one end, push to the other end of another list" operation, use `LMOVE` (the old command `RPOPLPUSH` has been recommended for replacement by `LMOVE` since 6.2).
- `LPOP` and `RPOP` only affect element count; they do not change the relative order of the remaining elements.

## Summary

`LPOP` pops an element from the head of the list. Combined with `RPUSH` it is the classic queue pairing; the `count` parameter makes batch consumption simple. Without `count` it returns a single value, with `count` it returns an array — client code must treat these two return forms separately.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- LPOP (no authoritative source found (to verify))

## Related pages

- [rpop](rpop.md)
- [rpush](rpush.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [rpop](rpop.md)
- [rpush](rpush.md)
- [knowledge](/knowledge.md)
