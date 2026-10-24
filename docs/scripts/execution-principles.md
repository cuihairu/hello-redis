# How Scripts Execute

Redis's script execution mechanism relies on a Lua interpreter that runs script code embedded inside the Redis server. The execution model affects both operational efficiency and resource usage. Below are the execution principles I keep an eye on:

## 1. Embedded Lua Interpreter

Redis ships with a built-in Lua interpreter, which lets users run Lua scripts directly on the Redis server. This embedded interpreter has direct access to Redis commands, so a script can call any native Redis command. This embedding keeps script execution efficient and reduces the need for client interaction.

## 2. Loading and Running Scripts

Redis provides the `EVAL` and `EVALSHA` commands for loading and executing Lua scripts:

- **`EVAL`**: with `EVAL` you can execute a Lua script directly. The script body and its parameters are sent to the Redis server as part of the command, and Redis parses and executes the script in the Lua interpreter.

- **`EVALSHA`**: for efficiency, Redis lets you run an already loaded script through `EVALSHA`. `EVALSHA` takes the script's SHA1 checksum instead of the script body, which avoids re-transmitting the body and reduces network overhead.

While a script runs, Redis translates the Redis commands inside the Lua script directly into the corresponding internal Redis operations, which keeps execution efficient.

## 3. Script Atomicity

When Redis runs a script it guarantees atomicity for every Redis command inside it. The whole script executes without being interrupted by other commands, so a client sees either the state before the script or the state after it, and there is no risk of concurrent races. Note that a script does not provide rollback semantics: if it fails halfway, the write commands that already ran still take effect. This atomicity lets scripts preserve data consistency when handling complex operations.

## 4. Data Isolation

While a script runs, Redis creates an isolated Lua environment for it. This means the variables and state in one script are isolated from the others, so running one script does not directly affect other running scripts or commands. Redis also automatically cleans up temporary data in the Lua environment once the script finishes, which keeps resource management healthy.

## 5. Script Timeouts and Limits

To stop a script from consuming too many resources or getting stuck in an infinite loop, Redis enforces a threshold on script execution, specified by the `busy-reply-threshold` configuration option (default 5000 milliseconds; the older option name is `lua-time-limit`). Be aware that **Redis does not automatically kill a timed-out script**: the script keeps holding the main thread until it finishes, and while the threshold is exceeded, commands from other clients receive the `-BUSY Redis is busy running a script. You can only call SCRIPT KILL or SHUTDOWN NOSAVE.` error. Operators can use `SCRIPT KILL` to terminate a script that has not written anything yet, or `SHUTDOWN NOSAVE` to shut the server down. Redis also limits the memory usage of scripts so that no single script can exhaust the server's memory.

## 6. Script Caching and SHA1

When a user runs a script through `EVAL`, Redis caches the script body and generates a unique SHA1 checksum. The user can then use `EVALSHA` with that SHA1 value to call the cached script directly. This mechanism reduces repeated transfers of scripts and improves execution efficiency.

## 7. Data Consistency and Rollback

Although Redis guarantees script atomicity, the results of the Redis commands inside a script take effect immediately. So if a script fails halfway, the commands that already ran will not be rolled back. To handle this, whoever writes the script needs to design error-handling logic into it to keep data consistent.

## 8. Extensibility of the Lua Environment

Redis provides several built-in Lua functions and libraries that let developers do all sorts of things in scripts, such as string processing and math. In addition, developers can extend the Lua environment through Redis modules, adding custom functions and data types to open up more possibilities for scripting.

Redis script execution depends on the embedded Lua interpreter and combines atomicity, data isolation, and performance optimization. In real work, these mechanisms shape both how efficient a script is and where its security boundaries lie.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
