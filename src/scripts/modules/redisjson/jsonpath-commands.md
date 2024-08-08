### 基本 JSONPath 查询命令

JSONPath 提供了一些基本的查询命令，可以用来提取和操作 JSON 数据。以下是常见的 JSONPath 查询命令及其用法：

#### 1. **选择根节点**

- **命令：** `$`
- **说明：** 选择整个 JSON 数据。
- **示例：**

  ```json
  $
  ```

  选择整个 JSON 数据结构。

#### 2. **选择对象属性**

- **命令：** `.<property>`
- **说明：** 选择 JSON 对象中的指定属性。
- **示例：**

  ```json
  $.store
  ```

  选择 JSON 数据中的 `store` 属性。

#### 3. **选择数组元素**

- **命令：** `[n]`
- **说明：** 选择数组中的第 `n` 个元素（索引从 0 开始）。
- **示例：**

  ```json
  $.store.book[0]
  ```

  选择 `book` 数组中的第一个元素。

#### 4. **选择数组中的多个元素**

- **命令：** `[start:end]`
- **说明：** 选择数组中从 `start` 到 `end` 的元素（不包括 `end` 索引）。
- **示例：**

  ```json
  $.store.book[0:2]
  ```

  选择 `book` 数组中的前两个元素（索引 0 和 1）。

#### 5. **选择数组中的所有元素**

- **命令：** `[*]`
- **说明：** 选择数组中的所有元素。
- **示例：**

  ```json
  $.store.book[*]
  ```

  选择 `book` 数组中的所有元素。

#### 6. **过滤数组元素**

- **命令：** `[?(@.property operator value)]`
- **说明：** 根据指定条件过滤数组中的元素。`@` 表示当前元素。
- **示例：**

  ```json
  $.store.book[?(@.price < 10)]
  ```

  选择价格小于 10 的书籍。

#### 7. **选择所有子元素**

- **命令：** `..`
- **说明：** 深度递归地选择所有匹配的元素。
- **示例：**

  ```json
  $..author
  ```

  查找 JSON 数据中所有 `author` 属性。

#### 8. **选择特定属性**

- **命令：** `@`
- **说明：** 表示当前元素，通常用于过滤器中。
- **示例：**

  ```json
  $.store.book[?(@.category == 'fiction')]
  ```

  选择 `category` 为 `'fiction'` 的书籍。

#### 9. **选择所有属性**

- **命令：** `$..*`
- **说明：** 选择 JSON 数据中所有属性和值。
- **示例：**

  ```json
  $..*
  ```

  选择所有属性和值。

#### 10. **选择指定属性**

- **命令：** `[<property1>, <property2>, ...]`
- **说明：** 选择 JSON 数据中指定的多个属性。
- **示例：**

  ```json
  $.store.book[*]['title', 'author']
  ```

  选择 `book` 数组中每个元素的 `title` 和 `author` 属性。

### 示例 JSON 数据

以下是一个示例 JSON 数据，用于演示 JSONPath 查询命令：

```json
{
  "store": {
    "book": [
      { "category": "fiction", "author": "J.K. Rowling", "title": "Harry Potter", "price": 15.99 },
      { "category": "science", "author": "Stephen Hawking", "title": "A Brief History of Time", "price": 12.99 },
      { "category": "fiction", "author": "George R.R. Martin", "title": "Game of Thrones", "price": 25.99 }
    ],
    "bicycle": { "color": "red", "price": 19.95 }
  }
}
```

### JSONPath 查询示例

- **选择所有书籍的标题：**

  ```json
  $.store.book[*].title
  ```

- **选择价格小于 20 的所有物品：**

  ```json
  $.store.*[?(@.price < 20)]
  ```

- **选择所有作者的名称：**

  ```json
  $.store.book[*].author
  ```

- **选择 `book` 数组中的第二本书的 `title`：**

  ```json
  $.store.book[1].title
  ```

JSONPath 的基本查询命令提供了多种方式来访问和操作 JSON 数据，使得处理复杂 JSON 数据结构变得更加高效。