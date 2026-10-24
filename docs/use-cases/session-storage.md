# Session storage

This page shows the commands and Python examples for storing session fields in a hash, setting an expiration time, and renewing a session.

For the overall trade-offs in a multi-instance setup, see [Session management](session-management.md); this page focuses on hash access and the renewal examples.

## Storing sessions with a hash

A session usually has several fields (user ID, nickname, role, and so on), and a hash lets you read or write a field without storing or retrieving the whole value at once:

```bash
# Write the session after a successful login and set a 30-minute expiry
HSET session:9f3c1d user_id 42 username alice role user
EXPIRE session:9f3c1d 1800

# Verify the session on subsequent requests
EXISTS session:9f3c1d
HGET session:9f3c1d user_id

# Renew the session while the user is active
EXPIRE session:9f3c1d 1800

# Delete the session on logout
DEL session:9f3c1d
```

## Python example

```python
import uuid
import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)
SESSION_TTL = 1800  # 30 minutes


def login(username, password):
    user_id = check_password(username, password)  # Check the password and return the user ID
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
    r.expire(key, SESSION_TTL)  # Sliding renewal
    return r.hgetall(key)


def logout(token):
    r.delete(f'session:{token}')


def check_password(username, password):
    # In a real project, query the database and compare against a salted slow hash (bcrypt, etc.)
    if username == 'alice' and password == 'secret':
        return 42
    return None


if __name__ == '__main__':
    token = login('alice', 'secret')
    print(get_session(token))   # {'user_id': '42', 'username': 'alice'}
    logout(token)
    print(get_session(token))   # None
```

## Practical notes

- Use a random string that is long enough for the session key (such as a UUID), so users cannot guess other people's keys, and cannot scan out the full set of sessions.
- Give every session key a TTL, so a session expires automatically if the user goes idle for 30 minutes; firing `EXPIRE` once on an active request pushes the expiry forward, which is a sliding renewal.
- Keep only the necessary fields in a session, and leave things like passwords and payment credentials in the database, so the blast radius stays small if something goes wrong.
- Redis does not persist by default, so all login state is lost on restart. Enable RDB or AOF only if the workload genuinely requires sessions to survive a restart.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- SETEX (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](README.md)
- [redis-use-cases](redis-use-cases.md)
- [session-management](session-management.md)
