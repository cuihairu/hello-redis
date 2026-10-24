# Basic Lua scripting commands

When using Lua scripts in Redis, a few basic commands matter most: they execute scripts, load scripts, and manage the script cache. These commands support the flexibility and efficiency of Lua scripting.

## EVAL command

The `EVAL` command is the core command for running Lua scripts. It passes a Lua script directly to Redis and executes it immediately.

### Syntax

```bash
EVAL script numkeys key [key ...] arg [arg ...]
```

- `script`: the Lua script to execute, provided as a string.
- `numkeys`: the number of key names passed to the script.
- `key [key ...]`: the Redis key names passed to the script.
- `arg [arg ...]`: the arguments passed to the script.

### Examples

```bash
EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 mykey myvalue
```

This command uses a Lua script to set the value of the key `mykey` to `myvalue`.

## EVALSHA command

The `EVALSHA` command works like `EVAL`, but it executes the script by its SHA1 hash. This is very efficient for scripts that run frequently, because the script only needs to be loaded once and can then be executed many times.

### Syntax

```bash
EVALSHA sha1 numkeys key [key ...] arg [arg ...]
```

- `sha1`: the SHA1 hash of the preloaded script.
- `numkeys`: the number of key names passed to the script.
- `key [key ...]`: the Redis key names passed to the script.
- `arg [arg ...]`: the arguments passed to the script.

### Examples

First load the script from the previous section with `SCRIPT LOAD` and get its SHA1 checksum (`d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37`), then execute:

```bash
EVALSHA d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37 1 mykey myvalue
```

This command runs the preloaded script whose SHA1 is `d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37`. If that script has not been loaded, Redis returns the error `NOSCRIPT No matching script. Please use EVAL.`

## SCRIPT LOAD command

The `SCRIPT LOAD` command loads a Lua script into the Redis cache and returns the script's SHA1 hash. Preloading scripts with `SCRIPT LOAD` lets you later execute them with the `EVALSHA` command.

### Syntax

```bash
SCRIPT LOAD script
```

- `script`: the Lua script to load.

### Examples

```bash
SCRIPT LOAD "return redis.call('SET', KEYS[1], ARGV[1])"
```

This command loads the script into the Redis cache and returns the script's SHA1 hash.

## SCRIPT EXISTS command

The `SCRIPT EXISTS` command checks whether a script with a given SHA1 hash exists in the Redis cache.

### Syntax

```bash
SCRIPT EXISTS sha1 [sha1 ...]
```

- `sha1 [sha1 ...]`: the SHA1 hash values of the scripts to check.

### Examples

```bash
SCRIPT EXISTS d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37
```

This command checks whether the cache holds a script with SHA1 `d8f2fad9f8e86a53d2a6ebd960b33c4972cacc37`; when loaded, it returns `1) (integer) 1`.

## SCRIPT FLUSH command

The `SCRIPT FLUSH` command clears all Lua scripts from the Redis cache. This command is very useful when loaded scripts are no longer needed.

### Syntax

```bash
SCRIPT FLUSH
```

### Examples

```bash
SCRIPT FLUSH
```

This command clears the cache for all loaded Lua scripts.

With these basic commands you can use Lua scripts in Redis flexibly to implement complex data operations and logic. The sections that follow go further into Lua scripting tips and debugging techniques.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

## Related pages

- [README](README.md)
- [eval](eval.md)
- [overview](overview.md)
- [writing-tips](writing-tips.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [eval](eval.md)
- [overview](overview.md)
- [writing-tips](writing-tips.md)
