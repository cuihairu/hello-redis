# 商品标签

商品与标签之间是多对多关系：一个商品可以有多个标签，一个标签也对应多个商品。集合（Set）天然支持交、并、差运算，适合存储标签关系。

## 数据结构设计

- `tags:product:{商品ID}`：该商品的所有标签；
- `tag:{标签名}:products`：打了该标签的所有商品 ID。

## 命令演示

```bash
# 给商品 1001、1002 打标签
SADD tags:product:1001 新品 热销 数码
SADD tags:product:1002 新品 家居

# 反向索引：标签 -> 商品
SADD tag:新品:products 1001 1002
SADD tag:热销:products 1001

# 查询某商品的全部标签
SMEMBERS tags:product:1001

# 同时带有"新品"和"热销"标签的商品（交集）
SINTER tag:新品:products tag:热销:products

# 带"新品"但不带"热销"的商品（差集）
SDIFF tag:新品:products tag:热销:products

# 带"新品"或"热销"任一标签的商品（并集）
SUNION tag:新品:products tag:热销:products
```

## Python 示例

```python
import redis

r = redis.Redis(decode_responses=True)


def add_tags(product_id, tags):
    pipe = r.pipeline()
    pipe.sadd(f'tags:product:{product_id}', *tags)
    for tag in tags:
        pipe.sadd(f'tag:{tag}:products', product_id)
    pipe.execute()   # 管道一次性提交，减少往返


def products_with_all(tags):
    keys = [f'tag:{t}:products' for t in tags]
    return r.sinter(*keys)


def products_without(tag):
    # 查出该标签商品在全库的差集场景时，需要一个全量商品集合做基准
    return r.smembers(f'tag:{tag}:products')


def remove_tags(product_id, tags):
    pipe = r.pipeline()
    pipe.srem(f'tags:product:{product_id}', *tags)
    for tag in tags:
        pipe.srem(f'tag:{tag}:products', product_id)
    pipe.execute()


if __name__ == '__main__':
    add_tags(1001, ['新品', '热销', '数码'])
    add_tags(1002, ['新品', '家居'])
    print(sorted(r.smembers('tags:product:1001')))          # ['新品', '数码', '热销']
    print(sorted(products_with_all(['新品', '热销'])))       # ['1001']
    remove_tags(1001, ['热销'])
    print(sorted(products_with_all(['新品', '热销'])))       # []
```

## 使用建议

- **两个方向的键都要维护**：正向（商品→标签）用于展示，反向（标签→商品）用于筛选；打标、删标时用管道同时更新。
- **标签数量大时**：单个标签的商品集合可能很大，可以用 `SSCAN` 分页遍历，或按热度把标签分库/分片存储。
- **需要按销量等排序**：把反向索引从 Set 换成 Sorted Set（分数存销量），交集运算改用 `ZINTERSTORE`。
