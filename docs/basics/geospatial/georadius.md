# GEORADIUS

`GEORADIUS` returns the members in a geospatial key that fall within a circular area centered at a given longitude/latitude with the specified radius. It supports additional information such as sorting by distance, returning distances, or returning coordinates. It is the classic implementation for location queries like "nearby people" and "nearby stores."

This command has been marked deprecated since Redis 6.2. The official recommendation is to use `GEOSEARCH` for new code, which is functionally equivalent with clearer syntax; the legacy command is still available today.

## Syntax

```plaintext
GEORADIUS key longitude latitude radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count [ANY]] [ASC|DESC] [STORE key|STOREDIST key]
```

## Parameters

- `key`: the geospatial key.
- `longitude` / `latitude`: the longitude and latitude of the center point.
- `radius`: the radius value, used together with the unit that follows.
- `m|km|ft|mi`: the distance unit — meters, kilometers, feet, miles. Required.
- `WITHDIST`: also return each member's distance from the center point (the measured output keeps 4 decimal places).
- `WITHCOORD`: also return each member's longitude/latitude coordinates.
- `WITHHASH`: also return each member's GeoHash-encoded integer (that is, the sorted set score).
- `COUNT count`: return at most `count` members; with `ANY`, the result is not guaranteed to be the nearest — it returns the first `count` found, which is faster.
- `ASC` / `DESC`: sort by distance from nearest to farthest / from farthest to nearest.
- `STORE` / `STOREDIST`: write the results (members, or members with distances) to a target sorted set.

## Return value

A list of members, or nested arrays with additional information; an empty array when no members fall within the radius.

## Examples

First, set up the data (the same two Sicilian cities used in the official docs):

```plaintext
GEOADD bb:geo:sicily 13.361389 38.115556 Palermo
GEOADD bb:geo:sicily 15.087269 37.502669 Catania
```

The queries below can be run directly in `redis-cli`; the comments show the measured return values:

```plaintext
# Return members within the radius and their distances
GEORADIUS bb:geo:sicily 15 37 200 km WITHDIST
# 1) 1) "Palermo"
#    2) "190.4424"
# 2) 1) "Catania"
#    2) "56.4413"

# Return both distances and coordinates
GEORADIUS bb:geo:sicily 15 37 200 km WITHDIST WITHCOORD
# 1) 1) "Palermo"
#    2) "190.4424"
#    3) 1) "13.361389338970184"
#       2) "38.1155563954963"
# 2) 1) "Catania"
#    2) "56.4413"
#    3) 1) "15.087267458438873"
#       2) "37.50266842333162"

# Return the GeoHash-encoded integer
GEORADIUS bb:geo:sicily 15 37 200 km WITHHASH
# 1) 1) "Palermo"
#    2) (integer) 3479099956230698
# 2) 1) "Catania"
#    2) (integer) 3479447370796909

# Get only the nearest one
GEORADIUS bb:geo:sicily 15 37 200 km COUNT 1 ASC WITHDIST
# 1) 1) "Catania"
#    2) "56.4413"

# Return an empty array when no members fall within the radius
GEORADIUS bb:geo:sicily 15 37 1 km
# (empty array)
```

## Migrating to GEOSEARCH

`GEOSEARCH` specifies the center point with `FROMLONLAT` or `FROMMEMBER`, so the center coordinates are no longer mixed with the query range. The semantics are more intuitive; the first query above is equivalent to:

```plaintext
GEOSEARCH bb:geo:sicily FROMLONLAT 15 37 BYRADIUS 200 km WITHDIST ASC
# 1) 1) "Catania"
#    2) "56.4413"
# 2) 1) "Palermo"
#    2) "190.4424"
```

## Caveats

- The distance unit `m|km|ft|mi` is a required parameter; omitting it produces a parameter error.
- `COUNT` is best used together with `ASC`; otherwise the "first N" you get may not be the N nearest.
- The query is performed via a sorted set range scan. A larger radius means more candidate members and higher scan cost; at large scale, keep the radius bounded or combine it with `COUNT`.
- `GEORADIUSBYMEMBER` has also been marked deprecated and can be migrated to `GEOSEARCH` as well.

## Related pages

- [GEOADD](./geoadd.md): write geospatial data.
- [Other geospatial commands](./other-commands.md): `GEOPOS`, `GEODIST`, `GEOSEARCH`, and more.
- Back to the topic directory: [Redis geospatial data](../geospatial.md).

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- GEORADIUS (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [geoadd](geoadd.md)
- [other-commands](other-commands.md)
