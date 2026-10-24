# Redis Key Operations

Redis provides a rich set of key-operation commands for managing how data is stored, how it expires, and how it is deleted. Below are the common key-operation commands in Redis and how to use them.

## 1. **Basic key operations**

### 1.1 **Create a key**

- **SET**: set the value of a given key. If the key already exists, it is overwritten.

  ```bash
  SET key value
  ```

  Example:

  ```bash
  SET mykey "Hello"
  ```

### 1.2 **Get a key's value**

- **GET**: get the value of a given key. If the key does not exist, returns `nil`.

  ```bash
  GET key
  ```

  Example:

  ```bash
  GET mykey
  ```

### 1.3 **Delete a key**

- **DEL**: delete one or more keys. If a key does not exist, it is ignored.

  ```bash
  DEL key [key ...]
  ```

  Example:

  ```bash
  DEL mykey
  ```

### 1.4 **Check whether a key exists**

- **EXISTS**: check whether a given key exists. If the key exists, returns 1; otherwise returns 0.

  ```bash
  EXISTS key
  ```

  Example:

  ```bash
  EXISTS mykey
  ```

## 2. **Key expiration management**

### 2.1 **Set a key's expiration time**

- **EXPIRE**: set an expiration time (in seconds) for a given key. Once the expiration time is reached, the key is deleted automatically.

  ```bash
  EXPIRE key seconds
  ```

  Example:

  ```bash
  EXPIRE mykey 60
  ```

### 2.2 **View a key's remaining expiration time**

- **TTL**: view the remaining expiration time (in seconds) for a given key. There are three possible return values: `-2` if the key does not exist; `-1` if the key exists but has no expiration set; otherwise the remaining number of seconds.

  ```bash
  TTL key
  ```

  Example:

  ```bash
  TTL mykey
  ```

### 2.3 **Remove a key's expiration time**

- **PERSIST**: remove the expiration time from a given key, making it permanent.

  ```bash
  PERSIST key
  ```

  Example:

  ```bash
  PERSIST mykey
  ```

## 3. **Key types**

### 3.1 **View a key's type**

- **TYPE**: return the type of a given key. Possible return values include `string`, `list`, `set`, `zset`, and `hash`.

  ```bash
  TYPE key
  ```

  Example:

  ```bash
  TYPE mykey
  ```

### 3.2 **Number of keys**

- **DBSIZE**: return the number of keys in the current database.

  ```bash
  DBSIZE
  ```

  Example:

  ```bash
  DBSIZE
  ```

### 3.3 **Delete all keys**

- **FLUSHDB**: delete all keys in the current database.

  ```bash
  FLUSHDB
  ```

  Example:

  ```bash
  FLUSHDB
  ```

- **FLUSHALL**: delete all keys across all databases.

  ```bash
  FLUSHALL
  ```

  Example:

  ```bash
  FLUSHALL
  ```

## 4. **Key scanning**

### 4.1 **Iterate over keys in the database**

- **SCAN**: iterate over all keys in the current database incrementally. You can use the `MATCH` and `COUNT` arguments to filter and limit the results.

  ```bash
  SCAN cursor [MATCH pattern] [COUNT count]
  ```

  Example:

  ```bash
  SCAN 0 MATCH user:* COUNT 100
  ```

## Summary

Redis provides a variety of commands for managing and operating on keys, including creating, getting, and deleting keys, setting and managing expiration times, and viewing key types. With these commands, you can flexibly control how Redis data is stored and its lifecycle, to meet the needs of different applications.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- DEL (no authoritative source found (to be verified))
- EXPIRE (no authoritative source found (to be verified))
- TTL (no authoritative source found (to be verified))

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](README.md)
