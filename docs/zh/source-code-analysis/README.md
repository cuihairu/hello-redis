# 源码分析章节总览

## 概述

这组笔记沿 Redis 7.x/8.x 源码追踪核心实现。Redis 是高性能内存键值数据库，许多设计取舍都能在代码组织中找到线索。记录覆盖数据结构、命令处理、持久化和内存管理，供我在使用、调优或定制 Redis 时回查。

本章的所有内容均基于 Redis 源码进行分析，涉及的主要源文件路径如 `src/server.c`、`src/networking.c`、`src/ae.c`、`src/dict.c`、`src/sds.c`、`src/rdb.c`、`src/aof.c`、`src/zmalloc.c`、`src/t_zset.c`、`src/listpack.c`、`src/quicklist.c`、`src/object.c` 等。

## 核心主题

目前整理了 10 个主题：

**1. 架构（Architecture）**
- Redis 的整体设计思想与核心组件
- 单线程命令执行模型与事件驱动机制
- 网络层与核心服务器循环的协作方式

**2. 命令处理（Command Processing）**
- 命令的解析、查找、校验与执行流程
- RESP（REdis Serialization Protocol）协议的实现
- 命令表与命令属性的管理

**3. 数据结构（Data Structures）**
- Redis 对象（robj）系统的设计与作用
- 字符串、哈希、列表、集合、有序集合等类型的底层实现
- 高效内存设计（SDS、dict、listpack、quicklist、skiplist、intset 等）

**4. 持久化（Persistence）**
- RDB 快照的生成、保存与加载机制
- AOF（Append-Only File）的追加、重写与恢复过程
- RDB-AOF 混合持久化等特性

**5. 内存管理（Memory Management）**
- Redis 内存分配器（zmalloc）的实现
- `maxmemory` 限制与内存淘汰策略
- 内存统计、碎片整理与优化手段

**6. 多线程（Multi-threading）**
- 命令执行仍是单线程的设计原则
- I/O 线程对网络读写的并行化
- 后台线程（bio threads）处理持久化、异步释放等任务

**7. 网络协议（Network Protocol）**
- RESP2 与 RESP3 协议格式及其差异
- 客户端请求的解析与响应的序列化
- 协议协商（`HELLO` 命令）的实现细节

**8. 模块（Modules）**
- Redis 模块系统的扩展机制
- 模块命令的注册与生命周期管理
- 与核心 API 的交互方式

**9. 集群（Cluster）**
- Redis Cluster 的拓扑结构与分片机制
- 哈希槽（hash slot）的分配与重分片
- 故障检测、选主与数据迁移的基本实现思路

**10. 性能（Performance）**
- Redis 高性能的设计取舍
- 事件循环、系统调用与延迟优化
- 性能监控指标与调优方向

## 页面组织

页面按主题拆分：

- **顶层文件**（如 `architecture.md`、`command-processing.md` 等）：以章节简介和若干编号小节的形式概述该主题，便于快速了解整体脉络。
- **子目录文件**（如 `architecture/overview.md`、`command-processing/parsing.md` 等）：深入到具体流程和实现要点，结合源文件路径和关键函数说明底层细节。

我通常先从各主题的顶层页面定位问题，再查对应的细分实现。页面采用相近的结构，尽量保留源码路径、关键函数和可复现的观察结果。

## 参考资料

- [Redis 源码仓库](https://github.com/redis/redis)

<!-- BACKLINKS-AUTO -->
## 相关页面

- [knowledge](/zh/knowledge.md)
