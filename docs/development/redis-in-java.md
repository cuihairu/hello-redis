Working with Redis in Java usually means using one of two client libraries, `Jedis` or `Lettuce`. The guide below shows how to connect to Redis with each of them, run the basic operations, and put them to work in applied examples.

# 1. Using Jedis

## 1.1 Add the dependency

If you use Maven, add the Jedis dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>4.3.1</version>
</dependency>
```

For Gradle, add it to `build.gradle`:

```groovy
implementation 'redis.clients:jedis:4.3.1'
```

## 1.2 Connect to Redis

```java
import redis.clients.jedis.Jedis;

public class JedisExample {
    public static void main(String[] args) {
        // Create a Jedis client
        try (Jedis jedis = new Jedis("localhost", 6379)) {
            // Test the connection
            System.out.println("Server is running: " + jedis.ping());

            // Set a key-value pair
            jedis.set("key", "value");

            // Get the value
            String value = jedis.get("key");
            System.out.println("Retrieved value: " + value);
        }
    }
}
```

## 1.3 Basic operations

```java
import redis.clients.jedis.Jedis;

public class JedisBasicOperations {
    public static void main(String[] args) {
        try (Jedis jedis = new Jedis("localhost", 6379)) {
            // String operations
            jedis.set("name", "Alice");
            String name = jedis.get("name");
            System.out.println("Name: " + name);

            // Hash operations
            jedis.hset("user:1000", "name", "Bob");
            String userName = jedis.hget("user:1000", "name");
            System.out.println("User name: " + userName);

            // List operations
            jedis.rpush("mylist", "element1");
            jedis.rpush("mylist", "element2");
            System.out.println("List: " + jedis.lrange("mylist", 0, -1));

            // Set operations
            jedis.sadd("myset", "value1");
            jedis.sadd("myset", "value2");
            System.out.println("Set: " + jedis.smembers("myset"));

            // Sorted set operations
            jedis.zadd("myzset", 1, "member1");
            jedis.zadd("myzset", 2, "member2");
            System.out.println("Sorted Set: " + jedis.zrange("myzset", 0, -1));
        }
    }
}
```

## 2. Using Lettuce

### 2.1 Add the dependency

If you use Maven, add the Lettuce dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>io.lettuce.core</groupId>
    <artifactId>lettuce-core</artifactId>
    <version>6.1.5</version>
</dependency>
```

For Gradle, add it to `build.gradle`:

```groovy
implementation 'io.lettuce.core:lettuce-core:6.1.5'
```

### 2.2 Connect to Redis

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

public class LettuceExample {
    public static void main(String[] args) {
        // Create a Redis client
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");
        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            // Get the synchronous command API
            RedisCommands<String, String> syncCommands = connection.sync();

            // Test the connection
            System.out.println("Server is running: " + syncCommands.ping());

            // Set a key-value pair
            syncCommands.set("key", "value");

            // Get the value
            String value = syncCommands.get("key");
            System.out.println("Retrieved value: " + value);
        }
        redisClient.shutdown();
    }
}
```

### 2.3 Basic operations

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

public class LettuceBasicOperations {
    public static void main(String[] args) {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");
        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisCommands<String, String> syncCommands = connection.sync();
            
            // String operations
            syncCommands.set("name", "Alice");
            String name = syncCommands.get("name");
            System.out.println("Name: " + name);

            // Hash operations
            syncCommands.hset("user:1000", "name", "Bob");
            String userName = syncCommands.hget("user:1000", "name");
            System.out.println("User name: " + userName);

            // List operations
            syncCommands.rpush("mylist", "element1");
            syncCommands.rpush("mylist", "element2");
            System.out.println("List: " + syncCommands.lrange("mylist", 0, -1));

            // Set operations
            syncCommands.sadd("myset", "value1");
            syncCommands.sadd("myset", "value2");
            System.out.println("Set: " + syncCommands.smembers("myset"));

            // Sorted set operations
            syncCommands.zadd("myzset", 1, "member1");
            syncCommands.zadd("myzset", 2, "member2");
            System.out.println("Sorted Set: " + syncCommands.zrange("myzset", 0, -1));
        }
        redisClient.shutdown();
    }
}
```

## 3. Application examples

### Implementing a cache

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
        // Simulate a database fetch
        return "Data for " + key;
    }
}
```

## Using Redis pub/sub

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
        
        // Publish a message
        syncCommands.publish("mychannel", "Hello, Redis!");

        // Subscribe to the channel
        StatefulRedisPubSubConnection<String, String> pubSubConnection = redisClient.connectPubSub();
        RedisPubSubCommands<String, String> syncPubSubCommands = pubSubConnection.sync();
        syncPubSubCommands.subscribe("mychannel");

        // Listen for messages
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

## 4. Redis connection pools

Both `Jedis` and `Lettuce` support connection pooling; using a pool improves performance and makes connections easier to manage.

### Jedis connection pool

```java
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;
import redis.clients.jedis.Jedis;

public class JedisPoolExample {
    public static void main(String[] args) {
        JedisPoolConfig poolConfig = new JedisPoolConfig();
        poolConfig.setMaxTotal(10);
        try (JedisPool jedisPool = new JedisPool(poolConfig, "localhost", 6379)) {
            try (Jedis jedis = jedisPool.getResource()) {
                jedis.set("key", "value");
                String value = jedis.get("key");
                System.out.println("Retrieved value: " + value);
            }
        }
    }
}
```

## Lettuce connection pool

Lettuce's connection pooling depends on `commons-pool2`, so that dependency has to be pulled in separately:

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-pool2</artifactId>
    <version>2.11.1</version>
</dependency>
```

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.support.ConnectionPoolSupport;
import org.apache.commons.pool2.impl.GenericObjectPool;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;

public class LettucePoolExample {
    public static void main(String[] args) throws Exception {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        GenericObjectPoolConfig<StatefulRedisConnection<String, String>> poolConfig =
                new GenericObjectPoolConfig<>();
        poolConfig.setMaxTotal(10);

        GenericObjectPool<StatefulRedisConnection<String, String>> pool =
                ConnectionPoolSupport.createGenericObjectPool(() -> redisClient.connect(), poolConfig);

        try (StatefulRedisConnection<String, String> connection = pool.borrowObject()) {
            RedisCommands<String, String> syncCommands = connection.sync();
            syncCommands.set("key", "value");
            String value = syncCommands.get("key");
            System.out.println("Retrieved value: " + value);
        } finally {
            pool.close();
            redisClient.shutdown();
        }
    }
}
```

The examples above cover the basic operations and usage of Redis in Java. `Jedis` and `Lettuce` each have their own character: `Jedis` is a synchronous client that is easy to pick up, while `Lettuce` is an asynchronous, reactive client suited to high-performance and reactive application scenarios.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Java clients](https://redis.io/docs/latest/develop/clients/java/)
- [Jedis](https://redis.io/docs/latest/develop/clients/jedis/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
