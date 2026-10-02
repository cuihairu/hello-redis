# 持久化机制

## 概述

Redis 数据在内存中，持久化解决的是“进程重启或机器断电后数据不丢”的问题。源码层面由两个子系统承担：RDB（src/rdb.c）生成某个时刻的全量二进制快照，AOF（src/aof.c）把每条写命令按 RESP 协议追加进日志。两者可以单独使用，也可以同时开启（重启时优先加载 AOF）。

## RDB：fork + 写时复制的全量快照

触发方式有三类：配置的 `save` 条件、手动 `SAVE`/`BGSAVE`、以及主从全量同步等内部场景。核心路径是 `rdbSaveBackground()`（src/rdb.c）调用 `redisFork(CHILD_TYPE_RDB)`，子进程把内存数据写进 `temp-<pid>.rdb`，完成后 `rename()` 原子替换正式文件；父进程照常服务，只在 fork 瞬间付出代价，之后靠操作系统的写时复制（COW）共享内存页。

`serverCron()`（src/server.c）会遍历 `server.saveparams`，在“N 秒内至少 M 次修改”满足时自动触发：

```bash
$ redis-cli -p 6399 config get save
1) "save"
2) ""
```

上例中该实例 `save` 为空字符串，表示自动快照被关闭，只能手动触发。经典配置形如 `save 900 1`（900 秒内至少 1 次修改）。RDB 文件以 RDB 版本号开头（8.0 为 12），以 8 字节 CRC64 校验和结尾，`redis-check-rdb` 工具可以离线检查文件完整性。

## AOF：命令日志与三种 fsync 策略

开启 `appendonly yes` 后，每个写命令在执行成功后由 `feedAppendOnlyFile()`（src/aof.c）写入 `server.aof_buf` 缓冲区，`beforeSleep()` 在回到事件循环前调用 `flushAppendOnlyFile()` 落盘。fsync 频率由 `appendfsync` 决定：

- `always`：每次写入都同步，最安全也最慢；
- `everysec`：每秒一次，由后台线程（src/bio.c 的 `BIO_AOF_FSYNC`）执行，默认值，最多丢 1 秒数据；
- `no`：从不主动 fsync，交给操作系统，通常约 30 秒刷一次，最快也最不安全。

```bash
$ redis-cli -p 6399 config get appendonly
1) "appendonly"
2) "no"
$ redis-cli -p 6399 config get appendfsync
1) "appendfsync"
2) "everysec"
$ redis-cli -p 6399 config get aof-use-rdb-preamble
1) "aof-use-rdb-preamble"
2) "yes"
```

## multi-part AOF：7.0 起的文件组织

Redis 7.0 把单个 AOF 文件拆成“base + 增量 + 清单”三部分，全部放在 `appenddirname`（默认 `appendonlydir`）目录下：

- `appendonly.aof.<seq>.base.rdb`：重写时刻的全量快照，`aof-use-rdb-preamble` 开启时为 RDB 格式，否则是 AOF 命令格式；
- `appendonly.aof.<seq>.incr.aof`：base 之后的所有增量写命令，重写失败重试时可能存在多个；
- `appendonly.aof.manifest`：清单文件，逐行记录每个文件的序号与类型，例如 `file appendonly.aof.2.base.rdb seq 2 type b`（b 为 base、h 为历史、i 为增量）。

对应源码：`aofLoadManifestFromDisk()` 启动时读清单，`openNewIncrAofForAppend()` 在重写开始时切到新的增量文件，`aofDelHistoryFiles()` 清理旧文件。备份时直接打包整个目录即可（注意避开重写进行中的时刻）。

## RDB 与 AOF 的取舍

| 维度 | RDB | AOF |
| --- | --- | --- |
| 数据安全 | 两次快照之间的数据会丢 | 最多丢 1 秒（everysec） |
| 文件体积 | 小，二进制紧凑 | 大，命令文本（重写可收缩） |
| 恢复速度 | 快，直接载入内存 | 慢，需要重放命令 |
| 对在线服务影响 | fork 一次，COW 占用内存 | 持续写盘，重写时再 fork 一次 |
| 典型用途 | 灾备、快速重启 | 主持久化手段 |

两者同时开启时，重启恢复优先使用 AOF，因为它通常更完整。

## 运行时观测

```bash
$ redis-cli -p 6399 info persistence | grep -E '^(loading|rdb_changes_since_last_save|rdb_bgsave_in_progress|rdb_last_bgsave_status|rdb_saves|aof_enabled|aof_rewrite_in_progress)'
loading:0
rdb_changes_since_last_save:1149
rdb_bgsave_in_progress:0
rdb_last_bgsave_status:ok
rdb_saves:0
aof_enabled:0
aof_rewrite_in_progress:0
$ redis-cli -p 6399 lastsave
(integer) 1790903507
```

`rdb_changes_since_last_save` 是自上次成功快照以来的修改次数，也就是自动 `save` 条件的判断依据；`lastsave` 返回最后一次成功快照的 Unix 时间戳。AOF 开启时还会出现 `aof_current_size`、`aof_base_size`、`aof_pending_bio_fsync` 等字段。

## 小结

RDB 与 AOF 在源码里共享同一套 fork + COW 骨架：rdb.c 生成全量快照，aof.c 追加命令日志并周期性重写。7.0 的 multi-part AOF 把“快照 + 增量”统一成 base/incr/manifest 三类文件；混合持久化（`aof-use-rdb-preamble`，5.0 起默认开启）决定 base 文件采用 RDB 还是命令格式。后面两节分别深入 RDB 与 AOF 的实现细节。
