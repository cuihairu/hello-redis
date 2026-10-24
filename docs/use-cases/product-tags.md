# Product tags

Products and tags have a many-to-many relationship: one product can carry many tags, and one tag maps to many products. Sets natively support intersection, union, and difference operations, which makes them a good fit for storing tag relationships.

## Data structure design

- `tags:product:{product ID}`: all tags of that product;
- `tag:{tag name}:products`: all product IDs that carry that tag.

## Command demo

```bash
# Tag products 1001 and 1002
SADD tags:product:1001 new hot electronics
SADD tags:product:1002 new home

# Reverse index: tag -> products
SADD tag:new:products 1001 1002
SADD tag:hot:products 1001

# Look up all tags of a product
SMEMBERS tags:product:1001

# Products tagged with both "new" and "hot" (intersection)
SINTER tag:new:products tag:hot:products

# Products tagged "new" but not "hot" (difference)
SDIFF tag:new:products tag:hot:products

# Products tagged with "new" or "hot" (union)
SUNION tag:new:products tag:hot:products
```

## Python example

```python
import redis

r = redis.Redis(decode_responses=True)


def add_tags(product_id, tags):
    pipe = r.pipeline()
    pipe.sadd(f'tags:product:{product_id}', *tags)
    for tag in tags:
        pipe.sadd(f'tag:{tag}:products', product_id)
    pipe.execute()   # One pipeline commit, fewer round trips


def products_with_all(tags):
    keys = [f'tag:{t}:products' for t in tags]
    return r.sinter(*keys)


def products_without(tag):
    # A diff query against the whole catalog needs a baseline set of all products
    return r.smembers(f'tag:{tag}:products')


def remove_tags(product_id, tags):
    pipe = r.pipeline()
    pipe.srem(f'tags:product:{product_id}', *tags)
    for tag in tags:
        pipe.srem(f'tag:{tag}:products', product_id)
    pipe.execute()


if __name__ == '__main__':
    add_tags(1001, ['new', 'hot', 'electronics'])
    add_tags(1002, ['new', 'home'])
    print(sorted(r.smembers('tags:product:1001')))          # ['electronics', 'hot', 'new']
    print(sorted(products_with_all(['new', 'hot'])))       # ['1001']
    remove_tags(1001, ['hot'])
    print(sorted(products_with_all(['new', 'hot'])))       # []
```

## Usage tips

- **Maintain keys in both directions**: forward (product → tags) for display, reverse (tag → products) for filtering; update both with a pipeline when tagging or untagging.
- **When tags grow large**: a single tag's product set can become very large, so use `SSCAN` to iterate in pages, or split tags into different databases/shards by popularity.
- **When you need to sort by sales volume and so on**: switch the reverse index from a Set to a Sorted Set (sales volume as the score), and use `ZINTERSTORE` for the intersection.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Sets](https://redis.io/docs/latest/develop/data-types/sets/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- &#8203;redis-use-cases<!-- EN-LINK: redis-use-cases.md -->
