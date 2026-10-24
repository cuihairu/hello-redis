# Installation and Configuration

## Installing Redis on Linux

1. **Download and extract Redis**
   ```bash
   wget https://download.redis.io/releases/redis-7.0.4.tar.gz
   tar xzf redis-7.0.4.tar.gz
   cd redis-7.0.4
   ```

2. **Compile Redis**
   ```bash
   make
   ```

3. **Install Redis**
   ```bash
   sudo make install
   ```

4. **Configure Redis**
   - Redis's default configuration file is `redis.conf`. You can copy it to `/etc` for global configuration:
     ```bash
     sudo cp redis.conf /etc/redis/redis.conf
     ```

5. **Start the Redis service**
   - Start the Redis server:
     ```bash
     redis-server /etc/redis/redis.conf
     ```

6. **Test Redis**
   - Test the connection with the Redis client:
     ```bash
     redis-cli
     ```

## Installing Redis on Windows

1. **Download Redis**
   - The official Redis project does not provide a Windows installer: on Windows you typically run the Linux build through WSL, or use a community-maintained Windows port (such as [MicrosoftArchive/redis](https://github.com/microsoftarchive/redis/releases); the steps below target that version). See &#8203;Installing Redis on Windows<!-- EN-LINK: ./installation-on-windows.md --> for both approaches.

2. **Install Redis**
   - Extract the downloaded archive, then double-click `redis-server.exe` to start the Redis server.
   - You can connect to the Redis server with `redis-cli.exe` to run commands.

3. **Configure Redis**
   - Edit the Redis configuration file `redis.windows.conf` to set Redis's various options.
   - Specify the configuration file when starting the Redis server:
     ```bash
     redis-server redis.windows.conf
     ```

## Redis Configuration File Details

Redis's configuration file `redis.conf` contains various configuration options for the Redis server. Common options include:

1. **Memory management**
   - `maxmemory`: set the maximum amount of memory Redis can use. Use this option to limit the memory Redis occupies:
     ```bash
     maxmemory 2gb
     ```

2. **Persistence configuration**
   - `save`: configure the frequency of RDB snapshots. For example, generate an RDB snapshot if there is 1 change within every 900 seconds (15 minutes):
     ```bash
     save 900 1
     ```
   - `appendonly`: enable AOF persistence logging:
     ```bash
     appendonly yes
     ```

3. **Network configuration**
   - `bind`: set the IP address Redis binds to. By default it binds to `127.0.0.1`, allowing only local connections:
     ```bash
     bind 127.0.0.1
     ```
   - `port`: set the port Redis listens on, defaulting to 6379:
     ```bash
     port 6379
     ```

4. **Authentication and security**
   - `requirepass`: set the Redis access password, enabling password authentication:
     ```bash
     requirepass yourpassword
     ```

5. **Logging configuration**
   - `loglevel`: set how detailed the log output is (`debug`, `verbose`, `notice`, `warning`):
     ```bash
     loglevel notice
     ```
   - `logfile`: set the location of the log file. Defaults to empty, meaning logs go to standard output:
     ```bash
     logfile /var/log/redis/redis-server.log
     ```

6. **Persistence policy**
   - `appendfsync`: set the AOF persistence policy (`always`, `everysec`, `no`):
     ```bash
     appendfsync everysec
     ```

7. **Other configuration**
   - `daemonize`: whether to run Redis as a daemon. `yes` runs it in the background, `no` runs it in the foreground:
     ```bash
     daemonize yes
     ```

## Connection and Authentication

1. **Connect to the Redis server**
   - Use the `redis-cli` client to connect to the Redis server:
     ```bash
     redis-cli
     ```
   - If the Redis server has a password configured, you need to provide it:
     ```bash
     redis-cli -a yourpassword
     ```

2. **Test the connection**
   - After connecting to the Redis server, you can run a few basic commands to test that everything works:
     ```bash
     redis-cli ping
     # A reply of PONG means Redis is running
     redis-cli set testkey "Hello, Redis!"
     redis-cli get testkey
     # Replies "Hello, Redis!"
     ```

With the steps above, you can install and configure Redis on both Linux and Windows, and you now understand the common configuration options and what they do.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis operations manual · Installation](https://redis.io/docs/latest/operate/oss_and_stack/install/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
