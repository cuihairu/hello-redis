# Distributed locks

When multiple service instances operate on the same data at the same time (deducting stock, generating an order number), you need a lock that guarantees only one instance runs at a time. Redis's atomic commands can implement this lock, but several steps are easy to get wrong and will silently break the lock.

## The core approach

- Acquiring: use `SET key <random value> NX EX 30` — write only if the key does not exist, with an expiration; use a random string such as a UUID as the value to identify the holder.
- Releasing: compare the random value and then delete it via a Lua script — the compare and the delete must be combined into a single atomic script. There is a race between a `GET` and a `DEL`, so you may delete someone else's lock.
- If the work has not finished by the time the lock expires, it expires automatically; the holder must renew it in the background so that the lock is not released before the business operation completes.

## Choosing an implementation

| Requirement | Approach |
| --- | --- |
| Single instance, occasional failures acceptable | SET NX EX + release via Lua |
| Must never lose the lock, cross-datacenter | Switch to a consistent store such as etcd/ZooKeeper |
| High-concurrency lock contention | Redlock (controversial, see below) |

## The controversy over Redlock

Redlock only counts as success once a majority of nodes have been locked, but it relies on the system clock: a clock jump can make the lock expire early. Martin Kleppmann and Redis's author antirez have publicly debated this point. For scenarios with strict correctness requirements, a consistency scheme outside of distributed locking is more reliable.

## Related notes

- For the full implementation of acquiring, renewing, and releasing via Lua, see [Implementing distributed locks](distributed-locks/implementation.md);
- For the Redlock controversy and failure-scenario analysis, see [Distributed locks in distributed systems](distributed-locks/distributed-systems.md).

## References

- [Redis dev docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Official patterns · Distributed locks](https://redis.io/docs/latest/develop/use/patterns/distributed-locks/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
- [README](README.md)
