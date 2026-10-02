# 购物车

购物车的数据特征是：每个用户一个独立的购物车，车内的商品数量会频繁增减，读取时通常按商品维度展示。哈希（Hash）的字段名放商品 ID、字段值放数量，正好匹配这一结构。

## 数据结构设计

键 `cart:{用户ID}`，字段为商品 ID，值为购买数量；商品详情（名称、价格）仍存在数据库中，哈希里只保存数量，读取时批量取详情后合并。

## 命令演示

```bash
# 添加商品（数量加 1，字段不存在时初始化为 1）
HINCRBY cart:42 10086 1
HINCRBY cart:42 10086 1          # 再买一件，数量 2

# 添加另一个商品
HINCRBY cart:42 10087 3

# 查看整个购物车
HGETALL cart:42

# 查看单个商品数量
HGET cart:42 10086

# 减少数量
HINCRBY cart:42 10086 -1

# 删除商品
HDEL cart:42 10087

# 清空购物车
DEL cart:42
```

## Python 示例

```python
import redis

r = redis.Redis(decode_responses=True)


def add_to_cart(user_id, product_id, qty=1):
    # 数量不能为负，且下限为 0（为 0 时移除字段）
    new_qty = r.hincrby(f'cart:{user_id}', product_id, qty)
    if new_qty <= 0:
        r.hdel(f'cart:{user_id}', product_id)
        return 0
    return new_qty


def set_qty(user_id, product_id, qty):
    if qty <= 0:
        r.hdel(f'cart:{user_id}', product_id)
        return 0
    r.hset(f'cart:{user_id}', product_id, qty)
    return qty


def get_cart(user_id):
    raw = r.hgetall(f'cart:{user_id}')
    return {pid: int(qty) for pid, qty in raw.items()}


def checkout(user_id):
    cart = get_cart(user_id)
    if not cart:
        return None
    # 真实项目中：校验库存、下单、成功后清空购物车
    r.delete(f'cart:{user_id}')
    return cart


if __name__ == '__main__':
    add_to_cart(42, 10086, 1)
    add_to_cart(42, 10086, 1)
    add_to_cart(42, 10087, 3)
    print(get_cart(42))       # {'10086': 2, '10087': 3}
    print(checkout(42))       # {'10086': 2, '10087': 3}
    print(get_cart(42))       # {}
```

## 实践建议

- **设置过期时间**：给购物车键设置较长的 TTL（如 30 天），避免用户流失后键长期占用内存；但注意有商品的购物车一般不希望过期，可改为对"空购物车"设置短 TTL。
- **合并游客购物车**：用户登录后，把未登录时的临时购物车（`cart:anon:{uuid}`）用 `HGETALL` 读出、逐字段 `HINCRBY` 合并到用户购物车，再删除临时键。
- **批量取详情**：`HMGET` 一次取出全部商品数量后，用管道或 `MGET` 批量查询商品信息，避免 N+1 查询。
- **防超卖**：数量允许手动改写时，下单前仍需在服务端重新校验库存，哈希里的数量不能直接信任。
