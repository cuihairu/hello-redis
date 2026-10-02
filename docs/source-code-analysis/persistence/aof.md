# AOF持久化实现

## 概述

AOF（Append Only File）把每条写命令以 RESP 文本形式追加到日志文件，重启时重放命令即可恢复数据。相比 RDB 的周期快照，它的丢失窗口由 fsync 策略决定，最坏只丢 1 秒。实现集中在 src/aof.c，7.0 重构为 multi-part AOF（base + 增量 + manifest）。本节沿“写入 → 落盘 → 重写 → 恢复”的顺序拆解源码。

## 写入链路：从命令到 aof_buf

写命令执行成功后，`call()`（src/server.c）通过 `propagate()`（内部是 `propagateNow()`）把命令递交给 AOF，进入 `feedAppendOnlyFile()`（src/aof.c）：它把命令原样格式化成 RESP 协议文本（当前实现不做任何 AOF 专属转写，仅在目标数据库变化时自动补一条 `SELECT`；开启 `aof-timestamp-enabled` 时还会写入时间戳注释），追加到全局缓冲区 `server.aof_buf`（sds 类型，src/server.h）。

真正的落盘发生在 `beforeSleep()`：主线程每次回到事件循环等待前调用 `flushAppendOnlyFile(0)`，把 `aof_buf` 写入文件，并按 `appendfsync` 决定是否 fsync：

- `AOF_FSYNC_ALWAYS`：写完立即 fsync，命令返回前保证落盘；
- `AOF_FSYNC_EVERYSEC`：默认策略，由后台线程（src/bio.c 的 `BIO_AOF_FSYNC` 作业）每秒 fsync 一次，主线程发现上次 fsync 还在进行时会推迟写入（即 `aof_delayed_fsync` 计数的来源）；
- `AOF_FSYNC_NO`：从不主动 fsync，交给操作系统刷盘。

```bash
$ redis-cli -p 6399 config get appendfsync
1) "appendfsync"
2) "everysec"
$ redis-cli -p 6399 config get appenddirname
1) "appenddirname"
2) "appendonlydir"
$ redis-cli -p 6399 config get appendfilename
1) "appendfilename"
2) "appendonly.aof"
$ redis-cli -p 6399 config get aof-load-truncated
1) "aof-load-truncated"
2) "yes"
```

## multi-part AOF：文件组织

7.0 起 AOF 不再是单个文件，而是 `appenddirname`（默认 `appendonlydir`）目录下的一组文件：

- `appendonly.aof.<seq>.base.rdb`：base 文件，是上次重写时刻的全量快照；`aof-use-rdb-preamble yes`（默认）时为 RDB 二进制格式，否则为 AOF 命令格式；
- `appendonly.aof.<seq>.incr.aof`：增量文件，记录 base 之后的所有写命令；
- `appendonly.aof.manifest`：清单，逐行描述当前有效的文件，例如：

```
file appendonly.aof.2.base.rdb seq 2 type b
file appendonly.aof.3.incr.aof seq 3 type i
```

`type` 取值 b（base）、i（incremental）、h（history）。启动时 `aofLoadManifestFromDisk()` 解析清单，再由 `loadAppendOnlyFiles()` 依次加载 base 与全部 incr 文件；`openNewIncrAofForAppend()` 负责重写开始时切换到新的增量文件；`aofDelHistoryFiles()` 清理废弃文件。

## AOF 重写

AOF 会无限增长，重写用“当前数据集反推最小命令集”的方式压缩日志。`BGREWRITEAOF` 命令或自动条件（`auto-aof-rewrite-percentage` 相对 `aof_base_size` 的增长比例、`auto-aof-rewrite-min-size` 最小触发体积，检查逻辑在 `serverCron()` 中）都会走到 `rewriteAppendOnlyFileBackground()`（src/aof.c）：

1. 父进程先调用 `openNewIncrAofForAppend()` 打开新的增量文件，此后新写入不再进入旧文件，而是直接追加到新 incr 文件；
2. fork 子进程，由 `rewriteAppendOnlyFile()`（内部是 `rewriteAppendOnlyFileRio()`）遍历当前键空间生成新的 base 文件；
3. 子进程完成后，父进程的 `backgroundRewriteDoneHandler()` 用新 base + 新 incr 构造临时 manifest，`rename()` 原子替换正式 manifest，再删除旧文件；
4. 重写期间如果服务中断，旧 base + 旧 incr + 新 incr 仍然构成完整数据，因此整个过程是安全的。

与 7.0 之前不同，父进程不再维护一份巨大的内存重写缓冲区，避免了重写期间的内存放大。

## 混合持久化与恢复

`aof-use-rdb-preamble yes`（默认）让 base 文件采用 RDB 格式：恢复时先用 `rdbLoadRio()` 加载 base，再重放 incr 文件中的命令，兼得 RDB 的加载速度与 AOF 的丢失窗口。加载由 `loadSingleAppendOnlyFile()` 处理命令部分，遇到不完整的尾部命令时受 `aof-load-truncated`（默认 yes）控制：允许截断加载并警告，否则启动失败。损坏的 AOF 可用离线工具 `redis-check-aof` 修复，它同时接受 manifest 与单个 aof 文件，`--fix` 会丢弃最后一个不完整的命令；不带参数时打印用法：

```bash
$ redis-check-aof
Usage: redis-check-aof [--fix|--truncate-to-timestamp $timestamp] <file.manifest|file.aof>
```

## 运行时观测

```bash
$ redis-cli -p 6399 info persistence | grep -E '^(aof_enabled|aof_rewrite_in_progress|aof_rewrite_scheduled|aof_last_bgrewrite_status)'
aof_enabled:0
aof_rewrite_in_progress:0
aof_rewrite_scheduled:0
aof_last_bgrewrite_status:ok
```

该实例 AOF 未开启，因此看不到 `aof_current_size`、`aof_base_size`、`aof_pending_bio_fsync`、`aof_delayed_fsync` 等字段；开启后它们才会出现在 `INFO persistence` 中，分别表示当前文件大小、上次重写时 base 大小、等待后台 fsync 的作业数与被推迟的 fsync 次数。

## 小结

AOF 实现的关键词是“缓冲 + 分频落盘 + 周期重写”：`aof_buf` 聚合命令、`beforeSleep` 统一刷写、`BIO_AOF_FSYNC` 把 fsync 移出主线程、multi-part 结构让重写变成一次纯粹的文件替换。阅读源码建议从 `feedAppendOnlyFile()` 进入写路径，从 `rewriteAppendOnlyFileBackground()` 进入重写路径，最后对照 `aof.c` 头部注释里给出的 manifest 示例理解文件切换时机。
