# Other HyperLogLog commands

There are only three HyperLogLog-related commands: `PFADD` handles writes, `PFCOUNT` reads the cardinality estimate, and the remaining `PFMERGE` merges multiple HyperLogLogs into one. The `PF` verb prefix on all three commands comes from the initials of HyperLogLog's inventor, Philippe Flajolet.

## PFMERGE

Merges one or more source HyperLogLogs into a destination key. Syntax `PFMERGE destkey sourcekey [sourcekey ...]`, time complexity O(N), where N is the number of keys taking part in the merge. Returns the status reply `OK`. The merged key is equivalent to a HyperLogLog that contains "all source elements put together". If the destination key does not exist, it is created automatically; the destination key may be the same as one of the source keys, in which case the other sources are merged into it. The merge result is independent of the order in which individual `PFADD` calls were made.

## Examples

The following commands can be run directly in `redis-cli`; the comments show the actual return values:

```plaintext
# Prepare two HyperLogLogs; u1 appears in both keys
PFADD bb:hll:uv u1 u2 u3
# (integer) 1
PFADD bb:hll:uv2 u1 u5 u6
# (integer) 1

# Merge into a new key
PFMERGE bb:hll:merged bb:hll:uv bb:hll:uv2
# OK

# The merged cardinality equals the cardinality of the union; the duplicate u1 counts only once
PFCOUNT bb:hll:merged
# (integer) 5

# The merge result does not depend on which key the data lives in; you can also merge just one source key
PFMERGE bb:hll:copy bb:hll:uv
# OK
PFCOUNT bb:hll:copy
# (integer) 3
```

## PFMERGE vs. multi-key PFCOUNT

- If you only want to see "how many distinct elements are there in total", using the multi-key form `PFCOUNT key1 key2` directly is simpler: the result matches counting after a `PFMERGE`, and it does not create a new key.
- When the merged result needs to be read repeatedly, or you want to make it permanent (for example, merging daily totals into monthly data), using `PFMERGE` to produce a proper key is more appropriate.
- `PFMERGE` is a write command, while multi-key `PFCOUNT` is closer to a read command (with only minor internal cache side effects). In master-slave read-write splitting scenarios, be careful to distinguish between them.

## Summary

The HyperLogLog command set is very small and focused: `PFADD` writes, `PFCOUNT` reads, `PFMERGE` merges. Combined with its "about 12 KB of fixed memory, about 0.81% standard error" characteristics, it suits use cases like daily-active-user counting, search-term deduplication, and counting distinct visitors to an event — anything that only needs to "count how many distinct values there are".

## Related pages

- [PFADD](./pfadd.md): adds elements to a HyperLogLog.
- [PFCOUNT](./pfcount.md): reads the cardinality estimate.
- Back to the topic index: [Redis HyperLogLog](../hyperloglog.md).

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [pfadd](pfadd.md)
- [pfcount](pfcount.md)
