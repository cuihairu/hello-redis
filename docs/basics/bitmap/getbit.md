# GETBIT

`GETBIT` reads the bit at a given offset within the string value stored at a key, and returns the value of that bit (0 or 1). It is usually used as a pair with `SETBIT`: `SETBIT` writes a bit, and `GETBIT` queries a bit.

## Syntax

```plaintext
GETBIT key offset
```

## Parameters

- `key`: the target key.
- `offset`: the bit offset, counted from 0, ranging from `0` to `2^32 - 1`.

## Return value

The bit value at the given offset (0 or 1). Both "not readable" cases return `0` rather than raising an error:

- the key does not exist;
- the offset exceeds the string's current actual length.

## Examples

The following commands can be run directly in `redis-cli`; the comments show the measured return values:

```plaintext
# First set two bits, to make observation easier
SETBIT bb:bitmap:getbit 3 1
# (integer) 0

# Read the bit just set
GETBIT bb:bitmap:getbit 3
# (integer) 1

# Read a bit that was never set
GETBIT bb:bitmap:getbit 4
# (integer) 0

# Offset exceeds the string's actual length; still returns 0
GETBIT bb:bitmap:getbit 100
# (integer) 0

# For a missing key, every offset returns 0
GETBIT bb:bitmap:missing 5
# (integer) 0
```

`GETBIT` can also read the contents of a plain string value directly. For example, the ASCII code of the character `A` is 65, which is `01000001` in binary:

```plaintext
SET bb:bitmap:byte A
# OK
GETBIT bb:bitmap:byte 0
# (integer) 0
GETBIT bb:bitmap:byte 1
# (integer) 1
GETBIT bb:bitmap:byte 7
# (integer) 1
```

## Common errors

```plaintext
# Offset cannot be negative
GETBIT bb:bitmap:getbit -1
# (error) ERR bit offset is not an integer or out of range

# Offset must be an integer
GETBIT bb:bitmap:getbit abc
# (error) ERR bit offset is not an integer or out of range
```

## Notes

- `GETBIT` on a non-existent key always returns 0. In practice you can treat 0 as the default state, with no need to initialize it beforehand.
- `GETBIT` has O(1) time complexity; the cost of reading a single bit is the same regardless of bitmap size.
- Consistent with `SETBIT`, offset 0 corresponds to the most significant bit of the first byte.
- To count "how many bits are 1", use `BITCOUNT` instead of looping over `GETBIT`.

## Related pages

- [SETBIT](./setbit.md): set the bit at a given offset.
- &#8203;Other bitmap commands<!-- EN-LINK: ./other-commands.md -->: `BITCOUNT`, `BITOP`, `BITPOS`, `BITFIELD`, and so on.
- Back to the topic index: &#8203;Redis bitmap<!-- EN-LINK: ../bitmap.md -->.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- GETBIT (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- &#8203;other-commands<!-- EN-LINK: other-commands.md -->
- [setbit](setbit.md)
