# Task queue

Long-running tasks (sending email, transcoding images, generating reports) should not block a user request: write the task to a queue and return immediately, and have a background worker pick it up and run it.

## What this page covers

This page focuses on task delivery semantics, worker failure handling, and dead letter management. For the commands, consumer acknowledgement, and capability limits of List and Stream queues see [Message queues](message-queues.md); for the design and implementation of delayed tasks see [Async tasks and delayed queues](task-queue/async-tasks.md).

## Design points

- Define the business idempotency boundary and how many duplicate executions are acceptable;
- Define a retry limit, a backoff scheme, and the condition for escalating to a human for failed processing;
- Record how long each task takes and why it failed; once the retry limit is exceeded the task goes to a dead letter, so a poison task does not retry forever.

## Related notes

- For the complete design of delivery semantics, retries, and dead letter queues see [Task queue design](task-queue/design.md);
- For the implementation of async and delayed tasks see [Async tasks and delayed queues](task-queue/async-tasks.md);
- For a comparison with Kafka and RabbitMQ see [Message queues](message-queues.md).

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Lists](https://redis.io/docs/latest/develop/data-types/lists/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [message-queues](message-queues.md)
