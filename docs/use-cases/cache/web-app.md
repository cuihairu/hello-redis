## Real case: Web app caching

This page records Flask cases for page, data, and distributed caching; for strategy classification and selection see [Cache strategies and practices](strategies.md).

In modern Web applications, caching is an important means of improving performance and user experience. The following real-world cases show how to use Redis effectively as a caching system in a Web application:

### 1. Page caching

**Scenario**:
Dynamically generated page content needs frequent access, such as the home page or product detail pages.

**Implementation**:
- **Cache page content**: store the dynamically generated page content in Redis, with the cache key being the page URL or the request parameters. When a user requests the page, fetch the content from the Redis cache first; if it is not in the cache, query the database and update the cache.
- **Expiration time**: set a sensible expiration time to keep page content timely. Choose the right expiration strategy based on how often the page content changes, such as a short cache for popular pages and a long one for pages that rarely change.

**Example**:
```python
# Python example
import redis
from flask import Flask, request, render_template

app = Flask(__name__)
cache = redis.Redis(host='localhost', port=6379, db=0)

@app.route('/product/<product_id>')
def product(product_id):
    cache_key = f'product:{product_id}'
    cached_content = cache.get(cache_key)

    if cached_content:
        return cached_content.decode('utf-8')

    # simulate fetching data from the database
    product_data = get_product_from_database(product_id)
    page_content = render_template('product.html', product=product_data)

    cache.setex(cache_key, 3600, page_content)  # cache for 1 hour
    return page_content
```

### 2. Data caching

**Scenario**:
Frequently queried database results, such as user information, popular articles, and comments.

**Implementation**:
- **Cache query results**: store query results in Redis, with the cache key being a hash of the query conditions. When a user issues a query, fetch the data from the Redis cache first; if it is not in the cache, query the database and update the cache.
- **Data updates**: when data in the database changes, update or clear the cache entry promptly to keep data consistent.

**Example**:
```python
# Python example
import json
import redis
from flask import Flask, request, jsonify

app = Flask(__name__)
cache = redis.Redis(host='localhost', port=6379, db=0)

@app.route('/user/<user_id>')
def user_info(user_id):
    cache_key = f'user:{user_id}'
    cached_data = cache.get(cache_key)

    if cached_data:
        return cached_data.decode('utf-8')

    # simulate fetching data from the database
    user_data = get_user_from_database(user_id)
    user_json = json.dumps(user_data)

    cache.setex(cache_key, 3600, user_json)  # cache for 1 hour
    return user_json
```

### 3. Distributed caching

**Scenario**:
Multiple Web servers need to share a cache so that all servers access the same cached data.

**Implementation**:
- **Share a Redis instance**: use the same Redis instance as the cache across multiple Web servers, ensuring cached data is consistent and shared.
- **Cache invalidation strategy**: set a consistent cache invalidation strategy to avoid data inconsistency caused by cache expiration.

**Example**:
```bash
# configure multiple Web servers to use the same Redis instance
redis-server --bind 0.0.0.0 --port 6379
```

```python
# Python example (on different servers)
import json
import redis
from flask import Flask, request, render_template

app = Flask(__name__)
cache = redis.Redis(host='redis-server', port=6379, db=0)

@app.route('/data/<data_id>')
def data(data_id):
    cache_key = f'data:{data_id}'
    cached_data = cache.get(cache_key)

    if cached_data:
        return cached_data.decode('utf-8')

    # simulate fetching data from the database
    data = get_data_from_database(data_id)
    data_json = json.dumps(data)

    cache.setex(cache_key, 3600, data_json)  # cache for 1 hour
    return data_json
```

### 4. Cache strategies and optimization

**Strategy selection**:
- **Appropriate cache expiration times**: set a sensible expiration time based on how often the data changes, avoiding the performance drop caused by cache expiration.
- **Cache cleanup strategy**: use LRU or LFU to clean up expired or rarely used cached data, keeping the cache efficient.

**Optimization suggestions**:
- **Cache warm-up**: preload frequently used data into the cache at system startup to improve response speed.
- **Cache sharding**: use Redis sharding to spread cached data across different Redis instances, improving cache scalability and performance.

Through these real-world cases and strategies, Web applications can effectively leverage Redis caching to improve system performance, reduce database load, and enhance the user experience.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/use-cases/README.md)
- [cache](/use-cases/cache.md)
- [caching](/use-cases/caching.md)
