# 点赞

点赞功能的两个核心问题是"这条内容被赞了多少次"和"某个用户是否赞过"。前者用计数器，后者用集合（Set），二者组合即可完整实现。

## 数据结构设计

- `like:count:{内容ID}`：String 计数器，记录点赞总数；
- `like:users:{内容ID}`：Set，记录点赞用户，用于去重与判断是否已赞；
- `like:user:{用户ID}`：Set（可选），记录用户点赞过的内容，用于"我的点赞"列表。

## 命令演示

```bash
# 用户 42 给内容 1001 点赞（SADD 返回 1 表示之前没赞过，0 表示重复点赞）
SADD like:users:1001 42        # 1
INCR like:count:1001           # 1

# 取消点赞
SREM like:users:1001 42        # 1
DECR like:count:1001

# 判断是否点过赞
SISMEMBER like:users:1001 42   # 0

# 点赞用户列表与总数
SADD like:users:1001 42 43 44
SMEMBERS like:users:1001
SCARD like:users:1001                   # 3

# 快速求两个内容的共同点赞人数
SADD like:users:1002 43 44 45
SINTERCARD 2 like:users:1001 like:users:1002   # 2（Redis 7.0+，不返回成员只返回数量）
```

## Python 示例

```python
import redis

r = redis.Redis(decode_responses=True)


def like(content_id, user_id):
    added = r.sadd(f'like:users:{content_id}', user_id)
    if added:  # 只有第一次点赞才计数，保证不重复
        r.incr(f'like:count:{content_id}')
        return True
    return False


def unlike(content_id, user_id):
    removed = r.srem(f'like:users:{content_id}', user_id)
    if removed:
        r.decr(f'like:count:{content_id}')
        return True
    return False


def has_liked(content_id, user_id):
    return r.sismember(f'like:users:{content_id}', user_id)


def like_count(content_id):
    return int(r.get(f'like:count:{content_id}') or 0)


if __name__ == '__main__':
    print(like(1001, 42))       # True
    print(like(1001, 42))       # False，重复点赞被去重
    print(like_count(1001))     # 1
    print(has_liked(1001, 42))  # True
    unlike(1001, 42)
    print(like_count(1001))     # 0
```

## 两个方案的选择

- **需要"谁赞过"和防重复**：使用上面的 Set + 计数器方案。若点赞用户可能非常多（数十万以上），Set 会占用较多内存，可以把"是否赞过"改用位图（以用户 ID 为位偏移，仅当 ID 连续时适用），或只保留计数并把明细异步写入数据库。
- **只需要数量**：只用 `INCR/DECR` 计数器即可，防重复交给数据库唯一索引。

## 注意事项

- 计数器与 Set 是两个键，极端情况下（如进程中断）可能出现不一致，可以定期用 `SCARD` 校准 `like:count`。
- 热点内容的点赞键是热点键，必要时对计数器做分片累加再定期合并。
