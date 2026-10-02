在 Java 中使用 Redis 通常使用 `Jedis` 或 `Lettuce` 这两个客户端库。下面是如何使用这两个库连接 Redis、执行基本操作以及应用示例的指南。

### 1. 使用 Jedis

#### 1.1 添加依赖

如果你使用 Maven，可以在 `pom.xml` 中添加 Jedis 依赖：

```xml
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>4.3.1</version>
</dependency>
```

如果使用 Gradle，可以在 `build.gradle` 中添加：

```groovy
implementation 'redis.clients:jedis:4.3.1'
```

#### 1.2 连接到 Redis

```java
import redis.clients.jedis.Jedis;

public class JedisExample {
    public static void main(String[] args) {
        // 创建 Jedis 客户端
        try (Jedis jedis = new Jedis("localhost", 6379)) {
            // 测试连接
            System.out.println("Server is running: " + jedis.ping());

            // 设置键值
            jedis.set("key", "value");

            // 获取键值
            String value = jedis.get("key");
            System.out.println("Retrieved value: " + value);
        }
    }
}
```

#### 1.3 基本操作

```java
import redis.clients.jedis.Jedis;

public class JedisBasicOperations {
    public static void main(String[] args) {
        try (Jedis jedis = new Jedis("localhost", 6379)) {
            // 操作字符串
            jedis.set("name", "Alice");
            String name = jedis.get("name");
            System.out.println("Name: " + name);

            // 操作哈希
            jedis.hset("user:1000", "name", "Bob");
            String userName = jedis.hget("user:1000", "name");
            System.out.println("User name: " + userName);

            // 操作列表
            jedis.rpush("mylist", "element1");
            jedis.rpush("mylist", "element2");
            System.out.println("List: " + jedis.lrange("mylist", 0, -1));

            // 操作集合
            jedis.sadd("myset", "value1");
            jedis.sadd("myset", "value2");
            System.out.println("Set: " + jedis.smembers("myset"));

            // 操作有序集合
            jedis.zadd("myzset", 1, "member1");
            jedis.zadd("myzset", 2, "member2");
            System.out.println("Sorted Set: " + jedis.zrange("myzset", 0, -1));
        }
    }
}
```

### 2. 使用 Lettuce

#### 2.1 添加依赖

如果你使用 Maven，可以在 `pom.xml` 中添加 Lettuce 依赖：

```xml
<dependency>
    <groupId>io.lettuce.core</groupId>
    <artifactId>lettuce-core</artifactId>
    <version>6.1.5</version>
</dependency>
```

如果使用 Gradle，可以在 `build.gradle` 中添加：

```groovy
implementation 'io.lettuce.core:lettuce-core:6.1.5'
```

#### 2.2 连接到 Redis

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

public class LettuceExample {
    public static void main(String[] args) {
        // 创建 Redis 客户端
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");
        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            // 获取同步命令API
            RedisCommands<String, String> syncCommands = connection.sync();
            
            // 测试连接
            System.out.println("Server is running: " + syncCommands.ping());

            // 设置键值
            syncCommands.set("key", "value");

            // 获取键值
            String value = syncCommands.get("key");
            System.out.println("Retrieved value: " + value);
        }
        redisClient.shutdown();
    }
}
```

#### 2.3 基本操作

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

public class LettuceBasicOperations {
    public static void main(String[] args) {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");
        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisCommands<String, String> syncCommands = connection.sync();
            
            // 操作字符串
            syncCommands.set("name", "Alice");
            String name = syncCommands.get("name");
            System.out.println("Name: " + name);

            // 操作哈希
            syncCommands.hset("user:1000", "name", "Bob");
            String userName = syncCommands.hget("user:1000", "name");
            System.out.println("User name: " + userName);

            // 操作列表
            syncCommands.rpush("mylist", "element1");
            syncCommands.rpush("mylist", "element2");
            System.out.println("List: " + syncCommands.lrange("mylist", 0, -1));

            // 操作集合
            syncCommands.sadd("myset", "value1");
            syncCommands.sadd("myset", "value2");
            System.out.println("Set: " + syncCommands.smembers("myset"));

            // 操作有序集合
            syncCommands.zadd("myzset", 1, "member1");
            syncCommands.zadd("myzset", 2, "member2");
            System.out.println("Sorted Set: " + syncCommands.zrange("myzset", 0, -1));
        }
        redisClient.shutdown();
    }
}
```

### 3. 应用示例

#### 实现缓存

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

public class CacheExample {
    private static RedisClient redisClient = RedisClient.create("redis://localhost:6379");

    public static void main(String[] args) {
        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisCommands<String, String> syncCommands = connection.sync();
            String key = "myKey";
            String value = getFromCache(syncCommands, key);
            System.out.println("Value: " + value);
        }
        redisClient.shutdown();
    }

    private static String getFromCache(RedisCommands<String, String> syncCommands, String key) {
        String value = syncCommands.get(key);
        if (value != null) {
            return value;
        } else {
            value = fetchDataFromDatabase(key);
            syncCommands.set(key, value);
            return value;
        }
    }

    private static String fetchDataFromDatabase(String key) {
        // 模拟从数据库中获取数据
        return "Data for " + key;
    }
}
```

#### 使用 Redis 发布/订阅功能

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.pubsub.RedisPubSubListener;
import io.lettuce.core.pubsub.StatefulRedisPubSubConnection;
import io.lettuce.core.pubsub.api.sync.RedisPubSubCommands;

public class PubSubExample {
    public static void main(String[] args) {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");
        StatefulRedisConnection<String, String> connection = redisClient.connect();
        RedisCommands<String, String> syncCommands = connection.sync();
        
        // 发布消息
        syncCommands.publish("mychannel", "Hello, Redis!");

        // 订阅频道
        StatefulRedisPubSubConnection<String, String> pubSubConnection = redisClient.connectPubSub();
        RedisPubSubCommands<String, String> syncPubSubCommands = pubSubConnection.sync();
        syncPubSubCommands.subscribe("mychannel");

        // 监听消息
        pubSubConnection.addListener(new RedisPubSubListener<String, String>() {
            @Override
            public void message(String channel, String message) {
                System.out.println("Received message: " + message);
            }

            @Override
            public void message(String pattern, String channel, String message) {
            }

            @Override
            public void psubscribe(String pattern) {
            }

            @Override
            public void punsubscribe(String pattern) {
            }

            @Override
            public void subscribe(String channel, long count) {
            }

            @Override
            public void unsubscribe(String channel, long count) {
            }
        });
    }
}
```

### 4. Redis 连接池

`Jedis` 和 `Lettuce` 都支持连接池，使用连接池可以提高性能和管理连接。

#### Jedis 连接池

```java
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;
import redis.clients.jedis.Jedis;

public class JedisPoolExample {
    public static void main(String[] args) {
        JedisPoolConfig poolConfig = new JedisPoolConfig();
        poolConfig.setMaxTotal(10);
        try

 (JedisPool jedisPool = new JedisPool(poolConfig, "localhost", 6379)) {
            try (Jedis jedis = jedisPool.getResource()) {
                jedis.set("key", "value");
                String value = jedis.get("key");
                System.out.println("Retrieved value: " + value);
            }
        }
    }
}
```

#### Lettuce 连接池

```java
import io.lettuce.core.resource.DefaultClientResources;
import io.lettuce.core.resource.DefaultEventLoopGroupProvider;
import io.lettuce.core.resource.DefaultEventLoopGroup;
import io.lettuce.core.resource.DefaultFutureProvider;
import io.lettuce.core.resource.DefaultThreadFactory;
import io.lettuce.core.resource.ClientResources;
import io.lettuce.core.resource.ClientResources.Builder;
import io.lettuce.core.resource.DefaultFutureProvider;
import io.lettuce.core.resource.DefaultThreadFactory;

public class LettucePoolExample {
    public static void main(String[] args) {
        ClientResources clientResources = DefaultClientResources.create();
        try (StatefulRedisConnection<String, String> connection = 
             LettucePoolingClient.create("redis://localhost:6379", clientResources)) {
            RedisCommands<String, String> syncCommands = connection.sync();
            syncCommands.set("key", "value");
            String value = syncCommands.get("key");
            System.out.println("Retrieved value: " + value);
        }
    }
}
```

以上示例展示了在 Java 中使用 Redis 的基本操作和应用。`Jedis` 和 `Lettuce` 各有其特点，`Jedis` 是一个同步客户端，容易上手；而 `Lettuce` 是一个异步和反应式客户端，适合高性能和响应式应用场景。