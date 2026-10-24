# Common problems and debugging

When using Redis Lua scripts, you may run into some common problems. Below are some common problems and their solutions, along with techniques for debugging Lua scripts.

## Common problems

### 1. Script execution timeout

**Problem**: If a Lua script runs for too long, Redis may terminate its execution due to a script timeout. This usually leaves the script unable to complete its operation.

**Solution**: Make sure the operations in the script are as efficient as possible, and avoid long-running computations or infinite loops. If the script needs to process a large amount of data, consider splitting it into multiple smaller scripts or batch operations.

### 2. Script fails to run

**Problem**: The script may fail to run because of a syntax error or a logic error, causing Redis to return an error message.

**Solution**: Check the script's syntax and logic. Use the `redis.error_reply` function to provide detailed error information, and make sure the script returns error information promptly when something goes wrong.

```lua
if not KEYS[1] or KEYS[1] == '' then
    return redis.error_reply("Key is required")
end
```

### 3. Redis server crashes

**Problem**: In some cases, a Lua script may cause the Redis server to crash or become unstable.

**Solution**: Avoid doing too much computation or complex operations inside the script. Test scripts regularly and make sure they run stably under various conditions. If you encounter a crash problem, you can check the Redis log files for more information.

### 4. Data inconsistency

**Problem**: When using Lua scripts, you may run into data inconsistency problems, especially in concurrent environments.

**Solution**: Take advantage of Redis's transactional properties to make sure the operations in the script are atomic. Try to avoid data races or conflicts that multiple read/write operations on data inside a script could cause.

## Debugging techniques

### 1. Test with the `EVAL` command

When developing and debugging Lua scripts, you can use Redis's `EVAL` command to test scripts from the command line. This exposes script problems before deployment.

```bash
redis-cli EVAL "return redis.call('GET', 'key')" 0
```

### 2. Emit debug information

Write debug information back to Redis from inside the script to observe its intermediate state. Note that Redis's Lua sandbox **does not provide a `print` function** (calling it raises `Script attempted to access nonexistent global variable 'print'`), so you can only emit debug information by returning a result or writing to a key.

```lua
local value = redis.call("GET", KEYS[1])
redis.call("SET", "debug:info", value)
return value
```

### 3. Execute step by step

Break a complex Lua script down into several smaller scripts for testing. Once split up, it is easier to locate the problem and to verify the behavior of each part separately.

### 4. Check the Redis logs

If a script goes wrong or the Redis server crashes, checking the Redis log files can provide valuable information. The log files are usually located at the position specified in the Redis configuration file and can be used to track down the root cause.

### 5. Use `redis.pcall`

`redis.pcall` is the safe variant of `redis.call`; it catches errors returned by a command without letting the script abort. This makes it easier to catch and handle exceptions while debugging.

Note that `redis.pcall` returns two possible forms: when a command **runs normally but the result is empty** (for example, `GET` on a nonexistent key), it returns the Lua boolean `false`; only when the command **truly errors out** does it return a table with an `err` field. You must therefore check the type before accessing `err`, otherwise you get `attempt to index local 'result' (a boolean value)`.

```lua
local result = redis.pcall("GET", KEYS[1])
if type(result) == 'table' and result.err then
    return redis.error_reply("Error: " .. result.err)
end
return result
```

## Summary

Common problems with Lua scripts include execution errors and performance bottlenecks. This page records the corresponding troubleshooting methods and debugging experience.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
