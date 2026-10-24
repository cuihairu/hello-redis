# Caching

This page focuses on the Cache-Aside read/write pattern and how to handle related problems. For project strategy and practice cases, see [Cache strategies and practices](cache/strategies.md) and [Web app caching](cache/web-app.md).

For an overview of scenario benefits and system maintenance costs, see [Caching overview](cache.md); this page records Cache-Aside, cache problems, and consistency handling in depth.

## Cache-Aside pattern

The most commonly used read/write pattern is Cache-Aside:

1. A read request checks Redis first; on a hit it returns the value directly;
2. On a miss it queries the database and writes the result into Redis, also setting an expiration time;
3. A write request updates the database first, then deletes (or updates) the corresponding cache entry.

The following Python example demonstrates this flow (requires `pip install redis`, and assumes Redis is running on 6379 locally):

```python
import json
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)


def get_user(user_id):
    key = f'user:{user_id}'
    cached = r.get(key)
    if cached is not None:
        return json.loads(cached)

    user = query_user_from_db(user_id)  # cache miss, fall back to the database
    if user is None:
        return None
    # write to cache with a 10-minute TTL so cold data does not sit in memory long-term
    r.set(key, json.dumps(user), ex=600)
    return user


def update_user(user_id, **fields):
    update_user_in_db(user_id, **fields)  # update the database first
    r.delete(f'user:{user_id}')           # then delete the cache; it is rebuilt on the next read


def query_user_from_db(user_id):
    # simulate a database query
    return {'id': user_id, 'name': 'Alice'}


def update_user_in_db(user_id, **fields):
    pass  # simulate a database update


if __name__ == '__main__':
    print(get_user(1))   # first call falls back and writes the cache
    print(get_user(1))   # second call hits the cache
```

## The three key cache problems

- **Cache penetration**: the requested data does not exist at all, so every request reaches the database. Remedies: cache empty results with a short TTL, or use a Bloom filter to short-circuit them.
- **Cache breakdown**: the moment a hot key expires, a flood of requests all hits the database at once. Remedies: use a mutex (`SET key value NX EX 5`) so only one request rebuilds the cache, or give hot keys no expiration.
- **Cache avalanche**: large numbers of keys expire at the same instant. Remedies: layer a random jitter on top of the base TTL and stagger the expiration times.

## Expiration and eviction

- Set a TTL with `EXPIRE` / `SET ... EX`, and inspect remaining lifetime with `TTL`.
- Once memory reaches `maxmemory`, Redis evicts according to `maxmemory-policy`; cache workloads typically use `allkeys-lru` or `volatile-lru`.

## Consistency with the database

Updating the database first and then deleting the cache (Cache-Aside) is the simple and safe choice in the large majority of cases. If you need stronger consistency, you can subscribe to the database binlog (e.g. Canal) and delete the cache asynchronously, or set a fallback TTL on the cache to bound the inconsistency window.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Client-side caching](https://redis.io/docs/latest/develop/use/client-side-caching/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [faq](/appendix/faq.md)
- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
- [README](README.md)
- [cache](cache.md)
- &#8203;redis-use-cases<!-- EN-LINK: redis-use-cases.md -->
