# SCRIPT EXISTS Command

`SCRIPT EXISTS` checks whether the specified Lua scripts already exist in Redis's script cache. It returns an array of integers consisting of 0 and 1, indicating for each script whether it has been loaded. This command is useful for verifying script existence and for optimizing script management.

## Syntax

```bash
SCRIPT EXISTS script_sha1 [script_sha1 ...]
```

- `script_sha1`: the SHA1 checksum of the Lua script to check; you can check multiple SHA1 checksums at once.

## Return value

- An array of integers corresponding one-to-one with the SHA1 checksums passed in: `1` means present, `0` means absent.

## Examples

First load a script with `SCRIPT LOAD` and get its SHA1 checksum (for example, the checksum for the script `return redis.call('SET', KEYS[1], ARGV[1])` is `d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37`), then check it together with a randomly assembled checksum:

```bash
SCRIPT EXISTS d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37 a3b8d30a5f32e6d4b0c15c9bafab06ec4c9207e1
```

Return value:

```bash
1) (integer) 1
2) (integer) 0
```

This means the script for the first SHA1 checksum exists, while the second is not in the cache.

## Example scenarios

Use `SCRIPT EXISTS` to check the script cache before running `EVALSHA`, to avoid getting `NOSCRIPT` back because the script was not loaded.

## Notes

- The `SCRIPT EXISTS` command only checks whether scripts already exist in Redis's script cache; it does not change the cache state.
- If you have multiple scripts to check, you can pass their SHA1 checksums to `SCRIPT EXISTS` together; the command returns the existence of each script.

## Benefits

Using `SCRIPT EXISTS` lets you effectively manage and verify the existence of Redis scripts, which helps optimize the script execution flow and reduce potential errors.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/scripts/README.md)
