# RDB持久化实现

## 概述

RDB 是 Redis 的全量持久化：把某一时刻内存中的所有数据序列化成一个紧凑的二进制文件（默认 `dump.rdb`）。实现集中在 src/rdb.c，写入与加载各占一半代码。它的核心机制是 `fork()` + 写时复制（COW）：主进程只负责 fork，真正的序列化在子进程中完成，服务几乎不中断。本节按触发、写入、文件格式、加载四段拆解源码。

## 触发路径

三个入口最终都汇聚到同一个函数：

1. **自动触发**：`serverCron()`（src/server.c）遍历 `server.saveparams`，当 `save <seconds> <changes>` 的条件满足（如 `save 900 1` 表示 900 秒内至少 1 次修改）且距上次成功快照超过阈值时，调用 `rdbSaveBackground()`；
2. **手动触发**：`BGSAVE` 命令直接调用 `rdbSaveBackground()`；`SAVE` 则在主线程内同步执行 `rdbSave()`，期间不能处理其他命令；
3. **内部场景**：主从全量同步、`SHUTDOWN`（配置了 save 时）等也会生成 RDB。

```bash
$ redis-cli -p 6399 config get save
1) "save"
2) ""
$ redis-cli -p 6399 lastsave
(integer) 1790903507
```

`save` 为空表示该实例关闭了自动快照；`lastsave` 返回上次成功快照的 Unix 时间戳。

## 后台保存流程

`rdbSaveBackground()`（src/rdb.c）的关键步骤：

1. `redisFork(CHILD_TYPE_RDB)` 创建子进程，父子进程从此共享物理内存页；
2. 子进程把全局状态标记为 `CHILD_TYPE_RDB`，调用 `dismissMemoryInChild()` 释放自己不再使用的内存（如客户端缓冲区副本，见 src/server.c），然后执行 `rdbSave()`；
3. `rdbSave()` 先写临时文件 `temp-<pid>.rdb`，序列化由 `rdbSaveRio()` 完成，成功后 `rename()` 原子替换正式文件；
4. 子进程通过管道向父进程上报 COW 大小（`sendChildCowInfo(CHILD_INFO_TYPE_RDB_COW_SIZE, "RDB")`），父进程据此更新 `INFO persistence` 中的 `current_cow_size`、`rdb_last_cow_size`；
5. 父进程的 `serverCron()` 通过 `waitpid()` 收割子进程，记录 `rdb_last_bgsave_status`。

COW 的代价体现在 `INFO persistence`：`current_fork_perc`、`current_cow_size` 反映 fork 与复制开销。数据集越大、写入越多，COW 放大的内存越多。

## 文件格式

RDB 文件是 opcode 序列，开头是 magic 串 `REDIS` 加 4 位数字的版本号（`snprintf(magic,...,"REDIS%04d",RDB_VERSION)`，8.0 中 `RDB_VERSION` 为 12，见 src/rdb.h），主体依次包含：

- `RDB_OPCODE_AUX`（250）：辅助字段，如 `redis-ver`、`aof-preamble`；
- `RDB_OPCODE_SELECTDB`（254）：切换数据库编号；
- `RDB_OPCODE_RESIZEDB`（251）：键数量与带过期键数量提示，便于预分配；
- `RDB_OPCODE_EXPIRETIME_MS`（252）/ `EXPIRETIME`（253）：后续键的过期时间；
- `RDB_OPCODE_IDLE`（248）/ `RDB_OPCODE_FREQ`（249）：LRU 空闲时间与 LFU 频次；
- 键值对本身：键为字符串，值由 `rdbSaveObject()` 按类型与编码写入，长字符串可用 LZF 压缩；
- `RDB_OPCODE_EOF`（255）：文件结束标记；
- 最后 8 字节是 CRC64 校验和（`rdbSaveRio()` 中 `memrev64ifbe(&cksum)` 后写入）。

`rdb_checksum yes`（默认）时写入并校验 CRC64，编译产物中的 `redis-check-rdb`（源码 src/redis-check-rdb.c）可以离线检查任意 RDB 文件，把文件名作为参数即可（不带参数时打印用法）：

```bash
$ redis-check-rdb
Usage: redis-check-rdb <rdb-file-name>
```

## 加载流程

启动时 `main()` 调用 `rdbLoad()`（src/rdb.c），内部用 `rdbLoadRio()` 循环读取 opcode 并重建键空间。加载期间 `INFO persistence` 的 `loading:1`，进度字段 `loading_total_bytes`、`loading_loaded_bytes`、`loading_start_time` 依次填充；`rdb_last_load_keys_loaded` 记录载入的键数。版本号校验在 `rdbLoadRio()` 中：小于 1 或大于当前 `RDB_VERSION` 的文件直接报错拒绝，其余（即不高于当前版本的）都可以读取。

## 使用要点

- 快照间隔决定了丢失窗口：`save 900 1` 最坏情况丢约 15 分钟数据；
- fork 延迟与数据集大小正相关，`INFO stats` 的 `latest_fork_usec` 可量化；
- COW 可能瞬时翻倍内存，大实例要在低峰期触发 `BGSAVE`；
- 单文件特性使 RDB 非常适合异地灾备与版本回滚，传输前可校验 CRC64。

```bash
$ redis-cli -p 6399 info stats | grep latest_fork_usec
latest_fork_usec:0
$ redis-cli -p 6399 info persistence | grep -E '^(rdb_changes_since_last_save|rdb_last_bgsave_status|rdb_last_save_time)'
rdb_changes_since_last_save:5942
rdb_last_bgsave_status:ok
rdb_last_save_time:1790903507
```

## 小结

RDB 的实现要点可以压缩成一句话：**用 fork 换取一致性快照，用 COW 换取在线服务不中断，用紧凑二进制加 CRC64 换取小体积与完整性**。源码阅读建议从 `rdbSaveBackground()` 进入，顺序过 `rdbSave()` → `rdbSaveRio()` → 各 `rdbSave*Object()`，再对称地看 `rdbLoad()` → `rdbLoadRio()` → 各 `rdbLoad*Object()`，即可覆盖全部实现。
