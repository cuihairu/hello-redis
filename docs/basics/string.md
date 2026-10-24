# Redis String

## Overview

A Redis string is the most basic data type in Redis. It is binary-safe and can hold any kind of data (text, images, serialized objects, and so on). Operations on Redis strings are very efficient, and the string is Redis's default data type.

## Structure diagram

![Redis String structure](/structures/string.png)

## Common commands

### 1. **`SET`**

- **Function**: sets the value of a key
- **Syntax**: `SET key value [EX seconds] [PX milliseconds] [NX|XX]`
- **Description**:
  - `EX seconds`: sets the expiration time of the key-value pair (unit: seconds).
  - `PX milliseconds`: sets the expiration time of the key-value pair (unit: milliseconds).
  - `NX`: sets only when the key does not exist.
  - `XX`: sets only when the key exists.
- **Example**:
  ```plaintext
  SET name "Alice"
  SET session "abc123" EX 3600
  SET key "value" NX
  ```

### 2. **`GET`**

- **Function**: gets the value of a key
- **Syntax**: `GET key`
- **Description**: if the key does not exist, `nil` is returned.
- **Example**:
  ```plaintext
  GET name
  ```

### 3. **`DEL`**

- **Function**: deletes a key
- **Syntax**: `DEL key [key ...]`
- **Description**: deletes one or more keys. Non-existent keys are ignored.
- **Example**:
  ```plaintext
  DEL name
  DEL key1 key2
  ```

### 4. **`EXPIRE`**

- **Function**: sets the expiration time of a key
- **Syntax**: `EXPIRE key seconds`
- **Description**: sets the expiration time of a key (unit: seconds); the key is deleted automatically once it expires.
- **Example**:
  ```plaintext
  EXPIRE session 3600
  ```

### 5. **`TTL`**

- **Function**: gets the remaining time to live of a key
- **Syntax**: `TTL key`
- **Description**: returns the remaining time to live of a key (unit: seconds). If the key has no expiration set, `-1` is returned.
- **Example**:
  ```plaintext
  TTL session
  ```

### 6. **`APPEND`**

- **Function**: appends a value to the end of the key's existing value
- **Syntax**: `APPEND key value`
- **Description**: if the key does not exist, it is created and its value is set.
- **Example**:
  ```plaintext
  APPEND name " Smith"
  ```

### 7. **`STRLEN`**

- **Function**: gets the length of the key's value
- **Syntax**: `STRLEN key`
- **Description**: returns the length of the key's value (unit: bytes).
- **Example**:
  ```plaintext
  STRLEN name
  ```

### 8. **`GETSET`**

- **Function**: gets the old value of a key and sets a new value
- **Syntax**: `GETSET key value`
- **Description**: sets the key's value to the new value and returns the old one. Since Redis 6.2 this command has been marked deprecated; it is recommended to use `SET key value GET` instead.
- **Example**:
  ```plaintext
  GETSET name "Bob"
  ```

### 9. **`MSET`**

- **Function**: sets multiple key-value pairs at once
- **Syntax**: `MSET key1 value1 [key2 value2 ...]`
- **Description**: sets multiple key-value pairs at the same time; all keys' values are set.
- **Example**:
  ```plaintext
  MSET key1 "value1" key2 "value2"
  ```

### 10. **`MGET`**

- **Function**: gets the values of multiple keys
- **Syntax**: `MGET key1 [key2 ...]`
- **Description**: gets the values of one or more keys.
- **Example**:
  ```plaintext
  MGET key1 key2
  ```

### 11. **`PSETEX`**

- **Function**: sets the value of a key and sets the expiration time (unit: milliseconds)
- **Syntax**: `PSETEX key milliseconds value`
- **Description**: sets the key's value and lets it expire after the given time (unit: milliseconds). Since Redis 6.2 this command has been marked deprecated; it is recommended to use `SET key value PX milliseconds` instead.
- **Example**:
  ```plaintext
  PSETEX temp_key 5000 "temporary"
  ```

### 12. **`SETRANGE`**

- **Function**: sets part of the key's value by offset
- **Syntax**: `SETRANGE key offset value`
- **Description**: sets part of the key's value starting at the given offset. If the offset exceeds the length of the current value, zero bytes are inserted between the offset and the value.
- **Example**:
  ```plaintext
  SETRANGE key 10 "new_value"
  ```

### 13. **`GETRANGE`**

- **Function**: gets a substring of the key's value
- **Syntax**: `GETRANGE key start end`
- **Description**: gets the substring of the key's value in the specified range.
- **Example**:
  ```plaintext
  GETRANGE key 0 5
  ```

## Example operations

```plaintext
# Set a key-value pair
SET user:1000 "Alice"

# Get a key-value pair
GET user:1000

# Append a value to an existing key
APPEND user:1000 " Smith"

# Set multiple key-value pairs
MSET user:1001 "Bob" user:1002 "Charlie"

# Get the values of multiple keys
MGET user:1001 user:1002

# Set the expiration time of a key
EXPIRE user:1000 3600

# Get the remaining time to live of a key
TTL user:1000

# Set the value of a key and get the old value (since 6.2, GETSET is replaced by this form)
SET user:1000 "David" GET

# Get the length of the key's value
STRLEN user:1000

# Set part of the key's value
SETRANGE user:1000 10 "new_value"

# Get a substring of the key's value
GETRANGE user:1000 0 5
```

## Features

- **Binary-safe**: can store text, numbers, images, serialized objects, up to 512MB max.
- **Atomic counters**: integer values support `INCR` / `DECR` / `INCRBY`, single-threading guarantees atomicity.
- **Conditional writes**: `NX` (set only if not exists) and `XX` (set only if exists) combine with expiration to implement locks and placeholders.
- **Underlying SDS**: dynamic strings record their length, so `STRLEN` is O(1), and pre-allocation reduces resize copies.
- **Expiration**: key-level TTL (`EXPIRE` / `PSETEX`), reclaimed by lazy deletion plus periodic deletion once the time arrives.

## Use cases

```plaintext
# 1. Cache: object JSON / session token
SET user:1001:profile '{"name":"Alice","age":28}' EX 600
GET  user:1001:profile

# 2. Counter: page views (atomic increment)
INCR page:home:pv

# 3. Distributed lock: set only if not exists + 5 second expiration
SET lock:order:10086 1 NX PX 5000

# 4. Auto-increment ID: number generator
INCRBY order:id 100
```

## Summary

Redis strings are the most basic and most commonly used data type in Redis, supporting a variety of efficient operations. They are suitable for many scenarios, such as caching and counters. These basic operations cover the common uses of Redis strings in storage and processing.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis development docs · Strings](https://redis.io/docs/latest/develop/data-types/strings/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [knowledge](/knowledge.md)
