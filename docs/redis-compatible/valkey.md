# Valkey

Valkey 是 2024 年 3 月从 Redis 7.2.4 分叉出来的开源内存数据库项目，由 Linux 基金会托管，AWS、Google Cloud、Oracle、Ericsson 等公司参与维护。分叉的直接原因是 Redis 在 7.4 版本将许可证从 BSD 改为 RSALv2/SSPL 双许可，Valkey 则保持了 BSD-3 许可。

## 主要特点

- **协议兼容**：兼容 Redis 的 RESP2/RESP3 协议，大多数 Redis 客户端可以不加修改地连接 Valkey。
- **继承 Redis 7.x 能力**：Functions、Multi-Part AOF、Sharded Pub/Sub、ACL 等 7.x 特性全部可用。
- **性能增强**： Valkey 8 在 I/O 线程模型上做了优化（默认开启增强的异步 I/O 线程），官方基准显示吞吐明显提升。
- **许可友好**：BSD-3 许可，对云厂商与商业分发没有 SSPL 的限制。

## 快速上手

```bash
# 从源码编译（依赖 gcc、make）
git clone https://github.com/valkey-io/valkey.git
cd valkey && make

# 启动服务（用法与 redis-server 一致）
./valkey-server --port 6380

# 连接
./valkey-cli -p 6380
127.0.0.1:6380> SET hello world
127.0.0.1:6380> GET hello
```

也可以使用 Docker：

```bash
docker run -d --name valkey -p 6379:6379 valkey/valkey:latest
```

## 与 Redis 客户端的配合

现有客户端（redis-py、go-redis、Lettuce、node-redis 等）通常可以直接连接：

```python
import redis

r = redis.Redis(host='localhost', port=6380)
r.set('k', 'v')
print(r.get('k'))
```

部分客户端提供了独立的 Valkey 客户端实现（如 valkey-glide、valkey-py），可按需选用。

## 适用场景与注意点

- **希望使用 BSD 许可的内存数据库**：Valkey 是直接替代方案，迁移成本低（导出 RDB/AOF 后即可加载）。
- **多核吞吐优化**：Valkey 8+ 的 I/O 线程在高并发场景收益明显。
- **注意版本差异**：Valkey 8 引入了一些新命令与配置（如 `dual-channel-replication`），与 Redis 最新版本并不完全同步；生产切换前应做兼容性验证。
- **生态工具**：redis-cli、redis_exporter 等工具大多可兼容使用，部分新特性需使用 valkey 自带的 valkey-cli。
