# GET

`GET` reads the string value stored at a given `key` and is the most basic read command in Redis. Its time complexity is O(1).

## Syntax

```plaintext
GET key
```

## Parameters

- `key`: the key name to read.

## Return value

- When `key` exists and its value is a string, the corresponding string value is returned.
- When `key` does not exist, `nil` is returned.
- When `key` holds something other than a string type (for example a list, hash, or set), the error `WRONGTYPE Operation against a key holding the wrong kind of value` is returned.

## Examples

```plaintext
# Write a string first
SET ba:str:greeting "Hello Redis"

# Read that string
GET ba:str:greeting

# Returns nil when the key does not exist
GET ba:str:missing

# GET on a list type raises a WRONGTYPE error
LPUSH ba:str:queue task1
GET ba:str:queue

# Clean up the example keys
DEL ba:str:greeting ba:str:missing ba:str:queue
```

## Related commands

- `MGET`: read the values of multiple keys at once, saving network round trips compared to looping over several `GET` calls.
- `GETRANGE`: read a specified substring of a string.
- `STRLEN`: read the byte length of a string.
- `SET ... GET`: retrieve the old value while writing a new one (from Redis 6.2).

## Notes

- `GET` can only read string-type keys; reading other types raises an error directly rather than returning `nil`. In application code you can confirm the key type with the `TYPE` command first.
- Redis strings are binary-safe, so what `GET` returns may contain arbitrary bytes; in redis-cli it is displayed as text.
- A single string value can be at most 512 MB; reading a very large value consumes substantial network bandwidth and client memory, so it should be avoided.
- To check whether a key exists, use the `EXISTS` command: `GET` carries read semantics, and reusing `nil` as an existence check makes the intent of client code unclear.

## Summary

`GET` is the read entry point for the string type: simple and efficient. Keep in mind that it raises a `WRONGTYPE` error on non-string types and returns `nil` for missing keys; for batch reads, use `MGET` instead.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- GET (no authoritative source found; to be verified)

## Related pages

- &#8203;other-commands<!-- EN-LINK: other-commands.md -->

<!-- BACKLINKS-AUTO -->
## Related pages

- &#8203;other-commands<!-- EN-LINK: other-commands.md -->
- [knowledge](/knowledge.md)
