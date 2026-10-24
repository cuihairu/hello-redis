# Tile38

Tile38 is an open-source geospatial database, geofencing, and real-time location processing service. It communicates over the Redis protocol and can be connected to just like Redis, but it focuses on the class of problems around "location data": storing objects' latitude and longitude, querying nearby objects, and receiving notifications when objects enter or leave a designated area.

## Main features

- **Native spatial indexes**: built-in spatial indexes (hash, quadkey, and others), supporting geometric objects such as points and polygons.
- **Redis protocol compatible**: uses the RESP protocol, so redis-cli and mainstream clients can connect directly.
- **Geofencing**: commands such as `NEARBY`, `WITHIN`, and `INTERSECTS` implement real-time "enter/leave area" detection, with hook outputs such as webhooks and message queues.
- **Persistence**: supports AOF and snapshots.

## Quick start

```bash
# Docker
docker run -p 9851:9851 tile38/tile38

# connect with redis-cli (Tile38 default port 9851)
redis-cli -p 9851

# write a vehicle's position (fleet is the set name, truck1 is the object ID)
127.0.0.1:9851> SET fleet truck1 POINT 33.5123 -112.2693
# query objects within 500 meters of a coordinate (returns object IDs)
127.0.0.1:9851> NEARBY fleet LIMIT 5 POINTS POINT 33.462 -112.268 500
```

## Comparison with Redis GEO

| Dimension | Redis GEO | Tile38 |
| --- | --- | --- |
| Positioning | Geospatial extension inside a general-purpose in-memory database | Dedicated spatial database |
| Queries | Radius, GeoHash range (point data) | Radius, rectangle, polygon, with polygon-to-polygon intersection |
| Geofencing | None (polling required) | Native support, push notifications |
| Persistence and clustering | Inherits from Redis | Its own AOF / snapshots, primarily single-node |

## Applicable scenarios

- Real-time tracking and dispatch of vehicles / riders;
- Electronic fence alarms (entering a restricted area, leaving a service area);
- Businesses that need complex spatial queries, such as finding nearby people or stores.

When a business only needs "queries within a radius," Redis's GEO commands are sufficient; once polygon fences, polygon data, and fence push notifications are involved, Tile38 is the better fit.

Project URL: <https://github.com/tidwall/tile38>

## References

- Redis official site (no authoritative source found; to be verified)
- [Tile38 official site](https://tile38.com/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](README.md)
