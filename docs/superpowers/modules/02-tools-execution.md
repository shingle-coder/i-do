# 02 · 工具层与执行隔离

本文覆盖「工具如何被注册与调用」以及「执行时受到哪些约束与隔离」，取证目录为 `packages/core/tools`、`packages/core/tool-executor-*`、`packages/guard`、`packages/sandbox`、`packages/shell`、`packages/jobs`、`packages/subprocess`、`packages/terminal`、`packages/fs`、`packages/lsp`、`packages/browser-use`、`packages/computer-use`、`packages/ptc-runtime` 以及承载它们的 `packages/experimental/*` 实现包。结论均以源码为准，未验证的部分集中在第 9 节。

阅读顺序建议：先看第 2、3 节理解调用链与审批，再看第 4 节理解沙箱能约束什么、不能约束什么，最后按需查第 5 节的单工具细节。整体架构见[项目总览](../project-overview.md)，模型与配置侧见[03 · 模型与配置](./03-models-and-config.md)。

## 1. 模块地图

| 目录 | 代表包 | 职责 |
| --- | --- | --- |
| `packages/core/tools` | `dsh-tools` | 工具注册表、作用域分层、执行管线（pre-execute / execute / post-execute / result） |
| `packages/core/tool-executor-native` | `dsh-tool-executor-native` | 原生执行器：把可见工具直接派发，默认最多 10 路并发 |
| `packages/core/tool-executor-ptc` | `dsh-tool-executor-ptc` | PTC 执行器：把工具集包装成 `run_code` 程序接口 |
| `packages/interaction/user-approval` | `dsh-user-approval` | 审批服务 `ctx.approval`，把 `ask` 决策落到人 |
| `packages/interaction/permission-presets` | `dsh-permission-presets` | 把「沙箱模式 + 审批策略」打包成用户可见的权限预设 |
| `packages/guard/timeout-policy` | `dsh-tool-call-timeout-policy` | 按 `timeoutMs` 设置工具级截止时间，产出 `TOOL_TIMEOUT` |
| `packages/guard/repeat-tool-reminder` | `dsh-repeat-tool-reminder` | 检测连续重复调用并追加提醒（仅提醒，不拦截） |
| `packages/sandbox/*` | `dsh-sandbox`、`sandbox-policy`、`sandbox-local`、`sandbox-windows-acl` | 沙箱语义、模式策略、平台强制实现 |
| `packages/shell/*` | `dsh-shell`、`tool-bash`、`tool-pwsh`、`bash-sandbox`、`pwsh-sandbox`、`tool-bash-persistent` | shell 抽象、命令工具、沙箱包装、持久会话 |
| `packages/jobs/*` | `dsh-jobs`、`jobs-local`、`tool-jobs` | 后台作业服务与 `job_output` / `job_list` / `job_kill` |
| `packages/subprocess/*` | `dsh-subprocess`、`subprocess-local`、`win32-process` | 子进程与 PTY 原语、启动/信号/回收 |
| `packages/terminal/*` | `dsh-terminal`、`terminal-bash` | 终端服务抽象与本地 PTY 后端 |
| `packages/experimental/tool-terminal` | `dsh-tool-terminal` | 面向模型的终端工具 |
| `packages/fs/*` | `dsh-fs`、`fs-local`、`fs-sandbox`、`fs-observation-policy`、`tool-fs`、`tool-fs-search`、`tool-str-replace-editor` | 文件系统抽象、读写实现、沙箱校验、文件工具 |
| `packages/lsp/*` | `dsh-lsp`、`lsp-stdio`、`tool-lsp` | LSP 服务、stdio 宿主、只读查询工具 |
| `packages/browser-use/browser-use` | `dsh-browser-use` | 浏览器能力的 provider 注册槽位（本身不注册工具） |
| `packages/computer-use/computer-use` | `dsh-computer-use` | 桌面操作能力的 provider 注册槽位（本身不注册工具） |
| `packages/ptc-runtime/*` | `dsh-ptc-runtime`、`ptc-runtime-node` | 程序化工具调用的运行时抽象与 Node 实现 |

## 2. 工具从注册到结果回收

### 2.1 定义与注册

工具的定义类型是 `ToolDefinition`（[contracts.ts](../../../packages/core/tools/src/contracts.ts)），核心字段：

| 字段 | 含义 |
| --- | --- |
| `name` | 全局唯一工具名；`run_code` 为保留名 |
| `description` | 给模型看的说明，进入系统提示 |
| `parameters` | 参数 JSON Schema |
| `execute(args, exec)` | 实际执行体，拿得到 `agent`、`callId`、`signal` |
| `output` | 必填的 `{ schema, render, presentationMeta? }`：结果结构、客户端渲染、展示元信息 |
| `timeoutMs` | 可选，正有限数；由 timeout guard 消费 |
| `isConcurrencySafe(args)` | 返回严格 `true` 才允许并行调度 |
| `when` | 步骤级激活条件（`ToolRegistrationOptions`） |

注册入口是 `ToolsService.register()`（[index.ts](../../../packages/core/tools/src/index.ts)），它在写入注册表前做四类校验：

1. `output` 必须存在且 `render` 是函数，`presentationMeta` 若存在也必须是函数；
2. `output.schema` 必须通过 `assertSupportedJsonSchema`；
3. `timeoutMs` 若声明，必须是正有限数；
4. `name === RUN_CODE_NAME` 直接抛错（`RUN_CODE_NAME = 'run_code'`，定义见 [contracts.ts](../../../packages/core/tools/src/contracts.ts)）。

通过校验后经 `this.layers.effect(...)` 写入当前作用域的工具层（`ToolLayer.tools: NamedEntries<ToolRegistration>`），并返回精确的 disposer。同一层内重名会抛错，错误信息会提示「需要 per-agent 变体就注册到该 agent 的 `agent.ctx`」。

### 2.2 作用域、限制与可见性

| 机制 | 行为 |
| --- | --- |
| 作用域分层 | 工具层按 `ScopeKey` 组织；同一名字在 scoped 层注册即「遮蔽」global 版本 |
| `restrict(filter)` | 只能作用于 scoped ctx；支持 `allow`（白名单）与 `deny`（黑名单），多个限制取交集；不能点名 `run_code`，也不能点名不存在的全局工具 |
| `view(scope)` | 一次遍历得出 `visible`（可见定义）、`registrations`、`knownNames`、`restrictableNames` |
| 可执行查找 | `executable(name, scope, toolSet)` 会在 `get()` 之上叠加调用步骤的准入判断 |

`restrict()` 在无作用域 ctx 上调用会直接抛错，原因是全局限制会屏蔽所有 agent，正确做法是针对目标 agent 做限制。`deny`/`allow` 只过滤全局工具，scoped 注册自身的工具不受影响。

### 2.3 描述注入：模型如何「看到」工具

`ToolsService` 构造时向 `ctx.systemPrompt.tools(...)` 注册一个描述提供者：取当前作用域选中的执行器，调用 `executor.describe(definitions(scope, toolSet))`，再补上 `knownNames` 交给系统提示。原生执行器（[tool-executor-native](../../../packages/core/tool-executor-native/src/index.ts)）返回 `{ schemas }`，其中每个 schema 由 `projectToolSchema(definition, false)` 生成；PTC 执行器返回的是 `run_code` 及其控制参数说明（见 5.9）。

因此「工具描述」有两个来源：工具自己的 `description` / `parameters`，以及当前执行器的投影方式。换执行器会改变模型看到的形态，但不会改变工具本身的注册事实。

### 2.4 一次调用的四个阶段

执行管线的骨架在 [pipeline.ts](../../../packages/core/tools/src/pipeline.ts)，按 `prepare → dispatch → complete → finish` 推进。

**阶段一：prepare（决策）**

1. 先用 `snapshotJsonValue` 快照参数并 `deepFreeze`，无法无损 JSON 序列化的参数直接报错，避免执行期间参数被外部改写；
2. 生成执行 token（`callId` / `rootCallId`）；
3. 跑 `ctx.waterfall(carrier, 'tools/pre-execute', exec, () => { kind: 'allow' })`；
4. 决策为 `ask` 时进入审批（3.2），`deny` 直接产出错误结果，`cancel` 产出「未派发即中止」的结果。

**阶段二：dispatch（执行）**

真正的工具体被包在 `ctx.waterfall(carrier, 'tools/execute', mutableExec, () => dispatchToolBody(...))` 中。这一层是包装点：`guard/timeout-policy` 正是在这里替换 `exec.signal` 并计时的。工具体返回后结果会被规范化（校验 `output.schema`、必要时抛 `ToolOutputError`），工具通过 `exec.deferContext()` 延迟注入的上下文会挂在 `additionalContexts` 上。

**阶段三：complete（后处理）**

若 update 阶段已给出 `final-result`（如参数不可序列化、执行器拒绝），跳过 post-execute 直接进入 finish。否则依次执行：

1. `projectContent(exec, result)`：在 post-execute **之前**替换结果内容；
2. `ctx.waterfall(carrier, 'tools/post-execute', ...)`：观察者可 `accept` 或 `block` 并附带 `additionalContexts`；
3. 调用方已取消时把成功结果替换为取消结果；
4. `finalizeContent`：定义自有的最终内容变换，在 post-execute **之后**生效。

**阶段四：finish（回收）**

先 `materializeFinalResult`，再 `applyFinalContent`，最后 `notifyResult`：`Object.freeze(exec)` 后向 `tools/result` 广播，观察者抛异常只记 warn，不会污染工具结果。

### 2.5 并发与批处理

`executionMode()` 的判断是 fail-closed 的：只有 `isConcurrencySafe(args)` 严格返回 `true` 才算 `parallel`；工具不可见、未声明、返回非布尔、或判断函数抛错，一律降级为 `exclusive`。原生执行器把这个判断交给 `executeToolBatch`，并发上限默认 10（可在构造时注入）。PTC 执行器另有自己的 `maxParallelSubCalls` 与 `maxSubCallsPerMinute`（默认 1024）。

## 3. 权限审批机制

### 3.1 谁判定、在哪一层拦截

拦截点只有一个：`tools/pre-execute` 瀑布上的插件（以及管线内置的「执行器拒绝」判断）。默认决策是 `allow`，任何挂载的插件都可以把它改成 `ask` / `deny` / `cancel`：

| 决策 | 后果 |
| --- | --- |
| `allow` | 继续执行 |
| `ask` | 交给 `ctx.approval` 问人，拿不到肯定答复就不执行 |
| `deny` | 直接返回错误结果，工具体不执行 |
| `cancel` | 返回「派发前中止」结果（`TOOL_ABORTED_BEFORE_DISPATCH`） |

`guard` 两个包都**不在**这一层做权限判定：`timeout-policy` 包在 `tools/execute`（更内层），`repeat-tool-reminder` 包在 `tools/post-execute` 与 `agent/pre-step`。真正决定「要不要问人」的是权限预设/审批策略插件，真正「问人」的是 `ctx.approval`。

### 3.2 approval 服务契约

`serviceAsk()` 的实现顺序值得记住，因为它是 fail-closed 的：

1. `ctx.get('approval')` 不存在 → `APPROVAL_UNAVAILABLE`；
2. `exec.agent === undefined`（无 agent 可归属）→ `APPROVAL_UNAVAILABLE`；
3. 否则调用 `approval.request({ agent, toolName, callId, reason?, displayReason?, signal })`；
4. `'allowed-once'` → 放行本次；`'rejected'` → `APPROVAL_REJECTED`；`'cancelled'` → `APPROVAL_CANCELLED` 并标记 `approvalCancelled`；`'unavailable'` → `APPROVAL_UNAVAILABLE`。

审批结果是**闭集**且只对本次调用有效，没有「记住这次选择」的语义。错误码定义在 [error-codes.ts](../../../packages/core/tools/src/error-codes.ts)。

### 3.3 谁写入策略

会话级有两个独立旋钮：`sandbox/mode` 与 `approval/policy`。权限预设（[permission-presets](../../../packages/interaction/permission-presets/src/index.ts)）把两者打包成用户能理解的一档，默认表是：

| 预设 | 沙箱 | 审批 | 说明 |
| --- | --- | --- | --- |
| `workspace-write` | `workspace-write` | `ask` | 只允许写工作区与允许的临时目录，更宽的重试需要审批 |
| `danger-full-access` | `danger-full-access` | `never` | 完全文件访问且不弹审批 |

`custom` 与 `auto` 是保留名，不能作为配置的预设名；`custom` 表示「当前旋钮组合不对应任何预设」。切换预设会记录一条 `permission/preset` 事件（仅作为用户意图留痕），实际生效仍读两个旋钮。该服务在构造时要求 `ctx.shell.sandboxMode` 存在，否则直接抛错——预设打包了沙箱模式，挂在不受约束的执行器上属于错误配置。

工具调用级的第三种入口是 `sandbox_permissions` + `justification`：一次性的模式升级，不改会话策略，详见 4.8。

### 3.4 guard 管什么、不管什么

| 包 | 挂载点 | 做什么 | 明确不做 |
| --- | --- | --- | --- |
| [timeout-policy](../../../packages/guard/timeout-policy/src/index.ts) | `tools/execute` 包装层 | 读可见工具的 `timeoutMs`，用 `deadline()` 派生带 `TOOL_TIMEOUT` 分类的信号替换 `exec.signal`；自身计时器赢且下游已静默时，把结果替换成结构化 `TOOL_TIMEOUT` | 不杀进程、不做权限判定；工具不响应 `signal` 就超时不了（下游永不 settle 时无法产出超时结果） |
| [repeat-tool-reminder](../../../packages/guard/repeat-tool-reminder/src/index.ts) | `tools/post-execute`、`agent/pre-step` | 按 agent 统计「同工具 + 同规范化参数」的连续重复次数，在阈值（默认 `[3, 5, 8]`）追加提醒文本；用户消息到达时重置 | 不否决调用、不改写参数、不阻断执行 |

`repeat-tool-reminder` 的提醒以 `{ kind: 'repeat-tool-reminder' }` 作为消息来源标记注入，避免在派生历史里被渲染成用户发言；`include` / `exclude` 是工具名通配匹配，匹配不到任何已注册工具也合法（例如部署里没有 MCP 工具时的 `exclude: ['mcp_*']`）。

## 4. 沙箱与隔离

### 4.1 三种模式的语义

`SandboxMode` 只有三个值：`read-only`、`workspace-write`、`danger-full-access`（[sandbox/index.ts](../../../packages/sandbox/sandbox/src/index.ts)）。需要准确理解的是它们的**作用域**：这套词汇描述的是文件写入边界，网络访问与进程可见性**不在**该类型的词汇内，也就没有被这一层承诺。

### 4.2 策略解析

`sandbox-policy`（[index.ts](../../../packages/sandbox/sandbox-policy/src/index.ts)）负责把「谁说的」收敛成一个模式，优先级是：显式传入的模式 > 会话的 `sandbox/mode` > 部署默认。部署默认是 `read-only`。它还提供 `setSandboxMode()`（会话内切换）与 `registerWritableRoot()`（登记额外可写根）。

### 4.3 可写根

`writableRoots()`（[roots.ts](../../../packages/sandbox/sandbox/src/roots.ts)）的结果随模式变化：

| 模式 | 可写根 |
| --- | --- |
| `read-only` | 空集合 |
| `workspace-write` | 工作区根 + 额外可写根 + `/tmp` + `os.tmpdir()` |
| `danger-full-access` | 不施加文件写约束 |

额外可写根的校验是保守的：必须是绝对路径、不能含 NUL，并通过 `realpathSync.native()` 规范化。也就是说，指向可写区之外的 symlink 不会被当作授权——解析后的真实路径必须落在允许集合内。

### 4.4 平台强制实现

`ctx.sandbox.confine(argv, policy, signal)` 是统一入口，返回包装后的 argv（以及 enforcement 等事实字段）交由调用方去 spawn。具体 runner 由 `sandbox-local`（[index.ts](../../../packages/sandbox/sandbox-local/src/index.ts)）按平台选择：

| 平台 | 机制 | 备注 |
| --- | --- | --- |
| Linux | `bwrap`（bubblewrap），不可用时回退 `landlock` | bwrap 绑定工作区与额外可写根；Landlock 按规则集授权工作区与 `/tmp` |
| macOS | `seatbelt`（SBPL） | 默认 `deny file-write*`，再按 `writableRoots` 逐条放行 |
| Windows | `windows-acl` | 创建 `WRITE_RESTRICTED` 受限令牌 + Low 完整性级别，并以 default DACL 授予工作区/临时目录写权限 |

Windows 实现（[sandbox-windows-acl](../../../packages/sandbox/sandbox-windows-acl/src/index.ts)）还会按工作区路径派生固定的写 SID 与临时写 SID：临时 ACE 在 `dispose()` 时可回收，工作区 ACE 会被缓存而**不**撤销；`init()` 失败会回滚并抛错。

### 4.5 强制程度

`SandboxEnforcement` 只有 `full` 与 `partial` 两个取值，描述的是「实际生效的约束覆盖到了什么程度」。找不到可用后端时不是返回一个「unusable」等级，而是抛出不可用错误（`SANDBOX_UNAVAILABLE`）；shell 侧的沙箱执行器遇到 runner 失败会抛 `SandboxUnavailableError`，并可能把 `runnerFailed` 写进结果事实里。

### 4.6 边界（保守陈述）

以下都是实现层面的直接结论，不做外推：

- 沙箱约束的是**文件写效果**；读取权限、网络访问、进程可见性不在 `SandboxMode` 的语义内，也没有被声明为受保护项。
- Windows 的受限令牌方案明确不限制读取、网络与进程可见性；控制台隔离在该方案下不可用（`CREATE_NO_WINDOW` 会触发 DLL 初始化失败）。硬链接、AppContainer ACL 属于已知未覆盖面。
- Windows 下「额外可写根」只对 harness 自己的文件工具生效，子进程侧会被忽略。
- `fs-sandbox` 在文件工具路径上还有一层独立校验（4.7），它和 OS 级沙箱是两道不同的闸门，不能互相替代。
- PTC 的程序执行是**进程级**隔离与超时控制，不是安全沙箱；`danger-full-access` 下它连 `confine` 都不调用。
- 这套机制的设计目标是限制误伤范围与提高可审计性。它不宣称能抵御恶意代码，也不等价于容器/虚拟机级隔离。

### 4.7 文件工具的二次校验

`fs-sandbox`（[index.ts](../../../packages/fs/fs-sandbox/src/index.ts)）在每次写入类操作前重算目标：

| 模式 | 行为 |
| --- | --- |
| `danger-full-access` | 直接放行 |
| `read-only` | 抛 `FS_SANDBOX_DENIED` |
| `workspace-write` | 对目标重新 `realpath` 并做 containment 检查，返回「新鲜」的目标对象 |

返回 fresh target 的目的很明确：避免检查与真正写入之间目标被替换（TOCTOU）。配合 `fs-observation-policy`，`edit` / `delete` 这类操作还要求先观察到文件状态（present/absent），未观察就写会得到 `FS_NOT_OBSERVED`。

### 4.8 一次性升级（`sandbox_permissions`）

被沙箱拒绝后，模型可以带 `sandbox_permissions` + `justification` 重试一次。规则集中在 [escalation.ts](../../../packages/sandbox/sandbox/src/escalation.ts)：

| 环节 | 规则 |
| --- | --- |
| 参数配对 | 两者必须同时出现；`justification` 不能是空白 |
| 严格更宽 | `read-only → workspace-write / danger-full-access`；`workspace-write → danger-full-access`；其余组合在**执行期**报错（不写进 schema，因为有效模式是每次调用的真值） |
| 审批 | 在执行**之前**通过审批通道请求，返回 `allowed-once` 才生效，且只作用于本次调用 |
| 失败 | 分别映射到 `SANDBOX_ESCALATION_INVALID_ARGUMENT` / `_UNAVAILABLE` / `_REJECTED` / `_CANCELLED` |
| 模型提示 | 拒绝标记统一为 `[sandbox: file access denied under <mode> mode]`，并附一条「可用 `sandbox_permissions` 重试一次」的提示 |

申请被拒时的错误文案会明确要求模型停下解释，而不是绕过限制。

## 5. 执行类工具逐个

### 5.1 shell（`bash` / `pwsh`）

工具定义在 [tool-bash](../../../packages/shell/tool-bash/src/index.ts)（`tool-pwsh` 为同一套逻辑的方言变体）。

| 参数 | 说明 |
| --- | --- |
| `command` | 要执行的命令（必填） |
| `description` | 5–10 词的主动语态说明，用于 UI 展示（必填） |
| `timeoutMs` | 执行器会施加默认值与上限；是否「超时后转后台」取决于部署是否启用 promote |
| `workdir` | 默认会话工作区，相对路径按工作区解析 |
| `run_in_background` | 立即返回 job id，不再受超时约束，用 `job_output` 取输出、`job_kill` 停止 |
| `sandbox_permissions` + `justification` | 仅当部署声明了可升级目标时出现 |

执行路径：`resolveSandboxPolicy(exec)` 得到有效模式 → `validateBashArgs` → 若有升级请求则 `approveBashEscalation`（见 4.8）→ `ctx.workingDirectory.ensure()` 解析 cwd → `ctx.shellEnv.collect(exec)` 注入 `DSH_*` → `ctx.shell.execute(request)`。实际执行器是 `bash-sandbox`：它在 `execute()` 里调用 `ctx.sandbox.confine(['bash', '-c', command], policy, signal)`，并用 `classifyDenial()` 把拒绝标记写进 `result.sandbox.denied`。

输出结构是三种互斥形态：`background`（job id）、`promoted`（超时后转后台，含 jobId 与已收集输出）、`foreground`（exitCode、signal、timedOut、aborted、stdout/stderr 文本与截断标记、spillPath，以及 `sandbox` 事实）。

前台等待会分别处理：超时、调用方中断、超出等待窗口被 promote 到后台、正常退出码、stderr 合并。默认工作目录是会话工作区；`DSH_*` 环境变量（`DSH_HOME`、`DSH_SHELL`、`DSH_SESSION_ID`、`DSH_PROFILE*`）在调用方 env 之后合入，覆盖优先级最低。

**持久会话变体**：`tool-bash-persistent`（[index.ts](../../../packages/shell/tool-bash-persistent/src/index.ts)）按 agent 复用同一个 PTY shell，只暴露 `command` 一个参数，默认 `timeoutMs` 300000、`maxOutputChars` 16000。命令串行执行，超时或中断时会先读取已有部分输出再重置 shell。

### 5.2 后台作业

作业服务在 `packages/jobs/jobs`（抽象）与 `packages/jobs/jobs-local`（本地实现），模型可见的三个工具在 [tool-jobs](../../../packages/jobs/tool-jobs/src/index.ts)：`job_output`、`job_list`、`job_kill`。

| 事实 | 说明 |
| --- | --- |
| 所有权 | 作业归属某个 owner（agent），后台输出按 owner 归档 |
| 上限 | 每个 owner 有并发作业上限，超限报错并建议先 `job_kill` |
| 生命周期 | 调用方取消后所有权移交给作业服务，工具调用结束不代表进程结束 |
| 不可用 | 若部署未加载作业控制器，`run_in_background` 会以 `JOB_BACKGROUND_DISABLED` 或「后台作业不可用」报错 |

### 5.3 subprocess

`ctx.subprocess` 提供两个原语（[subprocess/index.ts](../../../packages/subprocess/subprocess/src/index.ts)）：`spawn()` 与 `spawnTerminal()`。前者是普通管道子进程，后者分配真实 PTY。

| 能力 | 实现 |
| --- | --- |
| stdio | `stdin` / `stdout` / `stderr`，另有 `control` 管道用于控制通道 |
| 信号 | POSIX 对进程组发 `SIGTERM` / `SIGINT`；Windows 走 `taskkill /PID <pid> /T /F` 整棵树 |
| 收尾 | 支持 `graceMs` 优雅期，超时后强杀 |
| 受限启动 | [win32-process](../../../packages/subprocess/win32-process/src/process.ts) 用 `CreateProcessAsUserW` + 受限令牌 + 显式 stdio 管道，供需要有界权限的启动路径使用 |

PTY 在 `subprocess-local` 中通过加载 `node-pty` 实现，Windows 使用 ConPTY（启用 `conptyDll`）。相关拒绝/异常语义包含「无后端」「无会话」「会话不属于调用者」「已有发送在进行」「owner 已不在」等分类。

### 5.4 terminal

| 层 | 包 | 职责 |
| --- | --- | --- |
| 服务抽象 | `packages/terminal/terminal` | `ctx.terminals`：后端注册、会话归属、所有权校验；不依赖原生 PTY |
| 本地后端 | [terminal-bash](../../../packages/terminal/terminal-bash/src/index.ts) | 组装 argv/cwd/env/启动脚本，先解析策略再 `ctx.subprocess.spawnTerminal(...)` |
| 模型工具 | [tool-terminal](../../../packages/experimental/tool-terminal/src/index.ts) | 暴露创建/读写/关闭终端的工具 |

会话状态机为 `running / exited / closing`，同一时刻只允许一个 active send（`startSend()`），发送有 `activeDeadlineTimer` 计时；`dispose` 有约 3 秒的宽限期。启动时会执行 `stty -echo; set +H` 之类的前置命令以稳定交互，输出数据块经过 sanitize 后再喂给终端模拟层（`@xterm/headless`）。

已知约束：终端会话是按 agent 归属的资源，跨 agent 复用会被拒绝；PTY 输入输出是流式的，超时只能结算「本次发送」，不能回滚已产生的副作用。

### 5.5 fs

抽象在 [fs/index.ts](../../../packages/fs/fs/src/index.ts)：`resolve`、`readText` / `streamText` / `readBytes` / `readByteRange`、`writeText`、`editText`、`patchText`、`deleteFile`、`moveFile`。本地实现（[fs-local](../../../packages/fs/fs-local/src/index.ts)）的关键行为：

- **原子写**：在工作目录下建私有 staging 目录，用 `open(tempPath, 'wx', 0o600)` 独占创建临时文件，写入并 `fsync`，再按目标状态选择 `link`（不覆盖已有文件）、`rename`（覆盖）或替换路径；Windows 上会先复制目标 DACL。
- **串行化**：按 `targetKey` 加写锁，同一目标的并发写不会交错。
- **版本探测**：写入前后比对版本，用于「基于旧内容覆盖」的检测。
- **二进制保护**：检测到非文本内容抛 `FS_NOT_TEXT`，避免把二进制当文本编辑。

模型可见的文件工具：

| 工具 | 关键行为 |
| --- | --- |
| `read` | `file_path` + `offset` / `limit` 的行窗口读取；成功后标记 `fs/observed` |
| `read_image` | 读取图片内容供多模态消费 |
| `write` | 先走 `fs/write-intent`（`createIfAbsent` / `replaceIfVersion`），再 `ctx.fs.writeText` |
| `edit` | 精确文本替换；要求目标已被观察 |
| `apply_patch` | 补丁式修改 |
| `glob` | 基于 `@vscode/ripgrep`，默认最多 100 条结果，超限溢出到文件；固定排除 VCS 目录（`.git` / `.svn` / `.hg` / `.bzr` / `.jj` / `.sl`），开启 `--no-ignore --hidden` 并用双负 glob 剪枝 |
| `grep` | 内容搜索，复用同一 ripgrep 通道 |
| `str_replace_editor` | `view` / `create` / `str_replace` / `insert` 四类操作；`str_replace` 要求 `old_str` 唯一匹配，多匹配即失败 |

所有写路径都会经过 `FsSandboxController` 注入的策略与拒绝标记（4.7），因此文件工具的「拒绝」有两类来源：OS 级沙箱拒绝、文件层策略拒绝，模型看到的标记是统一的。

### 5.6 lsp

| 层 | 实现 |
| --- | --- |
| 服务 | [lsp/index.ts](../../../packages/lsp/lsp/src/index.ts)：按文件扩展名注册 provider，`query()` 统一入口；无匹配 provider 抛 `LSP_UNAVAILABLE` |
| 宿主 | [lsp-stdio](../../../packages/lsp/lsp-stdio/src/host.ts)：stdio 子进程方式托管语言服务器；要求文件在 workspace 内，并限制单文档最大字节 |
| 工具 | [tool-lsp](../../../packages/lsp/tool-lsp/src/index.ts)：`lsp` 工具，参数 `operation` / `file_path` / `line` / `character` |

`operation` 只有四个只读取值：`goToDefinition`、`findReferences`、`goToImplementation`、`hover`。工具要求存在会话工作区作为 cwd，且不做任何写操作。

已知约束：没有 provider 就是不可用，不会临时启动别的语言服务器；查询依赖宿主进程存活，语言服务器崩溃时错误会原样冒泡。

### 5.7 browser-use

核心包 [browser-use/index.ts](../../../packages/browser-use/browser-use/src/index.ts) 只维护**一个 provider 槽位**：`ctx.browserUse.register(name)`，重复注册会保护已有 provider。它本身不注册任何模型工具。实际能力在实验包中：

| 包 | 形态 |
| --- | --- |
| [browser-use-stagehand-native](../../../packages/experimental/browser-use-stagehand-native/src/index.ts) | 用 `createMcpToolDefinition` 逐方法生成工具，名字形如 `stagehand_${method}`（含 `stagehand_tabs`） |
| [browser-use-playwright-mcp](../../../packages/experimental/browser-use-playwright-mcp/src/index.ts) | 以 MCP 方式接入 Playwright |
| [browser-use-chrome-devtools-mcp](../../../packages/experimental/browser-use-chrome-devtools-mcp/src/index.ts) | 以 MCP 方式接入 Chrome DevTools |
| [browser-use-runtime](../../../packages/experimental/browser-use-runtime/src/index.ts) | 浏览器运行时支撑 |

stagehand 的提示词明确了三条边界：浏览器属于本 Session 或显式配置的已有浏览器；必须使用 `stagehand_tabs` 返回的 tab id 操作；Session 日志不恢复浏览器状态，动作「完成」也不代表结果正确，需要重新验证。

### 5.8 computer-use

核心包 [computer-use/index.ts](../../../packages/computer-use/computer-use/src/index.ts) 同样是单一 provider 槽位（`ctx.computerUse.register(name)`），不注册工具。实现在实验包：

| 包 | 形态 |
| --- | --- |
| [cua](../../../packages/experimental/cua/src/index.ts) | 注册 `dsh-cua` provider；原始工具名 `cua`；非 PTC 预设额外获得 `cua_run_code` 持久程序工具（[tool-registration.ts](../../../packages/experimental/cua/src/tool-registration.ts)） |
| `computer-use-cua-driver-native` / `computer-use-cua-driver-mcp` | 原生驱动与 MCP 驱动两种接入 |
| `cua-windows` / `cua-macos` | 平台侧驱动能力 |

`cua_run_code` 的程序内只允许 `tools.cua`，用 `inspect(...)` 展示文本与图片；持久 PTC 场景需要 `connectCua(() => tools.cua)` 桥接初始化，`cua` 不是预装全局。该包对 agent 的应用访问许可是显式建模的，未获批的应用不会被操作。

### 5.9 ptc-runtime 与 `run_code`

PTC（programmatic tool calling）把工具集包装成「写一段程序来调用工具」的形态。核心约定：

| 事实 | 说明 |
| --- | --- |
| `run_code` 保留名 | 由 `RUN_CODE_NAME` 固定，任何插件都不能注册或遮蔽该名字 |
| 运行时抽象 | [ptc-runtime](../../../packages/ptc-runtime/ptc-runtime/src/index.ts)：`language` / `isolation` / `programFormat` / `retainsState` / `sandboxMode` / `timeout`，方法 `resolve()` / `run()` / `release()` |
| Node 实现 | [ptc-runtime-node](../../../packages/ptc-runtime/ptc-runtime-node/src/index.ts)：注入 `fs` / `subprocess` / `sandbox` / `sandboxPolicy`，用子进程承载程序 |
| Python 实现 | `packages/experimental/ptc-runtime-python` |
| 状态复用 | 持久 worker 按 policy（mode / workspaceRoot / sessionId）复用，policy 变化即重建 |
| 限额 | `maxSubCallsPerMinute` 默认 1024，另有 `maxParallelSubCalls`；超限抛 `ToolCallLimitExceededError` |
| 超时 | 程序超时被 `clampTimeout` 收敛到部署上限 |

隔离实现（[worker.ts](../../../packages/ptc-runtime/ptc-runtime-node/src/worker.ts)）的关键分支是：

- `policy.mode === 'danger-full-access'` 时**不**调用 `ctx.sandbox.confine`，直接用原 argv；
- 其余模式先 `confine(argv, policy, signal)`，再用包装后的 argv 调 `ctx.subprocess.spawn({ ..., stdio: { stdin: 'ignore', stdout: 'pipe', stderr: 'pipe', control: 'pipe' } })`；
- cwd 默认取 `sandboxPolicy.workspaceRoot`。

因此 PTC 的隔离强度**等于**当时沙箱模式的强度，`danger-full-access` 下只有进程与超时约束，没有文件写约束。

## 6. 失败、超时、中断

### 6.1 错误码总表

| 层 | 错误码 | 触发点 |
| --- | --- | --- |
| 工具管线 | `TOOL_ABORTED` | 工具体已开始后调用方取消，且结果成功时替换 |
| 工具管线 | `TOOL_ABORTED_BEFORE_DISPATCH` | 派发前检测到取消 |
| 工具管线 | `ToolNotFoundError` / `ToolOutputError` | 工具不可见；返回值不满足 `output.schema` |
| 审批 | `APPROVAL_REJECTED` / `APPROVAL_CANCELLED` / `APPROVAL_UNAVAILABLE` | 用户拒绝；用户/通道取消；无审批服务或无 agent |
| 超时 | `TOOL_TIMEOUT` | timeout guard 自身计时器赢且下游静默 |
| 沙箱 | `SANDBOX_UNAVAILABLE` | 平台无可用后端；runner 初始化失败 |
| 沙箱升级 | `SANDBOX_ESCALATION_INVALID_ARGUMENT` / `_UNAVAILABLE` / `_REJECTED` / `_CANCELLED` | 见 4.8 |
| 文件 | `FS_SANDBOX_DENIED` / `FS_NOT_TEXT` / `FS_NOT_OBSERVED` / `FS_NOT_FOUND` | 文件层策略拒绝；二进制；未观察；写入失败 |
| LSP | `LSP_UNAVAILABLE` | 没有匹配扩展名的 provider |
| 作业 | `JOB_BACKGROUND_DISABLED` | 部署禁用后台运行，但模型仍传了 `run_in_background` |

### 6.2 超时

超时有三层，作用点不同：

1. **工具级**：`ToolDefinition.timeoutMs` → `guard/timeout-policy` 在 `tools/execute` 外层设 deadline。它是协作式的：只有工具响应 `exec.signal` 并收敛，才能被替换成 `TOOL_TIMEOUT`。
2. **命令级**：`bash` 的 `timeoutMs` 由 shell 执行器消费。配置了 promote 时，超时把命令转成后台作业并返回 `promoted`，进程继续跑；未配置时按超时终止。
3. **会话/程序级**：PTY 的 `activeDeadlineTimer`（单次发送）、持久 bash 的默认 300000ms、PTC 的 `clampTimeout`。

### 6.3 中断

中断以 `AbortSignal` 贯穿：管线把调用方信号与内部信号融合成执行信号，传给 `tools/execute` 包装层与工具体。落地行为：

| 场景 | 结果 |
| --- | --- |
| 取消发生在派发前 | `TOOL_ABORTED_BEFORE_DISPATCH`，工具体不执行 |
| 取消发生在执行中且工具成功返回 | 结果被替换为取消结果（`TOOL_ABORTED`） |
| 取消发生在执行中且工具已报错 | 保留工具自己的错误，不覆盖 |
| 审批期间取消 | 若审批通道报告 `cancelled`，返回派发前中止结果 |
| 子进程 | POSIX 向进程组发信号；Windows `taskkill /T /F` 整棵树 |
| PTY | 结算本次发送的超时/中断并重置 shell 会话 |
| 后台作业 | 所有权移交作业服务，不受工具调用取消影响 |

审批阶段若 `approval.signal` 已中止，升级路径会 `throwIfAborted()`，让取消语义优先于「审批被取消」的普通错误。

### 6.4 沙箱拒绝的呈现

被拒绝不是异常崩溃，而是结构化事实加提示：`bash` 结果带 `sandbox: { mode, denied, enforcement, runnerFailed }`，文件工具抛 `FS_SANDBOX_DENIED`，两者都会带上 4.8 的拒绝标记与升级提示。这样模型能区分「命令失败」与「策略拒绝」。

## 7. 关键接口与类型

| 类型 / 接口 | 定义位置 | 职责 |
| --- | --- | --- |
| `ToolDefinition` | [core/tools/contracts.ts](../../../packages/core/tools/src/contracts.ts) | 工具的形状：schema、执行体、输出渲染、超时、并发判断 |
| `ToolRegistrationOptions` | 同上 | 注册选项（`when` 激活条件） |
| `PreToolDecision` / `PostToolDecision` | 同上 | 前置与后置策略的闭集决策 |
| `ToolExecutionResult` | 同上 | 统一结果：`content`、`isError`、`error`、`additionalContexts` |
| `ToolRunContext` / `ToolExecution` | 同上 | 单次执行的上下文（agent、callId、signal、deferContext） |
| `ToolsService` | [core/tools/index.ts](../../../packages/core/tools/src/index.ts) | 注册、限制、可见性视图、执行器选择 |
| `ToolExecutionPipeline` | [core/tools/pipeline.ts](../../../packages/core/tools/src/pipeline.ts) | 四阶段执行与结果结算 |
| `ToolExecutor` | [core/tools/executor.ts](../../../packages/core/tools/src/executor.ts) | `describe()` / `execute()` 的执行器契约 |
| `SandboxMode` / `SandboxEnforcement` | [sandbox/index.ts](../../../packages/sandbox/sandbox/src/index.ts) | 模式与强制程度 |
| `SandboxPolicy` | [sandbox/index.ts](../../../packages/sandbox/sandbox/src/index.ts) | `mode` + `workspaceRoot` + 额外可写根 |
| `SandboxEscalationError` / `EscalationOutcome` | [sandbox/escalation.ts](../../../packages/sandbox/sandbox/src/escalation.ts) | 升级错误与闭集结果 |
| `ShellExecRequest` / `ShellRunResult` | [shell/types.ts](../../../packages/shell/shell/src/types.ts) | shell 请求与结果（含 sandbox 事实） |
| `SubprocessSpawnSpec` | [subprocess/index.ts](../../../packages/subprocess/subprocess/src/index.ts) | 子进程/PTY 启动参数 |
| `FileSystem` | [fs/index.ts](../../../packages/fs/fs/src/index.ts) | 文件读写、编辑、移动、删除抽象 |
| `LspProvider` | [lsp/index.ts](../../../packages/lsp/lsp/src/index.ts) | 按扩展名路由的查询提供者 |
| `PtcRuntime` | [ptc-runtime/types.ts](../../../packages/ptc-runtime/ptc-runtime/src/types.ts) | 程序运行时的能力面与方法 |
| `ApprovalService` | [user-approval/index.ts](../../../packages/interaction/user-approval/src/index.ts) | `request()` 返回审批闭集结果 |

## 8. 关键文件职责

| 文件 | 职责 |
| --- | --- |
| [core/tools/src/index.ts](../../../packages/core/tools/src/index.ts) | 注册表、作用域分层、限制编译、描述注入 |
| [core/tools/src/pipeline.ts](../../../packages/core/tools/src/pipeline.ts) | prepare/dispatch/complete/finish 四阶段与审批落地 |
| [core/tools/src/contracts.ts](../../../packages/core/tools/src/contracts.ts) | 全部核心类型与保留名常量 |
| [core/tools/src/error-codes.ts](../../../packages/core/tools/src/error-codes.ts) | 审批与中止错误码 |
| [core/tool-executor-native/src/index.ts](../../../packages/core/tool-executor-native/src/index.ts) | 原生执行器与批处理并发上限 |
| [core/tool-executor-ptc/src/ptc.ts](../../../packages/core/tool-executor-ptc/src/ptc.ts) | PTC 执行器的子调用限流与调度 |
| [guard/timeout-policy/src/index.ts](../../../packages/guard/timeout-policy/src/index.ts) | `tools/execute` 超时包装 |
| [guard/repeat-tool-reminder/src/index.ts](../../../packages/guard/repeat-tool-reminder/src/index.ts) | 重复调用检测与提醒注入 |
| [sandbox/src/index.ts](../../../packages/sandbox/sandbox/src/index.ts) | 沙箱服务、`confine()`、拒绝签名与 runner 失败规则 |
| [sandbox/src/roots.ts](../../../packages/sandbox/sandbox/src/roots.ts) | 可写根计算与路径规范化 |
| [sandbox/src/escalation.ts](../../../packages/sandbox/sandbox/src/escalation.ts) | 升级阶梯、参数校验、审批编排、模型提示文本 |
| [sandbox-policy/src/index.ts](../../../packages/sandbox/sandbox-policy/src/index.ts) | 模式解析优先级、会话切换、额外可写根登记 |
| [sandbox-local/src/index.ts](../../../packages/sandbox/sandbox-local/src/index.ts) | 平台 runner 选择与 `full/partial` 判定 |
| [sandbox-windows-acl/src/index.ts](../../../packages/sandbox/sandbox-windows-acl/src/index.ts) | Windows 受限令牌、SID 派生、ACE 授予与回收 |
| [tool-bash/src/index.ts](../../../packages/shell/tool-bash/src/index.ts) | `bash` 工具：参数、升级、执行、三种输出形态 |
| [tool-bash/src/background.ts](../../../packages/shell/tool-bash/src/background.ts) | 后台作业的启动、等待与所有权移交 |
| [bash-sandbox/src/index.ts](../../../packages/shell/bash-sandbox/src/index.ts) | 在 `execute()` 中注入策略并调用 `confine` |
| [shell-env/src/index.ts](../../../packages/shell/shell-env/src/index.ts) | `DSH_*` 环境变量收集与合并顺序 |
| [tool-bash-persistent/src/index.ts](../../../packages/shell/tool-bash-persistent/src/index.ts) | 持久 PTY shell 的串行执行与重置 |
| [jobs/tool-jobs/src/index.ts](../../../packages/jobs/tool-jobs/src/index.ts) | `job_output` / `job_list` / `job_kill` |
| [jobs-local/src/index.ts](../../../packages/jobs/jobs-local/src/index.ts) | 本地作业存储、并发上限、输出归档 |
| [subprocess-local/src/index.ts](../../../packages/subprocess/subprocess-local/src/index.ts) | 子进程与 PTY 启动、`node-pty` 加载、会话归属 |
| [subprocess-local/src/spawn.ts](../../../packages/subprocess/subprocess-local/src/spawn.ts) | 信号与进程树终止 |
| [terminal-bash/src/index.ts](../../../packages/terminal/terminal-bash/src/index.ts) | 终端后端：argv/沙箱/cwd/env/启动与收尾 |
| [terminal-bash/src/session.ts](../../../packages/terminal/terminal-bash/src/session.ts) | 会话状态机、单发送限制、超时结算 |
| [fs-local/src/fsio.ts](../../../packages/fs/fs-local/src/fsio.ts) | 原子写、staging、DACL 复制、二进制检测 |
| [fs-sandbox/src/index.ts](../../../packages/fs/fs-sandbox/src/index.ts) | 文件写入的策略校验与 fresh target |
| [fs-observation-policy/src/index.ts](../../../packages/fs/fs-observation-policy/src/index.ts) | 观察状态记录与写意图裁决 |
| [tool-fs/src/index.ts](../../../packages/fs/tool-fs/src/index.ts) | `read` / `read_image` / `write` / `edit` / `apply_patch` 注册 |
| [tool-fs-search/src/glob.ts](../../../packages/fs/tool-fs-search/src/glob.ts) | ripgrep 驱动的 glob、结果上限、VCS 排除 |
| [tool-str-replace-editor/src/index.ts](../../../packages/fs/tool-str-replace-editor/src/index.ts) | 四操作编辑器与唯一匹配约束 |
| [lsp-stdio/src/host.ts](../../../packages/lsp/lsp-stdio/src/host.ts) | 语言服务器托管、工作区校验、文档大小限制 |
| [tool-lsp/src/index.ts](../../../packages/lsp/tool-lsp/src/index.ts) | 只读 LSP 查询工具 |
| [cua/src/index.ts](../../../packages/experimental/cua/src/index.ts) | 桌面 provider 与 `cua` 原始工具 |
| [cua/src/tool-registration.ts](../../../packages/experimental/cua/src/tool-registration.ts) | `cua_run_code` 与预设相关的工具切换 |
| [ptc-runtime-node/src/worker.ts](../../../packages/ptc-runtime/ptc-runtime-node/src/worker.ts) | 受限启动、stdio 管道、worker 复用 |
| [ptc-runtime-node/src/execution.ts](../../../packages/ptc-runtime/ptc-runtime-node/src/execution.ts) | 策略解析、cwd 默认值、超时收敛 |
| [bundle/base/cordis.patch.yml](../../../packages/bundle/base/cordis.patch.yml) | 沙箱、审批、预设、shell 工具的装配配置 |
| [bundle/web-app/presets/minimal.patch.yml](../../../packages/bundle/web-app/presets/minimal.patch.yml) | 终端与持久 shell 的预设装配 |

## 9. 待确认

以下点未在本次取证中完全确认，写作时按保守理解处理：

1. **平台 runner 的默认判定表**：`sandbox` 的 `denialSignatures`、`runnerFailureRules`、`allowedExitCodes` 的默认取值未逐条核对，第 4.4 / 4.5 节只描述了机制，未列举具体签名。
2. **`danger-full-access` 是否仍走 `confine`**：PTC 明确跳过；bash/fs 在 `danger-full-access` 下是否仍调用 runner、以及此时 Windows 是否仍创建受限令牌，未逐一验证。
3. **Windows 额外可写根的生效范围**：依据 `sandbox-windows-acl` 的注释，子进程侧忽略额外根、仅 harness 文件工具 honored，但未做运行期验证。
4. **部署侧的权限预设表**：默认表只有 `workspace-write` 与 `danger-full-access`，实际 bundle 是否覆盖配置未逐个检查；`auto` 预设由 Auto review 集成在运行期发布，其具体登记方式未展开。
5. **PTY 与沙箱的组合细节**：`terminal-bash` 会先解析策略再交给 `spawnTerminal`，但 Windows 上 ConPTY 与受限令牌叠加后的实际效果未验证。
6. **browser-use / computer-use 的工具全集**：只确认了 `stagehand_*`、`cua`、`cua_run_code` 的形态，各 provider 的完整工具清单未逐一列举。
7. **`tool-bash-persistent` 与沙箱的关系**：持久会话复用同一 PTY，后续命令是否复用首次的沙箱策略（而不是每次重解析）未确认。
8. **审批 UI 侧行为**：「拒绝后是否记住选择」「审批超时」等前端语义属于交互模块，本文只覆盖服务端闭集结果。
