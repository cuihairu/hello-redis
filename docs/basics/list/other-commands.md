# 其他列表命令

除了 `LPUSH`、`RPUSH`、`LPOP`、`RPOP` 四个基本操作，列表类型还有范围读取、定位修改、修剪、阻塞弹出等命令。这一页按用途分组列出最常用的 11 条。

## 读取与定位

### LRANGE

获取指定下标范围内的元素，语法 `LRANGE key start stop`。下标从 0 开始，负数表示从尾部倒数，闭区间包含 `stop`，`0 -1` 表示整个列表。分页读取「最近 N 条」就靠它。

```plaintext
RPUSH ba:l:demo a b c d e
LRANGE ba:l:demo 1 3
LRANGE ba:l:demo -2 -1
```

### LLEN

返回列表长度，语法 `LLEN key`，时间复杂度 O(1)，键不存在时返回 0。

```plaintext
LLEN ba:l:demo
```

### LINDEX

返回指定下标的元素，语法 `LINDEX key index`，下标越界时返回 `nil`。列表的随机访问是 O(N) 遍历，需要频繁按下标读取时应考虑改用其他结构。

```plaintext
LINDEX ba:l:demo 0
LINDEX ba:l:demo -1
```

### LPOS

返回元素在列表中匹配到的下标，语法 `LPOS key element [RANK rank] [COUNT num-matches] [MAXLEN len]`（Redis 6.0.6 起支持）。默认返回第一个匹配的下标；`RANK` 为负数时从尾部开始数第 |rank| 个；`COUNT 0` 返回全部匹配位置；找不到返回 `nil`。

```plaintext
LPOS ba:l:demo c
LPOS ba:l:demo c COUNT 0
```

## 修改与修剪

### LSET

修改指定下标元素的值，语法 `LSET key index value`。只能覆盖已存在的位置，下标越界返回 `ERR index out of range`，键不存在返回 `ERR no such key`。

```plaintext
LSET ba:l:demo 0 updated
```

### LTRIM

修剪列表，只保留指定下标范围内的元素，语法 `LTRIM key start stop`。常与 `LPUSH` 搭配实现「只保留最新 N 条」：先 `LPUSH` 再 `LTRIM key 0 99`，两步构成固定长度的最新记录列表。

```plaintext
LTRIM ba:l:demo 0 2
```

### LREM

删除列表中等于指定值的元素，语法 `LREM key count value`。`count` 大于 0 从头部开始删 count 个，小于 0 从尾部开始删 |count| 个，等于 0 删除全部匹配项，返回实际删除数量。

```plaintext
LREM ba:l:demo 0 updated
```

### LINSERT

在指定元素的左侧或右侧插入新元素，语法 `LINSERT key BEFORE|AFTER pivot element`。基准元素 `pivot` 不存在时返回 -1 且不做任何修改，键不存在时返回 0。

```plaintext
LINSERT ba:l:demo BEFORE c insert-before
LINSERT ba:l:demo AFTER c insert-after
```

## 跨列表搬运与阻塞

### LMOVE

从一个列表的一端弹出元素，原子地压入另一个列表的一端，语法 `LMOVE source destination LEFT|RIGHT LEFT|RIGHT`（Redis 6.2 起支持）。两个端点各自可选左或右，是构建安全任务队列的核心命令：弹出即转移，天然记录了「处理中」的任务。旧命令 `RPOPLPUSH` 自 6.2 起标记为废弃但仍可用，功能等价于 `LMOVE source destination RIGHT LEFT`。

```plaintext
LMOVE ba:l:demo ba:l:done RIGHT LEFT
```

### BLPOP

阻塞版本的 `LPOP`，语法 `BLPOP key [key ...] timeout`。所有给定列表都为空时阻塞等待，`timeout` 为 0 表示无限等待，返回值为键名和元素组成的数组。消费者轮询 `LPOP` 的写法都应换成它。

```plaintext
BLPOP ba:l:demo ba:l:done 5
```

### BRPOP

阻塞版本的 `RPOP`，语法 `BRPOP key [key ...] timeout`。行为与 `BLPOP` 一致，只是从尾部弹出；多个键按传入顺序检查。

```plaintext
BRPOP ba:l:demo 5
```

## 小结

范围与定位类命令（`LRANGE`、`LINDEX`、`LPOS`）解决「看清和修改列表内容」的问题，`LSET`/`LTRIM`/`LREM` 负责改写和清理，`LMOVE` 与阻塞命令 `BLPOP`/`BRPOP` 则是构建可靠队列的关键。跨列表搬运统一使用 `LMOVE`，不再新用 `RPOPLPUSH`。
