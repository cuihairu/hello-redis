# 会话管理

Web 集群下会话不能只存在单台应用服务器的内存里：负载均衡把请求分到另一台机器就会丢失登录态。把会话集中存到 Redis，所有应用实例共享同一份会话数据，再用过期机制自动清理失效会话。

## 这页的视角

Hash 字段设计与滑动续期示例见[会话存储](session-storage.md)；安全、过期和监控清单见[会话存储的最佳实践](session-management/best-practices.md)。

## 深入阅读

- Hash 存储、滑动续期的完整示例见[会话存储](session-storage.md)；
- 过期策略、加密、监控等十条清单见[会话存储的最佳实践](session-management/best-practices.md)；
- Flask 登录注销的完整案例见[实际案例：用户认证与会话管理](session-management/authentication.md)。

## 参考资料

- [Redis 开发文档 · 场景](https://redis.io/docs/latest/develop/use-cases/)

<!-- BACKLINKS-AUTO -->
## 相关页面

- [README](README.md)
