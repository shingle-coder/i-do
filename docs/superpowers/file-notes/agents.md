# `.agents` 文件说明

范围：`.agents/` 全量，对应清单 `docs/superpowers/inventory/agents-01.tsv`（2,999 行）、`agents-02.tsv`（1,092 行）、`agents-03.tsv`（50 行），合计 **4,141 行 / 4,141 个文件**，173,743 行文本、21.0 MB，占全仓 19.3%。

同层文档：[project-overview.md](../project-overview.md)、[08-infrastructure.md](../modules/08-infrastructure.md)（`scripts` 与工程化）。

## 0. 标注规则

- **精读**：实际打开文件逐行读过，结论来自正文。
- **结构判断**：只依据路径、扩展名、清单统计、门禁脚本与 git 元数据推断，未逐篇阅读正文。
- **待确认**：证据不足，不写成结论。

`notes/` 下 1,361 篇笔记不逐篇精读。做法是：目录级按四阶段 × 六分类聚合；每个目录给出篇数、行数、时间跨度、命名规律、主题与代表样本。真正承载规则的 8 个文件逐个精读并列行。

---

## 1. 结论先行：`.agents` 到底是什么

### 1.1 两个半边，性质不同

`.agents/` 只有两个子目录，但一个参与运行时，一个是纯资料库：

| 子目录 | 文件数 | 谁读它 | 性质 |
|---|---|---|---|
| `.agents/skills/` | 50 | 产品运行时（技能加载器）+ 开发期编码 Agent | **运行时规则** |
| `.agents/notes/` | 4,091 | 构建脚本、CI 门禁、人类与 Agent 读写 | **决策资料库**，产品运行时不加载 |

判断依据：

1. [skill-filesystem 的 index.ts](file:///D:/ai/deepseek/i-do/packages/skill/skill-filesystem/src/index.ts) 把项目根 `<project>/.agents/skills`（`PROJECT_AGENTS_RANK = 200`）与用户根 `<agentsHome>/skills`（`USER_AGENTS_RANK = 500`）都注册为技能来源，扫描其中的 `SKILL.md` 及其 `references/`、`templates/`、`scripts/`。项目根 rank 更小，先被检索，同名技能项目级覆盖用户级。
2. `packages/`、`apps/` 的产品 TypeScript 代码里没有读取 `.agents/notes` 的路径常量；只有 `scripts/` 下的 `agent-note-tree.ts`、`verify-agent-note-format.ts`、`verify-archived-agent-notes.ts`、`archived-agent-notes.ts` 在读它，外加文档门禁（链接、i18n 配对、markdown 卫生）。产品代码与包 README 里出现的 `.agents/notes/...` 全部是注释或文档超链接式的**引用**（例如 `packages/workspace/workspace/src/index.ts` 的 TODO 指向归档笔记），不是运行时 I/O。
3. 因此：**`skills/` 会被执行；`notes/` 不会进入任何请求上下文，是"写给未来的人和 Agent 看的 RFC 库"**。它影响产品行为的方式只有一个——Agent 读到 `notes/README.md` 后按规则写/改笔记，再由门禁校验。

补充定位：`.agents/` 默认不是用户级 agents home（那是 `~/.agents`，可用 `DSH_AGENTS_HOME` 覆盖）。仓库根这一份是**项目级** agents home，只有当 Agent 在本仓库内工作时才被发现。

### 1.2 `notes` 与 `archived` 的区别：有规则，不是随手丢

- `proposed/`、`implemented/`、`rejected/` 是活跃工作区，笔记会随状态在三个目录间移动。
- `archived/` 是**冻结历史树**：只收已实现笔记，封存后永久不可编辑、不可翻译、不可重排、不可移动、不可删除。
- 归档门槛写在 [notes/README.md](file:///D:/ai/deepseek/i-do/.agents/notes/README.md#L36-L42)，由四个东西共同保证：README 规则、[archived/AGENTS.md](file:///D:/ai/deepseek/i-do/.agents/notes/archived/AGENTS.md)、`dsh-archive-agent-notes` 技能（校准流程，明确反对按字数/时间/配额归档）、`verify-archived-agent-notes` 门禁 + sha256 清单。

进入归档的条件（三条同时满足）：已实现且决策完成；其理由不太可能再指导未来工作；记录仍有历史决策价值。反面规则同样明确：只描述小 UI 调整或纯机械改动的笔记应当**删除**而不是归档；`proposed/` 笔记永不归档（过期就 reject 或删除）；`rejected/` 笔记只在还能阻止一个诱人的错误时保留。

### 1.3 有没有索引文件

**有意禁止中心索引**，这不是遗漏：

- [agent-note-tree.ts](file:///D:/ai/deepseek/i-do/scripts/agent-note-tree.ts#L46-L50) 一旦在 `.agents/notes/` 根看到 `INDEX.md`，直接报错 `centralized Agent Note indexes are forbidden`。
- 索引职责被拆给"路径编码 + 少量契约文件"：生命周期和分类都在路径里，日期在文件名里，`Status:` 在正文首部，git 保存其余历史。
- 唯一的机器清单是 [archived/manifest.json](file:///D:/ai/deepseek/i-do/.agents/notes/archived/manifest.json)：2,786 行，2,781 条 `路径 → sha256`，与 927 篇归档笔记的三联体数量精确对应。

### 1.4 `.claude/skills` 那个 17 字节文件说明什么

```
120000 2b7a412b8fa0fb7e985b0793321bd4e698f2b6cd 0   .claude/skills
```

Git 模式 `120000` 表示**符号链接**，blob 内容就是 `../.agents/skills`（17 字节）。所以：

- `.agents/skills` 是技能的唯一真源，`.claude/skills` 只是让 Claude Code 能找到同一批技能的别名，避免两份拷贝漂移。
- 在 Windows 上若未启用符号链接（`core.symlinks=false`，普通非管理员终端即如此），Git 会把符号链接落成一个普通文本文件——本项目工作区当前就是这种状态。此时 Claude Code 无法通过它发现技能，但它仍是仓库里的正确表达，不影响 DSH 运行时（运行时直接读 `.agents/skills`）。

---

## 2. 顶层结构

```
.agents/
├── skills/                     50 个文件 / 22 个技能 + 1 条忽略规则
└── notes/
    ├── README.md               规则总纲（125 行）
    ├── README.zh.md            中文对照（131 行）
    ├── README.i18n.yaml        配对记录（46 行）
    ├── AGENTS.md               目录级触发规则（7 行）
    ├── proposed/               144 个文件 / 48 篇
    ├── implemented/            1,136 个文件 / 378 篇
    ├── rejected/               24 个文件 / 8 篇
    └── archived/               2,783 个文件 / 927 篇 + 清单
```

| 目录 | 文件数 | 英文笔记 | 英文行数 | 时间跨度 | 标注 |
|---|---:|---:|---:|---|---|
| `.agents/skills` | 50 | — | 4,696 | 无日期语义 | 逐文件精读表 |
| `.agents/notes/proposed` | 144 | 48 | 3,946 | 2026-06-11 – 2026-11-06 | 精读根文件 + 聚合 |
| `.agents/notes/implemented` | 1,136 | 378 | 26,375 | 2026-06-11 – 2026-11-09 | 同上 |
| `.agents/notes/rejected` | 24 | 8 | 355 | 2026-06-16 – 2026-07-26 | 同上 |
| `.agents/notes/archived` | 2,783 | 927 | 43,496 | 2026-06-11 – 2026-10-14 | 同上 |
| 根级契约文件 | 4 | — | 309 | — | 逐个精读 |

每篇笔记固定是一个三联体：`yyyy-mm-dd-topic-title.md`（英文正文）+ `.zh.md`（中文逐节对照）+ `.i18n.yaml`（配对记录与哈希）。1,361 × 3 = 4,083，加上 8 个非笔记文件，正好 4,091。

---

## 3. `notes` 的规则体系（精读：[README.md](file:///D:/ai/deepseek/i-do/.agents/notes/README.md)）

### 3.1 两条轴都编码在路径里

`{lifecycle}/{class}/yyyy-mm-dd-topic-title.md`

**生命周期（status）**：

| 目录 | 含义 | 移动规则 |
|---|---|---|
| `proposed/` | 已评审但未实现（或只实现了一部分） | 可实现→`implemented/`，可否决→`rejected/` |
| `implemented/` | 决策已随代码落地 | 必须与代码同步更新事实（路径、符号、默认值） |
| `rejected/` | 考虑过并被否决 | 冻结提案原文，否决理由写在 `Status:` 行 |

**分类（kind，封闭集合）**，新增分类必须同时改 `agent-note-tree.ts` 与 README：

| 分类 | 覆盖什么 |
|---|---|
| `feature` | 新的用户可见或模型可见能力 |
| `bug-fix` | 修缺陷，或补上复盘暴露的缺口 |
| `simplification` | 删代码/行为/表面积，不新增能力（`refactor` 故意缺席） |
| `architecture` | 关于**已发布源码**的结构决策：包怎么关联、运行时词汇是什么 |
| `process` | 代码**周边**的工具、政策、流程（门禁、包管理器、vendor） |
| `testing` | 测试基础设施与策略 |

文件名日期是**首次提出**时间（按 git 历史），不是归档时间。

### 3.2 文件格式（由 `verify-agent-note-format` 强制）

前三行固定：

```markdown
# Agent Note: <title>

Status: <status>
```

`Status:` 只有三种形态，且必须与所在目录一致：`proposed` / `implemented` / `rejected — <一行理由>`。正文骨架按生命周期固定：

- `proposed/`：`## Problem` → `## Proposal` →（自由技术节）→ `## Alternatives considered` → `## Acceptance criteria` → `## Risks`
- `implemented/`：`## Problem` → `## Decision` →（自由技术节）→ `## Alternatives considered` → `## Consequences`。禁止出现 `## Proposal`、`## Plan`、`## Migration plan`、`## Acceptance criteria`（提案期词汇）。
- `rejected/`：保留提案原文，只要求头部、`## Problem`、`## Proposal` 与备选方案节。

`## Alternatives considered` 是**强制节**；2026-07-05 之前且无法重建备选方案的旧笔记，用一行固定 HTML 注释占位。

### 3.3 归档时的允许改动

只允许四件事：移动完整三联体；在**两种语言**的 `Status: implemented` 下插入同一行 `Archived: YYYY-MM-DD`；重记 sidecar；修复或删除 inbound link。标题标点、空行布局、语言切换措辞都不因归档而改。

封存后唯一被授权的后置修正是 [archived/AGENTS.md](file:///D:/ai/deepseek/i-do/.agents/notes/archived/AGENTS.md#L9) 记录的 Figma 链接移除：`archived/feature/2026-08-10-durable-workflow-runs-in-chat` 的英文、中文、配对文件各有三条精确的 old→new 例外，不允许任何其他内容变化。

---

## 4. `skills/` 逐文件

22 个技能、50 个文件，合计 4,696 行。技能按"何时用"触发，正文是操作契约；`references/` 是细则，`templates/` 是脚手架，`scripts/` 是可执行工具（含 pytest 单测，说明技能不只是提示词）。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---:|---|
| `.gitignore` | 忽略规则 | 1 | 忽略 `*/agents/openai.yaml`（Claude/Codex 侧生成物） |
| `agent-experience/SKILL.md` | 技能 | 6 | 写模型可见工具定义、设计技能与上下文加载时的信息可发现性；正文只是指针，规则真源在 `packages/preset/agent-preset/skills/dsh-doc/references/tool-design.md` |
| `cordis-styling-nitpicking/SKILL.md` | 技能 | 65 | Cordis 插件代码评审：单例状态、未回滚副作用、清理依赖早于消费者释放；只报有证据的 P0 |
| `dsh-archive-agent-notes/SKILL.md` | 技能 | 68 | 新增/审计/修剪/归档/恢复 Agent Note 的校准流程：超集检查、删除机械改动、按未来决策价值分级、执行冻结三联体与清单规则 |
| `dsh-ci-test-reliability/SKILL.md` | 技能 | 131 | 设计与诊断在 CI 并发、共享资源、时钟、全局状态、子进程、异步拆除下可能不确定失败的测试 |
| `dsh-ci-test-reliability/references/ci-flake-diagnosis.md` | 参考 | 60 | CI 偶发失败的诊断手册与证据采集步骤 |
| `dsh-client-ui-ux/SKILL.md` | 技能 | 119 | DSH 可见 UI 的对齐、间距、图标、视觉基底、几何与交互设计评审 |
| `dsh-client-ui-ux/references/alignment.md` | 参考 | 32 | 对齐规则 |
| `dsh-client-ui-ux/references/icons.md` | 参考 | 60 | 图标选择与绘制规则 |
| `dsh-client-ui-ux/references/spacing.md` | 参考 | 19 | 间距刻度 |
| `dsh-code-review/SKILL.md` | 技能 | 63 | 本仓 PR 评审：AGENTS.md 约定、防御式写法、ADR、质量门禁，以及代码本身看不出的评审项 |
| `dsh-create-upgrade-guide/SKILL.md` | 技能 | 54 | 破坏外部可感知面（CLI、profile、配置键、持久数据、SDK/wire API、包入口）时编写 `docs/upgrade-guide/v<version>/<item>/guide.md` |
| `dsh-cua-macos-signing/SKILL.md` | 技能 | 78 | 从源码使用 Computer Use 的 macOS 开发者配置固定签名密钥，避免每次重建都重新授权 |
| `dsh-cua-macos-signing/scripts/signing_identity.py` | 脚本 | 258 | 生成/复用签名身份并写入配置的 CLI |
| `dsh-cua-macos-signing/scripts/signing_e2e.py` | 脚本 | 77 | 端到端签名与授权验证 |
| `dsh-cua-macos-signing/scripts/test_signing_identity.py` | 脚本测试 | 335 | 签名身份脚本的 pytest 用例 |
| `dsh-doc-writing/SKILL.md` | 技能 | 132 | 本仓 Markdown 文档、包 README、文档站的创建/重组/评审/迁移：受众优先、YAML 元数据、双语行对齐、摘要与目录导航、事实核验 |
| `dsh-doc-writing/references/structure-hierarchy.md` | 参考 | 87 | 文档树层级与页面归属 |
| `dsh-doc-writing/references/style.md` | 参考 | 49 | 行文风格 |
| `dsh-doc-writing/references/review.md` | 参考 | 67 | 文档评审清单 |
| `dsh-doc-writing/references/metadata-links-i18n.md` | 参考 | 78 | 元数据、链接与双语配对规则 |
| `dsh-doc-writing/references/website-sync.md` | 参考 | 95 | 文档与网站页面的同步关系 |
| `dsh-doc-writing/templates/package-library.md` | 模板 | 96 | 库类包的 README 骨架 |
| `dsh-doc-writing/templates/package-bundle.md` | 模板 | 103 | 组合/发行包的 README 骨架 |
| `dsh-doc-writing/templates/package-group.md` | 模板 | 59 | 包组概览骨架 |
| `dsh-doc-writing/templates/package-reference.md` | 模板 | 103 | 参考型包文档骨架 |
| `dsh-doc-writing/templates/persistence-change.md` | 模板 | 73 | 持久化变更文档 |
| `dsh-doc-writing/templates/persistence-format.md` | 模板 | 25 | 持久化格式文档 |
| `dsh-doc-writing/templates/persistence-release.md` | 模板 | 30 | 持久化发布说明 |
| `dsh-doc-writing/templates/upgrade-guide.md` | 模板 | 29 | 升级指南骨架 |
| `dsh-error-handling/SKILL.md` | 技能 | 47 | 设计/评审失败路径：错误类与错误码、工具失败、恢复、重试、后台任务、用户可见报错 |
| `dsh-error-handling/references/error-codes.md` | 参考 | 120 | 错误码总表与分配规则 |
| `dsh-find-simplifications/SKILL.md` | 技能 | 65 | 找有证据的简化点（死代码、重复、投机抽象、过度维护的基础设施），写或合并简化提案 |
| `dsh-find-simplifications/references/historical-patterns.md` | 参考 | 45 | 历史简化模式与判例 |
| `dsh-merging-stacked-prs/SKILL.md` | 技能 | 127 | 落地依赖栈 PR（A←B←C），要求使用 GitHub 官方 stacked-PR 能力，由 GitHub 负责顺序/CI/重定向/合并态 |
| `dsh-official-plugin-artwork/SKILL.md` | 技能 | 30 | 官方插件图标与功能预览图的绘制与评审（不含工具栏/动作图标） |
| `dsh-pr-description/SKILL.md` | 技能 | 204 | 本仓 PR 描述规范：各节定义、Issue 引用、测试设计、变更披露、AI 使用等级与徽章、更新时机 |
| `dsh-pre-push-checks/SKILL.md` | 技能 | 138 | 推送前按出站 diff 选择最小测试与检查集，不反射式跑全量；含 `gh stack sync` 重写后的复检 |
| `dsh-prose-standard/SKILL.md` | 技能 | 81 | 本仓行文标准：Markdown、JSDoc、代码/测试注释、提示词、描述、诊断信息、CLI/UI 字符串该写到什么程度 |
| `dsh-prose-standard/references/examples.md` | 参考 | 169 | 正反例对照 |
| `dsh-responsive-ui/SKILL.md` | 技能 | 61 | 响应式客户端布局：移动/触摸检测、截断、标题换行、纯图标控件、移动端 hover、tooltip 与宽度变化时的焦点 |
| `dsh-session-projection/SKILL.md` | 技能 | 32 | 创建/扩展/评审会话投影，或把会话派生恢复状态迁进投影 |
| `dsh-speed-up-perf/SKILL.md` | 技能 | 92 | 性能调查与优化、合成基准与 CI 性能门禁、长会话/Web 响应性剖析、把性能证据转成可测量改造 |
| `dsh-translate-docs/SKILL.md` | 技能 | 74 | 手动执行扩展版双语文档流程：生成简报、委派译文、整篇翻译、限定范围配对校验 |
| `dsh-trim-cot-leakage/SKILL.md` | 技能 | 45 | 清理泄漏的推理痕迹：`(decision N)`、审计编号、未提交草稿的 §N、"used to/no longer" 式变更叙述、评审视角、控制流叙述、犹豫的计划残渣 |
| `dsh-trim-cot-leakage/references/examples.md` | 参考 | 275 | 推理泄漏正反例 |
| `dsh-trim-cot-leakage/references/recall-batteries.md` | 参考 | 52 | 召回测试集 |
| `record-browser-gif/SKILL.md` | 技能 | 147 | 把浏览器/Web UI 交互录成优化 GIF 并 `gh --attach` 附到 PR；产品用户可见的 GUI 改动必须附真实服务录制 |
| `record-browser-gif/scripts/encode_gif.py` | 脚本 | 337 | 确定性 GIF 编码（调色板、抖动、分片，>5 MiB 自动拆片） |
| `record-browser-gif/scripts/test_encode_gif.py` | 脚本测试 | 103 | 编码脚本的 pytest 用例 |

---

## 5. `notes` 逐文件与聚合

### 5.1 根级与生命周期根文件（8 个，全部精读）

| 文件 | 类型 | 行数 | 职责 |
|---|---|---:|---|
| `notes/README.md` | 索引/规则 | 125 | Agent Note 总纲：布局与命名、六分类定义、归档与删除、何时写、文件格式（头部/骨架/强制备选方案）、生命周期移动、中文对照 |
| `notes/README.zh.md` | 中文对照 | 131 | 上文的逐节中文版，机器校验的头部 token 保持英文原文 |
| `notes/README.i18n.yaml` | 配对记录 | 46 | `README.md` 与 `README.zh.md` 的配对元数据（章节映射与哈希） |
| `notes/AGENTS.md` | 规则 | 7 | 目录级触发：每篇新笔记强制做超集检查，同类决策就地更新而非新建；归档走 `dsh-archive-agent-notes`；`archived/` 不可当现行权威 |
| `notes/implemented/AGENTS.md` | 规则 | 13 | 已实现笔记必须与代码同步：路径/符号/默认值/机制在原文件改写，不追加变更历史；只改事实不改决策，反转决策须新开笔记并双向链接 |
| `notes/implemented/CLAUDE.md` | 指针 | 1 | 内容仅 `AGENTS.md`，供只认 `CLAUDE.md` 的工具复用同一规则 |
| `notes/archived/AGENTS.md` | 规则 | 9 | 冻结契约：不可编辑/重排/翻译/修复/删除/移动；归档只允许四类改动；用 `--write` 追加封存哈希；记录 Figma 链接的三条精确例外 |
| `notes/archived/manifest.json` | 清单 | 2,786 | 归档封存账本：`version` + 2,781 条 `路径 → sha256`，追加式，禁止改写历史条目 |

### 5.2 `proposed/`（48 篇 / 144 文件 / 3,946 行）

| 目录 | 篇数 | 英文行数 | 时间跨度 | 命名规律与主题 | 代表样本 |
|---|---:|---:|---|---|---|
| `proposed/architecture` | 15 | 1,672 | 2026-07-19 – 2026-10-09 | `yyyy-mm-dd-kebab-topic.md`；运行时结构、取消语义、会话数据兼容、依赖生命周期 | `required-cancellation-through-tool-capability-seams`、`semantic-composer-chain-phases`、`session-data-compatibility`、`cordis-cleanup-dependency-lifetimes` |
| `proposed/bug-fix` | 1 | 38 | 2026-08-20 | 同上；单篇，附件读取隔离 | `attachment-read-quarantine` |
| `proposed/feature` | 12 | 1,407 | 2026-06-30 – 2026-11-06 | 同上；工具输入重写、桌面更新策略、扩展桥、聊天历史消费 | `pre-tool-input-rewrite`、`desktop-update-policy-and-installation`、`pi-extensions-bridge`、`chat-history-consumption` |
| `proposed/process` | 6 | 361 | 2026-06-11 – 2026-08-20 | 同上；供应链、包清单、文档质量等工程流程 | `supply-chain-and-vendor-drift`、`discover-package-inventory`、`remove-packed-session-fixture-migrator`、`audience-first-documentation-quality` |
| `proposed/simplification` | 12 | 397 | 2026-09-17 – 2026-10-18 | 同上；削面、去中间层、声明化 | `defer-office-background-scheduling`、`shell-env-key-declarations`、`prune-stream-visibility-helpers`、`borrow-auto-review-inputs` |
| `proposed/testing` | 2 | 71 | 2026-06-11（同日两篇） | 同上；测试策略提案 | `mutation-testing`、`deterministic-and-stress-testing` |

同族说明：全部为英文原稿 + 中文对照 + sidecar 三联体，无例外；无 `AGENTS.md` 等根文件。

### 5.3 `implemented/`（378 篇 / 1,136 文件 / 26,375 行）

| 目录 | 篇数 | 英文行数 | 时间跨度 | 命名规律与主题 | 代表样本 |
|---|---:|---:|---|---|---|
| `implemented/architecture` | 226 | 17,082 | 2026-06-11 – 2026-11-09 | `yyyy-mm-dd-kebab-topic.md`；全仓最大的决策库：会话事件溯源、运行时与插件、工具能力缝、持久化 | `event-sourced-sessions`、`desktop-bundled-runtime-and-external-plugins`、`structured-draft-initialization`、`cua-program-tool` |
| `implemented/bug-fix` | 21 | 889 | 2026-09-06 – 2026-11-07 | 同上；安装/打包、预设复用、委派工具、UI 响应性缺陷 | `packed-install-private-npm-cache`、`reused-blank-runs-requested-preset`、`shared-preset-delegation-tools`、`forge-changes-view-responsiveness` |
| `implemented/feature` | 59 | 4,476 | 2026-06-15 – 2026-11-05 | 同上；PTC、消息适配器、插件市场、评审草稿 | `ptc`、`deepseek-messages-adapter`、`plugin-market-index-format`、`forge-pending-review-drafts` |
| `implemented/process` | 38 | 2,114 | 2026-07-21 – 2026-11-04 | 同上；CI 排布、Windows 运行时、包分类、入口导出约定 | `serial-cross-platform-ci-reference`、`python-runtime-windows-hosted`、`product-package-classification`、`plugin-entry-value-exports` |
| `implemented/simplification` | 16 | 613 | 2026-06-20 – 2026-11-02 | 同上；合一、单一持久化格式、预设归属、延迟失败语义 | `unify-agent-and-session-id`、`jsonl-only-session-persistence`、`preset-owned-subagent-composition`、`deepseek-deferred-tool-failures` |
| `implemented/testing` | 18 | 1,201 | 2026-06-19 – 2026-10-11 | 同上；真实 API e2e、性能预算、子环境、凭据匹配 | `real-api-e2e-ci`、`frontend-performance-budgets`、`plugin-manager-git-child-environment`、`user-text-credential-matching` |

同族说明：除 `AGENTS.md`、`CLAUDE.md` 两个根文件外，全部为三联体。`architecture` 占 60%，是全仓决策密度最高的目录；行数中位数 43 行，最长一篇 710 行。

### 5.4 `rejected/`（8 篇 / 24 文件 / 355 行）

| 目录 | 篇数 | 英文行数 | 时间跨度 | 命名规律与主题 | 代表样本 |
|---|---:|---:|---|---|---|
| `rejected/architecture` | 1 | 75 | 2026-06-16 | 同上；类型化事件 schema | `typed-event-schemas` |
| `rejected/simplification` | 7 | 280 | 2026-06-20 – 2026-07-26 | 同上；被否决的削减/替换：截断中断回合、去掉持久步骤边界、依赖替换、手写 sleep | `truncate-interrupted-turns`、`drop-durable-step-boundaries`、`dependency-swaps-rejected-by-nih-audit`、`builtin-timer-promises-for-hand-rolled-sleeps` |

同族说明：每篇都是"提案原文 + `Status: rejected — 理由`"，保留提案期章节（含 `## Acceptance criteria`）。

### 5.5 `archived/`（927 篇 / 2,781 文件 + 2 个根文件 / 43,496 行）

| 目录 | 篇数 | 英文行数 | 时间跨度 | 命名规律与主题 | 代表样本 |
|---|---:|---:|---|---|---|
| `archived/architecture` | 185 | 11,051 | 2026-06-11 – 2026-09-24 | `yyyy-mm-dd-kebab-topic.md`；早期运行时结构、请求级配置、读意图、Web 调度 | `runtime-arg-validation`、`request-level-llm-config-credentials`、`session-log-read-intent`、`web-default-schedule-composition` |
| `archived/bug-fix` | 182 | 6,928 | 2026-07-19 – 2026-09-24 | 同上；Windows 原子写、上下文计量、手势门、锁接管 | `windows-atomic-write-dacl-preservation`、`context-meter-blind-to-compaction`、`composer-gesture-editable-gate`、`exited-holder-lock-takeover` |
| `archived/feature` | 307 | 15,307 | 2026-06-14 – 2026-10-14 | 同上；ACP 多会话、轨迹账本、导出、插件预览——体量最大 | `acp-multi-session`、`trajectory-inspection-ledger`、`web-export-command-and-dialog`、`built-in-plugin-feature-previews` |
| `archived/process` | 121 | 5,036 | 2026-06-11 – 2026-09-23 | 同上；构建器替换、翻译契约、工具移除、配对记录 | `tsdown-over-dumble`、`translation-prompt-v4-contract`、`remove-knip`、`section-keyed-translation-pairing-records` |
| `archived/simplification` | 93 | 3,582 | 2026-06-19 – 2026-09-26 | 同上；去可变摘要、折叠状态、单编辑器、直连收件箱 | `drop-mutable-session-summary`、`collapse-persistence-flush-state`、`default-presets-single-editor`、`team-direct-inbox` |
| `archived/testing` | 39 | 1,592 | 2026-06-11 – 2026-09-28 | 同上；属性测试、execa、拆除预算、观测态等待 | `property-based-testing`、`execa-for-test-subprocess-plumbing`、`subagent-teardown-test-budgets`、`detail-close-waits-on-observed-state` |

同族说明：全部保留 `Status: implemented` 并在其下多一行 `Archived: YYYY-MM-DD`；中文对照与 sidecar 一并封存。目录内另有两个根文件：`AGENTS.md`（9 行）和 `manifest.json`（2,786 行）。

---

## 6. 覆盖校验

| 校验项 | 结果 |
|---|---|
| 清单行数 vs 实际文件 | 4,141 = 4,141（`git ls-files .agents` 同为 4,141，无未跟踪文件） |
| 分块对账 | `agents-03.tsv` 50 = `skills/` 50；`agents-01/02` 合计 4,091 = `notes/` 4,091 |
| 三联体对账 | 1,361 篇 × 3 = 4,083；加 8 个非笔记文件 = 4,091 |
| 归档账本对账 | 927 篇 × 3 = 2,781 = `manifest.json` 条目数 |
| 重名笔记 | 无（1,361 个英文基名互不重复） |
| 分类目录 | 只出现 6 个合法分类，无越界目录 |
| 例外文件 | 只有 `README*`、`AGENTS.md`、`CLAUDE.md`、`manifest.json`，均在允许清单内 |

---

## 7. 异常项与观察

1. **`.claude/skills` 在本机退化为文本文件**（结构判断 + git 证据）。仓库里它是 mode `120000` 的符号链接，Windows 未启用符号链接时落成 17 字节文本，Claude Code 侧技能发现失效；DSH 运行时不受影响。修复方式是启用开发者模式后重新 checkout，或手动 `mklink`。
2. **归档存在唯一一次"破封"**。`archived/feature/2026-08-10-durable-workflow-runs-in-chat` 因 Figma 链接失效被授权做三条精确替换，规则写在 `archived/AGENTS.md`，例外表在 `scripts/archived-agent-notes.ts`。这是设计内的例外，但它说明"永久冻结"仍需人工维护外部链接。
3. **`rejected/` 已停滞**。8 篇里最晚一篇是 2026-07-26，此后近四个月没有新增，而同期的 `implemented/` 仍在持续增长。可能是否决决策被直接删掉（README 允许"不再阻止错误就删除"），也可能是流程退化——待确认。
4. **两篇 `proposed/testing` 悬置近五个月**（均为 2026-06-11）：`mutation-testing`、`deterministic-and-stress-testing`。按 README，长期未实现的提案应推进或 reject，当前状态待确认。
5. **`proposed/feature` 出现晚于 `implemented/` 同主题的时间点**：最新提案 2026-11-06 仍处于 proposed，而 `implemented/` 最晚为 2026-11-09——说明两条流水线并行，不是"先提案后实现"的严格串行；这符合 README 允许"已决定直接进 implemented"的规则。
6. **技能内容强弱不均**。`agent-experience` 只有 6 行、纯指针，规则真源在产品侧的 `packages/preset/agent-preset/skills/dsh-doc/references/tool-design.md`；其余技能 30–204 行。指针写法本身是防漂移设计，不是缺陷，但阅读时会误以为技能缺失。
7. **归档占了整个 `.agents` 的 94%**（927/1,361 篇、2,781/4,141 个文件）。目录体量主要来自历史，不是活跃工作负载；检索时应优先限定 `proposed/`、`implemented/`。
8. **`notes/README.md` 125 行 vs 中文 131 行**的 6 行差异属正常：中文逐节对照允许行数不同，配对门禁校验的是章节结构与机器 token，不是行数相等。

---

## 8. 待确认

- `rejected/` 长期无新增属于流程选择还是流程缺失（需查 PR 历史才能判断）。
- `proposed/testing` 两篇是否已被后续实现覆盖但未移动（需读正文与相关 PR）。
- `.claude/skills` 符号链接在其他开发者机器（macOS/Linux/启用符号链接的 Windows）上的实际可用性，本机无法验证。
- 归档笔记中是否存在与活跃笔记主题重复但未做超集检查的漏网条目（需逐篇比对主题，成本高，本轮未做）。
