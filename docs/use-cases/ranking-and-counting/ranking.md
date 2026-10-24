Leaderboard implementations can rely on different data structures and strategies; the specific choice depends on the complexity of the requirements and the performance needs. Below are several common leaderboard implementations, especially Redis-based ones.

### 1. Using a sorted set (ZSET)

Redis's sorted set (`ZSET`) is the most commonly used data structure for leaderboards. Every element is associated with a score, and Redis sorts elements automatically by score. This fits leaderboard requirements very well.

#### 1.1 Basic operations

- **Add or update a score**: use the `ZADD` command to add an element and its score to the sorted set. If the element already exists, its score is updated.
- **Fetch the leaderboard**: use `ZRANGE` to retrieve elements by index range, adding `REV` to sort from high to low (since 6.2 `ZREVRANGE` is deprecated; use `ZRANGE ... REV` uniformly).
- **Get an element's rank**: use the `ZRANK` or `ZREVRANK` command to get an element's rank (low to high, or high to low).

**Example code** (Python):

```python
import redis

# Connect to Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Add or update a score
def update_score(player_name, score):
    redis_client.zadd('game_scores', {player_name: score})

# Get the top N players
def get_top_n_players(n):
    return redis_client.zrange('game_scores', 0, n-1, desc=True, withscores=True)

# Get a player's rank
def get_player_rank(player_name):
    return redis_client.zrevrank('game_scores', player_name)

# Example usage
update_score('player1', 100)
update_score('player2', 200)
update_score('player3', 150)

top_2_players = get_top_n_players(2)
print("Top 2 players:", top_2_players)

player1_rank = get_player_rank('player1')
print("Player1 rank:", player1_rank)
```

#### 1.2 Advanced operations

- **Fetch elements by score range**: use `ZRANGE ... BYSCORE` to get elements within a specific score range, adding `REV` for high to low (since 6.2 `ZRANGEBYSCORE` and `ZREVRANGEBYSCORE` are deprecated).
- **Fetch elements by rank range**: use `ZRANGE` to get elements within a specific rank range, adding `REV` for high to low.

**Example code** (Python):

```python
# Get players in a specific score range
def get_players_by_score(min_score, max_score):
    return redis_client.zrange('game_scores', min_score, max_score, byscore=True, withscores=True)

# Example usage
players_in_range = get_players_by_score(100, 150)
print("Players with scores between 100 and 150:", players_in_range)
```

### 2. Using HyperLogLog

If the leaderboard only needs to record the number of elements without detailed score information, HyperLogLog can be used. HyperLogLog is primarily for approximate counting, but it can serve as an optimization when handling massive amounts of data.

#### 2.1 Basic operations

- **Add elements**: use the `PFADD` command to add elements to the HyperLogLog.
- **Get the element count**: use the `PFCOUNT` command to get the approximate number of elements in the HyperLogLog.

**Example code** (Python):

```python
# Add elements to a HyperLogLog
def add_to_hyperloglog(key, *elements):
    redis_client.pfadd(key, *elements)

# Get the approximate number of elements in the HyperLogLog
def get_hyperloglog_count(key):
    return redis_client.pfcount(key)

# Example usage
add_to_hyperloglog('unique_visitors', 'user1', 'user2', 'user3')
approx_count = get_hyperloglog_count('unique_visitors')
print("Approximate unique visitors count:", approx_count)
```

### 3. Using Redis Streams

Redis Streams is a data structure for handling time-series data. For leaderboards that need time-based ordering and real-time updates, Redis Streams can also help.

#### 3.1 Basic operations

- **Add data**: use the `XADD` command to add data to the stream.
- **Read data**: use the `XRANGE` or `XREVRANGE` command to read data within a specific range.
- **Get the data volume**: use the `XCOUNT` command to get the number of items in the stream.

**Example code** (Python):

```python
# Add data to a stream
def add_to_stream(stream_name, *fields_and_values):
    redis_client.xadd(stream_name, dict(zip(fields_and_values[::2], fields_and_values[1::2])))

# Read data from a stream
def read_from_stream(stream_name, start, end):
    return redis_client.xrange(stream_name, min=start, max=end)

# Example usage
add_to_stream('player_scores', 'player1', 100, 'player2', 200, 'player3', 150)
scores = read_from_stream('player_scores', '-', '+')
print("Player scores:", scores)
```

### Summary

Redis offers several data structures and commands for implementing leaderboards:

- **Sorted sets** are the most commonly used approach, well suited for storing and sorting scored elements.
- **HyperLogLog** can be used to record element counts, but is not suitable for storing detailed scores.
- **Redis Streams** is suitable for time-series data and can be used for real-time updates and leaderboard queries.

Choosing the right approach depends on the specific application requirements and performance needs.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)
- ZREVRANGE (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](/use-cases/README.md)
- [ranking-and-counting](/use-cases/ranking-and-counting.md)
