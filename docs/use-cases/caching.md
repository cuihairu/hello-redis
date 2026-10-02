# 缓存

缓存是 Redis 最经典的使用场景。通过把热点数据放在内存中，可以大幅降低数据库压力并提升接口响应速度。关于缓存在项目中的策略与实战案例，还可以参阅[缓存策略与实践](cache/strategies.md)与[Web应用缓存](cache/web-app.md)。

## Cache-Aside 模式

最常用的读写模式是 Cache-Aside（旁路缓存）：

1. 读请求先查 Redis，命中则直接返回；
2. 未命中则查询数据库，并将结果写入 Redis，同时设置过期时间；
3. 写请求先更新数据库，再删除（或更新）对应的缓存。

以下 Python 示例演示了这一过程（需要 `pip install redis`，假设本机 6379 已启动 Redis）：

```python
import json
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)


def get_user(user_id):
    key = f'user:{user_id}'
    cached = r.get(key)
    if cached is not None:
        return json.loads(cached)

    user = query_user_from_db(user_id)  # 缓存未命中，回源数据库
    if user is None:
        return None
    # 写入缓存并设置 10 分钟过期，防止冷数据长期占用内存
    r.set(key, json.dumps(user), ex=600)
    return user


def update_user(user_id, **fields):
    update_user_in_db(user_id, **fields)  # 先更新数据库
    r.delete(f'user:{user_id}')           # 再删除缓存，下次读取时重建


def query_user_from_db(user_id):
    # 模拟数据库查询
    return {'id': user_id, 'name': 'Alice'}


def update_user_in_db(user_id, **fields):
    pass  # 模拟数据库更新


if __name__ == '__main__':
    print(get_user(1))   # 第一次回源并写缓存
    print(get_user(1))   # 第二次命中缓存
```

## 缓存的三个关键问题

- **缓存穿透**：查询不存在的数据，请求每次都打到数据库。对策：对空结果也做短 TTL 缓存，或使用布隆过滤器拦截。
- **缓存击穿**：某个热点键过期瞬间，大量请求同时回源。对策：使用互斥锁（`SET key value NX EX 5`）只允许一个请求回源重建缓存，或对热点键不过期。
- **缓存雪崩**：大量键在同一时刻集中过期。对策：在基础 TTL 上叠加随机抖动，并将过期时间错开。

## 过期与淘汰

- 通过 `EXPIRE`/`SET ... EX` 为键设置 TTL，用 `TTL` 查看剩余生存时间。
- 内存达到 `maxmemory` 后，Redis 按 `maxmemory-policy` 淘汰数据，缓存场景常用 `allkeys-lru` 或 `volatile-lru`。

## 与数据库的一致性

先更新数据库再删除缓存（Cache-Aside）在绝大多数场景下是简单且安全的选择。若对一致性要求更高，可以通过订阅数据库 binlog（如 Canal）异步删除缓存，或给缓存设置兜底 TTL 以限制不一致窗口。
