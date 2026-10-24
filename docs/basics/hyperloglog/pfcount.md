# PFCOUNT

`PFCOUNT` returns the cardinality estimate for one or more HyperLogLog keys — that is, "how many distinct elements have appeared". A single key returns that key's own estimate; when given multiple keys it returns the estimate of their union (equivalent to taking the union first and then counting), and it does not create or modify any key.

## Syntax

```plaintext
PFCOUNT key [key ...]
```

## Parameters

- `key`: one or more HyperLogLog keys. A non-existent key is treated as an empty HyperLogLog with a cardinality of 0.

## Return value

The cardinality estimate (an integer).

## Examples

The following commands can be run directly in `redis-cli`; the comments show the actual return values:

```plaintext
# Write some data first
PFADD bb:hll:uv u1 u2 u3
# (integer) 1
PFADD bb:hll:uv u1
# (integer) 0

# Single key: returns the deduplicated estimate; the duplicate u1 counts only once
PFCOUNT bb:hll:uv
# (integer) 3

# A non-existent key returns 0
PFCOUNT bb:hll:missing
# (integer) 0

# Multiple keys: returns the estimate of the union
PFADD bb:hll:uv2 u1 u5 u6
# (integer) 1
PFCOUNT bb:hll:uv bb:hll:uv2
# (integer) 5
```

The multi-key form handles duplicate elements across keys automatically: the result of 5 above is the cardinality of `{u1, u2, u3, u5, u6}` — `u1` appears in both keys but is counted only once. Repeating the same key does not affect the result:

```plaintext
PFCOUNT bb:hll:uv bb:hll:uv bb:hll:uv2
# (integer) 5
```

## Notes

- This is an estimate, not an exact value: the standard error is about 0.81%. Calling `PFCOUNT` repeatedly on the same data returns the same cached result and does not fluctuate.
- Single-key reads are read-only: `PFCOUNT key` does not modify the key's internal data, so it is safe to run on read-only replicas.
- Multi-key reads have side effects: the official docs explicitly note that a multi-key `PFCOUNT` may modify the internal representation of these HyperLogLogs during execution (caching intermediate results, converting encodings when necessary), so the multi-key form should not be treated as a read-only command and is not recommended on read-only replicas.
- A HyperLogLog takes a fixed ~12KB in the dense representation, and the payoff grows with the number of estimated elements; for just a few dozen elements, using a set is often better.
- A multi-key `PFCOUNT` produces the same result as `PFMERGE`ing into a temporary key and then `PFCOUNT`ing it, but the former does not persist to disk and has lower overhead.

## Related pages

- [PFADD](./pfadd.md): add elements to a HyperLogLog.
- [Other HyperLogLog commands](./other-commands.md): `PFMERGE`.
- Back to the topic index: [Redis HyperLogLog](../hyperloglog.md).

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- PFCOUNT (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [other-commands](other-commands.md)
- [pfadd](pfadd.md)
- [knowledge](/knowledge.md)
