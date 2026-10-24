# Product filtering

An e-commerce filtering page usually has multiple conditions: category, brand, price range, attributes, and so on. If you pre-compute the set of matching product IDs for each condition, multi-condition filtering becomes set intersection, union, and difference operations — all done inside Redis, with no need to scan the database.

## Data structure design

Each condition maps to one set, with the key name containing the dimension and the value:

- `filter:category:phone` — phones category
- `filter:brand:apple` — Apple brand
- `filter:price:0-1000` — price 0–1000 yuan
- `filter:tag:new` — new products

## Command demo

```bash
# Pre-compute: condition -> product set
SADD filter:category:phone 1001 1002 1003
SADD filter:brand:apple 1002 1004
SADD filter:price:0-1000 1001 1004 1005

# Required conditions: category=phones AND brand=Apple
SINTER filter:category:phone filter:brand:apple        # {1002}

# Exclusion: category=phones but NOT brand=Apple
SDIFF filter:category:phone filter:brand:apple         # {1001, 1003}

# Optional widening: brand=Apple OR price<1000
SUNION filter:brand:apple filter:price:0-1000          # {1001, 1002, 1004, 1005}

# When you only need the count, use SINTERCARD (returns no members, Redis 7.0+), pair with LIMIT for paging
SINTERCARD 2 filter:category:phone filter:brand:apple LIMIT 100
```

## Python example

```python
import redis

r = redis.Redis(decode_responses=True)


def build_index(dim, value, product_ids):
    key = f'filter:{dim}:{value}'
    if product_ids:
        r.sadd(key, *product_ids)


def query(required=None, excluded=None, any_of=None, limit=50):
    required = required or []
    excluded = excluded or []
    any_of = any_of or []
    if any_of and len(any_of) > 1:
        # Multiple optional conditions are merged into a temporary set first
        r.sunionstore('filter:tmp:any', [f'filter:{k}' for k in any_of])
        base = ['filter:tmp:any']
    else:
        base = [f'filter:{k}' for k in any_of]
    keys = [f'filter:{k}' for k in required] + base
    if len(keys) > 1:
        r.sinterstore('filter:tmp:result', keys)
        result = 'filter:tmp:result'
    elif keys:
        result = keys[0]
    else:
        return []
    for k in excluded:
        r.sdiffstore('filter:tmp:result', [result, f'filter:{k}'])
        result = 'filter:tmp:result'
    page = r.sscan(result, count=limit)[1] if limit else r.smembers(result)
    r.delete('filter:tmp:result', 'filter:tmp:any')
    return page


if __name__ == '__main__':
    build_index('category', 'phone', ['1001', '1002', '1003'])
    build_index('brand', 'apple', ['1002', '1004'])
    print(sorted(query(required=['category:phone', 'brand:apple'])))   # ['1002']
    print(sorted(query(required=['category:phone'], excluded=['brand:apple'])))  # ['1001', '1003']
```

## Practical tips

- **Maintain indexes asynchronously**: update the sets through a message queue when products are listed/unlisted or repriced, so the write path stays fast.
- **When you need sorting in the results**: swap sets for sorted sets (store sales volume or price as the score), then use `ZINTERSTORE`/`ZUNIONSTORE` to compute the intersection or union and sort with `ZINTER` — mind the meaning of the aggregated score (`AGGREGATE MAX/MIN/SUM`).
- **Delete temporary sets promptly**: commands like `SINTERSTORE` create temporary keys; `DEL` them after use, or — before using `STORE` in cluster mode — make sure all input keys live on the same shard.
- **When there are too many dimensions**: don't build a set for every combination. Index only high-frequency conditions; fall back to a source query for long-tail combinations.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Sets](https://redis.io/docs/latest/develop/data-types/sets/)
- SINTER (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [redis-use-cases](redis-use-cases.md)
