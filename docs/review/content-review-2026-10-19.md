# hello-redis 结构改动内容复核（2026-10-19）

## 复核范围

执行 `git fetch origin` 与 `git pull --rebase origin main`：工作区原本干净，拉取结果为 `Already up to date`。按仓库实际最近 4 个提交复核：

- `fda0c30` docs: audit documentation structure
- `e090330` Clarify sidebar navigation source（A）
- `b1f109e` Clarify overlapping use case notes（B）
- `beb9ebc` Correct outdated document references（C）

比较范围为 `HEAD~4..HEAD`。本复核只新增本报告，并修复下列明确内容遗漏；不改上述提交历史。

## 四项核查结论

### 1. 内容丢失 — 发现 1 处，已修

`b1f109e` 将 [cache.md](../use-cases/cache.md) 原第 3 行中“命中率从 90% 提到 99%，回源查询量降至十分之一”的独有量化示例整体删去。该示例在权威页 [caching.md](../use-cases/caching.md) 未出现，确属遗漏。已在 `cache.md:3` 恢复，并改写为条件例子：命中率 90%→99% 对应未命中回源量降为十分之一，避免读成所有场景都能达到的保证。前：只保留一般性的命中率/回源取舍；后：补回数字关系并标明“例如”。

其余被删段落逐项到对应页核对：

- 缓存穿透、击穿、雪崩定义和对策：删自 `cache.md` 的内容可在 `caching.md:79-83` 找到；缓存页保留场景成本并链接权威展开。
- 会话 Hash、随机会话键、TTL/滑动续期：分别在 `session-storage.md:138-153,203-208`；会话固定攻击在 `session-management/best-practices.md:91-93`。
- 实时指标结构与命令：在 `real-time-analytics.md:250-275`；事件聚合链路在 `real-time-analysis/data-processing.md`。
- List/Streams/ZSET 队列语义：在 `message-queues.md:5-36,85` 和 `task-queue/design.md:10-19`；异步/延迟案例仍链接至 `task-queue/async-tasks.md`。
- 排行榜及计数器命令：分别在 `leaderboards.md` 与 `counters.md`；原索引页现在链接两处。

`SUMMARY.md` 从 222 行精简为 5 行，正文改为导航维护说明；sidebar 导航项移入/保留在其唯一源 `docs/.vitepress/sidebar.json`。未发现内容性目录条目被当作正文删除的证据。

### 2. 表述被改错 — 未发现明确错误；一项计数口径需说明

- `advanced-topics/README.md:3` 将“第6部分”改为“本专题”；sidebar 中该专题确为无编号入口，改写正确。
- `README.md`、`README.zh.md` 没有宣称文档篇数或目录数量，未发现 README 计数错误。
- 结构审计报告 `structure-audit-2026-10-19.md:9-25` 的 224 篇统计是 A/B/C 改动前的结构审计基线（其中 SUMMARY 仍按旧 222 行计，且未将新报告计入统计）；不能用作本次改动后的当前篇数。当前 `docs/` 有 226 个 Markdown 文件、11 个直接内容目录（排除 `.vitepress` 与 `public`，包含两个 review 报告）。这不是 README 数字错误，但该旧报告的数字不应被引用为当前计数。
- 本次改写句子逐条复核后，未发现把“不支持”改成“支持”或反转技术含义的证据。限流两篇的新增导读分别描述 API 网关固定窗口案例与开发实现多种策略，和页面内容一致。

### 3. 链接与导航 — 侧栏映射通过；内容主题抽查通过

- sidebar 新增/保留的 222 个链接均映射到现存 Markdown 页面，唯一链接 222 个，缺失 0 个；人工检查缓存、会话、实时分析、队列、限流互链，目标页面与链接文字主题相符。
- `SUMMARY.md` 指向 `.vitepress/sidebar.json` 的相对路径从 `docs/` 解析正确；`config.mts:2,37-38` 导入并使用此侧栏源。
- `config.mts:17-20` 将 `SUMMARY.md` 从 VitePress 构建排除，精简 SUMMARY 不会生成/改变页面 URL。
- **未核实**：本次未在本地运行 VitePress 构建，因此未以构建器独立验证 Markdown 正文中的全部链接及锚点；本结论基于目标改动涉及链接的人工检查和 sidebar 文件映射核对。结构审计报告后加的“构建通过”记录不在本次环境中重跑确认。

### 4. 其他结构改动 — 导航职责一致

改动将 sidebar 明确为唯一编辑源，`SUMMARY.md` 留作不参与构建的说明页；新侧栏条目均在现存文件中。B 改动后的总览页保留不同视角的边界，并指向展开页。未发现导航标题指向主题不同的现存页面。

## 发现的问题清单

| 严重度 | 问题 | 证据 | 修复状态 |
|---|---|---|---|
| 中 | 缓存总览中独有的 90%→99% 命中率量化例子被删且未迁移 | `b1f109e` 的 `docs/use-cases/cache.md:3`；权威页 `docs/use-cases/caching.md` 无此例；修复后 `cache.md:3` | 已修；`e381297` |
| 低 | 结构审计统计为改动前基线，易被误当当前篇数 | `docs/review/structure-audit-2026-10-19.md:9-25`；当前计数 225 篇、11 个内容目录 | 未改旧报告；本报告注明适用口径 |

未发现的方面与未核实项已分别在上述对应章节标出；无须用户拍板的争议删并项。

## 结论

这批改动**暂不能视为已验收**：发现 1 处明确内容遗漏并已在工作区修复；修复和本报告提交、推送完成后，可将该遗漏视为关闭。正文全量死链/锚点构建检查未核实。
