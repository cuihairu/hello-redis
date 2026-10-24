# Predis

Predis is one of the most popular Redis client libraries for PHP (alongside the `phpredis` extension). Unlike phpredis, which is a C extension, Predis is a pure PHP implementation that needs no compilation or installation, which makes it easy to deploy across different environments; its command support for Redis is very complete, and it is often used to test commands in newer Redis versions.

## Installation

```bash
composer require predis/predis
```

## Basic usage

```php
<?php
require 'vendor/autoload.php';

$client = new Predis\Client([
    'scheme' => 'tcp',
    'host'   => '127.0.0.1',
    'port'   => 6379,
]);

// strings
$client->set('foo', 'bar');
echo $client->get('foo');          // bar

// hashes
$client->hset('user:1', 'name', 'alice');
print_r($client->hgetall('user:1'));

// sorted sets
$client->zadd('rank', [100 => 'alice', 90 => 'bob']);
print_r($client->zrevrange('rank', 0, -1, 'WITHSCORES'));
```

## Pipelines and transactions

```php
<?php
// pipeline: send multiple commands at once
$replies = $client->pipeline(function ($pipe) {
    $pipe->set('a', 1);
    $pipe->incr('a');
    $pipe->get('a');
});

// transaction: MULTI/EXEC
$tx = $client->multi();
$tx->set('k', 'v')->incr('counter');
$tx->execute();
```

## Connecting to a Redis cluster and Sentinel

```php
<?php
// cluster (client-side sharding / cluster protocol is handled automatically)
$cluster = new Predis\Client(
    ['tcp://10.0.0.1:6379', 'tcp://10.0.0.2:6379'],
    ['cluster' => 'redis']
);

// Sentinel
$sentinel = new Predis\Client([
    'tcp://10.0.0.10:26379',
    'tcp://10.0.0.11:26379',
], ['replication' => 'sentinel', 'service' => 'mymaster']);
```

## Choosing between Predis and phpredis

| Dimension | Predis | phpredis |
| --- | --- | --- |
| Installation | Just require it via composer | Requires compiling / installing a PHP extension |
| Performance | Pure PHP, slightly slower | C extension, better performance |
| Flexibility | Supports custom protocol handlers, easy to debug | Fixed |
| Support for new commands | Tracks versions quickly, any command can be used | Depends on the extension version |

Choose phpredis if you already have a production environment and need peak performance; choose Predis for rapid development, containerized deployment, or when you need support for new commands.

Project URL: <https://github.com/predis/predis>

## References

- Redis official site (no authoritative source found; to be verified)
- [Predis client](https://github.com/predis/predis)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
