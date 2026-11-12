# 08 · 基础设施与工程化

本文覆盖 `packages/util`、`packages/storage`、`packages/workspace`、`packages/ssh`、`packages/test-support`、`benchmarks`、`scripts`、`patches`、`vendor`、`website` 十个目录。

同层文档：[project-overview.md](../project-overview.md)（全局视角）、[03-models-and-config.md](03-models-and-config.md)（模型与配置）、[07-collaboration-scheduling.md](07-collaboration-scheduling.md)（协作与调度）。

阅读方式：本文不按文件夹顺序罗列，而是按「这一层要解决什么问题」组织。每个小节先回答「没有它会怎样」，再给机制、格式与关键文件。

## 1. 这一层解决什么问题

产品功能层（会话、工具、Agent Loop、Web UI）依赖一组不直接面向模型的基础能力。它们要么决定数据能否安全落盘，要么决定测试与性能是否可信，要么决定依赖能否被长期维护。

| 要解决的问题 | 承担者 | 一句话机制 |
|---|---|---|
| 数据落在哪、坏了怎么办 | `packages/storage` | 领域规范 + 可插拔后端（JSON / SQLite），原子发布 + 版本迁移 |
| 用户的项目列表从哪来 | `packages/workspace` | 每个规范化目录一条记录，会话按运行目录归组，对模型不可见 |
| 大量跨包重复的小逻辑 | `packages/util` | 23 个零业务依赖的基座包，核心是原子写、错误、值校验、路径与超时 |
| 本机能力如何投射到远端 | `packages/ssh` | 通过 OpenSSH 别名 + 远端 helper，复用同一套文件/子进程/沙箱接口 |
| 如何在没有密钥时测试 | `packages/test-support` | mock LLM、回放适配器、会话快照与工具测试套件 |
| 如何防止性能回归 | `benchmarks` | 按用户路径设门禁，合成输入 + 机器档案缩放 + HTML 报告 |
| 如何让 360+ 个工程动作可复现 | `scripts` | 生成、校验、运行、构建四类脚本，配 `run-gates.ts` 编排 |
| 上游依赖有 bug 怎么办 | `patches` | pnpm `patchedDependencies`，精确锁定 12 个版本 |
| 框架层要不要自己拥有 | `vendor` | 9 个 Cordis 相关包源码内置，改名为 `@deepseek-ai` 作用域 |
| 文档如何对外发布 | `website` | VitePress + 自研页面清单与仓库文档投影，双通道部署 |

## 2. 数据落盘：storage

### 2.1 分四层，各管一件事

`packages/storage` 下四个包分工明确，缺一层都会让「换后端」或「改格式」变成全局改造。

| 包 | 职责 | 为什么单独存在 |
|---|---|---|
| `dsh-storage` | 存储抽象与服务注册，把单元路由到后端 | 业务只依赖接口，不依赖 JSON/SQLite |
| `dsh-storage-domain` | 领域规范、版本声明、迁移编排 | 「这个单元叫什么、第几版、能不能读旧版」与介质无关 |
| `dsh-storage-json` | JSON 后端，注册为 `json` | 运维需要可直接查看/编辑的文件 |
| `dsh-storage-sqlite` | SQLite 后端，注册为 `sqlite` | 高频定点写入时避免整文件重写 |

四个包都只在宿主侧运行，不贡献 prompt、工具或 schema，因此不进入模型的请求前缀。详见[存储子系统](../../subsystems/storage.zh.md)、[持久化子系统](../../subsystems/persistence.zh.md)。

### 2.2 存在哪

JSON 后端只有一个必填插件字段 `root`。它**不回退到 `process.cwd()`**：不配置就报错，避免「以为写到了数据目录，其实写到了启动目录」。目录按需创建，权限 `0o700`。字段的穷尽真源见 [config-catalog.zh.md](../../config-catalog.zh.md) 的 `deepseek-aidsh-storage-json` 一节。

SQLite 后端把每个已路由单元托管在同一个数据库文件里，每条记录占一行、内容是一份 JSON 文档。单条记录更新只替换一行，适合高频定点写入。它使用 `node:sqlite`，写操作同步执行，会阻塞 JS 线程——这是选择它时必须接受的代价。

### 2.3 什么格式

JSON 后端有两种布局，差别在「谁是权威状态」。

**`single`（默认）**：每个单元一份完整文件 `<root>/<unit>.json`，内存中的单元状态是权威，每次变更全量重写。

```json
{
  "unit": { "name": "workspace", "version": 1 },
  "global": null,
  "tables": {
    "workspaces": {
      "<key>": { "path": "/work/demo" }
    }
  }
}
```

**`per-record`**：每条记录一份带版本戳的文档，目录树是权威。

```text
<root>/<unit>/<table>/<key>.json     # { "version": 1, "record": <value> }
<root>/<unit>/global.json            # 可选，单元级状态
```

`per-record` 的 key 必须匹配 `[a-zA-Z0-9_-]+`；不支持或不可读的文档按「不存在」处理；它没有多记录事务。它适合可丢弃、可定点写入的记录；需要跨记录一致性的单元应留在 `single`。

### 2.4 写入为什么不会写坏

两种布局的每次发布都走同一条路径：写临时文件 → `fsync` → 原子 `rename()` 替换 → 在 POSIX 上再 `fsync` 父目录。实现位于 [atomic-write](../../../packages/util/atomic-write/README.zh.md)，它同时提供跨进程写锁，并处理目标为符号链接的情况。

`single` 布局还有一条恢复规则：序列化失败时恢复内存状态，磁盘保持上一份完整文件；I/O 结果不确定时只能关闭并重开单元，不能假设写入失败。

### 2.5 版本与迁移

迁移不是「跑一个升级脚本」，而是「领域自己声明能读哪些版本」。

- 每个单元声明当前版本与 `compatibleVersions`。版本不在可接受集合内，`single` 报 `version-mismatch`；`per-record` 中版本不符的单份文档直接读作不存在。
- 内容无法解析时，`single` 报 `malformed-medium`（这是「介质坏了」，不是「格式升级」）。
- 对接受的旧单元，**首次修改时**更新版本戳：JSON 在下次原子写时落入文件，SQLite 在同一事务里更新版本元数据——所以不会出现「数据已是新格式、版本号还是旧的」的中间态。
- 其余状态错误统一为 `unknown-state` 与 `closed`（单元已关闭）。
- 旧 `single` 文件可以作为新 `per-record` 目录树的引导来源：同单元名且版本在可接受集合内即可，源文件保持不变。

### 2.6 怎么选

| 场景 | 选择 |
|---|---|
| 小型单元、需要可读可编辑的单文件 | `single` |
| 记录可丢弃、写入集中在少数记录 | `per-record` |
| 记录量大、更新频繁、需要事务内版本更新 | `sqlite` |
| 需要看 diff 做代码评审 | `json`（`single`，配合格式化） |

## 3. 项目列表：workspace

### 3.1 它不是 VS Code 的多根工作区

这是最容易误读的一点。本仓库**不存在**「一个窗口挂载多个根目录」的概念：

- 一条 workspace 记录 = 一个已存在的绝对目录。
- 多个目录 = 多条记录，各自在侧边栏占一行。
- 会话不跨项目共享；一个会话只属于一个项目。

代码里没有「多根合并视图」「根目录数组」这类结构，`workspace` 领域只有一张以 `WorkspaceId` 为键的 `workspaces` 表（领域版本 2）加一份全局状态。

### 3.2 它解决什么问题

GUI 需要一个稳定的项目列表：用户在哪几个目录里工作、每个目录下跑过哪些会话、顺序怎么排、某个项目暂时不想看时怎么藏起来又不丢历史。`dsh-workspace` 只提供这些，**对模型完全不可见**，不注册工具、不注入提示词、不写会话事件，token 成本为零。功能约定见 [workspace.zh.md](../../subsystems/workspace.zh.md)。

最小组合（少任意一行，功能就一直不可用）：

```yaml
- name: '@deepseek-ai/dsh-session'
- name: '@deepseek-ai/dsh-session-persistence-jsonl'
- name: '@deepseek-ai/dsh-storage'
- name: '@deepseek-ai/dsh-storage-json'
- name: '@deepseek-ai/dsh-storage-domain'
  config:
    backend: json
- name: '@deepseek-ai/dsh-workspace'
```

### 3.3 与项目目录是什么关系

**注册不等于拥有。** 这是安全边界：

- 创建项目只接受已存在的绝对目录；相对路径、`C:work` 这类盘符相对路径、不存在的路径、文件一律拒绝。
- 目录的唯一性由 `fs.realpath` 决定：符号链接指向已有记录的目录时会与之冲突，唯一性就是规范化路径的字符串相等。
- 移除项目**不动文件夹、文件与会话历史**；这些会话变成 Ungrouped。再次添加同一目录会从空项目开始。
- 因此未来的破坏性文件系统操作必须单独命名、单独确认，并做所有权检查——不能因为「它是个 workspace」就认为可以删。

### 3.4 首次启动怎么有内容

`initializeDefault(resolveDirectory)` 负责首次初始化，触发条件很严格：workspace 注册表为空，且不存在运行时、持久化或已归档的 Session（包括没有工作目录的 Session）。只看侧边栏是空的不够，注册表会直接查持久化历史。

目录解析器只在允许创建时于变更队列内运行；注册表创建缺失的父目录、规范化路径、再查一次会话历史，然后把 Workspace 与初始化标记一起提交。标题取**请求目录**的最后一段而不是规范路径的最后一段，这样符号链接不会让项目改用链接目标的名称。

首次成功登记会持久保存工作区身份；重复调用直接返回它，改名保留身份，删除登记也不会允许再次自动创建。失败时初始化状态保持未设置，可以重试；已经创建的目录不会因为后续失败或调用方取消而回滚。

### 3.5 会话怎么归组

会话加入它**运行目录**所在的项目，新到旧排列。新会话必须记录能解析到项目目录的工作目录。

已有归属的会话，即使绝对路径已经不完整（包括悬空符号链接），仍保留原项目与顺序；重命名或排序项目不会移除归属。头部缺失、记录路径无效、目录存在但不匹配、以及 `ENOENT` 以外的文件系统错误仍会被排除。保留归属不会重建目录，也不放宽新会话的挂接要求——所以目录缺失时 Fork 仍可能挂接失败。

实现上只读 `SessionHeader` 字段，事件正文绝不加载；头部索引会校验有序的 `sessionIds`。

### 3.6 隐藏、恢复、移除

| 动作 | 对会话的影响 | 对磁盘的影响 | 拒绝条件 |
|---|---|---|---|
| 隐藏会话 | 从可见列表消失，历史与项目内位置保留 | 无 | 仍有回合、子代理、后台任务或提醒在跑（可要求先停止） |
| 恢复会话 | 回到原位置；无项目则回 Ungrouped | 无 | 无 |
| 移除项目 | 会话变 Ungrouped | 无 | 无 |

「还在跑」的判定通过两个事件完成：`workspace/session-activity`（waterfall，问各提供方还有什么在跑）与 `workspace/session-stop`（parallel，请各提供方停掉）。随附提供方包括 Agent 注册表、任务注册表接缝、Subagent runtime 与 Schedule 插件。

写入串行化：创建与删除在「记录/顺序」可能分叉之前先持久化 `pendingMutation` 标记，启动时只补全被中断的操作；未标记的分叉会被当作损坏明确报错。

## 4. 公共基座：util

`packages/util` 有 23 个包，共同约束是「零业务依赖、可被宿主与浏览器同时引用」。真正决定系统正确性的是下面这张表里的前 11 个，其余是围绕它们的外围能力。

### 4.1 核心工具

| 包 | 解决的问题 | 关键点 |
|---|---|---|
| [atomic-write](../../../packages/util/atomic-write/README.zh.md) | 写入过程中崩溃会留下半个文件 | 临时文件 + fsync + 原子 rename + 父目录 fsync；跨进程写锁 |
| [error](../../../packages/util/error/README.zh.md) | 各包自造错误类型，调用方无法稳定判别 | 无依赖 `HarnessError` 基类，稳定 `code` |
| [values](../../../packages/util/values/README.zh.md) | 「看起来像 JSON」的数据被悄悄改动 | 无损 JSON 校验、分离快照、深度冻结、结构相等 |
| [home-paths](../../../packages/util/home-paths/README.zh.md) | 主目录路径散落各处 | `DSH_HOME`（默认 `~/.dsh`）与共享 agent 配置根 |
| [timeout](../../../packages/util/timeout/README.zh.md) | 超时与取消混为一谈 | 超时运算、截止时间融合、超时/取消分类 |
| [native-command](../../../packages/util/native-command/README.zh.md) | 想在宿主执行命令又怕注入 | 不经过 shell、支持取消、桌面探测 |
| [ripgrep](../../../packages/util/ripgrep/README.zh.md) | 搜索依赖用户机器是否装了 rg | 打包 ripgrep，经组合的子进程提供方运行 |
| [crypto](../../../packages/util/crypto/README.zh.md) | `crypto.randomUUID` 只在安全上下文可用 | 非 HTTPS 与桌面环境下可用的替代实现 |
| [launch-environment](../../../packages/util/launch-environment/README.zh.md) | 运行中环境变量被改动后行为漂移 | 本次运行的环境不可变快照，记录值来自哪一层 |
| [http-proxy](../../../packages/util/http-proxy/README.zh.md) | 企业网络下出站请求失败 | 从启动环境解析代理设置 |
| [workspace-path](../../../packages/util/workspace-path/README.zh.md) | 浏览器侧要显示路径但没有 Node API | 相对路径拼接与缩写，浏览器安全 |

### 4.2 外围工具

| 包 | 用途 |
|---|---|
| `brand` | 名义字符串/数字类型与无状态构造函数 |
| `chunked-list` | projection state 用的不可变仅追加列表 |
| `deque` | 环形双端队列（Host 与浏览器共用） |
| `code-language` | 扩展名到语言的映射，Client 与 Host 的 read 卡片共享 |
| `file-drag` | 导出文件名与原生文件拖放请求 |
| `lazy-require` | 惰性加载 CommonJS 兼容的宿主依赖 |
| `official-bundles` | 官方 dsh 组合包清单 |
| `output-retention` | 有界模型输出（按条目与文本长度保留） |
| `package-manifest` | 包身份、运行时要求、DSH 插件元数据 |
| `plugin-detail` | 插件详细介绍文档的选取（`meta.detail` 或 README） |
| `plugin-market-index` | 插件市场索引格式 1 的校验与安全边界 |
| `time` | 严格时刻/时区解析、毫秒跨度、有界 Cron |

判断标准很简单：**能被两个以上包复用、且不引入业务概念**的，进 `util`；否则留在使用方。

## 5. 远程执行：ssh

### 5.1 用途

把一台 POSIX Harness 主机连到另一台安装了 helper 的 POSIX SSH 主机，让远端文件系统、子进程与沙箱以**同一套提供方接口**出现。上层不需要知道自己在本地还是远端。功能约定见 [ssh.zh.md](../../subsystems/ssh.zh.md)。

组合方式：`dsh-ssh` + `fs-ssh` + `subprocess-ssh` + `sandbox-ssh`，两端都是 Linux/macOS。本地 `ssh` 必须支持连接复用与 Unix socket 转发。

| 包 | 提供的能力 |
|---|---|
| [ssh](../../../packages/ssh/ssh/README.zh.md) | 连接生命周期、helper 校验、线协议、`ctx.ssh.ptcLaunch` |
| [fs-ssh](../../../packages/ssh/fs-ssh/README.zh.md) | 远端文件系统提供方 |
| [subprocess-ssh](../../../packages/ssh/subprocess-ssh/README.zh.md) | 远端子进程提供方 |
| [sandbox-ssh](../../../packages/ssh/sandbox-ssh/README.zh.md) | 远端沙箱提供方 |
| [ssh-helper-runtime](../../../packages/ssh/ssh-helper-runtime/README.zh.md) | 装在远端、被校验后执行的 helper 发行包 |

### 5.2 配置

| 字段 | 必填 | 说明 |
|---|---|---|
| `helper` | 是 | 远端 helper 的可执行文件路径 |
| `workspace` | 是 | 远端工作目录 |
| `helperHash` | 是 | helper 的小写 SHA-256 摘要，连接就绪前校验 |
| `requestTimeoutMs` | 否 | 默认 `30000`，取值 `1..2147483647` |

### 5.3 安全约束

这一层的设计假设是「远端主机可能被攻破，本地凭据不能被带走」。

| 约束 | 目的 |
|---|---|
| `BatchMode` | 禁止交互式提示，避免卡在密码输入 |
| 严格主机密钥检查 | 不信任未知主机 |
| 禁用认证代理转发 | 远端拿不到本地私钥或 agent |
| 无交互认证 | 认证只能来自部署方预先配置的别名与凭据 |
| helper 摘要 SHA-256 校验 | 防止远端替换 helper |
| helper 必须位于工作区与可写临时目录之外 | 沙箱内的代码无法改写 helper（例如 bwrap 的私有 `/tmp`）；工作区本身可以在 `/tmp` 下 |
| socket 目录 `0700`、socket `0600` | 同机其他用户无法接入 |
| 断连不自动重连、不重放 | 宁可失败，不重复执行副作用 |

摘要校验的边界要写清楚：它能证明「跑的是谁」，**不能**保证可写部署目录里的文件本身安全，也不认证恶意主机。主机别名、凭据与 `known_hosts` 必须在启动前配置好。

### 5.4 线协议

- 主连接承载私有管理 RPC。
- 每个程序流单独转发一个 Unix socket，各占一条独立 SSH 通道。
- 每条流使用随机 256 位 TLS-PSK，PSK 只经管理 RPC 传递，不放在流前缀里。
- 文件补丁/删除/移动（`fs.patch`、`fs.delete`、`fs.move`）走沙箱文件系统提供方，并对 hunk 与源/目标做严格 schema 校验与越界防护。

## 6. 测试设施：test-support

### 6.1 八个包各自补一个洞

| 包 | 解决的问题 |
|---|---|
| [agent-loop-testkit](../../../packages/test-support/agent-loop-testkit/README.zh.md) | 想用生产 AgentLoop 驱动测试，但先决依赖难挂 | 挂好先决依赖，直接跑生产循环 |
| [client-runtime](../../../packages/test-support/client-runtime/README.zh.md) | 浏览器功能测试没有 DOM | jsdom 下的 slot 测试运行时 |
| [llm-mock-server](../../../packages/test-support/llm-mock-server/README.zh.md) | 没有密钥就没法测适配器与恢复策略 | 可脚本化的 mock server |
| [llm-replay](../../../packages/test-support/llm-replay/README.zh.md) | 快照测试要可复现的模型输出 | 无密钥回放插件 |
| [loader-smoke](../../../packages/test-support/loader-smoke/README.zh.md) | 示例冒烟测试要真实子进程 | 共享的子进程与直接 agent harness |
| [remote-mock](../../../packages/test-support/remote-mock/README.zh.md) | Typert Remote 端点难在测试里构造 | 具名 mock，一元应答与流脚本 |
| [session-snapshot](../../../packages/test-support/session-snapshot/README.zh.md) | 会话日志快照格式各写各的 | 共享存储规则与 profile 适配器 |
| [tool-testkit](../../../packages/test-support/tool-testkit/README.zh.md) | 在测试里定义并调用工具很啰嗦 | 走真实工具流水线/执行器 |

### 6.2 测试怎么跑

| 命令 | 层级 | 说明 |
|---|---|---|
| `pnpm run test` | 单元 | 先构建 native-system，再跑包与脚本的 `tests/**` |
| `pnpm run test:coverage` | 覆盖率门禁 | `packages/*/*/src` 按文件 100% |
| `pnpm run test:coverage:partitioned` | 覆盖率门禁 | 拆成并发 partition |
| `pnpm run test:e2e` | 真实 API | 缺密钥自动跳过，CI 保持绿色 |
| `pnpm run test:expected` | 组装预期 | `*.expected.e2e.ts` 与 `tests/expected/` 同处 |
| `pnpm run test:snapshot` | 会话快照 | `test:snapshot:record` / `:refresh` 分别对应 transcript 变化与回放输入变化 |
| `pnpm run test:web` | 浏览器快照 | Chromium 为主，WebKit 跑模型/推理强度场景 |
| `pnpm run test:bench` | 性能基准 | 见第 7 节 |

### 6.3 覆盖与可信度策略

- **行覆盖是必要条件，不是充分条件。** 100% 覆盖只证明行被执行过。未覆盖的行往往是真的死代码。
- **优先真实实现，只 mock 贵或不确定的边界**：LLM 适配器、网络、时钟。桥接测试里唯一被 mock 的是脚本化 `MockAdapter`，工具注册表、执行管线、会话存储、JSONL 持久化都是真的。
- **e2e 验证外部世界，不验证自述**：重新读文件、重新跑命令，断言未修改的文件逐字节一致。对 agent 输出做关键词探测会让作弊的 agent 通过。
- **测试真实入口**：产品可见的插件必须有非单元的真实组合测试，通过 Loader 与 app/process 启动 `cordis.yml`；发布产物的 `bin` 要用普通 `node` 跑构建后的 `lib/bin.js`，否则 tsx 会掩盖模块解析、结算竞态等问题。
- **每个 registry 至少一个 HMR 安全测试**：dispose 贡献 fiber 并断言清理完成。
- **测试自管资源**：在测试里创建 harness，在 `afterEach` 里 dispose（失败、重试、超时也一样）。

完整规则见 [testing.zh.md](../../testing.zh.md) 与 [dsh-ci-test-reliability SKILL.md](../../../.agents/skills/dsh-ci-test-reliability/SKILL.md)。

## 7. 性能基线：benchmarks

### 7.1 测什么

`benchmarks/` 不按包组织，而按**用户路径**组织，因为性能回归总是发生在用户能感知的路径上。

| 目录 | 覆盖的用户路径 |
|---|---|
| `active-stream-reconnect` | 流式输出中断后重连 |
| `agent-continuation` | Agent 多轮续跑 |
| `conversation-fold` | 长会话折叠 |
| `long-session-browser` | 浏览器里打开长会话 |
| `session-corpus` | 大批量会话的读取与索引 |
| `session-open` | 打开单个会话 |
| `terminal-io` | 终端读写往返 |
| `user-text` | 用户输入到首字输出 |
| `support` | 报告生成与缩放（不含被测路径） |

约束写在 [benchmarks/AGENTS.md](../../../benchmarks/AGENTS.md)：使用 Vitest bench；被计时代码跑纯 Node，不用 TSX；输入是合成的；包内 `.perf.ts` 只做诊断，不作为门禁。

### 7.2 怎么跑

| 命令 | 内容 |
|---|---|
| `pnpm run test:bench` | 构建 bench 与 web，再跑 `scripts/run-bench-suite.ts` |
| `pnpm run test:bench:memory` | `scripts/run-memory-pressure-bench.ts` |
| `pnpm run check:ci:bench` | `scripts/run-gates.ts ci-bench`，CI 门禁 |

### 7.3 结果怎么读

报告由 [scaling-report.ts](../../../benchmarks/support/scaling-report.ts) 生成：bench 文件在 Vitest worker 里调 `recordTimings`，`vitest.bench.config.ts` 的 global setup 在运行前清空报告目录，运行后渲染 `report.html`（**失败也渲染**，否则最需要看的时候没有报告）。

产物位置：`benchmarks/.dsh-report/report.html` 与 `results.jsonl`，两者都被 Git 忽略，只在本地与 CI 工件中存在。

读数要点：

1. **时间是按机器档案缩放过的**，不是裸的毫秒。公式为

   ```text
   scaled = ms × ((1 − io) × cpuScore(measured)/cpuScore(target) × coreFactor
                  + io × ioLatency(target)/ioLatency(measured))
   ```

   其中 `io = max(0, 1 − cpuMs/ms)`，`coreFactor = max(1, parallelism/cores(target)) / max(1, parallelism/cores(measured))`。
2. **内存与无量纲比例不缩放**。`recordPeakMemory` 会在 4GB 与 8GB 可用内存两个档位下对比峰值。
3. **看趋势与预算，不看绝对值**。跨机器比较绝对值没有意义；同一路径多次运行的时间分布与是否越过预算才有意义。

## 8. 工程门禁与工具链：scripts

`scripts/` 有 360 多个文件，按前缀粗分：`verify` 82、`gen` 29、`persistence` 24、`cordis` 13、`build` 13、`translation` 12、`run` 10、`coverage` 10、`test` 8、`snapshot` 7、`client` 6、`session` 6，其余为零散专项。真正需要记住的是这四类。

### 8.1 生成（`gen-*`）

| 脚本 | 产物 | 为什么要有 |
|---|---|---|
| [gen-config-catalog.ts](../../../scripts/gen-config-catalog.ts) | `docs/config-catalog.md` | 从包入口、config 类型、JSDoc 与 Schemastery 生成，`--check` 校验已提交产物 |
| `gen-cli-help.ts` | CLI 帮助 | 参数变了文档必须跟着变 |
| `gen-client-catalog.ts` / `gen-client-catalog` 相关 | 客户端模块目录 | 避免手写清单漂移 |
| `gen-persistence-catalog.ts` | 持久化单元目录 | 与 storage 领域声明对齐 |
| `gen-cordis-catalog.ts` | Cordis 插件目录 | 供配置目录与站点交叉引用 |
| `gen-dependency-catalog.ts` | 依赖目录 | patches/vendor 的可查视图 |
| `gen-doc-graphs.ts` / `gen-module-graph.ts` | 图 | 文档中的模块关系图 |
| `gen-official-bundle-catalog.ts` | 官方组合包清单 | 与 `util/official-bundles` 同步 |

生成类脚本的共同原则：**产物入库、脚本可 `--check`**。CI 跑 `--check`，产物过期就红。

### 8.2 校验（`verify-*`，82 个）

代表项：

| 脚本 | 守什么 |
|---|---|
| `verify-doc-refs.ts` | 文档引用可解析 |
| `verify-doc-budgets.ts` | 文档体积预算 |
| `verify-doc-site-fragments.ts` | 站点片段与锚点 |
| `verify-export-jsdoc.ts` | 导出必须有 JSDoc |
| `verify-client-domain-graph.ts` | 客户端域图与代码一致 |
| `verify-client-ui-i18n.ts` | UI 文案国际化完整 |
| `verify-concrete-terms.ts` | 术语表与正文一致 |
| `verify-application-entrypoints.ts` | 入口可达 |
| `verify-archived-agent-notes.ts` | 归档笔记状态 |

判断一个守卫有没有用只有一个标准：**故意引入回归，看它是否变红，再回退**。

### 8.3 运行（`run-*` 与 `check:*`）

| 脚本 / 命令 | 职责 |
|---|---|
| [run-gates.ts](../../../scripts/run-gates.ts) | 门禁编排（`ci-bench`、`ci-static` 等），CI 的唯一入口 |
| [run-bench-suite.ts](../../../scripts/run-bench-suite.ts) | 跑全部 bench 路径并出报告 |
| [run-memory-pressure-bench.ts](../../../scripts/run-memory-pressure-bench.ts) | 4GB/8GB 内存压力对比 |
| [run-coverage-partitions.ts](../../../scripts/run-coverage-partitions.ts) + [coverage-partitions.ts](../../../scripts/coverage-partitions.ts) | 覆盖率分区，与其它 gate 并排跑 |
| `run-oxlint.ts` | 统一 lint 入口 |
| `run-web-snapshots.ts` | 浏览器快照比对 |
| `coverage-fork-diagnostics.ts` | fork 意外退出时报告 PID、文件、退出码、信号 |

### 8.4 构建与打包

| 脚本 | 职责 |
|---|---|
| [build.ts](../../../scripts/build.ts) | 主构建，`--scope artifacts\|check\|typecheck`，`--profile official` |
| `build-exe-for-ssh-helper.ts` | 打 ssh helper 单文件 exe（依赖 `@yao-pkg/pkg` 补丁） |
| `build-exe-for-python-sdk.ts` | 打 Python SDK 单文件 exe |
| `install-lefthook.mjs` | 安装 Git hooks |

### 8.5 文档站相关

[project-doc-site.ts](../../../scripts/project-doc-site.ts)、[stage-dsh-docs.ts](../../../scripts/stage-dsh-docs.ts)、`doc-typecheck.ts`、`jsdoc.ts`、[translation-links.ts](../../../scripts/translation-links.ts) 把仓库 markdown 投影成站点并校验链接，详见第 10 节。

## 9. 依赖治理：patches 与 vendor

### 9.1 两种策略的边界

| | `patches/` | `vendor/` |
|---|---|---|
| 对象 | 上游 npm 包 | Cordis 框架层与基础库 |
| 时效 | 临时，等待上游修复 | 长期自有 |
| 手段 | pnpm `patchedDependencies`，精确版本 | 源码入库，改写作用域，`workspace:~` 引用 |
| 代价 | 上游升版就要重建补丁 | 需要自己跟进上游 |
| 适用 | 明确 bug、行为差异、平台适配 | 需要可审计、可打补丁、版本固定的核心层 |

### 9.2 patches：12 个精确版本

配置在 `pnpm-workspace.yaml` 的 `patchedDependencies`，每条都锁定完整版本号，避免「升个小版本补丁静默失效」。

| 包 | 解决什么 |
|---|---|
| `@yao-pkg/pkg@6.21.0` | SEA 资源压缩与虚拟文件系统装载修正，支撑单文件 exe（ssh helper / Python SDK） |
| `node-pty@1.2.0-beta.15` | spawn-helper 解析与 ConPTY 行为修正 |
| `app-builder-lib@26.17.0` | DMG `format` 联合类型增加 `"ULMO"`（含 `"ULFO"`），支持新的压缩格式 |
| `@electron/osx-sign@1.3.3` | 清理 `.cstemp` 时用 lstat，不跟随符号链接 |
| `lexical@0.49.0` | 移动端键盘唤起时用 `visualViewport.pageTop - scrollY` 对齐 `getBoundingClientRect` |
| `mdast-util-gfm-autolink-literal@2.0.1` | GFM 自动链接在中文全角标点处结束（`。`、`，`、`　`） |
| `micromark-extension-gfm-autolink-literal@2.1.0` | 同上，并处理 astral 平面标点 |
| `@fortune-sheet/core@1.0.4` | `rangeValueToHtml`、`Canvas`、`handleGlobalWheel` 等滚动与导出问题 |
| `@fortune-sheet/react@1.0.4` | `InputBox`、`FxEditor`、`SheetItem`、`SheetTab` |
| `exceljs@4.4.0` | 31 个 hunk：`parse-sax`、`workbook-xform`、`CommentXform`、`ZipStream` 等读写兼容与稳定性 |
| `@botiverse/oar@0.67.0` | `--dangerously-skip-permissions` 仅在未显式给权限模式时生效；初始化握手错误处理 |
| `@earendil-works/pi-ai@1.3.0` | 保留 Gemini `thought_signature`，供 OpenAI 兼容端点推理回放 |

两个中文/CJK 相关的补丁值得单独说明：上游 GFM 自动链接遇到中文标点时会把整句话吃掉，导致「链接后面跟着中文」的渲染错误；补丁把结束条件改成只在 ASCII 标点或非标点非空白字符处继续匹配。这属于**产品可用性缺陷**，不是风格偏好。

### 9.3 vendor：9 个包

目的写在 [vendor/README.md](../../../vendor/README.md)：把 Cordis 框架与基础库纳入源码，不再依赖 npm，让 harness 完全拥有框架层——可审计、可打补丁、版本固定。

| 目录 | 包名 | 版本 |
|---|---|---|
| `cordis/` | `@deepseek-ai/cordis` | 4.0.0-rc.11 |
| `loader/` | `@deepseek-ai/cordis-plugin-loader` | 1.0.0-rc.8 |
| `include/` | `@deepseek-ai/cordis-plugin-include` | 1.1.1 |
| `group/` | `@deepseek-ai/cordis-plugin-group` | 1.0.0 |
| `timer/` | `@deepseek-ai/cordis-plugin-timer` | 1.1.4 |
| `hmr/` | `@deepseek-ai/cordis-plugin-hmr` | 1.0.15 |
| `logger-console/` | `@deepseek-ai/cordis-plugin-logger-console` | 1.0.0 |
| `cosmokit/` | `@deepseek-ai/cosmokit` | 1.8.1 |
| `schemastery/` | `@deepseek-ai/schemastery` | 3.18.0 |

规则：

- 作用域统一改写：`cordis` → `@deepseek-ai/cordis`，`@cordisjs/plugin-<x>` → `@deepseek-ai/cordis-plugin-<x>`。
- 包间引用一律 `workspace:~`，永远解析到本地源码。
- 保留上游 MIT `LICENSE`；manifest 记录上游版本与 commit。
- 本地修改必须有穷尽日志，使用稳定 ID（V1…V28+），否则下次同步上游会丢失改动。
- 三方小依赖仍留在 npm：`@standard-schema/spec`、`js-yaml`、`chokidar`、`picomatch`、`@babel/code-frame`、`supports-color`、`node-addon-require-builtin`。
- 未 vendor（确认未使用）：`reggol`、`@cordisjs/utils`、`@cordisjs/element`、`@cordisjs/unyaml`。

新增 vendor 包的流程见 [adding-a-vendored-package.md](../../cookbook/adding-a-vendored-package.md)。

## 10. 文档站：website

### 10.1 技术栈

VitePress（Vue 驱动）作为渲染层，但内容组织不用 VitePress 的默认约定，而是自研两层：

- [website/docs.ts](../../../website/docs.ts)：中英双语页面清单，根语言是中文，英文镜像；sections、nav、sidebar 全部由清单生成，保证两种语言不会各写一份导航。
- [website/build.ts](../../../website/build.ts)：调用 `docs/site/project-doc-site.ts` 的构建选项，把仓库 markdown 投影成站点页面。

### 10.2 构建管线

| 步骤 | 承担者 | 做什么 |
|---|---|---|
| 收集页面 | `website/docs.ts` | 输出页面清单与语言配对 |
| 投影仓库文档 | [project-doc-site.ts](../../../scripts/project-doc-site.ts) | 把仓库里的 markdown 复制/改写成站点页面 |
| 暂存 dsh 文档 | [stage-dsh-docs.ts](../../../scripts/stage-dsh-docs.ts) | 准备需要发布的 dsh 文档集 |
| 重写链接 | [translation-links.ts](../../../scripts/translation-links.ts) | 中英互链、跨页相对链接改写 |
| 生成索引 | 构建管线 | `llms.txt` 等机器可读索引 |
| 校验 | `docs:check` | 链接、片段、frontmatter |
| 渲染 | VitePress | Mermaid 图表内置 |

命令：

| 命令 | 用途 |
|---|---|
| `pnpm run docs:dev` | 本地开发 |
| `pnpm run docs:build` | 生产构建 |
| `pnpm run docs:build:mpa` | 多页构建 |
| `pnpm run docs:preview` | 预览构建产物 |
| `pnpm run docs:check` | 文档校验 |

### 10.3 部署通道

| 通道 | 触发 | 约束 |
|---|---|---|
| GitHub Pages | 手动 `workflow_dispatch`，只从 `dsh-v*` tag 发布 | `DOCS_REPOSITORY_REF=master`；environment 含 tag 策略与 required reviewers；`DSH_TELEMETRY_DISABLED=1` |
| Cloudflare Pages（PR 预览） | PR push | 上传构建产物到分支别名，Cloudflare Access 保护；该 lane 同时负责聚合测试与脚本类型检查 |

日常校验靠 PR：每个 PR 通过 `check:ci:static` 构建一次生产站点，`ci-master.yml` 在 master 上再构建一次。配置文件：[docs-pages.yml](../../../.github/workflows/docs-pages.yml)、[build-preview-cloudflare.yml](../../../.github/workflows/build-preview-cloudflare.yml)。

## 11. 关键文件职责清单

| 文件 | 职责 |
|---|---|
| [packages/storage/README.zh.md](../../../packages/storage/README.zh.md) | 存储抽象与后端选择的入口说明 |
| [storage-domain/README.zh.md](../../../packages/storage/storage-domain/README.zh.md) | 领域规范、版本与迁移编排 |
| [storage-json/README.zh.md](../../../packages/storage/storage-json/README.zh.md) | JSON 后端两种布局、文件格式、错误码 |
| [storage-sqlite/README.zh.md](../../../packages/storage/storage-sqlite/README.zh.md) | SQLite 后端：单库多行、同步写、同事务版本更新 |
| [workspace/README.zh.md](../../../packages/workspace/workspace/README.zh.md) | 项目列表、首次初始化、会话归组、隐藏/移除语义 |
| [atomic-write/README.zh.md](../../../packages/util/atomic-write/README.zh.md) | 原子替换与跨进程写锁 |
| [ssh/README.zh.md](../../../packages/ssh/ssh/README.zh.md) | 连接生命周期、helper 校验、线协议、安全约束 |
| [ssh-helper-runtime/README.zh.md](../../../packages/ssh/ssh-helper-runtime/README.zh.md) | 远端 helper 发行包 |
| [session-snapshot/README.zh.md](../../../packages/test-support/session-snapshot/README.zh.md) | 会话快照的存储规则与 profile 适配器 |
| [llm-replay/README.zh.md](../../../packages/test-support/llm-replay/README.zh.md) | 无密钥 LLM 回放 |
| [benchmarks/AGENTS.md](../../../benchmarks/AGENTS.md) | 基准测试的规则（Vitest bench、纯 Node、合成输入） |
| [scaling-report.ts](../../../benchmarks/support/scaling-report.ts) | 报告生成与按机器档案缩放 |
| [run-gates.ts](../../../scripts/run-gates.ts) | CI 门禁编排 |
| [build.ts](../../../scripts/build.ts) | 主构建入口 |
| [gen-config-catalog.ts](../../../scripts/gen-config-catalog.ts) | 配置目录生成与 `--check` |
| [project-doc-site.ts](../../../scripts/project-doc-site.ts) | 仓库 markdown → 站点的投影 |
| [vendor/README.md](../../../vendor/README.md) | vendor 包清单、作用域规则、本地修改日志规范 |
| `pnpm-workspace.yaml` | `patchedDependencies`（12 条精确版本）与 workspace 范围 |
| [website/docs.ts](../../../website/docs.ts) | 中英双语页面清单 |
| [website/build.ts](../../../website/build.ts) | 站点构建入口 |
| [docs-pages.yml](../../../.github/workflows/docs-pages.yml) | GitHub Pages 发布流程 |

## 12. 待确认

以下内容在代码与既有文档中未能完全确定，使用前需复核：

1. **`workspace` 的 `create(path, title?)` 中 `title` 是否还有生产调用方。** 包内开发备注提到网关的按名称创建分支移除后该参数已无调用方，并留有移除 TODO；未逐一核对全部宿主侧调用点。
2. **`single` 布局的写放大阈值。** 文档只说「大且频繁更新的单元选 SQLite」，代码中没有量化的单元规模或写入频率阈值。
3. **`scripts/` 中 360+ 文件的完整归属。** 本文只覆盖生成、校验、运行、构建四类的代表项；`experimental*`、`archived*`、`migrate*` 等零散脚本的存废状态未逐个确认。
4. **`docs:build` 与 `docs:build:mpa` 在两条部署通道中分别使用哪一条。** 已确认两条 workflow 都会构建生产站点，但未逐行核对它们调用的具体命令。
5. **benchmark 预算阈值的来源。** 报告与本地产物不提交，预算值写在 bench 文件内的具体位置未逐条列出；CI 门禁的比较基线存放在何处需要进一步确认。
6. **`vendor` 本地修改日志的当前最大编号。** 文档约定「下一条 V28」，写作时未逐个核对 9 个包内的实际日志条目。
