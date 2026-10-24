# Installing Redis on Linux

## 1. Update system packages

First, make sure your system packages are up to date. You can update the system with the following commands:
```bash
sudo apt-get update
sudo apt-get upgrade
```

## 2. Install dependencies

Redis needs a few basic tools and libraries. Before installing Redis, make sure these are installed on the system:
```bash
sudo apt-get install build-essential tcl
```

## 3. Download Redis

Visit Redis's official website or GitHub page to download the latest version of Redis. The following command downloads the source code for Redis 7.0.4:
```bash
wget https://download.redis.io/releases/redis-7.0.4.tar.gz
```

## 4. Extract the Redis source package

After downloading, extract the Redis source package:
```bash
tar xzf redis-7.0.4.tar.gz
```

## 5. Compile Redis

Enter the Redis source directory and compile Redis:
```bash
cd redis-7.0.4
make
```

After a successful build, binaries such as `redis-server` and `redis-cli` are produced in the directory.

## 6. Install Redis

Install Redis to a system path so it can be called from anywhere on the system:
```bash
sudo make install
```

## 7. Configure Redis

Copy Redis's default config file to the `/etc/redis` directory:
```bash
sudo mkdir /etc/redis
sudo cp redis.conf /etc/redis/redis.conf
```

Edit the config file (`/etc/redis/redis.conf`) and set the options that suit your needs. For example, you can set Redis to run as a background process:
```bash
sudo nano /etc/redis/redis.conf
```
In the file, find `daemonize no`, change it to `daemonize yes`, then save and exit.

## 8. Create the Redis service file

To make managing the Redis service easier, you can create a systemd service file to manage Redis:
```bash
sudo nano /etc/systemd/system/redis.service
```

Paste the following content into the file:
```ini
[Unit]
Description=Redis In-Memory Data Store
After=network.target

[Service]
ExecStart=/usr/local/bin/redis-server /etc/redis/redis.conf
ExecStop=/usr/local/bin/redis-cli shutdown
Restart=always

[Install]
WantedBy=multi-user.target
```

Save the file and exit the editor.

## 9. Start the Redis service

Reload the systemd manager configuration, then start the Redis service:
```bash
sudo systemctl daemon-reload
sudo systemctl start redis
```

Set the Redis service to start on boot:
```bash
sudo systemctl enable redis
```

## 10. Verify the Redis installation

Use the Redis CLI client to connect to the Redis server and test the basic commands:
```bash
redis-cli
```

In the Redis CLI, run the following commands to test that everything works:
```bash
ping
# Should return PONG
set testkey "Hello, Redis!"
get testkey
# Should return "Hello, Redis!"
```

With this, you have finished installing and configuring Redis on Linux. If you run into any problems, you can check Redis's log files to troubleshoot.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis operations manual · Install Stack](https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
