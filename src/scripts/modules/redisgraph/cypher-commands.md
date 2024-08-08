### 基本 Cypher 查询命令

Cypher 查询语言提供了一系列基本命令，用于操作图数据。这些命令涵盖了创建、查询、更新和删除图数据的基本功能。以下是一些常用的基本 Cypher 查询命令及其示例。

#### 1. **创建节点**

创建节点的命令用于在图中插入新节点。节点可以具有标签和属性。

**示例：**

```cypher
CREATE (n:Person {name: 'Alice', age: 28})
RETURN n
```

这条命令创建了一个带有 `Person` 标签的节点，属性为 `name: 'Alice'` 和 `age: 28`，并返回创建的节点。

#### 2. **查询节点**

查询节点的命令用于检索符合特定条件的节点。可以使用 `MATCH` 语句来匹配节点并返回结果。

**示例：**

```cypher
MATCH (n:Person {name: 'Alice'})
RETURN n
```

这条命令查找所有标签为 `Person` 且属性 `name` 为 `'Alice'` 的节点，并返回这些节点。

#### 3. **创建关系**

创建关系的命令用于在两个节点之间插入新关系。关系可以具有类型和属性。

**示例：**

```cypher
MATCH (a:Person {name: 'Alice'}), (b:Person {name: 'Bob'})
CREATE (a)-[:FRIENDS_WITH {since: 2022}]->(b)
RETURN a, b
```

这条命令在两个节点 `a` 和 `b` 之间创建一个 `FRIENDS_WITH` 关系，并给这个关系添加一个 `since` 属性。

#### 4. **查询关系**

查询关系的命令用于检索符合特定条件的关系。可以使用 `MATCH` 语句来匹配关系并返回结果。

**示例：**

```cypher
MATCH (a:Person)-[r:FRIENDS_WITH]->(b:Person)
RETURN a, b, r
```

这条命令查找所有 `Person` 节点之间通过 `FRIENDS_WITH` 关系连接的节点，并返回这些节点及其关系。

#### 5. **更新节点**

更新节点的命令用于修改节点的属性。

**示例：**

```cypher
MATCH (n:Person {name: 'Alice'})
SET n.age = 30
RETURN n
```

这条命令将标签为 `Person` 且属性 `name` 为 `'Alice'` 的节点的 `age` 属性更新为 `30`，并返回更新后的节点。

#### 6. **删除节点**

删除节点的命令用于从图中删除节点。删除节点时，如果该节点与其他节点有关系，也需要处理这些关系。

**示例：**

```cypher
MATCH (n:Person {name: 'Alice'})
DETACH DELETE n
```

这条命令删除标签为 `Person` 且属性 `name` 为 `'Alice'` 的节点，并同时删除与该节点关联的所有关系。

#### 7. **删除关系**

删除关系的命令用于从图中删除两个节点之间的关系。

**示例：**

```cypher
MATCH (a:Person {name: 'Alice'})-[r:FRIENDS_WITH]->(b:Person {name: 'Bob'})
DELETE r
```

这条命令删除 `Alice` 和 `Bob` 之间的 `FRIENDS_WITH` 关系。

#### 8. **返回结果**

返回结果的命令用于检索查询的结果并展示。

**示例：**

```cypher
MATCH (n:Person)
RETURN n.name, n.age
```

这条命令返回所有 `Person` 节点的 `name` 和 `age` 属性。

这些基本 Cypher 查询命令使用户能够高效地操作图数据库中的数据，通过简洁的语法完成复杂的查询和数据管理任务。