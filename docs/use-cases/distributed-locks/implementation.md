A distributed lock coordinates access to a shared resource across multiple processes or nodes in a distributed system, to preserve data consistency and avoid concurrency problems. Below are several common implementations, each with its principle, implementation, and pros and cons.

### 1. **Redis-based distributed locks**

Redis is a popular choice for distributed locks, using its atomic operations and expiration settings to manage lock state.

#### Implementation steps

1. **Acquire the lock**: create the lock atomically with the `NX` (set only if it does not exist) and `EX` (set an expiration) options of the `SET` command.
2. **Check the lock**: if the lock already exists, it cannot be acquired.
3. **Release the lock**: delete the lock key after comparing the random value via a Lua script; the compare and the delete must be executed atomically, so that only the client holding the lock can release it.

#### Example code (Python)

```python
import redis
import time
import uuid

# Connect to Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)

def acquire_lock(lock_name, lock_timeout=10):
    lock_id = str(uuid.uuid4())
    lock_key = f"lock:{lock_name}"
    
    # Try to acquire the lock
    acquired = redis_client.set(lock_key, lock_id, nx=True, ex=lock_timeout)
    if acquired:
        return lock_id
    return None

def release_lock(lock_name, lock_id):
    lock_key = f"lock:{lock_name}"

    # The compare and the delete must run inside one Lua script: between a GET and a DEL the lock may
    # have already expired and been taken by another client, so deleting it directly would delete someone else's lock
    release_script = """
    if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
    else
        return 0
    end
    """
    redis_client.eval(release_script, 1, lock_key, lock_id)

# Example: acquire and release the lock
lock_id = acquire_lock('resource')
if lock_id:
    try:
        # Execute critical-section code
        print("Lock acquired, performing operations...")
        time.sleep(5)  # Simulate the operation
    finally:
        release_lock('resource', lock_id)
        print("Lock released.")
else:
    print("Failed to acquire lock.")
```

#### Pros and cons

- **Pros**:
  - Simple to implement, easy to understand and deploy.
  - Redis's atomic operations make the lock reliable.
- **Cons**:
  - An expired lock can leak resources.
  - Single point of failure: if the Redis instance is unavailable, the lock mechanism is affected too.

### 2. **ZooKeeper-based distributed locks**

ZooKeeper is a distributed coordination service that supports distributed locks, configuration management, and more.

#### Implementation steps

1. **Create a lock node**: create an ephemeral sequential node in ZooKeeper as the lock identifier.
2. **Acquire the lock**: inspect the node sequence to determine whether the lock is obtained.
3. **Release the lock**: delete the node to release the lock.

#### Example code (Python)

```python
from kazoo.client import KazooClient
from kazoo.exceptions import NodeExistsError, NoNodeError

# Connect to ZooKeeper
zk = KazooClient(hosts='127.0.0.1:2181')
zk.start()

def acquire_lock(lock_name):
    lock_path = f"/locks/{lock_name}"
    try:
        # Create an ephemeral sequential node
        zk.create(lock_path, ephemeral=True, sequence=True)
        return True
    except NodeExistsError:
        return False

def release_lock(lock_name):
    lock_path = f"/locks/{lock_name}"
    try:
        zk.delete(lock_path)
    except NoNodeError:
        pass

# Example: acquire and release the lock
if acquire_lock('resource'):
    try:
        print("Lock acquired, performing operations...")
        # Execute critical-section code
    finally:
        release_lock('resource')
        print("Lock released.")
else:
    print("Failed to acquire lock.")
```

#### Pros and cons

- **Pros**:
  - Highly reliable; ZooKeeper is designed for high availability.
  - Supports a range of coordination features, such as configuration management.
- **Cons**:
  - Deploying and maintaining ZooKeeper is relatively complex.
  - Performance can become a bottleneck, especially in large clusters.

### 3. **Database-based distributed locks**

Use a relational database's unique index or an optimistic locking mechanism to implement a distributed lock.

#### Implementation steps

1. **Acquire the lock**: insert a record into a database table as the lock identifier.
2. **Check the lock**: query the record to determine whether the lock is obtained.
3. **Release the lock**: delete the record to release the lock.

#### Example code (Python, using SQLite)

```python
import sqlite3
import time
import uuid

# Connect to the database
conn = sqlite3.connect('locks.db')
cursor = conn.cursor()

# Create the lock table
cursor.execute('''
CREATE TABLE IF NOT EXISTS locks (
    lock_name TEXT PRIMARY KEY,
    lock_id TEXT,
    expires_at TIMESTAMP
)
''')
conn.commit()

def acquire_lock(lock_name, lock_timeout=10):
    lock_id = str(uuid.uuid4())
    expires_at = time.time() + lock_timeout
    try:
        cursor.execute('''
        INSERT INTO locks (lock_name, lock_id, expires_at)
        VALUES (?, ?, ?)
        ''', (lock_name, lock_id, expires_at))
        conn.commit()
        return lock_id
    except sqlite3.IntegrityError:
        return None

def release_lock(lock_name, lock_id):
    cursor.execute('''
    DELETE FROM locks
    WHERE lock_name = ? AND lock_id = ?
    ''', (lock_name, lock_id))
    conn.commit()

# Example: acquire and release the lock
lock_id = acquire_lock('resource')
if lock_id:
    try:
        print("Lock acquired, performing operations...")
        # Execute critical-section code
        time.sleep(5)  # Simulate the operation
    finally:
        release_lock('resource', lock_id)
        print("Lock released.")
else:
    print("Failed to acquire lock.")
```

#### Pros and cons

- **Pros**:
  - Reuses existing database infrastructure, with no extra component needed.
  - Database transactions can provide atomicity for the lock.
- **Cons**:
  - Performance may be affected, especially under high concurrency.
  - Implementing timeout and retry for a database lock is relatively complex.

### Summary

Each approach above has its own pros and cons and fits different scenarios. Which distributed lock implementation to choose depends on the system's specific requirements, existing infrastructure, and performance needs.

## References

- [Redis dev docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Official patterns · Distributed locks](https://redis.io/docs/latest/develop/use/patterns/distributed-locks/)
- SET (NX option) (no authoritative source found (to verify))

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/use-cases/README.md)
- [distributed-locks](/use-cases/distributed-locks.md)
