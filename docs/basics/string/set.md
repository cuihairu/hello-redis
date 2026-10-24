# SET

`SET` is the most core and most frequently used write command in Redis; it sets the value of `key` to the string `value`. Whether `key` previously held a string, a list, or a hash, `SET` overwrites it directly with a string type, so it is both a write command and a "reset" command.

## Syntax

```plaintext
SET key value [EX seconds | PX milliseconds | EXAT unix-time-seconds | PXAT unix-time-milliseconds | KEEPTTL] [NX | XX] [GET]
```

## Parameters

- `key`: the key name to set.
- `value`: the string value to write, binary-safe, up to 512 MB.
- `EX seconds`: set an expiration time in seconds.
- `PX milliseconds`: set an expiration time in milliseconds.
- `EXAT unix-time-seconds`: set an absolute Unix timestamp in seconds as the expiration time.
- `PXAT unix-time-milliseconds`: set an absolute Unix timestamp in milliseconds as the expiration time.
- `KEEPTTL`: keep the existing expiration time of `key` when overwriting the value.
- `NX`: set the value only when `key` does not exist.
- `XX`: set the value only when `key` already exists.
- `GET`: return the old value after a successful set; return `nil` when `key` did not exist (supported from Redis 6.2).

## Return value

- Returns `OK` on a successful set.
- When `NX` is used but `key` already exists, or `XX` is used but `key` does not exist, `nil` is returned and the set does not take effect.
- When `GET` is used, the old value is returned (`nil` if it did not exist).

## Examples

```plaintext
# The most basic set
SET ba:str:name Alice

# Set a value and expire it after 3600 seconds
SET ba:str:session abc123 EX 3600

# Millisecond-level expiration
SET ba:str:captcha 6688 PX 60000

# Set only when the key does not exist; the common way to write a distributed lock
SET ba:str:lock holder-1001 NX

# Update only when the key already exists; do nothing if the key does not exist
SET ba:str:name Bob XX

# Retrieve the old value while setting a new one
SET ba:str:name Carol GET

# Keep the existing expiration time while overwriting the value
SET ba:str:session new-token KEEPTTL

# Check the remaining expiration time to verify KEEPTTL took effect
TTL ba:str:session
```

## Notes

- By default, `SET` clears the existing expiration time of `key`; to preserve it, `KEEPTTL` must be used explicitly.
- `SET` overwrites a key of any type with a string type, so confirm before using `SET` on existing lists, hashes, and other data.
- `SET key value NX EX seconds` is atomic and is commonly used to implement a distributed lock; compared with the older two-step `SETNX` plus `EXPIRE` pattern, it cannot leave the intermediate state of a lock set without an expiration time.
- `NX` and `XX` are mutually exclusive; only one can be chosen.
- The functionality of the older commands `SETNX`, `SETEX`, `PSETEX`, and `GETSET` is all covered by the options of `SET` (since 6.2, `GETSET` is officially recommended to be replaced with `SET ... GET`).

## Summary

`SET` covers the majority of string-write scenarios with its rich options: plain assignment, cache writes with an expiration time, conditional writes with `NX`/`XX`, and retrieving the old value. Prefer a single `SET` command and its options over splitting the work across several older commands.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- SET (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
