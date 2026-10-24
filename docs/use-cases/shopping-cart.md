# Shopping Cart

The data profile of a shopping cart: each user has their own cart, item quantities in the cart change frequently, and reads typically display by item. A hash (Hash) with the field name as the item ID and the field value as the quantity fits this structure exactly.

## Data Structure Design

Key `cart:{user_id}`, fields are item IDs, values are purchase quantities. Item details (name, price) still live in the database; the hash holds only quantities, and details are batch-fetched and merged at read time.

## Command Demo

```bash
# Add item (increment quantity by 1; initialize field to 1 if it doesn't exist)
HINCRBY cart:42 10086 1
HINCRBY cart:42 10086 1          # buy one more, quantity 2

# Add another item
HINCRBY cart:42 10087 3

# View the whole cart
HGETALL cart:42

# View a single item's quantity
HGET cart:42 10086

# Decrease quantity
HINCRBY cart:42 10086 -1

# Remove item
HDEL cart:42 10087

# Clear the cart
DEL cart:42
```

## Python Example

```python
import redis

r = redis.Redis(decode_responses=True)


def add_to_cart(user_id, product_id, qty=1):
    # Quantity can't be negative, and the floor is 0 (remove field when 0)
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
    # In a real project: validate stock, place the order, clear the cart on success
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

## Practical Advice

- **Set an expiration**: give cart keys a longer TTL (e.g. 30 days) to avoid long-term memory usage after a user is lost; but note that carts with items generally shouldn't expire, so you may instead set a short TTL on "empty carts".
- **Merge guest carts**: after a user logs in, read out the temporary pre-login cart (`cart:anon:{uuid}`) with `HGETALL`, merge field-by-field into the user's cart with `HINCRBY`, then delete the temporary key.
- **Batch-fetch details**: after `HMGET` pulls all item quantities in one shot, batch-query item info with a pipeline or `MGET` to avoid N+1 queries.
- **Prevent overselling**: when quantities can be manually edited, the server must still re-validate stock before placing an order; quantities in the hash can't be trusted directly.

## References

- [Redis Developer Docs · Use Cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis Developer Docs · Hashes](https://redis.io/docs/latest/develop/data-types/hashes/)
- HSET (no authoritative source found (to verify))

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](README.md)
- [redis-use-cases](redis-use-cases.md)
