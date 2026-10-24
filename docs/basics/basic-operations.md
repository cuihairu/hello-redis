# Redis Basic Operations

Redis provides a rich set of commands for managing and operating data. Below are the common data types in Redis and their basic commands:

## 1. **String**

String is the simplest data type in Redis. It can hold any data, such as a JPEG image or a serialized object.

- **`SET`**: Set the value of a key
  ```plaintext
  SET key value
  ```
  - Example: `SET name "Alice"`

- **`GET`**: Get the value of a key
  ```plaintext
  GET key
  ```
  - Example: `GET name`

- **`DEL`**: Delete a key
  ```plaintext
  DEL key
  ```
  - Example: `DEL name`

- **`EXPIRE`**: Set the expiration time of a key (unit: seconds)
  ```plaintext
  EXPIRE key seconds
  ```
  - Example: `EXPIRE name 60` (the key `name` expires after 60 seconds)

- **`APPEND`**: Append the value to the end of the key's existing value
  ```plaintext
  APPEND key value
  ```
  - Example: `APPEND name " Smith"`

- **`MSET`**: Set multiple key-value pairs in batch
  ```plaintext
  MSET key1 value1 key2 value2
  ```
  - Example: `MSET name "Alice" age "30"`

- **`MGET`**: Get the values of multiple keys in batch
  ```plaintext
  MGET key1 key2
  ```
  - Example: `MGET name age`

## 2. **Hash**

Hash is a collection of field-value pairs, suited for storing object properties.

- **`HSET`**: Set the value of a hash field
  ```plaintext
  HSET key field value
  ```
  - Example: `HSET user:1000 name "Alice"`

- **`HGET`**: Get the value of a hash field
  ```plaintext
  HGET key field
  ```
  - Example: `HGET user:1000 name`

- **`HDEL`**: Delete one or more fields from a hash
  ```plaintext
  HDEL key field [field ...]
  ```
  - Example: `HDEL user:1000 age`

- **`HGETALL`**: Get all fields and values from a hash
  ```plaintext
  HGETALL key
  ```
  - Example: `HGETALL user:1000`

- **`HKEYS`**: Get the names of all fields in a hash
  ```plaintext
  HKEYS key
  ```
  - Example: `HKEYS user:1000`

- **`HVALS`**: Get the values of all fields in a hash
  ```plaintext
  HVALS key
  ```
  - Example: `HVALS user:1000`

## 3. **List**

List is a simple list of strings, ordered by insertion. Elements can be pushed and popped from either end.

- **`LPUSH`**: Insert one or more values at the left of the list
  ```plaintext
  LPUSH list value [value ...]
  ```
  - Example: `LPUSH mylist "first"`

- **`RPUSH`**: Insert one or more values at the right of the list
  ```plaintext
  RPUSH list value [value ...]
  ```
  - Example: `RPUSH mylist "second"`

- **`LPOP`**: Remove and return the first element from the left of the list
  ```plaintext
  LPOP list
  ```
  - Example: `LPOP mylist`

- **`RPOP`**: Remove and return the first element from the right of the list
  ```plaintext
  RPOP list
  ```
  - Example: `RPOP mylist`

- **`LRANGE`**: Get the elements of a list in a specified range
  ```plaintext
  LRANGE list start stop
  ```
  - Example: `LRANGE mylist 0 -1` (get all elements in the list)

## 4. **Set**

Set is an unordered collection of strings, with unique elements.

- **`SADD`**: Add one or more members to a set
  ```plaintext
  SADD set member [member ...]
  ```
  - Example: `SADD myset "apple"`

- **`SMEMBERS`**: Get all members of a set
  ```plaintext
  SMEMBERS set
  ```
  - Example: `SMEMBERS myset`

- **`SREM`**: Remove one or more members from a set
  ```plaintext
  SREM set member [member ...]
  ```
  - Example: `SREM myset "apple"`

- **`SPOP`**: Remove and return a random element from a set
  ```plaintext
  SPOP set
  ```
  - Example: `SPOP myset`

## 5. **Sorted Set**

Sorted set is a collection of unique elements, each with a score, ordered by score.

- **`ZADD`**: Add one or more members with their scores to a sorted set
  ```plaintext
  ZADD sortedset score member [score member ...]
  ```
  - Example: `ZADD myzset 1 "one" 2 "two"`

- **`ZRANGE`**: Get the members of a sorted set in a specified range
  ```plaintext
  ZRANGE sortedset start stop [WITHSCORES]
  ```
  - Example: `ZRANGE myzset 0 -1 WITHSCORES` (get all members of the sorted set with their scores)

- **`ZREM`**: Remove one or more members from a sorted set
  ```plaintext
  ZREM sortedset member [member ...]
  ```
  - Example: `ZREM myzset "one"`

- **`ZCARD`**: Get the number of members in a sorted set
  ```plaintext
  ZCARD sortedset
  ```
  - Example: `ZCARD myzset`

## 6. **Bitmap**

Bitmap operations are used to efficiently handle large ranges of binary data.

- **`SETBIT`**: Set a bit in the bitmap
  ```plaintext
  SETBIT key offset value
  ```
  - Example: `SETBIT mybitmap 7 1`

- **`GETBIT`**: Get a bit in the bitmap
  ```plaintext
  GETBIT key offset
  ```
  - Example: `GETBIT mybitmap 7`

## 7. **Geospatial Data**

Redis supports storing and querying geographic location data.

- **`GEOADD`**: Add geographic location data to a sorted set
  ```plaintext
  GEOADD key longitude latitude member [longitude latitude member ...]
  ```
  - Example: `GEOADD mygeoset 13.361389 38.115556 "Sicily"`

- **`GEOSEARCH`**: Query geographic location data within a circular range (unified replacement for `GEORADIUS` since 6.2)
  ```plaintext
  GEOSEARCH key FROMLONLAT longitude latitude BYRADIUS radius m|km|ft|mi [ASC|DESC] [COUNT count [ANY]]
  ```
  - Example: `GEOSEARCH mygeoset FROMLONLAT 15 37 BYRADIUS 200 km WITHDIST`

## 8. **HyperLogLog**

Used to count unique elements, saving memory.

- **`PFADD`**: Add one or more elements to a HyperLogLog
  ```plaintext
  PFADD key element [element ...]
  ```
  - Example: `PFADD myhll "element1" "element2"`

- **`PFCOUNT`**: Get the cardinality estimate of a HyperLogLog
  ```plaintext
  PFCOUNT key [key ...]
  ```
  - Example: `PFCOUNT myhll`

## 9. **Stream**

Streams are used to process real-time data streams.

- **`XADD`**: Add one or more fields and their values to a stream
  ```plaintext
  XADD key * field value [field value ...]
  ```
  - Example: `XADD mystream * sensor-id 12345 temperature 19.8`

- **`XREAD`**: Read data from a stream
  ```plaintext
  XREAD [BLOCK milliseconds] [COUNT count] STREAMS key [key ...] [id [id ...]]
  ```
  - Example: `XREAD COUNT 2 STREAMS mystream 0`

## 10. **Connection and Authentication**

- **`AUTH`**: Authenticate with a password
  ```plaintext
  AUTH password
  ```
  - Example: `AUTH yourpassword`

- **`PING`**: Test whether the Redis server is responding
  ```plaintext
  PING
  ```
  - Example: `PING` returns `PONG`

## Example operations

```plaintext
# Set a key-value pair
SET user:1001 "Alice"

# Get a key-value pair
GET user:1001

# Set hash fields
HSET user:1000 name "Alice" age 30

# Get a hash field
HGET user:1000 name

# Add elements to a list
RPUSH mylist "first" "second"

# Get list elements
LRANGE mylist 0 -1

# Add elements to a set
SADD myset "apple" "banana"

# Get set members
SMEMBERS myset

# Add to a sorted set
ZADD myzset 1 "one" 2 "two"

# Get sorted set members
ZRANGE myzset 0 -1 WITHSCORES

# Add to a stream
XADD mystream * sensor-id 12345 temperature 19.8

# Read stream data
XREAD COUNT 2 STREAMS mystream 0
```

The above commands are only part of Redis's basic operations; Redis provides many other features and commands. For detailed information about Redis commands, refer to the [Redis official documentation](https://redis.io/commands/).

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis development docs · Using commands](https://redis.io/docs/latest/develop/using-commands/)

## Related pages

- [installation-on-macos](installation-on-macos.md)
- [other](other.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](README.md)
- [installation-on-macos](installation-on-macos.md)
- [other](other.md)
