# Redis Set

## Overview

A Redis set is an unordered data structure that can store multiple unique string values. Sets do not allow duplicate elements and provide a number of ways to operate on them. They are especially suited to scenarios that require deduplication or set operations such as intersection, union, and difference.

## Structure diagram

![Redis Set structure](/structures/set.png)

## Common commands

### 1. **`SADD`**

- **Function**: add one or more members to a set
- **Syntax**: `SADD key member [member ...]`
- **Description**: if the set does not exist, a new set is created. If the set already exists, the new members are added to it. Members that already exist are ignored.
- **Example**:
  ```plaintext
  SADD myset "apple"
  SADD myset "banana" "cherry"
  ```

### 2. **`SREM`**

- **Function**: remove one or more members from a set
- **Syntax**: `SREM key member [member ...]`
- **Description**: if a member exists in the set, it is removed. If the set does not exist, 0 is returned.
- **Example**:
  ```plaintext
  SREM myset "banana"
  ```

### 3. **`SMEMBERS`**

- **Function**: return all members in a set
- **Syntax**: `SMEMBERS key`
- **Description**: returns all members in the set. If the set is empty, an empty set is returned.
- **Example**:
  ```plaintext
  SMEMBERS myset
  ```

### 4. **`SISMEMBER`**

- **Function**: check whether a member is an element of a set
- **Syntax**: `SISMEMBER key member`
- **Description**: returns 1 if the member is in the set, otherwise 0.
- **Example**:
  ```plaintext
  SISMEMBER myset "apple"
  ```

### 5. **`SCARD`**

- **Function**: return the number of members in a set
- **Syntax**: `SCARD key`
- **Description**: returns the size of the set, that is, the number of members.
- **Example**:
  ```plaintext
  SCARD myset
  ```

### 6. **`SDIFF`**

- **Function**: return the difference of multiple sets
- **Syntax**: `SDIFF key [key ...]`
- **Description**: returns the difference between the first set and all the other sets.
- **Example**:
  ```plaintext
  SDIFF set1 set2
  ```

### 7. **`SDIFFSTORE`**

- **Function**: store the difference of multiple sets in a new set
- **Syntax**: `SDIFFSTORE destination key [key ...]`
- **Description**: stores the difference in the `destination` set.
- **Example**:
  ```plaintext
  SDIFFSTORE diffset set1 set2
  ```

### 8. **`SINTER`**

- **Function**: return the intersection of multiple sets
- **Syntax**: `SINTER key [key ...]`
- **Description**: returns the intersection of all the sets.
- **Example**:
  ```plaintext
  SINTER set1 set2
  ```

### 9. **`SINTERSTORE`**

- **Function**: store the intersection of multiple sets in a new set
- **Syntax**: `SINTERSTORE destination key [key ...]`
- **Description**: stores the intersection in the `destination` set.
- **Example**:
  ```plaintext
  SINTERSTORE interset set1 set2
  ```

### 10. **`SUNION`**

- **Function**: return the union of multiple sets
- **Syntax**: `SUNION key [key ...]`
- **Description**: returns the union of all the sets.
- **Example**:
  ```plaintext
  SUNION set1 set2
  ```

### 11. **`SUNIONSTORE`**

- **Function**: store the union of multiple sets in a new set
- **Syntax**: `SUNIONSTORE destination key [key ...]`
- **Description**: stores the union in the `destination` set.
- **Example**:
  ```plaintext
  SUNIONSTORE unionset set1 set2
  ```

### 12. **`SMOVE`**

- **Function**: move a member from one set to another
- **Syntax**: `SMOVE source destination member`
- **Description**: moves `member` from the `source` set to the `destination` set. If `member` is not in the `source` set, no action is taken.
- **Example**:
  ```plaintext
  SMOVE set1 set2 "apple"
  ```

### 13. **`SRANDMEMBER`**

- **Function**: randomly return one or more members from a set
- **Syntax**: `SRANDMEMBER key [count]`
- **Description**: returns random members from the set. If `count` is positive, the returned random members are all distinct (never more than the set size); if `count` is negative, `|count|` random members are returned, **allowing the same member to appear more than once**.
- **Example**:
  ```plaintext
  SRANDMEMBER myset
  SRANDMEMBER myset 3
  ```

### 14. **`SPOP`**

- **Function**: remove and return a random member from a set
- **Syntax**: `SPOP key [count]`
- **Description**: removes and returns one or more random members from the set. `count` must be a non-negative integer; passing a negative value returns the `ERR value is out of range, must be positive` error.
- **Example**:
  ```plaintext
  SPOP myset
  SPOP myset 2
  ```

## Example operations

```plaintext
# Add elements to a set
SADD myset "apple"
SADD myset "banana" "cherry"

# Remove elements from a set
SREM myset "banana"

# Get all members in a set
SMEMBERS myset

# Check whether an element is in the set
SISMEMBER myset "apple"

# Get the number of members in the set
SCARD myset

# Get the difference of sets
SDIFF set1 set2

# Store the difference in a new set
SDIFFSTORE diffset set1 set2

# Get the intersection of sets
SINTER set1 set2

# Store the intersection in a new set
SINTERSTORE interset set1 set2

# Get the union of sets
SUNION set1 set2

# Store the union in a new set
SUNIONSTORE unionset set1 set2

# Move an element from one set to another
SMOVE set1 set2 "apple"

# Randomly return one or more members from a set
SRANDMEMBER myset
SRANDMEMBER myset 3

# Remove and return a random member from the set
SPOP myset
SPOP myset 2
```

## Features

- **Unique and unordered**: elements are automatically deduplicated; iteration order is not guaranteed.
- **Very fast existence checks**: `SISMEMBER` is O(1), ideal for checking whether a member exists.
- **Set operations**: `SINTER` (intersection), `SUNION` (union), `SDIFF` (difference).
- **Adaptive internal storage**: small sets of pure integers use intset (contiguous memory); otherwise a hashtable.

## Use cases

```plaintext
# 1. Tags / deduplication: UV statistics
SADD uv:2026-10-12 "user-1" "user-2"
SCARD uv:2026-10-12          # Number of unique visitors

# 2. Mutual friends: set intersection
SINTER following:alice following:bob

# 3. Lottery: pick random winners without replacement
SRANDMEMBER lottery:1001 3

# 4. Blacklist / whitelist
SISMEMBER blacklist:ip "1.2.3.4"
```

## Summary

Redis sets are a powerful data structure suited to deduplication, set operations, and similar needs. These common commands cover the day-to-day management and operations on Redis sets.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis development docs · Sets](https://redis.io/docs/latest/develop/data-types/sets/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
