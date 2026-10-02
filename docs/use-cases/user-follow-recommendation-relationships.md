# 用户关注、推荐模型、好友关系

社交关系的核心是"谁关注了谁"。集合（Set）适合存储无序的关系列表，其交、并、差运算可以直接回答共同关注、可能认识的人等查询，全部计算在 Redis 内完成。

## 数据结构设计

- `follow:{用户ID}`：我关注的人；
- `fans:{用户ID}`：我的粉丝；
- `mutual:{用户ID}`：双向好友（互相关注），可由上面两个集合运算得出。

## 命令演示

```bash
# 关注动作：两个方向都要写入（可用管道一次提交）
SADD follow:42 43 44 45
SADD fans:43 42

# 我关注了谁
SMEMBERS follow:42

# 谁关注了我
SCARD fans:42

# 我的共同关注：follow:42 与 follow:43 的交集
SINTER follow:42 follow:43

# 双向好友：互相关注
SINTER follow:42 fans:42

# 可能认识的人（推荐）：关注了我、但我还没关注的人
SDIFF fans:42 follow:42

# 取关：同样删除两个方向
SREM follow:42 43
SREM fans:43 42
```

## Python 示例

```python
import redis

r = redis.Redis(decode_responses=True)


def follow(from_user, to_user):
    # 使用管道保证两个方向尽量原子地更新
    pipe = r.pipeline()
    pipe.sadd(f'follow:{from_user}', to_user)
    pipe.sadd(f'fans:{to_user}', from_user)
    return pipe.execute()[0] == 1


def unfollow(from_user, to_user):
    pipe = r.pipeline()
    pipe.srem(f'follow:{from_user}', to_user)
    pipe.srem(f'fans:{to_user}', from_user)
    pipe.execute()


def common_follow(a, b):
    return r.sinter(f'follow:{a}', f'follow:{b}')


def recommend(a, limit=10):
    # 两度关系的共同粉丝也常用于推荐，这里给出最简单的一度差集
    candidates = r.sdiff(f'fans:{a}', f'follow:{a}')
    return list(candidates)[:limit]


def is_mutual(a, b):
    return r.sismember(f'follow:{a}', b) and r.sismember(f'follow:{b}', a)


if __name__ == '__main__':
    follow(42, 43)
    follow(42, 44)
    follow(43, 44)
    follow(43, 45)
    print(sorted(common_follow(42, 43)))   # ['44']
    print(recommend(43))                   # ['42']
    print(is_mutual(42, 43))               # False（43 未关注 42）
```

## 推荐的进阶思路

- **二度人脉**：`SUNIONSTORE` 多个好友的 `fans` 集合，排除自己和已关注的人，再按共同好友数排序（`ZINTERSTORE`）。
- **可能感兴趣的人**：结合标签或行为数据，用有序集合给候选用户打分后取 Top N。
- **大 V 的粉丝集合**：可能有千万级成员，遍历用 `SSCAN` 分页；关注写入可以分片（`fans:{uid}:0..9`）后汇总统计。

## 注意事项

- 关注/取关必须同时更新两个集合，否则会出现"单向数据"，推荐结果失真；用管道提交减少不一致窗口。
- 粉丝数、关注数可以用独立的计数器（`INCR`）缓存，避免频繁 `SCARD`。
- 只做统计不关心成员时，HyperLogLog 比集合更省内存（如"可能认识的人"只需估算规模时）。
