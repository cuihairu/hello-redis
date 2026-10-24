# HSET

`HSET` sets the value of one or more fields in a hash. Hashes are ideal for storing objects — user profiles, product attributes, and so on — so a single key aggregates many fields instead of creating a separate string key per attribute.

## Syntax

```plaintext
HSET key field value [field value ...]
```

## Parameters

- `key`: the hash key name.
- `field`: the field name, a sub-key inside the hash.
- `value`: the value for the field, binary-safe.
- Writing multiple `field value` pairs in one call is supported (the multi-field form is available from Redis 4.0; the older command `HMSET` has been deprecated since 4.0 but still works, and is equivalent to the multi-field `HSET`).

## Return value

Returns the number of fields **newly created** by this call. Overwriting an existing field only replaces the value and is not counted.

## Examples

```plaintext
# Set a single field
HSET ba:h:user:1000 name Alice

# Set multiple fields at once
HSET ba:h:user:1000 age 30 city Hangzhou

# Overwrite an existing field; returns 0 (no new fields)
HSET ba:h:user:1000 name Bob

# Inspect the whole hash
HGETALL ba:h:user:1000

# The hash is created automatically if the key does not exist
HSET ba:h:user:1001 name Carol

# Fields and values must appear in pairs, otherwise an argument error is raised
HSET ba:h:user:1000 onlyfield

# Clean up the example keys
DEL ba:h:user:1000 ba:h:user:1001
```

## Notes

- `field value` must be given in pairs. An odd number of arguments returns `ERR wrong number of arguments for 'hset' command`.
- Running `HSET` on a non-hash key returns a `WRONGTYPE` error.
- Inside a hash, small key-value pairs use a compact encoding (listpack), which costs less memory than a separate string key per attribute. A single hash is still bounded by the overall 512 MB key-value size limit, both in field count and value size.
- To set a value only when the field does not already exist, use `HSETNX`. It returns 1 (set successfully) or 0 (field already existed, untouched).
- For numeric fields, use `HINCRBY` or `HINCRBYFLOAT` rather than `HGET` followed by `HSET`; otherwise concurrent updates will be lost.

## Summary

`HSET` is the standard write command for hashes. It supports both a single-field and a multi-field form, and returns the number of newly created fields. The older `HMSET` is deprecated; new code should use `HSET` throughout.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- HSET (no authoritative source found (to verify))

## Related pages

- [hget](hget.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [hget](hget.md)
