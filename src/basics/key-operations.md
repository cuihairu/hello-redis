### Redis 键的操作

Redis 提供了丰富的键操作命令，用于管理数据的存储、过期和删除。以下是 Redis 中常用的键操作命令及其用法说明。

#### 1. **键的基本操作**

##### 1.1 **创建键**

- **SET**：设置指定键的值。如果键已存在，它会被覆盖。

  ```bash
  SET key value
  ```

  示例：

  ```bash
  SET mykey "Hello"
  ```

##### 1.2 **获取键的值**

- **GET**：获取指定键的值。如果键不存在，返回 `nil`。

  ```bash
  GET key
  ```

  示例：

  ```bash
  GET mykey
  ```

##### 1.3 **删除键**

- **DEL**：删除一个或多个键。如果键不存在，它们将被忽略。

  ```bash
  DEL key [key ...]
  ```

  示例：

  ```bash
  DEL mykey
  ```

##### 1.4 **检查键是否存在**

- **EXISTS**：检查指定键是否存在。如果键存在，返回 1，否则返回 0。

  ```bash
  EXISTS key
  ```

  示例：

  ```bash
  EXISTS mykey
  ```

#### 2. **键的过期管理**

##### 2.1 **设置键的过期时间**

- **EXPIRE**：为指定键设置过期时间（秒）。当过期时间到达后，键将被自动删除。

  ```bash
  EXPIRE key seconds
  ```

  示例：

  ```bash
  EXPIRE mykey 60
  ```

##### 2.2 **查看键的剩余过期时间**

- **TTL**：查看指定键的剩余过期时间（秒）。如果键不存在或没有设置过期时间，返回 -1 或 -2。

  ```bash
  TTL key
  ```

  示例：

  ```bash
  TTL mykey
  ```

##### 2.3 **移除键的过期时间**

- **PERSIST**：移除指定键的过期时间，使其永久有效。

  ```bash
  PERSIST key
  ```

  示例：

  ```bash
  PERSIST mykey
  ```

#### 3. **键的类型**

##### 3.1 **查看键的类型**

- **TYPE**：返回指定键的类型。可能的返回值包括 `string`、`list`、`set`、`zset` 和 `hash`。

  ```bash
  TYPE key
  ```

  示例：

  ```bash
  TYPE mykey
  ```

##### 3.2 **键的数量**

- **DBSIZE**：返回当前数据库中键的数量。

  ```bash
  DBSIZE
  ```

  示例：

  ```bash
  DBSIZE
  ```

##### 3.3 **删除所有键**

- **FLUSHDB**：删除当前数据库中的所有键。

  ```bash
  FLUSHDB
  ```

  示例：

  ```bash
  FLUSHDB
  ```

- **FLUSHALL**：删除所有数据库中的所有键。

  ```bash
  FLUSHALL
  ```

  示例：

  ```bash
  FLUSHALL
  ```

#### 4. **键的扫描**

##### 4.1 **遍历数据库中的键**

- **SCAN**：以增量方式遍历当前数据库中的所有键。可以用 `MATCH` 和 `COUNT` 参数来过滤和限制结果。

  ```bash
  SCAN cursor [MATCH pattern] [COUNT count]
  ```

  示例：

  ```bash
  SCAN 0 MATCH user:* COUNT 100
  ```

#### 小结

Redis 提供了多种命令来管理和操作键，包括创建、获取、删除键，设置和管理过期时间，以及查看键的类型。通过这些命令，用户可以灵活地控制 Redis 数据的存储和生命周期，以满足不同的应用需求。