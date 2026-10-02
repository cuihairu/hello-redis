# 模块系统

## 概述

模块系统（2.0 引入，`src/module.c` 单文件超过一万行）让第三方以共享库的形式把新数据类型、命令、API 扩展直接编译进 Redis 进程：模块与核心共享同一个事件循环和同一份内存，没有进程间通信开销，也因此与核心同样"免锁"——所有模块回调都在主线程执行。本章是模块部分的总览，细节见《模块系统概述》与《自定义模块的实现》。

## 模块如何"住进"Redis

模块是一个普通动态库（`.so`），导出 `RedisModule_OnLoad`（可选 `RedisModule_OnUnload`）。服务器调用 `dlopen()` 打开文件，定位入口并执行（`moduleLoad()`，`module.c` 约 12461 行）。加载成功的命令立刻进入命令表，与内置命令无差别：

```bash
$ redis-cli -p 16390 module load /tmp/mod/bd_hello.so
OK
$ redis-cli -p 16390 bd.hello
Hello from module
$ redis-cli -p 16390 command count
269
```

命令与类型注册经由 `MODULE` 子命令体系管理：

```bash
$ redis-cli -p 6399 module list        # 实例自带 vectorset（Redis 8 内置模块）
name
vectorset
ver
1
```

安全上，`MODULE LOAD/UNLOAD` 受 `enable-module-command` 控制（默认关闭，可设为 `yes`/`local`），未启用时返回：

```text
ERR MODULE command not allowed. If the enable-module-command option is set to "local", you can run it from a local connection, ...
```

## 模块能提供什么

1. **新命令**：`RedisModule_CreateCommand()` 注册处理函数，写法与核心命令一致（argc 检查、`addReply*`、读写键）。实测注册后 `COMMAND COUNT` 增加，`COMMAND INFO bd.hello` 显示 flags 与 ACL 类别。
2. **新数据类型**：`RedisModule_CreateDataType()` 注册一个 9 字符类型名，附带 `rdb_save/rdb_load/free/mem_usage/digest` 回调，于是 RDB、AOF、复制、`TYPE`、`OBJECT ENCODING` 全部自动支持。实测类型名与编码：
   ```text
   TYPE bd:c        ->  bdcount-t
   OBJECT ENCODING  ->  raw
   MEMORY USAGE     ->  41
   ```
3. **异步能力**：定时器（`RedisModule_CreateTimer`）、阻塞命令（`RedisModule_BlockClient`）、键空间事件订阅，以及供自建线程使用的线程安全上下文（`RedisModule_GetThreadSafeContext`、`RedisModule_ThreadSafeContextLock`）。
4. **进程内集成**：模块配置项（7.0 起 `RedisModule_RegisterBoolConfig` 等）、服务器事件订阅、`INFO modules` 段（实测输出 `module:name=bd_hello,ver=1,api=1,filters=0,usedby=[],using=[],options=[]`）、模块间依赖（`using/usedby` 字段）。

## API 获取机制

`redismodule.h` 不直接链接任何符号：`RedisModule_Init()` 先调用服务器传入的 `RedisModule_GetApi("RedisModule_XXX")`，把函数指针表逐个填好。这个间接层是模块 ABI 稳定性的基石——服务器端函数签名变化不影响已编译模块，旧头文件编译的模块也能在新版本上加载（API 版本号 `REDISMODULE_APIVER_1` 记录这一兼容性）。

## 与持久化、复制的关系

模块类型的数据随 `rdb_save` 回调进入 RDB，`rdb_load` 回调还原；AOF 重写走命令重放（模块命令本身被写进 AOF）。这带来两个运维约束（均在本地实测）：

- **副本/新实例必须先加载同名模块**，否则 RDB 里的模块类型无法识别，同步直接失败：
  ```text
  # Internal error in RDB reading offset 0 -> The RDB file contains module data
  I can't load: no matching module type 'bdcount-t'
  ```
- **含模块类型键的模块无法 `MODULE UNLOAD`**：
  ```text
  ERR Error unloading module: the module exports one or more module-side data types, can't unload
  ```

## 小结

模块系统的设计核心是"同一个进程、同一个事件循环、一套自省 API"：命令表、数据类型、RDB/AOF、复制、`INFO`/`COMMAND` 自省对模块一视同仁。代价是必须与核心线程模型保持一致——所有回调在主线程执行，任何阻塞都会阻塞整个服务器，这也是模块文档反复强调"不要在回调里做耗时操作"的根源。
