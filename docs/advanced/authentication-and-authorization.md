# Authentication and Authorization

In Redis, authentication and authorization are important mechanisms for ensuring data security. Through these mechanisms, you can control access to a Redis instance and prevent unauthorized users from operating on the data.

## 1. Authentication

Authentication is the process of controlling access to a Redis instance by verifying the credentials (password) provided by the client.

**Set the password:**

- **Configuration file:** in the Redis configuration file `redis.conf`, use the `requirepass` option to set the password. For example:

  ```plaintext
  requirepass your_password
  ```

  This makes any client attempting to connect to the Redis instance required to provide the correct password before it can operate.

- **Set the password via a command:** you can set the password with the `CONFIG SET` command in the Redis CLI:

  ```bash
  redis-cli CONFIG SET requirepass your_password
  ```

**Connection verification:**

- **Client connection:** when connecting to a Redis instance with `redis-cli`, you must provide the password via the `-a` option:

  ```bash
  redis-cli -a your_password
  ```

  If you use another client or library, you usually need to specify the password in the connection configuration.

- **Verify the password:** after connecting to a Redis instance, you can verify the password with the `AUTH` command:

  ```bash
  AUTH your_password
  ```

  If the password is correct, Redis allows subsequent commands to execute; if the password is wrong, an error message is returned.

## 2. Authorization

Authorization is the process of further restricting the operation permissions of an authenticated user. Although Redis itself does not provide fine-grained authorization control, you can implement basic permission management through some measures.

**Configure different users:**

Starting from Redis 6.0, Redis introduced user roles and ACL (Access Control List) features, allowing you to create multiple users and assign different permissions to each user.

- **Create users and roles:** you can use the `user` configuration in the `redis.conf` file to create users and their permissions. For example:

  ```plaintext
  user default on >your_password ~* +@all
  user read_only_user on >read_only_password ~* +@read
  ```

  The configuration above creates two users: one with full permissions and another with read-only permissions.

- **User roles and permissions:** use the `ACL SETUSER` command in the Redis CLI to configure user permissions. For example:

  ```bash
  ACL SETUSER read_only_user on >read_only_password ~* +@read
  ```

  This command creates a read-only user, restricting it to read operations only.

**Examples:**

- **Verify permissions:** use the `ACL LIST` command to view the current user's permissions:

  ```bash
  ACL LIST
  ```

- **Update user permissions:** use the `ACL SETUSER` command to update a user's permissions. For example, change the permissions of the user `read_only_user` from read-only to read-write:

  ```bash
  ACL SETUSER read_only_user on >new_password ~* +@all
  ```

## Security recommendations

- **Strong passwords:** use a complex password that is hard to guess to strengthen security.
- **Update passwords regularly:** change the password periodically to keep the system secure.
- **Principle of least privilege:** grant users only the minimum permissions needed to complete their tasks, reducing potential security risks.
- **Monitoring and auditing:** regularly audit user activity logs to ensure there are no anomalous or unauthorized operations.

By configuring authentication and authorization, you can effectively control access to Redis instances and strengthen the security of the system.

## References

- [Redis Operations Manual · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)
- ACL SETUSER (no authoritative source found; to be verified)
- [Redis Operations Manual · Security](https://redis.io/docs/latest/operate/oss_and_stack/management/security/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [glossary](/appendix/glossary.md)
