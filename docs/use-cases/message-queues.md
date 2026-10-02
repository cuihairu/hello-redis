# 消息队列

Redis 提供两种消息队列实现：基于列表的简单队列，以及功能更完整的 Stream。简单队列适合任务分发；Stream 支持消费组、消息确认和回溯，适合要求可靠消费的场景。任务队列的设计与实战可参阅[任务队列](task-queue.md)。

## 方案一：列表实现简单队列

生产者 `LPUSH` 入队，消费者 `BRPOP` 阻塞出队（先进先出）：

```bash
# 生产者
LPUSH queue:tasks '{"type":"email","to":"alice@example.com"}'

# 消费者（阻塞最多 5 秒，直到有消息）
BRPOP queue:tasks 5
```

- `BRPOP` 一次只消费一条，多个消费者各取所需，天然构成竞争消费。
- 缺点：消息取出后即被删除，没有确认机制，进程崩溃时消息会丢失。

## 方案二：Stream 消费组

```bash
# 生产者：* 表示由服务端生成消息 ID（时间戳-序号）
XADD queue:orders '*' type pay order_id 10086

# 创建消费组，从 0 开始读取
XGROUP CREATE queue:orders workers $

# 消费者读取（> 表示读取从未被消费的新消息，需提供消费者名）
XREADGROUP GROUP workers consumer-1 COUNT 10 STREAMS queue:orders >

# 处理成功后确认
XACK queue:orders workers 1790909676579-0

# 查看未确认的消息（进程崩溃后重新消费）
XPENDING queue:orders workers
```

`$` 表示消费组创建之后的新消息，`0` 则包含历史消息。

## Python 示例

```python
import json
import redis

r = redis.Redis(decode_responses=True)


def produce(task):
    r.xadd('queue:tasks', task, maxlen=10000)  # 只保留最近 1 万条，防止无限膨胀


def consume(consumer):
    try:  # 首次消费前创建消费组，重复创建会报 BUSYGROUP，可忽略
        r.xgroup_create('queue:tasks', 'workers', id='0', mkstream=True)
    except redis.ResponseError as e:
        if 'BUSYGROUP' not in str(e):
            raise
    messages = r.xreadgroup('workers', consumer, {'queue:tasks': '>'}, count=10, block=5000)
    results = []
    for _stream, entries in messages or []:
        for msg_id, data in entries:
            handle(data)                    # 业务处理
            r.xack('queue:tasks', 'workers', msg_id)
            results.append((msg_id, data))
    return results


def handle(data):
    print('processing', data)


if __name__ == '__main__':
    produce({'type': 'email', 'to': 'alice@example.com'})
    print(consume('c1'))
```

## 方案选择

| 需求 | 推荐 |
| --- | --- |
| 简单分发、允许少量丢失 | `LPUSH` + `BRPOP` |
| 消息需要确认、支持多消费组、可回溯 | Stream + `XREADGROUP` |
| 延迟消息 | 用有序集合按时间排序，轮询 `ZRANGEBYSCORE` 取到期消息 |

## 注意事项

- Stream 建议设置 `MAXLEN` 上限，避免日志型结构无限增长。
- 长期未确认的消息用 `XPENDING`/`XCLAIM` 认领处理，防止消息"卡死"。
- 需要严格一次投递（exactly-once）时，消费端要对业务做幂等处理。
