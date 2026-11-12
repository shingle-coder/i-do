# i-do 项目功能梳理

本文件基于当前工作树（版本 `0.2.2-rc.2`）的代码与仓库内文档整理，用于回答三个问题：这个项目是什么、由哪些功能模块组成、如何运行和继续开发。事实以代码为准；无法从代码确认的内容统一放在第 12 节。

配套文档：[i-do 二开修改清单](fork-changes.md)、[一期二开方案](phase-1-rebrand-plan.md)。

## 1. 一句话定位

i-do 是基于 `deepseek-harness` 的本地优先 AI Agent 工作台：以 Cordis 插件树组装 Agent 能力，通过 CLI、Web UI、桌面端、SDK、ACP 等多种载体对外提供服务，让模型在用户本机的工作区里读写文件、执行命令、调用外部工具、委派子代理并持续维护任务状态。

它不是单纯的聊天前端，而是"Agent 运行时 + 可扩展 UI + 插件生态"三部分的组合：

- **运行时**：`packages/core` 中的 Agent 循环、会话日志、工具管线、上下文管理。
- **可扩展 UI**：`packages/client/*` 以 UI 插件（Slot）方式拼装 Web 界面，功能可以按需装卸。
- **插件生态**：profile + bundle + 插件市场，能力层可以替换、增删和热更新。

上游项目为 `https://github.com/deepseek-ai/deepseek-harness`（MIT 协议），本仓库是其二次开发分支，当前定位为开发者预览版。

## 2. 目标用户与典型场景

| 用户类型 | 使用载体 | 典型诉求 |
| --- | --- | --- |
| 本机开发者 | Web UI / 桌面端 | 在真实仓库里让 Agent 读代码、改文件、跑命令、做重构与排查 |
| 终端用户 | `dsh headless` / TUI profile | 脚本化执行一次性任务，或使用全键盘交互 |
| 团队使用者 | Web UI 的 Agent Teams、Subagent、Workflow | 并行拆分子任务，汇总多方结果 |
| 自动化集成方 | `dsh --profile sdk` / `dsh --profile acp` | 用 JSON-RPC 或 ACP 把 Harness 嵌入自己的应用 |
| Python 开发者 | `python/sdk` | 以 Python API 驱动同一个运行时 |
| 插件开发者 | plugin-manager / 插件市场 | 给 Agent 增加工具、给 UI 增加页面、替换模型或执行环境 |
| 桌面用户 | Electron 桌面端 | 免命令行安装、托盘常驻、自动更新 |

核心业务闭环：**选择工作区 → 发起会话 → Agent 多步执行（读文件/调工具/跑命令）→ 用户审批或补充 → 产出文件与交付物 → 会话持久化并可恢复/分享**。

## 3. 仓库结构

这是一个 pnpm workspace monorepo，根 `package.json` 的 `workspaces` 覆盖 `vendor/*`、`packages/*/*`、`native/system`、`apps/*`、`website`。

| 目录 | 职责 |
| --- | --- |
| `apps/` | 可执行载体：`cli`、`web`、`desktop`、`desktop-host`、`plugin-market-generator` |
| `packages/` | 50 余个能力包组，按领域划分（core、llm、session、client、host、sandbox 等） |
| `python/` | Python SDK 与随包运行时（wheel），通过子进程驱动 Harness |
| `native/` | 原生模块（`native/system`，按平台构建 host addon） |
| `vendor/` | 内置的 Cordis 相关依赖 |
| `website/` | VitePress 文档站 |
| `docs/` | 架构、子系统、用户指南、开发指南、工具/配置目录 |
| `scripts/` | 构建、校验、迁移、发布等工程脚本 |
| `benchmarks/`、`snapshots/` | 基准测试与快照/回放资产 |
| `.agents/` | Agent 工作流约定与设计笔记 |

## 4. 架构总览

### 4.1 一切能力都是插件

项目使用 Cordis 插件体系：每个能力包向 `ctx` 注册服务或工具（如 `ctx.tools`、`ctx.llm`、`ctx.sessions`、`ctx.webServer`），由配置树决定加载哪些插件。Agent 行为因此可以通过更换插件组合来改变，而不必改核心代码。

配置树自空根开始，按固定顺序叠加（见 [apps/cli/README.zh.md](../../apps/cli/README.zh.md)）：

```text
bundle 层（可多层，按 profile 的 dsh.profile.bundles 顺序；层内按 dsh.bundle.patch 文件顺序）
→ profile 自身 cordis.patch.yml
→ $DSH_HOME/cordis.patch.yml（home 级用户层，高于逐 profile 层）
→ 命令行 --patch 指定的覆盖层（按 argv 顺序，后者更高）
→ telemetry 补丁（启动器最后追加）
```

权威实现在 `packages/boot/app-boot/src/profile-context.ts` 的 `readProfilePatches()`。

几个关键概念：

- **profile**：一个目录（默认 `$DSH_HOME/profiles/<name>`），包含 `package.json`（记录树外插件和 `dsh.profile.bundles` 列表）与 `cordis.patch.yml`（用户覆盖层）。
- **bundle**：预置的插件组合包，官方提供 `base`、`web-app`、`headless`、`sdk-app`、`sdk-minimal`、`acp-app`（见 [packages/bundle](../../packages/bundle/)）。
- **patch**：YAML 形式的配置覆盖层；启用 `dsh-hmr` 时，profile manifest 与各级 patch 变化会触发统一串行重载。
- **profile 解析顺序**：先从 dsh 安装目录解析内置 bundle，再从 profile 自己的 `node_modules` 解析树外插件。

### 4.2 进程与通信通道

| 载体 | 启动方式 | 关键入口 | 通信方式 |
| --- | --- | --- | --- |
| CLI 启动器 | `dsh <profile>` | [apps/cli/src/bin.ts](../../apps/cli/src/bin.ts)、[args.ts](../../apps/cli/src/args.ts) | 解析启动参数，之后全部交给 profile |
| Web UI | `dsh web` | [apps/web/src/main.ts](../../apps/web/src/main.ts) | 浏览器 ↔ Host：HTTP 路由 + WebSocket 事件流；默认绑定 `127.0.0.1:3080`（`--host` / `--port` 可覆盖，见 [06 §2.4](modules/06-hosts-and-sdks.md)） |
| 桌面端 | Electron | [apps/desktop/src/main.ts](../../apps/desktop/src/main.ts) | Electron 主进程 ↔ `desktop-host` ↔ 内置 CLI profile |
| Headless | `dsh --profile headless "任务"` | `headless` bundle | 单会话执行，打印最终答案后退出 |
| SDK | `dsh --profile sdk` | [packages/sdk](../../packages/sdk/) | 换行分隔的 JSON-RPC over stdio |
| ACP | `dsh --profile acp` | [packages/acp](../../packages/acp/) | Agent Client Protocol over stdio |
| Python SDK | `python/sdk` | [python/README.md](../../python/README.md) | 子进程 + JSON-RPC，使用随包 runtime |

Web 端是典型的前后端两半：

- **Host 半**（`packages/host/*`）：`webserver` 提供 HTTP 服务、路由与升级；`frontend-static` 在 fallback 位置托管构建后的 SPA；`directory-picker-*` 提供目录选择；`open-in-app` 负责"在外部应用中打开"。
- **浏览器半**（`packages/client/*`）：`web` 启动壳、`connection` 维持 RPC 与事件投递、`modules` 加载客户端插件、`ui-*` 包提供具体界面。

## 5. 关键业务流程

### 5.1 Web 模式启动链路

1. 终端执行 `pnpm dsh web`（开发态）或安装后的 `dsh web`。
2. CLI 载入 `web` profile；profile 首次使用时从随附模板初始化。
3. 配置树叠加 `dsh-base` 与 `dsh-web-app` 等 bundle 的 patch。
4. `packages/host/webserver` 起 HTTP 服务，`frontend-static` 提供页面资源；命令输出访问地址。
5. 浏览器加载 SPA，`apps/web/src/main.ts` 创建 `AppWebEntry`；桌面环境下会等待 `dshDesktopBoot.ready()` 注入 Host 地址与流地址。
6. 新建的 Web UI 默认不选中工作区；用户在"选择工作区"中添加目录后才能输入消息（见 [docs/user/guide/index.zh.md](../../docs/user/guide/index.zh.md)）。
7. 选择模型：设置 → 模型，填入 DeepSeek API Key 或其他提供方配置，保存后即时生效。

### 5.2 一次对话的 Agent 循环

核心实现位于 [packages/core/agent-loop/src/agent.ts](../../packages/core/agent-loop/src/agent.ts)：

1. **认领输入**：从一个 turn 的 inbox 取用户消息，读取当前模型选择，解析可用工具集，组装 system prompt，并触发 `agent/pre-step` 事件决定是否进入该 step。
2. **记录边界**：写入 `turn/start` 等会话事件，保证后续可恢复。
3. **生成模型请求**：冻结历史边界，构造 `GenerateOptions`，通过 `ctx.llm` 发起流式请求。
4. **流式消费**：assistant 文本、思考内容、工具调用增量进入事件日志，并实时推送到 UI。
5. **执行工具调用**：按调用批次执行；需要审批时挂起等待用户决定；工具结果作为新的消息进入下一 step。
6. **决定继续或结束**：若模型要求继续（`next-step` / 工具结果），进入下一个 step；否则记录 `turn/end` 并结束。
7. **持久化**：在三个语义边界落盘（checkpoint 策略）：模型请求前（`llm/stream`）、顶层工具执行前（`tools/execute`）、step 开始前（`agent/pre-step`），进程异常退出时可恢复到最后一致点。

### 5.3 工具调用、审批与沙箱

- 工具通过 `ctx.tools` 注册；模型看到的是带 schema 的工具目录（生成结果见 [docs/tool-catalog.md](../tool-catalog.md)）。
- 每个工具的访问级别由**权限预设**与**沙箱策略**共同约束。沙箱提供三种模式：`read-only`、`workspace-write`、`danger-full-access`（见 [packages/sandbox](../../packages/sandbox/README.md)）。
- 被策略拒绝的操作可以走"一次性升级"，必须由用户批准。
- Web UI 中的审批请求由 `ui-approval` 呈现，用户的选择回传给 Host 后继续执行。
- 命令执行与文件访问共享同一套策略：`sandbox-local` 提供 Linux、macOS、Windows 三类平台后端，具体隔离机制见各包 README；文件侧由 `fs-sandbox` 复用同一策略。

### 5.4 会话持久化与恢复

- 会话是一条只追加的事件日志，事件类型包含 turn、step、消息、工具调用、审批、压缩等。
- 默认后端为 JSONL：每个 Session 使用不可变的规范代际文件名，成功写完后才发布后继文件，可选 Zstandard 压缩（`packages/session/session-persistence-jsonl`）。
- 会话格式带有版本链：v0→v1→v2→v3→v4 的相邻迁移均有冻结的解码器，读取旧会话时会自动迁移（`packages/session/session-format-*`）。
- 投影（projection）把事件折叠成 UI 直接可用的整体值，例如会话统计、turn 大纲；`session-projection-cache` 持久化检查点，冷启动读取时无需全量重放。
- 标题由 `session-title` 维护：默认确定性回退，可挂载 LLM 标题策略。
- 独立的 `packages/session-query` 提供只读查询与工具访问，不与写入路径耦合。

### 5.5 插件安装与热更新

- `dsh plugin --profile <name> <pnpm 参数>` 把包操作转发给 profile 目录中的 pnpm。
- 插件管理器与 CLI 复用同一套 profile 包操作逻辑，避免两处实现不一致。
- 安装/启动时按插件声明的 `engines.dsh`（缺失则按 DSH peer 范围）检查运行时版本，不兼容插件需要用户显式确认豁免。
- 启用 `dsh-hmr` 后，编辑 profile manifest 或 patch 文件会触发重载；未启用时需重启生效。

### 5.6 定时任务

`packages/schedule` 由 Host 持有任务记录，支持 RFC 5545 循环规则，任务可投递到已有会话或新建会话，并跨 Host 重启保留。到期任务以普通后续消息进入目标会话，不是邮件/短信/推送。Web 侧对应"自动化任务"页面（`packages/client/ui-schedule`）。

## 6. 功能模块详解

### 6.1 载体层：程序如何被启动

| 模块 | 作用 | 主要位置 |
| --- | --- | --- |
| CLI | 唯一受支持的 Node 启动器，解析 profile/plugin/dump-config 等模式 | `apps/cli/src/bin.ts`、`apps/cli/src/args.ts`、`apps/cli/src/profile-boot.ts` |
| Web 应用 | 构建 SPA，由 `dsh web` 的 Host 提供；桌面端复用同一份前端 | `apps/web/src/main.ts`、`apps/web/vite.config.ts` |
| 桌面端 | Electron 外壳：窗口、托盘、更新、单实例、权限与 IPC | `apps/desktop/src/*`（`main.ts`、`tray.ts`、`update-*.ts`、`host-process.ts`） |
| Desktop Host | 为桌面端托管私有 Host 与 profile 生命周期 | `apps/desktop-host` |
| 插件市场生成器 | 把插件索引源生成市场页所需的 index 与图标 | `apps/plugin-market-generator/src/cli.ts` |
| 文档站 | VitePress 站点，同时作为用户/开发文档入口 | `website/` |

CLI 的入口模式（摘自 `apps/cli/README.zh.md`）：

| 命令 | 用途 |
| --- | --- |
| `dsh <name>` / `dsh --profile <name>` | 启动 `$DSH_HOME/profiles/<name>` |
| `dsh --profile acp` | 以 ACP stdio 服务自动化客户端 |
| `dsh --profile headless "job"` | 运行一个持久化会话，打印最终答案后退出 |
| `dsh --profile sdk` / `sdk-minimal` | 以 JSON-RPC stdio 服务 SDK 客户端 |
| `dsh web` | 启动 Web profile |
| `dsh plugin --profile <name> <pnpm args>` | 管理该 profile 的插件 |
| `--from-default-profile <template>` | 用随附模板重建自定义 profile |
| `--dump-config` / `--dump-default-config` / `--dump-config-schema` | 不启动进程检查组合后的配置树 |

启动器只解析自身 flag，遇到第一个不认识的 token 后，剩余参数全部交给应用插件；例如 `dsh --profile web --port 8080` 中 `--port` 属于 Web 应用。

### 6.2 Agent 核心

| 关注点 | 说明 | 主要位置 |
| --- | --- | --- |
| Agent/turn/step | 输入认领、step 循环、中断、结束原因 | `packages/core/agent-loop/src/agent.ts` |
| 会话对象 | 事件接入、校验、flush、created/disposed 生命周期与格式版本 | `packages/core/session/src/index.ts`、`types.ts` |
| 工具注册 | 工具 schema、执行、结果回填、批处理 | `packages/core/tools`、各 `tool-*` 包 |
| System prompt | 按插件贡献拼装提示词（环境、工具说明、技能、记忆等） | `packages/core/system-prompt` |
| 会话编排 | 会话创建、恢复、分叉、归档等上层服务 | `packages/core` 内会话相关包 |

Agent 核心与 UI 解耦：所有状态变化都写入会话事件，Web 端通过投影与事件流展示，因此同一会话可以被不同载体读取。

### 6.3 模型接入

| 能力 | 说明 | 主要位置 |
| --- | --- | --- |
| 模型服务抽象 | 模型注册、解析、流式生成、失败与重试 | `packages/llm/llm` 等 |
| DeepSeek 适配 | 官方 API、SSE 流解析、图片/文件输入、错误重试 | `packages/llm/llm-deepseek/src/adapter.ts` |
| 兼容端点 | 通过设置配置 OpenAI 兼容的 Base URL 与密钥 | 设置 → 模型（`packages/client/ui-settings-models`） |
| 模型目录与计量 | 提供方/模型数据、token 计量、DeepSeek 专属扩展 | `packages/llm/llm-pi-ai`、`token-meter`、`deepseek-llm-api-extensions` |
| 鉴权与重试 | API Key 与账号两种鉴权、失败重试策略 | `packages/llm/llm-deepseek-api-key`、`llm-deepseek-account`、`llm-retry` |

模型选择是会话级状态：切换后写回会话，后续 step 使用新模型；API Key 与端点由设置层管理，不进入会话日志的明文。

### 6.4 会话数据面

`packages/session/*` 负责"把会话写对、读回、投影、命名、上报"：

- 写入：`session-persistence` 定义服务契约，`session-persistence-jsonl` 是默认后端。
- 一致性：`session-checkpoint-policy` 在模型请求前、顶层工具执行前、step 开始前落盘。
- 读模型：`session-projection`、`session-stats`、`session-turn-outline`、`session-projection-cache`。
- 命名：`session-title`、`session-title-first-prompt-llm`。
- 遥测：`session-telemetry`、`session-telemetry-otel`（可禁用）。
- 目录：`working-directory` 管理会话实际执行目录，并提供 `working_directory` 工具。

`packages/session-query` 与上述写路径分开，提供跨会话的只读检索与查询工具。

### 6.5 执行环境与隔离

| 模块 | 作用 | 主要位置 |
| --- | --- | --- |
| 命令执行 | 一次性 shell 命令、输出与退出码 | `packages/shell`、`packages/subprocess` |
| 持久终端 | 跨工具调用保活的交互式 bash/pwsh/REPL 会话 | `packages/terminal`、`terminal-bash` |
| 沙箱 | 只读/工作区可写/完全访问三档，按平台提供后端 | `packages/sandbox`、`sandbox-local`、`sandbox-policy`、`sandbox-windows-acl` |
| 远程执行 | SSH 连接与远程命令 | `packages/ssh` |
| 后台作业 | 长任务的启动、流式输出、状态查询 | `packages/jobs` |
| PTC 运行时 | 在沙箱 Node 进程中执行模型编写的程序化工具调用脚本 | `packages/ptc-runtime` |
| 文件系统 | 读写、搜索、补丁与策略约束 | `packages/fs`（`fs-local`、`fs-sandbox`、`fs-patch`、`tool-fs-search`） |

终端会话只在当前 Harness 进程内有效，进程重启后不保留；需要跨重启的任务应使用后台作业或定时任务。

### 6.6 文件、知识与文档

| 模块 | 作用 | 主要位置 |
| --- | --- | --- |
| 工作区 | 目录添加、选择、记录与恢复 | `packages/workspace` |
| 代码智能 | LSP 诊断、跳转、符号等 | `packages/lsp` |
| 技能 | 从项目/用户目录发现 `SKILL.md`，按需加载完整指令 | `packages/skill`（`skill-filesystem`、`skill-office`、`tool-skill`） |
| Office 文档 | Word/Excel/PPT/PDF 渲染、格式转换、公式重算 | `packages/document`（`office-kit`、`tool-office`） |
| 附件 | 持久化图片附件（仅栅格格式）：保存到本机、在历史中重新展示并随消息发送给模型 | `packages/attachment`、`packages/client/ui-attachment` |
| 存储与大输出 | 统一存储接口；超大工具输出旁路到文件避免撑爆上下文 | `packages/storage`、`packages/spill` |

文档能力的模型工具为 `office_render`、`office_convert`、`office_recalculate`，支持扩展名 `doc/docx/odt/xls/xlsx/ods/ppt/pptx/odp/pdf`；输出文件由模型通过 shell 复制到目标位置（见 `packages/document/tool-office/README.md`）。

### 6.7 网络与外部系统

| 模块 | 作用 | 主要位置 |
| --- | --- | --- |
| Web 检索/抓取 | 搜索、抓取网页并转换为可读内容 | `packages/web` |
| MCP | 连接 MCP Server，导入其工具、指令与资源；支持设置驱动的多 Server 管理 | `packages/mcp`（`mcp-client`、`mcp-manager`、`mcp-resources`） |
| 浏览器自动化 | 让 Agent 操作真实浏览器页面 | `packages/browser-use` |
| 桌面自动化 | 通过系统 UI 自动化操作桌面应用 | `packages/computer-use` |

MCP 与内置工具走同一套工具注册与审批管线；未配置 Server 时，相关工具不会出现在模型上下文中。

### 6.8 协作与流程控制

| 模块 | 作用 | 主要位置 |
| --- | --- | --- |
| 子代理 | 派生独立上下文的 Agent 完成子任务并回传结果 | `packages/subagent` |
| Agent Teams | 多子代理共享任务板与协作状态 | `packages/team` |
| 工作流 | 模型编写编排脚本，扇出子代理并返回最终值 | `packages/workflow`（`workflow`、`workflow-ptc`、`tool-workflow`） |
| 目标 | 每个会话维护一个持久目标，可跨重启/恢复/分叉推进；支持 `/goal` 直接操作与可选的自动续跑 | `packages/goal` |
| 计划模式 | 先产出计划、经确认后执行 | `packages/plan` |
| 待办 | 会话内任务清单的增删改查 | `packages/todo` |
| 定时任务 | Host 持有的循环任务与提醒 | `packages/schedule` |
| 上下文管理 | 上下文窗口观测、压缩与摘要 | `packages/context`、`packages/compaction` |
| 守卫 | 对危险操作或策略违规做拦截 | `packages/guard` |

这些能力的共同点是"改变 Agent 的控制流"：子代理/团队/工作流改变执行拓扑，计划/目标/待办改变任务推进方式，压缩改变上下文生命周期。

### 6.9 人机交互与 UI

- **Host 侧**：`packages/host/webserver` 负责路由、升级与回退；`frontend-static` 托管 SPA；`directory-picker-native|browse|auto` 提供目录选择后端；`open-in-app` 探测并拉起本机应用。
- **浏览器侧**：`packages/client/connection` 维护 RPC 与事件流，`modules` 加载客户端插件，`ui-renderer` 把 Slot 数据绑定到 React 并挂载应用。
- **交互能力**：会话、审批、用户提问、技能/文件/会话引用、模型选择、权限预设、计划状态、目标、子代理树、后台作业、工作流回放、交付物、消息反馈、快捷键、主题与国际化。
- **对外 API**：`packages/api` 定义 Host 侧接口，`packages/sdk` 提供 TypeScript SDK，`packages/acp` 提供 ACP 适配，`packages/typert` 提供类型化 RPC 基础设施。

Web UI 的具体功能清单见第 7 节。

### 6.10 设置、凭据与可观测性

| 模块 | 作用 | 主要位置 |
| --- | --- | --- |
| 设置 | 分层设置模型：默认值、部署、用户、会话覆盖 | `packages/settings` |
| 凭据 | API Key、OAuth 等敏感信息的存储与引用 | `packages/credentials` |
| 身份 | 用户/设备标识 | `packages/identity` |
| 遥测 | 会话遥测与产品事件，可关闭 | `packages/telemetry`、`packages/session/session-telemetry-otel`、`packages/host/product-telemetry-otel` |
| 反馈 | 消息评分与反馈表单 | `packages/feedback`、`packages/client/ui-message-feedback` |
| 交付物 | 变更文件卡片、对比视图、最终回答中的文件引用 | `packages/deliverables`、`packages/client/ui-deliverables` |

设置页按插件贡献分区：模型、通用、Shell、Agent Loop、Subagent、Web 搜索、插件清单等；每个分区由对应的 `ui-settings-*` 包提供。

### 6.11 SDK、ACP、Python 与原生

| 模块 | 说明 | 主要位置 |
| --- | --- | --- |
| TypeScript SDK | 通过 JSON-RPC 驱动 Harness，支持事件订阅与工具调用 | `packages/sdk` |
| ACP | 面向支持 Agent Client Protocol 的编辑器/客户端 | `packages/acp` |
| Python SDK | 子进程 + 换行分隔 JSON-RPC；SDK 与 bundled runtime 同包分发，默认使用 `sdk` profile，极简示例使用 `sdk-minimal` | `python/sdk`、`python/README.md` |
| 原生模块 | 平台相关的 host addon，由 `native/system/scripts/build.ts` 构建 | `native/system` |

桌面端还提供内置 CLI：`resources/runtime/cli/bin/dsh` 使用 Electron 运行时与内置 pnpm，安装后无需额外 Node 环境即可管理 Desktop profile。

## 7. Web UI 功能地图

按用户可见区域归纳（实现均位于 `packages/client/ui-*`）：

| 区域/功能 | 提供的能力 |
| --- | --- |
| 工作区与侧栏 | 工作区选择/创建、会话列表、文件页、右侧栏多标签 |
| 会话与输入 | 对话流、输入框、附件、@文件/@会话引用、技能引用、命令补全、模型选择 |
| 执行可视化 | 工具调用树、审批卡片、用户提问、计划状态、目标、子代理树、Agent Team 任务板、后台作业、工作流回放 |
| 右侧栏 | 文件树、文档预览、内置浏览器（`ui-sidebar-browser`）、定时任务标签 |
| 设置 | 模型提供方、通用、Shell、Agent Loop、Subagent、Web 搜索、插件清单、权限预设 |
| 插件 | 已安装插件管理（启用/禁用/重试/组合）、插件市场 Discover、插件清单只读视图 |
| 自动化 | 自动化任务页：创建、编辑、暂停、恢复、立即运行、删除 |
| 交付与反馈 | 变更文件卡片与对比、交付卡片、消息评分与反馈 |
| 桌面集成 | 目录选择（原生/应用内）、在外部应用中打开、桌面通知与更新提示 |

## 8. 数据模型与接口约定

### 8.1 会话模型

- **Session header**：记录会话标识、创建信息、格式版本等，创建后冻结。
- **Session event**：只追加的事件流，覆盖 turn/step、用户消息、assistant 流、工具调用、审批、压缩、标题等。
- **Persistence generation**：每次完整写入生成新的规范文件，成功后发布；读者按目录中的代际文件恢复。
- **Checkpoint**：模型请求前、顶层工具执行前、step 开始前三个关键点保证可恢复。

### 8.2 工具模型

- 工具定义包含名称、描述、参数 schema、执行函数与访问策略。
- 工具结果可以是文本、结构化内容或文件引用；超大结果通过 spill 旁路。
- 工具注册是动态的：插件装载/卸载会改变模型可见工具集，变更会写入会话，保证重放一致。

### 8.3 配置与设置

- 配置树（Cordis YAML）决定"加载哪些插件"。
- 设置（settings）决定"插件如何工作"，按层级覆盖并持久化。
- 凭据单独存储，设置中只保存引用。
- 插件元数据通过 `dsh.profile`、`engines.dsh`、`client` 声明表达依赖、版本兼容与前端贡献。

### 8.4 外部接口

| 接口 | 场景 | 传输 |
| --- | --- | --- |
| Host HTTP 路由 | Web UI 的页面、静态资源、目录选择、打开应用、更新等 | HTTP(S) |
| Host 事件流 | 会话事件、作业输出、状态变化 | WebSocket |
| JSON-RPC | SDK / Python SDK | stdio（换行分隔） |
| ACP | 编辑器等 Agent 客户端 | stdio |
| MCP | 外部工具与资源 | stdio / HTTP（由 MCP Server 决定） |

## 9. 技术栈

| 层 | 技术 |
| --- | --- |
| 语言与运行时 | TypeScript、Node.js `>=24.9.0`、ESM |
| 包管理 | pnpm `11.28.5`，workspace 协议 |
| 插件框架 | Cordis（`vendor/` 内置），插件即服务，`ctx` 注入 |
| 前端 | React、Vite（`apps/web`）、客户端插件 + Slot 组合 |
| 桌面 | Electron（`apps/desktop`）、Electron Builder 打包、自动更新 |
| 构建 | `tsc -b` 项目引用、tsdown、自定义 `scripts/build.ts` |
| 测试 | Vitest（单元、e2e、expected、snapshot、web、bench）、快照回放 |
| 质量 | oxlint、jscpd 重复度检查、类型契约检查 |
| 文档 | VitePress（`website/`）、中英文配对校验 |
| 多语言 | Python wheel（`python/`）、原生 host addon（`native/`） |
| 数据库/存储 | 会话 JSONL（可选 zstd）、设置与凭据文件；无强制外部数据库 |

## 10. 运行与开发

### 10.1 首次启动

```bash
pnpm install
pnpm run build
pnpm dsh web
```

`dsh web` 会打印访问地址。打开后：

1. 设置 → 模型，填入 API Key（或其他提供方配置）。
2. 选择工作区（启动 `dsh` 时所在目录会作为默认文件系统位置）。
3. 新建会话并发送任务。

其他常用入口：

```bash
pnpm dsh --profile headless "run the tests"   # 一次性任务
pnpm dsh --profile sdk                        # JSON-RPC 服务
pnpm dsh --profile acp                        # ACP 服务
```

### 10.2 开发命令

| 命令 | 作用 |
| --- | --- |
| `pnpm run build` | 全量构建（Host 库 + 客户端 + Web） |
| `pnpm run typecheck` | 按项目引用做类型检查 |
| `pnpm run lint` / `lint:fix` | oxlint 检查/修复 |
| `pnpm test` | 构建原生模块后跑 Vitest |
| `pnpm run test:e2e` | 端到端测试 |
| `pnpm run test:expected` | 期望输出测试（可 `test:expected:refresh` 刷新） |
| `pnpm run test:snapshot` | 快照测试（录制/刷新有独立命令） |
| `pnpm run test:web` | 构建后跑 Web 快照 |
| `pnpm run docs:dev` / `docs:build` / `docs:check` | 文档站开发、构建、校验 |
| `pnpm run verify-translation-pairing README.md` | 校验中英文文档结构一致 |
| `pnpm run build:desktop` / `dev:desktop` | 桌面端构建/开发 |
| `pnpm run package:desktop:win:x64:unsigned` | Windows x64 未签名打包（macOS 有对应命令） |

### 10.3 目录与环境约定

- Harness home：`$DSH_HOME`，存放 `profiles/`、home 级 `cordis.patch.yml`、会话与设置数据。
- 启动命令所在目录：作为默认 workspace 根目录。
- 桌面端 profile 名称 `desktop` 由 Electron 独占，CLI 拒绝对其执行启动/配置 dump；插件管理需使用桌面端内置命令运行时。

## 11. i-do 二开现状

根据 [fork-changes.md](fork-changes.md)，本仓库的核心机制代码保持上游原样，二开集中在品牌与分发层：

- 替换桌面图标、托盘图标、Web/PWA 图标与文档站字标。
- 品牌资产由 `scripts/brand/render-icons.mjs` 与 `pnpm --filter @deepseek-ai/dsh-web-frontend run render:app-icons` 生成，不手工修改产物。
- 中英文 README 重写并通过翻译配对校验。
- 双远程：cnb 主仓库 + GitHub 镜像，默认分支统一为 `main`。
- 同步上游后需重跑图标生成、`pnpm run test:docs` 与翻译配对校验。

因此，阅读本文件描述的架构与功能时，可以把它当作上游 `deepseek-harness` 的通用设计；i-do 的差异主要在品牌、文档与发布流程。

## 12. 不确定与待确认

以下内容本次未从代码中完全确认，使用前建议再核对：

- 会话与设置的精确磁盘路径：`$DSH_HOME` 下的具体文件布局会随版本演进，本文只描述职责。
- 桌面端自动更新的渠道配置与签名要求：涉及发布环境，未在本文展开。

已核清（原列于本节，现由分册给出有代码依据的答案）：

- Web 默认监听端口：`127.0.0.1:3080`，`--host` / `--port` 可覆盖，见 [06 §2.4](modules/06-hosts-and-sdks.md)。
- 实验性包默认不装载，需在插件管理器「官方」分组显式启用，见 [05 第 7 节](modules/05-plugin-ecosystem.md)。
- 模型提供方的完整清单（42 个 pi-ai 内置提供方，构建期快照），见 [03 §2.3](modules/03-models-and-config.md)。

如果需要把本文拆成"架构篇 / 功能篇 / 开发篇"多份文档，或补充某模块的详细时序图，请在此基础上继续拆分。
