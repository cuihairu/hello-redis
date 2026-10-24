# Real-time analytics

This page lists the common data structures and commands along the dimensions of metric deduplication, ranking, and time bucketing.

This page focuses on the structures and commands behind each metric; for the Streams-based event aggregation pipeline, see the &#8203;real-time analytics overview<!-- EN-LINK: real-time-analysis.md -->.

## Common data structures

| Metric | Structure | Commands |
| --- | --- | --- |
| Clicks, order count | String | `INCR` / `INCRBY` |
| Unique visitors (UV) | HyperLogLog | `PFADD` / `PFCOUNT` |
| Trending search, real-time ranking | Sorted Set | `ZINCRBY` / `ZRANGE ... REV` |
| Per-period statistics | Hash | `HINCRBY` |
| Status details, deduplication | Set | `SADD` / `SCARD` |

## Command demo

```bash
# Event counting: page views per minute
INCR stats:pv:2024-06-03:14

# UV estimation (standard error about 0.81%, fixed memory footprint of around 12 KB)
PFADD stats:uv:2024-06-03 user:1 user:2 user:3
PFCOUNT stats:uv:2024-06-03

# Real-time trending search: add one point to the keyword per search
ZINCRBY hot:search 1 "redis tutorial"

# Distribution across hours (hash field ranges from 0 to 23)
HINCRBY stats:hourly:2024-06-03 14 1
```

## Python example: event aggregation and export

```python
import time
import redis

r = redis.Redis(decode_responses=True)


def on_event(kind, user_id=None):
    now = time.localtime()
    date, hour = time.strftime('%Y-%m-%d', now), now.tm_hour
    pipe = r.pipeline()
    pipe.incr(f'stats:{kind}:daily:{date}')
    pipe.incr(f'stats:{kind}:hourly:{date}:{hour}')
    if user_id:
        pipe.pfadd(f'stats:uv:{kind}:{date}', user_id)
    pipe.zincrby('stats:top:keywords', 1, kind)
    pipe.execute()


def snapshot(date):
    kinds = ['pageview', 'order', 'search']
    return {
        kind: {
            'daily': int(r.get(f'stats:{kind}:daily:{date}') or 0),
            'uv': r.pfcount(f'stats:uv:{kind}:{date}'),
        }
        for kind in kinds
    }


def export_to_db(date):
    data = snapshot(date)
    # Write data into the database's stats table, then keep or delete the Redis keys as needed
    return data


if __name__ == '__main__':
    for _ in range(5):
        on_event('pageview', user_id='u1')
    on_event('pageview', user_id='u2')
    print(snapshot('2024-06-03'))
```

## Design points

- High-frequency events write only to Redis; every minute, batch the aggregated results into the database with `GET`/`HGETALL`, so the database only has to absorb low-frequency writes.
- Use HyperLogLog rather than a Set for UV: a Set deduplicates exactly but its memory grows linearly with cardinality, while HyperLogLog stays fixed at around 12 KB in exchange for 0.81% error.
- Include the date in key names, which makes daily cleanup and cross-day comparison easy; either set a TTL on historical keys or delete them after export.
- When a single `INCR` key becomes a hotspot, split it into ten keys from `stats:x:{date}:0` to `:9` to spread the load, then sum them up on aggregation.
- If losing a few seconds of analytics data is acceptable, skip persistence; if it is not, turn on AOF `everysec`, at the cost of write amplification.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Probabilistic](https://redis.io/docs/latest/develop/data-types/probabilistic/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
- [README](README.md)
