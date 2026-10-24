# Introduction to Scripting

Redis scripting sends a program to the server to run, completing the work of several commands as a single operation inside the server. It mainly solves two problems: **the latency of multiple network round trips** and **the consistency of multi-step operations under concurrency**.

## 1. What Scripting Solves

Without scripting, a "read-check-write-back" business action has to be split into several commands and several round trips:

```bash
GET stock:1001        # read inventory
# the client checks the remaining stock
DECR stock:1001       # deduct inventory
```

Two inherent flaws: first, every command costs one RTT, so the more complex the logic, the higher the latency; second, two clients may read the same remaining stock at the same time, causing overselling or corrupted data. Scripting sends the whole block of logic to the server to execute, and while it runs Redis does not process other commands, so both problems are solved at once.

## 2. Basic Shape

The scripting language is Lua, and it runs through `EVAL`:

```bash
EVAL "local n = tonumber(redis.call('GET', KEYS[1])) if n > 0 then return redis.call('DECR', KEYS[1]) end return -1" 1 stock:1001
```

The three essentials inside a script: `KEYS` declares the array of keys to be accessed, `ARGV` carries the parameters other than key names, and `redis.call` / `redis.pcall` run Redis commands from within the script.

The two forms share the same embedded Lua engine, with identical syntax and API:

| Form | Command | Characteristics |
| --- | --- | --- |
| Lua scripts | `EVAL` / `EVALSHA` | Fire-and-run; pair with `SCRIPT LOAD` to cache the script and reuse it by SHA1 |
| Functions (7.0+) | `FUNCTION LOAD` / `FCALL` | Named and managed as libraries, replicated and persisted with the data, suited to long-term maintenance |

## 3. Core Properties

- **Atomicity**: while a script runs the server is monopolized and other clients' commands queue up waiting; concurrent clients see either the state before the script or the state after it, never an intermediate state. Multi-step logic like "check-then-set" or "deduct-then-check" can be implemented directly without a distributed lock.
- **You read stable data**: during exclusive execution the data a script reads cannot be modified concurrently, so no extra locking is needed.
- **No rollback on error**: if a script fails halfway, the write commands that already ran still take effect, so parameter validation has to happen before any writes inside the script.
- **Cache reuse**: after a script runs it is cached, and can later be executed by SHA1 through `EVALSHA` using the value returned by `SCRIPT LOAD`, which avoids re-transmitting the script body.
- **Sandboxed**: only the safe libraries shipped with Redis's embedded Lua are available — `string`, `table`, `math`, `cjson`, `cmsgpack`, `struct`, `bit`, and so on. File, network, and system calls are not allowed.

## 4. Scripting vs. Transactions (MULTI/EXEC)

| Requirement | Better-suited mechanism |
| --- | --- |
| Run a fixed batch of commands in order, with no branching needed | `MULTI` / `EXEC` transaction |
| Branching logic that reads a value and then decides what commands follow | Lua script |
| Computation, aggregation, or transformation on the server side | Lua script |
| A set of scripts to maintain long term, replicated to replicas | Functions (Redis 7.0+) |

## 5. Limits and Things to Watch

- **Declare all keys via KEYS**: this is a requirement of cluster routing and safety; do not just pass key names through ARGV.
- **Control execution time**: once a script exceeds `busy-reply-threshold` (default 5000 milliseconds), other clients receive a `BUSY` error and the only options are `SCRIPT KILL` (if the script has not written any data yet) or `SHUTDOWN NOSAVE`. Avoid full scans over large collections.
- **Use EVALSHA or Functions in production**: for scripts used often, `SCRIPT LOAD` first and then `EVALSHA`, and when the client catches a `NOSCRIPT` error it should reload and retry. Change the script body and the SHA1 checksum changes too, which requires a reload.

## 6. Typical Use Cases

- **Distributed lock release**: one script performs the "check the holder, then delete the lock" atomic operation.
- **Rate limiting**: combine `INCR` and `EXPIRE` to implement fixed-window counting.
- **Leaderboard updates**: update the score and return the new rank within a single script.
- **Inventory deduction**: read stock, check the remaining amount, deduct, and record it — all in one step.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
