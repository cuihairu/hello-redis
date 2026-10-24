# Redis Sorted Set

## Overview

The Redis sorted set (Sorted Set) is a data structure in Redis — an ordered set in which each member carries a score. Members are sorted by score, and members with equal scores are sorted lexicographically. Sorted sets support a number of efficient operations, such as range queries and ranking, which makes them well suited to scenarios that need to process data in order.

## Structure diagram

![Redis sorted set structure](/structures/zset.png)

## Common commands

### 1. **`ZADD`**

- **Function**: Add one or more members with their scores to a sorted set
- **Syntax**: `ZADD key [NX|XX] [CH] [INCR] score member [score member ...]`
- **Description**:
  - `NX`: Add the member only if it does not exist
  - `XX`: Update the member only if it already exists
  - `CH`: Return the number of members whose score was changed
  - `INCR`: Increment the member's score
- **Example**:
  ```plaintext
  ZADD myzset 1 "one"
  ZADD myzset 2 "two" 3 "three"
  ```

### 2. **`ZREM`**

- **Function**: Remove one or more members from a sorted set
- **Syntax**: `ZREM key member [member ...]`
- **Description**: If a member exists in the set, it is removed. If the key does not exist, 0 is returned.
- **Example**:
  ```plaintext
  ZREM myzset "two"
  ```

### 3. **`ZRANGE`**

- **Function**: Return the members of a sorted set within a specified range
- **Syntax**: `ZRANGE key start stop [WITHSCORES]`
- **Description**:
  - `start` and `stop` specify the range of members; indexing starts at 0.
  - `WITHSCORES`: Return the scores along with the members
- **Example**:
  ```plaintext
  ZRANGE myzset 0 -1
  ZRANGE myzset 0 -1 WITHSCORES
  ```

### 4. **`ZREVRANGE`**

- **Function**: Return the members of a sorted set within a specified range, sorted by score in descending order
- **Syntax**: `ZREVRANGE key start stop [WITHSCORES]`
- **Description**: Similar to `ZRANGE`, but in descending order. Deprecated since Redis 6.2; use `ZRANGE` with the `REV` option instead.
- **Example**:
  ```plaintext
  ZRANGE myzset 0 -1 REV
  ZRANGE myzset 0 -1 REV WITHSCORES
  ```

### 5. **`ZRANK`**

- **Function**: Get the rank of a member in a sorted set (low to high)
- **Syntax**: `ZRANK key member`
- **Description**: Returns the member's rank, or `nil` if the member does not exist.
- **Example**:
  ```plaintext
  ZRANK myzset "one"
  ```

### 6. **`ZREVRANK`**

- **Function**: Get the rank of a member in a sorted set (high to low)
- **Syntax**: `ZREVRANK key member`
- **Description**: Returns the member's rank, or `nil` if the member does not exist.
- **Example**:
  ```plaintext
  ZREVRANK myzset "one"
  ```

### 7. **`ZSCORE`**

- **Function**: Get the score of a member in a sorted set
- **Syntax**: `ZSCORE key member`
- **Description**: Returns the member's score, or `nil` if the member does not exist.
- **Example**:
  ```plaintext
  ZSCORE myzset "one"
  ```

### 8. **`ZCARD`**

- **Function**: Get the number of members in a sorted set
- **Syntax**: `ZCARD key`
- **Description**: Returns the number of members in the set.
- **Example**:
  ```plaintext
  ZCARD myzset
  ```

### 9. **`ZCOUNT`**

- **Function**: Count the members of a sorted set whose scores fall within a specified range
- **Syntax**: `ZCOUNT key min max`
- **Description**: Counts the members whose scores are between `min` and `max`.
- **Example**:
  ```plaintext
  ZCOUNT myzset 1 2
  ```

### 10. **`ZREMRANGEBYSCORE`**

- **Function**: Remove the members of a sorted set whose scores fall within a specified range
- **Syntax**: `ZREMRANGEBYSCORE key min max`
- **Description**: Deletes all members whose scores are between `min` and `max`.
- **Example**:
  ```plaintext
  ZREMRANGEBYSCORE myzset 1 2
  ```

### 11. **`ZREMRANGEBYRANK`**

- **Function**: Remove the members of a sorted set within a specified rank range
- **Syntax**: `ZREMRANGEBYRANK key start stop`
- **Description**: Deletes the members whose ranks are between `start` and `stop`.
- **Example**:
  ```plaintext
  ZREMRANGEBYRANK myzset 0 1
  ```

### 12. **`ZUNIONSTORE`**

- **Function**: Store the union of multiple sorted sets into a new set
- **Syntax**: `ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]`
- **Description**:
  - `WEIGHTS`: Assign a weight to each set
  - `AGGREGATE`: Specify how scores are aggregated during the merge; defaults to `SUM`
- **Example**:
  ```plaintext
  ZUNIONSTORE unionset 2 set1 set2
  ```

### 13. **`ZINTERSTORE`**

- **Function**: Store the intersection of multiple sorted sets into a new set
- **Syntax**: `ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]`
- **Description**:
  - `WEIGHTS`: Assign a weight to each set
  - `AGGREGATE`: Specify how scores are aggregated during the merge; defaults to `SUM`
- **Example**:
  ```plaintext
  ZINTERSTORE interset 2 set1 set2
  ```

## Example operations

```plaintext
# Add elements to a sorted set
ZADD myzset 1 "one"
ZADD myzset 2 "two"
ZADD myzset 3 "three"

# Remove an element from a sorted set
ZREM myzset "two"

# Get the members of a sorted set within a specified range
ZRANGE myzset 0 -1
ZRANGE myzset 0 -1 WITHSCORES

# Get a member's rank (low to high)
ZRANK myzset "one"

# Get a member's rank (high to low)
ZREVRANK myzset "one"

# Get a member's score
ZSCORE myzset "one"

# Count members within a specified score range
ZCOUNT myzset 1 3

# Remove members within a specified score range
ZREMRANGEBYSCORE myzset 1 2

# Remove members within a specified rank range
ZREMRANGEBYRANK myzset 0 1

# Store the union of multiple sorted sets into a new set
ZUNIONSTORE unionset 2 set1 set2

# Store the intersection of multiple sorted sets into a new set
ZINTERSTORE interset 2 set1 set2
```

## Features

- **Unique + ordered**: members are unique and sorted by score; score is a double.
- **Skiplist implementation**: add, remove, update, lookup, ranking, and range queries are all O(log N).
- **Range capability**: `ZRANGE` (by index), `ZRANGEBYSCORE` (by score interval), `ZCOUNT` (count within an interval).
- **Dual index**: a skiplist handles ordering, while a hashtable maps a member directly to its score.

## Use cases

```plaintext
# 1. Leaderboard
ZADD rank:game 980 "player:7"
ZREVRANGE rank:game 0 9 WITHSCORES   # Top10
ZRANK rank:game "player:7"           # rank

# 2. Delayed queue: score = execution timestamp
ZADD delay:queue 1791800000 "task-1"
ZRANGEBYSCORE delay:queue -inf 1791799999   # tasks that are due

# 3. Sliding-window rate limiting: score = timestamp, ZREMRANGEBYSCORE clears old entries
ZADD rate:api 1791799001 "req-1"
ZCOUNT rate:api (now-60 now            # number of requests within 60 seconds
```

## Summary

The Redis sorted set is a very powerful data structure, well suited to scenarios that need to process data in order, such as leaderboards and ranking systems. These common commands cover the read and write operations I use most often when working with sorted set data.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis development docs · Sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](README.md)
