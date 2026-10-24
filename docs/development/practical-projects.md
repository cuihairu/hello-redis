These examples come from common project problems in Redis cache integration, covering cache layers, cache consistency, and cache optimization.

# Practical Project 1: Caching API Responses

## Project Background

In web applications, the response time of API requests is critical to the user experience. Caching API responses can significantly reduce response time and database load.

## Implementation Steps

1. **Define a cache strategy**:
   - Use Redis as the cache store.
   - Set an appropriate cache expiration time (for example, 1 hour).

2. **Implement the cache logic**:
   - When handling an API request, first check whether cached data exists in Redis.
   - If cached data exists, return the cached content directly.
   - If there is no data in the cache, fetch the data from the database, update the cache, and return the data.

**Python example**

```python
from flask import Flask, request, jsonify
import redis
import requests

app = Flask(__name__)
r = redis.Redis()

@app.route('/api/data/<path:url>', methods=['GET'])
def get_data(url):
    cache_key = f"api_cache:{url}"
    cached_data = r.get(cache_key)
    
    if cached_data:
        return cached_data.decode('utf-8')
    
    response = requests.get(url)
    data = response.text
    
    r.set(cache_key, data, ex=3600)  # cache for 1 hour
    return data

if __name__ == '__main__':
    app.run()
```

## Practical Project 2: Protecting Against Cache Penetration

### Project Background

The cache penetration problem causes a large number of requests to bypass the cache and hit the database directly. A bloom filter can effectively reduce how often this happens.

## Implementation Steps

1. **Integrate a bloom filter**:
   - Use the bloom filter to determine whether the requested data exists.
   - If the data is not in the bloom filter, return empty or an error response directly.

2. **Implement the bloom filter logic**:
   - When caching data, add the related keys to the bloom filter.
   - Check for the presence of data in the bloom filter.

**Python example**

```python
from pybloom_live import BloomFilter

bloom_filter = BloomFilter(capacity=100000, error_rate=0.001)

@app.route('/api/data/<path:url>', methods=['GET'])
def get_data_with_bloom_filter(url):
    if url in bloom_filter:
        cache_key = f"api_cache:{url}"
        cached_data = r.get(cache_key)
        
        if cached_data:
            return cached_data.decode('utf-8')
        
        response = requests.get(url)
        data = response.text
        
        r.set(cache_key, data, ex=3600)
        return data
    else:
        return "Data not found", 404
```

## Practical Project 3: Preventing Cache Breakdown

### Project Background

The cache breakdown problem causes many requests to expire at the same time and hit the database directly. Using a Redis lock avoids having multiple requests reload the cache simultaneously.

## Implementation Steps

1. **Implement a Redis lock mechanism**:
   - Use a Redis lock to synchronize the cache-rebuild process.
   - If one request is rebuilding the cache, other requests need to wait or return a waiting result.

2. **Implement the lock mechanism**:
   - Set a lock key and attempt to acquire the lock when fetching data.
   - If the lock is acquired, reload the data into the cache and release the lock.
   - If the lock is not acquired, wait a while and then try again.

**Python example**

```python
import time

@app.route('/api/data/<path:url>', methods=['GET'])
def get_data_with_lock(url):
    cache_key = f"api_cache:{url}"
    lock_key = f"lock:{url}"
    
    if r.get(cache_key):
        return r.get(cache_key).decode('utf-8')
    
    if r.set(lock_key, 'lock', nx=True, ex=5):  # try to acquire the lock; the lock expires in 5 seconds
        try:
            response = requests.get(url)
            data = response.text
            r.set(cache_key, data, ex=3600)
            return data
        finally:
            r.delete(lock_key)
    else:
        time.sleep(1)  # wait 1 second and try again
        return get_data_with_lock(url)
```

## Practical Project 4: Cache Preloading

### Project Background

When the application starts, the cache can be preloaded to reduce pressure on the database during the initial period.

## Implementation Steps

1. **Define the data to preload**:
   - Determine the list of data that needs to be preloaded (such as hot data).

2. **Implement the preload logic**:
   - When the application starts, fetch the data from the data source and fill the cache.

**Python example**

```python
def preload_cache(url_list):
    for url in url_list:
        response = requests.get(url)
        data = response.text
        r.set(f"api_cache:{url}", data, ex=3600)

if __name__ == '__main__':
    # preload the cache when the application starts
    preload_cache(["https://example.com/page1", "https://example.com/page2"])
    app.run()
```

## Practical Project 5: Cache and Database Synchronization

### Project Background

When data is updated, the cache and the database must be updated at the same time to keep the data consistent.

## Implementation Steps

1. **Update the database and the cache**:
   - Implement the operation that updates the database.
   - Immediately after the database is updated, update the cache.

**Python example**

```python
def update_data(url, new_data):
    # update the database
    # db.update(url, new_data)  # assume a database update operation exists
    
    # update the cache
    r.set(f"api_cache:{url}", new_data, ex=3600)
```

## Summary

These implementations correspond to different caching scenarios and can serve as a reference when I work on cache optimization problems.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
