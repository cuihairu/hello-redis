# 任务队列设计与实现

任务队列把耗时任务从用户请求里剥离：生产者写入队列立即返回，消费者异步执行。Redis 的 List、Streams、ZSET 都能搭队列，差别在投递语义。

## 投递语义选型

| 需求 | 做法 | 投递保证 |
| --- | --- | --- |
| 简单分发、允许少量丢失 | List：`LPUSH` + `BRPOP` | 取出即丢，无确认与重试 |
| 不能丢、可重试 | Streams + 消费者组 | 读取后进入待确认列表，`XACK` 后移除，失败可转交 |
| 延迟执行 | ZSET：分数为执行时间戳 | 轮询取到期任务，`ZREM` 取出即删 |

## 设计要点

- **投递语义**：先定至少一次还是至多一次。Streams 的确认语义是至少一次，消费端必须做幂等（任务带唯一 ID，执行前检查是否已处理）。
- **重试与死信**：任务失败先重试，重试次数写进任务体；超过上限进入死信队列（单独的键或流），避免毒任务无限重试卡死队列。
- **监控**：队列长度（`LLEN`/`XLEN`）、待确认条目数（`XPENDING`）、失败计数。队列积压或死信增长时告警。
- **幂等与并发**：同一任务可能被重复投递，执行逻辑按任务 ID 去重；临界操作配合分布式锁。

## 实现示例（List 队列）

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
                redis_client.lpush('task_queue', json.dumps(task))  # 重试
            else:
                redis_client.lpush(dead_letter, json.dumps(task))    # 死信
```

List 方案的任务在 `BRPOP` 取出后即从队列删除，Worker 崩溃会丢任务；不能丢的场景换 Streams 消费者组，读取后确认、失败转交。

## 深入阅读

- 延迟任务与异步任务的实现见[异步任务处理](async-tasks.md)；
- 与 Kafka、RabbitMQ 的对比见[消息队列](../message-queues.md)。
