Rate limiting strategies are a way of controlling the use of system resources, aimed at preventing excessive requests from putting pressure on the system and thereby safeguarding its stability and availability. Redis is a common tool for rate limiting; its efficient operations and support for atomicity make it very well suited to high-concurrency scenarios. Below are the common rate limiting strategies and how they are implemented in Redis.

For an overview of the four strategies see [Rate limiting](../rate-limiting.md); for the API gateway and development angles see [API rate limiting practice](api.md) and [Rate limiter development examples](/development/rate-limiter).

### Common rate limiting strategies

1. **Fixed window rate limiting**

   Fixed window rate limiting limits the number of requests within each fixed time window. For example, it allows 100 requests per minute. After the window ends, the request counter is reset.

   - **Pros**: simple to implement and easy to understand.
   - **Cons**: there can be a burst of requests at a window boundary (for example, many requests at second 59), causing request volume to spike over a short period.

   **Implementation**:
   Use Redis' `INCR` command together with key expiry.

   ```python
   import redis

   redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

   def is_rate_limited(user_id, limit=100, window=60):
       key = f"rate_limit:{user_id}"
       current_count = redis_client.incr(key)
       if current_count == 1:
           redis_client.expire(key, window)
       return current_count > limit
   ```

2. **Sliding window rate limiting**

   Sliding window rate limiting is more precise than the fixed window approach, limiting the number of requests over any point in time. For example, it allows at most 100 requests within any 60-second period.

   - **Pros**: limits requests more smoothly and reduces burst traffic.
   - **Cons**: more complex to implement, and requires maintaining timestamps and counters.

   **Implementation**:
   Maintain a sorted set (`ZSET`) holding timestamps and counters, and periodically clean up expired records.

   ```python
   import redis
   import time
   import uuid

   redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

   def is_rate_limited(user_id, limit=100, window=60):
       key = f"rate_limit:{user_id}"
       now = time.time()
       redis_client.zremrangebyscore(key, '-inf', now - window)
       # Use a unique member so requests within the same second do not overwrite each other and skew the count
       redis_client.zadd(key, {f"{now}:{uuid.uuid4().hex}": now})
       redis_client.expire(key, window)
       return redis_client.zcard(key) > limit
   ```

3. **Leaky bucket algorithm**

   The leaky bucket algorithm regulates request traffic to a fixed rate. Requests "leak" out of the bucket at a fixed rate, and requests arriving when the bucket is full are dropped.

   - **Pros**: controls the request rate and prevents burst traffic.
   - **Cons**: may require extra logic to handle bucket capacity and flow rate.

   **Implementation**:
   Use a Redis hash to keep track of the bucket's "water level"; add 1 when a request arrives, let water leak out automatically according to elapsed time, and reject the request when the bucket is full.

   ```python
   import redis
   import time

   redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

   def is_rate_limited(user_id, rate=10, capacity=100):
       # rate: requests leaking out per minute; capacity: the bucket's maximum capacity
       key = f"leaky_bucket:{user_id}"
       now = int(time.time())

       data = redis_client.hgetall(key)
       if data:
           last_time = int(data["last_time"])
           level = float(data["level"])
           # Based on the elapsed time, leak out the corresponding number of requests at the rate
           level = max(0.0, level - rate * (now - last_time) / 60)
       else:
           level = 0.0

       redis_client.hset(key, mapping={"level": level, "last_time": now})
       redis_client.expire(key, 3600)

       # A new request enters the bucket; if it is full, drop the request (rate limited)
       if level + 1 > capacity:
           return True

       # Not full: the request enters the bucket and the water level goes up by 1
       redis_client.hset(key, "level", level + 1)
       return False
   ```

4. **Token bucket algorithm**

   The token bucket algorithm allows burst traffic while keeping the average request rate in check over the long run. Tokens are generated at a fixed rate and stored in the bucket. Each request consumes one token.

   - **Pros**: allows burst traffic while still controlling the average rate.
   - **Cons**: complex to implement, and requires managing the bucket's capacity and token generation rate.

   **Implementation**:
   Use Redis counters and a timed task to simulate a token bucket.

   ```python
   import redis
   import time

   redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

   def is_rate_limited(user_id, rate=10, capacity=100):
       # rate: tokens replenished per minute; capacity: the bucket's maximum capacity
       key = f"token_bucket:{user_id}"
       now = int(time.time())
       last_fill_time = redis_client.hget(key, "last_fill_time")

       if last_fill_time:
           elapsed_time = now - int(last_fill_time)
           # Replenish tokens at the rate, but never beyond the bucket's capacity
           added_tokens = min(rate * (elapsed_time / 60), capacity)
           current_tokens = float(redis_client.hget(key, "tokens") or 0) + added_tokens
           current_tokens = min(capacity, current_tokens)
           redis_client.hset(key, "tokens", current_tokens)
           redis_client.hset(key, "last_fill_time", now)
       else:
           current_tokens = float(capacity)
           redis_client.hset(key, "tokens", current_tokens)
           redis_client.hset(key, "last_fill_time", now)

       redis_client.expire(key, 3600)

       # If the bucket holds at least one token, consume one and let the request through
       if current_tokens >= 1:
           redis_client.hincrbyfloat(key, "tokens", -1)
           return False
       else:
           return True
   ```

### Summary

Rate limiting is an important part of system design and can effectively prevent excessive requests from putting pressure on the system. Different rate limiting strategies suit different scenarios, and the right choice depends on the requirements and characteristics of your system. Redis provides efficient operations and atomicity support, which makes implementing rate limiting strategies relatively simple and efficient.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- INCR (no authoritative source found; to be verified)
- EXPIRE (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](/use-cases/README.md)
- [rate-limiting](/use-cases/rate-limiting.md)
