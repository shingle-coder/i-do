# 协作、调度与后台任务

本文覆盖 `packages/subagent`、`packages/team`、`packages/schedule`、`packages/jobs`、`packages/spill`、`packages/feedback` 六个包组的实际实现。所有结论以源码为准；包名与实际职责不一致的地方会直接指出。确认不了的部分集中放在最后一章「待确认」。

仓库全景与插件化架构见 [project-overview.md](../project-overview.md)。

## 1. 六组包的职责定位

| 包组 | 子包 | 对外契约 | 一句话职责 |
| --- | --- | --- | --- |
| `subagent` | `subagent`、`tool-subagent`、`tool-subagent-control`、5 个 provider | `ctx.subagents` | 子代理派生、执行、结果回收与生命周期 |
| `team` | `agent-team`、`tool-agent-team` | `ctx.agentTeams` | 子代理树内的共享任务 DAG 与变更等待 |
| `schedule` | `schedule`、`tool-schedule` | `ctx.schedule` | Host 级持久定时任务与投递 |
| `jobs` | `jobs`、`jobs-local`、`tool-jobs` | `ctx.jobs` | 会话级的长时间后台任务登记、轮询与取消 |
| `spill` | `spill`、`spill-local`、`spill-policy` | `ctx.spillStore` | 超大工具结果落盘，模型侧换成可回收的定位符 |
| `feedback` | `message-feedback`、`command-feedback` | 会话事件 + `sessionFeedback` Remote | 人类反馈写入会话日志，不进入模型上下文 |

一个容易被误读的点：`spill` 不是「溢出/降级」之类的调度概念，它的实际含义是**把超出 token 预算的工具结果外溢（spill）到磁盘**，见第 6 章。`feedback` 也不是遥测上报，而是**只写会话日志、不联网**的本地反馈，见第 7 章。

## 2. subagent：子代理机制

### 2.1 分层结构

`subagent` 包本身只定义 seam，不跑子代理；真正跑子代理的是 provider 包：

| 包 | 执行位置 | 子代理上下文 | 说明 |
| --- | --- | --- | --- |
| [subagent-spawn-in-process](../../../packages/subagent/subagent-spawn-in-process/) | 同进程 | 全新上下文 | 在 `ctx.agents` 上创建全新子 Agent |
| [subagent-fork-in-process](../../../packages/subagent/subagent-fork-in-process/) | 同进程 | 用父日志前缀播种 | 子代理已看到父会话「已完成的轮次」 |
| [subagent-dsh-sdk](../../../packages/subagent/subagent-dsh-sdk/) | 子进程 | 由被驱动运行时决定 | 通过 TypeScript SDK 以 stdio JSON-RPC 驱动另一个 Harness 运行时 |
| [subagent-acp](../../../packages/subagent/subagent-acp/) | 子进程 | 由后端决定 | Agent Client Protocol |
| [subagent-codex](../../../packages/subagent/subagent-codex/) | 子进程 | 一次性 | 官方 app-server 协议 |
| [subagent-claude-code](../../../packages/subagent/subagent-claude-code/) | 子进程 | 一次性 | 官方 Agent SDK |

模型可见的工具在 [tool-subagent](../../../packages/subagent/tool-subagent/src/index.ts)（默认工具名 `subagent`），工具侧只管参数与预检，执行、容量、结果投递全部由 `subagent` 核心里 [manager.ts](../../../packages/subagent/subagent/src/manager.ts) 负责。

### 2.2 派生链路

一次派生的完整链路：

1. 模型调用 `subagent`，参数为 `description`（必填，3-5 词显示用）、`prompt`（必填，任务本体）、可选 `name`、`cwd`、`agent_preset`；开启 `modelSelection` 时还有 `provider` / `model` / `reasoning_effort`。
2. 工具 `execute` 做三件同步/半同步准备：解析子代理 preset、预检子 LLM 路由（`preflightChildLlmRoute`）、解析 `maxDepth`。
3. 调用 `ctx.subagents` 的 start 接口，进入核心 `manager`。
4. `manager` 校验深度、预留容量槽、构造子会话 metadata、按 provider 创建子 Agent，并立即返回。
5. 工具立即返回 `{ kind: 'activation', name }`，渲染成 `started subagent <name>`。

关键点：**工具调用本身不等子代理完成**。`isConcurrencySafe: () => true`，模型可以在同一轮里连续派生多个子代理；完成信息靠运行时的「结算通知」异步送回父会话（见 2.6）。

### 2.3 命名规则

名字由 [tool-subagent](../../../packages/subagent/tool-subagent/src/index.ts) 的 schema 约束并在核心侧校验：

- 小写字母、数字、连字符，必须以字母开头，最长 32 字符；
- 同一父代理下唯一；`lead` 保留给根代理；
- 省略时按 `agent-1`、`agent-2` 递增分配。

名字进入父会话日志的 `subagent/catalog` 事件（版本 3），是父代理后续 `send_message`、`list_agents` 的唯一句柄来源。路径形式为斜杠分隔的父子链（`root/child/grandchild`）；链路中任一层无名时整体 `path` 为 `undefined`。

### 2.4 深度与并发：两个硬上限

这两个上限是理解本项目协作能力的关键，也都**不做排队**。

深度（[depth.ts](../../../packages/subagent/subagent/src/depth.ts)、[child-agent.ts](../../../packages/subagent/subagent/src/child-agent.ts#L49-L58)）：

- 子深度 = 父深度 + 1，父深度从会话 header 的持久字段 `delegationDepth` 读出，因此**恢复后的父代理不会退化成顶层**，深度是单调下限。
- 全局配置项 `maxDepth` 默认 `1`，即默认只允许一层派生（父 → 子），子的子会被拒绝并抛 `SubagentDepthError`。
- `maxDepth: 'provider-managed'` 用于进程外后端，表示不施加数字上限，递归预算归子运行时自己管；此时工具挂载阶段会校验 provider 是否声明 `depthLimit` 能力，不声明则直接挂载失败（fail loud）。

并发（[activation.ts](../../../packages/subagent/subagent/src/activation.ts#L14-L35)）：

- `ActivationPool` 是**进程内、按 subagent 树共享**的容量池，池按树的根 Agent 绑定，兄弟与后代共用同一份额度。
- 配置项 `maxActiveSubagents` 默认 `8`，且是 volatile 配置（改动即时生效，下一次预留就用新值）。
- 满额时 `reserve()` 直接抛 `ACTIVATION_LIMIT_REACHED`，错误文案要求模型「等待已有子代理结束，或用现有代理完成任务」。**没有等待队列，也没有背压**。
- 容量槽在整个「驻留期（epoch）」内占用，释放发生在 handle 完成 dispose 之后，而不是子代理最后一次输出时。

### 2.5 上下文怎么传、权限怎么收

子会话是**独立的 Session**，通过 `ctx.agents.create()` 的 meta 建立，字段见 [child-agent.ts](../../../packages/subagent/subagent/src/child-agent.ts#L135-L154)：

| meta 字段 | 取值 | 作用 |
| --- | --- | --- |
| `cwd` | 继承父 header 的 `cwd`（工具可覆盖） | 初始工作目录；之后两边各自独立 |
| `agentPreset` | 显式选择，或继承父当前 composition | 子代理挂载的预设/工具面 |
| `parentSession` | 父会话 id | 血缘 |
| `isSeeded` | 是否播种了父日志前缀 | fork 为真 |
| `origin` | 固定 `'subagent'` | 导航分类，不承载语义 |
| `delegationDepth` | 子深度 | 持久化递归预算 |

上下文继承的边界由 provider 的 `inheritsParentContext` 决定，工具文案随之切换（[tool-subagent](../../../packages/subagent/tool-subagent/src/index.ts#L116-L136)）：

- `spawn`：全新上下文，`prompt` 必须自包含；
- `fork`：子代理看到父会话**已完成的轮次**，但**看不到正在进行中的当前轮**；`prompt` 只需说明新增部分。

无论哪种，子代理都拿不到父代理的工具调用中间结果、推理过程。

权限在派生瞬间被「冻结」（[child-agent.ts](../../../packages/subagent/subagent/src/child-agent.ts#L249-L256)）：

- `approvalPolicy`：只要组合了审批能力，就固定为 `'never'`。子代理的审批请求会被确定性拒绝，因此**无法从子会话内部扩权**。
- `sandboxMode`：只捕获父会话**显式设置**的 sandbox override，不继承部署默认值与一次性授权。
- `permissionPreset`：只透传 `auto` 或 `danger-full-access` 这两个身份，且子代理仍受 `never` 审批策略约束。
- 同时向子会话注入一条运行时上下文 `SUBAGENT_DELEGATION_CONTEXT`，明确告知模型「权限在启动时固定，不要重试被拒绝的操作，把限制写进回答」。

这块的实现刻意在第一个 `await` 之前同步采样，避免父代理在派生过程中切换权限导致语义漂移。

### 2.6 结果怎么回收

子代理不把 transcript 回传给父代理。结算时由运行时构造一条**用户消息形态的结算通知**写入父会话（[continuation-messages.ts](../../../packages/subagent/subagent/src/continuation-messages.ts#L141-L175)）：

- `source.kind = 'subagent-settled'`，`source.form = 'notice'`，带 `stopReason` 与发送方 `sessionId`；
- 正文依次是：一句按 `stopReason` 生成的状态摘要（`completed` / `aborted` / `max-tokens` / `refusal` / `error` / 未知）、子代理的收尾文本、结构化结果 `structured`（如有）、诊断信息；
- 摘要会区分「还能继续对话」与「不能再收消息」；
- 若子代理**在结束前最后一件事是给父代理发消息**，结算通知会省略收尾文本，只留「它刚刚发过消息」——避免同一份结论出现两遍；
- 子代理启动时也会收到一段自动投递说明，要求它把结论与证据写进最终回答，因为父代理拿不到工具输出和推理。

投递目标由 `delivery: 'parent' | 'caller'` 决定：后台派生走 `parent`（父会话收通知），同步等待型走 `caller`（调用方直接拿结果）。

### 2.7 边界与隔离程度

| 维度 | 隔离情况 | 说明 |
| --- | --- | --- |
| 会话 | 独立 | 独立 `SessionId`，独立日志文件；父会话只记录 `subagent/catalog` 事实 |
| 上下文 | 弱隔离 | `spawn` 完全独立；`fork` 播种父日志前缀，能看到父已完成轮次 |
| 工具面 | 半共享 | 默认继承父 preset 的 composition；可用 `toolFilter` 收窄；不能自行扩权 |
| 权限 | 单向收紧 | 审批钉死 `never`，sandbox 只继承显式 override |
| 进程 | 视 provider | in-process 共享进程与事件循环，OOP provider 才真正跨进程 |
| 容量 | 树内共享 | 同树所有成员抢同一份 `maxActiveSubagents` |
| 存储 | 共享 workspace | 子会话写在同一 workspace 的会话库里，父代理可直接读取 |

需要强调：**in-process 子代理不是安全沙箱**。它们共享同一个 Node 进程、同一份 Host 服务与同一套注册表，隔离手段只有会话边界、工具过滤与审批策略，而不是进程边界。

### 2.8 持久化与恢复

- 父会话日志：`subagent/catalog` 事件（版本 3，含 `childId`、`mode`（`continuable` / `external`）、`label`、`name`），由 [catalog.ts](../../../packages/subagent/subagent/src/catalog.ts) 用分块列表（chunked list）折叠成投影 `subagentCatalog`（stateVersion 6）。
- 子会话日志：`subagent/descriptor` 记录 mode、preset、toolFilter、persona 等，**descriptor 才是 mode 与「能否继续对话」的权威**，catalog 只负责发现。
- 冷恢复：恢复一个历史子代理时会按 descriptor 重放 persona 与工具过滤；`delivery: 'caller'` 的冷恢复在容量已满时直接失败（`subagent/delivery-unavailable`），其它错误码见 [control-types.ts](../../../packages/subagent/subagent/src/control-types.ts)。

### 2.9 控制面工具

派生之后如何干预，全在 [tool-subagent-control](../../../packages/subagent/tool-subagent-control/src/index.ts)：

| 工具 | 作用 | 注意点 |
| --- | --- | --- |
| `send_message` | 给指定子代理发消息 | 只对仍在运行的运行时可投递；目标按名字解析 |
| `list_agents` | 列出当前树的成员与状态 | 数据源是 catalog 投影，不是进程扫描 |
| `wait_agent` | 等目标「有新输入到达」，带超时 | 监听 `agent/inbox/inserted`，超时返回 `timedOut: true`；不是等「完成」 |
| `interrupt_agent` | 中断目标 | 明显的破坏性操作，需审批 |

`wait_agent` 的语义容易被误解：它等的是**目标 inbox 收到新消息**（通常就是结算通知），返回值 `{ timedOut }` 不携带结论，结论仍要从会话/通知里取。

## 3. team：多代理协作

### 3.1 没有「角色系统」

先纠正一个常见期待：`team` 里**不存在角色（role）定义**。它的模型是「隐式团队」：

- 团队身份就是**根 Session 的 id**，没有独立的团队注册表、没有成员表、没有角色字段；
- 团队成员就是 subagent catalog 里的 `continuable` 子代理，成员能力、权限、上下文全部沿用第 2 章那套；
- 「角色」只能靠派生时的 `description` 与 `prompt` 表达，属于提示词约定，不是结构化数据。

[agent-team](../../../packages/team/agent-team/src/types.ts) 里保留了历史兼容说明：`team/member`、`team/message/queued`、`team/message/delivered` 这些事件是**旧版遗留**，新代码改用 Agent inbox 与 `subagent/catalog`。读到这些事件名时不要误以为还有一套 Team 消息总线。

团队开关按根会话记录：`team/mode` 事件（`{ enabled }`），配置项 `defaultEnabled` 默认 `false`。工具在 `isTeamRoot` 时才挂载，因此**子代理默认拿不到 Team 工具**。

### 3.2 数据模型

[types.ts](../../../packages/team/agent-team/src/types.ts) 定义的 `TeamTaskSnapshot`：

| 字段 | 说明 |
| --- | --- |
| `id` | `task-<n>`，团队内递增，不复用 |
| `revision` | 每次成功变更 +1，用于 CAS |
| `subject` | ≤ 200 字符 |
| `description` | ≤ 16384 字符 |
| `status` | `pending` / `in_progress` / `completed` / `deleted`（墓碑，保留可查） |
| `ownerId` / `ownerName` | 认领者；`ownerName` 是其代理路径 |
| `blockedBy` | 依赖的其它任务 id 列表 |
| `writeScopes` | 声明会写的路径/范围，仅做规范化去重与告警 |

全部任务存在**根会话日志**里（`team/task` 事件，版本 2），由投影折叠成 `agentTeam` 供浏览器读取；`failure` 字段表示第一条被拒绝的记录，投影随后停在最后一个有效状态。

### 3.3 任务怎么分派

分派只有三条路径：

1. **Lead 建任务**：`team_task_create`，任务以 `pending` 落库，不指定 owner。
2. **成员认领**：`team_task_update` 的 `claim`，要求 `status === 'pending'` **且** 所有 blocker 已完成（`taskReady`），否则 `TEAM_TASK_BLOCKED`；已被别人认领则 `TEAM_TASK_ALREADY_CLAIMED`。
3. **Lead 指派**：`reassign` 直接指定 owner，owner 必须能通过 `resolveAssignee` 解析成**可继续对话的后代代理**（`mode === 'continuable'`，且属于本树的 `listDescendants`），否则 `TEAM_MEMBER_NOT_FOUND`；指派后直接进入 `in_progress`。

`reassign` 只有 Lead 能做（`TEAM_LEAD_REQUIRED`）。`claim` / `release` / `edit` / `set_dependencies` / `complete` / `reopen` / `delete` 要求**要么是 Lead、要么是当前 owner**（`TEAM_TASK_UNAUTHORIZED`）。

### 3.4 冲突怎么处理

冲突处理分三层，强度递减：

| 层 | 机制 | 冲突时的行为 |
| --- | --- | --- |
| 写入序列化 | `TeamJournal.transact(rootId, …)` 以根会话 id 为键串行化事务 | 同队变更排队执行，不会交错 |
| 乐观并发 | `expectedRevision` 与当前 `revision` 比对 | `TEAM_TASK_STALE_REVISION`，不写入任何字段 |
| 作用域冲突 | `writeScopes` 重叠检测 | **只告警，不阻断**认领或完成 |

要如实说明的是：

- `TeamJournal` 是**进程内 Promise 串行队列**（每个根一个队列尾部），不是跨进程锁。多 Host 同时写同一 workspace 时它不提供互斥。
- `writeScopes` 是协作约定，不是文件锁；真正的互斥仍要靠工具层或人。
- 依赖图只做静态校验（自环 `TEAM_TASK_DEPENDENCY_CYCLE`、未知或已删 blocker `TEAM_TASK_NOT_FOUND`、重复 `TEAM_INVALID_ARGUMENT`、仍有后继时删除 `TEAM_TASK_HAS_DEPENDENTS`），**不会主动唤醒等待者**——`pending` 是否「可做」是派生视图，成员必须自己 `list`/`get` 轮询。
- 落盘是 `appendAndFlush` 同步确认；flush 失败会抛 `TEAM_TASK_PERSISTENCE_UNCONFIRMED`，语义是「内存里可见但未确认持久化」，正确做法是先 `get` 再决定重试。

### 3.5 有没有共享状态

有且只有一份：**根会话日志中的任务表**。具体边界：

- 共享的：任务清单、状态、owner、依赖、作用域声明；
- 不共享的：对话上下文、工具输出、文件系统锁、内存对象；
- 任务表上限 `maxTasks` 默认 `256`（按未删除任务计），超限 `TEAM_TASK_LIMIT`。

所以「多代理协作」在本项目里是**共享任务板 + 私有上下文**，不是共享工作区。

## 4. schedule：定时任务

### 4.1 与 jobs 的根本区别

`schedule` 是 **Host 级、持久、跨会话**的定时投递：任务在 Host 任务存储里（`defineDomain` 注册的 storage domain），与任何 Session 的激活状态无关；应用重启后任务仍在，由 Host 重新装载并重新计时。

它的执行模型很朴素：**到点往目标会话的 inbox 投一条消息**，不是「跑一个作业」。消息投进 inbox 并被确认，就算一次投递完成；模型之后怎么处理、跑多久，schedule 不关心。

### 4.2 表达式格式：RFC 5545 子集，不是 cron

工具参数 `rrule` 不是 cron 表达式，而是「一行 DTSTART + 换行 + 一行 RRULE」（[tool-schedule](../../../packages/schedule/tool-schedule/src/index.ts#L212-L226)）：

```
DTSTART;TZID=Asia/Singapore:20260901T080000
RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1
```

支持的子集与硬约束：

| 约束 | 内容 |
| --- | --- |
| DTSTART | 必须是存在的本地时间；`Z` 结尾表示 UTC，或带 `TZID`（IANA 时区） |
| 时区偏移 | 固定偏移要写成 `Etc/GMT-5` 这类反向符号形式 |
| DST | 带 `TZID` 时保持本地钟面时间；生成的不存在时刻跳过，重复时刻只取**较早的那个瞬间** |
| 过去时间 | DTSTART 可以在过去，投递从创建后的第一次出现开始 |
| 一次性投递 | `FREQ=DAILY;COUNT=1` |
| 不支持 | `SECONDLY`；`BYSECOND` 只接受一个值 |
| 上限 | `COUNT` ≤ 1000（更长用 `UNTIL`）；每个 FREQ 周期在 `BYSETPOS` 前最多 10080 个候选；`BYSETPOS` ≤ 31 个值 |
| 组合限制 | `MINUTELY`/`HOURLY` 不接受 BY 部分；`BYMONTHDAY` 与序数 `BYDAY` 需 MONTHLY/YEARLY；`BYYEARDAY`/`BYWEEKNO` 需 YEARLY；序数 `BYDAY` 不能与 `BYWEEKNO` 同用 |
| UNTIL | 必须是 `Z` 结尾的 UTC 瞬间 |

服务端类型 `ScheduleTiming` 同时保留结构化形式（相对秒数、绝对时间、间隔等），`rrule` 只是其中一种 `kind`；工具层负责把模型给的字符串翻译成 `{ kind: 'rrule', rrule }`。

### 4.3 目标与执行

`target` 三选一：

| 取值 | 行为 |
| --- | --- |
| `this_session` | 投回调用方所在会话；若该会话是子代理，会被拒绝 |
| `new_once` | 预留一个新会话，投一次 |
| `new` | 首次投递时创建一个会话并复用；两次投递之间至少间隔 `newSessionIntervalSeconds` |

`new_once` / `new` 在创建时**捕获**当时的 `cwd` 与 preset，之后改调用方不会影响目标。

触发机制（[runtime.ts](../../../packages/schedule/schedule/src/runtime.ts#L196-L225)）：

- **没有轮询 tick**。整个 Host 只有**一个** `setTimeout`，延时取所有 active 任务中「最早的下次到期时间」与「最早的可投递时间」的较小值，并且 `unref()`，不阻止进程退出；
- 延时被 `MAX_TIMER_DELAY_MS`（`2_147_483_647`，约 24.8 天）截断，远期任务先睡到上限再重排；
- 每次到期重新扫描全部任务，**同一目标会话的多个到期周期任务合并成一条批量消息**（`renderRecurringReminderBatchFraming`），只有一个 `messageId`；
- 非 `new` 目标的任务在投递后被「占槽」（`executing`），直到目标代理空闲才释放；`new` 目标的投递可以并行，不占槽；
- 合并投递时每个任务只推进到**最近一次已错过的出现**（`resolveRecurringOccurrence`），停机期间欠下的多次出现不会逐条补投。

### 4.4 执行记录

- 任务记录本身带 `lastDelivery`（`messageId`、`targetSessionId`、`deliveredAt`、`scheduledAt`）与 `nextOccurrence`；
- 另有独立的**投递历史**（`ScheduleDeliveryRecord` / `ScheduleDeliveryHistoryPage`），带分页与保留上限（`DeliveryRetentionBounds`，按天数与条数裁剪，超出会置 `retention` 标记）；
- `executionActive` 表示「最近一次投递仍在目标会话里排队或运行」；`deliveryFloorEndsAt` 表示最小投递间隔的结束时刻。

状态只有三种：`active`（有计时义务）、`paused`、`ended`。

### 4.5 失败与重试

必须说清楚：**schedule 没有重试策略，也没有退避**。

- 投递失败时只 `logger.warn`，把仍未确认的任务 id 返回给调度循环，这一轮不再重排它们；下一次 `requestDrive`（新事件或新计时）才会再试；
- 没有尝试次数、没有指数退避、没有死信队列；
- Host 重启后，`recoverOutstandingExecution` 会去目标会话里确认上一条消息是否还在排队，以此决定是否继续占槽；已归档的目标会话会直接放弃该次投递；
- 删除任务**不会撤回**已经排进 inbox 的消息（工具描述里明确写了）。

模型侧工具为 `schedule_create` / `schedule_list` / `schedule_view` / `schedule_edit`。`schedule_edit` 只有 `update` 与 `delete` 两个 action，用 `active: false/true` 实现暂停与恢复（恢复要求计时还有未来出现），用 `expectedUpdatedAt` 做 CAS，冲突返回 `schedule_conflict` 且不落任何变更。

## 5. jobs：后台任务

### 5.1 职责与实现分层

`jobs` 是**会话级的长时进程登记表**，不是任务调度器：

- [jobs](../../../packages/jobs/jobs/src/) 只定义 seam：`JobKind` 注册、访问请求（owner 归属）、快照与视图类型；
- [jobs-local](../../../packages/jobs/jobs-local/src/index.ts) 是进程内实现，内置 `bash` kind，真正 spawn 子进程、收流、维护输出环形缓冲；
- [tool-jobs](../../../packages/jobs/tool-jobs/src/index.ts) 提供 `job_output`、`job_list`、`job_kill` 三个模型工具。

与 schedule 的对照：

| 维度 | `schedule` | `jobs` |
| --- | --- | --- |
| 触发 | 时间（RRULE） | 模型发起，立即可用 |
| 生命周期 | 持久，跨重启 | **仅内存**，Host 重启即丢 |
| 执行体 | 投一条会话消息 | 真实子进程 |
| 归属 | Host 全局 | 单个 Session（owner） |
| 数量上限 | 无硬上限 | 每 owner 默认 10 个并发 |
| 失败处理 | 只记日志，等下轮 drive | 记为 `settled` + `failed` 结果 |

### 5.2 队列模型：没有队列

这是最容易理想化的地方，实际情况是：

- **不存在等待队列**。`start` 立即拉起进程，并发占用是瞬时判定的。
- 超过 `maxConcurrentJobsPerOwner`（默认 `10`，按 owner 会话计）时直接抛 `JOB_LIMIT_REACHED`，错误文案引导模型「先 kill 或等待已有任务，再重试」。
- 每个子代理会话是独立 owner，因此**子代理有自己的一份额度**，互不影响；这也意味着大量子代理并发时进程总量没有全局闸门。
- 任务不排队、不抢占、不做优先级。

### 5.3 所有权围栏

每次访问都带 `JobAccessRequest`，其 `owner` 是创建时的 `SessionId`，并且 `restart` 能力声明为不支持（`needsReattach: false`）。效果是：

- A 会话看不到、也杀不掉 B 会话的任务；
- 子代理不能接管父代理的后台任务；
- 冷恢复后任务不再可用，因为进程句柄本来就没落盘。

### 5.4 状态流转

`JobStatus`（[view.ts](../../../packages/jobs/jobs/src/view.ts#L16-L37)）：

| 状态 | 含义 |
| --- | --- |
| `running` | 进程在跑，`startedAt` 有值 |
| `stopping` | 已请求终止（`job_kill`），尚未结算 |
| `settled` | 已结算，`outcome` ∈ `completed` / `killed` / `failed`，带 `exitedAt` |

配套字段：`exitCode`、`failure`（未预期错误，与 `outcome: 'failed'` 同时出现）、`output`（环形缓冲视图：`retainedBytes`、`droppedBytes`、`truncated`、`cursor`）、`outputSpill`（落盘文件，结算后才有）。

流转只有两条路径：自然退出 → `settled`；`kill` → `stopping` → `settled{killed}`。没有 `paused`、没有 `retry`。

### 5.5 输出与通知

- 输出进**环形缓冲**，活跃期保留 `retainBytes`（默认 256 KiB），结算后压缩到 `settledRetainBytes`（默认 16 KiB），超出部分标记 `truncated` 并累加 `droppedBytes`；
- 结算时把完整输出落盘，`outputSpill` 指向文件，保证历史回退再前进时仍能读到；
- 轮询 pull 型数据源的间隔 `pumpPollMs` 默认 150 ms；
- 会话日志写入 `job/registered` 与 `job/settled` 两条事件；结算会向 owner 会话的 inbox 插一条通知（`agent/inbox/spliced`），模型由此知道任务结束；
- `workspace/session-activity` 的 `SessionActivityKindMap` 包含 `'job'`，侧边栏能显示「正在跑后台任务」。

## 6. spill：超大工具结果外溢

### 6.1 名字的含义

`spill` 不是调度或缓存概念，而是**把超出 token 预算的工具结果写到磁盘，用一段可回收的提示替换掉原文**。这样长输出（`web_fetch`、大文件读取、构建日志）不会一次性撑爆上下文，但仍可被模型用 `read`/`grep` 按需取回。

三个包分工：

| 包 | 职责 |
| --- | --- |
| [spill](../../../packages/spill/spill/src/types.ts) | seam：`SpillStore`、`SpillRef`、`SpillError` |
| [spill-local](../../../packages/spill/spill-local/src/index.ts) | 本地文件后端：写文件、返回路径与取回提示、启动期清理 |
| [spill-policy](../../../packages/spill/spill-policy/src/index.ts) | 工具结果后置策略：按 token 预算裁剪并调用 `SpillStore` |

### 6.2 触发点与预算

`spill-policy` 注入 `tools`，挂在**工具结果后置钩子**上（`PostToolDecision` / `ToolExecution`），处理的是「已被接受的结果」以及 PTC 的日志副本。

- 预算单位是 **token**，不是字节：配置项 `maxInlineTokens`，估算时**把图片描述符与省略通知本身也算进去**；
- 未配置 `maxInlineTokens` 时整个插件不生效，结果原样保留；
- 只处理 `text` 与 `image` 两种 block；遇到其它 block 类型直接放弃裁剪，保留原文（fail-open）；
- 落盘失败或拿不到附件访问能力时同样保留原文，并把原因写日志。

### 6.3 模型看到什么

被裁减后，模型看到的是一段「首部 + `[...]` + 尾部」的内容，末尾追加：

```
(Omitted 12345 bytes. Full formatted result stored at: /…/session-<hash>/<random>-web_fetch.txt. Use read with offset/limit, or grep this path to search within it.)
```

图片则整体省略，只留 `Omitted N images.`；原文中的图片落到附件存储，通过 `resolveImageAttachmentAccess` 给出的地址取回。定位符对消费方是**不透明句柄**：只渲染、不解析（`SpillRef` 的 `locator` / `bytes` / `retrievalHint` 三字段约定）。

### 6.4 存储布局与清理

`spill-local`：

- 默认根目录是**按进程惰性创建的私有临时目录**（权限 0700），可用 `root` 覆盖；相对路径按进程工作目录解析；
- 布局 `<root>/session-<hash>/<random>-<safeName>`，`session-<hash>` 是会话 id 的短哈希，便于整会话清理；文件名是不可预测的十六进制前缀 + 清洗后单段文件名；
- 每次 `saveText` 写新文件，返回精确 UTF-8 字节数；
- 启动时做**一次**清理扫描（`cleanupPeriodDays` 默认 30，`0` 关闭），仅清理不被符号链接逃逸的过期文件，运行期不再清理。

需要点明：**spill 文件不随会话删除而立即清理**，靠天数过期。这对隐私敏感数据是一个真实风险点。

## 7. feedback：人类反馈

### 7.1 收集什么

两个包收集的是两类不同的东西：

| 包 | 输入 | 事件 |
| --- | --- | --- |
| [command-feedback](../../../packages/feedback/command-feedback/src/index.ts) | `/feedback <text>` 斜杠命令，或 UI 直接调用服务 | `feedback/record` |
| [message-feedback](../../../packages/feedback/message-feedback/src/index.ts) | 对单条助手消息的赞/踩 + 可选备注 + 可选分类 | `feedback/message-put` / `feedback/message-delete` |

分类是固定枚举（顺序即产品展示顺序）：`task-result`、`instruction-following`、`product-interaction`、`service-stability`、`resource-cost`、`security-privacy-permission`、`other`。

备注有硬约束：`maxNoteBytes` 为**必填**配置（正整数），空白备注按 `note-blank` 拒绝，超长按 `note-too-large` 拒绝并回传 `maxBytes`/`actualBytes`。它对单条备注限长，不限制日志总量。

### 7.2 流向哪里

只有一个方向：**写进会话日志，从此留在日志里**。

- 两类事件都在 `SessionEventMap` 里声明为「log-only」，**永远不会进入模型历史**；它们不产生消息、不参与上下文组装；
- `feedback/message-delete` 只追加「删除事实」，早先的评分与备注仍留在日志中（不可撤回）；
- 派生（fork）会话里继承来的反馈，归属仍是**父会话**（`MessageFeedbackPut.sessionId` 是 owner）；
- 对外只有读取接口给 UI 用：message-feedback 的 `list` 服务 + Remote API 的 `sessionFeedback.record`；
- **没有任何上传、遥测或外发通道**，包内不存在网络调用。想汇总反馈只能自己读日志。

## 8. 与核心运行时、会话存储的交互点

### 8.1 依赖注入面

各包 `inject` 声明决定了它们能碰到哪些核心服务：

| 包 | 注入 | 用途 |
| --- | --- | --- |
| `subagent` | `agents`、`sessions`、`tools`、`llm` | 建子会话、派生子 Agent、预检路由、挂载工具 |
| `agent-team` | `agents`、`sessions`、`subagents` | 解析可继续对话的后代、读根会话日志 |
| `schedule` | `agents`、`sessions`、`storageDomain`、`sessionPersistence` | Host 级持久化、目标会话创建与恢复 |
| `jobs-local` | `sessions`、`tools` | 进程与输出环、向 owner 会话写通知 |
| `spill-policy` | `tools` | 挂工具后置钩子 |
| `command-feedback` | `commands` | 注册 `/feedback` 斜杠命令 |

### 8.2 会话日志事件

这六组包往会话日志里写的事件（都属于「事实记录」，多数是 log-only，不参与模型上下文）：

| 事件 | 写入方 | 作用 |
| --- | --- | --- |
| `subagent/catalog` | 父会话 | 子代理名册（v3），投影为 `subagentCatalog` |
| `subagent/descriptor` | 子会话 | 子代理身份与 mode/preset 权威记录 |
| `team/mode` | 根会话 | 团队模式开关 |
| `team/task` | 根会话 | 任务表变更（v2），投影为 `agentTeam` |
| `job/registered` / `job/settled` | owner 会话 | 后台任务登记与结算 |
| `feedback/record` | 任意会话 | 斜杠命令反馈 |
| `feedback/message-put` / `feedback/message-delete` | 任意会话 | 单条消息评分 |

`schedule` 是唯一**不写会话日志**的：它的任务与投递历史都在 Host storage domain 里（`scheduleDomain`），会话只是投递目标。

### 8.3 共享的运行时钩子

多个包同时挂在同一组 workspace 钩子上，这既是协作点也是耦合点：

| 钩子 | `subagent` | `schedule` | `jobs` |
| --- | --- | --- | --- |
| `workspace/session-activity` | 追加 `kind: 'subagent'` 的条目 | 读它判断目标忙碌、决定是否占槽 | 追加 `kind: 'job'` 条目 |
| `workspace/session-stop` | 取消该会话所有运行中的子代理 | 释放占槽 | 随会话停止处理 |
| `agent/pre-step` | 祖先已归档则拒绝下一步 | — | — |

`agent/pre-step` 那条尤其关键：**会话被归档后，其子代理链上的任何 Agent（包括已被释放的会话）都不能再继续**，这保证了归档的「工作整体停止」语义。

### 8.4 消息投递

所有「异步结果」都走同一个通道：目标会话的 **inbox**。

- 子代理结算 → 父会话 inbox 一条 `notice` 形态用户消息；
- 后台任务结算 → owner 会话 inbox（`agent/inbox/spliced`）；
- 定时任务到期 → 目标会话 inbox 一条（或多条合并成一条）提醒消息。

区别在语义：inbox 确认只代表**消息进队**，不代表模型已执行；`wait_agent` 观察的也是 inbox 插入，而不是任务完成。

## 9. 关键文件索引

### 9.1 subagent

| 文件 | 职责 |
| --- | --- |
| [manager.ts](../../../packages/subagent/subagent/src/manager.ts) | 服务实现总入口：start / resume / catalog 维护 |
| [lifecycle.ts](../../../packages/subagent/subagent/src/lifecycle.ts) | 一次激情的完整生命周期（准备 → 运行 → 结算 → 清理） |
| [activation.ts](../../../packages/subagent/subagent/src/activation.ts) | `ActivationPool`（树内共享容量）、`ChildLock` |
| [child-agent.ts](../../../packages/subagent/subagent/src/child-agent.ts) | 子会话 meta 构造、权限冻结、工具面组装 |
| [depth.ts](../../../packages/subagent/subagent/src/depth.ts) | 深度计算与插槽绑定的 `SubagentDepthError` |
| [catalog.ts](../../../packages/subagent/subagent/src/catalog.ts) | 父会话名册事件与投影折叠、名字解析 |
| [continuation-messages.ts](../../../packages/subagent/subagent/src/continuation-messages.ts) | 结算通知与继续对话说明的文案构造 |
| [control.ts](../../../packages/subagent/subagent/src/control.ts) | `send_message` / `wait` / `interrupt` 的服务端实现 |
| [archive-admission.ts](../../../packages/subagent/subagent/src/archive-admission.ts) | 归档准入：活动上报、级联取消、归档后拒绝 pre-step |
| [descriptor.ts](../../../packages/subagent/subagent/src/descriptor.ts) | 子代理 descriptor 的写入与读取 |
| [types.ts](../../../packages/subagent/subagent/src/types.ts) | 全部对外类型：provider 约定、句柄、错误码 |

### 9.2 team

| 文件 | 职责 |
| --- | --- |
| [index.ts](../../../packages/team/agent-team/src/index.ts) | 服务装配、团队模式事件、配置校验 |
| [task-board.ts](../../../packages/team/agent-team/src/task-board.ts) | 任务 CRUD、8 种 action、CAS 与全部错误码 |
| [task-graph.ts](../../../packages/team/agent-team/src/task-graph.ts) | 依赖图校验（环、缺失、重复、后继）与 `taskReady` |
| [journal.ts](../../../packages/team/agent-team/src/journal.ts) | 按根会话串行化事务 + `appendAndFlush` |
| [task-view.ts](../../../packages/team/agent-team/src/task-view.ts) | 面向展示的视图与作用域重叠告警 |
| [validation.ts](../../../packages/team/agent-team/src/validation.ts) | 文本长度与写作用域合法性校验 |
| [types.ts](../../../packages/team/agent-team/src/types.ts) | 任务快照、团队状态、历史兼容说明 |

### 9.3 schedule

| 文件 | 职责 |
| --- | --- |
| [runtime.ts](../../../packages/schedule/schedule/src/runtime.ts) | 单定时器、drive 循环、合并投递、占槽与结算 |
| [domain.ts](../../../packages/schedule/schedule/src/domain.ts) | RRULE 解析与「下一次出现」计算（最重的一个文件） |
| [storage.ts](../../../packages/schedule/schedule/src/storage.ts) | Host storage domain 定义与任务记录 schema |
| [delivery-history.ts](../../../packages/schedule/schedule/src/delivery-history.ts) | 投递历史分页与保留裁剪 |
| [update.ts](../../../packages/schedule/schedule/src/update.ts) | 编辑事务与 `expectedUpdatedAt` CAS |
| [types.ts](../../../packages/schedule/schedule/src/types.ts) | 计时、目标、状态、历史类型 |

### 9.4 jobs

| 文件 | 职责 |
| --- | --- |
| [jobs-local/index.ts](../../../packages/jobs/jobs-local/src/index.ts) | 进程注册表、并发上限、kill、事件写入 |
| [jobs-local/pump.ts](../../../packages/jobs/jobs-local/src/pump.ts) | pull 型输出源轮询 |
| [jobs-local/ring.ts](../../../packages/jobs/jobs-local/src/ring.ts) | 输出环形缓冲与裁剪统计 |
| [jobs/view.ts](../../../packages/jobs/jobs/src/view.ts) | `JobView` / `JobStatus` / 活动映射 |
| [tool-jobs/index.ts](../../../packages/jobs/tool-jobs/src/index.ts) | `job_output` / `job_list` / `job_kill` |

### 9.5 spill

| 文件 | 职责 |
| --- | --- |
| [spill-policy/index.ts](../../../packages/spill/spill-policy/src/index.ts) | 工具后置裁剪策略与预算校验 |
| [spill-policy/retention.ts](../../../packages/spill/spill-policy/src/retention.ts) | 首尾保留与图片省略的裁剪算法 |
| [spill-policy/notice.ts](../../../packages/spill/spill-policy/src/notice.ts) | 省略通知文案 |
| [spill-local/index.ts](../../../packages/spill/spill-local/src/index.ts) | 文件写入、命名、定位符与提示 |
| [spill-local/cleanup.ts](../../../packages/spill/spill-local/src/cleanup.ts) | 启动期过期清理 |
| [spill/types.ts](../../../packages/spill/spill/src/types.ts) | `SpillStore` / `SpillRef` / `SpillError` |

### 9.6 feedback

| 文件 | 职责 |
| --- | --- |
| [command-feedback/index.ts](../../../packages/feedback/command-feedback/src/index.ts) | `/feedback` 命令、分类枚举、`sessionFeedback` 服务 |
| [command-feedback/types.ts](../../../packages/feedback/command-feedback/src/types.ts) | `feedback/record` 事件与请求类型 |
| [message-feedback/index.ts](../../../packages/feedback/message-feedback/src/index.ts) | 单条消息评分的写入/删除/列举与备注校验 |
| [message-feedback/types.ts](../../../packages/feedback/message-feedback/src/types.ts) | 事件声明、`MessageFeedbackItem`、拒绝码 |

## 10. 待确认

以下问题在源码里没有读到确定答案，或需要跨包上下文才能定论，先记录：

1. **`subagent` 进程外 provider 的协议细节**：`subagent-acp`、`subagent-codex`、`subagent-claude-code`、`subagent-dsh-sdk` 我只确认了它们各自的传输方式（ACP、app-server、Agent SDK、stdio JSON-RPC），**没有逐行核对各自的会话映射与错误码**，第 2.1 节的描述停留在定位层面。
2. **`jobs` 的 `wait` 型工具是否存在**：`tool-jobs` 只有 `job_output` / `job_list` / `job_kill`，`wait_agent` 属 subagent。模型如何「阻塞等待后台任务结束」没有专门工具，只能轮询 `job_output`，此结论需要与运行时侧确认。
3. **`schedule` 的 `newSessionIntervalSeconds` 默认值**：只确认它存在且可配置，未读到默认数值。
4. **spill 文件与 sandbox 的关系**：`spill-local` 默认根目录在进程私有临时目录，可能位于 workspace 之外；模型用 `read` 工具取回时是否受文件系统 sandbox 限制，取决于 `dsh-fs` 与 sandbox 配置，本次未追。
5. **多 Host 并发写同一 workspace**：`TeamJournal` 与 `ActivationPool` 都是进程内的，跨进程一致性没有任何保障；实际部署是否允许多 Host 共享 workspace 未在本次范围内确认。
6. **`interrupt_agent` 的代价**：工具存在，但中断后子代理的结算语义（`stopReason`、能否继续对话）未逐条核对。

