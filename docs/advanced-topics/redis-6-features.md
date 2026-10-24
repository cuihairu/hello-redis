# New features in Redis 6

Redis 6.0 (released April 2020) was a major version upgrade, with its core changes concentrated in security, protocol, and multi-threading.

## 1. ACL access control lists

Before this, Redis only had a single global password (`requirepass`) and could not distinguish user privileges. Redis 6 introduced a multi-user model:

```bash
ACL SETUSER alice on >strong_password ~app:* +get +set +del
ACL SETUSER readonly_user on >pass ~cache:* +@read -@write
ACL LIST                 # View all users
ACL WHOAMI               # Current user
AUTH alice strong_password
```

- `~app:*` limits the accessible key patterns;
- `+get +set` or `+@read -@write` control commands or command categories;
- `ACL CAT`, `ACL GETUSER`, and `ACL DELUSER` are used for management; the configuration persists in the file named by `aclfile` or in redis.conf.

## 2. RESP3 protocol

RESP3 extends RESP2, adding data types such as Map, Set, Double, and Boolean, and supporting server-initiated pushes (push messages), which provide invalidation notifications for client-side caching. A client can switch to RESP3 with `HELLO 3`; `HELLO` with no arguments shows the current connection's protocol version and authentication info.

## 3. Client-side caching

The server can track the keys a client has read; when a key is modified, it proactively pushes an invalidation message, and the client uses this to evict its local cache, reducing network round trips:

```bash
CLIENT TRACKING on      # Enable (REDIRECT mode can forward notifications to another connection)
GET key1                # The client records this key
# After another connection modifies key1, this connection receives an invalidate message
```

It supports default mode and broadcast (`BCAST`) mode, suitable for read-heavy, write-light workloads.

## 4. Multi-threaded I/O

Command execution is still single-threaded, but network reads/writes and protocol parsing can be handed off to multiple I/O threads for parallel processing:

```plaintext
io-threads 4
io-threads-do-reads yes
```

Official testing shows roughly a 2x performance improvement in high-throughput scenarios. It is off by default and should only be enabled when there are plenty of CPU cores and the network is the bottleneck.

## 5. Other improvements

- **`STRALGO LCS`**: computes the longest common subsequence (removed in Redis 7.0; the functionality is replaced by the `LCS` command).
- **Improved `LFU` eviction policy and more accurate memory statistics**: `MEMORY STATS` output is more complete.
- **Redis Cluster proxy support and TLS support** (available by default in 6.0), plus a large number of stability fixes.
- **Cluster management in the new `redis-cli`**: `redis-cli --cluster` has fully replaced `redis-trib.rb`.

## Upgrade recommendations

- Use ACL to gradually replace a bare `requirepass`, assigning read-only/read-write accounts to different business lines;
- Evaluate I/O threads: small instances or CPU-constrained machines do not need them;
- Clients must be upgraded to a version supporting RESP3 and client-side caching to use the corresponding features; older clients work in RESP2 compatibility mode.

## References

- [Redis source repository](https://github.com/redis/redis)
- ACL LIST (no authoritative source found; to be verified)
- [Redis clients](https://redis.io/docs/latest/develop/clients/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [glossary](/appendix/glossary.md)
