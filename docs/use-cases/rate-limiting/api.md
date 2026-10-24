### Real case: API rate limiting

This page starts from the per-user fixed-window requirement of an API gateway; for multiple strategies and the trade-offs between them see [Rate limiting strategies](strategies.md), and for several rate limiter examples from development projects see &#8203;Implementing a rate limiter with Redis<!-- EN-LINK: /development/rate-limiter -->.

In modern applications, API rate limiting is an important means of protecting services from abuse and ensuring fair use. The following is an example showing how to implement API rate limiting with Redis. This example covers the fixed window strategy, since it is one of the most basic and easiest-to-understand rate limiting strategies.

#### 1. Background

Suppose we have an API that must limit the number of requests per user per minute, for example allowing at most 100 requests per user per minute. We can use Redis to implement this limit.

#### 2. Fixed window rate limiting

##### 2.1. Configuration

The implementation increments a counter with Redis `INCR` and sets an expiry with `EXPIRE`; the counter resets at the start of each time window.

##### 2.2. Code example

The following example implements fixed window rate limiting using Python and the `redis-py` library:

```python
import redis
import time

# Create a Redis client
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def is_rate_limited(user_id, limit=100, window=60):
    """
    Check whether the user has exceeded the rate limit

    :param user_id: the user identifier
    :param limit: the maximum number of requests within a time window
    :param window: the length of the time window (in seconds)
    :return: returns True if the request is rate limited, otherwise False
    """
    key = f"rate_limit:{user_id}"

    # Use Redis' INCR command to increment the counter
    current_count = redis_client.incr(key)

    # If the counter was just created, set an expiration
    if current_count == 1:
        redis_client.expire(key, window)

    # Return whether the rate limit was exceeded
    return current_count > limit

# Example usage
user_id = "user123"
if is_rate_limited(user_id):
    print("Request was rate limited")
else:
    print("Request was allowed")
```

##### 2.3. How it works

1. **Incrementing the counter**: on each request we use the `INCR` command to increment that user's counter. If the counter is being created for the first time (that is, `current_count` is 1), we set an expiration so that the counter is reset when the window ends.

2. **Setting the expiration**: the `EXPIRE` command sets the counter's expiration to the length of the window (for example 60 seconds), which automatically resets the counter at the end of the time window.

3. **Checking the limit**: on each request we check whether the counter's value exceeds the limit (for example 100 requests). If it exceeds the limit, we return `True` to indicate that the request is rate limited; otherwise we return `False`.

#### 3. Considerations in practice

- **High concurrency**: if the request volume in the system is very large, you can use Redis `MULTI` and `EXEC` to guarantee that the operations are atomic. Using Lua scripts can improve performance further.
- **Error handling**: make sure the Redis server is stable and reliable, so that an unavailable Redis server does not break rate limiting.
- **Distributed systems**: in a distributed environment, using a Redis cluster can effectively manage and distribute request counts.

#### 4. Summary

Redis-based API rate limiting can be used to manage system resources, limit abuse, and maintain fair service usage. The strategy and its parameters need to be tuned to match the request characteristics of your business.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- INCR (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/use-cases/README.md)
- [rate-limiting](/use-cases/rate-limiting.md)
