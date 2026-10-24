Using Redis in Go is typically done with one of several popular client libraries, the most common being `go-redis`. The following is a guide to using the `go-redis` library to connect to Redis, perform basic operations, and work through application examples.

# 1. Using go-redis

## 1.1 Add the dependency

First, add the `go-redis` dependency with Go Modules. In your project directory, run the following command:

```bash
go get github.com/go-redis/redis/v8
```

## 1.2 Connect to Redis

```go
package main

import (
    "context"
    "fmt"
    "github.com/go-redis/redis/v8"
)

var ctx = context.Background()

func main() {
    // Create the Redis client
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })

    // Test the connection
    pong, err := rdb.Ping(ctx).Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("Server response:", pong)

    // Set a key
    err = rdb.Set(ctx, "key", "value", 0).Err()
    if err != nil {
        panic(err)
    }

    // Get the key's value
    value, err := rdb.Get(ctx, "key").Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("Retrieved value:", value)
}
```

## 1.3 Basic operations

```go
package main

import (
    "context"
    "fmt"
    "github.com/go-redis/redis/v8"
)

var ctx = context.Background()

func main() {
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })

    // Strings
    err := rdb.Set(ctx, "name", "Alice", 0).Err()
    if err != nil {
        panic(err)
    }
    name, err := rdb.Get(ctx, "name").Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("Name:", name)

    // Hashes
    err = rdb.HSet(ctx, "user:1000", "name", "Bob").Err()
    if err != nil {
        panic(err)
    }
    userName, err := rdb.HGet(ctx, "user:1000", "name").Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("User name:", userName)

    // Lists
    err = rdb.RPush(ctx, "mylist", "element1").Err()
    if err != nil {
        panic(err)
    }
    err = rdb.RPush(ctx, "mylist", "element2").Err()
    if err != nil {
        panic(err)
    }
    list, err := rdb.LRange(ctx, "mylist", 0, -1).Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("List:", list)

    // Sets
    err = rdb.SAdd(ctx, "myset", "value1").Err()
    if err != nil {
        panic(err)
    }
    err = rdb.SAdd(ctx, "myset", "value2").Err()
    if err != nil {
        panic(err)
    }
    set, err := rdb.SMembers(ctx, "myset").Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("Set:", set)

    // Sorted sets
    err = rdb.ZAdd(ctx, "myzset", &redis.Z{Score: 1, Member: "member1"}).Err()
    if err != nil {
        panic(err)
    }
    err = rdb.ZAdd(ctx, "myzset", &redis.Z{Score: 2, Member: "member2"}).Err()
    if err != nil {
        panic(err)
    }
    zset, err := rdb.ZRange(ctx, "myzset", 0, -1).Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("Sorted Set:", zset)
}
```

## 2. Redis connection pool

The `go-redis` library manages the connection pool automatically, so no manual pool configuration is needed. If you need to tune the pool parameters, you can configure them when creating `redis.Options`:

```go
package main

import (
    "context"
    "github.com/go-redis/redis/v8"
)

var ctx = context.Background()

func main() {
    rdb := redis.NewClient(&redis.Options{
        Addr:         "localhost:6379",
        PoolSize:     10, // Pool size
        MinIdleConns: 5,  // Minimum idle connections
    })
    _ = rdb
}
```

## 3. Application examples

### Implementing a cache

```go
package main

import (
    "context"
    "fmt"
    "github.com/go-redis/redis/v8"
)

var ctx = context.Background()

func main() {
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })

    key := "myKey"
    value := getFromCache(rdb, key)
    fmt.Println("Value:", value)
}

func getFromCache(rdb *redis.Client, key string) string {
    value, err := rdb.Get(ctx, key).Result()
    if err == redis.Nil {
        value = fetchDataFromDatabase(key)
        rdb.Set(ctx, key, value, 0)
    } else if err != nil {
        panic(err)
    }
    return value
}

func fetchDataFromDatabase(key string) string {
    // Simulate fetching data from the database
    return "Data for " + key
}
```

## Using Redis publish/subscribe

```go
package main

import (
    "context"
    "fmt"
    "github.com/go-redis/redis/v8"
)

var ctx = context.Background()

func main() {
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })

    // Publish the message
    err := rdb.Publish(ctx, "mychannel", "Hello, Redis!").Err()
    if err != nil {
        panic(err)
    }

    // Subscribe to the channel
    pubsub := rdb.Subscribe(ctx, "mychannel")
    defer pubsub.Close()

    // Receive messages
    ch := pubsub.Channel()
    for msg := range ch {
        fmt.Println("Received message:", msg.Payload)
    }
}
```

## 4. Redis transactions

`go-redis` supports Redis transactions; you can use the `TxPipelined` method to run multiple commands:

```go
package main

import (
    "context"
    "fmt"
    "github.com/go-redis/redis/v8"
)

var ctx = context.Background()

func main() {
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })

    // Use a transaction
    _, err := rdb.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
        pipe.Set(ctx, "key1", "value1", 0)
        pipe.Set(ctx, "key2", "value2", 0)
        return nil
    })
    if err != nil {
        panic(err)
    }

    // Verify the transaction succeeded
    value1, err := rdb.Get(ctx, "key1").Result()
    if err != nil {
        panic(err)
    }
    value2, err := rdb.Get(ctx, "key2").Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("Key1:", value1)
    fmt.Println("Key2:", value2)
}
```

## 5. Redis Sentinel and Cluster support

The `go-redis` library also supports Redis Sentinel and Cluster mode. You can connect to Sentinel or a cluster by configuring `redis.Options`.

### Sentinel support

```go
package main

import "github.com/go-redis/redis/v8"

func main() {
    rdb := redis.NewFailoverClient(&redis.FailoverOptions{
        MasterName: "mymaster",
        SentinelAddrs: []string{
            "localhost:26379",
        },
    })
    _ = rdb
}
```

## Cluster support

```go
package main

import "github.com/go-redis/redis/v8"

func main() {
    rdb := redis.NewClusterClient(&redis.ClusterOptions{
        Addrs: []string{
            "localhost:7000",
            "localhost:7001",
            "localhost:7002",
        },
    })
    _ = rdb
}
```

The examples above cover the basic operations and applications of using Redis in Go. `go-redis` is a feature-rich library that supports most of Redis's functionality and stands out for both performance and ease of use.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Go client](https://redis.io/docs/latest/develop/clients/go/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
