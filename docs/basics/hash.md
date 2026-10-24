# Redis Hash

## Overview

A Redis hash is a data structure that stores fields and values as key-value pairs. Hashes are well suited to storing objects such as user information or product attributes. Each hash consists of one key (the name of the hash) and a number of field-value pairs.

## Structure diagram

![Redis Hash structure](/structures/hash.png)

## Common commands

### 1. **`HSET`**

- **Function**: sets the value of a field in a hash
- **Syntax**: `HSET key field value`
- **Description**: If the hash does not exist, a new one is created. If the field already exists, the old value is overwritten.
- **Example**:
  ```plaintext
  HSET user:1000 name "Alice"
  HSET user:1000 age 30
  ```

### 2. **`HGET`**

- **Function**: gets the value of a specified field in a hash
- **Syntax**: `HGET key field`
- **Description**: If the field does not exist, `nil` is returned.
- **Example**:
  ```plaintext
  HGET user:1000 name
  ```

### 3. **`HDEL`**

- **Function**: deletes specified fields from a hash
- **Syntax**: `HDEL key field [field ...]`
- **Description**: Deletes one or more fields. If a field does not exist, it is ignored.
- **Example**:
  ```plaintext
  HDEL user:1000 age
  ```

### 4. **`HGETALL`**

- **Function**: gets all fields and their values in a hash
- **Syntax**: `HGETALL key`
- **Description**: Returns all fields in the hash along with their corresponding values.
- **Example**:
  ```plaintext
  HGETALL user:1000
  ```

### 5. **`HKEYS`**

- **Function**: gets the names of all fields in a hash
- **Syntax**: `HKEYS key`
- **Description**: Returns the names of all fields in the hash.
- **Example**:
  ```plaintext
  HKEYS user:1000
  ```

### 6. **`HVALS`**

- **Function**: gets the values of all fields in a hash
- **Syntax**: `HVALS key`
- **Description**: Returns the values of all fields in the hash.
- **Example**:
  ```plaintext
  HVALS user:1000
  ```

### 7. **`HLEN`**

- **Function**: gets the number of fields in a hash
- **Syntax**: `HLEN key`
- **Description**: Returns the number of fields in the hash.
- **Example**:
  ```plaintext
  HLEN user:1000
  ```

### 8. **`HINCRBY`**

- **Function**: increments the integer value of a specified field in a hash
- **Syntax**: `HINCRBY key field increment`
- **Description**: If the field does not exist, it is created with the value set to `increment`. Negative numbers are supported.
- **Example**:
  ```plaintext
  HINCRBY user:1000 age 1
  ```

### 9. **`HMSET`**

- **Function**: sets the values of multiple fields in a hash at the same time
- **Syntax**: `HMSET key field1 value1 [field2 value2 ...]`
- **Description**: Sets the values of multiple fields in one call. This command has been marked deprecated since Redis 4.0; it is recommended to use `HSET key field1 value1 [field2 value2 ...]` instead (`HSET` itself supports setting multiple fields at once).
- **Example**:
  ```plaintext
  HMSET user:1000 name "Alice" age 30
  ```

### 10. **`HMGET`**

- **Function**: gets the values of multiple fields in a hash
- **Syntax**: `HMGET key field1 [field2 ...]`
- **Description**: Gets the values of one or more fields.
- **Example**:
  ```plaintext
  HMGET user:1000 name age
  ```

### 11. **`HSCAN`**

- **Function**: iterates over the fields and values in a hash
- **Syntax**: `HSCAN key cursor [MATCH pattern] [COUNT count]`
- **Description**: Used to iterate over the fields in a hash; supports pattern matching and limiting the number of fields returned.
- **Example**:
  ```plaintext
  HSCAN user:1000 0 MATCH name*
  ```

## Example operations

```plaintext
# Set the value of a hash field
HSET user:1000 name "Alice"
HSET user:1000 age 30

# Get the value of a hash field
HGET user:1000 name

# Delete a field from a hash
HDEL user:1000 age

# Get all fields and values in a hash
HGETALL user:1000

# Get all field names in a hash
HKEYS user:1000

# Get all field values in a hash
HVALS user:1000

# Get the number of fields in a hash
HLEN user:1000

# Increment the integer value of a specified field in a hash
HINCRBY user:1000 age 1

# Set the values of multiple fields in a hash at the same time
HSET user:1000 name "Alice" age 30

# Get the values of multiple fields in a hash
HMGET user:1000 name age

# Iterate over the fields and values in a hash
HSCAN user:1000 0 MATCH name*
```

## Characteristics

- **Field-level reads and writes**: `HGET`/`HSET` fetch only the fields you need, which saves bandwidth compared to reading an entire JSON object.
- **Unique, unordered fields**: fields under the same key cannot be duplicated, and iteration order is not guaranteed.
- **Compact memory**: small hashes (field count ≤ `hash-max-listpack-entries`, default 128) use listpack encoding, which is more memory-efficient than storing JSON as a string.
- **Field increment**: `HINCRBY` atomically adds or subtracts on a single field.
- **No partial expiry**: expiry is at the key level; you cannot set a TTL on an individual field.

## Use cases

```plaintext
# 1. Object storage: a single field can be changed without rewriting the whole object
HSET user:1001 name Alice
HSET user:1001 email alice@example.com
HGET user:1001 email

# 2. Shopping cart: count product quantities with fields
HSET cart:u1001 sku:1001 2
HINCRBY cart:u1001 sku:1001 1   # buy one more

# 3. Configuration set: read a partial configuration by field
HGETALL app:config
```

## Summary

Redis hashes are a very flexible data structure, suitable for storing and manipulating complex object data. When I store object fields in a hash, the commonly used operations and access patterns are described below.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis development docs · Hashes](https://redis.io/docs/latest/develop/data-types/hashes/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](README.md)
