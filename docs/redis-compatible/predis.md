# Predis

Predis 是 PHP 语言最流行的 Redis 客户端库之一（与 `phpredis` 扩展并列）。与 phpredis 的 C 扩展不同，Predis 是纯 PHP 实现，无需编译安装，因此便于在不同环境部署；它对 Redis 的命令支持非常完整，也常被用来测试新版本 Redis 的命令。

## 安装

```bash
composer require predis/predis
```

## 基本用法

```php
<?php
require 'vendor/autoload.php';

$client = new Predis\Client([
    'scheme' => 'tcp',
    'host'   => '127.0.0.1',
    'port'   => 6379,
]);

// 字符串
$client->set('foo', 'bar');
echo $client->get('foo');          // bar

// 哈希
$client->hset('user:1', 'name', 'alice');
print_r($client->hgetall('user:1'));

// 有序集合
$client->zadd('rank', [100 => 'alice', 90 => 'bob']);
print_r($client->zrevrange('rank', 0, -1, 'WITHSCORES'));
```

## 管道与事务

```php
<?php
// 管道：一次性发送多条命令
$replies = $client->pipeline(function ($pipe) {
    $pipe->set('a', 1);
    $pipe->incr('a');
    $pipe->get('a');
});

// 事务：MULTI/EXEC
$tx = $client->multi();
$tx->set('k', 'v')->incr('counter');
$tx->execute();
```

## 连接 Redis 集群与哨兵

```php
<?php
// 集群（客户端分片/集群协议自动处理）
$cluster = new Predis\Client(
    ['tcp://10.0.0.1:6379', 'tcp://10.0.0.2:6379'],
    ['cluster' => 'redis']
);

// 哨兵
$sentinel = new Predis\Client([
    'tcp://10.0.0.10:26379',
    'tcp://10.0.0.11:26379',
], ['replication' => 'sentinel', 'service' => 'mymaster']);
```

## 与 phpredis 的选择

| 维度 | Predis | phpredis |
| --- | --- | --- |
| 安装 | composer 引入即可 | 需编译/安装 PHP 扩展 |
| 性能 | 纯 PHP，略慢 | C 扩展，性能更好 |
| 灵活性 | 支持自定义协议处理器、易于调试 | 固定 |
| 新命令支持 | 跟随版本快，可用任意命令 | 依赖扩展版本 |

已有生产环境且追求极致性能时选 phpredis；快速开发、容器化部署或需要支持新命令时选 Predis。

项目地址：<https://github.com/predis/predis>
