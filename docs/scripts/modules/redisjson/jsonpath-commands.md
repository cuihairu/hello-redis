# Basic JSONPath Query Commands

JSONPath provides a set of basic query commands that can be used to extract and manipulate JSON data. Here are the common JSONPath query commands and their usage:

## 1. **Select the Root Node**

- **Command:** `$`
- **Description:** selects the entire JSON data.
- **Example:**

  ```json
  $
  ```

  Selects the entire JSON data structure.

## 2. **Select an Object Property**

- **Command:** `.<property>`
- **Description:** selects a specified property within a JSON object.
- **Example:**

  ```json
  $.store
  ```

  Selects the `store` property in the JSON data.

## 3. **Select an Array Element**

- **Command:** `[n]`
- **Description:** selects the `n`-th element in an array (indices start at 0).
- **Example:**

  ```json
  $.store.book[0]
  ```

  Selects the first element in the `book` array.

## 4. **Select Multiple Array Elements**

- **Command:** `[start:end]`
- **Description:** selects elements from `start` to `end` in an array (the `end` index is not included).
- **Example:**

  ```json
  $.store.book[0:2]
  ```

  Selects the first two elements in the `book` array (indices 0 and 1).

## 5. **Select All Array Elements**

- **Command:** `[*]`
- **Description:** selects all elements in an array.
- **Example:**

  ```json
  $.store.book[*]
  ```

  Selects all elements in the `book` array.

## 6. **Filter Array Elements**

- **Command:** `[?(@.property operator value)]`
- **Description:** filters elements in an array based on specified conditions. `@` represents the current element.
- **Example:**

  ```json
  $.store.book[?(@.price < 10)]
  ```

  Selects books priced below 10.

## 7. **Select All Child Elements**

- **Command:** `..`
- **Description:** recursively select all matching elements deep within the data.
- **Example:**

  ```json
  $..author
  ```

  Finds all `author` properties in the JSON data.

## 8. **Select a Specific Property**

- **Command:** `@`
- **Description:** represents the current element, typically used in filters.
- **Example:**

  ```json
  $.store.book[?(@.category == 'fiction')]
  ```

  Selects books whose `category` is `'fiction'`.

## 9. **Select All Properties**

- **Command:** `$..*`
- **Description:** selects all properties and values in the JSON data.
- **Example:**

  ```json
  $..*
  ```

  Selects all properties and values.

## 10. **Select Specified Properties**

- **Command:** `[<property1>, <property2>, ...]`
- **Description:** selects multiple specified properties in the JSON data.
- **Example:**

  ```json
  $.store.book[*]['title', 'author']
  ```

  Selects the `title` and `author` properties of each element in the `book` array.

## Sample JSON Data

The following is a sample JSON document used to demonstrate JSONPath query commands:

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

## JSONPath Query Examples

- **Select the titles of all books:**

  ```json
  $.store.book[*].title
  ```

- **Select all items priced below 20:**

  ```json
  $.store.*[?(@.price < 20)]
  ```

- **Select the names of all authors:**

  ```json
  $.store.book[*].author
  ```

- **Select the `title` of the second book in the `book` array:**

  ```json
  $.store.book[1].title
  ```

The basic JSONPath query commands provide many ways to access and manipulate JSON data, making it more efficient to work with complex JSON data structures.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](/scripts/README.md)
