# 会话存储

Web 集群环境下，用户会话不能只存在单台应用服务器的内存里，否则负载均衡把请求分发到另一台机器就会丢失登录态。把会话集中存放在 Redis 中，可以让所有应用实例共享会话数据，并借助 Redis 的过期机制自动清理失效会话。

## 使用哈希保存会话

会话通常包含多个字段（用户 ID、昵称、权限等），使用 Hash 可以只读写字段而不必整存整取：

```bash
# 登录成功后写入会话，并设置 30 分钟过期
HSET session:9f3c1d user_id 42 username alice role user
EXPIRE session:9f3c1d 1800

# 后续请求校验会话
EXISTS session:9f3c1d
HGET session:9f3c1d user_id

# 用户活跃时续期
EXPIRE session:9f3c1d 1800

# 退出登录时删除
DEL session:9f3c1d
```

## Python 示例

```python
import uuid
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)
SESSION_TTL = 1800  # 30 分钟


def login(username, password):
    user_id = check_password(username, password)  # 校验密码，返回用户 ID
    if user_id is None:
        return None
    token = uuid.uuid4().hex
    key = f'session:{token}'
    r.hset(key, mapping={'user_id': user_id, 'username': username})
    r.expire(key, SESSION_TTL)
    return token


def get_session(token):
    key = f'session:{token}'
    if not r.exists(key):
        return None
    r.expire(key, SESSION_TTL)  # 滑动续期
    return r.hgetall(key)


def logout(token):
    r.delete(f'session:{token}')


def check_password(username, password):
    # 实际项目中应查询数据库并比对加盐慢哈希（bcrypt 等）
    if username == 'alice' and password == 'secret':
        return 42
    return None


if __name__ == '__main__':
    token = login('alice', 'secret')
    print(get_session(token))   # {'user_id': '42', 'username': 'alice'}
    logout(token)
    print(get_session(token))   # None
```

## 实践要点

- 会话键用足够长的随机串（如 UUID），用户猜不出别人的键名，也遍历不出全量会话。
- 每个会话键都带 TTL，用户停手 30 分钟就自动失效；活跃请求顺手 `EXPIRE` 一次，把过期时间往后推，就是滑动续期。
- 会话里只放必要字段，密码、支付凭证这类信息留在数据库，出事时影响面才小。
- Redis 默认不持久化，重启后登录态全掉。业务确实要求重启不掉登录态，才去开 RDB 或 AOF。
