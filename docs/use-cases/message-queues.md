# Message queues

Redis offers two message queue implementations: a simple queue on top of lists, and the more capable Stream. The simple queue fits task dispatch; Stream adds consumer groups, message acknowledgement, and replay, which fits scenarios that require reliable consumption. For task reliability design see [task queue](task-queue.md) and [task queue design](task-queue/design.md).

## Option 1: a list-based simple queue

The producer enqueues with `LPUSH`, the consumer blocks on dequeue with `BRPOP` (first in, first out):

```bash
# Producer
LPUSH queue:tasks '{"type":"email","to":"alice@example.com"}'

# Consumer (blocks up to 5 seconds until a message arrives)
BRPOP queue:tasks 5
```

- `BRPOP` consumes one message at a time; multiple consumers each take what they need, forming competing consumers by construction.
- Drawback: once a message is dequeued it is deleted, there is no acknowledgement, and a crashed process loses the message.

## Option 2: Stream consumer groups

```bash
# Producer: * means the server generates the message ID (timestamp-sequence)
XADD queue:orders '*' type pay order_id 10086

# Create a consumer group, reading from the start
XGROUP CREATE queue:orders workers $

# Consumer reads (> means new messages never consumed before, and a consumer name is required)
XREADGROUP GROUP workers consumer-1 COUNT 10 STREAMS queue:orders >

# Acknowledge after successful processing
XACK queue:orders workers 1790909676579-0

# List unacknowledged messages (reconsume after a crash)
XPENDING queue:orders workers
```

`$` means messages created after the consumer group, `0` also includes historical messages.

## Python example

```python
import json
import redis

r = redis.Redis(decode_responses=True)


def produce(task):
    r.xadd('queue:tasks', task, maxlen=10000)  # keep only the latest 10,000 so it cannot grow without bound


def consume(consumer):
    try:  # create the consumer group before the first consumption; recreating raises BUSYGROUP, which can be ignored
        r.xgroup_create('queue:tasks', 'workers', id='0', mkstream=True)
    except redis.ResponseError as e:
        if 'BUSYGROUP' not in str(e):
            raise
    messages = r.xreadgroup('workers', consumer, {'queue:tasks': '>'}, count=10, block=5000)
    results = []
    for _stream, entries in messages or []:
        for msg_id, data in entries:
            handle(data)                    # business processing
            r.xack('queue:tasks', 'workers', msg_id)
            results.append((msg_id, data))
    return results


def handle(data):
    print('processing', data)


if __name__ == '__main__':
    produce({'type': 'email', 'to': 'alice@example.com'})
    print(consume('c1'))
```

## Choosing an option

| Requirement | Recommended |
| --- | --- |
| Simple dispatch, tolerating some loss | `LPUSH` + `BRPOP` |
| Messages need acknowledgement, multiple consumer groups, replayable | Stream + `XREADGROUP` |
| Delayed messages | Sort by time in a sorted set and poll `ZRANGE ... BYSCORE` for messages that have come due |

## Notes

- Set a `MAXLEN` cap on Streams so log-style structures do not grow without bound.
- Use `XPENDING`/`XCLAIM` to reclaim messages that have gone unacknowledged for a long time, so messages do not get stuck.
- Where strict exactly-once delivery is needed, the consumer must make the business operation idempotent.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Streams](https://redis.io/docs/latest/develop/data-types/streams/)
- [Redis development docs · Pub/Sub](https://redis.io/docs/latest/develop/pubsub/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [knowledge](/knowledge.md)
- [README](README.md)
- [redis-use-cases](redis-use-cases.md)
- [task-queue](task-queue.md)
- [design](/use-cases/task-queue/design.md)
