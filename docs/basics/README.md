# 基础知识

这里收录我整理的 Redis 概念、安装配置与基本操作记录。

## [简介](introduction.md)

概念、历史、主要特点和常见应用场景的相关记录。

- **[什么是Redis](what-is-redis.md)**：Redis 的定义、特点和常见用途。
- **[Redis的历史与发展](history-and-development.md)**：Redis 的发展历程与重要版本。
- **[Redis的特点与应用场景](features-and-use-cases.md)**：Redis 的关键特性及其在不同场景中的用法。

## [安装与配置](installation-and-configuration.md)

记录在不同操作系统上安装 Redis 和完成基础配置时用到的步骤。

- **[在Linux上安装Redis](installation-on-linux.md)**：Linux 安装步骤与实际操作记录。
- **[在Windows上安装Redis](installation-on-windows.md)**：Windows 安装步骤与遇到的常见问题。
- **[Redis配置文件详解](configuration-file.md)**：Redis 配置项的作用与设置方式。

## [Redis基本操作](basic-operations.md)

数据类型与常用命令按类别整理，具体操作见各页面。

- **数据类型与基本命令**，按类型展开如下：
  - **[字符串](string.md)**：包括`SET`、`GET`及其他字符串操作命令。
  - **[哈希](hash.md)**：包括`HSET`、`HGET`及其他哈希操作命令。
  - **[列表](list.md)**：包括`LPUSH`、`RPUSH`、`LPOP`、`RPOP`及其他列表操作命令。
  - **[集合](set.md)**：包括`SADD`、`SPOP`、`SMEMBERS`及其他集合操作命令。
  - **[有序集合](zset.md)**：包括`ZADD`、`ZRANGE`、`ZREM`及其他有序集合操作命令。
  - **[位图](bitmap.md)**：包括`SETBIT`、`GETBIT`及其他位图操作命令。
  - **[地理空间数据](geospatial.md)**：包括`GEOADD`、`GEOSEARCH`及其他地理空间数据操作命令（`GEORADIUS` 系列 6.2 起已废弃）。
  - **[HyperLogLog](hyperloglog.md)**：包括`PFADD`、`PFCOUNT`及其他HyperLogLog操作命令。
  - **[流](streams.md)**：包括`XADD`、`XREAD`及其他流操作命令。
- **[连接与认证](connection-and-authentication.md)**：连接 Redis 实例与认证相关操作。
- **[键的操作](key-operations.md)**：键的创建、修改、删除及其他常见操作。


## 参考资料

- [Redis 开发文档](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## 相关页面

- [knowledge](/knowledge.md)
