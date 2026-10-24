# Lua scripting

Lua scripting is a way to extend Redis: it lets you run complex logic on the server and reduces the data transferred between client and server. Script execution is atomic, which suits transactions, data processing, and complex queries; keep in mind that when a script errors out, writes that were already executed are not rolled back. These notes cover the Lua scripting commands, how to write scripts, and debugging experience.

## 1. Lua scripting overview

Redis has a built-in Lua interpreter, so users can write and execute Lua scripts directly. A Lua script lets you run multiple Redis commands in a single operation, and those commands complete within one atomic operation: while the script is running, no commands from other clients are interleaved (note that if the script errors, writes already executed are not rolled back). With Lua scripts you can implement complex logic, transactional operations, and bulk data processing.

## 2. Basic commands

Redis provides a set of commands for loading, executing, and managing Lua scripts. Here are the most commonly used ones:

### 2.1 EVAL

The `EVAL` command executes a Lua script. You can type the script body directly on the command line and specify the key names and arguments to pass to the script. `EVAL` supports dynamic script execution and is the fundamental command for using Lua scripts.

### 2.2 EVALSHA

The `EVALSHA` command works much like `EVAL`, but it executes an already cached script by its SHA1 checksum instead of passing the script body. This improves execution efficiency and reduces the network transfer burden.

### 2.3 SCRIPT LOAD

The `SCRIPT LOAD` command loads a Lua script into Redis's script cache. It returns the script's SHA1 checksum, which you can then use with the `EVALSHA` command to execute the script.

### 2.4 SCRIPT EXISTS

The `SCRIPT EXISTS` command checks whether a script has already been loaded into Redis's script cache. It takes one or more SHA1 checksums as arguments and returns an integer array of 0s and 1s — 1 means the corresponding script is cached, 0 means it is not present.

### 2.5 SCRIPT FLUSH

The `SCRIPT FLUSH` command clears Redis's script cache. This removes every cached script, so after running `SCRIPT FLUSH` you need to load the scripts again.

## 3. Lua scripting tips

Writing efficient Lua scripts requires understanding the Lua API Redis provides, the script execution model, and common authoring techniques. Some common Lua scripting tips:

- **Batching**: inside a Lua script, combine as many Redis commands as possible into a single execution to cut down on network latency.
- **Error handling**: use Lua mechanisms such as `pcall` to handle errors that may occur, so that exceptions during script execution are dealt with gracefully.
- **Performance tuning**: avoid running complex computation or loops inside the script; push complex logic down into Redis's built-in commands wherever possible.

## 4. Common issues and debugging

When writing and running Lua scripts you may hit some common problems, such as script execution timeouts or excessive memory use. These notes record how to debug Lua scripts, and experience handling timeouts, memory footprint, and similar issues through configuration changes or script optimization.


## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

## Related pages

- [commands](commands.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [commands](commands.md)
