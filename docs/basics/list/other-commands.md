# Other list commands

Besides the four basic operations `LPUSH`, `RPUSH`, `LPOP`, and `RPOP`, the list type also has commands for range reads, locate-and-modify, trimming, and blocking pops. This page lists the 11 most commonly used ones, grouped by purpose.

## Reading and locating

### LRANGE

Fetches elements within a given index range. Syntax `LRANGE key start stop`. Indexing starts at 0, negative numbers count from the tail, the range is inclusive of `stop`, and `0 -1` means the whole list. Paginated reads of "latest N" rely on it.

```plaintext
RPUSH ba:l:demo a b c d e
LRANGE ba:l:demo 1 3
LRANGE ba:l:demo -2 -1
```

### LLEN

Returns the length of the list. Syntax `LLEN key`, time complexity O(1); returns 0 when the key does not exist.

```plaintext
LLEN ba:l:demo
```

### LINDEX

Returns the element at a given index. Syntax `LINDEX key index`; returns `nil` when the index is out of bounds. Random access on a list is an O(N) traversal — if you need frequent indexed reads, consider switching to a different structure.

```plaintext
LINDEX ba:l:demo 0
LINDEX ba:l:demo -1
```

### LPOS

Returns the index of a matching element in the list. Syntax `LPOS key element [RANK rank] [COUNT num-matches] [MAXLEN len]` (supported since Redis 6.0.6). By default it returns the first matching index; a negative `RANK` counts from the tail, giving the |rank|-th match from the end; `COUNT 0` returns all matching positions; returns `nil` if not found.

```plaintext
LPOS ba:l:demo c
LPOS ba:l:demo c COUNT 0
```

## Modifying and trimming

### LSET

Modifies the value of the element at a given index. Syntax `LSET key index value`. It can only overwrite an existing position — an out-of-bounds index returns `ERR index out of range`, and a missing key returns `ERR no such key`.

```plaintext
LSET ba:l:demo 0 updated
```

### LTRIM

Trims the list so that only elements within a given index range remain. Syntax `LTRIM key start stop`. Commonly paired with `LPUSH` to implement "keep only the latest N": first `LPUSH`, then `LTRIM key 0 99` — two steps that produce a fixed-length list of the most recent records.

```plaintext
LTRIM ba:l:demo 0 2
```

### LREM

Removes elements from the list that equal a given value. Syntax `LREM key count value`. A `count` greater than 0 removes `count` matches from the head; less than 0 removes |count| matches from the tail; equal to 0 removes all matching elements. Returns the actual number of elements removed.

```plaintext
LREM ba:l:demo 0 updated
```

### LINSERT

Inserts a new element to the left or right of a given element. Syntax `LINSERT key BEFORE|AFTER pivot element`. Returns -1 and makes no changes if the pivot element does not exist; returns 0 if the key does not exist.

```plaintext
LINSERT ba:l:demo BEFORE c insert-before
LINSERT ba:l:demo AFTER c insert-after
```

## Cross-list transfer and blocking

### LMOVE

Pops an element from one end of a list and atomically pushes it to one end of another list. Syntax `LMOVE source destination LEFT|RIGHT LEFT|RIGHT` (supported since Redis 6.2). Both ends can independently be left or right. This is the core command for building safe task queues: popping is a transfer, so it naturally records "in-progress" tasks. The old command `RPOPLPUSH` has been marked deprecated since 6.2 but still works; it is equivalent to `LMOVE source destination RIGHT LEFT`.

```plaintext
LMOVE ba:l:demo ba:l:done RIGHT LEFT
```

### BLPOP

The blocking version of `LPOP`. Syntax `BLPOP key [key ...] timeout`. Blocks and waits when all given lists are empty; `timeout` of 0 means wait indefinitely. The return value is an array containing the key name and the element. All consumer code that polls `LPOP` should be rewritten to use this.

```plaintext
BLPOP ba:l:demo ba:l:done 5
```

### BRPOP

The blocking version of `RPOP`. Syntax `BRPOP key [key ...] timeout`. Behaves identically to `BLPOP`, except it pops from the tail; multiple keys are checked in the order passed.

```plaintext
BRPOP ba:l:demo 5
```

## Summary

Range and locate commands (`LRANGE`, `LINDEX`, `LPOS`) solve the problem of "seeing and positioning within list contents"; `LSET`/`LTRIM`/`LREM` handle rewriting and cleanup; `LMOVE` and the blocking commands `BLPOP`/`BRPOP` are key to building reliable queues. Use `LMOVE` for all cross-list transfers — do not use `RPOPLPUSH` in new code.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
