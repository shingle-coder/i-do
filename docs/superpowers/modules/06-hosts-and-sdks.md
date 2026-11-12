# 06 多端载体与 SDK

> 本文是《项目总览》([project-overview.md](../project-overview.md)) 的分册之一，覆盖「多端载体与 SDK」这一横切面。> 覆盖目录：`apps/cli`、`apps/desktop`、`apps/desktop-host`、`native`、`python`、`packages/sdk`、`packages/acp`、`packages/api`、`packages/host`。> 相邻分册：[03 模型与配置](./03-models-and-config.md)、[07 协作与调度](./07-collaboration-scheduling.md)。

本分册的重点是**进程模型与通信通道**：谁拉起谁、走什么通道、通道上跑什么协议、由谁鉴权。

---

## 1. 模块地图

| 目录 | 关键包 / 产物 | 职责 | 入口 |
|---|---|---|---|
| [`apps/cli`](../../../apps/cli/README.zh.md) | `@deepseek-ai/dsh`（bin `dsh`） | 公共命令行；解析 launcher 参数并 boot 一个 profile | [`bin.ts`](../../../apps/cli/src/bin.ts) |
| [`apps/desktop`](../../../apps/desktop/README.zh.md) | Electron 应用 | 主进程、渲染层、`dsh-app://` 协议、Host 子进程生命周期管理 | [`main.ts`](../../../apps/desktop/src/main.ts) |
| [`apps/desktop-host`](../../../apps/desktop-host/src/index.ts) | `@deepseek-ai/dsh-desktop-host` | 在 Node 子进程内 boot `desktop` profile，监听 `127.0.0.1` 的动态端口 | [`index.ts`](../../../apps/desktop-host/src/index.ts) |
| `apps/desktop-host`（CLI 面） | 同上 | 用 Desktop 安装携带的不可变运行时执行公开 `dsh` 命令 | [`cli.ts`](../../../apps/desktop-host/src/cli.ts) |
| [`packages/host`](../../../packages/host/README.zh.md) | `dsh-host-*` 系列 | Host 侧能力：HTTP 服务、静态前端、目录选择、打开外部应用、插件清单、遥测 | [`webserver/src/index.ts`](../../../packages/host/webserver/src/index.ts) |
| [`packages/api`](../../../packages/api/README.zh.md) | `dsh-api-*` 系列 | Client ↔ Host 的类型化 RPC（Typert）、业务 Remote、访问控制 | [`gateway/README.zh.md`](../../../packages/api/gateway/README.zh.md) |
| [`packages/sdk`](../../../packages/sdk/README.zh.md) | `dsh-sdk-protocol` / `-client` / `-jsonrpc-server` | TypeScript SDK：协议定义、子进程客户端、stdio 服务插件 | [`protocol/src/transport.ts`](../../../packages/sdk/protocol/src/transport.ts) |
| [`packages/acp/acp`](../../../packages/acp/acp/README.zh.md) | `@deepseek-ai/dsh-acp` | ACP（Agent Client Protocol）v1 的 stdio 服务 | [`src/index.ts`](../../../packages/acp/acp/src/index.ts) |
| [`python/sdk`](../../../python/sdk/README.zh.md) | `deepseek-harness-sdk`（`deepseek_harness`） | Python 侧 JSON-RPC 客户端（高层 `DeepSeekHarness` + 低层 `HarnessClient`） | `deepseek_harness/__init__.py` |
| [`python/sdk-runtime`](../../../python/sdk-runtime/README.zh.md) | `deepseek-harness-runtime-bin`（`deepseek_harness_runtime`） | 内置 `dsh` 可执行程序与原生伴随文件 | — |
| [`native/system`](../../../native/system/README.zh.md) | `@deepseek-ai/node-addon-system` | Linux Landlock 启动器 + POSIX `flock` 文件锁（Node-API addon） | [`packages/entry/src/index.ts`](../../../native/system/packages/entry/src/index.ts) |

---

## 2. 进程模型与调用关系总览

### 2.1 四类载体的进程拓扑

```text
┌────────────────────── 载体 A：CLI（单进程，前台）───────────────────────┐
│ apps/cli/src/bin.ts  runCli()                                          │
│   ├─ mode=profile  → profile-boot.ts runProfile() → Cordis 插件树       │
│   │                   （同进程内 boot，不 spawn）                       │
│   ├─ mode=plugin   → plugin.ts → spawn pnpm（cwd=profile 目录）         │
│   └─ mode=dump-*   → 打印组合后的配置树 / Schema，不 boot                │
│ profile 为 acp / sdk / sdk-minimal 时，树内插件改用 stdin/stdout 收发     │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────── 载体 B：Web（单进程）─────────────────────────────┐
│ dsh web → --profile web → packages/bundle/web-app 插件树                │
│   ctx.webStartup（--host / --port，默认 3080）→ ctx.webServer.listen     │
│   frontend-static 占 registerFallback 席位，返回打包前端                 │
│   浏览器 ──HTTP──▶ /                 静态资源 + index 注入               │
│   浏览器 ──HTTP──▶ /api              Connection FetchHandler → Gateway   │
│   浏览器 ──WS────▶ /api/remote.mux   多路复用 Remote 流 + uplink         │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────── 载体 C：Desktop（三进程）─────────────────────────┐
│ Electron Main（apps/desktop/src/main.ts）                               │
│    │ spawn(ELECTRON_RUN_AS_NODE, ['--expose-internals', hostEntry, …])   │
│    │ stdio: ['ignore', 'pipe', 'pipe', 'ipc']                            │
│    ▼                                                                    │
│ Desktop Host（apps/desktop-host，纯 Node 进程）                          │
│    runProfile(desktop profile) → ctx.webServer 监听 127.0.0.1:0          │
│    process.send({type:'ready', url, injections})  ──Node IPC──▶ Main     │
│    process.send({type:'fatal' | 'platform-session' | …})                 │
│    ◀── Node IPC ── control request / response（更新、退出、拖拽资源）    │
│                                                                         │
│ Renderer（BrowserWindow，从 dsh-app://app/ 加载打包前端）                │
│    preload → contextBridge → window 上的桌面产品 API                     │
│    invoke('dsh-desktop:boot') 取得 { injections, streamBaseUrl }         │
│    HTTP 由主进程转发到已认证 Host；WS 流仅对归属窗口附加凭据              │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────── 载体 D：SDK 调用方（双进程）──────────────────────┐
│ 调用方进程（TS: DeepSeekHarness / Python: DeepSeekHarness）              │
│    │ spawn 'dsh --profile sdk'（stdio: pipe / pipe）                    │
│    ▼                                                                    │
│ 运行时进程（Cordis 树 + dsh-sdk-jsonrpc-server）                         │
│    stdin / stdout：每行一个 JSON-RPC 消息（按 \n 分帧）                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 通道一览

| 通道 | 两端 | 承载内容 | 协议 / 分帧 | 鉴权与信任 |
|---|---|---|---|---|
| 终端 stdio | CLI ↔ 用户 | TUI 渲染、headless 最终答案 | 文本 | — |
| Node IPC（fd 3） | Electron Main ↔ Desktop Host | `ready` / `fatal` / `platform-session` / `plugin-operation` / `update-tasks` / `file-drag-resource` / `shutdown-complete`，以及 control request 的应答 | `process.send` 结构化消息 | 父子进程关系（`ipc` 通道仅本机） |
| HTTP（`ctx.webServer`） | 浏览器 / 渲染层 → Host | 前端静态资源、`/api` 一元调用 | HTTP（可与 HTTPS 同端口） | `ctx.connection` 的 token / Cookie，`/api` trust fence |
| WebSocket `/api/remote.mux` | Client 插件 ↔ Gateway | 一元应答转发、多路复用流、每流 uplink | WebSocket；心跳默认 2s；默认 `deflate` | 同 Connection 信任模型 |
| IPC（`dsh-desktop:*`） | 渲染层 ↔ Electron Main | 文件保存、剪贴板、快捷键、更新、拖拽、目录选择、窗口外观 | Electron `ipcRenderer.invoke` | `assertDesktopSender()` 校验来源帧 |
| ACP stdio | ACP 客户端 ↔ `dsh --profile acp` | ACP v1 JSON-RPC | JSON-RPC over stdio（分帧见 §8.1） | 无鉴权（`authenticate` 立即成功） |
| SDK stdio | 调用方 ↔ `dsh --profile sdk` | SDK 自有 JSON-RPC | 换行分帧（`\n`） | 无鉴权（本地子进程，home 由调用方指定） |

### 2.3 谁调用谁

1. **CLI → Cordis 树**：`runCli()` 按 invocation mode 分派，`profile` 模式下动态 `import('./profile-boot.ts')` 并调用 `runProfile()`，在**当前进程**内完成 patch 组合与插件加载（[`bin.ts`](../../../apps/cli/src/bin.ts) 31-49 行）。
2. **CLI → pnpm**：`plugin` 模式调用 `runPlugin()`，把剩余 argv 原样转发给 profile 目录下的 pnpm（[`bin.ts`](../../../apps/cli/src/bin.ts) 50-54 行）。
3. **Electron Main → Desktop Host**：`DesktopHostProcess.start()` 用 `spawn()` 拉起 Host 子进程，`ready` 到达后才 resolve 出 `{ url, injections }`（[`host-process.ts`](../../../apps/desktop/src/host-process.ts) 204-269 行）。
4. **Desktop Host → Cordis 树**：Host 直接调用 `runProfile()`，固定传入 `--no-open --host 127.0.0.1 --port 0`（[`index.ts`](../../../apps/desktop-host/src/index.ts) 19-46 行）。注意 Host **不经过** `parseDshArgs`，因此公共 CLI 对 `desktop` profile 的拒绝不影响它。
5. **Host → Electron Main**：先发 `starting`（带 runId），监听成功后发 `ready`；失败发 `fatal` 并携带完整诊断（[`index.ts`](../../../apps/desktop-host/src/index.ts) 127-136 行）。
6. **Electron Main → Renderer**：通过 `dsh-desktop:boot` 等 IPC 下发启动注入与流基址；渲染层自 `dsh-app://app/` 加载。
7. **Renderer → Host**：HTTP/WS 请求经主进程转发到已认证的 Host origin。
8. **调用方进程 → SDK 运行时**：TS/Python SDK 以 `dsh --profile sdk` 拉起子进程，读写 stdin/stdout。
9. **ACP 客户端 → `dsh --profile acp`**：外部编辑器 / Agent 客户端以子进程方式启动 dsh，走 ACP v1 方法集。
10. **Desktop 内嵌 CLI → 公共 CLI 实现**：`apps/desktop-host/src/cli.ts` 调用 `runCli({ manageDesktopProfile: true, packageManager })`，这就是 `args.ts` 中 `manageDesktopProfile` 开关的唯一来源（[`args.ts`](../../../apps/cli/src/args.ts) 199 行）。

### 2.4 端口归属

| 载体 | 监听地址 | 端口来源 | 备注 |
|---|---|---|---|
| Web | `--host`（默认回环） | `ctx.webStartup.port`，**默认 3080** | 默认值写在 [`cordis.patch.yml`](../../../packages/bundle/web-app/cordis.patch.yml)（177-189 行）；`--port` 可覆盖（[`startup.ts`](../../../packages/bundle/web-app/src/startup.ts) 115-117 行）
| Desktop Host | `127.0.0.1` | `--port 0`，由 OS 分配 | 实际端口读 `ctx.webServer.port`；这样不会与 Web 的 3080 或系统保留端口冲突（[`README.zh.md`](../../../apps/desktop/README.zh.md) 40 行）
| CLI（acp / sdk / headless / tui） | 不监听 | — | 纯 stdio
| api 包 | 不监听 | — | 复用 Host 的 HTTP handler 与 WS upgrade，见 §7.1
| native | 不监听 | — | 库，无服务

> 除 3080 外，代码中没有把任何端口写死为常量：Desktop 走 `0`，Web 走 profile 配置，`packages/host/webserver` 只声明「`port: 0` 表示请求 OS 分配」。

---

## 3. CLI 载体

### 3.1 启动方式

`package.json` 的 bin 指向 `lib/bin.js`；文件自带 shebang `#!/usr/bin/env node`，`import.meta.main` 为真时直接执行 `runCli()`（[`bin.ts`](../../../apps/cli/src/bin.ts) 76-78 行）。

`runCli()` 接收安装方注入的 `packageManager`（pnpm 可执行路径 + node bin）与 `manageDesktopProfile`，再交给 `parseDshArgs` 解析出四种 invocation。

### 3.2 参数边界规则（重要）

launcher 只解析**自己的** flag，遇到第一个不认识的 token 就把后面全部原样透传给被 boot 的 app：

- `dsh --profile tui --resume abc` → boot `tui`，把 `--resume abc` 交给 app；
- `dsh --profile web -h` → 打印 **web app 的**帮助，而不是 launcher 帮助；
- 裸 `dsh -h`（无 profile）才打印 launcher 帮助（[`args.ts`](../../../apps/cli/src/args.ts) 159-180 行）。

实现依赖 commander 的 `.allowUnknownOption().passThroughOptions().enablePositionalOptions()` 组合，且 `--patch` 被刻意做成**可重复的单值选项**而非 variadic——variadic 会把 app 参数一并吞掉（[`args.ts`](../../../apps/cli/src/args.ts) 72-76 行）。

`dsh <name>` 是 `dsh --profile <name>` 的缩写：解析器在首个 token 非 `-` 且不等于 `plugin` 时，自动在前面补 `--profile`（[`args.ts`](../../../apps/cli/src/args.ts) 206-209 行）。

### 3.3 入口模式

| 用法 | 解析结果 | 行为 |
|---|---|---|
| `dsh <name>` / `dsh --profile <name>` | `mode: 'profile'` | boot `$DSH_HOME/profiles/<name>` |
| `dsh --profile <name> --from-default-profile <template>` | `mode: 'profile'` + `fromDefaultProfile` | 用随包模板的副本替换该 profile 后再 boot |
| `dsh --profile <name> --patch a.yml --patch b.yml` | `mode: 'profile'` + `patches` | 按 argv 顺序叠加额外 patch |
| `dsh --profile <name> --dump-config` | `mode: 'dump-config'` | 打印组合后的树并退出（不做 boot） |
| `dsh --profile <name> --dump-default-config` | 同上 + `defaultOnly` | 只打印 bundle 层，不含用户层与 `--patch` |
| `dsh --profile <name> --dump-config-schema` | `mode: 'dump-config-schema'` | 打印 profile 条目与 patch 的 JSON Schema |
| `dsh plugin --profile <name> <pnpm args...>` | `mode: 'plugin'` | 在 profile 目录内转发给 pnpm |
| `dsh web` | `mode: 'profile'`，profile=`web` | Web 载体 |
| `dsh --profile acp` | `mode: 'profile'`，profile=`acp` | ACP stdio 服务 |
| `dsh --profile sdk` / `sdk-minimal` | `mode: 'profile'` | SDK stdio 服务 |
| `dsh --profile headless "job"` | `mode: 'profile'` | 新建持久会话，打印最终答案后退出 |

约束：
- `--dump-config` / `--dump-default-config` / `--dump-config-schema` 三者互斥，且都**不接受** app 参数（dump 不运行 app 的命令行 provider，打印出的树与真实 boot 会不一致，因此直接报错）。
- `--dump-default-config` 不接受 `--patch`。
- **`--profile desktop` 被公共 CLI 拒绝**：`desktop` profile 由 Electron 应用独占管理（[`args.ts`](../../../apps/cli/src/args.ts) 83-87 行）；只有 Desktop 安装携带的载体在 `manageDesktopProfile = true` 时才能对 `desktop` profile 做 plugin 管理。

### 3.4 profile boot 与 patch 分层

分层顺序的权威实现在 `app-boot` 的 `readProfilePatches()`（[`profile-context.ts`](../../../packages/boot/app-boot/src/profile-context.ts) 70-85 行），即：

```text
bundle 层（随包发布的 patch 链，按 dsh.profile.bundles 顺序）
  → profile 用户层（$DSH_HOME/profiles/<name>/cordis.patch.yml）
    → home 级用户层（$DSH_HOME/cordis.patch.yml，机器本地偏好，因此高于逐 profile 层）
      → --patch 传入的 overlay（按 argv 顺序，最后一个是最高优先级）
        → telemetry 补丁（由启动器最后追加）
```

`composeProfile()` 依次执行 `prepareProfile()`（确保 profile 存在、必要时从模板初始化）→ `createRuntimeResolution()`（确定运行时模块解析根）→ `loadOverlayPatches()`（读取 `--patch` 文件）（[`profile-boot.ts`](../../../apps/cli/src/profile-boot.ts) 212-235 行）。

> 注意：`profile-boot.ts` 顶部模块注释把层序概括为「bundle 层、profile 自身 patch、`--patch` overlay、telemetry」，省略了 home 级 patch；以 `profile-context.ts` 的实现为准（与 [05](./05-plugin-ecosystem.md) 第 3.1 节一致）。

`runProfile()` 的主流程（[`profile-boot.ts`](../../../apps/cli/src/profile-boot.ts) 282-359 行）：设置 profile 的 User-Agent → 安装网络代理 → 组合 profile → 创建 shutdown 句柄 → 向 Cordis 注入 `profileContext` 与 launch environment → 加载插件 → 提供 `cmdline` 服务 → 返回 `{ ctx, shutdown }`。

`RunProfileOptions` 字段：`profile`、`resolvedProfile`、`fromDefaultProfile`、`patchFiles`、`args`、`packageManager`（[`profile-boot.ts`](../../../apps/cli/src/profile-boot.ts) 246-261 行）。

`apps/cli` 另外通过 `exports` 暴露 `./profile-boot`，供 `apps/desktop-host` 复用同一套 boot 逻辑——这是「Desktop 与 CLI 共享同一 profile runner」的关键接缝。

### 3.5 进程结构

CLI 是**单进程**：所有 profile（web / tui / headless / acp / sdk）都在当前进程内以 Cordis 插件树运行。唯一会 spawn 的路径是 `plugin` 模式下的 pnpm 转发。

---

## 4. Web 载体

- 启动：`dsh web`，等价于 `dsh --profile web`，boot `packages/bundle/web-app` 组合。
- 端口：`ctx.webStartup` 提供 host/port/tls；默认 `3080`，`--port` 覆盖（[`startup.ts`](../../../packages/bundle/web-app/src/startup.ts) 115-117 行），配置在 [`cordis.patch.yml`](../../../packages/bundle/web-app/cordis.patch.yml) 177-189 行。
- 对外 HTTP 面：
  - `/`：前端静态资源，由 `frontend-static` 占据 `registerFallback` 唯一回退席位（未命中任何精确/前缀路由时才会走到它）；
  - `/api`：Connection 共享的 FetchHandler，交给 Typert Gateway 分发；
  - `/api/remote.mux`：WebSocket upgrade，多路复用 Remote 流。
- 进程结构：单进程，无子进程（除 agent 工具自身拉起的 shell / 外部程序）。

---

## 5. Electron 桌面端

### 5.1 三进程职责

| 进程 | 技术形态 | 职责 | 关键文件 |
|---|---|---|---|
| Electron Main | Electron 主进程 | 窗口与协议注册、`dsh-app://` 处理、桌面产品 API（文件保存、剪贴板、快捷键、更新、拖拽、目录选择）、Host 子进程生命周期 | [`main.ts`](../../../apps/desktop/src/main.ts)、[`host-process.ts`](../../../apps/desktop/src/host-process.ts)、[`ipc.ts`](../../../apps/desktop/src/ipc.ts) |
| Desktop Host | 纯 Node 进程（`ELECTRON_RUN_AS_NODE`） | boot `desktop` profile，监听 `127.0.0.1` 动态端口，生成带凭据的 URL 与 index 注入 | [`index.ts`](../../../apps/desktop-host/src/index.ts) |
| Renderer | BrowserWindow（隔离 + sandbox） | 加载打包前端，通过 preload 暴露的 API 与 Main 通信 | `apps/desktop/src` 下的 preload / 渲染入口 |

窗口创建在 `createWindow()`：配置 preload、`contextIsolation`、`sandbox`，并把导航限制在 `dsh-app:` 或同源 HTTP（[`main.ts`](../../../apps/desktop/src/main.ts) 264-379 行）。`main()` 负责初始化 Desktop 项目、runtime 与 Host 环境变量，并把 `backend.host` 下发给文件拖拽等桌面能力（381-418 行）。README 另有「欢迎窗口外观」章节，说明启动引导阶段存在独立欢迎界面；其是否为独立 BrowserWindow 未在本次阅读中确认（见 §13）。

### 5.2 Host 子进程的启动命令行

```ts
// apps/desktop/src/host-process.ts
const entry = join(this.runtimeDir, 'node_modules', '@deepseek-ai', 'dsh-desktop-host', 'lib', 'index.js')
const child = spawn(this.node, [
  '--expose-internals',
  ...(this.inspectPort === undefined ? [] : [`--inspect=127.0.0.1:${String(this.inspectPort)}`]),
  entry,
  this.runtimeDir,          // 运行时根（含 node_modules）
  this.projectDir,          // 工作区项目目录
  this.primaryRuntime ?? '',// 主运行时选择
  '--host', '127.0.0.1',
  '--port', '0',
  ...this.packageManager === undefined ? [] : [this.packageManager.pnpm, this.packageManager.nodeBin],
], {
  cwd: this.projectDir,
  env: desktopNodeEnvironment(this.node, undefined, this.environment),
  stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
})
```

要点：
- `--expose-internals` 是 Host 侧插件加载所需；调试时追加 `--inspect=127.0.0.1:<port>`，端口来自 `DSH_DESKTOP_HOST_INSPECT_PORT`。
- `stdio` 的第 4 个元素 `'ipc'` 是主进程与 Host 之间的唯一通信通道。
- stdout 直接 pipe 到主进程 stdout，stderr 保留用于诊断拼接（[`host-process.ts`](../../../apps/desktop/src/host-process.ts) 228-248 行）。
- 子进程环境由 `desktopNodeEnvironment()` 构造，不直接继承 Electron 的环境。

### 5.3 Node IPC 上的消息

Host → Main：

| 消息 | 时机 | 载荷 |
|---|---|---|
| `starting` | 子进程开始 boot | `runId`（用于把后续故障归因到某一次启动） |
| `ready` | WebServer 监听成功 | `{ url, injections }`，`url` 由 `ctx.connection.authenticatedUrl()` 生成 |
| `fatal` | 启动或运行期不可恢复失败 | `{ message, diagnostic }`，走 IPC 而非 stderr，以保证诊断完整 |
| `platform-session` | 平台会话状态变化 | 由 `installPlatformSessionPublisher` 提供 |
| `plugin-operation` | 插件安装/恢复进度 | 由 `installOperationDiagnostics` 提供 |
| `update-tasks` | 更新任务清单变化 | 与 `installDesktopUpdateTaskControl` 配套 |
| `shutdown-complete` | 优雅关闭完成 | — |

Main → Host：control request / response（`file-drag-resource`、`update-tasks`、`quitInspection` 等），由 `DesktopHostProcess` 维护 `controlRequests` 映射，超时或 `fatal` 时统一 reject（[`host-process.ts`](../../../apps/desktop/src/host-process.ts) 308-367 行）。

协议代号：`DESKTOP_HOST_PROTOCOL_VERSION = 4`（[`host-protocol.ts`](../../../apps/desktop/src/host-protocol.ts)），记录在 Desktop 发布元数据中，用于主进程与 Host 版本配套校验。

### 5.4 `dsh-app://` 与信任边界

- `SCHEME = 'dsh-app'`，主进程以 `protocol.registerSchemesAsPrivileged` + `protocol.handle` 注册（[`main.ts`](../../../apps/desktop/src/main.ts) 189-199 行）。
- 渲染层从 `dsh-app://app/` 加载**打包在应用内的**前端入口，因此窗口在 Host 尚未就绪时也能先渲染「加载页」。
- 所有 IPC handler 入口先调用 `assertDesktopSender(event, hostnames)`：要求 `event.senderFrame.url` 的协议是 `dsh-app:` 且 hostname 在白名单内，否则拒绝（[`ipc.ts`](../../../apps/desktop/src/ipc.ts) 113-128 行）。这防止被注入的第三方内容调用桌面能力。
- IPC channel 统一前缀 `dsh-desktop:`，覆盖面包括：`boot`、`enterWorkspace`、`onboardingActive`、`onboardingApiKey`、`bootFailed`、`fileSave`、`clipboardImageRead`、`shortcuts*`、`browserAcquire/Release/OpenRequested`、`directoryPick`、`fileDragPrepare/Cancel/Start/Release`、`deviceInfo`、`localeBootstrap/Changed`、`updatesChannelGet/Set/Changed`、`updatesStatus/Open/Presentation`、`nativeThemeSet`、`windowFullscreen`、`windowsAppearance`、`windowsMenu`。

### 5.5 渲染层到 Host 的请求路径

1. Renderer 启动后 `invoke('dsh-desktop:boot')`，拿到 `{ injections, streamBaseUrl }` 并据此在同一次文档加载中启动客户端（不跳转、不重载）。
2. 业务 HTTP 请求由主进程转发到已认证的 Host origin；`injections` 是 Host 侧 `ctx.webServer.collectIndexInjections(ctx.connection.browserPeer)` 的产物，用于把 client 侧的启动参数直接注入 index。
3. WebSocket 流按监听器区分 `ws:` / `wss:`，附加凭据时必须 authority 与 scheme 同时匹配；只有归属窗口的流才会被附加凭据（[`README.zh.md`](../../../apps/desktop/README.zh.md) 42 行）。

### 5.6 为什么拆成两个进程

| 原因 | 说明 |
|---|---|
| 运行时隔离 | Host 需要完整 Node 能力（`--expose-internals`、插件动态加载、原生 addon）。Electron 渲染进程是 sandbox，主进程也不应承载业务插件树。 |
| 崩溃隔离 | Host 崩溃只影响后端，主进程可重启 Host 并让窗口显示错误/重试界面；主进程崩溃则会整个应用退出。 |
| 阻塞隔离 | agent 执行、HTTP 服务、插件安装都在 Host 内，避免阻塞 Electron 主进程的事件循环（窗口、菜单、IPC 会卡顿）。 |
| 版本与打包约束 | Host 使用 Desktop 安装携带的**不可变运行时**（`resources/runtime/...`），与 Electron 自带的 Node 解耦；`dsh --profile desktop` 因此被公共 CLI 拒绝，只能由 Electron 载体管理。 |
| 复用 CLI boot 逻辑 | Host 直接调用 `runProfile()`，与 CLI 走同一套 profile 组合与 patch 分层，避免两套启动实现漂移。 |

### 5.7 关闭与故障

- 子进程断开（`process.once('disconnect')`）时 Host 主动 `stop()`。
- 主进程侧 `fail()` 会：附加 `hostRunId`、清空 platform session、reject `readyPromise`、reject 所有挂起的 control request。启动期的 `fatal` 被包成 `DesktopHostFatalError`。
- `shutdown-complete` 用于主进程确认优雅退出完成，之后才允许真正退出应用。

---

## 6. `host` 包与 webserver

### 6.1 子包职责

| 子包 | ctx key | 职责 |
|---|---|---|
| `webserver` | `ctx.webServer` | HTTP/HTTPS 监听、路由注册、SSE/WS upgrade、index 注入 |
| `frontend-static` | —（消费 `ctx.webServer`） | 占据 `registerFallback` 唯一回退席位，返回打包前端 |
| `directory-picker` | `ctx.directoryPicker` | 目录选择 seam（能力抽象），供 Client 侧调用 |
| `directory-picker-native` / `-browse` / `-auto` | — | seam 的三种实现：原生对话框 / 浏览器内浏览 / 自动选择 |
| `open-in-app` | —（消费 `ctx.webServer`） | 用系统应用打开文件；走 `connection.requestRejection` 做访问判定 |
| `plugin-inventory` | — | 暴露 Remote `pluginInventory/list` |
| `product-telemetry-otel` | `ctx.productTelemetry` | OpenTelemetry 产品遥测 |

### 6.2 `ctx.webServer` 接口面

| 成员 | 语义 |
|---|---|
| `host` / `port` | 实际绑定地址与实际监听端口；`port: 0` 时读这里拿真实端口 |
| `protocol` | `'http:'` 或 `'https:'` |
| `getOrigin()` | 拼出可直接使用的 origin |
| `register(route)` | 注册精确或前缀路由；`resource(request, peer?)` 只处理 GET/HEAD，其他方法返回 405 + `Allow: GET, HEAD` |
| `registerUpgrade(route)` | 注册 WebSocket upgrade，只匹配**精确** pathname |
| `registerFallback(handler)` | 唯一回退席位，二次注册直接抛错；不注册则未命中走 404 |
| `collectIndexInjections(peer)` / `renderIndex(html, peer)` | 收集并应用 index 注入 |
| `tapIndex` / `applyIndexTaps` | index HTML 的变换钩子 |

### 6.3 约束

- `host` **只接受具体 IPv4/IPv6 字面量**；通配地址（`0.0.0.0`、`::`）在加载时即拒绝，避免静默暴露到局域网。相关工具：`isLoopbackHost`、`isWildcardHost`、`normalizeBindAddress`、`bindUrlHost`、`getOrigin`。
- `compression: 'gzip'`；`tls: { certFile, keyFile }` 时同一端口提供 HTTPS，**不做 HTTP→HTTPS 重定向、不发 HSTS**。
- 监听失败（含 `EADDRINUSE`）会让插件初始化直接失败；单个 handler 抛错只返回 400 并记 warning，不退出进程。
- 源码仅两个文件：[`src/index.ts`](../../../packages/host/webserver/src/index.ts)、`src/injections.ts`。

---

## 7. `api` 包与 Typert RPC

### 7.1 暴露什么、给谁用、有没有端口

`packages/api` 不自己监听任何端口：它把 endpoint 注册到 Connection 共享的 `/api` FetchHandler 上，把流挂到 `/api/remote.mux` 这条 WebSocket upgrade 上。

| 面 | 协议 | 使用者 |
|---|---|---|
| `/api` 一元调用 | HTTP POST（经 `ctx.connection.rpc.call('/api', endpoint, args)`） | Client 侧插件（浏览器 / Electron 渲染层） |
| `/api/remote.mux` | WebSocket | Client 侧 `ctx.remote` |
| 进程内载体 | 直接函数调用 | 同进程内的嵌入式宿主（不打开 WebSocket） |

Gateway 在 `/api` handler 上注册 trusted-host interceptor：已认领的 endpoint 分发给 Gateway，未认领且没有精确 Fetch 路由的请求返回 404。

### 7.2 子包

| 子包 | ctx key | 职责 |
|---|---|---|
| `remotes` | — | 决定 Client 可消费哪些 Host 能力与事件 |
| `gateway` | `ctx.typertGateway` / `ctx.remote` | 一元调用 + 多路复用流 + Host 事件转发 |
| `remote-access` | `ctx.remoteAccess` / `ctx.remote.remoteAccess` | 非 owner Peer 的访问决策、列表过滤、访问快照 |
| `job-controller` | `ctx.jobController` / `ctx.remote.job` | 后台任务 record 流 |
| `session-controller` | `ctx.sessionController` / `ctx.remote.session` | 会话命令、历史、实时控制、身份策略 |
| `settings-controller` | `ctx.settingsController` / `ctx.credentialsController` | settings 与凭据 |
| `workspace-controller` | `ctx.workspaceController` | 工作区 |
| `terminal-controller` | `ctx.terminalController` | 终端 |
| `workspace-files` | — | 工作区文件访问 |

### 7.3 调用时序

```text
Client（ctx.remote）                          Host（ctx.typertGateway）
  │ 一元：connection.rpc.call('/api', ep, args) ──HTTP──▶│
  │                                                      │ 校验 endpoint / 参数
  │                                                      │ 非 owner → remoteAccess.decide()
  │                                                      │ 解析 lookup / Context 接收者
  │◀──────────────────────────── RemoteResult<T> ────────│
  │                                                      │
  │ 流：open('/api/remote.mux') ──WebSocket upgrade─────▶│
  │                                                      │ 每条逻辑流带独立 uplink
  │◀──── 流项 ───────────────────────────────────────────│
  │───── uplink 项（≤ streamInboxBytes）────────────────▶│
  │◀──── Ping（每 2s） / 自动 Pong ──────────────────────│
```

关键参数与行为：
- 一元结果：codec 有 `encode()` 就执行，否则保持 strict JSON；字节附件相对结果单独传输。
- 流：`@Remote({ mode: 'stream' })`，返回 `Iterable` / `AsyncIterable`；`ctx.typertGateway.stream()` 做与一元调用相同的校验。
- 取消：支持取消的方法把 `signal: AbortSignal` 声明为**最后一个 Host 参数**；它是 descriptor 元数据，不是 wire 参数，由 Connection 提供、Gateway 在解码后的业务参数之后注入。
- 心跳：`websocketHeartbeatIntervalMs` 默认 2000ms；连续两个 Ping 间隔无活动即终止该 socket。
- 压缩：`websocketCompression` 默认 `'deflate'`；对 ≥1024 字符的 JSON 文本帧压缩，上行压缩由对端决定。
- `streamInboxBytes` 默认 262144（256 KiB）。
- 门控：只有 `ctx.appReady` 就绪后才注册 WS upgrade 路由；此前连接尝试按载体故障由 Connection 重试策略处理，避免 Host 重启期间在控制器未初始化时接受流。
- Peer 必填：`InvokeRemoteRequest.peer` 与 `wireStream.open({ peer })` 都必填，Gateway 从不给默认 Peer；已释放的 Peer 在读取 payload 之前就以 `gateway/peer-disposed` 失败。

### 7.4 错误码

| 码 | 含义 |
|---|---|
| `gateway/uplink-overflow` | 缓冲的 uplink 帧超过 `streamInboxBytes` |
| `gateway/protocol` | `end` 之后仍收到 uplink 项等协议违例 |
| `gateway/input-invalid` | 参数或 uplink 项被 codec 拒绝 |
| `gateway/peer-disposed` | 调用来自已释放的 Peer |
| `gateway/cancelled` | 调用被取消 |
| `gateway/invocation-unavailable` | 端点不可用 |
| `gateway/interactions-forbidden` | 策略禁止该交互 |
| `remote-access/denied` | `remoteAccess.decide()` 拒绝，details 为 `{ action, reason }` |

`TypertGatewayError` 是 `RemoteError` 的子类；因策略拒绝的解析器抛出自己的 `RemoteError`，其码原样到达调用方。

---

## 8. ACP 接口

### 8.1 传输

`dsh --profile acp` 启动，JSON-RPC over stdio。编解码由 [`src/codec.ts`](../../../packages/acp/acp/src/codec.ts) 负责；**具体帧分隔符（换行分帧 vs `Content-Length` 头）未在本次阅读中逐行确认**，见 §13。

`initialize` 协商后公布稳定 ACP v1，并声明可选能力：`session/list`、`session/resume`、`session/close`、Streamable HTTP MCP；图片提示词按条件公布。

### 8.2 方法表

| 方法 | 方向 | 作用 | 备注 |
|---|---|---|---|
| `initialize` | client → server | 协商协议版本与能力 | 返回 ACP v1 |
| `authenticate` | client → server | 鉴权 | 当前实现立即成功（无鉴权） |
| `session/new` | client → server | 新建会话 | 校验 `cwd` 与 stdio/HTTP MCP 配置，返回完整 `configOptions` |
| `session/list` | client → server | 列出会话 | 分页，`sessionListPageSize` 默认 100，可选绝对 `cwd` 过滤 |
| `session/resume` | client → server | 恢复持久化的非活跃会话 | 不回放旧更新 |
| `session/close` | client → server | 关闭会话 | 停稳式取消、drain、释放后代、flush，只释放指定 Agent scope |
| `session/set_config_option` | client → server | 修改配置 | 串行更新 `model` / `reasoning_effort` |
| `session/prompt` | client → server | 发送一轮提示词 | 一次只允许一个提示词；根 Agent 与后代全部完成且有序更新交付后才结算 |
| `session/cancel` | client → server | 取消当前轮 | 通知语义 |
| `$/cancel_request` | client → server | 取消指定请求 | JSON-RPC 标准扩展位 |
| `session/update` | server → client | 增量更新 | assistant 消息与 thought、工具生命周期、配置变化、上下文用量 |
| `session/request_permission` | server → client | 请求授权 | 一次性允许 / 拒绝 |

配置字段：`provider`、`model`、`sessionListPageSize`。源码地图：[`src/index.ts`](../../../packages/acp/acp/src/index.ts)、`src/content.ts`、`src/codec.ts`、`src/updates.ts`、`src/session.ts`。

### 8.3 典型时序

```text
ACP 客户端                                     dsh --profile acp
   │ initialize ────────────────────────────────▶│
   │◀──────────────── protocolVersion=1 + caps ──│
   │ session/new { cwd, mcpServers } ────────────▶│
   │◀──────────────── { sessionId, configOptions }│
   │ session/prompt { sessionId, prompt } ───────▶│
   │◀── session/update (assistant / thought) ─────│
   │◀── session/update (tool call lifecycle) ─────│
   │◀── session/request_permission ───────────────│  （需要审批时）
   │─── 允许 / 拒绝 ─────────────────────────────▶│
   │◀──────────────────────────── result（一轮结束）│
   │ session/close ──────────────────────────────▶│
   │◀──────────────────────────────── result ─────│
```

取消：任一轮进行中可发 `session/cancel`；`session/close` 走的是「停稳」路径而非中断，保证更新已交付、后代已释放。

---

## 9. 两个 SDK

### 9.1 定位差异

| 维度 | TypeScript SDK（`packages/sdk`） | Python SDK（`python/sdk`） |
|---|---|---|
| 目标用户 | Node 侧应用/服务内嵌调用方 | 脚本、数据侧、Notebook 与 CI |
| 运行时来源 | 解析同版本 `@deepseek-ai/dsh`，或调用方提供 `dshBin` | 依赖同版本 `deepseek-harness-runtime-bin` wheel 内置的 `dsh` |
| 入口 | `new DeepSeekHarness({ dshHome })` | `DeepSeekHarness(dsh_home=...)` 上下文管理器 |
| 分层 | `DeepSeekHarness`（自有 run 区间）/ `HarnessClient`（协议客户端） | 同构两层：`DeepSeekHarness` / `HarnessClient` |
| 传输 | 子进程 stdio，`\n` 分帧 JSON-RPC | 完全相同 |
| 协议 | 共用 `dsh-sdk-protocol` 方法集 | 共用同一方法集 |
| 扩展 | `patches`、自定义 `profile`、`dshBin` | `patches`、`profile`、`dsh_bin` |
| 额外能力 | — | Office 本地操作（`convert` / `recalculate` / `render_images`）、运行时下载 |

两者是「设计孪生」：共用同一运行时对端（`dsh --profile sdk`）与同一套 JSON-RPC 方法，因此行为一致；差异只在宿主语言与打包分发方式。

### 9.2 能力覆盖

| 能力 | TS | Python |
|---|---|---|
| `run()` 普通提示词与内容块 | ✓ | ✓ |
| 原生命令路由（`/compact`、`/plan`、`/goal`、`/permission`） | ✓ | ✓ |
| 会话恢复 `resumeSession` / `resume_session` | ✓ | ✓ |
| 工作目录 get/set | ✓ | ✓ |
| 审批回调（`approval/request`） | `onRequest` + `approvalRequests` | `next_request()` + `respond` |
| 原生用户问答（`ask_user_question`） | `onUserQuestion` | `on_user_question` |
| 会话树通知（含 subagent 血缘） | `subscribeSessionTree` / `onNotification` | `on_notification` / `NotificationSubscription` |
| 类型化错误 | `JsonRpcResponseError` / `RequestTimeoutError` / `SdkProtocolError` / `TransportClosedError` | 同名语义的异常类（`SdkProtocolError` 等） |
| Office 本地操作 | ✗ | ✓ |

### 9.3 方法集（client → server）

| 方法 | 作用 |
|---|---|
| `initialize` | 握手：cwd、provider、model、reasoningEffort、maxTokens |
| `session/prompt` | 排队提示词，立即返回消息 id |
| `session/query` | 查询 |
| `session/resume` | 恢复持久化会话 |
| `session/wait` | 等待 agent 活动结束 |
| `session/working-directory/get` / `set` | 读写工作目录 |
| `shutdown` | 优雅关闭 |

server → client：`approval/request`、`user-question/ask`、`user-question.cancelled`、`session.event`、`session.status`、`session.query.completed`、`subagent.started`、`subagent.finished`。

分帧实现：[`transport.ts`](../../../packages/sdk/protocol/src/transport.ts) 186-268 行——按 `\n` 切分读缓冲，`output.write(... + '\n')`。

### 9.4 使用示例

TypeScript：

```ts
import { DeepSeekHarness } from '@deepseek-ai/dsh-sdk-client'

await using harness = new DeepSeekHarness({
  profile: 'sdk',
  dshHome: '/absolute/path/to/dsh-home',
  patches: ['./automation.cordis.yml'],
  provider: 'deepseek-official',
  model: 'deepseek-v4-flash',
  reasoningEffort: 'max',
  maxTokens: 49_152,
})
const result = await harness.run('say hi')
console.log(result.finalResponse)
```

Python：

```py
from deepseek_harness import DeepSeekHarness

with DeepSeekHarness(
    dsh_home="/absolute/path/to/isolated-dsh-home",
    cwd="/absolute/path/to/workspace",
    provider="deepseek-official",
    model="deepseek-v4-flash",
    reasoning_effort="max",
    max_tokens=49_152,
) as harness:
    result = harness.run("Say hi.", session_id="example-001")

print(result.final_response)
```

### 9.5 profile 差异

| profile | 定位 |
|---|---|
| `sdk` | 完整默认组合：凭据、设置、托管凭据、遥测、Web 工具、完整工具清单、原生命令 |
| `sdk-minimal` | 独立显式配置树（不是 `dsh-base` 的 overlay）：按平台选择的持久 shell、`read_image`、`working_directory`、本地执行、JSONL 会话、自动压缩；不支持的斜杠输入留在普通提示词路径 |

### 9.6 关闭阶梯与超时

- `close()`：先发协议 `shutdown`（`shutdownTimeoutMs` 默认 1000ms），再 stdin EOF → SIGTERM → SIGKILL，直到进程真正退出；幂等，已关闭实例不可复用。
- `initializeTimeoutMs` 默认 10s（Python 侧 `initialize_timeout_seconds` 默认 30s），超时诊断会带 profile 名与保留的 stderr 尾部。
- 运行时**不提供取消 RPC**：超时只结束本地等待，不停止运行时工作；要停只能关闭 harness。

---

## 10. `native`

### 10.1 是什么

`native/system` 产出 `@deepseek-ai/node-addon-system`：一个 Node-API（v8）原生 addon `system.node`，加一个静态 `landlock-run` 启动器。

| 导出子路径 | 内容 | 用途 |
|---|---|---|
| `./flock` | POSIX `flock` 绑定，懒加载 `system.node` | 跨进程文件锁（会话/资源互斥） |
| `./landlock-run` | Linux Landlock 沙箱启动器 | 在受限文件系统视图下启动子进程 |

### 10.2 包结构

- entry 包：`native/system/packages/entry`，`src/` 下含 [`index.ts`](../../../native/system/packages/entry/src/index.ts)、[`flock.ts`](../../../native/system/packages/entry/src/flock.ts)、`flock.c`、`main.c`；脚本 `build:js` 用 `tsc -b`，`prepack` 校验库产物（[`package.json`](../../../native/system/packages/entry/package.json)）。
- 平台包：`optionalDependencies` 指向 `darwin/arm64`、`darwin/x64`、`linux/arm64`、`linux/x64` 四个预编译包；入口按平台选择。
- 根 workspace 含 `native/system` 及其 `packages/*`。

### 10.3 作用与约束

| 约束 | 说明 |
|---|---|
| 平台相关 | Landlock 仅 Linux 可用；Windows 上 `flock` 走既有实现（README 表述为「既有实现」，本次未定位到具体文件，见 §13） |
| 预编译分发 | 不要求用户侧编译，按平台装可选依赖 |
| 加载方式 | `./flock` 首次使用时懒加载 `system.node`，避免无用到时加载失败 |
| 定位 | 是**库**，不监听端口、不拉起进程（`landlock-run` 只在被调用时充当 launcher） |

---

## 11. 各载体之间共享什么、各自特有实现

### 11.1 共享层

| 共享能力 | 由谁提供 | 被谁使用 |
|---|---|---|
| profile 组合与 patch 分层 | `apps/cli/src/profile-boot.ts`（经 `exports: ./profile-boot` 暴露） | CLI 自身、`apps/desktop-host` |
| Cordis 插件树与 `ctx` 服务注入 | `packages/*` | 所有载体 |
| `ctx.webServer` HTTP/WS 服务 | `packages/host/webserver` | Web、Desktop Host |
| `ctx.connection` 信任模型与凭据 | `packages/client/connection` | Web、Desktop Host、api |
| Typert RPC 与业务 Remote | `packages/api/*` | Web、Desktop |
| 前端产物 | `packages/host/frontend-static` | Web、Desktop（Desktop 额外从 `dsh-app://app/` 提供） |
| 会话/工具/模型插件 | 各自 bundle | CLI profile、`sdk` / `sdk-minimal`、`acp` |

### 11.2 特有实现

| 载体 | 特有部分 |
|---|---|
| CLI | launcher 参数边界规则、`plugin` → pnpm 转发、`--dump-config*` 三种导出、`desktop` profile 拒绝 |
| Web | `webStartup` 启动参数（`--host/--port`）、默认 3080、单进程直连 |
| Desktop Main | `dsh-app://` 协议、`assertDesktopSender` 校验、桌面产品 API（文件/剪贴板/快捷键/更新/拖拽/目录选择）、Host 子进程管理与 `hostRunId` 归因 |
| Desktop Host | Node IPC 生命周期协议（`DESKTOP_HOST_PROTOCOL_VERSION = 4`）、`platform-session` / `plugin-operation` / `update-tasks` 发布器、`--port 0` 动态端口 |
| ACP | ACP v1 方法集、`session/*` 生命周期、一次性授权 |
| SDK | 自有方法集（`session/prompt` + `session/wait`）、审批与用户问答回调、类型化错误与关闭阶梯 |
| Python | runtime wheel 分发、`sdk-minimal` 独立配置树、Office 本地操作 |
| native | `flock` / `landlock-run` 两个子路径 |

---

## 12. 关键接口、关键类型、关键文件

### 12.1 关键接口 / 类型

| 名称 | 所在位置 | 职责 |
|---|---|---|
| `DshInvocation` | [`args.ts`](../../../apps/cli/src/args.ts) | launcher 解析结果的四态联合 |
| `RunProfileOptions` | [`profile-boot.ts`](../../../apps/cli/src/profile-boot.ts) | `runProfile()` 的入参 |
| `DesktopHostEvent` | [`host-process.ts`](../../../apps/desktop/src/host-process.ts) | Host → Main 的事件联合（`starting` / `ready` / `fatal` / `platform-session` / `plugin-operation` / `update-tasks` / `file-drag-resource` / `shutdown-complete`） |
| `ReadyEvent` / `FatalEvent` | 同上 | `{ type:'ready', url, injections }` / `{ type:'fatal', message, diagnostic }` |
| `DESKTOP_HOST_PROTOCOL_VERSION` | [`host-protocol.ts`](../../../apps/desktop/src/host-protocol.ts) | Host 生命周期协议代号（当前 `4`） |
| `DESKTOP_IPC` / `SCHEME` / `assertDesktopSender` | [`ipc.ts`](../../../apps/desktop/src/ipc.ts) | 渲染层 ↔ 主进程的 channel 表、`dsh-app` scheme、来源校验 |
| `DshDesktopProductApi` | 同上 | 暴露给渲染层的桌面能力面（`protocolVersion: 1`） |
| `ctx.webServer` | [`webserver/src/index.ts`](../../../packages/host/webserver/src/index.ts) | HTTP/WS 注册与 index 注入 |
| `ctx.typertGateway` / `ctx.remote` | [`gateway`](../../../packages/api/gateway/README.zh.md) | Host 侧 / Client 侧 RPC 入口 |
| `RemoteResult<T>` | 同上 | `{ ok: true, value } \| { ok: false, error }` |
| `TypertGatewayError` | 同上 | `RemoteError` 子类，`gateway/*` 错误码 |
| `HarnessSdkJsonRpcServer` | [`sdk/server`](../../../packages/sdk/server/README.zh.md) | stdio JSON-RPC 服务插件 |
| `JsonRpcLineTransport` | [`transport.ts`](../../../packages/sdk/protocol/src/transport.ts) | `\n` 分帧传输 |
| `DeepSeekHarness` / `HarnessSession` / `HarnessClient` | [`sdk/client`](../../../packages/sdk/client/README.zh.md) | 三层客户端 API |
| `DeepSeekHarness` / `HarnessClient` / `HarnessConfig` | [`python/sdk`](../../../python/sdk/README.zh.md) | Python 侧同类 API |

### 12.2 关键文件

| 文件 | 职责 |
|---|---|
| [`apps/cli/src/bin.ts`](../../../apps/cli/src/bin.ts) | `dsh` 可执行入口；四种 invocation mode 的分派 |
| [`apps/cli/src/args.ts`](../../../apps/cli/src/args.ts) | commander 适配；launcher flag 边界、`desktop` profile 拒绝 |
| [`apps/cli/src/profile-boot.ts`](../../../apps/cli/src/profile-boot.ts) | profile 组合、patch 分层、插件加载与 `cmdline` 注入 |
| [`apps/cli/src/plugin.ts`](../../../apps/cli/src/plugin.ts) | `dsh plugin` 的 pnpm 转发实现 |
| [`apps/desktop/src/main.ts`](../../../apps/desktop/src/main.ts) | Electron 主进程：协议注册、窗口创建、启动编排 |
| [`apps/desktop/src/host-process.ts`](../../../apps/desktop/src/host-process.ts) | Host 子进程 spawn、IPC 消息处理、control request、故障归因 |
| [`apps/desktop/src/ipc.ts`](../../../apps/desktop/src/ipc.ts) | IPC channel 表、`dsh-app` scheme、来源校验、桌面产品 API 类型 |
| [`apps/desktop/src/host-protocol.ts`](../../../apps/desktop/src/host-protocol.ts) | Host 生命周期协议版本常量 |
| [`apps/desktop-host/src/index.ts`](../../../apps/desktop-host/src/index.ts) | Host 入口：argv 解析、`runProfile()`、`ready`/`fatal` 发送、control 安装 |
| [`apps/desktop-host/src/cli.ts`](../../../apps/desktop-host/src/cli.ts) | 用 Desktop 内置运行时执行公开 `dsh` 命令（`manageDesktopProfile: true`） |
| [`packages/host/webserver/src/index.ts`](../../../packages/host/webserver/src/index.ts) | `ctx.webServer` 实现 |
| [`packages/api/gateway`](../../../packages/api/gateway/README.zh.md) | Typert Gateway（Host）与 Client Remote |
| [`packages/sdk/protocol/src/transport.ts`](../../../packages/sdk/protocol/src/transport.ts) | `\n` 分帧 JSON-RPC 传输 |
| [`packages/sdk/client/src/client.ts`](../../../packages/sdk/client/src/client.ts) | `HarnessClient`：spawn、握手、订阅扇出 |
| [`packages/sdk/client/src/dispose.ts`](../../../packages/sdk/client/src/dispose.ts) | 关闭阶梯：stdin EOF → SIGTERM → SIGKILL |
| [`packages/sdk/server/src/server.ts`](../../../packages/sdk/server/src/server.ts) | `HarnessSdkJsonRpcServer` |
| [`packages/acp/acp/src/session.ts`](../../../packages/acp/acp/src/session.ts) | ACP 会话生命周期与 prompt 结算 |
| [`packages/bundle/web-app/src/startup.ts`](../../../packages/bundle/web-app/src/startup.ts) | `webStartup` 服务：host/port/tls 解析 |
| [`native/system/packages/entry/src/index.ts`](../../../native/system/packages/entry/src/index.ts) | native entry 包导出 |

---

## 13. 待确认

| # | 事项 | 现状 |
|---|---|---|
| 1 | Desktop 欢迎界面是否为独立 BrowserWindow | `main.ts` 中可确认 `createWindow()` 创建主窗口；README 有「欢迎窗口外观」章节，但未在代码中逐一确认窗口数量 |
| 2 | ACP stdio 的帧分隔符 | 编解码在 `packages/acp/acp/src/codec.ts`，本次未逐行确认是换行分帧还是 `Content-Length` 头；SDK 侧已确认为 `\n` 分帧 |
| 3 | Desktop Host 的 stderr 是否另落盘 | 代码显示 stderr 被保留用于诊断拼接，未见到固定文件路径；实际落盘位置（若有）需查主进程日志配置 |
| 4 | 渲染层 HTTP 请求是否全部经主进程转发 | README 写明「附加凭据需 authority + scheme 匹配」「只有归属窗口附加凭据」；转发实现的具体文件与分支未逐行确认 |
| 5 | `native` 在 Windows 上 `flock` 的既有实现来源 | README 表述为「Windows 用既有实现」，本次未定位到对应源文件 |
| 6 | SDK 服务端是否把 `console.log` 重定向到 stderr | README 表述「stdout 即协议」；在 `packages/sdk/server/src/server.ts` 中未检索到 `console.` / `stdout` 处理，推测重定向在别处（如 profile 启动器或 boot 阶段） |
| 7 | 各平台预编译产物的切片名与发布流水线 | 本文只写包名与平台矩阵，不写版本号与流水线细节 |

---

## 14. 验证记录

### 14.1 链接校验

相对链接均以 `docs/superpowers/modules/` 为基准，逐条用 PowerShell `Test-Path -LiteralPath` 校验，共 41 条，全部为 `True`。

| 分类 | 链接 | 结果 |
|---|---|---|
| 相邻分册 | [`../project-overview.md`](../project-overview.md) | ✓ |
| 相邻分册 | [`./03-models-and-config.md`](./03-models-and-config.md) | ✓ |
| 相邻分册 | [`./07-collaboration-scheduling.md`](./07-collaboration-scheduling.md) | ✓ |
| 相邻分册 | [`./05-plugin-ecosystem.md`](./05-plugin-ecosystem.md) | ✓ |
| boot | [`packages/boot/app-boot/src/profile-context.ts`](../../../packages/boot/app-boot/src/profile-context.ts) | ✓ |
| CLI | [`apps/cli/README.zh.md`](../../../apps/cli/README.zh.md) | ✓ |
| CLI | [`apps/cli/src/bin.ts`](../../../apps/cli/src/bin.ts) | ✓ |
| CLI | [`apps/cli/src/args.ts`](../../../apps/cli/src/args.ts) | ✓ |
| CLI | [`apps/cli/src/profile-boot.ts`](../../../apps/cli/src/profile-boot.ts) | ✓ |
| CLI | [`apps/cli/src/plugin.ts`](../../../apps/cli/src/plugin.ts) | ✓ |
| Desktop | [`apps/desktop/README.zh.md`](../../../apps/desktop/README.zh.md) | ✓ |
| Desktop | [`apps/desktop/src/main.ts`](../../../apps/desktop/src/main.ts) | ✓ |
| Desktop | [`apps/desktop/src/host-process.ts`](../../../apps/desktop/src/host-process.ts) | ✓ |
| Desktop | [`apps/desktop/src/ipc.ts`](../../../apps/desktop/src/ipc.ts) | ✓ |
| Desktop | [`apps/desktop/src/host-protocol.ts`](../../../apps/desktop/src/host-protocol.ts) | ✓ |
| Desktop Host | [`apps/desktop-host/src/index.ts`](../../../apps/desktop-host/src/index.ts) | ✓ |
| Desktop Host | [`apps/desktop-host/src/cli.ts`](../../../apps/desktop-host/src/cli.ts) | ✓ |
| host | [`packages/host/README.zh.md`](../../../packages/host/README.zh.md) | ✓ |
| host | [`packages/host/webserver/src/index.ts`](../../../packages/host/webserver/src/index.ts) | ✓ |
| api | [`packages/api/README.zh.md`](../../../packages/api/README.zh.md) | ✓ |
| api | [`packages/api/gateway/README.zh.md`](../../../packages/api/gateway/README.zh.md) | ✓ |
| sdk | [`packages/sdk/README.zh.md`](../../../packages/sdk/README.zh.md) | ✓ |
| sdk | [`packages/sdk/protocol/src/transport.ts`](../../../packages/sdk/protocol/src/transport.ts) | ✓ |
| sdk | [`packages/sdk/client/README.zh.md`](../../../packages/sdk/client/README.zh.md) | ✓ |
| sdk | [`packages/sdk/server/README.zh.md`](../../../packages/sdk/server/README.zh.md) | ✓ |
| sdk | [`packages/sdk/client/src/client.ts`](../../../packages/sdk/client/src/client.ts) | ✓ |
| sdk | [`packages/sdk/client/src/dispose.ts`](../../../packages/sdk/client/src/dispose.ts) | ✓ |
| sdk | [`packages/sdk/server/src/server.ts`](../../../packages/sdk/server/src/server.ts) | ✓ |
| acp | [`packages/acp/acp/README.zh.md`](../../../packages/acp/acp/README.zh.md) | ✓ |
| acp | [`packages/acp/acp/src/index.ts`](../../../packages/acp/acp/src/index.ts) | ✓ |
| acp | [`packages/acp/acp/src/codec.ts`](../../../packages/acp/acp/src/codec.ts) | ✓ |
| acp | [`packages/acp/acp/src/session.ts`](../../../packages/acp/acp/src/session.ts) | ✓ |
| python | [`python/sdk/README.zh.md`](../../../python/sdk/README.zh.md) | ✓ |
| python | [`python/sdk-runtime/README.zh.md`](../../../python/sdk-runtime/README.zh.md) | ✓ |
| native | [`native/system/README.zh.md`](../../../native/system/README.zh.md) | ✓ |
| native | [`native/system/packages/entry/src/index.ts`](../../../native/system/packages/entry/src/index.ts) | ✓ |
| native | [`native/system/packages/entry/src/flock.ts`](../../../native/system/packages/entry/src/flock.ts) | ✓ |
| native | [`native/system/packages/entry/package.json`](../../../native/system/packages/entry/package.json) | ✓ |
| native | [`native/system/packages/entry/README.zh.md`](../../../native/system/packages/entry/README.zh.md) | ✓ |
| web-app | [`packages/bundle/web-app/cordis.patch.yml`](../../../packages/bundle/web-app/cordis.patch.yml) | ✓ |
| web-app | [`packages/bundle/web-app/src/startup.ts`](../../../packages/bundle/web-app/src/startup.ts) | ✓ |

首次校验时 `native/system/packages/entry/index.ts` 为 `False`——实际文件位于 `src/` 子目录；已把 §1 与 §12.2 的链接修正为 `.../entry/src/index.ts` 并复验通过（本次只改文档，未改源码）。

### 14.2 其它说明

> 本分册只读代码、未修改任何源码；文中出现的端口（`3080`）来自 `packages/bundle/web-app/cordis.patch.yml`，Desktop 固定 `--port 0` 由 OS 分配，其余端口均未在代码中写死。
