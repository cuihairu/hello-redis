# Installing Redis on macOS

Redis can be installed easily through Homebrew. Here are the steps:

## 1. Install Homebrew

If you have not installed Homebrew yet, you can install it with the following command:

1. Open Terminal.
2. Run the following command:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   After installation, running `brew --version` and seeing a version number printed means it worked; if the network is slow, you can configure a mirror source first following the official Homebrew documentation.

## 2. Install Redis with Homebrew

1. **Update Homebrew**
   - Run the following command in Terminal to make sure Homebrew is up to date:
     ```bash
     brew update
     ```

2. **Install Redis**
   - Run the following command to install Redis:
     ```bash
     brew install redis
     ```
   - After installation, you can use `redis-server --version` and `redis-cli --version` to confirm the version numbers.

## 3. Start the Redis service

1. **Start Redis**
   - Start the Redis service with Homebrew:
     ```bash
     brew services start redis
     ```
   - This sets Redis up as a background service and starts Redis automatically at system boot.

2. **Start Redis manually**
   - If you do not want to set Redis up as a background service, you can start the Redis server manually:
     ```bash
     redis-server
     ```
   - Use `brew services list` to check the service status at any time.

## 4. Verify the Redis installation

1. **Connect to Redis**
   - Open a new Terminal window or tab, and use the Redis CLI client to connect to the Redis server:
     ```bash
     redis-cli
     ```

2. **Test the basic commands**
   - Test the basic commands in the Redis CLI:
     ```bash
     ping
     # Should return PONG
     set testkey "Hello, Redis!"
     get testkey
     # Should return "Hello, Redis!"
     ```
   - `PING` returning `PONG` and `GET` retrieving the value you just wrote means the service is healthy; run `QUIT` to exit interactive mode.

## 5. Configure Redis

- Redis's config file location depends on the CPU architecture: Apple Silicon uses `/opt/homebrew/etc/redis.conf`, Intel uses `/usr/local/etc/redis.conf` (you can use `brew --prefix` to see the current prefix).
- You can edit the config file to adjust Redis's settings:
  ```bash
  nano /opt/homebrew/etc/redis.conf
  ```

- After making changes, restart Redis to apply the configuration:
  ```bash
  brew services restart redis
  ```
- After restarting, run `PING` again to confirm the service is back; if `requirepass` is set, you need to run `AUTH password` first before running other commands.
- Common config options: `bind 127.0.0.1` listens on localhost only, `port 6379` sets the listening port, `requirepass` sets the access password, and `appendonly yes` enables AOF persistence.

## Notes

- Installing Redis through Homebrew is mainly for development and testing. In production, it is recommended to install and configure Redis using another method.
- When a connection is refused (Connection refused), first check the service status: use `brew services list`, or run `redis-server` in the foreground to see the error output.
- If you run into any problems, you can refer to the official Redis documentation or the relevant Homebrew support resources.

With these steps, you can install and configure Redis on macOS successfully. If you run into problems during installation, you can start by checking the Homebrew installation logs and whether Redis's config file path matches the one in this article.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis operations manual · Install Stack](https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/)

## Related pages

- [basic-operations](basic-operations.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [basic-operations](basic-operations.md)
