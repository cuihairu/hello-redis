# PFCOUNT

#### 概述

`PFCOUNT` 用于返回一个或多个 HyperLogLog 键的基数估算值，即"出现过多少个不同的元素"。单个键返回该键自己的估算值；传入多个键时返回它们合并后的估算值（相当于先做并集再计数），且不会创建或修改任何键。

#### 语法与参数

```plaintext
PFCOUNT key [key ...]
```

- **`key`**：一个或多个 HyperLogLog 键。不存在的键按空 HyperLogLog 处理，基数为 0。

**返回值**：基数估算值（整数）。

#### 示例

以下命令可以直接在 `redis-cli` 中执行，注释中为实测返回结果：

```plaintext
# 先写入一些数据
PFADD bb:hll:uv u1 u2 u3
# (integer) 1
PFADD bb:hll:uv u1
# (integer) 0

# 单键：返回去重后的估算值，重复的 u1 只算一次
PFCOUNT bb:hll:uv
# (integer) 3

# 不存在的键返回 0
PFCOUNT bb:hll:missing
# (integer) 0

# 多键：返回并集的估算值
PFADD bb:hll:uv2 u1 u5 u6
# (integer) 1
PFCOUNT bb:hll:uv bb:hll:uv2
# (integer) 5
```

多键版本会自动处理不同键之间的重复元素：上面的结果 5 是 `{u1, u2, u3, u5, u6}` 的基数，`u1` 在两个键中都出现，但只被统计一次。把同一个键写多次也不影响结果：

```plaintext
PFCOUNT bb:hll:uv bb:hll:uv bb:hll:uv2
# (integer) 5
```

#### 注意事项

- **估算值，不是精确值**：标准误差约 0.81%，且对同一数据多次调用 `PFCOUNT` 得到的是同一个缓存结果，不会波动。
- **单键读取是只读的**：`PFCOUNT key` 只影响客户端，不修改键的内部数据，可以放心在只读副本上执行。
- **多键读取有副作用**：官方文档明确指出，多键的 `PFCOUNT` 执行过程中可能会修改这些 HyperLogLog 的内部表示（缓存中间计算结果、必要时转换编码），因此多键版本不能视为只读命令，也不宜在只读副本上执行。
- **内存开销固定**：一个 HyperLogLog 在稠密表示下固定占用约 12KB，估算的元素越多，这一"性价比"越高；统计几十个元素反而不如直接用集合。
- **语义对比**：多键 `PFCOUNT` 与 `PFMERGE` 到一个临时键再 `PFCOUNT` 的结果一致，但前者不落盘、开销更小。

#### 相关页面

- [PFADD](./pfadd.md)：向 HyperLogLog 添加元素。
- [其他HyperLogLog命令](./other-commands.md)：`PFMERGE`。
- 返回专题目录：[Redis HyperLogLog](../hyperloglog.md)。
