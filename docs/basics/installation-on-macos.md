# 在 macOS 上安装 Redis

Redis 可以通过 Homebrew 来轻松安装，以下是安装步骤：

## 1. 安装 Homebrew

如果尚未安装 Homebrew，可以通过以下命令安装 Homebrew：

1. 打开终端。
2. 运行以下命令：
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   安装完成后执行 `brew --version` 能打印版本号即表示成功；网络缓慢时可先按 Homebrew 官方文档配置镜像源。

## 2. 使用 Homebrew 安装 Redis

1. **更新 Homebrew**
   - 在终端中运行以下命令以确保 Homebrew 是最新的：
     ```bash
     brew update
     ```

2. **安装 Redis**
   - 运行以下命令以安装 Redis：
     ```bash
     brew install redis
     ```
   - 安装完成后可用 `redis-server --version` 与 `redis-cli --version` 确认版本号。

## 3. 启动 Redis 服务

1. **启动 Redis**
   - 使用 Homebrew 启动 Redis 服务：
     ```bash
     brew services start redis
     ```
   - 这会将 Redis 设置为后台服务，并在系统启动时自动启动 Redis。

2. **手动启动 Redis**
   - 如果你不想将 Redis 设置为后台服务，可以手动启动 Redis 服务器：
     ```bash
     redis-server
     ```
   - 用 `brew services list` 可以随时查看服务状态。

## 4. 验证 Redis 安装

1. **连接到 Redis**
   - 打开新的终端窗口或标签页，使用 Redis CLI 客户端连接到 Redis 服务器：
     ```bash
     redis-cli
     ```

2. **测试基本命令**
   - 在 Redis CLI 中测试基本命令：
     ```bash
     ping
     # 应该返回 PONG
     set testkey "Hello, Redis!"
     get testkey
     # 应该返回 "Hello, Redis!"
     ```
   - `PING` 返回 `PONG`、`GET` 能取回刚写入的值，说明服务正常；执行 `QUIT` 可退出交互模式。

## 5. 配置 Redis

- Redis 的配置文件位置按 CPU 架构区分：Apple Silicon 为 `/opt/homebrew/etc/redis.conf`，Intel 为 `/usr/local/etc/redis.conf`（可用 `brew --prefix` 查看当前前缀）。
- 可以编辑配置文件以调整 Redis 的设置：
  ```bash
  nano /opt/homebrew/etc/redis.conf
  ```

- 修改完成后，重新启动 Redis 使配置生效：
  ```bash
  brew services restart redis
  ```
- 重启后再次执行 `PING` 确认服务恢复；若设置了 `requirepass`，需要先执行 `AUTH 密码` 才能执行其他命令。
- 常用配置项：`bind 127.0.0.1` 仅监听本机、`port 6379` 监听端口、`requirepass` 设置访问密码、`appendonly yes` 开启 AOF 持久化。

## 注意事项

- 使用 Homebrew 安装 Redis 主要用于开发和测试。在生产环境中，建议通过其他方法安装并配置 Redis。
- 连接被拒绝（Connection refused）时先确认服务状态：用 `brew services list` 查看，或前台运行 `redis-server` 看报错输出。
- 如果遇到任何问题，可以参考 Redis 的官方文档或 Homebrew 的相关支持资源。

通过这些步骤，你可以在 macOS 上成功安装和配置 Redis。如果在安装过程中遇到问题，可以先查看 Homebrew 的安装日志和 Redis 的配置文件路径是否与本文一致。