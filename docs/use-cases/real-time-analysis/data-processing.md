# Real-time data processing

This article focuses on the processing path from Streams to ZSET; for the complete dashboard case, see [Real-time data dashboard](dashboard.md).

Real-time data processing means handling and analyzing data as soon as it is produced, used in scenarios such as financial monitoring, online recommendation, Internet of Things data analysis, and real-time log analysis. Redis's in-memory operations and structures such as Streams and sorted sets are well suited to take on this kind of load.

## Selection cheat sheet

| Need | Approach |
| --- | --- |
| Event stream write and consume | Streams + consumer groups |
| Real-time ranking and aggregation | ZSET (`ZINCRBY` + `ZRANGE ... REV`) |
| Last N logs/events | Streams (`XRANGE`) or List (`LPUSH` + `LRANGE`) |
| Time-window counting | Time-sliced Strings (`INCR`) |

## Processing event streams with Streams

Streams are a structure designed by Redis specifically for stream data, supporting persistence, consumer groups, and replay; they suit scenarios such as real-time logs and message queues.

```python
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def add_event(event_type, data):
    redis_client.xadd('events', {'type': event_type, 'data': data}, id='*')

def get_events(start='0', end='+'):
    return redis_client.xrange('events', min=start, max=end)

# Example: add event data
add_event('user_login', '{"user_id": "user123", "timestamp": "2024-08-08T12:34:56Z"}')

# Example: get event data
print(get_events())
```

## Real-time aggregation with ZSET

The sorted set's `ZINCRBY` maintains sorting on write, which is suitable for real-time ranking or user activity aggregation.

```python
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def add_user_score(user_id, score):
    redis_client.zincrby('user_scores', score, user_id)

def get_top_users(top_n=10):
    return redis_client.zrange('user_scores', 0, top_n - 1, desc=True, withscores=True)

# Example: add user scores
add_user_score('user123', 100)
add_user_score('user456', 200)

# Example: get the top 10 users
print(get_top_users())
```

## Real-time log analysis

Log entries are written to Streams, then read by range or handed off to consumer groups for processing; compared to Lists, Streams support replay by ID and consumer acknowledgements.

```python
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def add_log_entry(log_message):
    redis_client.xadd('logs', {'message': log_message}, id='*')

def get_recent_logs(count=100):
    return redis_client.xrange('logs', count=count)

# Example: add a log entry
add_log_entry('User login event at 2024-08-08T12:34:56Z')

# Example: get recent log entries
print(get_recent_logs())
```

## Request volume monitoring and alerting

Count in per-second slices with `INCR` for atomic accumulation, then iterate over the last 60 slices, sum them, and check against a threshold.

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

# Example: record one request per second
while True:
    log_request()
    time.sleep(1)
    check_requests()
```

One key per second means the key count grows over time, so slice keys should have a TTL set for periodic cleanup; traffic spikes at window boundaries may be missed, and a precise window can be implemented with a ZSET sliding window.

## Notes

- Streams should have a `MAXLEN` limit set to avoid log-type structures growing without bound.
- The ZSET for real-time aggregation lives only in memory and is lost on process restart; when needed, persist it with a `ZADD` snapshot or write back to the database periodically.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Streams](https://redis.io/docs/latest/develop/data-types/streams/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/use-cases/README.md)
- [real-time-analysis](/use-cases/real-time-analysis.md)
