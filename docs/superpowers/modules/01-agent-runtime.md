# 01 · Agent 核心运行时

> 本文是 [项目总览](../project-overview.md) 的模块分册，只覆盖「Agent 循环 / 会话日志 / 上下文 / 压缩 / plan-goal-workflow-todo」这一条纵向链路。> 结论全部来自以下目录的实际实现代码：`packages/core`、`packages/boot`、`packages/session`、`packages/session-query`、`packages/context`、`packages/compaction`、`packages/plan`、`packages/goal`、`packages/workflow`、`packages/todo`。> 无法从代码直接确认的内容集中放在第 11 节「待确认」，正文不做推测。> 相邻模块请对照：[03 · 模型接入、配置、凭据与可观测](03-models-and-config.md)、[07 · 协作与调度](07-collaboration-scheduling.md)。

## 1. 这一层是什么、对谁负责

**一句话**：这一层是「把一次用户输入变成一串可重放、可恢复、可观测的模型-工具交互」的引擎。它不面向用户界面，也不决定模型怎么说话；它决定**什么时候该请求模型、请求里放什么、模型的产出怎么写进日志、什么时候停**。

它向上对三类调用方负责：

| 调用方 | 期望 | 本层提供的契约 |
| --- | --- | --- |
| 入口载体（CLI / Web Host / SDK / ACP / Python） | 「给我一个会话，我往里塞一句话，然后我订阅事件」 | `ctx.agents.create()/resume()`、`agent.send()/followup()/steer()`、`ctx.on('agent/...')` 事件流 |
| UI 与投影消费者 | 「我要能实时看到流式文本、工具调用、待办、目标、计划」 | 会话事件 + 投影（`session-projection`），事件即状态来源 |
| 其他插件（工具、上下文片段、压缩、目标驱动） | 「我要在 step 前插入内容 / 在工具调用时拦住 / 在上下文快满时改写历史」 | `agent/pre-step` waterfall、`ctx.tools` 注册、`surfaceOp` 改写、`ctx.compaction` |

它**不**负责：模型协议与鉴权（[03 · 模型接入](03-models-and-config.md)）、沙箱与权限审批的判定实现（`packages/sandbox`、`packages/guard`）、UI 渲染（`packages/client`）、子代理派生策略（`packages/subagent`）、定时调度（`packages/schedule`）。边界清单见第 10 节。

## 2. 在系统中的位置

### 2.1 纵向分层

```text
入口载体（CLI / Web / SDK / ACP / Python）
        │  创建或恢复会话，投递用户输入
        ▼
┌─────────────────────── Agent 核心运行时（本文范围） ───────────────────────┐
│  core/agent         Agent 注册表、生命周期、事件分发                        │
│  core/agent-loop    turn / step 循环、inbox、请求构造、流式消费、工具派发    │
│  core/scope         会话级事件 scope（事件按 carrier 路由）                  │
│  core/system-prompt 提示词分段拼装（各插件贡献 section）                     │
│  core/tools         工具注册表、schema、执行与结果回填                       │
│  session            事件日志、surface 折叠、投影、持久化、格式迁移           │
│  session-query      只读跨会话检索（精确读 / FTS5 / 血缘）                   │
│  context            上下文片段注入（指令文件、引用、时间、环境…）            │
│  compaction         上下文压力计量、区段压缩、图片 offload、工具结果裁剪     │
│  plan / goal        控制流状态机（计划模式、持久目标与自动续轮）             │
│  workflow / todo    编排脚本执行、会话内任务清单                             │
└────────────────────────────────────────────────────────────────────────────┘
        │  请求 / 流式响应            │  工具执行
        ▼                             ▼
  ctx.llm（模型适配器）          ctx.tools → 具体工具包（fs / shell / mcp …）
```

### 2.2 依赖方向

| 依赖 | 方向 | 说明 |
| --- | --- | --- |
| `agent-loop → session` | 强依赖 | 每一步都往会话日志写事件；历史从会话 surface 派生 |
| `agent-loop → llm` | 强依赖 | `ctx.llm.stream()` 是唯一的模型出口 |
| `agent-loop → tools` | 强依赖 | 每 step 解析一次可见工具集并派发调用 |
| `session → storage / fs` | 依赖 | JSONL 后端落盘；投影缓存走 `ctx.storage` |
| `compaction → session + llm` | 依赖 | 读历史、调 LLM 生成摘要、以 `surfaceOp.replace` 改写 |
| `plan / goal / todo → session` | 依赖 | 状态全部以会话事件持久化，重启后由投影恢复 |
| `workflow-ptc → agent` | 依赖 | 通过工厂派生多个子代理并等待结果 |
| `boot → 全部` | 装配依赖 | 只决定「加载哪些插件、默认值是什么」，不参与运行逻辑 |

关键点：**运行时没有额外数据库**。所有状态都以会话事件为唯一真相，投影是可丢弃、可重建的派生视图。这是「同一会话可被不同载体读取、进程崩溃可恢复到一致点」的基础。

## 3. Agent 与 turn / step 循环

### 3.1 对象模型

| 对象 | 职责 | 位置 |
| --- | --- | --- |
| `AgentRegistry` | 会话级 Agent 的创建、恢复、按 id 查找、停止与归档准入 | [core/agent/src/index.ts](../../../packages/core/agent/src/index.ts) |
| `AgentFactory` | 由 `AgentLoop` 实现的工厂契约，负责「造一个 Agent 实例」 | [core/agent-loop/src/index.ts](../../../packages/core/agent-loop/src/index.ts) |
| `Agent`（接口） | 对外暴露 `send/followup/steer/inject/cancel`、状态与 inbox | [core/agent/src/runtime-types.ts](../../../packages/core/agent/src/runtime-types.ts) |
| Agent 循环实现 | `kick()` 驱动、`turn()`、`step()`、`preStep()`、请求构造 | [core/agent-loop/src/agent.ts](../../../packages/core/agent-loop/src/agent.ts) |
| `Inbox` | 两个队列：`next-turn` 与 `next-step`，带 seq 与「已认领」语义 | [core/agent-loop/src/inbox.ts](../../../packages/core/agent-loop/src/inbox.ts) |
| `Scope` | 把事件限定在「这个 Agent / 这个会话」范围内路由 | [core/scope/src/index.ts](../../../packages/core/scope/src/index.ts) |
| `AgentEventDispatch` | `emit` / `serial` / `waterfall` 三种派发，统一给监听器注入 `agent` | [core/agent/src/dispatch.ts](../../../packages/core/agent/src/dispatch.ts) |

每个 Agent 持有**独立的 `AbortController`**（在 `initializeAgent()` 中创建），因此取消是 per-agent 的，不会串到别的会话。

### 3.2 turn 的生命周期

一次 turn 是「用户意图的一个完整回合」，实现是 `agent.ts` 里的 `turn()`：

1. 写 `turn/start`。
2. 进入 step 循环：每次先 `preStep()`，通过后写 `step/start`；`step()` 返回后写 `step/end`。
3. 依据两个条件决定是否继续：本轮是否被要求结束（`turnEnds`），以及 `inbox.nextStep` 是否还有待处理内容。
4. 写 `turn/end`，带上结束原因（`reason`，中断时包含 `aborted`）。

驱动入口是 `kick()`：

```
while (await this.turn()) {}
```

turn 返回 `true` 表示「还有下一轮要跑」（例如 inbox 里又来了 `next-turn` 内容），于是继续；返回 `false` 则回到 idle。**idle 不是终点**：只要有 pending inbox，`kick()` 会被重新唤醒。goal 的自动续轮就是靠这个语义实现的（见 7.2）。

### 3.3 step 的生命周期

一个 step 是「一次模型请求 + 该请求产生的工具执行」。`step()` 的主干：

| 阶段 | 动作 | 写入的事件 |
| --- | --- | --- |
| 1. 组装请求 | `prepareRequest()` / `buildRequest()`：锁定历史边界、从 session 派生 messages 与工具历史、解析模型与工具集 | `request/header`、`request/context` |
| 2. 追加输入 | 把本 step 的 system / user 消息追加进会话 | `system/message`、`user/message` |
| 3. 流式请求 | 通过 `ctx.llm` 发起流式生成 | `agent/assistant-stream`（`live.start` / 增量 `push`） |
| 4. 落定 assistant 产出 | 成功写 `assistant/message`；失败或被丢弃的一次尝试写 `assistant/attempt` | `assistant/message` / `assistant/attempt` |
| 5. 执行工具 | 过滤不可见工具 → 按并发安全性分批 → 执行 → 回填结果 | `tool/result` 等 |
| 6. 回灌上下文 | 工具返回的 `additionalContexts` 写入 `next-step` inbox，供下一 step 使用 | inbox 变更事件 |

### 3.4 preStep：唯一的「进入 step 前的总闸」

`preStep()` 是所有插件影响循环的唯一同步切口，顺序是：

1. 从 inbox **认领**（claim）本 step 的待处理输入；
2. 解析模型选择（`modelSelection` 投影）与工具集（`toolSet`）；
3. 组装 system prompt（`ctx.systemPrompt.assemble()`）；
4. 触发 `agent/pre-step`（waterfall）；
5. 汇总为 `PreStepDecision`：`accept` 或 `reject`。

因为它是 **waterfall**，任何监听器都能改写决定或往上下文里加东西——上下文注入（第 5 节）、压缩触发（第 6 节）、checkpoint 落盘（第 4.4 节）、plan 模式边界落地（7.1）都挂在这里。

### 3.5 四条输入通道

| 方法 | 进入队列 | 语义 |
| --- | --- | --- |
| `send()` | 直接驱动一轮 | 常规「发一条消息，开始干活」 |
| `followup()` | `next-turn` | 排到**下一轮 turn**，不打断当前 turn |
| `steer()` | `next-step` | 排到**当前 turn 的下一步**，并唤醒 driver，用于中途纠偏 |
| `inject()` | step 内联 | 直接把内容注入当前 step 的请求上下文 |

四个通道的差异本质是「插到哪一层边界」。工具返回的 `additionalContexts` 走的是 `next-step`，效果等价于「工具自己给自己安排了一条后续输入」。

### 3.6 取消与中断

`cancel({ kind, keepInbox })` 的最终动作是 `phase.abort.abort(cause)`，于是流式请求与工具执行都会收到 abort。

- `keepInbox` 决定已排队但未处理的输入是否保留（用户主动停止通常保留，归档则丢弃）。
- 会话被 stop/归档时，`archive-admission.ts` 会主动调 `agent.cancel({ kind: 'user' })`，避免后台还在跑。
- 中断不会「回滚」已写入的事件：`turn/end` 会带上 `aborted` 原因，日志保持单调追加。

### 3.7 事件怎么产生、怎么消费

**产生侧**：循环在固定位置写事件，插件通过 `ctx.on(...)` 监听或拦截。

| 事件 | 类型 | 时机 | 典型消费者 |
| --- | --- | --- | --- |
| `agent/pre-step` | waterfall | 每个 step 之前 | 上下文注入、压缩、checkpoint、plan 边界 |
| `agent/assistant-stream` | emit | 流式增量（`live.start` + `push`） | UI 实时打字机、会话标题 |
| `agent/request-error` | waterfall | 模型请求失败 | 重试策略（可返回 `retry`） |
| `agent/inbox/spliced` | emit | inbox 被修正 | UI 的排队消息展示 |
| `agent/inbox/discarded` | emit | 输入被丢弃 | 同上 |
| `turn/start`、`turn/end` | 会话事件 | turn 边界 | 投影、统计、todo 清空 |
| `step/start`、`step/end` | 会话事件 | step 边界 | turn 大纲、耗时统计 |
| `request/header`、`request/context` | 会话事件 | 请求构造完成 | 重放、审计、上下文分解 |
| `assistant/message`、`assistant/attempt` | 会话事件 | 模型产出落定 | surface 折叠、渲染 |
| `tool/result` | 会话事件 | 工具结束 | surface 折叠、工具结果裁剪 |

**消费侧**有两条路径，互不替代：

1. **事件流**（低延迟）：`AgentEventDispatch` 三种派发方式——
   - `emit`：广播，监听器抛错不影响主循环；
   - `serial`：串行等待，用于需要顺序保证的副作用；
   - `waterfall`：可改写结果，用于 `pre-step` 这类决定点。

   所有监听器拿到的参数里都会注入 `agent` 字段，因此一个监听器可以同时服务多个 Agent 而不必自己维护映射。

2. **投影**（可恢复）：事件同时写入会话日志，投影把它们折成一个整体值（如 `todos`、`goal`、`plan`、`tokenUsage`）。UI 首屏、冷启动、跨进程读取都走投影，而不是重放全部事件。

## 4. 会话日志

### 4.1 事件模型

会话是一条**只追加**的事件流，元素形如：

```ts
interface SessionEvent {
  type: SessionEventType   // 事件类型（如 'turn/start'、'assistant/message'）
  seq: SessionSeq          // 会话内单调递增序号
  time: number             // Unix 毫秒时间戳
  data: unknown            // 按 type 定的载荷
}
```

三条不变量：

- **seq 单调递增且连续**：任何「修改历史」都必须以**新增事件**表达，不能改旧事件。
- **header 创建后冻结**：标识、创建信息、格式版本不随会话演进变化。
- **分叉继承有明确边界**：继承事件数与「继承截断点」是显式记录的，不是靠时间戳猜。

### 4.2 surface：模型看到的历史 ≠ 全部日志

日志里有大量「模型不该看见」的记录（审批细节、被替换掉的旧内容、纯观测事件）。因此存在 **surface** 概念：

| surface 状态 | 含义 |
| --- | --- |
| `current` | 当前进入模型上下文的事件 |
| `shadowed` | 曾经在 surface 上、后来被替换掉的事件 |
| `log-only` | 从未进入 surface 的纯日志事件 |

控制 surface 的机制是 `surfaceOp`：

| surfaceOp | 语义 |
| --- | --- |
| `append` | 正常追加，进入 surface |
| `replace(startSeq, endSeq)` | 用这条事件**替换** `[startSeq, endSeq]` 区间内的事件 |

`replace` 是压缩能成立的关键：摘要作为一条新的 `user/message` 追加到日志尾部，同时声明「我替换掉前面这一段」。原事件仍在日志里（可回溯、可审计），但在 surface 折叠时被标记为 `shadowed`。

surface 的折叠、`deriveMessages()`（把 surface 折成模型消息数组）与 generation 管理在 [session/src/surface.ts](../../../packages/core/session/src/surface.ts) 中实现。

### 4.3 投影机制

投影 = 「事件流 → 一个整体值」的纯函数折叠。

```ts
interface ProjectionDefinition<T> {
  key: string                      // 投影名，如 'todos'
  stateSchema: ...                 // 值的校验 schema
  init(header, inheritedEventCount): T   // 初始值（能看到 header 与继承边界）
  apply(state: T, event): T        // 纯同步折叠
  view(state: T): ...              // 对外视图
  stateVersion: number             // 折叠逻辑版本
}
```

注册在 [session/session-projection/src/index.ts](../../../packages/session/session-projection/src/index.ts)。要点：

- **`apply` 必须是纯同步函数**。不能有 IO、不能 await，否则重放不确定。
- **`init` 能拿到 `inheritedEventCount`**，所以分叉会话可以「跳过继承段」而不是重新折叠。
- **`stateVersion` 是兼容开关**：折叠逻辑一改，旧 checkpoint 自动失效并重建。
- 快照形态是 `ProjectionSnapshot { asOfSeq, values }`——「这个值对应到哪个 seq 为止」，因此增量重放只需从 `asOfSeq + 1` 开始。

内置投影的典型键（**非全量**，全量以源码注册为准）：`modelSelection`、`inbox`、`turnBoundary`、`todos`、`goal`、`plan`、`tokenUsage`、`contextPressure`。

### 4.4 写入路径

```text
内存事件 → Session.append()
   → surface/projection 同步更新
   → flush 队列（按 checkpoint 策略节流）
   → session-persistence-jsonl：写临时文件 → datasync/fsync → rename 发布
   → 新 generation 文件成为「权威文件」
```

| 环节 | 做的事 | 位置 |
| --- | --- | --- |
| `Session.append()` | 校验 → 分配 seq → 更新 surface 与投影 → 标记待落盘 | [core/session/src/index.ts](../../../packages/core/session/src/index.ts) |
| checkpoint 策略 | 在三个一致点触发 flush：**模型请求前**（`llm/stream`）、**顶层工具执行前**（`tools/execute`）、**step 开始前**（`agent/pre-step`） | [session/session-checkpoint-policy/src/index.ts](../../../packages/session/session-checkpoint-policy/src/index.ts) |
| JSONL 后端 | 物理 header 序列化、目录规划、代际文件命名、临时文件 + rename | [session/session-persistence-jsonl/src/format.ts](../../../packages/session/session-persistence-jsonl/src/format.ts) |
| 代际轮转 | 决定何时切新文件、旧文件如何保留 | [session/session-persistence-jsonl/src/generation.ts](../../../packages/session/session-persistence-jsonl/src/generation.ts) |
| 投影缓存 | 按 `writeEveryEvents: 200` / `writeIntervalMs: 5000` 异步写 checkpoint（base bundle 默认值） | [session/session-projection-cache/src/index.ts](../../../packages/session/session-projection-cache/src/index.ts) |

为什么是「临时文件 + rename」：进程在写一半时崩溃，旧文件仍然完整可读，不会产生半截 JSONL。这就是「异常退出可恢复到最后一致点」的实现方式。

物理 header 字段（[format.ts](../../../packages/session/session-persistence-jsonl/src/format.ts)）：`type`、`version`、`id`、`createdAt`、`cwd`、`parentSession`、`isSeeded`、`delegationDepth`、`agentPreset`。

- `parentSession` + `delegationDepth`：分叉与子代理的血缘。
- `isSeeded`：该会话是否从模板/种子初始化。
- `agentPreset`：创建时的 agent 预设（影响 system prompt 与工具可见性）。
- 分叉的继承截断点记在最后一个 `session/end-seed` 事件上，而不是 header。

### 4.5 读取路径

| 场景 | 路径 | 说明 |
| --- | --- | --- |
| 恢复运行（resume） | JSONL → 逐行解析 → 校验 → 重建 surface → 恢复投影 → 继续 `kick()` | 由 `AgentRegistry.resume()` 发起 |
| 冷启动列表 | 投影缓存 checkpoint（`ver` + `seq` + `val`）→ 只重放 `seq` 之后的后缀 | `stateVersion` 不匹配则整体重建 |
| 精确读（导出、工具读会话） | `session-query` 的 `SessionSurfaceSnapshot` / `SessionLogSnapshot` | surface 快照与原始日志快照是两种读法 |
| 全文检索 | SQLite FTS5：`persisted_docs`（落盘）与 `temp.live_docs`（内存中活动会话） | 需显式开启 `openAt` |
| 血缘追踪 | `SessionLineageTrace`（`ancestors` + 递归 `descendants`，含 `complete` 标志） | 用于分叉树展示与继承诊断 |

`session-query` 与写路径**完全解耦**：它只读、只做观察（live-preferred，即同一 id 优先取内存中的活会话），不参与任何写决策。位置：[session-query/session-query/src/types.ts](../../../packages/session-query/session-query/src/types.ts)、[session-query-sqlite/src/schema.ts](../../../packages/session-query/session-query-sqlite/src/schema.ts)。

SQLite 侧的默认装配是「挂载但不打开」：base bundle 中 `session-query-sqlite` 配置为 `path: ':memory:'` + `openAt: never`。这样精确读、标题、血缘都可用，而搜索调用会以 `SESSION_QUERY_SEARCH_DISABLED` 失败，SQLite 从不真正开库。需要内容检索的部署在后继 patch 层把 `openAt` 改为 `first-search` 或 `startup`。

### 4.6 格式版本链

| 迁移 | 内容 | 位置 |
| --- | --- | --- |
| v0 → v1 | 初始结构收敛 | [session-format-v0-to-v1/src/migration.ts](../../../packages/session/session-format-v0-to-v1/src/migration.ts) |
| v1 → v2 | 把顶层 assistant 分片嵌入 attempt 事件 | [session-format-v1-to-v2/src/migration.ts](../../../packages/session/session-format-v1-to-v2/src/migration.ts) |
| v2 → v3 | 规范化 system prompt / 引用 / PTC 词汇（`code` → `ptc`） | [session-format-v2-to-v3/src/migration.ts](../../../packages/session/session-format-v2-to-v3/src/migration.ts) |
| v3 → v4 | 仅 header 层变更；正文恢复需要 child catalog 证据 | [session-format-v3-to-v4/src/migration.ts](../../../packages/session/session-format-v3-to-v4/src/migration.ts) |

每个相邻迁移都有**冻结的解码器**：读旧会话时按链式逐级升到当前版本，迁移逻辑不随新版演进，保证历史永远可读。

## 5. 上下文管理

### 5.1 两层结构：system prompt 与消息上下文

| 层 | 内容 | 谁负责 |
| --- | --- | --- |
| system prompt | 人设、环境、工具说明、策略片段 | `ctx.systemPrompt.assemble()`，各插件注册 section |
| 消息上下文 | 对话历史 + 每步注入的提醒/引用 | session surface + `next-step` inbox |

`system-prompt` 的组装契约（[core/system-prompt/src/index.ts](../../../packages/core/system-prompt/src/index.ts)）：

- section 以 `{ name, order, complete }` 注册，按 `order` 排序拼装；
- `personaPrefix` 在 base bundle 中默认空字符串，因此默认不注入人设前缀；
- 工具说明、plan 策略等都是 section，而不是硬编码字符串。

### 5.2 上下文片段注入

这些插件都挂在 `agent/pre-step`（或注册 system prompt section）上，向请求里加内容，而不改循环本身：

| 插件 | 注入内容 | 位置 |
| --- | --- | --- |
| `agent-instructions` | 读取并摘要 `AGENTS.md` 类指令文件，去重后以 `agent-instructions` 消息注入 | [context/agent-instructions/src/index.ts](../../../packages/context/agent-instructions/src/index.ts) |
| `session-reference` | 解析消息中的 @会话引用，追加只读快照内容 | [context/session-reference/src/index.ts](../../../packages/context/session-reference/src/index.ts) |
| `file-reference-local` | 注册 `context:file-reference` system prompt 片段，声明 @文件引用语义 | [context/file-reference-local/src/index.ts](../../../packages/context/file-reference-local/src/index.ts) |
| `time-context` / `tmux-context` / `harness-dev-context` | 当前时间、终端环境、开发态提示 | 同目录各包 |

### 5.3 运行期提醒（runtime reminder）

两类「会变化的状态」不能只放在 system prompt 里（否则缓存失效），而是落成**用户消息**：

| 投影/机制 | 行为 | 位置 |
| --- | --- | --- |
| `SystemPromptProjection` | 系统提示变化时，写/替换 `system/message` 节点 | [core/agent-loop/src/runtime-context.ts](../../../packages/core/agent-loop/src/runtime-context.ts) |
| `RuntimeContextProjection` | 运行上下文变化时，生成一条 `<system-reminder>` 用户消息 | 同上 |

这样做的收益是：稳定的提示词前缀保持稳定（利于提供方请求缓存），而变化的部分作为尾部消息追加。

## 6. 压缩（compaction）

### 6.1 服务的三个入口

`ctx.compaction`（[compaction/compaction/src/index.ts](../../../packages/compaction/compaction/src/index.ts)）：

| 方法 | 用途 |
| --- | --- |
| `compactIfNeeded()` | 按当前压力判断是否要压，压了就执行 |
| `compactNow()` | 立即压（`/compact` 命令走这里） |
| `compactRegion()` | 压缩指定区段，供更细粒度的策略调用 |

### 6.2 触发条件

`compaction-basic` 监听三类触发，都在 [compaction/compaction-basic/src/index.ts](../../../packages/compaction/compaction-basic/src/index.ts)：

| 触发 | 时机 | 说明 |
| --- | --- | --- |
| between-steps | `agent/pre-step` | 每个 step 前按压力判断，是最常用的一类 |
| model-switch | 切换模型时 | 新模型窗口更小时立即评估 |
| context-overflow | 提供方返回上下文溢出 | 兜底，见 6.4 |

压力计量的口径是 `compactPressure` = **header + history**（即请求里的固定部分与历史部分），不是「历史条数」。

### 6.3 阈值与策略

默认值（[compaction/compaction-basic/src/config.ts](../../../packages/compaction/compaction-basic/src/config.ts)）：

| 配置 | 默认 | 含义 |
| --- | --- | --- |
| `thresholdRatio` | `0.8` | 超过上下文窗口的 80% 就触发 |
| `retainRatio` | `0.16` | 压缩后保留最近约 16% 的历史原文 |
| `headroomTokens` | 见源码 | 为响应预留的余量 |
| `compactionRetries` | 见源码 | 压缩本身失败的重试次数 |
| `maxOverflowRetries` | 见源码 | 溢出后重试上限 |
| `auto` | 见源码 | 是否允许自动触发 |

`resolveCompactSpec` 用模型的 `contextWindow` 把比例换算成 `thresholdTokens` / `retainTokens`，因此不同窗口的模型共用一套比例配置。

### 6.4 区段选择与落地

`region.ts` 的 `selectCompactableRange` 决定「压哪一段」：保留最近区段（按 `retainRatio` 折算的 token 预算），把更早的部分作为可压缩区段。

落地方式：

1. 写 `compaction/start`；
2. 调用摘要器生成结构化摘要（`summarizer.ts`，8 段式，整体包在 `<compacted-summary>` 标签内），摘要本身也是一次 LLM 调用；
3. 追加一条 `user/message`，携带 `surfaceOp: { op: 'replace', startSeq, endSeq }`；
4. 写 `compaction/end`。

因此：**原始事件不删**，只是从 surface 上被替换；模型看到的是摘要 + 保留的最近历史。

### 6.5 失败兜底

| 兜底 | 触发 | 行为 | 位置 |
| --- | --- | --- | --- |
| 图片 offload | 提供方返回 `IMAGE_OFFLOAD_REQUIRED` | 把最旧的图片替换为占位文本后重试 | [compaction/compaction-image-offload/src/index.ts](../../../packages/compaction/compaction-image-offload/src/index.ts) |
| 工具结果裁剪 | 单个 `tool/result` 超过字符阈值 | 按 `thresholdChars: 8192` / `head: 4096` / `tail: 1024` 截断，写 `compaction/prune` 影子事件 | [compaction/compaction-tool-result-pruner/src/index.ts](../../../packages/compaction/compaction-tool-result-pruner/src/index.ts) |
| 手动压缩 | 用户执行 `/compact` | 无参数时调 `compactNow()` | [compaction/command-compact/src/index.ts](../../../packages/compaction/command-compact/src/index.ts) |

注意 `compaction/prune` 产生的是**影子事件**：它不改原 `tool/result`，而是在 surface 上叠加一个裁剪版本，原结果仍可在日志中查到。

## 7. plan / goal / workflow / todo

这四个能力解决的是四种不同的问题，容易混淆，先给结论：

| 能力 | 解决的问题 | 状态载体 | 是否改变控制流 |
| --- | --- | --- | --- |
| plan | 「先想清楚再动手」，让模型在只读探索后产出计划并等待人类批准 | `plan/mode` + `plan` 投影 | 是（gate 住执行阶段） |
| goal | 「跨轮次持续推进一个长期目标」，进程重启/恢复后仍继续 | `goal/change` + `goal` 投影 | 是（自动续轮） |
| workflow | 「一次调用里编排多个子代理」，把扇出/流水线写进脚本 | `workflow/*` + `tool-workflow/*` 事件 | 是（改变执行拓扑） |
| todo | 「把当前任务拆成可勾选清单」，给模型和用户一个进度视图 | `todo/write` + `todos` 投影 | 否（纯状态展示） |

### 7.1 plan：计划模式

实现：[plan/plan-mode/src/index.ts](../../../packages/plan/plan-mode/src/index.ts)。

**状态机**：`ctx.planMode` 维护 `PlanUnitState { active, wanted, running, activeAtLastHeader, entered }`，通过 `plan` 投影持久化。`set()` 的返回有四种：`committed`（立即生效）、`queued`（等边界）、`cancelled`、`noop`。

**为什么需要 queued**：切换模式不能在 step 中间硬切，否则同一 step 的 system prompt 与工具集不自洽。`onBoundary()` 会在**下一个被接受的 pre-step** 写 `plan/mode` 事件，并生成一条用户可见的切换通知。

**退出流程**：`exit_plan_mode` 工具要求模型提交完整 markdown 计划，然后通过 `ask_user_question` 走人类评审（Approve / Keep planning）；批准后以 `approved: true` 退出计划模式，进入执行。

**关键设计：不做机械工具禁用**。计划模式只注册一个 `plan:policy` 的 system prompt 片段来约束行为，工具目录在两种模式下保持一致。base bundle 的注释明确写了理由：**「tool catalog stays the same across modes for request-cache stability」**——工具目录一变，提供方前缀缓存就失效。

### 7.2 goal：持久目标与自动续轮

实现：[goal/goal/src/index.ts](../../../packages/goal/goal/src/index.ts)、[goal-round-driver](../../../packages/goal/goal-round-driver/src/index.ts)、[tool-goal](../../../packages/goal/tool-goal/src/index.ts)、[command-goal](../../../packages/goal/command-goal/src/index.ts)。

**状态**：`GoalProjection { goal, roundsStarted, createdAt, updatedAt }`，生命周期 `create → pause/resume → complete/block/clear`。phase 取值 `active | paused | blocked | complete`。持久化事件是 `goal/change`。

**自动续轮的条件链**（`goal-round-driver`）：

1. `drivable`：phase 为 `active` 且已 armed；
2. `readyToDrive`：fiber 处于 ACTIVE、agent 处于 idle、且没有竞争的 queued prompt；
3. 等待子代理树空闲（避免和正在跑的子代理抢上下文）；
4. 轮次未超限（超出则 `ctx.goals.block({ code: 'round-limit' })`）。

满足后，驱动会构造一条带 `source: { kind: 'goal', goalId, revision, round }` 的 user 消息，调用 `agent.followup()` 排入下一轮。**这就是 3.2 里「idle 不是终点」的用处**——续轮不需要外部定时器，只需要在 turn 结束的边界重新投入队列。

`maxGoalRounds` 是硬上限，防止目标无限自我驱动。

**用户入口**：模型侧是 `get_goal` / `create_goal` / `update_goal`（`action: edit | pause | resume | complete | blocked`，带 `revision` 做乐观并发）；用户侧是 `/goal` 的 `show` / `create` / `edit` / `pause` / `resume` / `clear`。

### 7.3 workflow：脚本化多代理编排

实现：[workflow/workflow](../../../packages/workflow/workflow/src/index.ts)、[workflow-ptc](../../../packages/workflow/workflow-ptc/src/index.ts)、[tool-workflow](../../../packages/workflow/tool-workflow/src/index.ts)。

**模型看到的形态**：一个工具（`tool-workflow`），参数是

```text
{ script, meta: { name, description, whenToUse?, phases? }, args?, run_in_background? }
```

即「模型写一段 JS 编排脚本 + 元信息 + 参数」。

**执行方式**：`workflow-ptc` 在 `vm.createContext` 里把 `script` 包成 `(async () => { ... })()` 执行，向脚本注入一组 hooks：

| hook | 语义 |
| --- | --- |
| `agent(...)` | 派生子代理并等待其结果 |
| `parallel(...)` | 并发扇出 |
| `pipeline(...)` | 串成流水线 |
| `phase(...)` | 标记阶段（用于 UI 进度） |
| `log(...)` | 写一条工作流日志 |
| `args` | 调用方传入的结构化参数 |

**错误与返回**：

- `drive()` **永不 reject**，总是返回 `{ value, stopReason: 'completed' | 'error', agentsStarted }`，把失败变成可观察的结果而不是异常。
- 返回值必须 JSON 可序列化，否则以 `RESULT_UNSERIALIZABLE` 失败。

**默认限额**（[workflow-ptc/src/index.ts](../../../packages/workflow/workflow-ptc/src/index.ts)）：

| 配置 | 默认 |
| --- | --- |
| `provider` | `'spawn'` |
| `maxConcurrentAgents` | `0` → 自动取 `min(16, cores - 2)` |
| `maxTotalAgents` | `1000` |
| `maxItemsPerCall` | `4096` |
| `syncTimeoutMs` | `5000` |

`resolveMaxTotalAgents` 会保证不超过引擎上限，即插件配置不能突破执行器自身的天花板。

**事件**：引擎侧 `workflow/start | phase | log | agent-start | agent-end | end`；工具侧另有一层 `tool-workflow/run-start | run-end | agent-start | agent-end`，用于 UI 回放与树形展示。

### 7.4 todo：会话内任务清单

实现：[todo/tool-todo/src/index.ts](../../../packages/todo/tool-todo/src/index.ts)、[types.ts](../../../packages/todo/tool-todo/src/types.ts)。

- 数据形状：`TodoItem { content, status: 'pending' | 'in_progress' | 'completed' }`。
- **`todo/write` 是全量快照**，last-wins：每次写入都整体替换，不做增量合并。因此不存在「删一条」的语义——不发就是删了。
- 投影：`key: 'todos'`，`init` 为 `null`，`todo/write` 时整体替换，**`turn/start` 时置回 `null`**，`stateVersion: 2`。也就是「待办是单轮任务的清单」，新一轮开始自动清空。
- 工具 `todo_write` 接收全量列表，返回写入后的列表与各状态计数。
- `allowParallelInProgress` 控制是否允许同时存在多个 `in_progress`；base bundle 中设为 `true`。

### 7.5 四者怎么衔接

```text
plan  ──(批准退出计划模式)──►  正常执行 turn/step
                                 │
                                 ├─► todo_write     : 本轮任务清单（turn/start 清空）
                                 ├─► tool-workflow  : 一次调用扇出多个子代理（有界）
                                 └─► goal followup  : turn 结束后自动续轮（长期目标）
```

| 衔接点 | 机制 |
| --- | --- |
| plan → 执行 | `exit_plan_mode` 批准后写 `plan/mode`，下一个 pre-step 起不再受计划约束 |
| todo ↔ 压缩 | todo 是投影不是消息，压缩不影响它；但 `turn/start` 会清空它，所以跨 turn 的任务要靠 goal 而非 todo |
| goal ↔ todo | goal 描述「目标」，todo 描述「当前这轮怎么做」；goal 续轮时 `turn/start` 会清空上一轮 todo |
| workflow ↔ goal | workflow 在**一个** step 内完成扇出并返回；goal 在**多个** turn 之间推进。二者正交，但 workflow 的子代理会把 goal 驱动挡在「等子代理树空闲」之外 |
| plan ↔ workflow | 计划模式下可以调 `tool-workflow`（工具目录不变），但受 `plan:policy` 提示约束 |

## 8. 关键接口、类型、文件

### 8.1 关键接口

| 接口/服务 | 职责 | 位置 |
| --- | --- | --- |
| `Agent` | `send/followup/steer/inject/cancel`、状态、inbox | [core/agent/src/runtime-types.ts](../../../packages/core/agent/src/runtime-types.ts) |
| `AgentFactory` | 造 Agent 实例（`AgentLoop` 实现） | [core/agent-loop/src/index.ts](../../../packages/core/agent-loop/src/index.ts) |
| `AgentRegistry` | `create()` / `resume()` / 查找 / 归档 | [core/agent/src/index.ts](../../../packages/core/agent/src/index.ts) |
| `ctx.systemPrompt` | section 注册与 `assemble()` | [core/system-prompt/src/index.ts](../../../packages/core/system-prompt/src/index.ts) |
| `ctx.tools` | 工具注册、可见性、执行器选择 | [core/tools/src/contracts.ts](../../../packages/core/tools/src/contracts.ts) |
| `ctx.compaction` | `compactIfNeeded` / `compactNow` / `compactRegion` | [compaction/compaction/src/index.ts](../../../packages/compaction/compaction/src/index.ts) |
| `ctx.planMode` | 计划模式读写与边界落地 | [plan/plan-mode/src/index.ts](../../../packages/plan/plan-mode/src/index.ts) |
| `ctx.goals` | 目标生命周期与 block | [goal/goal/src/index.ts](../../../packages/goal/goal/src/index.ts) |
| `ctx.sessionQuery` | 只读检索、精确读、血缘 | [session-query/session-query/src/types.ts](../../../packages/session-query/session-query/src/types.ts) |

### 8.2 关键类型

| 类型 | 说明 | 位置 |
| --- | --- | --- |
| `SessionEvent` | `{ type, seq, time, data }`，日志原子单位 | [core/session/src/types.ts](../../../packages/core/session/src/types.ts) |
| `surfaceOp` | `append` 或 `replace(startSeq, endSeq)` | 同上 |
| `ProjectionDefinition` | `key/stateSchema/init/apply/view/stateVersion` | [session/session-projection/src/index.ts](../../../packages/session/session-projection/src/index.ts) |
| `ProjectionSnapshot` | `{ asOfSeq, values }` | 同上 |
| `ProjectionCheckpointRow` | `{ ver, seq, val }`，持久化形态 | 同上 |
| `PreStepDecision` | `accept` / `reject`，pre-step 的结论 | [core/agent/src/runtime-types.ts](../../../packages/core/agent/src/runtime-types.ts) |
| `RequestErrorAction` | `agent/request-error` 可返回 `retry` | 同上 |
| `CancelOptions` | `{ kind, keepInbox }` | 同上 |
| `InboxTarget` / `InboxState` | `next-turn` / `next-step` 两个队列 | [core/agent/src/types.ts](../../../packages/core/agent/src/types.ts) |
| `ToolDefinition` | `output` 必填、`execute`、`isConcurrencySafe`、`when` | [core/tools/src/contracts.ts](../../../packages/core/tools/src/contracts.ts) |
| `ToolExecutionResult` | `additionalContexts?`、`concludesTurn?` | 同上 |
| `SessionEventSurface` | `current` / `shadowed` / `log-only` | [session-query/session-query/src/types.ts](../../../packages/session-query/session-query/src/types.ts) |
| `TodoItem` | `{ content, status }` | [todo/tool-todo/src/types.ts](../../../packages/todo/tool-todo/src/types.ts) |
| `GoalProjection` | `{ goal, roundsStarted, createdAt, updatedAt }` | [goal/goal/src/index.ts](../../../packages/goal/goal/src/index.ts) |
| `PlanUnitState` | `{ active, wanted, running, activeAtLastHeader, entered }` | [plan/plan-mode/src/index.ts](../../../packages/plan/plan-mode/src/index.ts) |
| `WorkflowResult` | `{ value, stopReason, agentsStarted }` | [workflow/workflow-ptc/src/runtime.ts](../../../packages/workflow/workflow-ptc/src/runtime.ts) |

### 8.3 关键文件

| 文件 | 为什么关键 |
| --- | --- |
| [core/agent-loop/src/agent.ts](../../../packages/core/agent-loop/src/agent.ts) | 整个循环的唯一实现：`kick`/`turn`/`step`/`preStep` |
| [core/agent-loop/src/inbox.ts](../../../packages/core/agent-loop/src/inbox.ts) | 输入排队与认领的全部语义 |
| [core/agent-loop/src/runtime-context.ts](../../../packages/core/agent-loop/src/runtime-context.ts) | system prompt / reminder 的写入时机 |
| [core/agent/src/dispatch.ts](../../../packages/core/agent/src/dispatch.ts) | 三种事件派发与错误隔离 |
| [core/session/src/surface.ts](../../../packages/core/session/src/surface.ts) | surface 折叠与 `deriveMessages` |
| [session/session-checkpoint-policy/src/index.ts](../../../packages/session/session-checkpoint-policy/src/index.ts) | 三个落盘一致性点 |
| [session/session-persistence-jsonl/src/format.ts](../../../packages/session/session-persistence-jsonl/src/format.ts) | 磁盘格式与目录规则 |
| [compaction/compaction-basic/src/region.ts](../../../packages/compaction/compaction-basic/src/region.ts) | 压哪一段、怎么落地为 replace |
| [compaction/compaction-basic/src/summarizer.ts](../../../packages/compaction/compaction-basic/src/summarizer.ts) | 摘要结构与标签 |
| [plan/plan-mode/src/index.ts](../../../packages/plan/plan-mode/src/index.ts) | 计划状态机与 `exit_plan_mode` |
| [goal/goal-round-driver/src/index.ts](../../../packages/goal/goal-round-driver/src/index.ts) | 自动续轮的完整条件链 |
| [workflow/workflow-ptc/src/runtime.ts](../../../packages/workflow/workflow-ptc/src/runtime.ts) | VM 沙箱执行与 hooks |
| [todo/tool-todo/src/index.ts](../../../packages/todo/tool-todo/src/index.ts) | 全量快照语义与投影清空 |
| [boot/app-boot/src/index.ts](../../../packages/boot/app-boot/src/index.ts) | 配置树如何被驱动到稳定 |

## 9. 装配与默认配置

`packages/boot` 只做三件事：解析启动参数与环境、按 patch 层叠加出配置树、驱动 Cordis Loader 直到树稳定。它**不含运行逻辑**。

`app-boot` 的实际行为（[boot/app-boot/src/index.ts](../../../packages/boot/app-boot/src/index.ts)）：

1. 加载 gitignored `.env`，并对 bootstrap-only 变量（`PATH`、`NODE_OPTIONS`、`DSH_*`、代理与 TLS 相关等）做白/黑名单防护，防止工作区里的 `.env` 劫持进程；
2. 解析配置路径（`$DSH_SNAPSHOT=replay` 时切到 `cordis.snapshot.yml`）；
3. 加载 `$DSH_HOME` 下的用户 patch 层；
4. 装 fail-loud 的 Loader guard，驱动 Loader 至树稳定；
5. 重载完成后广播 `app-boot/config-reload`（不带 diff，监听器自行重读 Loader 条目）。

base bundle 中与本模块直接相关的行与默认值（[packages/bundle/base/cordis.patch.yml](../../../packages/bundle/base/cordis.patch.yml)，patch 是**整行 config 替换**，不是深合并）：

| 行 id | 关键默认值 |
| --- | --- |
| `session` / `session-projection` | 无特殊 config |
| `session-persistence-jsonl` | `root: dshHomePath('sessions')` |
| `session-query-sqlite` | `path: ':memory:'`、`openAt: never`（搜索关闭） |
| `session-projection-cache` | `writeEveryEvents: 200`、`writeIntervalMs: 5000` |
| `session-checkpoint-policy` | 默认开启，挂三个一致点 |
| `agent-default-model` | `provider: deepseek-official`、`model: deepseek-flash` |
| `agent-loop` | `agents: []`（由入口按需创建） |
| `system-prompt` | `personaPrefix: ''` |
| `compaction-basic` | `thresholdRatio 0.8`、`retainRatio 0.16` |
| `tool-result-pruner` | `8192 / 4096 / 1024` |
| `tool-todo` | `allowParallelInProgress: true` |
| `plan-mode` | 内嵌完整 plan-mode prompt |
| `goal` / `goal-round-driver` / `command-goal` / `tool-goal` | 默认开启 |
| `workflow-ptc` / `tool-workflow` | 默认开启 |
| `tool-executor-native` | 启用 |
| `tool-executor-ptc` | `disabled: true`（PTC 执行器默认关） |

`agent-tool-presentation` 按 `mode: 'native' | 'ptc'` 二选一（[core/agent-tool-presentation/src/index.ts](../../../packages/core/agent-tool-presentation/src/index.ts)）。默认走 native；PTC 执行器需要显式启用。

## 10. 与相邻模块的边界

**这一层不管的事**（越界即职责错位）：

| 不属于本层 | 归属 | 原因 |
| --- | --- | --- |
| 模型协议、SSE 解析、鉴权、重试策略 | [03 · 模型接入](03-models-and-config.md)（`packages/llm`） | 本层只调 `ctx.llm.stream()`，不关心提供方差异 |
| 沙箱实现、权限判定、审批 UI | `packages/sandbox`、`packages/guard`、`client/ui-approval` | 本层负责「发起工具调用」，不负责「判断能不能做」 |
| 工具的具体实现 | 各 `tool-*` 包 | 本层只提供注册表、schema、派发与结果回填 |
| UI 渲染、Slot 组合 | `packages/client` | 本层只产出事件与投影 |
| 子代理的派生策略与结果汇总 | `packages/subagent`、`07 · 协作与调度` | workflow 只调用派生接口，不定义派生规则 |
| 定时任务、提醒、外部触发 | `packages/schedule` | 本层不持有时钟；goal 续轮靠 idle 边界而非定时器 |
| MCP / 浏览器 / 桌面自动化 | 各自 `packages/*` | 它们只是工具来源，经 `ctx.tools` 进入本层 |
| 文档、Office、技能加载 | 各自 `packages/*` | 同上，通过工具或 prompt section 接入 |
| 设置分层合并与凭据存储 | `packages/settings`、`packages/credentials` | 本层读配置，不定义配置层级 |

**反过来，本层必须负责的事**（别的层不该重复实现）：

- 事件 seq 的分配与单调性；
- surface 折叠与 `deriveMessages`；
- checkpoint 落盘时机；
- turn/step 边界的唯一判定；
- `agent/pre-step` 的 waterfall 顺序；
- 压缩后的 `surfaceOp.replace` 语义；
- 投影的 `stateVersion` 兼容。

## 11. 待确认

以下内容本次**未从代码中完全确认**，正文未据此下结论，使用前建议再核对源码：

1. **`TurnEndReason` 的完整枚举**：仅确认包含 `aborted`，其余成员未逐一核对。
2. **`SessionEventMap` 的全量事件名**：主干事件（`turn/*`、`step/*`、`request/*`、`assistant/*`、`tool/result`、压缩、plan/goal/todo/workflow 相关）已确认；完整清单以 [core/session/src/types.ts](../../../packages/core/session/src/types.ts) 与 [known-event-types.ts](../../../packages/core/session/src/known-event-types.ts) 为准，本文只列已核实项。
3. **内置投影 key 的完整清单**：本文列出的 `modelSelection`、`inbox`、`turnBoundary`、`todos`、`goal`、`plan`、`tokenUsage`、`contextPressure` 是已确认存在的示例，非全量。
4. **`session/flush` 的精确同步语义**：已确认「临时文件 + rename 发布」，`datasync`/`fsync` 的具体调用位置与条件未逐行核对。
5. **`buildRequest()` / `deriveMessages()` 的精确签名与 surface 节点字段**：已确认职责与调用点，字段级结构未逐项核对。
6. **`session-query-sqlite` 的 `openAt` 取值集合**：已确认默认 `never` 且搜索会以 `SESSION_QUERY_SEARCH_DISABLED` 失败；其余取值（`first-search`、`startup`）仅在 bundle 注释中出现，未在实现中逐一验证。
7. **`compaction-basic` 的 `headroomTokens` / `compactionRetries` / `maxOverflowRetries` / `auto` 具体默认数值**：配置项存在且由 schemastery 提供默认值，数值未逐一记录（`thresholdRatio` 与 `retainRatio` 已确认）。

## 12. 参考

- 项目总览：[project-overview.md](../project-overview.md)
- 相邻分册：[03 · 模型接入、配置、凭据与可观测](03-models-and-config.md)、[07 · 协作与调度](07-collaboration-scheduling.md)
- 二开与变更：[fork-changes.md](../fork-changes.md)、[phase-1-rebrand-plan.md](../phase-1-rebrand-plan.md)
- Agent 循环实现：[packages/core/agent-loop/src/agent.ts](../../../packages/core/agent-loop/src/agent.ts)
- 会话事件与 surface：[packages/core/session/src/types.ts](../../../packages/core/session/src/types.ts)、[surface.ts](../../../packages/core/session/src/surface.ts)
- 压缩实现：[packages/compaction/compaction-basic/src/index.ts](../../../packages/compaction/compaction-basic/src/index.ts)、[region.ts](../../../packages/compaction/compaction-basic/src/region.ts)
- 装配默认值：[packages/bundle/base/cordis.patch.yml](../../../packages/bundle/base/cordis.patch.yml)
