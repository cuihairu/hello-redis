# Geospatial indexing

Redis's GEO features are built on top of sorted sets. They store longitude/latitude and support geographic queries such as radius searches and points within a given area — a good fit for LBS scenarios like "nearby stores/people". For a complete implementation, see [Location-based services](geolocation-services/location-based.md).

## Basic commands

```bash
# Write coordinates: GEOADD key longitude latitude member (can write several at once)
GEOADD shops 116.481028 39.998943 shop:1 116.464608 39.914886 shop:2

# Query stores within 10 km of center (116.481028, 39.998943), sorted by ascending distance
GEOSEARCH shops FROMLONLAT 116.481028 39.998943 BYRADIUS 10 km ASC WITHCOORD WITHDIST

# Query points within a rectangle (GeoHash nine-grid)
GEOSEARCH shops FROMLONLAT 116.481028 39.998943 BYBOX 10 10 km ASC

# Compute the distance between two points (meters by default; unit optional)
GEODIST shops shop:1 shop:2 km

# Query a member's coordinates
GEOPOS shops shop:1

# Delete a member (GEO has no dedicated delete command; use the set's ZREM)
ZREM shops shop:2
```

## Data structure and limits

- GEO values are stored in sorted sets; the `GEOADD` command is essentially a wrapper around `ZADD`, and the score is a 52-bit integer after GeoHash encoding.
- Because of GeoHash's precision limits, the maximum error of `GEOPOS`/`GEODIST` is about 0.6%; recompute at the application layer when you need an exact distance.
- Member names are unique; repeating a `GEOADD` on a member with the same name updates its coordinates.

## Python example: query nearby stores

```python
import redis

r = redis.Redis(decode_responses=True)


def add_shop(shop_id, lon, lat):
    r.geoadd('shops', [lon, lat, shop_id])


def nearby(lon, lat, radius_km=5, count=10):
    return r.geosearch(
        'shops',
        longitude=lon, latitude=lat,
        radius=radius_km, unit='km',
        sort='ASC', count=count,
        withcoord=True, withdist=True,
    )


if __name__ == '__main__':
    add_shop('shop:1', 116.481028, 39.998943)
    add_shop('shop:2', 116.464608, 39.914886)
    for name, dist, (lon, lat) in nearby(116.481028, 39.998943, radius_km=10):
        print(name, dist, lon, lat)  # shop:1 is at the center, distance 0.0 km
```

## Practical tips

- **Coarse filter first, then fine-rank**: after `GEOSEARCH` has narrowed down the candidate set, apply any business filters (stock, open/closed status) as a second pass in the application layer.
- **Widen the radius when there are no nearby results**: a common strategy is to step up progressively, "5 km -> 10 km -> 50 km".
- **Large amounts of static geographic data**: for things like map tiles and administrative divisions, a dedicated geospatial database (PostGIS and the like) is a better fit; Redis GEO suits dynamic point data at small to medium scale.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Geospatial](https://redis.io/docs/latest/develop/data-types/geospatial/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](README.md)
- [geolocation-services](geolocation-services.md)
- [redis-use-cases](redis-use-cases.md)
