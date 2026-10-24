# Redis Configuration File Explained

Redis's configuration file is typically named `redis.conf`. It contains all configuration options for the Redis server. The default location of this file may vary depending on the installation method; it is commonly found at `/etc/redis/redis.conf`, `/usr/local/etc/redis.conf`, or within the installation directory. Below are some important options in the configuration file and their explanations:

## 1. **Global Configuration**

- **`daemonize`**
  ```plaintext
  daemonize no
  ```
  - When set to `yes`, Redis runs as a daemon (background process).
  - When set to `no`, Redis runs in the foreground, suitable for development and debugging.

- **`pidfile`**
  ```plaintext
  pidfile /var/run/redis/redis-server.pid
  ```
  - Specifies the file path where the Redis process ID is stored.

- **`logfile`**
  ```plaintext
  logfile "/var/log/redis/redis-server.log"
  ```
  - Specifies the log file path. Setting it to an empty string `""` outputs logs to standard output.

- **`databases`**
  ```plaintext
  databases 16
  ```
  - Sets the number of Redis databases. The default is 16 databases (numbered 0 to 15).

## 2. **Network Configuration**

- **`bind`**
  ```plaintext
  bind 127.0.0.1
  ```
  - Specifies the IP address that Redis listens on. By default, Redis binds only to the local loopback address `127.0.0.1`, with no external exposure.

- **`port`**
  ```plaintext
  port 6379
  ```
  - Specifies the port that Redis listens on; the default is 6379.

- **`protected-mode`**
  ```plaintext
  protected-mode yes
  ```
  - Enables protected mode. If Redis is configured as publicly accessible and not secured, protected mode prevents unauthorized access.

## 3. **Persistence Configuration**

- **`save`**
  ```plaintext
  save 900 1
  save 300 10
  save 60 10000
  ```
  - Configures the save policy for RDB snapshots. The above configuration means:
    - Save a snapshot if at least 1 key-value pair has changed within 900 seconds.
    - Save a snapshot if at least 10 key-value pairs have changed within 300 seconds.
    - Save a snapshot if at least 10000 key-value pairs have changed within 60 seconds.

- **`appendonly`**
  ```plaintext
  appendonly no
  ```
  - Enables AOF log persistence. Set to `yes` to enable AOF (Append Only File); `no` disables it.

- **`appendfsync`**
  ```plaintext
  appendfsync everysec
  ```
  - Configures the sync policy for AOF logs. `everysec` syncs once per second, `always` syncs on every write, and `no` does not force synchronization.

## 4. **Memory Management**

- **`maxmemory`**
  ```plaintext
  maxmemory 0
  ```
  - Sets the maximum memory Redis can use. `0` means no memory limit. You can set a specific value (such as `2gb`) to cap Redis's memory usage.

- **`maxmemory-policy`**
  ```plaintext
  maxmemory-policy noeviction
  ```
  - Configures the eviction policy when memory usage reaches the `maxmemory` limit. Common policies include `volatile-lru` (LRU eviction on keys with expiration times set), `allkeys-lru` (LRU eviction on all keys), and `noeviction` (no eviction; returns an error directly).

## 5. **Security Configuration**

- **`requirepass`**
  ```plaintext
  requirepass foobarbaz
  ```
  - Sets the access password for the Redis server. Clients must provide this password to execute commands.

- **`rename-command`**
  ```plaintext
  rename-command FLUSHDB ""
  rename-command FLUSHALL ""
  ```
  - Renames or disables certain commands. For example, disabling `FLUSHDB` and `FLUSHALL` for improved security.

## 6. **Other Configuration**

- **`slowlog-log-slower-than`**
  ```plaintext
  slowlog-log-slower-than 10000
  ```
  - Configures the threshold for logging slow queries, in microseconds. The above configuration records queries that take longer than 10 milliseconds.

- **`latency-monitor-threshold`**
  ```plaintext
  latency-monitor-threshold 0
  ```
  - Configures the latency monitoring threshold, in milliseconds. Setting it to `0` disables latency monitoring.

## Example Configuration

Below is an example Redis configuration file suitable for a development environment:

```plaintext
daemonize no
pidfile /var/run/redis/redis-server.pid
logfile "/var/log/redis/redis-server.log"
databases 16

bind 127.0.0.1
port 6379
protected-mode yes

save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec

maxmemory 2gb
maxmemory-policy allkeys-lru

requirepass yourpasswordhere

slowlog-log-slower-than 10000
```

This configuration sets Redis to run in non-daemon mode, binds it to the local loopback address, and configures basic persistence and memory management options. It also enables password protection and sets up slow query logging.

The full list of configuration options can be found in the `redis.conf` example file that ships with the Redis source code, where each option includes detailed English comments.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis operations manual · Configuration](https://redis.io/docs/latest/operate/oss_and_stack/management/config/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
- [README](README.md)
