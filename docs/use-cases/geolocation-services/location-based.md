# Real-world cases: location-based services

Location-based services (LBS) use geographic location information to provide all sorts of services and features. Redis's geospatial features can greatly simplify the implementation of these services. Below are several real-world LBS cases, along with how to implement each one with Redis.

#### 1. **Nearby store recommendations**

**Scenario**: A user is at a specific location, and the application needs to recommend the stores or restaurants closest to the user's current position.

**Solution**:
- Store all store location data in Redis's `Sorted Set`.
- Use the `GEOSEARCH` command to query stores within a given radius.
- Return the query results and display them in the user interface.

**Example code** (Python):

```python
import redis

# Connect to Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Add store location data
def add_store(key, longitude, latitude, store_name):
    redis_client.geoadd(key, [longitude, latitude, store_name])

# Find nearby stores
def find_nearby_stores(key, user_longitude, user_latitude, radius, unit='km'):
    return redis_client.geosearch(key, longitude=user_longitude, latitude=user_latitude, unit=unit, radius=radius, withcoord=True)

# Example: add store locations
add_store('stores', -122.408, 37.783, 'Cafe Mocha')
add_store('stores', -122.418, 37.774, 'Pizza Place')

# Example: find stores within a 5 km radius of the user's location
user_longitude, user_latitude = -122.408, 37.783
stores = find_nearby_stores('stores', user_longitude, user_latitude, 5, 'km')
print(stores)
```

#### 2. **Real-time traffic navigation**

**Scenario**: A user needs real-time traffic navigation, including the route from their current position to the destination and the traffic conditions along the way.

**Solution**:
- Store location data for major traffic points (such as intersections and main roads).
- Use the `GEODIST` command to compute the distance between the user's current position and the destination.
- Provide navigation guidance, including a recommended route and traffic conditions.

**Example code** (Python):

```python
# Compute the distance between two locations
def calculate_distance(key, location1, location2, unit='km'):
    return redis_client.geodist(key, location1, location2, unit)

# Example: compute the distance between the user's current position and the destination
user_location = 'Cafe Mocha'
destination = 'Pizza Place'
distance = calculate_distance('stores', user_location, destination)
print(f"Distance from {user_location} to {destination} is {distance} km")
```

#### 3. **Geofencing**

**Scenario**: Monitor whether a user enters or leaves a specified geographic area, such as the fence zone of a shopping mall.

**Solution**:
- Use the `GEOSEARCH` command to query points within the fence zone.
- Periodically check whether the user's location falls inside the fence zone.

**Example code** (Python):

```python
# Set up a geofence zone
def setup_geofence(key, center_longitude, center_latitude, radius, unit='km'):
    redis_client.geoadd(key, [center_longitude, center_latitude, 'geofence_center'])

# Check whether the user is inside the fence zone
def is_within_geofence(key, user_longitude, user_latitude, radius, unit='km'):
    nearby = redis_client.geosearch(key, longitude=user_longitude, latitude=user_latitude, unit=unit, radius=radius)
    return 'geofence_center' in nearby

# Example: set up a shopping mall fence zone
setup_geofence('geofence', -122.408, 37.783, 1, 'km')

# Example: check whether the user is inside the fence zone
user_location = (-122.407, 37.782)  # user's location
within_geofence = is_within_geofence('geofence', *user_location, 1, 'km')
print("User is within the geofence:", within_geofence)
```

#### 4. **Dynamic promotions**

**Scenario**: A merchant wants to push a promotion or coupon to a user when they enter a specific geographic area.

**Solution**:
- Use geofencing to monitor the user's location.
- When the user enters the fence zone, trigger the promotion and send a notification.

**Example code** (Python):

```python
# Send a promotion notification
def send_promotion(user_id, promotion):
    print(f"Sending promotion to user {user_id}: {promotion}")

# Example: check the user's location and send a promotion
def check_and_notify(user_id, user_longitude, user_latitude):
    if is_within_geofence('geofence', user_longitude, user_latitude, 1, 'km'):
        send_promotion(user_id, "Exclusive 20% discount just for you!")

# Example user location
user_location = (-122.407, 37.782)
check_and_notify('user123', *user_location)
```

### Summary

Location-based services can leverage Redis's geospatial features to process and query geographic data efficiently. With commands such as `GEOADD`, `GEOSEARCH`, and `GEODIST` provided by Redis, you can easily implement applications like store recommendations, real-time navigation, geofencing, and dynamic promotions. Note that `GEORADIUS` and `GEORADIUSBYMEMBER` were deprecated in 6.2; new code should use `GEOSEARCH` consistently.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Geospatial](https://redis.io/docs/latest/develop/data-types/geospatial/)
- GEOSEARCH (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](/use-cases/README.md)
- [geolocation-services](/use-cases/geolocation-services.md)
- [geospatial-indexing](/use-cases/geospatial-indexing.md)
