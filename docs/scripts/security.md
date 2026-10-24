# Script Security

When using scripting capabilities in Redis, ensuring the security of scripts is very important. Scripting capabilities can greatly improve operational efficiency, but without proper control, they may introduce some security risks. Below are the main issues related to Redis script security and corresponding best practices.

## 1. Preventing Script Injection

**Description:** Script injection attacks refer to performing unsafe operations through maliciously constructed scripts, such as tampering with data or executing unauthorized commands.

**Recommendations:**

- **Parameterize scripts:** Avoid directly embedding user input into scripts. Use parameterized methods to separate user input from script logic. For example:

  ```lua
  -- Not recommended
  local key = ARGV[1]
  redis.call("SET", key, "value")

  -- Recommended
  local key = ARGV[1]
  redis.call("SET", key, ARGV[2])
  ```

  In this example, `ARGV[2]` can be a user-provided value. Make sure to validate input values.

- **Validate and sanitize input:** Perform strict validation and sanitization of user input to ensure they do not introduce malicious code. For example, you can use regular expressions to filter illegal characters and avoid injection attacks.

## 2. Limiting Script Execution Time

**Description:** Long-running scripts can cause performance issues on a Redis instance, and may even make it unavailable.

**Recommendations:**

- **Set a timeout:** The `EVAL` command itself **does not** have a `TIMEOUT` option, so you cannot specify a timeout for an individual script. An available approach is to adjust the global configuration option `busy-reply-threshold` (default 5000 milliseconds, formerly `lua-time-limit`): once a script runs beyond this threshold, other clients receive a `BUSY` error, and `SCRIPT KILL` can then be used to terminate scripts that have not yet written data. For example:

  ```bash
  redis-cli CONFIG SET busy-reply-threshold 5000
  ```

- **Optimize scripts:** Periodically review and optimize scripts to ensure they do not suffer performance degradation due to accidental infinite loops or complex operations. Avoid performing complex computations and long-running operations in scripts.

## 3. Avoiding Unsafe Lua Features

**Description:** Some Lua features may introduce security risks, such as file operations and network access.

**Recommendations:**

- **Restrict the use of Lua libraries:** Lua scripts in Redis should avoid using the `os` library and other features that could pose security risks. Use only the safe features provided by Redis.

- **Review script code:** Before deploying scripts to production, ensure they undergo strict review to avoid introducing any unsafe operations.

## 4. Controlling Concurrent Script Execution

**Description:** Multiple clients executing scripts simultaneously may lead to resource contention and performance degradation.

**Recommendations:**

- **Avoid long-running operations:** Avoid performing long-running operations in scripts. Break complex operations into multiple simple scripts to reduce the risk of concurrent execution.

- **Use Redis locking mechanisms:** You can use Redis's locking mechanisms to control concurrent script execution and prevent multiple clients from running the same script simultaneously. For example, use `SET ... NX PX` for atomic locking:

  ```lua
  local locked = redis.call('SET', 'lock_key', 'locked', 'NX', 'PX', 10000)
  if locked then
      -- Execute the core logic of the script
      redis.call('DEL', 'lock_key')
      return 1
  end
  return 0
  ```

  `SET ... NX PX` combines "check, lock, and set expiration" into a single atomic command; the old approach of `SETNX` followed by `EXPIRE` executes in two steps, and a crash in between would leave the lock to never expire.

## Summary

Ensuring the security of Redis scripts requires following best practices: prevent script injection, limit script execution time, avoid using unsafe Lua features, and control concurrent script execution. By taking these measures, you can greatly reduce the risk of security issues introduced by scripts and ensure the safety and stability of Redis instances.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

## Related pages

- [appendix](appendix.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [appendix](appendix.md)
