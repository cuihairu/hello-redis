# LPUSH

`LPUSH` inserts one or more values at the head (left side) of a list. Redis lists are string collections ordered by insertion, backed by a listpack/quicklist; insertion at head and tail are both O(1).

## Syntax

```plaintext
LPUSH key value [value ...]
```

## Parameters

- `key`: the key name of the list.
- `value`: one or more values to insert, binary-safe.
- When multiple values are given, they are inserted at the head one by one in argument order, so the last argument ends up at the very front of the list.

## Return value

Returns the length of the list after the insertion completes. Running it on a non-list key returns a `WRONGTYPE` error.

## Examples

```plaintext
# Insert a, then b in sequence
LPUSH ba:l:stack a
LPUSH ba:l:stack b

# Insert two values at once: c is pushed first, d second, so d is at the front
LPUSH ba:l:stack c d

# View the whole list; result is d c b a
LRANGE ba:l:stack 0 -1

# View the list length
LLEN ba:l:stack

# Head insert only when the key exists (does not create the key if absent, returns 0)
LPUSHX ba:l:stack z
LPUSHX ba:l:nolist z

# Clean up the sample keys
DEL ba:l:stack ba:l:nolist
```

## Use cases

- **Stack (LIFO)**: `LPUSH` with `LPOP`, last-in-first-out.
- **Latest-activity list**: `LPUSH` each new record to the head, `LRANGE key 0 9` fetches the latest 10, combined with `LTRIM` to cap the list length — a lightweight "latest N" cache.
- **Task collection**: Producers push tasks to the head, consumers `RPOP` them from the tail.

## Notes

- If the key does not exist, an empty list is created first; if the key exists but is not a list, a `WRONGTYPE` error is raised.
- Use `LPUSHX` when you need "insert only if the key exists" — it does not create a new key.
- A single list can hold at most 4294967295 (2^32 - 1) elements.
- The ordering of elements at the head after `LPUSH` is easy to get confused: when multiple values are passed at once, the last value is closest to the head.
- If insertion and popping need blocking waits, clients should use `BLPOP`/`BRPOP` rather than writing their own polling.

## Summary

`LPUSH` is the standard command for head insertion. Combined with `LRANGE`, `LPOP`, and `LTRIM` it supports typical structures such as stacks and latest-activity lists. When inserting multiple values at once, note that the argument order and the final arrangement are reversed.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- LPUSH (no authoritative source found (to verify))

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
