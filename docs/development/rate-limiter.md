Implementing a rate limiter with Redis is a common application scenario, especially when you need to control request rates, protect system resources, or avoid overload. Redis provides several ways to implement a rate limiter, including counter-based and sliding-window strategies. The following are some commonly used Redis rate limiting implementations:

From a development-implementation perspective, this page puts counter, sliding-window, and token-bucket examples side by side; for the per-user fixed-window case of an API gateway, see [API rate limiting in practice](/use-cases/rate-limiting/api).

# 1. Counter-based rate limiting

This method uses Redis counters to limit the number of operations within a time window. It is suitable for simple rate limiting needs.

**Implementation steps**:
1. **Set up the counter**: Use Redis' `INCR` command to increment the counter.
2. **Set an expiry time**: Use the `EXPIRE` command to set the counter's expiry time, so that the counter resets in each time window.
3. **Check the counter value**: Check whether the counter's value has exceeded the preset limit.

**Example code (Python)**:
```python
import redis
import time

r = redis.Redis(host='localhost', port=6379)

def rate_limiter(key, max_requests, window_seconds):
    # Generate a unique counter key
    counter_key = f"{key}:counter"
    # Generate an expiry key
    expire_key = f"{key}:expire"

    # Get the current request count
    requests = r.get(counter_key)
    if requests is None:
        # First request; set the counter and expiry time
        r.set(counter_key, 1, ex=window_seconds)
    else:
        # Increment the counter
        requests = int(requests)
        if requests < max_requests:
            r.incr(counter_key)
        else:
            # Exceeded the limit
            return False
    
    return True

# Use the rate limiter
if rate_limiter("user:123", max_requests=10, window_seconds=60):
    print("request allowed")
else:
    print("request rejected")
```

## 2. Sliding window rate limiting

The sliding-window method is more precise than the counter method, because it avoids request bursts concentrated at the window boundary.

**Implementation steps**:
1. **Record request times**: On each request, store the current timestamp in a Redis list.
2. **Clean up expired timestamps**: Periodically remove timestamps that fall outside the time window.
3. **Check the request count**: Count the timestamps within the time window to decide whether to allow the request.

**Example code (Python)**:
```python
import redis
import time

r = redis.Redis(host='localhost', port=6379)

def rate_limiter(key, max_requests, window_seconds):
    # Generate a unique timestamp-list key
    timestamps_key = f"{key}:timestamps"
    
    now = int(time.time())
    window_start = now - window_seconds
    
    # Remove expired timestamps
    r.zremrangebyscore(timestamps_key, 0, window_start)
    
    # Get the number of timestamps
    count = r.zcard(timestamps_key)
    
    if count < max_requests:
        # Add the current timestamp
        r.zadd(timestamps_key, {now: now})
        return True
    else:
        # Exceeded the limit
        return False

# Use the rate limiter
if rate_limiter("user:123", max_requests=10, window_seconds=60):
    print("request allowed")
else:
    print("request rejected")
```

## 3. Using Redis' `TOKEN BUCKET` algorithm

The `TOKEN BUCKET` algorithm is a more complex rate limiting strategy, suitable for handling bursty requests.

**Implementation steps**:
1. **Set the bucket's capacity and rate**: Initialize the token bucket.
2. **Take a token**: On each request, check whether the bucket has enough tokens.
3. **Add tokens**: Add tokens to the bucket periodically.

**Example code (Python)**:
```python
import redis
import time

r = redis.Redis(host='localhost', port=6379)

def token_bucket(key, capacity, refill_rate):
    tokens_key = f"{key}:tokens"
    last_refill_key = f"{key}:last_refill"
    
    now = int(time.time())
    last_refill = r.get(last_refill_key)
    if last_refill is None:
        # Initial state
        r.set(tokens_key, capacity)
        r.set(last_refill_key, now)
        last_refill = now
    
    last_refill = int(last_refill)
    elapsed = now - last_refill
    tokens = int(r.get(tokens_key))
    
    # Calculate the new token count
    tokens = min(capacity, tokens + elapsed * refill_rate)
    r.set(tokens_key, tokens)
    r.set(last_refill_key, now)
    
    if tokens > 0:
        r.decr(tokens_key)
        return True
    else:
        return False

# Use the rate limiter
if token_bucket("user:123", capacity=10, refill_rate=1):
    print("request allowed")
else:
    print("request rejected")
```

## Summary

There are several ways to implement a rate limiter with Redis, and each suits different scenarios and requirements. The simple counter method fits basic rate limiting needs, while the sliding-window and token-bucket algorithms suit more complex and precise ones. In practice, choose the rate limiting strategy that fits your specific business needs and system load.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- INCR (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
