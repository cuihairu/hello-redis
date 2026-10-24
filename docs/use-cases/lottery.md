# Lottery

The core requirement behind lotteries, random selection, and blind boxes is to draw a few elements at random from a candidate set without the same element winning twice. The `SRANDMEMBER` and `SPOP` commands on a set provide exactly those two semantics.

## The difference between the two random commands

- `SRANDMEMBER key [count]`: returns elements at random but does **not** delete them, suited to "pick 3 to display without eliminating anyone"; a positive `count` returns distinct elements, a negative one allows repeats (which makes it usable for sampling with replacement).
- `SPOP key [count]`: draws elements at random and **deletes** them, preventing duplicate wins by construction, suited to drawing out one person per round.

## Command demo

```bash
# Enter the lottery (a user entering twice is de-duplicated by the set)
SADD lottery:1001 alice bob carol dave erin

# Draw 3 winners (drawn elements are removed from the candidate pool, so they cannot win again in later rounds)
SPOP lottery:1001 3

# Check the remaining candidates
SCARD lottery:1001

# Random display without elimination: draw one host (may be drawn again)
SRANDMEMBER lottery:1001

# Draw 5 times with replacement (repeats allowed, suited to a top-prize probability model)
SRANDMEMBER lottery:1001 -5
```

## Python example: weighted drawing

Use a sorted set with the score as the weight — the higher the score, the greater the chance of winning:

```python
import random
import redis

r = redis.Redis(decode_responses=True)


def enter(user_id, weight=1):
    r.zadd('lottery:2024', {user_id: weight})


def draw(n=1):
    # Layer by weight: low-score users are eliminated first, high-score users are more likely to be left
    # Simplified implementation: weighted random over cumulative weight
    entries = r.zrange('lottery:2024', 0, -1, withscores=True)
    if not entries:
        return []
    total = sum(score for _, score in entries)
    winners = []
    pool = list(entries)
    for _ in range(min(n, len(pool))):
        pick = random.uniform(0, total)
        acc = 0.0
        for idx, (user, score) in enumerate(pool):
            acc += score
            if pick <= acc:
                winners.append(user)
                total -= score
                pool.pop(idx)
                break
    return winners


if __name__ == '__main__':
    enter('alice', 3)
    enter('bob', 1)
    enter('carol', 2)
    print(draw(2))   # 2 distinct random winners
```

## De-duplication and rollback

- `SADD` entry naturally prevents duplicates; if winning records also need to be kept, `SADD` the winners into `lottery:1001:winners` and `SREM` them from the candidate set.
- When a draw needs to be reversible, `SPOP` the winners first, write the result to another key, and `SADD` them back into the original set if it fails.
- For large events, snapshot the candidate set first (`SUNIONSTORE` or copy the key) so that new entries during the event do not affect rounds already in progress.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Sets](https://redis.io/docs/latest/develop/data-types/sets/)
- SPOP (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- &#8203;redis-use-cases<!-- EN-LINK: redis-use-cases.md -->
