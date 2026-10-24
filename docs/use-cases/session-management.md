# Session management

In a Web cluster, sessions must not live only in the memory of a single app server: when the load balancer routes a request to another machine, the login state is lost. Storing sessions centrally in Redis lets every app instance share the same session data, and an expiration mechanism automatically cleans up stale sessions.

## What this page covers

See [Session storage](session-storage.md) for the hash field design and the sliding-renewal example; see [Best practices for session storage](session-management/best-practices.md) for the security, expiration, and monitoring checklist.

## Related notes

- Full examples of hash storage and sliding renewal: see [Session storage](session-storage.md);
- A ten-item checklist covering expiration policy, encryption, monitoring, and more: see [Best practices for session storage](session-management/best-practices.md);
- The complete Flask login/logout walkthrough: see [Real case: User authentication and session management](session-management/authentication.md).

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
