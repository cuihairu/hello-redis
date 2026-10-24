# Basic Cypher query commands

The Cypher query language provides a set of basic commands for operating on graph data. These commands cover the basic functions of creating, querying, updating, and deleting graph data. The following are some commonly used basic Cypher query commands and their examples.

## 1. **Creating a node**

The command for creating a node inserts a new node into the graph. A node can have labels and properties.

**Example:**

```cypher
CREATE (n:Person {name: 'Alice', age: 28})
RETURN n
```

This command creates a node with the `Person` label, with properties `name: 'Alice'` and `age: 28`, and returns the created node.

## 2. **Querying a node**

The command for querying a node retrieves nodes that match specific conditions. You can use the `MATCH` statement to match nodes and return the results.

**Example:**

```cypher
MATCH (n:Person {name: 'Alice'})
RETURN n
```

This command finds all nodes with the `Person` label whose `name` property is `'Alice'`, and returns those nodes.

## 3. **Creating a relationship**

The command for creating a relationship inserts a new relationship between two nodes. A relationship can have a type and properties.

**Example:**

```cypher
MATCH (a:Person {name: 'Alice'}), (b:Person {name: 'Bob'})
CREATE (a)-[:FRIENDS_WITH {since: 2022}]->(b)
RETURN a, b
```

This command creates a `FRIENDS_WITH` relationship between the two nodes `a` and `b`, and adds a `since` property to that relationship.

## 4. **Querying a relationship**

The command for querying a relationship retrieves relationships that match specific conditions. You can use the `MATCH` statement to match relationships and return the results.

**Example:**

```cypher
MATCH (a:Person)-[r:FRIENDS_WITH]->(b:Person)
RETURN a, b, r
```

This command finds all `Person` nodes connected through a `FRIENDS_WITH` relationship and returns those nodes along with their relationship.

## 5. **Updating a node**

The command for updating a node modifies a node's properties.

**Example:**

```cypher
MATCH (n:Person {name: 'Alice'})
SET n.age = 30
RETURN n
```

This command updates the `age` property of the node with the `Person` label whose `name` property is `'Alice'` to `30`, and returns the updated node.

## 6. **Deleting a node**

The command for deleting a node removes a node from the graph. When deleting a node, if that node has relationships with other nodes, those relationships must also be handled.

**Example:**

```cypher
MATCH (n:Person {name: 'Alice'})
DETACH DELETE n
```

This command deletes the node with the `Person` label whose `name` property is `'Alice'`, and simultaneously deletes all relationships associated with that node.

## 7. **Deleting a relationship**

The command for deleting a relationship removes the relationship between two nodes from the graph.

**Example:**

```cypher
MATCH (a:Person {name: 'Alice'})-[r:FRIENDS_WITH]->(b:Person {name: 'Bob'})
DELETE r
```

This command deletes the `FRIENDS_WITH` relationship between `Alice` and `Bob`.

## 8. **Returning results**

The command for returning results retrieves the results of a query and displays them.

**Example:**

```cypher
MATCH (n:Person)
RETURN n.name, n.age
```

This command returns the `name` and `age` properties of all `Person` nodes.

These basic Cypher query commands let users operate on data in a graph database efficiently, completing complex query and data management tasks with concise syntax.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/scripts/README.md)
