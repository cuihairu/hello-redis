# Redis Logging

## Overview

Redis logging is a key part of maintaining the stability and performance of a Redis instance. Logs help you diagnose problems, monitor performance, and troubleshoot failures. Redis supports several logging methods and can be configured and managed according to your actual needs.

## Log Levels and Configuration

### Log Levels

Redis supports the following log levels:

- **`DEBUG`**: detailed debugging information, typically used for development and debugging.
- **`VERBOSE`**: detailed information, suited for tracking down complex issues.
- **`NOTICE`**: routine operational information and a few important warnings.
- **`WARNING`**: warning messages, recorded only when a problem could arise.

### Configuring the Log Level

You can set the log level in the Redis configuration file `redis.conf`, or via a command-line argument when starting Redis.

Set the log level in the `redis.conf` file:

```bash
loglevel notice
```

Replace `notice` with `debug`, `verbose`, or `warning` to adjust how detailed the logging is.

### Log File Location and Naming

- **Log file location**: specify the log file location with the `logfile` configuration item.
- **Default log file**: if `logfile` is not set, Redis writes logs to standard output (the console) by default.

Example configuration:

```bash
logfile "/var/log/redis/redis-server.log"
```

## Log Rotation and Management

### Log Rotation

Log rotation means archiving old log files on a schedule and creating new ones, so a single log file does not grow too large.

- **System log rotation**: use the system's built-in log rotation tool (such as `logrotate`) to manage Redis logs.

Example `logrotate` configuration:

```bash
/var/log/redis/redis-server.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 640 redis redis
}
```

### Manual Rotation

You can rotate logs manually to control log file size and retention time. For example, rotate manually with the `logrotate` command-line tool or the `cp` command:

```bash
cp /var/log/redis/redis-server.log /var/log/redis/redis-server-$(date +%F).log
> /var/log/redis/redis-server.log
```

## Log Analysis and Monitoring

### Real-time Monitoring

You can use monitoring tools (such as `Prometheus`, `Grafana`, `ELK Stack`) to watch Redis logs in real time. By setting appropriate log levels and parsing rules, you can capture important events and performance data.

### Log Analysis

Analyzing logs helps you uncover potential problems in the system:

- **Performance issues**: look for slow queries, resource exhaustion, and similar problems.
- **Troubleshooting**: identify the root cause of system failures.
- **Security auditing**: detect security events such as anomalous logins and data operations.

You can use tools such as `grep`, `awk`, and `sed` to analyze and process logs.

Example of using `grep` to find error logs:

```bash
grep "ERROR" /var/log/redis/redis-server.log
```

## Log Cleanup

Cleaning up old log files on a regular basis saves disk space. You can clean up in the following ways:

- **Automatic cleanup**: configure the log rotation tool to remove old logs automatically.
- **Manual cleanup**: delete old log files by hand on a regular schedule.

Example of manually deleting old logs:

```bash
find /var/log/redis/ -type f -name "*.log" -mtime +30 -exec rm {} \;
```

The command above deletes log files older than 30 days.

## References


<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
