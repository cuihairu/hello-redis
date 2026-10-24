# Valkey

Valkey is an open-source in-memory database project forked from Redis 7.2.4 in March 2024, hosted by the Linux Foundation and maintained with participation from AWS, Google Cloud, Oracle, Ericsson, and other companies. The fork was triggered directly by Redis changing its license from BSD to a dual RSALv2/SSPL license in 7.4; Valkey keeps the BSD-3 license.

## Main features

- **Protocol compatibility**: compatible with Redis's RESP2/RESP3 protocols, so most Redis clients can connect to Valkey without modification.
- **Inherits Redis 7.x capabilities**: 7.x features such as Functions, Multi-Part AOF, Sharded Pub/Sub, and ACL are all available.
- **Performance enhancements**: Valkey 8 optimizes the I/O threading model (enhanced asynchronous I/O threads enabled by default), and official benchmarks show a clear throughput gain.
- **Friendly licensing**: BSD-3 license, without SSPL's restrictions on cloud providers and commercial redistribution.

## Quick start

```bash
# build from source (requires gcc and make)
git clone https://github.com/valkey-io/valkey.git
cd valkey && make

# start the server (usage matches redis-server)
./valkey-server --port 6380

# connect
./valkey-cli -p 6380
127.0.0.1:6380> SET hello world
127.0.0.1:6380> GET hello
```

Docker also works:

```bash
docker run -d --name valkey -p 6379:6379 valkey/valkey:latest
```

## Working with Redis clients

Existing clients (redis-py, go-redis, Lettuce, node-redis, etc.) can usually connect directly:

```python
import redis

r = redis.Redis(host='localhost', port=6380)
r.set('k', 'v')
print(r.get('k'))
```

Some clients offer dedicated Valkey client implementations (such as valkey-glide and valkey-py), which you can adopt as needed.

## Applicable scenarios and caveats

- **When you want a BSD-licensed in-memory database**: Valkey is a drop-in replacement, and migration cost is low (export RDB/AOF and load it).
- **Multi-core throughput optimization**: the I/O threads in Valkey 8+ show clear gains in high-concurrency scenarios.
- **Watch version differences**: Valkey 8 introduces some new commands and configuration options (such as `dual-channel-replication`) that are not fully in sync with the latest Redis; run compatibility checks before switching in production.
- **Ecosystem tooling**: tools such as redis-cli and redis_exporter mostly remain compatible, but some newer features require Valkey's own valkey-cli.

## References

- Redis official site (no authoritative source found; to be verified)
- [Valkey official site](https://valkey.io/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](README.md)
