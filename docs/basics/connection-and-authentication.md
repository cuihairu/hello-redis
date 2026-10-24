# Redis Connection and Authentication

Redis provides basic connection and authentication features to ensure data security and access control. Below is a detailed introduction to Redis connection and authentication.

## Connecting to Redis

### 1. **Connection Methods**

- **Command-line client**: Redis ships with the `redis-cli` command-line tool, used to connect to and manage Redis instances.
- **Programming-language clients**: Redis supports client libraries for many languages (such as `redis-py` for Python, `Jedis` for Java, and `go-redis` for Go). These libraries can be used to connect to and operate on Redis from within applications.

### 2. **Command-Line Connection Example**

```bash
redis-cli
```

By default, `redis-cli` connects to the local Redis instance. If the Redis instance runs on a different host or port, you can connect by specifying the `-h` and `-p` parameters:

```bash
redis-cli -h <host> -p <port>
```

### 3. **Programming-Language Connection Examples**

**Python example**:

```python
import redis

r = redis.Redis(host='localhost', port=6379, db=0)
r.set('foo', 'bar')
print(r.get('foo'))
```

**Java example**:

```java
import redis.clients.jedis.Jedis;

public class RedisExample {
    public static void main(String[] args) {
        Jedis jedis = new Jedis("localhost");
        jedis.set("foo", "bar");
        System.out.println(jedis.get("foo"));
    }
}
```

**Go example**:

```go
package main

import (
    "fmt"
    "github.com/redis/go-redis/v9"
    "context"
)

func main() {
    ctx := context.Background()
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })

    err := rdb.Set(ctx, "foo", "bar", 0).Err()
    if err != nil {
        panic(err)
    }

    val, err := rdb.Get(ctx, "foo").Result()
    if err != nil {
        panic(err)
    }
    fmt.Println(val)
}
```

## Redis Authentication

Redis supports controlling access through passwords. Configuring a Redis password prevents unauthorized access.

### 1. **Configuring the Password**

- **Configuration file**: Set the password in the Redis configuration file `redis.conf`. Find the `requirepass` option, uncomment it, and set the password:

  ```plaintext
  requirepass yourpassword
  ```

- **Restart Redis**: After changing the configuration, restart the Redis instance to apply the new settings:

  ```bash
  redis-server /path/to/redis.conf
  ```

### 2. **Providing the Password on Connection**

If Redis has a password configured, you need to provide the password when connecting with `redis-cli`:

```bash
redis-cli -a yourpassword
```

In programming-language clients, you can provide the password through the relevant connection options. For example:

**Python example**:

```python
r = redis.Redis(host='localhost', port=6379, db=0, password='yourpassword')
```

**Java example**:

```java
Jedis jedis = new Jedis("localhost");
jedis.auth("yourpassword");
```

**Go example**:

```go
rdb := redis.NewClient(&redis.Options{
    Addr:     "localhost:6379",
    Password: "yourpassword",
})
```

### 3. **Changing the Password**

On a running Redis instance, you can change the password with the `CONFIG SET` command:

```bash
redis-cli CONFIG SET requirepass newpassword
```

### 4. **Disabling Remote Connections**

For better security, you can configure Redis to allow only local connections. Modify the `bind` option in the Redis configuration file:

```plaintext
bind 127.0.0.1
```

This makes Redis listen only on the local address and refuse external connections.

## Summary

Redis provides multiple connection and authentication methods to ensure data security and access control. With `redis-cli` and various programming-language clients, you can conveniently connect to Redis instances and operate on them. Configuring passwords and restricting connection addresses effectively improves the security of a Redis instance and prevents unauthorized access.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- AUTH (no authoritative source found (to be verified))
- [Redis operations manual · Security](https://redis.io/docs/latest/operate/oss_and_stack/management/security/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
