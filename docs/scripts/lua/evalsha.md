# EVALSHA command

The `EVALSHA` command works like `EVAL` — it runs Lua scripts — but with one important difference: `EVALSHA` executes an already cached script by its SHA1 checksum instead of passing the script body directly. This avoids the cost of recompiling the script on every run, which improves performance.

## Syntax

```bash
EVALSHA sha1 numkeys key [key ...] arg [arg ...]
```

- `sha1`: the SHA1 checksum of the script.
- `numkeys`: the number of keys the script needs to access.
- `key [key ...]`: the list of Redis key names passed to the script.
- `arg [arg ...]`: any other arguments passed to the script.

## Examples

First load the following Lua script into Redis with `SCRIPT LOAD` and get its SHA1 checksum:

```bash
SCRIPT LOAD "return redis.call('GET', KEYS[1]) + redis.call('GET', KEYS[2])"
```

The SHA1 checksum returned by this command is `f18d3d793916e36d0190b2df2092383385a0d1a0`. Next, prepare two keys holding numbers, then run the script with `EVALSHA`:

```bash
SET key1 10
SET key2 20
EVALSHA f18d3d793916e36d0190b2df2092383385a0d1a0 2 key1 key2
```

The return value is `30`. In this example:
- `sha1` is the script's SHA1 checksum `f18d3d793916e36d0190b2df2092383385a0d1a0`.
- `numkeys` is `2`, meaning the script accesses two Redis keys.
- `key1` and `key2` are the two Redis key names passed to the script.

> Tip: the SHA1 checksum is determined uniquely by the script body. If you run the commands in this article one by one as shown, you will get the value above; any change to the script body (even a single space) produces a different checksum.

## Notes

- `EVALSHA` can only execute scripts that Redis has already cached. If the script is not cached, Redis returns the error `NOSCRIPT`; in that case you can use `EVAL` or load the script first with `SCRIPT LOAD`.
- `EVALSHA` avoids recompiling the script, so it has a significant performance advantage when the same script runs frequently.
- If the script body changes, you need to recompute the SHA1 checksum and reload the script.

## Performance comparison

Compared with `EVAL`, `EVALSHA` skips the script compilation step, which can deliver a notable performance improvement — especially when the script body is large or runs often. For the best performance, use `EVALSHA` whenever the same script needs to be called multiple times.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
- [README](/scripts/README.md)
