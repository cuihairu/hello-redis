### Redis 模块脚本

Redis 模块脚本允许开发者使用 Lua 脚本与 Redis 模块进行交互，扩展 Redis 的功能。Redis 模块提供了一些附加功能和数据结构，可以通过 Lua 脚本进行操作。

#### RedisGraph

RedisGraph 是一个 Redis 模块，用于图数据库功能。它允许用户在 Redis 中存储和查询图数据。

- **Cypher 查询语言概述**  
  Cypher 是 RedisGraph 的查询语言，用于图数据的查询和操作。Cypher 语言设计直观，类似于 SQL，但针对图数据进行了优化。

- **基本 Cypher 查询命令**  
  介绍 RedisGraph 中常用的 Cypher 查询命令，包括图的创建、节点和关系的查询等操作。

#### RedisJSON

RedisJSON 是一个 Redis 模块，用于在 Redis 中处理 JSON 数据。它允许用户以 JSON 格式存储、查询和修改数据。

- **JSONPath 查询语言概述**  
  JSONPath 是 RedisJSON 使用的查询语言，用于在 JSON 数据中进行复杂的查询和操作。JSONPath 语言类似于 XPath，但针对 JSON 数据进行了设计。

- **基本 JSONPath 查询命令**  
  介绍 RedisJSON 中的常用 JSONPath 查询命令，包括 JSON 数据的创建、查询、修改等操作。