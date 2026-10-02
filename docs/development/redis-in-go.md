在 Go 中使用 Redis 通常可以通过几个流行的客户端库来实现，其中最常用的是 `go-redis`。以下是如何使用 `go-redis` 库连接 Redis、执行基本操作以及应用示例的指南。

### 1. 使用 go-redis

#### 1.1 添加依赖

首先，使用 Go Modules 添加 `go-redis` 依赖。在你的项目目录下，运行以下命令：

```bash
go get github.com/go-redis/redis/v8
```

#### 1.2 连接到 Redis

```go
package main

import (
    "context"
    "fmt"
    "github.com/go-redis/redis/v8"
)

var ctx = context.Background()

func main() {
    // 创建 Redis 客户端
    rdb := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })

    // 测试连接
    pong, err := rdb.Ping(ctx).Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("Server response:", pong)

    // 设置键值
    err = rdb.Set(ctx, "key", "value", 0).Err()
    if err != nil {
        panic(err)
    }

    // 获取键值
    value, err := rdb.Get(ctx, "key").Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("Retrieved value:", value)
}
```

#### 1.3 基本操作

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

    // 操作字符串
    err := rdb.Set(ctx, "name", "Alice", 0).Err()
    if err != nil {
        panic(err)
    }
    name, err := rdb.Get(ctx, "name").Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("Name:", name)

    // 操作哈希
    err = rdb.HSet(ctx, "user:1000", "name", "Bob").Err()
    if err != nil {
        panic(err)
    }
    userName, err := rdb.HGet(ctx, "user:1000", "name").Result()
    if err != nil {
        panic(err)
    }
    fmt.Println("User name:", userName)

    // 操作列表
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

    // 操作集合
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

    // 操作有序集合
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

### 2. Redis 连接池

`go-redis` 库自动管理连接池，无需手动配置连接池。如果需要调整连接池的参数，可以在创建 `redis.Options` 时进行配置：

```go
rdb := redis.NewClient(&redis.Options{
    Addr:        "localhost:6379",
    PoolSize:    10, // 连接池大小
    MinIdleConns: 5, // 最小空闲连接数
})
```

### 3. 应用示例

#### 实现缓存

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
    // 模拟从数据库中获取数据
    return "Data for " + key
}
```

#### 使用 Redis 发布/订阅功能

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

    // 发布消息
    err := rdb.Publish(ctx, "mychannel", "Hello, Redis!").Err()
    if err != nil {
        panic(err)
    }

    // 订阅频道
    pubsub := rdb.Subscribe(ctx, "mychannel")
    defer pubsub.Close()

    // 接收消息
    ch := pubsub.Channel()
    for msg := range ch {
        fmt.Println("Received message:", msg.Payload)
    }
}
```

### 4. Redis 事务

`go-redis` 支持 Redis 事务，可以使用 `TxPipelined` 方法来执行多个命令：

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

    // 使用事务
    _, err := rdb.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
        pipe.Set(ctx, "key1", "value1", 0)
        pipe.Set(ctx, "key2", "value2", 0)
        return nil
    })
    if err != nil {
        panic(err)
    }

    // 确认事务成功
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

### 5. Redis 哨兵与集群支持

`go-redis` 库也支持 Redis 哨兵和集群模式。你可以通过配置 `redis.Options` 来连接到哨兵或集群。

#### 哨兵支持

```go
rdb := redis.NewFailoverClient(&redis.FailoverOptions{
    MasterName: "mymaster",
    SentinelAddrs: []string{
        "localhost:26379",
    },
})
```

#### 集群支持

```go
rdb := redis.NewClusterClient(&redis.ClusterOptions{
    Addrs: []string{
        "localhost:7000",
        "localhost:7001",
        "localhost:7002",
    },
})
```

以上示例展示了在 Go 中使用 Redis 的基本操作和应用。`go-redis` 是一个功能丰富的库，支持 Redis 的大部分功能，并且在性能和易用性上表现出色。