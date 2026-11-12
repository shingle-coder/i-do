# docs/ 文件级索引

> 范围：`docs/superpowers/inventory/docs.tsv` 全部 **1,167 行**，覆盖 `docs/` 目录全量。 > 只读盘点，未修改、未生成仓库内任何文件。 > 盘点时刻磁盘上 `docs/` 共 1,188 个文件（清单 1,167 + 本轮新增 21，见文末「覆盖核对」）。

## 标注规则

| 标注 | 含义 |
|---|---|
| 精读 | 完整读过正文或关键章节，职责依据正文而非标题 |
| 结构判断 | 依据 frontmatter、首段、章节结构、交叉引用判断；未逐字读完（长文、生成物） |
| 待确认 | 无法从文档自身确认时效性或归属，需要作者确认 |

其他约定：

- `docs/` 里绝大多数文档是**三件套**：`X.md`（英文源）+ `X.zh.md`（中文）+ `X.i18n.yaml`（翻译一致性记录）。表格每行只列英文源与它的行数，「覆盖核对」里按 3 倍结算文件数。
- 「类型」取值：`规范`（约束怎么做事）、`参考`（查表用）、`生成`（脚本产出，禁止手改）、`记录`（只增不改的历史）、`教程`、`索引`、`素材`、`本轮产出`。
- 「行数」为英文源文件行数；标注 `≈` 的表示该行是一组文件的代表值。
- 生成物（catalog / graph / atlas / status）一律 `结构判断`：其内容由脚本从源码生成，职责由生成器与消费方决定，人工精读没有意义。

---

## 一、结论：docs/ 的信息架构

### 1.1 四层结构

`docs/` 不是按「读者」组织的，而是按**用途**叠了四层，层与层之间没有显式目录边界：

| 层 | 内容 | 目录 | 是否发布到文档站 |
|---|---|---|---|
| **发布层** | 面向用户与插件开发者的正文 | `user/`、顶层 `architecture.md` 等、`subsystems/`、`cookbook/`、`cordis-*`、`defensive-patterns/general.md` | 是，白名单驱动 |
| **契约层** | 面向仓库贡献者的规范与检索 | `AGENTS.md`、`i18n/`、`subsystems/`（同一批文件双身份）、`cookbook/` | 部分 |
| **记录层** | 只增不改的历史与迁移说明 | `persistence-changes/`、`postmortem/`、`upgrade-guide/` | 否 |
| **生成物与素材层** | 从源码生成的目录/图，以及图标资源 | 顶层 7 个生成物、`logo/`、`assets/` | 部分 |

「发布层」和「契约层」共用同一批文件（例如 `subsystems/*.md` 既是站内架构页，也是仓库内的契约参考），这是本目录最大的结构特征：**一份文件两个读者**。

### 1.2 发布由白名单控制，不由目录决定

`website/docs.ts` 的 `docsPages` 数组是全站唯一入口：

- 每个条目声明 `source`（`docs/` 下的真实路径）、`route`（URL）、`label`、`sidebar`、`section`、`order`。
- **没进 `docsPages` 的文件不会出现在站点上**，但仍然是仓库内的有效文档。
- 因此「文档存在」≠「用户能看到」。判断一篇文档的读者，必须同时看 `docs.ts`。
- 站点路由是重写过的：`docs/user/guide/index.md` 对外是 `/guide/quickstart.md`。**按文件路径猜 URL 会错。**

未发布的整块内容：`upgrade-guide/`、`persistence-changes/`、`postmortem/`、`superpowers/`、`assets/`、`logo/`、`i18n/`（说明文档，非站点页），以及 `user/`、`cookbook/`、`subsystems/` 中未被 `docs.ts` 收录的少数篇目。

### 1.3 分发生效点在打包脚本，不在仓库

`scripts/stage-dsh-docs.ts` 在打包时把仓库文档投影成产品内可读的文档树，并**在产物里生成 `upgrade-guide/README.md`**。所以仓库里 `upgrade-guide/` 没有索引页不是遗漏，索引是生成的。

---

## 二、顶层 24 篇（72 文件）

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `AGENTS.md` | 规范 | 77 | 本目录的写作宪法：三件套配对、链接写法、命名、生成物禁止手改、`docs.ts` 白名单义务。改任何 docs 文件前必须先过这一篇。 |
| `architecture.md` | 规范 | 171 | 全仓分层与包职责总览，明确 `packages/`、`apps/` 的边界和「动这里要先读什么」。是 `subsystems/` 的上位索引。 |
| `capability-seams.md` | 参考 | 764 | 能力接缝总表：每个可插拔能力的契约、provider 注册、扩展点一览。写扩展先查这里定位接缝。 |
| `agent-lifecycle.md` | 规范 | 93 | Agent 从创建到结束的所有权模型：`AgentHandle`、交付、取消、拦截的时序与责任归属。 |
| `tool-execution-pipeline.md` | 规范 | 66 | 一次工具调用从模型请求到结果回传的完整链路与守卫点（准入、沙箱、呈现）。 |
| `api-gateway.md` | 规范 | 172 | Host/Remote 网关的 API 边界：谁能调、走哪条通道、错误如何回传。 |
| `config-catalog.md` | 生成 | 5,308 | 全仓配置项目录：键名、类型、默认值、归属包。查配置的唯一权威表。 |
| `tool-catalog.md` | 生成 | 2,862 | 全部内置工具的目录：定义、参数 schema、呈现方式。 |
| `persistence-catalog.md` | 生成 | 9,426 | 会话持久化事件与字段的完整目录，全仓最大单文件。改 session 数据必查。 |
| `experimental-persistence-catalog.md` | 生成 | 21 | 实验性持久化条目的补充目录，是上一份的增量附录，不是独立全集。 |
| `session-format-status.md` | 生成 | 63 | 当前 session 格式版本与各版本迁移状态的快照。 |
| `module-graph.md` | 生成 | 1,935 | 包级依赖图与循环依赖清单，判断「能不能这样引」的证据来源。 |
| `graph-atlas.md` | 生成 | 22 | 图类生成物的索引页，指向依赖图/事件图/能力矩阵。单独看没有内容。 |
| `event-producer-consumer.md` | 生成 | 127 | 事件的生产者—消费者对照表，改事件负载前用它找全部下游。 |
| `glossary.md` | 参考 | 46 | 架构术语表（接缝、投影、束、作用域等），统一用词。 |
| `cordis-primer.md` | 教程 | 45 | Cordis 框架最小入门：插件、服务、依赖注入，供完全没接触过框架的读者起步。 |
| `development.md` | 规范 | 221 | 本地开发环境、常用脚本（build/test/lint/docs）与提交前门禁的执行顺序。 |
| `testing.md` | 规范 | 55 | 测试分层、各层怎么跑、失败如何归类（环境问题 vs 真实回归）。 |
| `cli-help.md` | 参考 | 211 | `dsh` CLI 全量命令与参数的人工整理版，比 `--help` 更可读。 |
| `deepseek-llm-api-wire-extensions.md` | 参考 | 162 | DeepSeek 模型接口在标准协议之外的私有扩展字段说明（仅限模型侧，非产品文案）。 |
| `rescope.md` | 规范 | 55 | 「重新划定范围」这一改造手法的操作步骤：把配置/职责从一层搬到另一层时怎么改、怎么验证。 |
| `ui-radius.md` | 规范 | 119 | 圆角设计令牌的唯一取值标准与场景对照，禁止局部自造圆角。 |
| `web-styling.md` | 规范 | 57 | 样式归属规则：哪些 CSS 进主题包、哪些留组件、禁止跨包覆盖。 |
| `ui-design-review-cases.md` | 参考 | 445 | UI 设计评审的判定原则与真实案例，配 `assets/ui-design-review/` 的对照图使用。 |
| `目录结构.md` | 本轮产出 | 3,339 | **清单外**（本轮新增）：全仓目录树逐行注释。与本文互补——它讲「树长什么样」，本文讲「每篇文档干什么」。 |

**结构判断**：生成物 7 篇（`config-catalog`、`tool-catalog`、`persistence-catalog`、`experimental-persistence-catalog`、`session-format-status`、`module-graph`、`graph-atlas`、`event-producer-consumer` 中的生成部分）未逐行阅读，职责由文件头与 `scripts/` 内生成器反推。`capability-seams.md`（764 行）为抽样精读。

---

## 三、subsystems/（68 主题 + README，207 文件）

**主题**：按子系统切分的架构契约手册，每个文件对应一个「接缝」（seam）或一段运行时能力，说明它拥有哪些类型、谁是 owner、边界在哪。 **覆盖**：68 个子系统，从 agent loop 到侧栏 UI，是全仓最密的文档簇。 **配对**：全部三件套齐全（69 × 3 = 207）。 **过期情况**：3 篇存在无效的 Agent Note 引用（见第五节）。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `README.md` | 索引 | 78 | 68 个子系统的一行职责表 + 命名规则，是进入本目录的唯一入口。 |
| `core.md` | 规范 | 1,168 | `packages/core` 如何控制 agent loop：逐包循环、`AgentHandle` 所有权、交付/取消/拦截契约、全仓类型模式。 |
| `agent-team.md` | 规范 | 194 | Agent Teams：共享任务 DAG 与子代理树内的任务归属。 |
| `approval.md` | 规范 | 170 | 一次性用户审批接缝：请求、结果、按会话策略、审计事件、应答方契约。 |
| `attachment.md` | 规范 | 384 | 图片附件的持久身份与元数据、校验输入、受验读取、存储接缝。 |
| `boot.md` | 规范 | 627 | 当前 profile 的插件管理与启动器 reload 协调。 |
| `browser-use.md` | 规范 | 67 | 浏览器能力：独占命名注册、provider 选择、按会话的浏览器所有权。 |
| `claude-code-mods.md` | 规范 | 146 | Claude Code 兼容桥：事件映射、`$` 成员、链式规则、与原生 mod 的差异清单。 |
| `client-modules.md` | 规范 | 206 | Web 插件表：`dsh.client` 声明、`WebBootGraph` 线格式、bundle 路由与 index tap。 |
| `client-resources.md` | 规范 | 92 | 客户端资源模型：`dsh-resource://` 地址、协议 provider、`useResource` 状态机、pin/release。 |
| `commands.md` | 规范 | 223 | 人类命令注册服务：定义、适配器发现、直接调用、结果与解析视图。 |
| `compaction.md` | 规范 | 284 | 上下文压缩接缝：`compaction/*` 事件、压缩结果、引擎接口。 |
| `computer-use.md` | 规范 | 139 | 桌面操作能力：独占命名 provider 注册与 Cua Driver 的集成取舍。 |
| `conversation.md` | 规范 | 303 | 目标中立的会话事件组装：Context 身份、Location、回放路径、视图构建器、渲染节点归属。 |
| `credentials.md` | 规范 | 522 | 凭据接缝：配置里只放引用不放值、按操作解析、UI 安全的 `CredentialInfo`、来源分层。 |
| `deliverables.md` | 规范 | 180 | 一轮对话交给用户的产物：`present` 的交付文件与基于 git 快照的变更摘要。 |
| `extensions.md` | 规范 | 384 | 版本化动态插件/包：Host/Client 激活、审批、运行时检查、生命周期卸载。 |
| `feedback.md` | 规范 | 400 | 单条消息的用户反馈记录：乐观版本、边车持久化、Host Remote 契约。 |
| `filesystem.md` | 规范 | 704 | 文件系统接缝：`FsTarget`、读/写/编辑结果、已观察文件状态、错误码。 |
| `forge.md` | 规范 | 1,975 | 实验性代码托管：变更请求 provider 契约、状态轮询、会话绑定。 |
| `goal.md` | 规范 | 313 | 目标（Goal）的持久身份、生命周期快照、激活、变更记录与轮次归属。 |
| `jobs.md` | 规范 | 554 | 后台任务运行时：品牌化 JobId、生产者契约、消费视图、`ctx.jobs` 服务行为。 |
| `liveshare.md` | 规范 | 167 | 可选的 LiveShare 束：嵌套共享模式、fork 的上限与持久性、共享会话外部驱动轮次的约束。 |
| `llm-streaming.md` | 规范 | 1,286 | 模型对话类型全集：消息/内容块、组装后的请求、`StreamChunk` 线协议与适配器契约。 |
| `lsp.md` | 规范 | 226 | LSP 导航接缝：查询请求/结果、provider 与 service、四种操作、错误类型。 |
| `mcp.md` | 规范 | 236 | 外部 MCP 连接：作用域工具与资源、服务器指令、协议结果、配置归属。 |
| `office-kit.md` | 规范 | 122 | 授权范围内的 Office 渲染、转换与重算，原生/WASM 引擎与有界共享复用。 |
| `otel.md` | 规范 | 44 | 普通事件与会话日志两条 OTLP 通道的共享约定。 |
| `permission-presets.md` | 规范 | 167 | 权限预设层：预设规格与选项、派生的 `custom` 状态、只记日志的预设事件。 |
| `persistence.md` | 规范 | 428 | 持久化接缝：`SessionPersistence`、JSONL provider、flush、崩溃恢复、会话头。 |
| `plan.md` | 规范 | 87 | 计划模式：只记日志的模式状态、挂起选择刷新、退出计划的评审弧。 |
| `product-telemetry.md` | 规范 | 81 | 产品分析的显式提交与 OTLP/HTTP 传输。 |
| `ptc-runtime.md` | 规范 | 297 | PTC 执行接缝：运行请求/结果、绑定命名空间、日志捕获、失败分类。 |
| `sandbox.md` | 规范 | 246 | 按会话的策略解析与进程隔离：文件效果模式、执行/提供方策略、参数收敛、失败即拒。 |
| `schedule.md` | 规范 | 314 | Host 持有的提醒记录：持久状态迁移、活动/结束视图、普通会话投递。 |
| `scope.md` | 规范 | 59 | 作用域注册身份、分发载体与自有 Scope 上下文。 |
| `session.md` | 规范 | 1,453 | `SessionEventMap` 变体全目录、结束原因、消息派生、执行包围、独立事件。 |
| `session-projection.md` | 规范 | 498 | 投影接缝：映射表、纯函数定义单元、快照一致切面、变更流。 |
| `session-query.md` | 规范 | 521 | 逻辑记录、有界精确事件读取、关系追踪、语义过滤与全文结果页。 |
| `session-reference.md` | 规范 | 225 | 跨会话结构化引用：输入/候选、预置消息上下文、稳定错误分类。 |
| `session-telemetry.md` | 规范 | 212 | 会话上报接缝：记录与严重级、sink 契约、落盘前的脱敏瀑布。 |
| `session-title.md` | 规范 | 213 | 标题的持久快照、引用来源序号、异步 provider 契约。 |
| `settings.md` | 规范 | 155 | 用户设置接缝：命名空间注册、分层解析（默认→组合 base→用户文档）、热提交。 |
| `shell.md` | 规范 | 314 | Shell 执行接缝：请求/规格、运行结果、后台进程句柄。 |
| `sidebar-right.md` | 规范 | 161 | 右侧栏：资源与导航地址、标签类型注册与路由、导航服务、面板槽位与资源模型。 |
| `skills.md` | 规范 | 352 | 技能服务：发现优先级、摘要/定义、会话前缀目录、面向模型的技能加载。 |
| `slots.md` | 规范 | 230 | 类型化 Web UI 组装：声明归属、基数与作用域、框架与功能注入、props 派生。 |
| `spill.md` | 规范 | 124 | 溢出文本存储接缝：保存、归属与来源、引用、品牌化定位符。 |
| `ssh.md` | 规范 | 146 | POSIX SSH 连接与远端文件系统、子进程、沙箱 provider。 |
| `storage.md` | 规范 | 276 | 存储子系统：后端契约、存储形态、域规格与变更事件。 |
| `subagent.md` | 规范 | 703 | 子代理接缝：命名 provider 注册表、启动请求/结果、启动时与运行时能力切分。 |
| `subprocess.md` | 规范 | 321 | 子进程接缝：全显式 spawn 规格、按偏移的读取器、未分类结果、`DSH_*` 环境词表。 |
| `system-prompt.md` | 规范 | 256 | 系统提示组装：每次组装的上下文、工具 provider 结果、提示段、协作式拼装。 |
| `terminal.md` | 规范 | 184 | 持久终端：终端 id、后端/会话契约、就绪判定、有界读取、所有者可见快照。 |
| `todo.md` | 规范 | 32 | 待办包的整列表条目类型、持久事件归属与投影。 |
| `token-meter.md` | 规范 | 151 | 不可变的标量与位置回放测量，以及消费日志的修订。 |
| `tools.md` | 规范 | 898 | 工具定义全字段、schema DSL、执行/结果、呈现类型、受守卫的执行管线。 |
| `translation.md` | 规范 | 103 | 实验性匿名文本翻译与显式 provider 请求。 |
| `typert.md` | 规范 | 700 | 远程调用描述符、查找与上下文声明、注册表、Host 网关/客户端 API 边界。 |
| `user-questions.md` | 规范 | 323 | UI 驱动的人类问答接缝：请求、答案与选项词表、provider API、错误分类。 |
| `voice-input.md` | 规范 | 164 | 实验性语音识别：命名识别器、瞬时音频、带修订守卫的草稿插入。 |
| `web.md` | 规范 | 264 | Web 访问接缝：搜索/抓取请求与结果、响应体、provider 可用性、错误类型。 |
| `web-client.md` | 规范 | 100 | 浏览器侧架构总览：启动、Remote 通信、成对客户端模型、适配器、会话组装、重连。 |
| `web-server.md` | 规范 | 347 | HTTP 载体：路由种类与匹配顺序、可认领的兜底位、index tap。 |
| `webhook.md` | 规范 | 70 | 带认证的 provider 投递、任意规则、fire-and-forget 的工作区会话创建。 |
| `workflow.md` | 规范 | 278 | 工作流接缝：启动请求、元数据、运行/结果、事件负载、错误的致命性判定。 |
| `working-directory.md` | 规范 | 95 | 会话执行目录：持久变更、恢复、用户上下文。 |
| `workspace.md` | 规范 | 739 | 工作区注册表：身份与注册解析、与会话 `cwd` 的关系。 |
| `worktrees.md` | 规范 | 183 | 实验性：在既有权限下创建 git 分支与检出。 |

---

## 四、cookbook/（13 篇，39 文件）

**主题**：仓库贡献者的操作手册与评审清单，回答「我要新增 X，按什么顺序改哪些文件」。 **覆盖**：包、工具、LLM 适配器、设置卡片、Remote API、会话格式版本、UI 评审、评审流程。 **配对**：全部三件套齐全。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `adding-a-package.md` | 规范 | 172 | 新增一个 workspace 包的完整 checklist：目录布局、导出面、构建接线、文档与测试义务。 |
| `adding-a-vendored-package.md` | 规范 | 59 | 引入第三方源码（vendored）包时的裁剪、许可与升级路径约定。 |
| `adding-a-tool.md` | 参考 | 102 | 模型可调用工具必须满足的契约参考（最小形状、schema、呈现、错误），教程在 `user/develop/basic/tool.md`。 |
| `adding-an-llm-adapter.md` | 规范 | 43 | 接入新模型适配器的最小实现与注册点。 |
| `adding-a-settings-card.md` | 规范 | 72 | 在设置页新增卡片：注册、schema、持久化归属、UI 约束。 |
| `adding-a-remote-api.md` | 规范 | 197 | 新增 Host↔Client Remote API：描述符、权限、错误码、客户端消费。 |
| `adding-a-session-format-version.md` | 规范 | 153 | 会话格式升版的标准流程：声明、兼容性确认、目录重生成、迁移记录。 |
| `adding-a-plugin-preview.md` | 规范 | 45 | 为插件增加预览/试装能力的最小改动。 |
| `extension-cookbook.md` | 教程 | 132 | 扩展开发总食谱，串联各类扩展形态与对应参考页。 |
| `reviewing-persistence-type-changes.md` | 规范 | 122 | 评审持久化类型变更的清单：兼容性、旧数据、目录更新。 |
| `reviewing-ui-design.md` | 规范 | 166 | UI 设计评审的执行清单（流程视角），判定原则与案例在 `ui-design-review-cases.md`。 |
| `maintaining-dsh-code-review.md` | 规范 | 64 | 维护自动代码评审规则本身的说明。 |
| `responding-to-pr-review-on-a-stack.md` | 规范 | 32 | 堆叠 PR 上回应评审意见的操作约定。 |

---

## 五、Cordis 框架文档（14 篇，40 文件）

### 5.1 `cordis-tutorial/`（8 篇，24 文件）

**主题**：从零写出第一个插件到并入 harness 的渐进式教程，是插件作者的入门主线。**配对**：齐全。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `index.md` | 教程 | 60 | 教程路线图与前置条件。 |
| `01-first-plugin.md` | 教程 | 95 | 写出并加载第一个插件。 |
| `02-lifecycle-and-effects.md` | 教程 | 98 | 生命周期与副作用的登记/回收。 |
| `03-services.md` | 教程 | 98 | 定义与消费服务。 |
| `04-events.md` | 教程 | 144 | 事件的发布、订阅与顺序。 |
| `05-config.md` | 教程 | 111 | 插件配置的声明与解析。 |
| `06-composition-and-hmr.md` | 教程 | 113 | 组合与热更新时的状态处理。 |
| `07-into-the-harness.md` | 教程 | 109 | 把插件并入本仓库并从 UI 可见。 |

### 5.2 `cordis-api/`（6 篇，16 文件）

**主题**：框架 API 精确参考，配合教程查签名。**配对**：5 篇三件套；`inherited.md` 单语（清单已排除，属正常）。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `context.md` | 参考 | 364 | `Context` 的成员、插件的挂载与依赖声明语义。 |
| `events.md` | 参考 | 207 | 事件系统 API：注册、派发、错误传播。 |
| `fiber.md` | 参考 | 428 | Fiber（插件实例）的调度、状态与销毁。 |
| `registry.md` | 参考 | 152 | 注册表 API：键、作用域、冲突处理。 |
| `service.md` | 参考 | 102 | 服务声明与获取的 API 形态。 |
| `inherited.md` | 参考 | 39 | 继承成员的清单，说明哪些能力由上游框架提供。 |

---

## 六、defensive-patterns/（6 篇，18 文件）

**主题**：按「改动面」划分的防御性设计约束，回答「改这里最容易踩什么坑」。**配对**：齐全。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `README.md` | 索引 | 25 | 按改动位置选择对应约束页的导航。 |
| `general.md` | 规范 | 224 | 跨层通用防御约束（已发布到站点），全仓适用。 |
| `package-surface.md` | 规范 | 233 | 包导出面的稳定性与内部实现边界。 |
| `client-components.md` | 规范 | 493 | 客户端组件的状态、渲染与副作用约束。 |
| `conversation-and-session.md` | 规范 | 316 | 会话/对话数据模型变更的防御要点。 |
| `remote-and-api.md` | 规范 | 117 | Remote/HTTP 接口的兼容性与失败处理约束。 |

---

## 七、postmortem/（5 篇，15 文件）

**主题**：真实事故复盘，每篇一个已修复的缺陷，固定四段结构（现象/根因/修复/防止再犯）。**配对**：齐全。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `README.md` | 索引 | 18 | 复盘收录规则与清单。 |
| `0001-acp-default-export-drops-inject.md` | 记录 | 113 | ACP 模块默认导出导致 `inject` 被丢弃的事故。 |
| `0002-js-expression-disabled-filesystem-tools.md` | 记录 | 47 | JS 表达式模式下文件系统工具被整体禁用的事故。 |
| `0003-web-agent-gui-feedback-loop.md` | 记录 | 53 | Web Agent GUI 反馈回路的死循环事故。 |
| `0004-landlock-partial-notice-misclassified-child-failures.md` | 记录 | 55 | Landlock 部分提示把子进程失败误分类的事故。 |

---

## 八、i18n/（5 篇，9 文件）

**主题**：翻译体系自身的规范。前 3 篇为单语（清单已排除），后 2 篇为三件套。**配对**：不完全，属设计如此。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `README.md` | 规范 | 71 | 三件套配对的所有者契约：何时新增 `.zh.md`、`.i18n.yaml` 记什么、门禁怎么判。 |
| `translation-rules.md` | 规范 | 69 | 中英翻译的硬规则（术语、语序、代码不译）。 |
| `terminology.md` | 参考 | 215 | 翻译用术语对照表（与 `glossary.md` 用途不同，见第六节）。 |
| `style-samples.md` | 参考 | 87 | 正/反例句对，供校对时对齐语感。 |
| `translation-prompt.md` | 参考 | 263 | 机器翻译实际使用的提示词全文，是复现翻译结果的依据。 |

---

## 九、user/（21 篇 + 4 图，67 文件）

**主题**：面向最终用户与插件开发者的产品文档，是文档站的主干。**配对**：齐全（含 2 组双语截图）。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `index.md` | 索引 | 11 | 仅做 meta refresh 跳转到 `guide/quickstart`（站点路由），本身无正文。 |
| `guide/index.md` | 教程 | 32 | Web UI 入门首页（对外路由为 `guide/quickstart.md`）。 |
| `guide/providers.md` | 教程 | 231 | 配置模型提供商与模型可见性，含截图。 |
| `guide/network-proxy.md` | 教程 | 85 | 企业网络下的代理设置。 |
| `guide/mcp-memory.md` | 教程 | 101 | 接入 MCP 记忆服务。 |
| `guide/plugin-market.md` | 教程 | 150 | 插件市场的浏览、安装与卸载。 |
| `guide/public-deployments.md` | 教程 | 37 | 公开部署的访问方式说明。 |
| `guide/python-sdk.md` | 教程 | 200 | Python SDK 的安装与最小用法。 |
| `guide/schedule.md` | 教程 | 98 | 定时任务的创建与管理。 |
| `guide/github-review.md` | 教程 | 99 | 在应用内使用 GitHub 评审流程。 |
| `guide/desktop-uninstall-cleanup.md` | 教程 | 60 | 桌面端卸载后的残留清理指引。 |
| `develop/basic/index.md` | 教程 | 137 | 插件开发起步：搭一个 scratch 插件并在 UI 看到效果。 |
| `develop/basic/tool.md` | 教程 | 52 | 给插件加一个工具（教程视角），契约参考在 `cookbook/adding-a-tool.md`。 |
| `develop/basic/config.md` | 教程 | 106 | 插件配置的声明与读取。 |
| `develop/basic/publish.md` | 教程 | 191 | 插件打包与发布。 |
| `develop/framework/index.md` | 教程 | 144 | 插件框架进阶总览。 |
| `develop/framework/service.md` | 教程 | 148 | 服务的定义与依赖。 |
| `develop/framework/events.md` | 教程 | 143 | 事件的使用与顺序语义。 |
| `develop/practice/index.md` | 教程 | 155 | 实践篇总览。 |
| `develop/practice/dynamic-cordis.md` | 教程 | 15 | 动态 Cordis 的极简说明（几乎只是指路）。 |
| `develop/practice/llm-adapter.md` | 教程 | 189 | 写一个 LLM 适配器（教程视角），规范在 `cookbook/adding-an-llm-adapter.md`。 |

素材：`guide/providers-custom-form.{png,zh.png}`、`guide/providers-models-page.{png,zh.png}`，均为文档内嵌截图。

---

## 十、persistence-changes/（227 文件）

**主题**：会话持久化的变更台账。一条记录 = 一次类型变更的声明 + 兼容性确认 + 验证方式 + 开发说明；一个版本清单 = 该版本发布时的 schema 快照。**配对**：记录与版本均 `md + zh + i18n + schema.json` 四件套。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `README.md` | 规范 | 103 | 台账规则：何时必须开记录、兼容性如何声明、`schema.json` 怎么生成、版本清单如何冻结。 |
| `2026-09-11-initial.md` | 记录 | 280 | 初始基线：第一批持久化类型的总体声明。 |
| `2026-09-12-auto-review-error-metadata.md` | 记录 | 52 | 自动评审错误元数据的字段补充。 |
| `2026-09-13-working-directory.md` | 记录 | 48 | 引入工作目录字段。 |
| `2026-09-14-image-offload.md` | 记录 | 96 | 图片外置存储的字段与引用变化。 |
| `2026-09-14-workspace-changes-event.md` | 记录 | 48 | 工作区变更事件的新增。 |
| `2026-09-16-session-format-v4.md` | 记录 | 120 | 会话格式升到 v4 的兼容性声明。 |
| `2026-09-18-schedule-optional-title.md` | 记录 | 48 | 定时任务标题改为可选。 |
| `2026-09-19-external-subagent-catalog.md` | 记录 | 48 | 外部子代理目录字段。 |
| `2026-09-20-unknown-child-catalog.md` | 记录 | 48 | 未知子项目录的兜底结构。 |
| `2026-09-21-user-question-reply.md` | 记录 | 60 | 用户问答回复的持久结构。 |
| `2026-09-30-job-session-lifecycle.md` | 记录 | 52 | 后台任务与会话生命周期关联。 |
| `2026-10-05-ptc-operation-metadata.md` | 记录 | 48 | PTC 操作元数据字段。 |
| `2026-10-05-working-directory-attribution.md` | 记录 | 60 | 工作目录的归属归属修正。 |
| `2026-10-07-title-reasoning-effort.md` | 记录 | 48 | 标题推理强度字段。 |
| `2026-10-13-deepseek-search-thinking.md` | 记录 | 48 | DeepSeek 搜索思考过程字段。 |
| `2026-10-13-liveshare-share-viewer-principal.md` | 记录 | 60 | LiveShare 观看者主体标识。 |
| `2026-10-13-user-rpc-principal.md` | 记录 | 60 | 用户 RPC 调用主体标识。 |
| `2026-10-19-session-team-mode.md` | 记录 | 48 | 会话级团队模式字段。 |
| `2026-10-22-action-card-status.md` | 记录 | 60 | 动作卡片状态字段。 |
| `2026-10-25-skill-catalog-incomplete.md` | 记录 | 60 | 技能目录不完整状态的结构。 |
| `2026-10-27-retry-control-input.md` | 记录 | 60 | 重试控制输入的持久结构。 |
| `2026-10-27-subagent-settlement-attribution.md` | 记录 | 60 | 子代理结算归属。 |
| `2026-11-02-subagent-catalog-names.md` | 记录 | 48 | 子代理/目录负载 v3，记录子项名称唯一性。 |
| `2026-11-02-team-task-owner-names.md` | 记录 | 48 | 团队任务所有者名称字段。 |
| `releases/`（26 个版本 + README，107 文件） | 记录 | 75–295 | 每个已发布版本冻结的持久化 schema 快照与说明。版本从 `dsh-v0.0.1-rc.1` 到 `dsh-v0.1.5-rc.2`。 |
| `historical-formats/README.md` | 索引 | 75 | 历史格式说明的阅读指引与版本关系。 |
| `historical-formats/v0.md` | 记录 | 5,105 | 历史会话格式 v0 的完整字段规格（用于读旧数据）。 |
| `historical-formats/v1.md` | 记录 | 5,107 | 历史会话格式 v1 规格。 |
| `historical-formats/v2.md` | 记录 | 5,362 | 历史会话格式 v2 规格。 |
| `historical-formats/v3.md` | 记录 | 5,634 | 历史会话格式 v3 规格（当前迁移起点）。 |
| `finalized/v4.json` | 生成 | 1 文件 | v4 的冻结 schema JSON，供校验旧数据使用。 |

**结构判断**：24 条记录与 26 份版本清单的职责依据文件名、frontmatter 与固定章节结构归纳，未逐条精读正文；`historical-formats/v0`–`v3` 只读了头部与章节标题（各 5,000+ 行）。

---

## 十一、upgrade-guide/（13 版本、147 主题、441 文件）

**主题**：面向升级者的破坏性变更说明书。一个主题目录 = 一条变更，固定三件套 `guide.md`（17–59 行）+ `.zh.md` + `.i18n.yaml`；版本目录名就是**目标版本**。 **覆盖**：13 个版本、147 条变更，是本目录文件数最多的一块。 **配对**：全部三件套齐全。 **索引**：仓库内没有 `upgrade-guide/README.md`，它在打包时由 `scripts/stage-dsh-docs.ts` 生成——不要手工补。

| 版本目录 | 条数 | guide.md 行数 | 职责 |
|---|---|---|---|
| `v0.1.7-rc.2/` | 2 | 22–25 | 升级到 0.1.7-rc.2 的破坏性变更：Schedule 移入可选束、旧 `normal` 工作详情显示为 Detailed。 |
| `v0.2.0-rc.2/` | 6 | 18–27 | 升级到 0.2.0-rc.2：账号登录错误码、Python 测试环境、运行时夹具移除、Schedule 束退役、子路径插件图标。 |
| `v0.2.1-alpha.1/` | 22 | 17–59 | 升级到 0.2.1-alpha.1：可选包显式安装、JSONL 持久化插件化、指令 home 解析、后台任务 id、子代理激活、终端命令标签、工具呈现模式、Web 监听配置迁移。 |
| `v0.2.1-alpha.2/` | 12 | 17–32 | 升级到 0.2.1-alpha.2：定时器包装返回类型、账号身份订阅、模型目录来源、桌面字号快捷键、插件覆盖安装拒绝、凭据优先级。 |
| `v0.2.1-alpha.3/` | 1 | 21 | 升级到 0.2.1-alpha.3：插件兼容性先读 `engines.dsh`。 |
| `v0.2.1-alpha.4/` | 3 | 18–30 | 升级到 0.2.1-alpha.4：账号通知字段、模型切换的上下文压力检查、会话模型选择生效时机。 |
| `v0.2.1-rc.1/` | 2 | 23–24 | 升级到 0.2.1-rc.1：指令链字节预算按链计算、子代理模型选择与控制工具。 |
| `v0.2.1-rc.2/` | 33 | 17–53 | 升级到 0.2.1-rc.2：Node 24 要求、Agent 运行时所有权、审批依赖投影注册表、条件工具、CUA 坐标与同意存储、会话投影句柄、pi-ai 1.3 目录与协议、持久终端、官方束清单。 |
| `v0.2.1-rc.3/` | 13 | 18–23 | 升级到 0.2.1-rc.3：附件引用完整性、CUA helper 授权、独立会话 fork、PTC 取消错误码、团队投影、Web 文件下载与搜索默认值。 |
| `v0.2.1-rc.4/` | 3 | 18–22 | 升级到 0.2.1-rc.4：模型列表自动刷新、Reasoning 槽位文本字段、移除 `SandboxUnsupportedPolicyError` 导入。 |
| `v0.2.2-alpha.2/` | 22 | 17–37 | 升级到 0.2.2-alpha.2：Loader 条目树、CSS 锚定菜单、桌面稳定通道名、Forge 权限与入口合并、文件系统观察策略默认关闭、投影事件帧、搜索默认走 DeepSeek。 |
| `v0.2.2-alpha.3/` | 5 | 18–49 | 升级到 0.2.2-alpha.3：`ProcessActivity.context`、`dsh-office-kit` 取代 `office-to-pdf`、Office 技能改工具、子代理按名寻址。 |
| `v0.2.2-rc.1/` | 23 | 17–48 | 升级到 0.2.2-rc.1：账号远端 provider、worktree 归档清理、CUA 原生窗口 API、`dsh-doc` 取代 Creator 技能、PTC bootstrap v3、终端后端侧栏、窗口拖拽区域。 |

**补注**：147 条变更的英文标题已在盘点时逐条抽取（用于归纳上表）。单条职责与标题一一对应，例如 `v0.2.1-rc.2/node-24/` = 「升级到 0.2.1-rc.2 必须使用 Node.js 24」。逐条中文释义未展开，因为标题本身已是完整的一句话变更说明。

---

## 十二、superpowers/（13 文件，均为本轮系列产出）

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `README.md` | 索引 | 166 | 说明本目录的定位：fork 后的分析与规划文档，已整体从翻译配对门禁中排除。 |
| `project-overview.md` | 索引 | 432 | 对上游项目的整体导览（源码规模、包分布、架构层次），是本轮分析的起点。 |
| `fork-changes.md` | 记录 | 98 | 记录本 fork 相对上游的改动清单与理由。 |
| `phase-1-rebrand-plan.md` | 记录 | 359 | 第一阶段品牌替换方案（图标、托盘、字标、README），**执行完毕后已转为历史文档**。 |
| `modules/00-consistency-review.md` | 本轮产出 | 216 | 九个模块档案的交叉一致性复核。 |
| `modules/01-agent-runtime.md` | 本轮产出 | 631 | Agent 运行时模块档案。 |
| `modules/02-tools-execution.md` | 本轮产出 | 492 | 工具与执行模块档案。 |
| `modules/03-models-and-config.md` | 本轮产出 | 562 | 模型与配置模块档案。 |
| `modules/04-web-client.md` | 本轮产出 | 529 | Web 客户端模块档案。 |
| `modules/05-plugin-ecosystem.md` | 本轮产出 | 623 | 插件生态模块档案。 |
| `modules/06-hosts-and-sdks.md` | 本轮产出 | 715 | 宿主与 SDK 模块档案。 |
| `modules/07-collaboration-scheduling.md` | 本轮产出 | 553 | 协作与调度模块档案。 |
| `modules/08-infrastructure.md` | 本轮产出 | 536 | 基础设施模块档案。 |

本轮同期还新增了 `inventory/`（14 份 TSV + `00-index.md`，即本次盘点的输入）与 `file-notes/`（各范围的文件级索引）。这两块是**清单之后**写的，不在 1,167 行内，故此处只登记归属、不展开分析。

---

## 十三、素材（19 文件）

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `logo/icon.svg`、`icon-macos.svg`、`icon-windows.svg`、`wordmark.svg` | 素材 | — | 品牌矢量源文件，图标与字标的唯一上游。 |
| `logo/icon.png`、`icon-macos.png`、`icon-windows.png`、`logo.png`、`favicon.ico`、`logo.ico`、`tray-windows.ico` | 素材 | — | 由上述 SVG 渲染出的位图/图标产物（PNG 约 71–244 KB，`logo.ico` 1,056 KB）。 |
| `logo/preview-icon.png`、`preview-tray.png`、`preview-wordmark.png` | 素材 | — | 品牌预览图，用于文档与评审。 |
| `assets/ui-design-review/inline-metrics-comparison.png`、`modal-grouping-comparison.png`、`peer-content-comparison.png`、`principles-alignment.svg`、`principles-grouping.svg` | 素材 | — | `ui-design-review-cases.md` 的对照图与原则示意图。 |

**结构判断**：只核对文件名、格式与体积，未打开图片内容。

---

## 十四、三个问题的回答

### 14.1 `docs/` 的组织方式？有没有明确的信息架构？

**有，但只对「发布」这一面明确，对「仓库」这一面是约定俗成的。**

明确的部分：`website/docs.ts` 是单一事实源，把 `source → route → 侧边栏 → 章节 → 排序` 全部显式声明，任何新增站点页面都必须改这个文件。这让站点 IA 完全可审查、可 diff。

不够明确的部分：

1. **目录名不表达读者**。`subsystems/` 同时服务站点读者和仓库贡献者；`cookbook/` 里既有「怎么加包」这种仓库操作，也有面向扩展作者的参考。找文档时只能靠内容判断。
2. **四层用途混在同一个树里**。生成物（`config-catalog.md` 等）与手写规范平级放在顶层；记录层（`upgrade-guide/`、`persistence-changes/`）与产品文档平级放在下一层。没有 `generated/`、`history/` 这样的显式分层目录。
3. **入口分散**。顶层没有 `README.md` 或 `index.md`（`AGENTS.md` 是给贡献者的，不是导航）。新读者要靠 `website/` 侧边栏或本轮新增的 `目录结构.md` 才能建立全貌。
4. **命名风格三套并存**：编号前缀（`01-first-plugin.md`、`0001-acp-...`）、日期前缀（`2026-11-02-...`）、纯主题名（`sandbox.md`）。各自合理，但整体不统一。

一句话结论：**发布面有强 IA（白名单驱动），仓库面是弱 IA（靠命名与约定）**。

### 14.2 翻译配对机制覆盖到什么程度？

- 机制：`X.md` + `X.zh.md` + `X.i18n.yaml` 三件套，由 `scripts/verify-translation-pairing.ts` 全仓扫描（`SCOPE_PATTERNS` + `translation-pairing.manifest.json` 的 `excluded` 列表）强制校验。
- 覆盖：`docs/` 下 381 个英文源中 **356 个有配对，356 个中文对应**（93.4%）。
- 未配对的 25 个**全部是有意为之**，分两类：
  - **清单排除（18 个）**：`AGENTS.md`、`cordis-api/inherited.md`、`i18n/` 3 篇单语规范、`superpowers/` 13 篇。
  - **本轮新增（7 个）**：`目录结构.md`、`inventory/00-index.md`、`file-notes/` 5 篇。
- **风险**：这 7 个新文件尚未写入 `excluded`，而校验器是对 `docs/**` 全量扫描的，因此 `verify-translation-pairing` 会把它们判为「in-scope 但缺配对」并失败。要么补中文，要么补进 `excluded`。
- 机制成熟度：排除项精确到文件、`i18n.yaml` 记录一致性、`translation-prompt.md` 保存了实际提示词，可复现。这是全仓最扎实的一套文档基础设施。

### 14.3 有没有重复或互相矛盾的主题文档？

没有发现**事实性矛盾**（同一参数两个值、同一流程两套步骤）。存在**职责重叠与入口重复**，均属设计取舍，但维护成本真实存在：

| 重叠 | 具体情况 | 判断 |
|---|---|---|
| 工具开发 | `user/develop/basic/tool.md`（教程）vs `cookbook/adding-a-tool.md`（契约参考） | 有意分工，双向互链，读者走错的风险低。 |
| LLM 适配器 | `user/develop/practice/llm-adapter.md`（教程）vs `cookbook/adding-an-llm-adapter.md`（规范） | 同上。 |
| UI 规范 | `ui-radius.md`（圆角取值）、`web-styling.md`（样式归属）、`ui-design-review-cases.md`（判定原则+案例）、`cookbook/reviewing-ui-design.md`（评审流程） | 四篇边界靠人工维护，主题相邻但内容不冲突；圆角规则只在一处定义，做法正确。 |
| 术语表 | `glossary.md`（架构术语，46 行）vs `i18n/terminology.md`（翻译术语，215 行） | 用途不同（阅读 vs 翻译），但同名概念可能在两处各写一遍，**待确认**是否同步。 |
| 架构总览 | `architecture.md`（按包）vs `subsystems/README.md`（按接缝）vs `capability-seams.md`（按能力） | 三个视角、三种切分，互为索引，不重复。 |
| 分层约束 | `architecture.md` vs `defensive-patterns/general.md` | 前者说边界，后者说改动风险，互补。 |

---

## 十五、过期与失效清单

| 严重度 | 位置 | 问题 |
|---|---|---|
| 高 | `user/index.md`、`user/guide/*.md`（含 `.zh.md`）共 12 处 | 产品名仍为 "DeepSeek Harness"，而桌面端本轮已改名为 **i-do**（appId `net.i-do.desktop`）。用户文档是品牌暴露面最大的地方，属实质性过期。 |
| 中 | `website/docs.ts`（跨边界，影响 docs 呈现） | 首页导航 `label: 'DeepSeek Harness'` 未随改名更新，站点上仍显示旧名。 |
| 中 | `subsystems/session.md`、`shell.md`、`tools.md` 及各自 `.zh.md`（共 6 处） | Agent Note 引用写成 `../../../../.agents/notes/...`，比正确层级多退两级（应为 `../../`）。因为写在代码块注释里，markdown 链接检查器跳过，门禁未报——属于「检查盲区里的坏引用」。 |
| 低 | `i18n/README.md` | 引用上游 `blob/master` 地址；本仓默认分支已是 `main`，且仓库地址已迁至 cnb / GitHub 镜像，链接语义过期（页面可打开，但指向上游）。 |
| 低 | `superpowers/phase-1-rebrand-plan.md` | 第一阶段品牌替换已执行完毕，文档停留在「计划态」。不是错误，但需读者自行判断已完成项与待办项。 |
| 低 | `user/develop/practice/dynamic-cordis.md`（15 行） | 几乎只是指路，无独立内容；与 `cordis-tutorial/` 可能重复，**待确认**是否应合并。 |
| 提示 | `graph-atlas.md`（22 行）、`experimental-persistence-catalog.md`（21 行） | 均为索引/增量页，不是完整内容。单独引用容易让人误以为看到了全集。 |
| 提示 | `persistence-changes/finalized/v4.json` | 无对应 `.md` 说明，是纯 schema 冻结产物；只能靠 `releases/` 与 `historical-formats/` 反推含义。 |

已排除的「疑似过期」（核实后**不是问题**，避免后来者重复排查）：

- `docs/user/index.md` 跳转的 `./guide/quickstart` 看似缺文件，实际是 `docs.ts` 把 `user/guide/index.md` 重写到该路由，跳转有效。
- `cookbook/adding-a-package.md`、`historical-formats/*` 中出现的 `packages/new`、`packages/old`、`packages/examples` 等是示例路径占位符，不是失效引用。
- `upgrade-guide/` 缺 `README.md` 是设计如此（打包时生成）。

---

## 十六、覆盖核对

| 项 | 数量 | 说明 |
|---|---|---|
| 清单 `docs.tsv` 数据行 | **1,167** | 与任务给定行数一致（文件共 1,168 行，首行为表头）。 |
| 本文登记的清单内文件 | **1,167** | 顶层 72 + subsystems 207 + cookbook 39 + cordis-tutorial 24 + cordis-api 16 + defensive-patterns 18 + postmortem 15 + i18n 9 + user 67 + persistence-changes 227 + upgrade-guide 441 + superpowers 13 = **1,148**；差额 19 为素材（`logo/` 14 + `assets/` 5）。合计 1,167。 |
| 清单外、本轮新增（额外登记） | 1 | `docs/superpowers/目录结构.md` |
| 盘点时刻磁盘文件总数 | 1,188 | = 1,167 + 21（`目录结构.md` 1 + `inventory/` 15 + `file-notes/` 5，后来者仍在增加）。 |
| 三层处理分布 | 索引/规范逐篇：顶层 25 + 各目录 README/规范 90 篇；主题聚合：subsystems 68、upgrade-guide 147、persistence 24+26；素材一行带过：19 | — |

**对得上**：1,167 行，一行一个文件，无遗漏、无重复登记。

---

## 十七、给后来者的三点提醒

1. **别信目录名，先看 `website/docs.ts`**：判断一篇文档「给谁看、在哪看」，这个文件比任何目录约定都可靠。
2. **生成物不要手改**：`config-catalog`、`tool-catalog`、`persistence-catalog`、`module-graph`、`graph-atlas`、`event-producer-consumer`、`session-format-status`、`finalized/v4.json` 全部有生成器；改法在 `scripts/`。
3. **新增文档的三件套 + 白名单 + 排除项**：新建 `docs/` 下的 `.md`，必须同时决定「配不配中文」「进不进 `docs.ts`」「要不要进 `excluded`」。三者漏一个，门禁就会红。
