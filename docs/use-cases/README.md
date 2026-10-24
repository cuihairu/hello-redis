
## Redis Use Cases

These pages collect implementation notes for Redis across different project scenarios, covering common problems, concrete cases, and the practical trade-offs involved.

### [Redis Use Cases](README.md)
- [Use case overview](redis-use-cases.md)
- [Caching](cache.md)
    - [Cache-Aside and the three cache problems](caching.md)
    - [Cache strategies and practices](cache/strategies.md)
    - [Real case: Web app caching](cache/web-app.md)
- [Session management](session-management.md)
    - [Session storage](session-storage.md)
    - [Best practices for session storage](session-management/best-practices.md)
    - [Real case: User authentication and session management](session-management/authentication.md)
- [Real-time analytics](real-time-analysis.md)
    - [UV statistics and hot counters](real-time-analytics.md)
    - [Real-time data processing](real-time-analysis/data-processing.md)
    - [Real case: Real-time data dashboard](real-time-analysis/dashboard.md)
- [Task queue](task-queue.md)
    - [Message queues: List and Stream](message-queues.md)
    - [Task queue design and implementation](task-queue/design.md)
    - [Real case: Async task processing](task-queue/async-tasks.md)
- [Leaderboards and counters](ranking-and-counting.md)
    - [Leaderboard implementation](leaderboards.md)
    - [Counters](counters.md)
    - [Global IDs](global-id.md)
    - [Leaderboard implementation methods](ranking-and-counting/ranking.md)
- [Chat systems](chat-system.md)
    - [Chat message storage and processing](chat-system/message-storage.md)
    - [Real case: Real-time chat application](chat-system/real-time-chat.md)
- [Geolocation services](geolocation-services.md)
    - [Geospatial indexing](geospatial-indexing.md)
    - [Real case: Location-based services](geolocation-services/location-based.md)
- [Distributed locks](distributed-locks.md)
    - [Distributed lock implementation methods](distributed-locks/implementation.md)
    - [Real case: Locks in distributed systems](distributed-locks/distributed-systems.md)
- [Rate limiting](rate-limiting.md)
    - [Rate limiting strategies and implementation](rate-limiting/strategies.md)
    - [Real case: API rate limiting](rate-limiting/api.md)
- [Likes](likes.md)
- [Lottery](lottery.md)
- [Shopping cart](shopping-cart.md)
- [Product tags](product-tags.md)
- [Product filtering](product-filtering.md)
- [Check-ins](check-ins.md)
- [Clock-ins](clock-ins.md)
- [Bitmap statistics](bitmap-operations.md)
- [User follow and friend relationships](user-follow-recommendation-relationships.md)
- [User message timelines](user-message-timeline.md)

These pages record how Redis is used in each scenario, along with the issues and performance trade-offs I paid attention to during implementation.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](README.md)
