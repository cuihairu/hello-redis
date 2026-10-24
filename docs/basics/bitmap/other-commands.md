# Other bitmap commands

Besides `SETBIT` and `GETBIT`, Redis also provides a family of commands built around bitmaps (the bit view of a string) for counting, locating, bitwise operations, and using a string as an integer counter. These commands let bitmaps handle more complete business needs such as check-in statistics, active-user deduplication, and permission flags.

## BITCOUNT

Count the number of bits set to 1 in a bitmap. Syntax: `BITCOUNT key [start end [BYTE|BIT]]`. Without range arguments, the whole key is counted; `start` and `end` define the range, with the default unit being bytes (BYTE) — you can pass negative numbers to count from the end; from Redis 7.0 the third argument accepts `BYTE` or `BIT`, to explicitly state whether the range is interpreted in bytes or bits.

In the following measured run, bits 0, 2, and 9 of the key are set to 1:

```plaintext
SETBIT bb:bitmap:online 0 1
SETBIT bb:bitmap:online 2 1
SETBIT bb:bitmap:online 9 1

BITCOUNT bb:bitmap:online
# (integer) 3
BITCOUNT bb:bitmap:online 0 0
# (integer) 2
BITCOUNT bb:bitmap:online 1 1
# (integer) 1
BITCOUNT bb:bitmap:online 0 -1 BYTE
# (integer) 3
BITCOUNT bb:bitmap:online 0 7 BIT
# (integer) 2
```

## BITPOS

Find the offset of the first bit equal to a given value in a bitmap. Syntax: `BITPOS key bit [start [end [BYTE|BIT]]]`. `bit` can only be 0 or 1; the optional `start` and `end` limit the search range, interpreted in bytes by default; if not found, returns -1. For a non-existent key, searching for 1 returns -1, searching for 0 returns 0 — the first 0 of an empty string is at offset 0.

```plaintext
BITPOS bb:bitmap:online 1
# (integer) 0
BITPOS bb:bitmap:online 0
# (integer) 1
BITPOS bb:bitmap:online 1 1 1
# (integer) 9
```

## BITOP

Perform a bitwise operation on one or more bitmaps, saving the result to a destination key. Syntax: `BITOP operation destkey key [key ...]`. `operation` supports `AND`, `OR`, `XOR`, `NOT`, where `NOT` can only operate on a single key; the return value is the length of the resulting string (in bytes), with shorter keys zero-padded.

```plaintext
# Bit 0 and bit 2 of bb:bitmap:d1 are 1; bit 2 of bb:bitmap:d2 is 1
BITOP AND bb:bitmap:and bb:bitmap:d1 bb:bitmap:d2
# (integer) 1        BITCOUNT bb:bitmap:and  -> 1
BITOP OR bb:bitmap:or bb:bitmap:d1 bb:bitmap:d2
# (integer) 1        BITCOUNT bb:bitmap:or   -> 2
BITOP XOR bb:bitmap:xor bb:bitmap:d1 bb:bitmap:d2
# (integer) 1        BITCOUNT bb:bitmap:xor  -> 1
BITOP NOT bb:bitmap:not bb:bitmap:d1
# (integer) 1        BITCOUNT bb:bitmap:not  -> 6
```

## BITFIELD

Read, write, and increment arbitrary bit segments of a string as signed/unsigned integers of a given type. Syntax: `BITFIELD key [GET type offset] [SET type offset value] [INCRBY type offset increment [OVERFLOW wrap|sat|fail]]`. `type` looks like `i5` (5-bit signed integer) or `u8` (8-bit unsigned integer), with a single segment up to 64 bits; `INCRBY` returns the new value after incrementing; the default overflow strategy is `WRAP` (wrap around), with `SAT` (saturate at the limit) and `FAIL` (return nil without writing) as alternatives.

```plaintext
BITFIELD bb:bitmap:bf INCRBY i5 0 14
# 1) (integer) 14
BITFIELD bb:bitmap:bf INCRBY i5 0 1
# 1) (integer) 15
BITFIELD bb:bitmap:bf INCRBY i5 0 1
# 1) (integer) -16        # A 5-bit signed integer wraps to -16 after 15
BITFIELD bb:bitmap:ovf SET u4 0 15
# 1) (integer) 0
BITFIELD bb:bitmap:ovf OVERFLOW FAIL INCRBY u4 0 1
# 1) (nil)                # On overflow returns nil, no write
BITFIELD bb:bitmap:ovf OVERFLOW SAT INCRBY u4 0 1
# 1) (integer) 15         # On overflow stays at the maximum value
BITFIELD bb:bitmap:ovf INCRBY u4 0 1
# 1) (integer) 0          # Default WRAP; 15 + 1 wraps to 0
```

## BITFIELD_RO

`BITFIELD_RO` is the read-only version of `BITFIELD`, supporting only the `GET` subcommand, and can be run safely on a read-only replica.

```plaintext
BITFIELD bb:bitmap:ro SET u8 0 202
# 1) (integer) 0
BITFIELD_RO bb:bitmap:ro GET u8 0
# 1) (integer) 202        # The same result as BITFIELD GET u8 0
```

## Summary

The bitmap commands provide complete counting and arithmetic capabilities around the bit as the smallest unit: `BITCOUNT` does the counting, `BITPOS` does the locating, `BITOP` supports logical operations across multiple bitmaps, and `BITFIELD` turns a bitmap into a compact integer array. Used together, they let you implement common needs like check-ins, deduplication, and filtering at very low memory cost.

## Related pages

- [SETBIT](./setbit.md): set the bit at a given offset.
- [GETBIT](./getbit.md): read the bit at a given offset.
- Back to the topic index: [Redis bitmap](../bitmap.md).

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [getbit](getbit.md)
- [setbit](setbit.md)
- [knowledge](/knowledge.md)
