# 任务队列

耗时任务（发邮件、图片转码、报表生成）不应卡在用户请求里：把任务写入队列立即返回，后台 Worker 取出执行。

## 这页的视角

本文关注任务投递语义、Worker 故障处理和死信管理。List 与 Stream 队列的命令、消费确认和能力边界见[消息队列](message-queues.md)；延迟任务的设计与实现见[异步任务与延迟队列](task-queue/async-tasks.md)。

## 设计要点

- 明确业务幂等边界与允许的重复执行次数；
- 为处理失败定义重试上限、退避方式和转人工条件；
- 记录任务耗时与失败原因，超过上限进入死信，避免毒任务无限重试。

## 深入阅读

- 投递语义、重试与死信队列的完整设计见[任务队列设计](task-queue/design.md)；
- 异步任务、延迟任务的实现见[异步任务与延迟队列](task-queue/async-tasks.md)；
- 与 Kafka、RabbitMQ 的对比见[消息队列](message-queues.md)。

## 参考资料

- [Redis 开发文档 · 场景](https://redis.io/docs/latest/develop/use-cases/)
- [Redis 开发文档 · Lists](https://redis.io/docs/latest/develop/data-types/lists/)

<!-- BACKLINKS-AUTO -->
## 相关页面

- [README](README.md)
- [message-queues](message-queues.md)
