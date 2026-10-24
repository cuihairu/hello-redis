# Real-world case: real-time chat application

When building a real-time chat application, Redis can serve as the core component for message storage, message push, user session management, and real-time data processing. The following are detailed steps for building a real-time chat application with Redis, including design and implementation.

#### 1. System architecture

1. **Message storage**: use Redis `LIST` or `STREAM` data structures to store chat history.
2. **Message push**: use the Redis `PUB/SUB` feature to push new messages to clients in real time.
3. **User session management**: use Redis `SET` or `HASH` data structures to manage online user sessions.
4. **Message query**: support querying and loading historical messages.

#### 2. Message storage

Use the Redis `STREAM` data structure to store real-time messages, because it supports message persistence, consumer groups, and efficient message processing.

**Implementation**:
- **Send a message**: append the message to the `STREAM`.
- **Receive messages**: read new messages from the `STREAM`.

```python
import redis

# Connect to Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Send a message
def send_message(chat_id, sender_id, message):
    redis_client.xadd(f"chat:{chat_id}", {
        'sender_id': sender_id,
        'message': message
    }, id='*')

# Receive messages
def receive_messages(chat_id, last_id='0'):
    return redis_client.xread({f"chat:{chat_id}": last_id}, count=10)
```

#### 3. Message push

Use the Redis `PUB/SUB` feature to implement real-time message push. Clients can subscribe to the corresponding channel to receive messages. Note that `PUB/SUB` is a fire-and-forget broadcast: a message is not saved once sent, an offline subscriber never gets it, and reliable delivery is not guaranteed. Messages missed while a consumer is disconnected must be backfilled from the Streams history.

**Implementation**:
- **Publish a message**: publish the message to a specific channel.
- **Subscribe to messages**: the client subscribes to the channel to receive real-time message pushes.

```python
# Publish a message
def publish_message(channel, message):
    redis_client.publish(channel, message)

# Subscribe to messages
def subscribe_messages(channel):
    pubsub = redis_client.pubsub()
    pubsub.subscribe(channel)
    for message in pubsub.listen():
        if message['type'] == 'message':
            print(message['data'])
```

#### 4. User session management

Use Redis `SET` or `HASH` data structures to manage online user session information.

**Implementation**:
- **Set user status**: store the user's session information in Redis.
- **Get user status**: query the user's session information.

```python
# Set a user session
def set_user_session(user_id, session_info):
    redis_client.hset(f"user_session:{user_id}", mapping=session_info)

# Get a user session
def get_user_session(user_id):
    return redis_client.hgetall(f"user_session:{user_id}")
```

#### 5. Message query and history

For querying chat history, you can use the Redis `LIST` data structure to store and query historical messages.

**Implementation**:
- **Store chat history**: append the message to the `LIST`.
- **Query historical messages**: read messages within a specified range from the `LIST`.

```python
# Store chat history
def store_chat_history(chat_id, message):
    redis_client.rpush(f"history:{chat_id}", message)

# Query historical messages
def get_chat_history(chat_id, start=0, end=-1):
    return redis_client.lrange(f"history:{chat_id}", start, end)
```

#### 6. Real-time chat application example

The following is a simple real-time chat application example, which covers sending, receiving, and real-time push of messages.

**Example code**:

```python
import redis
import time
import threading

# Connect to Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Send a message
def send_message(chat_id, sender_id, message):
    redis_client.xadd(f"chat:{chat_id}", {'sender_id': sender_id, 'message': message})
    publish_message(f"chat_updates:{chat_id}", f"{sender_id}: {message}")

# Receive messages
def receive_messages(chat_id, last_id='$'):
    return redis_client.xread({f"chat:{chat_id}": last_id}, count=10)

# Publish a message
def publish_message(channel, message):
    redis_client.publish(channel, message)

# Subscribe to messages
def subscribe_messages(channel):
    pubsub = redis_client.pubsub()
    pubsub.subscribe(channel)
    for message in pubsub.listen():
        if message['type'] == 'message':
            print(f"Received message from channel {channel}: {message['data']}")

# Real-time chat thread
def chat_thread(chat_id):
    while True:
        new_messages = receive_messages(chat_id)
        for message in new_messages:
            print(f"New message in chat {chat_id}: {message}")
        time.sleep(1)

# Example: send and receive messages
chat_id = "general_chat"
send_message(chat_id, "user1", "Hello, world!")

# Start the chat thread
threading.Thread(target=chat_thread, args=(chat_id,)).start()

# Subscribe to real-time message updates
subscribe_messages(f"chat_updates:{chat_id}")
```

### Summary

By combining the Redis `STREAM`, `PUB/SUB`, `HASH`, and `LIST` data structures and features, you can build an efficient real-time chat application. Message storage, real-time push, user session management, and historical message query can all be implemented through different Redis features, meeting the requirements of high concurrency and real-time behavior.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Pub/Sub](https://redis.io/docs/latest/develop/pubsub/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](/use-cases/README.md)
- [chat-system](/use-cases/chat-system.md)
