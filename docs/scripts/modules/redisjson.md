# RedisJSON

RedisJSON is a Redis module that provides native support for JSON data, making it more intuitive and efficient to store and work with JSON in Redis. Here is a detailed overview of RedisJSON:

## 1. **RedisJSON Overview**

RedisJSON is a Redis module that extends Redis's functionality so it can handle JSON data. Unlike traditional Redis data structures, RedisJSON provides deep support for operating on JSON data, including reading, writing, modifying, and deleting. This lets Redis do more than act as a key-value store — it can handle more complex data structures.

## 2. **Installing RedisJSON**

RedisJSON can be installed through Redis's module manager. You can get RedisJSON from the official Redis module repository and install it using the following steps:

**Installation steps:**

1. **Download the RedisJSON module:**

   Download the latest module file from the RedisJSON [GitHub repository](https://github.com/RedisJSON/redisjson).

2. **Start the Redis server:**

   When starting the Redis server, use the `--loadmodule` option to load the RedisJSON module:

   ```bash
   redis-server --loadmodule /path/to/redisjson.so
   ```

3. **Verify the installation:**

   Connect to the Redis server through Redis CLI and use the `MODULE LIST` command to verify that RedisJSON has been loaded correctly:

   ```bash
   redis-cli
   127.0.0.1:6379> MODULE LIST
   ```

   If the installation succeeds, you should see the RedisJSON module in the list.

## 3. **RedisJSON Basic Commands**

RedisJSON provides a set of commands for operating on JSON data. Here are some commonly used RedisJSON commands and their examples:

- **`JSON.SET`**

  Set a JSON value or create a JSON key.

  ```bash
  127.0.0.1:6379> JSON.SET person $ '{"name": "Alice", "age": 28}'
  OK
  ```

- **`JSON.GET`**

  Get a JSON value.

  ```bash
  127.0.0.1:6379> JSON.GET person
  "{\"name\":\"Alice\",\"age\":28}"
  ```

- **`JSON.DEL`**

  Delete a JSON key or a specific path within the JSON.

  ```bash
  127.0.0.1:6379> JSON.DEL person $.age
  (integer) 1
  ```

- **`JSON.MGET`**

  Fetch the value at a given path from multiple JSON keys in batch (the path argument is required).

  ```bash
  127.0.0.1:6379> JSON.SET person1 $ '{"name": "Alice", "age": 28}'
  OK
  127.0.0.1:6379> JSON.SET person2 $ '{"name": "Bob", "age": 30}'
  OK
  127.0.0.1:6379> JSON.MGET person1 person2 $.name
  1) "\"Alice\""
  2) "\"Bob\""
  ```

  Nonexistent keys or paths return `nil`.

- **`JSON.ARRAPPEND`**

  Append one or more JSON values to the end of a JSON array. When appending a string, you need to wrap the string in an extra layer of quotes (for example `'"cherry"'`).

  ```bash
  127.0.0.1:6379> JSON.SET mylist $ '["apple", "banana"]'
  OK
  127.0.0.1:6379> JSON.ARRAPPEND mylist $ '"cherry"'
  1) (integer) 3
  ```

  When using the `$` path, the return value is an array, where each element is the new length of the corresponding array.

- **`JSON.OBJKEYS`**

  Get all keys of a JSON object.

  ```bash
  127.0.0.1:6379> JSON.OBJKEYS person
  1) "name"
  2) "age"
  ```

  When using the default legacy path (`.`) it directly returns an array of key names; when using a JSONPath starting with `$`, the return value is an array nested by matched location.

- **`JSON.NUMINCRBY`**

  Incrementally modify a numeric value in the JSON. The return value is a JSON-encoded string containing the new value (not an integer).

  ```bash
  127.0.0.1:6379> JSON.SET person $ '{"name": "Alice", "age": 28}'
  OK
  127.0.0.1:6379> JSON.NUMINCRBY person $.age 1
  "[29]"
  ```

  If the value matched by the path is not a number, `null` is returned at the corresponding position.

## 4. **RedisJSON Use Cases**

RedisJSON is suited for scenarios that need to store and operate on complex JSON data structures. For example:

- **Configuration management:** application configuration can be stored in Redis in JSON format, supporting dynamic configuration changes.
- **User data:** user profiles, settings, and other information can be stored and queried in JSON format.
- **Log storage:** logs can be stored in JSON format to make searching and analysis easier.

RedisJSON makes handling JSON data in Redis simple and intuitive, making it especially suitable for application scenarios that need to read, write, and process JSON data quickly.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis development docs · JSON](https://redis.io/docs/latest/develop/data-types/json/)

## Related pages

- &#8203;redisgraph<!-- EN-LINK: redisgraph.md -->

<!-- BACKLINKS-AUTO -->
## Related pages

- &#8203;redisgraph<!-- EN-LINK: redisgraph.md -->
