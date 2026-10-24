# Data Encryption

Data encryption is an important measure for protecting stored data in Redis, especially when handling sensitive information. Below are some key concepts and configuration methods for Redis data encryption:

## 1. **Data Transmission Encryption**

**TLS/SSL support:**

Starting from Redis 6.0, Redis supports data transmission encryption via TLS/SSL. This protects data transfer between clients and the Redis server from being eavesdropped on or tampered with by third parties.

- **Configure TLS/SSL:** configure SSL/TLS related options in the `redis.conf` file to enable encrypted transmission:

  ```plaintext
  tls-port 6380
  tls-cert-file /path/to/redis.crt
  tls-key-file /path/to/redis.key
  tls-ca-cert-file /path/to/ca.crt
  tls-auth-clients no
  ```

  - `tls-port`: specifies the port used for TLS encryption.
  - `tls-cert-file`: specifies the path to the server certificate file.
  - `tls-key-file`: specifies the path to the server private key file.
  - `tls-ca-cert-file`: specifies the path to the CA certificate file.
  - `tls-auth-clients`: configures whether to verify client certificates. Setting it to `no` means client certificates are not verified.

- **Verify the connection:** clients need to configure TLS support when connecting. You can use `redis-cli`'s `--tls` option to test the TLS configuration:

  ```bash
  redis-cli --tls --cert /path/to/client.crt --key /path/to/client.key --cacert /path/to/ca.crt
  ```

## 2. **Data Storage Encryption**

Redis itself does not provide built-in data storage encryption, but it can be achieved through operating system-level encryption or application-level encryption:

**File system encryption:**

- **Enable file system encryption:** use the encryption features provided by the operating system (such as eCryptfs or LUKS on Linux) to encrypt the disk partition storing Redis data. This ensures that even if the disk is stolen, the data cannot be read directly.

**Application-level encryption:**

- **Encrypt data:** data can be encrypted in the application before being stored in Redis. This means the data is encrypted in Redis, so even if the Redis data files are accessed, the data cannot be read directly.

  For example, a symmetric encryption algorithm (such as AES) can be used at the application level to encrypt data, and then the encrypted data is stored in Redis (requires the `pycryptodome` package to be installed):

  ```python
  from Crypto.Cipher import AES
  import base64

  def encrypt_message(message, key):
      cipher = AES.new(key, AES.MODE_EAX)
      ciphertext, tag = cipher.encrypt_and_digest(message.encode())
      return base64.b64encode(cipher.nonce + tag + ciphertext).decode()

  def decrypt_message(encrypted_message, key):
      encrypted_message = base64.b64decode(encrypted_message.encode())
      nonce, tag, ciphertext = encrypted_message[:16], encrypted_message[16:32], encrypted_message[32:]
      cipher = AES.new(key, AES.MODE_EAX, nonce=nonce)
      return cipher.decrypt_and_verify(ciphertext, tag).decode()

  # Example usage
  key = b'Sixteen byte key'  # 16/24/32 bytes for AES-128/192/256
  original_message = "Hello, World!"
  encrypted_message = encrypt_message(original_message, key)
  decrypted_message = decrypt_message(encrypted_message, key)
  assert decrypted_message == original_message
  ```

## 3. **Password Protection**

**Configure the access password:**

- **Set the access password:** use the `requirepass` configuration item to set an access password, preventing unauthorized access to the Redis instance:

  ```plaintext
  requirepass your_password
  ```

  While this is not data encryption, it effectively protects the Redis instance from unauthorized access, thereby reducing the risk of data leakage.

## Summary

Data encryption in Redis involves two main aspects: data transmission encryption and data storage encryption. By enabling TLS/SSL encrypted transmission, using operating system-level encryption, encrypting data at the application level, and configuring an access password, the security of data in Redis can be effectively protected. These measures ensure that data is properly protected during both transmission and storage, preventing potential security threats.

## References

- [Redis Operations Manual · Management](https://redis.io/docs/latest/operate/oss_and_stack/management/)
- [Redis development docs](https://redis.io/docs/latest/develop/)
- [Redis Operations Manual · Security](https://redis.io/docs/latest/operate/oss_and_stack/management/security/)

## Related pages

- [aof-log](aof-log.md)

<!-- BACKLINKS-AUTO -->
## Related pages

- [aof-log](aof-log.md)
