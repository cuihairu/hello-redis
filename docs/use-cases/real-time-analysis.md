# Real-time analysis

Real-time dashboards, traffic statistics, and active-user counts all share one trait: data keeps flowing in and metrics keep refreshing. Redis's in-memory compute lets a single update to such a metric complete in microseconds.

## The perspective of this page

This page follows the processing path from continuous writes through metric refresh, with a focus on Streams taking on events and consumers aggregating asynchronously. For common commands and data-structure examples covering PV, UV, leaderboards, and the like, see [Real-time analysis notes](real-time-analytics.md).

## Related entries

- The full Streams + ZSET data processing path is in [Real-time data processing](real-time-analysis/data-processing.md);
- Metric aggregation and dashboard design are in [Real-time dashboard](real-time-analysis/dashboard.md).

## References

- [Redis development docs · Use cases](https://redis.io/docs/latest/develop/use-cases/)
- [Redis development docs · Streams](https://redis.io/docs/latest/develop/data-types/streams/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
