# Other stream commands

Beyond `XADD` and `XREAD`, streams also offer three families of commands: query commands for browsing and counting stream contents, trim commands to control stream length, and consumer groups that let multiple consumers cooperate on the same stream to realize the semantics of "an entry is processed only once".

## Querying and trimming

### XLEN

Returns the number of entries in the stream. Syntax `XLEN key`; returns 0 when the stream does not exist.

### XRANGE / XREVRANGE

Read entries by ID range. Syntax `XRANGE key start end [COUNT count]`; `XREVRANGE` is the reverse-order variant. The special ID `-` denotes the smallest ID and `+` the largest, and the range is closed.

### XDEL

Delete entries by specified ID. Syntax `XDEL key id [id ...]`; returns the number actually deleted.

### XTRIM

Trim the stream by length or minimum ID. Syntax `XTRIM key MAXLEN|MINID [=|~] threshold [LIMIT count]`; returns the number of entries deleted. `~` means approximate trimming, allowing the actual result to slightly exceed the threshold (in practice, very small streams may not be trimmed at all).

Suppose the stream `bb:stream:mq` already has entries `1-1`, `1-2`, `1-3`. The following are measured results:

```plaintext
XLEN bb:stream:mq
# (integer) 3
XRANGE bb:stream:mq - +
# 1) 1) "1-1"
#    2) 1) "task"
#       2) "t1"
# ... (3 entries in total)
XRANGE bb:stream:mq 1-2 +
# 1) 1) "1-2" ...
# 2) 1) "1-3" ...
XREVRANGE bb:stream:mq + - COUNT 2
# 1) 1) "1-3" ...
# 2) 1) "1-2" ...
XDEL bb:stream:mq 1-2
# (integer) 1
XTRIM bb:stream:mq MAXLEN 2
# (integer) 1
XLEN bb:stream:mq
# (integer) 2
```

## Consumer groups

### XGROUP CREATE

Create a consumer group. Syntax `XGROUP CREATE key group id [MKSTREAM]`. A starting ID of `0` means start from the first entry; `$` means consume only new entries; `MKSTREAM` auto-creates the stream if it does not exist.

### XREADGROUP

Read as a consumer. Syntax `XREADGROUP GROUP group consumer [COUNT n] STREAMS key id`. `>` means fetch only new entries that have never been delivered; entries read this way enter that consumer's pending entries list (PEL).

### XPENDING

Inspect pending entries. Syntax `XPENDING key group [start end count]`. The extended form writes the start/end IDs and count directly, without a `COUNT` keyword.

### XACK

Acknowledge that an entry has been processed. Syntax `XACK key group id [id ...]`; after acknowledgement the entry is removed from the pending list.

### XAUTOCLAIM

Transfer entries that have been idle beyond a threshold to a specified consumer. Syntax `XAUTOCLAIM key group consumer min-idle start [COUNT n]`; used to take over tasks left behind by a failed consumer.

### XINFO GROUPS / XINFO STREAM

Inspect the internal state of groups and streams; commonly used for operational troubleshooting.

Consumer groups implement the semantics of "an entry is delivered to only one consumer within the group": entries must be acknowledged after reading, and unacknowledged entries can be claimed and retried by other consumers. The flow below continues to use `bb:stream:mq` (entries `1-3`, `1-4`); comments show measured results:

```plaintext
XGROUP CREATE bb:stream:mq bb:workers 0
# OK
XREADGROUP GROUP bb:workers alice COUNT 1 STREAMS bb:stream:mq >
# 1) 1) "bb:stream:mq"
#    2) 1) 1) "1-3"
#          2) 1) "task"
#             2) "t3"
XREADGROUP GROUP bb:workers bob COUNT 1 STREAMS bb:stream:mq >
# 1) 1) "bb:stream:mq"
#    2) 1) 1) "1-4"
#          2) 1) "task"
#             2) "t4"
XPENDING bb:stream:mq bb:workers
# 1) (integer) 2
# 2) "1-3"
# 3) "1-4"
# 4) 1) 1) "alice"  2) "1"
#    2) 1) "bob"    2) "1"
XPENDING bb:stream:mq bb:workers - + 10
# 1) 1) "1-3"
#    2) "alice"
#    3) (integer) 66     # idle milliseconds
#    4) (integer) 1      # number of deliveries
# ... (1-4 belongs to bob)
XACK bb:stream:mq bb:workers 1-3
# (integer) 1
XAUTOCLAIM bb:stream:mq bb:workers alice 0 0-0 COUNT 10
# 1) "0-0"                # start point for the next scan
# 2) 1) 1) "1-4"          # alice claimed the unacknowledged entry from bob
#       2) 1) "task"
#          2) "t4"
# 3) (empty array)        # deleted entries found in this pass
XINFO GROUPS bb:stream:mq
# 1)  1) "name"       2) "bb:workers"
#     3) "consumers"  4) (integer) 2
# ... (plus fields such as pending and last-delivered-id)
XINFO STREAM bb:stream:mq
#  1) "length"
#  2) (integer) 2
# ...
```

## Notes

- `XREADGROUP` does not remove entries that have been read; they leave the pending list only after `XACK`. On processing failure, use `XAUTOCLAIM` or `XCLAIM` to hand them to another consumer for retry.
- Entries deleted by `XDEL` or `XTRIM` remain in the pending list; the consumer side must handle the "entry already deleted" case.
- Reading from a non-existent group reports a `NOGROUP` error; ensure the group exists at service startup.

## Related pages

- [XADD](./xadd.md): append entries to the stream.
- [XREAD](./xread.md): read entries from the stream.
- Back to the topic index: [Redis Streams](../streams.md).

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [xadd](xadd.md)
- [xread](xread.md)
