# 其他HyperLogLog命令

HyperLogLog 相关命令一共只有三个：`PFADD` 负责写入，`PFCOUNT` 负责读取基数估算值，剩下的 `PFMERGE` 负责把多个 HyperLogLog 合并为一个。三个命令的动词前缀 `PF` 来自 HyperLogLog 的发明人 Philippe Flajolet 名字的缩写。

## PFMERGE

把一个或多个源 HyperLogLog 合并到目标键中，语法 `PFMERGE destkey sourcekey [sourcekey ...]`，时间复杂度 O(N)，N 是参与合并的键的数量，返回状态回复 `OK`。合并后的键等价于「所有源元素放到一起」的 HyperLogLog。目标键不存在时会自动创建；目标键可以与某个源键相同，此时相当于把其余源键并入它；合并结果与逐个 `PFADD` 的先后顺序无关。

## 示例

以下命令可以直接在 `redis-cli` 中执行，注释中为实测返回结果：

```plaintext
# 准备两个 HyperLogLog，u1 在两个键中都出现
PFADD bb:hll:uv u1 u2 u3
# (integer) 1
PFADD bb:hll:uv2 u1 u5 u6
# (integer) 1

# 合并到一个新键
PFMERGE bb:hll:merged bb:hll:uv bb:hll:uv2
# OK

# 合并后的基数等于并集的基数，重复的 u1 只算一次
PFCOUNT bb:hll:merged
# (integer) 5

# 合并结果与数据在哪个键中无关，也可以只合并一个源键
PFMERGE bb:hll:copy bb:hll:uv
# OK
PFCOUNT bb:hll:copy
# (integer) 3
```

## 与多键 PFCOUNT 的取舍

- 只是想看「合计有多少不同元素」时，直接使用多键的 `PFCOUNT key1 key2` 更简单，结果与 `PFMERGE` 后再计数一致，且不产生新的键。
- 合并结果需要反复读取、或者想把它固化下来（例如按天统计后合并出月度数据）时，使用 `PFMERGE` 落成一个正式的键更合适。
- `PFMERGE` 是写命令，多键 `PFCOUNT` 则更接近读命令（仅存在少量内部缓存副作用），在主从读写分离的场景下要注意区分。

## 小结

HyperLogLog 命令集非常小而专注：`PFADD` 写、`PFCOUNT` 读、`PFMERGE` 合并。配合「约 12KB 固定内存、约 0.81% 标准误差」的特性，它适合日活统计、搜索词去重、事件独立访客数等只需要「数一数有多少个不同值」的场景。

## 相关页面

- [PFADD](./pfadd.md)：向 HyperLogLog 添加元素。
- [PFCOUNT](./pfcount.md)：读取基数估算值。
- 返回专题目录：[Redis HyperLogLog](../hyperloglog.md)。
