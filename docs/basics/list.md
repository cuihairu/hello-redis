# Redis List

## Overview

A Redis list is an ordered data structure that can store multiple string values. It is similar to a linked list, supporting insertion and deletion at both ends. Common uses for Redis lists include implementing queues, stacks, and logs.

## Structure diagram

![Redis List structure](/structures/list.png)

## Common commands

### 1. **`LPUSH`**

- **Function**: insert one or more values at the left side (head) of the list.
- **Syntax**: `LPUSH key value [value ...]`
- **Description**: if the list does not exist, a new list is created. If the list exists, the elements are inserted at the front of the list.
- **Example**:
  ```plaintext
  LPUSH mylist "hello"
  LPUSH mylist "world"
  ```

### 2. **`RPUSH`**

- **Function**: insert one or more values at the right side (tail) of the list.
- **Syntax**: `RPUSH key value [value ...]`
- **Description**: if the list does not exist, a new list is created. If the list exists, the elements are appended to the end of the list.
- **Example**:
  ```plaintext
  RPUSH mylist "foo"
  RPUSH mylist "bar"
  ```

### 3. **`LPOP`**

- **Function**: remove and return the element at the left side (head) of the list.
- **Syntax**: `LPOP key`
- **Description**: if the list is empty or does not exist, returns `nil`.
- **Example**:
  ```plaintext
  LPOP mylist
  ```

### 4. **`RPOP`**

- **Function**: remove and return the element at the right side (tail) of the list.
- **Syntax**: `RPOP key`
- **Description**: if the list is empty or does not exist, returns `nil`.
- **Example**:
  ```plaintext
  RPOP mylist
  ```

### 5. **`LRANGE`**

- **Function**: get the elements in a specified range of the list.
- **Syntax**: `LRANGE key start stop`
- **Description**: returns the elements from index `start` to `stop` in the list; indexes start at 0, and negative numbers count from the end of the list.
- **Example**:
  ```plaintext
  LRANGE mylist 0 -1
  ```

### 6. **`LLEN`**

- **Function**: get the length of the list.
- **Syntax**: `LLEN key`
- **Description**: returns the number of elements in the list.
- **Example**:
  ```plaintext
  LLEN mylist
  ```

### 7. **`LSET`**

- **Function**: set the value of the element at a specified position in the list.
- **Syntax**: `LSET key index value`
- **Description**: updates the element value at the position specified by `index`.
- **Example**:
  ```plaintext
  LSET mylist 0 "newvalue"
  ```

### 8. **`LTRIM`**

- **Function**: trim the list so it keeps only the elements in a specified range.
- **Syntax**: `LTRIM key start stop`
- **Description**: keeps only the elements from index `start` to `stop`; the other elements are deleted.
- **Example**:
  ```plaintext
  LTRIM mylist 0 1
  ```

### 9. **`RPOPLPUSH`**

- **Function**: remove an element from the tail of the list and insert it at the head of another list.
- **Syntax**: `RPOPLPUSH source destination`
- **Description**: moves the last element of the `source` list to the front of the `destination` list. Since Redis 6.2 this command has been marked as deprecated; use `LMOVE source destination RIGHT LEFT` instead.
- **Example**:
  ```plaintext
  RPOPLPUSH mylist myotherlist
  ```

### 10. **`BLPOP`**

- **Function**: blockingly remove and return the element at the left side (head) of the list.
- **Syntax**: `BLPOP key [key ...] timeout`
- **Description**: if the list is empty, waits until an element is available or the timeout expires.
- **Example**:
  ```plaintext
  BLPOP mylist 10
  ```

### 11. **`BRPOP`**

- **Function**: blockingly remove and return the element at the right side (tail) of the list.
- **Syntax**: `BRPOP key [key ...] timeout`
- **Description**: if the list is empty, waits until an element is available or the timeout expires.
- **Example**:
  ```plaintext
  BRPOP mylist 10
  ```

## Example operations

```plaintext
# Insert elements at the left side of the list
LPUSH mylist "first"

# Insert elements at the right side of the list
RPUSH mylist "last"

# Remove and return an element from the left side of the list
LPOP mylist

# Remove and return an element from the right side of the list
RPOP mylist

# Get all elements in the list from index 0 to -1
LRANGE mylist 0 -1

# Get the length of the list
LLEN mylist

# Set the element at index 0 in the list to "newvalue"
LSET mylist 0 "newvalue"

# Keep only the elements in the list from index 0 to 1
LTRIM mylist 0 1

# Pop the last element from the tail of mylist and insert it at the head of myotherlist
LMOVE mylist myotherlist RIGHT LEFT

# Blockingly remove and return an element from the left side of mylist, with a timeout of 10 seconds
BLPOP mylist 10

# Blockingly remove and return an element from the right side of mylist, with a timeout of 10 seconds
BRPOP mylist 10
```

## Features

- **Doubly linked list**: `LPUSH`/`RPUSH`/`LPOP`/`RPOP` at the head and tail are O(1); insertion and deletion in the middle are O(N).
- **Ordered and duplicates allowed**: elements keep their insertion order and may be repeated.
- **Index-based access**: `LRANGE key 0 -1` traverses, O(S+N); deep paging on long lists is expensive.
- **Fixed-length trimming**: `LTRIM` together with `LPUSH` keeps only the newest N entries.

## Use cases

```plaintext
# 1. Message queue: producer pushes left, consumer blockingly pops from the right
LPUSH queue:task "job-1"
BRPOP queue:task 30

# 2. Latest N entries: a timeline keeps only the 10 most recent
LPUSH timeline:alice "post-1"
LTRIM timeline:alice 0 9
LRANGE timeline:alice 0 -1

# 3. Stack: push and pop on the same end
LPUSH stack:undo "op-1"
LPOP stack:undo
```

## Summary

A Redis list is a powerful data structure that supports efficient insertion and deletion, suitable for implementing various data-processing patterns such as queues and stacks. These common commands cover the insertion, pop, and management operations for Redis lists.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis development docs · Lists](https://redis.io/docs/latest/develop/data-types/lists/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
