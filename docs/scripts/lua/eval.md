# EVAL command

The `EVAL` command is the core command for running Lua scripts in Redis. It passes a Lua script directly to Redis and executes it immediately. `EVAL` makes it convenient to run complex logic on the Redis server.

## Syntax

```bash
EVAL script numkeys key [key ...] arg [arg ...]
```

- `script`: the Lua script body to execute, passed as a string.
- `numkeys`: the number of keys the script needs to access.
- `key [key ...]`: the list of Redis key names passed to the script.
- `arg [arg ...]`: any other arguments passed to the script.

## Examples

The following example runs a simple Lua script with `EVAL` that adds the values of two Redis keys and returns the result:

```bash
SET key1 10
SET key2 20
EVAL "return redis.call('GET', KEYS[1]) + redis.call('GET', KEYS[2])" 2 key1 key2
```

The third command returns `30`. In this example:
- `script` is `"return redis.call('GET', KEYS[1]) + redis.call('GET', KEYS[2])"`, which fetches the values of `key1` and `key2` with the `redis.call` function and adds them (Lua implicitly converts the returned numeric strings to numbers).
- `numkeys` is `2`, meaning the script accesses two Redis keys.
- `key1` and `key2` are the two Redis key names passed to the script.

Note: `key1` and `key2` must already exist and hold numeric content, otherwise the script throws an error during the arithmetic (for example, `GET` returns `false` for a missing key, and adding `false` raises an error).

## Notes

- Script execution is atomic and is not interrupted by other commands while it runs.
- The `EVAL` command recompiles and re-executes the script on every call, so for scripts that run frequently, prefer the `EVALSHA` command to avoid repeated compilation.
- After a script finishes, Redis caches it automatically (the generated SHA1 can be looked up via the return value of `SCRIPT LOAD` or `EVAL`), so later `EVALSHA` calls can use it.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

## Related pages

- [commands](commands.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](/scripts/README.md)
- [commands](commands.md)
