# 商品筛选

电商筛选页通常有多个条件：类目、品牌、价格区间、属性等。如果把每个条件命中的商品 ID 都预先放进一个集合，多条件筛选就变成了集合的交、并、差运算，全部在 Redis 内完成，无需回数据库扫描。

## 数据结构设计

每个条件对应一个集合，键名包含维度与取值：

- `filter:category:phone` — 手机类目
- `filter:brand:apple` — 苹果品牌
- `filter:price:0-1000` — 价格 0~1000 元
- `filter:tag:new` — 新品

## 命令演示

```bash
# 预计算：条件 -> 商品集合
SADD filter:category:phone 1001 1002 1003
SADD filter:brand:apple 1002 1004
SADD filter:price:0-1000 1001 1004 1005

# 必选条件：类目=手机 且 品牌=苹果
SINTER filter:category:phone filter:brand:apple        # {1002}

# 排除条件：类目=手机 但 不要品牌苹果
SDIFF filter:category:phone filter:brand:apple         # {1001, 1003}

# 可选放宽：品牌=苹果 或 价格<1000
SUNION filter:brand:apple filter:price:0-1000          # {1001, 1002, 1004, 1005}

# 只需要数量时用 SINTERCARD（不返回成员，Redis 7.0+），分页展示时配合 LIMIT
SINTERCARD 2 filter:category:phone filter:brand:apple LIMIT 100
```

## Python 示例

```python
import redis

r = redis.Redis(decode_responses=True)


def build_index(dim, value, product_ids):
    key = f'filter:{dim}:{value}'
    if product_ids:
        r.sadd(key, *product_ids)


def query(required=None, excluded=None, any_of=None, limit=50):
    required = required or []
    excluded = excluded or []
    any_of = any_of or []
    if any_of and len(any_of) > 1:
        # 多个任选条件先合并成临时集合
        r.sunionstore('filter:tmp:any', [f'filter:{k}' for k in any_of])
        base = ['filter:tmp:any']
    else:
        base = [f'filter:{k}' for k in any_of]
    keys = [f'filter:{k}' for k in required] + base
    if len(keys) > 1:
        r.sinterstore('filter:tmp:result', keys)
        result = 'filter:tmp:result'
    elif keys:
        result = keys[0]
    else:
        return []
    for k in excluded:
        r.sdiffstore('filter:tmp:result', [result, f'filter:{k}'])
        result = 'filter:tmp:result'
    page = r.sscan(result, count=limit)[1] if limit else r.smembers(result)
    r.delete('filter:tmp:result', 'filter:tmp:any')
    return page


if __name__ == '__main__':
    build_index('category', 'phone', ['1001', '1002', '1003'])
    build_index('brand', 'apple', ['1002', '1004'])
    print(sorted(query(required=['category:phone', 'brand:apple'])))   # ['1002']
    print(sorted(query(required=['category:phone'], excluded=['brand:apple'])))  # ['1001', '1003']
```

## 实践建议

- **索引要异步维护**：商品上下架、改价时通过消息队列更新集合，避免写路径变慢。
- **结果需要排序时**：把集合换成有序集合（分数存销量/价格），用 `ZINTERSTORE`/`ZUNIONSTORE` 求交并集后再 `ZINTER` 排序，注意聚合后的分数语义（`AGGREGATE MAX/MIN/SUM`）。
- **临时集合要及时删除**：`SINTERSTORE` 等会生成临时键，用完 `DEL`，或在集群模式下使用 `STORE` 前注意所有输入键需在同一分片。
- **维度过多时**：不要为每个组合都建集合，只对高频条件建索引，长尾组合回源查询。
