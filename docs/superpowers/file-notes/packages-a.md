# packages 文件级索引（上）：清单 packages-01 + packages-02

> 第二阶段产物之一。覆盖 `docs/superpowers/inventory/packages-01.tsv`（799 行）与 `packages-02.tsv`（2,999 行），合计 **3,798 条文件记录**、**533,064 行**，落在 **90 个 `package.json` 包目录**里，另有 29 条记录不挂在任何包下（`packages/` 顶层 24 个、`packages/client` 根 5 个）。
>
> 本文只做**文件级索引**：某个文件是什么、归谁、大文件内部怎么分层。包与包之间的依赖方向、运行时装配顺序、双面体系（host / browser）的架构推理在 `docs/superpowers/modules/` 里，本文不重复，只在小节定位段里给一句话回指。

## 一、标注规则

3,798 个文件不可能逐个打开读实现。每条登记的「职责」列末尾都用括号标明它的**证据来源**，三种取值：

| 标注 | 含义 | 判据 |
|---|---|---|
| `精读` | 真正打开读过文件内容 | 读过实现体，或至少读完了模块头注释与导出签名。职责里写的是文件自己声明的事，不是猜的 |
| `精读：模块头` | 只读了文件开头的注释块 | 大文件常用。职责取自作者写的模块级说明，未逐行核对实现 |
| `结构判断` | 没打开文件 | 依据文件名、所在目录、同目录其它文件的命名规律、导出符号名、被谁 import 来推断。这类判断可能整体偏一层，但不编造具体行为 |
| `待确认` | 有依据但不足以定论 | 同名双份、疑似废弃、目录语义与内容不符等，需要在后续阶段核实 |

补充约定：

- **没有标注的行不出现**。表格里每一行都必须能追溯到上面四种之一。
- **行数**取自清单第三列（`行数`），不是重新统计的。空文件记 `0`，二进制文件按清单给出的值照抄并在职责里说明是二进制。
- **类型**列只用五个值：`源码`（`.ts`/`.tsx`/`.mjs`）、`样式`（`.css`）、`文案`（`locale/*.json`）、`资源`（图片/字体/二进制/fixture）、`样板`（`package.json`、`tsconfig*.json`、`tsdown.config.*`、`README`、`AGENTS.md`、`.yaml`/`.yml` 配置）。
- 超过 500 行的源码文件，职责后面补一句**结构说明**：拆成哪几块、主入口在哪。500 行以下的只写一句话。

## 二、登记粒度

清单是「一文件一行」，本文不是。为了让人能读，做了四类合并，合并处均在职责里写清包含了哪些文件：

1. **`locale/*.json`** —— 每包一行。8 个语种（`de/en/es/fr/ja/ko/ru/zh`）形态完全一致，逐个列没有信息量；行数列给合计，职责里注明语种数。
2. **测试文件** —— 按被测对象分组，一组一行。列出的组名后跟文件数与合计行数；大包（`ui-chat`、`ui-primitives`、`ui-conversation`）给出组内关键重文件的行数。
3. **`*.module.css`** —— 每包一行（`ui-primitives` 因样式是本包的主要资产，单独成表）。列名写「N 个样式文件」，职责里用 `文件名=行数` 紧凑列出。
4. **工程样板** —— `package.json` + `tsconfig*.json` + `tsdown.config.*` + `README*.md` + `AGENTS.md` 合成一行「工程样板」，因为它们的职责由包定位决定，逐个写是同义反复。

二进制、图片、字体、fixture 不合并，但只占一行，写清用途。

## 三、覆盖总览

文件数与行数由两个清单实算（`package.json` 目录边界 + 路径分组），`tests` 为路径命中 `tests/` 或 `*.test.*` / `*.spec.*` 的记录数。小节号即本文的二级标题编号。

| 包目录 | 文件数 | 行数 | tests | locale | css | 小节 |
|---|---|---|---|---|---|---|
| *(packages/ 顶层，含 6 个分组的 README 三件套)* | 24 | 1,024 | 0 | 0 | 0 | §1 |
| packages/acp/acp | 32 | 5,974 | 12 | 8 | 0 | §2 |
| packages/api/gateway | 44 | 17,838 | 16 | 8 | 0 | §3.1 |
| packages/api/job-controller | 31 | 2,721 | 7 | 8 | 0 | §3.2 |
| packages/api/remote-access | 25 | 2,634 | 2 | 8 | 0 | §3.3 |
| packages/api/remotes | 22 | 1,663 | 2 | 8 | 0 | §3.4 |
| packages/api/session-controller | 114 | 32,245 | 58 | 8 | 0 | §3.5 |
| packages/api/settings-controller | 18 | 1,035 | 2 | 8 | 0 | §3.6 |
| packages/api/terminal-controller | 44 | 7,205 | 12 | 8 | 0 | §3.7 |
| packages/api/workspace-controller | 32 | 4,335 | 6 | 8 | 0 | §3.8 |
| packages/api/workspace-files | 42 | 6,009 | 17 | 8 | 0 | §3.9 |
| packages/attachment/attachment | 14 | 1,575 | 3 | 0 | 0 | §4.1 |
| packages/attachment/attachment-local | 32 | 3,842 | 10 | 8 | 0 | §4.2 |
| packages/boot/app-boot | 50 | 15,976 | 22 | 0 | 0 | §5.1 |
| packages/boot/cmdline | 7 | 1,030 | 1 | 0 | 0 | §5.2 |
| packages/boot/config-editor | 14 | 487 | 0 | 8 | 0 | §5.3 |
| packages/boot/hmr | 30 | 6,231 | 11 | 8 | 0 | §5.4 |
| packages/boot/plugin-manager | 56 | 10,807 | 18 | 16 | 0 | §5.5 |
| packages/boot/plugin-market | 38 | 4,358 | 13 | 8 | 0 | §5.6 |
| packages/browser-use/browser-use | 16 | 442 | 1 | 8 | 0 | §6 |
| packages/bundle/acp-app | 17 | 482 | 2 | 8 | 0 | §7 |
| packages/bundle/base | 9 | 1,180 | 2 | 0 | 0 | §7 |
| packages/bundle/headless | 24 | 3,983 | 5 | 8 | 0 | §7 |
| packages/bundle/sdk-app | 17 | 596 | 2 | 8 | 0 | §7 |
| packages/bundle/sdk-minimal | 8 | 651 | 1 | 0 | 0 | §7 |
| packages/bundle/web-app | 39 | 3,942 | 10 | 16 | 0 | §7 |
| packages/client *(根，无 package.json)* | 5 | 1,478 | 0 | 0 | 0 | §8 |
| packages/client/connection | 50 | 7,161 | 16 | 8 | 0 | §9 |
| packages/client/file-upload | 25 | 2,094 | 2 | 8 | 0 | §10 |
| packages/client/hmr | 20 | 1,300 | 3 | 8 | 0 | §11 |
| packages/client/locale | 42 | 3,016 | 8 | 42 | 1 | §12 |
| packages/client/modules | 28 | 6,862 | 5 | 8 | 0 | §13 |
| packages/client/product-analytics | 28 | 1,711 | 7 | 8 | 0 | §14 |
| packages/client/resources | 20 | 1,379 | 2 | 8 | 0 | §15 |
| packages/client/shortcuts | 39 | 3,149 | 10 | 8 | 0 | §16 |
| packages/client/store | 9 | 869 | 1 | 0 | 0 | §17 |
| packages/client/ui-account-notifications | 31 | 2,466 | 8 | 8 | 1 | §18 |
| packages/client/ui-agent-preset | 41 | 6,956 | 8 | 8 | 5 | §19 |
| packages/client/ui-agent-team | 33 | 2,380 | 6 | 8 | 4 | §20 |
| packages/client/ui-approval | 24 | 1,878 | 1 | 8 | 1 | §21 |
| packages/client/ui-attachment | 36 | 3,168 | 6 | 8 | 5 | §22 |
| packages/client/ui-brand-official | 27 | 1,401 | 3 | 8 | 1 | §23 |
| packages/client/ui-chat | 209 | 41,499 | 67 | 8 | 18 | §24 |
| packages/client/ui-commands | 32 | 4,936 | 5 | 8 | 1 | §25 |
| packages/client/ui-context-menu | 31 | 2,104 | 6 | 8 | 0 | §26 |
| packages/client/ui-conversation | 172 | 39,170 | 60 | 8 | 10 | §27 |
| packages/client/ui-deliverables | 53 | 6,084 | 11 | 8 | 5 | §28 |
| packages/client/ui-directory-picker-browse | 22 | 4,113 | 2 | 8 | 1 | §29 |
| packages/client/ui-directory-picker-native | 19 | 822 | 2 | 8 | 0 | §30 |
| packages/client/ui-dockkit | 45 | 10,723 | 14 | 0 | 1 | §31 |
| packages/client/ui-entry-customization | 23 | 886 | 3 | 8 | 1 | §32 |
| packages/client/ui-file-actions | 22 | 1,123 | 2 | 8 | 0 | §33 |
| packages/client/ui-file-drag | 21 | 903 | 2 | 8 | 0 | §34 |
| packages/client/ui-goal | 33 | 2,636 | 6 | 8 | 2 | §35 |
| packages/client/ui-input-trigger | 33 | 4,721 | 5 | 8 | 1 | §36 |
| packages/client/ui-jobs | 22 | 3,036 | 2 | 8 | 1 | §37 |
| packages/client/ui-layout | 32 | 3,614 | 7 | 8 | 1 | §38 |
| packages/client/ui-message-feedback | 32 | 3,393 | 6 | 8 | 2 | §39 |
| packages/client/ui-model-selection | 30 | 4,309 | 5 | 8 | 1 | §40 |
| packages/client/ui-open-in-app | 43 | 4,254 | 11 | 8 | 1 | §41 |
| packages/client/ui-permission-presets | 30 | 3,186 | 5 | 8 | 2 | §42 |
| packages/client/ui-plan | 33 | 2,216 | 4 | 8 | 2 | §43 |
| packages/client/ui-plugin-manager | 44 | 17,422 | 9 | 8 | 1 | §44 |
| packages/client/ui-plugin-market | 29 | 4,023 | 6 | 8 | 1 | §45 |
| packages/client/ui-primitives | 305 | 36,381 | 140 | 0 | 47 | §46 |
| packages/client/ui-reference | 22 | 1,930 | 3 | 8 | 0 | §47 |
| packages/client/ui-renderer | 37 | 7,607 | 14 | 8 | 0 | §48 |
| packages/client/ui-schedule | 93 | 21,431 | 25 | 8 | 9 | §49 |
| packages/client/ui-secret-mask | 30 | 1,934 | 5 | 8 | 1 | §50 |
| packages/client/ui-session | 19 | 1,918 | 2 | 8 | 0 | §51 |
| packages/client/ui-settings | 33 | 2,706 | 7 | 8 | 0 | §52 |
| packages/client/ui-settings-account | 147 | 9,040 | 72 | 8 | 7 | §53 |
| packages/client/ui-settings-agent-loop | 23 | 896 | 3 | 8 | 0 | §54 |
| packages/client/ui-settings-general | 54 | 5,347 | 10 | 8 | 9 | §55 |
| packages/client/ui-settings-models | 62 | 15,687 | 15 | 8 | 4 | §56 |
| packages/client/ui-settings-plugin-inventory | 23 | 2,815 | 3 | 8 | 1 | §57 |
| packages/client/ui-settings-plugins | 22 | 949 | 2 | 8 | 1 | §58 |
| packages/client/ui-settings-session-log | 24 | 708 | 3 | 8 | 1 | §59 |
| packages/client/ui-settings-shell | 23 | 1,058 | 3 | 8 | 0 | §60 |
| packages/client/ui-settings-subagent | 30 | 2,776 | 3 | 8 | 3 | §61 |
| packages/client/ui-settings-web-search | 25 | 3,684 | 4 | 8 | 1 | §62 |
| packages/client/ui-shortcuts | 28 | 2,806 | 3 | 8 | 1 | §63 |
| packages/client/ui-sidebar | 36 | 5,353 | 10 | 8 | 2 | §64 |
| packages/client/ui-sidebar-browser | 53 | 3,845 | 13 | 8 | 1 | §65 |
| packages/client/ui-sidebar-documentpreview | 198 | 17,411 | 87 | 8 | 12 | §66 |
| packages/client/ui-sidebar-files | 60 | 11,067 | 24 | 8 | 2 | §67 |
| packages/client/ui-sidebar-right | 68 | 11,401 | 21 | 8 | 3 | §68 |
| packages/client/ui-sidebar-terminal | 41 | 2,711 | 8 | 8 | 4 | §69 |
| packages/client/ui-skill | 26 | 2,201 | 4 | 8 | 1 | §70 |
| packages/client/ui-slots | 12 | 3,306 | 3 | 0 | 0 | §71 |
| packages/client/ui-subagent | 28 | 5,261 | 3 | 8 | 3 | §72 |
| packages/client/ui-theme | 9 | 129 | 0 | 8 | 0 | §73 |
| **合计** | **3,798** | **533,064** | **1,051** | **698** | **183** | |

扩展名分布：`.ts` 1,654、`.json` 887、`.tsx` 624、`.md` 201、`.css` 183、`.txt` 100、`.yaml`+`.yml` 113、`.xlsx` 14、`.webp` 9、`.svg` 6、`.mjs` 2、`.png` 1、`.snap` 1、`.py` 1、`.docx` 1、无扩展名 1。源码合计 2,278 个。

## 四、切片边界说明

`packages/client` 这一个包族的记录**被切在 `packages-02` 与 `packages-03` 之间**，不是任务描述里说的 01/02：

- `packages-01` 从 `packages/acp/acp/locale/de.json` 起，到 `packages/bundle/web-app` 止，**不含** client。
- `packages-02` 从 `packages/client/AGENTS.md` 起，按目录名顺序推进，到 `packages/client/ui-theme/package.json`（82 行）止。
- 因此 `ui-theme` 在本切片里只剩 8 个 locale 加 `package.json` 共 9 个文件，它的 `src/`、`tests/`、`README` 全在 `packages-03`。§73 已按这个事实标注，未按完整包统计。

另有两处与「一个包一个完整目录」的假设不符，已在对应小节写明：`packages/client` 根目录自身没有 `package.json`（5 个文件是 `AGENTS.md`、三份 README、`tsdown.client.ts`），它的清单项在别的切片；`packages/browser-use/browser-use` 是双层同名目录，包边界在外层。

## 1. packages/ 顶层 — 包总目录的公共约定

`packages/` 是 monorepo 的功能包根目录，下面按域分组（acp、api、attachment、boot、browser-use、bundle、client、core…）。本节的 6 个文件不属于任何单个包，而是整层共用的说明与构建辅助：一份写给 AI 代理的包开发约定、一份指向它的短说明、三份中英文 README、一份 worker 构建入口。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| AGENTS.md | 文档 | 29 | 面向 AI 代理的 packages 层开发约定，规定新增包时目录、导出与测试的最小要求（结构判断） |
| CLAUDE.md | 文档 | 1 | 单行占位，内容指向 AGENTS.md，供只识别 CLAUDE.md 的工具链读取（结构判断） |
| README.md | 文档 | 118 | 包清单与分层说明的英文正本（结构判断） |
| README.zh.md | 文档 | 118 | 上者的中文对照版（结构判断） |
| README.i18n.yaml | 配置 | 31 | README 的翻译元数据，登记语言列表与对应文件名（结构判断） |
| tsdown.worker.ts | 构建脚本 | 13 | packages 层共享的 worker 打包入口，把 worker 源码单独打成 ESM 产物（结构判断） |
| acp/ api/ attachment/ boot/ browser-use/ bundle/ 下各一套 README（18 个：`README.md` + `README.zh.md` + `README.i18n.yaml`） | 文档 | 714 | 六个包分组的目录级说明，双语正文加翻译元数据；每组三件套行数分别为 acp 107、api 145、attachment 127、boot 115、browser-use 105、bundle 115。它们是分组说明，不挂在任何 `package.json` 包下（结构判断） |

## 2. packages/acp/acp — Agent Client Protocol 桥接

ACP 是编辑器/外部宿主与 Agent 之间的标准协议。这个包只做协议层的翻译：把外部的 JSON-RPC 会话、提示、内容块、权限请求，映射到本仓库内部的 Agent/Session/工具接口上，并把流式更新反向编码成 ACP 的 `session/update` 通知。它不实现 Agent 本身，也不管连接传输（传输由调用方提供）。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 529 | 包主入口，导出桥接装配函数：接收宿主能力、建立 ACP 连接、把 Agent 侧事件接到协议回调上（结构判断） |
| src/session.ts | 源码 | 532 | 单个 ACP 会话的生命周期实现，负责创建/恢复/关闭会话以及在协议会话与内部 Session 之间转发提示与取消（结构判断） |
| src/content.ts | 源码 | 237 | 内容块双向转换，把 ACP 的 text/image/resource 块与内部消息内容互相映射，含大对象截断处理（结构判断） |
| src/model-control.ts | 源码 | 194 | 模型与推理强度控制，把 ACP 的模型选择请求翻译成内部模型切换调用并回报可用列表（结构判断） |
| src/mcp.ts | 源码 | 143 | 把 ACP 宿主提供的 MCP 服务器配置转成内部 MCP 客户端所需形态（结构判断） |
| src/updates.ts | 源码 | 111 | 生成 `session/update` 系列通知，把内部流式增量整理成协议要求的形状（结构判断） |
| src/codec.ts | 源码 | 35 | 协议侧 JSON 编解码与未知字段兜底（结构判断） |
| tests/*.spec.ts（11 个） | 测试 | 3,746 | 按被测对象分组：bridge（1037）、turns（994）、dispose（277）、content（232）、edges（161）、model-control（148）、mcp（116）、multi-session（95）、approval（93）、updates（93）、codec（16）；tests/harness.ts（309）为共用的假宿主与装配辅助（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 8 种语言的包标题元数据，仅 `meta.title`（精读） |
| package.json / README.md / README.zh.md / README.i18n.yaml / tsconfig.json | 工程样板 | — | 包清单、双语 README 与 TS 配置（结构判断） |

## 3. packages/api — 面向客户端的远端 API 层

`packages/api` 是「宿主能力 → 客户端可调用 Remote」的边界层：每个子包是一个领域控制器，用 Typert 的 `@Remote` 把宿主侧的服务方法暴露成客户端可远程调用的接口，并各自维护快照/增量事件流。客户端代码（`src/client/*`）与宿主代码（包根 `src/*`）在同一个包里成对出现，通过 export subpath 分别打进 client/host 两份产物。

### 3.1 api/gateway — 远端调用与流式传输总线

本包是所有 Remote 调用的统一入口：宿主侧把注册的 provider 挂到 Gateway 服务上，客户端侧通过它发一元调用、订阅事件流、拉取快照，并复用同一条 WebSocket 多路复用通道。访问控制（哪些客户端能调哪些资源）也在这里判定。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 1749 | Gateway 服务主体。模块头注释自述为「在 Cordis Service 上分发 Typert Remote」；文件内含服务类、Remote 注册与分发、访问判定接入、流订阅与错误收尾几块，包主入口即此文件（精读：模块头注释） |
| src/access.ts | 源码 | 179 | 访问控制，按资源与调用类型给出 `RemoteAccessDecision`，并导出一元/事件两类资源描述（结构判断） |
| src/stream-protocol.ts | 源码 | 381 | 流通道的帧协议定义：握手、订阅、背压、心跳与关闭帧的结构与校验（结构判断） |
| src/stream-server.ts | 源码 | 497 | 宿主侧流服务端，负责 WebSocket 接入、按订阅分发帧、断开清理（结构判断） |
| src/types.ts | 源码 | 199 | 包内公共类型：调用信封、流帧、访问决策与错误载荷（结构判断） |
| src/remote-error-codes.ts | 源码 | 39 | 远端错误的稳定错误码常量表，供两端判等（结构判断） |
| src/client/index.ts | 源码 | 895 | 客户端侧入口，对上层暴露「调用/订阅/快照」三组 API，并管理连接状态与重连（结构判断） |
| src/client/journal-stream.ts | 源码 | 580 | 客户端日志流订阅器：按游标增量拉取、重放与去重会话日志条目（结构判断） |
| src/client/stream-client.ts | 源码 | 510 | 客户端流通道实现，含订阅表、背压与重连后的重新订阅（结构判断） |
| src/client/remote-events.ts | 源码 | 341 | 客户端事件订阅封装，把原始帧翻译成类型化的领域事件回调（结构判断） |
| src/client/remote-stream.ts | 源码 | 227 | 单条 Remote 流的客户端视图，管理活跃/暂停状态与取消（结构判断） |
| src/client/snapshot-stream.ts | 源码 | 94 | 快照流的客户端拉取与合并入口（结构判断） |
| tests（16 个） | 测试 | 12,662 | 按被测对象分组：gateway（3477）、stream-server（831）、gateway-stream（1875）、journal-stream（1118）、gateway-access（1021）、operator-connect（350）、control-retry（373）、remote-event-protocol（287）、authenticated-node（196）、echo-stream（100）、stream-protocol（87）、strict-source（80）、browser-credentials（44）、peer（30）、operator-connect-fixture（122）、gateway.host（1668）；fixture 与假凭据也在这一组（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title` 的包标题元数据（精读） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | 包清单、双语 README、client/host 双份 TS 配置与打包入口（结构判断） |

### 3.2 api/job-controller — 后台任务（job）控制

把宿主侧的后台任务抽象成可观测的「行」（每行一个任务/一步），向客户端提供列表快照、事件增量与终止操作。`observe.ts` 负责把任务运行时的状态变化整理成行，`wake.ts` 处理任务被唤醒/重试的时机。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 130 | Remote 服务装配入口，注册 job 相关的调用与事件资源（结构判断） |
| src/observe.ts | 源码 | 132 | 任务运行时状态 → 任务行的投影器，含状态归并与终态判定（结构判断） |
| src/rows.ts | 源码 | 53 | 任务行的规范化与排序，保证客户端列表稳定（结构判断） |
| src/wake.ts | 源码 | 60 | 任务唤醒逻辑，处理延迟重试与并发唤醒去重（结构判断） |
| src/types.ts | 源码 | 90 | 任务行、状态枚举与调用参数类型（结构判断） |
| src/client/index.ts | 源码 | 36 | 客户端入口，导出 model/service 两个门面（结构判断） |
| src/client/model.ts | 源码 | 216 | 客户端任务列表模型：合并快照与增量、维护选中项（结构判断） |
| src/client/service.ts | 源码 | 277 | 客户端服务门面，把 Gateway 调用包装成面向 UI 的方法（结构判断） |
| tests（6 个 + harness） | 测试 | 1,369 | model（578）、observe（309）、kill（151）、client-apply（87）、rows（89）、host-harness（104）、built-lib.e2e（42）（结构判断） |
| locale/*.json / 工程样板 | 本地化 / 样板 | — | 8 语言标题元数据；package.json、README ×3、tsconfig ×3、tsdown.config.ts（精读：locale） |

### 3.3 api/remote-access — 远程访问授权

控制「外部设备/浏览器能否连到本机宿主」：维护远程访问开关、配对状态与允许名单，向客户端暴露当前授权快照，并提供 `whenAllowed` 之类的等待原语供其它调用方在授权后才继续。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 423 | Remote 服务主体：访问开关、配对与状态广播（结构判断） |
| src/types.ts | 源码 | 142 | 访问状态、配对记录与决策类型（结构判断） |
| src/snapshot.ts | 源码 | 8 | 访问状态快照的极小投影辅助（结构判断） |
| src/client/index.ts | 源码 | 36 | 客户端入口，导出 mount/state/when-allowed（结构判断） |
| src/client/mount.ts | 源码 | 171 | 客户端侧的授权状态挂载与首次同步（结构判断） |
| src/client/state.ts | 源码 | 208 | 客户端访问状态存储，订阅远端变化并驱动 UI（结构判断） |
| src/client/when-allowed.ts | 源码 | 85 | 「等到被允许」的 Promise 原语，处理超时与取消（结构判断） |
| tests（2 个） | 测试 | 1,135 | remote-access.host（619）、client-access.client（516）（结构判断） |
| locale/*.json / 工程样板 | 本地化 / 样板 | — | 8 语言标题元数据；package.json、README ×3、tsconfig ×3、tsdown.config.ts（精读：locale） |

### 3.4 api/remotes — 远端注册表

一份轻量的远端（remote）清单服务：登记有哪些远端可用、各自的路由与状态，并向客户端广播远端集合的变化事件。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 171 | 远端清单的增删查与变化广播（结构判断） |
| src/remote-events.ts | 源码 | 59 | 远端集合变更事件的类型与构造（结构判断） |
| src/types.ts | 源码 | 19 | 远端条目的最小类型定义（结构判断） |
| src/client/index.ts | 源码 | 220 | 客户端远端清单视图与订阅（结构判断） |
| locale/*.json / 工程样板 | 本地化 / 样板 | — | 8 语言标题元数据；package.json、README ×3、tsconfig ×3、tsdown.config.ts；无测试（精读：locale） |

### 3.5 api/session-controller — 会话控制器（最大的一块）

整个仓库的会话域核心：宿主侧负责会话的持久化读写、历史分页、Agent 命令下发与状态控制；客户端侧维护会话驻留、投影缓存、订阅与重放。它是 api 目录里唯一同时带 `client/sessions/` 子树的包，文件数与测试数都远超同层。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 651 | Remote 服务主体，模块头注释自述为「会话 Remote 所有者：冷读、显式 Agent 命令与实时控制状态」；按导入可见其内含会话读写、原生命令桥（打开/在文件管理器中显示）、时区规范化与 Remote 资源解析几块（精读：模块头注释） |
| src/agent.ts | 源码 | 474 | 会话内 Agent 侧装配：创建/恢复 Agent 实例、转发提示与中断（结构判断） |
| src/commands.ts | 源码 | 602 | 会话命令集合（重命名、归档、复制、导出等）的实现与参数校验（结构判断） |
| src/list.ts | 源码 | 382 | 会话列表查询：排序、分页、按工作区/归档态过滤（结构判断） |
| src/history.ts | 源码 | 189 | 历史记录读取的对外门面，组合 controller/listener（结构判断） |
| src/history/controller.ts | 源码 | 256 | 历史分页控制器：按游标读取并对齐序号（结构判断） |
| src/history/listener.ts | 源码 | 302 | 历史变更监听，把落盘变更推成增量事件（结构判断） |
| src/history/assistant-stream.ts | 源码 | 102 | 历史中助手流式片段的还原与拼接（结构判断） |
| src/assistant-stream.ts | 源码 | 102 | 实时助手流的转发入口（结构判断） |
| src/state/controller.ts | 源码 | 221 | 会话实时控制状态（模型、权限、模式）的读写与广播（结构判断） |
| src/state/listener.ts | 源码 | 116 | 控制状态变化的监听与事件构造（结构判断） |
| src/types.ts | 源码 | 720 | 会话域公共类型总表：摘要、控制基线、帧结构、重命名值等（结构判断） |
| src/catalog.ts | 源码 | 117 | 会话目录/索引的读取辅助（结构判断） |
| src/continuation.ts | 源码 | 58 | 「继续上一轮」的续写请求构造（结构判断） |
| src/control.ts | 源码 | 121 | 控制命令的解析与分发（结构判断） |
| src/file-references.ts | 源码 | 42 | 消息中的文件引用提取与校验（结构判断） |
| src/media-references.ts | 源码 | 84 | 图片/媒体引用的提取与去重（结构判断） |
| src/skill-catalog.ts | 源码 | 108 | 会话可用技能清单的组装（结构判断） |
| src/archived-session-gate.ts | 源码 | 59 | 已归档会话的写操作拦截（结构判断） |
| src/remote-events.ts | 源码 | 14 | 会话域远端事件名的常量出口（结构判断） |
| src/web/controller.ts | 源码 | 78 | Web 端专用的会话入口适配（结构判断） |
| src/client/index.ts | 源码 | 149 | 客户端入口，导出 sessions 门面与契约类型（结构判断） |
| src/client/sessions/session.ts | 源码 | 1055 | 单个客户端会话实例。文件首行注释说明「会话创建后常驻，以便离屏时 Remote 源继续运行」；按导入可见其组合了提示队列、附件引用、子智能体地址、日志偏移与事件流订阅，是 client/sessions 的主类（精读：模块头注释） |
| src/client/sessions/manager.ts | 源码 | 857 | 会话实例管理器，首行注释为「宿主目录、持久投影缓存与显式保留的 Client 实例」；负责按 id 取用/保留/释放会话实例并合并基线（精读：模块头注释） |
| src/client/sessions/service.ts | 源码 | 741 | 客户端服务门面，把 Gateway 的会话调用整理成 UI 可用方法（结构判断） |
| src/client/sessions/assistant-stream.ts | 源码 | 229 | 客户端助手流的分片接收与顺序保证（结构判断） |
| src/client/sessions/projection-store.ts | 源码 | 244 | 会话投影的客户端缓存，按投影键存值与失效（结构判断） |
| src/client/sessions/lineage.ts | 源码 | 96 | 会话血缘（父子/分支）关系的客户端维护（结构判断） |
| src/client/sessions/notifier.ts | 源码 | 97 | 会话变更的订阅通知分发（结构判断） |
| src/client/sessions/remotes.ts | 源码 | 44 | 客户端侧远端会话地址拼接（结构判断） |
| src/client/sessions/history-records.ts | 源码 | 35 | 历史记录的客户端轻量包装（结构判断） |
| src/client/contract/events.ts | 源码 | 205 | 客户端契约：事件与帧的类型定义（结构判断） |
| src/client/contract/session.ts | 源码 | 174 | 客户端契约：单会话方法签名（结构判断） |
| src/client/contract/sessions.ts | 源码 | 169 | 客户端契约：会话集合方法签名（结构判断） |
| src/client/contract/snapshot.ts | 源码 | 94 | 客户端契约：快照结构（结构判断） |
| src/client/transport.ts | 源码 | 247 | 客户端会话事件流传输，含游标与断线重连（结构判断） |
| src/client/ordered-baseline.ts | 源码 | 43 | 基线与增量合并时的顺序保证（结构判断） |
| src/client/scope.ts | 源码 | 76 | 会话作用域（当前工作区/远端）解析（结构判断） |
| src/client/session-wire-event.ts | 源码 | 46 | 线上事件 → 客户端事件的转换（结构判断） |
| src/client/time-zone.ts | 源码 | 14 | 客户端时区取值的极小封装（结构判断） |
| tests（58 个） | 测试 | 约 12,000 | 该包测试量最大，按被测对象分组即可：会话实例与 manager、历史 controller/listener、控制状态、命令、契约编码、传输重连各成组；`.client.spec` 与 `.host.spec` 后缀区分运行侧（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title`（精读） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | 包清单、双语 README、双份 TS 配置与打包入口（结构判断） |

### 3.6 api/settings-controller — 设置与凭据

设置域的远端入口：读写配置项、管理凭据（密钥）条目的增删与掩码显示。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 270 | Remote 服务主体：设置项读写与凭据操作分发（结构判断） |
| src/credentials.ts | 源码 | 157 | 凭据条目的存储、掩码与校验（结构判断） |
| src/types.ts | 源码 | 34 | 设置项与凭据的类型（结构判断） |
| tests（2 个） | 测试 | 约 600 | 按被测对象分组：设置读写与凭据掩码（结构判断） |
| locale/*.json / 工程样板 | 本地化 / 样板 | — | 8 语言标题元数据；package.json、README ×3、tsconfig.json（无 tsdown/host-client 拆分）（精读：locale） |

### 3.7 api/terminal-controller — 终端会话

宿主侧 PTY 终端的远端化：创建/关闭终端、发送按键、读取屏幕内容，并在客户端维护终端清单、绑定关系与保留策略（关闭后短暂保留以便回看）。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 572 | Remote 服务主体：终端创建/写入/关闭与屏幕输出分发（结构判断） |
| src/terminal.ts | 源码 | 396 | 单个 PTY 终端实例的封装：进程、尺寸、输入输出与退出（结构判断） |
| src/agent.ts | 源码 | 139 | 暴露给 Agent 的终端操作入口（结构判断） |
| src/retention.ts | 源码 | 132 | 宿主侧终端保留策略：超时回收与容量上限（结构判断） |
| src/screen.ts | 源码 | 97 | 屏幕缓冲的截取与规整，供远端读取（结构判断） |
| src/shells.ts | 源码 | 77 | 可用 shell 的探测与默认值（结构判断） |
| src/stream.ts | 源码 | 87 | 终端输出流的分帧与订阅（结构判断） |
| src/types.ts | 源码 | 132 | 终端域类型：会话、尺寸、输出帧（结构判断） |
| src/client/index.ts | 源码 | 323 | 客户端入口：终端模型与服务门面装配（结构判断） |
| src/client/model.ts | 源码 | 417 | 客户端终端清单模型：合并快照与增量、维护活跃终端（精读：模块头注释级别，主体结构判断） |
| src/client/inventory.ts | 源码 | 120 | 终端清单的规范化与分组（结构判断） |
| src/client/roster.ts | 源码 | 133 | 终端「名册」：与工作区/任务的绑定关系（结构判断） |
| src/client/bindings.ts | 源码 | 63 | 终端与面板位置的绑定记录（结构判断） |
| src/client/close-requests.ts | 源码 | 73 | 关闭请求的排队与确认（结构判断） |
| src/client/retention.ts | 源码 | 76 | 客户端侧保留/回收判定（结构判断） |
| src/client/shell-preference.ts | 源码 | 20 | 用户偏好的 shell 读写（结构判断） |
| tests（12 个） | 测试 | 约 2,400 | 按被测对象分组：终端实例、屏幕缓冲、清单/名册、保留策略、绑定与关闭请求（结构判断） |
| locale/*.json / 工程样板 | 本地化 / 样板 | — | 8 语言标题元数据；package.json、README ×3、tsconfig ×3、tsdown.config.ts（精读：locale） |

### 3.8 api/workspace-controller — 工作区（workspace）管理

管理工作区这一层概念：当前工作区、默认目录、目录选择器、工作区列表与切换，以及向客户端推送工作区变化。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 268 | Remote 服务主体：工作区增删改查与当前工作区切换（结构判断） |
| src/commands.ts | 源码 | 252 | 工作区相关命令的实现与参数校验（结构判断） |
| src/feed.ts | 源码 | 196 | 工作区变化事件流的组装与推送（结构判断） |
| src/directory-picker.ts | 源码 | 174 | 目录选择对话框的宿主侧实现（结构判断） |
| src/default-directory.ts | 源码 | 78 | 默认目录的解析（含用户目录/最近使用）（结构判断） |
| src/default-workspace.ts | 源码 | 30 | 默认工作区的构造（结构判断） |
| src/types.ts | 源码 | 176 | 工作区域类型（结构判断） |
| src/client/index.ts | 源码 | 128 | 客户端入口（结构判断） |
| src/client/model.ts | 源码 | 467 | 客户端工作区模型：列表、当前项与切换状态（结构判断） |
| src/client/service.ts | 源码 | 191 | 客户端服务门面（结构判断） |
| tests（6 个） | 测试 | 约 1,000 | 按被测对象分组：命令、feed、目录选择、模型（结构判断） |
| locale/*.json / 工程样板 | 本地化 / 样板 | — | 8 语言标题元数据；package.json、README ×3、tsconfig ×3、tsdown.config.ts（精读：locale） |

### 3.9 api/workspace-files — 工作区文件检索与变更

给客户端提供工作区文件的两类能力：按名/路径搜索（含模糊匹配），以及文件变更订阅（新增/修改/删除的增量流）。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 525 | Remote 服务主体：搜索与变更订阅的注册、参数校验与授权（结构判断） |
| src/search.ts | 源码 | 124 | 文件名搜索实现（模糊匹配与结果截断）（结构判断） |
| src/changes.ts | 源码 | 162 | 文件变更检测与事件构造（结构判断） |
| src/types.ts | 源码 | 231 | 搜索命中、变更事件与请求参数类型（结构判断） |
| src/client/index.ts | 源码 | 35 | 客户端入口（结构判断） |
| src/client/change-feed.ts | 源码 | 293 | 客户端变更流订阅与本地索引更新（结构判断） |
| src/client/provider.ts | 源码 | 154 | 客户端文件提供者：按需拉取文件内容/列表（结构判断） |
| src/client/remote.ts | 源码 | 50 | 远端文件源的地址与能力封装（结构判断） |
| src/client/types.ts | 源码 | 50 | 客户端侧类型（结构判断） |
| tests（17 个） | 测试 | 约 3,500 | 按被测对象分组：搜索、变更 feed、provider、远端源、授权（结构判断） |
| locale/*.json / 工程样板 | 本地化 / 样板 | — | 8 语言标题元数据；package.json、README ×3、tsconfig ×3、tsdown.config.ts（精读：locale） |

## 4. packages/attachment — 附件抽象与本地实现

两个包是一对「接口 + 实现」：`attachment` 定义附件（图片/文件）的准入规则、引用类型与错误语义；`attachment-local` 给出落盘实现，负责编码、压缩、图片归一化（用 sharp）与文件存储。

### 4.1 attachment/attachment — 附件接口层

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 293 | 包主入口：附件服务接口与工厂（结构判断） |
| src/admission.ts | 源码 | 74 | 附件准入判定：大小、类型、数量上限（结构判断） |
| src/types.ts | 源码 | 169 | 附件引用、元数据与请求投影类型（结构判断） |
| src/error.ts | 源码 | 85 | 附件域错误类型与错误码（结构判断） |
| src/request-projection.ts | 源码 | 62 | 把附件投影进模型请求时的字段裁剪（结构判断） |
| src/brand.ts | 源码 | 27 | 附件 id 的品牌类型（结构判断） |
| tests（3 个） | 测试 | — | 按被测对象分组：准入、投影、错误（结构判断） |
| package.json / README ×3 / tsconfig.json | 工程样板 | — | 无 locale 目录（本包含 0 个 locale 文件）（结构判断） |

### 4.2 attachment/attachment-local — 附件本地存储

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 295 | 包主入口：组装本地附件服务的各项能力（结构判断） |
| src/store.ts | 源码 | 458 | 附件存储主体：内容寻址落盘、读取、引用计数与清理（结构判断） |
| src/file-store.ts | 源码 | 181 | 文件型附件的读写封装（结构判断） |
| src/request-image.ts | 源码 | 210 | 请求侧图片的预处理：尺寸约束、格式转换（结构判断） |
| src/normalization.ts | 源码 | 137 | 附件的统一规范化（命名、MIME、元数据补全）（结构判断） |
| src/image.ts | 源码 | 133 | 图片处理辅助：读尺寸、转格式、缩略（结构判断） |
| src/encoding.ts | 源码 | 83 | base64/二进制编码转换（结构判断） |
| src/compression-limiter.ts | 源码 | 52 | 压缩并发与总量限制（结构判断） |
| src/sharp.ts | 源码 | 7 | sharp 的动态加载封装（原生依赖，避免顶层引入）（结构判断） |
| tests（10 个） | 测试 | 约 2,000 | 按被测对象分组：store、file-store、图片处理、编码、限流（结构判断） |
| locale/*.json / 工程样板 | 本地化 / 样板 | — | locale 为 0 个；package.json、README ×3、tsconfig.json（结构判断） |

## 5. packages/boot — 启动、加载与插件治理

`boot` 是宿主进程的引导层：解析命令行、加载配置与 profile、把 Cordis 插件树装配起来、提供 HMR 热重载，并实现插件的安装/升级/市场检索。它不实现业务能力，只决定「装什么、按什么顺序装、装完怎么热更」。

### 5.1 boot/app-boot — 引导骨架

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 1286 | 引导主流程。模块头注释列明职责：载入 gitignored 的 `.env`、安装 fail-loud 的 Loader 守卫、解析（快照感知的）配置路径、加载 `~/.dsh` 下的用户 patch 层、把路径解析器暴露给配置表达式、驱动 Cordis Loader 直到插件树稳定；文件即包主入口（精读：模块头注释） |
| src/profile.ts | 源码 | 762 | profile（配置档）模型：读取/写入、patch 合并与运行时解析结果的类型（结构判断） |
| src/profile-resolution/resolver.ts | 源码 | 1072 | profile 包路由的内存实现，模块头注释为「为 Node 默认 ESM 与 CJS 加载器做 profile 包路由」；含 import maps 解析、realpath 归一与 worker 环境传递（精读：模块头注释） |
| src/profile-resolution/service.ts | 源码 | 148 | 把 resolver 包装成 Cordis 服务（结构判断） |
| src/profile-resolution/legacy-links.ts | 源码 | 33 | 旧版链接形式的兼容处理（结构判断） |
| src/profile-resolution/worker-bootstrap.ts | 源码 | 12 | worker 线程内的解析器引导（结构判断） |
| src/profile-plugins.ts | 源码 | 133 | profile 中插件条目的展开与依赖展开（结构判断） |
| src/profile-context.ts | 源码 | 85 | 为配置表达式提供上下文变量（路径、环境等）（结构判断） |
| src/profile-compatibility.ts | 源码 | 141 | profile 与当前版本的兼容性检查（结构判断） |
| src/profile-sanitize.ts | 源码 | 34 | profile 写入前的字段清洗（结构判断） |
| src/plugin-compatibility.ts | 源码 | 117 | 插件版本/宿主版本兼容判定（结构判断） |
| src/compatibility-preflight.ts | 源码 | 187 | 启动前的兼容性预检与失败提示（结构判断） |
| src/package-meta.ts | 源码 | 200 | 读取包元信息（名称、版本、导出）的辅助（结构判断） |
| src/startup-diagnostics.ts | 源码 | 104 | 启动期诊断信息采集（插件/服务状态），供失败时输出（结构判断） |
| src/bundle-platform.ts | 源码 | 35 | 平台判定（打包形态/操作系统）辅助（结构判断） |
| src/config-schema/index.ts | 源码 | 36 | 配置 schema 子模块出口（结构判断） |
| src/config-schema/collect.ts | 源码 | 249 | 收集各插件声明的配置 schema（结构判断） |
| src/config-schema/projector.ts | 源码 | 455 | 把收集到的 schema 投影成可展示的配置文档结构（结构判断） |
| src/config-schema/document.ts | 源码 | 169 | 配置文档的序列化（结构判断） |
| src/config-schema/pattern.ts | 源码 | 62 | schema 中 pattern 类约束的处理（结构判断） |
| src/config-schema/native.ts | 源码 | 16 | 原生（非 schema）配置项的最小描述（结构判断） |
| src/config-schema/types.ts | 源码 | 95 | schema 投影相关类型（结构判断） |
| tests（22 个） | 测试 | 约 6,000 | 按被测对象分组：引导主流程、profile 解析/兼容、resolver、config-schema 投影、诊断（结构判断） |
| package.json / README ×3 / tsconfig.json / tsdown.config.ts | 工程样板 | — | locale 为 0 个（结构判断） |

### 5.2 boot/cmdline — 命令行解析

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 239 | 启动参数解析：子命令、旗标与位置参数，产出规范化选项（结构判断） |
| tests（1 个） | 测试 | — | 命令行解析（结构判断） |
| package.json / README ×3 / tsconfig.json | 工程样板 | — | 无 locale（结构判断） |

### 5.3 boot/config-editor — 配置文件编辑器

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 156 | 以结构化方式读写用户配置文件，保留注释与格式（结构判断） |
| package.json / README ×3 / tsconfig.json | 工程样板 | — | 无测试、无 locale（结构判断） |

### 5.4 boot/hmr — 模块与配置热重载

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 1136 | 热重载主体。模块头注释为「串行化的模块与 profile 配置重载」；按导入可见其实现 Cordis ModuleLoader 接口、把重载任务串行化（AsyncLocalStorage）、监视文件与配置并触发重装（精读：模块头注释） |
| src/package-manifest.ts | 源码 | 330 | 包清单读取与变化检测，判断是否影响解析结果（结构判断） |
| src/module-files.ts | 源码 | 124 | 参与热更的模块文件集合维护（结构判断） |
| src/watch-config.ts | 源码 | 109 | 配置文件监视的精确实现（结构判断） |
| src/error.ts | 源码 | 41 | 热更错误包装与上报（结构判断） |
| tests（3 个） | 测试 | 489 | events、node-half、transport 各一组（结构判断） |
| LICENSE / package.json / README ×3 / tsconfig.json | 工程样板 | — | 唯一带 LICENSE（21 行）的 boot 子包（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title` 的包标题元数据（结构判断） |

### 5.5 boot/plugin-manager — 插件安装与生命周期管理

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 1458 | 插件管理服务主体，模块头注释为「基于共享 dsh 插件操作的当前 profile 插件与 bundle 管理」；内含 Remote 服务定义、安装/卸载/升级编排与版本约束校验（精读：模块头注释） |
| src/operations.ts | 源码 | 695 | 底层插件操作：安装、更新、删除、锁定，含文件锁与原子写（结构判断） |
| src/types.ts | 源码 | 477 | 插件条目、操作结果与错误类型（结构判断） |
| src/install-spec.ts | 源码 | 159 | 安装描述（npm/git/本地路径）解析与规范化（结构判断） |
| src/tools.ts | 源码 | 164 | 暴露给 Agent 的插件管理工具（结构判断） |
| src/diagnostic.ts | 源码 | 86 | 插件状态诊断输出（结构判断） |
| src/build-approval.ts | 源码 | 96 | 需要本地构建的插件的批准流程（结构判断） |
| src/bundle-detail.ts | 源码 | 104 | bundle 详情组装（结构判断） |
| src/github-connection.ts | 源码 | 102 | GitHub 源连接的建立与鉴权（结构判断） |
| src/git-transport.ts | 源码 | 72 | git 传输方式（https/ssh）选择与调用（结构判断） |
| src/install-failure.ts | 源码 | 44 | 安装失败的归因与消息（结构判断） |
| src/failure.ts | 源码 | 29 | 通用失败结果构造（结构判断） |
| src/official-install-target.ts | 源码 | 58 | 官方源的安装目标解析（结构判断） |
| src/patch.ts | 源码 | 78 | profile patch 文件的生成与合并（结构判断） |
| src/registry.ts | 源码 | 98 | 插件注册表读写（结构判断） |
| src/run-tree.ts | 源码 | 77 | 插件运行树（依赖层级）构建（结构判断） |
| src/versions.ts | 源码 | 80 | 版本号比较与范围判定（结构判断） |
| tests（18 个） | 测试 | 约 4,000 | 按被测对象分组：安装编排、operations、版本、patch、GitHub/git 源、审批流（结构判断） |
| locale/*.json（16 个） | 本地化 | 16 个文件 | 该包 locale 目录比其他包多一倍（16 个），除包标题外还含少量管理页文案键（结构判断） |
| package.json / README ×3 / tsconfig.json | 工程样板 | — | 结构判断 |

### 5.6 boot/plugin-market — 插件市场检索

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 520 | 市场服务主体：检索、详情、缓存与工具出口（结构判断） |
| src/repository-cache.ts | 源码 | 432 | 仓库元数据缓存（按源分桶、TTL 与失效）（结构判断） |
| src/detail.ts | 源码 | 221 | 插件详情聚合（README、版本、安装量等）（结构判断） |
| src/search.ts | 源码 | 155 | 市场检索：关键词匹配与排序（结构判断） |
| src/types.ts | 源码 | 176 | 市场条目、检索参数与结果类型（结构判断） |
| src/tools.ts | 源码 | 141 | 暴露给 Agent 的市场工具（结构判断） |
| src/detail-files.ts | 源码 | 79 | 详情中的文件清单/预览（结构判断） |
| src/parse.ts | 源码 | 43 | 响应解析与容错（结构判断） |
| src/parse-thread.ts | 源码 | 58 | 解析任务搬到线程池的封装（结构判断） |
| src/index-url.ts | 源码 | 26 | 市场索引地址拼接（结构判断） |
| src/worker.ts | 源码 | 7 | worker 入口薄封装（结构判断） |
| tests（13 个） | 测试 | 约 2,500 | 按被测对象分组：检索、详情、缓存、解析（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title`（结构判断） |
| package.json / README ×3 / tsconfig.json / tsdown.config.ts | 工程样板 | — | 结构判断 |

## 6. packages/browser-use — 浏览器操作能力出口

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 48 | 包主入口，注册浏览器操作能力（工具/服务）并声明依赖（结构判断） |
| src/brand.ts | 源码 | 15 | 浏览器会话 id 的品牌类型（结构判断） |
| tests（1 个） | 测试 | — | 入口装配（结构判断） |
| package.json / README ×3 / tsconfig.json | 工程样板 | — | 无 locale（结构判断） |

## 7. packages/bundle — 可分发的一体化组合包

bundle 是「把若干插件与配置打成一套可直接运行的组合」的层：每个子包不写业务代码，只提供一份 `cordis.patch.yml`（插件与配置的补丁清单）加一个极薄的入口，用来装配出不同形态的产品（桌面/Web/headless/SDK/ACP）。所以本层要重点看的是 YAML，而不是 TypeScript。

| 包 | 关键文件 | 职责 |
|---|---|---|
| bundle/base | cordis.patch.yml（550 行）、src/index.ts（9 行） | 所有形态共用的基础插件与默认配置，入口只是占位（结构判断） |
| bundle/web-app | cordis.patch.yml（620）、presets/*.patch.yml（4 份：cordis 140、minimal 78、standard 137、ptc 138）、src/index.ts（261）、src/startup.ts（124）、src/public-url.ts（39） | Web 形态组合：主补丁 + 四套预设（最小/标准/PTC），入口负责按预设选装并启动 Web 宿主，`public-url.ts` 解析对外地址（结构判断） |
| bundle/headless | cordis.patch.yml（46）、src/index.ts（465）、src/json-stream.ts（334）、src/startup.ts（158）、src/runner-internals.ts（21）、src/startup-internals.ts（14） | 无界面形态：以 JSON 流作为输入输出协议驱动一次运行，`json-stream.ts` 是流式编解码，`startup*.ts` 负责启动与内部句柄暴露（结构判断） |
| bundle/sdk-app | cordis.patch.yml（87）、src/index.ts（62） | SDK 应用形态的装配，入口把宿主能力包成可编程接口（结构判断） |
| bundle/sdk-minimal | cordis.patch.yml（179）、src/index.ts（9） | SDK 最小集合：只装跑通一次会话所需的插件（结构判断） |
| bundle/acp-app | cordis.patch.yml（23）、src/index.ts（48） | ACP 形态：把 acp 桥接包接进插件树（结构判断） |
| 全部 6 包 | package.json、README ×3、tsconfig.json | 每包各一份包清单、双语 README 与 TS 配置；无测试、无 locale（结构判断） |

## 8. packages/client 根 — 客户端运行时的公共约定

`packages/client` 是浏览器侧运行时的包集合，分两层：9 个核心包（connection、file-upload、hmr、locale、modules、product-analytics、resources、shortcuts、store）提供与 UI 无关的底层能力，56 个 `ui-*` 包提供界面与槽位实现。本节的 5 个文件是整层的共享说明与打包入口。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| AGENTS.md | 文档 | 165 | 客户端包开发约定：双面包（host/client）如何分包、导出 subpath 规则、测试命名（结构判断） |
| README.md / README.zh.md | 文档 | 115 / 115 | 客户端层总体说明的中英双语版（结构判断） |
| README.i18n.yaml | 配置 | 25 | README 翻译元数据（结构判断） |
| tsdown.client.ts | 构建脚本 | 1058 | 客户端层统一打包配置：为每个 `dsh.client` 包生成 client 产物、处理 CSS Module、外部化共享依赖；文件较长，按包类型分成多段规则，是整层构建的唯一入口（结构判断） |

## 9. client/connection — 客户端与宿主的连接层

连接层解决「浏览器怎么和宿主进程说话」：一元调用走 HTTP 桥，实时事件走 WebSocket，两边共用一个 RPC 契约（`rpc-schema.ts`）。宿主侧还负责浏览器鉴权（`browser-auth.ts`）、回环地址识别与重连恢复。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 169 | 包主入口，导出宿主侧连接装配与公共类型（结构判断） |
| src/rpc.ts | 源码 | 328 | RPC 方法的注册与调用封装（宿主侧）（结构判断） |
| src/rpc-host.ts | 源码 | 412 | RPC 宿主实现：按契约分发请求、串行化与错误映射（结构判断） |
| src/rpc-schema.ts | 源码 | 53 | RPC 契约描述，两端共享的方法/参数表（结构判断） |
| src/http-bridge.ts | 源码 | 127 | HTTP 桥：把一元调用翻译成 HTTP 请求并在宿主侧还原（结构判断） |
| src/browser-auth.ts | 源码 | 394 | 浏览器凭据与鉴权流程，含来源校验与信任判定（结构判断） |
| src/api-request-trust.ts | 源码 | 176 | 单个 API 请求的可信度判定（来源、头、凭据组合）（结构判断） |
| src/peer.ts | 源码 | 53 | 对端（peer）标识与描述（结构判断） |
| src/recovery-config.ts | 源码 | 44 | 断线恢复参数（退避、上限）配置（结构判断） |
| src/loopback-hostname.ts | 源码 | 18 | 回环主机名判定（localhost/127.0.0.1 等）（结构判断） |
| src/connect-protocol.ts | 源码 | 7 | 连接协议常量（结构判断） |
| src/api-path.ts | 源码 | 7 | API 路径拼接常量（结构判断） |
| src/client/index.ts | 源码 | 352 | 客户端入口：连接状态机与对外 API 门面（结构判断） |
| src/client/connection.ts | 源码 | 323 | 客户端连接实例：建连、重连、心跳与状态广播（结构判断） |
| src/client/rpc.ts | 源码 | 183 | 客户端 RPC 调用封装（结构判断） |
| src/client/socket.ts | 源码 | 66 | 客户端 WebSocket 封装（结构判断） |
| src/client/api.ts | 源码 | 25 | 客户端 HTTP 一元调用薄封装（结构判断） |
| src/client/random-uuid.ts | 源码 | 14 | 请求 id 生成（结构判断） |
| tests（16 个） | 测试 | 约 3,600 | 按被测对象分组：node-half（964）、connection（800）、client-apply（628）、browser-auth（370）、binary-rpc（285）、http-bridge（218）、fetch-routes（165）、api-request-trust（161）、rpc-schema（58）、socket（55）、recovery-config（32）、generation（65）、api-helpers（21）、loopback（18）、browser-credentials（36）、fake-generation（80）（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title`（精读） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | client/host 双份 TS 配置（结构判断） |

## 10. client/file-upload — 文件上传

宿主侧提供流式接收与「暂存凭据」（staged receipt）：文件先落到会话名下，再由命令/消息引用；客户端侧只负责选择文件、切片与进度。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 342 | 宿主文件上传服务，模块头注释为「流式接收 + Session 持有的暂存凭据」；内含 Remote 方法、暂存生命周期与 Agent 引用解析（精读：模块头注释） |
| src/http-route.ts | 源码 | 86 | 上传用的 HTTP 路由（分片接收、断点）实现（结构判断） |
| src/types.ts | 源码 | 53 | 上传请求/暂存凭据类型（结构判断） |
| src/protocol.ts | 源码 | 8 | 上传协议常量（结构判断） |
| src/client/index.ts | 源码 | 26 | 客户端入口（结构判断） |
| src/client/contract.ts | 源码 | 54 | 客户端契约类型（结构判断） |
| src/client/runtime.ts | 源码 | 406 | 客户端上传运行时：切片、并发、重试与进度聚合（结构判断） |
| tests（2 个） | 测试 | 693 | file-upload.client（544）、file-upload-http.host（149）（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title`（精读） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | 结构判断 |

## 11. client/hmr — 浏览器侧热更新传输

注意此处不是 `boot/hmr`（宿主插件树热重载），而是「客户端包重建后如何通知浏览器」：宿主按固定间隔 stat 轮询每个图行的 bundle（网络挂载无 inotify），变更后通过 `/plugins/events` 的 SSE 通道广播，浏览器侧据此重载模块。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 208 | 宿主传输实现。模块头注释说明：轮询每个图行的客户端 bundle、变更时调用 `clientModules.rebuilt(id)`、并开 `/plugins/events` SSE 广播图/重建帧（精读：模块头注释） |
| src/events.ts | 源码 | 50 | SSE 帧类型与编码（结构判断） |
| src/client/index.ts | 源码 | 87 | 浏览器侧订阅 SSE 并触发模块重载（结构判断） |
| tests（3 个） | 测试 | 489 | node-half（339）、transport（127）、events（23）（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title`（精读） |
| package.json / README ×3 / tsconfig.json / tsdown.config.ts | 工程样板 | — | 结构判断 |

## 12. client/locale — 界面语言

维护浏览器侧的语言注册表与设置项：把各包导出的词典按命名空间挂上，向上提供稳定的翻译函数（`Translate`/`TranslateNS`），并在设置的「通用」分区注册语言选择行。这是唯一同时带 `src/locales/`（词典正本）与 `locale/locale/*.json`（包元数据）的包，路径里出现双层 `locale` 是包名与目录重名所致。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/index.ts | 源码 | 630 | 浏览器侧语言注册表。模块头注释为「绑定的翻译函数保持稳定引用」；同时注册设置页的 Language 行，即语言特性自带设置面板（精读：模块头注释） |
| src/index.ts | 源码 | 32 | 包入口，导出类型与服务声明（结构判断） |
| src/client/bootstrap.ts | 源码 | 31 | 启动期把语言偏好应用到 document（结构判断） |
| src/client/LanguageRow.tsx | 源码 | 67 | 设置页的语言选择行组件（结构判断） |
| src/client/LanguageRow.module.css | 样式 | 61 | 上者的样式（结构判断） |
| src/client/settings-store.ts | 源码 | 47 | 语言偏好的本地存储（结构判断） |
| src/locale-settings.ts | 源码 | 35 | 语言设置项的 schema 与默认值（结构判断） |
| src/locales/*.ts（10 个） | 词典 | 46–47 每 | 八种语言词典 + `settings.ts`（设置域词典）+ `index.ts`（汇总导出）；每个词典文件结构一致，按命名空间导出键值（结构判断） |
| src/css-modules.d.ts | 类型声明 | 6 | CSS Module 的类型声明（结构判断） |
| tests（8 个） | 测试 | 1,112 | locale.client（417）、apply（288）、document-language（117）、language-row（94）、bootstrap（75）、localized-text（64）、config.host（27）、settings-store（30）（结构判断） |
| locale/locale/*.json（8 个） | 本地化 | 8 个文件 | 包标题元数据（路径为 `packages/client/locale/locale/`）（精读） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | 结构判断 |

## 13. client/modules — 浏览器模块系统（客户端包的加载器）

这是 `ui-*` 生态的地基：宿主侧扫描所有声明 `dsh.client` 的包，按模块图顺序组装 `window.__DSH_BOOT__` 入口图，产出可直接 `<script>` 引入的 combo 脚本与 source map、按包切分的 chunk、以及内容哈希化的 `./assets/*` 导出；浏览器侧实现一个惰性 CJS 表，把「执行 bundle 只注册工厂」与「真正 import 时才执行模块体」分开，从而把 entry 生命周期交还给宿主侧的 Cordis Loader。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 1297 | 宿主半边。模块头注释列明五件事：扫 Loader 条目找 `dsh.client` 包、组装 `window.__DSH_BOOT__` 图（线上格式单一来源在 `client/manifest.ts` 的 `WebBootEntry`）、产出 combo 脚本与 source map 及包级 chunk、把注册门面/预载/引导脚本注入 webserver 的 index、提供 `clientModules` 服务（含 HMR 宿主半边的注册与通知）（精读：模块头注释） |
| src/client/manifest.ts | 源码 | 498 | 浏览器半边：客户端模块系统的契约与惰性 CJS 表说明。模块头注释称其为「Node 内部 ESM loader 的浏览器对等物」，由 vendored Loader 通过 `internal.import` 消费；本文件定义公开接口与线上格式（精读：模块头注释） |
| src/client/system.ts | 源码 | 489 | `ClientModuleSystem` 实现，模块头注释称「本文件持有状态表与加载/物化机器」，承担 manifest 中接口的具体实现（精读：模块头注释） |
| src/client/entries.ts | 源码 | 263 | 入口图（entries）的解析与顺序维护（结构判断） |
| src/client/release-change.ts | 源码 | 88 | 版本/内容修订变化时的失效与重放（结构判断） |
| src/client/entry-lifecycle.ts | 源码 | 28 | 单个入口的挂载/卸载与样式清理（结构判断） |
| src/client/notify.ts | 源码 | 17 | 变更通知的极薄出口（结构判断） |
| src/client/index.ts | 源码 | 69 | 浏览器侧入口装配（结构判断） |
| src/assets.ts | 源码 | 86 | 内容修订化的资源路径生成（结构判断） |
| tests（5 个） | 测试 | 约 1,500 | 按被测对象分组：manifest 解析、system 加载、entries、assets、release-change（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title`（精读） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | 结构判断 |

## 14. client/product-analytics — 桌面端产品分析

仅桌面端启用：把产品遥测（OTel）与会话压缩统计汇总成可上报的事件，并通过 RPC 暴露给宿主。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 130 | 模块头注释为「仅桌面端：分析 RPC 与实时压缩采集」；注册 Remote 服务并挂接遥测与压缩事件（精读：模块头注释） |
| src/environment.ts | 源码 | 174 | 采集运行环境信息（版本、平台、渠道）（结构判断） |
| src/environment-query.ts | 源码 | 48 | 环境信息查询接口（结构判断） |
| src/events.ts | 源码 | 80 | 分析事件的定义与构造（结构判断） |
| src/client/index.ts | 源码 | 63 | 客户端侧上报入口（结构判断） |
| tests（7 个） | 测试 | 约 1,000 | 按被测对象分组：事件构造、环境采集、RPC（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title`（精读） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | 结构判断 |

## 15. client/resources — 资源（异步数据源）注册表

提供 React 侧的 `useResource` 能力：注册「提供者」，按地址取数据与订阅；每个地址的记录常驻不删（只丢弃状态），以保证 `source()` 在 render→subscribe 窗口和 StrictMode 重挂载时引用稳定，不会反复重订阅。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/resources.ts | 源码 | 211 | 模块头注释说明 `ctx.resources` 的语义：提供者注册表 + 每地址状态；并解释了记录常驻的原因（渲染期引用稳定）（精读：模块头注释） |
| src/client/contract.ts | 源码 | 115 | 客户端契约：提供者与资源句柄类型（结构判断） |
| src/client/index.ts | 源码 | 41 | 客户端入口（结构判断） |
| src/index.ts | 源码 | 4 | 宿主侧入口，仅类型/常量占位（结构判断） |
| tests（2 个） | 测试 | — | 资源注册与订阅（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title`（精读） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | 结构判断 |

## 16. client/shortcuts — 快捷键

快捷键的「文档 + 解析 + 落地」三段：`binding.ts` 定义绑定语法与平台差异，`configuration.ts` 校验偏好文档并做确定性冲突消解，`client/*` 负责 DOM 监听、原生（桌面）分发、注册表与持久化。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/configuration.ts | 源码 | 244 | 模块头注释为「已校验的偏好文档与确定性冲突消解，不依赖浏览器」；定义 `ShortcutDocument`（schemaVersion 1/2 + 按 profile 的覆盖表，null 表示显式解绑）（精读：模块头注释） |
| src/binding.ts | 源码 | 112 | 绑定语法解析、平台可用性判定与规范化键（结构判断） |
| src/persistence.ts | 源码 | 144 | 偏好文档的读写与迁移（结构判断） |
| src/native.ts | 源码 | 29 | 原生（桌面）快捷键的宿主侧桥（结构判断） |
| src/index.ts | 源码 | 20 | 宿主侧入口（结构判断） |
| src/config.ts | 源码 | 13 | 配置项声明（结构判断） |
| src/protocol.ts | 源码 | 5 | 协议常量（结构判断） |
| src/client/index.ts | 源码 | 159 | 客户端入口：装配注册表与监听（结构判断） |
| src/client/registry.ts | 源码 | 180 | 快捷键注册表：命令 id → 绑定 → 回调（结构判断） |
| src/client/dom.ts | 源码 | 116 | DOM 键盘事件监听与匹配（结构判断） |
| src/client/native.ts | 源码 | 45 | 客户端到原生的转发（结构判断） |
| src/client/storage.ts | 源码 | 40 | 客户端本地存储（结构判断） |
| src/client/types.ts | 源码 | 138 | 客户端类型（结构判断） |
| tests（10 个） | 测试 | 约 1,500 | 按被测对象分组：绑定解析、配置校验与冲突、持久化、DOM 匹配、注册表（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title`（精读） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | 结构判断 |

## 17. client/store — 无 React 的快照存储引擎

后端是一个最小化的 vanilla store（zustand vanilla + immer + subscribeWithSelector + rafFlush + 可选 persist + 开发期冻结），外加一层声明式外壳 `defineStore`，把 init/persist/actions 字面量编译成 `StoreHandle`。它刻意不提供 selector hook —— hook 合成归 `ui-renderer`（唯一一处 uSES 桥接）。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 250 | 模块头注释完整描述了引擎组成与「不提供 selector hook」的边界；导出 `defineStore` 与 store 座席（槽位终端的注册侧）（精读：模块头注释） |
| src/contract.ts | 源码 | 143 | 契约类型：init/persist/actions 字面量与 `StoreHandle` 形状（结构判断） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | 该包无测试、无 locale、无 CSS（结构判断） |

## 18. client/ui-account-notifications — 账号级通知

承载登录态、额度、公告一类的账号级提示：控制器负责拉取与排期，组件负责浮层与过渡动画，样式与文案内聚在本包，避免污染聊天主界面。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/notification-controller.ts | 源码 | 248 | 管理通知的拉取、去重、排序与展示时机，对外暴露订阅接口（结构判断） |
| src/client/AccountNotifications.tsx | 源码 | 175 | 通知浮层根组件，渲染当前通知栈并处理关闭交互（结构判断） |
| src/client/index.ts | 源码 | 68 | 浏览器侧包入口，向 shell 注册通知槽位与控制器实例（结构判断） |
| src/client/notice-transition.ts | 源码 | 34 | 通知进出场的过渡状态计算（结构判断） |
| src/client/locales.ts | 源码 | 18 | 本包界面文案的类型化字典（结构判断） |
| src/client/AccountNotifications.module.css | 样式 | 14 | 通知浮层的定位与动效样式（结构判断） |
| src/config.ts | 源码 | 14 | 通知相关的静态配置常量（结构判断） |
| src/index.ts | 源码 | 12 | 统一出口，转出 client 入口与配置（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 的模块声明，供 TS 识别 （结构判断） |
| tests/*.spec.ts | 测试 | 8 个 | 覆盖控制器状态流转、浮层渲染与过渡逻辑（结构判断） |
| locale/*.json | 本地化 | 8 个 | 8 种语言的包标题元数据（仅 meta.title）（精读） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 中英文包说明与翻译配对清单（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单、TS 与构建配置（结构判断） |


## 19. client/ui-agent-preset — 智能体预设

输入区的「智能体预设」能力：席位（Seat）是输入框旁的角色入口，Section 是设置页的预设管理块，Guide 是首次使用引导。三块共用本包的 store 与 locales。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/index.ts | 源码 | 291 | 包入口：注册席位槽位、设置分区与引导流程（结构判断） |
| src/client/AgentPresetSeat.tsx | 源码 | 221 | 输入区预设席位按钮，展示当前预设并打开选择面板（结构判断） |
| src/client/AgentPresetSection.tsx | 源码 | 176 | 设置页预设管理区，列出并增删预设（结构判断） |
| src/client/seat-store.ts | 源码 | 270 | 席位选中状态与预设列表的存储与同步（结构判断） |
| src/client/section-store.ts | 源码 | 122 | 设置分区的编辑态与校验状态（结构判断） |
| src/client/settings-store.ts | 源码 | 179 | 预设设置读写，落到 shell 设置镜像（结构判断） |
| src/client/PresetGuideDialog.tsx | 源码 | 160 | 预设引导弹窗，逐步说明用法（结构判断） |
| src/client/AgentPresetLabel.tsx | 源码 | 68 | 预设名称的小号标签渲染（结构判断） |
| src/client/CreatePluginMenuItem.tsx | 源码 | 50 | 把「预设」转为插件创建的菜单项（结构判断） |
| src/client/guide-locales.ts | 源码 | 552 | 引导步骤的多语言长文案（结构判断） |
| src/client/locales.ts | 源码 | 385 | 本包界面文案字典（结构判断） |
| src/client/analytics.ts | 源码 | 17 | 预设使用埋点上报（结构判断） |
| src/client/*.module.css | 样式 | 5 个 | 席位、分区、引导弹窗、菜单项、标签的样式（结构判断） |
| src/index.ts | 源码 | 9 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 8 个 | 覆盖席位选择、分区编辑、引导与埋点（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 20. client/ui-agent-team — 多智能体团队

把「团队模式」做成输入区旁的开关与看板：开关切换团队协作模式，看板展示团队成员与指令行，关闭前有确认弹窗。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/mount.ts | 源码 | 71 | 把团队 UI 挂到 shell 指定区域（结构判断） |
| src/client/TeamBoard.tsx | 源码 | 112 | 团队看板：成员卡片与当前指令列表（结构判断） |
| src/client/TeamModeToggle.tsx | 源码 | 70 | 团队模式开关，切换并持久化开关状态（结构判断） |
| src/client/TeamDisableConfirmation.tsx | 源码 | 76 | 关闭团队模式的二次确认弹窗（结构判断） |
| src/client/TeamCommandRow.tsx | 源码 | 65 | 看板中的单条团队指令行（结构判断） |
| src/client/index.ts | 源码 | 16 | 包入口（结构判断） |
| src/client/locales.ts | 源码 | 279 | 本包文案字典（结构判断） |
| src/client/*.module.css | 样式 | 4 个 | 看板、指令行、确认弹窗、开关样式（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 6 个 | 覆盖开关、看板与确认流程（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 21. client/ui-approval — 工具审批

工具调用前的审批授权界面：卡片给出待批操作与风险说明，面板负责队列，警戒条提示高危操作。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/contract/slots.ts | 源码 | 230 | 审批卡片与面板的槽位契约（props 与渲染上下文类型）（结构判断） |
| src/client/index.ts | 源码 | 110 | 包入口：向 tool/chat 槽位注册审批视图（结构判断） |
| src/client/ApprovalCard.tsx | 源码 | 93 | 单个审批请求卡片，提供同意/拒绝/修改参数操作（结构判断） |
| src/client/ApprovalWarning.tsx | 源码 | 97 | 高危操作警示条，解释风险与影响范围（结构判断） |
| src/client/ApprovalPanel.tsx | 源码 | 20 | 审批队列面板容器（结构判断） |
| src/client/locales.ts | 源码 | 92 | 本包文案字典（结构判断） |
| src/client/ApprovalPanel.module.css | 样式 | 199 | 审批面板与卡片样式（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| tests/*.spec.ts(x) | 测试 | 1 个 | 覆盖审批卡片决策与警示渲染（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 22. client/ui-attachment — 附件与图片

统一处理「发给模型的附件」：输入区拖放、文件卡片、消息里的图片网格，以及拖拽事件到上传流程的桥接。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/AttachmentRail.tsx | 源码 | 171 | 输入区附件轨道，横向排列待发送文件并可移除（结构判断） |
| src/client/ComposerAttachments.tsx | 源码 | 169 | 输入框内的附件区容器，联动 rail 与上传状态（结构判断） |
| src/client/MessageImage.tsx | 源码 | 190 | 消息中的单张图片：缩略图、点击放大、加载失败态（结构判断） |
| src/client/MessageImages.tsx | 源码 | 34 | 消息图片网格编排（结构判断） |
| src/FileCard.tsx | 源码 | 81 | 文件卡片：图标、名称、大小与操作按钮（结构判断） |
| src/DropOverlay.tsx | 源码 | 77 | 整页/输入区拖放高亮遮罩（结构判断） |
| src/client/drop-events.ts | 源码 | 94 | 把浏览器 drag/drop 事件规整为附件列表（结构判断） |
| src/client/labels.ts | 源码 | 79 | 文件类型到展示标签的映射（结构判断） |
| src/client/index.ts | 源码 | 47 | 浏览器侧入口，注册附件槽位（结构判断） |
| src/index.ts | 源码 | 4 | 导出 rail、卡片、遮罩等公共组件（结构判断） |
| src/*.module.css、src/client/*.module.css | 样式 | 5 个 | 轨道、文件卡、遮罩、图片、附件区样式（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 6 个 | 覆盖拖放解析、附件渲染与图片交互（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 23. client/ui-brand-official — 官方品牌视觉

存放品牌相关的可视资产与渲染逻辑：首页像素鲸动画（PixelWhale）、官方标识组件，以及供其他包复用的品牌图形渲染器。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/home-whale/renderer.ts | 源码 | 225 | 像素鲸的逐帧绘制与调色逻辑（结构判断） |
| src/client/home-whale/code-fill.ts | 源码 | 89 | 用代码片段填充鲸身纹理的生成器（结构判断） |
| src/client/home-whale/PixelWhale.tsx | 源码 | 53 | 首页像素鲸组件，驱动动画循环（结构判断） |
| src/client/home-whale/artwork.ts | 源码 | 30 | 像素鲸的点阵原始数据（结构判断） |
| src/client/Brand.tsx | 源码 | 19 | 官方品牌标识组件（结构判断） |
| src/client/index.ts | 源码 | 27 | 浏览器侧入口（结构判断） |
| src/client/assets/breach-atlas.webp | 资源 | — | 品牌插画位图，用于首页/引导视觉（结构判断） |
| src/client/home-whale/PixelWhale.module.css | 样式 | 20 | 像素鲸容器与画布样式（结构判断） |
| src/index.ts | 源码 | 7 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 3 个 | 覆盖渲染器输出与品牌组件（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 24. client/ui-chat — 会话正文的渲染实现

`ui-chat` 是 `ui-conversation` 槽位的默认实现：把装配层产出的节点树渲染成用户看到的聊天流。它分三段：`conversation-nodes/` 向 `ui-conversation` 注册每种节点（assistant / tool / command / retry / compaction / turn-error / turn-max-tokens / turn-tail / turn-process）的定义与视图构建器，`chat-snapshot-builder.ts` 是这段的核心，把会话事件投影成 `ChatSnapshot`；`chat/` 是 React 渲染层，`ChatView` 负责整条流、`MessageItem` 负责单条消息、上下文/推理/工具/统计各有组件，配套一堆 `use-chat-*` 的滚动与视口 hook；`contract/` 放 `ChatNodeDataMap`、槽位 props 与快照类型，供别的插件做声明合并扩展。滚动是本包最重的部分：`use-chat-viewport` + `flow-motion` + `use-scroll-follow` + `fold-follow` 共同处理折叠动画与「跟随到底部」策略。

### 24.1 入口与配置

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/index.ts | 源码（host 半边） | 45 | 把聊天偏好（`transcriptView`、`collapseTiming`、`foldedReplies`、`performanceUsage`、`linkOpening`）注册成 `dsh-settings` 的可配置字段并投影到浏览器（精读）。 |
| src/chat-settings.ts | 源码 | 98 | 聊天的五个偏好字段定义：字段名常量、默认值、`ChatSettingsFields` 校验描述与旧值迁移常量（精读：模块头与常量）。 |
| src/css-modules.d.ts | 类型声明 | 6 | `*.module.css` 的模块类型声明（结构判断）。 |
| src/client/index.ts | 源码 | 69 | 浏览器半边总出口：再导出全部节点类型与快照类型，并定义可被其他插件声明合并扩展的 `ChatNodeDataMap`（精读）。 |
| src/client/apply.ts | 源码 | 355 | 浏览器插件装配：注册节点定义、视图构建器、槽位条目与设置面板，是整包的启动入口。（结构判断） |

### 24.2 contract/ — 类型与槽位

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/client/contract/slots.ts | 类型契约 | 508 | 槽位与组件 props 中心：`ChatViewSlotProps`、`ChatNodeViewProps`、`ChatScrollPosition`、`UseChat`、`UsePresentation`、推理/用户内容/审批等 owner props；同时向 `ui-context-menu` 做声明合并。（结构判断） |
| src/client/contract/snapshot.ts | 类型契约 | 171 | `ChatSnapshot` 及其索引类型：`ChatLocationNodeIndex`、`ChatTurnNavigationIndex`、`ChatNodeStore`，并携带 `ui-conversation` 的节点类型再导出。（结构判断） |
| src/client/contract/chat-nodes.ts | 类型契约 | 135 | 聊天节点判别联合：`ChatNodeKind`、各 `*ChatData`（assistant / tool / turn-process / turn-tail / retry / compaction），以及 `isRunningTool`、`isSettledTool` 判定。（结构判断） |
| src/client/contract/turn-process.ts | 类型契约 | 58 | 单轮「处理过程」折叠视图的规格 `TurnProcessSpec`。（结构判断） |
| src/client/contract/turn-metrics.ts | 类型契约 | 43 | 轮次指标（耗时、token、缓存命中）类型。（结构判断） |
| src/client/contract/group-tree.ts | 类型契约 | 37 | 分组树结构类型与 `isAtOrOutside` 位置比较。（结构判断） |
| src/client/contract/process-groups.ts | 类型契约 | 30 | 处理过程分组（`ProcessActivity`、`ProcessGroupData`）类型。（结构判断） |
| src/client/contract/chat-visibility.ts | 类型契约 | 20 | 节点是否可见的判定契约 `isVisibleChatNode`。（结构判断） |
| src/client/contract/store.ts | 类型契约 | 17 | 聊天 store 状态类型 `ChatStoreState`。（结构判断） |
| src/client/contract/assistant-content.ts | 类型契约 | 15 | 助手内容渲染的输入类型。（结构判断） |

### 24.3 conversation-nodes/ — 节点定义与快照构建

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/client/conversation-nodes/chat-snapshot-builder.ts | 源码 | 1244 | 快照构建主入口：按节点 key 做缓存（`cachedSource`）、合并分组树片段（`GroupTreeSegments`）、维护轮次导航索引与处理过程投影，输出稳定的 `ChatSnapshot`；结构上分「源节点缓存 → 分组树合并 → 轮次导航 → 处理过程快照 → 引用比对后发布」五段（精读：模块头与结构）。 |
| src/client/conversation-nodes/assistant.ts | 源码 | 384 | 助手消息节点定义：把流式 chunk 累积成 `PartialAssistant` / `FinalAssistant`，并产出 Markdown 视图。（结构判断） |
| src/client/conversation-nodes/turn-process.ts | 源码 | 374 | 单轮处理过程节点：把工具调用与思考步骤聚成可折叠的「过程」块。（结构判断） |
| src/client/conversation-nodes/tool.ts | 源码 | 371 | 工具调用节点：started / running / settled 三态与结果块。（结构判断） |
| src/client/conversation-nodes/process-groups.ts | 源码 | 303 | 处理过程的分组规则实现（连续同类活动折成一组）。（结构判断） |
| src/client/conversation-nodes/command.ts | 源码 | 227 | 斜杠命令节点定义与渲染入口。（结构判断） |
| src/client/conversation-nodes/message.ts | 源码 | 182 | 用户消息节点定义（含附件与提到的工作区文件）。（结构判断） |
| src/client/conversation-nodes/event-projection.ts | 源码 | 179 | 会话事件到业务事实的投影助手：`sessionRecallLabels`、`skillInvocationName` 等。（结构判断） |
| src/client/conversation-nodes/process-activity.ts | 源码 | 170 | 单条过程活动（一次思考/一次工具）的模型与呈现。（结构判断） |
| src/client/conversation-nodes/request-prompt.ts | 源码 | 169 | 请求检视视图的节点：把发送给模型的 prompt 渲染成可折叠结构。（结构判断） |
| src/client/conversation-nodes/turn-tail.ts | 源码 | 164 | 轮次尾部节点（用量、耗时、模型标识）。（结构判断） |
| src/client/conversation-nodes/turn-process-presentation.ts | 源码 | 149 | 处理过程的呈现策略投影 `ChatTurnProcessProjector`。（结构判断） |
| src/client/conversation-nodes/inbox.ts | 源码 | 148 | 收件箱/待处理消息节点（inbox 状态）。（结构判断） |
| src/client/conversation-nodes/turn-error.ts | 源码 | 120 | 轮次错误节点定义。（结构判断） |
| src/client/conversation-nodes/retry.ts | 源码 | 97 | 模型重试节点定义。（结构判断） |
| src/client/conversation-nodes/turn-navigation.ts | 源码 | 97 | 轮次导航条目计算与相等比较 `sameTurnNavigationItem`。（结构判断） |
| src/client/conversation-nodes/group-tree-segments.ts | 源码 | 91 | 把分组树切成可增量比对的片段，供快照构建器复用。（结构判断） |
| src/client/conversation-nodes/common.ts | 源码 | 83 | 位置换算助手 `locationCoordinates` 等共用小函数。（结构判断） |
| src/client/conversation-nodes/turn-max-tokens.ts | 源码 | 82 | 「达到最大 token」节点定义。（结构判断） |
| src/client/conversation-nodes/compaction.ts | 源码 | 65 | 上下文压缩摘要节点定义。（结构判断） |
| src/client/conversation-nodes/fallback.ts | 源码 | 41 | 未知节点类型的兜底定义。（结构判断） |
| src/client/conversation-nodes/register.ts | 源码 | 38 | 把上述全部节点定义一次性注册进 `ui-conversation` 的注册表。（结构判断） |

### 24.4 chat/ — React 渲染层

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/client/chat/ChatView.tsx | 源码 | 351 | 整条聊天流的视图：外层有 `[data-conversation-scroll]` 时由外层拥有滚动，否则自己拥有；每行订阅一个稳定节点 key，并装配 TurnNavigator、段落交互与文件打开（精读：模块头）。 |
| src/client/chat/ContextBody.tsx | 源码 | 592 | 上下文正文视图：分类渲染系统提示、注入条目、工具定义等上下文内容。（结构判断） |
| src/client/chat/MessageItem.tsx | 源码 | 410 | 单条消息外壳：头像/图标、操作按钮、时间与折叠状态的组合。（结构判断） |
| src/client/chat/StatsPills.tsx | 源码 | 348 | 轮次统计胶囊（耗时、token、缓存）与其详情弹窗触发。（结构判断） |
| src/client/chat/TurnNavigator.tsx | 源码 | 295 | 右侧轮次导航轨道：跳转到某个 user turn。（结构判断） |
| src/client/chat/ChatGroupSeat.tsx | 源码 | 208 | 分组座位：渲染一组折叠后的活动。（结构判断） |
| src/client/chat/ChatNodeSeat.tsx | 源码 | 179 | 单节点座位：按 `ChatNodeKind` 分派到具体视图组件。（结构判断） |
| src/client/chat/AssistantMarkdown.tsx | 源码 | 170 | 助手 Markdown 渲染，接 `ui-primitives` 的 Markdown 委托与围栏代码块。（结构判断） |
| src/client/chat/ReasoningRow.tsx | 源码 | 112 | 思考过程行（可展开的 reasoning 区块）。（结构判断） |
| src/client/chat/TurnUsagePanel.tsx | 源码 | 110 | 轮次用量面板（输入/输出 token 与费用估算）。（结构判断） |
| src/client/chat/ChatFlow.tsx | 源码 | 100 | 流容器：把快照里的节点数组映射成行并交座位渲染。（结构判断） |
| src/client/chat/message-chrome.ts | 源码 | 100 | 消息外壳相关的类名与结构助手。（结构判断） |
| src/client/chat/register-node-renderers.ts | 源码 | 100 | 把节点视图组件注册到 `ui-renderer` 的渲染表。（结构判断） |
| src/client/chat/ContextInjectionRow.tsx | 源码 | 94 | 单条上下文注入行。（结构判断） |
| src/client/chat/MessageIconActions.tsx | 源码 | 90 | 消息悬浮图标操作（复制、重试、分支）。（结构判断） |
| src/client/chat/TurnTailNodeView.tsx | 源码 | 81 | 轮次尾部节点视图。（结构判断） |
| src/client/chat/CompactionItem.tsx | 源码 | 76 | 压缩摘要条目视图。（结构判断） |
| src/client/chat/GenericCommandCard.tsx | 源码 | 75 | 通用命令卡片（收到命令结果时的展示）。（结构判断） |
| src/client/chat/AssistantNodeView.tsx | 源码 | 67 | 助手节点视图：正文 + 附件 + 操作。（结构判断） |
| src/client/chat/TurnProcessNodeView.tsx | 源码 | 62 | 处理过程节点视图（折叠/展开外壳）。（结构判断） |
| src/client/chat/UserContent.tsx | 源码 | 60 | 用户消息正文（纯文本 + 引用 + 附件）。（结构判断） |
| src/client/chat/TurnTriggerNodeView.tsx | 源码 | 57 | 轮次触发节点（user turn 的头）视图。（结构判断） |
| src/client/chat/SystemPromptRow.tsx | 源码 | 50 | 系统提示词行。（结构判断） |
| src/client/chat/RunningStatus.tsx | 源码 | 48 | 「运行中」状态条。（结构判断） |
| src/client/chat/ApprovalCommand.tsx | 源码 | 42 | 审批命令卡片（工具需要人工确认时）。（结构判断） |
| src/client/chat/CommandNodeView.tsx | 源码 | 40 | 命令节点视图。（结构判断） |
| src/client/chat/RunningWhaleTail.tsx | 源码 | 19 | 运行中鲸鱼动画尾巴（配合 `assets/running-whale@2x.png`）。（结构判断） |
| src/client/chat/QuotaNoticeHost.tsx | 源码 | 27 | 额度提示的宿主挂载点。（结构判断） |
| src/client/chat/ReasoningContent.tsx | 源码 | 26 | 思考内容的轻量包装。（结构判断） |
| src/client/chat/CompactionCommandCard.tsx | 源码 | 26 | 「/compact」命令卡片。（结构判断） |
| src/client/chat/render-entry.ts | 源码 | 16 | 渲染表条目的最小结构类型。（结构判断） |
| src/client/chat/turn-assistant.ts | 源码 | 10 | 助手轮次的小助手常量/函数。（结构判断） |

### 24.5 chat/ — 滚动、视口与交互 hook

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/client/chat/use-chat-viewport.ts | 源码 | 1130 | 轮次感知的 DOM 滚动与几何计算，不含历史加载与跟随策略：产出 `ViewportScroll` / `ViewportLanding`，并把滚动事件、resize、阅读手势分发给上层 hook；结构上分「几何测量 → 落点计算 → 事件分发 → 折叠盒驱动」四段（精读：模块头）。 |
| src/client/chat/flow-motion.ts | 源码 | 556 | 折叠过渡动画：同一帧内移动关闭行的盒子与滚动口，纯展开批次走 CSS transition；动画由 `[data-chat-motion]` 选择性开启、尊重 reduced-motion 并清理临时样式（精读：模块头）。 |
| src/client/chat/use-chat-navigation.ts | 源码 | 309 | 轮次导航行为：当前轮次判定、跳转与轨道条目合并。（结构判断） |
| src/client/chat/text-interaction.ts | 源码 | 298 | 文本交互手势（选中复制、点击引用）的 hook 实现。（结构判断） |
| src/client/chat/use-chat-reading.ts | 源码 | 283 | 阅读态判定：用户是否已离开底部、是否正在阅读历史。（结构判断） |
| src/client/chat/use-chat-scroll.ts | 源码 | 209 | 滚动编排：把 viewport、follow 与历史加载串起来。（结构判断） |
| src/client/chat/use-scroll-follow.ts | 源码 | 182 | 「跟随到底部」策略与 `ScrollFollow` 类，提供 `scrollMetrics`。（结构判断） |
| src/client/chat/text-selection.ts | 源码 | 180 | 文本选区的捕获与还原（折叠重渲染后保持选区）。（结构判断） |
| src/client/chat/use-process-scroll.ts | 源码 | 88 | 处理过程区块内的局部滚动保持。（结构判断） |
| src/client/chat/turn-rail-items.ts | 源码 | 89 | 导航轨道条目合并 `mergeTurnRailItems`。（结构判断） |
| src/client/chat/turn-trigger.ts | 源码 | 88 | 轮次触发的定位与测量。（结构判断） |
| src/client/chat/searchable-hidden.ts | 源码 | 45 | 可搜索隐藏行（折叠后仍可被搜索命中）的过渡状态。（结构判断） |
| src/client/chat/use-disclosure.ts | 源码 | 35 | 通用展开/收起状态 hook。（结构判断） |
| src/client/chat/step-process.ts | 源码 | 28 | 步骤级过程的小工具。（结构判断） |
| src/client/chat/use-calendar-day.ts | 源码 | 25 | 日期分组用的「日历日」判定。（结构判断） |
| src/client/chat/use-turn-data.ts | 源码 | 23 | 从上下文取单轮数据的 hook。（结构判断） |

### 24.6 其余源码（模型 / 策略 / 设置 / fence）

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/client/locale.ts | 源码 | 1695 | 包内词典 `ChatKey` 与全部文案，行数大来自文案密度。（结构判断） |
| src/client/model/tool-call-tree.ts | 源码 | 204 | 把扁平的 tool call 列表还原成父子调用树。（结构判断） |
| src/client/model/steering-history.ts | 源码 | 64 | steering（转向指令）历史的重建。（结构判断） |
| src/client/model/conversation-context.ts | 源码 | 24 | 会话上下文来源类型 `ConversationContext`。（结构判断） |
| src/client/stores.ts | 源码 | 62 | 聊天 store 工厂（基于 client-store 快照）。（结构判断） |
| src/client/presentation-policy.ts | 源码 | 109 | 呈现策略：已完成轮次折叠到什么程度（`foldedReplies`、`collapseTiming`）。（结构判断） |
| src/client/transcript-view.ts | 源码 | 81 | 记录视图模式（完整/紧凑/旧版）的解析与迁移。（结构判断） |
| src/client/token-format.ts | 源码 | 98 | token 数字的格式化（k / M 缩写与精度）。（结构判断） |
| src/client/performance-usage.ts | 源码 | 34 | 性能与用量详情的显示档位。（结构判断） |
| src/client/reasoning-text.ts | 源码 | 25 | 思考文本的清理与截断。（结构判断） |
| src/client/file-path.ts | 源码 | 19 | 文件路径在聊天中的展示压缩。（结构判断） |
| src/client/markdown-labels.ts | 源码 | 16 | Markdown 渲染所需的本地化标签。（结构判断） |
| src/client/chat/stat-dialog.ts | 源码 | 55 | 统计详情弹窗的打开/关闭状态机。（结构判断） |
| src/client/fence/FenceLayers.tsx | 源码 | 33 | 围栏代码块的分层渲染（高亮层/操作层）。（结构判断） |
| src/client/fence/register.ts | 源码 | 22 | 把 fence 渲染注册进 Markdown 委托。（结构判断） |
| src/client/settings/TranscriptViewRow.tsx | 源码 | 93 | 设置页「记录视图」下拉行。（结构判断） |
| src/client/settings/PreferenceRow.tsx | 源码 | 59 | 设置页通用偏好行外壳。（结构判断） |
| src/client/settings/LinkOpeningRow.tsx | 源码 | 47 | 设置页「链接打开位置」行。（结构判断） |
| src/client/settings/PerformanceUsageRow.tsx | 源码 | 46 | 设置页「性能与用量」行。（结构判断） |
| src/client/assets/running-whale@2x.png | 图片 | —（二进制） | 运行中鲸鱼动画的位图素材，供 `RunningStatus` / `RunningWhaleTail` 使用。（结构判断） |

### 24.7 样式、词典与工程样板

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/client/**/*.module.css（18 个） | 样式 | 2,223 | CSS Modules：`ChatView` 426、`MessageItem` 360、`TurnNavigator` 223、`ChatGroupSeat` 166、`ContextBody` 161、`stat-dialog` 149、`MessageIconActions` 116、`AssistantMarkdown` 88、`TurnUsagePanel` 79、`ReasoningRow` 77、`ContextInjectionRow` 68、`PreferenceRow` 66、`StatsPills` 63、`TurnProcessNodeView` 62、`TurnTriggerNodeView` 50、`GenericCommandCard` 49、`TurnTailNodeView` 12、`accessibility` 8。（结构判断） |
| locale/*.json（8 个） | 词典占位 | 各 5–6 | 只有 `meta.title`；真实文案在 `src/client/locale.ts`。（结构判断） |
| README.md / README.zh.md / README.i18n.yaml / package.json / tsconfig.json / tsconfig.client.json / tsconfig.host.json / tsdown.config.ts | 工程样板 | 236 / 236 / 52 / 117 / 11 / 133 / 23 / 3 | 包元数据、双面构建配置与双语说明（结构判断）。 |

### 24.8 tests/ — 67 个文件按被测对象归组

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| chat-view / chat-branch-tails / chat-node-bottom / chat-node-source / chat-visibility / coverage-tails / gate-branch-tails / views-type-chain | 测试（8 个） | 6,617 | 视图与分支渲染：`chat-view` 4918 是整条流的端到端快照，`chat-branch-tails` 1160 覆盖分支尾部渲染，其余覆盖节点位置、可见性与类型链。（结构判断） |
| conversation-node-definitions / process-groups / tool-preparation / tool-call-tree / tool-updates / event-projection / skill-name-projector / group-tree-segments / turn-process-tail / turn-tail-spacing / turn-metrics | 测试（11 个） | 4,750+ | 节点定义与投影：`conversation-node-definitions` 3155 逐节点校验定义，其余覆盖过程分组、工具准备/更新、调用树、事件投影（行数在清单中为空，属二进制误判，待确认）、分组片段与轮次指标。 |
| chat-scroll / chat-viewport / flow-motion / fold-follow / scroll-follow / chat-history-intent / flow-motion-scope / chat-scroll-overflow | 测试（8 个） | 2,892 | 滚动与动画：视口几何（721）、滚动编排（773）、折叠动画（675）、跟随策略、历史加载意图与动画作用域。（结构判断） |
| reasoning-row / reasoning-content / reasoning-text / text-interaction / text-selection / assistant-markdown-path-images / approval-command / context-menu / system-prompt-row / turn-trigger / turn-navigator / turn-usage-panel / user-content / user-origin-slot / quota-notice / running-status / running-whale-tail / fence-layers / fence-slot / use-disclosure / image-labels / chat-stats / transcript-view-row | 测试（23 个） | 3,945 | 组件级：思考行/内容/文本、文本交互与选区、Markdown 图片路径、审批卡、上下文菜单、系统提示词、轮次触发/导航/用量、用户内容与来源槽、额度提示、运行态、围栏代码块、图片标签、统计胶囊、记录视图行。（结构判断） |
| apply-inject / chat-apply / config.host / chat-store / conversation / chat-snapshot-fixture / presentation-policy / presentation-fixture / performance-usage / transcript-view-policy / chat-font-axis-styles / sticky-header-styles / reasoning-component-fixture / reasoning-render-fixture / turn-navigator-fixture / user-content-component-fixture | 测试（16 个） | 2,617 | 装配、store 与 fixture：inject 装配（554）、插件装配（520）、host 配置、store、快照 fixture（574）、呈现策略、字体轴与吸顶头样式、各类渲染 fixture。（结构判断） |

## 25. client/ui-commands — 斜杠命令与选择弹层

命令体系的表现层：把命令目录（directory）解析成可选项，用弹层（PopupSelectView）呈现，service 负责命令执行与结果回填。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/service.ts | 源码 | 508 | 命令服务：解析输入、查询目录、执行命令并回写输入框（结构判断） |
| src/client/popup.ts | 源码 | 331 | 弹层状态机：键盘导航、分页、滚动与提交（结构判断） |
| src/client/PopupSelectView.tsx | 源码 | 214 | 弹层视图：分组选项、高亮与选中反馈（结构判断） |
| src/client/directory.ts | 源码 | 185 | 命令目录聚合：合并各包注册的命令项（结构判断） |
| src/client/contract.ts | 源码 | 150 | 命令与选项的数据契约（结构判断） |
| src/client/presentation.ts | 源码 | 86 | 命令项的展示信息（图标、副标题、分组）（结构判断） |
| src/client/index.ts | 源码 | 76 | 包入口：注册命令槽位与弹层（结构判断） |
| src/client/option-groups.ts | 源码 | 24 | 选项分组规则（结构判断） |
| src/client/resolution.ts | 源码 | 15 | 命令解析结果到执行请求的转换（结构判断） |
| src/client/locales.ts | 源码 | 267 | 本包文案字典（结构判断） |
| src/client/PopupSelectView.module.css | 样式 | 143 | 弹层样式（结构判断） |
| src/index.ts | 源码 | 10 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 5 个 | 覆盖目录聚合、弹层导航与命令执行（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 26. client/ui-context-menu — 右键菜单

右键菜单的注册与渲染中枢：各包按「目标类型 + 键」注册菜单项，本包负责触发、定位与渲染。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/index.ts | 源码 | 182 | 包入口：注册菜单槽位，暴露注册 API 给其他包（结构判断） |
| src/client/registry.ts | 源码 | 173 | 菜单项注册表：按目标类型收集与排序菜单项（结构判断） |
| src/client/types.ts | 源码 | 155 | 菜单项、目标与命令的数据类型（结构判断） |
| src/client/View.tsx | 源码 | 62 | 菜单视图：渲染项、分隔符与禁用态（结构判断） |
| src/client/Button.tsx | 源码 | 53 | 触发右键菜单的按钮封装（结构判断） |
| src/client/trigger.ts | 源码 | 43 | 统一处理 contextmenu 事件与坐标（结构判断） |
| src/client/store.ts | 源码 | 41 | 当前菜单的打开状态与目标（结构判断） |
| src/client/target-key.ts | 源码 | 14 | 目标对象到注册键的规范化（结构判断） |
| src/client/external-trigger.ts | 源码 | 11 | 供非 React 场景触发的桥接函数（结构判断） |
| src/client/locales.ts | 源码 | 11 | 通用菜单文案（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| tests/*.spec.ts(x) | 测试 | 6 个 | 覆盖注册表、目标键与菜单渲染（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 27. client/ui-conversation — 会话视图装配与输入区

`ui-conversation` 是浏览器端「一次会话」的完整视图层，也是客户端里体量第二大的 UI 包（172 个文件、86 个非 CSS 源文件、60 个测试）。它分成四块互相咬合的结构：`contract/` 只放类型与槽位声明，定义节点、分组、输入、草稿、请求检视等对外契约；`conversation/` 是装配层，把 session-controller 推来的事件流翻译成可渲染的节点树（`assembler.ts` 为主入口，`location-index.ts` 维护 turn/step 的位置索引，各类 registry 负责可替换的节点、分组、视图与交互定义）；`input/` 是输入区，下半层是 Lexical 编辑器（文本 + chip 的真相源）与纯状态机 `machine.ts`，上半层 `facade.ts` 把两者编排成 `InputState` 并处理提交事务；`skeleton/` 是会话外壳的 React 组件（根容器、Header、Content、InputBar、TodoPanel、上下文占用表）。包本身是 target-neutral 的：组件不直接依赖具体渲染器，槽位与工厂 props 由 `ui-slots` 注入。

### 27.1 入口与配置

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/index.ts | 源码（host 半边） | 32 | 浏览器会话偏好的设置项声明：把「忙碌时回车行为」注册成 `dsh-settings` 的可配置字段，并在 `ctx.inject(['settings'])` 里挂上配置面板（精读）。 |
| src/submission-settings.ts | 源码 | 32 | 定义 `BUSY_ENTER_FIELD`、`BUSY_ENTER_BEHAVIORS` 常量与 `ConversationSettings` 类型，供 host 与浏览器两侧共同引用，避免重复字面量（精读）。 |
| src/css-modules.d.ts | 类型声明 | 6 | 为 `*.module.css` 提供模块类型声明（结构判断）。 |
| src/client/index.ts | 源码 | 119 | 浏览器半边总出口：把 contract 里的类型、装配器、service、registry 全部再导出，并用 `declare module '@deepseek-ai/cordis'` 把 `ctx.conversation`（作用域寻址的会话动作）与 `ctx.uiConversation`（registry 与装配）挂到 Context 上（精读）。 |

### 27.2 contract/ — 只含类型与槽位声明

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/client/contract/slots.ts | 类型契约 | 748 | 全包槽位与组件 props 的声明中心：`ComposerBar*`、`ConversationContent*`、`ConversationSession*`、`MessageImages*`、`UserText*`、`UseConversation` 等，全部用 `ui-slots` 的工厂/注入/渲染泛型拼装；同时向 `ui-context-menu` 的 `ContextMenuTargetMap` 做声明合并（精读）。 |
| src/client/contract/conversation.ts | 类型契约 | 343 | 会话节点的定义式接口：`ConversationNodeDefinition`、`ConversationMatch`、`ConversationViewBuilder`、turn/step 位置类型与 `conversationContextKey` 键推导。（结构判断） |
| src/client/contract/records.ts | 类型契约 | 322 | 具体节点记录类型：用户/助手消息、工具调用（started/running/preparing）、压缩摘要、模型重试、`TurnErrorNode`、`TurnMaxTokensNode`、`UnknownSurfaceNode` 等。（结构判断） |
| src/client/contract/input.ts | 类型契约 | 412 | 输入区对外面：`SessionInput`、`InputState`、`InputActions`、`SubmitOutcome`、`ConsumeTokenRequest`、`InputTriggerController` 等，是输入机器与外部插件的边界。（结构判断） |
| src/client/contract/draft-editor.ts | 类型契约 | 144 | 草稿编辑器契约：`DraftSnapshot`、`TokenSpan`、`ReferenceInsert`、`ComposerKeyboard`、`EditSelection` 与按键仲裁结果。（结构判断） |
| src/client/contract/groups.ts | 类型契约 | 134 | 会话分组（把交错节点折成一组）的输入输出：`ConversationGroupDefinition`、`GroupNodePosition`、`GroupUpdate`、`RenderEntry`。（结构判断） |
| src/client/contract/request-inspection.ts | 类型契约 | 182 | 请求检视视图：`ConversationPromptSnapshot`、`RequestPromptInspection`、`SystemPromptNode`，并导出 `inspectRequestPrompt` 纯函数。（结构判断） |
| src/client/contract/system-prompt.ts | 类型契约 | 85 | 系统提示词的检视状态与检查器接口 `SystemPromptInspector`。（结构判断） |
| src/client/contract/context-producer.ts | 类型契约 | 31 | 上下文条目来源（谁往上下文里放了什么）的只读视图类型。（结构判断） |
| src/client/contract/composer-blocks.ts | 类型契约 | 29 | 「输入区被某插件置为不可用」的块声明类型 `ComposerBlock(s)`。（结构判断） |
| src/client/contract/composer-submission.ts | 类型契约 | 31 | 提交模式（`InputSubmitMode`）与 `MessageSubmission*` 状态枚举。（结构判断） |
| src/client/contract/text-interaction.ts | 类型契约 | 35 | 文本交互手势/触发面类型，供 `interaction-registry` 使用。（结构判断） |
| src/client/contract/user-text.ts | 类型契约 | 63 | 用户文本节点化契约：`UserTextNode`、`UserTextRule`、`UserTextEvaluator`、`UserTextTransformContext`。（结构判断） |
| src/client/contract/views.ts | 类型契约 | 26 | 视图标签页（`ViewTab`）与 `ConversationViewRequest`、`ConversationStoreState`。（结构判断） |
| src/client/contract/snapshot.ts | 类型契约 | 34 | 会话快照的空值与阶段判定：`EMPTY_CONVERSATION_SNAPSHOT`、`conversationPhase()`。（结构判断） |

### 27.3 conversation/ — 事件流到节点树的装配

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/client/conversation/assembler.ts | 源码 | 1166 | 装配主入口 `ConversationNodeAssembler`：按定义匹配事件、维护当前节点与其 revision、驱动视图构建器产出 `ConversationViewSnapshotMap`，并处理窗口缺口（windowGap）与依赖失效；内部拆成「定义匹配 → 节点状态推进 → 分组折叠 → 视图快照发布」四段（精读：模块头与结构）。 |
| src/client/conversation/assembly.ts | 源码 | 353 | `UiConversation` 门面：把各 registry 与 assembler 组装成一个可按 Session 取用的装配实例，产出 `ConversationBinding`。（结构判断） |
| src/client/conversation/location-index.ts | 源码 | 655 | 位置索引：把每个 Session 事件归入 turn/step 位置，维护 `ConversationLocationDataStore` 的发布/订阅（`MutableLocationDataSource`）并在事件流入时增量更新（精读）。 |
| src/client/conversation/group-store.ts | 源码 | 229 | 分组状态的存储与变更通知，供 assembler 在折叠时读写。（结构判断） |
| src/client/conversation/definition-registry.ts | 源码 | 68 | 节点定义注册表：插件登记自己的 `ConversationNodeDefinition`，装配时按序匹配。（结构判断） |
| src/client/conversation/event-registry.ts | 源码 | 117 | 事件定义注册表：声明哪些 session 事件属于会话可见事件及其归类。（结构判断） |
| src/client/conversation/group-registry.ts | 源码 | 48 | 分组定义注册表。（结构判断） |
| src/client/conversation/interaction-registry.ts | 源码 | 55 | 文本交互（点击/悬停等手势）定义注册表。（结构判断） |
| src/client/conversation/user-text-registry.ts | 源码 | 51 | 用户文本规则注册表，按 id 管理文本变换规则。（结构判断） |
| src/client/conversation/view-registry.ts | 源码 | 20 | 视图定义注册表（视图标签页）。（结构判断） |
| src/client/conversation/historical-images.ts | 源码 | 181 | 历史消息中的图片回填：从会话记录里解析图片引用并补出可显示的来源。（结构判断） |
| src/client/conversation/user-text-document.ts | 源码 | 244 | 把用户原始文本按规则切成业务节点与文本节点的文档结构，保证 UTF-16 坐标不变。（结构判断） |

### 27.4 input/ — 编辑器下半层与输入编排上半层

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/client/input/facade.ts | 源码 | 883 | `SessionInput` 外壳：持有每会话的 Lexical 编辑器（文本 + chip 的真相）与纯提交状态机，编排投影与 `InputState` 发布、作用域事件应用、提交事务（仲裁 → claim.submit → 默认 sink）、提示通道与草稿持久化镜像；包内私有，只由 `hub.ts` 构造（精读：模块头）。 |
| src/client/input/hub.ts | 源码 | 331 | `InputHub`：为每个 Session 构造并缓存 `SessionInput`，把作用域事件监听器接到外壳上，并在会话销毁时释放。（结构判断） |
| src/client/input/machine.ts | 源码 | 228 | 纯提交状态机 `SubmitMachine`：phase / claim / attempt 三组状态的转移，不碰 DOM 也不碰网络。（结构判断） |
| src/client/input/blocks.ts | 源码 | 44 | 输入区禁用块（`ComposerBlock`）的登记与查询实现。（结构判断） |
| src/client/input/decorations.ts | 源码 | 104 | 编辑器装饰（高亮、选区标记）的描述与挂载。（结构判断） |
| src/client/input/file-intake.ts | 源码 | 99 | 粘贴/拖入文件的接收与类型判定，转成附件候选。（结构判断） |
| src/client/input/prompt.ts | 源码 | 88 | 把当前草稿（文本 + chip + 引用）序列化成待提交的 prompt 结构。（结构判断） |
| src/client/input/submission-policy.ts | 源码 | 86 | 提交前置策略：忙碌态、空内容、未就绪等情况的拦截判定。（结构判断） |
| src/client/input/submission-analytics.ts | 源码 | 38 | 提交行为的产品埋点事件组装。（结构判断） |
| src/client/input/editor/runtime.ts | 源码 | 479 | 编辑器运行时：持有 Lexical editor 实例与命令通道，暴露供外壳调用的命令式 API。（结构判断） |
| src/client/input/editor/projection.ts | 源码 | 250 | 草稿投影：把编辑器内部状态映射成 `DraftSnapshot`，并支持反向应用。（结构判断） |
| src/client/input/editor/keymap.ts | 源码 | 300 | 键位表：提交、换行、菜单、粘贴等手势在编辑器命令层的注册与仲裁。（结构判断） |
| src/client/input/editor/view-binding.ts | 源码 | 176 | 编辑器视图与 React 的绑定（contenteditable 上下文、选区同步）。（结构判断） |
| src/client/input/editor/span-map.ts | 源码 | 119 | 文本跨度映射：在 Lexical 节点偏移与纯文本偏移之间换算。（结构判断） |
| src/client/input/editor/text-ref.ts | 源码 | 106 | 文本引用（`text-ref`）的插入与解析。（结构判断） |
| src/client/input/editor/command-chip-selection.ts | 源码 | 110 | 命令 chip 的选中态管理与光标落点修正。（结构判断） |
| src/client/input/editor/chip-node.tsx | 源码 | 214 | chip 的通用 Lexical 节点实现（可装饰、可整体删除）。（结构判断） |
| src/client/input/editor/command-chip-node.tsx | 源码 | 157 | `/` 命令 chip 的专用节点。（结构判断） |
| src/client/input/editor/QuoteNode.tsx | 源码 | 173 | 引用块节点：引用一段会话内容时的可视节点。（结构判断） |
| src/client/input/editor/DraftEditor.tsx | 源码 | 64 | 编辑器 React 包装：创建 `LexicalComposer` 并挂装饰器入口。（结构判断） |
| src/client/input/editor/ComposerContentEditable.tsx | 源码 | 50 | 指向编辑器根节点的 contenteditable 容器。（结构判断） |
| src/client/input/editor/DecoratorPortals.tsx | 源码 | 41 | chip / 引用的装饰器 portal 派发。（结构判断） |
| src/client/input/editor/ReferenceChip.tsx | 源码 | 36 | 引用 chip 的展示组件。（结构判断） |
| src/client/input/editor/CommandChip.tsx | 源码 | 28 | 命令 chip 的展示组件。（结构判断） |
| src/client/input/editor/reference-activation.ts | 源码 | 33 | 引用 chip 的点击激活（打开被引用对象）逻辑。（结构判断） |

### 27.5 skeleton/ — 会话外壳 React 组件

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/client/skeleton/InputBar.tsx | 源码 | 604 | 默认输入条，即 `conversation.composer.bar` 槽位条目：通过 `useInput` + `inputActions` 取机器状态，通过自身 inject 取键盘/DOM 命令面与停止动作，自选 session 事实（running/removed/promptError）；文本面板绑定外壳的 Lexical 编辑器，chip 走装饰器 portal，无会话时复用同一个 div 作 Workspace 选择器触发器（精读：模块头）。 |
| src/client/skeleton/QueueDock.tsx | 源码 | 415 | 排队消息停靠栏：展示待发队列并支持编辑、删除、立即发送。（结构判断） |
| src/client/skeleton/ConversationSession.tsx | 源码 | 267 | 单会话容器：把会话快照、输入、视图标签组合成一棵可渲染子树。（结构判断） |
| src/client/skeleton/ConversationContent.tsx | 源码 | 211 | 会话正文区：按视图定义渲染节点列表并处理空态与加载态。（结构判断） |
| src/client/skeleton/ConversationWidthControls.tsx | 源码 | 182 | 会话宽度调节控件（拖动把手 + 预设宽度）。（结构判断） |
| src/client/skeleton/ContextMeter.tsx | 源码 | 173 | 上下文占用表：以环形/条形展示当前会话的 context 用量。（结构判断） |
| src/client/skeleton/EmptyHero.tsx | 源码 | 166 | 空会话首页：品牌标记、预设入口与示例提示。（结构判断） |
| src/client/skeleton/TodoPanel.tsx | 源码 | 119 | 会话内待办面板，读取 plan 投影并渲染清单。（结构判断） |
| src/client/skeleton/ConversationMainPanel.tsx | 源码 | 49 | 主面板布局：正文 + 侧栏停靠的组合。（结构判断） |
| src/client/skeleton/DefaultConversationViews.tsx | 源码 | 44 | 注册默认视图标签（对话/请求检视等）。（结构判断） |
| src/client/skeleton/ConversationPanel.tsx | 源码 | 12 | 面板级薄包装。（结构判断） |
| src/client/skeleton/ConversationRoot.tsx | 源码 | 13 | 会话根组件：套上根样式与错误边界。（结构判断） |
| src/client/skeleton/ConversationHeader.tsx | 源码 | 29 | 会话头部槽位容器。（结构判断） |
| src/client/skeleton/control-row-layout.ts | 源码 | 39 | 控制行（发送/停止/模型选择）的布局计算与类名合成。（结构判断） |
| src/client/skeleton/safari.ts | 源码 | 42 | Safari 下的输入区兼容处理（焦点、滚动锚定）。（结构判断） |

### 27.6 其余源码（队列 / 设置 / 用户文本 / 状态）

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/client/service.ts | 源码 | 648 | 对外会话服务 `ConversationController` / `IConversation`：发送、取消、历史的编排；作用域寻址靠 cordis Service tracker 的属性访问重绑 `this.ctx`，因此可变状态必须通过一次属性读取取得（精读：模块头）。 |
| src/client/locales.ts | 源码 | 3191 | 包内词典：`ConversationKey` 与全部中英文案，按会话/输入/队列/设置等分组；行数大是因为文案密度而非逻辑复杂度。（结构判断） |
| src/client/apply.ts | 源码 | 605 | 浏览器半边插件装配：注册 service、InputHub、节点/分组/视图定义与全部槽位条目，是整包真正的启动入口。（结构判断） |
| src/client/stores.ts | 源码 | 74 | 会话视图 store 的工厂（基于 client-store 的快照 store）。（结构判断） |
| src/client/draft.ts | 源码 | 127 | 草稿的纯函数层：`resolveDraftInput`、`snapshotDraft`，被 `facade.ts` 与编辑器共用。（结构判断） |
| src/client/stop-shortcut.ts | 源码 | 65 | 停止生成的快捷键注册（Esc 等）。（结构判断） |
| src/client/stop-sequence.ts | 源码 | 52 | 停止序列（连续按键/字符）识别。（结构判断） |
| src/client/view-pins.ts | 源码 | 36 | 视图固定（pin）状态：某些视图固定在后不随滚动切换。（结构判断） |
| src/client/view-selection.ts | 源码 | 21 | 当前视图标签的选择状态。（结构判断） |
| src/client/context-occupancy.ts | 源码 | 25 | 上下文占用比例的换算（token → 百分比与档位）。（结构判断） |
| src/client/image-labels.ts | 源码 | 59 | 消息中图片的无障碍/替代文本标签生成。（结构判断） |
| src/client/queue/QueueDock.tsx | 源码 | 415 | 排队停靠栏组件（同上组件层，按目录归此）。（结构判断） |
| src/client/settings/EnterBehaviorRow.tsx | 源码 | 76 | 设置页「忙碌时回车行为」下拉行。（结构判断） |
| src/client/user-text/UserText.tsx | 源码 | 64 | 用户文本渲染组件：按节点树渲染文本与业务节点。（结构判断） |
| src/client/user-text/session-reference-rule.ts | 源码 | 41 | 把 `@session` 引用识别为业务节点的规则。（结构判断） |
| src/client/user-text/whitespace-rules.ts | 源码 | 40 | 空白折叠/裁剪规则（`collapseWhitespace`、`trimWhitespace`）。（结构判断） |

### 27.7 样式、词典与工程样板

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/client/**/*.module.css（10 个） | 样式 | 2,089 | CSS Modules：`ConversationRoot` 647 最大（根网格与响应式断点），其次 `InputBar` 472、`QueueDock` 248、`HeroShell` 237、`ContextMeter` 221、`TodoPanel` 123、`EnterBehaviorRow` 66、`ReferenceChip` 32、`composer-editor` 31、`UserText` 12。（结构判断） |
| locale/*.json（8 个） | 词典占位 | 各 5–6 | 只有 `meta.title`（精读 en.json）；真实文案在 `src/client/locales.ts`。 |
| README.md / README.zh.md / README.i18n.yaml / package.json / tsconfig.json / tsconfig.client.json / tsconfig.host.json / tsdown.config.ts | 工程样板 | 238 / 238 / 49 / 114 / 11 / 116 / 23 / 3 | 包元数据、双面（client/host）构建配置与双语说明（结构判断）。 |

### 27.8 tests/ — 60 个文件按被测对象归组

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| conversation-assembler / conversation-registry / conversation-groups / conversation-group-store / conversation-routing / assembly-surfaces / conversation-store / views-type-chain / view-pins / view-selection | 测试（10 个） | 3,904 | 装配层：节点匹配与 revision（`conversation-assembler` 2075 最重）、定义注册表、分组折叠、路由、视图类型链、视图固定与选择。（结构判断） |
| input-bar / input-scenarios / input-matrix | 测试（3 个） | 3,286 | 输入条端到端：`input-bar` 2256 覆盖 DOM 交互与状态组合，`input-scenarios` 与 `input-matrix` 是场景矩阵回归。（结构判断） |
| draft-document / draft-hub / lexical-editor-core / editor-focus / editor-viewport / keymap-routing / quote-composer / selection-survival / reference-activation / reference-chip | 测试（10 个） | 2,576 | 编辑器层：Lexical 文档模型、草稿 hub、焦点与视口、键位路由、引用 chip 与选区存活。（结构判断） |
| submit-machine / input-reference-submit / submission-policy / stop-shortcut / stop-sequence / async-insertion | 测试（6 个） | 1,238 | 提交与停止：状态机转移、带引用的提交、策略拦截、停止快捷键与停止序列、异步插入。（结构判断） |
| service-orchestration / file-intake / request-inspection / system-prompt / historical-images / image-labels | 测试（6 个） | 1,766 | 服务层：发送/取消/历史编排（1197）、文件接收、请求检视、系统提示词、历史图片回填、图片标签。（结构判断） |
| skeleton / queue-dock / context-meter / todo-panel / enter-behavior-row / safari / header-styles / composer-seat-styles / control-row-layout / width-handle-styles | 测试（10 个） | 2,633 | 组件与样式契约：整壳渲染（1079）、队列停靠栏（798）、上下文占用表、待办面板、设置行、Safari 兼容、头部/座位/控制行/宽度把手样式。（结构判断） |
| apply-inject / apply-wiring / config.host / composer-blocks / interaction-registry | 测试（5 个） | 1,089 | 装配与配置：inject 装配（784）、槽位接线、host 侧配置、输入区禁用块、交互注册表。（结构判断） |
| user-text / user-text-registry / user-text-scheduling / user-text-whitespace / user-text-reference-composition / quote-user-text / user-text-component-fixture | 测试（7 个） | 1,372 | 用户文本：节点化渲染、规则注册表、调度、空白规则、引用与文本组合、组件 fixture。（结构判断） |
| continuation-fixture / control-row-dom / history-transport.perf | 测试辅助（3 个） | 657 | 非用例文件：续写 fixture、控制行 DOM 助手、历史传输性能基准（617）。（结构判断） |

## 28. client/ui-deliverables — 回合产出物

一轮对话结束时呈现「产出了什么」：改动文件清单、文件 diff、评审标签页与文件预览入口。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/turn-deliverables.ts | 源码 | 301 | 从一轮会话事件中汇总产出物（文件、评审、预览）（结构判断） |
| src/client/FileDiff.tsx | 源码 | 258 | 单文件 diff 视图，逐行高亮增删（结构判断） |
| src/client/ReviewTab.tsx | 源码 | 160 | 评审标签页：列出待看文件与结论（结构判断） |
| src/client/present-open.ts | 源码 | 153 | 触发「在应用内打开/预览」的流程（结构判断） |
| src/changes.ts | 源码 | 165 | 改动集合的构建与归类（结构判断） |
| src/client/Deliverables.tsx | 源码 | 131 | 产出物区域根组件（结构判断） |
| src/client/ChangedFiles.tsx | 源码 | 122 | 改动文件列表（结构判断） |
| src/client/index.ts | 源码 | 118 | 包入口：注册产出物槽位与评审页（结构判断） |
| src/client/review-store.ts | 源码 | 92 | 评审态（已读/待处理）存储（结构判断） |
| src/client/presented.ts | 源码 | 87 | 已呈现文件的记录结构（结构判断） |
| src/presented.ts | 源码 | 87 | 宿主侧已呈现文件记录（结构判断） |
| src/present-open.ts | 源码 | 187 | 宿主侧打开/预览实现（结构判断） |
| src/client/host-read-store.ts | 源码 | 81 | 宿主读取结果的缓存（结构判断） |
| src/client/PresentRow.tsx | 源码 | 59 | 预览条目行（结构判断） |
| src/client/PresentedFileCard.tsx | 源码 | 58 | 已呈现文件卡片（结构判断） |
| src/client/review-definition.ts | 源码 | 50 | 评审能力的槽位定义（结构判断） |
| src/client/changes-diff.ts | 源码 | 38 | 改动到 diff 片段的转换（结构判断） |
| src/client/changes-summary.ts | 源码 | 33 | 改动统计摘要（文件数、增删行）（结构判断） |
| src/client/file-actions.ts | 源码 | 27 | 产出物文件的操作项（结构判断） |
| src/client/locales.ts | 源码 | 495 | 本包文案字典（结构判断） |
| src/client/*.module.css | 样式 | 5 个 | 产出物、改动列表、diff、评审、预览行样式（结构判断） |
| src/index.ts | 源码 | 20 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 11 个 | 覆盖产出物汇总、diff 渲染与评审流（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 29. client/ui-directory-picker-browse — 内置目录浏览

应用内目录选择器：自己绘制文件树与路径栏，不依赖系统对话框，供「选择工作区/目录」场景使用。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/DirectoryBrowser.tsx | 源码 | 1052 | 目录浏览主组件。结构上分三块：路径导航与快捷入口、目录树渲染与懒加载、选中与确认回调（结构判断） |
| src/client/DirectoryBrowser.module.css | 样式 | 455 | 浏览器的面板、树、路径栏样式（结构判断） |
| src/client/index.ts | 源码 | 185 | 包入口：注册选择器槽位并转发调用（结构判断） |
| src/client/flow.ts | 源码 | 43 | 选择流程状态（浏览→确认→返回）（结构判断） |
| src/index.ts | 源码 | 10 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 2 个 | 覆盖目录展开与选择回传（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 30. client/ui-directory-picker-native — 系统目录对话框

与 browse 版本互补：直接调用宿主（桌面端）提供的原生目录选择能力，浏览器端则退化为不可用或简版。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/flow.ts | 源码 | 65 | 原生选择流程的发起与结果回传（结构判断） |
| src/client/index.ts | 源码 | 42 | 包入口：注册原生选择器槽位（结构判断） |
| src/index.ts | 源码 | 10 | 统一出口（结构判断） |
| tests/*.spec.ts(x) | 测试 | 2 个 | 覆盖调用与结果处理（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 31. client/ui-dockkit — 停靠布局引擎

可复用的停靠面板引擎，右栏、终端、预览等多个界面共用：engine 是纯 TS 的树与几何运算，components 是 React 渲染层，contract 定义适配接口。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/components/TabPanel.tsx | 源码 | 504 | 单面板渲染：标签头、内容区与菜单（结构判断） |
| src/engine/operations.ts | 源码 | 464 | 面板操作（拆分、移动、关闭、调整比例）的变换实现（结构判断） |
| src/engine/planner.ts | 源码 | 398 | 布局规划：把操作意图换算为新的树结构（结构判断） |
| src/components/FloatLayer.tsx | 源码 | 388 | 浮动面板层：拖拽、吸附与层级管理（结构判断） |
| src/components/DockSurface.tsx | 源码 | 329 | 停靠容器：承载树渲染并分发指针事件（结构判断） |
| src/engine/tree.ts | 源码 | 323 | 面板树的数据结构遍历与查询（结构判断） |
| src/engine/geometry.ts | 源码 | 317 | 区域矩形与分割线几何计算（结构判断） |
| src/engine/controller.ts | 源码 | 315 | 引擎控制器：把 UI 事件映射为 planner 调用（结构判断） |
| src/engine/sequence.ts | 源码 | 243 | 连续拖拽的操作序列与撤销粒度（结构判断） |
| src/contract/types.ts | 源码 | 201 | 面板、树、适配器的类型定义（结构判断） |
| src/components/TabLayout.tsx | 源码 | 160 | 标签栏布局与溢出处理（结构判断） |
| src/components/measure.ts | 源码 | 129 | 容器尺寸测量与缓存（结构判断） |
| src/components/TabMenu.tsx | 源码 | 125 | 标签的关闭/移动菜单（结构判断） |
| src/components/pointer.ts | 源码 | 110 | 指针事件归一化（鼠标/触摸）（结构判断） |
| src/contract/adapter.ts | 源码 | 109 | 宿主侧适配器接口与默认实现（结构判断） |
| src/engine/constraints.ts | 源码 | 104 | 最小尺寸与比例约束（结构判断） |
| src/engine/spring.ts | 源码 | 78 | 拖拽松手后的弹性回位动画（结构判断） |
| src/engine/initial.ts | 源码 | 73 | 初始布局树的构造（结构判断） |
| src/index.ts | 源码 | 70 | 引擎公共出口（结构判断） |
| src/components/PaneTree.tsx | 源码 | 60 | 树的递归渲染入口（结构判断） |
| src/components/render.ts | 源码 | 52 | 节点到组件的分派（结构判断） |
| src/components/TabTitle.tsx | 源码 | 37 | 标签标题与图标（结构判断） |
| src/components/TabBody.tsx | 源码 | 18 | 标签内容容器（结构判断） |
| src/components/dockkit.module.css | 样式 | 885 | 停靠区、浮动层、标签栏的完整样式（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 14 个 | 覆盖树操作、几何规划、约束与组件交互（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 32. client/ui-entry-customization — 入口菜单定制

首页/新建会话入口的菜单内容定制，让用户选择快捷入口项。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/index.ts | 源码 | 66 | 包入口：注册入口菜单槽位（结构判断） |
| src/client/EntryMenuContent.tsx | 源码 | 71 | 入口菜单内容渲染（结构判断） |
| src/client/locales.ts | 源码 | 87 | 本包文案字典（结构判断） |
| src/client/EntryMenu.module.css | 样式 | 32 | 入口菜单样式（结构判断） |
| src/index.ts | 源码 | 2 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 5 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 3 个 | 覆盖菜单项生成与点击（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 33. client/ui-file-actions — 文件操作菜单

把「文件可以做哪些操作」注册为右键菜单与按钮项，实际动作委托给 shell 的打开/下载能力。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/context-menus.tsx | 源码 | 108 | 按文件类型注册右键菜单项（结构判断） |
| src/client/files.ts | 源码 | 96 | 文件操作能力探测与调用封装（结构判断） |
| src/client/index.ts | 源码 | 39 | 包入口（结构判断） |
| src/client/locales.ts | 源码 | 132 | 本包文案字典（结构判断） |
| src/types.ts | 源码 | 45 | 文件操作相关类型（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| tests/*.spec.ts(x) | 测试 | 2 个 | 覆盖菜单注册与操作分派（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 34. client/ui-file-drag — 文件拖拽传输

负责「把文件拖进应用」的传输过程：建立传输会话、显示反馈、落地上传。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/transfers.ts | 源码 | 164 | 拖拽传输会话：文件收集、进度与失败重试（结构判断） |
| src/client/index.ts | 源码 | 50 | 包入口：注册拖拽处理（结构判断） |
| src/client/feedback.tsx | 源码 | 26 | 拖拽过程中的视觉反馈（结构判断） |
| src/client/locales.ts | 源码 | 30 | 本包文案字典（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| tests/*.spec.ts(x) | 测试 | 2 个 | 覆盖传输会话与反馈状态（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 35. client/ui-goal — 目标模式

「目标（goal）」模式：在输入区上方持续显示当前目标条，支持通过 /goal 一类指令设定与清除。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/GoalBar.tsx | 源码 | 205 | 目标条：显示当前目标、进度与操作按钮（结构判断） |
| src/client/index.ts | 源码 | 155 | 包入口：注册目标条槽位与指令（结构判断） |
| src/client/activation-source.ts | 源码 | 142 | 目标激活来源（用户设定/自动）的判定与记录（结构判断） |
| src/client/goal-command-input.ts | 源码 | 74 | 目标指令的输入解析（结构判断） |
| src/client/slots.ts | 源码 | 63 | 目标相关槽位定义（结构判断） |
| src/client/GoalCommandInputView.tsx | 源码 | 41 | 目标指令输入视图（结构判断） |
| src/client/user-text-rules.ts | 源码 | 36 | 用户文本中目标指令的识别规则（结构判断） |
| src/client/GoalCommandReference.tsx | 源码 | 12 | 指令参考提示（结构判断） |
| src/client/locales.ts | 源码 | 132 | 本包文案字典（结构判断） |
| src/client/GoalBar.module.css、GoalCommandInputView.module.css | 样式 | 2 个 | 目标条与指令输入样式（结构判断） |
| src/index.ts | 源码 | 9 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 6 个 | 覆盖目标条、指令解析与激活来源（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 36. client/ui-input-trigger — 输入触发器

输入框中 `@`、`/`、`#` 一类触发符的识别与候选菜单：core 负责纯逻辑识别，controller 负责与输入框、菜单的生命周期联动。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/controller.ts | 源码 | 665 | 触发器控制器：监听输入、判定触发符、维护菜单生命周期（结构判断） |
| src/client/MenuView.tsx | 源码 | 222 | 候选菜单视图，键盘与鼠标选中（结构判断） |
| src/types.ts | 源码 | 248 | 触发符、候选与菜单状态类型（结构判断） |
| src/core/menu.ts | 源码 | 169 | 候选菜单的纯数据模型（过滤、选中、翻页）（结构判断） |
| src/client/service.ts | 源码 | 120 | 候选来源的查询与聚合（结构判断） |
| src/client/locales.ts | 源码 | 112 | 本包文案字典（结构判断） |
| src/client/index.ts | 源码 | 87 | 包入口（结构判断） |
| src/core/detect.ts | 源码 | 76 | 从光标上下文识别触发符位置（结构判断） |
| src/core/contract.ts | 源码 | 64 | 触发器核心契约（结构判断） |
| src/client/slots.ts | 源码 | 35 | 菜单候选槽位（结构判断） |
| src/client/contract.ts | 源码 | 25 | 浏览器侧契约（结构判断） |
| src/client/MenuView.module.css | 样式 | 285 | 候选菜单样式（结构判断） |
| src/index.ts | 源码 | 9 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 5 个 | 覆盖触发识别、过滤与键盘导航（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 37. client/ui-jobs — 后台任务

展示宿主侧后台任务（job）列表：状态、耗时、输出入口。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/JobListAction.tsx | 源码 | 637 | 任务列表动作视图：状态分组、刷新与操作（结构判断） |
| src/client/index.ts | 源码 | 53 | 包入口：注册任务面板/按钮槽位（结构判断） |
| src/client/locales.ts | 源码 | 343 | 本包文案字典（结构判断） |
| src/client/JobListAction.module.css | 样式 | 502 | 任务列表样式（结构判断） |
| src/index.ts | 源码 | 9 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 2 个 | 覆盖任务分组与操作（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 38. client/ui-layout — 应用外框

应用最外层布局：三栏网格、文档标题、主题呈现器与布局状态存储。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/AppFrame.tsx | 源码 | 343 | 应用外框：左/中/右三栏与顶栏的组装（结构判断） |
| src/client/index.ts | 源码 | 244 | 包入口：注册外框并接管布局槽位（结构判断） |
| src/client/stores.ts | 源码 | 148 | 布局尺寸、折叠态等状态存储（结构判断） |
| src/client/theme-presenter.ts | 源码 | 110 | 把主题令牌应用到外框数据属性（结构判断） |
| src/client/service.ts | 源码 | 106 | 布局服务：列宽计算与持久化（结构判断） |
| src/client/columns.ts | 源码 | 64 | 三栏列定义与最小宽度（结构判断） |
| src/client/DocumentTitle.tsx | 源码 | 29 | 同步浏览器标签页标题（结构判断） |
| src/client/shortcut-locales.ts | 源码 | 24 | 快捷键提示文案（结构判断） |
| src/client/AppFrame.module.css | 样式 | 372 | 外框栅格与列样式（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 7 个 | 覆盖列宽、折叠、标题与主题呈现（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |

## 39. client/ui-message-feedback — 消息反馈

对单条助手消息收集用户反馈（点赞/点踩/文字反馈），并把反馈送到宿主侧上报通道。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/controller.ts | 源码 | 311 | 反馈控制器：评分选择、弹窗开关与提交（结构判断） |
| src/client/index.ts | 源码 | 142 | 包入口：注册消息操作槽位（结构判断） |
| src/client/dialog.ts | 源码 | 136 | 反馈弹窗的表单状态与校验（结构判断） |
| src/client/FeedbackDialog.tsx | 源码 | 128 | 反馈弹窗视图：原因选项与补充说明（结构判断） |
| src/client/MessageFeedbackActions.tsx | 源码 | 120 | 消息底部的赞/踩按钮组（结构判断） |
| src/client/slots.ts | 源码 | 84 | 反馈槽位定义（结构判断） |
| src/client/surface.ts | 源码 | 46 | 反馈入口的显示条件（结构判断） |
| src/client/locales.ts | 源码 | 203 | 本包文案字典（结构判断） |
| src/client/FeedbackDialog.module.css、MessageFeedbackActions.module.css | 样式 | 2 个 | 弹窗与按钮组样式（结构判断） |
| src/index.ts | 源码 | 9 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 6 个 | 覆盖评分、弹窗与提交（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 40. client/ui-model-selection — 模型选择

输入区的模型/供应商选择器：目录来自宿主配置，本包负责排序、分组、搜索与按钮展示。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/ModelSelect.tsx | 源码 | 669 | 模型选择主视图：搜索、供应商分组、选中回填（结构判断） |
| src/client/directory.ts | 源码 | 200 | 模型目录：合并供应商与模型，按偏好排序（结构判断） |
| src/client/index.ts | 源码 | 196 | 包入口：注册模型选择槽位（结构判断） |
| src/client/locales.ts | 源码 | 228 | 本包文案字典（结构判断） |
| src/client/catalog.ts | 源码 | 107 | 内置模型目录的兜底定义（结构判断） |
| src/client/service.ts | 源码 | 92 | 选择结果写回会话设置（结构判断） |
| src/client/slots.ts | 源码 | 79 | 选择器槽位定义（结构判断） |
| src/client/provider-order.ts | 源码 | 12 | 供应商展示顺序规则（结构判断） |
| src/client/ModelSelect.module.css | 样式 | 390 | 模型选择面板样式（结构判断） |
| src/index.ts | 源码 | 9 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 5 个 | 覆盖目录排序、搜索与选择回填（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 41. client/ui-open-in-app — 用外部应用打开

「用其他应用打开」：探测可用应用、生成打开命令、给出结果提示，覆盖文件与目录两类目标。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/context-menus.tsx | 源码 | 223 | 按目标注册「打开方式」右键菜单（结构判断） |
| src/client/open-path.ts | 源码 | 186 | 打开路径的宿主调用与错误归一（结构判断） |
| src/client/OpenTargetButton.tsx | 源码 | 161 | 打开方式按钮与下拉选择（结构判断） |
| src/client/index.ts | 源码 | 146 | 包入口：注册动作与菜单（结构判断） |
| src/client/controller.ts | 源码 | 115 | 打开流程控制：应用列表、选择与执行（结构判断） |
| src/client/applications.ts | 源码 | 40 | 应用清单类型与默认值（结构判断） |
| src/client/file-applications.ts | 源码 | 73 | 文件类型到推荐应用的映射（结构判断） |
| src/client/locales.ts | 源码 | 316 | 本包文案字典（结构判断） |
| src/client/open-toast.tsx | 源码 | 65 | 打开结果提示（成功/失败/无应用）（结构判断） |
| src/client/OpenPathAction.tsx、OpenPathEmptyAction.tsx、FileRouteAction.tsx | 源码 | 125 | 三个动作入口：打开路径、空态引导、文件路由动作（结构判断） |
| src/client/outcome.ts | 源码 | 8 | 打开结果枚举（结构判断） |
| src/client/session-open-with.ts | 源码 | 51 | 会话级「打开方式」偏好（结构判断） |
| src/client/OpenTargetButton.module.css | 样式 | 85 | 打开按钮样式（结构判断） |
| src/index.ts | 源码 | 10 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 11 个 | 覆盖应用映射、打开流程与提示（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 42. client/ui-permission-presets — 权限预设

把工具权限（文件、命令、网络等）抽象为可选的预设档位，提供设置页行与选择器。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/PermissionSelect.tsx | 源码 | 211 | 权限档位选择器视图（结构判断） |
| src/client/index.ts | 源码 | 202 | 包入口：注册设置项与权限槽位（结构判断） |
| src/client/settings-store.ts | 源码 | 194 | 权限设置读写与默认值（结构判断） |
| src/client/catalog.ts | 源码 | 158 | 权限项与档位的内置目录（结构判断） |
| src/client/PermissionRow.tsx | 源码 | 135 | 单项权限的设置行（结构判断） |
| src/client/locales.ts | 源码 | 306 | 本包文案字典（结构判断） |
| src/client/presentation.ts | 源码 | 54 | 档位的展示文案与图标（结构判断） |
| src/client/PermissionSelect.module.css、PermissionRow.module.css | 样式 | 2 个 | 选择器与设置行样式（结构判断） |
| src/index.ts | 源码 | 9 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 5 个 | 覆盖档位换算与设置持久化（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 43. client/ui-plan — 计划模式

计划（plan）模式的界面：计划卡片、模式开关、预览与审阅状态。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/index.ts | 源码 | 129 | 包入口：注册计划卡片与模式控制槽位（结构判断） |
| src/client/plan.ts | 源码 | 87 | 计划数据结构与状态推进（结构判断） |
| src/client/PlanCard.tsx | 源码 | 83 | 计划卡片视图：条目清单与状态（结构判断） |
| src/client/PlanModeControl.tsx | 源码 | 70 | 计划模式开关（结构判断） |
| src/client/plan-resource.ts | 源码 | 77 | 计划作为资源在会话中读写（结构判断） |
| src/client/PlanPreview.tsx | 源码 | 54 | 计划预览视图（结构判断） |
| src/client/plan-definition.ts | 源码 | 34 | 计划槽位定义（结构判断） |
| src/client/review-preview.ts | 源码 | 29 | 审阅态预览映射（结构判断） |
| src/client/review-store.ts | 源码 | 23 | 审阅状态存储（结构判断） |
| src/client/failure-line.ts | 源码 | 18 | 计划失败行的文案组装（结构判断） |
| src/client/locales.ts | 源码 | 164 | 本包文案字典（结构判断） |
| src/client/PlanModeControl.module.css、PlanPreview.module.css | 样式 | 2 个 | 模式开关与预览样式（结构判断） |
| src/index.ts | 源码 | 11 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 4 个 | 覆盖计划状态、资源读写与预览（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 44. client/ui-plugin-manager — 插件管理页

插件管理主界面，也是 client 里体量最大的单页：安装/启停/配置/版本与详情标签页，全部状态集中在 manager-store。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/PluginManagerPage.tsx | 源码 | 1926 | 管理页主组件。结构上分四块：页头与搜索、插件列表与分组、详情侧栏、安装/更新操作条（结构判断） |
| src/client/manager-store.ts | 源码 | 1581 | 管理页状态中枢：插件清单、安装队列、启停与错误态（结构判断） |
| src/client/locales.ts | 源码 | 2385 | 本包文案字典，全项目第二大的文案表（结构判断） |
| src/client/versions.tsx | 源码 | 471 | 版本列表与切换/回滚控件（结构判断） |
| src/client/slot-contract.ts | 源码 | 195 | 插件页槽位契约（结构判断） |
| src/client/presentation.ts | 源码 | 189 | 插件状态到展示文案/图标的映射（结构判断） |
| src/client/index.ts | 源码 | 175 | 包入口：注册管理页路由与槽位（结构判断） |
| src/client/header-scroll.ts | 源码 | 163 | 页头随列表滚动的收起逻辑（结构判断） |
| src/client/detail-store.ts | 源码 | 124 | 详情侧栏选中项与加载态（结构判断） |
| src/client/BundleDetailSection.tsx | 源码 | 56 | 插件包（bundle）详情区（结构判断） |
| src/client/config-ledger.ts | 源码 | 77 | 插件配置变更记录（结构判断） |
| src/client/tab-ledger.ts | 源码 | 42 | 标签页切换记录与恢复（结构判断） |
| src/client/navigation-store.ts | 源码 | 34 | 页内导航状态（结构判断） |
| src/client/PluginRefreshToast.tsx | 源码 | 32 | 刷新完成提示（结构判断） |
| src/client/PluginsPanelIcon.tsx | 源码 | 15 | 侧栏面板图标（结构判断） |
| src/client/sanitize-install-input.ts | 源码 | 13 | 安装输入（包名/路径）的清洗（结构判断） |
| src/client/PluginManagerPage.module.css | 样式 | 2318 | 管理页完整样式，全项目最大的单一样式文件（结构判断） |
| src/index.ts | 源码 | 86 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 9 个 | 覆盖 store 状态机、安装流程与页面渲染（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 45. client/ui-plugin-market — 插件市场

插件市场的浏览与详情：发现区（分类、精选、搜索）与市场状态存储，安装动作委托给 plugin-manager。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/DiscoverSection.tsx | 源码 | 644 | 发现区主视图：分类、精选卡片与搜索（结构判断） |
| src/client/market-store.ts | 源码 | 415 | 市场数据：分类、列表分页与加载态（结构判断） |
| src/client/locales.ts | 源码 | 748 | 本包文案字典（结构判断） |
| src/client/presentation.ts | 源码 | 115 | 市场条目展示映射（结构判断） |
| src/client/index.ts | 源码 | 58 | 包入口（结构判断） |
| src/client/PluginDetailSection.tsx | 源码 | 47 | 市场内插件详情区（结构判断） |
| src/client/DiscoverSection.module.css | 样式 | 451 | 发现区样式（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 6 个 | 覆盖分类加载、搜索与安装入口（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 46. client/ui-primitives — 无业务语义的 UI 原子件

`ui-primitives` 是客户端共享的「设计系统实现层」：只放与业务无关的原子组件与低级渲染器，被 `ui-chat`、`ui-conversation`、`ui-settings-*` 等几乎所有 UI 包引用。它承担四类职责：一是控件（Button、Checkbox、Switch、Input、Tag、Pill、SegmentedControl、Menu、Modal、Toast、Tooltip、HoverCard、JsonTree 等）；二是 Markdown 全链路（`markdown/` 是自研 mdast→React 渲染器，配 shiki 高亮单例、增量解析、KaTeX 数学、围栏代码块与文件链接）；三是图标与图形（`icons/` 走文档内 sprite 符号表，`ui-theme` 可替换底图）；四是跨包共用的低级工具（ANSI 转样式、时间/大小格式化、指针宽限、模态层、拖拽预览）。样式一律走 CSS Modules + 主题变量，颜色不落在本包。

### 46.1 入口与包级工具

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/index.ts | 源码（桶文件） | 143 | 全包出口：按控件、Markdown、图标、工具四类再导出，是外部包唯一的引用面（精读）。 |
| src/css-modules.d.ts | 类型声明 | 6 | `*.module.css` 的模块类型声明（结构判断）。 |
| src/focus.ts | 源码 | 44 | 焦点管理助手：可聚焦判定、焦点陷阱与还原。（结构判断） |
| src/pointer-grace.ts | 源码 | 47 | 指针离开的宽限延迟（悬停面板不因光标穿越间隙而关闭）。（结构判断） |
| src/overlay-top-margin.ts | 源码 | 18 | 浮层顶部安全边距的常量与计算。（结构判断） |
| src/input-modality.ts | 源码 | 59 | 输入模态判定（键盘 / 指针），供焦点环与手势分支使用。（结构判断） |
| src/keyboard-composition.ts | 源码 | 36 | 处理中文/日文输入法的合成态，避免合成中误触快捷键。（结构判断） |
| src/darwin-desktop.ts | 源码 | 11 | macOS 桌面环境的快捷键修饰键差异（⌘ 与 Ctrl）。（结构判断） |
| src/document-zoom.ts | 源码 | 12 | 文档级缩放比例读取，用于坐标换算。（结构判断） |
| src/head-tail-cap.ts | 源码 | 27 | 首尾截断（中间省略）的字符串处理。（结构判断） |
| src/file-size.ts | 源码 | 16 | 字节数到人类可读大小的格式化。（结构判断） |
| src/relative-time.ts | 源码 | 36 | 相对时间（「3 分钟前」）格式化。（结构判断） |
| src/rank-by-name.ts | 源码 | 93 | 按名称排序/打分，供命令面板与图标选择使用。（结构判断） |
| src/clipboard.ts | 源码 | 47 | 剪贴板写入的降级实现（navigator.clipboard 不可用时回退）。（结构判断） |
| src/use-clipboard-copy.ts | 源码 | 44 | 复制状态 hook（成功态闪烁、错误态）。（结构判断） |

### 46.2 基础控件

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/Menu.tsx | 源码 | 553 | 菜单：条目模型、键盘导航、子菜单挂载、选中与禁用态；是本包最复杂的控件，`MenuGroup` / `MenuRow` / `MenuSurface` / `SubmenuPanel` / `useMenuSubmenu` 都是它的分片。（结构判断） |
| src/Tooltip.tsx | 源码 | 273 | 提示气泡：受控/非受控、延迟、跟随定位与无障碍描述绑定。（结构判断） |
| src/tooltip-placement.ts | 源码 | 60 | 气泡方位计算（优先方向 + 碰撞回退）。（结构判断） |
| src/HoverCard.tsx | 源码 | 356 | 悬停卡片：延迟展示、指针穿越宽限、Esc 关闭。（结构判断） |
| src/HoverCardGroup.tsx | 源码 | 77 | 多个悬停卡片的互斥与分组延迟。（结构判断） |
| src/JsonTree.tsx | 源码 | 850 | 结构化 JSON 查看器：折叠节点、类型着色、复制、换行开关，结构上分「节点模型 → 展开状态 → 预览摘要 → 工具栏 → 渲染」五段。（结构判断） |
| src/Modal.tsx | 源码 | 96 | 模态外壳：遮罩、进出动画、焦点锁与滚动锁。（结构判断） |
| src/useModalLayer.ts | 源码 | 108 | 模态层栈管理：多层叠加时的层级分配、Esc 归属与卸载还原。（结构判断） |
| src/Toast.tsx | 源码 | 101 | 轻提示：队列、超时、动作按钮。（结构判断） |
| src/SegmentedControl.tsx | 源码 | 140 | 分段控件（单选滑块的几何与键盘行为）。（结构判断） |
| src/SegmentedTabs.tsx | 源码 | 84 | 分段式标签页，语义化 tablist。（结构判断） |
| src/DisclosureRow.tsx | 源码 | 124 | 可展开行（标题 + 折叠内容），带动画与 aria-expanded。（结构判断） |
| src/AnimatedRows.tsx | 源码 | 195 | 列表增删的行级过渡动画。（结构判断） |
| src/StateDot.tsx | 源码 | 77 | 状态圆点（运行中/成功/失败）及脉冲动画。（结构判断） |
| src/TextShimmer.tsx | 源码 | 58 | 文字微光效果（流式生成中的占位动效）。（结构判断） |
| src/Button.tsx | 源码 | 36 | 按钮基元（变体 + 尺寸 + 加载态）。（结构判断） |
| src/Input.tsx | 源码 | 24 | 单行输入框基元。（结构判断） |
| src/Checkbox.tsx | 源码 | 34 | 复选框（含不确定态）。（结构判断） |
| src/Switch.tsx | 源码 | 42 | 开关。（结构判断） |
| src/Tag.tsx | 源码 | 42 | 标签胶囊。（结构判断） |
| src/Pill.tsx | 源码 | 36 | 状态胶囊（比 Tag 更窄的语义）。（结构判断） |
| src/ConfigField.tsx | 源码 | 53 | 设置项外壳（标签 + 描述 + 控件 + 错误位）。（结构判断） |
| src/ShortcutKeys.tsx | 源码 | 12 | 快捷键字符的键帽渲染。（结构判断） |
| src/InlineEditor.tsx | 源码 | 69 | 行内重命名编辑器（Enter 提交 / Esc 取消）。（结构判断） |
| src/CommandText.tsx | 源码 | 46 | 命令文本的统一排版（`/cmd` 等）。（结构判断） |
| src/SearchBlock.tsx | 源码 | 281 | 搜索块：输入、命中计数、上一个/下一个跳转。（结构判断） |
| src/ReadBlock.tsx | 源码 | 151 | 文件读取结果块（带行号与路径标签）。（结构判断） |
| src/PathLabel.tsx | 源码 | 41 | 路径标签（中间省略 + 悬浮显示全路径）。（结构判断） |
| src/QuotePreview.tsx | 源码 | 133 | 引用预览（截断多行 + 「展开」）。（结构判断） |
| src/UserMessageBubble.tsx | 源码 | 16 | 用户消息气泡外壳。（结构判断） |
| src/user-text.tsx | 源码 | 67 | 用户文本节点的纯渲染实现（共用给多个包）。（结构判断） |
| src/RiskConfirmation.tsx | 源码 | 79 | 高风险操作的二次确认块。（结构判断） |
| src/ConnectionIndicator.tsx | 源码 | 103 | 连接状态指示器（在线/重连/离线）。（结构判断） |

### 46.3 代码、diff 与终端类块

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/ansi.ts | 源码 | 447 | ANSI 转 React 样式：先用正则剥离控制序列，再用 anser 解析 SGR，输出带 `CSSProperties` 的 run 列表；不吞异常、未知序列退化为纯文本（精读）。 |
| src/TerminalBlock.tsx | 源码 | 294 | 终端输出块：等宽渲染 + ANSI 着色 + 折行控制 + 复制。（结构判断） |
| src/WebBlock.tsx | 源码 | 196 | 网页抓取结果块（标题、URL、正文摘要）。（结构判断） |
| src/DiffBlock.tsx | 源码 | 221 | unified diff 渲染（行号、增删着色、折叠上下文）。（结构判断） |
| src/DetailDocument.tsx | 源码 | 120 | 详情文档容器（标题 + 元信息 + 正文）。（结构判断） |
| src/CodeToolbar.tsx | 源码 | 62 | 代码块工具栏（语言、复制、折行）。（结构判断） |
| src/code-highlighting.ts | 源码 | 25 | 代码高亮的对外薄封装，转调 `markdown/highlight.ts` 的单例。（结构判断） |
| src/code-file-types.ts | 源码 | 340 | 扩展名/文件名 → 语言与图标的映射表。（结构判断） |
| src/CodeFileIcon.tsx | 源码 | 28 | 代码文件图标（读 artwork 表）。（结构判断） |
| src/code-file-icon-artwork.ts | 源码 | 60 | 代码文件图标的形状定义。（结构判断） |
| src/code-file-icon-artwork.manifest.json | 数据 | 71 | 图标形状清单，供构建脚本与运行时校验对照（结构判断）。 |
| src/FileTypeIcon.tsx | 源码 | 285 | 通用文件类型图标：按 mime/扩展名选形状与配色。（结构判断） |
| src/LinkIcon.tsx | 源码 | 118 | 链接图标（按域名或类型给出字形）。（结构判断） |
| src/ReferenceIcon.tsx | 源码 | 49 | 引用对象类型图标。（结构判断） |
| src/PermissionIcon.tsx | 源码 | 119 | 权限类别图标（读/写/执行等）。（结构判断） |

### 46.4 icons/ — 图标图形与 sprite

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/icons/index.tsx | 源码 | 634 | 图标组件工厂：`productIcon()` 按字形与字重生成组件，引用文档内 `dsw-icon-<glyph>-<weight>` 符号，继承 `currentColor` 与 CSS 变量，主题可整体替换底图（精读）。 |
| src/icons/artwork.ts | 源码 | 156 | 字形到 viewBox/尺寸/纵横比的登记表与 `iconSymbolId` 生成。（结构判断） |
| src/icons/props.ts | 类型契约 | 8 | `IconProps`（size 等）声明。（结构判断） |
| src/icons/shared-artwork.tsx | 源码 | 71 | 组合图标共用的轮廓片段（如盾牌）。（结构判断） |
| src/BrandMark.tsx | 源码 | 38 | 品牌图形标。（结构判断） |
| src/BrandWordmark.tsx | 源码 | 59 | 品牌字标。（结构判断） |
| src/FishLogo.tsx | 源码 | 28 | 鲸鱼/鱼的品牌形象（空会话与运行态复用）。（结构判断） |
| src/SiteGlyph.tsx | 源码 | 149 | 站点字形（favicon 兜底与首字母徽标）。（结构判断） |
| src/guide-artwork.tsx | 源码 | 32 | 引导页插画的矢量片段。（结构判断） |
| src/plugin-artwork.tsx | 源码 | 110 | 插件图标：从插件元数据生成回退图形。（结构判断） |

### 46.5 markdown/ — 自研 Markdown 渲染链路

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/markdown/render.tsx | 源码 | 834 | mdast→React 直接渲染器，替换 react-markdown/remark-rehype：一次 switch 遍历节点，使流式渲染可把已冻结块缓存为 React 元素；外链拒绝可执行与内嵌文档协议，图片只接受绝对 HTTP(S)，原始 HTML 一律按字面文本渲染，KaTeX 禁用 trusted 命令；DOM 由 `tests/fixtures/markdown-dom` 逐字节锁定（精读：模块头）。 |
| src/markdown/highlight.ts | 源码 | 689 | 全局唯一语法高亮器：shiki 细粒度核心（JS 正则引擎，不打包 oniguruma WASM），启动只加载 TS/shell/JSON 三套语法，其余按 `@deepseek-ai/dsh-util-code-language` 的扩展表懒加载并通知订阅者重渲染；颜色全部来自 `--shiki-*` 主题变量（精读：模块头）。 |
| src/markdown/MarkdownText.tsx | 源码 | 218 | 流式 Markdown 文本容器：按块增量渲染、失败降级与复制。（结构判断） |
| src/markdown/CodeBlock.tsx | 源码 | 268 | 围栏代码块：高亮、行号、折行、复制与语言选择。（结构判断） |
| src/markdown/MarkdownDelegate.tsx | 源码 | 102 | Markdown 元素委托注册表：别的包可替换链接、图片、代码块等渲染。（结构判断） |
| src/markdown/incremental.ts | 源码 | 360 | 增量解析：把流式文本切成稳定块与尾块，只重解析尾块。（结构判断） |
| src/markdown/mathCompatibility.ts | 源码 | 349 | 数学公式的兼容预处理（`$`/`$$` 边界、转义与常见错误恢复）。（结构判断） |
| src/markdown/cjkFriendlyStrong.ts | 源码 | 83 | 中文场景下的 `**强调**` 边界修正。（结构判断） |
| src/markdown/plain-text.ts | 源码 | 121 | Markdown → 纯文本（用于复制与搜索）。（结构判断） |
| src/markdown/katex.tsx | 源码 | 90 | KaTeX 渲染封装（无 trusted 命令）。（结构判断） |
| src/markdown/diff-fence.ts | 源码 | 212 | ```diff 围栏的专用渲染。（结构判断） |
| src/markdown/JsonBlock.tsx | 源码 | 36 | ```json 围栏转 JsonTree 的桥接。（结构判断） |
| src/markdown/FenceBlocks.tsx | 源码 | 51 | 围栏块分派器（按语言交给代码块 / diff / JSON / 终端）。（结构判断） |
| src/markdown/parse.ts | 源码 | 49 | mdast 解析入口与插件组合。（结构判断） |
| src/markdown/file-link.ts | 源码 | 45 | 本地文件链接的识别与落点回调。（结构判断） |
| src/markdown/local-image-syntax.ts | 源码 | 29 | 本地图片语法（工作区相对路径）的识别。（结构判断） |
| src/markdown/windows-path-destinations.ts | 源码 | 34 | Windows 盘符路径在链接目标中的归一化。（结构判断） |
| src/markdown/copy-tex.ts | 源码 | 53 | 复制公式时的 TeX 源码提取。（结构判断） |
| src/markdown/quote-text.ts | 源码 | 10 | 引用文本的最小处理。（结构判断） |
| src/markdown/useViewportHighlighting.ts | 源码 | 72 | 视口内才启用高亮的懒加载 hook。（结构判断） |

### 46.6 图片、拖拽与几何

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/ImageLightbox.tsx | 源码 | 72 | 图片灯箱（全屏、缩放、切换）。（结构判断） |
| src/ImagePreview.tsx | 源码 | 36 | 缩略图预览方块。（结构判断） |
| src/DraggableImage.tsx | 源码 | 26 | 可拖动图片的包装。（结构判断） |
| src/image-drag.ts | 源码 | 84 | 图片拖拽的落点与数据传输。（结构判断） |
| src/file-drag-actions.ts | 源码 | 29 | 文件拖入的接收动作定义。（结构判断） |
| src/useRowDragPreview.ts | 源码 | 76 | 行拖拽的自定义预览图。（结构判断） |
| src/useAnchoredMaxHeight.ts | 源码 | 45 | 依锚点位置计算浮层最大高度。（结构判断） |
| src/useDismissOnOutsidePointer.ts | 源码 | 34 | 点击外部关闭的通用 hook。（结构判断） |
| src/ZoomControls.tsx | 源码 | 92 | 缩放控件（- / 百分比 / + / 适应）。（结构判断） |
| src/menu-submenu-position.ts | 源码 | 20 | 子菜单左右翻转的定位计算。（结构判断） |

### 46.7 设置表单

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/settings-form/form-model.ts | 源码 | 393 | 设置表单模型：字段描述、值校验、脏检查与提交载荷组装。（结构判断） |
| src/settings-form/fields.tsx | 源码 | 151 | 各类字段控件（文本、布尔、枚举、数字）到 `ConfigField` 的映射。（结构判断） |
| src/settings-form/SettingsForm.tsx | 源码 | 74 | 表单外壳（分组、提交/重置、错误汇总）。（结构判断） |

### 46.8 样式与工程样板

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| src/**/*.module.css（47 个） | 样式 | 4,472 | CSS Modules，全部只消费主题变量：`MarkdownText` 511、`Menu` 443、`JsonTree` 371、`CodeBlock` 209、`TerminalBlock` 207、`fields` 153、`WebBlock` 153、`Modal` 147、`QuotePreview` 138、`ConnectionIndicator` 120、`DisclosureRow` 115、`SearchBlock` 114、`HoverCard` 108、`Toast` 102、`StateDot` 100、其余 32 个均 <100。（结构判断） |
| README.md / README.zh.md / README.i18n.yaml / package.json / tsconfig.json / tsdown.config.ts | 工程样板 | 258 / 258 / 61 / 66 / 27 / 6 | 包元数据、单面构建配置与双语说明（结构判断）。无 `locale/` 目录——本包不含文案，词典由调用方提供。 |

### 46.9 tests/ — 140 个文件按被测对象归组

| 文件 | 类型 | 行数 | 职责（结构判断） |
| --- | --- | ---: | --- |
| markdown / markdown-incremental / markdown-dom-parity / markdown-render-units / markdown-file-links / markdown-image-entries / markdown-fence-delegate / markdown-path-images / markdown-copy-tex / markdown-compact / markdown-plain-text / markdown-autolink-literals / markdown-test-components | 测试（13 个） | 2,861 | Markdown 渲染：主用例（624）、增量解析（552）、DOM 逐字节对齐（269）、渲染单元、文件链接与图片条目、围栏委托、公式复制、紧凑模式、纯文本与自动链接字面量。（结构判断） |
| ansi / terminal-block / code-block / streaming-code-block / diff-block / diff-fence / web-block / highlight-viewport / code-highlighting / code-card-controls / command-text / go-highlighting / perl-highlighting / go-highlighting.worker / go-source | 测试（15 个） | 2,897 | 高亮与代码类块：ANSI（506）、终端块（502）、代码块与流式代码块、diff 与 diff 围栏、网页块、视口高亮、多语言懒加载（含 worker 与样例源码）。（结构判断） |
| tooltip / hover-card / menu-submenu / json-tree / menu-group / hover-card-group / modal-layer / menu-anchor-visibility / context-menu / toast / tooltip-placement / use-anchored-max-height / use-dismiss-on-outside-pointer / menu-anchor-width / menu-surface / menu-submenu-position / tooltip-node / overlay-top-margin | 测试（18 个） | 4,483 | 浮层与菜单：tooltip（914）、hover card（728）、子菜单（614）、JsonTree（475）、菜单分组（388）、悬停组（355）、模态层、锚点可见性与宽度、点击外部关闭等。（结构判断） |
| atoms / animated-rows / segmented-control / segmented-tabs / image-drag / inline-editor / switch / tag / checkbox / text-shimmer / input-modality / useClipboardCopy / zoom-controls / row-drag-preview / UserMessageBubble / quote-preview / image-lightbox / image-preview / detail-document / quote-text | 测试（20 个） | 2,589 | 原子控件与交互：总览用例（939）、行动画、分段控件/标签、图片拖拽与灯箱、行内编辑、开关/标签/复选、微光、输入模态、复制、缩放、拖拽预览、气泡与引用预览、详情文档。（结构判断） |
| settings-form-model / settings-fields / settings-form / config-field / icons / file-type-icon / code-file-icon / plugin-artwork / link-icon / path-label / file-size / relative-time / read-block / search-block / rank-by-name / state-dot | 测试（16 个） | 2,256 | 设置表单与图标/路径：表单模型（319）、字段与外壳、配置项、图标工厂（316）、文件类型/代码文件/插件图标、链接图标、路径标签、大小与相对时间、读取/搜索块、排序、状态点。（结构判断） |
| button-styles / disclosure-row-styles / file-type-icon-styles / menu-styles / state-dot-styles / tag-styles / terminal-block-styles / tooltip-styles / user-text-styles | 样式契约测试（9 个） | 323 | 断言生成的类名/样式钩子与契约一致，防止主题令牌漂移。（结构判断） |
| labels.client.ts | 测试辅助 | 67 | 测试用文案标签表。（结构判断） |
| fixtures/markdown-dom/*.txt（48 个） | 快照 fixture | 合计约 2,100 | 24 组「settled / streaming」成对的 Markdown DOM 快照，由 `markdown-dom-parity` 逐字节比对；`math-inline-and-display` 的 settled 版 320 行最大。（结构判断） |

## 47. client/ui-reference — 文件引用

输入框里「引用文件」的呈现：把引用标记渲染成可点击的文件胶囊，并解析回路径。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/index.ts | 源码 | 298 | 包入口：注册引用渲染规则与槽位（结构判断） |
| src/client/locales.ts | 源码 | 174 | 本包文案字典（结构判断） |
| src/client/FileReference.tsx | 源码 | 71 | 文件引用胶囊组件（结构判断） |
| src/client/user-text-rules.ts | 源码 | 49 | 用户文本中引用标记的识别规则（结构判断） |
| src/index.ts | 源码 | 9 | 统一出口（结构判断） |
| tests/*.spec.ts(x) | 测试 | 3 个 | 覆盖引用解析与渲染（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 48. client/ui-renderer — 渲染框架与作用域槽

整个 client 的渲染骨架：注册表决定「某个槽位由谁渲染」，scoped-slots 提供带作用域的嵌套槽位，bindings 把渲染器绑定到具体界面。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/scoped-slots.tsx | 源码 | 1591 | 作用域槽位实现。结构上分三块：作用域上下文与继承、槽位解析与占位、渲染调度与错误隔离（结构判断） |
| src/client/registry.ts | 源码 | 764 | 渲染注册表：槽位名到渲染函数的映射与优先级（结构判断） |
| src/client/bindings.tsx | 源码 | 201 | 把渲染器绑定到具体 DOM/React 挂载点（结构判断） |
| src/client/index.ts | 源码 | 98 | 包入口，导出注册与渲染 API（结构判断） |
| src/client/bind.ts | 源码 | 26 | 命令式绑定辅助（结构判断） |
| src/client/app.tsx | 源码 | 22 | 渲染根组件（结构判断） |
| src/client/errors.ts | 源码 | 4 | 渲染错误标记（结构判断） |
| src/client/use-sync-external-store.d.ts | 断言 | 14 | 外部 store 订阅 hook 的类型补丁（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| tests/*.spec.ts(x) | 测试 | 14 个 | 覆盖注册优先级、作用域继承与错误隔离（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 49. client/ui-schedule — 定时任务（计划任务）界面

面向「按时间/条件自动跑一轮会话」的功能：任务定义、规则（cron 与频率）、编辑器、任务管理页、会话中的定时标记与投递历史。词汇表里有 `schedule`（计划）与 `task`（任务）两套命名并用，`task-*` 是列表与管理侧，`schedule-*` 是会话内嵌侧。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/TaskManagerPage.tsx | 源码 | 374 | 任务管理页主组件：列表、筛选与详情入口（结构判断） |
| src/client/TaskManagerPage.module.css | 样式 | 1443 | 管理页样式，是客户端包里最大的 CSS 文件，按头图/列表/卡片/详情/弹层分段（结构判断） |
| src/client/TaskDetail.tsx | 源码 | 441 | 任务详情面板：规则、下次运行时间、历史入口（结构判断） |
| src/client/TaskMenu.tsx | 源码 | 328 | 任务条目的上下文菜单（启停、编辑、删除）（结构判断） |
| src/client/task-cron.ts | 源码 | 329 | cron 表达式的解析、校验与人读描述（结构判断） |
| src/client/TaskEditorFields.tsx | 源码 | 247 | 编辑器表单字段：频率、时间、时区、提示词（结构判断） |
| src/client/task-tab-bindings.ts | 源码 | 223 | 任务与标签页/面板位置的绑定（结构判断） |
| src/client/task-tab-target.ts | 源码 | 60 | 任务标签页的目标解析（结构判断） |
| src/client/task-record.ts | 源码 | 67 | 任务记录的规范化（结构判断） |
| src/client/TaskRuleControls.tsx | 源码 | 120 | 规则控件的组合（预设 + 自定义）（结构判断） |
| src/client/RuleSelectRow.tsx | 源码 | 75 | 规则下拉行组件（结构判断） |
| src/client/TaskManagerIcon.tsx | 源码 | 16 | 任务管理入口图标（结构判断） |
| src/client/ScheduleTaskTab.tsx | 源码 | 137 | 会话侧「任务」标签页（结构判断） |
| src/client/ScheduleTaskTabTitle.tsx | 源码 | 39 | 上者标题的富文本/计数（结构判断） |
| src/client/task-manager-locales.ts | 词典 | 1294 | 任务管理页的多语言文案正本，按语言分块铺开，单文件承载全部界面文案（结构判断） |
| src/client/frequency-locales.ts | 词典 | 523 | 频率/周期用语的多语言片段（结构判断） |
| src/client/locales.ts | 词典 | 179 | 包内通用词条（结构判断） |
| src/client/index.ts | 源码 | 294 | 包注册入口：注册槽位、设置项、标签页与命令（结构判断） |
| src/client/definition.ts | 源码 | 53 | 功能定义（id、标题、槽位声明）（结构判断） |
| src/client/catalog-source.ts | 源码 | 199 | 任务目录数据源（拉取 + 订阅）（结构判断） |
| src/client/CatalogFeedback.tsx | 源码 | 47 | 目录加载/失败反馈（结构判断） |
| src/client/ScheduleCatalogAction.tsx | 源码 | 205 | 目录里的「新建计划」动作行（结构判断） |
| src/client/ScheduleCreateCard.tsx | 源码 | 86 | 会话内嵌的创建卡片（结构判断） |
| src/client/schedule-create-card.ts | 源码 | 156 | 上者的状态与动作逻辑（结构判断） |
| src/client/ScheduleEmptyIllustration.tsx | 源码 | 37 | 空状态插画（结构判断） |
| src/client/ScheduleTurnCard.tsx | 源码 | 117 | 会话回合中的计划卡片（结构判断） |
| src/client/schedule-turn.ts | 源码 | 173 | 计划回合的数据装配（结构判断） |
| src/client/schedule-format.ts | 源码 | 513 | 时间与规则的统一格式化，按「相对/绝对/周期」三类分支展开（结构判断） |
| src/client/editor-timing.ts | 源码 | 203 | 编辑器时间选择的联动逻辑（结构判断） |
| src/client/editor-store.ts | 源码 | 41 | 编辑器草稿状态（结构判断） |
| src/client/ClockPicker.tsx / ClockPicker.module.css | 源码 / 样式 | 218 / 59 | 时钟选择器组件与样式（结构判断） |
| src/client/DatePicker.tsx / DatePicker.module.css | 源码 / 样式 | 229 / 111 | 日期选择器组件与样式（结构判断） |
| src/client/PickerPopover.tsx / PickerPopover.module.css | 源码 / 样式 | 57 / 70 | 选择器弹层容器（结构判断） |
| src/client/recent-time-zones.ts | 源码 | 46 | 最近使用时区（结构判断） |
| src/client/relative-clock.ts | 源码 | 51 | 相对时间（「3 分钟后」）计算（结构判断） |
| src/client/session-schedule-state.ts | 源码 | 84 | 会话内计划标记的状态（结构判断） |
| src/client/SessionScheduleMark.tsx / .module.css | 源码 / 样式 | 59 / 77 | 会话列表/标题上的计划标记（结构判断） |
| src/client/SessionScheduleHover.tsx | 源码 | 79 | 计划标记的悬浮详情（结构判断） |
| src/client/session-link.ts | 源码 | 27 | 会话链接拼接（结构判断） |
| src/client/DeliveryHistory.tsx | 源码 | 193 | 投递历史列表（结构判断） |
| src/client/DeleteToast.tsx | 源码 | 118 | 删除操作的撤销提示（结构判断） |
| src/client/clear-ended.ts | 源码 | 45 | 清理已结束任务（结构判断） |
| src/client/CalendarIcon.tsx | 源码 | 35 | 日历图标（结构判断） |
| src/client/NewSessionLimit.tsx | 源码 | 34 | 新建会话数量上限提示（结构判断） |
| 其余 `*.module.css`（ScheduleCatalogAction 251、ScheduleCreateCard 131、ScheduleTurnCard 9、TaskMenu 258） | 样式 | 4 个文件 | 各组件私有样式，随上表对应组件一同使用（结构判断） |
| src/css-modules.d.ts / src/index.ts | 类型声明 / 入口 | 6 / 7 | CSS Module 声明与宿主侧薄入口（结构判断） |
| tests（25 个） | 测试 | 约 2,600 | 按被测对象分组：cron 解析、时间格式化、编辑联动、任务页/详情/菜单、绑定与状态（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title`（精读） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | 结构判断 |


## 50. client/ui-secret-mask — 敏感信息遮罩

识别并遮蔽对话与界面中的密钥、令牌：扫描规则、可选格式表与遮罩渲染。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/credential-scanner.ts | 源码 | 358 | 文本扫描：按规则命中密钥片段并标注区间（结构判断） |
| src/client/credential-masks.ts | 源码 | 127 | 命中片段的遮蔽策略（保留前后缀）（结构判断） |
| src/client/format-tables.ts | 源码 | 113 | 各家凭据格式的特征表（结构判断） |
| src/client/credential-formats.ts | 源码 | 100 | 凭据格式定义与匹配器（结构判断） |
| src/client/SecretText.tsx | 源码 | 68 | 遮罩文本组件：默认打码，可按需揭示（结构判断） |
| src/client/locales.ts | 源码 | 64 | 本包文案字典（结构判断） |
| src/client/secret-rule.ts | 源码 | 36 | 单条遮罩规则的结构（结构判断） |
| src/client/index.ts | 源码 | 33 | 包入口：注册文本后处理规则（结构判断） |
| src/client/SecretText.module.css | 样式 | 64 | 遮罩文本样式（结构判断） |
| src/index.ts | 源码 | 9 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 5 个 | 覆盖各类凭据识别与遮罩（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 51. client/ui-session — 会话上下文

向各 UI 包提供「当前会话」上下文与操作句柄（发送、中断、切会话），是 UI 与 session-controller 之间的粘合层。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/index.ts | 源码 | 739 | 会话上下文与操作 API：当前会话选择、发送/中断、订阅（结构判断） |
| src/client/session-provider.tsx | 源码 | 19 | 会话上下文 Provider（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| tests/*.spec.ts(x) | 测试 | 2 个 | 覆盖上下文切换与操作调用（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 52. client/ui-settings — 设置框架

设置页的通用框架：schema 驱动的配置表单、设置镜像（mirror）与开发工具开关。各 settings-* 子包都挂在这套框架上。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/config-form.ts | 源码 | 328 | 通用配置表单渲染：按 schema 生成字段与校验（结构判断） |
| src/client/settings-mirror.ts | 源码 | 205 | 设置镜像：本地编辑副本与远端设置的同步（结构判断） |
| src/client/schema.ts | 源码 | 158 | 设置项 schema 的类型与解析（结构判断） |
| src/client/contract/slots.ts | 源码 | 171 | 设置页槽位契约（分组、行、动作）（结构判断） |
| src/client/config-form-types.ts | 源码 | 74 | 表单字段类型（结构判断） |
| src/client/index.ts | 源码 | 54 | 包入口：组装设置页骨架（结构判断） |
| src/client/developer-tools.ts | 源码 | 37 | 开发者工具开关逻辑（结构判断） |
| src/developer-tools-settings.ts | 源码 | 19 | 开发者工具设置项定义（结构判断） |
| src/index.ts | 源码 | 25 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 7 个 | 覆盖 schema 表单、镜像同步与槽位（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 53. client/ui-settings-account — 设置里的账号与新手引导

设置页的「账号」分区：登录/登出、余额与配额提示、平台页的嵌入（overlay），以及一整套桌面端新手引导（欢迎、用途、额度、流程四个步骤，配 13 个插画资源）。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/index.ts | 源码 | 335 | 包注册入口：把账号分区挂进设置框架，注册登录/引导相关的槽位与命令（结构判断） |
| src/client/AccountSection.tsx | 源码 | 218 | 账号设置分区主组件（结构判断） |
| src/client/AccountSection.module.css | 样式 | 224 | 上者样式（结构判断） |
| src/client/AccountMenu.tsx | 源码 | 93 | 账号菜单（结构判断） |
| src/client/AccountQuotaNotice.tsx | 源码 | 81 | 配额/用量提示（结构判断） |
| src/client/AccountAvatar.tsx / account-avatar.ts | 源码 | 19 / 92 | 头像组件与首字母/颜色推导（结构判断） |
| src/client/AccountPlatformHost.tsx | 源码 | 33 | 平台页宿主容器（结构判断） |
| src/client/AccountOnboarding.tsx | 源码 | 18 | 引导入口薄组件（结构判断） |
| src/client/PlatformOverlay.tsx / .module.css | 源码 / 样式 | 87 / 120 | 平台页浮层（登录/充值）与样式（结构判断） |
| src/client/platform-pages.ts | 源码 | 95 | 平台页 URL 与能力映射（结构判断） |
| src/client/SignInDialog.tsx / .module.css | 源码 / 样式 | 89 / 20 | 登录对话框（结构判断） |
| src/client/SignOutDialog.tsx | 源码 | 41 | 登出确认（结构判断） |
| src/client/browser-login.ts | 源码 | 76 | 浏览器登录流程（打开授权页 + 回跳）（结构判断） |
| src/client/authorize-url.ts | 源码 | 14 | 授权地址拼接（结构判断） |
| src/client/client-metadata.ts | 源码 | 24 | 客户端元信息（版本/平台）上报（结构判断） |
| src/client/account-refresh.ts | 源码 | 15 | 账号状态刷新触发（结构判断） |
| src/client/account-ui.ts | 源码 | 49 | 账号 UI 的派生状态（结构判断） |
| src/client/formatBalance.ts | 源码 | 21 | 余额格式化（结构判断） |
| src/client/contact-url.ts | 源码 | 40 | 联系/客服地址（结构判断） |
| src/client/DesktopOnboarding.tsx / .module.css | 源码 / 样式 | 125 / 352 | 桌面端引导主容器与样式（结构判断） |
| src/client/DesktopOnboardingEntry.tsx | 源码 | 64 | 引导入口按钮/触发（结构判断） |
| src/client/OnboardingWelcomeStep.tsx | 源码 | 28 | 步骤一：欢迎（结构判断） |
| src/client/OnboardingPurposeStep.tsx | 源码 | 65 | 步骤二：用途选择（结构判断） |
| src/client/OnboardingCreditStep.tsx | 源码 | 34 | 步骤三：额度说明（结构判断） |
| src/client/OnboardingProcessStep.tsx | 源码 | 55 | 步骤四：流程说明（结构判断） |
| src/client/OnboardingConfirmation.tsx | 源码 | 35 | 完成确认（结构判断） |
| src/client/OnboardingSurface.tsx / .module.css | 源码 / 样式 | 42 / 48 | 引导的承载面与样式（结构判断） |
| src/client/OnboardingIllustration.tsx | 源码 | 10 | 插画选择组件（结构判断） |
| src/client/onboarding-state.ts | 源码 | 246 | 引导状态机：步骤推进、持久化与中断恢复（结构判断） |
| src/client/onboarding-contract.ts | 源码 | 37 | 引导数据契约（结构判断） |
| src/client/onboarding-credentials.ts | 源码 | 13 | 引导期间的凭据处理（结构判断） |
| src/client/onboarding-balance.ts | 源码 | 12 | 引导展示的余额取值（结构判断） |
| src/client/locales.ts | 词典 | 300 | 账号分区词条（结构判断） |
| src/client/locales/onboarding.ts | 词典 | 343 | 引导步骤文案（四步 + 按钮 + 错误）（结构判断） |
| src/client/LogoutIcon.tsx | 源码 | 10 | 登出图标（结构判断） |
| src/client/overlay-inert.ts | 源码 | 23 | 浮层打开时把背景设为不可交互（结构判断） |
| src/client/assets/*（13 个） | 静态资源 | — | 引导插画：9 个 SVG（back/code/compact/detailed/office/standard + onboarding-* 等）与 4 组 webp 位图（recharge、welcome 各含深色与中文版），供桌面端引导页使用（结构判断） |
| src/contact-config.ts | 源码 | 19 | 联系方式配置项（结构判断） |
| src/onboarding-settings.ts | 源码 | 43 | 引导相关设置项声明（结构判断） |
| src/index.ts / src/css-modules.d.ts | 入口 / 类型声明 | 53 / 6 | 宿主侧入口与 CSS Module 声明（结构判断） |
| tests（72 个） | 测试 | 约 8,000 | 该包测试文件数在 ui-* 里最多；按被测对象分组：登录/授权、账号分区与菜单、配额提示、引导状态机与各步骤、平台浮层（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title`（精读） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | 结构判断 |

## 54. client/ui-settings-agent-loop — Agent 循环设置

设置页中的「Agent 循环」参数卡：最大轮次、超时等，通过 controller 写入设置。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/agent-loop-card-controller.ts | 源码 | 63 | 循环参数卡的读写控制（结构判断） |
| src/client/AgentLoopCard.tsx | 源码 | 41 | 参数卡视图（结构判断） |
| src/client/index.ts | 源码 | 50 | 包入口：注册设置卡（结构判断） |
| src/client/locales.ts | 源码 | 146 | 本包文案字典（结构判断） |
| src/index.ts | 源码 | 10 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 3 个 | 覆盖参数校验与写入（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 55. client/ui-settings-general — 通用设置

设置页「通用」分区：版本信息、桌面更新通道、开发者工具入口与设置根节点。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/index.ts | 源码 | 283 | 包入口：注册通用分区的全部行（结构判断） |
| src/client/SettingsRoot.tsx | 源码 | 278 | 设置页根节点，组织分区顺序与锚点（结构判断） |
| src/client/DesktopChannelRow.tsx | 源码 | 69 | 桌面更新通道选择行（结构判断） |
| src/client/DesktopUpdateIndicator.tsx | 源码 | 107 | 更新状态指示器（结构判断） |
| src/client/desktop-channel-source.ts | 源码 | 92 | 更新通道数据来源（结构判断） |
| src/client/desktop-update-source.ts | 源码 | 52 | 更新检查数据来源（结构判断） |
| src/client/settings-document-store.ts | 源码 | 100 | 设置文档的读写状态（结构判断） |
| src/client/shell-contract.ts | 源码 | 80 | 通用分区与 shell 的契约（结构判断） |
| src/client/shell-store.ts | 源码 | 26 | shell 侧状态订阅（结构判断） |
| src/client/SettingsDocumentAction.tsx | 源码 | 51 | 设置文档动作按钮（结构判断） |
| src/client/DeveloperToolsRow.tsx | 源码 | 37 | 开发者工具开关行（结构判断） |
| src/client/HostReleasePrompt.tsx | 源码 | 89 | 宿主新版本提示（结构判断） |
| src/client/CurrentVersionRow.tsx | 源码 | 14 | 当前版本行（结构判断） |
| src/client/chrome.tsx | 源码 | 50 | 分区框架（标题、说明、容器）（结构判断） |
| src/client/GeneralSection.tsx | 源码 | 20 | 通用分区容器（结构判断） |
| src/client/locales.ts | 源码 | 556 | 本包文案字典（结构判断） |
| src/types.ts | 源码 | 74 | 通用设置类型（结构判断） |
| src/client/*.module.css | 样式 | 9 个 | 设置根、各设置行与分区样式（结构判断） |
| src/index.ts | 源码 | 24 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 10 个 | 覆盖版本行、更新通道与根节点渲染（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 56. client/ui-settings-models — 模型设置

设置页「模型」分区：供应商与模型清单编辑、API Key、推理强度、重试策略与首次引导。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/ModelsSection.tsx | 源码 | 757 | 模型分区主视图：供应商列表、模型行与保存（结构判断） |
| src/client/ProviderEditor.tsx | 源码 | 689 | 供应商编辑器：地址、协议、密钥与模型集合（结构判断） |
| src/client/ModelListEditor.tsx | 源码 | 457 | 模型清单编辑（增删、拖排序）（结构判断） |
| src/client/RetryPolicyEditor.tsx | 源码 | 417 | 重试策略编辑器（结构判断） |
| src/client/store.ts | 源码 | 417 | 模型设置状态与保存队列（结构判断） |
| src/client/CustomProviderCard.tsx | 源码 | 340 | 自定义供应商卡片（结构判断） |
| src/client/ModelReasoningEfforts.tsx | 源码 | 272 | 推理强度档位编辑（结构判断） |
| src/client/DeepSeekModelsEditor.tsx | 源码 | 256 | DeepSeek 内置模型的专用编辑（结构判断） |
| src/client/ModelRow.tsx | 源码 | 190 | 单个模型行（结构判断） |
| src/client/index.ts | 源码 | 160 | 包入口：注册模型分区（结构判断） |
| src/client/DeepSeekOnboardingDialog.tsx | 源码 | 137 | DeepSeek 首次配置引导（结构判断） |
| src/client/welcome-store.ts | 源码 | 120 | 欢迎提示的展示状态（结构判断） |
| src/client/useModelRows.ts | 源码 | 110 | 模型行的派生与校验 hook（结构判断） |
| src/client/operations.ts | 源码 | 99 | 模型清单的增删改操作（结构判断） |
| src/client/ApiKeyInput.tsx | 源码 | 68 | API Key 输入与遮蔽（结构判断） |
| src/client/apiKey.ts | 源码 | 58 | 密钥格式校验（结构判断） |
| src/client/EditorFooter.tsx | 源码 | 67 | 编辑器底部保存/取消条（结构判断） |
| src/client/ModelInputTypes.tsx | 源码 | 61 | 输入模态（文本/图片）开关（结构判断） |
| src/client/OnboardingModal.tsx | 源码 | 52 | 通用引导弹窗（结构判断） |
| src/client/protocol-rules.ts | 源码 | 44 | 协议与能力的兼容规则（结构判断） |
| src/client/protocol-label.ts | 源码 | 28 | 协议名展示文案（结构判断） |
| src/client/schema-operations.ts | 源码 | 26 | schema 级模型操作（结构判断） |
| src/client/slot-contract.ts | 源码 | 58 | 模型分区槽位契约（结构判断） |
| src/client/WelcomeNotice.tsx | 源码 | 77 | 首次使用欢迎提示（结构判断） |
| src/client/locales.ts | 源码 | 1420 | 本包文案字典（结构判断） |
| src/onboarding-config.ts、src/onboarding-copy.ts | 源码 | 28 | 引导流程配置与文案（结构判断） |
| src/client/ModelsSection.module.css、ModelsSection 相关 | 样式 | 4 个 | 模型分区、引导弹窗、欢迎提示样式（结构判断） |
| src/index.ts | 源码 | 22 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 15 个 | 覆盖供应商编辑、模型行、重试策略与密钥校验（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 57. client/ui-settings-plugin-inventory — 插件清单设置

设置页中的「插件清单」标签页：查看已装插件、来源与版本清单。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/PluginInventorySettingsTab.tsx | 源码 | 580 | 清单标签页主视图：分组列表与来源信息（结构判断） |
| src/client/locales.ts | 源码 | 332 | 本包文案字典（结构判断） |
| src/client/index.ts | 源码 | 64 | 包入口：注册标签页（结构判断） |
| src/client/PluginInventorySettingsTab.module.css | 样式 | 512 | 清单页样式（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 3 个 | 覆盖清单分组与来源展示（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 58. client/ui-settings-plugins — 插件设置分区

设置页「插件」分区外壳：把插件相关入口（管理页、清单页）聚合成一组设置项。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/PluginsSettingsSection.tsx | 源码 | 126 | 插件设置分区视图（结构判断） |
| src/client/index.ts | 源码 | 85 | 包入口：注册分区与入口项（结构判断） |
| src/client/locales.ts | 源码 | 76 | 本包文案字典（结构判断） |
| src/client/PluginsSettingsSection.module.css | 样式 | 113 | 分区样式（结构判断） |
| src/index.ts | 源码 | 11 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 2 个 | 覆盖入口项注册与渲染（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 59. client/ui-settings-session-log — 会话日志上传

设置页中的「会话日志上传」偏好：是否允许上传日志，以及上传范围的说明。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/upload-preference.ts | 源码 | 50 | 上传偏好的读写与默认值（结构判断） |
| src/client/UploadRow.tsx | 源码 | 50 | 上传偏好设置行（结构判断） |
| src/client/index.ts | 源码 | 41 | 包入口（结构判断） |
| src/client/locales.ts | 源码 | 63 | 本包文案字典（结构判断） |
| src/client/UploadRow.module.css | 样式 | 20 | 设置行样式（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 3 个 | 覆盖偏好读写与行渲染（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 60. client/ui-settings-shell — Shell 设置

设置页中的「Shell」卡：选择交互式 shell 及参数，供终端工具使用。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/shell-card-controller.ts | 源码 | 67 | Shell 卡片的读写与校验（结构判断） |
| src/client/ShellCard.tsx | 源码 | 55 | Shell 设置卡视图（结构判断） |
| src/client/index.ts | 源码 | 53 | 包入口（结构判断） |
| src/client/locales.ts | 源码 | 163 | 本包文案字典（结构判断） |
| src/index.ts | 源码 | 10 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 3 个 | 覆盖 shell 参数校验与写入（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 61. client/ui-settings-subagent — 子智能体设置

设置页中的子智能体分区：默认模型、并发上限与开关。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/subagent-model-selection-card-controller.ts | 源码 | 356 | 子智能体模型选择卡的读写（结构判断） |
| src/client/index.ts | 源码 | 93 | 包入口：注册分区卡片（结构判断） |
| src/client/subagent-card-controller.ts | 源码 | 79 | 子智能体总开关控制（结构判断） |
| src/client/SubagentLimitsFields.tsx | 源码 | 57 | 并发/深度等上限字段（结构判断） |
| src/client/SubagentCard.tsx | 源码 | 52 | 分区卡片容器（结构判断） |
| src/client/subagent-limits-card-controller.ts | 源码 | 66 | 上限字段的读写与校验（结构判断） |
| src/client/SubagentModelSelectionFields.tsx | 源码 | 128 | 子智能体模型选择字段（结构判断） |
| src/client/locales.ts | 源码 | 343 | 本包文案字典（结构判断） |
| src/client/*.module.css | 样式 | 3 个 | 卡片与字段样式（结构判断） |
| src/index.ts | 源码 | 11 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 3 个 | 覆盖模型卡、上限校验与开关（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 62. client/ui-settings-web-search — 联网搜索设置

设置页中的联网搜索卡：开关、搜索服务与参数，controller 负责协议字段映射。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/web-search-card-controller.ts | 源码 | 669 | 搜索设置卡的读写、校验与服务参数映射（结构判断） |
| src/client/WebSearchCard.tsx | 源码 | 294 | 搜索设置卡视图（结构判断） |
| src/client/locales.ts | 源码 | 403 | 本包文案字典（结构判断） |
| src/client/index.ts | 源码 | 75 | 包入口（结构判断） |
| src/client/WebSearchCard.module.css | 样式 | 150 | 卡片样式（结构判断） |
| src/index.ts | 源码 | 11 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 4 个 | 覆盖参数映射与校验（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 63. client/ui-shortcuts — 快捷键

快捷键体系：注册表、编辑器（自定义按键）、速查面板与固定不可改的快捷键。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/Reference.tsx | 源码 | 224 | 快捷键速查面板（按分类展示）（结构判断） |
| src/client/Editor.tsx | 源码 | 181 | 快捷键自定义编辑器（监听按键、冲突检测）（结构判断） |
| src/client/index.ts | 源码 | 72 | 包入口：注册快捷键设置与速查槽位（结构判断） |
| src/client/feedback.ts | 源码 | 32 | 冲突/保存的反馈提示（结构判断） |
| src/client/store.ts | 源码 | 20 | 快捷键绑定存储（结构判断） |
| src/client/fixed.ts | 源码 | 17 | 不可修改的固定快捷键（结构判断） |
| src/client/Icons.tsx | 源码 | 16 | 按键图标（结构判断） |
| src/client/locales.ts | 源码 | 310 | 本包文案字典（结构判断） |
| src/client/Reference.module.css | 样式 | 238 | 速查面板样式（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 3 个 | 覆盖绑定编辑与冲突检测（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 64. client/ui-sidebar — 左侧栏骨架

左侧栏的容器与面板托管：面板固定（pins）、头部控件、滚动交接给主区。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/SidebarRoot.tsx | 源码 | 476 | 左侧栏根组件：面板切换、宽度与折叠（结构判断） |
| src/client/contract/slots.ts | 源码 | 242 | 侧栏槽位契约（面板定义、头部、底部）（结构判断） |
| src/client/index.ts | 源码 | 118 | 包入口：注册侧栏与面板（结构判断） |
| src/client/scroll-handoff.ts | 源码 | 98 | 侧栏与主区之间的滚动交接（结构判断） |
| src/client/locales.ts | 源码 | 116 | 本包文案字典（结构判断） |
| src/client/HeaderLeadingControls.tsx | 源码 | 64 | 侧栏头部的前置控件区（结构判断） |
| src/client/panel-pins.ts | 源码 | 35 | 面板固定/排序状态（结构判断） |
| src/client/PanelIcon.tsx | 源码 | 12 | 面板图标（结构判断） |
| src/client/SidebarRoot.module.css、HeaderLeadingControls.module.css | 样式 | 2 个 | 侧栏与头部控件样式（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 10 个 | 覆盖面板切换、折叠与滚动交接（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 65. client/ui-sidebar-browser — 侧栏内嵌浏览器

左/右栏里的浏览器面板：浏览器端用 iframe，桌面端用 Electron webview，两套实现共用 BrowserController 与持久化。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/browser/BrowserController.ts | 源码 | 267 | 浏览器面板控制器：URL、历史、加载态（结构判断） |
| src/client/electron/ElectronWebViewImpl.ts | 源码 | 271 | Electron webview 实现（含进程隔离与事件）（结构判断） |
| src/client/browser/BrowserNavigation.ts | 源码 | 143 | 前进/后退/刷新与地址规范化（结构判断） |
| src/client/browser/IframeImpl.ts | 源码 | 104 | iframe 实现（浏览器端）（结构判断） |
| src/client/electron/ElectronWebviewPresentation.ts | 源码 | 94 | Electron 呈现层适配（结构判断） |
| src/client/index.ts | 源码 | 105 | 包入口：注册侧栏面板（结构判断） |
| src/client/view/BrowserBody.tsx | 源码 | 133 | 浏览器面板主体视图（结构判断） |
| src/client/browser/BrowserFrame.ts | 源码 | 51 | 浏览器框架抽象（统一两套实现）（结构判断） |
| src/client/browser/BrowserPersistence.ts | 源码 | 44 | 会话内浏览状态持久化（结构判断） |
| src/client/browser/url.ts | 源码 | 45 | URL 补全与校验（结构判断） |
| src/client/browser/store.ts | 源码 | 38 | 浏览状态存储（结构判断） |
| src/client/browser/BrowserPage.ts | 源码 | 20 | 页面描述结构与 id（结构判断） |
| src/client/electron/workspace.ts、pages.ts | 源码 | 55 | Electron 侧页面与工作区绑定（结构判断） |
| src/client/view/IframePresentation.ts | 源码 | 88 | iframe 呈现层（结构判断） |
| src/client/view/BrowserPresentation.ts、BrowserTitle.tsx | 源码 | 26 | 呈现接口与标题（结构判断） |
| src/client/definition.tsx、pages.ts | 源码 | 46 | 面板定义与页面注册（结构判断） |
| src/client/locales.ts | 源码 | 249 | 本包文案字典（结构判断） |
| src/types.ts | 源码 | 27 | 浏览器面板类型（结构判断） |
| src/client/view/Browser.module.css | 样式 | 249 | 浏览器面板样式（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 4 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 13 个 | 覆盖 URL 规范化、导航、两套实现适配（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 66. client/ui-sidebar-documentpreview — 右侧栏文档预览

侧栏里「点开一个文件直接看」的预览器：按扩展名分派到十种渲染体（代码、Markdown、纯文本、图片、Excel/CSV、HTML、PDF、Office、以及不可预览类型），每种渲染体自带懒加载、错误处理与文案。`document/` 是分派与注册层，`face.ts` 是面向侧栏的对外接口，`store.ts` 管当前预览的标签页集合。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/face.ts | 源码 | 223 | 侧栏对外接口：打开/切换/关闭预览，暴露当前标签与加载态（结构判断） |
| src/client/store.ts | 源码 | 268 | 预览标签页集合的状态存储（结构判断） |
| src/client/index.ts | 源码 | 132 | 包注册入口（槽位、命令、右键菜单项）（结构判断） |
| src/client/definition.ts | 源码 | 55 | 功能定义（id、标题、槽位声明）（结构判断） |
| src/client/rpc.ts | 源码 | 93 | 预览侧的远端调用封装（读文件、取元信息）（结构判断） |
| src/client/PreviewFrame.tsx | 源码 | 82 | 所有渲染体共用的外框（标题、工具条、错误占位）（结构判断） |
| src/client/LoadingIndicator.tsx / .module.css | 源码 / 样式 | 19 / 28 | 加载指示器（结构判断） |
| src/client/TextPreview.tsx | 源码 | 450 | 纯文本/代码的通用预览主组件（含行号、换行、截断）（结构判断） |
| src/client/TextPreview.module.css | 样式 | 344 | 上者样式（结构判断） |
| src/client/TextTitle.tsx | 源码 | 24 | 预览标题栏（文件名 + 路径）（结构判断） |
| src/client/failure-line.ts | 源码 | 57 | 失败提示行的文案与重试（结构判断） |
| src/client/locales.ts | 词典 | 218 | 预览器通用词条（结构判断） |
| src/client/document/registry.ts | 源码 | 133 | 渲染体注册表：扩展名/MIME → 渲染体（结构判断） |
| src/client/document/contract.ts | 源码 | 107 | 渲染体契约（props、状态、动作）（结构判断） |
| src/client/document/resource-group.ts | 源码 | 50 | 按资源分组决定复用/新建预览（结构判断） |
| src/client/document/suffix.ts | 源码 | 36 | 扩展名归一与判定（结构判断） |
| src/client/document/tab-lifetime.ts | 源码 | 24 | 预览标签的存活/回收策略（结构判断） |
| src/client/document/unviewable.ts | 源码 | 37 | 不可预览类型的兜底（结构判断） |
| src/client/code/CodeBody.tsx / .module.css | 源码 / 样式 | 35 / 61 | 代码高亮渲染体（结构判断） |
| src/client/code/index.ts | 源码 | 27 | 代码渲染体注册（结构判断） |
| src/client/code/locales.ts | 词典 | 65 | 代码预览文案（结构判断） |
| src/client/markdown/MarkdownBody.tsx / .module.css | 源码 / 样式 | 71 / 31 | Markdown 渲染体（结构判断） |
| src/client/markdown/frontmatter.ts | 源码 | 22 | frontmatter 解析（结构判断） |
| src/client/markdown/frontmatter-fields.tsx / .module.css | 源码 / 样式 | 72 / 25 | frontmatter 字段的表格化展示（结构判断） |
| src/client/markdown/path-images.ts | 源码 | 28 | 把文档内相对图片路径改写为可访问地址（结构判断） |
| src/client/markdown/index.ts / locales.ts | 源码 / 词典 | 31 / 73 | 注册与文案（结构判断） |
| src/client/text/TextBody.tsx | 源码 | 34 | 纯文本渲染体（结构判断） |
| src/client/text/lines.ts | 源码 | 94 | 大文件行切分（结构判断） |
| src/client/text/index.ts | 源码 | 26 | 文本渲染体注册（结构判断） |
| src/client/image/ImageBody.tsx / .module.css | 源码 / 样式 | 180 / 57 | 图片渲染体（缩放、适应）（结构判断） |
| src/client/image/pan.ts | 源码 | 82 | 拖拽平移手势（结构判断） |
| src/client/image/index.ts / locales.ts | 源码 / 词典 | 56 / 91 | 注册与文案（结构判断） |
| src/client/zoom/ZoomViewport.tsx / .module.css | 源码 / 样式 | 215 / 30 | 缩放视口（图片/PDF/Office 共用）（结构判断） |
| src/client/zoom/store.ts / types.ts / locales.ts | 源码 / 类型 / 词典 | 43 / 14 / 82 | 缩放状态、类型与文案（结构判断） |
| src/client/excel/model.ts | 源码 | 49 | 表格数据的通用模型（结构判断） |
| src/client/excel/index.ts | 源码 | 24 | 表格渲染体注册（结构判断） |
| src/client/excel/excel.tsx | 源码 | 68 | 表格渲染体组件（结构判断） |
| src/client/excel/ExcelBody.module.css | 样式 | 129 | 表格样式（结构判断） |
| src/client/excel/LazyExcelBody.tsx | 源码 | 29 | 表格渲染体的懒加载包装（结构判断） |
| src/client/excel/parse.ts | 源码 | 70 | 表格解析分发（按扩展名）（结构判断） |
| src/client/excel/delimited.ts | 源码 | 44 | CSV/TSV 解析（结构判断） |
| src/client/excel/xlsx.ts | 源码 | 237 | xlsx 解析实现（结构判断） |
| src/client/excel/xlsx-archive.ts | 源码 | 110 | xlsx 的 zip 容器解析（结构判断） |
| src/client/excel/xls.ts | 源码 | 99 | 旧版 xls 解析（结构判断） |
| src/client/excel/convert.ts | 源码 | 21 | 解析结果 → 通用模型（结构判断） |
| src/client/excel/format.ts | 源码 | 16 | 单元格值格式化（结构判断） |
| src/client/excel/error.ts | 源码 | 8 | 解析错误类型（结构判断） |
| src/client/excel/worker.ts | 源码 | 12 | 解析 worker 入口（结构判断） |
| src/client/excel/asset-imports.d.ts | 类型声明 | 11 | worker 资源导入类型（结构判断） |
| src/client/excel/locales.ts | 词典 | 112 | 表格预览文案（结构判断） |
| src/client/html/HtmlBody.tsx / .module.css | 源码 / 样式 | 103 / 15 | HTML 渲染体（沙箱 iframe）（结构判断） |
| src/client/html/bootstrap.ts | 源码 | 48 | 注入 iframe 的引导脚本（结构判断） |
| src/client/html/pack.ts | 源码 | 72 | 把 HTML 与相对资源打包成单文档（结构判断） |
| src/client/html/read-relative.ts | 源码 | 51 | 相对资源读取（结构判断） |
| src/client/html/bytes.ts | 源码 | 26 | 字节 → 文本（含编码嗅探）（结构判断） |
| src/client/html/basic-document.ts | 源码 | 22 | 最小文档骨架（结构判断） |
| src/client/html/index.ts / locales.ts | 源码 / 词典 | 43 / 73 | 注册与文案（结构判断） |
| src/client/pdf/pdf.tsx | 源码 | 213 | PDF 渲染体主组件（结构判断） |
| src/client/pdf/PdfBody.module.css | 样式 | 147 | PDF 样式（结构判断） |
| src/client/pdf/runtime.ts | 源码 | 112 | PDF 运行时（worker/库）加载（结构判断） |
| src/client/pdf/document.ts | 源码 | 91 | 文档打开与页信息（结构判断） |
| src/client/pdf/text.ts | 源码 | 45 | 文本层提取（结构判断） |
| src/client/pdf/store.ts | 源码 | 52 | 阅读状态（页码、缩放）（结构判断） |
| src/client/pdf/assets.ts / asset-imports.d.ts | 源码 / 类型声明 | 39 / 5 | PDF 静态资源路径（结构判断） |
| src/client/pdf/errors.ts | 源码 | 11 | PDF 错误类型（结构判断） |
| src/client/pdf/LazyPdfBody.tsx | 源码 | 18 | 懒加载包装（结构判断） |
| src/client/pdf/index.ts / locales.ts | 源码 / 词典 | 56 / 123 | 注册与文案（结构判断） |
| src/client/office/index.ts | 源码 | 131 | Office 渲染体系入口（结构判断） |
| src/client/office/OfficeBody.tsx / .module.css | 源码 / 样式 | 78 / 6 | Office 渲染体（结构判断） |
| src/client/office/face.ts | 源码 | 64 | Office 预览对外接口（结构判断） |
| src/client/office/cache.ts | 源码 | 193 | 转换产物缓存（结构判断） |
| src/client/office/store.ts | 源码 | 53 | Office 预览状态（结构判断） |
| src/client/office/FontNotice.tsx / .module.css | 源码 / 样式 | 65 / 136 | 缺字体提示与样式（结构判断） |
| src/client/office/OfficeFontAction.tsx | 源码 | 21 | 安装字体的动作入口（结构判断） |
| src/client/office/locales.ts | 词典 | 154 | Office 预览文案（结构判断） |
| licenses/FortuneSheet.txt | 许可证 | 21 | 第三方表格库（FortuneSheet）的许可证文本（结构判断） |
| src/config.ts / src/index.ts / src/css-modules.d.ts | 配置 / 入口 / 类型声明 | 41 / 17 / 6 | 配置项、宿主侧入口、CSS Module 声明（结构判断） |
| tests（87 个） | 测试 | 约 9,000 | 测试数在 ui-* 中第二多；按被测对象分组：document 分派/注册、code、markdown、text、image、excel（含 xlsx/xls 解析）、html、pdf、office、zoom、store/face（结构判断） |
| locale/*.json（8 个） | 本地化 | 8 个文件 | 仅 `meta.title`（精读） |
| package.json / README ×3 / tsconfig ×3 / tsdown.config.ts | 工程样板 | — | 结构判断 |

## 67. client/ui-sidebar-files — 侧栏文件树

工作区文件面板：目录树懒加载、文件搜索与搜索偏好。face.ts 是数据面（树与搜索的取数），FileNavigator/FileTree 是两套呈现。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/face.ts | 源码 | 955 | 文件面板数据面。结构上分三块：目录树拉取与缓存、搜索索引与匹配、面板动作与事件（结构判断） |
| src/client/FilesBody.module.css | 样式 | 534 | 文件面板主体样式（结构判断） |
| src/client/locales.ts | 源码 | 478 | 本包文案字典（结构判断） |
| src/client/store.ts | 源码 | 478 | 树展开态、选中项与搜索状态存储（结构判断） |
| src/client/FileNavigator.tsx | 源码 | 431 | 导航器视图（面包屑/路径式浏览）（结构判断） |
| src/client/FileTree.tsx | 源码 | 318 | 目录树视图（虚拟滚动、展开）（结构判断） |
| src/client/search-rules.ts | 源码 | 233 | 搜索过滤与排序规则（结构判断） |
| src/client/index.ts | 源码 | 185 | 包入口：注册侧栏文件面板（结构判断） |
| src/client/directory-node.ts | 源码 | 156 | 目录节点结构与合并（结构判断） |
| src/client/SearchSettings.tsx | 源码 | 155 | 搜索偏好设置视图（结构判断） |
| src/client/workspace-tree.ts | 源码 | 131 | 工作区到树的转换（结构判断） |
| src/client/FilesBody.tsx | 源码 | 119 | 面板主体容器（结构判断） |
| src/client/search-preferences.ts | 源码 | 116 | 搜索偏好读写（结构判断） |
| src/client/search-tree.ts | 源码 | 74 | 搜索结果转树形展示（结构判断） |
| src/client/search-workspace.ts | 源码 | 67 | 工作区级搜索调度（结构判断） |
| src/client/NavigatorToggle.tsx | 源码 | 66 | 树/导航器视图切换（结构判断） |
| src/client/definition.tsx | 源码 | 40 | 面板定义（结构判断） |
| src/client/FilesTitle.tsx | 源码 | 25 | 面板标题（结构判断） |
| src/client/navigator-layout.ts | 源码 | 7 | 导航器布局常量（结构判断） |
| src/client/FileTree.module.css、FilesBody.module.css | 样式 | 2 个 | 树与主体样式（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 24 个 | 覆盖树拉取、搜索规则、偏好与视图（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 68. client/ui-sidebar-right — 右侧栏

右栏的标签页体系：tab-registry 管理标签定义，service 管理打开/聚焦，stores 保存分栏与标签状态，guide 是内置的「指南」标签页。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/service.ts | 源码 | 865 | 右栏服务：打开标签、聚焦、分栏与生命周期（结构判断） |
| src/client/stores.ts | 源码 | 523 | 标签与分栏状态存储（结构判断） |
| src/client/SidebarRight.tsx（shell/） | 源码 | 462 | 右栏根视图（结构判断） |
| src/client/tab-registry.ts | 源码 | 414 | 标签定义注册表（结构判断） |
| src/client/index.ts | 源码 | 319 | 包入口：注册右栏与标签槽位（结构判断） |
| src/client/contract/slots.ts | 源码 | 271 | 右栏标签槽位契约（结构判断） |
| src/client/tab-domain.ts | 源码 | 212 | 标签所属域（会话/文件/预览）判定（结构判断） |
| src/client/focus.ts | 源码 | 137 | 焦点管理与快捷键聚焦（结构判断） |
| src/client/persistence.ts | 源码 | 101 | 标签布局持久化（结构判断） |
| src/client/shortcuts.ts | 源码 | 99 | 右栏快捷键（结构判断） |
| src/client/session-view.ts、session-views.ts | 源码 | 171 | 会话级视图绑定（结构判断） |
| src/client/tab-info.ts、tab-inventory.ts | 源码 | 123 | 标签元信息与清单（结构判断） |
| src/client/labels.ts | 源码 | 44 | 标签文案（结构判断） |
| src/client/locales.ts | 源码 | 346 | 本包文案字典（结构判断） |
| src/client/contract/params.ts、seed.ts | 源码 | 99 | 标签参数与初始种子（结构判断） |
| src/client/shell/RightbarRoot.tsx | 源码 | 38 | 右栏挂载根（结构判断） |
| src/client/shell/ExpandButton.tsx、TabMenuContent.tsx | 源码 | 75 | 展开按钮与标签菜单内容（结构判断） |
| src/client/shell/close-focus.ts、flash.ts | 源码 | 64 | 关闭后的焦点回退与闪烁提示（结构判断） |
| src/client/tabs/guide/* | 源码 | 9 个 | 内置「指南」标签页（定义、主体、图标、标题、固定项）（结构判断） |
| src/client/shell/*.module.css | 样式 | 3 个 | 右栏与展开按钮样式（结构判断） |
| src/client/tabs/guide/GuideBody.module.css | 样式 | 128 | 指南页样式（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 21 个 | 覆盖标签注册、打开聚焦、持久化与焦点回退（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 69. client/ui-sidebar-terminal — 侧栏终端

内嵌终端面板：xterm 视图、主题、光标与恢复逻辑，懒加载以减小首屏体积。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/terminal.tsx | 源码 | 200 | 终端视图：xterm 实例、尺寸与输入输出桥接（结构判断） |
| src/client/index.ts | 源码 | 172 | 包入口：注册终端面板（结构判断） |
| src/client/terminal-theme.ts | 源码 | 104 | 终端配色主题（结构判断） |
| src/client/TerminalGuide.tsx | 源码 | 83 | 终端使用引导（结构判断） |
| src/client/TerminalTitle.tsx | 源码 | 71 | 面板标题与状态（结构判断） |
| src/client/terminal-cursor.ts | 源码 | 61 | 光标形状与闪烁设置（结构判断） |
| src/client/AgentTerminalOpener.tsx | 源码 | 20 | 由智能体打开的终端入口（结构判断） |
| src/client/LazyTerminalBody.tsx | 源码 | 14 | 终端主体懒加载包装（结构判断） |
| src/client/TerminalCleanup.tsx、TerminalRecovery.tsx | 源码 | 58 | 退出清理与崩溃恢复提示（结构判断） |
| src/client/TerminalIcon.tsx | 源码 | 13 | 面板图标（结构判断） |
| src/client/locales.ts | 源码 | 199 | 本包文案字典（结构判断） |
| src/client/*.module.css | 样式 | 4 个 | 终端、清理提示、引导、标题样式（结构判断） |
| src/index.ts | 源码 | 4 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 8 个 | 覆盖主题、光标设置与恢复逻辑（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 70. client/ui-skill — 技能

技能（skill）在界面中的呈现：技能列表行、输入框技能引用与用户文本识别。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/index.ts | 源码 | 264 | 包入口：注册技能列表与引用槽位（结构判断） |
| src/client/SkillRow.tsx | 源码 | 173 | 技能行视图：名称、来源与启停（结构判断） |
| src/client/locales.ts | 源码 | 103 | 本包文案字典（结构判断） |
| src/client/user-text-rules.ts | 源码 | 36 | 用户文本中技能引用识别（结构判断） |
| src/client/SkillReference.tsx | 源码 | 28 | 技能引用胶囊（结构判断） |
| src/client/SkillRow.module.css | 样式 | 215 | 技能行样式（结构判断） |
| src/index.ts | 源码 | 9 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 4 个 | 覆盖行渲染与引用识别（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 71. client/ui-slots — 槽位基础库

被几乎所有 ui-* 包依赖的底层槽位库：定义槽位、声明渲染贡献、按作用域解析出组件树。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/index.ts | 源码 | 1748 | 槽位核心。结构上分三块：槽位与贡献的类型与注册、作用域解析算法、渲染结果组装（结构判断） |
| src/renderer.ts | 源码 | 286 | 槽位渲染器：把贡献列表渲染为元素序列（结构判断） |
| src/store.ts | 源码 | 17 | 槽位注册表的最小存储（结构判断） |
| tests/*.spec.ts(x) | 测试 | 3 个 | 覆盖注册、解析优先级与渲染顺序（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 72. client/ui-subagent — 子智能体

子智能体会话的界面：侧栏聊天视图、页头血缘（lineage）展示与只读输入区。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| src/client/SubagentHeaderLineage.tsx | 源码 | 923 | 子智能体页头：父/子链路、角色与状态（结构判断） |
| src/client/SubagentHeaderLineage.module.css | 样式 | 528 | 页头血缘样式（结构判断） |
| src/client/sidebar-chat/index.tsx | 源码 | 199 | 子智能体的侧栏聊天视图（结构判断） |
| src/client/index.ts | 源码 | 117 | 包入口：注册子智能体视图与槽位（结构判断） |
| src/client/locales.ts | 源码 | 415 | 本包文案字典（结构判断） |
| src/client/SubagentReadOnlyComposer.tsx | 源码 | 31 | 只读输入区（子智能体不可对话时）（结构判断） |
| src/client/slots.ts | 源码 | 13 | 子智能体槽位定义（结构判断） |
| src/client/sidebar-chat/SidebarChat.module.css、SubagentReadOnlyComposer.module.css | 样式 | 2 个 | 聊天视图与只读输入样式（结构判断） |
| src/index.ts | 源码 | 9 | 统一出口（结构判断） |
| src/css-modules.d.ts | 断言 | 6 | CSS Module 声明（结构判断） |
| tests/*.spec.ts(x) | 测试 | 3 个 | 覆盖血缘渲染与视图注册（结构判断） |
| locale/*.json | 本地化 | 8 个 | 包标题元数据（结构判断） |
| README.md / README.zh.md / README.i18n.yaml | 文档 | 3 个 | 包说明与翻译配对（结构判断） |
| package.json / tsconfig*.json / tsdown.config.ts | 配置 | 4 个 | 包清单与构建配置（结构判断） |


## 73. client/ui-theme（清单切片不完整）

主题包在 `packages-02.tsv` 中只剩 8 个 `locale/*.json` 与 `package.json`，`src/` 下的主题实现被切到 `packages-03.tsv`（详见第 58 节说明），本文件不对其源码下结论。

| 文件 | 类型 | 行数 | 职责（结构判断） |
|---|---|---|---|
| locale/*.json | 本地化 | 8 个 | 8 种语言的包标题元数据（精读） |
| package.json | 配置 | 82 | 包清单，声明主题包的依赖与导出（结构判断） |
| src/**（未包含在切片内） | 待确认 | — | 主题实现位于 packages-03.tsv，待该切片补登（待确认） |

## 附录 A. 覆盖对账与巡检异常

### A1 与清单的对账

| 项 | 数值 | 说明 |
|---|---|---|
| `packages-01.tsv` 数据行 | 799 | 不含表头 |
| `packages-02.tsv` 数据行 | 2,999 | 不含表头 |
| 合计 | **3,798** | 本文登记的记录总数，逐行核对无缺漏 |
| 合计行数 | 533,064 | 清单第三列求和 |
| `package.json` 包目录 | **90** | `packages/acp` 1、`api` 9、`attachment` 2、`boot` 6、`browser-use` 1、`bundle` 6、`client` 9 个核心包 + 56 个 `ui-*` |
| 无 `package.json` 的登记块 | **2** | `packages/` 顶层 24 文件、`packages/client` 根 5 文件 |
| 二级小节 | **73** | 前置 17 节（含 `api` 9、`attachment` 2、`boot` 6 个三级小节）+ `ui-*` 56 节 |
| 登记条目（表格行） | 1,596 | 3,798 条记录压缩而来，压缩率约 58%，压缩方式见「登记粒度」 |

小节数与包数能对上：25 个「非 client」包（1+9+2+6+1+6）落在 §2–§7，9 个 client 核心包落在 §9–§17，56 个 `ui-*` 落在 §18–§73，合计 90 个包；`packages/` 顶层与 `packages/client` 根各占 §1、§8，不计入包数。

### A2 标注分布

| 标注 | 条目数 | 占比 | 覆盖的文件记录 |
|---|---:|---:|---|
| 精读（含「精读：模块头」） | 64 | 4.0% | 约 420 条记录（含 20 条 locale 合并行，每条覆盖 8 个语种文件） |
| 结构判断 | 1,531 | 96.0% | 其余全部 |
| 待确认 | 2 | 0.1% | 见 A4 第 4、6 条 |
| **合计** | **1,596** | 100% | — |

精读的分布极不均匀，这是有意的：读实现只对「结构不明、职责会写错」的文件做，其余按目录与导出符号判断即可。真正打开过实现体或完整模块头的位置：

- **`api`**：`gateway/src/index.ts`、`session-controller/src/index.ts`、`session-controller/src/client/sessions/{session,manager}.ts`、`terminal-controller/src/client/model.ts`（均为模块头注释级）
- **`boot`**：`app-boot/src/index.ts`、`app-boot/src/profile-resolution/resolver.ts`、`hmr/src/index.ts`、`plugin-manager/src/index.ts`
- **`client` 核心**：`file-upload/src/index.ts`、`hmr/src/index.ts`、`locale/src/client/index.ts`、`modules/src/index.ts`、`modules/src/client/{manifest,system}.ts`、`product-analytics/src/index.ts`、`resources/src/client/resources.ts`、`shortcuts/src/configuration.ts`、`store/src/index.ts`
- **`ui-chat`**：`src/index.ts`、`src/chat-settings.ts`、`src/client/index.ts`、`conversation-nodes/chat-snapshot-builder.ts`、`chat/{ChatView.tsx,use-chat-viewport.ts,flow-motion.ts}`
- **`ui-conversation`**：`src/index.ts`、`src/submission-settings.ts`、`src/client/index.ts`、`contract/slots.ts`、`conversation/{assembler.ts,location-index.ts}`、`input/facade.ts`、`skeleton/InputBar.tsx`、`service.ts`
- **`ui-primitives`**：`src/index.ts`、`src/ansi.ts`、`src/icons/index.tsx`、`markdown/{render.tsx,highlight.ts}`
- **locale 抽样**：每个包至少核对一份 `en.json`，确认内容只有 `meta.title`，据此把整包 locale 记为一行

### A3 覆盖方式的三点自我限定

1. **没有逐字读过 3,798 个文件中的 96%**。结构判断的依据是「文件名 + 所在目录 + 同目录命名规律 + 导出符号 + 被谁 import」，对 `xxx.ts` 这类命名准确的仓库（本仓库属于此类）命中率较高，但**不能替代读实现**。若后续要拿本文当重构依据，先对目标包补精读。
2. **合并登记的文件（locale / tests / CSS / 样板）没有独立职责**。它们的职责由所属包与文件名决定，逐个描述会退化为同义反复，所以按组给一句。需要单文件级信息时以清单 TSV 为准。
3. **三个大包（`ui-chat`、`ui-conversation`、`ui-primitives`）的逐文件行是按目录结构判定的**，小节内先给了目录职责，再逐文件一句话。这三节是全文结构判断最密集的地方，也是最需要复核的地方。

### A4 巡检异常

**1) 超大源码文件：72 个超过 500 行（非测试）**

| 行数 | 文件 | 说明 |
|---:|---|---|
| 3,191 | `ui-conversation/src/client/locales.ts` | 文案字典，不是逻辑复杂度 |
| 2,385 | `ui-plugin-manager/src/client/locales.ts` | 文案字典 |
| 1,926 | `ui-plugin-manager/src/client/PluginManagerPage.tsx` | 单文件承载整页，页面 / 列表 / 详情 / 操作都在里面 |
| 1,749 | `api/gateway/src/index.ts` | 服务主体：注册、分发、访问判定、流订阅 |
| 1,748 | `ui-slots/src/index.ts` | 槽位基础库，12 个文件的包里有 1,748 行压在入口 |
| 1,695 | `ui-chat/src/client/locale.ts` | 文案字典（注意是单数 `locale.ts`，与其它包的 `locales.ts` 不一致） |
| 1,591 | `ui-renderer/src/client/scoped-slots.tsx` | 作用域槽位渲染调度 |
| 1,581 | `ui-plugin-manager/src/client/manager-store.ts` | 插件管理状态机 |
| 1,458 | `boot/plugin-manager/src/index.ts` | 插件生命周期服务主体 |
| 1,420 | `ui-settings-models/src/client/locales.ts` | 文案字典 |
| 1,297 | `client/modules/src/index.ts` | 浏览器模块系统的 host 半边 |
| 1,294 | `ui-schedule/src/client/task-manager-locales.ts` | 文案字典 |
| 1,286 | `boot/app-boot/src/index.ts` | 引导主流程 |
| 1,244 | `ui-chat/src/client/conversation-nodes/chat-snapshot-builder.ts` | 快照投影 |
| 1,166 | `ui-conversation/src/client/conversation/assembler.ts` | 节点装配主入口 |

72 个里有 **9 个是文案字典**（`locales.ts` / `locale.ts` / `task-manager-locales.ts` / `frequency-locales.ts` / `guide-locales.ts` 一类，合计 12,364 行，占这 72 个文件的 36%），真实「超长逻辑文件」63 个。超过 1,000 行的文件共 21 个（其中 5 个是文案字典），集中在 `ui-chat`、`ui-conversation`、`ui-plugin-manager`、`ui-slots`、`api/gateway`、`boot/app-boot`。

**2) 切片边界与任务描述不符**

`packages/client` 的 3,369 条记录被切在 **`packages-02` 与 `packages-03`** 之间，而不是任务里说的 01/02。后果：`ui-theme` 在本次清单里只剩 8 个 locale 加 `package.json`（9 文件 / 129 行），`src/`、`tests/`、`README` 全部在下一片；`packages/client/package.json` 本身也不在这一片。§73 已按「切片不完整」标注，未按完整包统计。这不是清单错误，是两个阶段的分配口径差别。

**3) `ui-deliverables` 存在同名双份（待确认）**

`src/present-open.ts`（187 行）与 `src/client/present-open.ts`（153 行）同名不同体，同包内 host 半边与浏览器半边各一份。符合本仓库「同一能力在 host / client 两侧成对出现」的惯例，但两份体量差 34 行，**无法仅凭清单判断是职责不同的两侧实现，还是重复实现**。已在该小节标「待确认」，需要读实现或看 import 关系才能定论。

**4) 空文件 26 个，其中 1 个是源码级的空测试**

25 个是二进制资源（`.webp` / `.png` / `.docx` 等，清单把行数记 0），属正常。**异常的是 `ui-chat/tests/event-projection.client.spec.ts`：0 行、0 字节**。同目录其它 spec 都有内容，这个文件像是建好后未写入。已标「待确认」，建议核实是遗留占位还是采集遗漏。

**5) 样板文件大面积逐字节相同**

| 模式 | 份数 | 判定 |
|---|---:|---|
| `tsdown.config.ts`（125 B / 3 行） | 52 份完全相同 | 打包入口样板，复制粘贴成本低于抽公共包，属可接受的重复 |
| `css-modules.d.ts`（123 B / 6 行 与 99 B / 4 行、109 B / 4 行三个变体） | 34 + 11 + 2 = 47 份 | CSS Modules 类型声明样板，三个变体说明曾分批生成，未统一 |
| `tsdown.config.ts`（165 B / 7 行、146 B / 3 行、132 B / 6 行） | 7 + 2 + 6 份 | `api` 与 `client` 两族各有一套，同族内一致 |

`css-modules.d.ts` 出现三个不同体量，说明这条样板经历过演进但没有回填，属于**轻微技术债**，不影响运行。

**6) 疑似复制实现（待确认）**

`ui-attachment/src/index.ts` 与 `ui-file-drag/src/index.ts` 的字节数（183）与行数（4）完全相同，两者都是「注册插件 + 导出」的极薄入口。两个包职责不同，入口同形合理；但**字节数完全一致意味着逐字节相同**，按复制模板生成的可能性大。已标「待确认」，未按重复实现上报。

**7) 无 locale 的包共 8 个**

`attachment/attachment`、`boot/app-boot`、`bundle/base`、`bundle/sdk-minimal`、`client/store`、`ui-dockkit`、`ui-primitives`、`ui-slots`。前四个与 `client/store`、`ui-slots` 属纯宿主或纯逻辑包，不出界面，无 locale 合理；**`ui-primitives` 与 `ui-dockkit` 是出界面的包却没有 locale**，说明它们的可翻译文案为空（`ui-primitives` 的文案由调用方传入），这是设计约定而非缺漏。

**8) 命名不合规 / 不一致**

- `ui-chat/src/client/locale.ts`（单数）vs 其余 50 多个包的 `locales.ts`（复数）。
- `ui-schedule/src/client/task-manager-locales.ts`：文案字典没有走 `locales.ts` 的约定名，且与同包其它文件命名风格不一致。
- `packages/browser-use/browser-use`：**双层同名目录**，包边界在外层 `browser-use`，内层才是包。整个包只有 16 文件 / 442 行，与 `ui-sidebar-browser`（53 文件 / 3,845 行）形成强对照，`待确认` 真实浏览器能力是否在别处实现。

**9) 测试资产占比异常高**

`ui-primitives` 的 140 条测试记录里有 48 条是 `tests/fixtures/markdown-dom/` 下的 DOM 快照 fixture，`ui-settings-account` 的 72 条测试里 47 条是 `tests/expected/` 下的期望输出。两者的「测试文件数」被 fixture 显著放大，实际用例数远低于清单行数。看测试规模时应以「用例文件」而非「路径数」为准。

**10) 视觉资源全部集中在 6 个目录**

133 条非代码资源记录中，`ui-primitives/tests/fixtures/markdown-dom` 48、`ui-settings-account/tests/expected` 47、`ui-settings-account/src/client/assets` 14（新手引导插画，含中英文与深浅色四套）、`ui-sidebar-documentpreview/tests/fixtures/{excel-xml,excel-opc}` 14、其余零散 10。仓库没有字体文件、没有图标位图——图标走 `ui-theme` 的 sprite 符号表，这是「令牌化 + 矢量」路线的直接证据。
