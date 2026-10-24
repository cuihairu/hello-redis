# SCRIPT LOAD Command

`SCRIPT LOAD` loads a Lua script's content into Redis and returns the script's SHA1 checksum. By using `SCRIPT LOAD`, you can preload a script into Redis's script cache, which improves execution efficiency when later using the `EVALSHA` command.

## Syntax

```bash
SCRIPT LOAD script
```

- `script`: the content of the Lua script to load.

## Examples

Suppose there is a simple Lua script:

```lua
return redis.call('SET', KEYS[1], ARGV[1])
```

You can load it into Redis with the `SCRIPT LOAD` command:

```bash
SCRIPT LOAD "return redis.call('SET', KEYS[1], ARGV[1])"
```

After it runs, Redis returns the script's SHA1 checksum:

```bash
"d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37"
```

At this point you can use the `EVALSHA` command to run this script without passing the script content again.

## Example scenarios

After using `SCRIPT LOAD`, you can call the same script multiple times using only the SHA1 checksum:

```bash
EVALSHA d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37 1 mykey myvalue
```

You can verify afterward with `GET mykey`; the key's value has been set to `myvalue`.

This is more efficient than passing the script content with `EVAL` every time, especially when the script content is large or called frequently.

## Notes

- The SHA1 checksum returned by `SCRIPT LOAD` can be used with the `EVALSHA` command, but once the script content changes, you must reload it with `SCRIPT LOAD` and get a new SHA1 checksum.
- If you try to run a script with `EVALSHA` that is not loaded or cached, Redis returns a `NOSCRIPT` error indicating the script is not yet loaded.

## Benefits

Preloading scripts and executing them by SHA1 checksum reduces network bandwidth usage and Redis's processing overhead, which yields a significant performance gain in high-frequency execution scenarios.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/scripts/README.md)
