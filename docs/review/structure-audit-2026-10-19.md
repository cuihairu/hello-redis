# hello-redis 文档结构审计（2026-10-19）

范围：只读核查现有目录、Markdown、`docs/SUMMARY.md`、VitePress sidebar 与可运行的构建命令；本次只新增本报告。目录统计按 `docs/` 的直接子目录递归汇总 `.md` 文件及其行数，排除 `docs/.vitepress` 内配置/数据文件；另列 docs 根部散页。

## 量化事实

### docs 下一级目录

| 一级目录 | Markdown 数 | 总行数 | 备注 |
|---|---:|---:|---|
| `advanced/` | 17 | 1,744 | 进阶配置、持久化、高可用、安全 |
| `advanced-topics/` | 8 | 493 | 进阶主题专题 |
| `appendix/` | 5 | 526 | FAQ、术语、参考、命令参考 |
| `basics/` | 54 | 6,285 | 入门、操作与数据类型命令 |
| `development/` | 14 | 2,481 | 客户端、集成与项目实践 |
| `operations/` | 9 | 1,064 | 运维监控、备份与排障 |
| `redis-compatible/` | 11 | 639 | 兼容实现与项目条目 |
| `scripts/` | 27 | 2,278 | Lua 与模块脚本 |
| `source-code-analysis/` | 31 | 3,160 | 源码专题及其子章节 |
| `use-cases/` | 45 | 4,054 | 场景专题及其子章节 |
| `.vitepress/` | 0 | 0 | 配置、sidebar 数据、主题、缓存与构建产物目录，不是内容目录 |
| `public/` | 0 | 0 | 静态图片、图标与徽章 |
| **目录小计** | **221** | **22,724** |  |

docs 根部还有 `SUMMARY.md`（222 行）、`index.md`（33 行）、`knowledge.md`（179 行），共 3 篇、434 行；全 docs 合计 224 篇、23,158 行。README 均计入所在目录。

### 并行组织轴

按“读者如何找到内容”的不同依据，当前可辨认 **5 套组织轴**。这些轴有交叉，不能把条目数相加当作独立文档数。

| 组织轴 | 目录/入口 | 条目数 | 命名规律 | 有无编号 | 编号连续性 |
|---|---|---:|---|---|---|
| 编号章节（全书目录） | `docs/SUMMARY.md` | 8 个编号部分，另有 3 个无编号末尾入口 | `第N部分：主题`；后接“进阶话题、附录、知识点总纲” | 有 | 第1–8部分连续；第8部分后改为无编号入口。证据：`docs/SUMMARY.md:1,198-222` |
| 主题目录（主体内容） | `basics/`、`scripts/`、`advanced/`、`development/`、`operations/`、`source-code-analysis/`、`use-cases/`、`redis-compatible/`、`advanced-topics/`、`appendix/` | 10 个一级内容目录 | 小写英文 kebab-case 主题名，目录内放概览/章节 | 无 | 不适用 |
| 指南/入口页 | 上述目录中的 `README.md`，以及 docs 根 `index.md`、`knowledge.md` | 12 个 README + 2 个根入口页 | README 既作目录也作介绍；根入口分别为首页、知识总纲 | 部分标题带“第N部分” | README 中的部分编号与 SUMMARY 对应；入口页并无统一编号 |
| 命令/API/参考 | `basics/` 的数据类型概览与命令子目录；`scripts/lua/`；`appendix/command-reference.md` | 9 个核心数据类型目录；27 个基础命令页；另有 Lua 命令专题和 1 篇汇总命令参考 | 数据类型/命令名（如 `string/set.md`、`hash/hset.md`），另有 `command-reference.md` | 文件名不编号；正文常用序号分节 | 文件名不适用；正文序号各自从 1 开始，属于局部序号 |
| 历史/时间线专题 | `docs/basics/history-and-development.md` | 1 篇 | `history-and-development` 单页放在 basics 主题目录 | 无 | 不适用 |

API 目前是 `use-cases/rate-limiting/api.md` 一篇场景实践页，不存在独立 `api/` 目录；“API”因此是内容标签，不是完整的目录轴。配置中 sidebar 是由 `SUMMARY.md` 映射而来，见 `docs/.vitepress/config.mts:17-20,37-39`，所以章节编号与主题目录不是两套互不相关的目录树，而是目录映射与物理分层的叠加。

### 编号抽查

- Markdown 文件名/目录名中以数字开头的前缀：**0 个**，因此没有文件级跳号、重复号或断档（不是遗漏数字的问题）。
- 全书编号只在 `docs/SUMMARY.md` 的部分标题中发现：第 **1、2、3、4、5、6、7、8** 部分，连续、无重复、无跳号（`docs/SUMMARY.md:1-1`、`:55`、`:82`、`:99`、`:113`、`:122`、`:153`、`:198`）。
- 章节标题与正文列表中的数字（如“1. 概述”“1. 操作步骤”）是各篇文档内部局部编号，出现重号是局部重新编号，不构成全库编号冲突。无证据表明这是文件序号。

### Sidebar 对账

检查实际文件 `docs/.vitepress/sidebar.json`（由 `docs/.vitepress/config.mts:2,39` 引入），递归提取 222 个唯一 sidebar 链接，并按 VitePress 的 `.md` 页面/目录 `README.md` 规则映射：

| 对账项 | 数量 | 条目 |
|---|---:|---|
| 配置了但对应文件不存在 | 0 | 无 |
| 文件存在但未进入 sidebar | 1 | `docs/index.md`（首页由 `docs/.vitepress/config.mts:26-35` 的顶栏“首页” `/` 入口承载，属于合理例外） |

结论：导航与页面映射整体对齐，没有发现 sidebar 指向丢失页面或遗漏普通内容页的证据。

### 具体问题与证据

严重度说明：高=用户导航/主要内容定位直接受损；中=重复入口、分类边界或维护方式造成持续困惑；低=表面一致性、无需立即整理。

| 严重度 | 发现 | 证据路径/行号 |
|---|---|---|
| 中 | **场景内容有主题重叠、分散在扁平页和子目录。** 缓存同时有 `cache.md`、`caching.md` 和 `cache/strategies.md`、`cache/web-app.md`；限流同时有 `rate-limiting.md`、`rate-limiting/strategies.md`、`rate-limiting/api.md`，另外开发篇还有实现页；会话管理同时有 `session-management.md`、`session-storage.md`、`session-management/*`。读者需要判断“总览/策略/案例”边界。 | `docs/use-cases/README.md:8-15`；`docs/use-cases/cache.md`、`docs/use-cases/caching.md`、`docs/use-cases/cache/strategies.md`；`docs/use-cases/rate-limiting.md`、`docs/use-cases/rate-limiting/strategies.md`、`docs/use-cases/rate-limiting/api.md`；`docs/development/rate-limiter.md`；`docs/use-cases/session-management.md`、`session-storage.md`、`session-management/` |
| 中 | **编号总纲后混入未编号尾部专题。** 8 个连续部分之后附加“进阶话题、附录、知识点总纲”，并非数字跳号，但读者无法从总纲层级判断它们是第9/10部分、补充材料，还是独立入口。 | `docs/SUMMARY.md:198-222`；VitePress 映射说明称“7 个部分 + 未入目录散页”，与当前目录第8部分的兼容实现及三个无编号末尾入口不完全吻合：`docs/.vitepress/config.mts:37-39` |
| 低 | **总览页/目录页命名职责混用。** `README.md` 有时是章节本身，有时主要是目录清单；sidebar 显示标题取自 SUMMARY，首页/总纲则独立存在。README 作为目录入口本身可理解，但维护者需分辨正文与导航底稿。 | `docs/development/README.md:2-16`；`docs/use-cases/README.md:2-19`；`docs/SUMMARY.md:1-3,198-222`；`docs/.vitepress/config.mts:17-20` |
| 低 | **命名风格存在小范围差异，但文件路径主体较一致。** 路径多数为小写英文 kebab-case（`source-code-analysis`、`rate-limiting`），而显示标题混用中英文/英文术语与空格（如 Cache-Aside、HyperLogLog、API）；个别内容 slug 带过长复合词。未发现大小写目录并存或数字前缀命名冲突。 | `docs/use-cases/caching.md`；`docs/basics/hyperloglog.md`；`docs/use-cases/user-follow-recommendation-relationships.md`；`docs/SUMMARY.md:9,69,187` |
| 低 | **根目录双 README 是语言版本，不是重复副本。** `README.md` 与 `README.zh.md` 同处仓库根，语言内容不同，且第3行已互链；无需改动。 | `README.md:1`、`README.zh.md:1`（仓库根） |
| 低 | **VitePress 文档页并无单独 API 目录，参考内容位置分散。** 基础命令按数据类型，脚本命令按 Lua，命令总参考独立放在附录；这是多种查阅方式的交叉，而非“API 目录漏建”。 | `docs/basics/README.md`；`docs/scripts/lua/README.md`；`docs/appendix/command-reference.md`；`docs/use-cases/rate-limiting/api.md` |

### 死链核实

尝试运行 `npm run docs:build`。**未核实死链**：构建命令未能启动，环境返回 `sh: 1: vitepress: not found`；当前环境没有安装项目依赖。配置明确 `ignoreDeadLinks: false`（`docs/.vitepress/config.mts:20`），因此安装依赖后可用正常构建作为链接门禁。本报告不把静态正则对 Markdown/VitePress 绝对路径的误判计为死链。

### 根目录杂散文件

- 仓库根有 `README.md` 与 `README.zh.md` 两份语言入口，不是重复文件；两者第3行已互链，当前语言入口合理。
- 未发现根目录临时 Markdown、备份/副本 Markdown 或临时命名文件。根目录主要配置与源码仓库文件不属于文档结构问题。
- `docs/` 根有 `SUMMARY.md`（mdbook 遗留映射底稿，配置明确排除构建）、`index.md`、`knowledge.md` 三篇散页；这 3 篇中前两类入口有不同用途，知识总纲与 appendix/主题目录存在交叉索引可能，但不应仅因位于根部就删除。证据：`docs/.vitepress/config.mts:17-20,26-39`。

## 判断与推荐

### 结论：5 套组织轴，收敛为 3 层

建议保留三层：

1. **主目录层：** 以主题目录和稳定 URL 为唯一物理归属；每篇只设一个权威正文位置。
2. **导航层：** 保留一本主目录（sidebar/SUMMARY 二选一作为编辑源，另一份自动生成或只读），编号只作为可选展示标签。不要再让“第几部分”承担文件路径身份。
3. **查阅层：** 将 API 命令参考、专题指南、历史时间线作为目录中的索引入口/标签组织，不各自复制一套目录体系；引用统一链接到权威正文。

推荐将当前 5 种发现方式归并为“主题归属 + 导航目录 + 跨主题索引”3 层，因为 VitePress 已将 SUMMARY 映射为 sidebar，链接对账结果全绿，现有物理主题目录大体可用。一次性删并章节并无数据依据；先澄清重复主题的内容边界，再决定是否合并。章节编号 1–8 连续，目录命名主体一致，均不需要为“看起来整齐”而重命名。

### 其实不乱、不用动

- **文件级编号：** 没有数字前缀文件，不存在需要补号/改号的问题。
- **第1–8部分连续性：** 编号连续、无跳号或重复，不需重新编号。
- **主题目录主体：** 10 个一级内容目录语义可辨，主体文件名统一小写 kebab-case，结构无需整体推倒重来。
- **sidebar 文件映射：** 222 个条目全部能对应现有页面；`index.md` 是由顶栏承载的首页例外。无需大规模补链或改路径。
- **按命令/数据类型分组：** 基础数据结构及其命令页位于一起，Lua 命令页位于 Lua 专题；对查命令的读者合理。
- **根 README 双语言版本：** 两份 README 语言不同且已互链，不应当作重复文件删除。
- **SUMMARY 保留：** 配置把它排除在 VitePress 页面构建之外，且作为历史/映射底稿有明确用途；是否移除要先确认迁移工作流不再依赖它。

## 三期收口方案

| 阶段 | 动作清单 | 影响范围 | 风险（链接/搜索/外链） | 用户拍板 |
|---|---|---|---|---|
| 一期：不改链接的机械整理（目标 1 小时） | 在 docs 首页或知识总纲加入“按主题/按命令/按场景”入口说明；修正 config 注释中“7 个部分”与当前目录的陈旧表述；做一次清单式核对，维持现有路径。README 语言切换已存在，不需补做。 | 根 README、`docs/index.md`、`docs/knowledge.md`、`docs/.vitepress/config.mts` 注释。 | **低**：不动 URL、不删页、不改 sidebar 链接；搜索索引内容有小幅变化。 | 不必为机械编辑逐项拍板；**是否保留 mdbook `SUMMARY.md` 作为映射底稿需拍板**，若保留则只更新注释与说明。 |
| 二期：统一导航源并处理重定向 | 确认 SUMMARY/sidebar 谁是编辑源；建立生成或校验流程；把 8 部分与无编号专题的层级说清；决定首页是否加入 sidebar（当前顶栏已有入口）；若移动任何页面，保留旧路径兼容页/重定向并检查站内引用。 | `docs/SUMMARY.md`、`docs/.vitepress/sidebar.json`、`docs/.vitepress/config.mts`、`docs/index.md` 与可能迁移的页面。 | **中**：新导航会改变用户点击路径；移动页面可能影响搜索索引、已有书签与外链，需保留重定向至少一个发布周期。 | **必须拍板**：主目录源文件、首页是否加入 sidebar、编号是否仅展示；任何 URL 移动与重定向策略。 |
| 三期：章节删并与内容深度重构 | 对缓存、限流、会话、实时分析、消息队列等重复主题逐篇确定权威页；拆清基础原理/用例/开发实现；删并前迁移内容并留重定向；重审 `advanced-topics/` 与 `source-code-analysis/` 边界，统一专题入口和搜索标题。 | `docs/use-cases/`、`docs/development/`、`docs/advanced-topics/`、`docs/source-code-analysis/`、对应 SUMMARY/sidebar 与交叉链接。 | **高**：内容合并可能改变页面标题、锚点、搜索权重和外链；遗漏迁移会造成实质死链或信息丢失，应逐页核对并保留旧 URL。 | **必须拍板**：哪些内容保留为独立章节、各主题权威归属、是否接受删并/改名及旧链接维护期限。 |

## 最该先做的三件事

1. **修正文档入口说明**：说明 1–8 是连续章节、后续“进阶话题/附录/知识总纲”是补充入口，并修正 sidebar 来源注释的“7 个部分”陈旧数字（`docs/SUMMARY.md:198-222`、`docs/.vitepress/config.mts:37-39`）。
2. **给重复主题做归属表，不先搬文件**：优先缓存、限流、会话管理，标明总览/策略/实战/开发实现各自职责（证据见上表 `docs/use-cases/README.md:8-19` 和 `docs/development/rate-limiter.md`）。
3. **在有依赖的环境跑构建并设为重构前门禁**：当前 `vitepress` 缺失，死链状态未核实；配置已启用死链失败策略（`docs/.vitepress/config.mts:20`）。
