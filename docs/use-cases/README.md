
## Redis Use Cases

These pages collect implementation notes for Redis across different project scenarios, covering common problems, concrete cases, and the practical trade-offs involved.

### [Redis Use Cases](README.md)
- &#8203;Use case overview<!-- EN-LINK: redis-use-cases.md -->
- [Caching](cache.md)
    - [Cache-Aside and the three cache problems](caching.md)
    - [Cache strategies and practices](cache/strategies.md)
    - [Real case: Web app caching](cache/web-app.md)
- &#8203;Session management<!-- EN-LINK: session-management.md -->
    - &#8203;Session storage<!-- EN-LINK: session-storage.md -->
    - &#8203;Best practices for session storage<!-- EN-LINK: session-management/best-practices.md -->
    - &#8203;Real case: User authentication and session management<!-- EN-LINK: session-management/authentication.md -->
- &#8203;Real-time analytics<!-- EN-LINK: real-time-analysis.md -->
    - &#8203;UV statistics and hot counters<!-- EN-LINK: real-time-analytics.md -->
    - &#8203;Real-time data processing<!-- EN-LINK: real-time-analysis/data-processing.md -->
    - &#8203;Real case: Real-time data dashboard<!-- EN-LINK: real-time-analysis/dashboard.md -->
- &#8203;Task queue<!-- EN-LINK: task-queue.md -->
    - &#8203;Message queues: List and Stream<!-- EN-LINK: message-queues.md -->
    - &#8203;Task queue design and implementation<!-- EN-LINK: task-queue/design.md -->
    - &#8203;Real case: Async task processing<!-- EN-LINK: task-queue/async-tasks.md -->
- &#8203;Leaderboards and counters<!-- EN-LINK: ranking-and-counting.md -->
    - &#8203;Leaderboard implementation<!-- EN-LINK: leaderboards.md -->
    - &#8203;Counters<!-- EN-LINK: counters.md -->
    - &#8203;Global IDs<!-- EN-LINK: global-id.md -->
    - &#8203;Leaderboard implementation methods<!-- EN-LINK: ranking-and-counting/ranking.md -->
- &#8203;Chat systems<!-- EN-LINK: chat-system.md -->
    - &#8203;Chat message storage and processing<!-- EN-LINK: chat-system/message-storage.md -->
    - &#8203;Real case: Real-time chat application<!-- EN-LINK: chat-system/real-time-chat.md -->
- &#8203;Geolocation services<!-- EN-LINK: geolocation-services.md -->
    - &#8203;Geospatial indexing<!-- EN-LINK: geospatial-indexing.md -->
    - &#8203;Real case: Location-based services<!-- EN-LINK: geolocation-services/location-based.md -->
- &#8203;Distributed locks<!-- EN-LINK: distributed-locks.md -->
    - &#8203;Distributed lock implementation methods<!-- EN-LINK: distributed-locks/implementation.md -->
    - &#8203;Real case: Locks in distributed systems<!-- EN-LINK: distributed-locks/distributed-systems.md -->
- &#8203;Rate limiting<!-- EN-LINK: rate-limiting.md -->
    - &#8203;Rate limiting strategies and implementation<!-- EN-LINK: rate-limiting/strategies.md -->
    - &#8203;Real case: API rate limiting<!-- EN-LINK: rate-limiting/api.md -->
- &#8203;Likes<!-- EN-LINK: likes.md -->
- &#8203;Lottery<!-- EN-LINK: lottery.md -->
- &#8203;Shopping cart<!-- EN-LINK: shopping-cart.md -->
- &#8203;Product tags<!-- EN-LINK: product-tags.md -->
- &#8203;Product filtering<!-- EN-LINK: product-filtering.md -->
- &#8203;Check-ins<!-- EN-LINK: check-ins.md -->
- &#8203;Clock-ins<!-- EN-LINK: clock-ins.md -->
- &#8203;Bitmap statistics<!-- EN-LINK: bitmap-operations.md -->
- &#8203;User follow and friend relationships<!-- EN-LINK: user-follow-recommendation-relationships.md -->
- &#8203;User message timelines<!-- EN-LINK: user-message-timeline.md -->

These pages record how Redis is used in each scenario, along with the issues and performance trade-offs I paid attention to during implementation.

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [knowledge](/knowledge.md)
- [README](README.md)
