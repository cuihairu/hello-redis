# 用户消息时间线

时间线（Timeline）是微博、朋友圈类应用的核心：发布一条动态后，关注者的首页要能看到它。常见有两种写入策略——推模式（写扩散）与拉模式（读扩散），实际项目中经常混合使用。

## 数据结构设计

- `timeline:{用户ID}`：某人的首页时间线，用有序集合，分数存发布时间戳毫秒，成员存消息 ID；
- `posts:{用户ID}`：某人自己发布的所有消息（写扩散时同时投递到每个粉丝的时间线）。

## 命令演示

```bash
# 发布消息（假设消息 ID 由发号器生成）
INCR post:id                                    # 1
ZADD posts:42 1717382400000 1

# 推模式：写入自己和每个粉丝的时间线
ZADD timeline:43 1717382400000 1
ZADD timeline:44 1717382400000 1

# 刷首页：按时间倒序取最近 20 条
ZREVRANGE timeline:43 0 19 WITHSCORES

# 翻页：以某条消息的分数为游标，取更早的内容
ZREVRANGEBYSCORE timeline:43 (1717382400000 -inf LIMIT 0 20

# 只保留最近 1000 条，防止时间线无限膨胀
ZREMRANGEBYRANK timeline:43 0 -1001
```

## Python 示例

```python
import time
import redis

r = redis.Redis(decode_responses=True)
TIMELINE_LEN = 1000


def publish(user_id, content):
    post_id = r.incr('post:id')
    now = int(time.time() * 1000)
    pipe = r.pipeline()
    pipe.zadd(f'posts:{user_id}', {post_id: now})
    # 写扩散：投递给自己的时间线和粉丝的时间线
    pipe.zadd(f'timeline:{user_id}', {post_id: now})
    for fan in r.sscan_iter(f'fans:{user_id}', count=500):
        pipe.zadd(f'timeline:{fan}', {post_id: now})
    pipe.execute()
    return post_id


def home(user_id, size=20):
    ids = r.zrevrange(f'timeline:{user_id}', 0, size - 1, withscores=True)
    return [(int(pid), score) for pid, score in ids]


def home_before(user_id, cursor_score, size=20):
    return r.zrevrangebyscore(f'timeline:{user_id}', f'({cursor_score}', '-inf',
                              start=0, num=size, withscores=True)


def trim(user_id):
    r.zremrangebyrank(f'timeline:{user_id}', 0, -TIMELINE_LEN - 1)


if __name__ == '__main__':
    r.sadd('fans:42', 43, 44)
    post_id = publish(42, 'hello world')
    print(post_id, home(43))   # 首页能看到 42 发的消息
```

## 推模式与拉模式

- **推模式（写扩散）**：发布时写入所有粉丝的时间线，读取是 O(log N) 的一次 `ZREVRANGE`，但大 V 发一条要写入百万次。适合粉丝量普遍不大的社交圈。
- **拉模式（读扩散）**：只写入自己的 `posts`，粉丝刷首页时拉取所有关注对象的 `posts` 再合并排序。读取需要 `ZUNIONSTORE` 或应用层归并，适合大 V 场景。
- **混合模式**：普通用户推、粉丝超百万的大 V 拉；或时间线只缓存最近若干条，历史内容回源。

## 实践建议

- 时间线只做"ID + 时间戳"的轻量索引，正文等大数据放独立键或数据库，用 `MGET`/管道批量取。
- 用 `ZREMRANGEBYRANK` 限制长度，历史消息归档后再读。
- 分页一定要用时间戳游标（`ZREVRANGEBYSCORE (score`），不要用 `ZREVRANGE` 的大 offset，避免新消息插入导致重复或漏读。
