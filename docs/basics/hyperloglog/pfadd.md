# PFADD

`PFADD` adds elements to a HyperLogLog. HyperLogLog is a probabilistic data structure that records only the statistical property of "which distinct elements have appeared" and does not store the elements themselves, so it can estimate the cardinality (number of unique elements) of datasets in the hundreds of millions with a fixed ~12KB of memory.

`PFADD` is the write entry point for HyperLogLog: the key is created automatically if it does not exist, and elements are hashed to update the internal registers.

## Syntax

```plaintext
PFADD key [element [element ...]]
```

## Parameters

- `key`: the HyperLogLog key. Although it is stored as a string at the bottom layer, it can only be read and written through HyperLogLog commands.
- `element`: the element(s) to add. Each can be any string, and you can add several at once; you can also omit them all.

## Return value

An integer. Returns 1 if this call caused at least a change in the internal registers (i.e. it may have introduced new unique elements); returns 0 if nothing changed. The return value is not "how many new elements were added" — it can only tell you whether this write may have introduced new elements.

## Examples

The following commands can be run directly in `redis-cli`; the comments show the actual return values:

```plaintext
# Add three elements; the key is created automatically
PFADD bb:hll:uv u1 u2 u3
# (integer) 1

# Add an element that already exists; the registers do not change
PFADD bb:hll:uv u1
# (integer) 0

# Add a new element
PFADD bb:hll:uv u4
# (integer) 1

# Check the current cardinality estimate
PFCOUNT bb:hll:uv
# (integer) 4

# Calling with no elements is valid and does not change the registers
PFADD bb:hll:uv
# (integer) 0
```

Running `PFADD` on a key that holds a plain string raises a type error:

```plaintext
SET bb:hll:str v
# OK
PFADD bb:hll:str a
# (error) WRONGTYPE Key is not a valid HyperLogLog string value.
```

## Notes

- HyperLogLog cannot list, delete, or test for the presence of an individual element — it only gives a cardinality estimate. Use a set (Set) if you need exact deduplication.
- The standard error is about 0.81%, so an estimate of one million may land somewhere between roughly 991900 and 1008100; that is enough for most UV statistics use cases.
- No matter how many elements you add, a HyperLogLog key takes a fixed ~12KB in the dense representation (Redis uses a more memory-efficient sparse representation for small volumes and upgrades automatically as elements accumulate).
- Element content exists only as hashed statistics, which fits counting use cases but not storing business data.

## Related pages

- [PFCOUNT](./pfcount.md): read the cardinality estimate.
- [Other HyperLogLog commands](./other-commands.md): `PFMERGE`.
- Back to the topic index: [Redis HyperLogLog](../hyperloglog.md).

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- PFADD (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [other-commands](other-commands.md)
- [pfcount](pfcount.md)
- [knowledge](/knowledge.md)
