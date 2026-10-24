In a distributed system, a distributed lock coordinates access to a shared resource across multiple nodes to preserve data consistency and system reliability. The following is a real-world case showing how to implement and use a distributed lock in a distributed system.

### Case study: a lock in a distributed system

#### Background

Suppose we have an e-commerce system in which several application instances handle order requests. These instances must ensure that only one instance at a time processes the payment for a given order, to avoid duplicate payments or data inconsistency. A distributed lock solves this problem.

#### Requirements

- Only one instance may process the payment request for a given order at a time.
- The lock must be released automatically when the system restarts or the network partitions.
- Acquiring and releasing the lock must be both efficient and reliable.

#### Choosing an approach

We chose Redis as the implementation tool for the distributed lock, because it supports atomic operations, is easy to deploy, and has good performance.

#### Implementation steps

1. **Define the lock structure**

   Use a Redis key as the lock identifier. For example, for the order `order123`, use `lock:order123` as the Redis key representing the lock.

2. **Acquire the lock**

   Use Redis's `SET` command with the `NX` and `EX` options to create the lock atomically. `NX` ensures the key is only set when it does not exist, and `EX` sets the key's expiration time.

3. **Perform the operation**

   If the lock was acquired, process the payment request for the order.

4. **Release the lock**

   Delete the Redis key after comparing the random value via a Lua script: the compare and the delete must be executed atomically, so that only the instance holding the lock can release it, avoiding deleting someone else's lock.

#### Example code (Python)

The following is an example of a distributed lock implemented with Redis:

```python
import redis
import uuid
import time

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

def process_order(order_id):
    lock_id = acquire_lock(order_id)
    if lock_id:
        try:
            # Simulate the payment operation
            print(f"Processing payment for order {order_id}...")
            time.sleep(5)  # Simulate the latency of the payment operation
        finally:
            release_lock(order_id, lock_id)
            print(f"Payment processed and lock released for order {order_id}.")
    else:
        print(f"Failed to acquire lock for order {order_id}. Payment processing skipped.")

# Example: process an order
process_order('order123')
```

#### Error handling and fault tolerance

- **Lock timeout**: set a reasonable lock timeout so an unreleased lock does not leak resources.
- **Retry mechanism**: when failing to acquire the lock, a retry mechanism may be needed to improve the system's robustness.
- **Heartbeat detection**: in complex scenarios, a heartbeat mechanism may be needed to confirm the health of the lock holder.

#### Summary

In this distributed e-commerce example, we used Redis to implement a distributed lock that preserves data consistency and system reliability when processing order payments. A distributed lock effectively resolves contention for a shared resource across multiple instances and improves system stability.

## References

- [Redis dev docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Official patterns · Distributed locks](https://redis.io/docs/latest/develop/use/patterns/distributed-locks/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/use-cases/README.md)
- [distributed-locks](/use-cases/distributed-locks.md)
