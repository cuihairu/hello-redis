# Redis HyperLogLog

## Overview

HyperLogLog is a data structure for estimating cardinality (the number of distinct elements), and is especially suited to scenarios with large data volumes. It works probabilistically, delivering efficient estimates for large datasets at relatively low memory cost. Redis's HyperLogLog implementation is operated through commands such as `pfadd`, `pfcount`, and `pfmerge`.

## Structure diagram

![Redis HyperLogLog structure](/structures/hyperloglog.png)

## Common commands

### 1. **`PFADD`**

- **Purpose**: add one or more elements to a HyperLogLog
- **Syntax**: `PFADD key element [element ...]`
- **Details**:
  - `key`: the HyperLogLog key
  - `element`: the element(s) to add
- **Example**:
  ```plaintext
  PFADD myhyperloglog "element1" "element2" "element3"
  ```

### 2. **`PFCOUNT`**

- **Purpose**: return the estimated number of unique elements in a HyperLogLog
- **Syntax**: `PFCOUNT key [key ...]`
- **Details**:
  - `key`: the HyperLogLog key
- **Example**:
  ```plaintext
  PFCOUNT myhyperloglog
  ```

### 3. **`PFMERGE`**

- **Purpose**: merge the data of multiple HyperLogLog keys into a new HyperLogLog key
- **Syntax**: `PFMERGE destkey sourcekey [sourcekey ...]`
- **Details**:
  - `destkey`: the merged HyperLogLog key
  - `sourcekey`: the HyperLogLog key(s) to merge
- **Example**:
  ```plaintext
  PFMERGE mergedhyperloglog myhyperloglog1 myhyperloglog2
  ```

## Example operations

```plaintext
# Add elements to a HyperLogLog
PFADD myhyperloglog "user1" "user2" "user3"

# Get the number of unique elements in a HyperLogLog
PFCOUNT myhyperloglog

# Merge multiple HyperLogLog keys into a new key
PFMERGE mergedhyperloglog myhyperloglog1 myhyperloglog2
```

## Features

- **Fixed 12KB**: writing or counting 1 million elements with `PFADD` uses the same amount of memory.
- **Probabilistic**: standard error about 0.81%, smaller in the corrected mode; counts cardinality only, does not store the elements themselves.
- **Append-only**: registers only take the maximum, so you cannot remove a single element (there is no `PFREM` semantics).
- **Mergeable**: `PFMERGE` combines multiple HLLs, equivalent to the cardinality of their union.

## Use cases

- **Website traffic statistics**: estimate the number of unique visitors, suitable for processing large-scale website data.
- **Data deduplication**: when processing traffic data, quickly estimate duplicate-free events or users.
- **Log analysis**: in large-scale log data, estimate the number of distinct log sources.
- **Social network analysis**: estimate the number of distinct users or activity volume in a social network.

```plaintext
# 1. Daily active users / unique visitors (UV) — cheaper on memory than SET
PFADD uv:2026-10-12 "user-1" "user-2" "user-1"
PFCOUNT uv:2026-10-12     # 2 (deduplicated)

# 2. Page / channel deduplicated counts
PFADD channel:weixin:2026-10 "uid-1" "uid-2"
PFADD channel:web:2026-10 "uid-2" "uid-3"
PFMERGE uv:2026-10 channel:weixin:2026-10 channel:web:2026-10
PFCOUNT uv:2026-10        # 3 (deduplicated across channels)

# 3. Real-time dedup check (error tolerated)
PFCOUNT active:hour
```

## Summary

Redis's HyperLogLog implementation provides an efficient way to estimate the number of unique elements in large datasets. Through commands such as `PFADD`, `PFCOUNT`, and `PFMERGE`, users can manage and query HyperLogLog data effectively. Thanks to its probabilistic nature, HyperLogLog keeps memory usage low even at large data volumes.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis development docs · Probabilistic](https://redis.io/docs/latest/develop/data-types/probabilistic/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](README.md)
- [other-commands](/basics/hyperloglog/other-commands.md)
- [pfadd](/basics/hyperloglog/pfadd.md)
- [pfcount](/basics/hyperloglog/pfcount.md)
