# packages 文件级索引（B 组）

本文件覆盖 `packages-03.tsv`（370 行）与 `packages-04.tsv`（707 行）两份盘点清单，合计 1077 个文件。范围是 `packages/client` 的后半段（ui-theme 起）、`packages/compaction`、`packages/computer-use`、`packages/context`、`packages/core`、`packages/credentials`、`packages/deliverables`、`packages/document`。

本文件是**文件级索引**，不重复 [`modules/`](../modules/) 中已有的架构分析：那里讲"如何协作"，这里只回答"每个文件是什么、负责什么"。

## 标注规则

每个文件标注一种可信度，二者不可混用：

| 标注 | 含义 |
|---|---|
| `精读` | 本人在本轮任务中真正打开文件、读过其实现代码（至少读到关键函数体） |
| `结构判断` | 未读实现，仅依据文件名、所在目录、模块头注释、导出符号和被引用关系推断 |

不确定的职责一律写「待确认」，不做补全式编造。整份文档中 `精读` 的文件只占少数，其余均为 `结构判断`——这是刻意保留的诚实标注，不代表文件不重要。

## 统计口径

- 表格「行数」取自盘点清单（物理行数，含注释与空行）。
- **测试文件按被测对象归组**，一组一行，「行数」列写该组合计；组合内的具体文件在职责列列出。
- `locale/*.json`、`README.md`/`README.zh.md`/`README.i18n.yaml`、`tsconfig*.json`、`tsdown.config.ts`、`*.module.css` 这类重复度高的机械文件，按包合并为一行，并在职责列写明文件个数；合并只影响表格行数，不影响覆盖文件数。测试组的「行数」列是该组清单行数之和，组内文件名在职责列以去扩展名形式列出。
- 二进制（`.woff2`、图片）、快照、fixture 一行带过。
- 超过 500 行的源码在职责后附「结构：」说明，指出内部分块与主入口。

## 覆盖核对

| 范围 | 清单文件数 | 本文件覆盖 | 对应节 |
|---|---|---|---|
| `packages/client`（ui-theme / ui-tool / ui-trajectory / ui-user-questions / ui-workflow-run / ui-workspace / web） | 370 | 370 | 1–7 |
| `packages/compaction`（5 子包 + 根 README） | 92 | 92 | 8 |
| `packages/computer-use`（1 子包 + 根 README） | 19 | 19 | 9 |
| `packages/context`（7 子包 + 根 README） | 128 | 128 | 10 |
| `packages/core`（10 子包 + 根 README） | 267 | 267 | 11 |
| `packages/credentials`（4 子包 + 根 README） | 81 | 81 | 12 |
| `packages/deliverables`（3 子包 + 根 README） | 66 | 66 | 13 |
| `packages/document`（2 子包 + 根 README） | 54 | 54 | 14 |
| **合计** | **1077** | **1077** | |

- 与清单核对：`packages-03.tsv` 370 条 + `packages-04.tsv` 707 条 = 1077，逐包按 `=== packages/...` 分组统计后与上表一致，无遗漏、无重复。
- 标注分布：`精读` 8 个文件（0.74%），`结构判断` 1069 个（99.26%）。8 个精读文件为：`ui-trajectory/src/client/layout.ts`、`compaction-basic/src/region.ts`、`computer-use/src/index.ts`、`context/file-reference/src/index.ts`、`context/harness-dev-context/src/index.ts`、`context/tmux-context/src/index.ts`、`core/agent-loop/src/agent.ts`、`core/tools/src/pipeline.ts`。
- 结构说明：行数 >500 的源码/样式共 31 个（30 个 `.ts`/`.tsx` + 1 个 `.module.css`），均已在职责列附「结构：」；行数 >1000 的测试共 23 个，在 15.2 汇总。

---

## 1. packages/client/ui-theme

浏览器主题与外观偏好的宿主+客户端双层实现：把颜色、圆角、阴影、字体等设计变量收敛为 `--dsw-*` token 样式表，维护 light/dark/system 偏好与字号、字体族偏好，并把「外观」「字体」两组设置行注册到通用设置面板。它只负责解析与发布不可变快照，不直接操作 DOM，实际呈现交给 ui-layout。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | 149/149/58 | 包说明的中英正文与翻译配对配置（3 个文件合并）。 | 结构判断 |
| `src/boot-theme.ts` | 源码 | 64 | 浏览器在插件加载前注入的首屏主题：内嵌持久化偏好、字号与字体族，并用头部 CSS 先给画布上色，避免首帧闪白。 | 结构判断 |
| `src/index.ts` | 源码 | 65 | 宿主侧注册入口，声明主题配置项并把偏好读写接到 Host 用户设置文档。 | 结构判断 |
| `src/theme-settings.ts` | 源码 | 178 | 定义主题偏好的设置命名空间、字段名、内置默认值、字号上下限与字体角色清单。 | 结构判断 |
| `src/client/index.ts` | 源码 | 654 | 主题注册表主入口：持有当前偏好、用 `prefers-color-scheme` 解析 system、生成 token 快照与检查视图。结构：token 类型定义（约 45–180 行）→ `ThemeRuntime` 服务（181 行起）→ 首帧偏好/字号引导函数（443–500 行）→ 图标校验、动态 token、字号快捷键等辅助（515 行之后）。 | 结构判断 |
| `src/client/settings-store.ts` | 源码 | 70 | 外观行与字体行各自的 slot store，只在 apply 世界变更监听器中写入，组件通过 `props.useStore` 读取。 | 结构判断 |
| `src/client/styles.ts` | 源码 | 64 | 把 token 与基础样式表注入文档（`installThemeStyles`）。 | 结构判断 |
| `src/client/icon-sprite.ts` | 源码 | 57 | 生成一个隐藏的 `<svg>` 图标精灵，使 ui-primitives 的图标可用 `<use>` 继承 `currentColor`。 | 结构判断 |
| `src/client/AppearanceRow.tsx` | 组件 | 63 | 「外观」偏好行：标题加三选一偏好方块，选中态跟随持久化值而非解析后的生效主题。 | 结构判断 |
| `src/client/FontFamilyRow.tsx` | 组件 | 66 | 单个字体角色的字体族输入行，失焦或回车时规范化并提交逗号分隔列表，清空则回退内置栈。 | 结构判断 |
| `src/client/FontSettingsGroup.tsx` | 组件 | 57 | 字体设置分组：字号行作为可展开入口，展开后容纳各字体角色行与代码、终端字号行。 | 结构判断 |
| `src/client/FontSizeRow.tsx` | 组件 | 99 | 字号偏好行：数值胶囊、悬停出现的上下调节箭头与 px 单位标签。 | 结构判断 |
| `src/client/locales.ts` | 源码 | 236 | `settings.theme` 命名空间的 8 语种文案表与键类型。 | 结构判断 |
| `src/client/*.module.css` | 样式 | 261（4 文件） | 上述四个设置行组件的局部样式（AppearanceRow、FontFamilyRow、FontSettingsGroup、FontSizeRow）。 | 结构判断 |
| `src/styles/*.css` | 样式 | 1130（9 文件） | 基础 token 与视觉规范：base、brand-font、corner-shape、design-platform（511 行，设计平台变量总表）、focus、gradient-shadow-text、onboarding、scrollbar、shiki。 | 结构判断 |
| `src/styles/montserrat-*.woff2`、`Montserrat-OFL.txt` | 字体/许可 | — | Montserrat 三档字重字体文件与 OFL 许可文本（4 个文件）。 | 结构判断 |
| `tests/theme.client.spec.ts`、`config.host.spec.ts`、`boot-theme.client.spec.ts` | 测试 | 576（3 文件） | 主题服务偏好解析、宿主配置校验、首帧注入内容。 | 结构判断 |
| `tests/apply.client.spec.ts`、`client-styles`、`color-tokens`、`elevation-styles`、`radius-styles`、`scrollbar-styles`、`corner-shape-styles`、`focus-styles`、`focus-ring-styles`、`hover-styles`、`menu-surfaces`、`illustration-colors`、`app-region-styles`、`brand-font`、`stylesheet-scan`、`config.host` | 测试 | 2054（16 文件） | 样式注入与 token 合规扫描：每类视觉变量（颜色、阴影、圆角、滚动条、焦点环、悬停、菜单面、插画色、应用区）各一条，多为对 CSS 文本的断言。 | 结构判断 |
| `tests/appearance-row`、`font-family-row`、`font-size-row`、`font-settings-group`、`settings-store` | 测试 | 472（5 文件） | 设置行组件与 slot store 的交互与快照。 | 结构判断 |
| `tests/icon-sprite.client.spec.ts` | 测试 | 105 | 图标精灵的 symbol 集合与替换逻辑。 | 结构判断 |
| `tests/stylesheet-scan.ts`、`tests/expected/radius-exceptions.expected.json` | 测试辅助 | 171（2 文件） | 样式表扫描器与圆角例外清单 fixture。 | 结构判断 |
| `tests/__snapshots__/theme.client.spec.ts.snap` | 快照 | 22 | 主题快照基线。 | 结构判断 |
| `tsconfig.json`、`tsconfig.client.json`、`tsconfig.host.json`、`tsdown.config.ts` | 配置 | 98（4 文件） | 双端 TS 配置与打包入口（clientBundle）。 | 结构判断 |

## 2. packages/client/ui-tool

工具调用在对话流中的呈现层：按工具名把原始调用与结果归约为行模型（行变体、单行摘要、展开体、结果输出），再交给 ToolCallTree 做父子调用组装与原子视图分发。包内同时提供终端、文件变更、图片、diff、检索、网页、Office、待办等专用卡片，以及 ask-user 交互卡片。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | 157/157/52 | 包说明与翻译配对配置（3 个文件合并）。 | 结构判断 |
| `package.json`、`tsconfig.json`、`tsdown.config.ts` | 配置 | 167（3 文件） | 包元数据、TS 配置、客户端打包入口。 | 结构判断 |
| `locale/*.json` | 文案 | 47（8 文件） | 工具卡片通用文案的 8 语种短表（每语种 5–6 行，实际文案在 `client/locales` 之外）。 | 结构判断 |
| `src/index.ts`、`src/client/index.ts` | 入口 | 10（2 文件） | 宿主加载入口与浏览器插件声明，本身不含逻辑。 | 结构判断 |
| `src/client/apply.ts` | 源码 | 57 | 插件装配：注册工具调用树、详情渲染器与内置原子视图。 | 结构判断 |
| `src/client/contract/slots.ts` | 契约 | 154 | 工具 UI 的 slot 声明与组合后的组件 props 类型（ToolCallView、ToolTree、宿主信息等）。 | 结构判断 |
| `src/client/locale.ts` | 源码 | 2 | 复用会话所有者提供的文案命名空间常量。 | 结构判断 |
| `src/client/tool/ToolCallTree.tsx` | 组件 | 135 | 根调用与子调用的组装，按 key 走一条原子分发路径。 | 结构判断 |
| `src/client/tool/file-menu.ts` | 源码 | 26 | 通过既有 toolview 注册提供工具自有的路径解析注入。 | 结构判断 |
| `src/client/tool/models/tool-call-model.ts` | 源码 | 431 | 行模型核心：变体分类、单行摘要、展开体输入与扁平化结果输出；标签取调用参数，导航/输出/错误取已结算结果。 | 结构判断 |
| `src/client/tool/models/terminal-card-model.ts` | 源码 | 360 | 终端卡片纯模型：命令块、退出码、后台/持久/溢出 shell 的判定与本地化。 | 结构判断 |
| `src/client/tool/models/control-details-model.ts` | 源码 | 253 | agent、job、terminal、语言服务器类工具的实体列表与回执。 | 结构判断 |
| `src/client/tool/models/image-card-model.ts` | 源码 | 223 | 由结果内容与元数据推导图片卡片（尺寸、来源、失败态）。 | 结构判断 |
| `src/client/tool/models/details-card-model.ts` | 源码 | 209 | 待办、目标、日程等已记录值的紧凑详情体。 | 结构判断 |
| `src/client/tool/models/inspection-details-model.ts` | 源码 | 179 | 运行时检查、会话查询与工作流报告的文本化详情。 | 结构判断 |
| `src/client/tool/models/detail-model-shared.ts` | 源码 | 162 | 详情项共享格式化：记录、非空、JSON、徽标、标签、列表。 | 结构判断 |
| `src/client/tool/models/diff-card-model.ts` | 源码 | 119 | 由文件变更调用与结果元数据推导 diff 卡片，并截断最大行数。 | 结构判断 |
| `src/client/tool/models/read-card-model.ts` | 源码 | 119 | 读取卡片的纯模型，含读取行数与行号展示。 | 结构判断 |
| `src/client/tool/models/primitive-labels.ts` | 源码 | 109 | 为无 Cordis 依赖的 UI 原语（代码工具栏、Markdown、diff、读取、检索、网页块）提供本地化文案适配。 | 结构判断 |
| `src/client/tool/models/search-card-model.ts` | 源码 | 100 | grep/glob 结果元数据到检索卡片的纯映射。 | 结构判断 |
| `src/client/tool/models/web-card-model.ts` | 源码 | 100 | web 结果元数据到网页卡片的映射与 fetch 链接还原。 | 结构判断 |
| `src/client/tool/models/todo-history.ts` | 源码 | 89 | 为根调用与嵌套调用建立待办写操作的前序索引。 | 结构判断 |
| `src/client/tool/models/todo-diff-model.ts` | 源码 | 79 | 相对上一次已记录写操作的待办差异。 | 结构判断 |
| `src/client/tool/models/raw-tool-call.ts` | 源码 | 52 | 卡片模型共享的原始调用/结果字段窄化与单段结果文本提取。 | 结构判断 |
| `src/client/tool/models/office-card-model.ts` | 源码 | 48 | 由工具名、冻结调用切片与结算结果推导 Office 行。 | 结构判断 |
| `src/client/tool/models/auto-review-denial.ts` | 源码 | 36 | 自动审查拒绝原因的归一化与本地化。 | 结构判断 |
| `src/client/tool/models/ask-question-card-model.ts` | 源码 | 25 | 提问卡片的纯数据模型。 | 结构判断 |
| `src/client/tool/models/recorded-path.ts` | 源码 | 14 | 从已结算结果中取操作时刻的绝对路径。 | 结构判断 |
| `src/client/tool/components/ToolRow.tsx` | 组件 | 480 | 工具行主体：图标、标题、摘要、展开/折叠与详情挂载。 | 结构判断 |
| `src/client/tool/components/ToolDetails.tsx` | 组件 | 146 | 已记录工具结果的紧凑只读字段与列表展示。 | 结构判断 |
| `src/client/tool/components/QuestionToolRow.tsx` | 组件 | 64 | 提问类工具的摘要动作与转录展开。 | 结构判断 |
| `src/client/tool/components/AskQuestionCard.tsx` | 组件 | 40 | 由校验后的纯卡片数据渲染提问记录。 | 结构判断 |
| `src/client/tool/components/ExitCodeBadge.tsx` | 组件 | 17 | 命令结算后的行内退出状态徽标。 | 结构判断 |
| `src/client/tool/components/*.module.css` | 样式 | 770（5 文件） | 上述组件的局部样式。 | 结构判断 |
| `src/client/tool/toolviews/ask-question-row.tsx` | 视图 | 386 | ask-user 工具行：问题/选项/答复的多段呈现。 | 结构判断 |
| `src/client/tool/toolviews/bash-sample.tsx` | 视图 | 178 | bash 工具行的示例实现（随 `bash-sample.module.css`）。 | 结构判断 |
| `src/client/tool/toolviews/details-row.tsx` | 视图 | 137 | 共享紧凑详情体的键控结果行。 | 结构判断 |
| `src/client/tool/toolviews/file-mutation-row.tsx` | 视图 | 82 | 文件写入/编辑类工具行。 | 结构判断 |
| `src/client/tool/toolviews/GenericToolCard.tsx` | 视图 | 88 | 无专用视图时的兜底工具卡片。 | 结构判断 |
| `src/client/tool/toolviews/office-row.tsx` | 视图 | 70 | Office 文档工具行。 | 结构判断 |
| `src/client/tool/toolviews/plan-summary.ts` | 源码 | 60 | todo_write 行的单行计划摘要，允许多个 in_progress 并存。 | 结构判断 |
| `src/client/tool/toolviews/read-family-row.tsx` | 视图 | 70 | 读取家族（文件/目录）共用卡片。 | 结构判断 |
| `src/client/tool/toolviews/read-image-row.tsx` | 视图 | 64 | 图片读取行。 | 结构判断 |
| `src/client/tool/toolviews/read-row.tsx` | 视图 | 33 | 普通读取行。 | 结构判断 |
| `src/client/tool/toolviews/search-row.tsx` | 视图 | 53 | 检索结果行。 | 结构判断 |
| `src/client/tool/toolviews/todo-row.tsx` | 视图 | 94 | 待办写入行（含计划条与差异）。 | 结构判断 |
| `src/client/tool/toolviews/web-row.tsx` | 视图 | 56 | 网页抓取/搜索行。 | 结构判断 |
| `src/css-modules.d.ts` | 类型声明 | 4 | CSS Module 的 TS 声明。 | 结构判断 |
| `tests/tool-row.client.spec.tsx`、`tool-row-styles`、`preparing-rows`、`coverage-tails`、`assembly-surfaces`、`toolview-slot`、`toolview-type-chain` | 测试 | 1400（7 文件） | ToolRow 行渲染、样式、准备态、slot 装配与类型链。 | 结构判断 |
| `tests/terminal-card`、`spill-policy-terminal` | 测试 | 914（2 文件） | 终端卡片模型与溢出策略。 | 结构判断 |
| `tests/ask-question-row`、`details-models`、`details-row`、`todo-row`、`todo-history` | 测试 | 895（5 文件） | 提问行、详情模型/行、待办行与待办历史。 | 结构判断 |
| `tests/diff-card`、`image-card`、`read-card`、`search-card`、`web-card`、`office-card` | 测试 | 1947（6 文件） | 各类专用卡片模型的快照与边界。 | 结构判断 |
| `tests/tool-call-tree`、`chat-ptc-subcalls` | 测试 | 538（2 文件） | 调用树组装与 PTC 子调用呈现。 | 结构判断 |
| `tests/tool-fixtures.client.ts` | 测试辅助 | 126 | 工具调用/结果 fixture 构造器。 | 结构判断 |

## 3. packages/client/ui-trajectory

会话轨迹（trajectory ledger）视图：把 Session 的持久事件投影成「按 turn 分组」的虚拟化记录表，附带 Chrome Network 风格的时间线概览、折叠工具栏、全文检索索引与记录检查器。宿主侧只保留实时 Session 的工具结果值，浏览器侧通过定义注册表把消息、工具、压缩、请求头等记录类型拆成各自 definition。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | 124/124/49 | 包说明与翻译配对配置（3 个文件合并）。 | 结构判断 |
| `package.json`、`tsconfig.json`、`tsconfig.client.json`、`tsconfig.host.json`、`tsdown.config.ts` | 配置 | 220（5 文件） | 包元数据、双端 TS 配置、客户端打包入口。 | 结构判断 |
| `locale/*.json` | 文案 | 47（8 文件） | 轨迹视图的 8 语种短文案表，每语种 5–6 行。 | 结构判断 |
| `src/index.ts` | 源码 | 127 | 宿主检查器插件：只对仍在运行的 Session 提供工具结果查询与订阅，不落历史缓存。 | 结构判断 |
| `src/types.ts` | 源码 | 14 | 宿主与客户端共享的临时结果检查类型。 | 结构判断 |
| `src/client/index.ts` | 源码 | 115 | 浏览器插件装配：向会话视图贡献一个入口，并注入轨迹服务依赖。 | 结构判断 |
| `src/client/layout.ts` | 源码 | 1149 | 轨迹折叠核心：展开 assistant 块、把 usage 挂到 Message、计算自有耗时、合并进行中的 partial 与 runningCalls、生成分组描述。结构：类型与输入（约 1–140 行）→ `deriveTrajectoryLayout` 主推导（约 180–700 行，逐 turn 生成 group/turn 模型）→ partial 追加与分组描述辅助（700 行之后）。 | 精读 |
| `src/client/locales.ts` | 源码 | 1642 | `trajectory` 命名空间全量文案：zh/en 为源，另附 ja/es/fr/de/ru/pt，导出 `TrajectoryKey` 与翻译函数类型。 | 结构判断 |
| `src/client/TrajectoryTable.tsx` | 组件 | 3607 | 轨迹主表：turn 感知的事件账本、列渲染、行选择与本地记录检查器。结构：props/常量（1–200 行）→ 行与列定义（200–700）→ 记录单元格渲染（700–1900）→ 检查器与交互面板（1900–3000）→ 虚拟化与组合导出（3000 行后）。 | 结构判断 |
| `src/client/TrajectoryTable.module.css` | 样式 | 2086 | 轨迹主表的完整视觉实现（列宽、分组头、检查器抽屉等），单文件体量偏大。 | 结构判断 |
| `src/client/TrajectoryTimeline.tsx` | 组件 | 739 | 概览时间线：操作序列/记录时间两种投影、时间范围刷选与跳转。 | 结构判断 |
| `src/client/TrajectoryTimeline.module.css` | 样式 | 329 | 时间线轨道、刷选窗与刻度样式。 | 结构判断 |
| `src/client/TrajectoryView.tsx` | 组件 | 617 | 轨迹视图外壳：账本上方的紧凑摘要与视图切换。 | 结构判断 |
| `src/client/TrajectoryToolbar.tsx` | 组件 | 147 | 工具栏：时间线开关与账本折叠控制。 | 结构判断 |
| `src/client/TrajectoryToolbar.module.css` | 样式 | 230 | 工具栏样式。 | 结构判断 |
| `src/client/trajectory-snapshot-builder.ts` | 源码 | 320 | 从会话视图快照增量构建轨迹快照，并注册 conversation view 定义。 | 结构判断 |
| `src/client/trajectory-assistant-definition.ts` | 源码 | 472 | assistant 记录的单元格定义（文本块、思考、usage、失败态）。 | 结构判断 |
| `src/client/trajectory-tool-definition.ts` | 源码 | 285 | 工具调用记录的单元格定义与结果摘要。 | 结构判断 |
| `src/client/trajectory-message-definitions.ts` | 源码 | 206 | 用户/系统等消息记录的单元格定义注册。 | 结构判断 |
| `src/client/trajectory-request-header-definition.ts` | 源码 | 151 | 请求头记录（模型、上下文构成）的系统消息态定义。 | 结构判断 |
| `src/client/trajectory-compaction-definition.ts` | 源码 | 143 | 压缩记录的单元格定义与中断错误标记。 | 结构判断 |
| `src/client/trajectory-event-projection.ts` | 源码 | 157 | 持久 Session 事件到账本视图数据的转换：assistant 块、失败态、token delta 判定。 | 结构判断 |
| `src/client/trajectory-record.ts` | 源码 | 149 | 记录数据与格式化契约：单元格种类、指标明细、时长/秒数格式化、记录 id。 | 结构判断 |
| `src/client/trajectory-search-index.ts` | 源码 | 133 | 账本增量全文索引。 | 结构判断 |
| `src/client/timeline.ts` | 源码 | 205 | 时间线的操作序号/时间投影与焦点索引。 | 结构判断 |
| `src/client/trajectory-virtual-rows.ts` | 源码 | 83 | 记录到可测量虚拟行的纯投影与分组。 | 结构判断 |
| `src/client/trajectory-preview.ts` | 源码 | 20 | 有长度上限的 Markdown→纯文本预览。 | 结构判断 |
| `src/client/trajectory-contract.ts` | 契约 | 105 | 轨迹贡献、快照、partial assistant 与请求头状态的公共类型。 | 结构判断 |
| `src/client/trajectory-definition-common.ts` | 源码 | 28 | 记录节点构造的共享小工具。 | 结构判断 |
| `src/client/code-program.ts` | 源码 | 75 | 从已记录的工具参数与 schema 中识别程序源码与语言提示。 | 结构判断 |
| `src/client/watch-tool-result.ts` | 源码 | 49 | 选中结果的订阅封装，避免客户端缓存历史。 | 结构判断 |
| `src/client/duration-store.ts`、`string-wrapping-store.ts` | 源码 | 26（2 文件） | 轨迹耗时与字符串换行偏好的 slot store 工厂。 | 结构判断 |
| `src/client/copy-codes.ts` | 源码 | 4 | 客户端合成记录的稳定非展示标记常量。 | 结构判断 |
| `src/client/TrajectoryCell.tsx` | 组件 | 97 | 单元格壳组件（选中、尺寸、复制入口）。 | 结构判断 |
| `src/client/TrajectoryCell.module.css` | 样式 | 138 | 单元格样式。 | 结构判断 |
| `src/client/TrajectoryGroupHeader.tsx`、`.module.css` | 组件 | 53（2 文件） | 分组头（turn 区间标题）。 | 结构判断 |
| `src/client/TrajectoryTurn.tsx`、`.module.css` | 组件 | 45（2 文件） | 单个 turn 容器。 | 结构判断 |
| `src/client/TrajectoryTurnHeader.tsx`、`.module.css` | 组件 | 83（2 文件） | turn 头部（序号、耗时、状态）。 | 结构判断 |
| `src/client/views.module.css` | 样式 | 32 | 视图级共享样式。 | 结构判断 |
| `src/css-modules.d.ts` | 类型声明 | 6 | CSS Module 的 TS 声明。 | 结构判断 |
| `tests/views.client.spec.tsx`、`cell.client.spec.tsx`、`code-inspector.client.spec.tsx`、`locale.client.ts` | 测试 | 2080（4 文件） | 视图外壳、单元格、代码检查器与测试用 locale 装配。 | 结构判断 |
| `tests/table.client.spec.tsx` | 测试 | 1619 | 轨迹主表的渲染、列、检查器与交互。 | 结构判断 |
| `tests/conversation-definitions.client.spec.ts` | 测试 | 1218 | 消息/工具/压缩/请求头四类记录定义的注册与渲染结果。 | 结构判断 |
| `tests/layout.client.spec.tsx` | 测试 | 819 | 折叠推导（分组、usage、partial、runningCalls）。 | 结构判断 |
| `tests/snapshot-builder.client.spec.ts` | 测试 | 302 | 快照增量构建。 | 结构判断 |
| `tests/tool-results.host.spec.ts`、`watch-tool-result.client.spec.ts` | 测试 | 324（2 文件） | 宿主工具结果查询与客户端订阅。 | 结构判断 |
| `tests/event-projection.client.spec.ts` | 测试 | 70 | 事件→账本数据投影。 | 结构判断 |
| `tests/virtual-rows.client.spec.ts` | 测试 | 95 | 虚拟行分组投影。 | 结构判断 |
| `tests/code-program.client.spec.ts` | 测试 | 128 | 程序源码识别。 | 结构判断 |
| `tests/client-bundle.client.spec.ts` | 测试 | 115 | 客户端 bundle 导出面。 | 结构判断 |
| `tests/string-wrapping-store.client.spec.ts` | 测试 | 26 | 换行偏好 store。 | 结构判断 |

## 4. packages/client/ui-user-questions

ask-user 提问交互的浏览器侧实现：以 selector 路由的 composer 链承载单选/多选/自由文本与计划审阅，维护会话级草稿，并把「已答复的问题」渲染成用户消息气泡；宿主侧刻意不注册面向模型的 `ask_user_question` 工具，只提供 UI 能力。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | 133/133/58 | 包说明与翻译配对配置（3 个文件合并）。 | 结构判断 |
| `package.json`、`tsconfig.json`、`tsdown.config.ts` | 配置 | 156（3 文件） | 包元数据、TS 配置、客户端打包入口。 | 结构判断 |
| `locale/*.json` | 文案 | 47（8 文件） | 8 语种短文案表。 | 结构判断 |
| `src/index.ts` | 源码 | 11 | 宿主侧空实现：说明为何不在全局工具层挂 `ask_user_question`。 | 结构判断 |
| `src/client/contract/slots.ts` | 契约 | 574 | 提问组件 props、待答 Remote waterfall 请求/响应、座位与等待类型。 | 结构判断 |
| `src/client/index.ts` | 源码 | 404 | 浏览器插件：把 QuestionComposer 注册为 conversation-declared composer 链的 selector 路由条目，并挂载 `question` 文案。 | 结构判断 |
| `src/client/QuestionComposer.tsx` | 组件 | 729 | 提问主界面：选项渲染、推荐项解析、自由输入与提交；配套 645 行样式。 | 结构判断 |
| `src/client/PlanReviewPanel.tsx` | 组件 | 91 | 计划审阅面板（批准/驳回），配套 109 行样式。 | 结构判断 |
| `src/client/draft-store.ts` | 源码 | 64 | 会话级草稿 store 工厂，避免插件热重载复用模块级句柄。 | 结构判断 |
| `src/client/question-reply.ts` | 源码 | 287 | 已答问题的 Chat 数据：即时工具结果与迟到人工答复的合并、剪贴板文本。 | 结构判断 |
| `src/client/QuestionReplyView.tsx` | 组件 | 62 | 用共享用户消息面渲染已结算的提问批次。 | 结构判断 |
| `src/client/QuestionReplyView.module.css` | 样式 | 81 | 答复气泡样式。 | 结构判断 |
| `src/client/locales.ts` | 源码 | 284 | `question` 命名空间 8 语种文案与键类型。 | 结构判断 |
| `src/css-modules.d.ts` | 类型声明 | 4 | CSS Module 的 TS 声明。 | 结构判断 |
| `tests/browser-plugin.client.spec.ts` | 测试 | 768 | 浏览器插件装配与 composer 链路由。 | 结构判断 |
| `tests/user-questions-composer.client.spec.tsx` | 测试 | 1146 | 提问主界面交互。 | 结构判断 |
| `tests/pending-question.client.spec.ts`、`question-draft-store.client.spec.ts` | 测试 | 237（2 文件） | 待答状态机与草稿 store。 | 结构判断 |
| `tests/plan-review-panel.client.spec.tsx` | 测试 | 397 | 计划审阅面板。 | 结构判断 |
| `tests/question-reply.client.spec.ts`、`QuestionReplyView.client.spec.tsx` | 测试 | 593（2 文件） | 答复数据与气泡渲染。 | 结构判断 |
| `tests/question-composer-styles.client.spec.ts` | 测试 | 111 | 样式类名合规。 | 结构判断 |
| `tests/node-plugin.client.spec.ts` | 测试 | 29 | 宿主侧空实现的契约。 | 结构判断 |

## 5. packages/client/ui-workflow-run

持久化工作流运行的会话节点视图：把一次 workflow run 的阶段、成员与状态渲染成可折叠面板，内容以 Chat 数据定义注册，宿主侧只做插件声明。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | 101/101/49 | 包说明与翻译配对配置（3 个文件合并）。 | 结构判断 |
| `package.json`、`tsconfig.json`、`tsdown.config.ts` | 配置 | 135（3 文件） | 包元数据、TS 配置、客户端打包入口。 | 结构判断 |
| `locale/*.json` | 文案 | 47（8 文件） | 8 语种短文案表。 | 结构判断 |
| `src/index.ts` | 源码 | 4 | 宿主侧插件声明，无逻辑。 | 结构判断 |
| `src/client/index.ts` | 源码 | 37 | 浏览器插件：注册 workflow-run 会话节点定义。 | 结构判断 |
| `src/client/workflow-definition.ts` | 源码 | 198 | run/phase/member 数据形状、状态枚举与 phase key。 | 结构判断 |
| `src/client/WorkflowRunPanel.tsx` | 组件 | 489 | 运行面板：状态、阶段进度与成员列表；配套 280 行样式。 | 结构判断 |
| `src/client/locales.ts` | 源码 | 183 | `workflowRun` 命名空间 8 语种文案。 | 结构判断 |
| `src/css-modules.d.ts` | 类型声明 | 6 | CSS Module 的 TS 声明。 | 结构判断 |
| `tests/workflow-run.client.spec.tsx` | 测试 | 971 | 面板渲染与状态切换。 | 结构判断 |
| `tests/panel-styles.client.spec.ts` | 测试 | 50 | 面板样式类名合规。 | 结构判断 |

## 6. packages/client/ui-workspace

侧栏「工作区/会话」浏览区：把宿主投影的 Workspace 与 Session 顺序派生成树/扁平列表，提供搜索、分组、置顶排序、重命名/归档/删除对话框、目录选择与 toast 通知，并注册工作区快捷键。包内两个注册共用一套契约：`WorkspaceBrowser` 填 `sidebar.workspaces` 洞，`WorkspacePicker` 供会话空态使用。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | 266/265/73 | 包说明与翻译配对配置（3 个文件合并）。 | 结构判断 |
| `package.json`、`tsconfig.json`、`tsdown.config.ts` | 配置 | 191（3 文件） | 包元数据、TS 配置、客户端打包入口。 | 结构判断 |
| `locale/*.json` | 文案 | 47（8 文件） | 8 语种短文案表。 | 结构判断 |
| `src/client/contract/slots.ts` | 契约 | 530 | 两个注册共用的 slot 契约：浏览区注入、会话行 owner/trailing/schedule 注入、目录选择流、菜单开合状态工厂。 | 结构判断 |
| `src/client/contract/toast.ts` | 契约 | 64 | 键控 Workspace 通知与共享 Toast 工厂的展示数据类型。 | 结构判断 |
| `src/client/index.ts` | 源码 | 427 | 插件装配：注册浏览区入口、视图 store、toast 与归档通知。 | 结构判断 |
| `src/client/locales.ts` | 源码 | 992 | `workspace` 命名空间 8 语种文案（浏览区、行、对话框、目录流）；线上错误串按策略不翻译。 | 结构判断 |
| `src/client/navigation.ts` | 源码 | 598 | `UiWorkspace` 服务：归档、目录浏览/选择与错误类型。 | 结构判断 |
| `src/client/tree.ts` | 源码 | 641 | 树派生核心：分组、未分组尾随、空白会话可见性、手动置顶顺序协调、归档过滤与搜索结果集。 | 结构判断 |
| `src/client/stores.ts` | 源码 | 133 | 浏览视图 store 工厂：分组/排序模式持久化，模块级只导出工厂以适配插件重载。 | 结构判断 |
| `src/client/shortcuts.ts` | 源码 | 118 | 工作区命令注册与浏览区自己的打开请求。 | 结构判断 |
| `src/client/pin-order.ts` | 源码 | 51 | 从宿主快照推导置顶顺序写入需要对齐的账号成员集合。 | 结构判断 |
| `src/client/path-suffix.ts` | 源码 | 27 | 为同名工作区生成可区分的路径后缀。 | 结构判断 |
| `src/client/rows/WorkspaceBrowser.tsx` | 组件 | 1435 | 浏览区主体：区头（标题/视图选项/新建）、搜索、分组树或扁平列表、对话框，宽态与导轨态两种布局。结构：props 与注入（1–180 行）→ 区头与搜索（180–420）→ 树/列表渲染（420–900）→ 对话框与空态（900–1200）→ 导轨态与导出（1200 行后）。 | 结构判断 |
| `src/client/rows/WorkspaceBrowser.module.css` | 样式 | 649 | 浏览区布局、宽/窄态与对话框样式。 | 结构判断 |
| `src/client/rows/Rows.tsx` | 组件 | 782 | 树行组件（项目行、搜索行、会话行）：纯展示，数据与回调全部来自 props，悬停切换与标题滚动由 CSS/程序驱动。 | 结构判断 |
| `src/client/rows/Rows.module.css` | 样式 | 491 | 行组件样式与悬停/跑马灯效果。 | 结构判断 |
| `src/client/rows/WorkspaceDialogs.tsx` | 组件 | 141 | 重命名与移除对话框，按捕获的请求键控。 | 结构判断 |
| `src/client/WorkspacePicker.tsx` | 组件 | 278 | 工作区选择/新增流：`WorkspacePickFlow` 为核心（菜单+路径错误对话框），`WorkspacePicker` 包装为空态 slot 注册。 | 结构判断 |
| `src/client/WorkspacePicker.module.css` | 样式 | 41 | 选择器样式。 | 结构判断 |
| `src/client/session-actions/ArchiveSession.tsx` | 组件 | 142 | 归档悬停按钮与「停止运行中工作」确认框。 | 结构判断 |
| `src/client/session-actions/RenameSession.tsx` | 组件 | 95 | 会话重命名对话框，供菜单、快捷键与标题双击共用。 | 结构判断 |
| `src/client/session-actions/PinSession.tsx` | 组件 | 45 | 会话置顶悬停按钮。 | 结构判断 |
| `src/client/session-actions/context-menus.tsx`、`SessionMenu.tsx`、`derived.ts` | 源码 | 108（3 文件） | 结构化会话动作菜单、旧式外部贡献与派生可观察源。 | 结构判断 |
| `src/client/session-actions/RowActionToast.tsx` | 组件 | 14 | 把最新 Workspace 通知派发到键控展示层。 | 结构判断 |
| `src/client/toast/register.ts`、`toast/Toast.tsx` | 源码 | 140（2 文件） | 业务通知到键控 Toast slot 的映射与展示适配器。 | 结构判断 |
| `src/css-modules.d.ts`、`src/index.ts` | 声明/入口 | 15（2 文件） | CSS Module 声明与宿主侧空 `apply`（保证插件出现在 cordis.yml Loader 中）。 | 结构判断 |
| `tests/workspace-browser.client.spec.tsx`、`browser-styles.client.spec.ts`、`access-assembly.client.spec.tsx` | 测试 | 3194（3 文件） | 浏览区渲染、样式与访问装配。 | 结构判断 |
| `tests/rows.client.spec.tsx` | 测试 | 1548 | 树行组件与悬停行为。 | 结构判断 |
| `tests/workspaces-service.client.spec.ts` | 测试 | 1570 | `UiWorkspace` 服务（归档、目录流）。 | 结构判断 |
| `tests/apply.client.spec.ts` | 测试 | 1025 | 插件装配与注册面。 | 结构判断 |
| `tests/tree.client.spec.ts` | 测试 | 964 | 树派生、置顶协调与过滤。 | 结构判断 |
| `tests/session-actions.client.spec.tsx`、`session-menu-actions.client.spec.ts`、`session-context-menu.client.spec.tsx` | 测试 | 827（3 文件） | 会话行动作、菜单动作与右键菜单。 | 结构判断 |
| `tests/shortcuts.client.spec.ts` | 测试 | 231 | 工作区快捷键。 | 结构判断 |
| `tests/workspace-picker.client.spec.tsx`、`path-suffix.client.spec.ts` | 测试 | 383（2 文件） | 选择/新增流与同名后缀。 | 结构判断 |
| `tests/rename-assembly.client.spec.tsx`、`host-home-staleness.client.spec.tsx` | 测试 | 332（2 文件） | 重命名装配与宿主首页陈旧态。 | 结构判断 |
| `tests/menu-button.tsx`、`section-scroller.client.ts` | 测试辅助 | 21（2 文件） | 菜单按钮与区块滚动的测试载体。 | 结构判断 |

## 7. packages/client/web

Web 外壳内核：不含 React 的启动页 + Cordis Loader 组合、平台单例模块表、客户端挂载与激活审计，以及 macOS 桌面壳所需的窗口拖拽区域计算与重算。它是 `apps/web` 的构建期契约层，不承载业务插件。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | 141/141/61 | 包说明与翻译配对配置（3 个文件合并）。 | 结构判断 |
| `package.json`、`tsconfig.json`、`tsdown.config.ts` | 配置 | 105（3 文件） | 包元数据、TS 配置、`staticLinked` 打包入口。 | 结构判断 |
| `src/index.ts` | 源码 | 12 | 库入口：唯一产品是 `AppWebEntry`，引导页与 fiber 状态投影保持内部。 | 结构判断 |
| `src/boot.ts` | 源码 | 127 | 启动内核：模块系统、Cordis 加载器与无框架启动页；渲染器在激活审计通过后接管挂载点。 | 结构判断 |
| `src/boot-client.ts` | 源码 | 149 | 生产环境客户端组合（无页面）：挂 Loader、创建 manifest 行、等待静默并审计激活。 | 结构判断 |
| `src/boot-page.ts` | 源码 | 103 | 无框架启动页与失败报告，React 未就绪时仍可显示。 | 结构判断 |
| `src/boot-page.module.css` | 样式 | 104 | 启动页样式。 | 结构判断 |
| `src/loader-status.ts` | 源码 | 35 | fiber 状态到启动页文案的投影词汇表。 | 结构判断 |
| `src/mount.ts` | 源码 | 24 | 通过依赖 fiber 挂载应用，替换 `uiRenderer` 即重挂载。 | 结构判断 |
| `src/seed.ts` | 源码 | 43 | 平台单例模块表，是冻结模块表中唯一共享的实体集合。 | 结构判断 |
| `src/platform.ts` | 源码 | 22 | 平台模块名单，供 seed、打包 externals 与 Vite alias 共用。 | 结构判断 |
| `src/apply-injections.ts` | 源码 | 52 | 结构化 index 注入表的页面侧解释器，静态 worker 页按表顺序执行。 | 结构判断 |
| `src/base.css` | 样式 | 135 | 基础页面样式，并重置 `-webkit-app-region`。 | 结构判断 |
| `src/window-drag/regions.ts` | 源码 | 92 | 拖拽区域契约：矩形、命中测试、标记常量与可交互选择器。 | 结构判断 |
| `src/window-drag/recall.ts` | 源码 | 224 | 解决 Electron 只在计算样式变化时重建 app-region 矩形的问题，监听 DOM 变化并触发重算。 | 结构判断 |
| `src/css-modules.d.ts` | 类型声明 | 6 | CSS Module 的 TS 声明。 | 结构判断 |
| `tests/boot.client.spec.ts`、`boot-client.client.spec.ts`、`boot-page.client.spec.ts` | 测试 | 632（3 文件） | 启动内核、客户端组合与启动页。 | 结构判断 |
| `tests/mount.client.spec.ts` | 测试 | 47 | 依赖 fiber 挂载。 | 结构判断 |
| `tests/base-styles.client.spec.ts` | 测试 | 88 | 基础样式与 app-region 重置。 | 结构判断 |
| `tests/window-drag-recall.client.spec.ts`、`window-drag-regions.client.spec.ts` | 测试 | 506（2 文件） | 拖拽区重算与命中测试。 | 结构判断 |

## 8. packages/compaction

上下文压缩域，共 5 个子包：`compaction` 只定义压缩 seam（服务契约、checkpoint 来源、工具配对平衡、`compaction/*` 会话事件）；`compaction-basic` 是默认的 replay-aware 后端（保留区间选择 + LLM 摘要）；`compaction-image-offload` 与 `compaction-tool-result-pruner` 是不依赖模型的确定性裁剪执行器；`command-compact` 暴露人工 `/compact` 命令。域内共同约束：压缩以「替换 user/message」落地，决策事件不进入 surface，因此重放可复现。

**包根文件**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | —（3 文件） | 压缩域总览、子包分工与翻译配对配置。 | 结构判断 |

**compaction（seam，13 文件）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 195 | 压缩服务定义 `ctx.compaction`：后端继承 `CompactionEngine` 自行决定何时压缩、把哪段历史替换为摘要节点；含手动压缩错误码。 | 结构判断 |
| `src/checkpoint.ts` | 源码 | 51 | checkpoint 来源的关联构造器、类型与「是否为已持久化 checkpoint」判定，供各后端生成替换消息。 | 结构判断 |
| `src/tool-pairing.ts` | 源码 | 126 | 在 session surface 上判断工具调用/结果是否成对，用于选取安全的切割点（不看 step 标记）。 | 结构判断 |
| `src/types.ts` | 源码 | 120 | 压缩词汇：结果类型与 `compaction/*` 会话事件（记录锁与摘要输入，不进入 surface）。 | 结构判断 |
| `src/brand.ts` | 源码 | 13 | 压缩 id 的品牌类型。 | 结构判断 |
| `README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json`、`tsdown.config.ts` | 文档/配置 | 550（6 文件） | 包说明、元数据与构建配置。 | 结构判断 |
| `tests/compaction.spec.ts`、`tool-pairing.spec.ts` | 测试 | 602（2 文件） | 服务契约与工具配对切割。 | 结构判断 |

**compaction-basic（默认后端，23 文件）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 476 | `BasicCompactionEngine`：自动压缩与手动压缩的入口，串起配置解析、区间选择与摘要。 | 结构判断 |
| `src/region.ts` | 源码 | 600 | surface 保留区间选择与共享的「日志记录式」压缩事务（自动 open-turn 与手动空闲会话共用）。结构：`selectCompactableRange`（保留窗口计算，约 1–220 行）→ `compactSurfaceRegion`（事务：加锁、写决策事件、替换消息、释放，约 220–520 行）→ `assertNoActiveCompaction` 等护栏（520 行后）。 | 精读 |
| `src/config.ts` | 源码 | 362 | 加载期校验与路由模型策略解析（目标压力、每模型覆盖）。 | 结构判断 |
| `src/summarizer.ts` | 源码 | 221 | 一次性摘要调用与持久 checkpoint 的框架化输出。 | 结构判断 |
| `src/types.ts` | 源码 | 86 | 基础后端配置词汇：策略、模型覆盖、解析后的保留/目标参数。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 583（13 文件） | 8 语种短文案、包说明、元数据与 TS 配置。 | 结构判断 |
| `tests/compaction-basic.spec.ts` | 测试 | 2557 | 基础后端主用例集（自动/手动压缩、区间边界、事件持久化），文件体量大，建议后续按场景再拆。 | 结构判断 |
| `tests/manual-compaction.spec.ts`、`compaction-loop-repro.spec.ts`、`loader-composition.spec.ts`、`runtime-context-admission.spec.ts` | 测试 | 1259（4 文件） | 手动压缩、循环复现、Loader 组合与运行时上下文准入。 | 结构判断 |

**compaction-image-offload（19 文件）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 41 | 插件入口：路由不支持图片并返回 `IMAGE_OFFLOAD_REQUIRED` 时，记录 `image/offload` 决策并经错误瀑布重试。 | 结构判断 |
| `src/image-offload.ts` | 源码 | 46 | 按当前模型请求顺序挑选最旧的保留图像并记录永久省略。 | 结构判断 |
| `src/projection.ts` | 源码 | 74 | 浏览器可用的持久图像选择声明与纯重放定义。 | 结构判断 |
| `src/project-message.ts` | 源码 | 36 | 把 `image/offload` 记录的图像位置以不可变方式应用到消息。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 358（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/image-offload.spec.ts`、`projection.spec.ts` | 测试 | 612（2 文件） | 图像挑选/重试与投影重放。 | 结构判断 |

**compaction-tool-result-pruner（18 文件）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 185 | `ToolResultPruner`：不依赖模型、可重放的旧工具结果裁剪服务。 | 结构判断 |
| `src/config.ts` | 源码 | 77 | 裁剪配置解析：默认值、裁剪标记、按码点计长。 | 结构判断 |
| `src/types.ts` | 源码 | 41 | 裁剪配置与结果类型（裁剪条目、统计）。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 360（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/tool-result-pruner.spec.ts`、`loader-composition.spec.ts` | 测试 | 355（2 文件） | 裁剪行为与 Loader 组合。 | 结构判断 |

**command-compact（16 文件）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 108 | 面向人的 `/compact` 命令，桥接到后端无关的压缩 seam。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 388（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/command-compact.spec.ts`、`loader-composition.spec.ts` | 测试 | 467（2 文件） | 命令行为与 Loader 组合。 | 结构判断 |

## 9. packages/computer-use

计算机使用能力的注册点：只提供「按名字独占注册 provider」的 registry，能力实现由外部插件注入；不含截图、点击等具体动作。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | 90/90/37 | 包说明与翻译配对配置（3 个文件合并）。 | 结构判断 |
| `src/index.ts` | 源码 | 48 | `ComputerUseRegistry`：computer-use 能力的显式命名独占注册。 | 精读 |
| `src/brand.ts` | 源码 | 15 | provider 名称的品牌类型。 | 结构判断 |
| `package.json`、`tsconfig.json` | 配置 | 68（2 文件） | 包元数据与 TS 配置。 | 结构判断 |
| `locale/*.json` | 文案 | 48（8 文件） | 8 语种短文案表。 | 结构判断 |
| `tests/registry.spec.ts` | 测试 | 50 | 注册与重复注册冲突。 | 结构判断 |

## 10. packages/context

「把环境事实喂进模型上下文」的一组独立插件，共 7 个：工作区指令（AGENTS.md 兼容）、跨会话引用、`@file` 引用 seam 及其本地实现、Harness 自开发上下文、时间上下文、tmux 位置上下文。共同模式是：首请求前写入持久用户/系统消息，后续按变更做增量再注入，且所有注入都可重放。

**包根文件**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | —（3 文件） | 上下文域总览与翻译配对配置。 | 结构判断 |

**context/agent-instructions（21 文件）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 375 | 工作区指令加载器入口：基线指令在首个请求前进入持久上下文，后续按 fs 工具触碰增量更新 inbox。 | 结构判断 |
| `src/files.ts` | 源码 | 602 | 指令文件发现与有界、可中止的读取。结构：候选文件类型（1–80 行）→ 项目根/祖先链/子目录计算（80–260）→ 发现与去重（260–430）→ 加载与探测 provider 读取（430 行后）。 | 结构判断 |
| `src/render.ts` | 源码 | 513 | 面向模型的指令渲染，受显式字节预算约束。结构：预算与截断项（1–120 行）→ 用户全局/项目作用域判定（120–280）→ 变更项与渲染组装（280 行后）。 | 结构判断 |
| `src/state.ts` | 源码 | 456 | 会话可见的指令状态与动态对账：版本缓存、保留更新、基线状态与消息装配。 | 结构判断 |
| `src/config.ts` | 源码 | 140 | 发现与渲染配置的规范化（含工作区基线标识）。 | 结构判断 |
| `src/digest.ts` | 源码 | 28 | 指令内容 sha1 摘要，用于重复抑制。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 675（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/agent-instructions.spec.ts` | 测试 | 6586 | 指令发现/渲染/增量更新主用例集；单文件近 6600 行，属于需要拆分的超大测试。 | 结构判断 |
| `tests/agent-instructions.e2e.ts` | 测试 | 123 | 端到端加载链路。 | 结构判断 |

**context/file-reference（9 文件）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 45 | `@file` 引用发现 seam：`FileReferenceService` 契约与提示常量。 | 精读 |
| `src/grammar.ts` | 源码 | 55 | 浏览器安全的 `@file` token 语法，终端与 Web 客户端共用。 | 结构判断 |
| `src/types.ts` | 源码 | 13 | 纯类型：引用候选记录，供生成的 Remote 客户端消费。 | 结构判断 |
| `README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/配置 | 344（5 文件） | 包说明与构建配置。 | 结构判断 |
| `tests/service.spec.ts` | 测试 | 21 | seam 契约测试。 | 结构判断 |

**context/file-reference-local（17 文件）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 136 | `ctx.fileReferences` 的本地文件系统实现。 | 结构判断 |
| `src/search.ts` | 源码 | 387 | `@file` 补全的工作区发现：索引只含路径，选中值仍是普通提示文本，文件内容仍走 `read` 工具。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 502（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/search.spec.ts`、`service.spec.ts` | 测试 | 540（2 文件） | 工作区文件检索与服务实现。 | 结构判断 |

**context/harness-dev-context（15 文件）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 158 | 为「能检查并扩展 Harness 自身」的 agent 注入无路径/无 URL 的提示段，并把当前实现 checkout 与 Web GUI 地址作为运行时上下文；恢复会话时保持已记录值原文。 | 精读 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 470（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/harness-dev-context.spec.ts` | 测试 | 230 | 上下文注入与恢复不重写。 | 结构判断 |

**context/session-reference（24 文件）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 483 | `SessionReferenceResolver`：跨会话快照准备，负责精确读取、投影、预算与持久上下文。 | 结构判断 |
| `src/projection.ts` | 源码 | 180 | 当前 surface 投影与有界字节渲染，产出被引用会话数据。 | 结构判断 |
| `src/uri.ts` | 源码 | 103 | 会话 URI 规范与内联 mention 编解码。 | 结构判断 |
| `src/types.ts` | 源码 | 88 | 公共请求/候选/准备记录类型（纯类型子路径，供 Remote 客户端复用）。 | 结构判断 |
| `src/spill.ts` | 源码 | 81 | 完整转录的落盘与有界预览的模型可见省略提示。 | 结构判断 |
| `src/config.ts` | 源码 | 43 | 引用上限、候选数与字节预算的默认值及错误码。 | 结构判断 |
| `src/serialization.ts` | 源码 | 12 | 模型可见信封的标签安全 JSON 序列化。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 637（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/session-reference.spec.ts`、`loader-composition.spec.ts` | 测试 | 1470（2 文件） | 引用准备、预算与 Loader 组合。 | 结构判断 |
| `tests/fixtures/cordis.yml`、`fixtures/source-session.ts` | fixture | 60（2 文件） | Loader 组合配置与被引用源会话 fixture。 | 结构判断 |

**context/time-context（24 文件）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 244 | 可选请求时钟上下文：符合条件的 step 向请求历史追加带来源的时间读数。 | 结构判断 |
| `src/request-zone.ts` | 源码 | 96 | 从已提交/拟提交用户消息推导浏览器时区，并渲染模型可见策略文本。 | 结构判断 |
| `src/timestamp.ts` | 源码 | 37 | ISO 形状时间戳格式化，生产与重放校验共用。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json`、`tsdown.config.ts` | 文档/文案/配置 | 632（14 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/time-context.spec.ts`、`initialization.spec.ts`、`request-zone.spec.ts`、`time-context.e2e.ts` | 测试 | 899（4 文件） | 注入策略、初始化、时区与端到端。 | 结构判断 |
| `tests/fixtures/driver.ts`、`mock-llm.ts`、`time-context.patch.yml` | fixture | 76（3 文件） | 测试驱动、假 LLM 与配置补丁。 | 结构判断 |

**context/tmux-context（15 文件）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 272 | 每轮首请求通过 `ctx.shell` 查询 tmux 会话/窗口/窗格与布局，校验进程确实位于 `$TMUX_PANE`（比对 tty），状态变化或超过刷新下限时才再注入；无 tmux 或查询失败均为 no-op。 | 精读 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 512（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/tmux-context.spec.ts` | 测试 | 483 | 注入、tty 校验与刷新节流。 | 结构判断 |

## 11. packages/core

运行内核。十个子包构成 agent 生命周期的全部基础件：`agent` 是活体注册表与工厂契约，`agent-loop` 是其具体驱动；`session` 是 append-only 事件账本与派生消息历史；`tools` 负责工具定义、schema 与批次调度策略；`tool-executor-native` / `tool-executor-ptc` 是同一注册表的两种执行形态（原生 function calling 与代码模式）；`system-prompt` 收集有序提示段与运行时上下文；`scope` 提供带不透明身份的作用域原语。其余两个小包是默认模型选择与一个已废弃的兼容层。

### 11.1 core/agent（28 文件）

Agent 服务的声明面：谁持有 agent、谁创建 agent、agent 归属于哪个进程内发起者。真正的创建与推理由 `agent-loop` 完成，这里只给注册表、工厂委派与持久事件词汇。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 679 | Agent 服务主入口：活体注册表、工厂委派与进程内 initiator 作用域。结构：`AgentSetup`/`AgentSetupCommit` → `CreateAgentOptions`/`ResumeAgentOptions` → `AgentHandle`/`AgentFactory`/`AgentRegistry`，具体分界未逐段核实。 | 结构判断 |
| `src/runtime-types.ts` | 源码 | 432 | 对外的 agent 类型与实时运行时事件（`AgentOptions`、`CancelOptions`、`Inbox`、`AgentStatus`、`PreStepDecision` 等）；持久转录事实仍归 session 事件。 | 结构判断 |
| `src/dispatch.ts` | 源码 | 176 | agent 作用域的事件派发与 prompt 组装辅助，把 agent 主体与 scope carrier 融合，避免 scope key 与 payload 的 `agent` 分叉。 | 结构判断 |
| `src/model-selection.ts` | 源码 | 174 | agent 自有的模型选择、其持久投影与 scoped 切换通知。 | 结构判断 |
| `src/types.ts` | 源码 | 123 | agent 会话事件词汇（`InboxTarget`、`InboxState`、`TurnBoundaryProjection`、`ModelSelection` 等），供 type-only 消费方使用。 | 结构判断 |
| `src/consumed-work.ts` | 源码 | 109 | 从一份 agent 日志核算它实际消费的工作量，补上 turn/step 词汇无法区分的「空转 turn」与「被拒 turn」。 | 结构判断 |
| `src/projection.ts` | 源码 | 59 | 对会话 turn/step 事件的共享纯折叠，产出边界投影。 | 结构判断 |
| `src/archive-admission.ts` | 源码 | 38 | Workspace 注册表归档准入的 turn 家族：会话被归档时是否正在 turn 内，并随工作一起取消。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json`、`tsdown.config.ts` | 文档/文案/配置 | 722（14 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/agent.spec.ts`、`agent-initiator.spec.ts`、`archive-admission.spec.ts`、`consumed-work.spec.ts`、`model-selection.spec.ts` | 测试 | 1111（5 文件） | 注册表/工厂、发起者作用域、归档准入、消费核算与模型选择。 | 结构判断 |
| `tests/verify-export-jsdoc.spec.ts` | 测试 | 561 | 校验公开导出的 JSDoc 完整性（文档契约测试）。 | 结构判断 |

### 11.2 core/agent-loop（51 文件）

具体驱动层：实例化 scoped `ReactLoopAgent`、把 agent 发布进 agent/session 注册表、按顺序拆除，并独占 system prompt 的持久准入状态。测试体量最大的包（31 个测试文件，合计 15494 行）。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 838 | agent-loop 插件主入口：创建 scoped agent、发布到注册表并负责有序 teardown。结构：`Config` 与 identity 配置 → `LauncherAgentIdentity`/`ConfiguredAgentIdentities` → `AgentLoop` 类 → 插件导出，主入口 `AgentLoop`。 | 结构判断 |
| `src/agent.ts` | 源码 | 751 | `ReactLoopAgent` 默认驱动：按排队 turn 与 step 边界输入推进，每个请求都从会话日志重新推导。结构：输入接驳 → 请求重建 → step 循环与工具批量 → 收尾与取消；主入口 `ReactLoopAgent`。 | 精读 |
| `src/inbox.ts` | 源码 | 232 | 驱动自有的持久 inbox 投影与命令门面。 | 结构判断 |
| `src/runtime-context.ts` | 源码 | 181 | loop 自有 system prompt 的持久准入状态（surface 节点 0 与 in-history 更新）与运行时上下文，负责提醒框架与 supersession。 | 结构判断 |
| `src/assistant-stream.ts` | 源码 | 140 | 进程内 assistant attempt 分帧与持久流累积。 | 结构判断 |
| `src/constants.ts` | 源码 | 6 | 并行工具调用的默认上限常量。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json`、`tsdown.config.ts` | 文档/文案/配置 | 790（14 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/loop.spec.ts`、`contract-regressions.spec.ts`、`coverage-edges.spec.ts`、`interception.spec.ts`、`properties.spec.ts`、`shutdown-drain.spec.ts` | 测试 | 5146（6 文件） | 主循环、契约回归、覆盖边界、中断、性质测试与关停排空。 | 结构判断 |
| `tests/cancel.spec.ts`、`resume.spec.ts`、`scope-lifecycle.spec.ts`、`resource-lifecycle.spec.ts` | 测试 | 4049（4 文件） | 取消、恢复、作用域与资源生命周期。 | 结构判断 |
| `tests/request-reconstruction.spec.ts`、`request-freeze.spec.ts`、`system-prompt-admission.spec.ts`、`system-prompt-projection.spec.ts`、`runtime-context.spec.ts`、`config-session-id.spec.ts` | 测试 | 2750（6 文件） | 请求重建、请求冻结、提示准入/投影与运行时上下文。 | 结构判断 |
| `tests/tool-calls.spec.ts`、`tool-executors.spec.ts`、`tool-order.spec.ts`、`tool-updates.spec.ts` | 测试 | 1716（4 文件） | 工具调用、执行器选择、顺序与增量更新。 | 结构判断 |
| `tests/inbox.spec.ts`、`input-lifecycle.spec.ts`、`request-error.spec.ts`、`model.spec.ts`、`settings.spec.ts`、`agent.spec.ts`、`agent-initiator.spec.ts`、`serial-listener-review.spec.ts`、`request-cache.e2e.ts` | 测试 | 1619（9 文件） | inbox、输入生命周期、请求错误、模型/设置、发起者与串行监听审阅。 | 结构判断 |
| `tests/fixtures/serial-created.mjs`、`mock-adapter.ts` | fixture/测试辅助 | 214（2 文件） | 串行创建 fixture 与假 LLM 适配器。 | 结构判断 |

### 11.3 core/session（47 文件）

事件溯源账本：append-only 会话日志、内存 store、以及从日志派生的 LLM 消息历史。持久化本身不是本包职责，交给订阅 `session/event` 并在 `session/flush` 排空的插件。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 1555 | 会话服务主入口：事件信封、`Session` 读写、store 注册表与派生历史。结构：信封辅助（`adoptSessionEvent`/`snapshotSessionEvent`）→ `Session` 类（append/fork/flush/derive）→ `SessionStore` 发布与取回 → 插件记录与错误类型；主入口 `Session`。 | 结构判断 |
| `src/surface.ts` | 源码 | 758 | 事件日志之上的有序 surface 视图，只暴露会产生 LLM 消息的事件；browser-safe 子路径，禁止 `node:` 导入。结构：投影上下文类型 → surface 判定谓词 → `deriveEventMessage`/`foldSurface` → `SessionSurface` 读取器 → 元数据校验。 | 结构判断 |
| `src/types.ts` | 源码 | 574 | 会话类型总表：id/seq/cursor、header 与 epoch、创建/恢复选项、取消原因、请求头，纯声明无运行时。 | 结构判断 |
| `src/repair.ts` | 源码 | 211 | 待恢复工具结果的尾部修复，服务失败 live step、被中断日志与 fork seed 三种来源。 | 结构判断 |
| `src/known-event-types.ts` | 源码 | 91 | 脚本生成的持久事件目录（禁止手改），供持久化编目校验使用。 | 结构判断 |
| `src/tool-history.ts` | 源码 | 75 | 为请求投影有状态重建历史工具定义。 | 结构判断 |
| `src/seq-ranges.ts` | 源码 | 73 | JSONL 中 `sourceEventSeqs` 的无损区间编解码。 | 结构判断 |
| `src/request-header.ts` | 源码 | 69 | 基于 `request/header` 事件重建 `EpochHeader`，并提供相等判断以避免重复记录。 | 结构判断 |
| `src/preparation.ts` | 源码 | 49 | 注册表发布前对一个未发布 Session 的所有权交接。 | 结构判断 |
| `src/fork.ts` | 源码 | 30 | 基于精确的源事件前缀构建 fork seed。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json`、`tsdown.config.ts` | 文档/文案/配置 | 704（14 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/session.spec.ts`、`store-membership.spec.ts`、`properties.spec.ts`、`scoped.spec.ts`、`preparation.spec.ts` | 测试 | 2445（5 文件） | 会话主体、store 成员关系、性质测试、作用域与预备状态。 | 结构判断 |
| `tests/surface.spec.ts`、`message-projections.spec.ts`、`developer-header.spec.ts`、`canonical-envelopes.spec.ts` | 测试 | 1654（4 文件） | surface 投影、消息投影、developer 头与规范信封。 | 结构判断 |
| `tests/append.spec.ts`、`append.type-test.ts`、`json.spec.ts`、`seq-ranges.spec.ts`、`sequence-types.spec.ts`、`typert.spec.ts` | 测试 | 865（6 文件） | 追加、JSON 编解码、序号区间与序号类型。 | 结构判断 |
| `tests/fork.spec.ts`、`repair.spec.ts`、`tool-history.spec.ts`、`request-header.spec.ts` | 测试 | 1227（4 文件） | fork 种子、尾部修复、工具历史与请求头重建。 | 结构判断 |
| `tests/derived-cache.spec.ts`、`plugin-records.spec.ts`、`plugin-records.type-test.ts`、`gen-persistence-catalog.spec.ts` | 测试 | 647（4 文件） | 派生缓存、插件记录与持久化目录生成。 | 结构判断 |

### 11.4 core/tools（35 文件）

工具层的定义与调度中枢：schema 编译、工具契约、批次调度、调用策略与结果结算都在这里；实际执行被下沉给插件提供的 `ToolExecutor`。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/pipeline.ts` | 源码 | 794 | 共享的工具调用策略、取消传播与结果结算。结构：`ToolExecutionSource` 与调度类型 → `ToolExecutionPipeline` 类（策略检查、取消、结算）→ `toolErrorMessage`；主入口 `ToolExecutionPipeline`。 | 精读 |
| `src/json-schema.ts` | 源码 | 656 | 运行时强制的 JSON Schema 子集，工具输出、PTC 类型、子代理与 workflow 共用。结构：schema 类型 → 判定/断言 → `validateJsonSchemaValue` 递归校验 → 错误类型；纯函数库。 | 结构判断 |
| `src/schema.ts` | 源码 | 646 | JSON 值 schema 的 DSL、类型推断与编译，以及工具参数/输出的定义辅助。结构：规格类型 → DSL 构造 → JSON Schema 编译 → 定义辅助；纯函数库。 | 结构判断 |
| `src/contracts.ts` | 源码 | 418 | 工具定义与调用数据契约（`ToolDefinition`、`ToolResult`、`ToolExecutionToken`、中止原因等）。 | 结构判断 |
| `src/index.ts` | 源码 | 412 | `ToolsService`：工具定义注册与按作用域派发到插件自有的 executor。 | 结构判断 |
| `src/presentation.ts` | 源码 | 389 | provider 中立的工具渲染意图词汇：call/result view、文件 diff、终端、搜索结果等。 | 结构判断 |
| `src/batch.ts` | 源码 | 285 | 单个 assistant step 的工具调用调度：独占调用成屏障，并行调用走有界滚动池并在启动前重分类。 | 结构判断 |
| `src/executor.ts` | 源码 | 102 | `ToolExecutor` 契约与工具批次执行结果类型。 | 结构判断 |
| `src/events.ts` | 源码 | 58 | 工具贡献变更与共享执行策略事件声明。 | 结构判断 |
| `src/error-codes.ts` | 源码 | 24 | 失败结果上记录的错误身份常量（字符串即持久契约）。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json`、`tsdown.config.ts` | 文档/文案/配置 | 685（14 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/tools.spec.ts` | 测试 | 3160 | 工具注册、派发与执行的综合用例（单文件体量过大）。 | 结构判断 |
| `tests/scoped.spec.ts` | 测试 | 736 | 作用域化工具可见性与覆盖。 | 结构判断 |
| `tests/json-schema.spec.ts`、`schema.spec.ts`、`properties.spec.ts`、`activation.spec.ts`、`execution-mode.spec.ts`、`execution-signal-types.spec.ts`、`gen-tool-catalog.spec.ts`、`exports.built.e2e.ts` | 测试 | 1468（8 文件） | schema 校验/DSL、激活、执行模式、信号类型、目录生成与构建产物导出。 | 结构判断 |
| `tests/fixtures/literal-sdk.ts` | fixture | 20 | 字面量 SDK fixture。 | 结构判断 |

### 11.5 core/system-prompt（17 文件）

提示装配注册表：有序 system section、动态运行时上下文、工具 schema 与 prompt 变量四类贡献在此收集并渲染成一次请求的提示。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 699 | 注册表主入口：四类贡献的有序注册与最终渲染。结构：顺序常量与 section/context 类型 → 注册表服务 → `renderPrompt`/`renderContextSnapshot` → 导出辅助；主入口为注册表服务。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 593（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/system-prompt.spec.ts`、`scoped.spec.ts`、`tool-order.spec.ts` | 测试 | 1167（3 文件） | 注册/排序/渲染、作用域覆盖与工具段顺序。 | 结构判断 |

### 11.6 core/scope（10 文件）

作用域原语：铸造一个带不透明身份标签的 Cordis 上下文，并为该身份生成只用于路由的事件 carrier。多数注册表包都建立在这两个文件之上。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 204 | scope 铸造与路由：`createScope`、父链绑定、carrier 判定与 key 提取。 | 结构判断 |
| `src/store.ts` | 源码 | 267 | 作用域注册表共用的插入序存储与 effect 所有权（`ScopeLayer`、`NamedEntries`、`ScopedLayers`）。 | 结构判断 |
| `README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json`、`tsdown.config.ts` | 文档/配置 | 343（6 文件） | 包说明与构建配置（无 locale 文案）。 | 结构判断 |
| `tests/scope.spec.ts`、`store.spec.ts` | 测试 | 511（2 文件） | scope 铸造/路由与存储层行为。 | 结构判断 |

### 11.7 core/tool-executor-native（14 文件）

原生执行器插件：把挂载作用域内的工具调用按原生 function calling 形态执行。实现极薄，实质逻辑在 `core/tools` 的批次调度中。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 35 | `NativeToolExecutor` 插件：为挂载 Agent、preset 或 deployment 作用域启用原生执行。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 348（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |

### 11.8 core/tool-executor-ptc（31 文件）

PTC（program-as-tool-call）执行器：模型写一段 TypeScript/Python 程序，程序内部通过生成的 SDK 调用已准入工具。本包负责程序传输、嵌套派发记录，以及两种语言的 SDK 文本生成。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/ptc.ts` | 源码 | 865 | 共享程序传输：程序经嵌套执行调用被准入工具，子派发逐条记录以便重建，只有外层 curated 结果进入模型历史。结构：runtime 定位 → `createRunCodeTransport` → 嵌套派发日志与并发调度 → 外层结果整理。 | 结构判断 |
| `src/py-types.ts` | 源码 | 817 | Python 形态的 PTC codegen：把注册工具 schema 纯投影成模型编程用的 Python SDK 文本（`ts-types.ts` 的同构兄弟）。 | 结构判断 |
| `src/ts-types.ts` | 源码 | 335 | TypeScript 形态的 PTC codegen：生成 `declare const tools` API 文本，即 `tools:sdk` 提示段。 | 结构判断 |
| `src/ptc-calls.ts` | 源码 | 116 | 完整 PTC 调用（含嵌套工具）的取消与结算。 | 结构判断 |
| `src/index.ts` | 源码 | 114 | PTC 执行插件挂载入口（`PtcExecutor`）。 | 结构判断 |
| `src/types.ts` | 源码 | 70 | client-safe 的 PTC 派发事件与消息来源声明。 | 结构判断 |
| `src/runtime-types.ts` | 源码 | 48 | 宿主 PTC 派发策略声明，串联 live Agent 与工具执行类型。 | 结构判断 |
| `src/run-code.ts` | 源码 | 47 | 注册带显式 runtime 与私有工具绑定的「运行代码」工具。 | 结构判断 |
| `src/errors.ts` | 源码 | 46 | 程序执行失败分类：调用超限、代码运行失败、代码重置失败。 | 结构判断 |
| `src/config.ts` | 源码 | 16 | 插件挂载与直接构造执行器共享的配置。 | 结构判断 |
| `src/client.ts` | 源码 | 2 | 客户端入口，仅转出共享的 PTC 事件与消息来源声明。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json`、`tsdown.config.ts` | 文档/文案/配置 | 606（14 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/ptc.spec.ts` | 测试 | 3076 | 程序传输、嵌套派发与结果整理的完整用例。 | 结构判断 |
| `tests/py-types.spec.ts` | 测试 | 1168 | Python SDK 文本投影快照与边界。 | 结构判断 |
| `tests/ts-types.spec.ts`、`ptc-calls.spec.ts`、`run-code.spec.ts`、`exports.built.e2e.ts` | 测试 | 765（4 文件） | TS SDK 投影、调用结算、运行代码工具与构建产物导出。 | 结构判断 |

### 11.9 core/agent-default-model（16 文件）

为没有会话级模型选择的 Agent 提供默认模型配置。逻辑仅一个文件，其余是文案与构建脚手架。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 97 | 默认模型选择插件：注册配置项，并把它作为无会话级选择时的取值。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json`、`tsdown.config.ts` | 文档/文案/配置 | 445（14 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/agent-default-model.spec.ts` | 测试 | 69 | 默认值生效与配置校验。 | 结构判断 |

### 11.10 core/agent-tool-presentation（15 文件，已废弃）

历史兼容层：按挂载作用域为所有 Agent 选择内置工具执行方式。模块头已标 `@deprecated`，要求改为直接挂载 `tool-executor-native` 或 `tool-executor-ptc`。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 54 | 废弃的兼容插件：按配置在原生/PTC 之间为挂载作用域选择执行器。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 426（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/agent-tool-presentation.spec.ts` | 测试 | 124 | 兼容层的选择行为与弃用提示。 | 结构判断 |

**core 根文档**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | 149（3 文件） | core 包组总览：各子包职责与依赖关系的中英说明。 | 结构判断 |

## 12. packages/credentials

凭证与授权。两个 seam（服务契约）与两个实现：`credentials` 只描述「对密钥的引用」，`authorization` 只描述「必须与人对话才能拿到的凭证」；`credentials-local` 把前者落到 `$DSH_HOME/.credentials.yaml`，`deepseek-account` 用后者实现 DeepSeek 账号登录。密钥值本身永远不进入会话或客户端投影。

### 12.1 credentials/authorization（17 文件）

授权 seam：打开页面、粘贴验证码、选择账号——这类凭证无法只靠配置取得，必须有一段人机对话。seam 拥有对话与结算，调用方只拿结果。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 450 | `ctx.authorization` 服务定义：声明授权会话/流程/交互契约并负责最终结算。结构：错误类型 → `AuthorizationSession`/`AuthorizationFlow` 契约 → `AuthorizationService` 注册与结算。 | 结构判断 |
| `src/types.ts` | 源码 | 91 | wire-safe 授权类型（method、prompt、status、settlement、outcome），不引入 cordis 或 service，供浏览器类型链消费。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 603（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/authorization.spec.ts`、`memory.ts` | 测试 | 603（2 文件） | 授权对话状态机与结算；`memory.ts` 是内存实现辅助。 | 结构判断 |

### 12.2 credentials/credentials（9 文件）

凭据 seam：设置与组合文件只携带「引用」（环境变量名等），provider 持有真实值，消费方每次操作解析一次，因此密钥轮换无需重启。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 307 | `ctx.credentials` 服务定义：引用品牌类型、key 解析、记录读取与 provider 契约。 | 结构判断 |
| `src/types.ts` | 源码 | 102 | client-safe 类型面：引用视图、存储记录联合、Cordis 事件声明，纯类型无运行时。 | 结构判断 |
| `README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/配置 | 497（5 文件） | 包说明与构建配置（该包没有 locale 目录）。 | 结构判断 |
| `tests/credentials.spec.ts`、`memory.ts` | 测试 | 176（2 文件） | 引用解析与 provider 契约；`memory.ts` 是内存 provider。 | 结构判断 |

### 12.3 credentials/credentials-local（20 文件）

本地文件 provider：以 `$DSH_HOME/.credentials.yaml` 为主，继承的进程环境为回退；负责文档解析、扁平布局迁移、写入与文件监听。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 930 | 本地凭据 provider 主入口：文档 schema、迁移、set/unset 写回与 watch 变更传播。结构：常量与文档类型 → `parseCredentialsDocument` 与扁平迁移 → `LocalCredentialProvider` → 监听与顺序辅助。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 636（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/local.spec.ts`、`records.spec.ts`、`watcher.spec.ts` | 测试 | 1173（3 文件） | provider 读写、记录编码与文件监听。 | 结构判断 |
| `tests/migration.spec.ts`、`drain.spec.ts`、`review-fixes.spec.ts` | 测试 | 404（3 文件） | 扁平布局迁移、关停排空与评审修复回归。 | 结构判断 |

### 12.4 credentials/deepseek-account（32 文件）

DeepSeek 账号服务：登录/登出、资料与钱包、通知收发，全部走校验过的平台 HTTP 协议。关键约束是浏览器端审批不得绕过本地取消。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 821 | 账号服务主入口：登录流程、账号态投影、登出与本地取消协调。结构：`Config` → `DeepSeekAccount` 服务 → 浏览器审批路径 → 平台协议调用。 | 结构判断 |
| `src/protocol.ts` | 源码 | 276 | 校验过的平台 HTTP 消息与受限浏览器跳转目标（初始化、交换、账号/通知请求、登出）。 | 结构判断 |
| `src/types.ts` | 源码 | 124 | 客户端提供的请求身份与 client-safe 账号状态；凭证不跨越该投影。 | 结构判断 |
| `src/notifications.ts` | 源码 | 98 | 经账号 API 的校验、本地化通知查询与事件上报。 | 结构判断 |
| `src/details.ts` | 源码 | 79 | 平台 Web 资料与钱包查询，投影给账号 UI 消费方。 | 结构判断 |
| `src/client-metadata.ts` | 源码 | 56 | 平台客户端身份头与部署 cookie 的合并。 | 结构判断 |
| `src/logout.ts` | 源码 | 37 | 对已从本地凭证移除的 token 做有界、纯内存的撤销重试。 | 结构判断 |
| `src/account-tasks.ts` | 源码 | 35 | 基于最近请求路由判定登出策略，并取消在跑账号任务。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 450（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/account.spec.ts` | 测试 | 1684 | 账号登录/登出/状态投影的综合用例。 | 结构判断 |
| `tests/notifications.spec.ts` | 测试 | 630 | 通知查询、内容与事件上报。 | 结构判断 |
| `tests/diagnostics.spec.ts`、`origins.spec.ts`、`remote.spec.ts`、`logout.spec.ts` | 测试 | 557（4 文件） | 诊断、来源限制、Remote 投影与登出重试。 | 结构判断 |
| `tests/account-tasks.spec.ts`、`client-headers.spec.ts`、`authorization-response.spec.ts`、`details.spec.ts` | 测试 | 92（4 文件） | 账号任务取消、客户端头、授权响应与资料查询。 | 结构判断 |

**credentials 根文档**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | 129（3 文件） | 凭证域总览：引用与授权两条 seam 的分工。 | 结构判断 |

## 13. packages/deliverables

「交付物」域：把要给用户看的产物落到正确的位置——文件引用指引（提示层）、`present` 工具（会话内的文件交付声明）、以及工作区改动摘要（每轮改了什么文件、diff 怎么取）。

### 13.1 deliverables/deliverable-file-references（15 文件）

提示层插件，本身不产出文件：给渲染桌面式文件引用的客户端注入统一的文件交付指引。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 30 | 注册提示段，说明如何交付与引用文件路径（`name`/`inject`/`apply` 极薄）。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 347（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/prompt.spec.ts` | 测试 | 42 | 提示段内容与注入时机。 | 结构判断 |

### 13.2 deliverables/tool-present（17 文件）

`present` 工具：在所属 Session 内声明文件系统交付物，供 UI 归入「本轮交付」。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 110 | scoped 工具实现：校验路径并写入会话级交付记录。 | 结构判断 |
| `src/types.ts` | 源码 | 17 | 持久交付记录 `PresentedFile` 的形状。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 405（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/present.spec.ts`、`built-errors.e2e.ts` | 测试 | 281（2 文件） | 交付声明行为与构建产物错误路径。 | 结构判断 |

### 13.3 deliverables/workspace-changes（31 文件）

每轮工作区改动摘要：turn 起止的 git 工作树快照、git 覆盖不到的路径用整文件捕获，再按需提供某文件的 before/after 比较。这是 UI 侧 diff 视图的数据源。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/recorder.ts` | 源码 | 401 | 每会话 turn 记录器：快照、file-tool 编辑前后捕获、turn 末 diff 与记录留存。 | 结构判断 |
| `src/git.ts` | 源码 | 279 | 通过子进程 capability 做 git 工作树快照、树 diff、gitlink 与 ignore 检查。 | 结构判断 |
| `src/index.ts` | 源码 | 188 | 插件入口：汇总每个顶层 turn 的改动文件，并提供按需比较服务。 | 结构判断 |
| `src/types.ts` | 源码 | 115 | 变更摘要、会话事件与 Host 服务类型。 | 结构判断 |
| `src/paths.ts` | 源码 | 109 | 变更路径的分类、规范化与展示形式（临时路径识别）。 | 结构判断 |
| `src/capture.ts` | 源码 | 84 | file-tool 编辑周围的整文件捕获，内容寻址存入会话临时目录。 | 结构判断 |
| `src/compare.ts` | 源码 | 66 | 两份整文件文本的行级比较，超时降级为整文件替换。 | 结构判断 |
| `src/numstat.ts` | 源码 | 52 | 解析 `git diff-tree --numstat -z` 输出。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 410（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/plugin.spec.ts` | 测试 | 534 | 插件装配、turn 记录与摘要发布的综合用例。 | 结构判断 |
| `tests/git.spec.ts`、`apply-patch.spec.ts` | 测试 | 489（2 文件） | git 快照/树 diff 与 patch 应用后的改动识别。 | 结构判断 |
| `tests/capture.spec.ts`、`compare.spec.ts`、`numstat.spec.ts`、`paths.spec.ts`、`current-directory.spec.ts`、`loader-composition.spec.ts`、`support.ts` | 测试 | 493（7 文件） | 捕获、比较、numstat、路径分类、工作目录、Loader 组合与共享夹具。 | 结构判断 |

**deliverables 根文档**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | 127（3 文件） | 交付物域总览：提示、工具、改动摘要三者的分工。 | 结构判断 |

## 14. packages/document

Office 能力，两层结构：`office-kit` 是宿主侧的 LibreOffice Kit 转换服务（不面向模型），`tool-office` 是把它包装成模型可调用工具的薄层。

### 14.1 document/office-kit（32 文件）

宿主转换服务：复用 LibreOffice Kit 转换器、对源做有界准入、把输入输出限制在会话私有的磁盘目录里，并支持文档转图、格式转换与工作簿重算。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 484 | `OfficeKit` provider：转换/渲染/重算入口、转换器复用与共享准入。结构：`Config` → `OfficeKit` 类 → 转换器复用与准入 → 输出清理。 | 结构判断 |
| `src/queue.ts` | 源码 | 316 | 有界源准入、按内容共享一次转换、输出交给调用方。 | 结构判断 |
| `src/outputs.ts` | 源码 | 218 | 会话拥有的私有、有界输出文件（转换与重算结果）。 | 结构判断 |
| `src/types.ts` | 源码 | 168 | 授权的 Office 输入与共享转换器的完整输出类型。 | 结构判断 |
| `src/locate.ts` | 源码 | 93 | 从消费者的 Kit 安装定位 LibreOffice Kit 与引擎包，不依赖 module hooks。 | 结构判断 |
| `src/output.ts` | 源码 | 69 | 只读取私有任务目录内创建的有界常规输出文件。 | 结构判断 |
| `src/identity.ts` | 源码 | 31 | 源定位键与转换器自有身份，用于 PDF 复用。 | 结构判断 |
| `src/errors.ts` | 源码 | 15 | 转换与其消费方共享的分类失败类型。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 450（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/queue.spec.ts`、`provider.spec.ts`、`outputs.spec.ts` | 测试 | 1229（3 文件） | 准入队列、provider 行为与输出文件管理。 | 结构判断 |
| `tests/operations.spec.ts`、`remote.spec.ts` | 测试 | 511（2 文件） | Office 操作矩阵与 Remote 投影。 | 结构判断 |
| `tests/engine-package.spec.ts`、`engine-resolver.spec.ts`、`kit-lookup.spec.ts`、`output.spec.ts`、`anchors.spec.ts`、`default-outputs.ts` | 测试 | 350（6 文件） | 引擎包解析、Kit 定位、输出读取、锚点与默认输出夹具。 | 结构判断 |

### 14.2 document/tool-office（19 文件）

模型侧 Office 工具：渲染文档页、转换文档、重算工作簿。工具只在 Office skill 加载后被准入；`officeKit` 缺失时调用以 `unavailable` 失败。

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `src/index.ts` | 源码 | 427 | 工具插件入口：三个 Office 工具的定义、准入与 `officeKit` 调用。 | 结构判断 |
| `src/formats.ts` | 源码 | 144 | 文档族、可接受格式与依赖输入的参数校验规则。 | 结构判断 |
| `src/content.ts` | 源码 | 101 | Office 工具结果的标准形态与模型可见内容渲染。 | 结构判断 |
| `locale/*.json`、`README.md`、`README.zh.md`、`README.i18n.yaml`、`package.json`、`tsconfig.json` | 文档/文案/配置 | 458（13 文件） | 8 语种短文案、包说明与构建配置。 | 结构判断 |
| `tests/tool-office.spec.ts`、`activation.spec.ts`、`fixtures/fake-kit.ts` | 测试 | 1009（3 文件） | 工具行为、准入时机与假 Kit fixture。 | 结构判断 |

**document 根文档**

| 文件 | 类型 | 行数 | 职责 | 标注 |
|---|---|---|---|---|
| `README.md`、`README.zh.md`、`README.i18n.yaml` | 文档 | 127（3 文件） | Office 域总览：宿主服务与工具层的边界。 | 结构判断 |

## 15. 异常文件与观察

### 15.1 超大源码（>500 行）

| 文件 | 行数 | 观察 |
|---|---|---|
| `packages/client/ui-trajectory/src/client/TrajectoryTable.tsx` | 3607 | 单组件承担轨迹表格的全部列定义、展开、选中与虚拟行渲染，是 client 侧最大文件；建议按列/交互拆分。 |
| `packages/client/ui-trajectory/src/client/TrajectoryTable.module.css` | 2086 | 与上表一一对应的样式，体量说明表格结构高度内联。 |
| `packages/client/ui-trajectory/src/client/locales.ts` | 1642 | 轨迹域 8 语种文案集中在单文件，非生成文件时属于可维护性风险。 |
| `packages/client/ui-workspace/src/client/rows/WorkspaceBrowser.tsx` | 1435 | 工作区浏览器主视图，行渲染、选择与菜单耦合。 |
| `packages/client/ui-trajectory/src/client/layout.ts` | 1149 | 轨迹折叠/耗时/usage 合并的核心计算层（本文件唯一深入读过的 client 文件）。 |
| `packages/client/ui-workspace/src/client/locales.ts` | 992 | 同 locales 集中模式。 |
| `packages/credentials/credentials-local/src/index.ts` | 930 | 文档解析、迁移、读写与监听四件事在一个文件。 |
| `packages/core/tool-executor-ptc/src/ptc.ts` | 865 | 程序传输与嵌套派发日志，天然复杂，但可再分层。 |
| `packages/core/agent-loop/src/index.ts` | 838 | 插件装配 + 生命周期 teardown 同文件。 |
| `packages/core/agent-loop/src/agent.ts` | 751 | 主循环状态机；751 行对「每一步都能从日志重建」的实现而言偏紧但可接受。 |
| `packages/core/session/src/surface.ts` | 758 | surface 判定、派生与读取器同文件。 |
| `packages/core/tools/src/pipeline.ts` | 794 | 策略 + 取消 + 结算三条职责并行。 |
| `packages/core/tool-executor-ptc/src/py-types.ts` | 817 | 与 `ts-types.ts`（335 行）同构却大 2.4 倍，值得核对是否有重复分支。 |
| `packages/credentials/deepseek-account/src/index.ts` | 821 | 登录、账号态、通知、登出协调同文件。 |
| `packages/client/ui-workspace/src/client/rows/Rows.tsx` | 782 | 行组件集合。 |
| `packages/client/ui-trajectory/src/client/TrajectoryTimeline.tsx` | 739 | 时间线视图。 |
| `packages/client/ui-user-questions/src/client/QuestionComposer.tsx` | 729 | 提问编排器，含多问题与草稿态。 |
| `packages/core/system-prompt/src/index.ts` | 699 | 四类贡献注册 + 渲染。 |
| `packages/core/agent/src/index.ts` | 679 | 注册表 + 工厂 + scope。 |
| `packages/core/tools/src/json-schema.ts` | 656 | 校验器与断言同文件，纯函数库。 |
| `packages/core/tools/src/schema.ts` | 646 | DSL + 编译 + 定义辅助。 |
| `packages/client/ui-theme/src/client/index.ts` | 654 | 主题运行时与首帧引导同文件。 |
| `packages/client/ui-workspace/src/client/tree.ts` | 641 | 文件树模型。 |
| `packages/client/ui-trajectory/src/client/TrajectoryView.tsx` | 617 | 轨迹视图外壳。 |
| `packages/context/agent-instructions/src/files.ts` | 602 | 候选文件发现与祖先链去重。 |
| `packages/compaction/compaction-basic/src/region.ts` | 600 | 保留区间选择 + 压缩事务。 |
| `packages/client/ui-workspace/src/client/navigation.ts` | 598 | 导航状态机。 |
| `packages/client/ui-user-questions/src/client/contract/slots.ts` | 574 | 槽位契约偏大，说明该域交互面广。 |
| `packages/core/session/src/types.ts` | 574 | 纯类型文件，体量大但无运行时风险。 |
| `packages/client/ui-workspace/src/client/contract/slots.ts` | 530 | 同上。 |
| `packages/context/agent-instructions/src/render.ts` | 513 | 指令渲染。 |
| `packages/document/office-kit/src/index.ts` | 484 | 接近阈值，暂不拆。 |

### 15.2 超大测试（>1000 行）

`context/agent-instructions/tests/agent-instructions.spec.ts` 6586、`core/tools/tests/tools.spec.ts` 3160、`core/tool-executor-ptc/tests/ptc.spec.ts` 3076、`client/ui-workspace/tests/workspace-browser.client.spec.tsx` 2838、`compaction/compaction-basic/tests/compaction-basic.spec.ts` 2557、`core/agent-loop/tests/loop.spec.ts` 1978、`core/session/tests/session.spec.ts` 1825、`client/ui-trajectory/tests/views.client.spec.tsx` 1722、`credentials/deepseek-account/tests/account.spec.ts` 1684、`client/ui-trajectory/tests/table.client.spec.tsx` 1619、`client/ui-workspace/tests/workspaces-service.client.spec.ts` 1570、`client/ui-workspace/tests/rows.client.spec.tsx` 1548、`core/agent-loop/tests/contract-regressions.spec.ts` 1529、`core/agent-loop/tests/resume.spec.ts` 1495、`context/session-reference/tests/session-reference.spec.ts` 1322、`client/ui-trajectory/tests/conversation-definitions.client.spec.ts` 1218、`core/agent-loop/tests/scope-lifecycle.spec.ts` 1190、`core/agent-loop/tests/cancel.spec.ts` 1187、`core/tool-executor-ptc/tests/py-types.spec.ts` 1168、`client/ui-user-questions/tests/user-questions-composer.client.spec.tsx` 1146、`core/session/tests/surface.spec.ts` 1030、`deliverables/workspace-changes/tests/apply.client.spec.ts` 1025、`core/agent-loop/tests/tool-calls.spec.ts` 1010（共 23 个）。

其中 `agent-instructions.spec.ts`（6586 行）最突出：单文件超过被测源码总和（该包源码约 2300 行），说明它同时承担了发现、优先级、渲染、状态四层的回归。

### 15.3 疑似重复实现

- **compaction 三兄弟**：`compaction-basic`、`compaction-image-offload`、`compaction-tool-result-pruner` 各自实现「选出要删的区间 → 记录日志事件 → 报告统计」，共享的只有 `compaction-basic/src/region.ts` 的区间事务。三处的事件形状与统计逻辑相似度高，属可合并候选（是否刻意分层待确认）。
- **stores/draft-store 工厂**：`ui-user-questions` 与 `ui-workspace` 都存在「按 id 建 store + 订阅 + 销毁」的同构代码，未抽到共享包。
- **`harness-dev-context` 的 `LEGACY_*` 常量**：与当前 guidance 文本逐字重复，但这是刻意冻结——旧会话的持久 prompt 必须逐字匹配，文件内已有 `jscpd:ignore` 标记，**不属于缺陷**。

### 15.4 命名与结构异常

- `packages/core/agent-tool-presentation`：整包已标 `@deprecated`（15 个文件），保留是因为旧的 Loader 配置仍可能引用；建议在下一轮清单中标记为可删除候选。
- `packages/credentials/credentials`：唯一没有 `locale/` 目录的 credentials 子包（其余均有 8 语种），推测是无 UI 文案；除两个源码文件外只有文档与构建配置，符合 seam 包的定位。
- `packages/document/office-kit`：同域其他包都带 `tsdown.config.ts`，该包没有；构建方式待确认（可能由 app 侧直接打包）。
- `packages/core/tool-executor-ptc/src/client.ts` 仅 2 行（纯转出类型），`core/agent-loop/src/constants.ts` 仅 6 行（一个默认值），`core/tools/src/error-codes.ts` 24 行（纯字符串常量）——过薄文件，但都承担跨包契约，不宜内联。
- 过薄测试：`credentials/deepseek-account/tests/details.spec.ts` 12 行、`authorization-response.spec.ts` 18 行、`client-headers.spec.ts` 20 行、`core/session/tests/preparation.spec.ts` 21 行；覆盖面依赖同包其他用例。
- `packages/credentials/deepseek-account/tests/expected/web-exchange-failure.txt` 是唯一以「期望输出快照」形式存在的 fixture（1 行），归类为 fixture 而非测试。

