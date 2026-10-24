# Geolocation services

Nearby people, nearby stores, delivery-range checks — they are all the same kind of query at heart: given a coordinate and a radius, find the points inside it. Redis does this with GEO commands on top of a sorted set, encoding positions as GeoHash and then searching by range.

## Core approach

- `GEOADD` writes longitude/latitude into a sorted set; internally it is encoded as a 52-bit GeoHash and stored as the score;
- Use `GEOSEARCH` to query: specify a center coordinate and a radius, and it returns the points within that range, optionally sorted by distance and with a limit on the number of results;
- The deprecated `GEORADIUS` and `GEORADIUSBYMEMBER` were unified under `GEOSEARCH` in 6.2.

## Notes

- Latitude is capped at 85.05112878 — beyond that value GeoHash encoding becomes meaningless;
- GEO depends on sorted sets, so use `ZREM` to delete a point — do not invent a structure that does not exist;
- Range-query results are GeoHash grid approximations; use `GEODIST` to double-check when you need an exact distance.

## Related notes

- For the full storage, query, and nearby-people implementation, see [Location-based services](geolocation-services/location-based.md);
- For the GeoHash principle and a detailed look at the GEO commands, see [Geospatial indexing](geospatial-indexing.md).

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Geospatial](https://redis.io/docs/latest/develop/data-types/geospatial/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
