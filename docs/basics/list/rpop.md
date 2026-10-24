# RPOP

`RPOP` removes and returns the element at the tail of the list. Symmetric to `LPOP`, it is commonly used to consume from the other end of a queue, or combined with `LPUSH` to implement a stack. Time complexity is O(1).

## Syntax

```plaintext
RPOP key [count]
```

## Parameters

- `key`: the key name of the list.
- `count`: optional, pops multiple elements at once (supported since Redis 6.2), must be a non-negative integer.

## Return value

- Without `count`, returns the value of the tail element; returns `nil` if the list does not exist or is empty.
- With `count`, returns an array of elements popped from the tail (in tail-to-head order); returns an empty array if the list does not exist.
- Running it on a non-list key returns a `WRONGTYPE` error.

## Examples

```plaintext
# Prepare a sample list; result is a b c d
RPUSH ba:l:log a b c d

# Pop the tail element; returns d
RPOP ba:l:log

# Remaining elements are a b c
LRANGE ba:l:log 0 -1

# Pop two at once; returns c and b
RPOP ba:l:log 2

# Combined with LPUSH to implement LIFO
LPUSH ba:l:call first
LPUSH ba:l:call second
RPOP ba:l:call

# Returns nil when the list is empty
RPOP ba:l:log

# Clean up the sample keys
DEL ba:l:log ba:l:call
```

## Use cases

- **Stack (LIFO)**: `LPUSH` pushes, `RPOP` pops, last-in-first-out.
- **Multi-end consumption**: When a list is processed by multiple consumers at the same time, some use `LPOP` and some use `RPOP`, reducing contention.
- **Quota reclamation**: Pop excess historical records from the tail and discard them. Combined with `LTRIM` the effect is similar but the semantics differ.

## Notes

- When popping leaves the list empty, the key is automatically deleted.
- With `count`, the returned array is ordered "tail-to-head", the opposite direction from `LPOP ... count` — mind the order handling on the business side.
- When you need to block and wait for new elements, use `BRPOP` rather than polling `RPOP`.
- For the atomic "pop from the tail of source and push to the head of destination", use `LMOVE source destination RIGHT LEFT` (the old command `RPOPLPUSH` has been marked deprecated since Redis 6.2 but still works).
- Running `RPOP` on an empty list just returns `nil`; it does not raise an error.

## Summary

`RPOP` pops an element from the tail of the list. Together with `LPOP` it provides consumption from both ends of a list. Combined with `LPUSH` you get a stack structure; for atomic cross-list transfers, prefer `LMOVE`.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- RPOP (no authoritative source found (to verify))

## Related pages

- [lpop](lpop.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [lpop](lpop.md)
