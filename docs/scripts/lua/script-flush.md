# SCRIPT FLUSH Command

`SCRIPT FLUSH` clears all Lua scripts from the Redis script cache. Running this command removes every loaded script from the cache, so any script currently in use gets unloaded and must be reloaded the next time it is executed.

## Syntax

```bash
SCRIPT FLUSH [ASYNC | SYNC]
```

- `ASYNC`: clear the script cache asynchronously; the command returns immediately without waiting for the background thread to finish.
- `SYNC`: clear synchronously; this is the default behavior.

## Return value

- Returns `OK` on success.

## Examples

Running `SCRIPT FLUSH` clears the Redis script cache:

```bash
SCRIPT FLUSH
```

Return value:

```bash
OK
```

## Example scenarios

Use `SCRIPT FLUSH` when you need to reset or clear all loaded scripts, for example during a large-scale update or reload of Redis scripts. Clearing the script cache ensures no stale or outdated scripts remain in the cache, avoiding potential conflicts or errors.

## Notes

- The `SCRIPT FLUSH` command deletes all scripts, not just the specified ones. This means every Lua script already loaded into the Redis script cache will be removed.
- This command is irreversible: once executed, all scripts have to be reloaded, so use it with care.

## Benefits

`SCRIPT FLUSH` provides a simple way to clear the Redis script cache, which is very useful during script management and maintenance. It ensures all old scripts in the cache are removed, giving new scripts a clean environment.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/scripts/README.md)
