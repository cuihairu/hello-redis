# 其他有序集合命令

除了 `ZADD`、`ZRANGE`、`ZREM`，有序集合还有分数查询、排名计算、增量更新、范围删除和集合运算等命令。这一页按用途分组列出最常用的 11 条。

## 分数与排名

### ZSCORE

返回成员的分数，语法 `ZSCORE key member`。成员或键不存在时返回 `nil`。

```plaintext
ZSCORE ba:z:board alice
```

### ZMSCORE

批量返回多个成员的分数，语法 `ZMSCORE key member [member ...]`（Redis 6.2 起支持）。按传入顺序返回，不存在的成员对应位置为 `nil`。

```plaintext
ZMSCORE ba:z:board alice bob ghost
```

### ZCARD

返回有序集合的成员数量，语法 `ZCARD key`，时间复杂度 O(1)，键不存在时返回 0。

```plaintext
ZCARD ba:z:board
```

### ZCOUNT

统计分数区间内的成员数量，语法 `ZCOUNT key min max`。区间为闭区间，端点加 `(` 表示开区间，支持 `+inf`、`-inf`。

```plaintext
ZCOUNT ba:z:board (90 +inf
```

### ZRANK

返回成员按分数升序的排名（0 开始），语法 `ZRANK key member [WITHSCORE]`。成员不存在返回 `nil`；带 `WITHSCORE` 时同时返回分数（Redis 7.2 起支持）；对称的降序排名命令是 `ZREVRANK`。排行榜上「我排第几」就是它，注意升序方向，通常要配合 `ZREVRANK` 使用。

```plaintext
ZRANK ba:z:board bob WITHSCORE
```

### ZINCRBY

增加成员的分数，语法 `ZINCRBY key increment member`。`increment` 可为负数；成员不存在时先按 0 处理再加分，功能等价于 `ZADD key INCR ...`。加分的原子写法，排行榜计分用它。

```plaintext
ZINCRBY ba:z:board 5 bob
```

## 弹出与范围删除

### ZPOPMIN

移除并返回分数最低的一个或多个成员，语法 `ZPOPMIN key [count]`。返回「成员、分数」交替的数组，集合为空时返回空数组。

```plaintext
ZPOPMIN ba:z:board 1
```

### ZPOPMAX

移除并返回分数最高的一个或多个成员，语法 `ZPOPMAX key [count]`。与 `ZPOPMIN` 对称，适合取走当前最高分的场景，比如发奖后把中奖者从榜单拿走。

```plaintext
ZPOPMAX ba:z:board
```

### ZREMRANGEBYSCORE

删除分数在指定区间内的所有成员，语法 `ZREMRANGEBYSCORE key min max`。端点支持 `(` 开区间写法，返回删除的成员数量，常用于延时队列的到期清理。

```plaintext
ZREMRANGEBYSCORE ba:z:board 1 2
```

### ZREMRANGEBYRANK

删除排名在指定下标区间内的所有成员，语法 `ZREMRANGEBYRANK key start stop`。下标从 0 开始，支持负数从尾部倒数；`ZREMRANGEBYRANK key 100 -1` 表示保留排名前 100 的成员、删除其余成员，是控制榜单长度的标准手法。

```plaintext
ZREMRANGEBYRANK ba:z:board 100 -1
```

## 集合运算

### ZUNIONSTORE

计算多个有序集合的并集并把结果存入 destination，语法 `ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]`。第一个参数是参与运算的键数量；`WEIGHTS` 给每个集合配权重，`AGGREGATE` 指定分数聚合方式，默认 `SUM`，返回结果集的成员数量。

```plaintext
ZUNIONSTORE ba:z:total 2 ba:z:week1 ba:z:week2 WEIGHTS 1 2 AGGREGATE SUM
```

## 补充说明

- `ZINTERSTORE` 用法与 `ZUNIONSTORE` 完全一致，只是计算交集；Redis 6.2 起还提供只读的 `ZUNION`/`ZINTER`/`ZDIFF`，不落盘。
- 按字典序取区间的 `ZRANGEBYLEX`、按分数取区间的 `ZRANGEBYSCORE`、反向的 `ZREVRANGE` 自 Redis 6.2 起均建议改用 `ZRANGE` 加 `BYLEX`、`BYSCORE`、`REV` 选项。
- `ZRANGESTORE` 可把区间查询结果直接存入新键，`ZRANDMEMBER` 用于随机取样。

## 小结

分数与排名类命令（`ZSCORE`、`ZRANK`、`ZINCRBY`）支撑排行榜的核心读写，弹出与清理类命令（`ZPOPMIN`/`ZPOPMAX`、`ZREMRANGEBYSCORE`/`ZREMRANGEBYRANK`）支撑延时队列与榜单维护，`ZUNIONSTORE`/`ZINTERSTORE` 负责跨集合的聚合统计。区间读取统一收敛到 `ZRANGE` 是当前推荐写法。
