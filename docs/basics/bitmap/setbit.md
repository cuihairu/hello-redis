# SETBIT

`SETBIT` sets the bit at a given offset within the string value stored at a key. A bitmap is not a standalone data type, but a bit operation built directly on top of a string: treat a string as a sequence of consecutive binary bits, and `SETBIT` sets one of them to 0 or 1.

Each bit occupies only 1 bit of memory, so `SETBIT` is well suited to recording a huge number of binary states in very little space — for example daily user check-ins, feature flags, and campaign eligibility markers.

## Syntax

```plaintext
SETBIT key offset value
```

## Parameters

- `key`: the target key. If the key does not exist, Redis first creates an empty string and then performs the bit set.
- `offset`: the bit offset, counted from 0, ranging from `0` to `2^32 - 1` (i.e. 4294967295).
- `value`: the bit value to write, which can only be `0` or `1`.

## Return value

The original bit value at that offset (0 or 1).

## Examples

The following commands can be run directly in `redis-cli`; the comments show the measured return values:

```plaintext
# Set bit 7; returns the old value; for a missing key the old value is 0
SETBIT bb:bitmap:setbit 7 1
# (integer) 0

# Then set bits 2 and 0
SETBIT bb:bitmap:setbit 2 1
# (integer) 0
SETBIT bb:bitmap:setbit 0 1
# (integer) 0

# The bitmap now has 3 bits set to 1
BITCOUNT bb:bitmap:setbit
# (integer) 3

# The whole string occupies only 1 byte (8 bits)
STRLEN bb:bitmap:setbit
# (integer) 1

# Writing the same offset again returns the previously written value 1
SETBIT bb:bitmap:setbit 7 1
# (integer) 1
```

Bit offsets within a byte are arranged in "most significant bit first" order, i.e. offset 0 is the most significant bit of the first byte:

```plaintext
SETBIT bb:bitmap:byte 1 1
# (integer) 0
SETBIT bb:bitmap:byte 2 1
# (integer) 0
GET bb:bitmap:byte
# "`"              # 0x60, i.e. binary 01100000
```

## Common errors

```plaintext
# value can only be 0 or 1
SETBIT bb:bitmap:setbit 9 5
# (error) ERR bit is not an integer or out of range

# Offset cannot be negative
SETBIT bb:bitmap:setbit -1 1
# (error) ERR bit offset is not an integer or out of range

# Offset cannot exceed 2^32 - 1
SETBIT bb:bitmap:setbit 4294967296 1
# (error) ERR bit offset is not an integer or out of range
```

## Notes

- When writing a large offset, Redis automatically extends the string to cover that offset, with all bits in between set to 0. Writing a very large offset to a non-existent key allocates hundreds of MB of memory at once — avoid this in production at all costs.
- Storing N bits takes roughly `N / 8` bytes; daily check-in markers for 100 million users need only about 12 MB.
- `SETBIT` returns the old value, which lets you tell whether a bit was set to 1 for the first time — useful for "count only once" logic.

## Related pages

- [GETBIT](./getbit.md): read the bit at a given offset.
- [Other bitmap commands](./other-commands.md): `BITCOUNT`, `BITOP`, `BITPOS`, `BITFIELD`, and so on.
- Back to the topic index: [Redis bitmap](../bitmap.md).

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- SETBIT (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [getbit](getbit.md)
- [other-commands](other-commands.md)
- [knowledge](/knowledge.md)
