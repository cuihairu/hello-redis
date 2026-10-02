# 内存分配和释放机制

## 概述

Redis 没有直接使用 `malloc/free`，而是在 src/zmalloc.c 中封装了一层 `z*` 系列接口。这一层做三件事：把分配器抽象成可替换的实现（jemalloc/libc/tcmalloc）、记录每次分配的真实大小以支撑 `INFO memory` 计量、在释放与诊断时提供精确到字节的能力。理解这层代码是读懂 Redis 内存相关一切问题的起点。

## zmalloc 家族与分配器替换

src/zmalloc.c 提供的核心接口：

- `zmalloc()` / `ztrymalloc()`：申请内存，后者失败时返回 NULL 而不是 abort；
- `zcalloc()`、`zrealloc()`、`ztryrealloc()`：清零分配与扩容；
- `zfree()`、`zfree_usable()`：释放，后者同时返回被释放的大小；
- `zstrdup()`：字符串复制；
- `zmalloc_size()`：返回某块内存的真实可用大小（基于 `malloc_usable_size`）；
- `zmalloc_used_memory()`：返回全局累计的已分配字节数，即 `INFO memory` 的 `used_memory`。

分配器的选择在编译期完成，src/Makefile 中通过 `MALLOC` 变量控制，Linux 下默认 jemalloc，也可以选 libc 或 tcmalloc。以 jemalloc 为例，zmalloc.c 里直接做了符号替换：

```c
#if defined(USE_JEMALLOC)
#define malloc(size) je_malloc(size)
...
#endif
```

因此源码中的 `malloc` 调用在链接时统一进入 jemalloc。这可以用 `redis-server -v` 验证：

```bash
$ redis-server -v
Redis server v=8.0.5 sha=00000000:0 malloc=jemalloc-5.3.0 bits=64 build=9729964261b8fc0f
$ redis-cli -p 6399 info memory | grep mem_allocator
mem_allocator:jemalloc-5.3.0
```

## 计量：zmalloc_size 与 usable size

`used_memory` 之所以精确，是因为 zmalloc.c 对每次分配都记录了大小：

- 在支持 `malloc_usable_size` 的平台上（Linux/glibc、jemalloc 都支持），Redis 直接用 `zmalloc_size(ptr)` 拿到分配器返回的真实容量，不需要额外前缀；
- 计量通过 `update_zmalloc_stat_alloc()` / `update_zmalloc_stat_free()` 累加、递减全局变量，`zmalloc_used_memory()` 只是读这个值。

这种“借用分配器的 usable size”设计意味着 Redis 统计的是分配器实际占用的字节，而不是请求的字节，因此 `used_memory` 与 jemalloc 的 `allocator_allocated` 能对上：

```bash
$ redis-cli -p 6399 info memory | grep -E 'allocator_allocated|allocator_active|allocator_resident'
allocator_allocated:2439744
allocator_active:2711552
allocator_resident:7372800
```

`allocator_active` 与 `allocator_allocated` 的差值来自 jemalloc 的 size class 圆整与 slab 结构开销，`allocator_resident` 则是分配器向操作系统实际申请的页。

## jemalloc 的 size class

jemalloc 按 size class 分级分配（例如 8、16、32、48、80 字节这样的档位），小对象会向上圆整到最近的档位。对 Redis 的直接影响是：**hash、zset、list 等“小而多”的对象一旦超出 listpack 阈值切换到通用结构，内存会因圆整明显放大**。这也是 Redis 7.0 把 ziplist 换成 listpack、并不断调低默认阈值的原因之一。

观测手段是把同一个逻辑数据分别用不同编码存一次，再用 `memory usage` 对比：

```bash
$ redis-cli -p 6399 hset bc:small a 1 b 2
(integer) 2
$ redis-cli -p 6399 object encoding bc:small
listpack
$ redis-cli -p 6399 memory usage bc:small
(integer) 88
```

## 释放路径：同步与惰性

普通释放走 `zfree()`，在调用线程内完成。但当被释放的对象可能很大时，Redis 会改走惰性释放，避免主线程被一次 `free` 卡住：

1. `UNLINK`、`FLUSHDB ASYNC`、`FLUSHALL ASYNC`、`lazyfree-lazy-*` 配置开启后的删除操作，进入 src/lazyfree.c；
2. 经 `freeObjAsync()`、`emptyDbAsync()` 触发后，通过 src/bio.c 的 `bioCreateLazyFreeJob()` 提交到 `BIO_LAZY_FREE` 队列，由 `lazyfreeFreeObject()`、`lazyfreeFreeDatabase()` 等回调执行；
3. 后台线程真正调用 `zfree()` 释放。

`INFO memory` 中的 `lazyfree_pending_objects` 字段反映还有多少对象在等待后台释放（本例实例当前为 0）。另外，Linux + jemalloc 场景下有一个专门的归还机制：fork 出持久化子进程后，子进程会调用 src/server.c 的 `dismissMemoryInChild()`，对自己不再使用的内存（如客户端缓冲区副本）通过 zmalloc.c 的 `zmadvise_dontneed()` 执行 `madvise(MADV_DONTNEED)`，把物理页归还操作系统，缓解写时复制带来的内存放大。

## 释放侧的观测

```bash
$ redis-cli -p 6399 set bc:big $(python3 -c "print('x'*100000)")
OK
$ redis-cli -p 6399 memory usage bc:big
(integer) 114736
$ redis-cli -p 6399 unlink bc:big
(integer) 1
```

`UNLINK` 返回 1 表示键已从键空间摘除；字符串较短时释放会直接同步完成，只有足够大的对象才会进后台队列。

## 小结

Redis 的内存分配机制可以总结为：**编译期选定分配器，运行期用 zmalloc.c 统一计量，用 jemalloc 的 size class 承接所有小对象，用 lazyfree + bio 线程消化大对象释放**。读源码时抓住三个函数即可建立框架：`zmalloc()`（分配与计量）、`zmalloc_size()`（真实占用）、`zfree()`（同步释放）；再配合 `INFO memory` 的 `allocator_*` 字段和 `memory usage` 命令，就能把源码行为与线上指标对应起来。
