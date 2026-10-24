# XADD

`XADD` appends an entry to a Stream. An entry consists of a unique ID and one or more field-value pairs. `XADD` always places the new entry at the tail of the stream, so a stream is naturally ordered by time. Streams are a data structure introduced in Redis 5.0 and are commonly used as message queues, event logs, and real-time data pipelines.

## Syntax

```plaintext
XADD key [NOMKSTREAM] [MAXLEN|MINID [=|~] threshold [LIMIT count]] *|id field value [field value ...]
```

## Parameters

- `key`: the stream key. By default the key is created automatically if it does not exist.
- `NOMKSTREAM`: do not create the key when it does not exist; return nil directly.
- `MAXLEN threshold`: a trim option; after writing, trim the stream length to within `threshold`. `~` means approximate trimming (allows slightly exceeding it, with better performance).
- `MINID threshold`: a trim option; delete entries whose ID is less than `threshold`.
- `*`: let the server generate the ID automatically. The format is `millisecond-timestamp-sequence`, and within the same millisecond the sequence increments automatically, guaranteeing strict monotonic increase.
- `id`: explicitly specify the entry ID; it must be greater than the current maximum ID in the stream.
- `field value`: the field name and field value of the entry; at least one pair, multiple allowed.

## Return value

The ID of the new entry; returns nil when combined with `NOMKSTREAM` and the key does not exist.

## Examples

The following commands can be run directly in `redis-cli`; comments show measured return values:

```plaintext
# Auto-generate the ID
XADD bb:stream:orders * user u1 amount 100
# "1790907027436-0"        # formatted as millisecond-timestamp-sequence

# Explicitly specify the ID, handy for later demos with fixed IDs
XADD bb:stream:log 1-1 user u1 action login
# "1-1"
XADD bb:stream:log 1-2 user u2 action buy
# "1-2"

# Use the abbreviated millisecond-sequence form; the sequence is auto-filled with 0
XADD bb:stream:log 2-* user u3 action logout
# "2-0"
```

IDs must be strictly increasing; violations are rejected:

```plaintext
# Duplicates an existing ID
XADD bb:stream:log 1-2 user u2 action buy
# (error) ERR The ID specified in XADD is equal or smaller than the target stream top item

# Smaller than the maximum ID in the stream
XADD bb:stream:log 1-2 x y
# (error) ERR The ID specified in XADD is equal or smaller than the target stream top item

# The special ID 0-0 is always invalid
XADD bb:stream:log 0-0 x y
# (error) ERR The ID specified in XADD must be greater than 0-0

# Invalid ID format
XADD bb:stream:log abc-0 x y
# (error) ERR Invalid stream ID specified as stream command argument
```

Trim options and boundary behavior:

```plaintext
# NOMKSTREAM: do not create when the key does not exist
XADD bb:stream:nx NOMKSTREAM * a 1
# (nil)
EXISTS bb:stream:nx
# (integer) 0

# MAXLEN: keep the most recent 3 entries
XADD bb:stream:trim 1-1 n 1
XADD bb:stream:trim 1-2 n 2
XADD bb:stream:trim 1-3 n 3
XADD bb:stream:trim MAXLEN 3 1-4 n 4
# "1-4"
XLEN bb:stream:trim
# (integer) 3
XRANGE bb:stream:trim - +
# 1) 1) "1-2"
#    2) 1) "n"
#       2) "2"
# ... (1-1 has been trimmed)

# Approximate trimming: ~ allows the actual length to slightly exceed the given value, for better performance
XADD bb:stream:approx MAXLEN ~ 3 * n 1

# MINID: delete all entries whose ID is less than 1-4
XADD bb:stream:trim MINID 1-4 1-6 n 6
# "1-6"

# Running XADD on a plain string key raises a type error
SET bb:stream:str v
XADD bb:stream:str * a b
# (error) WRONGTYPE Operation against a key holding the wrong kind of value
```

## Notes

- Fields within an entry are stored in the order they are written, and fields are key-value pairs, not JSON. Avoid repeating the same field name within a single `XADD` — in practice Redis keeps multiple pairs with the same key as-is (for example `a 1 a 2` returns both pairs), which can cause ambiguity on the reader side.
- The millisecond part of an auto-generated ID comes from the server clock; if the server time rolls back, Redis still uses the "previous ID + 1" strategy to guarantee IDs keep increasing.
- Exact trimming (without `~`) can slow down writes in extreme cases; in production, prefer `MAXLEN ~` and set the threshold slightly higher than business needs.
- `XADD` only concerns writing; for reader-side concepts such as consumer groups and acknowledgement, see [Other stream commands](./other-commands.md).

## Related pages

- [XREAD](./xread.md): read entries from the stream.
- [Other stream commands](./other-commands.md): `XRANGE`, `XLEN`, consumer group commands, and more.
- Back to the topic index: [Redis Streams](../streams.md).

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- XADD (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [other-commands](other-commands.md)
- [xread](xread.md)
- [knowledge](/knowledge.md)
