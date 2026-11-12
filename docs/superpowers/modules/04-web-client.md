# Web 客户端与前端功能

本文件梳理 i-do 的浏览器端：它由哪些包拼成、一次页面加载如何走到第一帧、UI 为什么不是"写死的组件树"而是可插拔的 Slot 树，以及对话、输入、审批等交互如何落地。事实以当前工作树代码为准；无法从代码或仓库文档确认的内容统一放在第 8 节「待确认」。

上游总览见 [i-do 项目功能梳理](../project-overview.md)；Slot 的权威语义见 [Web Client Slots](../../subsystems/slots.zh.md)，整体分层见 [Web Client 架构](../../subsystems/web-client.zh.md)，对话数据模型见 [Conversation 组装](../../subsystems/conversation.zh.md)。

## 1. 前端整体结构

### 1.1 三层切分

前端不是"一个 React 应用"，而是三层职责分离的产物：

| 层 | 位置 | 职责 | 不负责 |
| --- | --- | --- | --- |
| 构建壳 | [apps/web](../../../apps/web/package.json) | Vite 构建、`index.html`、桌面端注入、把产物 `dist/` 交给 Host 托管 | 不知道有哪些插件、不知道 UI 长什么样 |
| 启动内核 | [packages/client/web](../../../packages/client/web/src/index.ts) | 模块系统、Cordis Loader、启动页、激活审计、把挂载点交给渲染器 | 不实现任何业务界面 |
| UI 插件 | `packages/client/ui-*` 等 | 通过 Slot 注册具体界面、通过 service 读写状态 | 不跨包 import 其他插件的组件 |

关键结论：`packages/client/web` 的公开产物只有一个类 `AppWebEntry`（[boot.ts](../../../packages/client/web/src/boot.ts#L22-L127)）和几张静态表。应用形态由客户端插件名册决定，而不是由这个壳决定。

> 命名陷阱：仓库里的 `packages/web` **不是前端**，它是给模型用的 Web 能力包（fetch / search 工具族，见 [packages/web/README.zh.md](../../../packages/web/README.zh.md)）。前端的外壳在 `packages/client/web`。

### 1.2 应用入口与启动链路

入口文件 [apps/web/src/main.ts](../../../apps/web/src/main.ts) 做四件事：

1. 引入品牌字体 `@deepseek-ai/dsh-client-ui-theme/brand-font.css`。
2. 取 `#root` 节点，构造 `new AppWebEntry(el)`。
3. 桌面端分支：等待 `globalThis.dshDesktopBoot.ready()` 返回 `{ injections, streamBaseUrl }`，写入 `__DSH_TRANSPORT__ = { ownsHost: true, streamBaseUrl }`，再按 `injections` 逐条插入 `<script>`，最后 resolve `__DSH_BOOT_READY__` 这个 deferred。浏览器（非桌面）分支没有这一步。
4. 调用 `entry.run(onFailure)`；失败时交给桌面端 `desktop.failed()` 或 boot 页展示。

`AppWebEntry.run()` 的顺序（[boot.ts](../../../packages/client/web/src/boot.ts#L51-L107)）：

| 步骤 | 动作 | 说明 |
| --- | --- | --- |
| 1 | `await __DSH_BOOT_READY__?.promise` | 等注入表全部生效；没有 bootstrap 时该全局不存在，直接继续 |
| 2 | 取 `window.__ModuleLoader__` | Host 注入的 lazy CommonJS 模块门面；缺失即致命错误 |
| 3 | `moduleLoader.create({ boot: window.__DSH_BOOT__, staticModules, ...transport, ...seams })` | `__DSH_BOOT__` 是 Host 写入的 `WebBootGraph`：插件名册、bundle 地址、`immediately` 标记 |
| 4 | 预取 `immediately` 档位的 bundle | `prefetchImmediateTier()`，只提前开始传输，失败交给 Loader 重试 |
| 5 | `new Context()` + `BootPage.setTotal()` | 创建 Cordis 根上下文，启动页拿到总条目数 |
| 6 | `bootClient({ ctx, modules, manifest, onEntryState })` | 逐个 import 并激活客户端插件；失败状态回报给启动页 |
| 7 | `installWindowDragRecall(...)` | Electron 窗口拖拽区域的唯一观察者，必须在首帧前装好 |
| 8 | `mountClient(ctx, container)` | 交给 UI 渲染器 |
| 9 | 激活审计 | `bootClient` 内部完成：必需条目失败 → 启动页报错；可选条目失败 → 控制台告警后继续挂载 |

`mountClient` 只有一行核心逻辑（[mount.ts](../../../packages/client/web/src/mount.ts#L19-L24)）：

```ts
const mounted = ctx.inject(['uiRenderer'], (scope) => {
  scope.effect(() => scope.uiRenderer.mount(container), 'web boot: application mount')
})
```

这意味着挂载是**依赖 fiber**：`uiRenderer` 只在被提供时安装效果，被替换时应用整体重挂载。`ctx.uiRenderer.mount()` 内部 hydrate `[data-dsh-boot]`、渲染 React 树，并**唯一一次**调用 `ctx.slots.renderSlot('root', {})`。之后任何 Slot 都由声明它的 owner 通过收到的 `renderSlot` / `renderSlotChain` prop 渲染，渲染器不再介入。

### 1.3 构建方式

| 项 | 事实 | 来源 |
| --- | --- | --- |
| 构建器 | Vite 6 + `@vitejs/plugin-react` | [apps/web/package.json](../../../apps/web/package.json#L55-L63) |
| 脚本 | `build: vite build`、`dev: vite`、`watch: vite build --watch --no-emptyOutDir` | 同上 |
| 产物 | `dist/`，由 `apps/cli` 的 `dsh web` 托管；另有 `dist/preview` 的 WebWorker/VFS 预演形态 | 包描述与 `build:preview` |
| 包名 | `@deepseek-ai/dsh-web-frontend` | 同上 |
| 配置 | [apps/web/vite.config.ts](../../../apps/web/vite.config.ts)，另含 [product-isolation.ts](../../../apps/web/product-isolation.ts) | 文件存在性已确认 |

React、ReactDOM、Cordis、`ui-slots`、`ui-primitives` 由 Web 外壳的**静态模块表**（[seed.ts](../../../packages/client/web/src/seed.ts)、[platform.ts](../../../packages/client/web/src/platform.ts)）固定为同一份实例。这是硬约束：任何客户端插件若自带一份 React，hooks 与 context 会立刻错位。

### 1.4 "路由"是什么

前端**没有 URL 路由**，也没有 react-router 之类的依赖。用户看到的"页面切换"由四件事组合而成：

- **main panel 切换**：中栏顶层的 `main` keyed slot，注册者为会话、自动化任务、插件管理。
- **Session 切换**：左侧栏选会话，改变的是当前 binding，不是 URL。
- **View 标签**：会话内部的 `chat` / `trajectory` 等视图切换，选择会被持久化。
- **侧栏 / 右栏 pane**：`sidebar.panellist` 与 `sidebar.right.pane.tab` 控制显示哪个面板。

因此刷新页面后恢复到"上次的会话 + 上次的 View"，靠的是持久化偏好，而不是地址栏。

### 1.5 状态管理

没有 Redux / Zustand / MobX。状态分三层：

| 层 | 载体 | 消费方式 |
| --- | --- | --- |
| Host 真值 | Host 侧 Cordis service + Session/Workspace Controller | 经 Remote 传输到浏览器 |
| 浏览器 model | `ClientSessions` / `Session` / `ClientWorkspaceModel` | 暴露 observable |
| React | `ui-renderer` 用 `useSyncExternalStore` 绑定裸 observable | 组件通过标准 props 拿到 `useSession`、`useProjection` 等钩子 |

规则是：**组件永远不接收 `ctx`**。`ctx` 只在插件 `apply(ctx)` 阶段使用；到了 React 组件，一切通过 props 与钩子传入。这条规则让 UI 组件可以在测试里被单独渲染。

## 2. Slot 拼装机制

### 2.1 要解决的问题

功能插件之间不允许互相 import 组件，但最终要拼成同一棵 React 树，并且要求：任意插件可装卸、可被第三方替换、渲染位置由"拥有那块区域的插件"决定而不是由全局配置文件决定。

Slot 的答案是：**位置由 owner 声明，内容由任意插件注册，类型由声明合并约束。**

### 2.2 声明：`SlotMap` 与"声明即授权"

`SlotMap` 是编译期注册表。包通过 TypeScript 声明合并写入：key、cardinality、scope、owner props、keyed props、可选的 slot 级 inject face。运行时副作用只有一个：**拥有该渲染位置的组件在 `children` 中声明对应条目**。

声明一个 child 同时产生三种效果（[slots.zh.md](../../subsystems/slots.zh.md)）：

1. 令该 child key 生效（否则向它注册会在插件激活时报错）。
2. 授权当前 owner entry 调用 `renderSlot(childKey, props)` 或 `renderSlotChain(childKey, props)`。
3. 记录运行时 dispatch 规格（基数、scope、排序依据）。

约束：**每个声明只能有一个存活 owner**。重复声明其他 entry 已拥有的 child、或向未声明的 slot 注册，都会在插件激活阶段直接失败——这是把"UI 拼装错误"从运行时白屏提前到了启动审计。

`root` 是唯一内建声明，也是唯一由 Cordis service 自身渲染的 key；它是整棵树的唯一入口。

### 2.3 注册：`register` 与 `inject`

```tsx
export const inject = ['slots']

export function apply(ctx: Context): void {
  ctx.slots.inject('conversation.session.header.actions', () =>
    ctx.slots.register({
      name: 'conversation.session.header.actions',
      id: 'review',
      order: 100,
    }, HeaderAction))
}
```

| API | 用途 | 生命周期 |
| --- | --- | --- |
| `ctx.slots.register(spec, component)` | 向一个**已声明**的 slot 注册一个条目 | 属 Cordis effect；返回幂等 disposer |
| `ctx.slots.inject(key, callback)` | 跨包贡献的推荐写法：等目标 slot 被声明后再注册 | callback 在每段声明生命周期内运行；owner 折叠时自动移除，owner 重新挂载时重新运行 |

`inject` 是"插件可以后加载"的关键：贡献方不需要知道 owner 何时出现，也不会在 owner 消失后留下悬空注册。

### 2.4 五种基数与三种作用域

| 维度 | 值 | 语义 | 典型用途 |
| --- | --- | --- | --- |
| cardinality | `single` | 一个 cell，只渲染 priority 胜者 | 单实例区域，如某个固定按钮位 |
| cardinality | `list` | cell 由必填 `id` 定址，按 `order` 再按注册顺序排 | 动作列表、标签、菜单行 |
| cardinality | `keyed` | owner 传 `entryKey`，匹配 cell 用该 key 的 props 渲染 | 按业务类型分发节点，如 `conversation.chat.node` |
| cardinality | `chain` | 每个 entry 提供 `select(owner)`，第一个非 null 获选 | 接管式交互，如 `conversation.composer` |
| cardinality | `hoc` | entry 层层包裹 owner 内容，最小者最外层 | 包裹滚动区、注入布局层 |
| scope | `root` | 一个 root 组件与 store 实例 | 应用级浮层、全局 Provider |
| scope | `session-maybe` | 继承外层 binding，但没有 binding 也能渲染 | 既可在会话内、也可在空态使用的组件 |
| scope | `session` | 要求可解析外层 binding，收到确定的 Session 值 | 只对具体会话有意义的区域 |

### 2.5 渲染顺序与遮蔽

所有 kind 统一先按 `priority` **升序**排序（数值越小越先），并做**稳定排序**保留注册顺序。`list` 与 `hoc` 额外按 `order` 升序。

- 对 `single` / `list` / `keyed` / `hoc`，`priority` 是**遮蔽优先级**：同一 cell 内优先级高（数值小）的条目胜出。
- 对 `chain`，`priority` 是**选举顺序**：按序问每个 entry，第一个返回非 null 的获选。
- 同一 cell、同一 priority 出现多个条目 → 注册时直接报错，不允许"看运气"。
- 想"新增一个"就换新的 `id` / `key`；复用已有 cell 表示**有意替换**其展示。

投影规则（`entriesOfSlot()`，[ui-slots/src/index.ts](../../../packages/client/ui-slots/src/index.ts)）：`single` 一个 cell；`keyed` 每 key 一个；`list` 每 id 一个；`hoc` 每 `(key | 通配, id)` 一个；`chain` 返回全部。

### 2.6 `chain`：接管式交互

`conversation.composer` 是 chain 的典型用法：默认输入框是 owner 的 fallback，任何注册方提供一个纯函数 `select(owner)`，返回非 null 即"接管这次渲染"。

```tsx
// 形如：命中条件时接管，否则返回 null 交还默认输入框
const takeover: ChainSelect<ComposerChainProps, Request> = (owner) =>
  owner.request === undefined ? null : <ApprovalComposer {...owner} />
```

语义要点：`select` 必须是**纯函数**（不得有副作用），全部拒绝时渲染 owner 的 fallback。这让"审批时把输入框换成审批面板"不需要修改输入框代码。

### 2.7 `hoc`：包裹层

`conversation.hero.frame` 是 root 作用域的 hoc：它包裹整个滚动区，因此从 Hero 空态过渡到正常会话时，输入框不会重新挂载。

规则：各层按 `order`、`priority`、注册顺序升序嵌套，最小者最外层；每层收到同一份 owner props 并以 `children` 收到内一层；最多渲染一次 `children`，不渲染 `children` 的层等于替换内部全部内容。带 `key` 的层只在 owner 传入相同 `entryKey` 时生效，并覆盖同 id 的通配层。

代价要写清楚：**增减一个适用于本次分派的层，会让其内部内容重新挂载**；outlet 切换 `entryKey` 也会换到另一条层链并重挂载。所以 hoc 适合稳定的布局层，不适合高频变化的条件层。

### 2.8 Component Factory 与局部 slot

有些区域不是"塞一个组件"，而是"由 owner 提供数据、由别处提供渲染器"。这类 key 是 **Factory**：owner 传入 occurrence（一次具体出现的输入），注册方渲染。已确认的例子：

| Factory key | owner | 产物 |
| --- | --- | --- |
| `conversation.content` | `ui-conversation` | 会话主体内容块 |
| `conversation.user.text` → `conversation.user.text.node` | `ui-conversation` | 用户文本行内的 keyed 渲染（引用、@ 提及等） |
| `conversation.images.content` | `ui-attachment` | 消息图片与灯箱，owner 传 `loadImage` 授权回调 |
| `sidebar.panel.icon` | `ui-workspace`/侧栏 | 按 `id` / `size` / `active` 渲染侧栏图标 |

Factory 的意义：同一份数据可以有多套呈现，而数据读取（含 URL 授权与缓存）始终留在 owner 手里。

### 2.9 实际层级树

截至当前代码，Conversation 相关的 slot 层级如下（`[ ]` 内为 owner 组件）：

```text
root [AppFrame]
└─ main                      (keyed，key = conversation / automations / plugins)
   └─ main.conversation [ConversationPanel]
      ├─ conversation.header
      ├─ conversation.session.header.*
      │  ├─ conversation.session.header.actions        (list)
      │  └─ conversation.session.header.views.actions  (list，"更多视图"菜单行)
      ├─ conversation.content                          (Factory)
      └─ conversation.session
         ├─ conversation.view                          (keyed: chat / trajectory)
         │  └─ conversation.chat.flow
         │     └─ conversation.chat.node               (keyed)
         │        user / steering / assistant-step / tool-call /
         │        command-input / command / turn-tail
         ├─ conversation.composer                      (chain，可接管)
         │  └─ conversation.composer.bar
         ├─ conversation.input.*  / conversation.input.dock  (图片、队列、Todo)
         └─ conversation.hero.*                            (空态首页)
```

树不是配置出来的，是**每层 owner 在自己的 `children` 里声明下一层**得到的。因此读源码时"某个位置能放什么"只有唯一答案：找到渲染它的组件，看它声明了哪些 child。

## 3. 页面与功能地图

### 3.1 应用骨架

| 区域 | slot key | 拥有者 | 承载功能 |
| --- | --- | --- | --- |
| 应用外层 | `root` | `ui-layout` 的 `AppFrame` | 全局 Provider、顶层浮层、窗口拖拽区 |
| 左侧栏 | `sidebar.panellist` / `sidebar.panellist.actions` / `sidebar.panel.icon` | `ui-workspace` 等 | 会话列表、面板图标、"更多"菜单 |
| 中栏 | `main` | `ui-conversation` / `ui-schedule` / `ui-plugin-manager` | 会话、自动化任务、插件管理 |
| 右侧栏 | `sidebar.right.pane.tab` / `sidebar.right.tab.guide.actions` | `ui-sidebar` 及各 pane 插件 | 文件、终端、浏览器、文档预览、交付物、计划预览、任务详情 |

### 3.2 中栏：三个 main 拥有者

代码中向 `main` 注册 key 的只有三处，这就是"应用主页面"的完整清单：

| key | 拥有者包 | 功能 |
| --- | --- | --- |
| `conversation` | `ui-conversation` | 会话主体：消息流、输入区、会话头、View 标签 |
| `automations` | `ui-schedule` | 自动化任务（定时/触发式任务的管理与运行记录） |
| `plugins` | `ui-plugin-manager` | 插件安装、启用、Bundle 详情与配置 |

新增一个"主页面"的标准做法就是向 `main` 注册一个新的 key，而不是加路由。

### 3.3 会话内部的 View

`conversation.view` 是 keyed slot，当前实现包括：

| View | 包 | 呈现 |
| --- | --- | --- |
| `chat` | `ui-chat` | 面向人的对话流：用户消息、助手文本、工具卡片、交付物卡片 |
| `trajectory` | `ui-trajectory` | 面向过程的时间线：请求、步骤、工具调用的结构化轨迹 |

View 选择规则（[ui-conversation/README.zh.md](../../../packages/client/ui-conversation/README.zh.md)）：有效且已注册的持久化选择优先，其次 `chat`，**绝不**选"第一个已注册的 View"。可用 View 少于两个时隐藏标签栏；关闭代码工作工具时只隐藏 Trajectory，其他插件贡献的 View 仍可用。

### 3.4 设置页

设置不是独立路由，而是 `settings.section` 的注册集合：模型配置、外观/主题、开发者工具、插件、账户等各自由对应插件注册 section 与导航图标（见 [ui-settings/README.zh.md](../../../packages/client/ui-settings/README.zh.md)）。

### 3.5 首次进入与空态

新会话未选中工作区时，输入被禁用并提示"选择工作区"；已有工作区但无历史时进入 Hero 空态，由 `conversation.hero.*` 与 `conversation.hero.frame` 承载欢迎内容。Hero 与正常会话共用同一层包裹，因此输入框不会因阶段切换而重建。

## 4. 对话交互

### 4.1 数据来源：两种 entry

前端消费的会话数据是 `SessionEventLikeEntry`：

```ts
type SessionEventLikeEntry =
  | { type: 'event', event: SessionEvent }                 // 持久事件
  | { type: 'transient', event: AssistantLiveChunkEvent }  // 仅浏览器侧的流式分片
```

外层 `type` 区分持久与瞬态；内部 `event` 统一暴露 `type` / `seq` / `time` / `data`。业务 Definition 只面对内部形状，因此"流式增量"和"历史回放"走同一套 `match` / `start` / `update` 接口。

### 4.2 流式渲染链路

```text
Host 事件流
→ connection（RPC + 推送）
→ Session Controller（已加载窗口）
→ SessionEventLikeEntry[]
→ ConversationNodeAssembler（每个 Session 一个）
→ 每个 target 的 snapshot（chat / trajectory 各一份）
→ conversation.chat.node（keyed）选组件
→ React 渲染
```

要点：

- assembler 按 `(kind, id)` 维护 Context。当前最早的 start 初始化 State，后续 Match（含同一身份的其他 start）更新 State。
- 不消费 assistant delta 的 Definition 对 `assistant/live-chunk` 直接返回 `null`，无需解包流。
- replace window 或 revision 断档时从完整已加载窗口重建；连续 revision 的 append / prepend 与 assistant settlement 走增量组装。
- settlement 只删除具名 attempt 的瞬态 Match，应用可选持久 entry，并从剩余最早 start 重算受影响的 Context，不替换无关节点。
- `publication` 决定发布节奏：`immediate` / `animation-frame` / `none`。高频流式节点用 `animation-frame` 合批，避免每 chunk 一次 React 提交。

### 4.3 工具调用渲染

- 工具增量与后续 `tool/call` 可以按同一个 `callId` 匹配为 start；只有最早的 Match 调 `start()`，后续调 `update()`。
- 名称尚未到达时，准备态节点不显示名称；名称可用后才渲染完整工具卡片。
- `conversation.chat.node` 是 keyed slot，`tool-call` 只是其中一个 key。第三方工具要自定义呈现，注册的是这个 key 下的组件或扩展点，而不是改 `ui-chat`。
- 需要"聚焦某个工具调用"时，View Definition 可声明 `toolCallFocus(callId)`，把调用 id 映射为自身焦点标识；shell 只为声明了该能力且可见的 target 提供 Inspect。

### 4.4 审批与待处理交互

三道关卡：

| 层 | 载体 | 行为 |
| --- | --- | --- |
| Host | `ctx.approval`（`interaction/user-approval`） | 征求一次性允许/拒绝；未获决定默认拒绝 |
| 会话状态 | `SessionPendingInteraction` | 会话进入"等待用户"状态，运行状态与停止按钮同步 |
| UI | `ui-approval` + `conversation.composer` chain | 命中待处理审批时接管输入区，渲染审批面板 |

因为走的是 composer chain，审批面板与输入框共享同一位置和同一份 Session props；不需要在消息流里插一个"审批消息"。

### 4.5 错误与失败恢复

失败轮次由错误类别驱动 UI：

| 类别 | 含义 |
| --- | --- |
| `RATE_LIMIT` | 触发限流 |
| `SERVER` | 服务端错误 |
| `TIMEOUT` | 请求超时 |
| `TRANSPORT` | 传输层中断 |
| `EMPTY_RESPONSE` | 模型返回空响应 |
| `STREAM_CLOSED` | 流被提前关闭 |

在上述类别结束、且会话空闲、草稿为空时，输入区显示"继续生成"（播放）按钮。点击走正常 prompt API 提交 `content: []`，记录一条 `source.kind: 'retry'` 的空 `user/message`；已有草稿或附件时仍走发送按钮。资格判定由 `conversationContinuation` 投影统一提供，Host 准入与浏览器展示共用同一份结果，不依赖浏览器已加载的分页。

另有 `retry(failureSeq)` 供输入栏在生成失败后重试具体失败序号。

### 4.6 输入区能力

输入区由 `SessionInputShell` + Lexical 编辑器 + 私有 `DraftEditorRuntime` 组成，按 Session 一份草稿。

| 能力 | 行为 |
| --- | --- |
| 草稿持久化 | 按 Session 保存；Session 切换、Workspace 转移都保留 |
| 引用 / 引用胶囊 | 通过 UserText 扩展点匹配与渲染；`insertQuote` 仅在 plain 模式接受非空选区 |
| 命令 chip | 斜杠命令由 `interaction/commands` 提供，输入框负责展示与调用 |
| 附件 | 接收策略跟随 `fileUploads/upload` 权限；原生文件选择器经"文件"命令动作触发 |
| 粘贴路由 | 图片、长文本、文件分别走附件 / 文本 / 文件路径 |
| 发送 / 停止 | 分别受 `session/prompt` 与 `session/cancel` 权限约束；键盘提交与 Esc-Esc 仍直达 Host 并由 Host 拒绝 |
| 上下文占用 | 输入卡片下方圆环 + 百分比，点开为 CSS 锚定面板，展示 token 构成 |
| 宽度拖拽 | 输入区可调宽；窄屏（<768px）与桌面有不同的内边距与标签对齐 |
| 移动端 | 识别为手机/平板时不自动聚焦；提交后焦点移到非文本卡片以收起键盘 |

`conversation.input.activity` 提供模型选择器与发送按钮之间的单个活动控件；`conversation.input.dock` 承载队列与 Todo 等停靠内容。

### 4.7 输入扩展点

第三方要改输入区，按需求选不同机制：

| 需求 | 机制 |
| --- | --- |
| 在已有工具栏加一个按钮 | 向对应 list slot 注册（如 `conversation.input.*` 的具体 key） |
| 增加一条斜杠命令 | `ctx.commands` 注册命令，输入框自动出现在命令菜单 |
| 增加一种右键/选区动作 | `ctx.uiConversation.interactions` 注册处理函数，按 id 对应 keyed Slot 组件 |
| 整体替换输入区 | 向 `conversation.composer` 注册 chain entry（谨慎：会夺走默认输入体验） |

## 5. `interaction` / `attachment` / `document` / `deliverables`

这四个目录都是 **Host 侧能力**，不是前端包；前端各有对应 `ui-*` 承接。理解边界的关键是问"数据归谁、呈现归谁"。

### 5.1 `interaction`：人机协作平面

| 包 | 角色 | ctx 键 |
| --- | --- | --- |
| `commands` | 斜杠命令，无需模型往返 | `ctx.commands` |
| `user-approval` | 一次性允许/拒绝，未决定默认拒绝 | `ctx.approval` |
| `permission-presets` | 沙箱模式 + 审批策略打包成权限选择器 | `ctx.permissionPresets` |
| `user-questions` | 受校验的问题 schema 与作用域 answerer waterfall | `ctx.userQuestions` |
| `tool-ask-user` | `ask_user_question` 工具 | 注册到 `ctx.tools` |

边界：`interaction` 只定义"请求什么、怎么收集答案、没有答案怎么办"，**不渲染任何界面**。前端由 `ui-approval`、输入区的命令菜单、问题卡片分别承接。

### 5.2 `attachment`：持久图片附件

| 包 | 角色 | ctx 键 |
| --- | --- | --- |
| `attachment` | 可附加到提示词与命令、持久保存并回到历史的图片 | `ctx.attachments` |
| `attachment-local` | 把图片存到本机 `DSH_HOME` | 注册到 `ctx.attachments` |

边界：只支持光栅格式；存储后不自动删除。前端对应 `ui-attachment`，负责缩略图/方块两种展示、灯箱，以及通过 `conversation.images.content` Factory 提供渲染；owner 传入经 Gateway 授权的 `loadImage`，URL 解析与缓存仍在 UI adapter 侧。

### 5.3 `document`：Office 渲染与转换

| 包 | 职责 | ctx 键 |
| --- | --- | --- |
| `office-kit` | 把已授权 Office 字节转成 PDF / PNG / 转换文件 / 重算工作簿，带有界队列与缓存 | `ctx.officeKit` |
| `tool-office` | `office_render` / `office_convert` / `office_recalculate` 工具 | 注册到 `ctx.tools` |

边界：`document` 是**转换引擎**，不是文档查看器。前端文档预览由右侧栏的 document preview pane 承接，它调用 Host 渲染结果并展示；源文件授权与展示策略由消费者负责。

### 5.4 `deliverables`：轮次交付物

| 包 | 角色 | ctx 键 |
| --- | --- | --- |
| `deliverable-file-references` | Web 与 SDK 共用的文件链接/交付指导 | 注册到 `ctx.systemPrompt` |
| `tool-present` | `present` 工具，声明最终交付文件 | 注册到 `ctx.tools` |
| `workspace-changes` | 用 git 快照 + 整文件捕获汇总每轮改动并提供 diff | `ctx.workspaceChanges`，监听 `session/event` 追加 `workspace/changes` |

边界：`deliverables` 只把结果写成**持久 Session 事件**（`PresentedFile`、`WorkspaceChangesSummary`），不渲染。前端由 `ui-deliverables` 在轮次末尾渲染交付卡片与文件提及。

### 5.5 边界总表

| 能力 | Host 拥有 | 浏览器拥有 |
| --- | --- | --- |
| 审批 | 请求生命周期、默认拒绝、策略 | 审批面板、输入区接管、按钮文案 |
| 附件 | 字节存储、格式校验、生命周期 | 选择、预览、缩略图、灯箱、URL 缓存 |
| Office | 转换/渲染/重算、缓存、队列 | 预览壳、翻页、下载入口 |
| 交付物 | 事件写入、git 快照、diff | 轮尾卡片、文件提及、跳转 |

一句话：**Host 决定"发生了什么"，浏览器决定"看起来怎样"。**

## 6. 层次关系与切分理由

### 6.1 `packages/client` 内部六层

| 层 | 代表包 | 职责 |
| --- | --- | --- |
| 传输与 API 装配 | `connection`、`api-gateway`、`api-remotes` | RPC、`$events` 逻辑流重连、connection generation |
| Client model | `api/session-controller/client`、`api/workspace-controller/client` | `ClientSessions → SessionManager → Session`、`ClientWorkspaceModel` |
| UI adapter | `ui-session`、`ui-workspace` | 把 model 投影成组件可直接消费的 props 与钩子 |
| Conversation 数据 | `ui-conversation`、`ui-chat`、`ui-trajectory` | 事件 Definition、Context 组装、target snapshot |
| 组合 | `ui-slots`、`ui-renderer`、`ui-layout` | 类型代数、React 绑定、根布局 |
| 功能 UI | `ui-sidebar`、`ui-settings`、`ui-approval`、`ui-attachment`、`ui-deliverables` 等 | 具体界面 |

依赖方向严格单向：**Host 状态 → Remote 传输 → Client model → UI adapter → Conversation/呈现 → Slots → React**。反向依赖（例如 model 里 import 组件）不存在。

### 6.2 与 `apps/web` 的分工

- `apps/web` 只回答"怎么把代码送到浏览器、怎么起一个挂载点"。它不 import 任何 `ui-*` 功能包。
- `packages/client/web` 只回答"模块怎么加载、插件怎么激活、什么时候交给渲染器"。它同样不 import 功能包（仅静态表里锁定共享依赖）。
- **加载哪些插件由 Host 决定**（`window.__DSH_BOOT__` 里的名册），不是由前端代码写死。

这带来一个直接结果：同一个 `dist/` 可以服务不同 profile，只要 Host 给的名册不同；插件市场装一个插件，刷新后 UI 就多一块，不需要重新构建前端。

### 6.3 包边界红线

1. 功能插件包之间**只能 `import type` 共享声明**，不得运行时 import 另一个功能插件的实现。
2. 跨包行为用 **Cordis service**（`ctx.xxx`），跨包 UI 用 **Slot**。
3. 需要共享的运行时值必须放进有明确归属的静态包（`client/store`、`ui-primitives` 等），不能靠"从某个 ui 包顺手 import"。
4. React 单实例由静态模块表保证，禁止插件自带 React。

### 6.4 为什么这么切

| 诉求 | 切分带来的结果 |
| --- | --- |
| 插件可装卸 | 装卸只影响 Slot 注册，不触碰骨架代码 |
| 第三方可替换某块 UI | 换 `id`/`key` 或提高 `priority` 即可遮蔽，不必 fork |
| 启动可预检 | 声明与注册在激活期校验，错误在启动审计暴露 |
| 多载体复用 | 同一套 client 包可被 Web、桌面、测试 carrier 共用（`AppWebEntry` 支持 seams 替换） |
| Host 与浏览器同构装配 | 名册、bundle、激活顺序与 CLI 侧一致，减少两套心智模型 |
| 性能可控 | 只有一层 `useSyncExternalStore` 绑定点，渲染粒度由 slot 与 publication 控制 |

## 7. 关键文件与接口索引

### 7.1 启动链

| 文件 | 职责 |
| --- | --- |
| [apps/web/src/main.ts](../../../apps/web/src/main.ts) | Vite 入口；构造 `AppWebEntry`、处理桌面端注入、上报失败 |
| [apps/web/vite.config.ts](../../../apps/web/vite.config.ts) | Vite 构建配置 |
| [apps/web/product-isolation.ts](../../../apps/web/product-isolation.ts) | 产品隔离配置（细节见源码） |
| [packages/client/web/src/index.ts](../../../packages/client/web/src/index.ts) | 外壳库唯一公开入口：`AppWebEntry`、`getStaticModules`、`PLATFORM_MODULES`、`applyIndexInjections` |
| [packages/client/web/src/boot.ts](../../../packages/client/web/src/boot.ts) | 启动内核：模块系统、Loader、预取、DragRecall、挂载编排、`dispose()` |
| [packages/client/web/src/boot-client.ts](../../../packages/client/web/src/boot-client.ts) | 插件激活与激活审计 |
| [packages/client/web/src/boot-page.ts](../../../packages/client/web/src/boot-page.ts) | 无框架启动页：进度、失败展示 |
| [packages/client/web/src/mount.ts](../../../packages/client/web/src/mount.ts) | 依赖 fiber 挂载 `uiRenderer` |
| [packages/client/web/src/seed.ts](../../../packages/client/web/src/seed.ts) | 静态模块表 |
| [packages/client/web/src/platform.ts](../../../packages/client/web/src/platform.ts) | 平台模块名单与预加载 external |
| [packages/client/web/src/apply-injections.ts](../../../packages/client/web/src/apply-injections.ts) | 按注入表插入脚本/样式 |
| [packages/client/web/src/window-drag/recall.ts](../../../packages/client/web/src/window-drag/recall.ts) | Electron 窗口拖拽区域同步 |

### 7.2 Slot 与渲染

| 文件 | 职责 |
| --- | --- |
| [packages/client/ui-slots/src/index.ts](../../../packages/client/ui-slots/src/index.ts) | 类型代数与注册表：`SlotKind`、`SlotScope`、`register`、`entriesOfSlot`、`snapshot` |
| [packages/client/ui-slots/README.zh.md](../../../packages/client/ui-slots/README.zh.md) | 包级约定与扩展规则 |
| [packages/client/ui-renderer/README.zh.md](../../../packages/client/ui-renderer/README.zh.md) | 唯一 React 绑定层；`mount(container)` 与 `renderSlot('root')` |
| [packages/client/ui-layout/README.zh.md](../../../packages/client/ui-layout/README.zh.md) | `AppFrame` 与根布局 |
| [docs/subsystems/slots.zh.md](../../subsystems/slots.zh.md) | Slot 所有权、基数、作用域、完整层级树的权威说明 |

### 7.3 Conversation

| 文件 | 职责 |
| --- | --- |
| [packages/client/ui-conversation/README.zh.md](../../../packages/client/ui-conversation/README.zh.md) | 事件/视图注册表、binding、共享 shell、输入区与 composer takeover |
| [packages/client/ui-chat/README.zh.md](../../../packages/client/ui-chat/README.zh.md) | `chat` target：Definition、snapshot、节点渲染 |
| [packages/client/ui-trajectory/README.zh.md](../../../packages/client/ui-trajectory/README.zh.md) | `trajectory` target：结构化过程视图 |
| [docs/subsystems/conversation.zh.md](../../subsystems/conversation.zh.md) | 六概念、Group Definition、可回放 event family、Definition 示例 |

### 7.4 功能包

| 包 | 职责 |
| --- | --- |
| `ui-workspace` | 会话行、会话列表、选择与键盘行为 |
| `ui-sidebar` | 右侧栏容器、pane tab、引导卡片 |
| `ui-settings` | 设置页与导航图标 |
| `ui-approval` | 审批面板与 composer 接管 |
| `ui-attachment` | 附件选择、缩略图、灯箱、`conversation.images.content` |
| `ui-deliverables` | 轮尾交付卡片与文件提及 |
| `ui-schedule` | 自动化任务主页面 |
| `ui-plugin-manager` | 插件管理主页面 |
| `ui-entry-customization` | 各区域"更多"菜单中的产品内置行 |

### 7.5 Host 侧对应包

| 目录 | 对应前端 |
| --- | --- |
| [packages/interaction](../../../packages/interaction/README.zh.md) | `ui-approval`、命令菜单、问题卡片 |
| [packages/attachment](../../../packages/attachment/README.zh.md) | `ui-attachment` |
| [packages/document](../../../packages/document/README.zh.md) | 右侧栏 document preview pane |
| [packages/deliverables](../../../packages/deliverables/README.zh.md) | `ui-deliverables` |

## 8. 待确认

以下条目在当前工作树中未能逐一核实到源码级证据，写作时按仓库文档与文件存在性推断，后续应以代码为准：

1. `apps/web/vite.config.ts` 的具体别名表、dev server 端口与代理规则、`product-isolation.ts` 的隔离粒度。
2. `packages/client/web/src/boot-client.ts` 中"必需 / 可选条目"的判定字段与激活审计的完整失败分级。
3. `main` slot 注册 key 的确切字符串（本文按 `conversation` / `automations` / `plugins` 表述，来自注册代码的检索结果，未逐行核对）。
4. 右侧栏 pane tab 的完整 id 列表与各自注册包（代码中可见文件、终端、浏览器、文档预览、交付物、计划预览、任务详情等，可能还有更多）。
5. `conversation.input.*` 与 `conversation.hero.*` 的通配 key 全量清单。
6. `ui-chat` / `ui-trajectory` 各自注册的具体节点 kind 是否与 `slots.zh.md` 列出的七种完全一致（`user` / `steering` / `assistant-step` / `tool-call` / `command-input` / `command` / `turn-tail`）。
7. ~~部分包的 `README.zh.md` 是否存在~~ —— **已核（本轮）**：本文件全部相对链接逐条 `Test-Path` 通过，无死链，详见 [核对报告](./00-consistency-review.md) 第 5 节。
8. 移动端与桌面端在输入框聚焦策略上的分支是否覆盖所有触屏设备（当前依据 `ui-conversation` README 的设备识别描述）。
