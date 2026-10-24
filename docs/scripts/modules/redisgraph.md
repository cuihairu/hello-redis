# RedisGraph

RedisGraph is a Redis module that provides graph database functionality in Redis. It offers an efficient way to store and query graph data. RedisGraph uses the Cypher query language to operate on graph data, making graph queries and analysis more convenient.

> Note: RedisGraph was officially announced to be entering its end-of-life process in August 2023, the repository moved into maintenance mode, and official support ended on January 31, 2025; subsequent Redis Stack releases no longer include this module. The source code remains available on GitHub. New projects should consider evaluating other graph database solutions; the content below applies to environments still using older versions of RedisGraph.

## Cypher query language overview

Cypher is the query language used by RedisGraph, designed specifically for graph databases. Its syntax is intuitive and similar to SQL, which makes querying and operating on graph data more straightforward. Cypher allows users to define queries in a declarative way, supporting complex graph pattern matching and data analysis operations.

## Basic Cypher query commands

The following are some commonly used Cypher query commands for basic operations in RedisGraph:

- **Creating nodes and relationships**

  ```cypher
  CREATE (n:Person {name: 'John', age: 30})
  RETURN n
  ```

  Creates a node with the `Person` label and sets its `name` and `age` properties.

- **Querying nodes**

  ```cypher
  MATCH (n:Person {name: 'John'})
  RETURN n
  ```

  Finds the node with the `Person` label whose `name` property is `John`.

- **Creating relationships**

  ```cypher
  MATCH (a:Person {name: 'John'}), (b:Person {name: 'Jane'})
  CREATE (a)-[:FRIENDS_WITH]->(b)
  RETURN a, b
  ```

  Creates a `FRIENDS_WITH` relationship between two `Person` nodes.

- **Querying relationships**

  ```cypher
  MATCH (a:Person)-[r:FRIENDS_WITH]->(b:Person)
  RETURN a, b, r
  ```

  Finds all `FRIENDS_WITH` relationships between `Person` nodes and returns the related nodes and relationship information.

Through the Cypher language, RedisGraph can efficiently perform create, query, and modify operations on graph data, supporting complex graph patterns and analysis tasks.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

## Related pages

- [README](README.md)
- [redisjson](redisjson.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [redisjson](redisjson.md)
