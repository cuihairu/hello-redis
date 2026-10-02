# 在MacOS上安装Redis

#### 概述

macOS 上安装 Redis 最常见的方式是 Homebrew：一条命令完成安装，一条命令把它注册为系统服务。本文覆盖从安装 Homebrew、安装 Redis、启动服务到验证与修改配置的完整流程。

#### 1. 安装 Homebrew

如果尚未安装 Homebrew，打开终端执行：

```plaintext
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

安装完成后执行 `brew --version` 能打印版本号即表示成功；网络缓慢时可先按 Homebrew 官方文档配置镜像源。

#### 2. 安装 Redis

更新包索引后安装：

```plaintext
brew update
brew install redis
```

安装完成后可用 `redis-server --version` 与 `redis-cli --version` 确认版本号。

#### 3. 启动服务

推荐注册为后台服务，开机自动启动：

```plaintext
brew services start redis
```

临时调试可以前台运行 `redis-server`（关闭终端窗口后进程即结束）；用 `brew services list` 可以随时查看服务状态。

#### 4. 验证安装

另开一个终端连接本机 Redis 并做读写测试：

```plaintext
redis-cli
```

进入交互模式后依次执行，注释中为实际返回值：

```plaintext
PING
# PONG
SET bb:demo:hello "Hello, Redis!"
# OK
GET bb:demo:hello
# "Hello, Redis!"
```

`PING` 返回 `PONG`、`GET` 能取回刚写入的值，说明服务正常；执行 `QUIT` 可退出交互模式。

#### 5. 配置文件位置

配置文件路径按 CPU 架构区分：

- **Apple Silicon（M1/M2/M3/M4）**：`/opt/homebrew/etc/redis.conf`
- **Intel**：`/usr/local/etc/redis.conf`

执行 `brew --prefix` 可得到当前架构的前缀（Apple Silicon 为 `/opt/homebrew`，Intel 为 `/usr/local`），与上面路径拼接即可定位配置文件。常用配置项：`bind 127.0.0.1` 仅监听本机、`port 6379` 监听端口、`requirepass` 设置访问密码、`appendonly yes` 开启 AOF 持久化。

#### 6. 修改配置后重启

```plaintext
brew services restart redis
```

重启后再次执行 `PING` 确认服务恢复；若设置了 `requirepass`，需要先执行 `AUTH 密码` 才能执行其他命令。

#### 常见问题

- **连接被拒绝**：服务未启动，用 `brew services list` 确认状态，或前台运行 `redis-server` 查看报错输出。
- **生产环境**：Homebrew 方式适合本地开发与测试，生产环境建议在 Linux 上通过官方包或 Docker 部署，并配置持久化与访问密码。
