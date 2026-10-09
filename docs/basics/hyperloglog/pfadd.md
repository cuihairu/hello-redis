# PFADD

`PFADD` 用于向 HyperLogLog 结构中添加元素。HyperLogLog 是一种概率型数据结构，只记录「出现过哪些不同元素」这一统计特征，而不保存元素本身，因此可以用约 12KB 的固定内存估算上亿级别数据的基数（唯一元素个数）。

`PFADD` 是 HyperLogLog 的写入入口：键不存在时会自动创建，元素会被哈希后更新内部寄存器。

## 语法

```plaintext
PFADD key [element [element ...]]
```

## 参数说明

- `key`：HyperLogLog 键。虽然底层是字符串类型，但只能通过 HyperLogLog 命令读写。
- `element`：要添加的元素，可以是任意字符串，一次可以添加多个；也可以全部省略。

## 返回值

整数。本次调用至少导致内部寄存器发生了变化（即可能带来了新的唯一元素）返回 1；没有任何变化返回 0。返回值不是「新增了几个元素」，它只能用来判断本次写入是否可能引入了新元素。

## 示例

以下命令可以直接在 `redis-cli` 中执行，注释中为实测返回结果：

```plaintext
# 添加三个元素，键被自动创建
PFADD bb:hll:uv u1 u2 u3
# (integer) 1

# 再次添加已存在的元素，寄存器无变化
PFADD bb:hll:uv u1
# (integer) 0

# 添加新元素
PFADD bb:hll:uv u4
# (integer) 1

# 查看当前的基数估算值
PFCOUNT bb:hll:uv
# (integer) 4

# 不带任何元素调用是合法的，不会改变寄存器
PFADD bb:hll:uv
# (integer) 0
```

对持有普通字符串的键执行 `PFADD` 会报类型错误：

```plaintext
SET bb:hll:str v
# OK
PFADD bb:hll:str a
# (error) WRONGTYPE Key is not a valid HyperLogLog string value.
```

## 注意事项

- HyperLogLog 无法列出、删除或判断单个元素是否存在，只能得到基数估算值；需要精确去重请使用集合（Set）。
- 标准误差约为 0.81%，即一百万的估算结果可能落在约 991900 到 1008100 之间；对大多数 UV 统计场景够用。
- 无论放入多少元素，一个 HyperLogLog 键在稠密表示下固定占用约 12KB（小数据量时 Redis 会采用更省内存的稀疏表示，随元素增多自动升级）。
- 元素内容只以哈希后的统计信息存在，适合统计场景，不适合存业务数据。

## 相关页面

- [PFCOUNT](./pfcount.md)：读取基数估算值。
- [其他HyperLogLog命令](./other-commands.md)：`PFMERGE`。
- 返回专题目录：[Redis HyperLogLog](../hyperloglog.md)。
