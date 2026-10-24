# User Follows, Recommendation Models, and Friend Relationships

The core of social relationships is "who follows whom". A set (Set) is well suited to storing unordered relationship lists, and its intersection, union, and difference operations can directly answer queries like common follows and people you might know, all computed inside Redis.

## Data Structure Design

- `follow:{user_id}`: the people I follow;
- `fans:{user_id}`: my fans;
- `mutual:{user_id}`: mutual friends (mutual follows), derived from set operations on the two above.

## Command Demo

```bash
# Follow action: both directions must be written (can be submitted in one pipeline)
SADD follow:42 43 44 45
SADD fans:43 42

# Who I follow
SMEMBERS follow:42

# Who follows me
SCARD fans:42

# My common follows: intersection of follow:42 and follow:43
SINTER follow:42 follow:43

# Mutual friends: following each other
SINTER follow:42 fans:42

# People you might know (recommendation): follow me but I don't follow them
SDIFF fans:42 follow:42

# Unfollow: remove both directions
SREM follow:42 43
SREM fans:43 42
```

## Python Example

```python
import redis

r = redis.Redis(decode_responses=True)


def follow(from_user, to_user):
    # Use a pipeline to make both directions update as atomically as possible
    pipe = r.pipeline()
    pipe.sadd(f'follow:{from_user}', to_user)
    pipe.sadd(f'fans:{to_user}', from_user)
    return pipe.execute()[0] == 1


def unfollow(from_user, to_user):
    pipe = r.pipeline()
    pipe.srem(f'follow:{from_user}', to_user)
    pipe.srem(f'fans:{to_user}', from_user)
    pipe.execute()


def common_follow(a, b):
    return r.sinter(f'follow:{a}', f'follow:{b}')


def recommend(a, limit=10):
    # Common fans of second-degree connections are also often used for recommendations; here is the simplest first-degree difference set
    candidates = r.sdiff(f'fans:{a}', f'follow:{a}')
    return list(candidates)[:limit]


def is_mutual(a, b):
    return r.sismember(f'follow:{a}', b) and r.sismember(f'follow:{b}', a)


if __name__ == '__main__':
    follow(42, 43)
    follow(42, 44)
    follow(43, 44)
    follow(43, 45)
    print(sorted(common_follow(42, 43)))   # ['44']
    print(recommend(43))                   # ['42']
    print(is_mutual(42, 43))               # False (43 doesn't follow 42)
```

## Advanced Recommendation Approaches

- **Second-degree connections**: `SUNIONSTORE` the `fans` sets of multiple friends, exclude yourself and people you already follow, then sort by the number of common friends (`ZINTERSTORE`).
- **People you might be interested in**: combine tags or behavioral data, score candidate users with a sorted set, and take the top N.
- **Fans of major accounts**: the fan set can have tens of millions of members, so use `SSCAN` to paginate iteration; fan writes can be sharded (`fans:{uid}:0..9`) and aggregated for statistics.

## Notes

- Follow/unfollow must update both sets at the same time, otherwise "one-way data" appears and recommendation results become inaccurate; submitting with a pipeline narrows the inconsistency window.
- Fan counts and follow counts can be cached in independent counters (`INCR`) to avoid frequent `SCARD`.
- When you only need statistics and don't care about members, HyperLogLog uses less memory than a set (for example, "people you might know" when you only need an estimated size).

## References

- [Redis Developer Docs · Use Cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis Developer Docs · Sets](https://redis.io/docs/latest/develop/data-types/sets/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [redis-use-cases](redis-use-cases.md)
