# 05 · 插件与扩展生态

本文说明 DSH（deepseek-harness 二次开发分支）中「插件从哪来、怎么组合、怎么被加载、运行时能改什么」这一整条链路。覆盖目录：`packages/extensions`、`packages/bundle`、`packages/preset`、`packages/skill`、`packages/mcp`、`packages/experimental`、`apps/plugin-market-generator`。

事实来源以代码与仓库内 README 为准；无法从代码确认的内容集中列在[第 10 节 待确认](#10-待确认)。

---

## 1. 心智模型：一棵配置树 + 一组插件

DSH 的 Host 侧是一个 Cordis 应用。它由**两样东西**决定：

| 概念 | 含义 | 代码中的位置 |
|---|---|---|
| 配置树（entry list） | 一棵 YAML 行树，每行有 `id` / `name` / `config` / `inject` / `disabled`，可嵌套 `group` | 根 `cordis.yml` 及其 `cordis:include` 文件 |
| 插件 | 被某一行 `name` 指向的 npm 包（或文件路径 / 文件 URL），导出 Cordis 的 `apply(ctx, config)` | 各行 `name` 解析到的模块 |

一个**插件（plugin）**是一段在 `ctx` 上注册能力的代码；一个**组合包（bundle）**是一份可安装的 patch 层；一个**profile** 是「一组按序排列的组合包 + 自己的 patch 文件」；一个 **patch** 是对配置树的增量编辑。三者关系是：

```
profile  =  有序的 bundle 列表  +  profile 自己的 cordis.patch.yml
bundle   =  package.json 里的 dsh.bundle.patch（一个文件或有序文件列表）
patch    =  按 id 定位行 → 整键赋值 / insert 新行 / 置 disabled
```

> 关键一点：bundle 里**没有**「要加载哪些插件」的清单文件，它只有 patch。插件清单完全由 patch 作用在配置树上产生。

官方组合包共 6 个，见 [packages/bundle/README.zh.md](../../../packages/bundle/README.zh.md)：

| 包 | 职责 |
|---|---|
| `base` | 所有 base 系 profile 的共享核心（仅 patch，无运行时入口） |
| `web-app` | 浏览器应用层，叠在 base 之上 |
| `acp-app` | 仅自动化的 ACP stdio 应用 |
| `headless` | 一次性命令行任务应用 |
| `sdk-app` | SDK JSON-RPC stdio 应用 |
| `sdk-minimal` | 不使用 base 的独立极简 SDK 应用（完整 patch 树） |

---

## 2. 一个插件从哪里来

| 来源 | 进入方式 | 说明 |
|---|---|---|
| 内置包 | 已写在 `packages/bundle/*/cordis.patch.yml` 的 `insert` 行里 | 随安装目录解析，不需要安装步骤 |
| npm 包 | `dsh plugin --profile <name> add <package>`，或 GUI 插件管理器 | 装进 profile 的依赖与组合包列表 |
| Git 仓库 | 插件市场「发现」页，索引由第 8 节的生成器产出 | 索引只列声明了 `dsh.bundle` 的包 |
| 树外 bundle | 由 `dsh plugin` 写入 `dsh.profile.bundles` | 不修改源码树即可加入新的一层 |
| 动态 Cordis 插件 | Agent 通过 `ctx.dynamicCordisRunner` 在运行期 `define` + `run` | 只存在于当前进程，重启即消失（见 5.3） |
| experimental 可选包 | 默认关闭，需在插件管理器的「官方」分组显式启用 | 见第 7 节 |

### 2.1 一个插件的构成

一个可被 DSH 识别为 bundle 的包，最小构成是 `package.json` 加上若干 patch 文件：

```jsonc
// packages/bundle/base/package.json（节选）
{
  "name": "@deepseek-ai/dsh-base",
  "dsh": {
    "bundle": {
      "patch": "./cordis.patch.yml"      // 单文件
    }
  }
}
```

`web-app` 声明的是**有序列表**，一个 bundle 因此可以带多份 patch：

```jsonc
// packages/bundle/web-app/package.json（节选）
"dsh": {
  "bundle": {
    "patch": [
      "./cordis.patch.yml",
      "./presets/standard.patch.yml",
      "./presets/ptc.patch.yml",
      "./presets/minimal.patch.yml",
      "./presets/cordis.patch.yml"
    ]
  }
}
```

该层按数组顺序把各文件的 patch 项**拼接**在一起，再整体作为一个 bundle 层应用。

### 2.2 加载链路

```
dsh launcher（apps/cli）
  → @deepseek-ai/dsh-app-boot：读 profile manifest → 解析 bundle 层 → 叠 patch
  → Listener 安装 runtime resolution（ESM / CJS 双解析器）
  → cordis-plugin-loader：逐行解析 name、求值 !!js、按服务依赖排序激活
  → 每个插件 apply(ctx, config)
  → 返回运行中的 app（或 StartupError）
```

`app-boot` 负责 profile 加载、JSON 校验、版本与平台准入、patch 叠放、诊断与失败策略；**它不做端口绑定，也不安装 HMR**——监听器与 HMR 都是配置树里的普通插件行。详见 [packages/boot/app-boot/README.zh.md](../../../packages/boot/app-boot/README.zh.md)。

---

## 3. `profile` → `bundle` → `patch` 三层叠加（核心机制）

### 3.1 完整层顺序（权威表述）

「三层」是口语说法，实际叠放顺序有五档。顺序由 `packages/boot/app-boot/src/profile-context.ts` 决定，与 [docs/user/develop/basic/publish.zh.md](../../user/develop/basic/publish.zh.md) 的表述一致：

| 序号 | 层 | 来源 | 备注 |
|---|---|---|---|
| 1 | bundle 层（可多层） | `profile.json` 的 `dsh.profile.bundles`，按数组顺序；每层内部再按 `dsh.bundle.patch` 的文件顺序 | 最底层，通常是 `base` 在最前 |
| 2 | profile 自己的 patch | `$DSH_HOME/profiles/<name>/cordis.patch.yml` | 覆盖所有 bundle 层 |
| 3 | home 级 patch | `$DSH_HOME/cordis.patch.yml` | 覆盖 profile 自己的 patch |
| 4 | overlay patch | 命令行 `--patch <file>` | 覆盖 home 级 |
| 5 | telemetry 补丁 | 由启动器注入 | 最后一次写入，用于产品遥测覆盖 |

官方原文（`app-boot` README）：

> `cordis.patch.yml` —— 你的 tweak 层，应用在所有组合包层之后（先应用逐 profile 的文件，再应用 home 级文件，因此后者优先级更高）

**结论：后面的层永远覆盖前面的层；单个键层面「最后写入者胜」。** 不存在「profile 只能改某些字段」这种白名单限制——profile 可以改任何一行的任何键，只要 id 对得上。

### 3.2 patch 的两种动作与匹配规则

实现位于 [vendor/include/src/patch.ts](../../../vendor/include/src/patch.ts)。

一个 patch 文档是顶层列表，每一项是两种形态之一：

**(a) 覆盖已有行**——按 `id` 定位：

```yaml
- id: system-prompt
  config:
    personaPrefix: >-
      You are a coding agent powered by the {{model}} model.
```

**(b) 插入新行**——使用 `insert`：

```yaml
- insert:
    - id: hmr
      name: '@deepseek-ai/dsh-hmr'
      disabled: !!js "!ctx.get('profileContext')"
      config:
        root: []
```

匹配与写入的精确语义：

| 规则 | 行为 |
|---|---|
| 定位方式 | 先对整棵配置树深拷贝，再建立 `id → entry` 映射（**包含嵌套 `group` 内的行**） |
| 命中后写入 | 对 patch 项里的**每个键整体赋值**。`config` 是**整块替换**，不是深合并 |
| 同名断言 | patch 项写了 `name` 且与目标行的 `name` 不一致时，打印警告并**跳过该项**（防止 id 撞车误改） |
| `insert` | 追加到根，或追加到 `group` 指定的容器；插入项里的绝对路径与相对 patch 文件的 `./`、`../` 路径会被转成 `file://` URL |
| `disabled` | 只是普通键，后层可以把它从 `true` 改回 `false`，也可以整块覆盖掉 |
| 未命中 id | 输出 stderr 警告，继续启动（不致命） |
| 空 patch 文件 | 只有注释或空文件会导致**启动失败**；想禁用该层请写 `[]` |
| `!!js` | 不在 patch 阶段求值，保留到 Loader 挂载该行时才求值 |
| 编辑归属 | `routeJournal` 记录「某一行来自哪一层」，GUI 配置编辑器据此把改动写回正确的层，而不是写进别人的 patch |

> 因为 `config` 是整块替换，**覆盖方必须重述它想保留的全部键**。这一点在 base 与 web-app 的 patch 注释里被反复强调，是使用该机制最容易踩的坑。

### 3.3 真实例证：base → web-app 的两层叠加

`base` 的 patch 开头写明了它的设计意图：

```yaml
# The dsh-base bundle patch: the shared core of each base-backed profile, applied as
# ONE insert over the empty profile root. Later bundle patches and the user's
# profile cordis.patch.yml address these rows by id, with the last write
# winning per row.
#
# A patch replaces the targeted row's whole `config` rather than merging into
# it, so a row whose value differs by mode does NOT live here: it belongs to
# each mode bundle, keeping any single row down to one bundle layer plus the
# user's.
```

`base` 用一个巨大的 `insert` 把共享核心行一次性铺到空 profile 根上，例如：

```yaml
- insert:
    - id: tool-plugin-manager
      name: '@deepseek-ai/dsh-plugin-manager/tools'
      disabled: true

    - id: hmr
      name: '@deepseek-ai/dsh-hmr'
      disabled: !!js "!ctx.get('profileContext')"
      config:
        root: []
```

`web-app` 的 patch 紧接着**按 id 覆盖**这两类行：

```yaml
# The dsh-web-app bundle patch: the browser surface over the dsh-base layer.
# Applied after dsh-base's insert; rows here override base rows by id, with
# the profile's own cordis.patch.yml and any --patch overlays still to come.
#
# A patch replaces the targeted row's whole `config`, so each row below
# restates every key it owns.

- id: system-prompt
  config:
    personaPrefix: >-
      You are a coding agent powered by the {{model}} model.

- id: session-query-sqlite
  config:
    path: ':memory:'
    openAt: never
```

注意 `session-query-sqlite` 同时写了 `path` 与 `openAt`：这不是冗余，而是因为 `config` 整块替换——少写 `path` 就会把它从 base 的值变成未设置。

同一份文件里还有第二个 `insert`，用于只有 Web 形态才需要的行（`desktop-product-telemetry`、`product-analytics` 等）。**同一个 patch 文件可以既有覆盖项，也有 `insert` 项，且 `insert` 可以出现多次。**

叠加后的归属可以用 `dsh --dump-config` 观察：dump 会按注释分组标出每个源文件及其层标签，未匹配到任何行的 patch 项也会随层标签一起报告。

### 3.4 冲突怎么解

| 冲突形态 | 解法 |
|---|---|
| 两行同 `id`、后层想改部分字段 | 后层重述完整 `config`，整块替换 |
| 两行同 `id`、后层只想禁用 | 后层写 `- id: x` + `disabled: true` |
| 后层要插入全新行 | 用 `insert`，不要试图覆盖一个不存在的 id |
| 插入的行与已有行同 id | 按 3.2 的映射规则，`insert` 项也是映射的候选；实际排序取决于 patch 应用顺序（**此处的去重细节待确认**） |
| id 拼错 | 未命中 → stderr 警告，静默不生效（容易被当成「改了没反应」） |
| 想彻底不用某一层 | 写 `[]`，不要留空文件 |

### 3.5 进入配置树之前的准入检查

在 patch 被应用之前，`app-boot` 还会做两类过滤，结果都体现为「这一行/这一层没生效」：

**版本兼容**

- 包声明了 `engines.dsh` 时，只由该范围决定，忽略 `peerDependencies`。
- 否则 `peerDependencies` 中对 `@deepseek-ai/dsh` 与 `@deepseek-ai/dsh-*` 的每个范围都必须命中；`workspace:^` / `workspace:~` / `workspace:*` 视为当前运行时。
- 两者都没声明 → 不施加约束；空范围或无效范围 → 视为不兼容。
- 被拒绝的**普通行**变成游离的 `disabled: true` 行；**原生 group 保持挂载**但被拒绝的子行不加载；若某个原生 Include 会到达被拒绝的插件，则整个 Include 被省略。
- 精确豁免写在 profile 自己的 `compatibility.json`（不是 `package.json`），键为 `package-name@version` → DSH 运行时版本列表。文件损坏不阻止启动，但此后该文件变只读。

**平台准入**

- `dsh.bundle.platforms`（如 `["darwin"]`，另有 `wsl` 值）声明非空平台列表时，Host 平台不匹配则**整层跳过**。
- 跳过不改变用户已保存的选择状态，只记入 `skippedBundles`，由启动器每次启动报告一次。
- 组合包解析失败、manifest 读取失败、patch 加载失败同样进入 `skippedBundles`；**profile 与用户 patch 的错误仍然导致启动失败**。

**失败策略摘要**（完整矩阵见 `app-boot` README）：

| 情形 | optional 行 | required 行 |
|---|---|---|
| 根配置 / 必需 overlay 缺失、不可读、格式错误 | — | 终止启动 |
| `import` 失败 | 警告，继续 | 终止启动 |
| schema 校验失败、`!!js` 求值异常、同步 `apply()` 抛错 | 警告，继续 | 同左（记录后由审计判定） |
| 服务依赖不可用 | 挂起等待提供方 | 指出被要求的服务 |

`required` 列表由启动器内置（`agent-loop`、`tool-executor-native`、`tool-executor-ptc`、`webserver`、`web-runtime`、`modules`、`connection`、`headless-runner`、`acp`、`sdk-jsonrpc-server`）。后续 HMR 重载**不会**重跑 required 审计，也不会整体回滚。

### 3.6 preset 与 bundle 不是一回事

`packages/preset` 定义的是 **Agent 能力组合**，不是 Host 配置层：

| 维度 | bundle | preset |
|---|---|---|
| 作用对象 | Host 进程的插件树 | 单个 Agent 的子插件列表 |
| 声明位置 | `package.json` 的 `dsh.bundle.patch` | `@deepseek-ai/dsh-agent-preset` 的 `config.plugins` |
| 生效时机 | 启动 / profile 重组 | 创建 Agent 时，按会话选择 |
| 修改影响 | 立即（HMR 开启时） | **只影响之后创建的 Agent** |
| 标识 | 包名 | `config.id`（会话保存的 preset 标识） |
| 管理方 | `app-boot` + Loader | `ctx.agentPresets`（`agent-preset-registry`） |

示例（来自 `agent-preset` README）：

```yaml
- id: agent-preset-registry
  name: '@deepseek-ai/dsh-agent-preset-registry'
  config:
    default: standard
- id: preset-standard
  name: '@deepseek-ai/dsh-agent-preset'
  config:
    id: standard
    plugins: []
```

要点：声明行的 `id` 是 **Loader 编辑地址**，`config.id` 是**会话保存的 preset 标识符**，两者不是同一个东西。子插件的 `!!js` 保留到该子插件真正加载时才求值。重复 preset ID 会导致声明加载失败。`persona` 包提供可组装的 Agent 人设，与 preset 同属「Agent 侧」而非「Host 配置层」。

---

## 4. 热更新（HMR）

### 4.1 实现方式

HMR 本身是配置树里的一行普通插件（`@deepseek-ai/dsh-hmr`，在 base 中 id 为 `hmr`），不是启动器内建能力。启动器**不安装 HMR，也不装监视器**。

| 环节 | 行为 |
|---|---|
| 监视范围 | profile manifest + 两份用户 patch（profile 级与 home 级） |
| 变更后 | 按顺序重读各 bundle 层，重新组合配置树 |
| 与插件管理器的关系 | HMR 的重载与 Plugin Manager 的配置写入**串行化**；包安装/卸载等操作在队列之外执行 |
| 失败处理 | 重载失败不影响已成功的兄弟插件；显式启用的目标必须成功激活 |
| 成功信号 | 生命周期结束且诊断检查通过后发出 `app-boot/config-reload`（不含 diff，也不含解析后的配置） |
| 卸载旧版 | 清理 ESM / CJS 模块缓存 → 重新 import → 注销旧 runtime 再注册新 runtime，发出 `hmr/reload` |

实现代码：`vendor/hmr/src/index.ts`（文件监听与 `hmr/change`）、`packages/boot/hmr`，以及 `app-boot` 的 `recomposeProfile` / `reconcileProfilePatches`。

### 4.2 什么情况下必须重启

| 场景 | 是否需要重启 |
|---|---|
| 改 profile 级 / home 级 `cordis.patch.yml`，且 HMR 已启用 | 不需要 |
| 改 profile manifest（组合包列表） | 不需要（HMR 监视它） |
| 改某行 `config`、`disabled` | 不需要 |
| 改 bundle 内的 patch 文件内容 | 需要下次重组或重启（bundle 内容不在监视范围内） |
| 改插件自己的 `package.json` 中 DSH 版本要求 | 需要（只在下一次重组或启动时判定） |
| 改 Loader 自己读取的入口清单（根配置、嵌套 `cordis:include`） | 需要 |
| HMR 未启用 / 不存在（如 `headless`、`acp` 等随附模板只在启动时应用 patch） | 需要 |
| 安装 / 卸载 / 升级包 | 由 Plugin Manager 判定，返回 `restart-required` |
| 改动态 Cordis 插件定义 | 不需要重载进程，但定义本身**不落盘**，重启即消失 |

### 4.3 插件管理器（Plugin Manager）

`packages/boot/plugin-manager` 负责安装 / 启用 / 禁用 / 重试 / 编排，对外暴露 `/api/plugin-manager/*`，GUI 侧由 `packages/client/ui-plugin-manager` 消费。两个必须记住的安全事实：

- 插件 Host 代码在**宿主进程**里运行，**不受工作区沙箱限制**；
- 版本兼容豁免的授予与撤销要经过显式授权与风险确认（见 3.5 的 `compatibility.json`）。

---

## 5. 声明格式与能力边界

### 5.1 Host 插件声明

| 字段 | 含义 |
|---|---|
| `name` | 包标识、绝对文件路径或文件 URL |
| `id` | Loader 编辑地址；patch 靠它定位 |
| `config` | 该插件 `Config` schema 对应的配置对象 |
| `inject` | 依赖的服务名；决定激活时机 |
| `disabled` | 普通布尔键，可被后层覆盖 |
| `group` | 原生行分组，仅用于组织；不参与激活语义 |

补充规则：

- **行顺序不携带加载语义**，激活由服务可用性驱动（base patch 注释原文：`Row order carries no load semantics (activation is service-availability driven)`）。
- 模块入口包还应在 `package.json` 声明 `engines.dsh` 或 `peerDependencies`，否则不做版本约束（见 3.5）。
- 作 bundle 时声明 `dsh.bundle.patch`；作浏览器插件时声明 `dsh.client`。

### 5.2 Client（浏览器）插件声明

```jsonc
// packages/client/ui-plugin-manager/package.json（节选）
"dsh": {
  "client": {
    "platform": "web",
    "inject": [ /* 依赖的客户端模块 */ ]
  }
}
```

| 字段 | 含义 |
|---|---|
| `platform` | 目标平台（如 `web`） |
| `inject` | 依赖的客户端模块名 |
| `optional` | 可选依赖 |
| `external` | 视为外部模块，不打进产物 |

Client 行会被 modules 的 Node 半边扫描进 `window.__DSH_BOOT__` 作为浏览器名单（web-app patch 注释原文：`dsh.client rows are the browser roster the modules node half scans into window.__DSH_BOOT__`），前端产物通过 `/plugins` 路由提供。参见 [docs/subsystems/client-modules.zh.md](../../subsystems/client-modules.zh.md)。

### 5.3 能注册什么 / 不能碰什么

**能注册（取决于插件挂载了哪些服务）：**

| 能力 | 载体 |
|---|---|
| 工具（模型可调用） | `ctx.tools`，如 `packages/tool-*` 系列 |
| Slot / UI 贡献 | Client 插件通过 Slot 注册渲染点（`ui-cordis` 等） |
| 斜杠命令 | `ctx.commands`（`@deepseek-ai/dsh-command-*`） |
| HTTP 路由 / 端点 | `webserver` 行及其服务 |
| 服务（service） | `ctx.plugin(...)` / `ctx.set(...)`，供其它插件 `inject` |
| 设置命名空间 | 如 `subagent-model-selection-settings` 行 |
| Skill 提供方 | `ctx.skills.registerProvider(...)` |
| MCP 服务器 | 插件可向 `ctx.mcpManager` 注册自己的服务器 |
| Agent preset | `ctx.agentPresets` 注册声明式子插件列表 |

**不能碰 / 有明确边界：**

| 约束 | 依据 |
|---|---|
| Host 插件代码不受工作区沙箱限制，等同于在宿主进程执行 | plugin-manager README |
| 动态 Cordis 插件的 `node:vm` 沙箱只隔离全局变量，**不是安全边界** | cordis-host-runner README |
| 动态 Cordis 定义按会话隔离、仅存在于进程内，重启清空 | cordis-host-runner README |
| `tool-cordis` 只提供只读查询（`cordis_inspect_list` / `cordis_inspect_query`），不能调用服务方法、不能配置插件、不能执行生成的代码 | tool-cordis README |
| 浏览器半的动态插件需经过审批 | cordis-host-runner README（`clientInspectTimeoutMs`） |
| 被版本策略拒绝的插件永远不会 import 其模块 | app-boot README |
| 会话中直接改文件的两类编辑（插件自身 `package.json` 版本要求、Loader 入口清单）不会立即重新判定 | app-boot README |

### 5.4 `packages/extensions` 里的运行时扩展点

| 包 | ctx 键 / 形态 | 作用 |
|---|---|---|
| `cordis-host-runner` | `ctx.dynamicCordisRunner` | `define` / `run` / `stop` / `undefine` / `inspectPlugin` / `invoke`；`node:vm` 沙箱；`vmTimeoutMs` 默认 5000、`clientInspectTimeoutMs` 默认 10000 |
| `cordis-client-runner` | — | 浏览器半运行器 |
| `ui-cordis` | — | 动态插件的 UI 贡献 |
| `tool-cordis` | `ctx.tools` | 给 Agent 的只读运行时 API 查询工具 |

---

## 6. `skill` 与 `mcp`

两者都是「给 Agent 增加能力」的通道，但语义完全不同。

### 6.1 skill：可被加载的**知识/流程包**

| 项 | 内容 |
|---|---|
| 注册表 | `ctx.skills`（`packages/skill/skill`），`registerProvider` / `register` |
| 合并规则 | 多提供方结果合并去重；**同名先到先得**；按名加载 |
| 调用策略 | 两个独立维度：`modelInvocable`（模型可自行调用）与 `userInvocable`（用户可显式触发），构成四象限 |
| 缓存上限 | `collectCacheMaxEntries`，默认 128 |
| 文件形态 | `SKILL.md`（或平铺 `<name>.md`） |
| frontmatter | 必填 `name`、`description`；可选 `whenToUse`、`metadata`、`disable-model-invocation`、`user-invocable` |
| 优先级 | 数字越大越优先：`100` `.dsh/skills` → `200` `.agents/skills` → `300` custom → `400` `<dshHome>/skills` → `500` `<agentsHome>/skills` → `600` bundled |
| 变更生效 | 文件监视，**免重启** |

其余相关包：`skill-office`（Office 文档能力）、`tool-skill`（模型侧调用工具）、`tool-workspace-dependencies`。参见 [packages/skill/README.zh.md](../../../packages/skill/README.zh.md)。

### 6.2 mcp：把**外部进程/服务**接成工具

三个包分工：

| 包 | 职责 |
|---|---|
| `mcp-client` | 每个 MCP 服务器一行插件；建立连接、把远端工具映射进 `ctx.tools` |
| `mcp-manager` | 设置驱动的服务器编队：状态、`restart`、`probe`、`watch` |
| `mcp-resources` | 共享的 MCP 资源读取工具 |

`mcp-client` 关键约定：

| 项 | 值 / 说明 |
|---|---|
| 传输 | `transport: stdio` 或 `streamable-http` |
| 命名空间 | `serverName` |
| 工具名 | `mcp__<server>__<tool>`（因此服务器名会进入模型可见的工具名） |
| `toolCallTimeoutMs` | 60000 |
| `closeTimeoutMs` | 5000 |
| `maxInstructionBytes` | 32768 |
| 重连 | `reconnect.*` 退避 |
| 凭据 | `${credential:REF}` 模板占位，配置里不落明文 |
| 不支持 | MCP 的「提示词模板」能力 |

**接入方式与一个高价值陷阱**：`mcp-manager` 是设置驱动的，而 profile 的 `cordis.patch.yml` 一旦覆盖 `mcp-manager` 那一行，`config.servers` 是**整块替换**——等于把用户在设置里攒的全部服务器映射一次性抹掉。局部增删改必须走 Settings 界面，不要用 patch 覆盖该行。

---

## 7. `packages/experimental`：实验区

### 7.1 三种状态（不是成熟度等级）

| 状态 | 含义 |
|---|---|
| **实验性** | 整个公开能力仍在评估中，**不属于产品支持承诺**；行为或 API 可变，能力可被撤回；但工程、安全、文档、测试义务仍然适用 |
| **可选** | 用户显式选择该能力（默认关闭） |
| **官方** | 项目维护，并在插件页「官方」分组列出 |

README 明确写道：可选与官方**都不表示成熟度**；发布、默认安装、界面可见性也不决定成熟度。晋升要求：明确的产品职责、公开行为与限制、当前消费者、发布内容、测试证据；晋升时移入对应产品组并同步更新消费者。

### 7.2 内容概览（约 60 个包）

| 分类 | 代表包 |
|---|---|
| 回答区操作卡片与推荐 | `action-cards`、`creation-recommendations`、`plugin-recommendations`、`personalized-recommendations` |
| 会话检索 | `tool-session-query`、`session-search` |
| 重复委派 | `ralph-bundle`、`tool-ralph` |
| 持久终端 | `terminal-bundle`、`tool-terminal`、`terminal-panel` |
| 钩子桥接 | `hook-protocol`、`hooks-claude-code`、`hooks-codex`、`claude-code-mods` |
| Webhook | `webhook`、`webhook-github` |
| 会话标题 | `session-titles-bundle`、`session-title-all-prompts-llm` |
| 翻译 / 语音 | `translator`、`cot-translation-bundle`、`speech-to-text`、`speech-to-text-sensevoice`、`api-speech-to-text`、`client-ui-voice-input` |
| 插件市场 | `plugin-market-bundle`（默认禁用） |
| 协作分享 | `liveshare`、`liveshare-protocol` |
| 观测 / 统计 | `client-ui-stats`、`auto-review`、`session-inspector`、`inspector`、`inspector-profile` |
| 外部代理 | `subagent-oar`、`tool-subagent-oar` |
| 运行时后端 | `ptc-runtime-python`、`webworker-packer`、`webworker-runtime` |
| 计算机使用 | `cua`、`cua-macos`、`cua-bundle`、`computer-use-cua-driver-mcp`、`computer-use-cua-driver-native` |
| 浏览器使用 | `browser-use-playwright-mcp`、`browser-use-chrome-devtools-mcp`、`browser-use-stagehand-native`、`browser-use-runtime` |
| Git 工作树 / 代码托管 | `worktree`、`tool-worktree`、`forge`、`forge-github`、`forge-session`、`forge-bundle`、`client-ui-forge` |

命名与发布由 `scripts/experimental-package-policy.ts` 约束；包命名、依赖隔离、发布要求另有子树规则（`packages/experimental/AGENTS.md`）。

**成熟度判断建议**：不要看它在不在 experimental 里，要看它的 README 是否声明了 `ctx` 键、是否被某个官方 bundle 默认启用、是否有跨平台实现（CUA 的 macOS 原生部分只覆盖 darwin）。

---

## 8. `apps/plugin-market-generator`

### 8.1 它是什么

一个**独立 Node 程序**，不是 Cordis 应用，也不安装、不运行它所描述的包。它把一份纯文本来源列表编译成一个 `index.json`，供 DSH「发现」页展示。

### 8.2 输入 / 输出

```text
# npm 包：列出每个未弃用、非私有、声明了 bundle 的版本
@scope/dsh-example

# Git 仓库：列出发布标签与默认分支
https://github.com/author/dsh-plugin
```

```sh
pnpm --filter @deepseek-ai/dsh-plugin-market-generator start \
  --input plugins.txt --output site/index.json --title "Example Market"
```

生成后用 https 发布输出目录，在「发现」里把该 `index.json` 的 URL 添加为索引来源。

| 选项 | 默认 | 含义 |
|---|---|---|
| `--input <file>` | 必填 | 来源列表 |
| `--output <file>` | 必填 | 索引文件；过大图标写入同目录 `icons/`，不再使用的图标会被删除 |
| `--title <text>` | 必填 | 市场标题 |
| `--description <text>` | 无 | 市场描述 |
| `--cache <dir>` | 输入文件旁 `.plugin-market-cache` | 结果缓存（不在发布目录内） |
| `--registry <url>` | `https://registry.npmjs.org/` | npm 注册表 |
| `--inline-icon-bytes <n>` | `16384` | `data:` URL 内联图标的上限，不超过格式硬上限 32768 |
| `--concurrency <n>` | `4` | 并发来源数 |
| `--timeout-ms <n>` | `60000` | 单请求 / 单 Git 命令时限 |

`GITHUB_TOKEN` 仅用于采集 `github_stars`，只进 Authorization 头，不写入索引、缓存或诊断。退出码：`0` 全部成功、`1` 有来源读取失败、`2` 参数或列表无效。

### 8.3 收录规则

只有 `package.json` 声明了 `dsh.bundle`、`patch` 是文件路径或路径列表、且没有 `"private": true` 的版本才会列出。

Git 仓库的发现顺序（三层）：

1. 根 `package.json` 声明了 `dsh.bundle` → 只用根包；
2. `workspaces` / `pnpm-workspace.yaml` 的 `packages` 匹配到声明了 `dsh.bundle` 的包 → 用这些包（忽略否定 glob，报告未匹配的 glob）；
3. 否则扫描三层目录以内、`node_modules` / `test*` / `fixtures` / `example*` 之外的所有声明了 `dsh.bundle` 的包。

版本来自发布标签（`vX.Y.Z` / `X.Y.Z` 适用于所有包，`<name>@X.Y.Z` 只适用于同名包）与默认分支提交。`engines.dsh` 的推导规则与 3.5 一致：优先 manifest 的 `engines.dsh`，否则取 `peerDependencies` 中 DSH 范围的合取，`workspace:*|^|~` 视为当前版本、不增加限制；`*` 不写 `engines.dsh`；若在所有 DSH 版本上都会被拒绝则跳过该版本并告警。

展示字段遵循「DSH 读取已安装插件」的同一套规则：`locale/en.json` 与 `locale/<language>.json`、`meta.title` / `meta.description` 回退到 manifest、`icon`（≤256 KiB，SVG/PNG/JPEG/WebP）、`author` 去掉邮箱与 URL、`repository` 经 hosted-git-info 转换。`metadata.keywords` 原样复制。可选指标 `github_stars`、`npm_weekly_downloads` 写入 `metadata.sortKeys`。

### 8.4 安全与缓存

| 约束 | 内容 |
|---|---|
| npm tarball | 内存中读取；tarball 与解包文件各 ≤ 64 MiB；校验完整性与注册表哈希；拒绝离开包目录的路径 |
| Git | 深度 1 拉到私有临时裸仓库，按 blob 读取；无工作树，因此过滤器、LFS、符号链接不生效；符号链接与子模块视为不存在 |
| Git 运行时 | 禁用钩子与文件系统监视器；只允许 https/ssh；不继承除 `GIT_SSH` / `GIT_SSH_COMMAND` 外的 `GIT_*` |
| 大小限制 | manifest / locale / workspace 文件 > 1 MiB 拒收 |
| 缓存 | 按不可变输入缓存（npm 按注册表+图标阈值+包+版本集合；Git 按提交与目录），原子写入，损坏自动重建 |
| 确定性 | 上游不变时重复运行不重写输出 |

**它不判断质量**：索引内容只是各包的自述，星标数与下载量不代表可信度。

---

## 9. 关键接口 / 类型 / 文件速查

### 9.1 核心机制

| 文件 | 职责 |
|---|---|
| [vendor/include/src/patch.ts](../../../vendor/include/src/patch.ts) | patch 合并算法：id 映射（含嵌套 group）、整键赋值、`insert`、`name` 断言、`routeJournal` |
| [packages/boot/app-boot/src/profile-context.ts](../../../packages/boot/app-boot/src/profile-context.ts) | 层叠顺序的权威实现：bundle 层 → profile patch → home patch → `--patch` → telemetry |
| [packages/boot/app-boot/src/profile.ts](../../../packages/boot/app-boot/src/profile.ts) | profile 加载、manifest 校验、`bundlePatchFiles` / `bundlePatchPaths`、版本与平台准入、`skippedBundles`、`sanitizeProfile`、`loadProfileDirectory` |
| [packages/boot/app-boot/README.zh.md](../../../packages/boot/app-boot/README.zh.md) | profile / patch / 版本兼容 / 失败矩阵的权威说明 |
| [apps/cli/src/profile-boot.ts](../../../apps/cli/src/profile-boot.ts) | CLI 启动时组装配置层 |
| [packages/util/official-bundles/src/bundles.ts](../../../packages/util/official-bundles/src/bundles.ts) | 官方 profile 模板、bundle 元组、退役 bundle 列表（`PROFILE_TEMPLATES`） |

### 9.2 运行时与扩展

| 文件 | 职责 |
|---|---|
| `vendor/hmr/src/index.ts` | 文件监听、`hmr/change`、按插件入口聚合 reload unit、清模块缓存、重载、`hmr/reload` |
| [packages/boot/hmr/README.zh.md](../../../packages/boot/hmr/README.zh.md) | HMR 行为边界与串行化规则 |
| [packages/boot/plugin-manager/README.zh.md](../../../packages/boot/plugin-manager/README.zh.md) | 安装 / 启用 / 禁用 / 重试 / `restart-required` / 版本豁免 |
| [packages/extensions/cordis-host-runner/README.zh.md](../../../packages/extensions/cordis-host-runner/README.zh.md) | `ctx.dynamicCordisRunner` 接口与沙箱立场 |
| [packages/extensions/tool-cordis/README.zh.md](../../../packages/extensions/tool-cordis/README.zh.md) | `cordis_inspect_list` / `cordis_inspect_query` 只读边界 |
| [docs/subsystems/extensions.zh.md](../../subsystems/extensions.zh.md) | 生成式 Cordis API 目录（`ctx.cordisInspect`、`ctx.dynamicCordisRunner`、`ctx.inspector`、`cordis/*` 事件） |

### 9.3 能力提供方

| 文件 | 职责 |
|---|---|
| [packages/skill/skill/README.zh.md](../../../packages/skill/skill/README.zh.md) | `ctx.skills` 注册表、`registerProvider`、调用策略四象限、`collectCacheMaxEntries` |
| [packages/skill/skill-filesystem/README.zh.md](../../../packages/skill/skill-filesystem/README.zh.md) | `SKILL.md` 解析、frontmatter 字段、rank 优先级表 |
| [packages/mcp/mcp-client/README.zh.md](../../../packages/mcp/mcp-client/README.zh.md) | 传输、工具命名、超时与重连、凭据模板 |
| [packages/mcp/mcp-manager/README.zh.md](../../../packages/mcp/mcp-manager/README.zh.md) | 设置驱动编队、`ctx.mcpManager`、`servers` 整映射替换的风险 |
| [packages/preset/agent-preset/README.zh.md](../../../packages/preset/agent-preset/README.zh.md) | preset 声明字段与代际语义 |

### 9.4 生态与发布

| 文件 | 职责 |
|---|---|
| [packages/bundle/base/cordis.patch.yml](../../../packages/bundle/base/cordis.patch.yml) | 「一个 insert 铺满共享核心」的实物例证 |
| [packages/bundle/web-app/cordis.patch.yml](../../../packages/bundle/web-app/cordis.patch.yml) | 「按 id 覆盖 base 行」的实物例证 |
| [packages/bundle/web-app/package.json](../../../packages/bundle/web-app/package.json) | `dsh.bundle.patch` 多文件有序列表的例证 |
| [packages/experimental/README.zh.md](../../../packages/experimental/README.zh.md) | 实验性 / 可选 / 官方状态定义与包清单 |
| [scripts/experimental-package-policy.ts](../../../scripts/experimental-package-policy.ts) | 实验包命名与发布策略 |
| [apps/plugin-market-generator/README.zh.md](../../../apps/plugin-market-generator/README.zh.md) | 索引生成器的完整规则 |
| [docs/user/develop/basic/publish.zh.md](../../user/develop/basic/publish.zh.md) | 插件/bundle 声明格式与层顺序表 |
| [docs/subsystems/boot.zh.md](../../subsystems/boot.zh.md) | profile 对账（`#profile-reconciliation`） |
| [docs/subsystems/client-modules.zh.md](../../subsystems/client-modules.zh.md) | `dsh.client` 扫描与 `/plugins` 路由 |

---

## 10. 待确认

以下内容在本次只读代码范围内未能 100% 确认，落地前建议再核对：

1. **patch 去重细节**：`insert` 项与已有行同 `id` 时的确切行为（映射覆盖还是保留两条），需精读 `vendor/include/src/patch.ts` 中映射构建与 `insert` 处理的先后顺序。
2. **`routeJournal` 的公开形状**：GUI 配置编辑器如何消费它、写回时如何选择目标层，仓库内尚未找到调用方说明。
3. ~~telemetry 补丁的注入条件~~ —— **已核（本轮源码）**：`app-boot` 的 `readProfilePatches()` 对所有 profile 形态都最后追加该补丁；仅当 `DSH_TELEMETRY_DISABLED` 非空、或合并后的行里不存在 `session-telemetry-otel` 时不追加（[profile-context.ts](../../../packages/boot/app-boot/src/profile-context.ts) 39、52-55、74-85 行）。
4. **`dsh.bundle.platforms` 与 HMR 的交互**：平台跳过的 bundle 在 HMR 重读时是否重新评估（README 说明「启动器在读取组合包 patch 前验证」，未说明重载路径）。
5. **动态 Cordis 插件的审批阈值**：浏览器半除 `clientInspectTimeoutMs` 外，是否还有额外权限门（如工具白名单）。
6. **`mcp-resources` 的工具清单**：其在 `ctx` 上暴露的具体工具名未在本次阅读范围内完整列出。
