# Other hash commands

Beyond `HSET` and `HGET`, the hash type also has commands for bulk reads, field management, atomic counters, and more. This page lists the 11 most commonly used ones, grouped by purpose.

## Bulk reads

### HMGET

Fetches the values of multiple fields at once. Syntax `HMGET key field [field ...]`, time complexity O(N). Results are returned in the order the fields were passed; missing fields come back as `nil` at the corresponding position. Code that loops over multiple `HGET` calls should be rewritten as a single `HMGET`.

```plaintext
HMGET ba:h:user:1000 name age email
```

### HGETALL

Returns all fields and values in a hash. Syntax `HGETALL key`, time complexity O(N). The result is an array alternating "field, value, field, value"; when there are very many fields, prefer `HSCAN` to iterate in batches and avoid blocking subsequent commands with a one-shot return.

```plaintext
HGETALL ba:h:user:1000
```

## Field management

### HDEL

Deletes one or more fields. Syntax `HDEL key field [field ...]`, returning the number of fields actually deleted. Non-existent fields are ignored automatically; deleting every field also removes the key.

```plaintext
HDEL ba:h:user:1000 age city
```

### HLEN

Returns the number of fields in a hash. Syntax `HLEN key`, time complexity O(1); returns 0 when the key does not exist.

```plaintext
HLEN ba:h:user:1000
```

### HEXISTS

Checks whether a field exists. Syntax `HEXISTS key field`; returns 1 if present, 0 if not. When you only care about "is there or isn't there" and don't need the value, it uses less traffic than `HGET`.

```plaintext
HEXISTS ba:h:user:1000 name
```

### HKEYS / HVALS

`HKEYS` returns all field names, `HVALS` returns all field values; both have time complexity O(N). For large hashes, prefer `HSCAN` to avoid a one-shot return.

```plaintext
HKEYS ba:h:user:1000
HVALS ba:h:user:1000
```

## Atomic counters

### HINCRBY

Increments the integer value of a field by a given step. Syntax `HINCRBY key field increment`. If the field does not exist, it is treated as 0 first; `increment` may be negative; an error is raised if the field value is not an integer.

```plaintext
HSET ba:h:article:1 likes 10
HINCRBY ba:h:article:1 likes -3
```

### HINCRBYFLOAT

Increments the numeric value of a field by a given floating-point step. Syntax `HINCRBYFLOAT key field increment`; supports floating-point increments and returns the new value as a string.

```plaintext
HSET ba:h:account:1 balance 100
HINCRBYFLOAT ba:h:account:1 balance -10.5
```

## Conditional writes and random sampling

### HSETNX

Sets a value only if the field does not already exist. Syntax `HSETNX key field value`. Returns 1 on success, 0 if the field already exists (the original value is not overwritten). Only one field can be handled per call.

```plaintext
HSETNX ba:h:user:1000 name Alice
```

### HRANDFIELD

Returns field names or "field-value" pairs at random. Syntax `HRANDFIELD key [count [WITHVALUES]]` (available from Redis 6.2). A positive `count` returns up to that many non-duplicated fields; a negative `count` returns `|count|` fields, duplicates allowed; with `WITHVALUES`, the corresponding values are returned as well.

```plaintext
HRANDFIELD ba:h:user:1000 2 WITHVALUES
```

## Additional notes

- The older command `HMSET` has been marked deprecated since Redis 4.0 but still works; use `HSET` for multi-field writes.
- `HSCAN key cursor [MATCH pattern] [COUNT count]` incrementally iterates large hashes, with usage consistent with `SCAN`.
- Always use `HINCRBY`/`HINCRBYFLOAT` for counters on hash fields. Don't combine `HGET` with `HSET`; concurrent updates will be lost.

## Summary

These commands cover bulk reads, field deletion, existence checks, atomic counters, and random sampling for hashes. Use `HGET` for a single field, `HMGET` for multiple fields, prefer `HSCAN` for full iteration, and the `HINCRBY` family for all numeric changes.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
