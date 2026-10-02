# 全局ID

分布式系统中，多个节点需要生成全局唯一的 ID（订单号、流水号等）。Redis 单线程串行执行命令的特性，使 `INCR` 成为最简单可靠的发号器：每次自增都返回唯一递增的值。

## 方案一：INCR 直接发号

```bash
SET id:order 100000                # 设定起始值
INCR id:order                      # 100001
INCR id:order                      # 100002
```

`INCR` 是原子的，即使多个应用实例同时请求也绝不重复。缺点是所有请求都打到同一个键上，压力大时会成为热点。

## 方案二：步长发号（分段领取）

实例一次领取一段 ID（如 1000 个），本地用完再领，既减少 Redis 往返，也天然按步长分片：

```bash
# 每次原子地把号段推进 1000，返回本段起始值
INCRBY id:order 1000               # 100001（本实例可使用 100001 ~ 101000）
INCRBY id:order 1000               # 101001
```

应用层在本段内自增，段用尽前预先领取下一段。为防止实例崩溃造成号段浪费，可给 ID 键设置较长的 TTL 兜底，或在实例重启时把本段重新放回（记录起点）。

## 方案三：按天号段

键名中加入日期，既可读又自动隔离热点：

```bash
INCR id:order:20240603             # 当天第 1 个订单号
```

配合 `EXPIRE id:order:20240603 172800`，历史号段键两天后自动过期。

## Python 示例：发号器

```python
import datetime
import redis

r = redis.Redis(decode_responses=True)
STEP = 1000


class IdGenerator:
    def __init__(self, name, step=STEP):
        self.key = f'id:{name}'
        self.step = step
        self.current = 0
        self.end = 0

    def next_id(self):
        if self.current >= self.end:
            # 本地已用完，向 Redis 申请下一个号段
            start = r.incrby(self.key, self.step)
            self.current = start
            self.end = start + self.step
        value = self.current
        self.current += 1
        return value


if __name__ == '__main__':
    gen = IdGenerator('order')
    print([gen.next_id() for _ in range(3)])   # 1, 2, 3（Redis 初次使用从 1 开始）
    print(r.get('id:order'))                   # '1000'（已领取 1000 号段）
```

## 注意事项

- `INCR` 结果是 64 位有符号整数，最大 9223372036854775807，实际业务远用不到上限。
- 需要可读性（如带日期前缀）时，可以拼接日期与序号，例如 `20240603` + 6 位补零序号。
- 需要"趋势递增"而非严格递增时，也可以用 `TIME` 时间戳部分拼接毫秒与计数，减少单键压力。
