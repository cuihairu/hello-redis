# Rate limiting

Rate limiting protects a service from being overwhelmed by traffic spikes: requests above the threshold fail fast or queue up. Redis atomic commands let counting and checking happen in a single step, which is why Redis is a common choice for rate limit counters.

## Four strategies

| Strategy | Implementation | Trade-offs |
| --- | --- | --- |
| Fixed window | `INCR` + key expiry | Simplest to implement; the window boundary can let a burst of twice the traffic through |
| Sliding window | ZSET recording request timestamps | Smoother, but memory grows linearly with request volume |
| Leaky bucket | ZSET or List, consumed at a fixed rate | Constant output rate; cannot absorb bursts |
| Token bucket | Lua script topping up tokens | Allows some bursting while controlling the average rate |

## Related notes

- Lua implementations of the four strategies: [Rate limiting strategies](rate-limiting/strategies.md);
- API gateway rate limiting case: [API rate limiting in practice](rate-limiting/api.md).

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- INCR (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
