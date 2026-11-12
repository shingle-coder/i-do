# packages-05 文件级索引（experimental / extensions / feedback / fs / goal / guard）

本文是 `docs/superpowers/inventory/packages-05.tsv`（2,949 行）的文件级台账，按 packages 子目录分节，每节先给包的定位，再逐文件记录职责。架构层面的横向分析见 `docs/superpowers/modules/`，本文不重复，只回答「这个文件是干什么的」。

## 标注规则

- **`[精读]`**：打开文件读过实现正文——包括文件头的模块说明、导入面、主要导出与关键分支。对超过 500 行的大文件，采用「读入口 + 导出面 + 关键段落」的方式，不保证逐行通读，表中会注明。
- **`[结构]`**：没有打开实现，靠文件名、所在目录、同包 README/package.json、导出符号与引用关系判定。这类判断在拿不准时写「待确认」，不臆造。
- **聚合行**：`locale/` 下按语言切分的 8 个 JSON 文案文件行数都在个位数，合并为一行（8 个文件），行数列写区间。统计覆盖时按实际文件个数计。
- **哪些行必须标注**：`源码` 与 `客户端源码` 逐行标注，不留空。`测试`、`快照`、`文档`、`配置`、`多语言`、`资源`、`fixture` 类由路径即可唯一确定用途，不强制标注——测试行统一写成「被测对象：`src/xxx.ts` 的……」，这本身就是结构判断。各类实际数量见 [7.2](#72-标注分布)。
- **行数**：取自 TSV 的 `行数` 列（物理行）。
- 文件类型：`源码`（Host/服务端）、`客户端源码`（`src/client` 下）、`测试`、`快照`、`文档`、`配置`、`多语言`、`资源`（svg/css）、`fixture`。

## 总体观察

本块是「能力插件」的聚集地：`packages/experimental` 近 2,500 个文件，绝大多数是围绕 Cordis 插件协议分发的小包，每个包的结构高度同构——`src/index.ts` 注册工具/服务、`locale/*.json` 八语文案、`tests/*.spec.ts`、`README.md` + `README.zh.md` + `README.i18n.yaml`（翻译配对清单）。`packages/extensions` 是唯一的「自举」区域，它实现的是运行时加载动态 Cordis 插件的机制本身；`packages/fs`、`packages/goal`、`packages/guard`、`packages/feedback` 是面向某一领域的一组纵向切片（服务定义 + 本地实现 + 工具/命令 + 策略）。

---

## 一、packages/extensions

这一组是整个插件体系的「元层」：不是消耗 Cordis 插件，而是**在运行时定义、审批、加载、巡检插件**。Host 半（`cordis-host-runner`）负责不可变的包定义、每次激活一个 run、人工审批后由 Client 激活；浏览器半（`cordis-client-runner`）把一段源码闭包求值成活的 cordis 插件并挂到真实 loader 上；`tool-cordis` 给模型提供只读的运行时 API 发现能力；`ui-cordis` 是用户可见的插件清单、卡片与生命周期操作面板。该目录另有组级 README，说明四个包的分工。

### extensions/cordis-host-runner — 动态 Cordis 插件的 Host 半运行时

包定位：把一个「动态包」（模型或用户编写的插件源码）在 Host 侧安全地变成一个真插件——注册表持有不可变定义，激活产生 run，Host 半在 `node:vm` 沙箱里求值，注册请求经由 guard 的 façade 过滤后才进入真实运行时。它只做「可检查、可丢弃」，不承诺内核级隔离。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，动态插件运行状态的提示文案。 |
| `package.json` | 配置 | 82 | 包声明，导出 Host 服务与 client 类型入口。 |
| `README.i18n.yaml` | 配置 | 70 | 中英文 README 的翻译配对清单（段落/标题锚点）。 |
| `README.md` / `README.zh.md` | 文档 | 152 | 英文/中文包说明：run 生命周期、审批语义、沙箱边界。 |
| `src/index.ts` | 源码 | 1290 | `[精读·读入口与导出面]` 包主体：Dynamic Cordis Plugin 服务定义——包定义落库、激活 run、审批请求、Host/Client 调用与状态广播，全部经 Typert Remote 暴露给前端。 |
| `src/guard.ts` | 源码 | 836 | `[精读]` 沙箱与真实运行时之间的注册边界：参数 schema 规范化与校验、`harness.defineTool/registerTool` 标记守卫、`harness.handle` 归一化，以及插件 `apply` 拿到的 `ctx` façade 白名单。 |
| `src/inspect-registry.ts` | 源码 | 292 | `[精读]` Host 侧只读能力查询注册表：登记 provider 清单，串行/并发处理模型的 inspect 查询并回传 JSON。 |
| `src/lifecycle.ts` | 源码 | 57 | `[精读]` Host 半的 fiber 生命周期助手：在 `cordis-dynamic` group 下 settle 子 fiber、回收失败 fiber、报告未满足的 inject。 |
| `src/registry.ts` | 源码 | 276 | `[精读]` 进程内动态插件注册表与四种品牌 ID（Plugin/Package/Run/Approval）的铸造，持有每个 live run 的拆卸资源。 |
| `src/sandbox.ts` | 源码 | 237 | `[精读]` `node:vm` 沙箱：新 realm、写穿 console、编码原语，以及把 fs/net/process/定时器调用导向 `ctx.fs`/`ctx.web`/`ctx.bash` 的陷阱函数。 |
| `src/types.ts` | 源码 | 403 | `[精读]` 客户端安全的线协议词汇：运行模式、attempt、渲染失败、inventory 行的类型定义。 |
| `tests/composition.spec.ts` | 测试 | 180 | 组合装载测试：Host 半与依赖服务的装配。 |
| `tests/helpers.ts` | 测试 | 253 | 测试脚手架：构造动态包定义、模拟审批与运行上下文。 |
| `tests/inspect-registry.spec.ts` | 测试 | 276 | 被测对象：`src/inspect-registry.ts` 的查询路由与错误处理。 |
| `tests/runner.spec.ts` | 测试 | 578 | 被测对象：`src/index.ts` 的 run 状态机与调用面。 |
| `tests/sandbox.spec.ts` | 测试 | 218 | 被测对象：`src/sandbox.ts` 的 realm 隔离与陷阱函数。 |
| `tests/sandbox-context.spec.ts` | 测试 | 273 | 被测对象：`src/guard.ts` 的 ctx façade 白名单行为。 |
| `tests/versioning.spec.ts` | 测试 | 108 | 被测对象：包的不可变版本与替换语义。 |
| `tsconfig.json` | 配置 | 48 | TypeScript 编译配置。 |

### extensions/cordis-client-runner — 动态包的浏览器半执行器

包定位：页面侧不做任何预加载，只有收到 dispatch（模型调 `cordis_run` 或用户点卡片开始）才把包源码当作 async 函数体求值，产出 cordis 插件并塞进真实 loader，因此动态包享有与静态插件完全相同的 inject 门控、fiber 清理和状态投影。卸载 = 摘除 loader entry + 失效工厂 + 移除样式。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，动态包卡片与加载状态文案。 |
| `package.json` | 配置 | 68 | 包声明，导出浏览器半入口。 |
| `README.i18n.yaml` | 配置 | 79 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 146 | 包说明：加载顺序（Host 激活先于 Client 加载）、重连与刷新语义。 |
| `src/client/api-catalog.ts` | 客户端源码 | 1208 | `[结构]` 浏览器侧 Service/Event API 目录的生成与签名字典，供 inspect provider 返回。 |
| `src/client/evaluator.ts` | 客户端源码 | 222 | `[精读]` 闭包求值：把包源码作为 async 函数体执行，用同名形参遮蔽 `setTimeout`/`fetch`/`require` 等环境全局，转成教学式重定向。 |
| `src/client/guard.ts` | 客户端源码 | 245 | `[精读]` 浏览器版 ctx façade：生命周期动词白名单、声明式服务属性访问、`slots`/`theme` 两个特例的注册代理。 |
| `src/client/index.ts` | 客户端源码 | 308 | `[精读]` 浏览器半入口：装配加载引擎、inspect provider 与 retract 公告。 |
| `src/client/inspect-registry.ts` | 客户端源码 | 150 | `[精读]` 浏览器侧只读能力注册表，与 Host 版对称。 |
| `src/client/orchestrator.ts` | 客户端源码 | 458 | `[精读]` 页面侧运行编排：审批通过后的 Host 激活 → Client 加载 → 结果回执，按 Plugin 聚合状态以支持面板重挂载。 |
| `src/client/providers.ts` | 客户端源码 | 263 | `[精读]` 内置 inspect provider 集合（服务/事件/槽位目录），基于 `api-catalog.ts` 与 `slot-catalog.ts`。 |
| `src/client/runtime.ts` | 客户端源码 | 512 | `[精读·读入口与导出面]` 每包浏览器生命周期：求值 → façade 包装 → 模块表落位 → loader entry；按 Run ID 收敛加载请求并做单插件串行化。 |
| `src/client/slot-catalog.ts` | 客户端源码 | 5782 | `[结构]` 槽位 API 的静态目录（生成数据，体量最大的单文件）。 |
| `src/index.ts` | 源码 | 9 | Host 侧入口，仅聚合导出 client 类型。 |
| `tests/api-catalog.client.spec.ts` | 测试 | 72 | 被测对象：`api-catalog.ts` 的目录裁剪。 |
| `tests/evaluator.client.spec.ts` | 测试 | 195 | 被测对象：`evaluator.ts` 的遮蔽求值与语法失败回退。 |
| `tests/guard.client.spec.ts` | 测试 | 271 | 被测对象：`guard.ts` 的 façade 白名单。 |
| `tests/orchestrator.client.spec.ts` | 测试 | 459 | 被测对象：`orchestrator.ts` 的状态机与重挂载。 |
| `tests/plugin.client.spec.ts` | 测试 | 480 | 被测对象：动态插件与 loader 的装配（不局限于单一源文件）。 |
| `tests/providers.client.spec.ts` | 测试 | 74 | 被测对象：`providers.ts` 的 provider 清单与查询。 |
| `tests/runner.client.spec.ts` | 测试 | 557 | 被测对象：`runtime.ts` 的加载/卸载/替换。 |
| `tsconfig.json` | 配置 | 36 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | 打包器配置（复用仓库默认预设）。 |

### extensions/tool-cordis — 模型可见的运行时 API 发现工具

包定位：给写插件的模型提供**只读**的 Host/Client 运行时 API 查询工具（服务、事件、配置、工具清单），数据来自 `cordis-host-runner` 的 inspect 注册表；Host provider 每进程注册一次，`tool-cordis` 行按会话读取。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，工具描述与调用展示文案。 |
| `locale/host/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5 | 聚合行：8 个语言文件，Host 侧 provider 的说明文案。 |
| `package.json` | 配置 | 61 | 包声明，含 `./host` 子入口。 |
| `README.i18n.yaml` | 配置 | 46 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 77 | 包说明：为什么只读、provider 注册时机。 |
| `src/api-catalog.ts` | 源码 | 10946 | `[结构]` Host 侧 Service/Event API 目录与类型声明的静态生成产物，全块最大文件，几乎无可手改逻辑。 |
| `src/config.ts` | 源码 | 120 | `[精读]` 从运行中的 Loader 树投影插件 Config，区分 `schema/absent/unsupported/tree/inactive` 五种状态。 |
| `src/host.ts` | 源码 | 20 | `[精读]` Host 平面注册入口：把首方 provider 装入 `ctx.cordisInspect`，每进程一次。 |
| `src/index.ts` | 源码 | 78 | `[精读]` 注册 `cordis_inspect_list` / `cordis_inspect_query` 两个只读工具。 |
| `src/present.ts` | 源码 | 19 | `[精读]` 工具调用在 UI 中的展示形态（列表/查询两种 call view）。 |
| `src/providers.ts` | 源码 | 118 | `[精读]` 首方 Host provider 集合：服务目录、事件目录、运行中 Config 查询。 |
| `tests/config.spec.ts` | 测试 | 128 | 被测对象：`config.ts` 的状态判定。 |
| `tests/cordis-lifecycle.spec.ts` | 测试 | 287 | 被测对象：工具与 Loader 生命周期的交互。 |
| `tests/host.spec.ts` | 测试 | 49 | 被测对象：`host.ts` 的注册幂等性。 |
| `tsconfig.json` | 配置 | 45 | TypeScript 编译配置。 |

### extensions/ui-cordis — 动态插件的前端卡片与清单面板

包定位：把动态插件的定义、运行、审批渲染成会话内卡片，并提供 frame 级清单面板；面板数据不按会话推导，而是整体重读宿主注册表（公告不带标签，增量修补会漂移）。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，面板与卡片文案。 |
| `package.json` | 配置 | 77 | 包声明，浏览器半入口。 |
| `README.i18n.yaml` | 配置 | 55 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 126 | 包说明：卡片种类、面板与审批交互。 |
| `src/client/card-model.ts` | 客户端源码 | 161 | `[结构]` 卡片视图模型：把 inventory 行与运行状态折算为卡片可渲染字段。 |
| `src/client/CordisActionRow.tsx` | 客户端源码 | 50 | `[结构]` 单条插件操作的按钮行组件。 |
| `src/client/CordisDefineRow.module.css` | 资源 | 309 | 定义行样式。 |
| `src/client/CordisDefineRow.tsx` | 客户端源码 | 172 | `[结构]` 插件定义行：版本、状态与操作入口。 |
| `src/client/CordisPanel.module.css` | 资源 | 366 | 面板样式。 |
| `src/client/CordisPanel.tsx` | 客户端源码 | 507 | `[精读·读入口]` frame 级动态插件清单面板：审批、版本、生命周期操作。 |
| `src/client/CordisPreparingRow.tsx` | 客户端源码 | 30 | `[结构]` 准备中占位行。 |
| `src/client/CordisRunRow.module.css` | 资源 | 145 | 运行行样式。 |
| `src/client/CordisRunRow.tsx` | 客户端源码 | 136 | `[结构]` 单次运行行：状态点、停止与重跑。 |
| `src/client/dynamic-port.ts` | 客户端源码 | 24 | `[结构]` 客户端到 Host 的动态插件端口类型（inventory 行形状）。 |
| `src/client/events.ts` | 客户端源码 | 17 | `[结构]` 客户端事件声明（`cordis/*` 公告）。 |
| `src/client/index.ts` | 客户端源码 | 148 | `[精读]` 浏览器半入口：注册卡片、清单面板与业务视图 slot。 |
| `src/client/inventory.ts` | 客户端源码 | 113 | `[精读]` 宿主定义注册表的页面镜像：整体重读、单飞、重连时丢弃旧连接的应答。 |
| `src/client/locales.ts` | 客户端源码 | 453 | `[结构]` 组件文案 key 表（多语言源）。 |
| `src/client/run-card-index.ts` | 客户端源码 | 76 | `[结构]` 运行卡片注册表：按 run 索引卡片状态。 |
| `src/client/slots.ts` | 客户端源码 | 72 | `[结构]` 面板注入的 slot 契约（face 类型）。 |
| `src/client/status.ts` | 客户端源码 | 45 | `[结构]` 运行状态到图标/文案的映射。 |
| `src/css-modules.d.ts` | 配置 | 6 | CSS Modules 类型声明。 |
| `src/index.ts` | 源码 | 9 | Host 侧类型导出聚合。 |
| `tests/card-model.client.spec.ts` | 测试 | 109 | 被测对象：`card-model.ts`。 |
| `tests/inventory.client.spec.ts` | 测试 | 142 | 被测对象：`inventory.ts` 的单飞与重连语义。 |
| `tests/status-icons.client.spec.tsx` | 测试 | 154 | 被测对象：`status.ts` 与状态图标。 |
| `tests/versioning.client.spec.ts` | 测试 | 132 | 被测对象：版本切换在面板上的表现。 |
| `tsconfig.json` | 配置 | 45 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | 打包器配置。 |

### extensions 组级文件

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `README.md` / `README.zh.md` | 文档 | 53 | 组级说明：四个包在「定义 → 审批 → 加载 → 巡检」链路上的分工。 |
| `README.i18n.yaml` | 配置 | 25 | 组级 README 的翻译配对清单。 |

---

## 二、packages/feedback

这一组回答「用户如何对一次会话/一条回答给出评价」。两个包走的是同一条存储路线：**追加一条只写日志的权威事件**，不触发模型工作；区别在评价对象——`command-feedback` 评价整段会话（`/feedback` 命令与产品界面共用 `sessionFeedback` Remote），`message-feedback` 评价已定稿的单条助手消息。组级 README 说明两者的边界。

### feedback/command-feedback — 会话级反馈与 `/feedback` 命令

包定位：定义 `feedback/record` 事件、与命令无关的生产者、产品界面写入用的 `sessionFeedback` Host Remote，以及人类可用的 `/feedback` 命令。写入是「急切但未落盘」的追加，因此回执只表示已记入日志，不表示已到达磁盘。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，命令回执与分类文案。 |
| `package.json` | 配置 | 74 | 包声明，导出事件类型与 Remote。 |
| `README.i18n.yaml` | 配置 | 64 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 156 | 包说明：事件形状、持久化语义、命令用法。 |
| `src/index.ts` | 源码 | 127 | `[精读·读入口]` 插件主体：定义 `feedback/record` 事件、注册 `/feedback` 命令与 `sessionFeedback` Remote，并把记录写入会话日志。 |
| `src/types.ts` | 源码 | 69 | `[结构]` 反馈分类枚举、记录请求/结果与事件 payload 类型。 |
| `tests/command-feedback.spec.ts` | 测试 | 263 | 被测对象：`src/index.ts` 的命令解析、事件追加与回执。 |
| `tests/loader-composition.spec.ts` | 测试 | 123 | 组合装载测试：与 commands/session 服务的装配。 |
| `tsconfig.json` | 配置 | 30 | TypeScript 编译配置。 |

### feedback/message-feedback — 单条助手消息的反馈

包定位：对「已定稿」的助手消息做规范化的会话日志反馈，支持增删改与按消息查询，并对外暴露 Remote 供前端反馈控件调用；同样只追加日志事件，不改写消息。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，消息反馈控件文案。 |
| `package.json` | 配置 | 77 | 包声明，导出服务与 Remote。 |
| `README.i18n.yaml` | 配置 | 55 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 101 | 包说明：定稿判定、去重与删除语义。 |
| `src/index.ts` | 源码 | 313 | `[精读·读入口]` 服务实现：校验目标消息是否定稿、写入/更新/删除反馈事件、维护按消息索引的 Remote 接口。 |
| `src/types.ts` | 源码 | 177 | `[结构]` 反馈负载、删除请求、失败原因的线协议类型。 |
| `tests/helpers.ts` | 测试 | 231 | 测试脚手架：构造带定稿消息的会话。 |
| `tests/loader-composition.spec.ts` | 测试 | 137 | 组合装载测试。 |
| `tests/message-feedback.spec.ts` | 测试 | 690 | 被测对象：`src/index.ts` 的全部分支（写入、幂等、删除、越权）。 |
| `tsconfig.json` | 配置 | 39 | TypeScript 编译配置。 |

### feedback 组级文件

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `README.md` / `README.zh.md` | 文档 | 42 | 组级说明：会话级与消息级反馈的分工。 |
| `README.i18n.yaml` | 配置 | 25 | 组级 README 翻译配对清单。 |

---

## 三、packages/guard

「守卫」是一类不改变工具语义、只在工具调用链上加策略的插件：`repeat-tool-reminder` 只做提醒（不否决），`timeout-policy` 只把声明的截止时间映射成结构化超时结果（不放弃工具 promise）。两者都以 `tools/execute` 包装器的形式挂在执行链上。

### guard/repeat-tool-reminder — 重复调用提醒

包定位：按 Agent 维度检测连续重复的工具调用，命中后在 post-execute 决策里补一条模型可见的上下文消息，**不否决、不改写**原调用。配置项与判定链语义见包 README。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，提醒消息模板。 |
| `package.json` | 配置 | 53 | 包声明。 |
| `README.i18n.yaml` | 配置 | 85 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 185 | 包说明：重复判定键、阈值、提醒注入位置与关闭方式。 |
| `src/index.ts` | 源码 | 234 | `[精读·读入口]` 每 Agent 的调用指纹计数与 post-execute 提醒注入。 |
| `tests/repeat-tool-reminder.spec.ts` | 测试 | 413 | 被测对象：`src/index.ts` 的指纹、阈值与注入时机。 |
| `tsconfig.json` | 配置 | 30 | TypeScript 编译配置。 |

### guard/timeout-policy — 工具调用超时策略

包定位：工具自行声明 `timeoutMs` 并承诺响应 `exec.signal`；本包装上截止计时器，只把自己的到期映射为 `TOOL_TIMEOUT`，不抢先 settle、不抛弃工具 promise。代码里保留了「是否改名为 `dsh-timeout-guard`」的待决 FIXME。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，超时结果文案。 |
| `package.json` | 配置 | 48 | 包声明。 |
| `README.i18n.yaml` | 配置 | 67 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 134 | 包说明：协作式超时契约与嵌套 deadline 的优先级。 |
| `src/index.ts` | 源码 | 81 | `[精读]` 用 `dsh-timeout` 的 deadline 包装 `tools/execute`，把本层到期替换为结构化超时结果。 |
| `tests/timeout-policy.spec.ts` | 测试 | 250 | 被测对象：`src/index.ts` 的到期、外层先到期、工具自身拒绝三种路径。 |
| `tsconfig.json` | 配置 | 28 | TypeScript 编译配置。 |

### guard 组级文件

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `README.md` / `README.zh.md` | 文档 | 51 | 组级说明：守卫只加观测或策略，不改变工具语义。 |
| `README.i18n.yaml` | 配置 | 25 | 组级 README 翻译配对清单。 |

---

## 四、packages/fs

这一组把「文件系统」拆成四层再加三个工具面：`fs` 是服务契约（`ctx.fs` 的抽象，纯类型 + 错误码 + 观测普遍性），`fs-local` 是宿主真机实现（含 Windows 大小写与原子写细节），`fs-sandbox` 是套在真机实现外的收容装饰器（越界拒绝、撤销），`fs-patch` 是 apply_patch 文本格式的解析/应用内核，`fs-observation-policy` 是限制「哪些路径允许被工具观测」的策略。`tool-fs`、`tool-fs-search`、`tool-str-replace-editor` 是模型侧工具。组级 README 给出分层图。

### fs/fs — 文件系统服务契约

包定位：只定义抽象与语义，不含 I/O。`ctx.fs` 提供读/写/列目录/stat/移动/删除/监视等原语，错误统一为带 `FsErrorCode` 的结构化错误；「观测普遍性」指从 workspace 根算起的各级目录必须走同一双眼睛（大写别名、符号链接、不参与 inotify 的远端挂载等都要先经 `stat` 树立别名）。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `package.json` | 配置 | 47 | 包声明，导出服务接口与类型。 |
| `README.i18n.yaml` | 配置 | 58 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 136 | 包说明：原语语义、观测普遍性、错误码约定。 |
| `src/index.ts` | 源码 | 381 | `[精读]` 服务定义与抽象基类：把 provider 能力投影成 `ctx.fs`，统一错误构造与路径规范化入口。 |
| `src/types.ts` | 源码 | 226 | `[精读]` 所有原语的请求/响应形状与服务接口声明。 |
| `src/errno.ts` | 源码 | 33 | `[精读]` `FsErrorCode` 枚举与 `FsError` 类：把 Node errno 折叠成稳定错误码。 |
| `tests/errno.spec.ts` | 测试 | 30 | 被测对象：`src/errno.ts` 的 errno 映射。 |
| `tests/service.spec.ts` | 测试 | 224 | 被测对象：`src/index.ts` 的 provider 投影与错误语义。 |
| `tsconfig.json` | 配置 | 28 | TypeScript 编译配置。 |

### fs/fs-local — 宿主文件系统的本地实现

包定位：把 `ctx.fs` 落到 Node 的 `fs` 上，并处理真机差异——Windows 大小写不敏感路径与保留名（`win32.ts`），写入的原子性（临时文件 + rename）、大文件与二进制读取、目录监视。`fsio.ts` 是全部 syscall 的薄封装，`index.ts` 是 provider 装配与语义补齐。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，本地文件系统错误提示。 |
| `package.json` | 配置 | 49 | 包声明。 |
| `README.i18n.yaml` | 配置 | 61 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 151 | 包说明：原子写、Windows 处理、监视降级策略。 |
| `src/fsio.ts` | 源码 | 870 | `[精读·读入口]` Node `fs` 的 syscall 封装层：读写、rename、mkdir、rm、stat、readdir、watch，统一 errno 转换。 |
| `src/index.ts` | 源码 | 395 | `[精读]` provider 实现：实现 `FsService` 接口，处理原子写、移动回退与观测路径规范化。 |
| `src/win32.ts` | 源码 | 134 | `[精读]` Windows 专有处理：大小写不敏感比较、保留设备名、路径分隔符与 8.3 短名。 |
| `tests/filesystem.spec.ts` | 测试 | 883 | 被测对象：`src/index.ts` 的服务语义（含边界与并发）。 |
| `tests/fsio.spec.ts` | 测试 | 1087 | 被测对象：`src/fsio.ts` 的每个 syscall 与失败路径。 |
| `tests/patch-mutations.spec.ts` | 测试 | 288 | 被测对象：本地实现上的 patch 写入时序。 |
| `tests/watch.spec.ts` | 测试 | 144 | 被测对象：目录监视与事件合并。 |
| `tests/win32.spec.ts` | 测试 | 146 | 被测对象：`src/win32.ts` 的路径规则。 |
| `tsconfig.json` | 配置 | 28 | TypeScript 编译配置。 |

### fs/fs-sandbox — 文件系统收容装饰器

包定位：在真机实现外再套一层，只允许 workspace 根内的路径被访问；越界读写一律按 errno 拒绝，并在会话结束时撤销沙箱期内产生的改动（保留事务日志）。`containment.ts` 是纯判定函数，`index.ts` 是装饰器与事务账本。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，越界拒绝提示。 |
| `package.json` | 配置 | 50 | 包声明。 |
| `README.i18n.yaml` | 配置 | 67 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 137 | 包说明：收容边界、撤销语义与已知缺口。 |
| `src/containment.ts` | 源码 | 76 | `[精读]` 纯函数：判断目标路径是否位于根内（前缀/大小写/符号链接归一后的比较）。 |
| `src/index.ts` | 源码 | 181 | `[精读]` 装饰器：包装 `FsService`，对越界调用返回 `FsError`，记录写操作以便撤销。 |
| `tests/containment.spec.ts` | 测试 | 65 | 被测对象：`src/containment.ts` 的路径判定表。 |
| `tests/fs-sandbox.spec.ts` | 测试 | 338 | 被测对象：`src/index.ts` 的拒绝与撤销。 |
| `tsconfig.json` | 配置 | 30 | TypeScript 编译配置。 |

### fs/fs-patch — apply_patch 文本格式的解析与落地

包定位：把模型输出的 patch 文本解析成结构化的「文件变更」列表，再应用到 `ctx.fs`。`parse.ts` 只做语法（不做语义校验），`apply.ts` 负责按序执行与冲突处理。包内附一份 LICENSE（源自上游补丁格式实现）。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `LICENSE` | 文档 | 235 | 上游补丁格式实现的许可证文本。 |
| `package.json` | 配置 | 38 | 包声明。 |
| `README.i18n.yaml` | 配置 | 40 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 112 | 包说明：patch 文法与容错原则。 |
| `src/index.ts` | 源码 | 5 | `[精读]` 公开出口：再导出 parse/apply/types。 |
| `src/parse.ts` | 源码 | 175 | `[精读]` patch 文法解析：`*** Begin Patch` 块、增删改文件段、上下文行与 `@@` 定位。 |
| `src/apply.ts` | 源码 | 116 | `[精读]` 把解析结果落到文件系统：按块顺序应用、失败即停并回报上下文。 |
| `src/types.ts` | 源码 | 54 | `[精读]` 变更块、块类型、解析结果与错误的类型。 |
| `tests/apply.spec.ts` | 测试 | 129 | 被测对象：`src/apply.ts`。 |
| `tests/parse.spec.ts` | 测试 | 205 | 被测对象：`src/parse.ts` 的文法与错误。 |
| `tsconfig.json` | 配置 | 8 | TypeScript 编译配置（继承仓库默认）。 |

### fs/fs-observation-policy — 可观测路径策略

包定位：工具「能看到哪些路径」的策略点：默认放行 workspace 内路径，拒绝敏感目录（凭据、`.git` 内部等），并把判定理由结构化返回给工具层用于错误信息。它只管观测，不管写入。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，观测拒绝原因。 |
| `package.json` | 配置 | 43 | 包声明。 |
| `README.i18n.yaml` | 配置 | 70 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 141 | 包说明：默认策略、例外清单与配置项。 |
| `src/index.ts` | 源码 | 141 | `[精读·读入口]` 策略服务：按路径给出 allow/deny 与理由，供工具在读写前查询。 |
| `src/types.ts` | 源码 | 29 | `[结构]` 策略判定结果与配置类型。 |
| `tests/policy.spec.ts` | 测试 | 256 | 被测对象：`src/index.ts` 的判定矩阵。 |
| `tsconfig.json` | 配置 | 22 | TypeScript 编译配置。 |

### fs/tool-fs — 文件读写与补丁工具

包定位：给模型的一组文件工具（读文本/图片、写、编辑、apply_patch），每个工具都把 `ctx.fs` 的错误翻译成模型可读的提示，并把调用结果渲染成差异视图。`patch/` 子目录是补丁工具的预检-计划-执行三段式。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，工具描述与错误文案。 |
| `package.json` | 配置 | 83 | 包声明，多入口（含 patch 导出）。 |
| `README.i18n.yaml` | 配置 | 160 | 翻译配对清单（长文档，条目最多的 README）。 |
| `README.md` / `README.zh.md` | 文档 | 327 | 包说明：各工具参数、错误码对照、渲染约定。 |
| `src/index.ts` | 源码 | 103 | `[精读]` 工具注册总装：把各工具挂到 `ctx.tools`，共享 session cwd 与沙箱。 |
| `src/read.ts` | 源码 | 210 | `[结构]` 读文本工具：偏移/行数窗口、大文件提示、二进制检测。 |
| `src/read-image.ts` | 源码 | 391 | `[结构]` 读图片工具：尺寸限制、格式嗅探、编码为多模态内容。 |
| `src/read-render.ts` | 源码 | 244 | `[结构]` 读结果的渲染：带行号文本、截断标记与元信息。 |
| `src/read-target.ts` | 源码 | 34 | `[结构]` 读取目标（文件/目录/越界）的解析。 |
| `src/write.ts` | 源码 | 153 | `[结构]` 写文件工具：新建/覆盖、编码与换行保留。 |
| `src/edit.ts` | 源码 | 169 | `[结构]` 编辑工具：精确字符串替换与唯一性校验。 |
| `src/diff.ts` | 源码 | 102 | `[结构]` 文本差异计算与展示。 |
| `src/apply-patch.ts` | 源码 | 52 | `[结构]` apply_patch 工具入口：参数解析与调用 patch 流水线。 |
| `src/apply-patch-output.ts` | 源码 | 149 | `[结构]` 补丁结果的模型可见输出组装。 |
| `src/apply-patch-presentation.ts` | 源码 | 47 | `[结构]` 补丁调用的 UI 呈现（call view）。 |
| `src/mutation-result.ts` | 源码 | 21 | `[结构]` 变更类工具的统一结果类型。 |
| `src/error.ts` | 源码 | 42 | `[结构]` 工具错误到用户文案的映射。 |
| `src/image-error.ts` | 源码 | 36 | `[结构]` 图片读取失败的专门错误与提示。 |
| `src/sandbox.ts` | 源码 | 145 | `[结构]` 工具侧路径沙箱：把相对路径解析到 session cwd 并做越界检查。 |
| `src/session-cwd.ts` | 源码 | 25 | `[结构]` 会话当前工作目录的读取/切换。 |
| `src/patch/index.ts` | 源码 | 36 | `[结构]` patch 子模块出口。 |
| `src/patch/types.ts` | 源码 | 88 | `[结构]` 预检/计划/执行三段式的数据结构。 |
| `src/patch/preflight.ts` | 源码 | 157 | `[结构]` 预检：读目标、校验上下文行、检测冲突，不落盘。 |
| `src/patch/plan.ts` | 源码 | 117 | `[结构]` 计划生成：把预检结果折算为可执行的写操作序列。 |
| `src/patch/execute.ts` | 源码 | 121 | `[结构]` 执行：按计划写入并聚合结果。 |
| `tests/tools.spec.ts` | 测试 | 1259 | 被测对象：各工具（read/write/edit）的完整行为。 |
| `tests/integration.spec.ts` | 测试 | 666 | 工具与真实文件系统的集成路径。 |
| `tests/read-image.spec.ts` | 测试 | 1047 | 被测对象：`src/read-image.ts` 的格式与限制。 |
| `tests/read-render.spec.ts` | 测试 | 278 | 被测对象：`src/read-render.ts` 的渲染。 |
| `tests/apply-patch.spec.ts` | 测试 | 205 | 被测对象：`src/apply-patch.ts` 工具面。 |
| `tests/apply-patch-presentation.spec.ts` | 测试 | 66 | 被测对象：`src/apply-patch-presentation.ts`。 |
| `tests/diff.spec.ts` | 测试 | 113 | 被测对象：`src/diff.ts`。 |
| `tests/error.spec.ts` | 测试 | 43 | 被测对象：`src/error.ts`。 |
| `tests/fs-tools.e2e.ts` | 测试 | 78 | 端到端冒烟（真实 fs）。 |
| `tests/harness.ts` | 测试 | 37 | 测试脚手架：构造临时 workspace 与工具上下文。 |
| `tests/patch/preflight.spec.ts` | 测试 | 257 | 被测对象：`src/patch/preflight.ts`。 |
| `tests/patch/success.spec.ts` | 测试 | 143 | 被测对象：`src/patch/execute.ts` 的成功路径。 |
| `tests/patch/commit.spec.ts` | 测试 | 219 | 被测对象：`src/patch/plan.ts` + `execute.ts` 的提交时序。 |
| `tests/patch/resolution.spec.ts` | 测试 | 50 | 被测对象：补丁上下文定位。 |
| `tests/patch/harness.ts` | 测试 | 95 | patch 测试脚手架。 |
| `tsconfig.json` | 配置 | 63 | TypeScript 编译配置。 |

### fs/tool-fs-search — 文件名与内容检索工具

包定位：`glob`（按模式找路径）与 `grep`（按正则找内容）两个只读工具，优先走系统 ripgrep，缺失时回退到原生实现；`presentation.ts` 决定命中如何在 UI 中折叠展示。原生回退的性能基准单独放在 `glob-native.perf.ts`。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，检索工具文案。 |
| `package.json` | 配置 | 69 | 包声明。 |
| `README.i18n.yaml` | 配置 | 118 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 243 | 包说明：ripgrep 优先/回退策略、忽略规则、结果上限。 |
| `src/index.ts` | 源码 | 161 | `[精读]` 注册 glob/grep 工具并选择后端（rg 或原生）。 |
| `src/glob.ts` | 源码 | 385 | `[结构]` 原生 glob 实现：模式编译、遍历、忽略规则与符号链接处理。 |
| `src/grep.ts` | 源码 | 370 | `[结构]` 原生 grep 实现：逐文件正则扫描、二进制跳过、上下文行。 |
| `src/search-core.ts` | 源码 | 385 | `[结构]` 两个工具共享的检索内核：忽略清单、路径裁剪、结果排序与截断。 |
| `src/presentation.ts` | 源码 | 205 | `[结构]` 命中结果的 UI 呈现与摘要。 |
| `src/direct-call.ts` | 源码 | 28 | `[结构]` 绕过工具层的直接调用入口（供内部/测试使用）。 |
| `src/ripgrep.d.ts` | 配置 | 12 | `@vscode/ripgrep` 的类型声明补丁。 |
| `tests/tools.spec.ts` | 测试 | 1349 | 被测对象：glob/grep 工具的完整行为矩阵。 |
| `tests/integration.spec.ts` | 测试 | 302 | 两种后端的集成一致性。 |
| `tests/presentation.spec.ts` | 测试 | 176 | 被测对象：`src/presentation.ts`。 |
| `tests/load-path.spec.ts` | 测试 | 55 | 被测对象：ripgrep 二进制定位。 |
| `tests/rg-path.spec.ts` | 测试 | 45 | 被测对象：rg 后端路径选择。 |
| `tests/glob-native.perf.ts` | 测试 | 86 | 原生 glob 的性能基准脚本（非断言型）。 |
| `tsconfig.json` | 配置 | 51 | TypeScript 编译配置。 |

### fs/tool-str-replace-editor — 精确字符串替换编辑器

包定位：单文件、多组「old → new」精确替换工具，要求每处 old 在文件中唯一且不得重叠；全部替换在内存中校验通过后才一次写盘，避免半成品。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，编辑失败原因文案。 |
| `package.json` | 配置 | 63 | 包声明。 |
| `README.i18n.yaml` | 配置 | 79 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 149 | 包说明：唯一性/重叠/大小限制规则。 |
| `src/index.ts` | 源码 | 537 | `[精读·读入口]` 工具实现：顺序应用多组替换、重叠检测、失败回报与结果渲染。 |
| `tests/tools.spec.ts` | 测试 | 689 | 被测对象：`src/index.ts` 的规则矩阵。 |
| `tsconfig.json` | 配置 | 17 | TypeScript 编译配置。 |

### fs 组级文件

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `README.md` / `README.zh.md` | 文档 | 59 | 组级说明：服务契约、本地实现、收容、补丁内核与三个工具面的分层。 |
| `README.i18n.yaml` | 配置 | 25 | 组级 README 翻译配对清单。 |

---

## 五、packages/goal

这一组实现「目标（goal）」对象：它不是待办清单，而是一份**可被追加事件折叠出来的权威状态**——`packages/goal` 定义目标事件、fold 投影与 Remote，`goal-round-driver` 在每轮对话驱动目标推进（预算、检查点、结束判定），`tool-goal` 给模型读写目标的工具（含权限门），`command-goal` 给人类 `/goal` 命令。

### goal/goal — 目标服务、事件与投影

包定位：目标是一组追加事件（创建、进展、检查点、完成）折叠出的投影，`fold.ts` 是唯一的折叠规则，`index.ts` 负责写入、投影缓存与对外 Remote。目标状态同时影响运行时（预算提示、驱动轮次），因此本包也是 Host 与浏览器共享的领域模型来源。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，目标状态与错误文案。 |
| `package.json` | 配置 | 87 | 包声明，含 client 导出与领域类型。 |
| `README.i18n.yaml` | 配置 | 73 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 171 | 包说明：事件种类、折叠规则、投影一致性与 Remote 面。 |
| `src/index.ts` | 源码 | 652 | `[精读·读入口]` 服务主体：目标事件的追加与校验、投影缓存失效、`ctx.goal` 服务与 Remote 暴露。 |
| `src/fold.ts` | 源码 | 349 | `[精读·读入口]` 纯折叠函数：按事件序列推导状态、进展、检查点与完成度。 |
| `src/domain.ts` | 源码 | 116 | `[精读]` 领域词汇：目标状态机、事件种类与不变量断言。 |
| `src/types.ts` | 源码 | 149 | `[结构]` 线协议与内部数据的类型定义。 |
| `src/client.ts` | 源码 | 10 | `[精读]` 浏览器可用的类型/常量再导出（避免宿主依赖）。 |
| `src/runtime.ts` | 源码 | 30 | `[精读]` 运行时钩子：把目标状态变化接入 session 运行时。 |
| `tests/goal.spec.ts` | 测试 | 846 | 被测对象：`src/index.ts` + `src/fold.ts` 的行为矩阵。 |
| `tests/projection.spec.ts` | 测试 | 264 | 被测对象：投影缓存与失效。 |
| `tests/goal.e2e.ts` | 测试 | 76 | 端到端：目标写入到投影可见。 |
| `tests/fixtures/domain/goal.patch.yml` | fixture | 37 | 目标事件的 YAML 补丁样例。 |
| `tests/fixtures/domain/seed-goal.ts` | fixture | 23 | 测试用目标种子构造器。 |
| `tsconfig.json` | 配置 | 42 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 15 | 打包配置（双入口）。 |

### goal/goal-round-driver — 目标推进的轮次驱动

包定位：在每轮对话结束后判断「目标是否还需要继续」：按预算与检查点决定是否自动追加一轮、拼装提醒提示词、在收尾轮注入 wrap-up 指令。它是目标从「记录」变成「驱动」的地方。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，驱动提示与状态文案。 |
| `package.json` | 配置 | 60 | 包声明。 |
| `README.i18n.yaml` | 配置 | 67 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 139 | 包说明：驱动条件、预算、与 session 轮次的衔接。 |
| `src/index.ts` | 源码 | 484 | `[精读·读入口]` 轮次驱动：订阅轮次结束、读取目标投影、决定继续/收尾并注入提示。 |
| `src/prompt.ts` | 源码 | 26 | `[精读]` 驱动提示词的拼装模板。 |
| `tests/goal-round-driver.spec.ts` | 测试 | 1298 | 被测对象：`src/index.ts` 的驱动决策全路径（本块最大测试文件）。 |
| `tsconfig.json` | 配置 | 33 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 15 | 打包配置。 |

### goal/tool-goal — 模型读写目标的工具

包定位：给模型提供创建/更新/查询目标的工具，并带一层权限门（`authority.ts`）：并非任何会话都能改目标，需由会话来源与策略共同判定；`wrapup.ts` 负责「完成目标」时的收尾话术。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，工具描述与拒绝提示。 |
| `package.json` | 配置 | 61 | 包声明。 |
| `README.i18n.yaml` | 配置 | 79 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 162 | 包说明：工具参数、权限门规则、wrap-up 语义。 |
| `src/index.ts` | 源码 | 324 | `[精读·读入口]` 工具注册与执行：参数校验 → 权限门 → 调用 `ctx.goal` → 渲染结果。 |
| `src/authority.ts` | 源码 | 117 | `[精读]` 写权限判定：谁能改目标、依据会话来源与策略做出 allow/deny。 |
| `src/wrapup.ts` | 源码 | 41 | `[精读]` 目标完成时的收尾提示与状态整理。 |
| `tests/tool-goal.spec.ts` | 测试 | 748 | 被测对象：工具行为与权限门。 |
| `tsconfig.json` | 配置 | 39 | TypeScript 编译配置。 |

### goal/command-goal — `/goal` 命令

包定位：人类入口，用命令查看当前目标、设置或清空目标；不做轮次驱动，只调用 `ctx.goal` 并渲染状态。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 聚合行：8 个语言文件，命令用法与回执。 |
| `package.json` | 配置 | 52 | 包声明。 |
| `README.i18n.yaml` | 配置 | 64 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 140 | 包说明：子命令与输出格式。 |
| `src/index.ts` | 源码 | 198 | `[精读·读入口]` 命令解析与执行：查看/设置/清除目标，渲染投影摘要。 |
| `tests/command-goal.spec.ts` | 测试 | 347 | 被测对象：`src/index.ts` 的各子命令。 |
| `tsconfig.json` | 配置 | 27 | TypeScript 编译配置。 |

### goal 组级文件

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `README.md` / `README.zh.md` | 文档 | 52 | 组级说明：目标服务、轮次驱动、工具与命令的协作关系。 |
| `README.i18n.yaml` | 配置 | 25 | 组级 README 翻译配对清单。 |

---

## 六、packages/experimental

`experimental` 是本块的主体（2,504 个文件、63 个包），也是整个仓库最"活"的一片：绝大多数包遵循同一副骨架——`src/index.ts` 里 `export const name/inject` 再 `apply(ctx)`，通过 `ctx.tools` / `ctx.commands` / Remote / slot 向宿主贡献能力，`locale/*.json` 提供八语文案，`tests/*.spec.ts` 覆盖行为。这里出现三种形态：**功能包**（真有服务或工具实现）、**纯客户端包**（`src/index.ts` 只留一个空 `apply()` 作为 Host 标记，行为全在 `src/client`，由浏览器侧发现并加载）、**bundle 包**（`src/index.ts` 只有 `export {}`，运行时行由 `cordis.patch.yml` 声明，本质是插件清单/预设）。下文的"定位"会点明属于哪一种。

组级文件只有四个（`AGENTS.md` 与组 README 的中英双份），它们规定的是「谁能进这一组、怎么命名、怎么发布、怎么晋升」，不涉及任何运行时行为：

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `AGENTS.md` | 文档 | 10 | `[精读]` 本组强制规则：包名不得带 `experimental-` 前缀（例外集中在 `scripts/experimental-package-policy.ts`）、默认进 dsh 发布族、组外发布包与 app 不得依赖实验包（CI 查传递依赖与运行时导入）、晋升时整包迁入产品组。 |
| `README.i18n.yaml` | 配置 | 28 | 组 README 的中英翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 125 | `[精读·读中文版]` 组地图：experimental / optional / official 三种状态各自的含义、63 个包的一行职责与 ctx 键、晋升条件与流程。 |

### experimental/action-cards — 回答下方的可选动作卡片

包定位：为注册过的"卡片种类"提供统一的 `propose_action` 工具与状态机——模型提出动作、用户在卡片上点选、结果以状态通知回到会话。投影层把会话事件折成卡片视图，前端只消费投影。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，卡片状态与动作文案。 |
| `package.json` | 配置 | 79 | 包声明，导出服务、工具与 client 类型。 |
| `README.i18n.yaml` | 配置 | 67 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 137 | 包说明：卡片种类注册、动作生命周期与状态通知。 |
| `src/index.ts` | 源码 | 455 | `[精读·读入口]` 服务与工具：`propose_action` 的参数/种类校验、卡片记录追加、用户动作处理与状态广播。 |
| `src/projection.ts` | 源码 | 124 | `[结构]` 会话事件到卡片视图的投影折叠。 |
| `src/types.ts` | 源码 | 79 | `[结构]` 卡片种类、动作、状态的类型定义。 |
| `tests/act.spec.ts` | 测试 | 167 | 被测对象：`src/index.ts` 的用户动作分支。 |
| `tests/tool.spec.ts` | 测试 | 198 | 被测对象：`propose_action` 工具的校验与输出。 |
| `tests/projection.spec.ts` | 测试 | 130 | 被测对象：`src/projection.ts`。 |
| `tests/status.spec.ts` | 测试 | 71 | 被测对象：状态通知文案与快照。 |
| `tests/fixture.ts` | 测试 | 73 | 测试脚手架：注册测试用卡片种类。 |
| `tests/__snapshots__/status.spec.ts.snap` | 快照 | 11 | 状态通知快照。 |
| `tests/__snapshots__/tool.spec.ts.snap` | 快照 | 36 | 工具输出快照。 |
| `tsconfig.json` | 配置 | 24 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 15 | 打包配置（双入口）。 |

### experimental/api-speech-to-text — 语音转写的已认证客户端接口

包定位：把语音能力包在带鉴权与取消语义的 Client Remote 后面，浏览器只拿到「准备 → 转写」两件事，并在这里做 WAV 头校验，避免把非法音频透传给提供方。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，转写状态提示。 |
| `package.json` | 配置 | 66 | 包声明。 |
| `README.i18n.yaml` | 配置 | 37 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 80 | 包说明：鉴权、取消、大小限制。 |
| `src/index.ts` | 源码 | 111 | `[精读]` Remote 实现：鉴权校验、取消传播、委托 `speech-to-text` 服务转写。 |
| `src/types.ts` | 源码 | 25 | `[结构]` 目录与转写请求/结果类型。 |
| `tests/controller.spec.ts` | 测试 | 76 | 被测对象：`src/index.ts` 的鉴权与取消。 |
| `tests/wave.spec.ts` | 测试 | 28 | 被测对象：WAV 头校验（复用 speech 包的 `wave`）。 |
| `tsconfig.json` | 配置 | 24 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | 打包配置。 |

### experimental/auto-review — Auto 权限预设的逐调用 LLM 审查

包定位：`Auto` 权限下，每一次原生工具调用、每一次 PTC 内层调用在进入主体前都要过一次 LLM 审查；外层 `run_code` 传输刻意排除在外。`ask` 策略下审查拒绝会转成问用户，`never` 策略下则是终局。这是本块单文件逻辑量最大的包之一。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 3 | 插件清单补丁（声明本包在 Loader 树中的位置）。 |
| `docs/DETAIL.md` / `docs/DETAIL.zh.md` | 文档 | 1 | 详情页的多语言正文入口（内容极短，指向 README）。 |
| `docs/preview.svg` / `docs/preview.zh.svg` | 资源 | 1 | 插件市场预览图占位。 |
| `icon.svg` | 资源 | 12 | 插件图标。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 7 | 聚合行：8 个语言文件，审查结果与拒绝理由。 |
| `package.json` | 配置 | 92 | 包声明，声明 LlmRequestPurpose 扩展。 |
| `README.i18n.yaml` | 配置 | 67 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 148 | 包说明：审查时机、策略矩阵、排除项。 |
| `src/index.ts` | 源码 | 803 | `[精读·读入口与导出面]` 审查门：拦截 `tools/execute` 与 PTC 内层调用、构造审查请求、解析 LLM 判定、按 approval policy 决定询问或拒绝。 |
| `src/locales.ts` | 源码 | 69 | `[结构]` 文案 key 与多语言映射。 |
| `tests/auto-review.spec.ts` | 测试 | 2083 | 被测对象：`src/index.ts` 的策略矩阵与错误路径（单测试文件最大者之一）。 |
| `tests/auto-review.e2e.ts` | 测试 | 413 | 端到端：真实调用链上的审查拦截。 |
| `tests/fixtures/headless-reviewer.ts` | fixture | 44 | 无头审查器桩，供 e2e 使用。 |
| `tsconfig.json` | 配置 | 54 | TypeScript 编译配置。 |

### experimental/badge-skill-bundle — 「powered by dsh」徽章技能包

包定位：bundle 型插件：`src/index.ts` 只有 `export {}`，实际贡献是写进 `cordis.patch.yml` 的运行时行与一份 skill profile，让 Agent 能给文档、PR 等产出加徽章。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 3 | 运行时行声明（技能 profile 的装载位置）。 |
| `docs/DETAIL.md` / `docs/DETAIL.zh.md` | 文档 | 1 | 详情页正文入口。 |
| `docs/preview.svg` / `docs/preview.zh.svg` | 资源 | 22 | 预览图。 |
| `icon.svg` | 资源 | 6 | 图标。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 7 | 聚合行：8 个语言文件，技能名称与描述。 |
| `package.json` | 配置 | 53 | 包声明。 |
| `README.i18n.yaml` | 配置 | 37 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 79 | 包说明：徽章用法与放置位置。 |
| `src/index.ts` | 源码 | 2 | `[精读]` 空实现，仅声明这是 profile 层包。 |
| `tsconfig.json` | 配置 | 15 | TypeScript 编译配置。 |

### experimental/browser-use-chrome-devtools-mcp — 基于 Chrome DevTools MCP 的浏览器提供方

包定位：把固定版本的 `chrome-devtools-mcp` 服务注册为一种浏览器提供方；生命周期的会话归属、MCP 启动与就绪检查都交给 `browser-use-runtime`，本包只负责"指向哪个上游"。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，提供方名称与错误。 |
| `package.json` | 配置 | 60 | 包声明。 |
| `README.i18n.yaml` | 配置 | 46 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 116 | 包说明：上游版本锁定与工具暴露。 |
| `src/index.ts` | 源码 | 43 | `[精读]` 提供方注册：用 `mountSessionMcp` 挂载固定版本的 MCP 服务并校验配置。 |
| `tests/provider.spec.ts` | 测试 | 37 | 被测对象：提供方注册与配置校验。 |
| `tests/upstream.e2e.ts` | 测试 | 8 | 上游连通性冒烟（真实 MCP 进程）。 |
| `tsconfig.json` | 配置 | 21 | TypeScript 编译配置。 |

### experimental/browser-use-playwright-mcp — 基于 Playwright MCP 的浏览器提供方

包定位：与上一包同构，上游换成 `@playwright/mcp`；差异只在可执行文件定位（从包目录推导）与工具清单。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，提供方名称与错误。 |
| `package.json` | 配置 | 60 | 包声明。 |
| `README.i18n.yaml` | 配置 | 46 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 115 | 包说明：上游版本与工具暴露。 |
| `src/index.ts` | 源码 | 51 | `[精读]` 提供方注册：定位 Playwright MCP 入口并委托运行时挂载。 |
| `tests/provider.spec.ts` | 测试 | 39 | 被测对象：提供方注册。 |
| `tests/upstream.e2e.ts` | 测试 | 8 | 上游连通性冒烟。 |
| `tsconfig.json` | 配置 | 21 | TypeScript 编译配置。 |

### experimental/browser-use-runtime — 浏览器资源的会话归属

包定位：本组所有浏览器提供方共享的底座：浏览器/连接等资源属于"某一次精确的 Agent 激活"，不随会话恢复而继承；`mcp.ts` 负责 MCP 配置校验与会话级挂载，`index.ts` 提供 `SessionResources` 等归属原语。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `package.json` | 配置 | 75 | 包声明，多入口（`/mcp`）。 |
| `README.i18n.yaml` | 配置 | 37 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 96 | 包说明：资源归属、静默清理、重复宿主保护。 |
| `src/index.ts` | 源码 | 197 | `[精读]` 资源归属原语：`OwnedSessionResource`、按 Agent 激活登记与静默回收。 |
| `src/mcp.ts` | 源码 | 220 | `[精读]` 会话级 MCP 托管：配置 schema、启动/就绪、随会话销毁。 |
| `tests/resources.spec.ts` | 测试 | 360 | 被测对象：`src/index.ts` 的归属与回收。 |
| `tests/mcp.spec.ts` | 测试 | 634 | 被测对象：`src/mcp.ts` 的启动/就绪/回收。 |
| `tests/agent-disposal.spec.ts` | 测试 | 91 | 被测对象：Agent 销毁时的资源释放。 |
| `tests/host-runtime-duplication.spec.ts` | 测试 | 103 | 被测对象：同一宿主重复挂载的防护。 |
| `tests/shared-host-runtimes.spec.ts` | 测试 | 36 | 被测对象：多会话共享宿主运行时。 |
| `tests/mcp-fixture.mjs` | fixture | 70 | 测试用最小 MCP 服务。 |
| `tests/mcp-upstream.ts` | 测试 | 112 | 上游 MCP 交互桩。 |
| `tsconfig.json` | 配置 | 39 | TypeScript 编译配置。 |

### experimental/browser-use-stagehand-native — Stagehand 原生浏览器工具

包定位：Stagehand 走"原生"路线而非 MCP：每个存活会话一个浏览器运行时，模型配置单独传入；worker 三件套（`worker.ts` / `worker-rpc.ts` / `worker-client.ts`）把 Stagehand 的浏览器操作放到独立线程/进程里，避免阻塞宿主。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，工具与错误文案。 |
| `package.json` | 配置 | 75 | 包声明。 |
| `README.i18n.yaml` | 配置 | 67 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 168 | 包说明：模型配置、worker 拓扑、生命周期。 |
| `src/index.ts` | 源码 | 206 | `[精读·读入口]` 提供方主体：按会话创建 Stagehand 运行时、注册工具、接 `SessionResources`。 |
| `src/launch.ts` | 源码 | 64 | `[结构]` 浏览器启动参数与可执行文件解析。 |
| `src/native.ts` | 源码 | 168 | `[结构]` Stagehand 原生 API 适配与模型 schema。 |
| `src/worker.ts` | 源码 | 39 | `[结构]` worker 线程入口。 |
| `src/worker-client.ts` | 源码 | 90 | `[结构]` 主线程侧 worker 客户端。 |
| `src/worker-rpc.ts` | 源码 | 72 | `[结构]` worker 的 RPC 协议与序列化。 |
| `tests/provider.spec.ts` | 测试 | 422 | 被测对象：`src/index.ts` 的提供方行为。 |
| `tests/launch.spec.ts` | 测试 | 116 | 被测对象：`src/launch.ts`。 |
| `tests/launch-process.spec.ts` | 测试 | 15 | 被测对象：真实启动进程的冒烟。 |
| `tests/native.spec.ts` | 测试 | 49 | 被测对象：`src/native.ts`。 |
| `tests/native.e2e.ts` | 测试 | 256 | 端到端：真实浏览器操作。 |
| `tests/worker.spec.ts` | 测试 | 58 | 被测对象：`src/worker.ts`。 |
| `tests/worker-client.spec.ts` | 测试 | 171 | 被测对象：`src/worker-client.ts`。 |
| `tests/worker-rpc.spec.ts` | 测试 | 140 | 被测对象：`src/worker-rpc.ts`。 |
| `tests/worker-protocol.spec.ts` | 测试 | 35 | 被测对象：RPC 协议一致性。 |
| `tests/loader-composition.spec.ts` | 测试 | 131 | 组合装载测试。 |
| `tests/fixtures/stagehand.ts` | fixture | 137 | Stagehand 桩实现。 |
| `tests/fixtures/chromium.ts` | fixture | 24 | Chromium 可执行文件桩。 |
| `tests/fixtures/attachment-worker.mjs` | fixture | 36 | worker 附件样例。 |
| `tests/fixtures/built-attachment.mjs` | fixture | 33 | 构建后的附件样例。 |
| `tsconfig.json` | 配置 | 17 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 14 | 打包配置（worker 入口）。 |

### experimental/claude-code-mods — Claude Code mods 兼容桥

包定位：让用 `defineMod` 写的 Claude Code 风格 mod（hooks 模块）在 Harness 的扩展点上跑起来：把 `session.start`、`prompt.submit`、`turn.start`、`tool.call`、`turn.complete`、`session.end`、`command.run` 映射到 mod 的钩子，并给钩子一个 `$` 宿主操作面。`examples/` 下三个可直接运行的 mod 是最好的行为说明。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.source.patch.yml` | 配置 | 21 | 源码态插件清单补丁（相对发布态多出 examples 装载）。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，mod 状态与错误文案。 |
| `package.json` | 配置 | 109 | 包声明，多入口（api/define/testing）。 |
| `README.i18n.yaml` | 配置 | 85 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 222 | 包说明：钩子映射表、`$` 可用操作、加载与热重载。 |
| `src/index.ts` | 源码 | 539 | `[精读·读入口]` 服务主体：加载 mod、在扩展点抬升事件、维护会话级 mod 树。 |
| `src/engine.ts` | 源码 | 399 | `[结构]` 钩子执行引擎：按顺序调用链、短路、错误隔离。 |
| `src/chain.ts` | 源码 | 349 | `[结构]` 钩子链的编排与上下文传递。 |
| `src/host-ops.ts` | 源码 | 572 | `[结构]` 暴露给 mod 的 `$` 宿主操作面（读会话、发消息、调工具等）。 |
| `src/module.ts` | 源码 | 161 | `[结构]` mod 模块解析与加载。 |
| `src/matcher.ts` | 源码 | 118 | `[结构]` 工具名/事件名的匹配规则。 |
| `src/surfaces.ts` | 源码 | 246 | `[结构]` 可被 mod 触及的宿主表面清单。 |
| `src/elements.ts` | 源码 | 200 | `[结构]` 提示元素/上下文的构造原语。 |
| `src/api.ts` | 源码 | 219 | `[结构]` 对外 API 面（`defineMod` 与运行时接口）。 |
| `src/define-mod.ts` | 源码 | 65 | `[结构]` `defineMod` 的类型化包装。 |
| `src/testing.ts` | 源码 | 354 | `[结构]` 供 mod 作者使用的测试工具。 |
| `src/tool-names.ts` | 源码 | 45 | `[结构]` Claude Code 工具名与 Harness 工具名的映射。 |
| `src/types.ts` | 源码 | 500 | `[结构]` 钩子事件、`$` 操作与 mod 定义的完整类型。 |
| `src/values.ts` | 源码 | 46 | `[结构]` 值转换与规范化小工具。 |
| `examples/blast-radius/.claude-plugin/plugin.json` | fixture | 6 | 示例 mod 的插件元数据。 |
| `examples/blast-radius/hooks/blast-radius.mjs` | 源码 | 127 | 示例：改动影响面提示。 |
| `examples/blast-radius/hooks/blast-radius.d.mts` | 配置 | 3 | 示例 mod 的类型声明。 |
| `examples/blast-radius/hooks/hooks.json` | 配置 | 1 | 示例 mod 的钩子声明。 |
| `examples/blast-radius/index.ts` | 源码 | 12 | 示例 mod 的 Harness 侧装载入口。 |
| `examples/blast-radius/tests/blast-radius.test.ts` | 测试 | 79 | 示例 mod 的行为测试。 |
| `examples/replay-theater/.claude-plugin/plugin.json` | fixture | 6 | 示例 mod 的插件元数据。 |
| `examples/replay-theater/hooks/replay-theater.mjs` | 源码 | 133 | 示例：回放剧场。 |
| `examples/replay-theater/hooks/replay-theater.d.mts` | 配置 | 3 | 类型声明。 |
| `examples/replay-theater/hooks/hooks.json` | 配置 | 1 | 钩子声明。 |
| `examples/replay-theater/index.ts` | 源码 | 10 | 装载入口。 |
| `examples/replay-theater/tests/replay-theater.test.ts` | 测试 | 68 | 行为测试。 |
| `examples/token-weather/.claude-plugin/plugin.json` | fixture | 7 | 插件元数据。 |
| `examples/token-weather/hooks/token-weather.mjs` | 源码 | 87 | 示例：token 用量天气。 |
| `examples/token-weather/hooks/token-weather.d.mts` | 配置 | 3 | 类型声明。 |
| `examples/token-weather/hooks/hooks.json` | 配置 | 3 | 钩子声明。 |
| `examples/token-weather/index.ts` | 源码 | 13 | 装载入口。 |
| `examples/token-weather/types/index.d.ts` | 配置 | 10 | 示例类型补充。 |
| `examples/token-weather/tests/token-weather.test.ts` | 测试 | 33 | 行为测试。 |
| `tests/bridge.spec.ts` | 测试 | 1145 | 被测对象：`src/index.ts` 的桥接全链路。 |
| `tests/chain.spec.ts` | 测试 | 449 | 被测对象：`src/chain.ts`。 |
| `tests/host-ops.spec.ts` | 测试 | 340 | 被测对象：`src/host-ops.ts`。 |
| `tests/module.spec.ts` | 测试 | 244 | 被测对象：`src/module.ts`。 |
| `tests/surfaces.spec.ts` | 测试 | 144 | 被测对象：`src/surfaces.ts`。 |
| `tests/testing.spec.ts` | 测试 | 255 | 被测对象：`src/testing.ts`。 |
| `tests/define-mod.spec.ts` | 测试 | 90 | 被测对象：`src/define-mod.ts`。 |
| `tests/matcher.spec.ts` | 测试 | 58 | 被测对象：`src/matcher.ts`。 |
| `tests/elements.spec.ts` | 测试 | 54 | 被测对象：`src/elements.ts`。 |
| `tests/directory-resume.spec.ts` | 测试 | 58 | 被测对象：目录布局在会话恢复后的行为。 |
| `tests/examples.spec.ts` | 测试 | 13 | 示例 mod 的可加载性冒烟。 |
| `tests/loader-composition.spec.ts` | 测试 | 91 | 组合装载测试。 |
| `tests/fixtures/first-mod.mjs` / `.d.mts` / `.ts` | fixture | 41/3/5 | 最小 mod 样例（实现、类型、Harness 入口）。 |
| `tests/fixtures/guard-mod.mjs` / `.d.mts` / `.ts` | fixture | 20/3/5 | 带守卫逻辑的 mod 样例。 |
| `tests/fixtures/ticket-mod.mjs` / `.d.mts` / `.ts` | fixture | 30/3/5 | 工单风格 mod 样例。 |
| `tests/support/claude-code.ts` | 测试 | 12 | 测试辅助出口。 |
| `tests/support/claude-code-testing.ts` | 测试 | 83 | 测试辅助：构造 claude-code 兼容环境。 |
| `tsconfig.json` | 配置 | 66 | TypeScript 编译配置。 |

### experimental/client-ui-action-cards — 动作卡片的浏览器渲染

包定位：纯客户端包。Host 侧只有一个空 `apply()` 占位，真正的贡献是卡片框体、kind 主体与紧凑工具行；种类由 `action-cards` 服务注册，本包只按注册表渲染。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，卡片按钮文案。 |
| `package.json` | 配置 | 74 | 包声明（含 client 入口）。 |
| `README.i18n.yaml` | 配置 | 40 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 89 | 包说明：卡片框体与 kind 渲染约定。 |
| `src/index.ts` | 源码 | 4 | `[精读]` Host 标记：空 `apply()`。 |
| `src/client/index.ts` | 客户端源码 | 15 | `[精读]` 浏览器出口：注册卡片与工具行。 |
| `src/client/Card.tsx` | 客户端源码 | 150 | `[结构]` 通用卡片框体：标题、状态、动作区。 |
| `src/client/Card.module.css` | 资源 | 7 | 卡片样式。 |
| `src/client/ProposeRow.tsx` | 客户端源码 | 43 | `[结构]` `propose_action` 的紧凑工具行。 |
| `src/client/ProposeRow.module.css` | 资源 | 6 | 工具行样式。 |
| `src/client/registry.ts` | 客户端源码 | 106 | `[结构]` 卡片种类注册表：kind → 渲染器。 |
| `src/client/mount.ts` | 客户端源码 | 63 | `[结构]` 挂载点：把卡片挂到消息下方。 |
| `src/client/locales.ts` | 客户端源码 | 82 | `[结构]` 文案 key 表。 |
| `src/css-modules.d.ts` | 配置 | 4 | CSS Modules 类型声明。 |
| `tests/card.client.spec.tsx` | 测试 | 141 | 被测对象：`Card.tsx`。 |
| `tests/row.client.spec.tsx` | 测试 | 55 | 被测对象：`ProposeRow.tsx`。 |
| `tests/browser-plugin.client.spec.ts` | 测试 | 74 | 被测对象：浏览器插件的注册与发现。 |
| `tsconfig.json` | 配置 | 27 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | 打包配置。 |

### experimental/client-ui-claude-code-mods — mod 树的前端横条

包定位：纯客户端包。在输入框上方画一条"本会话的 mod 树"，并把这个横条上的按钮点击通过桥的 Remote 送回 Host（`client-ui-claude-code-mods` 只负责显示与转发）。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，横条文案。 |
| `package.json` | 配置 | 76 | 包声明（含 client 入口）。 |
| `README.i18n.yaml` | 配置 | 37 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 78 | 包说明：横条位置与交互。 |
| `src/index.ts` | 源码 | 4 | `[精读]` Host 标记：空 `apply()`。 |
| `src/client/index.ts` | 客户端源码 | 18 | `[精读]` 浏览器出口。 |
| `src/client/Band.tsx` | 客户端源码 | 130 | `[结构]` 横条主体：mod 树渲染与按钮。 |
| `src/client/Band.module.css` | 资源 | 111 | 横条样式。 |
| `src/client/mount.ts` | 客户端源码 | 131 | `[结构]` 挂载与 Remote 调用：把点击转成 Host 操作。 |
| `src/client/locales.ts` | 客户端源码 | 71 | `[结构]` 文案 key 表。 |
| `src/css-modules.d.ts` | 配置 | 5 | CSS Modules 类型声明。 |
| `tests/band.client.spec.tsx` | 测试 | 116 | 被测对象：`Band.tsx`。 |
| `tests/mount.client.spec.ts` | 测试 | 180 | 被测对象：`mount.ts` 的挂载与转发。 |
| `tsconfig.json` | 配置 | 48 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | 打包配置。 |

### experimental/client-ui-cot-translation — 思维链翻译的展示层

包定位：把「展开的推理内容」按需机器翻译后展示，原文始终保留，译文只是叠加视图；Host 侧（`src/index.ts`）做带鉴权/取消的翻译 Remote 与偏好，浏览器侧负责工具栏按钮与译文渲染。含 host/client 双 tsconfig，是本组"双端包"的样板。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，翻译按钮与状态。 |
| `package.json` | 配置 | 105 | 包声明，双入口（host/client）。 |
| `README.i18n.yaml` | 配置 | 37 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 90 | 包说明：翻译触发、原文保留、缓存。 |
| `src/index.ts` | 源码 | 102 | `[精读]` Host Remote：鉴权、取消、调用 `translator` 服务并缓存。 |
| `src/preferences.ts` | 源码 | 12 | `[精读]` 偏好项声明（开关/目标语言）。 |
| `src/types.ts` | 源码 | 28 | `[结构]` 请求/结果类型。 |
| `src/client/index.ts` | 客户端源码 | 21 | `[精读]` 浏览器出口。 |
| `src/client/translation.ts` | 客户端源码 | 114 | `[结构]` 译文获取与状态管理。 |
| `src/client/mount.ts` | 客户端源码 | 129 | `[结构]` 工具栏按钮挂载与交互。 |
| `src/client/TranslationBody.tsx` | 客户端源码 | 61 | `[结构]` 译文展示体。 |
| `src/client/Translation.module.css` | 资源 | 20 | 译文区样式。 |
| `src/client/TranslationSettings.tsx` | 客户端源码 | 67 | `[结构]` 设置项 UI。 |
| `src/client/preferences-form.ts` | 客户端源码 | 48 | `[结构]` 偏好表单 schema。 |
| `src/client/locales.ts` | 客户端源码 | 179 | `[结构]` 文案 key 表。 |
| `src/css-modules.d.ts` | 配置 | 5 | CSS Modules 类型声明。 |
| `tests/activation.host.spec.ts` | 测试 | 159 | 被测对象：Host 侧激活与偏好。 |
| `tests/controller.host.spec.ts` | 测试 | 203 | 被测对象：翻译 Remote 的鉴权/取消/缓存。 |
| `tests/mount.client.spec.ts` | 测试 | 414 | 被测对象：`mount.ts`。 |
| `tests/translation.client.spec.ts` | 测试 | 118 | 被测对象：`translation.ts`。 |
| `tests/translation-body.client.spec.tsx` | 测试 | 126 | 被测对象：`TranslationBody.tsx`。 |
| `tests/preferences-form.client.spec.tsx` | 测试 | 157 | 被测对象：`preferences-form.ts`。 |
| `tsconfig.client.json` | 配置 | 55 | 浏览器侧编译配置。 |
| `tsconfig.host.json` | 配置 | 36 | Host 侧编译配置。 |
| `tsconfig.json` | 配置 | 11 | 汇总配置（引用上面两个）。 |
| `tsdown.config.ts` | 配置 | 3 | 打包配置。 |

### experimental/client-ui-creation-recommendations — 个性化页面卡片的正文

包定位：纯客户端包。渲染"创建个性化页面"卡片的正文：选择落盘位置、展示创建进度、提供撤销/恢复；数据来自 `creation-recommendations` 的投影。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，卡片文案。 |
| `package.json` | 配置 | 67 | 包声明（含 client 入口）。 |
| `README.i18n.yaml` | 配置 | 40 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 88 | 包说明：卡片交互与撤销语义。 |
| `src/index.ts` | 源码 | 4 | `[精读]` Host 标记：空 `apply()`。 |
| `src/client/index.ts` | 客户端源码 | 2 | `[精读]` 浏览器出口（注册即生效）。 |
| `src/client/Card.tsx` | 客户端源码 | 159 | `[结构]` 卡片主体：位置选择、进度、撤销/恢复。 |
| `src/client/Card.module.css` | 资源 | 28 | 卡片样式。 |
| `src/client/mount.ts` | 客户端源码 | 28 | `[结构]` 挂载点。 |
| `src/client/info-store.ts` | 客户端源码 | 8 | `[结构]` 卡片附属信息的小型状态容器。 |
| `src/client/locales.ts` | 客户端源码 | 402 | `[结构]` 文案 key 表（本包文案最多的文件）。 |
| `src/css-modules.d.ts` | 配置 | 4 | CSS Modules 类型声明。 |
| `tests/card.client.spec.tsx` | 测试 | 265 | 被测对象：`Card.tsx`。 |
| `tests/info-store.client.spec.ts` | 测试 | 12 | 被测对象：`info-store.ts`。 |
| `tests/mount.client.spec.tsx` | 测试 | 37 | 被测对象：`mount.ts`。 |
| `tsconfig.json` | 配置 | 21 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | 打包配置。 |

### experimental/client-ui-forge — 变更请求侧栏面板

包定位：本块最大的前端包（149 个文件）。它是 Forge 的侧栏：列出会话的变更请求、逐文件 diff 与行内评论线程，支持图层（staged/unstaged/commit range）、worktree 新建会话、托管平台登录与评审提交。Host 侧 `src/index.ts` 提供 Remote，`worktree.ts`/`local-diff.ts`/`git.ts` 是真正的 Git 逻辑；`src/client` 是 80 余个组件、样式与状态模块。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，面板通用文案。 |
| `package.json` | 配置 | 136 | 包声明，host/client 双入口与子路径导出。 |
| `README.i18n.yaml` | 配置 | 37 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 170 | 包说明：面板能力、图层、worktree 流程、评审。 |
| `src/index.ts` | 源码 | 1162 | `[精读·读入口与导出面]` Host Remote 主体：checkout、代码托管、登录、变更请求与 worktree 状态，按会话隔离。 |
| `src/worktree.ts` | 源码 | 576 | `[结构]` worktree 的创建/清理/进度上报。 |
| `src/local-diff.ts` | 源码 | 438 | `[结构]` 本地改动 diff：工作区、暂存区与基线的合并视图。 |
| `src/panel.ts` | 源码 | 422 | `[结构]` 面板状态聚合与 Remote 方法。 |
| `src/layers.ts` | 源码 | 163 | `[结构]` 变更图层（修改/暂存/提交区间）的模型。 |
| `src/states.ts` | 源码 | 350 | `[结构]` 面板状态机与投影。 |
| `src/git.ts` | 源码 | 293 | `[结构]` Git 命令封装（status/diff/log/checkout）。 |
| `src/diff.ts` | 源码 | 162 | `[结构]` 统一 diff 解析为行/块。 |
| `src/parse.ts` | 源码 | 137 | `[结构]` diff 文本解析辅助。 |
| `src/wildmatch.ts` | 源码 | 121 | `[结构]` 通配符匹配（忽略规则、文件过滤）。 |
| `src/types.ts` | 源码 | 504 | `[结构]` 面板线协议与内部数据模型。 |
| `src/review-cache.ts` | 源码 | 98 | `[结构]` 评审线程的缓存与失效。 |
| `src/patch-cache.ts` | 源码 | 73 | `[结构]` 补丁/片段缓存。 |
| `src/commit-range.ts` | 源码 | 27 | `[结构]` 提交区间表示。 |
| `src/css-modules.d.ts` | 配置 | 5 | CSS Modules 类型声明。 |
| `src/client/index.ts` | 客户端源码 | 31 | `[精读]` 浏览器出口：注册侧栏标签与卡片。 |
| `src/client/ChangesTab.tsx` | 客户端源码 | 1288 | `[结构]` 主视图：变更列表、diff、评论与操作按钮（本包最大组件）。 |
| `src/client/ChangesTab.module.css` | 资源 | 984 | 主视图样式。 |
| `src/client/ChangeRequestOverview.tsx` | 客户端源码 | 620 | `[结构]` 变更请求总览：状态、检查、操作。 |
| `src/client/ChangeRequestOverview.module.css` | 资源 | 196 | 总览样式。 |
| `src/client/ChangeRequestCard.tsx` | 客户端源码 | 439 | `[结构]` 会话内变更请求卡片。 |
| `src/client/DiffFile.tsx` | 客户端源码 | 621 | `[结构]` 单文件 diff 渲染（含折叠与行选择）。 |
| `src/client/diff-rows.ts` | 客户端源码 | 199 | `[结构]` diff 行模型与虚拟化辅助。 |
| `src/client/ChangedFiles.tsx` | 客户端源码 | 144 | `[结构]` 已改文件列表。 |
| `src/client/ChangedFiles.module.css` | 资源 | 26 | 列表样式。 |
| `src/client/ChangeRequest...`（其余卡片/菜单组件） | 客户端源码 | — | 见下列各行的细分。 |
| `src/client/ForgeTab.tsx` | 客户端源码 | 263 | `[结构]` Forge 标签页容器。 |
| `src/client/ForgeTab.module.css` | 资源 | 627 | 标签页样式。 |
| `src/client/ForgeTabTitle.tsx` | 客户端源码 | 21 | `[结构]` 标签页标题。 |
| `src/client/ChangesTabTitle.tsx` | 客户端源码 | 28 | `[结构]` 变更标签页标题（含计数）。 |
| `src/client/source.ts` | 客户端源码 | 274 | `[结构]` 数据源：把 Host Remote 结果转成视图数据。 |
| `src/client/changes-store.ts` | 客户端源码 | 155 | `[结构]` 变更列表的客户端状态。 |
| `src/client/changes-address.ts` | 客户端源码 | 110 | `[结构]` 变更项寻址（文件/块/行）。 |
| `src/client/checkout.ts` | 客户端源码 | 75 | `[结构]` 检出/切换分支的前端动作。 |
| `src/client/review.ts` | 客户端源码 | 120 | `[结构]` 评审数据模型与请求。 |
| `src/client/review-queue.ts` | 客户端源码 | 256 | `[结构]` 待提交评论队列（含校验）。 |
| `src/client/review-threads.ts` | 客户端源码 | 204 | `[结构]` 评审线程数据与合并。 |
| `src/client/ReviewThreads.tsx` | 客户端源码 | 443 | `[结构]` 线程列表渲染。 |
| `src/client/ReviewThreads.module.css` | 资源 | 326 | 线程列表样式。 |
| `src/client/ReviewThread.tsx` | 客户端源码 | 96 | `[结构]` 单条线程。 |
| `src/client/ThreadList.tsx` | 客户端源码 | 165 | `[结构]` 线程导航列表。 |
| `src/client/ThreadList.module.css` | 资源 | 218 | 列表样式。 |
| `src/client/thread-state.ts` | 客户端源码 | 127 | `[结构]` 线程展开/选中状态。 |
| `src/client/ReviewComposer.tsx` | 客户端源码 | 128 | `[结构]` 评论输入框。 |
| `src/client/ReviewComposer.module.css` | 资源 | 37 | 输入框样式。 |
| `src/client/ReviewControls.tsx` | 客户端源码 | 191 | `[结构]` 评审操作按钮组。 |
| `src/client/ReviewControls.module.css` | 资源 | 162 | 按钮组样式。 |
| `src/client/SubmitReview.tsx` | 客户端源码 | 95 | `[结构]` 提交评审弹层。 |
| `src/client/SubmitReview.module.css` | 资源 | 26 | 弹层样式。 |
| `src/client/CommitMenu.tsx` | 客户端源码 | 186 | `[结构]` 提交菜单（分支/消息/选项）。 |
| `src/client/CommitMenu.module.css` | 资源 | 139 | 菜单样式。 |
| `src/client/BaseMenu.tsx` | 客户端源码 | 180 | `[结构]` 基线分支选择菜单。 |
| `src/client/BaseMenu.module.css` | 资源 | 153 | 菜单样式。 |
| `src/client/ViewOptionsMenu.tsx` | 客户端源码 | 79 | `[结构]` 视图选项菜单。 |
| `src/client/FileTreePane.tsx` | 客户端源码 | 79 | `[结构]` 文件树面板。 |
| `src/client/FileTreePane.module.css` | 资源 | 10 | 面板样式。 |
| `src/client/file-tree.ts` | 客户端源码 | 86 | `[结构]` 路径列表建树与过滤。 |
| `src/client/FileLabel.tsx` | 客户端源码 | 66 | `[结构]` 文件标签（路径省略、状态色）。 |
| `src/client/FileLabel.module.css` | 资源 | 53 | 标签样式。 |
| `src/client/WorktreeToggle.tsx` | 客户端源码 | 165 | `[结构]` worktree 开关。 |
| `src/client/WorktreeToggle.module.css` | 资源 | 132 | 开关样式。 |
| `src/client/WorktreeSettings.tsx` | 客户端源码 | 42 | `[结构]` worktree 设置项。 |
| `src/client/WorktreeSettings.module.css` | 资源 | 29 | 设置样式。 |
| `src/client/worktree-settings-form.ts` | 客户端源码 | 43 | `[结构]` 设置表单 schema。 |
| `src/client/WorktreeProgress.tsx` | 客户端源码 | 280 | `[结构]` worktree 创建进度。 |
| `src/client/WorktreeProgress.module.css` | 资源 | 226 | 进度样式。 |
| `src/client/SessionList.module.css` | 资源 | 85 | 会话列表样式。 |
| `src/client/session-list.ts` | 客户端源码 | 79 | `[结构]` 会话列表数据。 |
| `src/client/SessionRowForge.tsx` | 客户端源码 | 86 | `[结构]` 会话行上的 Forge 装饰。 |
| `src/client/SessionHoverForge.tsx` | 客户端源码 | 72 | `[结构]` 会话悬停卡片中的 Forge 摘要。 |
| `src/client/LocalChangesCard.tsx` | 客户端源码 | 83 | `[结构]` 本地改动卡片。 |
| `src/client/ActionToast.tsx` | 客户端源码 | 38 | `[结构]` 操作结果轻提示。 |
| `src/client/HeaderButton.tsx` | 客户端源码 | 68 | `[结构]` 面板头部按钮。 |
| `src/client/HeaderButton.module.css` | 资源 | 29 | 按钮样式。 |
| `src/client/RefreshGlyph.tsx` | 客户端源码 | 35 | `[结构]` 刷新图标（加载态动画）。 |
| `src/client/RefreshGlyph.module.css` | 资源 | 22 | 图标样式。 |
| `src/client/glyphs.tsx` | 客户端源码 | 151 | `[结构]` 图标集合。 |
| `src/client/status.ts` | 客户端源码 | 171 | `[结构]` 变更请求/检查状态到展示的映射。 |
| `src/client/host-viewed.ts` | 客户端源码 | 195 | `[结构]` 「已查看文件」与 Host 的同步。 |
| `src/client/viewed-files.ts` | 客户端源码 | 178 | `[结构]` 已查看文件状态。 |
| `src/client/code-selection.ts` | 客户端源码 | 53 | `[结构]` 代码选区与行号换算。 |
| `src/client/section-reach.ts` | 客户端源码 | 61 | `[结构]` 区块可达性（滚动定位）。 |
| `src/client/toolbar-fold.ts` | 客户端源码 | 70 | `[结构]` 工具栏在窄宽度下的折叠。 |
| `src/client/menu-search.ts` | 客户端源码 | 16 | `[结构]` 菜单过滤。 |
| `src/client/format.ts` | 客户端源码 | 37 | `[结构]` 时间/数量格式化。 |
| `src/client/locales.ts` | 客户端源码 | 3446 | `[结构]` 文案 key 表（全块最大的文案源文件）。 |
| `src/client/mount.ts` | 客户端源码 | 439 | `[结构]` 面板挂载：注册标签、会话行插槽与远程订阅。 |
| `tests/controller.host.spec.ts` | 测试 | 2181 | 被测对象：`src/index.ts` 的 Remote 全路径。 |
| `tests/changes-tab.client.spec.tsx` | 测试 | 2479 | 被测对象：`ChangesTab.tsx`（全块最大测试文件）。 |
| `tests/git.host.spec.ts` | 测试 | 511 | 被测对象：`src/git.ts`。 |
| `tests/worktree.host.spec.ts` | 测试 | 579 | 被测对象：`src/worktree.ts`。 |
| `tests/local-diff.host.spec.ts` | 测试 | 553 | 被测对象：`src/local-diff.ts`。 |
| `tests/local-diff-safety.host.spec.ts` | 测试 | 251 | 被测对象：diff 的越界/大文件保护。 |
| `tests/states.host.spec.ts` | 测试 | 426 | 被测对象：`src/states.ts`。 |
| `tests/states-remote.host.spec.ts` | 测试 | 211 | 被测对象：状态投影的 Remote 面。 |
| `tests/layers.host.spec.ts` | 测试 | 115 | 被测对象：`src/layers.ts`。 |
| `tests/diff.host.spec.ts` | 测试 | 178 | 被测对象：`src/diff.ts`。 |
| `tests/parse.host.spec.ts` | 测试 | 139 | 被测对象：`src/parse.ts`。 |
| `tests/wildmatch.host.spec.ts` | 测试 | 59 | 被测对象：`src/wildmatch.ts`。 |
| `tests/review.host.spec.ts` | 测试 | 257 | 被测对象：评审数据流。 |
| `tests/review-cache.host.spec.ts` | 测试 | 71 | 被测对象：`src/review-cache.ts`。 |
| `tests/patch-cache.host.spec.ts` | 测试 | 61 | 被测对象：`src/patch-cache.ts`。 |
| `tests/mount.client.spec.ts` | 测试 | 1103 | 被测对象：客户端 `mount.ts`。 |
| `tests/change-request-card.client.spec.tsx` | 测试 | 690 | 被测对象：`ChangeRequestCard.tsx`。 |
| `tests/change-request-overview.client.spec.tsx` | 测试 | 354 | 被测对象：`ChangeRequestOverview.tsx`。 |
| `tests/forge-tab.client.spec.tsx` | 测试 | 469 | 被测对象：`ForgeTab.tsx`。 |
| `tests/review.client.spec.tsx` | 测试 | 509 | 被测对象：评审交互组件。 |
| `tests/review-thread-cards.client.spec.tsx` | 测试 | 412 | 被测对象：线程卡片。 |
| `tests/review-threads.client.spec.ts` | 测试 | 138 | 被测对象：`review-threads.ts`。 |
| `tests/review-controls.client.spec.tsx` | 测试 | 270 | 被测对象：`ReviewControls.tsx`。 |
| `tests/diff-review.client.spec.tsx` | 测试 | 344 | 被测对象：diff 与评审叠加视图。 |
| `tests/diff-rows.client.spec.ts` | 测试 | 146 | 被测对象：`diff-rows.ts`。 |
| `tests/base-menu.client.spec.tsx` | 测试 | 214 | 被测对象：`BaseMenu.tsx`。 |
| `tests/file-tree.client.spec.tsx` | 测试 | 208 | 被测对象：文件树。 |
| `tests/file-label.client.spec.tsx` | 测试 | 70 | 被测对象：`FileLabel.tsx`。 |
| `tests/components.client.spec.tsx` | 测试 | 203 | 被测对象：若干小组件的合并用例。 |
| `tests/changes-address.client.spec.ts` | 测试 | 103 | 被测对象：`changes-address.ts`。 |
| `tests/code-selection.client.spec.ts` | 测试 | 75 | 被测对象：`code-selection.ts`。 |
| `tests/session-list.client.spec.tsx` | 测试 | 189 | 被测对象：会话列表。 |
| `tests/source.client.spec.ts` | 测试 | 301 | 被测对象：`source.ts`。 |
| `tests/status.client.spec.ts` | 测试 | 149 | 被测对象：`status.ts`。 |
| `tests/viewed-files.client.spec.ts` | 测试 | 134 | 被测对象：`viewed-files.ts`。 |
| `tests/host-viewed.client.spec.ts` | 测试 | 21 | 被测对象：`host-viewed.ts`。 |
| `tests/section-reach.client.spec.ts` | 测试 | 82 | 被测对象：`section-reach.ts`。 |
| `tests/toolbar-fold.client.spec.ts` | 测试 | 91 | 被测对象：`toolbar-fold.ts`。 |
| `tests/format.client.spec.ts` | 测试 | 48 | 被测对象：`format.ts`。 |
| `tests/view-options.client.spec.tsx` | 测试 | 75 | 被测对象：`ViewOptionsMenu.tsx`。 |
| `tests/worktree-progress.client.spec.tsx` | 测试 | 324 | 被测对象：`WorktreeProgress.tsx`。 |
| `tests/worktree-settings.client.spec.tsx` | 测试 | 66 | 被测对象：`WorktreeSettings.tsx`。 |
| `tests/worktree-toggle.client.spec.tsx` | 测试 | 330 | 被测对象：`WorktreeToggle.tsx`。 |
| `tests/harness.ts` | 测试 | 681 | 测试脚手架：模拟 Git 仓库与 Remote。 |
| `tests/client-fixtures.client.ts` | 测试 | 175 | 客户端测试数据。 |
| `tests/thread-fixtures.client.ts` | 测试 | 60 | 线程测试数据。 |
| `tests/fonts-dom.client.ts` | 测试 | 11 | jsdom 字体测量桩。 |
| `tsconfig.client.json` | 配置 | 85 | 浏览器侧编译配置。 |
| `tsconfig.host.json` | 配置 | 86 | Host 侧编译配置。 |
| `tsconfig.json` | 配置 | 11 | 汇总配置。 |
| `tsdown.config.ts` | 配置 | 3 | 打包配置。 |

### experimental/client-ui-plugin-recommendations — 官方插件推荐卡片

包定位：纯客户端包。把插件市场条目渲染成会话内卡片：目录文案 + 一键启用；启用动作走 Host Remote，卡片本身无状态机。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，卡片文案。 |
| `package.json` | 配置 | 72 | 包声明（含 client 入口）。 |
| `README.i18n.yaml` | 配置 | 37 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 82/81 | 包说明：卡片内容与启用流程。 |
| `src/index.ts` | 源码 | 4 | `[精读]` Host 标记：空 `apply()`。 |
| `src/client/index.ts` | 客户端源码 | 13 | `[精读]` 浏览器出口。 |
| `src/client/Card.tsx` | 客户端源码 | 159 | `[结构]` 卡片主体：目录文本与启用按钮。 |
| `src/client/Card.module.css` | 资源 | 13 | 卡片样式。 |
| `src/client/mount.ts` | 客户端源码 | 49 | `[结构]` 挂载点。 |
| `src/client/locales.ts` | 客户端源码 | 234 | `[结构]` 文案 key 表。 |
| `src/css-modules.d.ts` | 配置 | 4 | CSS Modules 类型声明。 |
| `tests/card.client.spec.tsx` | 测试 | 242 | 被测对象：`Card.tsx`。 |
| `tests/browser-plugin.client.spec.tsx` | 测试 | 66 | 被测对象：浏览器插件注册。 |
| `tsconfig.json` | 配置 | 54 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | 打包配置。 |

### experimental/client-ui-stats — 每轮/每步的上下文与耗时统计视图

包定位：纯客户端包，但逻辑量很大：从会话事件流折叠出每轮、每步的 token、缓存命中、耗时与工具成本，渲染成可排序表格并作为"实验性会话视图"挂入。`stats-fold.ts` 是折叠核心，`StatsTable.tsx`（1908 行）是渲染核心，`stats-contract.ts` 固定事件契约。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，表头与提示。 |
| `package.json` | 配置 | 83 | 包声明（含 client 入口）。 |
| `README.i18n.yaml` | 配置 | 43 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 121 | 包说明：指标口径、缓存与成本估算方式。 |
| `src/index.ts` | 源码 | 4 | `[精读]` Host 标记：空 `apply()`。 |
| `src/client/index.ts` | 客户端源码 | 127 | `[精读]` 浏览器出口：注册视图与数据订阅。 |
| `src/client/stats-contract.ts` | 客户端源码 | 311 | `[结构]` 事件契约：从哪些会话事件、哪些字段取数。 |
| `src/client/stats-fold.ts` | 客户端源码 | 706 | `[结构]` 折叠核心：事件流 → 每轮/每步指标。 |
| `src/client/stats-aggregate.ts` | 客户端源码 | 487 | `[结构]` 汇总：分组合计、均值、分位。 |
| `src/client/stats-definition.ts` | 客户端源码 | 314 | `[结构]` 指标列定义（名称、单位、格式化）。 |
| `src/client/stats-event.ts` | 客户端源码 | 182 | `[结构]` 事件读取与归一化。 |
| `src/client/stats-compaction.ts` | 客户端源码 | 121 | `[结构]` 上下文压缩步的识别与统计。 |
| `src/client/stats-format.ts` | 客户端源码 | 157 | `[结构]` 数值格式化（token/毫秒/金额）。 |
| `src/client/stats-totals.ts` | 客户端源码 | 40 | `[结构]` 总计行计算。 |
| `src/client/stats-usage.ts` | 客户端源码 | 69 | `[结构]` 用量数据结构。 |
| `src/client/stats-snapshot-builder.ts` | 客户端源码 | 57 | `[结构]` 快照构造（供表格渲染）。 |
| `src/client/StatsTable.tsx` | 客户端源码 | 1908 | `[结构]` 表格渲染：分组、列宽、粘性表头、展开行。 |
| `src/client/StatsView.tsx` | 客户端源码 | 317 | `[结构]` 视图容器：筛选、刷新与空态。 |
| `src/client/stats.module.css` | 资源 | 965 | 表格与视图样式。 |
| `src/client/locales.ts` | 客户端源码 | 1474 | `[结构]` 文案 key 表。 |
| `src/css-modules.d.ts` | 配置 | 6 | CSS Modules 类型声明。 |
| `tests/stats-fold.client.spec.ts` | 测试 | 1446 | 被测对象：`stats-fold.ts`。 |
| `tests/stats-metrics.client.spec.ts` | 测试 | 703 | 被测对象：指标口径与聚合。 |
| `tests/stats-plugin.client.spec.ts` | 测试 | 1259 | 被测对象：插件注册与数据订阅。 |
| `tests/stats-view.client.spec.tsx` | 测试 | 2091 | 被测对象：`StatsView.tsx` + `StatsTable.tsx`。 |
| `tests/stats-totals.client.spec.ts` | 测试 | 74 | 被测对象：`stats-totals.ts`。 |
| `tsconfig.json` | 配置 | 27 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | 打包配置。 |

### experimental/client-ui-voice-input — 语音输入

包定位：纯客户端包。录音 → 波形反馈 → 调转写 → 把识别文本插入可编辑草稿；包含麦克风选择、权限准备、失败文案与设置引导。音频采集在 `audio.ts`，UI 状态在 `mount.ts`。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，录音与错误文案。 |
| `package.json` | 配置 | 86 | 包声明（含 client 入口）。 |
| `README.i18n.yaml` | 配置 | 37 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 82 | 包说明：录音流程、设备与权限。 |
| `src/index.ts` | 源码 | 3 | `[精读]` Host 标记：空 `apply()`。 |
| `src/client/index.ts` | 客户端源码 | 15 | `[精读]` 浏览器出口。 |
| `src/client/audio.ts` | 客户端源码 | 188 | `[结构]` 录音：MediaRecorder、WAV 编码、电平采样。 |
| `src/client/mount.ts` | 客户端源码 | 77 | `[结构]` 挂载与状态编排。 |
| `src/client/VoiceInput.tsx` | 客户端源码 | 182 | `[结构]` 输入框旁的录音按钮与主交互。 |
| `src/client/VoiceInput.module.css` | 资源 | 55 | 样式。 |
| `src/client/MicrophonePicker.tsx` | 客户端源码 | 140 | `[结构]` 麦克风设备选择。 |
| `src/client/PreparationCard.tsx` | 客户端源码 | 165 | `[结构]` 转写准备/等待卡片。 |
| `src/client/VoiceSetupDialog.tsx` | 客户端源码 | 32 | `[结构]` 首次设置对话框。 |
| `src/client/VoiceSetupPrompt.tsx` | 客户端源码 | 27 | `[结构]` 设置提示条。 |
| `src/client/Waveform.tsx` | 客户端源码 | 33 | `[结构]` 波形可视化。 |
| `src/client/readiness.ts` | 客户端源码 | 40 | `[结构]` 就绪判定（权限/设备/服务）。 |
| `src/client/microphone-device.ts` | 客户端源码 | 20 | `[结构]` 设备枚举与偏好保存。 |
| `src/client/failure-text.ts` | 客户端源码 | 15 | `[结构]` 失败原因文案。 |
| `src/client/locales.ts` | 客户端源码 | 834 | `[结构]` 文案 key 表。 |
| `src/css-modules.d.ts` | 配置 | 5 | CSS Modules 类型声明。 |
| `tests/audio.client.spec.ts` | 测试 | 194 | 被测对象：`audio.ts`。 |
| `tests/audio-fixture.client.ts` | 测试 | 53 | 音频测试数据。 |
| `tests/microphone-picker.client.spec.tsx` | 测试 | 466 | 被测对象：`MicrophonePicker.tsx`。 |
| `tests/mount.client.spec.ts` | 测试 | 181 | 被测对象：`mount.ts`。 |
| `tests/preparation.client.spec.tsx` | 测试 | 226 | 被测对象：`PreparationCard.tsx`。 |
| `tests/readiness.client.spec.ts` | 测试 | 61 | 被测对象：`readiness.ts`。 |
| `tests/setup-prompt.client.spec.tsx` | 测试 | 61 | 被测对象：`VoiceSetupPrompt.tsx`。 |
| `tests/voice-input.client.spec.tsx` | 测试 | 398 | 被测对象：`VoiceInput.tsx`。 |
| `tests/waveform.client.spec.tsx` | 测试 | 26 | 被测对象：`Waveform.tsx`。 |
| `tsconfig.json` | 配置 | 60 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | 打包配置。 |

### experimental/computer-use-cua-driver-mcp — 通过 Cua Driver MCP 的电脑操作

包定位：独占式电脑操作提供方之一，走已安装的 Cua Driver MCP 可执行文件；发现、执行、图像准入与重连都由 MCP 客户端负责，本包只做提供方注册与生命周期绑定。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，提供方提示。 |
| `package.json` | 配置 | 58 | 包声明。 |
| `README.i18n.yaml` | 配置 | 55 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 126 | 包说明：可执行文件要求、独占语义。 |
| `src/index.ts` | 源码 | 71 | `[精读]` 提供方注册与 fiber 绑定：启动 MCP、随会话销毁、图像准入配置。 |
| `tests/composition.spec.ts` | 测试 | 200 | 组合装载测试。 |
| `tests/lifecycle.spec.ts` | 测试 | 126 | 被测对象：`src/index.ts` 的生命周期。 |
| `tests/installed-driver.e2e.ts` | 测试 | 72 | 端到端：真实驱动进程。 |
| `tests/fixtures/driver.mjs` | fixture | 49 | 驱动桩。 |
| `tsconfig.json` | 配置 | 14 | TypeScript 编译配置。 |

### experimental/computer-use-cua-driver-native — 内嵌 Cua Driver 原生 SDK

包定位：同一能力的"原生"路线：进程内嵌 Cua Driver SDK 并自己暴露工具，不走 MCP；取消传播与 provider 注册是主要逻辑。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，提供方提示。 |
| `package.json` | 配置 | 64 | 包声明。 |
| `README.i18n.yaml` | 配置 | 70 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 144 | 包说明：原生 SDK 版本、工具面、取消语义。 |
| `src/index.ts` | 源码 | 138 | `[精读]` 提供方实现：创建原生驱动、注册工具、传播取消。 |
| `tests/provider.spec.ts` | 测试 | 229 | 被测对象：`src/index.ts`。 |
| `tests/cancellation.spec.ts` | 测试 | 88 | 被测对象：取消传播。 |
| `tests/loader-composition.spec.ts` | 测试 | 129 | 组合装载测试。 |
| `tests/native.e2e.ts` | 测试 | 53 | 端到端：真实原生驱动。 |
| `tests/fixtures/cua-driver.ts` | fixture | 93 | 原生驱动桩。 |
| `tsconfig.json` | 配置 | 16 | TypeScript 编译配置。 |

### experimental/cot-translation-bundle — 思维链翻译的 bundle

包定位：bundle 型插件，把 `translator` + `client-ui-cot-translation` 等行组合成一个可一键安装的预设，自身只有清单与市场元数据。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 8 | 运行时行声明（组合本能力所需插件）。 |
| `docs/DETAIL.md` / `docs/DETAIL.zh.md` | 文档 | 1 | 详情页正文入口。 |
| `docs/preview.svg` / `docs/preview.zh.svg` | 资源 | 1 | 预览图占位。 |
| `icon.svg` | 资源 | 16 | 图标。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 7 | 聚合行：8 个语言文件，bundle 名称与描述。 |
| `package.json` | 配置 | 56 | 包声明。 |
| `README.i18n.yaml` | 配置 | 37 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 81 | 包说明：包含哪些能力。 |
| `src/index.ts` | 源码 | 2 | `[精读]` 空实现，仅声明 bundle 层。 |
| `tsconfig.json` | 配置 | 15 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | 打包配置。 |

### experimental/creation-recommendations — 从对话需求创建持久界面插件

包定位：当用户表达明确的界面需求时，模型通过 `create_personalized_page` 卡片提议，用户点击后真正在磁盘上生成一个可独立安装的插件（含 bundle 产物与落位选择），支持撤销/恢复。`references/` 与 `skills/` 是给模型看的位置说明与技能定义。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `icon.svg` | 资源 | 9 | 插件图标。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 聚合行：8 个语言文件，卡片与状态文案。 |
| `package.json` | 配置 | 75 | 包声明。 |
| `README.i18n.yaml` | 配置 | 49 | 翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 130 | 包说明：提议 → 落位 → 生成 → 撤销的完整流程。 |
| `references/main-page.md` | 文档 | 7 | 可落位点说明：主页面。 |
| `references/session-tab.md` | 文档 | 7 | 可落位点说明：会话标签页。 |
| `references/sidebar-entry.md` | 文档 | 7 | 可落位点说明：侧栏入口。 |
| `references/sidebar-right.md` | 文档 | 9 | 可落位点说明：右侧栏。 |
| `skills/personalized-pages.md` | 文档 | 64 | 技能定义：教模型如何写这类页面插件。 |
| `src/index.ts` | 源码 | 385 | `[精读·读入口]` 工具与流程：校验提议、确认落位、拷贝 bundle 到目标目录、记录撤销信息。 |
| `src/generated-bundle.ts` | 源码 | 92 | `[结构]` 生成产物（bundle 文件集合）的构造。 |
| `src/skill.ts` | 源码 | 36 | `[结构]` 技能资源的装载。 |
| `src/types.ts` | 源码 | 38 | `[结构]` 提议/落位/结果类型。 |
| `tests/creation.spec.ts` | 测试 | 745 | 被测对象：`src/index.ts` 全流程。 |
| `tests/generated-bundle.spec.ts` | 测试 | 120 | 被测对象：`src/generated-bundle.ts`。 |
| `tests/status-context.spec.ts` | 测试 | 142 | 被测对象：状态上下文渲染。 |
| `tests/loader-composition.spec.ts` | 测试 | 141 | 组合装载测试。 |
| `tests/fixture.ts` | 测试 | 118 | 测试脚手架：临时目标目录。 |
| `tests/__snapshots__/creation.spec.ts.snap` | 快照 | 112 | 生成产物清单快照。 |
| `tests/__snapshots__/status-context.spec.ts.snap` | 快照 | 11 | 状态上下文快照。 |
| `tsconfig.json` | 配置 | 29 | TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 15 | 打包配置。 |


### experimental/cua — 平台无关的 Computer Use 工具与授权层

包定位：把「电脑操作」抽象成一套与平台无关的方法面（列应用、选窗口、读无障碍树、截图、注入输入），并统一承载原生 helper 的连接与协议、应用同意/系统权限、钩子式工具注册。它由四块组成：协议与对象 facade（`protocol.ts`/`api.ts`/`types.ts`）、原生传输与观测（`native-client.ts`/`native-observation.ts`/`coordinates.ts`）、授权（`permission-store.ts`/`application-access.ts`/`access.ts`）、装配（`index.ts`/`tool-registration.ts`）。macOS 与 Windows 提供方各自只提供原生 helper 与配置，通过 `installCua` 接入这里；浏览器侧权限页是本包的可选 Client 贡献。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/*.json` | 多语言 | 6 | `[结构]` 聚合行：8 个语言文件，只有插件页 `meta.title`/`meta.description`（Computer Use service 及其一句话说明），不含运行时文案。 |
| `package.json` | 配置 | 190 | `[结构]` 包声明；按子路径导出 `./config`、`./guidance`、`./remote`、`./native-build`、`./native-client` 等，使平台提供方复用同一套配置字段与原生客户端。 |
| `README.i18n.yaml` | 文档 | 49 | `[结构]` 中英 README 逐节哈希记录，供 `verify-translation-pairing` 校验双语改动是否同步。 |
| `README.md` / `README.zh.md` | 文档 | 167 | `[结构]` 包参考文档：方法语义、授权模型、平台接入方式与已知限制。 |
| `src/access.ts` | 源码 | 180 | `[精读]` 定义 `CuaAccess`（Typert Remote 服务），向浏览器暴露系统权限观测/申请/打开设置与应用授权列表/撤销；把权限请求按 provider 传入的函数翻译成原生参数。 |
| `src/access-types.ts` | 源码 | 35 | `[精读]` 客户端安全的权限类型：darwin（辅助功能 + 屏幕录制 + helper/parent 进程 + 责任应用）与 windows（会话锁定、截图可用、提权）两个分支的观测形状，以及已授权/已拒绝应用列表。 |
| `src/api.ts` | 源码 | 251 | `[精读]` 对象 facade：把方法调用包成 `Request` 校验后交给 dispatch，并把 Zod 校验错误压平成模型可读的「字段: 原因」文案。 |
| `src/application-access.ts` | 源码 | 341 | `[精读]` 应用同意的核心：先做原生身份准入，再按会话/持久作用域向用户提问，为每个 Agent 维护 handle→选择记录，并在每次操作前校验撤销代数与生命周期。 |
| `src/application-types.ts` | 源码 | 14 | `[精读]` 应用身份 digest（`CuaApplicationId`）与展示用授权记录（名称、可执行路径）。 |
| `src/bridge.ts` | 源码 | 16 | `[精读]` 把保留的 app/window 对象接到「当前」工具执行绑定的 `tools.cua` 上，自身不持有求值器生命周期。 |
| `src/client/ApplicationApproval.tsx` | 客户端源码 | 47 | `[精读]` 复用现有待回答交互通道渲染 Computer Use 授权卡片，只挑选 `cua-app-access`/`cua-mouse-control` 两个问题 id，不新建请求生命周期。 |
| `src/client/controller.ts` | 客户端源码 | 146 | `[结构]` 权限页的查询投影：串行化动作、管理操作期间暂停读取、丢弃过期或已销毁的响应，并把失败保留为「上次观测」而非当前值。 |
| `src/client/index.ts` | 客户端源码 | 15 | `[精读]` 客户端入口：把权限 UI 绑定到生成的 Remote 贡献。 |
| `src/client/locales.ts` | 客户端源码 | 436 | `[结构]` 权限页与引导的 8 语言产品文案（风险提示、Windows 桌面状态、默认模式设置、撤销流程等）。 |
| `src/client/mount.ts` | 客户端源码 | 82 | `[精读]` 把可选 Remote 与权限面板/引导/Toast 挂到既有插件页与 overlay 插槽，返回两者的清理函数。 |
| `src/client/PermissionPanel.module.css` | 客户端源码 | 55 | `[结构]` 权限面板的局部样式。 |
| `src/client/PermissionPanel.tsx` | 客户端源码 | 261 | `[结构]` 权限状态面板：系统权限行、应用授权列表（含撤销）、默认模式/PTC 持久化设置与引导/Toast 三类导出组件。 |
| `src/config.ts` | 源码 | 53 | `[精读]` 共享 Schemastery 字段：构建/连接/截图/AX/粘贴超时与字节上限、点击拖拽节奏、AX 遍历默认值；`standaloneRunCode` 复用 Node PTC 运行时配置但禁掉 `executionMode` 与 `scriptPersistence`。 |
| `src/coordinates.ts` | 源码 | 77 | `[精读]` `CuaCoordinates`：按窗口记录当前几何与最近一次成功截图的像素尺寸，把截图像素或 0–999 千分比换算成原生窗口坐标，窗口关闭或尺寸变化即失效。 |
| `src/css-modules.d.ts` | 源码 | 4 | `[精读]` 为 `*.module.css` 导入提供类型声明。 |
| `src/guidance.ts` | 源码 | 62 | `[精读]` `COMMON_GUIDANCE`：模型可见的 cua 方法目录（观测、鼠标、键盘），写明「dispatch 不等于成功」「拒绝后不得绕道」等规则；`withSystemPointerGuidance` 追加物理指针说明。 |
| `src/index.ts` | 源码 | 389 | `[精读·读入口与导出面]` 装配入口，四段：`CuaConfig`/`CuaBackend` 声明 / 按 Agent 的 owner（原生客户端、坐标缓存、in-flight 登记与关闭清理）/ 操作分发（`getApp` 先过应用准入、截图走准入与尺寸校验、`paste` 加跨进程文件锁）/ `cua` 工具定义与末尾的空 `apply` 标记（可选 Client 贡献）。 |
| `src/locales.ts` | 源码 | 105 | `[结构]` 应用授权提问的 8 语言文案（question/detail/approve），供用户提问通道使用。 |
| `src/mouse-control.ts` | 源码 | 63 | `[精读]` 显式物理指针移动的会话级批准：每个 Agent 只在内存里记住一次，子智能体直接以 `MOUSE_CONTROL_UNAVAILABLE` 拒绝。 |
| `src/mouse-control-locales.ts` | 源码 | 23 | `[精读]` 鼠标控制授权提问的 8 语言文案，说明允许后指针会立即移动、选择在会话内有效。 |
| `src/native-build.ts` | 源码 | 71 | `[结构]` 受管原生编译：判断当前目录是否位于 DSH 源码检出内（决定能否就地编译）、用文件锁串行化写同一批中间产物的编译。 |
| `src/native-client.ts` | 源码 | 384 | `[结构]` Agent 作用域的 JSONL 原生客户端，按模块说明与导出面归纳为四段：握手（ready/refusal 与 runtimeKey 校验）/ 请求-响应配对与取消 / 截图诊断帧与错误码 / 连接清理与失败合并。 |
| `src/native-observation.ts` | 源码 | 33 | `[精读]` Host 侧解码原生窗口观测：剔除 `cacheOnly` 记录但保留其几何供坐标换算，并校验应答确实属于请求的 app/window。 |
| `src/native-schema.ts` | 源码 | 84 | `[精读]` 从共享 `Request` 联合派生原生 wire JSON Schema 及字段/枚举准入表，供构建期校验原生端解析器是否同步。 |
| `src/permission-store.ts` | 源码 | 129 | `[精读]` profile 级应用同意存储（storage-domain）：每应用一个撤销代数 + 按会话决定 + `always` 决定，含旧 `allowedApps` 一次性迁移与键一致性校验。 |
| `src/protocol.ts` | 源码 | 189 | `[精读]` 所有原生请求/应答的 Zod 契约：`Request` 联合、`SystemPointerRequest`、资源参数、`AppResult`/`WindowsResult`/`ScreenshotResult`/`CapabilitiesResult` 等，工具准入与 facade 共用同一份定义。 |
| `src/remote-types.ts` | 源码 | 3 | `[精读]` 为 Typert 生成的客户端声明而重导出的 Remote 边界类型。 |
| `src/tool-registration.ts` | 源码 | 152 | `[精读]` 为配置的 PTC preset 注册原始 `cua`，为其他 preset 注册 `cua_run_code` 程序工具（独立 Node PTC 运行时 + 程序桥），并注入 `TOOL_COMPUTER_USE` 系统提示段。 |
| `src/types.ts` | 源码 | 266 | `[结构]` 平台无关的对象模型：`CuaAppHandle`/`CuaSnapshotId`/`CuaElementId` 品牌类型、`CuaOperation`/`CuaDispatch`、App/Window/Api 接口。 |
| `tests/access.spec.ts` | 测试 | 539 | `[结构]` 被测对象：`src/access.ts` 的权限查询、申请、打开设置与撤销。 |
| `tests/agent-scopes.spec.ts` | 测试 | 404 | `[结构]` 被测对象：`src/application-access.ts` 的按 Agent 作用域与并发选择隔离。 |
| `tests/api.spec.ts` | 测试 | 1047 | `[结构]` 被测对象：`src/api.ts` 的对象 facade 方法面与参数校验文案。 |
| `tests/application-access.spec.ts` | 测试 | 562 | `[结构]` 被测对象：`src/application-access.ts` 的同意流程、撤销与生命周期。 |
| `tests/application-approval.client.spec.tsx` | 测试 | 103 | `[结构]` 被测对象：`src/client/ApplicationApproval.tsx` 的卡片选择与渲染。 |
| `tests/bridge.spec.ts` | 测试 | 77 | `[结构]` 被测对象：`src/bridge.ts` 的绑定转发。 |
| `tests/controller.client.spec.ts` | 测试 | 398 | `[结构]` 被测对象：`src/client/controller.ts` 的查询竞态与动作串行化。 |
| `tests/coordinates.spec.ts` | 测试 | 115 | `[结构]` 被测对象：`src/coordinates.ts` 的像素/千分比换算与失效。 |
| `tests/exports.built.e2e.ts` | 测试 | 18 | `[结构]` 被测对象：构建产物的公开导出面（消费 `lib/`）。 |
| `tests/export-types.spec.ts` | 测试 | 37 | `[结构]` 被测对象：包导出的类型面是否完整。 |
| `tests/fixtures/exports.mjs` | fixture | 30 | `[结构]` 供 `exports.built.e2e.ts` 在 Node 中导入构建产物，列出期望导出。 |
| `tests/fixtures/permission-store-worker.ts` | fixture | 18 | `[结构]` 供 `permission-store.spec.ts` 在独立 worker 中并发读写存储。 |
| `tests/mount.client.spec.ts` | 测试 | 214 | `[结构]` 被测对象：`src/client/mount.ts` 的插槽注册与清理。 |
| `tests/native-build.spec.ts` | 测试 | 42 | `[结构]` 被测对象：`src/native-build.ts` 的编译准入判断。 |
| `tests/native-client.spec.ts` | 测试 | 784 | `[结构]` 被测对象：`src/native-client.ts` 的握手、请求配对、取消与错误码。 |
| `tests/native-schema.spec.ts` | 测试 | 63 | `[结构]` 被测对象：`src/native-schema.ts` 生成的 wire schema。 |
| `tests/panel.client.spec.tsx` | 测试 | 479 | `[结构]` 被测对象：`src/client/PermissionPanel.tsx` 的权限行、应用列表与设置项。 |
| `tests/permission-fixture.ts` | fixture | 47 | `[结构]` 权限相关测试共用的观测数据与假存储。 |
| `tests/permission-store.spec.ts` | 测试 | 178 | `[结构]` 被测对象：`src/permission-store.ts` 的决定记录、撤销与迁移。 |
| `tests/protocol.spec.ts` | 测试 | 252 | `[结构]` 被测对象：`src/protocol.ts` 的请求/应答契约。 |
| `tests/run-code-composition.spec.ts` | 测试 | 276 | `[结构]` 被测对象：`src/tool-registration.ts` 的 `cua_run_code` 组合与 preset 选择。 |
| `tsconfig.client.json` | 配置 | 65 | `[精读]` 客户端面的 TypeScript 编译配置（DOM/JSX）。 |
| `tsconfig.host.json` | 配置 | 88 | `[精读]` Host 面的 TypeScript 编译配置（Node/服务端）。 |
| `tsconfig.json` | 配置 | 11 | `[精读]` 引用式根配置，聚合 host 与 client 两个 project。 |
| `tsdown.config.ts` | 配置 | 14 | `[精读]` 打包配置：同时产出 Host 入口、`bridge` 入口与客户端入口。 |

### experimental/cua-bundle — 按平台装配 Computer Use 的组合包

包定位：解决「同一份安装要在 macOS / Windows 上都能开关 Computer Use」的问题——包本身没有运行时代码，全靠 `cordis.patch.yml` 在加载时按 `process.platform` 决定插入哪个原生提供方，并同时插入共享的提供方注册表与浏览器权限页。默认关闭，出现在受支持 Host 的实验性插件列表中；关闭时不构建本机组件、不注册 CUA 工具也不注入模型指引。它与 `cua`（共享实现）、`cua-macos`、`cua-windows`（原生提供方）构成三层：组合包选边，平台包写原生，共享包出协议。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 15 | `[结构]` 运行时行：插入 `cua-provider-registry`（`dsh-computer-use`）与 `ui-cua`（`dsh-cua` 的浏览器权限页），并按平台插入原生提供方——`cua`（macOS）在非 darwin 时 `disabled`，`cua-windows` 在非 win32 时 `disabled`，两者都把 `agentPreset` 固定为 `ptc`。 |
| `docs/DETAIL.md` | 文档 | 3 | `[结构]` 插件页展开详情：Windows npm 安装需另配 helper（解压完整 ZIP 并把 `helperPath` 指向 exe），附一张备注写入 macOS Notes 的截图。 |
| `docs/DETAIL.zh.md` | 文档 | 3 | `[结构]` 上述详情的中文版。 |
| `docs/preview.svg` | 资源 | 33 | `[结构]` 插件页预览图（英文）。 |
| `docs/preview.zh.svg` | 资源 | 33 | `[结构]` 插件页预览图（中文）。 |
| `icon.svg` | 资源 | 35 | `[结构]` 插件图标。 |
| `locale/*.json` | 多语言 | 7 | `[结构]` 聚合行：8 个语言文件，只有插件页 `meta.title`/`meta.description`/`meta.detail` 三项，`detail` 指向 `docs/DETAIL*.md`。 |
| `package.json` | 配置 | 65 | `[结构]` 包声明；`bundle` 类型声明与 `cordis.patch.yml` 一起让加载器在启用时套用上面的平台行。 |
| `README.i18n.yaml` | 文档 | 46 | `[结构]` 中英 README 逐节哈希，供双语同步校验。 |
| `README.md` / `README.zh.md` | 文档 | 99 | `[结构]` 组合包文档：如何从插件页开启、PTC 与其他 preset 分别暴露 `cua` 与 `cua_run_code`、平台限制。 |
| `src/index.ts` | 源码 | 2 | `[结构]` 空入口（`export {}`）：包的全部行为由 `cordis.patch.yml` 决定，源码只满足加载器对 ESM 入口的要求。 |
| `tests/platform.spec.ts` | 测试 | 36 | `[结构]` 被测对象：`cordis.patch.yml` 的平台选择——直接在 darwin/win32/linux 上加载补丁行，断言 macOS 提供方只在 darwin 被导入、Windows 提供方只在 win32 被导入，共享注册表与权限页始终导入。 |
| `tsconfig.json` | 配置 | 15 | `[结构]` 包的 TypeScript 编译配置。 |

### experimental/cua-macos — macOS 原生 CUA 提供方

包定位：把 `cua` 的平台无关对象模型落到 macOS 的真实实现上。由四块组成：TS 侧的提供方装配（`src/index.ts` 声明能力矩阵与配置上限，`src/shared-native.ts` 维护每个 Agent 到 per-user 截图 daemon 的字节连接），Swift helper（`native/Sources/CuaNative`，AppKit 事件循环 + ScreenCaptureKit 截图 + AX 树遍历 + CGEvent 输入），构建与发布脚本（`native/build_app.py` 生成不可变 `.app` 代际并签名），以及三层测试（Swift Testing、可选的人工 GUI e2e、TS 集成）。与 `cua` 的关系是「实现 ↔ 契约」：配置字段、wire 协议 schema 与错误码都由共享包给出。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `examples/macos.cordis.yml` | 配置 | 9 | `[结构]` 示例 loader 覆盖行：插入提供方注册表与本包，`agentPreset: false`（只出原始 `cua`），helper 路径取自 `DSH_CUA_HELPER`。 |
| `examples/persistent-ptc.cordis.yml` | 配置 | 7 | `[结构]` 示例：把 PTC 运行时切成 `persistent-in-memory` 并切换工具执行器，供调试持久程序。 |
| `locale/*.json` | 多语言 | 6 | `[结构]` 聚合行：8 个语言文件，只有插件页 `meta.title`/`meta.description` 两项文案。 |
| `native/.gitignore` | 配置 | 4 | `[结构]` 忽略本地构建产物与 `native/bin`。 |
| `native/.npmignore` | 配置 | 3 | `[结构]` 发布时排除 native 测试与源码目录（`files` 白名单之外的兜底）。 |
| `native/build_app.py` | 脚本 | 141 | `[结构]` 构建、签名并发布不可变的 Computer Use 应用代际：按 bundle 成员与字节算摘要、生成 `.dev` 变体、写发布 receipt 以便复用旧代际。 |
| `native/DSHComputerUse.icns` | 资源 |  | `[结构]` helper 应用图标的 icns 位图。 |
| `native/generate_icon.mjs` | 脚本 | 30 | `[结构]` 从图标 SVG 生成 `.icns`（构建期一次性脚本）。 |
| `native/generate-protocol.ts` | 脚本 | 57 | `[结构]` 从 `@deepseek-ai/dsh-cua/native-schema` 生成 `NativeProtocol.generated.swift`，保证 Swift 常量与 TS 契约同源。 |
| `native/Info.plist` | 配置 | 24 | `[结构]` helper 的应用元数据：bundle 标识、可执行名、辅助功能/屏幕录制用途说明。 |
| `native/LICENSE.computer-use-icon` | 文档 | 18 | `[结构]` 图标素材的第三方许可声明。 |
| `native/LICENSE.cua-driver` | 文档 | 21 | `[结构]` 上游 Cua Driver 的 MIT 许可原文。 |
| `native/Package.swift` | 配置 | 13 | `[结构]` SwiftPM 清单：只声明 `CuaNative` 可执行 target 及测试 target 依赖。 |
| `native/protocol.schema.json` | 配置 | 1474 | `[结构]` 生成的原生 wire JSON Schema，供 Swift 解析器与 Python e2e 核对请求字段与取值域。 |
| `native/README.i18n.yaml` | 文档 | 34 | `[结构]` native README 中英逐节哈希，供双语同步校验。 |
| `native/README.md` | 文档 | 180 | `[结构]` 原生层说明：三种运行模式、权限、共享 helper 生命周期、构建签名与测试方式。 |
| `native/README.zh.md` | 文档 | 180 | `[结构]` 上述文档的中文版。 |
| `native/Sources/CuaNative/ApplicationAuthorization.swift` | 源码 | 55 | `[结构]` 应用同意身份：以 bundle 标识或可执行路径为键，handle 只代表一个进程实例。 |
| `native/Sources/CuaNative/ApplicationDiscovery.swift` | 源码 | 96 | `[结构]` 只在标准应用目录（/Applications、/System/Applications、~/Applications）内有界枚举已安装应用。 |
| `native/Sources/CuaNative/AXAccess.swift` | 源码 | 739 | `[精读·读入口与导出面]` 带权限校验的 AX 访问与树投影，四段：弱链接 `ApplicationServices` 与 `_AXUIElementGetWindow` 的兼容探测 / 有界遍历与截断标记 / `AXProjection` 的元素索引与快照生命周期 / 属性读取与 `Role.Attribute.Set` 型动作派发。 |
| `native/Sources/CuaNative/AXHover.swift` | 源码 | 37 | `[结构]` 用 `AXShowAlternateUI`/`AXShowDefaultUI` 展开备选 UI 而不移动系统指针；无此通路时在投递前返回 `HOVER_UNAVAILABLE`。 |
| `native/Sources/CuaNative/AXTextFormatter.swift` | 源码 | 120 | `[结构]` 把 AX 树格式化成模型可读文本；原生引用与快照索引的所有权仍留在 `AXAccess`。 |
| `native/Sources/CuaNative/AXWorker.swift` | 源码 | 538 | `[精读·读入口与导出面]` actor 化的执行体，四段：自定义 `SerialExecutor` 与 actor 隔离 / `SnapshotScope` 作用域内的 `NativeSnapshot` / 前台与捕获计划（`CaptureTarget`、`ForegroundPlan`）/ 桌面操作与取消检查。 |
| `native/Sources/CuaNative/ClipboardPaste.swift` | 源码 | 138 | `[结构]` 临时改写剪贴板完成粘贴，且仅当本事务仍拥有内容时才恢复原值。 |
| `native/Sources/CuaNative/HeldKeys.swift` | 源码 | 114 | `[结构]` 跨连接的按住的键登记：所有连接共享同一 helper，因此键归属按连接追踪、释放仍投递到同一桌面进程。 |
| `native/Sources/CuaNative/KeyboardInput.swift` | 源码 | 279 | `[结构]` 键盘语义（键别名、显式修饰键转换、逆序释放、Unicode 标量输入、键盘区码与数字区分）按上游 MIT 实现重写。 |
| `native/Sources/CuaNative/Main.swift` | 源码 | 50 | `[结构]` 三种入口模式：server 模式持有 AppKit 事件循环，launcher 用 `NSWorkspace` 拉起，客户端走服务 socket。 |
| `native/Sources/CuaNative/NativePlatform.swift` | 源码 | 179 | `[结构]` 纯值形式的 macOS 进程、会话与 WindowServer 观测（锁定、前台、Spaces 归属）。 |
| `native/Sources/CuaNative/NativeProtocol.generated.swift` | 源码 | 44 | `[结构]` 由 `native/generate-protocol.ts` 生成的协议常量（元素范围、深度上限等），禁止手改。 |
| `native/Sources/CuaNative/PermissionGuide.swift` | 源码 | 404 | `[结构]` 系统设置引导：helper 自带拖拽源与指引浮层，把自身图标拖进隐私列表，全程不需要辅助功能权限。 |
| `native/Sources/CuaNative/Permissions.swift` | 源码 | 130 | `[结构]` 系统权限（辅助功能、屏幕录制）的查询与归属判断，归属到用户实际授权的那个 bundle。 |
| `native/Sources/CuaNative/PIDEventPoster.swift` | 源码 | 85 | `[结构]` 按目标 PID 路由 CGEvent 投递（含 `NSWorkspace` 前台切换的补偿）。 |
| `native/Sources/CuaNative/Protocol.swift` | 源码 | 157 | `[结构]` helper 各执行器之间交换的 JSON 值与不可变进程/窗口数据模型。 |
| `native/Sources/CuaNative/RequestAdmission.swift` | 源码 | 83 | `[结构]` 严格的请求准入：校验模型侧与原生侧字段，默认值与既有 JSONL 操作保持一致。 |
| `native/Sources/CuaNative/RequestCoordinator.swift` | 源码 | 277 | `[结构]` 每条连接在回复送达前只保留一个在途请求；桌面工作统一走共享调度器。 |
| `native/Sources/CuaNative/RequestScheduler.swift` | 源码 | 108 | `[结构]` 桌面操作占一个进程级槽位（避免并发截图/输入），socket 写入不占槽。 |
| `native/Sources/CuaNative/Runtime.swift` | 源码 | 177 | `[结构]` 有界的按行 stdin/stdout 与协作式终止，与 AX 执行互不阻塞。 |
| `native/Sources/CuaNative/ScreenshotTrace.swift` | 源码 | 46 | `[结构]` 截图阶段耗时记录，刻意省略请求内容、窗口标题与图像数据。 |
| `native/Sources/CuaNative/SharedHelperProxy.swift` | 源码 | 125 | `[结构]` stdio 诊断客户端经代理连到同一 daemon，不创建第二个截图后端。 |
| `native/Sources/CuaNative/SharedHelperRuntime.swift` | 源码 | 345 | `[结构]` 共享 helper 的版本与可执行路径锁：跨客户端存活，只在进程退出时释放。 |
| `native/Sources/CuaNative/SharedHelperServer.swift` | 源码 | 229 | `[结构]` 单个 daemon 独占 ScreenCaptureKit，每个 socket 连接持有自己的 AX 身份与取消。 |
| `native/Sources/CuaNative/StandaloneApplication.swift` | 源码 | 86 | `[结构]` 独立应用解析：嵌套应用在 TCC 中共享外层应用的屏幕录制身份。 |
| `native/Sources/CuaNative/TextSelection.swift` | 源码 | 38 | `[结构]` 字面文本匹配返回 macOS 辅助功能接受的 UTF-16 范围（含重复文本消歧）。 |
| `native/Sources/CuaNative/WindowCapture.swift` | 源码 | 167 | `[结构]` 公开 ScreenCaptureKit 截图：一次完成回调、不在主 actor 上阻塞等待。 |
| `native/Sources/CuaNative/WindowGeometry.swift` | 源码 | 54 | `[结构]` 截图或指针投递前比较独立取得的窗口 frame，检测几何漂移。 |
| `native/Sources/CuaNative/WindowPointerInput.swift` | 源码 | 299 | `[结构]` 窗口定向的点击/拖拽/滚轮事件字段与节奏（上游适配），含中键、修饰键点击与取消时的按键释放。 |
| `native/Sources/CuaNative/WindowSpaces.swift` | 源码 | 133 | `[结构]` 只读 WindowServer 查询：窗口属于哪个 Space、是否可见。 |
| `native/tests/application_consent_e2e.py` | 测试 | 209 | `[结构]` 被测对象：`ApplicationAuthorization.swift` 的 bundle 与可执行路径两种同意身份（可选真实 GUI 操作）。 |
| `native/tests/axless_e2e.py` | 测试 | 181 | `[结构]` 被测对象：`AXAccess.swift` 在「AX 可用 → 无 AX → AX 恢复」之间的窗口回归（需解锁的 Mac）。 |
| `native/tests/AxlessFixture.swift` | 测试 | 99 | `[结构]` 不暴露辅助功能树的窗口 fixture，供 axless 回归使用。 |
| `native/tests/blender_keyboard_e2e.py` | 测试 | 302 | `[结构]` 被测对象：`KeyboardInput.swift` 在真实 Blender GUI 中的按键回归（可选）。 |
| `native/tests/blender_keyboard_fixture.py` | 测试 | 153 | `[结构]` Blender 侧观察器：独立记录 Text Editor 收到的按键。 |
| `native/tests/capabilities_e2e.py` | 测试 | 267 | `[结构]` 被测对象：冷启动、粘贴、选择与物理输入的端到端能力检查。 |
| `native/tests/CapabilitiesFixture.swift` | 测试 | 147 | `[结构]` 一次性 AppKit 应用：独立记录收到的输入与富文本。 |
| `native/tests/CheckScreenshotLabel.swift` | 测试 | 19 | `[结构]` 辅助脚本：用截图 OCR 出的文字核对 AX 控件的标签。 |
| `native/tests/e2e.py` | 测试 | 418 | `[结构]` 被测对象：`RequestCoordinator.swift`/`AXWorker.swift` 在一次性双窗口 AppKit 应用上的完整流程。 |
| `native/tests/electron_e2e.py` | 测试 | 180 | `[结构]` 被测对象：隔离 Electron/Chromium 应用上的原生 CUA 行为。 |
| `native/tests/electron-fixture.html` | fixture | 59 | `[结构]` Electron fixture 的渲染页面。 |
| `native/tests/electron-fixture.mjs` | fixture | 52 | `[结构]` 一次性 Electron 应用，渲染进程独立记录原生输入效果。 |
| `native/tests/Fixture.swift` | fixture | 240 | `[结构]` 双窗口 AppKit 测试宿主（带可预测的控件与菜单）。 |
| `native/tests/floating_windows_e2e.py` | 测试 | 141 | `[结构]` 被测对象：`WindowSpaces.swift` 与截图/输入对自有无激活浮动面板的处理。 |
| `native/tests/FloatingWindowFixture.swift` | fixture | 111 | `[结构]` 非激活浮动面板 fixture。 |
| `native/tests/launcher_identity_e2e.py` | 测试 | 84 | `[结构]` 被测对象：`StandaloneApplication.swift` 与共享 helper 在嵌套 GUI launcher 下的责任归属与复用（不需要 TCC 授权）。 |
| `native/tests/LauncherFixture.swift` | fixture | 29 | `[结构]` 无窗口的 GUI launcher，其子进程活得比启动器更久。 |
| `native/tests/native_test_support.py` | fixture | 139 | `[结构]` e2e 共用的自有 JSONL helper 进程管理。 |
| `native/tests/nested_application_e2e.py` | 测试 | 79 | `[结构]` 被测对象：嵌套 helper 提取与并发 launcher（无需授予权限）。 |
| `native/tests/observation_benchmark.py` | 脚本 | 424 | `[结构]` 只读 `getState` 基准：在自有 35 行与 400 行窗口上对比耗时（可选人工运行）。 |
| `native/tests/paste_e2e.py` | 测试 | 76 | `[结构]` 被测对象：`ClipboardPaste.swift` 的未读粘贴失败上限与前台成功路径。 |
| `native/tests/PasteFixture.swift` | fixture | 56 | `[结构]` 前台敏感的粘贴接收器，独立记录 AX 命令投递。 |
| `native/tests/protocol_e2e.py` | 测试 | 216 | `[结构]` 被测对象：`RequestAdmission.swift` 与 `Runtime.swift` 的 JSONL 准入和 EOF 行为（无桌面观测）。 |
| `native/tests/shared_helper_e2e.py` | 测试 | 285 | `[结构]` 被测对象：`SharedHelperRuntime.swift`/`SharedHelperServer.swift` 的进程生命周期、句柄作用域与请求级截图期限。 |
| `native/tests/startup_e2e.py` | 测试 | 141 | `[结构]` 被测对象：真实 LaunchServices 启动失败（应用提前退出或卡住）的诊断。 |
| `native/tests/StartupFixture.swift` | fixture | 48 | `[结构]` 供生产 launcher 打靶的「未就绪即退出/卡住」应用。 |
| `native/tests/test_build_app.py` | 测试 | 220 | `[结构]` 被测对象：`native/build_app.py` 的不可变 bundle 发布与 receipt 复用。 |
| `native/tests/test_cleanup.py` | 测试 | 42 | `[结构]` 被测对象：fixture 产物与自有进程都获得清理尝试。 |
| `native/tests/test_native_test_support.py` | 测试 | 24 | `[结构]` 被测对象：`native/tests/native_test_support.py` 的 helper 路径在任意目录深度可用。 |
| `native/tests/test_swift.py` | 测试 | 27 | `[结构]` 被测对象：Swift Testing 运行时的搜索路径配置。 |
| `native/tests/text_input_benchmark.py` | 脚本 | 308 | `[结构]` 文本输入对比基准：在全新 Blender Text Editor 上测量输入路径耗时。 |
| `native/tests/swift/ApplicationDiscoveryTests.swift` | 测试 | 210 | `[结构]` 被测对象：`ApplicationDiscovery.swift`——用隔离 bundle，不启动用户应用。 |
| `native/tests/swift/AXFailureTests.swift` | 测试 | 230 | `[结构]` 被测对象：`AXAccess.swift` 的权限、通信与发现失败不得被可选控制值掩盖。 |
| `native/tests/swift/AXTextFormatterTests.swift` | 测试 | 118 | `[结构]` 被测对象：`AXTextFormatter.swift` 的语义保留与披露规则（纯输入，无桌面状态）。 |
| `native/tests/swift/ClickReleaseTests.swift` | 测试 | 38 | `[结构]` 被测对象：`WindowPointerInput.swift` 的按键状态迁移记录（不投递真实事件）。 |
| `native/tests/swift/ClipboardPasteTests.swift` | 测试 | 136 | `[结构]` 被测对象：`ClipboardPaste.swift`——每个用例使用具名 pasteboard，不碰用户剪贴板。 |
| `native/tests/swift/ForegroundTests.swift` | 测试 | 23 | `[结构]` 被测对象：前台判定相关逻辑的最小单元测试。 |
| `native/tests/swift/InputMappingTests.swift` | 测试 | 34 | `[结构]` 被测对象：`KeyboardInput.swift` 的键码映射——键盘区键与普通数字、按钮与修饰键保持区分。 |
| `native/tests/swift/KeyboardChordTests.swift` | 测试 | 137 | `[结构]` 被测对象：`KeyboardInput.swift` 的组合键序列（观察真实 CGEvent，不投递到桌面）。 |
| `native/tests/swift/ListActionsTests.swift` | 测试 | 38 | `[结构]` 被测对象：`AXAccess.swift` 的 action 列表包含属性设置类操作。 |
| `native/tests/swift/PerformActionTests.swift` | 测试 | 141 | `[结构]` 被测对象：`AXAccess.swift` 的原生动作与属性设置型动作派发。 |
| `native/tests/swift/PermissionIdentityTests.swift` | 测试 | 155 | `[结构]` 被测对象：`Permissions.swift`——选中的目录项必须仍标识被检查的可执行文件。 |
| `native/tests/swift/PointerTimingTests.swift` | 测试 | 10 | `[结构]` 被测对象：`WindowPointerInput.swift` 的拖拽节奏——保留亚毫秒与不整除的延迟预算。 |
| `native/tests/swift/ProtocolTests.swift` | 测试 | 167 | `[结构]` 被测对象：`Protocol.swift` 的 wire 校验与可空观测（无需桌面访问）。 |
| `native/tests/swift/ScreenshotTraceTests.swift` | 测试 | 23 | `[结构]` 被测对象：`ScreenshotTrace.swift` 的记录字段不含图像与标题。 |
| `native/tests/swift/SharedHelperTests.swift` | 测试 | 154 | `[结构]` 被测对象：`SharedHelperRuntime.swift` 的准入、连接设置与运行时所有权。 |
| `native/tests/swift/SharedSocketTests.swift` | 测试 | 57 | `[结构]` 被测对象：`SharedHelperServer.swift` 的 socket——对端半关闭与写背压下清理仍然及时。 |
| `native/tests/swift/StandaloneApplicationTests.swift` | 测试 | 136 | `[结构]` 被测对象：`StandaloneApplication.swift` 的缓存发布、复用、完整性与隔离权限（真实签名 fixture）。 |
| `native/tests/swift/SystemHoverTests.swift` | 测试 | 27 | `[结构]` 被测对象：`AXHover.swift`——系统指针移动不得指向别的应用或被遮挡窗口。 |
| `native/tests/swift/SystemPermissionsTests.swift` | 测试 | 245 | `[结构]` 被测对象：`Permissions.swift` 的提示与跳转（替换原生呈现，绝不改变本机授权）。 |
| `native/tests/swift/TextSelectionTests.swift` | 测试 | 47 | `[结构]` 被测对象：`TextSelection.swift`——重复文本消歧保持 UTF-16 位置且不改写文本。 |
| `native/tests/swift/WindowCaptureTests.swift` | 测试 | 80 | `[结构]` 被测对象：`WindowCapture.swift`——被取消的调用立即释放调度且不留下未完成的 SDK 截图。 |
| `native/tests/swift/WindowGeometryTests.swift` | 测试 | 105 | `[结构]` 被测对象：`WindowGeometry.swift` 的 frame 比较（不依赖 WindowServer、权限或桌面状态）。 |
| `native/tests/swift/WindowSpacesTests.swift` | 测试 | 26 | `[结构]` 被测对象：`WindowSpaces.swift` 的纯值归属判定（不实例化查询）。 |
| `native/upstream.json` | 文档 | 68 | `[结构]` 上游来源与许可：记录 trycua/cua 的 tag/commit，以及每个被改写 Swift 文件的上游路径与改动要点。 |
| `package.json` | 配置 | 109 | `[结构]` 包声明；`files` 白名单把 `native/Sources`、`native/bin`、构建脚本与两份许可纳入发布物，`./src/*` 与 `./locale/*.json` 单独导出。 |
| `README.i18n.yaml` | 文档 | 52 | `[结构]` 中英 README 逐节哈希，供双语同步校验。 |
| `README.md` / `README.zh.md` | 文档 | 277 | `[结构]` 包参考文档：能力矩阵、helper 安装与签名、权限授予、持久 PTC、故障与限制。 |
| `src/ax-limits.ts` | 源码 | 2 | `[精读]` macOS helper 接受的最大遍历预算常量（元素 100000、深度 512），供配置上限与指引文案共用。 |
| `src/guidance.ts` | 源码 | 29 | `[精读]` 在共享 `COMMON_GUIDANCE` 上追加 macOS 专属说明：操作层级、坐标单位（points vs 截图像素）、`show` 不切 Space、Stage Manager 缩小几何，以及持久 PTC 与纯程序两种大观测取数建议。 |
| `src/held-keys.ts` | 源码 | 60 | `[结构]` 按工具执行令牌登记「按住的键」，在程序结束或该 Agent 的原生连接关闭时释放，跨工具调用保持按住。 |
| `src/index.ts` | 源码 | 90 | `[精读]` 提供方装配：声明能力矩阵（方法列表、坐标空间为截图像素、键盘仅 app 级）与 macOS 配置（`sourceSigning`、`permissionPollIntervalMs`、收紧后的遍历上限），再调 `installCua` 接入共享层。 |
| `src/native-build.ts` | 源码 | 113 | `[结构]` helper 定位与准备：校验宿主平台/架构，优先使用已安装的 app（读 `cua-helper.json` 摘要），否则在源码检出内就地编译并按 `sourceSigning` 签名。 |
| `src/permission-guide.ts` | 源码 | 110 | `[结构]` 系统设置引导的原生请求参数（`settingsMessage`/`instruction`/`finderLabel`/`pollIntervalMs`）与中英文案模板。 |
| `src/shared-native.ts` | 源码 | 294 | `[结构]` 共享原生通道：解析/发布 helper 运行时位置、拉起或连接 per-user daemon、校验 `ready` 握手（含 8192 字节上限与 protocol/runtimeKey 字段）、为每个请求建立 1:1 应答，并在 abort 时杀掉 launcher。 |
| `tests/guidance.spec.ts` | 测试 | 145 | `[结构]` 被测对象：`src/guidance.ts` 的平台说明拼装与替换规则。 |
| `tests/held-keys.spec.ts` | 测试 | 155 | `[结构]` 被测对象：`src/held-keys.ts` 的按住键登记与释放时机。 |
| `tests/large-image-ptc.spec.ts` | 测试 | 194 | `[结构]` 被测对象：大截图在 PTC 程序中的分块传输与上限处理。 |
| `tests/loader-composition.spec.ts` | 测试 | 235 | `[结构]` 被测对象：本包在加载器中的组合与所需服务注入顺序。 |
| `tests/native-build.spec.ts` | 测试 | 216 | `[结构]` 被测对象：`src/native-build.ts` 的平台校验、已安装应用解析与签名选择。 |
| `tests/native-fixture.ts` | fixture | 16 | `[结构]` 测试共用的假 helper 路径与运行时描述。 |
| `tests/native-publication.spec.ts` | 测试 | 18 | `[结构]` 被测对象：发布物清单（`files`）是否包含 helper 运行所需文件。 |
| `tests/permission-guide.spec.ts` | 测试 | 38 | `[结构]` 被测对象：`src/permission-guide.ts` 的参数校验与文案插值。 |
| `tests/persistent-bridge.built.e2e.ts` | 测试 | 120 | `[结构]` 被测对象：构建产物在持久 PTC 下的桥接行为（消费 `lib/`）。 |
| `tests/protocol-generation.spec.ts` | 测试 | 56 | `[结构]` 被测对象：`native/generate-protocol.ts` 的生成结果与 `NativeProtocol.generated.swift` 一致。 |
| `tests/provider-channel.spec.ts` | 测试 | 36 | `[结构]` 被测对象：`src/index.ts` 的能力矩阵与共享层的通道契约对齐。 |
| `tests/provider-lifecycle.spec.ts` | 测试 | 1301 | `[结构]` 被测对象：`src/index.ts` 与 `src/shared-native.ts` 的完整生命周期（准备、连接、请求、取消、释放）。 |
| `tests/shared-native.spec.ts` | 测试 | 585 | `[结构]` 被测对象：`src/shared-native.ts` 的握手、请求配对与失败清理。 |
| `tsconfig.json` | 配置 | 24 | `[结构]` 包的 TypeScript 编译配置。 |

### experimental/cua-windows — Windows 原生 CUA 提供方

包定位：把同一套 `cua` 对象模型落到 Windows 上，但能力明显更窄：无障碍树只到窗口级、模拟鼠标键盘标为不完整、`findApps` 未实现，实际可用的是窗口枚举/截图与 UIA 模式动作。组成四块：TS 侧装配（能力矩阵、helper 编译与托管、WSL/原生两种宿主判定），C# helper（`entry` 命名进程、私有命名管道服务、UIA 与窗口捕获），共享协议库（`protocol` 单独编译成 `CuaProtocol`），以及一个仅供对照实验的 `capture-probe`。它复用 `cua` 的 wire schema 与原生客户端，与 macOS 提供方同源于一份 `protocol.schema.json`。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/*.json` | 多语言 | 6 | `[结构]` 聚合行：8 个语言文件，只有插件页 `meta.title`/`meta.description` 两项文案。 |
| `native/.gitignore` | 配置 | 5 | `[结构]` 忽略 bin/obj 等本地编译产物。 |
| `native/.npmignore` | 配置 | 3 | `[结构]` 发布时排除 native 测试与实验目录（`files` 白名单之外的兜底）。 |
| `native/capture-probe/app.manifest` | 配置 | 12 | `[结构]` 实验程序的清单：声明 DPI 感知与 Windows 兼容层。 |
| `native/capture-probe/CaptureProbe.cs` | 脚本 | 221 | `[结构]` 私有 .NET Framework 对照实验：每次阻塞式截图都放进一次性子进程，比较屏幕拷贝、窗口 DC 拷贝与 PrintWindow。 |
| `native/capture-probe/CaptureProbe.exe.config` | 配置 | 6 | `[结构]` 实验程序的 .NET Framework 运行时配置。 |
| `native/capture-probe/README.i18n.yaml` | 文档 | 28 | `[结构]` 实验 README 中英逐节哈希。 |
| `native/capture-probe/README.md` | 文档 | 93 | `[结构]` 实验说明：如何用系统自带编译器运行、如何解读输出，并声明它不替代提供方的截图实现。 |
| `native/capture-probe/README.zh.md` | 文档 | 93 | `[结构]` 上述说明的中文版。 |
| `native/capture-probe/run.ps1` | 脚本 | 28 | `[结构]` 用系统自带 csc 编译并运行对照实验的 PowerShell 脚本。 |
| `native/cua-windows.slnx` | 配置 | 6 | `[结构]` 解决方案清单：聚合 entry、protocol、tests、desktop-tests 四个工程。 |
| `native/desktop-tests/DesktopFixture.csproj` | 配置 | 12 | `[结构]` 桌面 fixture 工程的 MSBuild 定义。 |
| `native/desktop-tests/packages.lock.json` | 配置 | 15 | `[结构]` 该工程的 NuGet 锁定文件。 |
| `native/desktop-tests/Program.cs` | 测试 | 96 | `[结构]` 私有桌面 fixture：只检查和摆布本进程自己拥有的窗口，供真实 Windows 端到端验收使用。 |
| `native/Directory.Build.props` | 配置 | 16 | `[结构]` 四个工程共享的编译属性（目标框架、语言版本、警告策略、平台架构）。 |
| `native/entry/Accessibility.cs` | 源码 | 229 | `[结构]` UIA 树遍历：一次遍历同时产出披露给模型的 RuntimeId 与保留的 UIA 元素引用，并处理截断。 |
| `native/entry/AccessibilityActions.cs` | 源码 | 117 | `[结构]` 只在快照与窗口仍有效时，用保留的 UIA 引用执行动作（含参数编码）。 |
| `native/entry/app.manifest` | 配置 | 13 | `[结构]` helper 的清单：DPI 感知与权限声明。 |
| `native/entry/Applications.cs` | 源码 | 153 | `[结构]` 应用身份：进程元数据、可执行摘要（AUMID 或 .exe 路径）与被授权应用自身的窗口状态。 |
| `native/entry/ClipboardPaste.cs` | 源码 | 184 | `[结构]` 延迟渲染粘贴：等剪贴板数据被消费后再恢复原有格式，避免抢回。 |
| `native/entry/CuaWindows.csproj` | 配置 | 26 | `[结构]` helper 工程定义：引用 `CuaProtocol`、UIA 程序集与生成的协议常量。 |
| `native/entry/DesktopExecutor.cs` | 源码 | 275 | `[结构]` 平台操作执行器：先由共享 Host 策略授权 handle，再落地点击/输入/滚动等具体动作。 |
| `native/entry/DesktopSession.cs` | 源码 | 45 | `[结构]` 输入桌面可用性探测：交互式输入桌面不可用时立即停止观测。 |
| `native/entry/DesktopWindows.cs` | 源码 | 388 | `[结构]` 窗口枚举与解析：AppsFolder AUMID 枚举、按 ordinal 精确合并、窗口身份的严格校验。 |
| `native/entry/Dispatchers.cs` | 源码 | 185 | `[结构]` 让 UIA 与剪贴板 COM 对象各自留在所属 apartment 的专用调度线程上。 |
| `native/entry/GlobalUsings.cs` | 源码 | 1 | `[结构]` 全局 `using` 汇总。 |
| `native/entry/Input.cs` | 源码 | 263 | `[结构]` 全局键鼠注入：只对已显式置前的目标投递，并把协议键名映射到虚拟键。 |
| `native/entry/NativeServer.cs` | 源码 | 197 | `[结构]` 每用户服务：在私有命名管道上同时服务多个隔离的 Agent 连接与 Host lease。 |
| `native/entry/packages.lock.json` | 配置 | 54 | `[结构]` helper 工程的 NuGet 锁定文件。 |
| `native/entry/PatternActions.cs` | 源码 | 160 | `[结构]` UIA 模式动作表：缓存观测与实时派发共用同一份操作定义。 |
| `native/entry/Program.cs` | 源码 | 57 | `[结构]` helper 可执行入口：解析命令行（server/launcher/lease），由 Windows 提供方私有启动。 |
| `native/entry/SharedRuntime.cs` | 源码 | 110 | `[结构]` 托管 Host 连接器：租用一个由 Explorer 启动、位于 Host kill-on-close Job 之外的服务进程。 |
| `native/entry/ShellBroker.cs` | 源码 | 89 | `[结构]` 经 Explorer 启动用户应用，使其不落入 helper 的进程 Job，关闭 helper 不会带走用户程序。 |
| `native/entry/Win32.cs` | 源码 | 133 | `[结构]` Win32 边界层：保持物理像素坐标与进程身份，封装窗口枚举、前台切换与 DPI 查询。 |
| `native/entry/WindowCapture.cs` | 源码 | 189 | `[结构]` 窗口截图实现：按窗口/屏幕路径选择捕获方式并返回像素尺寸与编码图像。 |
| `native/entry/Windows.cs` | 源码 | 248 | `[结构]` 窗口对象：归属到确定的应用程序身份，每次操作前重新校验自身进程与 AUMID。 |
| `native/generate-protocol.ts` | 脚本 | 9 | `[结构]` 从 `@deepseek-ai/dsh-cua/native-schema` 生成 C# 协议常量，与 macOS 侧复用同一份来源。 |
| `native/protocol.schema.json` | 配置 | 1396 | `[结构]` 生成的原生 wire JSON Schema，供 C# 准入与测试核对字段与取值域。 |
| `native/protocol/AccessibilityText.cs` | 源码 | 69 | `[结构]` 把 UIA 树格式化成模型可读文本，不持有原生引用或快照映射。 |
| `native/protocol/CuaProtocol.csproj` | 配置 | 15 | `[结构]` 共享协议库工程定义（被 helper 与测试共同引用）。 |
| `native/protocol/KeyChord.cs` | 源码 | 25 | `[结构]` 键与修饰键组合记录类型，作为请求字段的规范化载体。 |
| `native/protocol/NativeControlFrame.cs` | 源码 | 23 | `[结构]` 连接控制帧（如 `closed`）：刻意不进入模型可见的操作 schema。 |
| `native/protocol/NativeRequest.cs` | 源码 | 99 | `[结构]` 严格 JSONL 准入：与 TS 侧共享同一份操作 schema，负责解析、拒绝与错误编码。 |
| `native/protocol/packages.lock.json` | 配置 | 43 | `[结构]` 协议库工程的 NuGet 锁定文件。 |
| `native/protocol/TextSelection.cs` | 源码 | 49 | `[结构]` 字面文本选择与 CF_HTML 编码，独立于 UIA。 |
| `native/tests/packages.lock.json` | 配置 | 48 | `[结构]` 测试工程的 NuGet 锁定文件。 |
| `native/tests/Program.cs` | 测试 | 153 | `[结构]` 被测对象：`protocol/NativeRequest.cs`、`NativeControlFrame.cs`、`AccessibilityText.cs` 的准入、分帧、文本偏移与模型可见格式（可跨平台运行）。 |
| `native/tests/Protocol.Tests.csproj` | 配置 | 14 | `[结构]` 协议测试工程定义。 |
| `package.json` | 配置 | 92 | `[结构]` 包声明；`files` 白名单纳入 `native/bin`、C# 源码与解决方案文件，`./src/*` 单独导出。 |
| `README.i18n.yaml` | 文档 | 52 | `[结构]` 中英 README 逐节哈希，供双语同步校验。 |
| `README.md` / `README.zh.md` | 文档 | 93 | `[结构]` 包参考文档：安装前提（原生 Windows 或 WSL）、helper 获取方式、能力限制与未完成项。 |
| `src/guidance.ts` | 源码 | 24 | `[精读]` 在共享指引上追加 Windows 说明：树只到窗口级、输入不完整、`getApp` 只认 AUMID 或绝对 .exe 路径、`findApps` 未实现、元素 id 是斜杠分隔的 RuntimeId、动作名是 `Pattern.Action`。 |
| `src/index.ts` | 源码 | 90 | `[精读]` 提供方装配：声明 20 个方法的能力矩阵（键盘 window 级、坐标截图像素）与 Windows 配置（`windowsPowerShellPath`、`pollIntervalMs`），再调 `installCua` 接入共享层。 |
| `src/native-build.ts` | 源码 | 79 | `[结构]` helper 定位与准备：校验 Windows 宿主与架构，优先使用已安装 helper，否则在源码检出内托管编译并遵守超时/取消。 |
| `src/native-runtime.ts` | 源码 | 356 | `[结构]` Host 连接器与 Agent 连接：`starting/ready/closing/closed` 相位机、`Started` 帧（endpoint/launcherId）、每 Agent 独立连接与 `closed` 通知、大图像帧转发、释放时先断 Agent 再退 Host 连接。 |
| `src/native-transport.ts` | 源码 | 65 | `[结构]` 两种传输同一协议：原生命名管道 socket，或 WSL 下经桥进程的标准流；连接对象自带 dispose 以回收桥进程。 |
| `src/windows-host.ts` | 源码 | 93 | `[结构]` 判定 Host 是原生 Windows 还是 WSL（普通 Linux 直接拒绝），并准备 WSL 侧 helper（查询路径/架构、保留 helper 不被回收）。 |
| `tests/desktop-runtime.spec.ts` | 测试 | 22 | `[结构]` 被测对象：`src/native-runtime.ts` 在真实桌面环境下的最小集成路径（非 Windows 环境跳过）。 |
| `tests/desktop-smoke.mjs` | 脚本 | 285 | `[结构]` 人工运行的 Windows 验收脚本；文件头注明它仍是旧窗口 RPC 冒烟，待迁移到 listApps/getApp facade 后才能再跑。 |
| `tests/desktop-tool.spec.ts` | 测试 | 70 | `[结构]` 被测对象：桌面工具在 Windows 提供方下的能力协商。 |
| `tests/fixtures/provider.yml` | fixture | 5 | `[结构]` 测试用 loader 装配片段。 |
| `tests/loader-composition.spec.ts` | 测试 | 40 | `[结构]` 被测对象：本包在加载器中的组合与注入服务顺序。 |
| `tests/native-build.spec.ts` | 测试 | 89 | `[结构]` 被测对象：`src/native-build.ts` 的宿主/架构校验与安装探测。 |
| `tests/native-runtime.spec.ts` | 测试 | 478 | `[结构]` 被测对象：`src/native-runtime.ts` 的握手、连接隔离与清理。 |
| `tests/native-transport.spec.ts` | 测试 | 65 | `[结构]` 被测对象：`src/native-transport.ts` 的两种传输选择与错误映射。 |
| `tests/protocol.spec.ts` | 测试 | 29 | `[结构]` 被测对象：生成产物与 `native-schema` 的一致性。 |
| `tests/provider-lifecycle.spec.ts` | 测试 | 116 | `[结构]` 被测对象：`src/index.ts` 的提供方启用/停用生命周期。 |
| `tests/windows-host.spec.ts` | 测试 | 102 | `[结构]` 被测对象：`src/windows-host.ts` 的 windows/wsl/linux 判定与 WSL 准备。 |
| `tsconfig.json` | 配置 | 30 | `[结构]` 包的 TypeScript 编译配置。 |
### experimental/forge — 提供方无关的变更请求注册表与轮询

包定位：解决「消费方不该绑定到某个代码托管平台」的问题——把 pull request / merge request 归一成 `ChangeRequestRef`，由提供方实现 URL 解析、按 head 分支查找、批量读状态、读 diff 与文件、读写评审、标记可评审与合并。本包只做注册表与编排：每个变更请求的所有监听方共享一条轮询循环，各 forge 同时最多一次 fetch 并把到期的请求批量取回；具体平台行为由 `forge-github` 之类的提供方包注入，`forge-session` 在其上做 Session 绑定。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/*.json` | 多语言 | 6 | `[结构]` 聚合行：8 个语言文件，只有插件页 `meta.title`/`meta.description` 两项文案。 |
| `package.json` | 配置 | 48 | `[结构]` 包声明；运行时依赖只有 schemastery/brand/timeout，cordis 为 peer，因此本包不含任何具体托管平台实现。 |
| `README.i18n.yaml` | 文档 | 37 | `[结构]` 中英 README 逐节哈希，供双语同步校验。 |
| `README.md` / `README.zh.md` | 文档 | 116 | `[结构]` 包参考文档：注册提供方、监听变更请求、轮询节奏、diff 与评审读写、合并与草稿转正式。 |
| `src/index.ts` | 源码 | 690 | `[精读·读入口与导出面]` `ForgeService` 注册表，四段：提供方注册/注销与 `forge/providers-changed` 事件 / 每个变更请求一条 watch 与共享监听方 / 单飞批量 fetch 与到期调度 / diff、文件、评审、合并等读写全部委托给提供方。 |
| `src/keys.ts` | 源码 | 15 | `[精读]` `changeRequestKey`：把 `{forge, host, owner, name, number}` 归一成小写品牌键，作为跨提供方的唯一身份。 |
| `src/schedule.ts` | 源码 | 33 | `[精读]` `nextPollDelay`：检查在跑或可合并性未知时用活跃间隔，已关闭用空闲间隔，合并后停止，连续失败按指数退避到上限。 |
| `src/types.ts` | 源码 | 597 | `[结构]` 提供方中立词汇与契约：仓库/变更请求引用、检查与状态快照、diff、文件、评审线程与写请求、合并/准备请求、`ForgeProvider` 接口与失败码。 |
| `tests/fake-provider.ts` | fixture | 153 | `[结构]` 供注册表与监听测试使用的假提供方：按测试脚本返回快照、失败或挂起。 |
| `tests/lifecycle.spec.ts` | 测试 | 205 | `[结构]` 被测对象：`src/index.ts` 的提供方注册/注销生命周期与 `providers-changed` 通知。 |
| `tests/registry.spec.ts` | 测试 | 275 | `[结构]` 被测对象：`src/index.ts` 的仓库/变更请求解析与提供方选择。 |
| `tests/watch.spec.ts` | 测试 | 620 | `[结构]` 被测对象：`src/index.ts` 的监听与 `src/schedule.ts` 的轮询节奏——共享循环、单飞批量、失败退避与终态停止。 |
| `tsconfig.json` | 配置 | 27 | `[结构]` 包的 TypeScript 编译配置。 |

### experimental/forge-bundle — 变更请求面板与工作树 Session 的组合包

包定位：解决「变更请求功能要一键开关」的问题——包本身无运行时代码，`cordis.patch.yml` 一次性插入工作树服务与工具、forge 注册表、GitHub 提供方、Session 绑定服务，以及浏览器侧的变更请求面板。默认在发布 profile 中禁用，用户从插件页开启；GitHub 状态依赖宿主上已登录的 `gh`，本地工作树不需要认证。它把 `forge` / `forge-github` / `forge-session` 与 worktree 两组包绑成一个产品开关。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 13 | `[结构]` 运行时行：插入 `worktree` 与 `tool-worktree`（工作树服务与模型工具）、`forge`（注册表）、`forge-github`（GitHub 提供方）、`forge-session`（Session 绑定）与 `forge-panel`（浏览器面板），全部随组合包一起启用。 |
| `docs/DETAIL*.md` | 文档 | 1 | `[结构]` 聚合行：8 个语言版本（en/zh/de/es/fr/ja/pt/ru），只有一张预览图引用，即变更请求与工作树在对话中的样子。 |
| `docs/preview.svg` | 资源 | 28 | `[结构]` 插件页预览图（英文）。 |
| `docs/preview.zh.svg` | 资源 | 28 | `[结构]` 插件页预览图（中文）。 |
| `icon.svg` | 资源 | 11 | `[结构]` 插件图标。 |
| `locale/*.json` | 多语言 | 7 | `[结构]` 聚合行：8 个语言文件，插件页 `meta.title`/`meta.description`/`meta.detail`，说明需本机安装并登录 `gh` 才能用 GitHub 功能。 |
| `package.json` | 配置 | 58 | `[结构]` 包声明；以 `bundle` 声明自身为组合包，附带 `cordis.patch.yml` 供加载器插入上面六行。 |
| `README.i18n.yaml` | 文档 | 37 | `[结构]` 中英 README 逐节哈希，供双语同步校验。 |
| `README.md` / `README.zh.md` | 文档 | 79 | `[结构]` 组合包文档：如何开启面板、会话与 PR 的绑定方式、工作树隔离、`gh` 依赖与限制。 |
| `src/index.ts` | 源码 | 2 | `[结构]` 空入口（`export {}`）：行为全在 `cordis.patch.yml`，源码只提供 ESM 入口。 |
| `tsconfig.json` | 配置 | 15 | `[结构]` 包的 TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | `[结构]` 打包配置：只把类型入口编译到 `lib`，不产出运行时 bundle。 |

### experimental/forge-github — 基于本机 gh CLI 的 GitHub 提供方

包定位：为 `forge` 注册表提供一个真实的 GitHub 实现，全部读写都通过宿主上已登录的 `gh` 走 REST/GraphQL，不引入 HTTP 客户端与 token 管理。它按职责拆成几块：URL/仓库校验（`urls.ts`）、`gh` 进程执行与限额（`gh.ts`）、GraphQL 文档与映射（`graphql.ts`）、单次 mutation 与「确定未生效 / 结果未知」判别（`mutation.ts`），以及提交、线程、评审、已读标记、分支与 reviewer 的具体读写模块；`provider.ts` 是这些模块对 `ForgeProvider` 契约的汇总实现。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/*.json` | 多语言 | 6 | `[结构]` 聚合行：8 个语言文件，只有插件页 `meta.title`/`meta.description` 两项文案。 |
| `package.json` | 配置 | 52 | `[结构]` 包声明；cordis 与 forge 均为 peer，运行期只依赖 execa 与本仓库工具包，不给宿主引入额外 HTTP 依赖。 |
| `README.i18n.yaml` | 文档 | 37 | `[结构]` 中英 README 逐节哈希，供双语同步校验。 |
| `README.md` / `README.zh.md` | 文档 | 130 | `[结构]` 包参考文档：支持的 URL 形态、`gh` 版本与鉴权前提、各读写的语义与「结果未知」处理、配置项。 |
| `src/commits.ts` | 源码 | 102 | `[结构]` 分页读取 PR 提交列表，每页都记录 head 以拒绝跨页移动的 head，并导出 `GraphqlReader` 供其他模块复用。 |
| `src/compare.ts` | 源码 | 43 | `[结构]` 通过 REST compare 端点读 base..head 的完整 patch；对 `gh` 2.97 的 `--allow-escape-sequences` 做「不被识别则重试一次」的兼容。 |
| `src/gh.ts` | 源码 | 71 | `[结构]` 以净化后的非交互环境执行 `gh`：字面量参数、超时杀进程、每流字节上限，并把「起不来 / 超时 / 超限」分成三类错误。 |
| `src/graphql.ts` | 源码 | 685 | `[精读·读入口与导出面]` GraphQL 层，四段：查询文档常量（head/checks/threads/commits/snapshot）/ 分页游标循环 / 各连接节点映射成中立结果 / 汇总与截断标记。 |
| `src/index.ts` | 源码 | 60 | `[结构]` 插件入口：校验 `ghCommand`、hosts 与各上限，构造 `GitHubProvider` 并注册到 `ctx.forge`。 |
| `src/mutation.ts` | 源码 | 86 | `[结构]` 通过 stdin 发送单次 GraphQL mutation，并把失败分成「确定被拒（未生效）」与「结果未知（需去 GitHub 复核）」。 |
| `src/overview.ts` | 源码 | 197 | `[结构]` 概览类读写：加/删 reviewer（用户、团队、bot 分别用不同 mutation）与更新分支。 |
| `src/provider.ts` | 源码 | 534 | `[精读·读入口与导出面]` `GitHubProvider`：把 `ForgeProvider` 的每个方法分派到上述模块，并把 `gh` 错误、HTTP 状态、鉴权失败归类成 `ForgeFailure`/`ForgeActionFailure` 码。 |
| `src/pull-request-node.ts` | 源码 | 42 | `[精读]` 写操作前读 PR 的 node id 与 head；head 已移动则返回 `stale`，避免把评论/评审写到新提交上。 |
| `src/review.ts` | 源码 | 59 | `[结构]` 通过 stdin 提交一次评审（comment/approve/request-changes），先把 head 与状态核对一遍，再按行把评论编码为 inline 注释。 |
| `src/review-writes.ts` | 源码 | 192 | `[结构]` 回复、编辑、解决/重开线程等评审写操作：带提交校验，并把「GitHub 明确拒绝」与「可能已生效」区分开。 |
| `src/threads.ts` | 源码 | 262 | `[结构]` 在固定 head 上分页读评审线程与评论，附带作者权限、可否编辑/删除、locked 会话的写入判定。 |
| `src/urls.ts` | 源码 | 89 | `[结构]` 解析 GitHub 远端 URL 与 PR URL，并校验要内联进 GraphQL 文档、`gh` 参数或 REST 路径的 owner/name/number/commit。 |
| `src/viewed.ts` | 源码 | 132 | `[结构]` 读当前登录用户对 PR 文件的 viewed 标记（分页、按 head 固定），以及标记/取消标记单个文件的 mutation。 |
| `tests/compare.spec.ts` | 测试 | 44 | `[结构]` 被测对象：`src/compare.ts` 的 patch 读取与旧版 `gh` 兼容。 |
| `tests/fixtures.ts` | fixture | 96 | `[结构]` 各测试共用的 `gh` 输出样例与假 runner。 |
| `tests/gh.spec.ts` | 测试 | 97 | `[结构]` 被测对象：`src/gh.ts` 的超时、输出上限与不可用错误。 |
| `tests/graphql.spec.ts` | 测试 | 557 | `[结构]` 被测对象：`src/graphql.ts` 的查询构造、分页与响应映射。 |
| `tests/overview.spec.ts` | 测试 | 180 | `[结构]` 被测对象：`src/overview.ts` 的 reviewer 读写与分支更新。 |
| `tests/plugin.spec.ts` | 测试 | 74 | `[结构]` 被测对象：`src/index.ts` 的配置校验与注册。 |
| `tests/provider.spec.ts` | 测试 | 858 | `[结构]` 被测对象：`src/provider.ts` 的契约实现与错误分类。 |
| `tests/review.spec.ts` | 测试 | 98 | `[结构]` 被测对象：`src/review.ts` 的评审提交与 head 校验。 |
| `tests/review-writes.spec.ts` | 测试 | 289 | `[结构]` 被测对象：`src/review-writes.ts` 的线程写操作与未知结果处理。 |
| `tests/threads.spec.ts` | 测试 | 339 | `[结构]` 被测对象：`src/threads.ts` 的线程分页与权限判定。 |
| `tests/urls.spec.ts` | 测试 | 67 | `[结构]` 被测对象：`src/urls.ts` 的 URL 解析与内联校验。 |
| `tests/viewed.spec.ts` | 测试 | 125 | `[结构]` 被测对象：`src/viewed.ts` 的已读标记读写。 |
| `tsconfig.json` | 配置 | 36 | `[结构]` 包的 TypeScript 编译配置。 |

### experimental/forge-session — 把变更请求绑定到 Session 并监听

包定位：解决「用户不想手动登记 PR」的问题——不建独立登记簿，而是由 Session 事件自行推导：一个 Session 投影从自己的 `gh pr create`/`gh pr view`/`gh pr edit`/`gh pr checkout` 与 `git push` 的 shell 结果、以及显式的 track/dismiss 记录里折出绑定；推送后或调用方报告工作分支时，再按 head 分支查一次打开状态的变更请求并把未绑定的记为 discovered。监听某 Session 时通过 `ctx.forge` 轮询这些绑定，Session 摘要把它们带给客户端。它介于 `forge`（轮询与读）与 `forge-panel`/`forge-bundle`（展示与开关）之间。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/*.json` | 多语言 | 6 | `[结构]` 聚合行：8 个语言文件，只有插件页 `meta.title`/`meta.description` 两项文案。 |
| `package.json` | 配置 | 91 | `[结构]` 包声明；peer 依赖 forge 与 session/projection/tools/shell 系列，运行期依赖 shell-quote 做命令切词。 |
| `README.i18n.yaml` | 文档 | 37 | `[结构]` 中英 README 逐节哈希，供双语同步校验。 |
| `README.md` / `README.zh.md` | 文档 | 105 | `[结构]` 包参考文档：绑定来源的判定规则、投影与监听、模型体验与已知限制。 |
| `src/commands.ts` | 源码 | 134 | `[精读]` 从 shell 工具的 JSON 参数里认出 `gh pr create`、`gh pr view`、`gh pr edit`、`gh pr checkout` 与 `git push`，并解析输出中的自有 PR URL、显式 URL/编号选择器与推送目标分支。 |
| `src/index.ts` | 源码 | 264 | `[精读]` `ForgeSessionService`：按 Session 聚合监听方、消费投影绑定、推送后/报告分支时按 head 查打开状态的 PR，并用 `ctx.forge` 为可见绑定建立共享 watch。 |
| `src/projection.ts` | 源码 | 156 | `[精读]` `forgeChangeRequests` 投影：把 shell 结果与 `plugin:forge-session/binding` 记录折成 pending/bindings/pushes，并暴露给客户端；含「原始 JSON 文本不含 gh/push 就不解析」的快速剪枝。 |
| `src/reference-lookup.ts` | 源码 | 82 | `[精读]` 对 `gh pr view 12` 这类未限定仓库的引用，用同一 shell 服务、cwd、托管环境与沙箱策略执行只读查询，只把确认过的 URL 持久化；失败/取消不改绑定，replay 不查询。 |
| `src/references.ts` | 源码 | 128 | `[精读]` 在保留引号与命令分隔的前提下解析 `gh` 调用：支持 URL 选择器与「编号 + `--repo/-R`」，拒绝变量展开、多行脚本、子命令替换与未知选项；无仓库限定时只对单条简单命令给出 lookup。 |
| `src/types.ts` | 源码 | 108 | `[结构]` 绑定词汇：四种绑定来源（created/referenced/discovered/tracked）、命令证据、`plugin:forge-session/binding` 记录载荷与投影状态。 |
| `tests/commands.spec.ts` | 测试 | 154 | `[结构]` 被测对象：`src/commands.ts` 的命令识别与输出解析。 |
| `tests/fixtures.ts` | fixture | 209 | `[结构]` 测试共用的假 shell 执行、假 forge 与服务装配。 |
| `tests/loader-composition.spec.ts` | 测试 | 386 | `[结构]` 被测对象：本包在加载器中的组合——与 session/projection/tools 服务的依赖顺序与逐层装配。 |
| `tests/projection.spec.ts` | 测试 | 266 | `[结构]` 被测对象：`src/projection.ts` 的状态折叠。 |
| `tests/reference-lookup.spec.ts` | 测试 | 191 | `[结构]` 被测对象：`src/reference-lookup.ts` 的查询与持久化时机。 |
| `tests/references.spec.ts` | 测试 | 69 | `[结构]` 被测对象：`src/references.ts` 的 CLI 引用解析边界。 |
| `tests/service.spec.ts` | 测试 | 419 | `[结构]` 被测对象：`src/index.ts` 的绑定聚合、发现与 watch 生命周期。 |
| `tsconfig.json` | 配置 | 48 | `[结构]` 包的 TypeScript 编译配置。 |

### experimental/hook-protocol — 两个 hook 方言共享的协议库

包定位：Claude Code 与 Codex 都有「在固定钩子点执行外部命令并按输出决定放行/阻断」的机制，但两者在入参载荷、环境变量、matcher 语义与扩展点映射上不同。本包只抽公共部分：matcher 匹配与命令组选择、经 `ctx.shell` 执行命令、把退出码与 stdout 解码成统一结论、把多个 hook 的结论按最严格优先级合并、写 log-only 的 `hook/*` 事件、以及「无人 await 的 hook 运行」在 fiber 释放时的静默退出跟踪。它不注册任何插件，仅供 `hooks-claude-code` 与 `hooks-codex` 两个桥接包引用。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `package.json` | 配置 | 42 | `[结构]` 包声明；纯库无 cordis 插件入口，peer 依赖 shell 与 session 供桥接包传入。 |
| `README.i18n.yaml` | 文档 | 61 | `[结构]` 中英 README 逐节哈希，供双语同步校验。 |
| `README.md` / `README.zh.md` | 文档 | 144 | `[结构]` 包参考文档：两方言的差异矩阵、匹配与合并规则、事件契约、静默退出要求。 |
| `src/codec.ts` | 源码 | 134 | `[精读]` 解码 hook 进程结果：退出 0 可带结构化 JSON 或纯文本、退出 2 视为阻断并用 stderr 作理由、其余退出为非阻断错误；顶层 `decision` 只接受 `approve`/`block`，越界的 `deny` 被丢弃以免误判。 |
| `src/detached.ts` | 源码 | 62 | `[精读]` `createDetachedRuns`：登记无人 await 的 hook 运行（连同后续处理链），`drain` 先触发 abort 再等全部 settle，作为桥接包的 disposer 保证不留下进程或迟到回调。 |
| `src/events.ts` | 源码 | 104 | `[精读]` 追加成对的 `hook/invoked` 与 `hook/result` 日志事件（按 `handlerId` 关联），并把 stderr 压到固定上限。 |
| `src/index.ts` | 源码 | 25 | `[精读]` 公开面：只重导出 matcher/codec/runner/merge/events/detached 与其类型，不实现任何插件逻辑。 |
| `src/matcher.ts` | 源码 | 80 | `[精读]` 匹配器：缺失/空/`*` 匹配全部；Claude 把「字母数字下划线竖线」当字面量候选、其余当正则，Codex 一律非锚定正则；运行期非法正则当作不匹配，配置解析期用 `matcherDiagnostic` 报诊断。 |
| `src/merge.ts` | 源码 | 100 | `[精读]` `mergeHookOutputs`：权限取 `deny > ask > allow`、首个 `continue:false` 粘住、理由按名次拼接、上下文与系统消息按 hook 顺序累积。 |
| `src/runner.ts` | 源码 | 106 | `[精读]` `runHook`：经 shell 执行器跑命令（借其凭据清洗、进程组取消与超时），由桥接方提供 stdin 载荷与方言环境，可选是否补尾换行；默认超时 600 秒。 |
| `src/types.ts` | 源码 | 137 | `[精读]` 方言中立词汇与事件增强：`HookDialect`/`MatcherMode`/`CommandHook`/`HookOutput`，以及 `hook/invoked`、`hook/result` 两个 Session 事件的字段声明。 |
| `tests/codec.spec.ts` | 测试 | 193 | `[结构]` 被测对象：`src/codec.ts` 的退出码与 JSON/纯文本解码。 |
| `tests/detached.spec.ts` | 测试 | 68 | `[结构]` 被测对象：`src/detached.ts` 的 track/drain 静默退出语义。 |
| `tests/events.spec.ts` | 测试 | 121 | `[结构]` 被测对象：`src/events.ts` 的事件成对与 stderr 截断。 |
| `tests/matcher.spec.ts` | 测试 | 103 | `[结构]` 被测对象：`src/matcher.ts` 的两方言匹配与诊断。 |
| `tests/merge.spec.ts` | 测试 | 100 | `[结构]` 被测对象：`src/merge.ts` 的优先级合并。 |
| `tests/runner.spec.ts` | 测试 | 168 | `[结构]` 被测对象：`src/runner.ts` 的命令执行、超时与取消。 |
| `tsconfig.json` | 配置 | 24 | `[结构]` 包的 TypeScript 编译配置。 |

### experimental/hooks-claude-code — 运行 Claude Code command 钩子的桥接包

包定位：让用户不必重写已有的 `hooks.json` / settings 钩子——在 Session 开始、提示词提交、工具执行前后、Stop 与 subagent 起停这些扩展点上，按 Claude Code 的语义运行 command 钩子，并可用模型可见的理由阻塞、附加上下文或强制再走一轮。它与 `hooks-codex` 是同一套共享协议的两个方言实现：本包自己负责 Claude 的载荷、环境（`CLAUDE_PROJECT_DIR` 等）、`${CLAUDE_PLUGIN_ROOT}` 替换与决策映射，执行与解码交给 `hook-protocol`。`updatedInput` 只记录并告警、不生效；需要 Claude Code 之外的行为应改用原生插件。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/*.json` | 多语言 | 6 | `[结构]` 聚合行：8 个语言文件，只有插件页 `meta.title`/`meta.description` 两项文案。 |
| `package.json` | 配置 | 66 | `[结构]` 包声明；cordis 与 agent/llm/session/tools 系列为 peer，hook-protocol 为同仓依赖。 |
| `README.i18n.yaml` | 文档 | 88 | `[结构]` 中英 README 逐节哈希，供双语同步校验。 |
| `README.md` / `README.zh.md` | 文档 | 195 | `[结构]` 包参考文档：支持的钩子点与字段、载荷形状、决策映射、与 Claude Code 的差异、配置项。 |
| `src/config.ts` | 源码 | 123 | `[精读]` 把 Claude 的「事件 → matcher 组」格式解析成共享 `MatcherGroup`：只保留 command 钩子（其他类型作为 skipped 交回以便告警），并在解析期替换插件根与项目目录变量。 |
| `src/index.ts` | 源码 | 365 | `[结构]` 插件与桥接主体：读配置、在七个扩展点上选取匹配钩子、构造 Claude 载荷、调用共享执行器、把合并结论映射成 `PreStepDecision`/`PreToolDecision`/`PostToolDecision`，并登记 detached 运行与 `hook/*` 事件。 |
| `tests/bridge.spec.ts` | 测试 | 479 | `[结构]` 被测对象：`src/index.ts` 的各钩子点决策映射与上下文注入。 |
| `tests/config.spec.ts` | 测试 | 95 | `[结构]` 被测对象：`src/config.ts` 的解析、skipped 收集与变量替换。 |
| `tests/coverage-cases.ts` | fixture | 804 | `[结构]` 覆盖矩阵用例表：按 `config`/`context`/`edge-paths`/`stop` 分组给出输入与期望，供下面四个 3 行入口重复注册。 |
| `tests/coverage-config.spec.ts` | 测试 | 3 | `[结构]` 被测对象：`tests/coverage-cases.ts` 的 `config` 分组。 |
| `tests/coverage-context.spec.ts` | 测试 | 3 | `[结构]` 被测对象：`tests/coverage-cases.ts` 的 `context` 分组（附加上下文注入）。 |
| `tests/coverage-edge-paths.spec.ts` | 测试 | 3 | `[结构]` 被测对象：`tests/coverage-cases.ts` 的 `edge-paths` 分组。 |
| `tests/coverage-stop.spec.ts` | 测试 | 3 | `[结构]` 被测对象：`tests/coverage-cases.ts` 的 `stop` 分组（强制继续/停止）。 |
| `tsconfig.json` | 配置 | 45 | `[结构]` 包的 TypeScript 编译配置。 |

### experimental/hooks-codex — 运行 Codex command 钩子的桥接包

包定位：与上一个包同构但面向 Codex：只支持五个钩子点（SessionStart、提示词提交、工具前后、Stop），matcher 一律非锚定正则，载荷是 snake_case 且 stdin 不补尾换行，没有钩子环境变量与命令替换，也没有预工具审批/改写路径——只认阻断类决策。共享的匹配、执行、解码、合并与静默退出仍由 `hook-protocol` 提供，本包只写 Codex 特有的那层翻译；超出该子集的行为应改用原生插件。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/*.json` | 多语言 | 6 | `[结构]` 聚合行：8 个语言文件，只有插件页 `meta.title`/`meta.description` 两项文案。 |
| `package.json` | 配置 | 63 | `[结构]` 包声明；peer 依赖与 Claude 桥接一致，依赖 hook-protocol 复用协议。 |
| `README.i18n.yaml` | 文档 | 88 | `[结构]` 中英 README 逐节哈希，供双语同步校验。 |
| `README.md` / `README.zh.md` | 文档 | 190 | `[结构]` 包参考文档：五个钩子点、Codex 载荷与匹配差异、只支持阻断的限制、配置项。 |
| `src/config.ts` | 源码 | 86 | `[精读]` 解析 Codex 的五事件配置（可包一层或裸事件表）：只保留同步 command 钩子，`async: true` 与其他类型记为 skipped 并附原因，未知事件与畸形条目忽略；不做命令替换。 |
| `src/index.ts` | 源码 | 328 | `[结构]` 插件与桥接主体：在五个扩展点上选钩子、构造 snake_case 载荷（无尾换行、无额外环境）、执行并合并结论，只把阻断映射成决策，同时登记 detached 运行与事件。 |
| `tests/bridge.spec.ts` | 测试 | 299 | `[结构]` 被测对象：`src/index.ts` 的钩子点行为与阻断映射。 |
| `tests/config.spec.ts` | 测试 | 86 | `[结构]` 被测对象：`src/config.ts` 的解析与 skipped 原因。 |
| `tests/coverage-cases.ts` | fixture | 659 | `[结构]` 覆盖矩阵用例表：按 `post-tool`/`prompt`/`result-shape` 分组给出输入与期望。 |
| `tests/coverage-post-tool.spec.ts` | 测试 | 3 | `[结构]` 被测对象：`tests/coverage-cases.ts` 的 `post-tool` 分组。 |
| `tests/coverage-prompt.spec.ts` | 测试 | 3 | `[结构]` 被测对象：`tests/coverage-cases.ts` 的 `prompt` 分组。 |
| `tests/coverage-result-shape.spec.ts` | 测试 | 3 | `[结构]` 被测对象：`tests/coverage-cases.ts` 的 `result-shape` 分组。 |
| `tsconfig.json` | 配置 | 42 | `[结构]` 包的 TypeScript 编译配置。 |


### experimental/inspector — 跨 realm 的 DevTools 调试中枢

包定位：把一次运行的 dsh Host 与它的浏览器 Client 同时变成 Chrome DevTools 可调试的目标——Host 的 Console、断点、Sources 与 fetch 捕获，加上每个 Client 的 Console 求值与元素树，两端共用一棵 Cordis 树。它由三块拼成：Host 插件起一个 Worker 线程、注册 DevTools 静态资源与 CDP 反向代理并注入 Client bootstrap；浏览器 Client 插件采集本 realm 的观测，经带令牌的 `/ingest` WebSocket 直连 Worker；Worker 是唯一持有 CDP 状态与网络正文的地方，`shared/` 则是与环境无关的线协议、CDP 归一化模型与 Cordis 快照投影。它不下发任何模型上下文，只服务本地开发者，并作为 `inspector-profile` bundle 的三块之一被启用。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `assets/devtools/connect.js` | 资源 | 12 | `[精读]` DevTools 入口前执行的 bootstrap 脚本：按 `disableLocaleInfoBar` 关掉语言条、把 `clientSourceId` 透传到同源 `cdp` 端点并回写 `ws/wss` 与默认 `console` 面板。 |
| `assets/devtools/LICENSE` | 文档 | 27 | `[结构]` 随 DevTools 前端一起分发的 Chromium 许可证文本。 |
| `cordis.patch.yml` | 配置 | 5 | `[精读]` 本地调试 overlay：向 Loader 插入 `experimental-inspector` 一行，入口指向已构建的 `./lib/index.js`。 |
| `cordis.source.patch.yml` | 配置 | 6 | `[精读]` 供 `pnpm run demo:inspector` 使用的源码 overlay，入口指向 `./src/index.ts`，走 CLI 的 tsx loader，不安装 profile。 |
| `icon.svg` | 资源 | 23 | `[结构]` 插件列表图标（36×36 线性图标）。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | `[结构]` 聚合行：8 个语言文件，底部 NodeJS inspector 面板的标题、关闭、拖拽高度与 iframe 标题文案。 |
| `package.json` | 配置 | 87 | `[结构]` 包声明：Host/Client 双入口导出、`files` 只带构建后的 DevTools 资源、锁定 `chrome-devtools-frontend` 版本，并声明 host/client 两套 tsconfig 的构建脚本。 |
| `README.i18n.yaml` | 配置 | 49 | `[结构]` 中英 README 的标题与段落锚点配对清单。 |
| `README.md` | 文档 | 180 | `[精读]` 英文版包说明：三方运行布局、24 项配置字段、Observation API、Cordis 树与 Elements 投影、fetch 捕获语义、安全边界与已知限制。 |
| `README.zh.md` | 文档 | 180 | `[结构]` 上述包说明的中文版，与英文版逐节对应。 |
| `scripts/build-devtools.ts` | 脚本 | 54 | `[精读]` 离线把 npm 版 DevTools 源码编到 `lib/devtools`，逐文件算 sha256 写 `resource-manifest.json`，全程不写 node_modules。 |
| `scripts/devtools/inputs.ts` | 脚本 | 48 | `[结构]` 固定 npm 源包的发现与「生成式」构建输入清单（CSS 文本模块、图片变量、英文 locale 常量）。 |
| `scripts/devtools/source.ts` | 脚本 | 83 | `[结构]` 针对 pin 住版本的源码级适配与 `DEVTOOLS_NPM_VERSION`/`DEVTOOLS_SOURCE_REVISION` 常量来源。 |
| `scripts/devtools/vite.ts` | 脚本 | 132 | `[结构]` 用工作区 Vite 编译该前端，产出 ESM 入口、共享 chunk、显式 Worker 与运行时抓取资源。 |
| `src/client/bottom/keyboard.ts` | 客户端源码 | 37 | `[结构]` 同源 iframe 内的按键转发：把父窗口注册的命令绑定投递进 DevTools 页。 |
| `src/client/bottom/locales.ts` | 客户端源码 | 78 | `[结构]` 底部面板与快捷键命令的八语文案字面量表。 |
| `src/client/bottom/page.module.css` | 资源 | 60 | `[结构]` 底部面板样式：`--inspector-height` 驱动的可拖拽分区与头部。 |
| `src/client/bottom/page.tsx` | 客户端源码 | 98 | `[精读]` 注册 `shell.bottom` 槽位与 Ctrl/Cmd+Shift+. 快捷键：iframe 首次打开才加载、折叠后保持挂载、关闭时把焦点还给打开者。 |
| `src/client/bottom/resize.tsx` | 客户端源码 | 50 | `[结构]` 指针捕获的顶部把手，拖拽改高度并夹在视口内，另接受 Up/Down/Home/End。 |
| `src/client/bridge/controller.ts` | 客户端源码 | 22 | `[结构]` 浏览器侧 bridge 的装配入口，串起 transport、publisher、dispatcher 与 lifecycle。 |
| `src/client/bridge/dispatcher.ts` | 客户端源码 | 86 | `[结构]` 把 Worker 下发的已校验帧分派给浏览器 realm 的 Runtime/Console/Sources 能力实现。 |
| `src/client/bridge/lifecycle.ts` | 客户端源码 | 45 | `[结构]` Client bridge 的断线重连：指数退避后重开 `/ingest` 并续用逻辑 source id。 |
| `src/client/bridge/locales.ts` | 客户端源码 | 2 | `[结构]` 未命名 Client realm 在调试协议里的兜底显示名。 |
| `src/client/bridge/publisher.ts` | 客户端源码 | 110 | `[结构]` 跨重连 WebSocket 的观测缓冲：有界队列、溢出记为序号空洞、不阻塞被观测业务。 |
| `src/client/bridge/rpc.ts` | 客户端源码 | 21 | `[结构]` 复用活动 WebSocket 的 Client 侧非 CDP 查询桥。 |
| `src/client/bridge/transport.ts` | 客户端源码 | 353 | `[精读·读入口与导出面]` `/ingest` WebSocket 端点：子协议令牌认证、帧编解码、发送队列与背压，以及每个 source generation 的登记。结构上分「连接建立 / 帧收发 / 关闭通知」三段。 |
| `src/client/cdp/console.ts` | 客户端源码 | 176 | `[结构]` Client Console 观测：接管 `console.*` 与未捕获异常，向所有活动 DevTools Runtime 会话按需广播。 |
| `src/client/cdp/debugger.ts` | 客户端源码 | 11 | `[结构]` 显式声明 Client 主动调试不可用，请求一律回不支持错误。 |
| `src/client/cdp/errors.ts` | 客户端源码 | 10 | `[结构]` 区分「传输失败」与「被测 JS 抛错」的 Client Runtime 错误归类。 |
| `src/client/cdp/heap-profiler.ts` | 客户端源码 | 11 | `[结构]` 声明 Client 堆快照不受支持。 |
| `src/client/cdp/index.ts` | 客户端源码 | 26 | `[结构]` 浏览器 realm 的 CDP 能力声明集合，供 Worker 侧 realm 定义读取。 |
| `src/client/cdp/objects.ts` | 客户端源码 | 406 | `[结构]` Client 本地对象句柄表与 CDP 兼容的 RemoteObject 序列化（含函数/集合/引用循环处理，未逐行读）。 |
| `src/client/cdp/profiler.ts` | 客户端源码 | 11 | `[结构]` 声明 Client CPU 采样不受支持。 |
| `src/client/cdp/properties.ts` | 客户端源码 | 160 | `[结构]` `Runtime.getProperties` 的惰性属性枚举与访问器描述符构造。 |
| `src/client/cdp/runtime.ts` | 客户端源码 | 501 | `[结构]` Client realm 的 typed Runtime 命令执行器：求值、调用、await、释放与上下文列表（未读全文，按导出面与同族 Host 实现判断）。 |
| `src/client/cdp/sources.ts` | 客户端源码 | 248 | `[结构]` 只读源码目录：只登记 Inspector 自身的 `lib/client.js` 与 source map，按块返回内容。 |
| `src/client/cdp/stack.ts` | 客户端源码 | 78 | `[结构]` 浏览器栈解析，归一化成 realm 中立的 CallFrame。 |
| `src/client/index.ts` | 客户端源码 | 3 | `[结构]` 浏览器入口，仅聚合导出 `plugin.ts`。 |
| `src/client/inspection/cordis.ts` | 客户端源码 | 3 | `[结构]` Client 侧 Cordis 快照发布入口，复用共享 collector。 |
| `src/client/inspection/network.ts` | 客户端源码 | 4 | `[结构]` 显式说明 Client 网络观测在当前 source 生产者里未启用。 |
| `src/client/inspection/realm.ts` | 客户端源码 | 126 | `[结构]` 稳定 Client 身份：source id 存 `sessionStorage`、用 Web Lock 占位，每个 WebSocket 世代生成新描述符。 |
| `src/client/plugin.ts` | 客户端源码 | 160 | `[精读]` Client 插件主体：从注入全局或 `/api/experimental-inspector/bootstrap` 取参数，串行化 replace，注册 `ctx.inspector`、Cordis 树发布与底部面板，卸载时按序回滚。 |
| `src/css-modules.d.ts` | 配置 | 5 | `[结构]` Client 打包产出的 CSS Modules 类型声明。 |
| `src/host/bridge/controller.ts` | 源码 | 354 | `[结构]` Host 控制器：默认值解析、spawn Worker 线程、转移 MessagePort、就绪超时与优雅关停。 |
| `src/host/bridge/dispatcher.ts` | 源码 | 61 | `[结构]` MessagePort 上收到的 Worker 帧分派到 Host 侧处理器。 |
| `src/host/bridge/lifecycle.ts` | 源码 | 125 | `[结构]` Worker 崩溃隔离与关停协调：异常退出只让本次 inspector 失效，不拖垮 Host。 |
| `src/host/bridge/publisher.ts` | 源码 | 81 | `[结构]` 专用 MessagePort 上的 Host 观测缓冲发布。 |
| `src/host/bridge/rpc.ts` | 源码 | 22 | `[结构]` Host 侧非 CDP 查询桥，复用同一 MessagePort。 |
| `src/host/bridge/transport.ts` | 源码 | 89 | `[结构]` Host realm 的观测发布传输封装。 |
| `src/host/cdp/console.ts` | 源码 | 20 | `[结构]` 说明 Host Console 由 Worker 内的 Node inspector 会话直接服务，本文件只留能力声明。 |
| `src/host/cdp/debugger.ts` | 源码 | 11 | `[结构]` 同上前提下的 Host 调试能力声明。 |
| `src/host/cdp/errors.ts` | 源码 | 10 | `[结构]` 对误路由到 Host 的 Client 风格 CDP 命令返回显式失败。 |
| `src/host/cdp/heap-profiler.ts` | 源码 | 11 | `[结构]` Host 堆快照同样由 Worker 原生会话服务，此处仅声明。 |
| `src/host/cdp/index.ts` | 源码 | 28 | `[结构]` Host realm 的 CDP 能力声明集合。 |
| `src/host/cdp/objects.ts` | 源码 | 12 | `[结构]` 说明 Host 的 RemoteObject 句柄不跨 source bridge。 |
| `src/host/cdp/profiler.ts` | 源码 | 11 | `[结构]` Host CPU 采样由 Worker 原生会话服务的声明。 |
| `src/host/cdp/properties.ts` | 源码 | 11 | `[结构]` Host 属性枚举不经 source bridge 的声明。 |
| `src/host/cdp/runtime.ts` | 源码 | 42 | `[结构]` Host Runtime 转发声明：实际执行在 Worker 的 Node inspector 会话。 |
| `src/host/cdp/sources.ts` | 源码 | 20 | `[结构]` Host Sources 由 Worker 原生会话提供的声明。 |
| `src/host/cdp/stack.ts` | 源码 | 4 | `[结构]` 声明 Host 栈与调用帧数据留在 Worker 侧会话内。 |
| `src/host/index.ts` | 源码 | 3 | `[结构]` Host 入口，聚合导出 `plugin.ts` 与公共类型。 |
| `src/host/inspection/cordis.ts` | 源码 | 3 | `[结构]` Host 侧 Cordis 快照发布入口。 |
| `src/host/inspection/network.ts` | 源码 | 244 | `[结构]` `globalThis.fetch` 全量捕获：克隆请求/响应体、限额截断、abort 与 reject 分别映射为 loadingFinished/loadingFailed，不延迟原响应返回。 |
| `src/host/inspection/realm.ts` | 源码 | 22 | `[结构]` Host source generation 的稳定描述符。 |
| `src/host/plugin.ts` | 源码 | 216 | `[精读]` Host 插件主体：先注册 bootstrap 路由再起 Worker；平台不支持 Worker 时只留 503 路由并告警；注册 `/inspector/devtools` 静态资源、CDP upgrade 反代、索引注入 `__DSH_INSPECTOR__`，并按 `--inspect` 打开 Chrome。 |
| `src/index.ts` | 源码 | 108 | `[精读]` 面向仓库的包入口：导出 `apply/name/inject`、24 字段 Schemastery `Config` 与全部公共类型，注入 `webServer`、`connection`。 |
| `src/shared/bridge/buffer.ts` | 源码 | 176 | `[结构]` realm 中立的有界缓冲：按记录数/字节双限排队，溢出折算为序号空洞。 |
| `src/shared/bridge/codec.ts` | 源码 | 4 | `[结构]` 桥接层对 JSON 值校验器的再导出。 |
| `src/shared/bridge/control-codec.ts` | 源码 | 153 | `[结构]` Host/Worker/注入 Client 三种生命周期值的精确解码器。 |
| `src/shared/bridge/ids.ts` | 源码 | 27 | `[结构]` 跨 realm 的四个品牌 ID（source、generation 等）的铸造与校验。 |
| `src/shared/bridge/messages/control.ts` | 源码 | 72 | `[结构]` Host→Worker 生命周期消息与 Worker 就绪结果，含 Client bootstrap 形状。 |
| `src/shared/bridge/messages/cordis.ts` | 源码 | 4 | `[结构]` Cordis 树快照在桥上的话题元数据。 |
| `src/shared/bridge/messages/network.ts` | 源码 | 12 | `[结构]` 捕获 fetch 所使用的观测话题名常量。 |
| `src/shared/bridge/messages/observation.ts` | 源码 | 391 | `[结构]` 两种载体共享的版本化 source 生命周期、观测与扩展帧定义。 |
| `src/shared/bridge/messages/query/codec.ts` | 源码 | 138 | `[结构]` 非 CDP 查询帧的精确解码。 |
| `src/shared/bridge/messages/query/commands.ts` | 源码 | 40 | `[结构]` 封闭的查询/结果模型（列服务、列事件、读树）。 |
| `src/shared/bridge/messages/query/frames.ts` | 源码 | 30 | `[结构]` source→Worker 的版本化查询帧信封。 |
| `src/shared/bridge/messages/query/index.ts` | 源码 | 5 | `[结构]` 查询协议的公共导出面。 |
| `src/shared/bridge/messages/runtime/command-codec.ts` | 源码 | 134 | `[结构]` Client Runtime 命令的线上解码器。 |
| `src/shared/bridge/messages/runtime/commands.ts` | 源码 | 101 | `[结构]` Runtime 命令/结果的封闭协议（求值、取属性、调用、释放）。 |
| `src/shared/bridge/messages/runtime/console-frames.ts` | 源码 | 147 | `[结构]` Client Console 会话与事件的类型化传输。 |
| `src/shared/bridge/messages/runtime/frames.ts` | 源码 | 213 | `[结构]` Worker→Client Runtime 操作的版本化信封。 |
| `src/shared/bridge/messages/runtime/index.ts` | 源码 | 5 | `[结构]` Runtime 协议的公共类型与边界解码器导出。 |
| `src/shared/bridge/messages/runtime/value-codec.ts` | 源码 | 334 | `[结构]` Runtime 结果与 RemoteObject 数据的线上解码（本块最长的编解码文件）。 |
| `src/shared/bridge/messages/sources/codec.ts` | 源码 | 127 | `[结构]` Client 源码目录操作与值的精确解码。 |
| `src/shared/bridge/messages/sources/commands.ts` | 源码 | 47 | `[结构]` 只读源码目录的操作与返回值形状。 |
| `src/shared/bridge/messages/sources/frames.ts` | 源码 | 143 | `[结构]` 源码目录操作的版本化信封。 |
| `src/shared/bridge/messages/sources/index.ts` | 源码 | 5 | `[结构]` 源码目录协议的公共导出面。 |
| `src/shared/bridge/publisher.ts` | 源码 | 45 | `[结构]` MessagePort 与 WebSocket 两套实现共用的 source 侧接口。 |
| `src/shared/bridge/query-reader.ts` | 源码 | 18 | `[结构]` 把 Cordis 读取器适配到查询通道。 |
| `src/shared/bridge/rpc.ts` | 源码 | 182 | `[结构]` Host/Client 共用的非 CDP 查询请求关联器（按请求 id 配对、超时结算）。 |
| `src/shared/bridge/validation.ts` | 源码 | 3 | `[结构]` 桥接层对共享不可信值校验原语的再导出。 |
| `src/shared/bridge/version.ts` | 源码 | 2 | `[结构]` 线协议版本常量，预发布对端只接受完全相同的版本。 |
| `src/shared/cdp/capabilities.ts` | 源码 | 28 | `[结构]` 每个 realm 显式声明的操作支持矩阵。 |
| `src/shared/cdp/console.ts` | 源码 | 46 | `[结构]` Runtime 后端产出的 realm 中立 Console 事件。 |
| `src/shared/cdp/debugger.ts` | 源码 | 78 | `[结构]` 活动调试后端使用的 realm 中立值（脚本、断点、暂停状态）。 |
| `src/shared/cdp/errors.ts` | 源码 | 30 | `[结构]` realm 中立的 JS 异常与栈信息。 |
| `src/shared/cdp/ids.ts` | 源码 | 12 | `[结构]` 归一化后端拥有的不透明 ID 品牌。 |
| `src/shared/cdp/index.ts` | 源码 | 11 | `[结构]` Runtime/Console/Source/Debugger 协议类型的聚合导出。 |
| `src/shared/cdp/operations.ts` | 源码 | 87 | `[结构]` realm 中立的 Runtime 操作与结果。 |
| `src/shared/cdp/property.ts` | 源码 | 31 | `[结构]` Runtime 后端返回的属性描述符形状。 |
| `src/shared/cdp/realm.ts` | 源码 | 162 | `[结构]` 被观测 JS realm 的后端接口：Runtime/Console/Source/Debugger 四类 backend。 |
| `src/shared/cdp/remote-object.ts` | 源码 | 78 | `[结构]` realm 中立的 JS 值描述，供后端与 CDP 投影共用。 |
| `src/shared/cdp/sources.ts` | 源码 | 19 | `[结构]` source 后端使用的 realm 中立脚本元数据。 |
| `src/shared/cordis/collector.ts` | 源码 | 198 | `[结构]` 共享的 Host/Client 投影：从活动 Context/Fiber 提取有界语义树。 |
| `src/shared/cordis/ids.ts` | 源码 | 9 | `[结构]` realm 本地对象注册表的不透明 ID 品牌。 |
| `src/shared/cordis/model.ts` | 源码 | 160 | `[结构]` 供非 CDP 读取者使用的消费者中立 Cordis 树模型。 |
| `src/shared/cordis/object-reference.ts` | 源码 | 23 | `[结构]` 对 source realm 内活动对象的不透明引用。 |
| `src/shared/cordis/object-registry.ts` | 源码 | 176 | `[结构]` realm 本地对象保留与身份分配（快照里只出现句柄）。 |
| `src/shared/cordis/observer.ts` | 源码 | 46 | `[结构]` 由生命周期驱动的 Cordis 树发布，Host/Client 两面共用。 |
| `src/shared/cordis/projector.ts` | 源码 | 78 | `[结构]` 纯函数投影：路由后的快照折成消费者中立树。 |
| `src/shared/cordis/publisher.ts` | 源码 | 25 | `[结构]` 两端共用的浏览器安全快照发布器。 |
| `src/shared/cordis/reader.ts` | 源码 | 24 | `[结构]` 与环境无关的 Cordis 树读取器接口。 |
| `src/shared/cordis/snapshot.ts` | 源码 | 111 | `[结构]` CDP 无关的快照模型（Context/Fiber 节点与版本号）。 |
| `src/shared/dispose.ts` | 源码 | 23 | `[精读]` 按逆序执行全部注销动作、最后关闭传输，失败聚合成 `AggregateError`。 |
| `src/shared/identity.ts` | 源码 | 19 | `[结构]` 共享的品牌 ID 构造器，不指定协议归属。 |
| `src/shared/index.ts` | 源码 | 18 | `[精读]` 与环境无关的公共出口：桥消息、编解码、Cordis 模型、CDP 类型与 RPC 一次性摊开导出。 |
| `src/shared/json.ts` | 源码 | 79 | `[精读]` 所有跨 realm 消息允许的 JSON 值：无损判定（拒绝 undefined/循环/BigInt）与取用帮助函数。 |
| `src/shared/network/event-source.ts` | 源码 | 77 | `[结构]` 捕获响应里 SSE 的增量 UTF-8 解析器。 |
| `src/shared/network/observation.ts` | 源码 | 60 | `[结构]` 发往 Worker 的全量 fetch 观测载荷形状。 |
| `src/shared/service.ts` | 源码 | 32 | `[精读]` `ctx.inspector` 的共享实现：`publish` 直接落给本 realm 的 publisher，`cordis` 读查询通道。 |
| `src/shared/validation.ts` | 源码 | 93 | `[结构]` 版本化线协议用的精确对象读取原语。 |
| `src/shared/web.ts` | 源码 | 26 | `[精读]` bootstrap 路径常量、`clientSourceId` 查询参数与严格的选择器解析（重复或非法抛错）。 |
| `src/worker/bridge/endpoint.ts` | 源码 | 316 | `[结构]` Worker 持有的三类端点：`/json` 发现、`/devtools/page/<id>` CDP WebSocket、`/ingest` Client 入口。 |
| `src/worker/bridge/hub.ts` | 源码 | 323 | `[结构]` source 世代登记、观测分发与扩展传输（每 source 有界队列与序号空洞检测）。 |
| `src/worker/bridge/runtime-rpc.ts` | 源码 | 380 | `[结构]` 合成 Client 上下文与真实 source 世代之间的 Runtime 路由。 |
| `src/worker/bridge/session.ts` | 源码 | 26 | `[结构]` Worker 侧 Client 会话的共享清理投递。 |
| `src/worker/bridge/source-rpc.ts` | 源码 | 192 | `[结构]` Client 只读源码目录的请求路由与有界读。 |
| `src/worker/cdp/domains/debugger/cdp-params.ts` | 源码 | 52 | `[结构]` Debugger 域请求参数校验。 |
| `src/worker/cdp/domains/debugger/index.ts` | 源码 | 6 | `[结构]` Debugger 域导出面。 |
| `src/worker/cdp/domains/debugger/projector.ts` | 源码 | 114 | `[结构]` 脚本与调试事件到 CDP 的投影。 |
| `src/worker/cdp/domains/debugger/script-registry.ts` | 源码 | 117 | `[结构]` 连接内 ScriptId 到 realm source 后端的映射。 |
| `src/worker/cdp/domains/debugger/session.ts` | 源码 | 351 | `[结构]` 每个 DevTools 连接一份的 Debugger 会话，跨 Host/Client realm 路由源码操作。 |
| `src/worker/cdp/domains/dom/index.ts` | 源码 | 4 | `[结构]` Cordis 语义 DOM 域的导出面。 |
| `src/worker/cdp/domains/dom/model.ts` | 源码 | 325 | `[结构]` 快照到「连接无关语义 DOM」的 Worker 侧投影模型。 |
| `src/worker/cdp/domains/dom/session.ts` | 源码 | 555 | `[结构]` 每连接只读 DOM 会话：深度受限下发、childNodeCount 补全、增量插入/移除事件。 |
| `src/worker/cdp/domains/native.ts` | 源码 | 55 | `[结构]` realm 迁移期保留的 Host 原生 CDP 方法适配器。 |
| `src/worker/cdp/domains/network/session.ts` | 源码 | 250 | `[结构]` 基于 Worker 网络存储的 CDP Network 投影（请求、正文、流）。 |
| `src/worker/cdp/domains/runtime/cdp-params.ts` | 源码 | 256 | `[结构]` 转发给 Client realm 的 CDP Runtime 参数校验与归一化。 |
| `src/worker/cdp/domains/runtime/index.ts` | 源码 | 3 | `[结构]` Client 感知 Runtime 域的导出面。 |
| `src/worker/cdp/domains/runtime/object-table.ts` | 源码 | 323 | `[结构]` 每个 CDP 连接的 RemoteObject 路由表，跨 realm 分配与回收句柄。 |
| `src/worker/cdp/domains/runtime/session.ts` | 源码 | 475 | `[结构]` 每 DevTools 连接的 Runtime 会话：Host/Client 统一路由求值、取属性、调用与 await。 |
| `src/worker/cdp/ids.ts` | 源码 | 53 | `[结构]` 单个 Worker 侧 CDP 连接拥有的不透明 ID。 |
| `src/worker/cdp/protocol.ts` | 源码 | 82 | `[结构]` Worker 自有的最小 CDP 请求/传输类型。 |
| `src/worker/cdp/realm-sessions.ts` | 源码 | 134 | `[结构]` 从共享 realm 注册表为每个连接开启 RealmSessions。 |
| `src/worker/cdp/session.ts` | 源码 | 134 | `[结构]` 一个 DevTools 连接：本地域显式路由 + 一条私有 Host V8 会话。 |
| `src/worker/cdp/target.ts` | 源码 | 77 | `[结构]` 暴露 Network/Console/Sources 所需的最小 page target CDP 方法集。 |
| `src/worker/entry.ts` | 源码 | 60 | `[精读]` Worker 线程引导：校验 `workerData` 与 MessagePort、解析配置、起 server、回 ready/failure 并支持 stop。 |
| `src/worker/inspection/cordis-query.ts` | 源码 | 17 | `[结构]` 与载体无关的 Cordis 树查询执行。 |
| `src/worker/inspection/cordis-store.ts` | 源码 | 248 | `[结构]` Worker 侧的 Cordis 快照仓库：按 source 世代保存、限制节点数、保留最近 N 棵断连树。 |
| `src/worker/inspection/network-store.ts` | 源码 | 449 | `[结构]` Worker 侧 fetch 观测与正文仓库：保留上限、截断标记与正文分块检索。 |
| `src/worker/inspection/query-router.ts` | 源码 | 255 | `[结构]` 非 CDP 查询的准入、执行与有界结算。 |
| `src/worker/inspection/realm.ts` | 源码 | 54 | `[结构]` 活动 Host/Client realm 的 Worker 生命周期模型。 |
| `src/worker/inspection/realm-store.ts` | 源码 | 116 | `[结构]` Host 与 Client realm 定义的注册表。 |
| `src/worker/realms/client/bridge.ts` | 源码 | 26 | `[结构]` 单个已连接 Client realm 的 Worker 侧依赖集合。 |
| `src/worker/realms/client/console.ts` | 源码 | 40 | `[结构]` 基于 typed Console 事件传输的 ConsoleBackend 实现。 |
| `src/worker/realms/client/debugger.ts` | 源码 | 11 | `[结构]` 在出现可暂停盲的页内代理前，显式的 Client 调试能力占位。 |
| `src/worker/realms/client/index.ts` | 源码 | 104 | `[结构]` 由 Runtime/Console/Source 三后端组装出的 Client realm 定义。 |
| `src/worker/realms/client/runtime.ts` | 源码 | 167 | `[结构]` 基于 Worker→Client typed 传输的 RuntimeBackend。 |
| `src/worker/realms/client/scripts.ts` | 源码 | 27 | `[结构]` Client 目录键与通用 Runtime 脚本键之间的稳定翻译。 |
| `src/worker/realms/client/sources.ts` | 源码 | 122 | `[结构]` 基于有界浏览器源码目录传输的 SourceBackend。 |
| `src/worker/realms/client/values.ts` | 源码 | 162 | `[结构]` Client 线上值到 realm 中立 Runtime 值的转换。 |
| `src/worker/realms/host/bridge.ts` | 源码 | 164 | `[结构]` 每 DevTools 连接伸向 Host 主线程真实 V8 inspector target 的桥。 |
| `src/worker/realms/host/console.ts` | 源码 | 90 | `[结构]` 基于 Node Runtime 原生通知的 ConsoleBackend。 |
| `src/worker/realms/host/debugger.ts` | 源码 | 167 | `[结构]` 基于单条原生 Node inspector 会话的 DebuggerBackend。 |
| `src/worker/realms/host/index.ts` | 源码 | 67 | `[结构]` 以连接本地 Node inspector 会话为底的 Host realm 适配器。 |
| `src/worker/realms/host/runtime.ts` | 源码 | 338 | `[结构]` 基于原生 Node inspector 会话的 RuntimeBackend（求值、属性、调用、上下文）。 |
| `src/worker/realms/host/scripts.ts` | 源码 | 13 | `[结构]` Host 原生脚本身份到归一化 source/debugger 值的转换。 |
| `src/worker/realms/host/sources.ts` | 源码 | 99 | `[结构]` 基于 Node Debugger 原生通知的 SourceBackend。 |
| `src/worker/realms/host/values.ts` | 源码 | 34 | `[结构]` Node 原生 Inspector 返回值的小型校验器集合。 |
| `src/worker/server.ts` | 源码 | 111 | `[精读]` Worker 装配：网络存储/域名、Cordis 存储与 DOM 后端、realm 注册表、查询路由、source hub、端点与幂等关停顺序。 |
| `tests/bootstrap-route.host.spec.ts` | 测试 | 195 | `[结构]` 被测对象：`src/host/plugin.ts` 的 bootstrap 路由——Worker 尚未就绪时请求等待、失败返回 503、调用方 abort 提前结束。 |
| `tests/bottom.client.spec.tsx` | 测试 | 203 | `[结构]` 被测对象：`src/client/bottom/page.tsx` 的槽位注册、快捷键开合、懒加载 iframe 与焦点还原。 |
| `tests/bottom-keyboard.client.spec.ts` | 测试 | 73 | `[结构]` 被测对象：`src/client/bottom/keyboard.ts` 的 iframe 按键转发。 |
| `tests/built-lib.e2e.ts` | 测试 | 91 | `[结构]` 构建产物端到端检查：`lib` 内的 DevTools 资源与清单齐备。 |
| `tests/client-browser.e2e.ts` | 测试 | 356 | `[结构]` 浏览器侧端到端：Client 采集经 `/ingest` 进入 Worker 并在 DevTools 中可见。 |
| `tests/client-runtime.client.spec.ts` | 测试 | 296 | `[结构]` 被测对象：`src/client/cdp/runtime.ts` 的求值、属性与调用结果形状。 |
| `tests/client-sources.client.spec.ts` | 测试 | 173 | `[结构]` 被测对象：`src/client/cdp/sources.ts` 的只读源码目录与分块读取。 |
| `tests/client-stack.client.spec.ts` | 测试 | 31 | `[结构]` 被测对象：`src/client/cdp/stack.ts` 的栈帧解析。 |
| `tests/client-stack.host.spec.ts` | 测试 | 30 | `[结构]` 被测对象：Host 侧栈帧归一化（`src/worker/realms/host/*`）。 |
| `tests/cordis-collector.host.spec.ts` | 测试 | 122 | `[结构]` 被测对象：`src/shared/cordis/collector.ts` 从活动插件收集 Context/Fiber 身份与父子关系。 |
| `tests/cordis-model.host.spec.ts` | 测试 | 225 | `[结构]` 被测对象：`src/shared/cordis/model.ts` 与投射器的校验和投影。 |
| `tests/cordis-query.host.spec.ts` | 测试 | 349 | `[结构]` 被测对象：`src/worker/inspection/query-router.ts` 的查询准入与结果。 |
| `tests/cordis-tree.host.spec.ts` | 测试 | 1204 | `[结构]` 被测对象：Host 驱动的 Cordis 树集成（快照、增量、断连保留）。超大用例，未逐行读。 |
| `tests/debugger.e2e.ts` | 测试 | 198 | `[结构]` 端到端：spawn 子进程，通过 Worker 暂停/恢复 Host 主线程并取调用栈。 |
| `tests/devtools-build.e2e.ts` | 测试 | 60 | `[结构]` 构建端到端：离线编译不改 npm 输入、包含图外资源。 |
| `tests/devtools-selection.host.spec.ts` | 测试 | 44 | `[结构]` 被测对象：`src/shared/web.ts` 与 upgrade 路由——每连接 Client 选择与非法选择拒绝。 |
| `tests/devtools-source.host.spec.ts` | 测试 | 293 | `[结构]` 被测对象：`scripts/devtools/*` 的源码适配层，在独立 VM 中求值，npm fixture 只读。 |
| `tests/dispose.host.spec.ts` | 测试 | 27 | `[结构]` 被测对象：`src/shared/dispose.ts` 的有序异步清理与失败聚合。 |
| `tests/event-source.host.spec.ts` | 测试 | 31 | `[结构]` 被测对象：`src/shared/network/event-source.ts` 的 SSE 增量解析。 |
| `tests/fetch-observer.host.spec.ts` | 测试 | 468 | `[结构]` 被测对象：`src/host/inspection/network.ts` 的捕获、限额、截断与 abort 分支。 |
| `tests/fixtures/client-source.client.ts` | fixture | 147 | `[结构]` 客户端进程夹具：供 Host 侧协议集成用例冒充一个浏览器 Client。 |
| `tests/fixtures/client-source.host.ts` | fixture | 164 | `[结构]` Host 侧控制器：起停上述 Client 夹具并建立通道。 |
| `tests/fixtures/debug-host.ts` | fixture | 28 | `[结构]` 子进程夹具：主线程可被 Worker 暂停/恢复，用于调试类用例。 |
| `tests/integration.host.spec.ts` | 测试 | 808 | `[结构]` Host 驱动集成：以隔离 Client 夹具跑通观测、查询与 CDP 投影全链路。未逐行读。 |
| `tests/layout.host.spec.ts` | 测试 | 115 | `[结构]` 源码布局不变量：目录划分与导出面符合设计（防止层间反向依赖）。 |
| `tests/loader-composition.host.spec.ts` | 测试 | 98 | `[结构]` 组合装载：与 webServer/connection 的注入装配。 |
| `tests/network.host.spec.ts` | 测试 | 474 | `[结构]` 被测对象：Worker 侧 Network 投影与 `network-store.ts`。 |
| `tests/plugin.client.spec.ts` | 测试 | 653 | `[结构]` 被测对象：`src/client/plugin.ts` 与 `bridge/*` 的 bootstrap 解析、重连与回滚。未逐行读。 |
| `tests/plugin.host.spec.ts` | 测试 | 204 | `[结构]` 被测对象：`src/host/plugin.ts` 的静态资源、路由与 `--inspect` 行为。 |
| `tests/plugin-routes.host.spec.ts` | 测试 | 286 | `[结构]` 被测对象：`/inspector/devtools` 前缀与 `cdp` upgrade 的路由语义（405/302/400）。 |
| `tests/port-selection.host.spec.ts` | 测试 | 76 | `[结构]` 被测对象：Worker 端口占用时的顺延与 `0` 的 OS 分配。 |
| `tests/protocol.host.spec.ts` | 测试 | 274 | `[结构]` 被测对象：`src/shared/bridge/*` 的帧编解码与版本拒绝。 |
| `tests/shared-validation.host.spec.ts` | 测试 | 78 | `[结构]` 被测对象：`src/shared/json.ts` 与 `validation.ts` 的精确字段读取。 |
| `tests/source-buffer.host.spec.ts` | 测试 | 198 | `[结构]` 被测对象：`src/shared/bridge/buffer.ts` 的有界排队与序号空洞。 |
| `tests/worker-lifecycle.host.spec.ts` | 测试 | 35 | `[结构]` 被测对象：`src/host/bridge/lifecycle.ts` 的崩溃隔离与关停。 |
| `tests/workspace-prefetch.host.spec.ts` | 测试 | 40 | `[结构]` 断言安装期不触发任何外部资源下载（DevTools 源为固定 npm 输入）。 |
| `tsconfig.client.json` | 配置 | 114 | `[结构]` 浏览器半的 TS 编译配置（DOM lib、jsx、路径映射）。 |
| `tsconfig.host.json` | 配置 | 159 | `[结构]` Host/Worker 半的 TS 编译配置（Node 类型与 worker 入口）。 |
| `tsconfig.json` | 配置 | 11 | `[结构]` 根 tsconfig：仅做 references 聚合。 |
| `tsdown.config.ts` | 配置 | 35 | `[结构]` 打包器配置：分别产出 Host 入口、Client 入口与 Worker 入口。 |

### experimental/inspector-profile — 开发者工具 bundle 的开关层

包定位：本身不含运行逻辑，只是把一个 profile 图层写进打包物——`cordis.patch.yml` 一次插入三行：NodeJS inspector 后端（并强制 `captureFetch: true`）、Session Inspector（原始日志/Chat 分组视图）、Statistics 会话页。它的价值在于「默认关闭、由插件管理器的 More 页开关按需启用」，因此包体几乎只有清单、文案与一个用来锁住这三行的校验用例；被它启用的实现分别落在 `inspector`、`session-inspector`、`client-ui-stats` 三个包里。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 10 | `[精读]` 唯一装配点：插入 `experimental-inspector`（`disabled: false`、`captureFetch: true`）、`session-inspector`、`client-ui-stats` 三行。 |
| `docs/DETAIL.md` | 文档 | 1 | `[精读]` 一行图文说明，内嵌预览图指向 `preview.svg`。 |
| `docs/DETAIL.zh.md` | 文档 | 1 | `[精读]` 同上，中文版说明。 |
| `docs/preview.svg` | 资源 | 1 | `[结构]` 侧边栏 Session log 与 NodeJS inspector 控制台的界面预览图（约 139 KB 的压缩单行 SVG）。 |
| `docs/preview.zh.svg` | 资源 | 1 | `[结构]` 中文界面预览图（约 130 KB，单行 SVG）。 |
| `icon.svg` | 资源 | 23 | `[结构]` bundle 图标。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 7 | `[结构]` 聚合行：8 个语言文件，bundle 名称与「开发者工具」描述文案。 |
| `package.json` | 配置 | 57 | `[精读]` 包声明：`dsh.bundle.patch` 指向本包的 patch，运行依赖恰好是三个被启用的包，`files` 含 `docs`。 |
| `README.i18n.yaml` | 配置 | 34 | `[结构]` 中英 README 的锚点配对清单。 |
| `README.md` | 文档 | 71 | `[精读]` 英文版包说明：如何在 More 页启用、启用后带来哪三块界面、为何默认关闭与安全提示。 |
| `README.zh.md` | 文档 | 71 | `[结构]` 上述说明的中文版。 |
| `src/index.ts` | 源码 | 3 | `[精读]` 空实现：只留模块注释与 `export {}`，运行时组合全在 `cordis.patch.yml`。 |
| `tests/profile.spec.ts` | 测试 | 33 | `[精读]` 被测对象：`package.json` 与 `cordis.patch.yml` —— 断言 `dsh.bundle.patch` 指向本包、依赖恰为三个包、patch 内容逐字段等于预期。 |
| `tsconfig.json` | 配置 | 12 | `[结构]` TypeScript 编译配置（仅产出空模块与类型）。 |

### experimental/liveshare — 会话分享的拥有者宿主与 viewer 面

包定位：把本机的一个 DSH Session 以「可看」或「受限可写」两种权限共享给组织内同事，并独立决定是否允许对方 fork；所有选择最终由拥有者 Host 强制执行，而不是由 Relay 或浏览器自律。它由三块组成：Host 侧装配（`src/host/`：owner 登录与授权、十二项分享操作、viewer 请求分派、fork 强制与隧道监督）、一个独立的 gateway 子进程（`src/owner-gateway/`：一条 IPC 复用所有分享并对外连 Relay）、浏览器侧（`src/client/`：拥有者的分享对话框与同一页面里的 viewer 界面）。Relay（独立部署的 Liveshare server）不在本包内，本包只按 `share-api-types.ts` 与线协议与它对话；`liveshare-protocol` 提供通道与 relay 线的纯类型层。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 13 | `[结构]` 开启式 owner bundle 的唯一插入点：挂载同源分享 HTTP API 与 `liveshare-share-host` 一行。 |
| `icon.svg` | 资源 | 12 | `[结构]` bundle 图标。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | `[结构]` 聚合行：8 个语言文件，分享对话框、viewer 状态页与插件管理器的文案键。 |
| `package.json` | 配置 | 173 | `[结构]` 包声明：Host 插件与 browser face 双入口、`dsh.bundle.patch`、gateway 子进程产物与 workspace 依赖清单。 |
| `README.i18n.yaml` | 配置 | 52 | `[结构]` 中英 README 的标题与段落锚点配对清单。 |
| `README.md` | 文档 | 183 | `[结构]` 英文版包说明：启用方式、owner/viewer/Relay 三端版本必须一致、权限与 fork 语义、已知限制与验收 dev note。 |
| `README.zh.md` | 文档 | 183 | `[结构]` 上述说明的中文版，与英文版逐节对应。 |
| `src/client/endpoint-classification.ts` | 客户端源码 | 40 | `[结构]` viewer 端点分类在浏览器侧的完整性闸门：构建期未列全的分类直接报错。 |
| `src/client/index.ts` | 客户端源码 | 120 | `[精读]` 浏览器插件：拥有者侧注册 Session 头部分享动作与全局分享列表，viewer 页则装配自己的只读界面。 |
| `src/client/locales.ts` | 客户端源码 | 1930 | `[结构]` 客户端全部文案键与八语字面量（本包最大的单文件，未逐行读）。 |
| `src/client/ManageSharesDialog.tsx` | 客户端源码 | 137 | `[结构]` 拥有者的全局分享清单，每行可跳到对应 Session 的分享对话框。 |
| `src/client/owner-display.ts` | 客户端源码 | 78 | `[结构]` 拥有者身份显示名，供不直接持有身份状态的界面复用。 |
| `src/client/owner-identity.ts` | 客户端源码 | 169 | `[结构]` 分享对话框读的拥有者身份与凭证状态。 |
| `src/client/owner-identity-login.ts` | 客户端源码 | 220 | `[结构]` 分享对话框里的身份与 Relay 登录状态装配。 |
| `src/client/owner-login.ts` | 客户端源码 | 400 | `[结构]` 由即将分享的页面发起的 owner Relay 登录流程（轮询、取消、失败分型）。 |
| `src/client/owner-routes.ts` | 客户端源码 | 20 | `[结构]` 分享界面仍走 HTTP 的 owner 端点路径常量。 |
| `src/client/owner-shares.ts` | 客户端源码 | 124 | `[结构]` 分享界面调用的 `liveshareShares` Remote 客户端封装。 |
| `src/client/README.i18n.yaml` | 配置 | 7 | `[结构]` `src/client/README` 中英锚点配对清单。 |
| `src/client/README.md` | 文档 | 11 | `[结构]` viewer 页面说明：能看什么、哪些控件被声明为不可选。 |
| `src/client/README.zh.md` | 文档 | 11 | `[结构]` 同上，中文版。 |
| `src/client/ShareAction.module.css` | 资源 | 21 | `[结构]` 会话头部分享入口按钮样式。 |
| `src/client/ShareAction.tsx` | 客户端源码 | 94 | `[结构]` 会话头部的分享动作，打开拥有者侧分享对话框。 |
| `src/client/ShareCapabilitiesPicker.tsx` | 客户端源码 | 337 | `[结构]` 分享对话框的插件方法开关，以及读取某次分享策略的辅助逻辑。 |
| `src/client/ShareCreateForm.tsx` | 客户端源码 | 243 | `[结构]` 新建分享表单：会话权限、fork 开关、有效期。 |
| `src/client/ShareDialog.module.css` | 资源 | 401 | `[结构]` 分享对话框样式（卡片在 Modal padding box 内定尺寸）。 |
| `src/client/ShareDialog.tsx` | 客户端源码 | 381 | `[结构]` 拥有者侧分享对话框主体：创建、编辑、撤销与登录门禁的组合。 |
| `src/client/ShareEditPanel.tsx` | 客户端源码 | 492 | `[结构]` 已存分享的可编辑权限、fork 开关与插件端点选择面板。 |
| `src/client/share-navigation.ts` | 客户端源码 | 44 | `[结构]` 从全局清单切到某 Session 后打开其分享对话框的一次性挂起请求。 |
| `src/client/share-options.ts` | 客户端源码 | 25 | `[结构]` 新建与编辑面板共用的选项枚举（时间、权限等）。 |
| `src/client/SharePermissionFields.tsx` | 客户端源码 | 111 | `[结构]` 新建与编辑面板共用的会话权限、fork 与逐插件端点字段组。 |
| `src/client/share-relay-address.ts` | 客户端源码 | 365 | `[结构]` 分享对话框的 Relay 地址状态：默认值、覆盖、生效值与错误。 |
| `src/client/share-types.ts` | 客户端源码 | 178 | `[结构]` 从 `liveshareShares` Remote 读到的拥有者视角分享记录。 |
| `src/client/user-origin.module.css` | 资源 | 13 | `[结构]` 用户气泡上方共享来源标注行样式。 |
| `src/client/user-origin.tsx` | 客户端源码 | 93 | `[结构]` 共享会话读者所发消息上方的来源标注行。 |
| `src/client/viewer-brand.module.css` | 资源 | 61 | `[结构]` viewer 品牌区（LiveShare、拥有者、DSH 版本）样式。 |
| `src/client/viewer-brand.tsx` | 客户端源码 | 118 | `[结构]` viewer 页品牌行：侧边栏标识与承载本次分享的座位。 |
| `src/client/viewer-capabilities.ts` | 客户端源码 | 150 | `[结构]` 本次分享拥有者显式授予该 viewer 页的那一种模式。 |
| `src/client/viewer-context.ts` | 客户端源码 | 167 | `[结构]` viewer 页对它所呈现分享的自身读取。 |
| `src/client/viewer-model.tsx` | 客户端源码 | 215 | `[结构]` viewer 输入区的模型座位：只陈述模型与推理强度，不可更改。 |
| `src/client/viewer-permission.tsx` | 客户端源码 | 89 | `[结构]` viewer 输入区的权限座位：陈述档位，不可选。 |
| `src/client/viewer-plugin-warning.ts` | 客户端源码 | 174 | `[结构]` 插件调用 owner-only 路由时向 viewer 显示提示。 |
| `src/client/viewer-seat.module.css` | 资源 | 28 | `[结构]` viewer 座位样式。 |
| `src/client/viewer-seat.tsx` | 客户端源码 | 76 | `[结构]` 一个只陈述、不可选择的输入区座位。 |
| `src/client/viewer-session.ts` | 客户端源码 | 67 | `[结构]` 选定 viewer 页唯一呈现的那个 Session。 |
| `src/client/viewer-session-plugin.ts` | 客户端源码 | 343 | `[结构]` viewer 本地插件：读取页面呈现的分享并打开其中唯一共享 Session。 |
| `src/client/viewer-session-row.tsx` | 客户端源码 | 47 | `[结构]` viewer 页分支谱系标记行。 |
| `src/client/viewer-share-path.module.css` | 资源 | 7 | `[结构]` 不可打开工作区文件提示面板样式。 |
| `src/client/viewer-share-path.tsx` | 客户端源码 | 102 | `[结构]` 分享无法打开某工作区文件地址时读者页给出的自有答复。 |
| `src/client/viewer-status.ts` | 客户端源码 | 107 | `[结构]` 无法展示共享 Session 时的状态枚举与文案映射。 |
| `src/client/viewer-status-banner.module.css` | 资源 | 8 | `[结构]` viewer 状态横幅样式（在客户端 UI 树之外挂载）。 |
| `src/client/viewer-status-banner.ts` | 客户端源码 | 159 | `[结构]` 页面自述为何不展示共享 Session、读者可以做什么。 |
| `src/css-modules.d.ts` | 配置 | 6 | `[结构]` CSS Modules 类型声明。 |
| `src/endpoint-classification.ts` | 源码 | 308 | `[结构]` 逐个 Remote 端点说明「为何可以代表 share viewer 调用」，Host 分派与校验共用的唯一分类表。 |
| `src/fork-lineage.ts` | 源码 | 61 | `[结构]` 拥有者 Host 为共享 Session 的分支子会话发布的谱系事实。 |
| `src/host/base64-url.ts` | 源码 | 21 | `[结构]` 标识符与凭证用的无填充 base64url 编解码。 |
| `src/host/bundle-titles.ts` | 源码 | 110 | `[结构]` 注册 Remote 方法的各包在分享对话框里的用户可见名称。 |
| `src/host/fork-ceiling.ts` | 源码 | 73 | `[结构]` fork 子会话「实际能做什么」的逐请求判定，而非按会话一次性授予。 |
| `src/host/fork-enforcement.ts` | 源码 | 983 | `[结构]` 单个 fork 子会话的真实强制接线：安装受限工具运行时、拦截越界调用。超大文件，未逐行读。 |
| `src/host/fork-policy.ts` | 源码 | 230 | `[结构]` 谁能 fork、在哪个边界 fork、受哪一档权限上限约束。 |
| `src/host/fork-registry.ts` | 源码 | 524 | `[结构]` fork 产生的子会话的持久登记，两种分享档位都走它。 |
| `src/host/fork-tool-guard.ts` | 源码 | 268 | `[结构]` 子会话作用域工具运行时每次 dispatch 前执行的守卫。 |
| `src/host/owner-authorization.ts` | 源码 | 191 | `[结构]` owner 授权事务的 Host 半：浏览器在此发起、Host 只发一次性 code。 |
| `src/host/owner-credential-file.ts` | 源码 | 148 | `[结构]` 与 owner 状态文件同放的凭证，绑定单一 Relay 地址。 |
| `src/host/owner-http-routes.ts` | 源码 | 279 | `[结构]` owner 登录的同源 HTTP 面：浏览器仍会 POST 的四条路由。 |
| `src/host/owner-persistence.ts` | 源码 | 348 | `[结构]` owner 状态文件：Relay 覆盖值、本机要恢复的分享、欠 Relay 的行。 |
| `src/host/owner-share-operations.ts` | 源码 | 871 | `[精读·读入口与导出面]` `liveshareShares` 背后的十二项拥有者分享操作（创建/编辑/撤销/列表/恢复等），每项都经统一鉴权后再落持久化。结构为「共享依赖 + 逐操作函数」。 |
| `src/host/owner-types.ts` | 源码 | 75 | `[结构]` owner Host 持久化、且所有拆出的 owner 模块都读的分享记录形状。 |
| `src/host/relay-authority.ts` | 源码 | 389 | `[结构]` Relay 对某次分享访问权的声明，以及采纳这些声明的读取路径。 |
| `src/host/relay-fetch.ts` | 源码 | 102 | `[结构]` 复用某个 share host 所属连接的 Relay HTTP 调用。 |
| `src/host/relay-h2-idle.ts` | 源码 | 86 | `[结构]` 只对 Relay 请求消费 undici 的 HTTP/2 空闲会话回收事件。 |
| `src/host/relay-url.ts` | 源码 | 34 | `[结构]` 公网 Relay base URL 归一化（去 query/hash/尾斜杠）。 |
| `src/host/shareable-catalog.ts` | 源码 | 173 | `[结构]` 已安装插件中可作为分享端点提供给 viewer 的 Remote 方法目录。 |
| `src/host/share-host.ts` | 源码 | 657 | `[精读·读入口与导出面]` 纯 Web 的 Host 插件：owner 登录路由、分享管理 Remote、gateway 生命周期，把各拆分模块组装成一个 Cordis 插件。结构为「配置解析 → 服务注册 → 监听器接线 → 关闭」。 |
| `src/host/share-operations.ts` | 源码 | 128 | `[精读]` `liveshareShares` 背后拥有者操作的接口定义（仅类型与依赖契约，实现在 `owner-share-operations.ts`）。 |
| `src/host/share-remote.ts` | 源码 | 162 | `[结构]` 把拥有者分享管理暴露为一个 Typert Remote 服务。 |
| `src/host/shared-tools.ts` | 源码 | 236 | `[结构]` 共享 Session 与其 fork 子会话可用的工具面。 |
| `src/host/source-access.ts` | 源码 | 686 | `[结构]` 某次分享的源 Session 所携带的受限访问层与回合控制（写权限、reader 写动作、激活）。超大文件，按导出面判断。 |
| `src/host/source-sessions.ts` | 源码 | 27 | `[结构]` 分享记录与 fork 状态共用的源 Session 列表。 |
| `src/host/tunnel-supervision.ts` | 源码 | 959 | `[结构]` 单个 owner host 的 worker 监督：注册重放、心跳、到期定时器与欠账行。超大文件，未逐行读。 |
| `src/host/tunnel-worker.ts` | 源码 | 378 | `[结构]` 一个 DSH Web 进程所用的唯一隧道子进程的持有者（spawn、IPC、重启、停止）。 |
| `src/host/viewer-access-policy.ts` | 源码 | 533 | `[结构]` `share-viewer` 远程访问策略：决定某 reader 能在本 owner Host 上调用什么。 |
| `src/host/viewer-assets.ts` | 源码 | 59 | `[结构]` 服务端渲染的 viewer 页资源：index、shell 资源与 client bundle。 |
| `src/host/viewer-capability-selection.ts` | 源码 | 93 | `[结构]` 把拥有者提交的逐插件策略对照平台目录读出实际授予端点。 |
| `src/host/viewer-capability-types.ts` | 源码 | 8 | `[结构]` 可分享端点目录与逐插件策略的类型别名。 |
| `src/host/viewer-dispatch.ts` | 源码 | 809 | `[结构]` 把一个 reader 的 viewer 请求分派给拥有者自己的 Connection 与 gateway。超大文件，未逐行读。 |
| `src/host/viewer-fork.ts` | 源码 | 590 | `[结构]` 单个 viewer 的 fork 编排：上限判定、子会话准备、重放与分支事实。 |
| `src/host/viewer-lifecycle.ts` | 源码 | 576 | `[结构]` 单个 reader 的生命周期状态：流、调用、reader Peer 与拒绝记录。 |
| `src/host/viewer-principal.ts` | 源码 | 84 | `[结构]` 本 owner Host 上某 reader 的调用者身份。 |
| `src/host/viewer-read.ts` | 源码 | 231 | `[结构]` owner 侧读取器：装配一次 viewer 读请求并声明它依赖的 Host 服务。 |
| `src/host/wire-json.ts` | 源码 | 35 | `[结构]` owner HTTP 适配器与 Relay 读取共用的 JSON 载荷辅助。 |
| `src/index.ts` | 源码 | 16 | `[精读]` 包入口：导出 owner 侧 Web bundle 插件（`apply/name/inject`）与公共类型。 |
| `src/owner-gateway/cli.ts` | 源码 | 6 | `[结构]` gateway worker 的入口，由 Host 通过 IPC 通道拉起。 |
| `src/owner-gateway/pending-rpc.ts` | 源码 | 78 | `[结构]` 用 worker 发放的 token 关联 IPC 请求、按 socket 精确关联 Relay id。 |
| `src/owner-gateway/registration-url.ts` | 源码 | 62 | `[结构]` 每次分享发布所用的注册握手地址构造。 |
| `src/owner-gateway/relay-refusal.ts` | 源码 | 45 | `[结构]` 哪些 Relay 握手响应会永久终止一次注册。 |
| `src/owner-gateway/retry-backoff.ts` | 源码 | 46 | `[结构]` 持续失败连接的退避时延表。 |
| `src/owner-gateway/worker.ts` | 源码 | 327 | `[结构]` owner 侧 gateway worker：一个进程经 IPC 多路复用所有分享并对接 Relay Socket。 |
| `src/owner-identity.ts` | 源码 | 30 | `[结构]` owner Host 只向自己的浏览器报告的拥有者身份状态。 |
| `src/read-budgets.ts` | 源码 | 49 | `[结构]` owner Host 与所服务的 viewer 页共用的读预算。 |
| `src/share-api-types.ts` | 源码 | 356 | `[结构]` Host 路由与 Typert Remote 契约共用的拥有者视角分享记录。 |
| `src/viewer-channel.ts` | 源码 | 172 | `[结构]` viewer 读通道：Relay 原样转发的请求与 owner 的应答。 |
| `tests/bundle-titles.spec.ts` | 测试 | 71 | `[结构]` 被测对象：`src/host/bundle-titles.ts`——注册 Remote 方法的包名到用户可见标题的映射。 |
| `tests/client-apply.client.spec.tsx` | 测试 | 129 | `[结构]` 被测对象：`src/client/index.ts` 的浏览器插件装载与卸载（owner 面与 viewer 面分支）。 |
| `tests/client-face.client.spec.ts` | 测试 | 110 | `[结构]` 被测对象：`src/client/index.ts` 声明的 browser face 注册面与导出清单。 |
| `tests/debug-reads-switch.spec.ts` | 测试 | 90 | `[结构]` 被测对象：`src/host/viewer-read.ts` 的 `LIVESHARE_DEBUG_READS` 开关——只在显式开启时输出逐读日志。 |
| `tests/endpoint-classification.client.spec.ts` | 测试 | 35 | `[结构]` 被测对象：`src/client/endpoint-classification.ts` 的浏览器侧完整性闸门。 |
| `tests/endpoint-classification.spec.ts` | 测试 | 29 | `[结构]` 被测对象：`src/endpoint-classification.ts` 的逐端点分类运行期用例。 |
| `tests/fixtures/agent-watch.mjs` | fixture | 57 | `[结构]` 隔离验收实例里的测试专用 agent 发布观察器。 |
| `tests/fixtures/base-llm.mjs` | fixture | 197 | `[结构]` 真实 profile 验收基座：确定性、无密钥的 LLM 桩（先写一个文件再回文本）。 |
| `tests/fork-enforcement-unit.spec.ts` | 测试 | 812 | `[结构]` 被测对象：`src/host/fork-enforcement.ts` 的安装拒绝分支与它注册的受限工具体。 |
| `tests/fork-registry-cross-process.e2e.ts` | 测试 | 228 | `[结构]` 被测对象：`src/host/fork-registry.ts`——两个真实 OS 进程同写一份登记文件。 |
| `tests/fork-registry-durability.spec.ts` | 测试 | 147 | `[结构]` 被测对象：`src/host/fork-registry.ts` 重启后仍存的内容与旧版文件的可接受语义。 |
| `tests/fork-registry-errors.spec.ts` | 测试 | 281 | `[结构]` 被测对象：`src/host/fork-registry.ts` 的持久化失败、损坏输入与撤销重放。 |
| `tests/gateway-access-state-replay.spec.ts` | 测试 | 168 | `[结构]` 被测对象：`src/owner-gateway/worker.ts`——重连后重新注册的是哪一份已提交访问状态。 |
| `tests/gateway-cli-entry.spec.ts` | 测试 | 47 | `[结构]` 被测对象：`src/owner-gateway/cli.ts`——只有宿主提供了 IPC 通道才启动 worker。 |
| `tests/gateway-command.spec.ts` | 测试 | 24 | `[结构]` 被测对象：`src/host/share-host.ts` 的 `gatewayWorkerCommand`——源码运行走 tsx 载入 `cli.ts`，构建产物运行走 `lib/owner-gateway/cli.js`。 |
| `tests/gateway-pending-rpc.spec.ts` | 测试 | 54 | `[结构]` 被测对象：`src/owner-gateway/pending-rpc.ts` 的 token 关联与 socket 精确匹配。 |
| `tests/gateway-registration-url.spec.ts` | 测试 | 96 | `[结构]` 被测对象：`src/owner-gateway/registration-url.ts` 的注册握手地址构造。 |
| `tests/gateway-worker.spec.ts` | 测试 | 524 | `[结构]` 被测对象：`src/owner-gateway/worker.ts` 的进程内生命周期（owner IPC 进、Relay socket 出）。 |
| `tests/gateway-worker-fake-ws.ts` | fixture | 139 | `[结构]` 可编程的 `ws` 替身，供上述 gateway worker 生命周期用例驱动连接事件。 |
| `tests/generated-remote-stub.ts` | fixture | 2 | `[结构]` 本包尚无构建 `lib/` 时对生成物 `./remote` 的可解析占位。 |
| `tests/host-activate-session.spec.ts` | 测试 | 73 | `[结构]` 被测对象：`src/host/source-access.ts` 的 `activateSession` 走组合自身激活路径。 |
| `tests/host-activation.host.spec.ts` | 测试 | 66 | `[结构]` 被测对象：`src/index.ts` 的 bundle 按 profile 方式装载（走 Cordis 注入检查）。 |
| `tests/host-owner-authorization.spec.ts` | 测试 | 133 | `[结构]` 被测对象：`src/host/owner-authorization.ts`——浏览器可篡改的每个绑定都在 Host 复核。 |
| `tests/host-owner-credential-file.spec.ts` | 测试 | 156 | `[结构]` 被测对象：`src/host/owner-credential-file.ts` 的可读/不可读文件语义。 |
| `tests/host-owner-identity.spec.ts` | 测试 | 123 | `[结构]` 被测对象：`src/host/owner-identity.ts`——身份状态按 Relay 地址隔离。 |
| `tests/host-relay-checks.spec.ts` | 测试 | 174 | `[结构]` 被测对象：`src/host/share-host.ts` 中 owner Host 对两项 Relay 检查的应答。 |
| `tests/host-relay-override.spec.ts` | 测试 | 198 | `[结构]` 被测对象：`src/host/owner-persistence.ts` 的 Relay 覆盖值与生效顺序。 |
| `tests/host-restore.spec.ts` | 测试 | 439 | `[结构]` 被测对象：`src/host/share-host.ts` 重启后恢复既有分享（真实 net server 作 Relay 替身）。 |
| `tests/host-share.spec.ts` | 测试 | 51 | `[结构]` 被测对象：`src/host/share-host.ts` 注册的四条同源登录/凭证路由，以及已退役的逐 viewer 审批路由不再注册。 |
| `tests/host-share-remote.security.spec.ts` | 测试 | 172 | `[结构]` 被测对象：`src/host/share-remote.ts`——经 Typert Remote 到达时仍只允许 owner 调用。 |
| `tests/host-share-remote.spec.ts` | 测试 | 39 | `[结构]` 被测对象：`src/host/share-remote.ts` 作为单一委派面，所有方法都落到同一操作层。 |
| `tests/host-viewer-capabilities.spec.ts` | 测试 | 181 | `[结构]` 被测对象：`src/host/viewer-capability-selection.ts` 的逐分享端点选择与面板读到的候选列表。 |
| `tests/host-viewer-principal.spec.ts` | 测试 | 46 | `[结构]` 被测对象：`src/host/viewer-principal.ts`——Relay 断言的身份、显示名与两个 reader 的比较。 |
| `tests/manage-shares.client.spec.tsx` | 测试 | 205 | `[结构]` 被测对象：`src/client/ManageSharesDialog.tsx` 的全局清单与跳转行为。 |
| `tests/newworker-correlation.spec.ts` | 测试 | 217 | `[结构]` 被测对象：`src/host/tunnel-worker.ts`——新 worker 下请求身份在 Relay id 复用后仍可区分。 |
| `tests/owner-credential-horizon.host.spec.ts` | 测试 | 212 | `[结构]` 被测对象：`src/host/owner-credential-file.ts` 跟随 Relay 给出的凭证有效期限。 |
| `tests/owner-display.client.spec.tsx` | 测试 | 72 | `[结构]` 被测对象：`src/client/owner-display.ts` 的显示名派生与降级。 |
| `tests/owner-identity.client.spec.ts` | 测试 | 117 | `[结构]` 被测对象：`src/client/owner-identity.ts`——对话框陈述什么、拒绝编造什么。 |
| `tests/owner-identity-fixture.ts` | fixture | 106 | `[结构]` 绑定 owner 身份的 Relay 替身与已存凭证，供 owner 身份类用例复用。 |
| `tests/owner-login.client.spec.ts` | 测试 | 485 | `[结构]` 被测对象：`src/client/owner-login.ts` 的登录轮询、取消与失败分型。 |
| `tests/owner-login-wire.spec.ts` | 测试 | 322 | `[结构]` 被测对象：`src/host/owner-http-routes.ts` 与 `owner-authorization.ts` 组成的登录线：发布什么、拒绝什么。 |
| `tests/owner-persistence.spec.ts` | 测试 | 297 | `[结构]` 被测对象：`src/host/owner-persistence.ts`——重启恢复什么、不可读文件拒绝恢复什么。 |
| `tests/owner-share-operations.spec.ts` | 测试 | 868 | `[结构]` 被测对象：`src/host/owner-share-operations.ts` 的十二项操作对依赖缝的行为。 |
| `tests/owner-shares-double.client.ts` | fixture | 138 | `[结构]` 测试自有的 `liveshareShares` Remote 命名空间替身。 |
| `tests/product-dialog-acceptance.client.spec.tsx` | 测试 | 1349 | `[结构]` 被测对象：`src/client/ShareDialog.tsx` 及其子面板的整对话框验收。超大用例，未逐行读。 |
| `tests/readonly-fork-ceiling.spec.ts` | 测试 | 43 | `[结构]` 被测对象：`src/host/fork-ceiling.ts`——读放行、任何触达 owner 的写被拒。 |
| `tests/readonly-fork-cold-child.spec.ts` | 测试 | 302 | `[结构]` 被测对象：`src/host/fork-enforcement.ts`——早期进程创建的子会话首次写入前必须补装限制。 |
| `tests/readonly-fork-enforcement-wiring.spec.ts` | 测试 | 554 | `[结构]` 被测对象：`src/host/fork-enforcement.ts` 的服务存在性、安装顺序与监听协议。 |
| `tests/readonly-fork-idempotency.spec.ts` | 测试 | 399 | `[结构]` 被测对象：`src/host/viewer-fork.ts` 与 `fork-registry.ts`——一次逻辑 fork 只产生一个子会话。 |
| `tests/readonly-fork-ownership.spec.ts` | 测试 | 266 | `[结构]` 被测对象：`src/host/fork-registry.ts` 的归属隔离（含租户维度）。 |
| `tests/readonly-fork-policy.spec.ts` | 测试 | 136 | `[结构]` 被测对象：`src/host/fork-policy.ts` 的绑定、边界与不可逾越的权限上限。 |
| `tests/readonly-fork-registry.spec.ts` | 测试 | 119 | `[结构]` 被测对象：`src/host/fork-registry.ts` 的创建者隔离、撤销不删除与默认拒绝提示。 |
| `tests/readonly-fork-tool-execution.spec.ts` | 测试 | 969 | `[结构]` 被测对象：`src/host/fork-tool-guard.ts` + `fork-enforcement.ts` 经真实工具运行时与真实文件系统执行。超大用例，未逐行读。 |
| `tests/readonly-fork-tool-guard.spec.ts` | 测试 | 323 | `[结构]` 被测对象：`src/host/fork-tool-guard.ts` 注册的守卫：给出原因串、其余默认拒绝。 |
| `tests/relay-access-state.host.spec.ts` | 测试 | 145 | `[结构]` 被测对象：`src/host/relay-authority.ts`——Relay 授权无需 owner UI 轮询即生效，过期快照不能复活被拒 reader。 |
| `tests/relay-authority-management.host.spec.ts` | 测试 | 183 | `[结构]` 被测对象：`src/host/relay-authority.ts` 中 owner 选择与管理读对在线外部执行的约束。 |
| `tests/relay-authority-unit.spec.ts` | 测试 | 397 | `[结构]` 被测对象：`src/host/relay-authority.ts` 的声明采纳、栅栏与收窄快照的终止语义。 |
| `tests/relay-fetch.spec.ts` | 测试 | 106 | `[结构]` 被测对象：`src/host/relay-fetch.ts` 复用所属连接的 Relay HTTP 调用。 |
| `tests/relay-h2-idle.spec.ts` | 测试 | 77 | `[结构]` 被测对象：`src/host/relay-h2-idle.ts` 只消费 Relay 请求的 HTTP/2 空闲回收。 |
| `tests/relay-pre-step-admission.host.spec.ts` | 测试 | 114 | `[结构]` 被测对象：`src/host/viewer-dispatch.ts` 在真正 pre-step 用消息自身来源复核 Relay 准入。 |
| `tests/relay-target-admission.host.spec.ts` | 测试 | 236 | `[结构]` 被测对象：`src/host/viewer-access-policy.ts`——reader 访问绑定接收方 Session。 |
| `tests/relay-transaction-race.spec.ts` | 测试 | 294 | `[结构]` 被测对象：`src/host/owner-share-operations.ts` 在异步网络与 worker 完成之间保持捕获的 Relay。 |
| `tests/relay-url.spec.ts` | 测试 | 18 | `[结构]` 被测对象：`src/host/relay-url.ts` 的 URL 归一化。 |
| `tests/shareable-catalog.spec.ts` | 测试 | 230 | `[结构]` 被测对象：`src/host/shareable-catalog.ts` 从真实插件目录读取可分享方法。 |
| `tests/share-action.client.spec.tsx` | 测试 | 183 | `[结构]` 被测对象：`src/client/ShareAction.tsx` 头部动作的可见性与打开行为。 |
| `tests/share-capabilities.client.spec.tsx` | 测试 | 118 | `[结构]` 被测对象：`src/client/ShareCapabilitiesPicker.tsx` 的三态插件端点控制与其提交子集。 |
| `tests/share-capabilities-render.client.spec.tsx` | 测试 | 71 | `[结构]` 被测对象：`src/client/ShareCapabilitiesPicker.tsx` 的渲染结果。 |
| `tests/shared-tools.spec.ts` | 测试 | 132 | `[结构]` 被测对象：`src/host/shared-tools.ts`——源沙箱与 fork 子会话限制共用的一张工具表。 |
| `tests/share-host-fork-wiring.spec.ts` | 测试 | 328 | `[结构]` 被测对象：`src/host/share-host.ts` 与 fork 相关服务的接线。 |
| `tests/share-host-listeners.spec.ts` | 测试 | 508 | `[结构]` 被测对象：`src/host/share-host.ts` 的配置守卫、目录标题、agent 监听器与 owner 状态投射。 |
| `tests/share-navigation.client.spec.ts` | 测试 | 31 | `[结构]` 被测对象：`src/client/share-navigation.ts` 从全局清单到 Session 头部动作的内存交接。 |
| `tests/share-relay-field.client.spec.tsx` | 测试 | 246 | `[结构]` 被测对象：`src/client/share-relay-address.ts` 的 Relay 地址字段状态与校验。 |
| `tests/share-relay-in-force.client.spec.tsx` | 测试 | 233 | `[结构]` 被测对象：`src/client/share-relay-address.ts` 的「生效地址」呈现与切换。 |
| `tests/share-restore-credential.host.spec.ts` | 测试 | 261 | `[结构]` 被测对象：`src/host/share-host.ts`——本机已持分享重连时呈现什么、如何回来。 |
| `tests/share-title.spec.ts` | 测试 | 18 | `[结构]` 被测对象：分享记录标题——Session 改名必须同步，且只有改名能改它。 |
| `tests/share-types.client.spec.ts` | 测试 | 103 | `[结构]` 被测对象：`src/client/share-types.ts`——只有完整记录才可被呈现。 |
| `tests/source-access-lifetime.spec.ts` | 测试 | 127 | `[结构]` 被测对象：`src/host/source-access.ts`——旧 Agent 世代装的限制不能授权新世代。 |
| `tests/source-access-unit.spec.ts` | 测试 | 465 | `[结构]` 被测对象：`src/host/source-access.ts` 的拒绝、准备、回合控制与子会话授权分层。 |
| `tests/source-write-observation.spec.ts` | 测试 | 319 | `[结构]` 被测对象：`src/host/source-access.ts` 在部署真实观测策略下的有界写入。 |
| `tests/source-write-recovery.host.spec.ts` | 测试 | 311 | `[结构]` 被测对象：`src/host/source-access.ts` 写入中断后的恢复路径。 |
| `tests/source-write-routing.spec.ts` | 测试 | 333 | `[结构]` 被测对象：`src/host/viewer-dispatch.ts` 点名共享 Session 的请求被路由到哪里。 |
| `tests/three-mode-profile-base.e2e.ts` | 测试 | 134 | `[结构]` 三模式验收驱动的最小真实 profile 基座。 |
| `tests/three-mode-web-base.e2e.ts` | 测试 | 158 | `[结构]` 三模式验收驱动的真实 web profile 基座。 |
| `tests/three-mode-web-harness.ts` | fixture | 929 | `[结构]` 隔离的真实 `dsh web` 实例夹具，供三模式验收驱动复用。 |
| `tests/tool-call.ts` | fixture | 39 | `[结构]` 经批执行器发一次工具调用的测试辅助，供单调用用例复用。 |
| `tests/tunnel-supervision-fake-worker.ts` | fixture | 63 | `[结构]` 可编程的隧道 worker 进程替身，供监督器单测驱动。 |
| `tests/tunnel-supervision-unit.spec.ts` | 测试 | 648 | `[结构]` 被测对象：`src/host/tunnel-supervision.ts` 的 worker 命令、结算、定时器、凭证与 Relay 探测。 |
| `tests/tunnel-worker.spec.ts` | 测试 | 182 | `[结构]` 被测对象：`src/host/tunnel-worker.ts` 的子进程 spawn 与 IPC 关联。 |
| `tests/tunnel-worker-fake-child.ts` | fixture | 57 | `[结构]` 一个可控子进程，冒充隧道 worker。 |
| `tests/tunnel-worker-gateway-refusal.spec.ts` | 测试 | 157 | `[结构]` 被测对象：`src/owner-gateway/worker.ts` 在 Relay 直接应答握手而非升级时的行为。 |
| `tests/tunnel-worker-restart.spec.ts` | 测试 | 364 | `[结构]` 被测对象：`src/host/tunnel-worker.ts` 崩溃替换后重新注册 owner 仍持有的分享。 |
| `tests/tunnel-worker-supervisor.spec.ts` | 测试 | 466 | `[结构]` 被测对象：`src/host/tunnel-worker.ts` 的进程监督（spawn、IPC 关联、重启、停止）。 |
| `tests/user-origin.client.spec.tsx` | 测试 | 158 | `[结构]` 被测对象：`src/client/user-origin.tsx` 的来源标注行渲染。 |
| `tests/viewer-access-policy.spec.ts` | 测试 | 523 | `[结构]` 被测对象：`src/host/viewer-access-policy.ts`——经真实 remote access service 决定 reader 可调用的动作。 |
| `tests/viewer-assets.spec.ts` | 测试 | 336 | `[结构]` 被测对象：`src/host/viewer-assets.ts` 的 index 渲染、shell 资源与插件 bundle。 |
| `tests/viewer-authority.spec.ts` | 测试 | 83 | `[结构]` 被测对象：`src/host/viewer-lifecycle.ts`——viewer 流在整个生命周期保持 Session 与 actor 权限。 |
| `tests/viewer-authority-refresh.spec.ts` | 测试 | 206 | `[结构]` 被测对象：`src/host/viewer-lifecycle.ts` 的刷新请求：报告自身拒绝并取消旧的已撤销工作。 |
| `tests/viewer-brand.client.spec.tsx` | 测试 | 107 | `[结构]` 被测对象：`src/client/viewer-brand.tsx` 的品牌行内容。 |
| `tests/viewer-brand-registration.client.spec.tsx` | 测试 | 116 | `[结构]` 被测对象：`src/client/viewer-brand.tsx` 的槽位注册。 |
| `tests/viewer-call-lifetime.spec.ts` | 测试 | 110 | `[结构]` 被测对象：`src/host/viewer-lifecycle.ts`——分享或打开者被撤销后挂起调用即失效。 |
| `tests/viewer-cancel-admission.spec.ts` | 测试 | 378 | `[结构]` 被测对象：`src/host/viewer-dispatch.ts`——reader 的 cancel 走标准 Gateway 分派。 |
| `tests/viewer-capabilities.client.spec.ts` | 测试 | 62 | `[结构]` 被测对象：`src/client/viewer-capabilities.ts` 对本次分享授予模式的读取。 |
| `tests/viewer-capability-selection.spec.ts` | 测试 | 60 | `[结构]` 被测对象：`src/host/viewer-capability-selection.ts` 的策略对照读取。 |
| `tests/viewer-channel.spec.ts` | 测试 | 70 | `[结构]` 被测对象：`src/viewer-channel.ts`——哪些转发体点名了请求、哪些没有。 |
| `tests/viewer-context.client.spec.ts` | 测试 | 231 | `[结构]` 被测对象：`src/client/viewer-context.ts` 对页面所呈现分享的读取。 |
| `tests/viewer-dispatch.spec.ts` | 测试 | 968 | `[结构]` 被测对象：`src/host/viewer-dispatch.ts` 的请求分类与应答。超大用例，未逐行读。 |
| `tests/viewer-endpoint-fixture.ts` | fixture | 73 | `[结构]` Host 端点定义与 Loader 条目名夹具，供 viewer 声明面用例复用。 |
| `tests/viewer-event-authority.spec.ts` | 测试 | 176 | `[结构]` 被测对象：`src/host/viewer-access-policy.ts`——reader 的事件流只带策略允许的 Session 通知。 |
| `tests/viewer-fixture.client.ts` | fixture | 4474 | `[结构]` 客户端测试夹具：脚本化 owner 与 4,000+ 行 viewer 场景数据，供装配后的 viewer 页用例读取分享、渲染会话。超大夹具，未读全文。 |
| `tests/viewer-fork-artifact.client.spec.tsx` | 测试 | 251 | `[结构]` 被测对象：`src/client` viewer 面在 fork 页上的渲染产物（artifact 断言）。 |
| `tests/viewer-fork-limit-failure-artifact.client.spec.tsx` | 测试 | 97 | `[结构]` 被测对象：`src/client` viewer 面在 fork 受限失败时的呈现。 |
| `tests/viewer-fork-operation-conflict-artifact.client.spec.tsx` | 测试 | 97 | `[结构]` 被测对象：`src/client` viewer 面在 fork 操作冲突时的呈现。 |
| `tests/viewer-fork-prepare-artifact.client.spec.tsx` | 测试 | 112 | `[结构]` 被测对象：`src/client` viewer 面在 fork 准备中状态的呈现。 |
| `tests/viewer-fork-refusal-artifact.client.spec.tsx` | 测试 | 90 | `[结构]` 被测对象：`src/client` viewer 面在 fork 被拒时的呈现。 |
| `tests/viewer-fork-run-artifact.client.spec.tsx` | 测试 | 96 | `[结构]` 被测对象：`src/client` viewer 面在 fork 运行中状态的呈现。 |
| `tests/viewer-fork-unit.spec.ts` | 测试 | 368 | `[结构]` 被测对象：`src/host/viewer-fork.ts` 的身份、重放、强制与分支标注。 |
| `tests/viewer-global-privacy-artifact.client.spec.tsx` | 测试 | 225 | `[结构]` 被测对象：`src/client` viewer 面的全局隐私边界呈现（不暴露 owner 全局配置）。 |
| `tests/viewer-input-fixture.client.ts` | fixture | 116 | `[结构]` 装配后 viewer 页真实输入门面的测试访问，以及静止期启动释放。 |
| `tests/viewer-lifecycle-unit.spec.ts` | 测试 | 313 | `[结构]` 被测对象：`src/host/viewer-lifecycle.ts` 的调用、Peer、流、清扫与分享拆除。 |
| `tests/viewer-page.client.ts` | fixture | 192 | `[结构]` 进程内启动的 owner Web shell + Relay carrier，冒充装配完成的 viewer 页。 |
| `tests/viewer-page-roster.client.ts` | fixture | 84 | `[结构]` 装配后 viewer 页的客户端名册（已注册的槽位与插件）。 |
| `tests/viewer-plugin-services.client.ts` | fixture | 77 | `[结构]` viewer 插件测试台使用的 Client 服务替身。 |
| `tests/viewer-plugin-warning.client.spec.ts` | 测试 | 250 | `[结构]` 被测对象：`src/client/viewer-plugin-warning.ts` 对 owner-only 路由调用的提示。 |
| `tests/viewer-privacy-bridge.d.ts` | fixture | 15 | `[结构]` Host 读取器与已构建 viewer 夹具之间的测试专用请求/响应边界类型。 |
| `tests/viewer-privacy-owner.ts` | fixture | 85 | `[结构]` 隐私夹具中立桥背后的生产 Owner 读取器。 |
| `tests/viewer-reader-peer.spec.ts` | 测试 | 137 | `[结构]` 被测对象：`src/host/viewer-read.ts`——每分享每 reader 一个 Peer，撤销与复核都落在它身上。 |
| `tests/viewer-read-peers.ts` | fixture | 63 | `[结构]` 让 reader 的每次调用与流都经同一 Peer 的读取器 Peer 夹具。 |
| `tests/viewer-read-refusal.spec.ts` | 测试 | 284 | `[结构]` 被测对象：`src/host/viewer-read.ts` 在读取任何内容前的拒绝条件。 |
| `tests/viewer-reason.client.spec.ts` | 测试 | 91 | `[结构]` 被测对象：`src/client/viewer-status.ts` 的拒绝原因与文案映射。 |
| `tests/viewer-relay.client.ts` | fixture | 150 | `[结构]` 装配后 viewer 页用例的 Relay 替身：读通道由脚本化 owner 应答。 |
| `tests/viewer-remote-faces.ts` | fixture | 42 | `[结构]` 从源码为每个 Host 包生成 `./remote` 面，供装配后 viewer 页用例使用。 |
| `tests/viewer-seat.client.spec.tsx` | 测试 | 203 | `[结构]` 被测对象：`src/client/viewer-seat.tsx` 只陈述不可选的座位渲染。 |
| `tests/viewer-seat-registration.client.spec.tsx` | 测试 | 215 | `[结构]` 被测对象：`src/client/viewer-seat.tsx` 的槽位注册。 |
| `tests/viewer-session.client.spec.ts` | 测试 | 81 | `[结构]` 被测对象：`src/client/viewer-session.ts` 的单一 Session 选定。 |
| `tests/viewer-session-list.spec.ts` | 测试 | 70 | `[结构]` 被测对象：viewer 会话列表必须已按分享范围裁剪，而非过滤后的全量。 |
| `tests/viewer-session-plugin.client.spec.ts` | 测试 | 638 | `[结构]` 被测对象：`src/client/viewer-session-plugin.ts` 读取分享并打开唯一共享 Session。 |
| `tests/viewer-session-row.client.spec.tsx` | 测试 | 76 | `[结构]` 被测对象：`src/client/viewer-session-row.tsx` 的分支谱系标记。 |
| `tests/viewer-settings-privacy.spec.ts` | 测试 | 140 | `[结构]` 被测对象：共享 reader 永远拿不到 owner 的全局配置文档。 |
| `tests/viewer-share-not-writable-artifact.client.spec.tsx` | 测试 | 96 | `[结构]` 被测对象：`src/client` viewer 面在分享不可写时的呈现。 |
| `tests/viewer-share-path.client.spec.tsx` | 测试 | 101 | `[结构]` 被测对象：`src/client/viewer-share-path.tsx` 对无法打开地址的答复。 |
| `tests/viewer-shell-artifact.client.spec.tsx` | 测试 | 188 | `[结构]` 被测对象：`src/client` viewer 页 shell 的渲染产物。 |
| `tests/viewer-source-write-unavailable-artifact.client.spec.tsx` | 测试 | 93 | `[结构]` 被测对象：`src/client` viewer 面在源写入不可用时的呈现。 |
| `tests/viewer-staging.client.spec.ts` | 测试 | 48 | `[结构]` 被测对象：`tests/viewer-staging.client.ts` 的失败安全清理（不移除未设置/父级/越界路径）。 |
| `tests/viewer-staging.client.ts` | fixture | 39 | `[结构]` 进程私有暂存目录 + 失败安全释放器，供生成的 viewer 页测试输入使用。 |
| `tests/viewer-status.client.spec.tsx` | 测试 | 268 | `[结构]` 被测对象：`src/client/viewer-status-banner.ts` 与 `viewer-status.ts` 的状态横幅。 |
| `tests/viewer-stream-batching.spec.ts` | 测试 | 89 | `[结构]` 被测对象：`src/host/viewer-lifecycle.ts` 的流投递粒度（一次应答携带突发值）。 |
| `tests/viewer-stream-ownership.spec.ts` | 测试 | 174 | `[结构]` 被测对象：`src/host/viewer-lifecycle.ts`——每个页面的流 id 归属各自编号。 |
| `tests/viewer-stream-reclaim.spec.ts` | 测试 | 104 | `[结构]` 被测对象：`src/host/viewer-lifecycle.ts` 回收无人轮询的流。 |
| `tests/viewer-target-admission.spec.ts` | 测试 | 315 | `[结构]` 被测对象：`src/host/viewer-dispatch.ts`——reader 调用被授权给真实 Connection 与 Gateway 实际作用的那个 Session。 |
| `tests/viewer-tier-scope.spec.ts` | 测试 | 228 | `[结构]` 被测对象：`src/host/source-access.ts`——沙箱挂载期间共享 Session 可触达的范围。 |
| `tests/viewer-write-artifact.client.spec.tsx` | 测试 | 204 | `[结构]` 被测对象：`src/client` viewer 面可写档位下的呈现。 |
| `tests/wire-json.spec.ts` | 测试 | 31 | `[结构]` 被测对象：`src/host/wire-json.ts`——请求体读成解析值或什么都没有。 |
| `tests/write-current-policy.spec.ts` | 测试 | 320 | `[结构]` 被测对象：`src/host/source-access.ts` 的有界写入在真实沙箱文件系统上携带 Session 当前策略。 |
| `tsconfig.client.json` | 配置 | 115 | `[结构]` 浏览器半的 TS 编译配置（DOM lib、tsx、路径映射）。 |
| `tsconfig.host.json` | 配置 | 37 | `[结构]` Host/gateway 半的 TS 编译配置。 |
| `tsconfig.json` | 配置 | 7 | `[结构]` 根 tsconfig：references 聚合。 |
| `tsdown.config.ts` | 配置 | 10 | `[结构]` 打包配置：复用 `client/tsdown.client.ts` 产出浏览器 bundle。 |

### experimental/liveshare-protocol — owner 与 Relay 共用的线协议与身份契约

包定位：owner bundle 与独立部署的 Relay 之间唯一一份共同定义——owner/worker 的 IPC 帧、Relay 只转发而不解释的 gateway 帧、Relay 塞进被服务页面顶部的 viewer carrier 脚本，以及与身份提供方无关的身份契约。它存在的理由是：两侧共享这些定义而互不 import，Relay 永远不加载 owner 代码。这是一个纯库，没有 profile 挂载它，也没有 `cordis.yml` 行点名它；只依赖无状态的 `dsh-brand`，`cordis` 仅为 peer。`liveshare` 包是它唯一的业务使用方，测试用的 mock 身份 provider 刻意不经任何入口导出。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `package.json` | 配置 | 40 | `[精读]` 包声明：只导出根入口（无子路径）、仅依赖 `dsh-brand`，`files` 带 `src` 便于被下游直接读源码。 |
| `README.i18n.yaml` | 配置 | 37 | `[结构]` 中英 README 的标题与段落锚点配对清单。 |
| `README.md` | 文档 | 93 | `[精读]` 英文版包说明：何时该 import、根入口同时发布线协议/身份契约/carrier/viewer 状态词表、`parseGatewayFrame` 对未知输入返回 undefined 的容错约定。 |
| `README.zh.md` | 文档 | 93 | `[结构]` 上述说明的中文版，与英文版逐节对应。 |
| `src/identity/index.ts` | 源码 | 2 | `[精读]` 身份子模块的聚合出口（keys 与 types，不含 mock）。 |
| `src/identity/keys.ts` | 源码 | 72 | `[精读]` ACL 使用的 `providerId:tenantId:subjectId` 规范键：百分号编码、往返解析、`default` 租户占位与两种归一化校验。 |
| `src/identity/mock.ts` | 源码 | 54 | `[精读]` 确定性的本地身份 provider，仅供测试与 loopback 演示；明确不是鉴权边界，且不从任何入口导出。 |
| `src/identity/types.ts` | 源码 | 41 | `[精读]` 与 provider 无关的身份三元组、`IdentityActor`、OAuth 授权/兑换请求与 `IdentityProvider` 契约。 |
| `src/index.ts` | 源码 | 8 | `[精读]` 根入口：一次性导出 tunnel-protocol、identity 与 viewer-carrier（viewer 状态词表随 carrier 一起被消费，故不单开子路径）。 |
| `src/tunnel-protocol.ts` | 源码 | 610 | `[精读·读入口与导出面]` 全部线帧：协议版本与能力表、`TunnelWorkerCommand/Event`、`ShareRpcFrame/Res/Cancel`、`ShareAccessStateFrame`，以及 `sendFrame`/`parseGatewayFrame`/`parseRelayFrame`/`unsupportedFrameRefusal` 等校验与拒绝构造。结构为「常量与权限形状 → worker 命令/事件 → 共享 RPC 帧 → 逐帧解析器」。 |
| `src/viewer-carrier.ts` | 源码 | 306 | `[精读·读入口与导出面]` Relay 注入被服务页面的 carrier：把 Connection 调用转成 `call`、把 Gateway 流转成 open/next/cancel 轮询，并把失败分成可重试的 carrier 丢失与终态拒绝；另转发一份显式的 owner 路由白名单。因为以源码文本注入浏览器，函数体内不引用任何模块绑定。 |
| `src/viewer-states.ts` | 源码 | 48 | `[精读]` viewer 一次读取可能终止的七种条件，以及每种条件是「可重试」还是「对方终审」的唯一词表（HTTP 状态与文案键都不在这一层）。 |
| `tests/entrypoints.spec.ts` | 测试 | 23 | `[结构]` 被测对象：`src/index.ts`——根入口必须导出线协议、身份与 carrier 三组符号。 |
| `tests/frames/unknown/gateway-to-relay--status-out-of-range.json` | fixture | 5 | `[结构]` 非法样例帧：状态码越界，解析必须返回 undefined。 |
| `tests/frames/unknown/host-to-worker--future-command.json` | fixture | 5 | `[结构]` 非法样例帧：未知 worker 命令。 |
| `tests/frames/unknown/host-to-worker--unknown-access-mode.json` | fixture | 18 | `[结构]` 非法样例帧：访问模式不在能力表内。 |
| `tests/frames/unknown/relay-to-gateway--future-frame-type.json` | fixture | 17 | `[结构]` 非法样例帧：未知帧类型。 |
| `tests/frames/unknown/relay-to-gateway--id-not-a-positive-integer.json` | fixture | 19 | `[结构]` 非法样例帧：请求 id 非正整数。 |
| `tests/frames/unknown/relay-to-gateway--share-rpc-without-actor.json` | fixture | 19 | `[结构]` 非法样例帧：share RPC 缺少 actor。 |
| `tests/frames/unknown/worker-to-host--future-event.json` | fixture | 5 | `[结构]` 非法样例帧：未知 worker 事件。 |
| `tests/frames/v1/gateway-to-relay--share-rpc-res.json` | fixture | 6 | `[结构]` 合法基准帧：gateway 回给 Relay 的 RPC 应答。 |
| `tests/frames/v1/host-to-worker--add-share.json` | fixture | 30 | `[结构]` 合法基准帧：完整字段的 add-share 命令。 |
| `tests/frames/v1/host-to-worker--add-share-minimal.json` | fixture | 20 | `[结构]` 合法基准帧：仅必填字段的 add-share 命令。 |
| `tests/frames/v1/host-to-worker--remove-share.json` | fixture | 6 | `[结构]` 合法基准帧：remove-share 命令。 |
| `tests/frames/v1/host-to-worker--share-rpc-response.json` | fixture | 16 | `[结构]` 合法基准帧：host 回给 worker 的 RPC 应答。 |
| `tests/frames/v1/relay-to-gateway--share-rpc.json` | fixture | 20 | `[结构]` 合法基准帧：Relay 转发给 gateway 的 share RPC。 |
| `tests/frames/v1/relay-to-gateway--share-rpc-cancel.json` | fixture | 6 | `[结构]` 合法基准帧：RPC 取消帧。 |
| `tests/frames/v1/worker-to-host--ready.json` | fixture | 6 | `[结构]` 合法基准帧：worker 就绪事件。 |
| `tests/frames/v1/worker-to-host--share-connected.json` | fixture | 6 | `[结构]` 合法基准帧：某分享连接成功事件。 |
| `tests/frames/v1/worker-to-host--share-error.json` | fixture | 6 | `[结构]` 合法基准帧：某分享连接失败事件。 |
| `tests/frames/v1/worker-to-host--share-rpc-request.json` | fixture | 14 | `[结构]` 合法基准帧：worker 上行的 RPC 请求。 |
| `tests/identity.spec.ts` | 测试 | 59 | `[结构]` 被测对象：`src/identity/keys.ts` 的键往返、编码与占位租户。 |
| `tests/identity-mock.spec.ts` | 测试 | 68 | `[结构]` 被测对象：`src/identity/mock.ts` 的确定性身份与默认租户归一化。 |
| `tests/ipc-token.spec.ts` | 测试 | 78 | `[结构]` 被测对象：`src/tunnel-protocol.ts` 的请求/注册 token 品牌与校验（按文件名与导出符号判断）。 |
| `tests/protocol-frames.spec.ts` | 测试 | 210 | `[结构]` 被测对象：`src/tunnel-protocol.ts` 的帧解析——`frames/` 下 v1 基准全部通过、unknown 全部拒绝。 |
| `tests/protocol-utilities.spec.ts` | 测试 | 301 | `[结构]` 被测对象：`src/tunnel-protocol.ts` 的 `sendFrame`、`rawText`、`viewerRequestFields` 与拒绝帧构造。 |
| `tests/share-access-state.spec.ts` | 测试 | 24 | `[结构]` 被测对象：`src/tunnel-protocol.ts` 的 `parseShareAccessState` 精确字段校验。 |
| `tests/viewer-carrier.client.spec.ts` | 测试 | 670 | `[结构]` 被测对象：`src/viewer-carrier.ts`——连接调用/流的转换、可重试与终态分型、owner 路由白名单。 |
| `tsconfig.client.json` | 配置 | 13 | `[结构]` carrier 侧的 TS 编译配置（DOM lib）。 |
| `tsconfig.host.json` | 配置 | 23 | `[结构]` Node 侧的 TS 编译配置。 |
| `tsconfig.json` | 配置 | 7 | `[结构]` 根 tsconfig：references 聚合。 |
| `tsdown.config.ts` | 配置 | 24 | `[结构]` 打包配置：产出根入口的 ESM 与类型。 |

### experimental/personalized-recommendations — 个性化页面与插件推荐的开关型 Bundle

包定位：一个纯 bundle 包，自身不含任何实现，只用 `cordis.patch.yml` 一次性声明六行：共享的卡片服务（`action-cards`）、回答下方卡片框架（`client-ui-action-cards`），以及两个功能各两行（`creation-recommendations` + 其卡片正文、`plugin-recommendations` + 其卡片正文）。行 id 由本包独占声明，插件管理器因此能在插件页逐行开关，并写入 profile 的 patch 覆盖。它把「个性化页面」和「内置插件推荐」打包成一个可整体启停的实验性能力，两项功能都依赖卡片服务，关掉卡片行则两项同时失效。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 13 | [结构] 唯一实质内容：按包自有 id `insert` 六行插件，均不带配置项。 |
| `docs/DETAIL.md` / `docs/DETAIL.zh.md` | 文档 | 1 | [结构] 详情页正文入口，只有一行指向 `preview.svg` 的图片引用。 |
| `docs/preview.svg` / `docs/preview.zh.svg` | 资源 | 35–36 | [结构] 插件市场预览图（体量约 130–280 KB 的内联 SVG）。 |
| `icon.svg` | 资源 | 5 | [结构] 插件图标。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 7 | [结构] 聚合行：8 个语言文件，Bundle 名称与描述文案。 |
| `package.json` | 配置 | 73 | [结构] 包声明：依赖恰为六行对应的六个包，`dsh.bundle.patch` 指向本包补丁。 |
| `README.i18n.yaml` | 配置 | 37 | [结构] 中英文 README 的翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 88 | [结构] 包说明：六行各自提供什么、逐行开关的语义、关闭卡片服务后的降级表现。 |
| `src/index.ts` | 源码 | 2 | [精读] 仅 `export {}`，运行行全部由补丁声明。 |
| `tests/bundle.spec.ts` | 测试 | 148 | [结构] 被测对象：`cordis.patch.yml` 与 `package.json`——校验六行清单与依赖一致，并真实 boot 一个 profile，逐行 `setPluginEnabled` 验证 Skill 撤下/恢复。 |
| `tsconfig.json` | 配置 | 15 | [结构] TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | [结构] 打包配置：把 `lib/types/index.js` 编译到 `lib`。 |

### experimental/plugin-market-bundle — 自定义插件索引的启用开关

包定位：把「自定义插件索引」这条实验性链路打包成一个可启停的 bundle：Host 侧的 `plugin-market` 服务负责读取用户配置的索引源，Web 侧的 `ui-plugin-market` 提供插件页的「发现」标签页。服务行带 `disabled: !ctx.get('profileContext')` 条件——没有 profile 时不挂载，因此纯 CLI/无 profile 环境下不会暴露。Creator 预设里的 `plugin_market` 工具行只在 `pluginMarket` 已挂载时注册，故本包缺位时该工具自然消失，既不等待也不报错。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 10 | [结构] 插件清单补丁：插入服务行（按 profile 是否存在条件禁启用）与浏览器发现标签页行。 |
| `docs/DETAIL.md` / `docs/DETAIL.zh.md` | 文档 | 1 | [结构] 详情页正文入口，只有一行指向 `preview.svg` 的图片引用。 |
| `docs/preview.svg` / `docs/preview.zh.svg` | 资源 | 1 | [结构] 插件市场预览图（单行约 150–170 KB 的内联 SVG）。 |
| `icon.svg` | 资源 | 9 | [结构] 插件图标。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 7 | [结构] 聚合行：8 个语言文件，Bundle 名称与描述文案。 |
| `package.json` | 配置 | 54 | [结构] 包声明：只依赖 `plugin-market` 与 `client-ui-plugin-market` 两个行包。 |
| `README.i18n.yaml` | 配置 | 34 | [结构] 中英文 README 的翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 68 | [结构] 包说明：发现标签页的使用路径、禁用后保留索引源、`plugin_market` 工具的挂载条件。 |
| `src/index.ts` | 源码 | 2 | [精读] 仅 `export {}`，运行行全部由补丁声明。 |
| `tsconfig.json` | 配置 | 15 | [结构] TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | [结构] 打包配置：编译 `lib/types/index.js` 到 `lib`。 |

### experimental/plugin-recommendations — 按需推荐官方插件并由用户点卡启用

包定位：面向「用户明确说想用某个能力」的场景，给出一张 `enable_official_plugin` 卡片，卡片只做一件事——把某个已随安装提供的官方可选插件打开。它向共享的 `actionCards` 服务注册卡片种类，自己不提供模型工具，只注册一个 `official-plugins` Skill：Skill 正文拼接 `pluginManager` 的实时可推荐目录，模型据此判断该不该出卡。真正的启用、卡片投影、「暂不需要」与状态通知都由 action-cards 负责；本包只保证目录资格判定、幂等启用与失败/未确认的恢复。它是 personalized-recommendations Bundle 的一行，也可与其「个性化页面」行独立使用。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `evaluation/intent-cases.json` | fixture | 126 | [结构] 推荐意图评测集：正/负例的提问与期望是否出卡，用于回归 Skill 描述与目录判断。 |
| `icon.svg` | 资源 | 9 | [结构] 插件图标。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | [结构] 聚合行：8 个语言文件，卡片标题与描述文案。 |
| `package.json` | 配置 | 79 | [结构] 包声明：导出 typert host/remote 入口与 `skills/*.md`，依赖 action-cards 与对应客户端卡片包。 |
| `README.i18n.yaml` | 配置 | 49 | [结构] 中英文 README 的翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 101 | [结构] 包说明：出卡时机、启用/已启用/失败/未确认四态与重试语义、目录资格。 |
| `skills/official-plugins.md` | 文档 | 23 | [结构] Skill 正文：什么需求值得推荐插件、如何写 `details.name`、不要重复推荐已拒绝项。 |
| `src/index.ts` | 源码 | 166 | [精读] `PluginRecommendations` Remote 服务：注册 Skill 与卡片种类，`describe` 读实时目录文本，`enable` 幂等启用并把结果写成 `enabled`/`already-enabled`/`failed`/`unconfirmed`，`confirm` 在任一动作前对账被中断的启用。 |
| `src/skill.ts` | 源码 | 45 | [精读] 目录资格判定 `eligible`（官方、可选、可读、无错误）与 `official-plugins` Skill 提供者的注册，`get` 时读取技能文件并拼当前目录。 |
| `src/types.ts` | 源码 | 29 | [精读] 卡片 `details`（只允许 `name`）、四种记录 phase、记录数据与 `describe` 的可用/拒绝结果类型。 |
| `tests/__snapshots__/recommendations.spec.ts.snap` | 快照 | 50 | [结构] Skill 发现结果与「策略 + 当前目录」正文快照。 |
| `tests/__snapshots__/status-context.spec.ts.snap` | 快照 | 11 | [结构] 下一轮注入的插件状态消息快照。 |
| `tests/fixture.ts` | 测试 | 71 | [结构] 测试脚手架：构造 BundleInfo、日志卡片提议、callId 与可用的 action-cards 上下文。 |
| `tests/fixtures/cordis.yml` | fixture | 29 | [结构] 组合测试用的 Loader 清单：session/projection/llm/tools/skills/agents/loop/manager/action-cards 与本体。 |
| `tests/loader-composition.spec.ts` | 测试 | 124 | [结构] 被测对象：整包装配——真实 profile、Loader、HMR、AgentLoop 与 Skill 注册，只把模型输出脚本化。 |
| `tests/recommendations.spec.ts` | 测试 | 279 | [结构] 被测对象：`src/index.ts` 与 `src/skill.ts`——目录过滤矩阵、Skill 正文截断、取消传播、卸载后卡片与 Remote 一并撤下。 |
| `tests/status-context.spec.ts` | 测试 | 47 | [结构] 被测对象：卡片决定在下一轮 `agent/pre-step` 注入的状态上下文，且不唤醒会话。 |
| `tsconfig.json` | 配置 | 44 | [结构] TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 15 | [结构] 打包配置（Host/Remote 双入口）。 |

### experimental/ptc-runtime-python — PTC 执行缝的 CPython 子进程后端

包定位：实现共享的 `PtcRuntime` 执行缝，把模型生成的 Python 程序放进一个全新的 CPython 3.10+ 子进程里跑，程序体被当作 async 函数体（顶层 `await`/`return` 可用）。宿主与子进程之间的 binding 调用走 fd 3 的 JSON-lines，stdout/stderr 留给程序自己；文件效果服从 `sandbox`/`sandboxPolicy`，CPU、地址空间、日志/返回值字节数与墙钟时间各有预算，超限由 SIGTERM→SIGKILL 回收进程组。它同时拥有这条无版本号线协议的定义（`src/protocol.ts` ↔ `py/protocol.py` 手工镜像），并采用「单向信任」：宿主逐字段重建每条入站帧，Python 侧信任宿主回复。它是 experimental 里唯一带大量 Python 源码与万行级测试的包。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | [结构] 聚合行：8 个语言文件，运行时名称与说明文案。 |
| `package.json` | 配置 | 56 | [结构] 包声明：把 `py/**/*.py` 一并发布，peer 依赖 ptc-runtime、sandbox、sandbox-policy、timeout。 |
| `py/bootstrap.py` | 源码 | 2575 | [精读·读入口与结构] 子进程主体（未通读）：`main()` 从 stdin 载入 loader 源码、读 fd 3 建立 `ProtocolChannel`；`_run` 把程序编译成 async 函数并执行；`LogBuffer`/`_LogStream` 做输出账本与截断；`_decode_json_plain`/`_encode_json_plain` 是无损 JSON 编解码；`_Namespace` 物化 binding 与异常类；`_make_cpu_enforcer` 设 RLIMIT_CPU，`_model_traceback`/`_done_with_value` 归集失败与完成帧。 |
| `py/protocol.py` | 源码 | 139 | [精读] TS 协议的 Python 镜像：`TypedDict` 逐帧描述 boot/run/boot-ack/call/log/done/reply，`PROTOCOL_FD = 3` 与截断标记文本必须与 TS 侧逐字一致。 |
| `README.i18n.yaml` | 配置 | 61 | [结构] 中英文 README 的翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 161 | [结构] 包说明：运行契约、每项预算的含义与加载期校验、fd 3 帧格式、沙箱模式与失败分类。 |
| `src/index.ts` | 源码 | 2378 | [精读·读入口与导出面] `PythonPtcRuntime`（继承 `PtcRuntime`）：`inject` 声明 sandbox 与 sandboxPolicy；`run` 校验 binding 命名空间、解析解释器、spawn 子进程并收帧；`execute` 做 boot/run 写帧与 stdout/stderr/超时/预算的并行竞争；`validateBindings` 拒绝保留字与非法标识符；另导出 `hostFrameParseCeiling`、`resolvePythonBin`、`readProcessStart`、`detachResidual` 与一整套 cfg 上限校验。 |
| `src/launch.ts` | 源码 | 24 | [精读] 可信引导：`PYTHON_BOOTSTRAP_LOADER` 是经 stdin 注入的最小入口，`bootstrapInput()` 读 `py/*.py` 并编码成 JSON，避免依赖沙箱内临时文件。 |
| `src/protocol.ts` | 源码 | 718 | [精读·读入口与导出面] 宿主侧线协议与敌意帧防线：`PROTOCOL_FD`、帧类型、`WIRE_FRAME_FIELDS`、`logTruncationMarker`、`encodeJsonPlain`、`checkDoneValue`、`hasUnsafeIntegerToken`/`hasNonLosslessNumber`、`validateChildFrame`。 |
| `tests/boot-write-failure.spec.ts` | 测试 | 387 | [结构] 被测对象：`src/index.ts` 的 boot/run 写帧——用 mock 管道控制同步写失败与背压切换。 |
| `tests/protocol.spec.ts` | 测试 | 347 | [结构] 被测对象：`src/protocol.ts` 的无损 JSON 编解码、预算检查与伪造帧拒绝。 |
| `tests/protocol-mirror.e2e.ts` | 测试 | 103 | [结构] 被测对象：`src/protocol.ts` ↔ `py/protocol.py` 的镜像——真实 python3 读取常量与每帧字段集；无 python3 时自跳过。 |
| `tests/residual-detach.spec.ts` | 测试 | 38 | [结构] 被测对象：`detachResidual`——fd 3 残留视图必须脱离原始大 Buffer 的底层分配。 |
| `tests/runtime.spec.ts` | 测试 | 5862 | [结构] `[超大用例]` 被测对象：`src/index.ts` 与子进程的真实端到端行为——预算、超时、沙箱拒绝、binding 往返、输出/完成值边界与拆卸。 |
| `tests/sandbox.spec.ts` | 测试 | 344 | [结构] 被测对象：`src/index.ts` 的沙箱约束——各模式下 `ConfinedArgv` 的拼装、不可用后端的 `sandbox-unavailable` 与不重试。 |
| `tests/setup.ts` | 测试 | 16 | [结构] 测试脚手架：挂载 Sandbox、SessionProjections 与 SandboxPolicy，并带 fiber 拆卸。 |
| `tests/stray-fragments.spec.ts` | 测试 | 87 | [结构] 被测对象：`src/index.ts` 的 fd 3 分片处理——把每个字节当作独立 data 事件喂入，验证跨事件重组与截断标记。 |
| `tsconfig.json` | 配置 | 36 | [结构] TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 16 | [结构] 打包配置：保留 Python 资源引用。 |

### experimental/ralph-bundle — 用新子智能体跑循环工作的全局工具预设

包定位：把 Ralph 能力装配成一个默认关闭、且不在默认插件列表展示（`listedByDefault: false`）的 bundle。补丁插入一个 `cordis:group` 组 `optional-ralph`，组内隔离自己的 `workflowEngine`，避免与其他工作流工具抢同一服务；组内两行分别是 `workflow-ptc`（`provider: spawn`）与 `tool-ralph`（`subagentProvider: spawn`、`maxRounds: 64`）。后续 profile 补丁可按 id 改这两行配置或禁用，工具本身不在此包内。用途是「用户明确要求反复执行」时，每轮换一个新的子智能体，代价是 token 消耗大。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 16 | [结构] 唯一实质内容：插入隔离 `workflowEngine` 的组，声明工作流引擎行与 `tool-ralph` 行（`spawn`、64 轮上限）。 |
| `docs/DETAIL.md` / `docs/DETAIL.zh.md` | 文档 | 1 | [结构] 详情页正文入口，只有一行指向 `preview.svg` 的图片引用。 |
| `docs/preview.svg` / `docs/preview.zh.svg` | 资源 | 1 | [结构] 插件市场预览图（单行约 78–110 KB 的内联 SVG）。 |
| `icon.svg` | 资源 | 1 | [结构] 插件图标（单行 SVG）。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 7 | [结构] 聚合行：8 个语言文件，Bundle 名称与描述文案。 |
| `package.json` | 配置 | 55 | [结构] 包声明：`dsh.bundle.patch` 指向本包，`listedByDefault: false`；只依赖 tool-ralph 与 workflow-ptc。 |
| `README.i18n.yaml` | 配置 | 37 | [结构] 中英文 README 的翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 78 | [结构] 包说明：安装/启用路径、组隔离与补丁覆盖方式、显式授权的使用边界。 |
| `src/index.ts` | 源码 | 2 | [精读] 仅 `export {}`，运行行全部由补丁声明。 |
| `tsconfig.json` | 配置 | 15 | [结构] TypeScript 编译配置。 |

### experimental/session-inspector — Session 原始日志与 Chat 结构的虚拟化诊断面板

包定位：纯客户端包（Host 侧 `apply()` 是空的发现标记），在侧栏注册一个 Session 作用域的「会话数据诊断」标签页。面板内部有两种展示形式：**原始数据**把会话事件按 `turn/start`–`turn/end`、`step/start`–`step/end` 分组，并把 Assistant 的流式分片挂到对应 block 下作为子行；**对话分组**按 Chat 的 group/node 实际归属铺平，隐藏或未物化节点仍作为根行按事件锚点插入。两者共用同一张虚拟表格、类型筛选、可调高度的 JSON 详情，以及「点击行 → 在主 Chat 中定位/反向选取」的 DOM 流程；定位与选取全部由本包自己完成，不新增 Chat 或 Conversation API，也不修改被检查数据。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | [结构] 聚合行：8 个语言文件，标签页与面板文案。 |
| `package.json` | 配置 | 78 | [结构] 包声明：双入口（Host `.` 与 `./client`），`dsh.client` 声明 web 平台与客户端注入。 |
| `README.i18n.yaml` | 配置 | 34 | [结构] 中英文 README 的翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 105 | [结构] 包说明：两种展示形式、筛选与分组规则、对象树/引用导航、定位与选取的边界。 |
| `src/client/index.ts` | 客户端源码 | 19 | [精读] 客户端入口：注册八语字典，调用 `registerInspectorTab`；`inject` 声明 slots、locale、sessions、uiSession、uiConversation、sidebarRightTabs。 |
| `src/client/locales.ts` | 客户端源码 | 462 | [结构] 八个语言的文案字典，key 覆盖标签页、列头、筛选器、选取器与对象树。 |
| `src/client/views/chat-node/dom.ts` | 客户端源码 | 87 | [精读] 只用现有 DOM 属性做查找：`mainChatRoot` 定位主 Chat 流列，`displayed` 判可见，`inChat` 限定同一 Conversation，`findChatTargets` 枚举精确/近似候选。 |
| `src/client/views/chat-node/highlight.ts` | 客户端源码 | 41 | [结构] 拾取蒙层与定位高亮的几何计算，裁剪到滚动容器与 composer 之上。 |
| `src/client/views/chat-node/model.ts` | 客户端源码 | 212 | [精读] `ChatNodeModel`：按 Chat 的实际 group/node 顺序生成行，行的数据独立订阅；`objects()` 把对象身份映射成可跳转引用与行 key。 |
| `src/client/views/chat-node/objects.ts` | 客户端源码 | 90 | [精读] `ChatObjectIndex`：用 WeakMap 索引 Node、Group、Turn/Step 与各自 Data 根对象，引用读取当前值而不保留旧快照。 |
| `src/client/views/chat-node/picker.ts` | 客户端源码 | 172 | [精读] `InspectorChatPicker`：在 Chat 上盖透明拦截层，`elementsFromPoint` 排除自身后匹配属性，滚轮转发给 Chat，Esc/失焦/切换展示取消。 |
| `src/client/views/chat-node/pick-match.ts` | 客户端源码 | 68 | [精读] 元素 → 记录的反查规则：工具调用/Node 优先，再退 Group/Turn；另有行级 `matchChatNodeRow`，不做文本相似度。 |
| `src/client/views/chat-node/reveal.ts` | 客户端源码 | 178 | [精读] `InspectorChatRevealer`：在 body 层绘制高亮、触发 `beforematch` 展开折叠祖先、原生滚动后闪烁，减少动画时立即滚动。 |
| `src/client/views/chat-node/reveal-target.ts` | 客户端源码 | 90 | [精读] 从已加载 Chat 快照补齐近似目标：先按 turn/step 过滤，再依次匹配 tool root call、精确锚点、kind、最近锚点。 |
| `src/client/views/format.ts` | 客户端源码 | 33 | [精读] `inspectorPreview`：横向行摘要，过滤 type/seq/time 与调用方指定的列字段，对 delta 类型只显示参数或文本，深度与长度都有上限。 |
| `src/client/views/index.ts` | 客户端源码 | 80 | [精读] 标签页注册与 Session 作用域数据装配：按 `SessionBinding` 缓存 Chat/日志模型，接好选取、定位、分页与对象索引。 |
| `src/client/views/inspector.module.css` | 资源 | 181 | [结构] 面板样式：吸顶表头、分组底色、高亮闪烁、蒙层与选取预览。 |
| `src/client/views/InspectorDetails.tsx` | 客户端源码 | 75 | [精读] 可调高度的详情面板：上边缘指针拖拽 + 方向键改百分比，限制 15%–80%。 |
| `src/client/views/InspectorObjectTree.tsx` | 客户端源码 | 122 | [精读] 对象树/JSON 树渲染：按需展开、每页 50 项、循环引用标祖先路径、可点击引用交给导航回调。 |
| `src/client/views/InspectorTable.tsx` | 客户端源码 | 345 | [精读] 共享虚拟表格：TanStack Virtualizer、吸顶祖先、逐行独立订阅、折叠保持锚点、详情选择与「跟踪最新」。 |
| `src/client/views/objects.ts` | 客户端源码 | 42 | [精读] `InspectorChatTarget`（DOM/Chat 坐标词汇）与 `InspectorObjects`（引用查询 + 当前值读取）接口。 |
| `src/client/views/object-value.ts` | 客户端源码 | 100 | [精读] `InspectorObjectValue`：不转 JSON 的浅层对象描述——Map/Set/数组/TypedArray/类实例分类，getter 只标不执行，稀疏空槽单独标记。 |
| `src/client/views/raw-json.ts` | 客户端源码 | 44 | [精读] `inspectorJson`：带循环检测的 JSON 序列化，Map/Set 转换、bigint 加 `n`，失败时返回错误文本而不让视图崩掉。 |
| `src/client/views/session-log/chat-target.ts` | 客户端源码 | 47 | [精读] `sessionLogChatTarget`：把日志事件与选中分片翻译成 Chat 定位坐标（turn/step、callId/rootCallId、assistant 分片归属）。 |
| `src/client/views/session-log/groups.ts` | 客户端源码 | 47 | [精读] `SessionLogGroups`：单遍扫描把记录放进开启的 Step/Turn，start 行作组头、end 行留在组尾，不为缺失 start 造行。 |
| `src/client/views/session-log/model.ts` | 客户端源码 | 218 | [精读] `SessionLogModel`：增量投影会话窗口为行，维护 turn/step 分组与 Assistant 子流；`chatAnchor` 反查原始事件，`pick` 处理反向选取优先级。 |
| `src/client/views/session-log/stream.ts` | 客户端源码 | 78 | [精读] `AssistantLogStream`：按 block index 归置分片，闭合时替换组头并生成折叠摘要，reasoning 文本只留有限前缀。 |
| `src/client/views/table-layout.ts` | 客户端源码 | 110 | [精读] 固定行高（30px）的虚拟布局：折叠时保留可见锚点、把空白留在数据尾部、计算滚动补偿量。 |
| `src/client/views/table-model.ts` | 客户端源码 | 122 | [精读] 行身份/披露状态/层级索引：用户折叠只在对应生命周期内有效，`stickyIndexes` 给出吸顶祖先链，`InspectorRecordSource` 保持快照身份。 |
| `src/client/views/type-filter.ts` | 客户端源码 | 82 | [精读] `InspectorTypeFilter`：大小写不敏感的包含匹配、保留匹配行的祖先并默认展开、异步汇总候选类型。 |
| `src/client/views/TypeFilter.tsx` | 客户端源码 | 129 | [精读] 表头筛选浮层：CSS 锚点定位、候选异步刷新且过期响应不覆盖新结果，Enter/点击候选才确认。 |
| `src/client/views/View.tsx` | 客户端源码 | 98 | [精读] 合并面板：展示形式下拉 + 选取按钮，按当前形式切换行源/记录源，把定位与选取接到 `InspectorTable`。 |
| `src/css-modules.d.ts` | 客户端源码 | 5 | [结构] CSS Modules 的 TypeScript 声明。 |
| `src/index.ts` | 源码 | 4 | [精读] Host 发现入口，只有空 `apply()`。 |
| `tests/chat-node.client.spec.ts` | 测试 | 182 | [结构] 被测对象：`src/client/views/chat-node/model.ts` 的 group/node 行序与对象引用。 |
| `tests/chat-node-fixture.client.ts` | fixture | 25 | [结构] 构造带自引用 Location 数据的 Chat Node，供对象树测试使用。 |
| `tests/details.client.spec.tsx` | 测试 | 95 | [结构] 被测对象：`src/client/views/InspectorDetails.tsx` 的高度拖拽与键盘调整。 |
| `tests/format.client.spec.ts` | 测试 | 55 | [结构] 被测对象：`src/client/views/format.ts` 的摘要过滤与长度上限。 |
| `tests/highlight.client.spec.ts` | 测试 | 27 | [结构] 被测对象：`src/client/views/chat-node/highlight.ts` 的可见矩形裁剪。 |
| `tests/log-chat-target.client.spec.ts` | 测试 | 47 | [结构] 被测对象：`src/client/views/session-log/chat-target.ts` 的坐标翻译。 |
| `tests/matching.client.spec.ts` | 测试 | 48 | [结构] 被测对象：`src/client/views/chat-node/dom.ts`、`pick-match.ts`、`highlight.ts` 的回退匹配与高亮放置。 |
| `tests/objects.client.spec.ts` | 测试 | 153 | [结构] 被测对象：`src/client/views/chat-node/objects.ts` 的弱引用身份索引与读取。 |
| `tests/object-tree.client.spec.tsx` | 测试 | 219 | [结构] 被测对象：`src/client/views/InspectorObjectTree.tsx` 的展开、分页与引用导航。 |
| `tests/object-value.client.spec.ts` | 测试 | 95 | [结构] 被测对象：`src/client/views/object-value.ts` 的集合分类、getter 与空槽处理。 |
| `tests/picker.client.spec.ts` | 测试 | 282 | [结构] 被测对象：`src/client/views/chat-node/picker.ts` 的蒙层、取消与路径转发。 |
| `tests/presentation.client.spec.tsx` | 测试 | 153 | [结构] 被测对象：`src/client/views/View.tsx` 的展示形式切换与引用导航。 |
| `tests/raw-json.client.spec.ts` | 测试 | 48 | [结构] 被测对象：`src/client/views/raw-json.ts` 的循环、Map/Set 与 bigint 序列化。 |
| `tests/reveal.client.spec.ts` | 测试 | 95 | [结构] 被测对象：`src/client/views/chat-node/reveal.ts` 的高亮与 beforematch 展开。 |
| `tests/reveal-scroll.client.spec.ts` | 测试 | 341 | [结构] 被测对象：`src/client/views/chat-node/reveal.ts` 的滚动等待、动画与减少动效分支。 |
| `tests/reveal-target.client.spec.ts` | 测试 | 189 | [结构] 被测对象：`src/client/views/chat-node/reveal-target.ts` 的精确/近似候选顺序。 |
| `tests/session-log.client.spec.ts` | 测试 | 246 | [结构] 被测对象：`src/client/views/session-log/model.ts` 的增量投影、分页与反查。 |
| `tests/session-log-groups.client.spec.ts` | 测试 | 119 | [结构] 被测对象：`src/client/views/session-log/groups.ts` 的 Turn/Step 归属。 |
| `tests/stream-summary.client.spec.ts` | 测试 | 37 | [结构] 被测对象：`src/client/views/session-log/stream.ts` 的闭合摘要。 |
| `tests/table.client.spec.tsx` | 测试 | 235 | [结构] 被测对象：`src/client/views/InspectorTable.tsx` 的渲染、选择与折叠。 |
| `tests/table-filter.client.spec.tsx` | 测试 | 84 | [结构] 被测对象：表格与 `type-filter.ts` 的筛选联动。 |
| `tests/table-geometry.client.ts` | fixture | 42 | [结构] jsdom 没有布局引擎，这里伪造行高与视口尺寸。 |
| `tests/table-hierarchy.client.spec.ts` | 测试 | 52 | [结构] 被测对象：`src/client/views/table-model.ts` 的层级与吸顶索引。 |
| `tests/table-layout.client.spec.ts` | 测试 | 109 | [结构] 被测对象：`src/client/views/table-layout.ts` 的折叠锚点与尾部留白。 |
| `tests/table-scroll.client.spec.tsx` | 测试 | 118 | [结构] 被测对象：`InspectorTable.tsx` 的滚动跟随与「跟踪最新」。 |
| `tests/type-filter.client.spec.ts` | 测试 | 76 | [结构] 被测对象：`src/client/views/type-filter.ts` 的匹配与祖先保留。 |
| `tests/type-filter-editor.client.spec.tsx` | 测试 | 164 | [结构] 被测对象：`src/client/views/TypeFilter.tsx` 的草稿、候选与确认。 |
| `tests/views.client.spec.ts` | 测试 | 200 | [结构] 被测对象：`src/client/views/index.ts` 的标签页注册与 Session 绑定缓存。 |
| `tsconfig.json` | 配置 | 23 | [结构] TypeScript 编译配置（含 JSX）。 |
| `tsdown.config.ts` | 配置 | 3 | [结构] 打包配置：Host 与 client 双入口。 |

### experimental/session-search — 让智能体检索历史会话的只读工具组合

包定位：默认关闭、不在默认插件列表展示的 bundle。补丁用一个 `cordis:group` 隔离 `sessionQuery`，组内两行：`session-query-sqlite`（`:memory:` 索引，`openAt: first-search`，即首次搜索才建索引、由所有智能体共享）与 `tool-session-query`（给所有智能体注册只读全局工具）。因为工具是全局注册，开关会影响全部预设（含 minimal）的下一次请求；开启 HMR 时即时生效。侧栏搜索不受影响，仍走原实现。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 14 | [结构] 唯一实质内容：隔离 `sessionQuery` 的组 + SQLite 索引行（内存库、首次搜索打开）+ 会话查询工具行。 |
| `docs/DETAIL.md` / `docs/DETAIL.zh.md` | 文档 | 1 | [结构] 详情页正文入口，只有一行指向 `preview.svg` 的图片引用。 |
| `docs/preview.svg` / `docs/preview.zh.svg` | 资源 | 1 | [结构] 插件市场预览图（单行约 78–112 KB 的内联 SVG）。 |
| `icon.svg` | 资源 | 11 | [结构] 插件图标。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 7 | [结构] 聚合行：8 个语言文件，Bundle 名称与描述文案。 |
| `package.json` | 配置 | 55 | [结构] 包声明：`listedByDefault: false`，只依赖 `session-query-sqlite` 与 `tool-session-query`。 |
| `README.i18n.yaml` | 配置 | 37 | [结构] 中英文 README 的翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 82 | [结构] 包说明：安装启用路径、索引的懒创建与共享、全局工具对预设的影响、已知限制。 |
| `src/index.ts` | 源码 | 2 | [精读] 仅 `export {}`，运行行全部由补丁声明。 |
| `tsconfig.json` | 配置 | 15 | [结构] TypeScript 编译配置。 |

### experimental/session-title-all-prompts-llm — 按全部用户消息持续重写标题的 LLM 提供方

包定位：`ctx.sessionTitle` 的一个可选提供方，注册 `all-prompts` 节奏——每条符合条件的新用户提示词都触发一次新修订，把截至当前修订的所有用户消息（含预置历史与子会话提示词）折叠后交给 `ctx.llm` 总结。它只实现「策略层」：系统提示词、JSON 包裹输入、输出取首行并剥掉整行星号强调，执行、取消与陈旧结果抑制都复用 `dsh-session-title-llm`。已有提供方标题时，每次请求都带上 `currentTitle` 并要求模型在仍准确时逐字保留，避免同主题追问被反复改写。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | [结构] 聚合行：8 个语言文件，插件名称与描述文案。 |
| `package.json` | 配置 | 46 | [结构] 包声明：peer 依赖 llm/session/session-title/session-title-llm，运行依赖 schemastery。 |
| `README.i18n.yaml` | 配置 | 64 | [结构] 中英文 README 的翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 120 | [结构] 包说明：修订时机、标题保持规则、必需配置无默认值、超预算失败与恢复。 |
| `src/index.ts` | 源码 | 176 | [精读] 提供方实现：`resolveConfig` 校验 `targetWords`/`targetCjkCharacters` 等无默认配置，`systemPrompt` 组语言与稳定性指令，`frameMessages` 用 JSON 防注入，`titleFromOutput`/`titleFromResponse` 取首行、拒工具调用与 max-tokens，`apply` 注册 `all-prompts` 提供方并选最低推理档。 |
| `tests/provider.spec.ts` | 测试 | 336 | [结构] 被测对象：`src/index.ts`——用记录型 `LlmAdapter` 校验提示词、路由继承、取消取代与解析边界，接入真实 SessionTitle 服务。 |
| `tsconfig.json` | 配置 | 14 | [结构] TypeScript 编译配置。 |

### experimental/session-titles-bundle — 用「全消息重写」替换首条提示标题

包定位：官方分组里的「随对话更新的标题」开关。补丁做两件事：把默认的首消息标题提供方 `session-title-llm` 置 `disabled: true`，再插入 `optional-session-title-all-prompts` 行并给出完整配置（5 词 / 10 个 CJK 字、4 KiB 输入、64 token 输出、60 s 超时）。因此关掉这个 bundle 就回到默认提供方，打开则对所有预设与已有/新建 Session 生效，用户固定的标题不会被自动改写。能力实现完全在被插入的那个包里。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 12 | [结构] 唯一实质内容：禁用默认标题提供方 + 插入 `all-prompts` 提供方及其五项目标/预算配置。 |
| `docs/DETAIL.md` / `docs/DETAIL.zh.md` | 文档 | 1 | [结构] 详情页正文入口，只有一行指向 `preview.svg` 的图片引用。 |
| `docs/preview.svg` / `docs/preview.zh.svg` | 资源 | 1 | [结构] 插件市场预览图（单行约 47–65 KB 的内联 SVG）。 |
| `icon.svg` | 资源 | 11 | [结构] 插件图标。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 7 | [结构] 聚合行：8 个语言文件，Bundle 名称与描述文案。 |
| `package.json` | 配置 | 53 | [结构] 包声明：`dsh.bundle.patch` 指向本包，依赖 `session-title-all-prompts-llm`。 |
| `README.i18n.yaml` | 配置 | 37 | [结构] 中英文 README 的翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 78 | [结构] 包说明：启用/关闭的效果、与默认提供方的替换关系、不覆盖用户固定标题。 |
| `src/index.ts` | 源码 | 2 | [精读] 仅 `export {}`，运行行全部由补丁声明。 |
| `tsconfig.json` | 配置 | 15 | [结构] TypeScript 编译配置。 |

### experimental/skill-badge — 随包分发「powered by dsh」徽章的 Skill 提供方

包定位：一个无配置的 Skill 提供方，向 `ctx.skills` 注册名为 `dsh-badge` 的内置候选（`source: 'bundled'`、`BUNDLED_SKILL_RANK`），并提供 `assets/` 目录作为资源基址，让模型在写 PR/MR 或用户索要署名徽章时能加载。它自己不实现 skill 内容，`get()` 在每次加载时读取 `assets/dsh-badge.md`；徽章的 Markdown 片段与随包 PNG 都在资源目录里，供无法取远程图片的环境使用。默认组合不含此插件，需安装并显式插入行。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `assets/dsh-badge.md` | 文档 | 31 | [结构] Skill 正文：远程 Shields.io 徽章与本地 PNG 两种用法、放置位置与可复用片段。 |
| `assets/dsh-badge.png` | 资源 |  | [结构] 随包 PNG 徽章（约 12 KB 二进制）。 |
| `icon.svg` | 资源 | 6 | [结构] 插件页图标（DSH 标签样式）。 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | [结构] 聚合行：8 个语言文件，插件页显示名与描述。 |
| `package.json` | 配置 | 44 | [结构] 包声明：`assets` 随包发布，peer 依赖 `dsh-skill` 与 cordis。 |
| `README.i18n.yaml` | 配置 | 55 | [结构] 中英文 README 的翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 120 | [结构] 包说明：何时选用、如何安装并插入行、skill 提供的内容与默认组合为何省略它。 |
| `src/index.ts` | 源码 | 60 | [精读] 组装固定 `SkillCandidate`（名称、描述、可被模型/用户调用、bundled 等级、资源基址），`get()` 现读 Markdown 正文，`apply()` 只做 `registerProvider`。 |
| `tests/skill-badge.spec.ts` | 测试 | 53 | [结构] 被测对象：`src/index.ts`——候选字段、资源基址解析与正文可读性。 |
| `tsconfig.json` | 配置 | 13 | [结构] TypeScript 编译配置。 |

### experimental/speech-to-text — 可插拔语音识别器的注册与路由服务

包定位：定义 `ctx.speechToText` 服务，把「选哪个识别器」与「怎么识别」拆成两步：`resolve()` 按请求或 profile 默认值钉住一个已注册 Provider（缺失 id、语言不支持都显式报错），`transcribe()` 只执行被钉住的那个，绝不回落转发音频。Provider 由各自 fiber 注册与销毁，注册返回的 disposer 会拒绝新进入、取消进行中并 join 已接受的工作；`follow()` 给出合并后的就绪快照流，`configure()` 通过 `settings` 把语言/Provider 偏好写回本插件在 profile 里的行。它不依赖具体识别器，sensevoice 等实现在别的包里。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | [结构] 聚合行：8 个语言文件，服务名称与说明。 |
| `package.json` | 配置 | 64 | [结构] 包声明：额外导出 `./types`、`./wave` 子路径，peer 依赖 settings 与（可选）Loader。 |
| `README.i18n.yaml` | 配置 | 37 | [结构] 中英文 README 的翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 82 | [结构] 包说明：resolve/transcribe 两段式、`defaultProvider` 必填、准备阶段的下载源选择不参与持久偏好。 |
| `src/index.ts` | 源码 | 210 | [精读] `SpeechToText` 服务：`register`/`remove` 管注册生命周期与 pending 集合，`follow` 用手写唤醒器合并快照，`snapshot` 拼 Provider 事实与选择，`configure` 校验后写 settings，`resolve`/`transcribe` 明确失败而非回退。 |
| `src/types.ts` | 源码 | 137 | [精读] Provider 中立契约：Provider 信息、五步准备状态机（check/model/vad/verify/load）、下载失败分类、`SpeechPreparation` 控制面、`SpeechRequest`→`SpeechSpec`→`Transcript`。 |
| `src/wave.ts` | 源码 | 23 | [精读] `validateWave`：逐字段核对 RIFF/fmt/data 头，强制 16 kHz 单声道 PCM16、长度自洽与时长上限。 |
| `tests/configuration.spec.ts` | 测试 | 59 | [结构] 被测对象：`src/index.ts` 的 `configure()`——真实 profile + Settings + ConfigEditor，验证不重挂载即持久化并在重启后恢复。 |
| `tests/fixtures/selection.patch.yml` | fixture | 9 | [结构] 测试 profile 补丁：editor、settings 与 `cordis:speech`（`defaultProvider: sensevoice-local`）。 |
| `tests/service.spec.ts` | 测试 | 212 | [结构] 被测对象：`src/index.ts`——路由、取消、fiber 所有权、准备任务跨观察者共享、`follow` 合并与拆卸。 |
| `tsconfig.json` | 配置 | 24 | [结构] TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | [结构] 打包配置：三个入口（index/types/wave）。 |

### experimental/speech-to-text-sensevoice — 本地 CPU SenseVoice + Silero VAD 识别器

包定位：`speech-to-text` 服务的一个 host-local Provider。启用时只检查磁盘缓存（模型、`tokens.txt`、VAD），不下载也不加载；首次准备才按 `runtime/assets.json` 的固定修订下载并用大小 + SHA-256 校验，再以单个串行子进程加载 sherpa-onnx。子进程在 127.0.0.1 临时端口上暴露带 Bearer 令牌的 `/transcribe`，就绪后只在 stdout 打一行 `{"port":N}`；Host 侧 `SenseVoiceWorker` 负责排队、超时、空闲回收与进程组清理。下载源选择（HF / HF-Mirror 并发 HEAD）与失败分类都在 Host 完成，错误信息对外脱敏。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | [结构] 聚合行：8 个语言文件，Provider 名称与准备阶段文案。 |
| `package.json` | 配置 | 58 | [结构] 包声明：额外导出 `./worker`，依赖 `sherpa-onnx-node@1.13.8` 与 `zod`，`runtime/assets.json` 随包发布。 |
| `README.i18n.yaml` | 配置 | 37 | [结构] 中英文 README 的翻译配对清单。 |
| `README.md` / `README.zh.md` | 文档 | 86 | [结构] 包说明：按需准备流程、精度选择、源探测与回退规则、缓存复用与离线部署。 |
| `runtime/assets.json` | 配置 | 28 | [结构] 资源锁定清单：int8/fp32 模型、词表、Silero VAD 的固定修订 URL、字节数与 SHA-256。 |
| `src/config.ts` | 源码 | 81 | [精读] schemastery 配置：`dataRoot` 必填绝对路径，`precision`、`modelOrigins`、VAD 三项阈值、音频/响应/日志字节上限、准备/推理/空闲/优雅退出各档超时。 |
| `src/download-error.ts` | 源码 | 46 | [精读] `classifyDownloadFailure` 沿 `cause` 与 `AggregateError.errors` 归为 dns/timeout/certificate/storage/network；`SpeechDownloadError` 只暴露文件、源、原因与状态码。 |
| `src/index.ts` | 源码 | 42 | [精读] 插件入口：校验路径绝对与源 URL，按精度估算磁盘/内存，注册 Provider 并调用 `worker.inspect()`；拆卸时先反注册再 `dispose()`。 |
| `src/inference.ts` | 源码 | 94 | [精读] `createTranscriber`：加载 `sherpa-onnx-node` 的 OfflineRecognizer 与 Silero Vad，逐段切分、推理并汇总 `audioSeconds`/`inferenceSeconds`。 |
| `src/input.ts` | 源码 | 22 | [精读] `auto`/zh/en/yue/ja/ko 语言提示白名单、`SpeechInputError`，以及先验语言与字节数再复用 `validateWave` 的 `validateInput`。 |
| `src/model-sources.ts` | 源码 | 41 | [精读] `orderModelSources`：同路径替换各源后并发 HEAD，取首个 2xx 排到最前，全失败则保留配置顺序，单源直接返回。 |
| `src/process-server.ts` | 源码 | 55 | [精读] `startRecognitionServer`：`timingSafeEqual` 校验 Bearer、限长、只接受 `POST /transcribe`，按输入错误映射 400/500。 |
| `src/recognizer.ts` | 源码 | 327 | [精读] `SenseVoiceWorker`：实现 `SpeechPreparation`（inspect/prepare/snapshot/cancel），串行队列 + `maxPending`、启动与推理超时、空闲回收；导出 `readReady`（限长读就绪行）与 `readTranscript`（限长读响应并校验字段）。 |
| `src/runtime.ts` | 源码 | 187 | [精读·读入口与结构] 运行时资产：`inspectRuntime`/`prepareRuntime` 按平台白名单解析路径、比对大小与 SHA-256、原子 `rename` 落盘，下载进度节流并映射错误。 |
| `src/worker.ts` | 源码 | 27 | [精读] 子进程入口：从 `argv[2]` 取 JSON 配置与模型路径、读后即删 `DSH_SPEECH_TOKEN`，起环回服务后只向 stdout 写一行端口；失败只写 stderr 并 `exit(1)`。 |
| `tests/download-error.spec.ts` | 测试 | 25 | [结构] 被测对象：`src/download-error.ts` 的错误链分类与脱敏文案。 |
| `tests/inference.spec.ts` | 测试 | 85 | [结构] 被测对象：`src/inference.ts` 的分段、语言切换与结果计量。 |
| `tests/installer.spec.ts` | 测试 | 203 | [结构] 被测对象：`src/runtime.ts` 与 `src/index.ts` 的准备流程——校验复用、原子替换、离线路径与显式源。 |
| `tests/local.e2e.ts` | 测试 | 38 | [结构] 被测对象：真实 `SenseVoiceWorker` 的端到端推理；无 `DSH_SPEECH_E2E_ROOT`/`DSH_SPEECH_E2E_AUDIO` 时跳过。 |
| `tests/model-sources.spec.ts` | 测试 | 92 | [结构] 被测对象：`src/model-sources.ts` 的并发探测、超时与顺序回退。 |
| `tests/process-server.spec.ts` | 测试 | 36 | [结构] 被测对象：`src/process-server.ts` 的鉴权、限长与端点校验。 |
| `tests/protocol.spec.ts` | 测试 | 84 | [结构] 被测对象：`src/recognizer.ts` 的 `readReady`/`readTranscript` 帧解析与字节上限。 |
| `tests/provider.spec.ts` | 测试 | 49 | [结构] 被测对象：`src/index.ts` 的 Provider 注册信息、语言列表与拆卸顺序。 |
| `tests/provider-queue.spec.ts` | 测试 | 70 | [结构] 被测对象：`src/recognizer.ts` 的启动期排队、并发上限与等待期取消。 |
| `tests/runtime.spec.ts` | 测试 | 114 | [结构] 被测对象：`src/runtime.ts` 的路径解析、校验失败与进度通知，含资产 fixture。 |
| `tests/worker.fixture.mjs` | fixture | 23 | [结构] 假 worker：按环境变量模拟就绪行、慢启动、错误退出与转录响应。 |
| `tests/worker.spec.ts` | 测试 | 481 | [结构] 被测对象：`src/recognizer.ts` 的完整生命周期——准备、串行化、超时、空闲回收与进程清理。 |
| `tests/worker-entry.spec.ts` | 测试 | 57 | [结构] 被测对象：`src/worker.ts`——以真实 Node + tsx 启动，校验失败时 stdout 为空、stderr 只有消息且退出码 1。 |
| `tests/worker-source.fixture.ts` | fixture | 2 | [结构] 供 `worker-entry` 引用的最小 TS 入口。 |
| `tsconfig.json` | 配置 | 27 | [结构] TypeScript 编译配置。 |
| `tsdown.config.ts` | 配置 | 3 | [结构] 打包配置：Host 入口与 worker 入口。 |


### experimental/subagent-oar — 经 OAR 运行时委派一次性子代理

包定位：把 Codex、Claude Code 这类外部编码代理封装成 DSH 的 `SubagentProvider`，让主代理通过 `subagent_oar` 工具把独立文本任务派给原生 CLI 执行。包内分三层：`index.ts` 从 OAR 默认运行时注册表取运行时并向 `ctx.subagents` 注册 provider；`run.ts` 负责一次派发的生命周期（安装探测、启动、轮次等待、中止、会话销毁）与把原生记录折算成 DSH 结果；`environment.ts` 把共享的凭据清洗结果翻译成 OAR 的继承环境覆盖层。它只产出助手文本和固定的失败事实，不继承父上下文、不携带启动能力；与之配套的工具侧是 `tool-subagent-oar`。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `icon.svg` | 资源 | 1 | 插件市场图标 |
| `LICENSE-OAR` | 文档 | 202 | 内嵌 OAR 库的第三方许可全文 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 8 个语种的插件名称与描述词条 |
| `package.json` | 配置 | 75 | 包名、导出面（`.`、`./src/*`、`./locale/*.json`）、运行期依赖与 OAR 许可携带 |
| `README.i18n.yaml` | 文档 | 67 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 174 | 英文使用说明：与 `subagent_oar` 工具组合、凭据与限流说明 |
| `README.zh.md` | 文档 | 174 | 中文使用说明 |
| `src/environment.ts` | 源码 | 20 | [精读] 把 `scrubbedParentEnv()` 的清洗结果转成 OAR 的环境覆盖表：被清洗的继承变量置 null 删除，改值变量重设新值，再叠加部署显式项 |
| `src/index.ts` | 源码 | 85 | [精读] 插件入口：解析 `runtime`/`providerName`/`model`/`effort`/`env`/`launchArgs`/`timeoutMs` 配置，校验超时上界，构造 `OarRunSpec` 并以 `NO_START_CAPABILITIES`、`inheritsParentContext: false` 注册 provider |
| `src/run.ts` | 源码 | 301 | [精读] 单次 OAR 派发：按安装→启动→轮次→中止→销毁五阶段归类失败并给出可读建议，等待轮次结束、取根答复文本、超时与取消、释放自有会话 |
| `tests/environment.e2e.ts` | 测试 | 75 | 被测对象：`src/environment.ts` 的环境覆盖在真实子进程环境下保留清洗策略 |
| `tests/fixtures/claude-protocol.mjs` | fixture | 19 | 假 Claude Code CLI 的流式协议输出，供权限模式测试回放 |
| `tests/fixtures/codex-startup.mjs` | fixture | 32 | 假 Codex CLI 的启动输出，供启动/清理测试回放 |
| `tests/fixtures/environment-driver.ts` | fixture | 26 | 调用 `oarEnvironment` 并打印覆盖表的驱动脚本 |
| `tests/fixtures/environment-probe.mjs` | fixture | 32 | 子进程侧读取环境变量以验证删除与改写生效 |
| `tests/fixtures/loader/composition.patch.yml` | fixture | 41 | Loader 组合冒烟用的 patch 片段，把该 provider 挂进生产 profile |
| `tests/fixtures/loader/driver.ts` | fixture | 33 | 用 production-profile 夹具启动 Loader 组合 |
| `tests/fixtures/loader/fixture.ts` | fixture | 22 | 注入 `llm` 的最小插件，验证组合期依赖解析 |
| `tests/loader-composition.e2e.ts` | 测试 | 30 | 被测对象：`src/index.ts` 在 Loader 组合中的激活与配置解析 |
| `tests/native.e2e.ts` | 测试 | 51 | 被测对象：`src/index.ts` 注册的 provider 对原生 CLI 的真实调用路径 |
| `tests/packed-artifact.e2e.ts` | 测试 | 87 | 被测对象：构建产物 `lib/index.js` 在打包安装后的可用性与导出面 |
| `tests/permission-mode.e2e.ts` | 测试 | 76 | 被测对象：`src/run.ts` 在传 `launchArgs` 权限参数时的启动与轮次行为 |
| `tests/startup-cleanup.e2e.ts` | 测试 | 111 | 被测对象：`src/run.ts` 启动失败与提前中止时的会话销毁与残留清理 |
| `tests/subagent-oar.spec.ts` | 测试 | 544 | 被测对象：`src/index.ts` 与 `src/run.ts` 的配置校验、失败分类、答复选取与停止原因映射 |
| `tsconfig.json` | 配置 | 42 | TypeScript 编译目标、模块解析与源码/测试包含范围 |
| `tsdown.config.ts` | 配置 | 15 | tsdown 打包入口与外部依赖声明 |

### experimental/terminal-bundle — 可见常驻终端的 profile 组合包

包定位：一个纯组合包，本身没有运行时代码，`src/index.ts` 仅 `export {}` 占位，真正的插件组合写在 `cordis.patch.yml`：用 `cordis:group` 隔离出一个 `terminals` 服务域，依次挂载终端注册表、侧栏终端后端与全局终端工具。这样常驻终端的能力边界（后端、面板、工具）被封装成一个可整体开关的层，与仓库里其他 bundle 包同一写法。它默认在 Web 与 Desktop 中关闭，且不出现在插件列表与详情页。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 15 | 以 `insert` 声明 `optional-persistent-terminals` 分组：隔离 `terminals` 域，装入 `dsh-terminal`、带 `preferredShells` 的 `terminal-panel`（Windows 下优先 pwsh/powershell）与 `tool-terminal` |
| `docs/DETAIL.md` | 文档 | 1 | 插件详情页的插图引用 |
| `docs/DETAIL.zh.md` | 文档 | 1 | 中文详情页的插图引用 |
| `docs/preview.svg` | 资源 | 1 | 英文详情页预览图 |
| `docs/preview.zh.svg` | 资源 | 1 | 中文详情页预览图 |
| `icon.svg` | 资源 | 1 | 插件市场图标 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 7 | 8 个语种的 bundle 名称与一行描述 |
| `package.json` | 配置 | 55 | 包名、导出面（`.`、`./cordis.patch.yml`、`./locale/*.json`）、bundle 类型声明 |
| `README.i18n.yaml` | 文档 | 37 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 80 | 英文说明：六个全局终端工具加两个只读用户终端工具、隔离注册表与会话侧栏接管 |
| `README.zh.md` | 文档 | 80 | 中文说明 |
| `src/index.ts` | 源码 | 2 | [精读] 仅 `export {}`：运行期条目全部由 `cordis.patch.yml` 决定 |
| `tsconfig.json` | 配置 | 15 | TypeScript 编译配置，本包无源码产物 |

### experimental/terminal-panel — 侧栏可见的常驻终端后端

包定位：为终端注册表提供一个后端实现，把每个 Agent 终端落地为会话侧栏里的可视终端标签页——用户能看、能键入，一旦用户接管，模型便退化为只读。它同时提供面向用户自有终端的只读工具，并注入一段系统提示，指导模型何时用可见终端、何时仍用 `bash`。与 `terminal-bundle` 的关系是「被组合者」：bundle 只是把本包与 `dsh-terminal`、`tool-terminal` 一起挂进隔离域；与 `tool-terminal` 的关系是「同一终端、不同入口」，后者给模型的全局工具走本包的 `PanelTerminalBackend`。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 8 个语种的插件名称与描述词条 |
| `package.json` | 配置 | 64 | 包名、导出面、对 terminal/terminal-controller/sandbox 的依赖声明 |
| `README.i18n.yaml` | 文档 | 91 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 180 | 英文说明：后端语义、接管与策略变更拒绝、启动与发送等待阈值 |
| `README.zh.md` | 文档 | 180 | 中文说明 |
| `src/backend.ts` | 源码 | 124 | [精读] `TerminalBackend` 实现：拒绝子代理开终端，经 `terminalController.openForAgent` 开会话，等 shell 打印后静默且占前台再渲染启动屏，运行期用 `samePolicy` 比对沙箱策略 |
| `src/config.ts` | 源码 | 69 | [精读] 配置 schema：`backendType`、初始 cols/rows、`preferredShells`、终端环境变量、启动/提示/空闲/总超时四档静默阈值、`maxReadBytes`、`readUserTerminals`，并校验三组阈值的大小关系 |
| `src/index.ts` | 源码 | 40 | [精读] 插件入口：注册侧栏后端、注入 `tool:pty-panel` 系统提示段，按 `readUserTerminals` 决定是否注册用户终端只读工具 |
| `src/session.ts` | 源码 | 374 | [精读] 单个侧栏终端会话：发送（提示/空闲/超时三种结束原因）、屏幕增量读取与截断、信号、前台进程探测、用户接管与策略变更拒绝、状态投影 |
| `src/tools.ts` | 源码 | 148 | [精读] `user_terminal_list` 与 `user_terminal_read` 两个只读工具：列举用户终端、按行读取屏幕并截断，子代理调用即拒绝 |
| `tests/agent.ts` | fixture | 27 | 构造带可选 cwd 与子代理来源的 `Agent` 测试替身 |
| `tests/backend.spec.ts` | 测试 | 170 | 被测对象：`src/backend.ts` 的启动等待、子代理拒绝与策略比对 |
| `tests/fake.ts` | fixture | 117 | `PanelTerminal` 的内存实现（`SHELL_PID`、可脚本化输出与前台进程），供 session/backend 用例复用 |
| `tests/integration.spec.ts` | 测试 | 62 | 被测对象：`src/backend.ts` 与 `src/config.ts` 在真实注册表接线下的整体行为 |
| `tests/session.spec.ts` | 测试 | 357 | 被测对象：`src/session.ts` 的发送等待原因、增量输出、接管与策略变更、错误翻译 |
| `tests/tools.spec.ts` | 测试 | 185 | 被测对象：`src/tools.ts` 的列表与屏幕渲染、子代理拒绝、注册路径 |
| `tsconfig.json` | 配置 | 51 | TypeScript 编译配置与测试包含范围 |

### experimental/tool-ralph — 固定脚本的新代理轮次循环工具

包定位：给模型一个 `ralph` 工具，把「一个不变的目标 + 多轮全新子代理」的迭代方式固化成部署侧拥有的编排。模型只能提供 `objective` 与可选轮数上限，循环脚本、provider 路由、结构化报告 schema 与交接校验都不可改。每轮经 `workflowEngine` 启动一个不带对话种子的结构化输出子代理，仅带上轮的受限交接；工作区充当持久记忆。它依赖 `workflow` 引擎与 `subagents` 服务，和普通子代理/工作流的区别在于「轮次自动续跑、上下文每轮清零」。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6 | 8 个语种的插件名称与描述词条（en 少一条） |
| `package.json` | 配置 | 65 | 包名、导出面（`.`、`./src/*`、`./locale/*.json`）与 workflow/tools/subagent 依赖 |
| `README.i18n.yaml` | 文档 | 100 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 179 | 英文说明：显式请求才启用、交接不自证、轮数预算与失败语义 |
| `README.zh.md` | 文档 | 179 | 中文说明 |
| `src/index.ts` | 源码 | 477 | [精读] 插件入口：注入轮数/交接字符数/结果字符数三项上限，内嵌 `RALPH_SCRIPT` 的轮次脚本与报告 schema，校验工作流终态形状（complete/blocked/budget-limited/round-failed），把父步骤的中止映射为工作流取消，并渲染带截断上限的终态文本 |
| `tests/integration.spec.ts` | 测试 | 294 | 被测对象：`src/index.ts` 与工作流引擎的真实接线——启动、轮数上限、取消与资源释放 |
| `tests/tool-ralph.spec.ts` | 测试 | 413 | 被测对象：`src/index.ts` 的参数校验、终态解析、失败渲染与工具展示 |
| `tsconfig.json` | 配置 | 39 | TypeScript 编译配置与测试包含范围 |

### experimental/tool-session-query — 工作区授权的历史会话检索工具

包定位：把会话历史查询服务包装成五个只读模型工具：`session_search`、`session_event_search`、`session_trace`、`session_event_trace`、`session_event_read`。它是「查询工具」而非「会话工具」——本身不持有会话数据，全部读取经 `sessionQuery` 服务，并在工具层做跨会话授权：目标会话的 `cwd` 必须与调用者完全一致，无 `cwd` 的调用者只能看自己；搜索排除调用者自身会话，命中达到部署上限时提示模型收窄查询。与 `worktree`、`tool-worktree` 无关，也不做会话创建或写入。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 8 个语种的插件名称与描述词条 |
| `package.json` | 配置 | 67 | 包名、导出面与 session-query/tools 依赖声明 |
| `README.i18n.yaml` | 文档 | 97 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 186 | 英文说明：五个工具、工作区授权规则、结果上限与超时 |
| `README.zh.md` | 文档 | 186 | 中文说明 |
| `src/index.ts` | 源码 | 136 | [精读] 插件入口：注册五个工具与共享提示段，`maxSearchResults`/`searchTimeoutMs` 的默认值与合法性校验，文本输出 schema 统一 |
| `src/input.ts` | 源码 | 307 | [精读] 模型参数 schema 与归一化：会话搜索过滤（时间、父子会话、可用性、事件序号/时间/类型/表面）转成服务过滤对象，并拒绝非法组合 |
| `src/operations.ts` | 源码 | 280 | [精读] 五个工具的执行编排：先做工作区授权，再调会话查询服务，按部署上限裁剪结果并渲染文本 |
| `src/presentation.ts` | 源码 | 255 | [精读] 结果文本渲染与通用卡片展示：命中列表、血缘树、事件窗口与标题映射的排版 |
| `src/service-boundary.ts` | 源码 | 179 | [精读] 服务异常围栏：把 `SessionQueryError` 各码映射为固定的模型可见文案，不可打印的失败降级为通用错误 |
| `src/workspace-access.ts` | 源码 | 256 | [精读] 调用者识别与工作区授权：解析 `cwd`、校验目标会话可见性、投影可见祖先/后代血缘并读取会话标题 |
| `tests/sqlite-integration.spec.ts` | 测试 | 248 | 被测对象：`src/operations.ts` 在真实 SQLite 会话索引上的检索、分页与上限裁剪 |
| `tests/tool-session-query.spec.ts` | 测试 | 2117 | [结构] 被测对象：五个工具的授权矩阵、过滤器构造、异常翻译与文本渲染（超 500 行，按用例分组浏览） |
| `tsconfig.json` | 配置 | 42 | TypeScript 编译配置与测试包含范围 |

### experimental/tool-subagent-oar — 外部子代理委派工具

包定位：`subagent-oar` provider 的模型侧入口。部署在配置里固定「运行时别名 → provider 名」的映射，模型每次调用只选别名，不能改原生参数或权限；工具据此经 `subagents` 服务发起一次性激活，返回子代理名称，稍后由完成通知带回最终答复。它强制 provider 必须是独立上下文的一次性子代理，遇到可续跑或继承上下文的 provider 直接报错。与 `subagent-oar` 是同一能力的两半：前者供 provider，本包供工具。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 8 个语种的插件名称与描述词条 |
| `package.json` | 配置 | 52 | 包名、导出面（`.`、`./src/*`）与 tools/subagent 依赖 |
| `README.i18n.yaml` | 文档 | 52 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 111 | 英文说明：别名选择、独立上下文、完成通知语义 |
| `README.zh.md` | 文档 | 111 | 中文说明 |
| `src/index.ts` | 源码 | 108 | [精读] 插件入口：校验别名表非空，注册 `subagent_oar` 工具（`runtime` 枚举、`description`/`name`/`prompt`/`cwd`），拒绝非一次性 provider，发起激活并只回传子代理名 |
| `tests/tool-subagent-oar.spec.ts` | 测试 | 150 | 被测对象：`src/index.ts` 的别名解析、provider 能力拒绝与激活参数传递 |
| `tsconfig.json` | 配置 | 24 | TypeScript 编译配置与测试包含范围 |

### experimental/tool-terminal — 六个常驻终端工具

包定位：面向模型的终端工具集，覆盖开、发、读、发信号、关、列六种操作，让代理跨调用保留终端状态并支持交互式输入。归属权来自发起工具调用的确切 Agent，因此一个代理不能操作另一个代理的会话；后台发送交给通用 `jobs` 服务托管，按拉取源增量取输出。它只提供工具与渲染，真正的终端能力来自终端注册表；与 `terminal-panel` 的关系是「工具面 vs 后端面」，二者由 `terminal-bundle` 组合到一起。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 8 个语种的插件名称与描述词条 |
| `package.json` | 配置 | 73 | 包名、导出面与 terminal/jobs/tools 依赖声明 |
| `README.i18n.yaml` | 文档 | 100 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 186 | 英文说明：六工具、归属隔离、结果字节上限与后台发送 |
| `README.zh.md` | 文档 | 186 | 中文说明 |
| `src/background.ts` | 源码 | 31 | [精读] 把后端消费式发送读取器适配成 `JobOutputSource`：按已交付字节推算游标，发送尚未开始时返回空增量 |
| `src/index.ts` | 源码 | 409 | [精读] 插件入口：定义六个工具的输入/输出 schema（会话快照、发送结果、读结果、状态联合类型），校验归属，`enableRunInBackground` 与 `maxResultBytes` 由部署配置 |
| `src/render.ts` | 源码 | 177 | [精读] 模型/UI 文本渲染：开、发、读、列的固定排版，按字节上限截断 |
| `tests/loader-composition.spec.ts` | 测试 | 141 | 被测对象：`src/index.ts` 在 Loader 组合中的注入声明与工具注册 |
| `tests/render.spec.ts` | 测试 | 73 | 被测对象：`src/render.ts` 的排版与截断边界 |
| `tests/tools.spec.ts` | 测试 | 538 | [结构] 被测对象：`src/index.ts` 六工具的归属隔离、参数校验、后台发送与错误路径（超 500 行，按工具分组浏览） |
| `tsconfig.json` | 配置 | 45 | TypeScript 编译配置与测试包含范围 |

### experimental/tool-worktree — 创建工作树工具的组合包

包定位：一个 bundle 包，`src/index.ts` 只注册 `create_worktree` 工具，`cordis.patch.yml` 把 `worktree` 服务与 `tool-worktree` 工具一并插入。工具从本地提交/分支/标签切出新分支与检出目录，并把当前会话工作目录切过去；未提交文件留在原检出中，名字冲突即失败。它与 `worktree` 包是「工具 vs 服务」的关系：本包自己不实现 git 操作，全部委托 `ctx.worktrees.create`。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 5 | 依次插入 `worktree` 服务与 `tool-worktree` 工具 |
| `docs/DETAIL.md` | 文档 | 1 | 英文详情页的插图引用 |
| `docs/DETAIL.zh.md` | 文档 | 1 | 中文详情页的插图引用 |
| `docs/preview.svg` | 资源 | 1 | 英文详情页预览图 |
| `docs/preview.zh.svg` | 资源 | 1 | 中文详情页预览图 |
| `icon.svg` | 资源 | 18 | 插件市场图标 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 7 | 8 个语种的 bundle 名称与一行描述 |
| `package.json` | 配置 | 74 | 包名、导出面（含 `./cordis.patch.yml`）与 bundle 类型声明 |
| `README.i18n.yaml` | 文档 | 46 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 96 | 英文说明：Change requests & worktrees 入口、PTC 同构结果、文件策略 |
| `README.zh.md` | 文档 | 96 | 中文说明 |
| `src/index.ts` | 源码 | 43 | [精读] 注册 `create_worktree`：`name`（省略则生成）与 `from`（默认 HEAD、不 fetch）两个参数，返回路径/分支/基线提交/仓库根，执行时转调 `ctx.worktrees.create` |
| `tests/loader-composition.spec.ts` | 测试 | 110 | 被测对象：`cordis.patch.yml` 与服务/工具在 Loader 组合中的挂载顺序 |
| `tsconfig.json` | 配置 | 24 | TypeScript 编译配置与测试包含范围 |

### experimental/translator — 匿名端点与原生 Flash 的文本翻译服务

包定位：向 Cordis 注入 `ctx.translator` 服务，做有界单段文本翻译。路由分两类：匿名端点（默认 Bing，可选 Google，无需登录与密钥）与显式选择的付费原生 DeepSeek Flash 路由；调用方给出文本、目标语言、可选源语言与 provider，服务解析成规范 spec 后分发。带 `sessionId` 时可把请求与结果作为插件记录写入既有会话，实现跨 provider 的可复用结果；无会话则无状态。它不依赖代理历史，失败诊断不含原文与响应体。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 8 个语种的插件名称与描述词条 |
| `package.json` | 配置 | 73 | 包名、导出面与 llm/credentials/session 依赖声明 |
| `README.i18n.yaml` | 文档 | 49 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 124 | 英文说明：端点选择、长度/字节/超时上限、付费路由前置条件 |
| `README.zh.md` | 文档 | 124 | 中文说明 |
| `src/deepseek.ts` | 源码 | 219 | [精读] 付费原生路由：按 `deepseek-account`/`deepseek-official` 找所属包与 fiber、校验凭据与模型目录、以 `deepseek-flash` 关闭思考做独立翻译、汇总文本块，并给出 `deepseekRecipe` 语义指纹 |
| `src/error.ts` | 源码 | 15 | [精读] `TranslationError`：只带错误码与安全诊断，不携带原文或响应体 |
| `src/index.ts` | 源码 | 187 | [精读] `Translator` 服务：配置 schema（端点、超时、字符数、响应字节、Flash 输出上限）、`availableProviders`/`resolve`/`translate` 三个入口、生命周期中止与未完成请求收敛 |
| `src/provider.ts` | 源码 | 144 | [精读] 匿名端点协议：Google/Bing 请求构造、中文标签规范化（zh-CN/zh-Hans 等）、有界 JSON 解析与文本抽取、`anonymousRecipe` 端点指纹 |
| `src/storage.ts` | 源码 | 166 | [精读] 会话内持久化：派发前写不可变请求记录、成功后写结果，校验记录形状与去重，持久化缺失时给出固定错误 |
| `src/types.ts` | 源码 | 93 | [精读] 公共类型面：provider 联合、请求/解析后 spec、身份与记录结构、错误码枚举 |
| `tests/audit.spec.ts` | 测试 | 209 | 被测对象：`src/deepseek.ts` 与 `src/storage.ts` 在 JSONL 会话上的付费翻译审计记录 |
| `tests/deepseek.e2e.ts` | 测试 | 72 | 被测对象：`src/index.ts` 的付费路由端到端翻译 |
| `tests/deepseek.spec.ts` | 测试 | 462 | 被测对象：`src/deepseek.ts` 的所属包发现、准入拒绝、文本组装与超时 |
| `tests/fixtures/cordis.yml` | fixture | 4 | 装配翻译服务与假会话的最小 Cordis 组合配置 |
| `tests/paid-fixture.ts` | fixture | 224 | 搭建带凭据与模型目录的付费路由测试环境 |
| `tests/storage-fixture.ts` | fixture | 163 | 搭建会话持久化与翻译服务组合的测试环境 |
| `tests/storage-helper.spec.ts` | 测试 | 70 | 被测对象：`src/storage.ts` 的记录解析与校验辅助路径 |
| `tests/storage-lifecycle.spec.ts` | 测试 | 110 | [结构] 被测对象：`src/storage.ts` 在会话关闭/文件清理时的生命周期行为 |
| `tests/storage-settlement.spec.ts` | 测试 | 108 | 被测对象：`src/storage.ts` 写入失败与中止的结算路径 |
| `tests/storage.spec.ts` | 测试 | 248 | 被测对象：`src/storage.ts` 请求/结果的写入、去重与复用 |
| `tests/translator.spec.ts` | 测试 | 236 | 被测对象：`src/index.ts` 的配置校验、provider 解析与分发 |
| `tests/upstream.e2e.ts` | 测试 | 46 | 被测对象：`src/provider.ts` 对真实匿名端点的请求与响应解析 |
| `tsconfig.json` | 配置 | 51 | TypeScript 编译配置与测试包含范围 |

### experimental/voice-input-bundle — 语音输入能力的 profile 组合包

包定位：纯组合包，`src/index.ts` 只 `export {}`，运行期条目全部由 `cordis.patch.yml` 声明。它把四块拼成一个可整体开关的语音输入能力：语音转写服务定义（默认 provider 指向本地 SenseVoice）、本地 SenseVoice provider（数据落在 `dshHomePath('speech-to-text','sensevoice')`）、带认证的远端转写 API，以及浏览器端麦克风控件。出厂 profile 默认关闭。包内只有构建脚本与资源，没有自身实现。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `cordis.patch.yml` | 配置 | 13 | 插入 `speech-to-text`（`defaultProvider: sensevoice-local`）、`speech-to-text-sensevoice`（数据根目录）、`api-speech-to-text`、`ui-voice-input` 四行 |
| `docs/DETAIL.md` | 文档 | 1 | 英文详情页的插图引用 |
| `docs/DETAIL.zh.md` | 文档 | 1 | 中文详情页的插图引用 |
| `docs/preview.svg` | 资源 | 46 | 英文详情页预览图 |
| `docs/preview.zh.svg` | 资源 | 46 | 中文详情页预览图 |
| `icon.svg` | 资源 | 9 | 插件市场图标 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 7 | 8 个语种的 bundle 名称与一行描述 |
| `package.json` | 配置 | 58 | 包名、导出面（含 `./cordis.patch.yml`）、bundle 类型与四个组合包的依赖 |
| `README.i18n.yaml` | 文档 | 37 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 77 | 英文说明：四段组合、默认关闭、本地与远端两条转写路线 |
| `README.zh.md` | 文档 | 77 | 中文说明 |
| `src/index.ts` | 源码 | 2 | [精读] 仅 `export {}`：运行期条目由 `cordis.patch.yml` 决定 |
| `tsconfig.json` | 配置 | 15 | TypeScript 编译配置 |
| `tsdown.config.ts` | 配置 | 3 | 只把 `lib/types/index.js` 打成 ESM 类型入口，不产出运行时代码 |

### experimental/webhook — 受信 webhook 规则运行时

包定位：向 Host 注入 `ctx.webhookRuntime`，一个「可信程序化规则」注册表，只提供一个内建动作——在 Web 工作区里创建普通根会话。对外接口刻意保持 `register(rule)` 与 `dispatch(delivery)` 两个动作，provider 的鉴权归适配器包，本包只校验投递对象是 lossless JSON 并冻结后广播。它与 `webhook-github` 是「运行时 vs 适配器」的关系：后者验签出投递再调本包分发；规则回调可以有返回值也可以无返回（fire-and-forget），生命周期与规则注册的 effect 绑定。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 8 个语种的插件名称与描述词条 |
| `package.json` | 配置 | 67 | 包名、导出面与 agent/workspace/session 依赖声明 |
| `README.i18n.yaml` | 文档 | 46 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 86 | 英文说明：规则接口、投递校验、会话创建动作 |
| `README.zh.md` | 文档 | 86 | 中文说明 |
| `src/brand.ts` | 源码 | 39 | [精读] 三个品牌化标识（规则 id、适配器 source id、投递 id）及其构造器，明示运行时不赋予去重语义 |
| `src/index.ts` | 源码 | 178 | [精读] `WebhookRuntime` 服务：投递快照校验与冻结、规则注册/注销（中止并排空在途回调）、关闭期拒绝、`dispatch` 逐规则调用并把非空结果交给会话创建 |
| `src/session.ts` | 源码 | 155 | [精读] 规则结果落地：校验工作区绝对路径、标题、prompt、代理与权限预设，经工作区注册表与默认模型创建立根会话并回填来源 |
| `src/types.ts` | 源码 | 84 | [结构] 公共类型：投递、规则、会话请求与来源描述（据使用面归纳） |
| `tests/loader-composition.spec.ts` | 测试 | 93 | 被测对象：`src/index.ts` 在 Loader 组合中的注入声明与服务注册 |
| `tests/runtime.spec.ts` | 测试 | 281 | 被测对象：`src/index.ts` 的注册/注销、投递校验、并发回调与关闭语义 |
| `tests/session.spec.ts` | 测试 | 281 | 被测对象：`src/session.ts` 的请求校验与会话创建事务 |
| `tsconfig.json` | 配置 | 48 | TypeScript 编译配置与测试包含范围 |

### experimental/webhook-github — GitHub 签名投递适配器

包定位：`webhook` 运行时的 GitHub 适配器。向注入的 `ctx.webServer` 注册一条精确路由，读取有上限的原始请求体、按凭据中的共享密钥验签、把事件投影成 provider 中立的投递对象，调用 `ctx.webhookRuntime.dispatch()` 后立即回 `202`，不等规则与会话。它只负责「入口安全 + 翻译」，规则策略与建会话仍是运行时的事。`examples/github-review` 给出该适配器接 PR 评审规则的一份可运行样例。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `examples/github-review/cordis.yml` | 配置 | 35 | 样例组合：凭据、webhook 运行时、GitHub 适配器与评审规则的一体化配置 |
| `examples/github-review/github-ready-review-rule.mjs` | 脚本 | 65 | 样例规则：把 `pull_request` ready_for_review 事件转成会话请求 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 8 个语种的插件名称与描述词条 |
| `package.json` | 配置 | 63 | 包名、导出面与 octokit/webhook/webserver 依赖声明 |
| `README.i18n.yaml` | 文档 | 37 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 88 | 英文说明：配置字段、验签流程、202 语义 |
| `README.zh.md` | 文档 | 88 | 中文说明 |
| `src/body.ts` | 源码 | 69 | [精读] 原始体读取：十进制 Content-Length 校验、超限 413、UTF-8 解码与 `WebhookHttpError` 状态码集合 |
| `src/handler.ts` | 源码 | 130 | [精读] 路由处理器：唯一性请求头校验、JSON Content-Type 判定、`@octokit/webhooks` 验签、事件投影与 fire-and-forget 分发 |
| `src/index.ts` | 源码 | 62 | [精读] 插件入口：`source`/`path`/`secretEnv`/`maxBodyBytes` 配置与路由路径形状校验，注册精确路由 |
| `src/types.ts` | 源码 | 22 | [结构] GitHub JSON 对象与投递载荷类型 |
| `tests/body.spec.ts` | 测试 | 57 | 被测对象：`src/body.ts` 的长度解析、上限与解码失败路径 |
| `tests/config.spec.ts` | 测试 | 53 | 被测对象：`src/index.ts` 的配置校验与路由注册 |
| `tests/handler.spec.ts` | 测试 | 258 | 被测对象：`src/handler.ts` 的验签、头部校验、事件投影与响应码 |
| `tests/loader-composition.spec.ts` | 测试 | 90 | 被测对象：`src/index.ts` 在 Loader 组合中的注入与路由挂载 |
| `tsconfig.json` | 配置 | 36 | TypeScript 编译配置与测试包含范围 |

### experimental/webworker-packer — 浏览器运行时的 VFS 镜像打包器

包定位：构建期工具，把一份已发布 profile 的 bundle 集合与安装清单打成浏览器 worker 会挂载的 gzip tar 基础镜像，另外产出按需加载的惰性分块归档与若干数据 overlay，并写出镜像清单。它不编译源码：镜像里放的是仓库真实的构建产物，预览部署调试的就是发布部署所 ship 的东西；唯一的改写是用运行时自己的 `lowerModuleSource` 做打包期降级，使 worker 不需要自带编译器。与 `webworker-runtime` 的分工是「打包 vs 运行」：镜像布局、清单与 wrapper 契约由后者定义，本包只按契约写出；`bin.js` 提供 `dsh-pack-vfs-image` 命令。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `bin.js` | 脚本 | 20 | `dsh-pack-vfs-image` 的稳定链接目标：构建产物 `lib/bin.js` 缺失时给出提示并退出，存在则转发 |
| `package.json` | 配置 | 57 | 包名、`bin` 声明、导出面与 runtime/app-boot 依赖 |
| `README.i18n.yaml` | 文档 | 31 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 74 | 英文说明：镜像构成、惰性分块、overlay 约束 |
| `README.zh.md` | 文档 | 74 | 中文说明 |
| `src/bin.ts` | 源码 | 88 | [精读] CLI：解析 `--out`/`--profile`/`--root` 与 fixture 选项，物化基础镜像与惰性归档，再写各命名 fixture overlay 及其清单 |
| `src/index.ts` | 源码 | 17 | [精读] 库导出面：`packVfsImage`/`packVfsOverlay`/`collectModuleNames`、仓库侧打包入口与 `WRAPPER_CONTRACT` |
| `src/pack.ts` | 源码 | 783 | [精读·读入口与导出面] 镜像主体逻辑：遍历 roster 与包索引收集文件（picomatch 排除、嵌套 node_modules 扁平化），逐个降级 JS 入口，切出页面分块归档，写清单与 home patch；内部按「收集→筛选→降级→归档→清单」分段 |
| `src/preview.ts` | 源码 | 90 | [精读] Preview 数据 overlay：在 Node 侧把历史会话日志规范化为当前代的会话后继，保持源字节不变并拒绝畸形/未来格式 |
| `src/repository.ts` | 源码 | 296 | [精读] 仓库知识层：定位 workspace/vendor 包、安装清单、profile bundle 与配置树，提供 `packRepositoryImage`/`packPreviewFixture`/`describePack` 等入口 |
| `src/rules.ts` | 源码 | 72 | [精读] 打包规则的唯一出处：通用排除（测试、sourcemap、声明文件、归档）、工作区额外排除（`src`/`dist`）、页面 assets 的免降级集合、worker 侧入口种子 |
| `src/transform-image.ts` | 源码 | 26 | [精读] `ImageFiles` 与 `WRAPPER_CONTRACT`：声明打包体所对齐的 wrapper 版本，镜像清单据此拒绝版本不符的挂载 |
| `tests/built-lib.e2e.ts` | 测试 | 127 | 被测对象：构建产物 `lib/` 经 CLI 命令实际打包的端到端可用性 |
| `tests/entry-seeds.spec.ts` | 测试 | 16 | 被测对象：`src/rules.ts` 的 `IMAGE_ENTRY_SEEDS` 与运行时实际 `require` 调用保持一致 |
| `tests/exports.spec.ts` | 测试 | 69 | 被测对象：`src/index.ts` 公共导出面稳定性 |
| `tests/image-loadable.spec.ts` | 测试 | 357 | 被测对象：`src/pack.ts` 产出的镜像可被 `MemoryVfs` 与模块加载器实际挂载与解析 |
| `tests/lazy-chunks.spec.ts` | 测试 | 99 | 被测对象：`src/pack.ts` 的惰性分块切分与清单登记 |
| `tests/preview.spec.ts` | 测试 | 137 | 被测对象：`src/preview.ts` 的会话后继规范化与拒绝路径 |
| `tests/profile-image.spec.ts` | 测试 | 106 | 被测对象：`src/repository.ts` 的 profile 装配与镜像内容断言 |
| `tsconfig.json` | 配置 | 36 | TypeScript 编译配置与测试包含范围 |
| `tsdown.config.ts` | 配置 | 18 | tsdown 打包入口（库与 bin）与外部依赖声明 |

### experimental/webworker-runtime — 把整棵 harness 塞进一个 Web Worker

包定位：让完整的 Cordis 插件树在浏览器的专用 Worker 里跑起来，宿主侧只提供 postMessage 通道。为此它自建了一整套运行环境：VFS 镜像（gzip + ustar，一次 fetch 挂载）与基于内存的 `node:fs` 权威实现；一个把 ESM 降级为 CJS 并按挂起点注入上下文的编译期变换；一个在 VFS 上做 `require` 解析的模块加载器；一张 `node:*` 内建替身表（真实语义版与结构化桩两类）；一个内置 shell 与子进程桥；以及把 HTTP 请求灌进真实路由表的合成 `node:http`。镜像由 `webworker-packer` 按本包定义的布局与 wrapper 契约产出，两者的版本通过清单中的 lowering 版本互相校验，因此「打包」与「运行」是同一契约的两端。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `package.json` | 配置 | 82 | 包名、导出面、`dsh` worker 入口声明与 app-boot/api-gateway/client-connection 依赖 |
| `README.i18n.yaml` | 文档 | 31 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 87 | 英文说明：Worker 内装配顺序、镜像与模块系统、能力边界 |
| `README.zh.md` | 文档 | 87 | 中文说明 |
| `src/client/apply-injections.ts` | 源码 | 2 | [精读] 页面注入清单的转发出口，供 Client 树统一取用 |
| `src/client/client.ts` | 源码 | 584 | [结构] 浏览器侧 Client 引导：取 boot payload、装注入、加载 client bundle 并接上 worker 连接（超 500 行，按引导顺序分段） |
| `src/client/index.ts` | 源码 | 178 | [结构] 浏览器侧入口：导出引导函数与页内装配所需类型 |
| `src/client/source-chooser.ts` | 源码 | 264 | [结构] 查看器的来源选择：把包资产/镜像路径映射成可展示的字节视图 |
| `src/client/text-viewer.ts` | 源码 | 88 | [结构] 页内文本查看控件：只读展示镜像内文本并处理截断 |
| `src/compile/transform.ts` | 源码 | 913 | [精读·读入口与导出面] 一次 acorn 解析同时完成 ESM→CJS 与挂起点上下文注入，按区间切片保行号，导入引用保持活绑定；结构为解析→导入改写→挂起点改写→拼接，并导出 `LOWERING_VERSION` 供清单校验 |
| `src/fixture-manifest.ts` | 源码 | 68 | [精读] 预览夹具清单：把 `vfs-example` 的会话、工作区与 storage 文件描述成命令行与测试共用的命名 fixture |
| `src/image-layout.ts` | 源码 | 65 | [精读] 虚拟根布局（`/dsh`、home、node_modules、config、workspace、tmp）与 wrapper 参数名，是打包器与运行时的共同契约 |
| `src/image-manifest.ts` | 源码 | 106 | [精读] 镜像清单 schema：格式与 lowering 版本、条目表与包资产表，挂载前逐项校验 |
| `src/index.ts` | 源码 | 55 | [精读] 公共导出面：`createWorkerHost`/`startWorkerHost`、存储与镜像类型、tunnel 客户端工厂 |
| `src/module-proxies.ts` | 源码 | 95 | [精读] 供宿主装配读取的 `node:*` 代理表：把模块名映射到内建替身与静态 ESM 命名空间 |
| `src/module-system/module-loader.ts` | 源码 | 473 | [精读] VFS 上的 CommonJS 加载器：`exports` 条件序（无 `node` 条件）、扩展探测、按绝对路径单缓存、wrapper 解包；同时支撑 Node 内部 ESM loader 与 `createRequire` 代理 |
| `src/module-system/posix-path.ts` | 源码 | 170 | [精读] 独立的 POSIX 路径与 file URL 实现（resolve/join/dirname/fileURLToPath），避免把宿主 `node:path` 拖进 worker |
| `src/node/builtin_modules/implemented/abort-error.ts` | 源码 | 14 | [结构] 生成带 `code: 'ABORT_ERR'` 的中止错误，供各内建模块共享 |
| `src/node/builtin_modules/implemented/assert/strict.ts` | 源码 | 28 | [结构] `node:assert/strict` 的最小断言集（ok/equal/strictEqual/deepStrictEqual/throws） |
| `src/node/builtin_modules/implemented/async_hooks.ts` | 源码 | 408 | [结构] `AsyncLocalStorage`/`AsyncResource` 及上下文传播，接本包的 ALS 运行时 |
| `src/node/builtin_modules/implemented/buffer.ts` | 源码 | 64 | [结构] `Buffer` 子集：from/alloc/concat/toString 与编码换算 |
| `src/node/builtin_modules/implemented/child_process.ts` | 源码 | 452 | [结构] `spawn`/`exec`/`execFile`：把子进程请求交给 shell 与宿主进程桥，回传流与退出码 |
| `src/node/builtin_modules/implemented/crypto.ts` | 源码 | 126 | [结构] `randomBytes`/`randomUUID`/hash：桥到平台 WebCrypto |
| `src/node/builtin_modules/implemented/events.ts` | 源码 | 156 | [结构] `EventEmitter` 兼容实现（once/off/listenerCount 等） |
| `src/node/builtin_modules/implemented/fs.ts` | 源码 | 907 | [结构] `node:fs` 的同步与回调面落到活动 VFS：读写/目录/stat/rename/mkdir/chmod/realpath 等（超 500 行，按 API 分组） |
| `src/node/builtin_modules/implemented/fs/promises.ts` | 源码 | 20 | [结构] `node:fs/promises`：把异步面转发到同一 VFS 实现 |
| `src/node/builtin_modules/implemented/fs-watch.ts` | 源码 | 439 | [结构] `fs.watch`/`watchFile`：监听 VFS 变更流并投递事件，供 chokidar 等包工作 |
| `src/node/builtin_modules/implemented/http.ts` | 源码 | 185 | [结构] 假 `node:http`：`createServer().listen()` 立即成功并捕获请求监听器（虚拟端口 3080），交由 tunnel 灌入合成请求 |
| `src/node/builtin_modules/implemented/module.ts` | 源码 | 74 | [结构] `node:module`：`createRequire`、`isBuiltin`、`builtinModules` 与 `Module` 子集 |
| `src/node/builtin_modules/implemented/os.ts` | 源码 | 117 | [结构] `node:os`：平台/架构/内存信息与虚拟 tmpdir、homedir |
| `src/node/builtin_modules/implemented/path.ts` | 源码 | 425 | [结构] `node:path` 完整 POSIX 面（含 parse/format/relative/win32 抛错） |
| `src/node/builtin_modules/implemented/perf_hooks.ts` | 源码 | 27 | [结构] `performance.now` 与最小 mark/measure |
| `src/node/builtin_modules/implemented/stream.ts` | 源码 | 84 | [结构] 最小 `Readable`/`Writable`/`PassThrough`/`Transform`，满足常用管道用法 |
| `src/node/builtin_modules/implemented/stream/promises.ts` | 源码 | 14 | [结构] `node:stream/promises`：`finished`/`pipeline` 的 promise 面 |
| `src/node/builtin_modules/implemented/string_decoder.ts` | 源码 | 12 | [结构] `StringDecoder`：跨块多字节解码转发 |
| `src/node/builtin_modules/implemented/timers/promises.ts` | 源码 | 60 | [结构] `node:timers/promises`：`setTimeout`/`setInterval`/`setImmediate` 的 promise 化 |
| `src/node/builtin_modules/implemented/tty.ts` | 源码 | 19 | [结构] `node:tty`：`isatty` 固定 false 与最小 `WriteStream` |
| `src/node/builtin_modules/implemented/url.ts` | 源码 | 73 | [结构] `node:url`：`URL`/`URLSearchParams` 与 `fileURLToPath`/`pathToFileURL` 桥接 |
| `src/node/builtin_modules/implemented/util.ts` | 源码 | 183 | [结构] `node:util`：`format`/`inspect`/`promisify`/`inherits`/`TextEncoder` 导出等 |
| `src/node/builtin_modules/implemented/util/types.ts` | 源码 | 14 | [结构] `node:util/types`：若干 `is*` 判定 |
| `src/node/builtin_modules/implemented/zlib.ts` | 源码 | 85 | [结构] `node:zlib`：gzip/gunzip/deflate 桥到平台压缩流 |
| `src/node/builtin_modules/mock/dns/promises.ts` | 源码 | 20 | [结构] `node:dns/promises` 桩：解析请求一律报「worker 内无 DNS」 |
| `src/node/builtin_modules/mock/https.ts` | 源码 | 16 | [结构] `node:https` 桩：说明 https 客户端在 worker 内不可用 |
| `src/node/builtin_modules/mock/net.ts` | 源码 | 90 | [结构] `node:net` 桩：保留 socket 形状但拒绝真实连网 |
| `src/node/builtin_modules/mock/repl.ts` | 源码 | 11 | [结构] `node:repl` 桩：创建即报不支持 |
| `src/node/builtin_modules/mock/sqlite.ts` | 源码 | 31 | [结构] `node:sqlite` 桩：构造函数报不支持 |
| `src/node/builtin_modules/mock/vm.ts` | 源码 | 37 | [结构] `node:vm` 桩：脚本编译执行不可用 |
| `src/node/builtin_modules/mock/worker_threads.ts` | 源码 | 50 | [结构] `node:worker_threads` 桩：以主线程语义降级并拒绝真实线程 |
| `src/node/builtins.ts` | 源码 | 146 | [精读] Node 兼容性总表：模块名→静态工厂，`implemented/*` 供真实语义、`mock/*` 供结构化报错，缺失项在解析期响亮失败 |
| `src/node/external_packages/execa.ts` | 源码 | 5 | [结构] `execa` 替身：转发到本包 child_process 实现 |
| `src/node/external_packages/got.ts` | 源码 | 10 | [结构] `got` 替身：用平台 `fetch` 实现最小请求面 |
| `src/node/external_packages/koffi.ts` | 源码 | 155 | [结构] `koffi` FFI 替身：把库加载与符号调用映射到宿主可用能力或明确报错 |
| `src/node/external_packages/libreoffice-kit.ts` | 源码 | 12 | [结构] `@libreoffice/kit` 替身：文档转换能力在 worker 内不可用时给出固定错误 |
| `src/node/external_packages/node-addon-require-builtin.ts` | 源码 | 32 | [结构] `node-addon-require-builtin`：把内建 require 桥到 VFS 的 CJS 加载器，Cordis Loader 的入口导入走这里 |
| `src/node/external_packages/node-addon-system-flock.ts` | 源码 | 20 | [结构] 文件锁替身：单进程 Worker 内降级为内存锁 |
| `src/node/external_packages/node-pty.ts` | 源码 | 19 | [结构] `node-pty` 替身：终端请求改由内置 shell 与子进程桥承接 |
| `src/node/external_packages/pi-ai.ts` | 源码 | 97 | [结构] `pi-ai` 替身：模型调用的浏览器侧实现桥 |
| `src/node/external_packages/pi-coding-agent.ts` | 源码 | 62 | [结构] `pi-coding-agent` 替身：代理运行时所需接口的浏览器侧替换 |
| `src/node/external_packages/replaced-externals.ts` | 源码 | 22 | [结构] 被替换外部包的登记表：统一声明包名与替身映射 |
| `src/node/external_packages/ripgrep.ts` | 源码 | 15 | [结构] `ripgrep` 替身：改走内置 shell 的虚拟可执行 |
| `src/node/external_packages/sharp.ts` | 源码 | 13 | [结构] `sharp` 替身：图像处理不可用时的固定报错 |
| `src/node/external_packages/ws.ts` | 源码 | 62 | [结构] `ws` 替身：WebSocket 桥到页面侧连接 |
| `src/node/globals/crypto.ts` | 源码 | 19 | [结构] 安装 `globalThis.crypto`（WebCrypto 优先级与兜底） |
| `src/node/globals/process.ts` | 源码 | 150 | [结构] `process` 全局 shim：cwd/env/argv/platform/nextTick/exit 与信号占位 |
| `src/node/globals/timers.ts` | 源码 | 68 | [结构] 全局定时器装配：setTimeout/setInterval/queueMicrotask 与清理钩子 |
| `src/node/internal_modules/esm-loader.ts` | 源码 | 84 | [结构] Node 内部 ESM loader 的最小实现：把 `import` 解析委托给 CJS 加载器并合成命名空间 |
| `src/node/internal_modules/module-map.ts` | 源码 | 116 | [结构] 镜像 `node_modules` 的模块名→路径索引（扁平包树、子路径入口） |
| `src/node/internal_modules/package-surfaces.ts` | 源码 | 47 | [结构] 包表面解析：读 `package.json` 的 exports/main/types 并对齐加载器条件序 |
| `src/node/notImplementedFail.ts` | 源码 | 49 | [精读] 生成「该能力在 Worker 内未实现」的抛错函数，统一错误形状与提示 |
| `src/node/process-table.ts` | 源码 | 76 | [结构] 进程表：登记活动子进程、分发信号与回收 |
| `src/package-assets.ts` | 源码 | 90 | [精读] 包资产清单：收集各包 `assets` 目录并在引导期以 `GET /__assets__` 一次性下发 |
| `src/polyfill/async-context/als-runtime.ts` | 源码 | 102 | [精读] 自实现 AsyncLocalStorage 运行时：为变换注入的挂起/恢复提供存储栈与因果链 |
| `src/polyfill/async-context/async-context-hooks.ts` | 源码 | 80 | [结构] `AsyncLocalStorage` 门面：选择原生或本包运行时的实现 |
| `src/shell/ast.ts` | 源码 | 23 | [结构] 简单命令的 AST 节点与运算符定义 |
| `src/shell/expand.ts` | 源码 | 228 | [结构] 词展开：引号、变量、`~`、glob 与命令替换的边界处理 |
| `src/shell/fs-access.ts` | 源码 | 122 | [结构] shell 侧文件访问封装：在 VFS 上按工作区边界读写 |
| `src/shell/interpret.ts` | 源码 | 389 | [结构] 内置 shell 解释器：管道、重定向、`&&` / `\|\|`、内建与虚拟可执行的分派 |
| `src/shell/process/child.ts` | 源码 | 94 | [结构] 子进程句柄：stdin/stdout 流、退出事件与信号发送 |
| `src/shell/process/host.ts` | 源码 | 181 | [结构] 宿主侧子进程桥：把 worker 内的执行请求转给宿主并回传输出 |
| `src/shell/process/landlock.ts` | 源码 | 194 | [结构] Linux Landlock 沙箱策略装配：可用则收紧写入范围，否则降级 |
| `src/shell/process/protocol.ts` | 源码 | 82 | [结构] worker↔宿主 子进程帧协议：启动、输出、退出、信号的消息形状与校验 |
| `src/shell/process/virtual-executables.ts` | 源码 | 63 | [结构] 虚拟可执行登记：把 `rg`/`git` 等命令名映射到宿主或内置程序 |
| `src/shell/process/xdg-open.ts` | 源码 | 46 | [结构] `xdg-open` 替身：阻止在宿主打开图形程序，改为受控提示 |
| `src/shell/programs/builtins.ts` | 源码 | 192 | [结构] 内建程序注册表：命令名→实现与可用性判定 |
| `src/shell/programs/files.ts` | 源码 | 293 | [结构] 文件类程序：cat/ls/cp/mv/rm/mkdir 等基于 VFS 的实现 |
| `src/shell/programs/index.ts` | 源码 | 45 | [结构] 程序查找与模块汇总出口 |
| `src/shell/programs/options.ts` | 源码 | 96 | [结构] 内建程序的短/长选项解析与参数分组 |
| `src/shell/programs/text.ts` | 源码 | 363 | [结构] 文本类程序：grep/head/tail/wc/sort/uniq 等流式实现 |
| `src/shell/types.ts` | 源码 | 146 | [结构] shell 公共类型：解释器上下文、程序签名、流与退出状态 |
| `src/storage/active.ts` | 源码 | 28 | [精读] 进程级挂载槽：`node:fs` 代理只依赖它，不关心由哪个后端挂载 |
| `src/storage/image-gzip.ts` | 源码 | 100 | [精读] 镜像字节外壳：在 fetch 流上校验 gzip 魔数并边下边解压，把纯 ustar 阅读器与编解码隔开 |
| `src/storage/memory.ts` | 源码 | 1189 | [精读·读入口与导出面] 内存 VFS 权威实现：文件树、权限位、句柄与 stat、变更流与持久化 sink、镜像与 overlay 挂载；结构按「节点模型→读写 API→变更订阅→镜像装载」分段 |
| `src/storage/paths.ts` | 源码 | 23 | [精读] 虚拟根常量（`/dsh`、home、node_modules、config、workspace、tmp）的唯一出处 |
| `src/storage/tar.ts` | 源码 | 139 | [精读] 手写 ustar 读取器：512 字节块、name 前缀拆分与子数组视图，挂载时不拷贝 |
| `src/storage/types.ts` | 源码 | 292 | [结构] VFS 接口面：读写选项、stats/dirent/句柄、变更与 sink 类型，错误保留 Node 的 `code` |
| `src/string-decoder-types.ts` | 源码 | 4 | [精读] 给 `node:string_decoder` 补的最小类型声明 |
| `src/transport/frames.ts` | 源码 | 207 | [精读] tunnel 帧编解码与校验：请求、流打开/数据/关闭、响应与错误帧的形状 |
| `src/transport/synthetic-http.ts` | 源码 | 158 | [精读] 为 tunnel 请求合成 `IncomingMessage`/`ServerResponse`：只实现路由真正读取的成员，其余故意缺失 |
| `src/transport/tunnel.ts` | 源码 | 579 | [精读·读入口与导出面] Worker 侧隧道：own boot 与 `/__assets__` 直连、`/api` 特权直达与 401/403 重试、其余请求灌入真实路由表、宿主就绪前排队与 503 收敛；结构为「队列→分派车道→route lane→响应桥」 |
| `src/worker.ts` | 源码 | 90 | [精读] 专用 Worker 入口：收到 init 帧后装平台对象、模块代理与镜像，调用 `startWorkerHost`，把 tunnel 消息接入 |
| `src/worker-host.ts` | 源码 | 487 | [精读] 宿主装配：`createWorkerHost` 同步建队列、`start` 挂镜像/加载器/树，经镜像内 boot glue 与 profile 复现 Node 部署同一套组合与激活审计 |
| `tests/client/apply-injections.spec.ts` | 测试 | 23 | 被测对象：`src/client/apply-injections.ts` 的转发语义 |
| `tests/client/load-bundle.spec.ts` | 测试 | 109 | 被测对象：`src/client/client.ts` 的 client bundle 装载顺序 |
| `tests/client/source-chooser.spec.ts` | 测试 | 158 | 被测对象：`src/client/source-chooser.ts` 的来源映射与降级 |
| `tests/client/text-viewer.spec.ts` | 测试 | 38 | 被测对象：`src/client/text-viewer.ts` 的文本截断与只读渲染 |
| `tests/compile/transform-corpus-check.ts` | fixture | 152 | 供语料用例使用的变换执行与比对辅助 |
| `tests/compile/transform-corpus.spec.ts` | 测试 | 90 | 被测对象：`src/compile/transform.ts` 对真实包源码语料的批量降级一致性 |
| `tests/compile/transform-imports.spec.ts` | 测试 | 314 | 被测对象：`src/compile/transform.ts` 的导入/导出改写与活绑定语义 |
| `tests/compile/transform.spec.ts` | 测试 | 739 | [结构] 被测对象：`src/compile/transform.ts` 的挂起点注入、行号保持与边界语法（超 500 行，按语法类别分组） |
| `tests/fixture-manifest.spec.ts` | 测试 | 48 | 被测对象：`src/fixture-manifest.ts` 的夹具命名与内容一致性 |
| `tests/fixtures/vfs-example/home/sessions/--dsh-workspace--/preview-architecture-review/session.v2.jsonl` | fixture | 178 | 预览夹具会话：架构评审对话的 v2 快照 |
| `tests/fixtures/vfs-example/home/sessions/--dsh-workspace--/preview-architecture-review/session.v3.jsonl` | fixture | 178 | 同上会话的 v3 快照（迁移对照） |
| `tests/fixtures/vfs-example/home/sessions/--dsh-workspace--/preview-follow-up-builder/session.v2.jsonl` | fixture | 8 | 预览夹具会话：短追问会话 v2 |
| `tests/fixtures/vfs-example/home/sessions/--dsh-workspace--/preview-follow-up-builder/session.v3.jsonl` | fixture | 8 | 短追问会话 v3 |
| `tests/fixtures/vfs-example/home/sessions/--dsh-workspace--/preview-showcase/session.v2.jsonl` | fixture | 200 | 预览夹具会话：功能展示对话 v2 |
| `tests/fixtures/vfs-example/home/sessions/--dsh-workspace--/preview-showcase/session.v3.jsonl` | fixture | 200 | 展示会话 v3 |
| `tests/fixtures/vfs-example/home/sessions/--dsh-workspace--/preview-showcase/session.v4.jsonl` | fixture | 204 | 展示会话 v4（最新代） |
| `tests/fixtures/vfs-example/home/sessions/--dsh-workspace--/preview-turn-spacing/session.v4.jsonl` | fixture | 44 | 预览夹具会话：轮次间距用例 |
| `tests/fixtures/vfs-example/home/storages/schedule.json` | fixture | 75 | 预览夹具的定时存储数据 |
| `tests/fixtures/vfs-example/home/storages/session_projcache.json` | fixture | 43 | 预览夹具的会话投影缓存 |
| `tests/fixtures/vfs-example/workspace/.agents/skills/preview-tour/SKILL.md` | fixture | 8 | 预览工作区内的示例技能文件 |
| `tests/fixtures/vfs-example/workspace/data/tasks.json` | fixture | 17 | 预览工作区的示例任务数据 |
| `tests/fixtures/vfs-example/workspace/PREVIEW.md` | fixture | 9 | 预览工作区的说明文件 |
| `tests/fixtures/vfs-example/workspace/src/preview.ts` | fixture | 3 | 预览工作区的示例源码文件 |
| `tests/log-sink.spec.ts` | 测试 | 86 | 被测对象：Worker 内日志汇聚（`console`/`util.debuglog` 转发到宿主日志） |
| `tests/node/assert-strict.spec.ts` | 测试 | 78 | 被测对象：`src/node/builtin_modules/implemented/assert/strict.ts` 的断言与错误信息 |
| `tests/node/buffer.spec.ts` | 测试 | 64 | 被测对象：`src/node/builtin_modules/implemented/buffer.ts` 的编码与拼接 |
| `tests/node/builtins-table.spec.ts` | 测试 | 160 | 被测对象：`src/node/builtins.ts` 表项完整性、`implemented`/`mock` 分类与缺失即失败 |
| `tests/node/child-process.spec.ts` | 测试 | 347 | 被测对象：`src/node/builtin_modules/implemented/child_process.ts` 与 shell 进程桥的 spawn/exec 语义 |
| `tests/node/chokidar.spec.ts` | 测试 | 228 | 被测对象：`fs-watch` 实现支撑真实 `chokidar` 监听的行为 |
| `tests/node/crypto-globals.spec.ts` | 测试 | 36 | 被测对象：`src/node/globals/crypto.ts` 的 `globalThis.crypto` 装配 |
| `tests/node/events.spec.ts` | 测试 | 137 | 被测对象：`src/node/builtin_modules/implemented/events.ts` 的监听器语义 |
| `tests/node/fs.spec.ts` | 测试 | 242 | 被测对象：`src/node/builtin_modules/implemented/fs.ts` 的同步/回调读写与错误 `code` |
| `tests/node/fs-watch-context.spec.ts` | 测试 | 74 | 被测对象：`fs-watch` 在异步上下文中的回调归属 |
| `tests/node/fs-watch-stream.spec.ts` | 测试 | 812 | [结构] 被测对象：`fs-watch` 的事件流、过滤与去抖（超 500 行，按事件类型分组） |
| `tests/node/http-server.spec.ts` | 测试 | 87 | 被测对象：`src/node/builtin_modules/implemented/http.ts` 的假 Server 与请求监听器捕获 |
| `tests/node/node-stubs.spec.ts` | 测试 | 224 | 被测对象：`src/node/builtin_modules/mock/*` 各桩的报错形状与降级语义 |
| `tests/node/path-diff.spec.ts` | 测试 | 83 | 被测对象：`src/node/builtin_modules/implemented/path.ts` 与真实 `node:path` 的逐项比对 |
| `tests/node/process-shim.spec.ts` | 测试 | 70 | 被测对象：`src/node/globals/process.ts` 与 `src/node/process-table.ts` 的全局与信号 |
| `tests/node/require-builtin.spec.ts` | 测试 | 157 | 被测对象：`src/node/external_packages/node-addon-require-builtin.ts` 的 require 桥接 |
| `tests/node/sandbox-stack.spec.ts` | 测试 | 107 | 被测对象：`src/shell/process/landlock.ts` 与沙箱栈的权限拒绝路径 |
| `tests/node/shim-diff.spec.ts` | 测试 |  | 被测对象：各 shim 与真实 Node 行为的差异清单（空文件，见异常说明） |
| `tests/node/string-decoder.spec.ts` | 测试 | 34 | 被测对象：`src/node/builtin_modules/implemented/string_decoder.ts` 的跨块解码 |
| `tests/node/timers-promises.spec.ts` | 测试 | 55 | 被测对象：`src/node/builtin_modules/implemented/timers/promises.ts` 的取消与间隔 |
| `tests/package-assets.spec.ts` | 测试 | 77 | 被测对象：`src/package-assets.ts` 的资产收集与路径映射 |
| `tests/polyfill/als.spec.ts` | 测试 | 82 | 被测对象：`src/polyfill/async-context/async-context-hooks.ts` 的门面行为 |
| `tests/polyfill/als-runtime.spec.ts` | 测试 | 393 | 被测对象：`src/polyfill/async-context/als-runtime.ts` 的存储栈与因果链 |
| `tests/polyfill/als-shim.spec.ts` | 测试 | 390 | 被测对象：`async_hooks` 替身与 ALS 运行时的一致性 |
| `tests/polyfill/root-context.spec.ts` | 测试 | 88 | 被测对象：根上下文在 Worker 引导期的初始化与继承 |
| `tests/shell/injected-run.spec.ts` | 测试 | 165 | 被测对象：`src/shell/interpret.ts` 在注入上下文下的执行路径 |
| `tests/shell/shell-process.spec.ts` | 测试 | 198 | 被测对象：`src/shell/process/*` 的宿主桥与协议帧 |
| `tests/shell/shell.spec.ts` | 测试 | 225 | 被测对象：`src/shell/interpret.ts` 与 `src/shell/expand.ts` 的管道、重定向与展开 |
| `tests/shell/xdg-open.spec.ts` | 测试 | 46 | 被测对象：`src/shell/process/xdg-open.ts` 的阻断与提示 |
| `tests/storage/image-gzip.spec.ts` | 测试 | 86 | 被测对象：`src/storage/image-gzip.ts` 的魔数校验与流式解压 |
| `tests/storage/lazy-archive.spec.ts` | 测试 | 194 | 被测对象：`src/storage/memory.ts` 的惰性分块归档按需装载 |
| `tests/storage/memory-vfs.spec.ts` | 测试 | 360 | 被测对象：`src/storage/memory.ts` 的读写、权限位、变更流与挂载 |
| `tests/storage/tar.spec.ts` | 测试 | 58 | 被测对象：`src/storage/tar.ts` 的 ustar 解析与非法输入 |
| `tests/transport/frames.spec.ts` | 测试 | 53 | 被测对象：`src/transport/frames.ts` 的帧编解码与校验 |
| `tests/transport/tunnel-client.spec.ts` | 测试 | 367 | 被测对象：`src/transport/tunnel.ts` 的宿主客户端请求车道与重试 |
| `tests/transport/tunnel-server.spec.ts` | 测试 | 322 | 被测对象：`src/transport/tunnel.ts` 的 worker 侧分派、排队与 503 |
| `tests/vfs-example-fixture.spec.ts` | 测试 | 282 | 被测对象：`tests/vfs-example-fixture.ts` 夹具与 `src/fixture-manifest.ts` 的一致性 |
| `tests/vfs-example-fixture.ts` | fixture | 757 | 预览夹具的构造器：生成两代会话、storage 与工作区文件的完整树（超 500 行，按资源类别分段） |
| `tsconfig.json` | 配置 | 48 | TypeScript 编译配置与 worker/browser 目标 |
| `tsdown.config.ts` | 配置 | 96 | tsdown 打包：worker 入口、客户端入口与内建模块的外部化规则 |

### experimental/worktree — 可保留 Git 工作树服务

包定位：向 Cordis 注入 `ctx.worktrees`，管理「从本地提交/分支/标签切出新分支与检出，并让当前会话切到该目录」的服务端实现，同时负责归档时的回收。它是服务而非工具：`tool-worktree` 只是它的模型入口，`tool-session-query` 则是另一条无关的会话检索线。实现上按职责拆成命令执行（在调用会话的沙箱文件策略下跑受限 git）、工作树身份校验与安全移除、归档触发的回收、会话投影记录（哪些检出是本会话创建的）与名称生成；创建与恢复都写会话日志，因此可跨进程重建。

| 文件 | 类型 | 行数 | 职责 |
|---|---|---|---|
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6 | 8 个语种的插件名称与描述词条 |
| `package.json` | 配置 | 82 | 包名、导出面与 fs/sandbox/subprocess/session 依赖声明 |
| `README.i18n.yaml` | 文档 | 37 | 多语言 README 的段落映射与翻译状态 |
| `README.md` | 文档 | 102 | 英文说明：新建分支与检出、沙箱约束、离开后保留分支与文件 |
| `README.zh.md` | 文档 | 102 | 中文说明 |
| `src/archive.ts` | 源码 | 253 | [精读] 会话归档触发的回收：判断检出无引用且干净时移除，状态变化发 `worktree/cleanup` 事件（admission 与 settlement 各一次） |
| `src/directory.ts` | 源码 | 25 | [精读] 沙箱内独占分配检出目录的子程序源码：创建根目录与自忽略 `.gitignore`，再建目标目录 |
| `src/index.ts` | 源码 | 388 | [精读] `WorktreeService`：配置（目录池、名称前缀、git/node 命令、超时/宽限期/输出上限）、`create`/`restore`/`cleanupOf` 三个操作、路径穿越校验、创建后把会话工作目录切到新检出并写投影记录 |
| `src/name.ts` | 源码 | 21 | [精读] 生成可回溯到会话的检出名：前缀 + 会话 id 中 UUID 前 8 位 + 4 位随机十六进制 |
| `src/process.ts` | 源码 | 164 | [精读] 受限命令执行：清空继承的 `GIT_*` 选择器、无 shell 执行 argv、有界收集 stdout 或流式扫描 NUL 分隔字段、超时与终止宽限 |
| `src/projection.ts` | 源码 | 70 | [精读] `worktree` 投影定义：把 `plugin:worktree/created` 记录折叠成会话创建过的检出列表 |
| `src/removal.ts` | 源码 | 142 | [精读] 移除前的身份校验：解析检出与分支注册、比对规范路径、确认无未提交改动后才移除 |
| `src/types.ts` | 源码 | 68 | [结构] 公共类型：创建/恢复请求、结果、清理状态与投影条目 |
| `tests/archive.spec.ts` | 测试 | 489 | 被测对象：`src/archive.ts` 的归档回收判定、事件与时序 |
| `tests/checkout-safety.spec.ts` | 测试 | 248 | 被测对象：`src/removal.ts` 与 `src/index.ts` 在脏工作树、缺失命令等情形下的安全拒绝 |
| `tests/harness.ts` | fixture | 115 | 临时 git 仓库、假沙箱与测试 Agent 的共用夹具 |
| `tests/process.spec.ts` | 测试 | 60 | 被测对象：`src/process.ts` 的流式扫描、退出码与超时处理 |
| `tests/removal.spec.ts` | 测试 | 180 | 被测对象：`src/removal.ts` 的身份校验与保守移除 |
| `tests/sandbox.spec.ts` | 测试 | 89 | 被测对象：`src/process.ts` 与本地沙箱结合时的权限拒绝路径 |
| `tests/settings.spec.ts` | 测试 | 36 | 被测对象：`src/index.ts` 的 `retainOnArchive` 可热改配置接线 |
| `tests/worktree.spec.ts` | 测试 | 595 | [结构] 被测对象：`src/index.ts` 的创建、恢复、投影记录与工作目录切换主流程（超 500 行，按场景分组浏览） |
| `tsconfig.json` | 配置 | 60 | TypeScript 编译配置与测试包含范围 |

## 七、覆盖与核查

### 7.1 覆盖率

| 分组 | 清单文件数 | 表格数据行 | 差额去向 |
|---|---:|---:|---|
| packages/extensions | 128 | 88 | locale 八语合并、README 中英合并 |
| packages/feedback | 38 | 21 | 同上 |
| packages/guard | 33 | 16 | 同上 |
| packages/fs | 169 | 118 | 同上，另有部分包无 locale |
| packages/goal | 77 | 44 | 同上 |
| packages/experimental | 2,504 | 2,025 | locale 八语合并（63 包）、README 中英合并、`docs/DETAIL*` 多语合并 |
| **合计** | **2,949** | **2,312** | 差 637 行全部来自聚合行 |

清单 2,949 行与 `00-index.md` 的块统计一致（experimental 2,504 + extensions 128 + feedback 38 + guard 33 + fs 169 + goal 77）。表内 2,312 行覆盖全部 2,949 个文件，无遗漏；每一行的「行数」取自 TSV 的 `行数` 列，逐行比对未发现偏差（二进制行留空，与 TSV 一致）。

### 7.2 标注分布

| 标注 | 行数 | 说明 |
|---|---:|---|
| `[精读]` | 266 | 打开文件读过实现正文 |
| `[精读·读入口与导出面]` | 40 | 均 >500 行，读入口 + 导出面 + 关键分支，不保证逐行 |
| `[结构]` | 1,241 | 靠文件名、目录、README、导出符号、引用关系判定 |
| 未标注 | 765 | 测试 649 行 + 快照/文档/配置/资源/fixture 116 行 |
| **合计** | **2,312** | 带标注行占 66.9% |

未标注的 765 行有两类：一是测试行，职责统一写成「被测对象：`src/xxx.ts` 的……」，判定依据是文件名与导入关系，标 `[精读]` 反而失真；二是快照、`tsconfig.json`、`tsdown.config.ts`、`icon.svg`、locale 聚合行这类由路径即可唯一确定用途的条目。源码类文件（`源码` / `客户端源码`）则要求逐行标注，表中没有例外。

全文显式写「待确认」的只有 1 处；拿不准的判断不是靠这个词，而是集中在 7.3 的复查清单里，按「需要人工看什么」列出。

### 7.3 需要人工复核的文件

**超大文件（>500 行）**——以下是本块内最需要当心的十个，均已采用「读入口 / 读结构」而非通读：

| 文件 | 行数 | 性质 |
|---|---:|---|
| `experimental/ptc-runtime-python/tests/runtime.spec.ts` | 5,862 | 超大用例，覆盖 Python 运行时全协议 |
| `experimental/liveshare/tests/viewer-fixture.client.ts` | 4,474 | 客户端测试夹具，构造 4,000+ 行 viewer 场景数据 |
| `experimental/ptc-runtime-python/py/bootstrap.py` | 2,575 | Python 侧进程引导，与 `src/protocol.ts` 互为镜像 |
| `experimental/ptc-runtime-python/src/index.ts` | 2,378 | Host 侧运行时主体（启动 / 帧编解码 / 工具调用 / 生命周期） |
| `experimental/liveshare/src/client/locales.ts` | 1,930 | 单文件承载 8 语文案，不是生成物 |
| `experimental/cua*/src/protocol.schema.json` | 1,474 / 1,396 | 生成物，改动应回到生成脚本 |
| `experimental/cua-macos/tests/provider-lifecycle.spec.ts` | 1,301 | 提供方生命周期用例 |
| `experimental/inspector/tests/cordis-tree.host.spec.ts` | 1,204 | Cordis 树投影用例 |
| `experimental/webworker-runtime/src/storage/memory.ts` | 1,189 | 内存 VFS 实现 |
| `experimental/cua/tests/api.spec.ts` | 1,047 | 平台无关 API 面用例 |

其余 >500 行的源码还有：`liveshare` 的 `fork-enforcement.ts`(983)、`tunnel-supervision.ts`(959)、`owner-share-operations.ts`(871)、`viewer-dispatch.ts`(809)、`source-access.ts`(686)、`share-host.ts`(657)、`viewer-fork.ts`(590)、`viewer-lifecycle.ts`(576)；`webworker-runtime` 的 `compile/transform.ts`(913)、`node/builtin_modules/implemented/fs.ts`(907)、`transport/tunnel.ts`(579)、`client/client.ts`(584)；`webworker-packer/src/pack.ts`(783)；`forge/src/index.ts`(690)；`forge-github/src/graphql.ts`(685)；`cua-macos/native/Sources/CuaNative/AXAccess.swift`(739)、`AXWorker.swift`(538)。

**空文件**：`experimental/webworker-runtime/tests/node/shim-diff.spec.ts` 行数为空（TSV 亦为空），是空文件还是占位残留待确认。

**疑似废弃 / 一次性产物**：
- `experimental/cua-windows/tests/desktop-smoke.mjs`（285 行）文件头自称仍是「旧窗口 RPC 冒烟」，需迁移到 `listApps` / `getApp` facade 后才能重跑。
- `experimental/cua-windows/native/capture-probe/`（7 个文件）在注释里标为一次性对照实验，是否随包发布需确认。

**疑似重复实现 / 职责重叠**：
- `liveshare` 的 `src/host/share-operations.ts`（128 行，只有接口）与 `src/host/owner-share-operations.ts`（871 行，实现）名称近乎重复，实为契约与实现分离——不是冗余，但检索时极易误判。
- `session-title-all-prompts-llm` 与既有的 `session-title-llm` 是同一接口的两套提供方，属刻意替代而非重复。
- `forge-session` 的 `src/commands.ts`（解析 shell 输出）与 `src/references.ts`（解析 `gh` 引号结构）职责相邻，是否可合并待确认。

**命名 / 惯例不合规**：
- `cua/src/locales.ts` 与 `cua/src/mouse-control-locales.ts` 命名不成体系，前者是通用文案、后者只覆盖鼠标控制。
- `liveshare/src/client/` 混用 PascalCase 组件（`ShareDialog.tsx`、`ManageSharesDialog.tsx`）与 kebab-case 模块（`share-options.ts`），目录内无统一约定。
- `session-inspector` 的测试统一用 `.client.spec.tsx`，与本块其余包的 `.spec.ts` 惯例不同。
- `tool-ralph/locale/en.json` 比其他 7 个语言文件少 1 行（表中写作 `5–6`）。

**发布与本地化缺口**：
- `cua-bundle/docs` 只有 en / zh 两份 DETAIL，而 `forge-bundle/docs` 有 8 种语言，是否漏翻待确认。
- `plugin-market-bundle`、`ralph-bundle`、`session-search`、`session-titles-bundle`、`voice-input-bundle`、`terminal-bundle` 等纯 bundle 包没有测试，开关语义（patch 里的行 id 与 `disabled`）缺少回归保护。
- `ptc-runtime-python/py/` 没有任何 Python 侧测试或打包声明，靠 `src/launch.ts` 以 stdin 注入，版本约束只能人工确认。

**二进制资源**（表中行数留空）：`cua-macos/native/DSHComputerUse.icns`、`skill-badge/assets/dsh-badge.png`。另有若干 78–280 KB 的单行内联 SVG（`plugin-recommendations`、`inspector-profile` 等包的 `docs/preview*.svg`），是文本但体积接近位图，按资源一行带过。

**隐性耦合**：`session-inspector` 完全依赖既有 DOM 属性（`mainChatRoot`、`findChatTargets`）做区块定位与选取，属性一改名就静默失效，属高风险点。

### 7.4 阅读建议

- 想看「插件是怎么写出来的」：先读 `experimental/action-cards`（最小功能包骨架）与 `personalized-recommendations`（最小 bundle 骨架），两者加起来不到 500 行。
- 想看「跨进程 / 跨 realm 的大件」：`inspector`（Host + Client + Worker 三进程）、`liveshare`（owner 宿主 + Relay + viewer）、`webworker-runtime`（把整棵 harness 塞进 Worker）。
- 想看「原生桥接」：`cua` → `cua-macos` / `cua-windows`（Swift / C# 与 TS 的边界）。
- 想避开坑：7.3 列出的超大文件与隐性耦合项，改动前先确认测试是否真的覆盖到了你要动的那条路径。

