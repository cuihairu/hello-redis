# Chat System

Redis plays two roles in a chat system: Pub/Sub handles real-time message push, and ZSET or List handles history storage. Put together, they form a working chat skeleton.

## Real-time push

Pub/Sub broadcasts a message to all subscribers of a channel; an online consumer receives it. Pub/Sub is fire-and-forget: a message is not saved once sent, an offline consumer never gets it, and reliable delivery is not guaranteed. Online status is maintained with a String or Hash under a key with a TTL, so it is cleaned up automatically on disconnect.

## Message storage

- Conversation messages go into a ZSET in time order, with the score being the timestamp; `ZRANGE` fetches the most recent N and is naturally ordered;
- When you need strict ordering and large volume, use Streams: append one by one, with consumer groups and acknowledgements.

## Related notes

- Storage design for private chat, group chat, and message pagination: see [Storing chat messages](chat-system/message-storage.md);
- Full design for online status and real-time push: see [Real-time chat system](chat-system/real-time-chat.md).

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Pub/Sub](https://redis.io/docs/latest/develop/pubsub/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
