# Redis Streams

## Overview

Redis Streams is a new data structure introduced in Redis 5.0, designed for handling streaming data. It lets you store and process data as a time series, which makes it well suited for managing event logs, message queues, and real-time data streams. Redis Streams borrows the design philosophy of traditional message queue systems while providing powerful data access and management capabilities.

## Structure diagram

![Redis Stream structure](/structures/streams.png)

## Common commands

### 1. **`XADD`**

- **Purpose**: add a new entry to the stream
- **Syntax**: `XADD key ID field value [field value ...]`
- **Details**:
  - `key`: the stream key
  - `ID`: the entry's unique identifier (can be an auto-generated timestamp)
  - `field value`: the entry's field and value
- **Example**:
  ```plaintext
  XADD mystream * field1 value1 field2 value2
  ```

### 2. **`XRANGE`**

- **Purpose**: get entries in a specified range of the stream
- **Syntax**: `XRANGE key start end [COUNT count]`
- **Details**:
  - `key`: the stream key
  - `start`: the ID of the starting entry (can be a timestamp or a special identifier, such as `-` for the earliest entry)
  - `end`: the ID of the ending entry (can be a timestamp or a special identifier, such as `+` for the latest entry)
  - `COUNT count`: limit the number of entries returned (optional)
- **Example**:
  ```plaintext
  XRANGE mystream - +
  ```

### 3. **`XREAD`**

- **Purpose**: read data from the stream
- **Syntax**: `XREAD [BLOCK milliseconds] [COUNT count] STREAMS key [key ...] id [id ...]`
- **Details**:
  - `BLOCK milliseconds`: blocking time in milliseconds, waiting until new entries are available (optional)
  - `COUNT count`: limit the number of entries returned (optional)
  - `key`: the stream key
  - `id`: the ID of the starting entry to read from
- **Example**:
  ```plaintext
  XREAD BLOCK 5000 COUNT 10 STREAMS mystream 0
  ```

### 4. **`XDEL`**

- **Purpose**: delete specified entries from the stream
- **Syntax**: `XDEL key id [id ...]`
- **Details**:
  - `key`: the stream key
  - `id`: the ID of the entry to delete
- **Example**:
  ```plaintext
  XDEL mystream 1609459200000-0
  ```

### 5. **`XTRIM`**

- **Purpose**: trim the stream by removing old entries
- **Syntax**: `XTRIM key <MAXLEN | MINID> [= | ~] threshold [LIMIT count]`
- **Details**:
  - `key`: the stream key
  - `MAXLEN [= | ~] threshold`: trim by length, keeping only the latest `threshold` entries (`~` means approximate trimming, which is the default)
  - `MINID [= | ~] id`: trim by ID, keeping only entries whose ID is greater than or equal to the specified value
  - `LIMIT count`: limit the number of entries trimmed in this call. **Only usable with the `~` form**; otherwise it errors with `ERR syntax error, LIMIT cannot be used without the special ~ option`
- **Example**:
  ```plaintext
  XTRIM mystream MAXLEN 1000
  ```

## Example operations

```plaintext
# Add entries to the stream
XADD mystream * field1 value1 field2 value2

# Get all entries in the stream
XRANGE mystream - +

# Read data from the stream (block for 5 seconds)
XREAD BLOCK 5000 COUNT 10 STREAMS mystream 0

# Delete a specified entry from the stream
XDEL mystream 1609459200000-0

# Trim the stream, keeping only the latest 1000 records
XTRIM mystream MAXLEN 1000
```

## Features

- **Append-only log**: entries increase monotonically by ID (timestamp-sequence number); `XADD` appends to the tail in O(1).
- **Consumer groups**: `XGROUP` creates groups; each message is delivered only once within a group, and groups do not affect each other.
- **Resume-from-breakpoint reads**: `last-delivered-id` tracks progress, so `XREADGROUP` continues from the breakpoint after a restart.
- **Pending entries list (PEL)**: messages that were delivered but not yet `XACK`ed remain in the PEL and can be reassigned for retry via `XAUTOCLAIM` after a timeout.
- **Trimmable**: `XTRIM MAXLEN` bounds the length, or use `XADD MAXLEN` to trim on append.

## Use cases

- **Message queues**: use as a high-performance, persistent message queue that supports ordered message processing.
- **Real-time data streams**: store and process data streams generated in real time, such as user activity logs and sensor data.
- **Event logs**: record system events and operation logs for later analysis and auditing.
- **Distributed systems**: implement an event publish/subscribe pattern in distributed systems to propagate and process events.

```plaintext
# 1. Event stream / message queue
XADD events * type "order.created" id 10086
XREADGROUP GROUP g1 c1 COUNT 10 BLOCK 2000 STREAMS events >   # Consume new messages
XACK events g1 1791799001000-0                                 # Acknowledge consumption

# 2. Multiple independent consumer groups: group A audits, group B notifies, without interfering with each other
XGROUP CREATE events g-a 0
XGROUP CREATE events g-b 0

# 3. Resume-from-breakpoint reads + failed redelivery (PEL)
XAUTOCLAIM events g1 c2 60000 0-0                              # Claim timed-out unacknowledged messages

# 4. Cap the length to prevent bloat
XADD events MAXLEN 100000 * type "tick"
```

## Summary

Redis Streams is a powerful data structure suited for handling and managing time series data. With commands such as `XADD`, `XRANGE`, `XREAD`, `XDEL`, and `XTRIM`, users can operate on and query stream data efficiently. The high performance and flexibility of Redis Streams make it a strong fit for real-time data processing, message queues, and event logs.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis development docs · Streams](https://redis.io/docs/latest/develop/data-types/streams/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [other-commands](/basics/streams/other-commands.md)
- [xadd](/basics/streams/xadd.md)
- [xread](/basics/streams/xread.md)
