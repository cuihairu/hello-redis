# Task queue design and implementation

This page focuses on delivery semantics, retries, and dead letter design; for the List and Stream commands and their acknowledgement capabilities see [Message queues](../message-queues.md).

A task queue pulls long-running work out of the user request: the producer writes to the queue and returns immediately, and a consumer executes the task asynchronously. Redis Lists, Streams, and ZSETs can all be used to build a queue; they differ in delivery semantics.

## Choosing a delivery semantic

| Requirement | Approach | Delivery guarantee |
| --- | --- | --- |
| Simple dispatch, a small amount of loss acceptable | List: `LPUSH` + `BRPOP` | Dropped as soon as it is popped; no acknowledgement or retry |
| Must not be lost, retriable | Streams + consumer groups | Read entries go into a pending list and are removed after `XACK`; on failure they can be handed over |
| Delayed execution | ZSET: score is the execution timestamp | Poll for due tasks; `ZREM` deletes them when popped |

## Design points

- **Delivery semantics**: decide first whether you need at-least-once or at-most-once. Streams acknowledgement semantics are at-least-once, so the consumer side must be idempotent (give each task a unique ID and check whether it has already been processed before executing it).
- **Retries and dead letters**: on task failure, retry first, and record the retry count in the task body; once the limit is exceeded the task goes to a dead letter queue (a separate key or stream), so a poison task does not retry forever and stall the queue.
- **Monitoring**: queue length (`LLEN`/`XLEN`), number of pending entries (`XPENDING`), failure counts. Alert when the queue backs up or dead letters keep growing.
- **Idempotency and concurrency**: the same task may be delivered more than once, so the execution logic de-duplicates by task ID; pair critical operations with a distributed lock.

## Implementation example (List queue)

```python
import json
import time

import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def add_task(task_type, payload, task_id=None):
    task = {
        'id': task_id or f'task:{time.time_ns()}',
        'type': task_type,
        'payload': payload,
        'retries': 0,
    }
    redis_client.lpush('task_queue', json.dumps(task))

def process_task(task):
    print(f"Processing task: {task['id']}")

def worker(max_retries=3, dead_letter='dead_letter_queue'):
    while True:
        _, raw = redis_client.brpop('task_queue')
        task = json.loads(raw)
        try:
            process_task(task)
        except Exception:
            task['retries'] += 1
            if task['retries'] <= max_retries:
                redis_client.lpush('task_queue', json.dumps(task))  # retry
            else:
                redis_client.lpush(dead_letter, json.dumps(task))    # dead letter
```

With the List approach, a task is removed from the queue as soon as `BRPOP` pops it, so a worker crash loses tasks; when tasks must not be lost, switch to Streams consumer groups, which acknowledge after reading and hand over on failure.

## Related notes

- For the implementation of delayed and async tasks see [Async task processing](async-tasks.md);
- For a comparison with Kafka and RabbitMQ see [Message queues](../message-queues.md).

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Lists](https://redis.io/docs/latest/develop/data-types/lists/)
- BLPOP (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/use-cases/README.md)
- [task-queue](/use-cases/task-queue.md)
