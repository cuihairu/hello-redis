# Network Security

In Redis, network security is an important aspect of protecting data and services from unauthorized access and attacks. Below are some best practices and configurations to ensure Redis network security:

## 1. Binding and Listening

**Bind IP addresses:**

- **Restrict access sources:** use the `bind` configuration option to restrict Redis to listen only on specific IP addresses, preventing unnecessary network access. For example, allow local access only:

  ```plaintext
  bind 127.0.0.1
  ```

  If you need access from a specific external IP address, you can add it to the bind list:

  ```plaintext
  bind 127.0.0.1 192.168.1.100
  ```

**Listening port:**

- **Set the port:** Redis listens on port 6379 by default. You can change the `port` configuration option in the `redis.conf` file to use a different port number, reducing the risk of being attacked:

  ```plaintext
  port 6380
  ```

## 2. Using Password Protection

**Set the password:**

- **Configure the password:** use the `requirepass` configuration option to set a password. Make sure to enable this setting in production environments to prevent unauthorized access:

  ```plaintext
  requirepass your_password
  ```

**Client authentication:**

- **Strong passwords:** use a complex password that is hard to guess, and avoid using simple or default passwords.

## 3. TLS/SSL Encryption

**Enable encryption:**

- **Configure SSL/TLS:** starting from Redis 6.0, Redis supports encrypted transmission via SSL/TLS. You can configure SSL-related options in `redis.conf` to encrypt communication between clients and the Redis instance:

  ```plaintext
  tls-port 6380
  tls-cert-file /path/to/redis.crt
  tls-key-file /path/to/redis.key
  tls-ca-cert-file /path/to/ca.crt
  ```

  - `tls-port`: specifies the port used for TLS encryption.
  - `tls-cert-file`: the server certificate file.
  - `tls-key-file`: the server private key file.
  - `tls-ca-cert-file`: the CA certificate file.

**Verify the TLS configuration:**

- **Check the configuration:** ensure the Redis instance can establish encrypted connections via SSL/TLS as normal, and test whether client connections are encrypted.

## 4. Restricting Client Connections

**Set client connection limits:**

- **Maximum client connections:** use the `maxclients` configuration option to limit the maximum number of client connections, preventing resource exhaustion attacks:

  ```plaintext
  maxclients 10000
  ```

## 5. Firewall and Access Control

**Configure a firewall:**

- **Restrict access sources:** configure firewall rules to restrict access to the Redis instance to only specific IP addresses or networks. For example, allow internal network access only:

  ```bash
  iptables -A INPUT -p tcp -s 192.168.1.0/24 --dport 6379 -j ACCEPT
  iptables -A INPUT -p tcp --dport 6379 -j DROP
  ```

## 6. Monitoring and Logging

**Monitoring and logging:**

- **Enable logging:** configure Redis logging to monitor access and operations, ensuring you can audit and trace potential security issues:

  ```plaintext
  loglevel notice
  logfile /var/log/redis/redis-server.log
  ```

- **Regular audits:** regularly audit log files to identify anomalous activity and potential security threats.

## 7. Updates and Patches

**Stay up to date:**

- **Regular updates:** regularly update your Redis version and apply security patches, ensuring the version in use includes the latest security fixes.

**Obtain patches:**

- **Follow announcements:** follow official Redis announcements and security mailing lists to get security patches and upgrade recommendations in a timely manner.

## Summary

By configuring appropriate network security measures, you can effectively protect Redis instances from unauthorized access and potential attacks. Applying password protection, enabling encrypted transmission, restricting client connections, configuring a firewall, monitoring logs, and keeping the software up to date are all key steps to securing Redis over the network.

## References

- [Redis Operations Manual · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis Operations Manual · Security](https://redis.io/docs/latest/operate/oss_and_stack/management/security/)

## Related pages

- [aof-log](aof-log.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [aof-log](aof-log.md)
