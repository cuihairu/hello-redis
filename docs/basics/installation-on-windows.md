# Installing Redis on Windows

Redis does not officially provide a native Windows version, but you can install Redis on Windows with the following steps:

## 1. Using the Windows Subsystem for Linux (WSL)

1. **Enable WSL**
   - Open PowerShell as administrator and enter the following command to enable WSL:
     ```powershell
     dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
     ```
   - Enable the Virtual Machine Platform feature the same way:
     ```powershell
     dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
     ```

2. **Install a Linux distribution**
   - Install the Linux distribution you need (for example, Ubuntu) from the Microsoft Store.

3. **Install Redis**
   - Start the installed Linux distribution, update the package list, and install Redis:
     ```bash
     sudo apt update
     sudo apt install redis-server
     ```
   - Start the Redis service:
     ```bash
     sudo service redis-server start
     ```

4. **Verify the installation**
   - Use the Redis CLI client to connect to the Redis server:
     ```bash
     redis-cli
     ```
   - Test the basic commands in the Redis CLI:
     ```bash
     ping
     # Should return PONG
     set testkey "Hello, Redis!"
     get testkey
     # Should return "Hello, Redis!"
     ```

## 2. Using Redis's precompiled Windows version

1. **Download the precompiled Redis version**
   - Download the Windows version of Redis from the following GitHub repository:
     [MicrosoftArchive/redis](https://github.com/microsoftarchive/redis/releases)
   - Download the latest `.msi` installer (for example, `redis-x64-xxx.msi`).

2. **Install Redis**
   - Double-click the downloaded `.msi` file and follow the installer wizard to install it.

3. **Start Redis**
   - After installation, the Redis service usually starts automatically. You can check the status of the Redis service through the Services manager (`services.msc`), or start it from the command prompt:
     ```cmd
     redis-server
     ```

4. **Configure Redis**
   - By default, Redis saves the config file in the installation directory. You can modify the `redis.windows.conf` config file as needed.

5. **Use the Redis CLI client**
   - Open the command prompt and run the Redis CLI client:
     ```cmd
     redis-cli
     ```
   - Test that Redis is running correctly:
     ```cmd
     ping
     # Should return PONG
     set testkey "Hello, Redis!"
     get testkey
     # Should return "Hello, Redis!"
     ```

## Notes

- Using the Windows version of Redis is mainly for development and testing. In production, it is recommended to run Redis on a Linux system.
- Redis's performance and stability on Windows may not be as good as the Linux version, especially under heavy load or in production environments.

With the steps above, you can install and configure Redis on Windows. If you have any questions, you can refer to the official Redis documentation or the relevant community support.

## References

- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis operations manual · Install](https://redis.io/docs/latest/operate/oss_and_stack/install/)

<!-- BACKLINKS-AUTO -->
## Related pages

- [README](README.md)
- [installation-and-configuration](installation-and-configuration.md)
- [knowledge](/knowledge.md)
