# Medis

Medis is a Redis desktop GUI client aimed at developers (originally a macOS app, later offering cross-platform and Web versions), used to browse and manage Redis data. It is a commonly used tool for investigating data issues outside the command line.

## Key features

- **Key browsing and search**: scan keys by pattern (such as `user:*`) and view type, TTL, and memory usage;
- **View and edit data**: display and edit the contents of String/Hash/List/Set/ZSet/Stream inline;
- **Real-time monitoring**: view command statistics, memory, and connection information;
- **Multi-environment management**: save multiple connection configurations (local, test, production) and connect to intranet instances via an SSH tunnel;
- **Cluster support**: can connect to Redis Cluster nodes.

## Use cases

- Quickly confirm during local development that written data matches expectations;
- When investigating issues, browse keys by pattern and check whether TTL settings were missed;
- Provide an intuitive view when demonstrating data structures to non-developer colleagues.

## Alternatives

| Tool | Platform | Features |
| --- | --- | --- |
| RedisInsight | Official, cross-platform + Web | Free, most complete feature set (slow query analysis, cluster view) |
| Another Redis Desktop Manager | Open source, cross-platform | Lightweight, actively maintained |
| Medis | macOS/Windows/Web | Clean interface, good macOS experience |

## Notes

- **Use with caution in production**: batch delete and rename operations in the GUI are irreversible; recommend connecting to production with a read-only account;
- **Displaying big keys**: rendering a set with hundreds of thousands of elements in full inside the GUI will lag; prefer browsing via `SCAN` (which Medis supports);
- **SSH tunnel**: when connecting to intranet Redis, use an SSH tunnel and do not expose the Redis port directly to the public internet.

Project URL: <https://github.com/luin/medis>

## References

- Redis official site (no authoritative source found; to be verified)
- [Medis official site](https://getmedis.com/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
