# Caching

Caching comes with a trade-off between hit rate and origin load: raising the hit rate from 90% to 99%, for example, cuts the volume of cache-miss origin lookups to one-tenth. Caching also adds maintenance costs such as inconsistency between cache and database, clustered expirations, and origin lookups on invalid requests.

## What this page covers

The Cache-Aside pattern and the definitions and treatments of these three problem classes are organized together in [Cache-Aside and the three cache problems](caching.md); this page keeps the overview of scenario benefits and costs.

## Related notes

- The Cache-Aside read/write pattern, a complete Python example, and remedies for the three problems — see [Cache-Aside and the three cache problems](caching.md);
- Expanded solutions for penetration, avalanche, and breakdown (Bloom filters, null caching, multi-level caching) — see [Cache strategies and practices](cache/strategies.md);
- Flask cases for page caching, data caching, and distributed caching — see [Real case: Web app caching](cache/web-app.md).

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
