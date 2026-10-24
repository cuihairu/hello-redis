# Redis geospatial data

## Overview

Redis's geospatial features let you store and manipulate geographic location data (such as longitude/latitude coordinates). These features rely primarily on Redis sorted sets and GeoHash encoding. Redis provides a number of commands for handling geospatial data, supporting storage, querying, and distance calculations between locations.

## Structure diagram

![Redis Geospatial structure](/structures/geospatial.png)

## Common commands

### 1. **`GEOADD`**

- **Function**: add geographic location data to a specified geospatial key
- **Syntax**: `GEOADD key longitude latitude member [longitude latitude member ...]`
- **Description**:
  - `key`: the geospatial key
  - `longitude`: longitude
  - `latitude`: latitude
  - `member`: member name
- **Example**:
  ```plaintext
  GEOADD places 13.361389 38.115556 "Palermo"
  GEOADD places 15.087269 37.502669 "Catania"
  ```

### 2. **`GEOPOS`**

- **Function**: get the location of specified members in a geospatial key
- **Syntax**: `GEOPOS key member [member ...]`
- **Description**: returns each member's longitude/latitude coordinates
- **Example**:
  ```plaintext
  GEOPOS places "Palermo"
  ```

### 3. **`GEODIST`**

- **Function**: compute the distance between two members in a geospatial key
- **Syntax**: `GEODIST key member1 member2 [unit]`
- **Description**:
  - `unit`: optional parameter; the unit can be `m` (meters), `km` (kilometers), `mi` (miles), `ft` (feet)
- **Example**:
  ```plaintext
  GEODIST places "Palermo" "Catania" km
  ```

### 4. **`GEORADIUS`**

- **Function**: get members within a specified radius from a geospatial key
- **Syntax**: `GEORADIUS key longitude latitude radius [unit] [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count] [ASC|DESC]`
- **Description**:
  - `radius`: the radius range
  - `unit`: unit (optional), defaults to meters
  - `WITHCOORD`: return coordinate information
  - `WITHDIST`: return distance information
  - `WITHHASH`: return the GeoHash encoding
  - `COUNT`: the maximum number of members to return
  - `ASC` or `DESC`: the sort order
- **Example**:
  ```plaintext
  GEORADIUS places 15 37 200 km WITHCOORD WITHDIST
  ```

### 5. **`GEORADIUSBYMEMBER`**

- **Function**: get members around a specified member from a geospatial key
- **Syntax**: `GEORADIUSBYMEMBER key member radius [unit] [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count] [ASC|DESC]`
- **Description**: like `GEORADIUS`, but centered on the specified member
- **Example**:
  ```plaintext
  GEORADIUSBYMEMBER places "Palermo" 100 km WITHCOORD WITHDIST
  ```

## Example operations

```plaintext
# Add two geographic locations to the geospatial key "places"
GEOADD places 13.361389 38.115556 "Palermo"
GEOADD places 15.087269 37.502669 "Catania"

# Get the location of "Palermo"
GEOPOS places "Palermo"

# Compute the distance between "Palermo" and "Catania"
GEODIST places "Palermo" "Catania" km

# Get members within 200 km of "Palermo" and return coordinates and distances
GEORADIUS places 13.361389 38.115556 200 km WITHCOORD WITHDIST

# Get members within 100 km of "Palermo" and return coordinates and distances
GEORADIUSBYMEMBER places "Palermo" 100 km WITHCOORD WITHDIST
```

> Note: `GEORADIUS` and `GEORADIUSBYMEMBER` have been marked **deprecated** since Redis 6.2; new code should use `GEOSEARCH`. Because `GEORADIUS` with the `STORE`/`STOREDIST` options is treated as a write command, it errors on read-only replicas; use the read-only variants `GEORADIUS_RO` and `GEORADIUSBYMEMBER_RO` instead.

`GEOSEARCH` splits the syntax into two groups of options — "from which center point" and "search by what range" — and `FROMLONLAT` is a single token:

```plaintext
GEOSEARCH key <FROMMEMBER member | FROMLONLAT longitude latitude> <BYRADIUS radius m|km|ft|mi | BYBOX width height m|km|ft|mi> [ASC|DESC] [COUNT count [ANY]] [WITHCOORD] [WITHDIST] [WITHHASH]
GEOSEARCHSTORE destination key <FROMMEMBER member | FROMLONLAT longitude latitude> <BYRADIUS ... | BYBOX ...> [ASC|DESC] [COUNT count [ANY]] [STOREDIST]
```

Example:

```plaintext
GEOADD Sicily 13.361389 38.115556 "Palermo"
GEOADD Sicily 15.087269 37.502669 "Catania"

# Equivalent to GEORADIUS Sicily 15 37 200 km WITHDIST
GEOSEARCH Sicily FROMLONLAT 15 37 BYRADIUS 200 km ASC WITHDIST

# Search centered on a member
GEOSEARCH Sicily FROMMEMBER Palermo BYRADIUS 100 km ASC WITHDIST

# Rectangular range search
GEOSEARCH Sicily FROMLONLAT 15 37 BYBOX 400 400 km ASC

# Save the results into a new geospatial key
GEOSEARCHSTORE dest Sicily FROMLONLAT 15 37 BYRADIUS 200 km ASC
```

## Features

- **Essentially a ZSet**: longitude/latitude are encoded into a 52-bit geohash integer and stored as the score in a sorted set.
- **Radius search**: `GEORADIUS` finds members within a radius from a longitude/latitude, optionally with `WITHDIST`/`COUNT`.
- **Distance calculation**: `GEODIST` returns the spherical distance between two coordinates (meters/kilometers).
- **Precision**: roughly centimeter-level; more than enough for place-name-level scenarios (intercity distances), but not suitable for engineering surveying.

## Use cases

- **Location queries**: find nearby stores, restaurants, or other points of interest.
- **Logistics and delivery**: compute delivery ranges and estimate transport distances.
- **Social networks**: provide location-based recommendations or matching for users.
- **Navigation**: support route planning and navigation features.

```plaintext
# 1. Nearby people / stores
GEOADD shops 116.397 39.909 "shop:1" 116.405 39.915 "shop:2"
GEORADIUS shops 116.39 39.91 5 km WITHDIST COUNT 10

# 2. Geofencing: determine whether a location entered a zone
GEORADIUS fence:office 116.397 39.909 0.5 km

# 3. Distance between two points
GEODIST shop:1 shop:2 km
```

## Summary

Redis's geospatial features provide powerful support for handling geographic location data. By using Redis's geospatial commands, you can efficiently store, query, and compute geographic location information.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis development docs · Geospatial](https://redis.io/docs/latest/develop/data-types/geospatial/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](README.md)
- [geoadd](/basics/geospatial/geoadd.md)
- [georadius](/basics/geospatial/georadius.md)
- [other-commands](/basics/geospatial/other-commands.md)
