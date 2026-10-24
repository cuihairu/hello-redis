# HGET

`HGET` reads the value of a single specified field in a hash. Time complexity is O(1). Use `HMGET` when you need to read several fields at once, and `HGETALL` when you need every field.

## Syntax

```plaintext
HGET key field
```

## Parameters

- `key`: the hash key name.
- `field`: the field name to read.

## Return value

- If the field exists, its value is returned.
- If the field does not exist, or if `key` itself does not exist, `nil` is returned.
- If `key` holds a non-hash type, a `WRONGTYPE` error is returned.

## Examples

```plaintext
# Prepare example data
HSET ba:h:user:1000 name Alice age 30 city Hangzhou

# Read a single field
HGET ba:h:user:1000 name

# Read a non-existent field; returns nil
HGET ba:h:user:1000 email

# Read a field of a non-existent key; also returns nil
HGET ba:h:user:9999 name

# Running HGET on a string type raises a WRONGTYPE error
SET ba:h:notahash plain
HGET ba:h:notahash anyfield

# Use HMGET for bulk reads of multiple fields
HMGET ba:h:user:1000 name age email

# Use HGETALL to read every field
HGETALL ba:h:user:1000

# Clean up the example keys
DEL ba:h:user:1000 ba:h:notahash
```

## Related commands

- `HMGET`: reads multiple fields at once; positions of missing fields come back as `nil`.
- `HGETALL`: returns all fields and values in one go — use with care on large hashes; `HSCAN` lets you iterate in batches.
- `HEXISTS`: only checks whether a field exists; does not return the value.
- `HSTRLEN`: returns the byte length of the field value without transmitting the value itself.

## Notes

- `HGET` only hits a single field. Code that loops over many `HGET` calls should be rewritten as one `HMGET` to cut network round trips.
- `nil` means both "key does not exist" and "field does not exist". If your logic needs to tell them apart, run `EXISTS` on the key first.
- Hash field names and values are both binary-safe strings; the field name itself carries no type.
- Don't use `HGET` together with `HSET` for numeric arithmetic on a field; use `HINCRBY` to keep it atomic.

## Summary

`HGET` is the single-field read command for the hash type. Its semantics mirror `GET` for strings, except for the added field dimension. Use `HMGET` for bulk reads and `HGETALL` for reading everything; the three together cover most read cases.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- HGET (no authoritative source found (to verify))

## Related pages

- [hset](hset.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [hset](hset.md)
