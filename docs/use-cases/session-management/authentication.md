### Real case: User authentication and session management

This page walks through the Flask login, verification, and logout flow; for the security, expiration, and monitoring checklist see [Best practices for session storage](best-practices.md).

#### Background

In modern Web applications, user authentication and session management are among the core features. Thanks to its high performance and flexibility, Redis is widely used to store and manage user session information. The example below shows how to build a simple user authentication and session management system with Redis.

#### Requirements

1. **User registration and login**: users can register new accounts and log in to existing ones.
2. **Session management**: after a user logs in, the system must manage the session information so that it can be verified when the user accesses the application.
3. **Session expiration**: user sessions need an expiration time, to improve security.

#### Design

1. **User information storage**: use Redis to store user information, such as usernames and password hashes.
2. **Session storage**: use Redis to store session information, including the session ID and the associated user ID.
3. **Session expiration**: set an expiration time on sessions so that they expire automatically after a while.

#### Code example

The following example, written in Python with Flask, demonstrates how to implement user authentication and session management.

##### Install dependencies

First, install the required Python packages:

```bash
pip install flask redis
```

##### Flask application

```python
from flask import Flask, request, jsonify, session
import redis
import hashlib
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)  # used to encrypt session data
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# user registration
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data['username']
    password = data['password']
    
    # hash the password
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    # store the user information in Redis
    redis_client.hset('users', username, password_hash)
    return jsonify({"message": "User registered successfully"}), 201

# user login
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']
    
    # retrieve the stored password hash
    stored_password_hash = redis_client.hget('users', username)
    
    if stored_password_hash and stored_password_hash == hashlib.sha256(password.encode()).hexdigest():
        session_id = os.urandom(24).hex()
        # store the session information in Redis
        redis_client.set(f'session:{session_id}', username, ex=3600)  # session valid for 1 hour
        return jsonify({"session_id": session_id}), 200
    return jsonify({"message": "Invalid credentials"}), 401

# check the session
@app.route('/check_session', methods=['GET'])
def check_session():
    session_id = request.args.get('session_id')
    username = redis_client.get(f'session:{session_id}')
    
    if username:
        return jsonify({"username": username}), 200
    return jsonify({"message": "Invalid session"}), 401

# user logout
@app.route('/logout', methods=['POST'])
def logout():
    session_id = request.json.get('session_id')
    redis_client.delete(f'session:{session_id}')
    return jsonify({"message": "Logged out successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True)
```

#### Key points

1. **User registration**: store the username and password hash in a Redis hash data structure. SHA-256 is used to hash the password before storage.
2. **User login**: authenticate by comparing the password hash entered by the user against the stored hash. After a successful login, generate a unique session ID, store it in Redis, and set an expiration time.
3. **Session management**: use the Redis `SET` command to store session data and set an expiration time. Retrieve the user information by session ID to verify that a session is valid.
4. **Session expiration**: Redis automatically deletes expired session data, ensuring that an expired session can no longer access the system.
5. **User logout**: when a user logs out, delete the corresponding session data from Redis so that the session becomes invalid.

#### Security considerations

- **Password encryption**: make sure passwords are protected by an encryption algorithm both at rest and in transit. When storing passwords, use a slow hashing algorithm with a salt (such as bcrypt, scrypt, or Argon2) rather than a fast hash such as SHA-256.
- **Session ID generation**: use a strong random number to generate session IDs, to prevent session prediction attacks.
- **Session expiration**: set a reasonable session expiration time, to reduce the risk of a session being abused.
- **HTTPS**: use the HTTPS protocol to keep session data safe in transit.

With the design and implementation above, you can use Redis to manage user authentication and sessions efficiently, improving the security and user experience of your Web application.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- AUTH (no authoritative source found; to be verified)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](/use-cases/README.md)
- [session-management](/use-cases/session-management.md)
