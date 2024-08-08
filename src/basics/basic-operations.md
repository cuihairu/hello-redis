### Redis 基本操作

Redis 提供了丰富的命令集来管理和操作数据。以下是 Redis 中常见的数据类型及其基本命令：

#### 1. **字符串（String）**

字符串是 Redis 中最简单的数据类型，它可以包含任何数据，比如 JPEG 图像或序列化的对象。

- **`SET`**: 设置键的值
  ```plaintext
  SET key value
  ```
  - 示例：`SET name "Alice"`

- **`GET`**: 获取键的值
  ```plaintext
  GET key
  ```
  - 示例：`GET name`

- **`DEL`**: 删除键
  ```plaintext
  DEL key
  ```
  - 示例：`DEL name`

- **`EXPIRE`**: 设置键的过期时间（单位：秒）
  ```plaintext
  EXPIRE key seconds
  ```
  - 示例：`EXPIRE name 60`（60 秒后键 `name` 过期）

- **`APPEND`**: 将值追加到键的现有值后面
  ```plaintext
  APPEND key value
  ```
  - 示例：`APPEND name " Smith"`

- **`MSET`**: 批量设置多个键值对
  ```plaintext
  MSET key1 value1 key2 value2
  ```
  - 示例：`MSET name "Alice" age "30"`

- **`MGET`**: 批量获取多个键的值
  ```plaintext
  MGET key1 key2
  ```
  - 示例：`MGET name age`

#### 2. **哈希（Hash）**

哈希是一个键值对的集合，适用于存储对象的属性。

- **`HSET`**: 设置哈希表字段的值
  ```plaintext
  HSET hash key value
  ```
  - 示例：`HSET user:1000 name "Alice"`

- **`HGET`**: 获取哈希表字段的值
  ```plaintext
  HGET hash key
  ```
  - 示例：`HGET user:1000 name`

- **`HDEL`**: 删除哈希表中的一个或多个字段
  ```plaintext
  HDEL hash key [key ...]
  ```
  - 示例：`HDEL user:1000 age`

- **`HGETALL`**: 获取哈希表中的所有字段和值
  ```plaintext
  HGETALL hash
  ```
  - 示例：`HGETALL user:1000`

- **`HKEYS`**: 获取哈希表中所有字段的名称
  ```plaintext
  HKEYS hash
  ```
  - 示例：`HKEYS user:1000`

- **`HVALS`**: 获取哈希表中所有字段的值
  ```plaintext
  HVALS hash
  ```
  - 示例：`HVALS user:1000`

#### 3. **列表（List）**

列表是一个简单的字符串列表，按插入顺序排序。可以从列表的两端推入或弹出元素。

- **`LPUSH`**: 将一个或多个值插入到列表的左侧
  ```plaintext
  LPUSH list value [value ...]
  ```
  - 示例：`LPUSH mylist "first"`

- **`RPUSH`**: 将一个或多个值插入到列表的右侧
  ```plaintext
  RPUSH list value [value ...]
  ```
  - 示例：`RPUSH mylist "second"`

- **`LPOP`**: 移除并返回列表的左侧第一个元素
  ```plaintext
  LPOP list
  ```
  - 示例：`LPOP mylist`

- **`RPOP`**: 移除并返回列表的右侧第一个元素
  ```plaintext
  RPOP list
  ```
  - 示例：`RPOP mylist`

- **`LRANGE`**: 获取列表中指定范围的元素
  ```plaintext
  LRANGE list start stop
  ```
  - 示例：`LRANGE mylist 0 -1`（获取列表中的所有元素）

#### 4. **集合（Set）**

集合是一个无序的字符串集合，集合中的元素是唯一的。

- **`SADD`**: 将一个或多个成员元素添加到集合中
  ```plaintext
  SADD set member [member ...]
  ```
  - 示例：`SADD myset "apple"`

- **`SMEMBERS`**: 获取集合中的所有成员
  ```plaintext
  SMEMBERS set
  ```
  - 示例：`SMEMBERS myset`

- **`SREM`**: 移除集合中的一个或多个成员
  ```plaintext
  SREM set member [member ...]
  ```
  - 示例：`SREM myset "apple"`

- **`SPOP`**: 移除并返回集合中的一个随机元素
  ```plaintext
  SPOP set
  ```
  - 示例：`SPOP myset`

#### 5. **有序集合（Sorted Set）**

有序集合是一个包含唯一元素的集合，每个元素都有一个分数，按分数排序。

- **`ZADD`**: 将一个或多个成员元素及其分数值添加到有序集合中
  ```plaintext
  ZADD sortedset score member [score member ...]
  ```
  - 示例：`ZADD myzset 1 "one" 2 "two"`

- **`ZRANGE`**: 获取有序集合中指定范围的成员
  ```plaintext
  ZRANGE sortedset start stop [WITHSCORES]
  ```
  - 示例：`ZRANGE myzset 0 -1 WITHSCORES`（获取有序集合中的所有成员及其分数）

- **`ZREM`**: 移除有序集合中的一个或多个成员
  ```plaintext
  ZREM sortedset member [member ...]
  ```
  - 示例：`ZREM myzset "one"`

- **`ZCARD`**: 获取有序集合中的成员数量
  ```plaintext
  ZCARD sortedset
  ```
  - 示例：`ZCARD myzset`

#### 6. **位图（Bitmap）**

位图操作用于高效地处理大范围的二进制数据。

- **`SETBIT`**: 设置位图中的某一位
  ```plaintext
  SETBIT key offset value
  ```
  - 示例：`SETBIT mybitmap 7 1`

- **`GETBIT`**: 获取位图中的某一位
  ```plaintext
  GETBIT key offset
  ```
  - 示例：`GETBIT mybitmap 7`

#### 7. **地理空间数据（Geospatial Data）**

Redis 支持存储和查询地理位置数据。

- **`GEOADD`**: 将地理位置数据添加到有序集合
  ```plaintext
  GEOADD key longitude latitude member [longitude latitude member ...]
  ```
  - 示例：`GEOADD mygeoset 13.361389 38.115556 "Sicily"`

- **`GEORADIUS`**: 根据半径查询地理位置数据
  ```plaintext
  GEORADIUS key longitude latitude radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [ASC|DESC]
  ```
  - 示例：`GEORADIUS mygeoset 15 37 200 km WITHDIST`

#### 8. **HyperLogLog**

用于统计唯一元素的数量，节省内存。

- **`PFADD`**: 将一个或多个元素添加到 HyperLogLog 中
  ```plaintext
  PFADD key element [element ...]
  ```
  - 示例：`PFADD myhll "element1" "element2"`

- **`PFCOUNT`**: 获取 HyperLogLog 的基数估算值
  ```plaintext
  PFCOUNT key [key ...]
  ```
  - 示例：`PFCOUNT myhll`

#### 9. **流（Stream）**

流用于处理实时数据流。

- **`XADD`**: 将一个或多个字段及其值添加到流中
  ```plaintext
  XADD key * field value [field value ...]
  ```
  - 示例：`XADD mystream * sensor-id 12345 temperature 19.8`

- **`XREAD`**: 从流中读取数据
  ```plaintext
  XREAD [BLOCK milliseconds] [COUNT count] STREAMS key [key ...] [id [id ...]]
  ```
  - 示例：`XREAD COUNT 2 STREAMS mystream 0`

#### 10. **连接与认证**

- **`AUTH`**: 进行密码认证
  ```plaintext
  AUTH password
  ```
  - 示例：`AUTH yourpassword`

- **`PING`**: 测试 Redis 服务器是否响应
  ```plaintext
  PING
  ```
  - 示例：`PING` 返回 `PONG`

### 示例操作

```plaintext
# 设置键值对
SET user:1000 "Alice"

# 获取键值对
GET user:1000

# 设置哈希表字段
HSET user:1000 name "Alice" age 30

# 获取哈希表字段
HGET user:1000 name

# 将

元素添加到列表
RPUSH mylist "first" "second"

# 获取列表元素
LRANGE mylist 0 -1

# 将元素添加到集合
SADD myset "apple" "banana"

# 获取集合元素
SMEMBERS myset

# 添加到有序集合
ZADD myzset 1 "one" 2 "two"

# 获取有序集合元素
ZRANGE myzset 0 -1 WITHSCORES
```

以上命令仅为 Redis 基本操作的一部分，Redis 还提供了许多其他功能和命令。有关 Redis 命令的详细信息，可以参考 [Redis 官方文档](https://redis.io/commands/)。