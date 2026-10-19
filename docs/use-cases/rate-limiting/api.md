### 实际案例：API限流

本文从 API 网关的每用户固定窗口需求出发；多种策略及实现取舍见[限流策略](strategies.md)，开发项目中的多种限流器示例见[使用 Redis 实现限流器](/development/rate-limiter)。

在现代应用中，API限流是保护服务免受滥用和确保公平使用的重要手段。以下是一个示例，展示了如何使用 Redis 实现 API 限流。这个示例将涵盖固定窗口限流策略的实现，因为它是最基础且易于理解的限流策略之一。

#### 1. 背景

假设我们有一个 API 需要限制每个用户每分钟的请求次数，例如，每个用户每分钟最多可以发送 100 次请求。我们可以使用 Redis 来实现这一限制。

#### 2. 固定窗口限流实现

##### 2.1. 配置

实现中用 Redis `INCR` 递增计数器，用 `EXPIRE` 设置过期时间；每个时间窗口开始时重置计数器。

##### 2.2. 代码示例

以下是一个使用 Python 和 `redis-py` 库实现固定窗口限流的示例：

```python
import redis
import time

# 创建 Redis 客户端
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def is_rate_limited(user_id, limit=100, window=60):
    """
    检查用户是否超过了限流限制
    
    :param user_id: 用户标识
    :param limit: 每个时间窗口内的最大请求次数
    :param window: 时间窗口的长度（秒）
    :return: 如果请求被限流，则返回 True，否则返回 False
    """
    key = f"rate_limit:{user_id}"
    
    # 使用 Redis 的 INCR 命令递增计数器
    current_count = redis_client.incr(key)
    
    # 如果计数器是第一次创建，设置过期时间
    if current_count == 1:
        redis_client.expire(key, window)
    
    # 返回是否超过了限流限制
    return current_count > limit

# 示例用法
user_id = "user123"
if is_rate_limited(user_id):
    print("请求被限流")
else:
    print("请求被允许")
```

##### 2.3. 说明

1. **计数器递增**：每次请求时，我们使用 `INCR` 命令递增用户的计数器。如果计数器是第一次创建（即 `current_count` 为 1），我们设置一个过期时间以确保计数器在窗口结束时被重置。
   
2. **设置过期时间**：通过 `EXPIRE` 命令设置计数器的过期时间为窗口长度（例如 60 秒），这会在时间窗口结束时自动重置计数器。

3. **检查限流**：每次请求时，检查计数器的值是否超过限制（例如 100 次）。如果超过了限制，返回 `True` 表示请求被限流；否则返回 `False`。

#### 3. 实践中的考虑

- **高并发**：如果系统中的请求量非常大，可以使用 Redis 的 `MULTI` 和 `EXEC` 命令确保操作的原子性。使用 Lua 脚本可以进一步提升性能。
- **误差处理**：确保 Redis 服务器的稳定性和可靠性，避免因 Redis 服务器不可用导致的限流问题。
- **分布式系统**：在分布式环境中，使用 Redis 集群可以有效地管理和分布请求计数。

#### 4. 总结

Redis API 限流可用于管理系统资源、限制滥用并维持服务公平性。策略和参数需要结合业务请求特征调整。

## 参考资料

- [Redis 开发文档 · 场景](https://redis.io/docs/latest/develop/use-cases/)
- INCR（未找到权威出处（待核））

<!-- BACKLINKS-AUTO -->
## 相关页面

- [README](/use-cases/README.md)
- [rate-limiting](/use-cases/rate-limiting.md)
