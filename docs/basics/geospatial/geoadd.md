# GEOADD

`GEOADD` writes one or more "longitude + latitude + member" tuples to a given geospatial key. Under the hood Redis stores geospatial data in a sorted set: each member is the sorted set member, and its score is a 52-bit integer encoded with GeoHash. Because of this, a geospatial key can be operated on directly with sorted set commands such as `ZRANGE` and `ZREM`.

## Syntax

```plaintext
GEOADD key [NX|XX] [CH] longitude latitude member [longitude latitude member ...]
```

## Parameters

- `key`: the geospatial key.
- `NX`: only add new members; do not update the coordinates of an existing member.
- `XX`: only update the coordinates of existing members; do not add new members.
- `CH`: return the number of members that actually changed (newly added, or coordinates updated). By default the command returns the number of newly added members.
- `longitude`: longitude, valid range -180 to 180 degrees.
- `latitude`: latitude, valid range -85.05112878 to 85.05112878 degrees (the bounds of the Web Mercator projection).
- `member`: member name, typically used to store a place ID or name.

## Return value

By default the command returns the number of newly added members; with `CH` it returns the total number of members that were added or had their coordinates updated.

## Examples

The commands below can be run directly in `redis-cli`; the comments show the measured return values:

```plaintext
# Add members one by one
GEOADD bb:geo:sicily 13.361389 38.115556 Palermo
# (integer) 1
GEOADD bb:geo:sicily 15.087269 37.502669 Catania
# (integer) 1

# A geospatial key is essentially a sorted set
TYPE bb:geo:sicily
# zset

# Inspect it directly with sorted set commands; the score is the GeoHash-encoded integer
ZRANGE bb:geo:sicily 0 -1 WITHSCORES
# 1) "Palermo"
# 2) "3479099956230698"
# 3) "Catania"
# 4) "3479447370796909"
```

Out-of-range coordinates produce an error and the command does not execute:

```plaintext
GEOADD bb:geo:sicily 181 38 BadLon
# (error) ERR invalid longitude,latitude pair 181.000000,38.000000
GEOADD bb:geo:sicily 13 86 BadLat
# (error) ERR invalid longitude,latitude pair 13.000000,86.000000
```

Behavior of the `NX`, `XX`, and `CH` options:

```plaintext
# NX: Palermo already exists, so the update is ignored and 0 is returned
GEOADD bb:geo:sicily NX 13.9 38.9 Palermo
# (integer) 0

# XX: Agrigento does not exist, so the add is skipped and 0 is returned
GEOADD bb:geo:sicily XX 14.5 37.1 Agrigento
# (integer) 0
ZCARD bb:geo:sicily
# (integer) 2

# CH: writing coordinates identical to the existing value is not counted as a change, so 0 is returned
GEOADD bb:geo:sicily CH 13.361389 38.115556 Palermo
# (integer) 0
```

## Caveats

- The argument order is longitude first, then latitude — the reverse of the usual "latitude first" spoken convention. Swapping them is treated as an invalid coordinate or silently stores the wrong location.
- Polar regions where the absolute latitude exceeds 85.05112878 degrees cannot be stored; this is a limitation of the GeoHash encoding scheme itself.
- To delete a single member use `ZREM key member`; to delete the whole key use `DEL`.
- `GEODIST` uses a spherical distance formula, so the result differs slightly from the true surface distance.

## Related pages

- [GEORADIUS](./georadius.md): query members within a circular area.
- [Other geospatial commands](./other-commands.md): `GEOPOS`, `GEODIST`, `GEOSEARCH`, and more.
- Back to the topic directory: &#8203;Redis geospatial data<!-- EN-LINK: ../geospatial.md -->.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- GEOADD (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [georadius](georadius.md)
- [other-commands](other-commands.md)
- [knowledge](/knowledge.md)
