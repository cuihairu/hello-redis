# Integrating Lua with Redis

Redis has a Lua interpreter built in, and scripts run server-side via the `EVAL`, `EVALSHA`, or `FCALL` commands. The key to writing correct, efficient scripts is understanding three questions: "how does a script get its input", "how does a script call Redis commands", and "how do the values of the two convert into each other".

## 1. Input parameters: KEYS and ARGV

When calling a script, the arguments on the command line are split into two parts:

- The `KEYS` array: the names of the Redis keys the script will access, corresponding to the `numkeys` parameter of the command.
- The `ARGV` array: the remaining ordinary arguments (values, limits, flags, etc.).

```bash
EVAL "return KEYS[1] .. '=' .. ARGV[1]" 1 user:1000 Alice
```

This returns `user:1000=Alice`. Note that `KEYS` must be declared explicitly, for two reasons:

1. **Cluster compatibility**: Redis Cluster requires that a script only access the keys declared in `KEYS`, otherwise the script fails to execute on the cluster.
2. **Routing basis**: in cluster mode, `KEYS` is used to determine which shard node the script should be sent to.

Bad example (passing the key name in `ARGV`):

```bash
EVAL "return redis.call('GET', ARGV[1])" 0 user:1000
```

On a single instance this command returns a result, but once you migrate to a cluster it errors out because "the script accessed an undeclared key".

## 2. Calling Redis commands: redis.call and redis.pcall

Inside a script, use `redis.call` or `redis.pcall` to execute any Redis command:

```lua
-- Set a key and return the result
redis.call('SET', KEYS[1], ARGV[1])

-- Read a hash field
local value = redis.call('HGET', KEYS[1], 'name')
return value
```

The difference between the two is **how errors are handled**:

- `redis.call`: when a command returns an error, the script is interrupted immediately and that error is returned to the client.
- `redis.pcall`: catches the error and returns a Lua table with an `err` field, so the script can continue executing.

```lua
local result = redis.pcall('GET', KEYS[1])
if type(result) == 'table' and result.err then
    -- The command errored out; you can degrade gracefully here
    return 'error: ' .. result.err
end
return result
```

## 3. Value conversion

Redis replies are converted into Lua values:

| Redis reply | Lua value |
| --- | --- |
| Integer reply | number |
| Bulk string | string |
| Multiple bulk replies | array (table); nil elements in the array become `false` |
| Status reply | table with an `ok` field, such as `{ok="OK"}` |
| Error reply | `redis.call` interrupts the script / `redis.pcall` returns a table with an `err` field |
| Empty reply (nil) | `false` |

A script's return value is likewise converted into a Redis reply:

| Lua return value | Redis reply |
| --- | --- |
| number | integer reply (decimals are truncated; `return 3.7` yields `3`) |
| string | bulk string reply |
| `true` | integer reply `1` |
| `false` | nil reply |
| Sequential array `{1,2,3}` | multiple bulk replies |
| `{ok="OK"}` | status reply `OK` |
| `{err="..."}` or calling `error()` | error reply |

So two things to keep in mind: inside a script, `redis.call('SET', ...)` yields a status table such as `{ok="OK"}`, and if you `return` it directly the client sees a status reply `OK`; when you need to return a business result, explicitly `return` the specific value. In addition, Redis replies have no floating-point type, so when you need an exact decimal you should format it into a string yourself before returning.

## 4. Atomicity and side effects of scripts

- While a script is executing, the server does not process commands from other clients, so the multiple commands inside a script behave as a single atomic operation to the outside world.
- Before Redis 7.0, a script could first run a `MULTI/EXEC` transaction to replicate the "command sequence"; now scripts always propagate via **effects replication**, meaning only the write commands produced after the script runs are replicated. `redis.replicate_commands()` is retained but no longer takes effect.
- Write operations completed by a script take effect immediately and **are not rolled back**: if a script errors out partway through, the write commands already executed still remain in effect. So validate parameters yourself inside the script — check first, then write.

```lua
-- Validate parameters first, then write, to avoid leaving dirty data after a mid-script error
if ARGV[1] == nil or ARGV[1] == '' then
    return redis.error_reply('value is required')
end
redis.call('SET', KEYS[1], ARGV[1])
return 'OK'
```

## 5. Scripts and replication

- **Single instance / master-slave**: write operations produced by script execution propagate to replicas.
- **Cluster**: all keys that need to be accessed must be placed in `KEYS` and fall in the same slot (you can force the same slot using a hash tag like `{user:1000}`).
- **Determinism of write commands**: if you need to use random numbers (`math.random`) to produce write results, call `math.randomseed` at the start of the script and record the random results, or generate the random value directly on the client and pass it in via `ARGV`.

## 6. Helper functions

- `redis.sha1hex('any string')`: returns the SHA1 hex value, useful for debugging the script cache.
- `redis.error_reply('message')` / `redis.status_reply('message')`: construct standard replies.
- `redis.setresp(3)`: switches the script to the RESP3 protocol for parsing replies, so you can obtain types such as map, double, and bool.
- `cjson.encode` / `cjson.decode`: handle JSON directly inside a script.

```bash
EVAL "return redis.sha1hex('foo')" 0
```

This returns `0beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33`.

## 7. Summary

Understand Redis as the script's "runtime": `KEYS`/`ARGV` are the function's input parameters, `redis.call` is the database access layer inside the function body, and return value conversion is the serialization boundary. Follow these four principles — "keys go through `KEYS`, values go through `ARGV`, validate before writing, keep the script short" — and you can write Lua scripts that work reliably on both single instances and clusters.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
