# Other string commands

Beyond `SET` and `GET`, the string type also has commands for bulk reads and writes, append, counting, and substring operations. This page lists the 11 most commonly used ones, grouped by purpose.

## Bulk reads and writes

### MSET

Sets multiple key-value pairs at once. Syntax `MSET key value [key value ...]`, returns `OK`. It is atomic; all keys are set successfully together, with no partial writes.

```plaintext
MSET ba:str:k1 v1 ba:str:k2 v2
```

### MGET

Fetches the values of multiple keys at once. Syntax `MGET key [key ...]`, time complexity O(N). Results are returned in the order the keys were passed; positions for non-existent keys return `nil`. Code that loops over multiple `GET` calls should be rewritten as a single `MGET`, eliminating multiple network round trips.

```plaintext
MGET ba:str:k1 ba:str:k2 ba:str:missing
```

## Append and length

### APPEND

Appends a value to the end of an existing string. Syntax `APPEND key value`, time complexity O(1). When the key does not exist this is equivalent to `SET`; returns the total length of the string after appending.

```plaintext
APPEND ba:str:log "first;"
APPEND ba:str:log "second;"
```

### STRLEN

Returns the byte length of the string value. Syntax `STRLEN key`, time complexity O(1); returns 0 when the key does not exist. Non-ASCII characters such as Chinese are counted by their UTF-8 byte count — for example, a two-character Chinese word takes 6 bytes — so treating it as a character count yields wrong conclusions.

```plaintext
STRLEN ba:str:log
```

## Counting

### INCR

Increments an integer value by 1. Syntax `INCR key`, time complexity O(1); returns the new value after incrementing. When the key does not exist it is treated as 0 and then 1 is added; if the value is not an integer, an error is returned. This is the standard way to write counters.

```plaintext
SET ba:str:views 10
INCR ba:str:views
```

### INCRBY

Increments an integer value by a given step. Syntax `INCRBY key increment`. `increment` can be negative; the corresponding commands are `DECR` (subtract 1) and `DECRBY` (decrease by a step), with the same behavior.

```plaintext
INCRBY ba:str:views 100
DECRBY ba:str:views 20
```

### INCRBYFLOAT

Increments a numeric value by a given floating-point step. Syntax `INCRBYFLOAT key increment`; supports floating-point and scientific-notation input, and returns the new value after the calculation. Repeated accumulation can produce floating-point precision artifacts, so be careful in scenarios that require exactness, such as monetary amounts.

```plaintext
SET ba:str:price 10.5
INCRBYFLOAT ba:str:price 0.1
```

## Substring operations

### GETRANGE

Gets the substring of a string within a specified range. Syntax `GETRANGE key start end`, time complexity O(N). Indices start at 0; both `start` and `end` support negative numbers (counting from the end), and the range is inclusive of `end`.

```plaintext
SET ba:str:greeting "Hello World"
GETRANGE ba:str:greeting 0 4
GETRANGE ba:str:greeting -5 -1
```

### SETRANGE

Overwrites string content starting from a given offset. Syntax `SETRANGE key offset value`; returns the total length of the string after the modification. If the offset exceeds the original length, zero bytes are filled in between.

```plaintext
SET ba:str:greeting "Hello World"
SETRANGE ba:str:greeting 6 Redis
```

## Commands superseded by SET

### GETSET

Sets a new value and returns the old one. Syntax `GETSET key value`. Since Redis 6.2 the official recommendation is to use `SET key value GET`, which has the same effect.

```plaintext
GETSET ba:str:greeting "Hi Redis"
```

### SETNX

Sets a value only when the key does not exist. Syntax `SETNX key value`. Since Redis 2.6.12 it has been marked deprecated; new code should use `SET key value NX` uniformly. The return values differ: `SETNX` returns 1 or 0, while `SET ... NX` returns `OK` or `nil`.

```plaintext
SETNX ba:str:only-once v1
SETNX ba:str:only-once v2
```

## Summary

These commands cover the typical advanced uses of strings: `MSET`/`MGET` for bulk reads and writes to cut down on network round trips, the `INCR` family for atomic counting, and `GETRANGE`/`SETRANGE` for offset-based content manipulation. Any need for expiration times or conditional writes is handled uniformly by the options of `SET`.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

## Related pages

- [get](get.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [get](get.md)
