# 实时数据处理

实时数据处理指数据产生后立刻处理分析，用于金融监控、在线推荐、物联网数据分析、实时日志分析等场景。Redis 的内存操作与 Streams、有序集合等结构适合承接这类负载。

## 选型速查

| 需求 | 做法 |
| --- | --- |
| 事件流写入与消费 | Streams + 消费者组 |
| 实时排名与聚合 | ZSET（`ZINCRBY` + `ZRANGE ... REV`） |
| 最近 N 条日志/事件 | Streams（`XRANGE`）或 List（`LPUSH` + `LRANGE`） |
| 时间窗口计数 | 按时间分片的 String（`INCR`） |

## 用 Streams 处理事件流

Streams 是 Redis 专为流数据设计的结构，支持持久化、消费组与回溯，适合实时日志、消息队列等场景。

```python
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def add_event(event_type, data):
    redis_client.xadd('events', {'type': event_type, 'data': data}, id='*')

def get_events(start='0', end='+'):
    return redis_client.xrange('events', min=start, max=end)

# 示例：添加事件数据
add_event('user_login', '{"user_id": "user123", "timestamp": "2024-08-08T12:34:56Z"}')

# 示例：获取事件数据
print(get_events())
```

## 用 ZSET 做实时聚合

有序集合的 `ZINCRBY` 在写入时维护排序，适合实时排名或用户活动聚合。

```python
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def add_user_score(user_id, score):
    redis_client.zincrby('user_scores', score, user_id)

def get_top_users(top_n=10):
    return redis_client.zrange('user_scores', 0, top_n - 1, desc=True, withscores=True)

# 示例：添加用户分数
add_user_score('user123', 100)
add_user_score('user456', 200)

# 示例：获取前10名用户
print(get_top_users())
```

## 实时日志分析

日志条目写入 Streams 后按范围读取或交给消费组处理；相比 List，Streams 支持按 ID 回溯与消费确认。

```python
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def add_log_entry(log_message):
    redis_client.xadd('logs', {'message': log_message}, id='*')

def get_recent_logs(count=100):
    return redis_client.xrange('logs', count=count)

# 示例：添加日志条目
add_log_entry('User login event at 2024-08-08T12:34:56Z')

# 示例：获取最近的日志条目
print(get_recent_logs())
```

## 请求量监控与报警

按秒分片计数，`INCR` 原子累加，再遍历最近 60 个分片求和做阈值判断。

```python
import redis
import time

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def log_request():
    timestamp = int(time.time())
    redis_client.incr(f'requests:{timestamp}')

def check_requests(threshold=100):
    current_time = int(time.time())
    count = 0
    for timestamp in range(current_time - 60, current_time):
        count += int(redis_client.get(f'requests:{timestamp}') or 0)
    if count > threshold:
        print(f'Alert! High request volume: {count}')

# 示例：每秒记录一个请求
while True:
    log_request()
    time.sleep(1)
    check_requests()
```

每秒一个键会让键数量随时间增长，分片键要设 TTL 定期清理；窗口边界处的突刺流量可能漏报，精确窗口可用 ZSET 滑动窗口实现。

## 注意事项

- Streams 要设 `MAXLEN` 上限，避免日志型结构无限增长。
- 实时聚合的 ZSET 只在内存中，进程重启即丢，需要时用 `ZADD` 快照持久化或定期回写数据库。
