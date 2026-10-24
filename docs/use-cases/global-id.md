# Global IDs

In a distributed system, multiple nodes need to generate globally unique IDs (order numbers, sequence numbers, and so on). Redis's single-threaded, serial command execution makes `INCR` the simplest and most reliable ID generator: every increment returns a unique, increasing value.

## Option 1: issue IDs directly with INCR

```bash
SET id:order 100000                # Set the starting value
INCR id:order                      # 100001
INCR id:order                      # 100002
```

`INCR` is atomic, so even if multiple application instances request IDs at the same time, values never repeat. The downside is that every request hits the same key, which can become a hotspot under heavy load.

## Option 2: step-based issuance (segment claiming)

An instance claims a block of IDs at once (say 1000), consumes them locally, and claims another when the block runs out. This reduces round trips to Redis and naturally shards IDs by step size:

```bash
# Atomically advance the ID segment by 1000 each time, returning the start of this segment
INCRBY id:order 1000               # 100001 (this instance can use 100001 ~ 101000)
INCRBY id:order 1000               # 101001
```

The application layer increments within the block and pre-claims the next block before the current one is exhausted. To guard against ID waste from an instance crash, you can set a longer TTL on the ID key as a safety net, or record the block's starting point and put it back when the instance restarts.

## Option 3: per-day segments

Embed the date in the key name — readable, and it isolates the hotspot automatically:

```bash
INCR id:order:20240603             # The 1st order ID of the day
```

Pair it with `EXPIRE id:order:20240603 172800`, and historical segment keys expire automatically after two days.

## Python example: ID generator

```python
import datetime
import redis

r = redis.Redis(decode_responses=True)
STEP = 1000


class IdGenerator:
    def __init__(self, name, step=STEP):
        self.key = f'id:{name}'
        self.step = step
        self.current = 0
        self.end = 0

    def next_id(self):
        if self.current >= self.end:
            # Local segment exhausted; request the next segment from Redis
            start = r.incrby(self.key, self.step)
            self.current = start
            self.end = start + self.step
        value = self.current
        self.current += 1
        return value


if __name__ == '__main__':
    gen = IdGenerator('order')
    print([gen.next_id() for _ in range(3)])   # 1, 2, 3 (Redis starts at 1 on first use)
    print(r.get('id:order'))                   # '1000' (a segment of 1000 has been claimed)
```

## Notes

- The `INCR` result is a 64-bit signed integer, with a maximum of 9223372036854775807; real business workloads nowhere approach that limit.
- When readability matters (for example a date prefix), you can concatenate a date with a sequence number, such as `20240603` + a zero-padded 6-digit sequence number.
- When you need "trending upward" rather than strictly increasing IDs, you can also splice in the millisecond part of a `TIME` timestamp along with a counter, which reduces pressure on a single key.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- INCR (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](README.md)
- &#8203;redis-use-cases<!-- EN-LINK: redis-use-cases.md -->
