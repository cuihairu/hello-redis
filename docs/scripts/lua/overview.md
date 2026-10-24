
# Lua scripting overview

Lua is a lightweight, efficient, embedded scripting language widely used across many programming environments. Redis has shipped a built-in Lua interpreter since version 2.6, so users can extend Redis's functionality by writing Lua scripts.

## Why Lua?

The main reasons Redis chose Lua as its scripting language are:

- **Lightweight**: Lua has a small memory footprint and executes quickly, which fits Redis's high-performance needs well.
- **Simple and easy to use**: Lua's syntax is concise, so developers can get up to speed quickly.
- **Powerful**: Lua supports multiple programming paradigms and can express complex logic.

## Redis and Lua together

In Redis, Lua scripts run on the server side and are executed with the `EVAL` or `EVALSHA` command. Lua scripts have these characteristics:

- **Atomic execution**: Lua scripts execute atomically in Redis — no commands from other clients are interleaved while the script is running. Note that if the script errors, writes already executed are not rolled back.
- **Less network overhead**: a Lua script can combine multiple commands into a single execution, reducing the number of network round trips.
- **Flexible extensibility**: Lua scripts can implement complex logic that Redis's native commands cannot do.

## Basic structure of a Lua script

In Redis, a Lua script typically includes the following parts:

- **Input arguments**: use `ARGV` to get the arguments passed to the script, and `KEYS` to get the Redis key names passed in.
- **Command execution**: use `redis.call` or `redis.pcall` to run Redis commands.
- **Return value**: a script's return value can be a number, string, array, table, and so on.

Here is a simple Lua script example:

```lua
local key = KEYS[1]
local value = ARGV[1]

-- Set the key's value and return the old value
local old_value = redis.call('GET', key)
redis.call('SET', key, value)
return old_value
```

This script shows how to update a key's value in Redis with a Lua script and return the old value.


## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

## Related pages

- [commands](commands.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [commands](commands.md)
