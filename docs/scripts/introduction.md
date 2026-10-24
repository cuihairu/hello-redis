# Overview

In Redis, scripting is a powerful tool that lets you run complex operations on the server side, improving efficiency and reducing network latency. It comes in two main flavors: Lua scripts and Redis module scripts. What a script can do, how it executes, and where its boundaries lie all determine whether it is the right fit for the problem in front of you.

## Scripting Overview

Redis scripting lets you run custom code on the server side, which is very useful for scenarios that need complex operations or batch processing. Scripts can help you achieve the following:

- **Atomic operations**: scripts run on the Redis server, guaranteeing atomicity and avoiding the problems caused by multiple network round trips.
- **Complex computation**: scripts let you do complex computation and data processing inside Redis, simplifying client-side logic.
- **Batch operations**: scripts can handle many operations at once, improving throughput and reducing the number of interactions with the server.
- **Data transformation**: scripts can be used to transform and process data to meet specific data requirements.

## How Scripts Execute

Redis scripting is built primarily on the Lua language. This design brings several key advantages:

- **Atomicity**: Lua scripts run exclusively on the Redis server, and no other client command is interleaved while a script runs, guaranteeing atomicity.
- **Efficiency**: running scripts on the server reduces network latency by avoiding the overhead of multiple round trips.
- **Flexibility**: Lua supports rich programming features, letting you write complex logic and operations.

Redis supports two main types of scripts:

1. **Lua scripts**: Redis has a built-in Lua engine that lets you write and run scripts in Lua. Lua scripts can be embedded directly in Redis commands, or executed via the `EVAL` and `EVALSHA` commands.
2. **Redis module scripts**: Redis modules let you extend Redis, including defining new data types and operations. Redis module scripts are usually based on a specific module (such as RedisGraph and RedisJSON) and provide module-specific features and query languages.

I have recorded the usage and scenarios for Lua scripts and Redis module scripts on the pages that follow, so they can be looked up by problem.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)

## Related pages

- [appendix](appendix.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [appendix](appendix.md)
