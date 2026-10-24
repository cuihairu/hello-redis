# XREAD

`XREAD` reads entries from one or more streams and is the most basic stream read command. It supports two typical usage patterns: reading historical data after a given ID, and listening for new entries (with optional blocking). Multiple clients can read the same stream independently of each other.

## Syntax

```plaintext
XREAD [COUNT count] [BLOCK milliseconds] STREAMS key [key ...] id [id ...]
```

## Parameters

- `COUNT count`: the maximum number of entries to return per stream.
- `BLOCK milliseconds`: blocking mode. When the target data is unavailable, the connection is suspended for up to the specified number of milliseconds; `BLOCK 0` blocks indefinitely until a new entry is read. If the parameter is omitted, the command returns immediately.
- `STREAMS`: a fixed keyword, followed by a series of stream keys and their corresponding start IDs; the number of keys must equal the number of IDs.
- `id`: the start ID; all entries **strictly greater than** that ID are returned. Two special values are commonly used:
  - `0`: start from the beginning, returning all entries in the stream (or those limited by COUNT);
  - `$`: read only entries written after the call, equivalent to "after the current maximum ID".

## Return value

A nested array of stream names and entries; returns nil when there is no readable data and the command does not block.

## Examples

First prepare a stream with two entries. The commands below can be run directly in `redis-cli`; the comments show the actual returned results:

```plaintext
XADD bb:stream:orders 1-1 user u1 amount 100
# "1-1"
XADD bb:stream:orders 1-2 user u2 amount 200
# "1-2"

# Read all entries from the beginning
XREAD COUNT 10 STREAMS bb:stream:orders 0
# 1) 1) "bb:stream:orders"
#    2) 1) 1) "1-1"
#          2) 1) "user"
#             2) "u1"
#             3) "amount"
#             4) "100"
#       2) 1) "1-2"
#          2) 1) "user"
#             2) "u2"
#             3) "amount"
#             4) "200"

# COUNT 1: take only the first entry
XREAD COUNT 1 STREAMS bb:stream:orders 0
# 1) 1) "bb:stream:orders"
#    2) 1) 1) "1-1"
#          ...

# Read after 1-1, returning only 1-2
XREAD STREAMS bb:stream:orders 1-1

# No entry newer than 1-2, returns nil immediately
XREAD STREAMS bb:stream:orders 1-2
# (nil)

# $ reads only new entries; there are no new entries now, so nil is returned
XREAD STREAMS bb:stream:orders $
# (nil)

# When the stream does not exist, nil is returned; XREAD does not create the key
XREAD STREAMS bb:stream:missing 0
# (nil)

# Read multiple streams at once, each using its own start ID
XADD bb:stream:pay 5-1 order o1 status paid
XREAD COUNT 1 STREAMS bb:stream:orders bb:stream:pay 0 0
# 1) 1) "bb:stream:orders"
#    2) 1) 1) "1-1"
#          ...
# 2) 1) "bb:stream:pay"
#    2) 1) 1) "5-1"
#          ...
```

## Blocking reads

Blocking mode is commonly used for consumer scenarios that "wait for new messages". In the first terminal run:

```plaintext
# BLOCK 0 blocks indefinitely until a new entry arrives
XREAD BLOCK 0 STREAMS bb:stream:orders $
```

The command now hangs. Then in a second terminal write a new entry:

```plaintext
XADD bb:stream:orders 1-3 user u3 amount 300
# "1-3"
```

The first terminal returns this new entry immediately:

```plaintext
1) 1) "bb:stream:orders"
   2) 1) 1) "1-3"
         2) 1) "user"
            2) "u3"
            3) "amount"
            4) "300"
```

Setting a finite blocking timeout (for example `BLOCK 200`) returns nil on timeout, which suits polling-style consumers.

## Notes

- The start point of `$` is the latest position at the time of the call: when multiple consumers all block with `$`, any entries written during the block are all readable; but if old entries are written during the gap between blocked calls and not yet read, calling with `$` again will skip them. In important scenarios you should record the ID of the last entry read.
- `XREAD` does not change stream state: it does not mark or acknowledge entries, and multiple consumers reading the same stream can all read the full data. When "one message is processed by only one consumer" is needed, use consumer groups (`XREADGROUP`).
- `BLOCK 0` holds a connection indefinitely, so the client needs reconnect logic; in connection-pool scenarios, limit the number of blocking clients.
- `COUNT` and `BLOCK` must appear before `STREAMS`; keys and IDs appear in pairs after `STREAMS`.

## Related pages

- [XADD](./xadd.md): append entries to a stream.
- [Other stream commands](./other-commands.md): `XRANGE`, consumer groups and `XREADGROUP`, among others.
- Back to the section index: [Redis streams](../streams.md).

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- XREAD (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [other-commands](other-commands.md)
- [xadd](xadd.md)
- [knowledge](/knowledge.md)
