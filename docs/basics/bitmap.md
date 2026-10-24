# Redis Bitmap

## Overview

Redis Bitmap is a data structure in Redis used to represent a large number of binary bits in a compact form. Each bit can be 0 or 1, making it ideal for representing on/off states, flags, and counters. Bitmaps achieve space efficiency by operating on individual bits, making them suitable for handling large-scale flag data.

## Structure Diagram

![Redis Bitmap structure](/structures/bitmap.png)

## Common Commands

### 1. **`SETBIT`**

- **Purpose**: Set the bit value at the specified offset in the bitmap
- **Syntax**: `SETBIT key offset value`
- **Description**:
  - `offset`: bit offset, starting from 0
  - `value`: the value to set, 0 or 1
- **Example**:
  ```plaintext
  SETBIT mybitmap 7 1
  ```

### 2. **`GETBIT`**

- **Purpose**: Get the bit value at the specified offset in the bitmap
- **Syntax**: `GETBIT key offset`
- **Description**: Returns the bit value at the specified offset, 0 or 1.
- **Example**:
  ```plaintext
  GETBIT mybitmap 7
  ```

### 3. **`BITCOUNT`**

- **Purpose**: Count the number of bits set to 1 in the bitmap
- **Syntax**: `BITCOUNT key [start end]`
- **Description**:
  - `start` and `end`: optional parameters specifying the range (in bytes) to count
- **Example**:
  ```plaintext
  BITCOUNT mybitmap
  BITCOUNT mybitmap 0 1
  ```

### 4. **`BITOP`**

- **Purpose**: Perform bitwise operations (AND, OR, XOR) on multiple bitmaps
- **Syntax**: `BITOP operation destkey key [key ...]`
- **Description**:
  - `operation`: the bitwise operation type (AND, OR, XOR, NOT)
  - `destkey`: the target key where the result is stored
- **Example**:
  ```plaintext
  BITOP AND destkey key1 key2
  BITOP OR destkey key1 key2
  BITOP XOR destkey key1 key2
  BITOP NOT destkey key
  ```

### 5. **`BITPOS`**

- **Purpose**: Find the offset of the first bit matching the specified value in the bitmap
- **Syntax**: `BITPOS key bit [start end]`
- **Description**:
  - `bit`: the value to search for (0 or 1)
  - `start` and `end`: optional parameters specifying the range (in bytes) to search
- **Example**:
  ```plaintext
  BITPOS mybitmap 1
  BITPOS mybitmap 0 0 1
  ```

## Example Operations

```plaintext
# Set bit 7 in the bitmap to 1
SETBIT mybitmap 7 1

# Get the value of bit 7 in the bitmap
GETBIT mybitmap 7

# Count the number of bits set to 1 in the bitmap
BITCOUNT mybitmap

# Perform a bitwise OR operation on multiple bitmaps, storing the result in destkey
BITOP OR destkey key1 key2

# Find the offset of the first bit set to 1 in the bitmap
BITPOS mybitmap 1
```

## Features

- **Bit-level storage**: One key holds a binary bit string, 1 bit = 1 bit, 2^32 bits ≈ 512MB.
- **Extremely memory efficient**: 1 million user check-in bits ≈ 122KB (10^6 bits ÷ 8).
- **Bitwise operations**: `BITOP` supports AND/OR/XOR/NOT, with batch operations across keys.
- **Fast statistics**: `BITCOUNT` counts the number of 1s, `BITPOS` finds the first 1.

## Use Cases

- **User behavior tracking**: Use bitmaps to record user behavior states, such as whether they logged in on a given day.
- **Ad click statistics**: Use bitmaps to record whether users clicked on ads.
- **Permission flags**: Use bitmaps to mark user permissions or access control bits.
- **Memory efficiency**: Use bitmaps to handle large amounts of binary state data, reducing memory usage.

```plaintext
# 1. Check-in: a user checks in on day N
SETBIT sign:2026:alice 285 1        # Day 286
BITCOUNT sign:2026:alice            # Check-in days this year

# 2. Daily active users: one offset per user
SETBIT dau:2026-10-12 10086 1
BITCOUNT dau:2026-10-12

# 3. Intersection of two sets: both online
BITOP AND both:online online:a online:b

# 4. Underlying array of Bloom filters (the bit array in RediSearchBloom / RedisBloom)
```

## Summary

Redis Bitmap is a memory-efficient binary data structure, ideal for storing and processing large volumes of binary flag data. Bitmap commands allow handling large amounts of binary flags and statistics with relatively little memory.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis development docs · Strings (bitmaps)](https://redis.io/docs/latest/develop/data-types/strings/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [getbit](/basics/bitmap/getbit.md)
- [other-commands](/basics/bitmap/other-commands.md)
- [setbit](/basics/bitmap/setbit.md)
