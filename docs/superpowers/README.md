# i-do 二开文档归口说明

本文件是 `docs/superpowers/` 的目录约定与索引：二开相关的现状说明、改动记录、规划方案、详细设计与决策记录统一放在本目录，不再散落到 `docs/` 的其它位置。

上游机制文档（架构、子系统、用户指南等）仍以 `docs/` 下既有文件为准，本目录只写「相对上游的差异」与「二开自己的决定」。

配套文档：[项目总览](project-overview.md)、[二开修改清单](fork-changes.md)、[一期二开方案](phase-1-rebrand-plan.md)。

## 1. 目录用途

本目录只回答四类问题：这个系统现在是什么样（现状说明）、相对上游改了什么（改动记录）、准备做什么（规划方案）、某个功能具体怎么做与为什么这么选（详细设计与决策记录）。

判定一份内容该不该放进来，只问一句：**它是否只对 i-do 这个二开分支成立**。只对二开成立的，放本目录；对上游同样成立且上游已有权威文档的，指向上游文件，不在这里复写。

本目录的文档不参与产品运行时，也不作为代码生成的输入；修改本目录不影响任何构建产物。

## 2. 目录结构

```text
docs/superpowers/
├── README.md                    # 本文件：归口约定与索引
├── project-overview.md          # 现状说明（总览，单份）
├── fork-changes.md              # 改动记录（单份，持续追加）
├── phase-1-rebrand-plan.md      # 规划方案（一期，尚未迁入 plans/）
├── 目录结构.md                  # 现状说明（仓库目录树与逐目录职责）
├── inventory/                   # 文件盘点清单（TSV）与切块索引
├── file-notes/                  # 文件级职责索引（按目录分册）
├── modules/                     # 现状说明（模块分册）
│   ├── 00-consistency-review.md
│   ├── 01-agent-runtime.md
│   ├── 02-tools-execution.md
│   ├── 03-models-and-config.md
│   ├── 04-web-client.md
│   ├── 05-plugin-ecosystem.md
│   ├── 06-hosts-and-sdks.md
│   ├── 07-collaboration-scheduling.md
│   └── 08-infrastructure.md
├── plans/                       # 规划方案（当前为空）
└── specs/                       # 详细设计（当前为空）
```

`plans/` 与 `specs/` 已建但为空；`decisions/` 尚未建立，全目录没有任何决策记录文件（见第 7 节）。

## 3. 文档分类与归口

| 类别 | 位置与命名 | 写什么 | 不写什么 |
| --- | --- | --- | --- |
| 现状说明（总览） | `project-overview.md`（固定名，只此一份） | 产品定位、用户场景、仓库结构、架构总览、关键业务流程、模块地图、技术栈、运行方式 | 计划与未落地的设计；与上游完全一致且上游已有权威文档的机制细节 |
| 现状说明（模块分册） | `modules/NN-<主题>.md` | 单个模块的职责边界、关键接口与类型、数据流、与相邻模块的交互、源码取证行号 | 上游机制文档的全文搬运；跨模块的排期与分工 |
| 改动记录 | `fork-changes.md`（固定名，只此一份） | 仓库与分支关系、上游同步流程、逐文件改动清单（含状态与冲突风险）、冲突处理规则、变更记录 | 设计论证、排期、未落地的想法 |
| 规划方案 | `plans/phase-<N>-<主题>.md` | 目标与边界、分期拆分、决策点与默认值、实施步骤概要、风险、交付物、验收方式 | 逐行实现细节（放 `specs/`）；已完成事项的流水账（放改动记录） |
| 详细设计 | `specs/<主题>-design.md` | 某个功能怎么做：数据结构、接口契约、时序、迁移与回滚、测试点、边界条件 | 优先级与排期；与上游无关的通用知识 |
| 决策记录 | `decisions/NNNN-<主题>.md` | 为什么这么选：背景、候选方案、结论、影响与后续约束（模板见第 9 节） | 实现步骤；已经写进规划方案的完整论证 |
| 核对与评审报告 | 暂放 `modules/00-consistency-review.md`；同类文件增多时建议新建 `reviews/` | 多份文档之间的一致性核对结论、争议事实的代码判定结果、需要作者确认的条目 | 新的现状描述；未经代码核实的推测 |

分类只按「文档回答什么问题」判定，不按写作时间或作者判定。一份文档如果同时承担两类职责，拆成两份并在开头互相链接。

## 4. 文件命名约定

- 文件名只用小写 ASCII 字母、数字与连字符，不使用中文、空格、下划线；已有文件保持原名，不做重命名。
- 子目录名固定为复数名词：`modules/`、`plans/`、`specs/`、`decisions/`；不再新增同级目录，确有需要先在本文件登记。
- `modules/` 用两位数字前缀表达阅读顺序，`00` 保留给索引、核对报告一类的附属文件。
- `decisions/` 用四位数字前缀按时间递增，编号一经分配不复用，废弃记录保留文件并把状态改为「已废弃」。
- `plans/` 用 `phase-<N>-<主题>.md`，`<N>` 为一期序号；一份方案一期一份文件，不分拆成多份。
- `specs/` 用 `<主题>-design.md`；同一主题的设计与方案同名，便于对照（`plans/phase-2-sync.md` ↔ `specs/sync-design.md`）。
- 文件名表达主题，不表达日期；日期写在正文或决策记录的头部字段里。
- `project-overview.md` 与 `fork-changes.md` 的路径被仓库内多处引用，永不改名、不移动。

## 5. 写作要求

- 正文用中文；代码路径、包名、命令、配置键保持原样，中英文之间留一个空格。
- 事实以代码为准：涉及行为的结论尽量给出包路径与 `文件:行号`；与上游 `docs/` 描述冲突时以代码为准，并在文中注明冲突点。
- 每份文档开头写一行「本文回答什么问题」，随后给出「配套文档」的相对链接，便于从任一入口跳转。
- 章节使用 `## N. 标题` 与 `### N.M 标题`，能表格化的对照信息优先用表格，不用长段落罗列。
- 状态统一为三态：`已落地`、`进行中`、`计划中`，与 [fork-changes.md](fork-changes.md) 的修改清单保持一致。
- 不确定的内容单列「待确认」小节，正文不做推测；一旦从代码确认，从该节移除并在正文补上依据。
- 相对链接以当前文件所在目录为基准；提交前逐条用 `Test-Path -LiteralPath` 拼绝对路径验证，确认全部为 `True`。
- 一个自然段或一个列表项写成一行，不做手工硬换行，否则 [verify-md-wrap.ts](../../scripts/verify-md-wrap.ts) 会拒绝跨行段落。
- 不写敏感信息：`.env`、密钥、令牌、服务器登录信息一律不落文档，只写文件位置与用途。
- 记录历史结论时保留原值与日期，不用「最新」「目前」这类会过期的表述替代具体版本号。

## 6. 现有文件索引

| 文件 | 类别 | 内容摘要 | 状态 |
| --- | --- | --- | --- |
| [project-overview.md](project-overview.md) | 现状说明（总览） | 定位与用户场景、仓库结构、架构总览、业务流程、模块地图、Web UI 功能地图、数据模型、技术栈、运行方式、二开现状、待确认 | 现行 |
| [modules/00-consistency-review.md](modules/00-consistency-review.md) | 核对与评审报告 | 9 份文档的交叉核对：模块边界冲突、同一事实的多种说法、待确认项回收，逐条给出建议处理 | 现行 |
| [modules/01-agent-runtime.md](modules/01-agent-runtime.md) | 现状说明（模块分册） | Agent 循环、会话与日志、工具管线、上下文压缩、workflow、钩子、待确认 | 现行 |
| [modules/02-tools-execution.md](modules/02-tools-execution.md) | 现状说明（模块分册） | 工具注册与命名、权限预设与审批、沙箱与执行隔离、工具实现包分布、后台作业执行面 | 现行 |
| [modules/03-models-and-config.md](modules/03-models-and-config.md) | 现状说明（模块分册） | 模型提供方接入、配置树与设置、凭据引用、身份、遥测、typert 类型通道 | 现行 |
| [modules/04-web-client.md](modules/04-web-client.md) | 现状说明（模块分册） | 前端包结构、Slot 拼装机制、页面与功能地图、对话交互、审批/附件/交付物、待确认 | 现行 |
| [modules/05-plugin-ecosystem.md](modules/05-plugin-ecosystem.md) | 现状说明（模块分册） | 配置树心智模型、profile/bundle/patch 三层叠加、HMR、声明格式、skill 与 mcp、experimental、插件市场生成器 | 现行 |
| [modules/06-hosts-and-sdks.md](modules/06-hosts-and-sdks.md) | 现状说明（模块分册） | CLI、Web、Electron 桌面端、host 与 webserver、api 与 Typert RPC、ACP、两个 SDK、native、各载体共享与特有实现 | 现行 |
| [modules/07-collaboration-scheduling.md](modules/07-collaboration-scheduling.md) | 现状说明（模块分册） | subagent、team、schedule、jobs、spill、feedback 六组包的语义与生命周期 | 现行 |
| [modules/08-infrastructure.md](modules/08-infrastructure.md) | 现状说明（模块分册） | storage、workspace、util、ssh、test-support、benchmarks、scripts 门禁、patches 与 vendor、website | 现行 |
| [fork-changes.md](fork-changes.md) | 改动记录 | 仓库与分支关系、上游同步流程、逐文件改动清单与冲突风险、冲突处理规则、同步后校验、变更记录 | 持续更新 |
| [phase-1-rebrand-plan.md](phase-1-rebrand-plan.md) | 规划方案 | 一期目标与边界、品牌触点盘点、仓库搭建与远程覆盖、品牌替换实施步骤、风险、交付物、命令速查；文首有进度勾选项 | 进行中 |

索引按「类别 → 阅读顺序」排列，新增文件时在第 6 节表格末尾追加一行，并同步更新所属类别的计数说明（当前：现状说明 10 份、核对报告 1 份、改动记录 1 份、规划方案 1 份、详细设计 0 份、决策记录 0 份）。

## 7. 缺口与建议

### 7.1 明显缺失的类别

- **决策记录整体缺失**：目录内没有任何 `decisions/` 文件。[phase-1-rebrand-plan.md](phase-1-rebrand-plan.md) 第 1.3 节的 D1–D8 是「待业务方确认的决策点与建议默认值」，记录的是待定选项，不是已决结论；不要把它直接拆成决策记录，等实际决策后按第 9 节模板补写。
- **详细设计为空**：`specs/` 下没有文件，一期的实现细节目前写在方案的「品牌替换实施步骤」里，未独立成篇。某个功能涉及多文件联动或需要回滚方案时，应在动手前补一份 `specs/<主题>-design.md`。
- **规划方案未归位**：`plans/` 已建但为空，唯一的规划文档仍在根目录（见 7.2）。
- **没有同步上游后的文档回写约定**：目前只有 [fork-changes.md](fork-changes.md) 的「变更记录」表承担部分职责，没有规定现状说明类文档何时需要跟随上游重写。

### 7.2 建议迁移（仅记录，未执行）

| 文件 | 建议位置 | 理由 | 迁移成本与风险 |
| --- | --- | --- | --- |
| [phase-1-rebrand-plan.md](phase-1-rebrand-plan.md) | `plans/phase-1-rebrand-plan.md` | 规划方案应有独立归口，`plans/` 已建但空；根目录只留下总览与改动记录两份固定名文件 | 被 `README.md`、`README.zh.md`、[fork-changes.md](fork-changes.md)、[project-overview.md](project-overview.md)、[scripts/translation-pairing.manifest.json](../../scripts/translation-pairing.manifest.json) 及 `.trae/documents/` 下的历史计划引用，需同步改链；建议在上游同步空档一次性执行，避免与上游改动交叉 |
| [modules/00-consistency-review.md](modules/00-consistency-review.md) | 新建 `reviews/00-consistency-review.md` | 它是核对报告而非模块现状，与 01–08 并列容易被误读为第 0 篇模块分册 | 需先检查 01–08 的互链是否指向该文件；暂无第二份核对报告，暂缓执行 |

本文件只登记建议，不改变任何现有文件的位置；确需迁移时单独开一次改动，改完重新验证全部相对链接。

### 7.3 本目录特有的文档门禁

- [scripts/translation-pairing.manifest.json](../../scripts/translation-pairing.manifest.json) 以「逐个文件」方式排除本目录的中文单语文档（当前 13 条），不是目录通配；新增任何 `.md` 都会进入翻译配对范围，需按同样方式在 `excluded` 中补一行，不另造 `.zh.md` 配对文件。
- 现状：本目录全部文件（含本 `README.md` 与 [modules/00-consistency-review.md](modules/00-consistency-review.md)）均已列入 `excluded`，`pnpm exec tsx scripts/verify-translation-pairing.ts` 通过，无 `missing ... (required)` 记录。
- 链接层面另有 `verify-md-links` 会检查 `docs/**/*.md` 的相对链接，与本文件第 5 节的手工 `Test-Path` 校验互为补充。

## 8. 新增文档检查清单

1. 归类：对照第 3 节确认文档回答的是哪一类问题，选定目录与文件名。
2. 开头：写一行「本文回答什么问题」，并给至少一条配套文档链接。
3. 正文：结论标注源码路径与行号；未确认的内容移入「待确认」。
4. 链接：以文件所在目录为基准拼相对路径，逐条 `Test-Path -LiteralPath` 验证。
5. 门禁：把新增文件加入 [scripts/translation-pairing.manifest.json](../../scripts/translation-pairing.manifest.json) 的 `excluded`（按路径字母序插入），不造 `.zh.md` 配对文件；然后运行 `pnpm run test:docs`。
6. 索引：在第 6 节表格追加一行，并更新类别计数。
7. 回写：若该文档对应实际改动，同步更新 [fork-changes.md](fork-changes.md) 的修改清单与变更记录，并在方案文首勾选进度。

## 9. 决策记录模板

新建 `decisions/NNNN-<主题>.md` 时使用下列骨架，段落各占一行，删除不适用的条目：

```markdown
# 决策 NNNN · <主题>

- 状态：提议 / 已采纳 / 已废弃
- 日期：YYYY-MM-DD
- 相关：<指向方案或设计文档的相对链接>

## 背景

要解决什么问题、约束是什么、不决策会付出什么代价。

## 候选方案

| 方案 | 做法 | 优点 | 代价 |
| --- | --- | --- | --- |

## 结论

选哪个、为什么；若有条件，写清触发条件。

## 影响

需要同步修改的文件、文档与流程；对上游同步的影响；后续需要复查的时间点。
```

## 10. 待确认

- 本目录是否需要登记到 [docs/AGENTS.md](../AGENTS.md) 的文档标准，或进入 `website/` 文档站导航：当前本文件只对齐了硬换行与链接校验两项要求，其余关系未见明文约定。
- 新增 `README.md` 的翻译配对处理已定为「加入排除列表」，与目录内其他中文单语文档口径一致，见 7.3；是否长期维持单语形态尚无结论。
- `plans/`、`specs/` 为空目录，git 不跟踪空目录，是否在版本库中保留这两个位置尚无结论。
- `modules/` 是否继续按「一个模块一份」拆分到 09 以后：目前 01–08 已覆盖主要领域，后续按新增能力补篇还是合并回总览，尚无统一判断。
