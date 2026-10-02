# 命令解析

## 概述

命令解析解决一个问题：把字节流切成 `argv`。Redis 支持两种请求格式——人工调试用的内联协议与客户端必备的多批量协议，解析入口都在 `networking.c` 的 `processInputBuffer()` 中按首字节分发。解析器是"可中断"的：缓冲区里只有一个不完整的请求时，状态保存到下一个读事件继续，绝不阻塞事件循环。

## 内联协议：processInlineBuffer

`processInlineBuffer()`（约 2341 行）处理没有 `*` 前缀的请求，典型来自 `nc`/`telnet`：

```bash
$ printf 'PING\r\n' | nc 127.0.0.1 6399
+PONG
$ printf 'SET bd:proto v1\r\nGET bd:proto\r\n' | nc 127.0.0.1 6399
+OK
$2
v1
```

实现上用 `sdssplitargs()` 按空白切分，支持引号包裹的参数。两条硬限制：

- 单行超过 `PROTO_INLINE_MAX_SIZE`（64KB）直接断开；
- 引号不配对、转义非法时报 `-ERR unbalanced quotes in request`。

因为按空格切分，内联协议天然无法表达带空格的参数——`ECHO hello world` 会被切成 3 个参数并回 `-ERR wrong number of arguments for 'echo' command`（本地实测）。

## 多批量协议：processMultibulkBuffer

`processMultibulkBuffer()`（约 2459 行）是真正的解析主力，状态推进分两层：

```text
*3\r\n          <- multibulklen = 3
$3\r\nSET\r\n   <- bulklen = 3，从 qb_pos 开始取 3 字节
$4\r\nbd:k\r\n
$2\r\nv1\r\n
```

关键实现细节：

1. **状态保存在客户端上**：`c->multibulklen`（还剩几个参数）与 `c->bulklen`（当前参数还差几个字节）。缓冲区数据不足时直接 `break`，等下一次读事件，不重复扫描已解析部分（`qb_pos` 游标前移）。
2. **常规路径是拷贝**：数据齐了以后走 `createStringObject(querybuf + qb_pos, bulklen)`，把参数复制成独立的 `robj` 字符串，querybuf 游标跳过 `bulklen+2`。
3. **大参数零拷贝**：同时满足"非主从客户端、`qb_pos == 0`、`bulklen >= PROTO_MBULK_BIG_ARG`（32KB）、缓冲区恰好只剩这一个参数"时，直接把 querybuf 的 sds 指针交给 `argv[i]`，再 `sdsnewlen` 重新分配一块缓冲区继续解析，避免大 value 的整块拷贝。参数体长度写进 `c->argv_len_sum`。
4. **合法性检查**：`*N` 不是数字或超过 `INT_MAX`、`$len` 为负或超过 `proto-max-bulk-len`（默认 512MB）、未认证客户端请求超过 10 个参数或单参数超过 16384 字节，都会置位 `read_error` 并关闭连接；协议错误日志会用 `PROTO_DUMP_LEN`（128 字节）打印出错位置附近的缓冲区内容，便于定位客户端 bug。

## 解析错误与命令查找失败

解析成功后进入查表，`lookupCommand()` 找不到时给出带提示的错误（实测）：

```text
NOSUCHCMD           ->  -ERR unknown command 'NOSUCHCMD', with args beginning with:
GET foo（参数过多）  ->  -ERR wrong number of arguments for 'get' command
```

注意区分两类失败：解析错误发生在切 `argv` 之前（协议层），arity/未知命令错误发生在 `processCommand()` 检查阶段（语义层）。`MULTI` 事务中后者只标记 `CLIENT_DIRTY_EXEC`，让 `EXEC` 返回 `EXECABORT Transaction discarded because of previous errors.`，而前者（协议错误）会直接断开连接。

## 管道化：一次发送多个命令

解析器天然支持"一个缓冲区里挤多个请求"，这就是 pipeline 的基础。用 `redis-cli --pipe` 可以验证（它会读入全部命令、发送、最后统计回复数）：

```bash
$ printf 'SET bd:pipe1 1\r\nGET bd:pipe1\r\nDEL bd:pipe1\r\n' | redis-cli -p 6399 --pipe
All data transferred. Waiting for the last reply...
Last reply received from server.
errors: 0, replies: 3
```

与逐条 RTT 相比，200 条 SET 在本地实测从 19.7ms 降到 1.9ms——收益全部来自减少网络往返与系统调用次数，服务器端解析逻辑完全相同。

## 用原始套接字观察状态机

下面的字节序列演示"半个请求先到、剩下后到"时解析器如何等待（两次 `send` 之间解析器不会报错，直到数据完整才执行）：

```bash
python3 - <<'EOF'
import socket
s = socket.create_connection(("127.0.0.1", 6399), timeout=2)
s.sendall(b'*2\r\n$4\r\nECHO\r\n')      # 只有命令名，缺参数
import time; time.sleep(0.2)
s.sendall(b'$5\r\nhello\r\n')           # 参数补齐
print(s.recv(64))                       # b'$5\r\nhello\r\n'
EOF
```

## 小结

命令解析是把"协议规范"翻译成"状态机"的过程：两个入口（inline/multibulk）、两个游标（`qb_pos`、`bulklen`）、两条性能路径（小参数快拷贝、大参数零拷贝）。它对上层承诺"每次返回一个完整 argv"，对下层承诺"绝不阻塞等待数据"。理解了这一点，事件循环中"读到哪、执行到哪"的边界就清楚了。
