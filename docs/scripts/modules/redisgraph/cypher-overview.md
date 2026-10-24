# Cypher query language overview

Cypher is a declarative graph query language, designed specifically for operating on graph data. Its syntax is intuitive and similar to SQL, which makes querying and operating on data in a graph database simple and easy to understand. Cypher is the primary language for running graph queries in RedisGraph, supporting the creation, querying, updating, and deletion of nodes and relationships in graph data.

## 1. **Basic syntax**

The basic constructs of the Cypher query language include nodes, relationships, and properties. The following are some basic elements of a Cypher query:

- **Nodes**: represented with round parentheses `()`, nodes can have labels and properties. For example, `(n:Person {name: 'John', age: 30})` represents a node with the `Person` label and `name` and `age` properties.
- **Relationships**: represented with square brackets `[]`, relationships can have types and properties. For example, `[:FRIENDS_WITH {since: 2021}]` represents a relationship of type `FRIENDS_WITH` with a `since` property.
- **Graph patterns**: matching combinations of nodes and relationships through pattern matching queries. For example, `(a)-[:FRIENDS_WITH]->(b)` represents a node `a` pointing to a node `b` through a `FRIENDS_WITH` relationship.

## 2. **Basic query commands**

- **Creating a node**: use the `CREATE` statement to create a new node. For example:

  ```cypher
  CREATE (n:Person {name: 'Alice', age: 28})
  RETURN n
  ```

  This statement creates a node with the `Person` label, with properties `name: 'Alice'` and `age: 28`, and returns the created node.

- **Querying a node**: use the `MATCH` statement to find nodes that match certain conditions. For example:

  ```cypher
  MATCH (n:Person {name: 'Alice'})
  RETURN n
  ```

  This statement finds all nodes with the `Person` label whose `name` property is `'Alice'`, and returns those nodes.

- **Creating a relationship**: use the `CREATE` statement to create a relationship between nodes. For example:

  ```cypher
  MATCH (a:Person {name: 'Alice'}), (b:Person {name: 'Bob'})
  CREATE (a)-[:FRIENDS_WITH {since: 2022}]->(b)
  RETURN a, b
  ```

  This statement creates a `FRIENDS_WITH` relationship between the two nodes `a` and `b`, and adds a `since` property to that relationship.

- **Querying a relationship**: use the `MATCH` statement to find relationships between nodes. For example:

  ```cypher
  MATCH (a:Person)-[r:FRIENDS_WITH]->(b:Person)
  RETURN a, b, r
  ```

  This statement finds all `FRIENDS_WITH` relationships between `Person` nodes and returns those nodes along with their relationship.

## 3. **Advanced features**

- **Pattern matching**: supports complex pattern matching queries, for example:

  ```cypher
  MATCH (a:Person)-[:FRIENDS_WITH]->(b:Person)-[:WORKS_WITH]->(c:Person)
  RETURN a, b, c
  ```

  This statement finds all `Person` nodes connected through `FRIENDS_WITH` and `WORKS_WITH` relationships and returns those nodes.

- **Aggregation functions**: supports aggregation queries, for example counting the number of nodes:

  ```cypher
  MATCH (n:Person)
  RETURN count(n)
  ```

  This statement counts the number of all nodes with the `Person` label.

Through these features, the Cypher language lets users perform complex queries and data operations in a graph database in a simple yet powerful way, suitable for a wide range of graph data processing tasks.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/scripts/README.md)
