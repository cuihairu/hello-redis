# Other geospatial commands

Beyond `GEOADD` and `GEORADIUS`, the geospatial module provides a set of complementary commands: read member coordinates, compute the distance between two points, inspect the GeoHash encoding, and use the more modern range-query commands `GEOSEARCH` and `GEOSEARCHSTORE`. Together they cover the most common needs in location-services development.

## GEOPOS

Returns a member's longitude/latitude coordinates. Syntax: `GEOPOS key member [member ...]`.

```plaintext
GEOPOS bb:geo:sicily Palermo Catania
# 1) 1) "13.361389338970184"
#    2) "38.1155563954963"
# 2) 1) "15.087267458438873"
#    2) "37.50266842333162"
```

The returned values may differ slightly from the precision at write time. This is precision loss from GeoHash encoding/decoding, with an error on the order of centimeters.

## GEODIST

Computes the spherical distance between two members. Syntax: `GEODIST key member1 member2 [m|km|ft|mi]`. The default unit is meters; if either member does not exist, nil is returned.

```plaintext
GEODIST bb:geo:sicily Palermo Catania km
# "166.2742"
GEODIST bb:geo:sicily Palermo Catania mi
# "103.3182"
GEODIST bb:geo:sicily Palermo Nowhere km
# (nil)
```

## GEOHASH

Returns a member's GeoHash string (an 11-character Base32 encoding).

```plaintext
GEOHASH bb:geo:sicily Palermo
# 1) "sqc8b49rny0"
```

## GEORADIUSBYMEMBER

Like `GEORADIUS`, but uses an existing member in the key as the center point. Syntax: `GEORADIUSBYMEMBER key member radius m|km|ft|mi [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count [ANY]] [ASC|DESC]`. This command has been marked deprecated since Redis 6.2; use `GEOSEARCH ... FROMMEMBER` instead. It is still available today.

```plaintext
GEORADIUSBYMEMBER bb:geo:sicily Palermo 200 km WITHDIST
# 1) 1) "Palermo"
#    2) "0.0000"
# 2) 1) "Catania"
#    2) "166.2742"
```

## GEOSEARCH

A range-query command introduced in Redis 6.2 that replaces `GEORADIUS` and `GEORADIUSBYMEMBER` uniformly. Syntax: `GEOSEARCH key [FROMMEMBER member | FROMLONLAT lon lat] [BYRADIUS radius unit | BYBOX width unit height unit] [ASC|DESC] [COUNT count [ANY]] [WITHCOORD] [WITHDIST] [WITHHASH]`. It supports both circular areas with `BYRADIUS` and rectangular areas with `BYBOX`.

```plaintext
# Centered on given coordinates
GEOSEARCH bb:geo:sicily FROMLONLAT 15 37 BYRADIUS 200 km WITHDIST ASC COUNT 2
# 1) 1) "Catania"
#    2) "56.4413"
# 2) 1) "Palermo"
#    2) "190.4424"

# Centered on a member in the key
GEOSEARCH bb:geo:sicily FROMMEMBER Catania BYRADIUS 300 km WITHDIST
# 1) 1) "Palermo"
#    2) "166.2742"
# 2) 1) "Catania"
#    2) "0.0000"
```

## GEOSEARCHSTORE

Saves the result of `GEOSEARCH` to a target sorted set. Optionally, `STOREDIST` replaces the score with the distance. Syntax: `GEOSEARCHSTORE destination source [FROMMEMBER member | FROMLONLAT lon lat] [BYRADIUS radius unit | BYBOX width unit height unit] [ASC|DESC] [COUNT count [ANY]] [STOREDIST]`.

```plaintext
GEOSEARCHSTORE bb:geo:dest bb:geo:sicily FROMLONLAT 15 37 BYRADIUS 400 km ASC COUNT 5 STOREDIST
# (integer) 2
ZRANGE bb:geo:dest 0 -1 WITHSCORES
# 1) "Catania"
# 2) "56.4412578701582"
# 3) "Palermo"
# 4) "190.44242984775784"
```

## Summary

Use `GEOPOS` to read coordinates, `GEODIST` to compute distances, and `GEOHASH` to inspect encodings. Prefer `GEOSEARCH` / `GEOSEARCHSTORE` for range queries; `GEORADIUS` and `GEORADIUSBYMEMBER` are marked deprecated and should be kept only when maintaining legacy code. When you need to persist query results or reuse them server-side, `GEOSEARCHSTORE` with `STOREDIST` gives you a sorted set ordered by distance directly.

## Related pages

- [GEOADD](./geoadd.md): write geospatial data.
- [GEORADIUS](./georadius.md): the traditional circular-area query command.
- Back to the topic directory: &#8203;Redis geospatial data<!-- EN-LINK: ../geospatial.md -->.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [geoadd](geoadd.md)
- [georadius](georadius.md)
- [knowledge](/knowledge.md)
