# 抽奖

抽奖、随机选人、盲盒等场景的核心需求是：从候选集合中随机取出若干个元素，且不能重复中奖。集合（Set）的 `SRANDMEMBER` 和 `SPOP` 正好提供这两种语义。

## 两种随机命令的区别

- `SRANDMEMBER key [count]`：随机返回元素但**不删除**，适合"抽 3 个展示但不淘汰"的场景；`count` 为正时返回不重复的元素，为负时允许重复（可用来做有放回抽样）。
- `SPOP key [count]`：随机取出并**删除**，天然防重复中奖，适合一轮抽奖淘汰一人。

## 命令演示

```bash
# 报名抽奖（同一用户重复报名会被集合去重）
SADD lottery:1001 alice bob carol dave erin

# 抽 3 个中奖者（取出即从候选中移除，后续轮次不会再中）
SPOP lottery:1001 3

# 查看剩余候选
SCARD lottery:1001

# 不淘汰的随机展示：抽 1 个主持人（可重复抽中）
SRANDMEMBER lottery:1001

# 有放回地随机抽 5 次（可能重复，适合大奖概率模型）
SRANDMEMBER lottery:1001 -5
```

## Python 示例：带权重的抽奖

用有序集合把分数当作权重，分数越高中奖概率越大：

```python
import random
import redis

r = redis.Redis(decode_responses=True)


def enter(user_id, weight=1):
    r.zadd('lottery:2024', {user_id: weight})


def draw(n=1):
    # 按权重分层：低分用户先淘汰，高分用户最后留下的概率更高
    # 简化实现：按累计权重做加权随机
    entries = r.zrange('lottery:2024', 0, -1, withscores=True)
    if not entries:
        return []
    total = sum(score for _, score in entries)
    winners = []
    pool = list(entries)
    for _ in range(min(n, len(pool))):
        pick = random.uniform(0, total)
        acc = 0.0
        for idx, (user, score) in enumerate(pool):
            acc += score
            if pick <= acc:
                winners.append(user)
                total -= score
                pool.pop(idx)
                break
    return winners


if __name__ == '__main__':
    enter('alice', 3)
    enter('bob', 1)
    enter('carol', 2)
    print(draw(2))   # 随机 2 个不重复的中奖者
```

## 防重复与回滚

- 用 `SADD` 报名天然防重复；若中奖记录也需要保留，可把中奖者 `SADD` 到 `lottery:1001:winners`，并在候选集合里 `SREM`。
- 抽奖结果需要可回滚时，先用 `SPOP` 取出后把结果写入另一个键，失败时再 `SADD` 回原集合。
- 大型活动抽奖建议先把候选集快照（`SUNIONSTORE` 或复制键），避免活动期间新报名影响已开始的轮次。
