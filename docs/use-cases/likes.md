# Likes

The like feature comes down to two core questions: "how many times has this piece of content been liked" and "has this user liked it". The first is a counter, the second a set; combining the two implements the whole feature.

## Data structure design

- `like:count:{content_id}`: a String counter holding the total like count;
- `like:users:{content_id}`: a Set recording who liked it, used for de-duplication and for checking whether a user has already liked it;
- `like:user:{user_id}`: a Set (optional) recording the content a user has liked, for the "my likes" list.

## Command demo

```bash
# User 42 likes content 1001 (SADD returns 1 if not liked before, 0 if it was a duplicate like)
SADD like:users:1001 42        # 1
INCR like:count:1001           # 1

# Unlike
SREM like:users:1001 42        # 1
DECR like:count:1001

# Check whether already liked
SISMEMBER like:users:1001 42   # 0

# Like list and total count
SADD like:users:1001 42 43 44
SMEMBERS like:users:1001
SCARD like:users:1001                   # 3

# Quickly count the users who liked both pieces of content
SADD like:users:1002 43 44 45
SINTERCARD 2 like:users:1001 like:users:1002   # 2 (Redis 7.0+, returns only the count, not the members)
```

## Python example

```python
import redis

r = redis.Redis(decode_responses=True)


def like(content_id, user_id):
    added = r.sadd(f'like:users:{content_id}', user_id)
    if added:  # only the first like is counted, so no duplicates
        r.incr(f'like:count:{content_id}')
        return True
    return False


def unlike(content_id, user_id):
    removed = r.srem(f'like:users:{content_id}', user_id)
    if removed:
        r.decr(f'like:count:{content_id}')
        return True
    return False


def has_liked(content_id, user_id):
    return r.sismember(f'like:users:{content_id}', user_id)


def like_count(content_id):
    return int(r.get(f'like:count:{content_id}') or 0)


if __name__ == '__main__':
    print(like(1001, 42))       # True
    print(like(1001, 42))       # False, a duplicate like is filtered out
    print(like_count(1001))     # 1
    print(has_liked(1001, 42))  # True
    unlike(1001, 42)
    print(like_count(1001))     # 0
```

## Choosing between the two approaches

- **Need "who liked it" and de-duplication**: use the Set + counter approach above. If the number of liking users can get very large (hundreds of thousands or more), a Set costs a lot of memory, so the "has liked" check can move to a bitmap (user ID as the bit offset, sensible only when IDs are contiguous), or you can keep just the counter and write the detail to a database asynchronously.
- **Only need the count**: a plain `INCR`/`DECR` counter is enough; leave de-duplication to a unique index in the database.

## Notes

- The counter and the Set are two separate keys, so in extreme cases (such as a process interruption) they can drift out of sync; periodically recalibrate `like:count` with `SCARD`.
- Like keys for hot content are hot keys; if needed, shard the counter and accumulate into the shards, merging them periodically.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Sets](https://redis.io/docs/latest/develop/data-types/sets/)
- SADD (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [redis-use-cases](redis-use-cases.md)
