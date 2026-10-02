### 第1部分：基础知识

在这一部分，我们将介绍Redis的基础知识，包括其概念、安装配置以及基本操作。无论你是Redis的新手还是有一定经验的用户，这一部分都将帮助你建立对Redis的基本理解和使用能力。

#### [简介](introduction.md)

在这一节，我们将讨论Redis的基本概念、历史和主要特点，以及Redis的应用场景。

- **[什么是Redis](what-is-redis.md)**：介绍Redis的定义、特点以及它在现代应用中的作用。
- **[Redis的历史与发展](history-and-development.md)**：回顾Redis的发展历程，了解其演变和重要版本。
- **[Redis的特点与应用场景](features-and-use-cases.md)**：探讨Redis的关键特性，并讨论它在不同应用场景中的应用。

#### [安装与配置](installation-and-configuration.md)

这一节将指导你如何在不同操作系统上安装Redis，并进行基本的配置。

- **[在Linux上安装Redis](installation-on-linux.md)**：详细步骤，帮助你在Linux系统中成功安装Redis。
- **[在Windows上安装Redis](installation-on-windows.md)**：说明如何在Windows系统上安装Redis，包括安装步骤和常见问题。
- **[Redis配置文件详解](configuration-file.md)**：解读Redis的配置文件，了解各项配置的作用和设置方法。

#### [Redis基本操作](basic-operations.md)

在这一节，我们将介绍Redis的基本操作，包括数据类型和常用命令的使用。

- **[数据类型与基本命令](data-types-and-commands.md)**：介绍Redis的各种数据类型及其相关命令，包括：
  - **[字符串](string.md)**：包括`SET`、`GET`及其他字符串操作命令。
  - **[哈希](hash.md)**：包括`HSET`、`HGET`及其他哈希操作命令。
  - **[列表](list.md)**：包括`LPUSH`、`RPUSH`、`LPOP`、`RPOP`及其他列表操作命令。
  - **[集合](set.md)**：包括`SADD`、`SPOP`、`SMEMBERS`及其他集合操作命令。
  - **[有序集合](zset.md)**：包括`ZADD`、`ZRANGE`、`ZREM`及其他有序集合操作命令。
  - **[位图](bitmap.md)**：包括`SETBIT`、`GETBIT`及其他位图操作命令。
  - **[地理空间数据](geospatial.md)**：包括`GEOADD`、`GEORADIUS`及其他地理空间数据操作命令。
  - **[HyperLogLog](hyperloglog.md)**：包括`PFADD`、`PFCOUNT`及其他HyperLogLog操作命令。
  - **[流](streams.md)**：包括`XADD`、`XREAD`及其他流操作命令。
- **[连接与认证](connection-and-authentication.md)**：说明如何连接到Redis实例，并进行认证。
- **[键的操作](key-operations.md)**：介绍Redis中对键的各种操作，包括键的创建、修改和删除。

