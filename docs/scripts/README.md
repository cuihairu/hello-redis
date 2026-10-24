# Redis Scripting

This is my collected record of Redis scripting practice, covering how Lua scripts and Redis module scripts execute, how to use them, and what scenarios they fit.

## 1. Overview

Redis provides powerful scripting that lets complex operations run on the Redis server, reducing network round trips and improving operational efficiency. These scripting capabilities come in two main flavors: Lua scripts and Redis module scripts.

### Execution capability and use cases

Redis scripting lets you write scripts that run on the server to perform complex data operations. Scripts can do batch operations, complex computation, data transformation, and similar tasks, which can noticeably improve performance and simplify data processing.

### How scripts execute

Redis scripting is built on the Lua language, and all scripts run on the Redis server, guaranteeing atomicity and consistency. The execution model affects both how efficient a script is and how it behaves.

## 2. Lua Scripts

Lua is the scripting language built into Redis. It lets you write and run scripts on the Redis server. Lua scripts can implement all kinds of complex data operations and remain atomic while they execute.

### Lua script overview

Lua scripts give Redis flexible programming power, letting you run complex operations within a single command. The basic concepts and usage of Lua scripts determine whether they fit a given scenario.

### Basic commands

- **[EVAL](lua/eval.md)**: executes a Lua script.
- **[EVALSHA](lua/evalsha.md)**: executes a Lua script identified by its SHA1 checksum.
- **[SCRIPT LOAD](lua/script-load.md)**: loads a Lua script onto the Redis server.
- **[SCRIPT EXISTS](lua/script-exists.md)**: checks whether a script already exists on the Redis server.
- **[SCRIPT FLUSH](lua/script-flush.md)**: flushes all cached scripts from Redis.

### Lua script writing tips

Notes on techniques for Lua script optimization, error handling, and state management.

### Common problems and debugging

Writing Lua scripts can run into all sorts of problems, including execution errors and performance bottlenecks. How you debug and localize issues has a direct effect on script stability.

## 3. Redis Module Scripts

Redis module scripts extend Redis through modules. Different Redis modules offer different scripting capabilities — RedisGraph and RedisJSON, for example.

### RedisGraph

RedisGraph is a module that extends Redis with a graph data model. It uses the Cypher query language to run queries against graph data.

- **[Cypher query language overview](modules/redisgraph/cypher-overview.md)**: concepts and a syntax quick tour of the Cypher query language.
- **[Basic Cypher query commands](modules/redisgraph/cypher-commands.md)**: how to write common Cypher queries in RedisGraph.

### RedisJSON

RedisJSON is a Redis module that supports the JSON data type and its operations. It uses the JSONPath query language to query and modify JSON data.

- **[JSONPath query language overview](modules/redisjson/jsonpath-overview.md)**: concepts and a syntax quick tour of the JSONPath query language.
- **[Basic JSONPath query commands](modules/redisjson/jsonpath-commands.md)**: how to write common JSONPath operations in RedisJSON.

## 4. Script Security and Performance

Security and performance optimization are the areas that deserve the closest attention when using Redis scripting.

### Script security

Notes on script security boundaries, malicious-script defenses, and data protection.

### Performance optimization

Optimizing script performance, including improving execution efficiency, cutting execution time, and tuning the Redis server's performance settings.



## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
