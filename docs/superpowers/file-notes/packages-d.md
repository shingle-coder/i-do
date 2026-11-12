# packages-d：宿主、交互与运行时能力（`packages-06`）

> 对应清单：`docs/superpowers/inventory/packages-06.tsv`（2,795 个文件，26 个二级组） 覆盖范围：`packages/host`、`identity`、`interaction`、`jobs`、`llm`、`lsp`、`mcp`、`plan`、`preset`、`ptc-runtime`、`sandbox`、`schedule`、`sdk`、`session`、`session-query`、`settings`、`shell`、`skill`、`spill`、`ssh`、`storage`、`subagent`、`subprocess`、`team`、`telemetry`、`terminal` 相邻分册：[packages-a](./packages-a.md)（acp / api / boot 等）、[packages-b](./packages-b.md)（client）、[packages-c](./packages-c.md)（compaction / core / extensions 等）、[packages-e](./packages-e-misc.md)（util / web / workflow 等） 定位：架构层面的模块分析见 [`docs/superpowers/modules/`](../modules/)，本文只做**文件级索引**，不重复架构结论。

---

## 一、阅读须知

### 1.1 标注规则（诚实原则）

每个文件标一种来源，写在该包表格后的小节或表格的「类型」列中：

| 标注 | 含义 |
| --- | --- |
| `精读` | 真打开读过实现（函数体、分支、错误路径），本文中仅限少量关键文件 |
| `结构判断` | 依据文件头注释、导出符号、命名、目录约定、引用关系判定；**未逐行读实现** |
| `待确认` | 上述两类证据都不足以判断职责，明确留白 |

本分册约 2,795 个文件，不可能平均用力。实际做法是：先用清单聚合，再**批量抽取每个 `.ts` 文件头部 docblock 的首句**作为职责依据（属 `结构判断`），只对超过 500 行的源码和数据格式核心做 `精读`。凡「结构判断」列出的职责，均应理解为**据文件自述与命名推断**，不代表已核对实现细节。

### 1.2 类型定义

| 类型 | 判定 |
| --- | --- |
| 源码 | `src/` 下的 `.ts` / `.tsx` / `.mjs` |
| 测试 | `tests/` 下的 `*.spec.ts`、`*.spec.tsx`、`*.e2e.ts`，以及 `tests/fixtures/` 下的夹具 |
| 配置 | `package.json`、`tsconfig.json`、`tsdown.config.ts`、`vitest.config.ts` |
| 文档 | `README.md`、`README.zh.md`、`README.i18n.yaml`、包内 `docs/` |
| 多语言 | `locale/*.json`（8 种语言，单文件 5–6 行，只含插件名与描述两条） |
| 脚本 / 资源 / 夹具 | `.ps1`、`.sh`、图片、表格、SVG、`assets/`、`tests/fixtures/` |

### 1.3 本块的结构性观察

- 这是一个**「一包一目录、五个固定根文件」**的 monorepo 切片：绝大多数包都是 `package.json` + `README.md` + `README.zh.md` + `README.i18n.yaml` + `tsconfig.json`（有 UI 文案的再加 `locale/` 8 个 JSON），因此本块 1,025 个 `.json` 里有 800 余个是 `locale` 与配置。
- 包名几乎全部以 `dsh-<组>-<包>` 命名，且**组名即能力域**：`llm`/`session`/`subagent`/`shell`/`sandbox` 各自成体系，每个能力域都采用「抽象 seam 包 + 若干实现包 + 面向模型的 tool 包」三件套。
- 源码文件普遍以 `/** ... */` 文件头 docblock 开头，正文用英文描述契约与失败语义；这是本块最可靠的职责来源。
- 测试体量显著大于实现：`subagent`、`session-persistence-jsonl`、`subprocess-local`、`llm-deepseek` 等包的测试行数是源码的数倍，超大用例（>2,000 行）集中出现在这些包。

---

## 二、`packages/host` — Web 宿主侧能力（164 个文件）

这一组是 **Host（Node 进程）对外暴露的 Web 能力**：路由注册骨架、SPA 静态服务、目录选择、外部应用打开、插件清单投影、产品遥测。它们都不直接面向模型，而是服务于 `apps/web` / `apps/desktop` 的 Host 半边。

### 2.1 `host` 组根文件（3 个）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `packages/host/README.md` | 文档 | 59 | 该组英文总览：Host 侧能力包清单与装配关系 | 结构判断 |
| `packages/host/README.zh.md` | 文档 | 59 | 上一文件的中文对照版 | 结构判断 |
| `packages/host/README.i18n.yaml` | 文档 | 25 | 中英 README 的段落配对索引，供翻译校验脚本使用 | 结构判断 |

### 2.2 `host/directory-picker` — 目录选择 seam（8 个文件）

目录选择的抽象契约：Web GUI 的 Host 如何请操作者挑一个工作区目录，而不绑定具体实现。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 115 | 定义 `ctx.directoryPicker` 服务：注册/注销提供方、把「请选一个目录」的调用转给当前挂载的后端 | 结构判断 |
| `src/types.ts` | 源码 | 39 | 客户端安全类型面：一级浏览项、选择结果、错误形状 | 结构判断 |
| `tests/seam.spec.ts` | 测试 | 35 | 覆盖 seam 自身的行为：注册身份与类型化失败 | 结构判断 |
| `package.json` | 配置 | 43 | 包名 `@deepseek-ai/dsh-host-directory-picker` 与导出声明 | 结构判断 |
| `tsconfig.json` | 配置 | 18 | 继承仓库基础 tsconfig | 结构判断 |
| `README.md` / `README.zh.md` | 文档 | 111 / 111 | 英文 / 中文包说明（seam 契约与装配方式） | 结构判断 |
| `README.i18n.yaml` | 文档 | 58 | 中英段落配对索引 | 结构判断 |

### 2.3 `host/directory-picker-auto` — 自适应后端选择（18 个文件）

启动时探测宿主环境（是否有原生选择器二进制、是否可浏览文件系统），再挂载 `native` 或 `browse` 后端。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 112 | 自适应插件入口：boot 时解析后端并注册到 `ctx.directoryPicker` | 结构判断 |
| `src/probe.ts` | 源码 | 44 | 探测原生后端的 Linux 选择器二进制是否在 PATH 上（一次性 boot 探测） | 结构判断 |
| `src/resolve.ts` | 源码 | 61 | 把探测结果映射为后端选择决策，产出注入配置 | 结构判断 |
| `tests/loader-composition.spec.ts` | 测试 | 327 | 用测试专用 `cordis.yml` 走真实 Loader 组合，验证自适应装配 | 结构判断 |
| `tests/resolve.spec.ts` | 测试 | 98 | 解析逻辑单测（含临时目录与伪造可执行文件） | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件显示名与描述的 8 语翻译 | 结构判断 |
| `package.json` | 配置 | 59 | 包声明与对 native/browse 后端的依赖 | 结构判断 |
| `tsconfig.json` | 配置 | 30 | TypeScript 工程配置 | 结构判断 |
| `README.md` / `README.zh.md` | 文档 | 122 / 122 | 英文 / 中文说明 | 结构判断 |
| `README.i18n.yaml` | 文档 | 58 | 中英段落配对索引 | 结构判断 |

### 2.4 `host/directory-picker-browse` — 应用内浏览后端（16 个文件）

不调用系统对话框，直接在 Web 界面里逐层浏览 Host 文件系统，并提供新建目录等原语。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 324 | 注册 `ctx.directoryPicker` 的浏览式实现：列举、进入、新建目录、拒绝穿越路径 | 结构判断 |
| `tests/service.spec.ts` | 测试 | 231 | 在真实临时目录树上验证浏览后端行为 | 结构判断 |
| `tsdown.config.ts` | 配置 | 15 | tsdown 打包配置 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 44 / 24 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 121 / 121 / 61 | 中英说明与配对索引 | 结构判断 |

### 2.5 `host/directory-picker-native` — 系统原生目录对话框（27 个文件）

调用操作系统自带的选择器：Windows 走 COM `IFileOpenDialog`（koffi 绑定 + 独立子进程），macOS 走 AppleScript，Linux 走 zenity/kdialog 一类二进制。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 37 | 原生后端插件入口：把 `ctx.directoryPicker` 注册到原生选择器能力 | 结构判断 |
| `src/native-picker.ts` | 源码 | 143 | 跨平台单目录选择器：按平台选择调用路径，统一成 Promise | 结构判断 |
| `src/win32-dialog.ts` | 源码 | 159 | Win32 对话框的主线程驱动器：拉起子进程并通过消息协议等待结果 | 结构判断 |
| `src/win32-dialog-bindings.ts` | 源码 | 206 | koffi 绑定：COM vtable 调用（`IFileOpenDialog`）的 FFI 声明与封装 | 结构判断 |
| `src/win32-dialog-host.ts` | 源码 | 34 | 驱动器的真实进程半边：spawn 对话框子进程、转发消息 | 结构判断 |
| `src/win32-dialog-logic.ts` | 源码 | 147 | 纯逻辑部分：COM 调用时序、取消/失败到结果的映射 | 结构判断 |
| `src/win32-dialog-worker.ts` | 源码 | 55 | 子进程入口：阻塞本进程直到对话框关闭 | 结构判断 |
| `tests/win32-dialog-bindings.spec.ts` | 测试 | 431 | 用 mock 的 `koffi` 验证 FFI 绑定层 | 结构判断 |
| `tests/native-picker.spec.ts` | 测试 | 295 | 原生层级选择与 `execFile` 适配器（含 macOS Edit 菜单路径） | 结构判断 |
| `tests/win32-dialog.spec.ts` | 测试 | 189 | 子进程消息协议到 Promise 的映射 | 结构判断 |
| `tests/win32-dialog-logic.spec.ts` | 测试 | 106 | 用假绑定验证 COM 时序与结果映射 | 结构判断 |
| `tests/built-worker.e2e.ts` | 测试 | 33 | 构建产物守卫：用裸 `node` 跑 `lib/worker.cjs` | 结构判断 |
| `tests/service.spec.ts` | 测试 | 21 | seam 侧的注册/能力登记行为 | 结构判断 |
| `tsdown.config.ts` | 配置 | 31 | 打包配置（worker 单独产物） | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 51 / 21 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 112 / 112 / 55 | 中英说明与配对索引 | 结构判断 |

### 2.6 `host/frontend-static` — SPA 静态资源服务（15 个文件）

占据 webserver 的**唯一 fallback 席位**，把打包好的前端 dist 目录按显式 index 与静态资源规则出服务。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 167 | 在 `ctx.webServer` 注册 fallback：解析 index 条目、拒绝目录穿越、未命中返回 404 | 结构判断 |
| `tests/frontend-static.spec.ts` | 测试 | 305 | 真实 Loader 组合下的静态服务覆盖 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 49 / 27 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 119 / 119 / 55 | 中英说明与配对索引 | 结构判断 |

### 2.7 `host/open-in-app` — 「用外部应用打开」（24 个文件）

Host 半边：把「已安装应用清单」「应用图标」「启动端点」做成三条 webServer 路由，供浏览器的分体按钮调用。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 311 | 三条路由的装配与安全闸门：先向 `connection` 服务要拒绝结论，再校验请求体（JSON、64 KiB 上限、字符串字段、已解析的 catalog id、绝对路径） | 结构判断 |
| `src/catalog.ts` | 源码 | 393 | 编译期应用目录表：可启动应用的定位器与平台条件 | 结构判断 |
| `src/resolver.ts` | 源码 | 760 | 平台解析器：把目录条目的定位器解析成真实可执行文件并记住解析结果，`ENOENT` 时失效重解析一次 | 结构判断 |
| `src/icons.ts` | 源码 | 161 | 按平台策略从应用包中提取图标 | 结构判断 |
| `src/shared.ts` | 源码 | 37 | 路由路径与线格式载荷，Host 与客户端逐字共用 | 结构判断 |
| `src/internals.ts` | 源码 | 6 | 测试缝：宿主事实与进程适配器的可替换点（生产为空实现） | 结构判断 |
| `tests/resolver.spec.ts` | 测试 | 686 | 解析器在确定性命令执行器与进程内环境下的行为 | 结构判断 |
| `tests/host-routes.spec.ts` | 测试 | 492 | 真实 WebServer 上的三条路由（含鉴权拒绝） | 结构判断 |
| `tests/icons.spec.ts` | 测试 | 284 | 各平台图标提取 | 结构判断 |
| `tests/launch-detached.spec.ts` | 测试 | 56 | 分离启动的结算与观察窗口 | 结构判断 |
| `tsdown.config.ts` | 配置 | 19 | 打包配置 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 57 / 33 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 125 / 125 / 52 | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/resolver.ts`（760 行）按「条目定义 → 平台可用性判定 → 定位器展开 → 可执行文件存在性校验 → 结果缓存与失效」分层；`src/catalog.ts`（393 行）是一张静态表，改动集中在数据项而非控制流。

### 2.8 `host/plugin-inventory` — 插件清单只读投影（16 个文件）

把 Cordis Loader 当前已加载的插件条目投影成只读 Remote 数据，供前端插件面板展示。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 121 | 注册只读投影服务：从 Loader 读取插件条目并整形为线格式 | 结构判断 |
| `src/types.ts` | 源码 | 77 | 投影结果的品牌化类型定义 | 结构判断 |
| `tests/inventory.spec.ts` | 测试 | 254 | 清单投影的内容与边界覆盖 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 76 / 33 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 116 / 116 / 55 | 中英说明与配对索引 | 结构判断 |

### 2.9 `host/product-telemetry-otel` — 产品事件遥测（20 个文件）

把显式的产品使用事件交给共享的 Cordis OTel 服务，以 HTTP 日志形式导出。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 121 | 产品分析策略适配器：把具名产品事件翻译成 OTel 日志记录 | 结构判断 |
| `tests/telemetry.spec.ts` | 测试 | 233 | 事件到 OTLP 请求的映射 | 结构判断 |
| `tests/loader-composition.e2e.ts` | 测试 | 62 | 经 Loader 组合对回环收集器的端到端校验 | 结构判断 |
| `tests/fixtures/driver.ts` | 测试 | 43 | 回环收集器 + 一条合成事件的组合驱动 | 结构判断 |
| `tests/fixtures/shutdown.ts` | 测试 | 12 | 校验 teardown 不阻塞 Host 自然退出 | 结构判断 |
| `tests/fixtures/telemetry.patch.yml` | 夹具 | 21 | 组合补丁：注入遥测配置 | 结构判断 |
| `tests/fixtures/shutdown.patch.yml` | 夹具 | 24 | 组合补丁：关闭场景 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 51 / 24 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 109 / 109 / 37 | 中英说明与配对索引 | 结构判断 |

### 2.10 `host/webserver` — HTTP/HTTPS 路由骨架（17 个文件）

本组的地基：提供 `ctx.webServer`，负责 HTTP（可选 HTTPS）监听、路由注册、gzip、按 Peer 注入 index、以及一个 fallback 席位。它自己不出文件。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 743 | `WebServer` 服务：路由表（exact/prefix）、resource 与 handler 两种响应所有权、TLS、gzip、`webserver/index-inject` 事件 | 结构判断 |
| `src/injections.ts` | 源码 | 119 | index 注入行的类型与渲染：把插件贡献的行按占位位置拼进 HTML | 结构判断 |
| `tests/webserver.spec.ts` | 测试 | 1080 | 真实 Loader 组合下的路由、TLS、gzip、注入与 fallback 覆盖 | 结构判断 |
| `tests/tls-fixture.ts` | 测试 | 70 | 一次性 localhost TLS 证书材料夹具 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 50 / 21 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 146 / 146 / 61 | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts` 可分成四段——配置 schema 与类型、路由注册与匹配、请求预处理（Peer 识别、gzip 协商、注入）、响应分流（handler / resource / fallback）与生命周期（listen/close）。`src/injections.ts` 只负责占位符替换，不参与路由。

---

## 三、`packages/identity` — 身份标识（10 个文件）

只装一件事：为每个 harness home 生成并持久化一个匿名用户 id，供遥测与反馈共用。没有用户账号体系，id 与机器/home 绑定。

### 3.1 组根文件（3 个）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `packages/identity/README.md` / `README.zh.md` | 文档 | 37 / 37 | 该组英文 / 中文总览 | 结构判断 |
| `packages/identity/README.i18n.yaml` | 文档 | 25 | 中英段落配对索引 | 结构判断 |

### 3.2 `identity/anonymous-user-id`（7 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 100 | 首次使用时生成匿名 id 并写入 harness home，之后每次读出同一值 | 结构判断 |
| `tests/anonymous-user-id.spec.ts` | 测试 | 105 | 生成、复用、损坏文件与并发的落盘行为 | 结构判断 |
| `package.json` | 配置 | 42 | 包声明与导出 | 结构判断 |
| `tsconfig.json` | 配置 | 18 | TS 工程配置 | 结构判断 |
| `README.md` / `README.zh.md` | 文档 | 138 / 138 | 英文 / 中文说明 | 结构判断 |
| `README.i18n.yaml` | 文档 | 61 | 中英段落配对索引 | 结构判断 |

---

## 四、`packages/interaction` — 人机交互能力（95 个文件）

这一组处理「人」这一侧的交互原语：用户命令注册表、权限预设、模型向用户提问、审批流。共同特征是 —— 都维护**一份持久化投影**（session projection），让 UI 重连后仍能恢复未决问题/待批请求。

### 4.1 组根文件（3 个）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `packages/interaction/README.md` / `README.zh.md` | 文档 | 56 / 56 | 该组英文 / 中文总览 | 结构判断 |
| `packages/interaction/README.i18n.yaml` | 文档 | 25 | 中英段落配对索引 | 结构判断 |

### 4.2 `interaction/commands` — 人类命令注册表（19 个文件）

插件可以注册斜杠命令，前端各适配器共用同一张表；命令定义与「一次执行」各有独立 id 以便配对生命周期。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 533 | 命令注册表：注册/注销、查找、把一次执行绑定到定义并发出开始/结束事件 | 结构判断 |
| `src/types.ts` | 源码 | 119 | 持久化命令事件词汇与注册表的 Cordis 事件声明 | 结构判断 |
| `src/brand.ts` | 源码 | 40 | 命令定义 id 与执行 id 的品牌化标识 | 结构判断 |
| `src/builtin.ts` | 源码 | 49 | 内置命令的身份与输入拼写（Host 与 Client 适配器共用） | 结构判断 |
| `tests/commands.spec.ts` | 测试 | 676 | 注册表行为、事件顺序与生命周期配对 | 结构判断 |
| `tests/builtin.spec.ts` | 测试 | 39 | 内置命令常量与拼写校验 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 84 / 42 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 152 / 152 / 76 | 中英说明与配对索引 | 结构判断 |

### 4.3 `interaction/permission-presets` — 权限预设（19 个文件）

把「sandbox 模式」与「审批策略」两个独立维度组合成用户看得懂的预设，并负责权限投影与 `/permission` 命令。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 482 | 预设模型：读取/切换 sandbox 与审批维度，推导当前预设，挂载权限投影与命令 | 结构判断 |
| `src/types.ts` | 源码 | 63 | 权限域纯类型，`permissions` 投影类型的唯一定义处 | 结构判断 |
| `src/client.ts` | 源码 | 10 | 客户端命名空间的纯再导出 | 结构判断 |
| `tests/permission-presets.spec.ts` | 测试 | 472 | 预设切换与两维度组合的覆盖 | 结构判断 |
| `tests/projection.spec.ts` | 测试 | 211 | `permissions` 投影与 `/permission` 命令的挂载行为 | 结构判断 |
| `tests/initialization.spec.ts` | 测试 | 100 | 权限准入必须在 Agent 创建完成之前结束 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 86 / 48 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 147 / 147 / 64 | 中英说明与配对索引 | 结构判断 |

### 4.4 `interaction/tool-ask-user` — 模型向用户提问的工具（16 个文件）

`ask_user_question` 的模型侧封装；支持可选超时版本，超时后按既定策略收尾。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 120 | 工具定义：把模型参数转成 `ctx.userQuestions` 调用并渲染答案 | 结构判断 |
| `src/timed.ts` | 源码 | 212 | 带超时的 `ask_user_question` 变体：超时预算、取消与结果整形 | 结构判断 |
| `tests/tool-ask-user.spec.ts` | 测试 | 694 | 工具执行、等待、取消与超时路径 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 53 / 36 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 168 / 168 / 76 | 中英说明与配对索引 | 结构判断 |

### 4.5 `interaction/user-approval` — 审批 capability seam（18 个文件）

审批请求的契约服务：发起、取消、审计与按会话的待批集合，UI 与工具两端都经此。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 336 | 审批服务：请求排队、按会话隔离、取消、审计记录与投影注册 | 结构判断 |
| `src/types.ts` | 源码 | 93 | 线安全的审批标识与结果词汇（不依赖实现） | 结构判断 |
| `tests/approval.spec.ts` | 测试 | 526 | 审批全生命周期与并发/取消 | 结构判断 |
| `tests/projection.spec.ts` | 测试 | 234 | 审批投影在 Fiber 状态变化下的重建 | 结构判断 |
| `tsdown.config.ts` | 配置 | 15 | tsdown 打包配置 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 63 / 42 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 178 / 178 / 91 | 中英说明与配对索引 | 结构判断 |

### 4.6 `interaction/user-questions` — 提问 capability seam（20 个文件）

`ctx.userQuestions`：把模型提问变成可回答的问题集合，维护答案投影与前台等待时限。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 364 | 提问服务：创建问题、等待答案、结算与事件发布 | 结构判断 |
| `src/projection.ts` | 源码 | 331 | 把 `ask_user_question` 工具事件折叠成可回答问题集与 Session 投影 | 结构判断 |
| `src/timed-wait.ts` | 源码 | 83 | 前台问题的存活期与客户端认领；持久状态留在投影里 | 结构判断 |
| `src/types.ts` | 源码 | 180 | 客户端安全的问题、答案与事件类型 | 结构判断 |
| `tests/user-questions.spec.ts` | 测试 | 956 | 问答主流程、并发认领、取消与投影重建 | 结构判断 |
| `tests/projection.spec.ts` | 测试 | 300 | 投影折叠规则 | 结构判断 |
| `tests/timed-wait.spec.ts` | 测试 | 108 | 前台等待时限与认领 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 76 / 42 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 70 / 70 / 34 | 中英说明与配对索引 | 结构判断 |

---

## 五、`packages/jobs` — 后台作业（57 个文件）

后台作业能力：seam（契约）+ 本机实现 + 面向模型的三个工具。作业输出走「环形缓冲 + 绝对偏移」，模型可按偏移增量读取，不必重读全量。

### 5.1 组根文件（3 个）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `packages/jobs/README.md` / `README.zh.md` | 文档 | 50 / 50 | 该组英文 / 中文总览 | 结构判断 |
| `packages/jobs/README.i18n.yaml` | 文档 | 25 | 中英段落配对索引 | 结构判断 |

### 5.2 `jobs/jobs` — 作业 seam（14 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 199 | `ctx.jobs` 服务定义：作业登记、状态迁移、输出源与消费者契约 | 结构判断 |
| `src/types.ts` | 源码 | 309 | 生产者、注册表与消费者共用类型（描述符、状态、输出源） | 结构判断 |
| `src/view.ts` | 源码 | 99 | 客户端安全作业视图：单个作业的只读投影 | 结构判断 |
| `src/error.ts` | 源码 | 43 | 可机器路由的后台作业失败类型 | 结构判断 |
| `src/brand.ts` | 源码 | 28 | 作业 id 的品牌化类型 | 结构判断 |
| `src/archive-admission.ts` | 源码 | 48 | Workspace 注册表 `job` 族的归档准入规则 | 结构判断 |
| `tests/service.spec.ts` | 测试 | 152 | 服务契约与状态迁移 | 结构判断 |
| `tests/archive-admission.spec.ts` | 测试 | 145 | 归档准入判定 | 结构判断 |
| `tests/error.spec.ts` | 测试 | 13 | 错误类型构造 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 62 / 33 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 141 / 141 / 61 | 中英说明与配对索引 | 结构判断 |

### 5.3 `jobs/jobs-local` — 进程内作业实现（22 个文件）

真实注册表：有界输出环形缓冲、拉取泵、按过滤器分发的事件路由。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 728 | 进程本地的作业提供方：创建/查询/终止作业、挂输出源、发事件、随 Fiber 释放清理 | 结构判断 |
| `src/pump.ts` | 源码 | 106 | 注册表自有的拉取泵：把作业输出源拷进环形缓冲 | 结构判断 |
| `src/ring.ts` | 源码 | 113 | 单作业的有界输出环：按绝对字节偏移切块与丢弃最旧 | 结构判断 |
| `src/events.ts` | 源码 | 102 | 事件路由：订阅方按过滤器登记，变更时只投递给匹配者 | 结构判断 |
| `tests/jobs.spec.ts` | 测试 | 1681 | 注册表全流程（含 session projection 联动），本块最大用例之一 | 结构判断 |
| `tests/ring.spec.ts` | 测试 | 65 | 环形缓冲的偏移与淘汰 | 结构判断 |
| `tests/pump.spec.ts` | 测试 | 156 | 拉取泵的增量拷贝与背压 | 结构判断 |
| `tests/events.spec.ts` | 测试 | 147 | 过滤器路由 | 结构判断 |
| `tests/loader-composition.spec.ts` | 测试 | 66 | 经真实 Loader 组合装配 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 56 / 33 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 156 / 156 / 70 | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（728 行）按「服务实现 → 作业生命周期 → 输出源与泵的接线 → 事件与投影 → 释放」组织；纯算法被抽到 `ring.ts` / `pump.ts` / `events.ts`，测试也按此拆分。

### 5.4 `jobs/tool-jobs` — 作业工具（18 个文件）

`job_output`、`job_list`、`job_kill` 三个模型工具，含「等待增量」与「打断等待」语义。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 613 | 三个工具的实现：增量读取输出、列作业、终止作业，以及等待/打断条件 | 结构判断 |
| `src/render.ts` | 源码 | 84 | 注册表读取的模型侧渲染：把消费增量渲染成工具结果文本 | 结构判断 |
| `tests/tool-jobs.spec.ts` | 测试 | 1701 | 三工具全路径（本块最大用例） | 结构判断 |
| `tests/steer-wait.spec.ts` | 测试 | 270 | 有引导消息到达时提前结束等待 | 结构判断 |
| `tests/scripted-adapter.ts` | 测试 | 31 | 脚本化 `LlmAdapter` 夹具 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 59 / 36 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 193 / 193 / 97 | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（613 行）是三个工具定义加共享的「输出消费器」；等待逻辑（轮询、引导消息抢占、超时）是主要复杂度来源。

---

## 六、`packages/llm` — 模型接入层（295 个文件）

本组是全仓 LLM 抽象的核心：`llm` 是不含供应商语义的**协议中立层**（消息、流式分块、装配器、重试策略），其余包是具体传输（DeepSeek Messages / pi-ai 多供应商）与配套（账号、API key、Token 计量、请求扩展、插件清单上报）。三件套模式在这里最典型：`llm` 定义 seam，`llm-deepseek` 与 `llm-pi-ai` 是两条并列实现，`llm-deepseek-account` / `llm-deepseek-api-key` 是同一传输的两种鉴权路由。

### 6.1 组根文件（3 个）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `packages/llm/README.md` / `README.zh.md` | 文档 | 50 / 50 | 该组英文 / 中文总览 | 结构判断 |
| `packages/llm/README.i18n.yaml` | 文档 | 25 | 中英段落配对索引 | 结构判断 |

### 6.2 `llm/llm` — 协议中立 LLM 服务（38 个文件）

真正的 `ctx.llm`：适配器注册表 + 可被 waterfall 拦截的流式调用 + 单次调用的分块装配。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 1237 | LLM 服务本体：适配器注册与选择、`stream()` 入口、waterfall 拦截点、调用配置冻结、失败归一 | 结构判断 |
| `src/types.ts` | 源码 | 606 | 供应商中立的消息与流式词汇（块、增量、用量、能力）的规范定义 | 结构判断 |
| `src/assistant-stream.ts` | 源码 | 534 | 单次模型流尝试的无损紧凑表示，含记录级重放所需的元数据 | 结构判断 |
| `src/content.ts` | 源码 | 510 | 内容块结构助手：构造、拼接、判定与跨块遍历 | 结构判断 |
| `src/message.ts` | 源码 | 307 | 消息值类型、身份与不可变构造助手 | 结构判断 |
| `src/assembler.ts` | 源码 | 208 | 分块到消息的增量装配器（全仓唯一的装配实现） | 结构判断 |
| `src/retry-policy.ts` | 源码 | 201 | 供应商自有的请求重试策略配置与解析 | 结构判断 |
| `src/brand.ts` | 源码 | 76 | 工具调用关联 id、供应商请求 id 的品牌化类型 | 结构判断 |
| `src/adapter-failure.ts` | 源码 | 108 | 适配器边界抛出值的归一化（转成统一失败类型） | 结构判断 |
| `src/error.ts` | 源码 | 232 | LLM 失败码与助手函数，基于共享 Harness 错误基类 | 结构判断 |
| `src/api-key.ts` | 源码 | 41 | 「什么算合法 provider API key」的单一定义，各包共用 | 结构判断 |
| `src/call-config.ts` | 源码 | 96 | 会话级调用配置与冻结工具 | 结构判断 |
| `src/attribution.ts` | 源码 | 90 | 统一出站 `User-Agent` 等非机密产品标识 | 结构判断 |
| `tests/service.spec.ts` | 测试 | 1727 | 服务主干：注册、选择、流式、拦截与失败路径（本组最大用例） | 结构判断 |
| `tests/content.spec.ts` | 测试 | 656 | 内容块助手全覆盖 | 结构判断 |
| `tests/assistant-stream.spec.ts` | 测试 | 487 | 流尝试表示的往返与重放 | 结构判断 |
| `tests/topology.spec.ts` | 测试 | 341 | 适配器拓扑与 waterfall 顺序 | 结构判断 |
| `tests/assembler.spec.ts` | 测试 | 264 | 装配器的分块边界 | 结构判断 |
| `tests/retry-policy.spec.ts` | 测试 | 139 | 重试策略解析 | 结构判断 |
| `tests/message.spec.ts` | 测试 | 128 | 消息构造与类型层断言 | 结构判断 |
| `tests/properties.spec.ts` | 测试 | 105 | 装配器的基于属性测试 | 结构判断 |
| `tests/call-config.spec.ts` | 测试 | 102 | 配置逐字段相等判定 | 结构判断 |
| `tests/attribution.spec.ts` | 测试 | 78 | 出站标识 | 结构判断 |
| `tests/api-key.spec.ts` | 测试 | 70 | key 合法性 | 结构判断 |
| `tests/adapter-failure.spec.ts` | 测试 | 68 | 失败归一化 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 83 / 45 | 包声明（多入口导出）与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 200 / 200 / 64 | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（1237 行）是「服务注册 → 适配器选择与路由 → 流式调用主循环 → 事件发射 → 释放」的单文件实现，类型与算法分别下沉到 `types.ts`、`assembler.ts`、`assistant-stream.ts`；`types.ts`（606 行）几乎全是类型声明与文档注释，可当协议手册读；`assistant-stream.ts`（534 行）围绕「一次尝试的可重放快照」组织；`content.ts`（510 行）是纯函数集合。

### 6.3 `llm/llm-deepseek` — DeepSeek Messages 传输（70 个文件）

最完整的一条传输实现：请求配置解析、序列化、SSE 翻译、文件/图片上传与复用、模型清单与缓存、重放元数据。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 50 | 插件出口：装配 Messages 传输、请求配置与模型能力 | 结构判断 |
| `src/adapter.ts` | 源码 | 182 | 直接 Messages 传输：每个模型请求一条可取消的生命周期 | 结构判断 |
| `src/config.ts` | 源码 | 340 | 插件配置与请求期的完整解析（端点、路由、模型覆盖） | 结构判断 |
| `src/credential.ts` | 源码 | 58 | DeepSeek 模型与 Web 供应商共用的凭据值；协议头由调用方负责 | 结构判断 |
| `src/defaults.ts` | 源码 | 24 | 共享供应商上限与 Chat Files API 默认值 | 结构判断 |
| `src/file-id.ts` | 源码 | 27 | Files API 文件 id 的品牌化类型 | 结构判断 |
| `src/files-api.ts` | 源码 | 262 | Files API 传输：上传、查询、删除 | 结构判断 |
| `src/file-store.ts` | 源码 | 336 | 文件上传复用、失效与配额恢复 | 结构判断 |
| `src/host.ts` | 源码 | 91 | DeepSeek 协议适配器的 Host 侧共享接线 | 结构判断 |
| `src/images.ts` | 源码 | 111 | 确定性的图片准备：Files 引用与受限内联回退 | 结构判断 |
| `src/image-tokens.ts` | 源码 | 157 | 视觉 token 计量：按供应商公布的口径折算图片 token | 结构判断 |
| `src/listed-catalog.ts` | 源码 | 186 | 清单目录：版本门控、本构建的模型知识、部署覆盖 | 结构判断 |
| `src/listing.ts` | 源码 | 269 | `GET /models`：一次鉴权请求与逐条解码 | 结构判断 |
| `src/listing-cache.ts` | 源码 | 202 | 按凭据分域的清单缓存：单飞加载、后台刷新、最后一次已知值 | 结构判断 |
| `src/listing-config.ts` | 源码 | 64 | 跟随清单的路由配置：缓存时序与校验 | 结构判断 |
| `src/messages-api.ts` | 源码 | 17 | Messages API 端点与请求头策略常量 | 结构判断 |
| `src/model-info.ts` | 源码 | 102 | 与协议无关的模型能力与推理档位 | 结构判断 |
| `src/models.ts` | 源码 | 23 | 默认 DeepSeek 模型目录 | 结构判断 |
| `src/replay.ts` | 源码 | 64 | 最小原生思考元数据；响应正文由持久块持有 | 结构判断 |
| `src/request-extensions.ts` | 源码 | 59 | 插件贡献请求字段的准备与 HTTP 接受后的提交 | 结构判断 |
| `src/request-files.ts` | 源码 | 158 | Files 解析、有界陈旧 id 恢复与图片诊断 | 结构判断 |
| `src/request-pricing.ts` | 源码 | 111 | 请求图片的供应商侧计价 | 结构判断 |
| `src/serialize.ts` | 源码 | 169 | 系统快照 / 工具变更 / 对话轮次到 Messages 的映射 | 结构判断 |
| `src/sse.ts` | 源码 | 28 | SSE 分帧（委托 eventsource-parser），JSON 错误仍算供应商失败 | 结构判断 |
| `src/translate.ts` | 源码 | 166 | Messages 事件翻译，保序并累计用量 | 结构判断 |
| `src/transport.ts` | 源码 | 45 | HTTP 与带内错误归一为供应商中立失败 | 结构判断 |
| `src/types.ts` | 源码 | 133 | 模型目录与请求期依赖类型 | 结构判断 |
| `src/upload-index.ts` | 源码 | 224 | 持久的「附件 → file id」索引 | 结构判断 |
| `src/wire-types.ts` | 源码 | 41 | DeepSeek 支持的 Anthropic Messages 请求协议子集 | 结构判断 |
| `tests/runtime.spec.ts` | 测试 | 2383 | 运行时全链路（本分册最大用例） | 结构判断 |
| `tests/adapter.spec.ts` | 测试 | 667 | HTTP 生命周期、路由与可选 Cordis 服务 | 结构判断 |
| `tests/file-store.spec.ts` | 测试 | 592 | 上传复用与配额恢复 | 结构判断 |
| `tests/serialize.spec.ts` | 测试 | 533 | 请求转换与持久重放校验 | 结构判断 |
| `tests/runtime.e2e.ts` | 测试 | 465 | 端到端（真实 HTTP 回环） | 结构判断 |
| `tests/listing-cache.spec.ts` | 测试 | 416 | 清单缓存的首用等待、刷新、保留与释放 | 结构判断 |
| `tests/files-api.spec.ts` | 测试 | 400 | Files API 传输 | 结构判断 |
| `tests/loader-composition.spec.ts` | 测试 | 360 | Profile 补丁与凭据更新能否到达下一次真实请求 | 结构判断 |
| `tests/adapter.e2e.ts` | 测试 | 337 | 适配器端到端 | 结构判断 |
| `tests/account-routing.spec.ts` | 测试 | 320 | 账号路由取消走真实 loop 与工具生命周期 | 结构判断 |
| `tests/dynamic-config.spec.ts` | 测试 | 317 | 动态配置变更 | 结构判断 |
| `tests/listing.spec.ts` | 测试 | 258 | `/models` 解码与请求生命周期 | 结构判断 |
| `tests/upload-index.spec.ts` | 测试 | 218 | 附件索引持久化 | 结构判断 |
| `tests/files.spec.ts` | 测试 | 216 | 文件引用准入与回退 | 结构判断 |
| `tests/extensions.spec.ts` | 测试 | 198 | 请求扩展随 HTTP 请求结算 | 结构判断 |
| `tests/listed-catalog.spec.ts` | 测试 | 182 | 目录解析与版本门控 | 结构判断 |
| `tests/helpers.ts` | 测试 | 116 | 确定性 Messages 夹具与回环传输 | 结构判断 |
| `tests/mock-server.ts` | 测试 | 159 | 本地 HTTP mock 服务 | 结构判断 |
| `tests/request-pricing.spec.ts` | 测试 | 145 | 图片计价 | 结构判断 |
| `tests/stream.spec.ts` | 测试 | 137 | JSON/SSE 边界不变量（部分响应与失败响应） | 结构判断 |
| `tests/image-tokens.spec.ts` | 测试 | 79 | 视觉 token 折算 | 结构判断 |
| `tests/credential.spec.ts` | 测试 | 71 | 凭据解析与「仅元数据就绪」判定 | 结构判断 |
| `tests/egress.spec.ts` | 测试 | 70 | 出站请求守门 | 结构判断 |
| `tests/provider-hooks.spec.ts` | 测试 | 68 | 连接就绪与模型准入钩子 | 结构判断 |
| `tests/prepared-call.spec.ts` | 测试 | 59 | 预置调用保留端点与凭据代次 | 结构判断 |
| `tests/official-route-turn.spec.ts` | 测试 | 41 | 官方端点在模型请求上报凭据失败 | 结构判断 |
| `tests/built-in-catalog.spec.ts` | 测试 | 18 | 内置目录识别 | 结构判断 |
| `tests/model-info.spec.ts` | 测试 | 16 | 目录元数据支持嵌入调用方 | 结构判断 |
| `tests/assemble.ts` | 测试 | 31 | 驱动 `ctx.llm.stream()` 经过装配器的助手 | 结构判断 |
| `tests/fixtures/deferred-tools.ts` | 夹具 | 94 | 延迟工具声明序列化重放 | 结构判断 |
| `tests/fixtures/input-history.ts` | 夹具 | 43 | 含 assistant-only 内容的用户输入重放 | 结构判断 |
| `tests/fixtures/all-deferred-tools.ts` | 夹具 | 37 | 仅延迟工具声明的序列化 | 结构判断 |
| `tests/fixtures/history.ts` | 夹具 | 18 | 跨协议历史转换 | 结构判断 |
| `tests/fixtures/cordis.yml` | 夹具 | 25 | 测试组合配置 | 结构判断 |
| `tests/expected/degraded-replay.json` | 夹具 | 48 | 降级重放的期望输出 | 结构判断 |
| `tests/fixtures/red.png` | 资源 | — | 图片请求用例的 1×1 像素素材 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 91 / 62 | 包声明（多入口）与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 221 / 221 / 91 | 中英说明与配对索引（本组最详细） | 结构判断 |

**结构说明（>500 行）**：`tests/runtime.spec.ts`（2383 行）是全分册最大文件，按「请求准备 → 传输 → 流翻译 → 用量/计价 → 重放」分段组织，属于真实 I/O 与内存传输混合的集成用例，不宜作为行为规范唯一来源；`src/config.ts`（340 行）以配置解析为中心，纯函数化。

### 6.4 `llm/llm-deepseek-account` — 账号令牌路由（18 个文件）

同一 Messages 传输的「账号」鉴权形态：账号令牌认证、账号侧模型清单与版本门控。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 99 | 账号令牌认证、账号模型清单与版本门控 | 结构判断 |
| `src/config.ts` | 源码 | 97 | 账号路由配置：Messages 设置、清单端点、逐模型覆盖 | 结构判断 |
| `tests/provider.spec.ts` | 测试 | 209 | 账号路由的清单、模型门控与发现独立性 | 结构判断 |
| `tests/account-quota.spec.ts` | 测试 | 84 | 账号配额分类与 API key / 三方配额保持分离 | 结构判断 |
| `tests/config.spec.ts` | 测试 | 42 | 配置解析 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 64 / 36 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 106 / 106 / 46 | 中英说明与配对索引 | 结构判断 |

### 6.5 `llm/llm-deepseek-api-key` — API Key 路由（18 个文件）

与上一包对称：API key 认证，仅在官方端点 + 内置目录时才跟随官方 `/models` 清单。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 124 | API key 认证、凭据门控的发现与官方模型清单 | 结构判断 |
| `src/config.ts` | 源码 | 61 | 与一次 Messages 端点代次一起解析的 key 配置 | 结构判断 |
| `tests/listing.spec.ts` | 测试 | 196 | 内置目录时的官方清单服务 | 结构判断 |
| `tests/discovery.spec.ts` | 测试 | 46 | 发现必须使用本路由自己的凭据 | 结构判断 |
| `tests/config.spec.ts` | 测试 | 30 | 端点与目录条件 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 58 / 33 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 97 / 97 / 46 | 中英说明与配对索引 | 结构判断 |

### 6.6 `llm/llm-pi-ai` — pi-ai 多供应商适配器（62 个文件）

一条适配器覆盖多个供应商，并负责把它们统一到 Harness 的流协议：目录物化、鉴权桥接、登录流、上下文转换、重放。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/catalog.ts` | 源码 | 987 | 单个供应商路由的模型目录物化（来自已安装 pi-ai 目录） | 结构判断 |
| `src/config.ts` | 源码 | 551 | 配置 schema 与供应商 profile 校验 | 结构判断 |
| `src/adapter.ts` | 源码 | 515 | pi-ai 的通用 Harness LLM seam 实现 | 结构判断 |
| `src/discovery.ts` | 源码 | 418 | 回答「该供应商能服务哪些模型」 | 结构判断 |
| `src/context.ts` | 源码 | 411 | Harness 请求历史到 pi-ai Context 词汇的转换 | 结构判断 |
| `src/index.ts` | 源码 | 346 | 插件入口：一个实例持有一张路由字典 | 结构判断 |
| `src/replay.ts` | 源码 | 277 | 持久 pi-ai 重放元数据与 assistant 历史重建 | 结构判断 |
| `src/stream.ts` | 源码 | 254 | pi-ai 事件到 Harness 流协议的翻译 | 结构判断 |
| `src/auth.ts` | 源码 | 231 | pi-ai 鉴权模型与 harness 凭据之间的三种适配器 | 结构判断 |
| `src/provider.ts` | 源码 | 193 | 把配置好的路由构造成 pi-ai `Provider` | 结构判断 |
| `src/login.ts` | 源码 | 172 | 自带登录流程的供应商的授权流 | 结构判断 |
| `src/prefix-binding.ts` | 源码 | 110 | 重放 Anthropic 思考时与请求前缀绑定 | 结构判断 |
| `src/models.ts` | 源码 | 92 | 从 pi-ai 公共窄入口组装的模型助手 | 结构判断 |
| `src/provider-data.ts` | 源码 | 19 | 已安装供应商默认值（配置面用） | 结构判断 |
| `src/provider-data.generated.ts` | 源码 | 52 | 由脚本生成的供应商展示元数据，勿手改 | 结构判断 |
| `src/types.ts` | 源码 | 10 | 暴露给传输头贡献者的请求元数据 | 结构判断 |
| `scripts/gen-provider-data.ts` | 脚本 | 160 | 用 pi-ai 公共目录与鉴权上下文生成展示元数据 | 结构判断 |
| `tests/catalog.spec.ts` | 测试 | 1319 | 目录物化（本组最大用例） | 结构判断 |
| `tests/adapter.spec.ts` | 测试 | 1239 | 适配器全路径 | 结构判断 |
| `tests/convert.spec.ts` | 测试 | 1037 | 跨协议转换 | 结构判断 |
| `tests/context.spec.ts` | 测试 | 704 | 历史转换 | 结构判断 |
| `tests/discovery.spec.ts` | 测试 | 597 | 模型发现（含录制的清单夹具） | 结构判断 |
| `tests/conversation-updates.spec.ts` | 测试 | 322 | 能力驱动的 transcript 更新 | 结构判断 |
| `tests/dynamic-config.spec.ts` | 测试 | 318 | 动态配置 | 结构判断 |
| `tests/loader-composition.spec.ts` | 测试 | 313 | 真实组合下的补丁与凭据更新 | 结构判断 |
| `tests/provider-apis.e2e.ts` | 测试 | 263 | 供应商 API 端到端 | 结构判断 |
| `tests/auth.spec.ts` | 测试 | 260 | 凭据落盘与解析 | 结构判断 |
| `tests/prefix-binding.spec.ts` | 测试 | 225 | 思考重放前缀绑定 | 结构判断 |
| `tests/login.spec.ts` | 测试 | 204 | 登录流 | 结构判断 |
| `tests/completed-tool-arguments.spec.ts` | 测试 | 199 | 完成态工具参数在进入历史前失败 | 结构判断 |
| `tests/protocol-roundtrip.spec.ts` | 测试 | 199 | 跨协议请求不得覆盖原供应商所需历史 | 结构判断 |
| `tests/adapter.e2e.ts` | 测试 | 164 | 适配器端到端 | 结构判断 |
| `tests/mock-server.ts` | 测试 | 135 | 本地 HTTP mock | 结构判断 |
| `tests/tool-argument-streaming.spec.ts` | 测试 | 132 | 工具参数流式拼装 | 结构判断 |
| `tests/request-headers.spec.ts` | 测试 | 129 | 请求头贡献不跨调用生命周期 | 结构判断 |
| `tests/native-auth.spec.ts` | 测试 | 117 | 原生凭据命令 | 结构判断 |
| `tests/config.spec.ts` | 测试 | 109 | 配置校验 | 结构判断 |
| `tests/gemini-protocol.spec.ts` | 测试 | 83 | 手写路由可说 Gemini 协议 | 结构判断 |
| `tests/sdk-options.spec.ts` | 测试 | 75 | SDK 选项透传 | 结构判断 |
| `tests/compat-upgrade.spec.ts` | 测试 | 71 | 兼容升级 | 结构判断 |
| `tests/egress.spec.ts` | 测试 | 68 | 出站守门 | 结构判断 |
| `tests/assemble.ts` | 测试 | 31 | 装配器驱动助手 | 结构判断 |
| `tests/auth-double.ts` | 测试 | 39 | pi-ai 凭据替身 | 结构判断 |
| `tests/catalog-provider-ids.spec.ts` | 测试 | 32 | 目录供应商 id | 结构判断 |
| `tests/fixtures/model-listings/openrouter-2026-09-02.json` | 夹具 | 299 | 录制的 OpenRouter 清单 | 结构判断 |
| `tests/fixtures/model-listings/models-dev-anthropic-2026-09-02.json` | 夹具 | 146 | 录制的 models.dev Anthropic 清单 | 结构判断 |
| `tests/fixtures/model-listings/anthropic-reference-example.json` | 夹具 | 76 | Anthropic 参考清单 | 结构判断 |
| `tests/fixtures/model-listings/deepseek-2026-09-02.json` | 夹具 | 20 | 录制的 DeepSeek 清单 | 结构判断 |
| `tests/fixtures/qr-code.png` | 资源 | — | 登录流用例的二维码素材 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 75 / 54 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 292 / 292 / 100 | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/catalog.ts`（987 行）以「路由 + 已安装目录 → 可服务模型表」的纯计算为主，是配置面最复杂处；`src/config.ts`（551 行）schema 与校验各半；`src/adapter.ts`（515 行）是流式请求的实现主体。

### 6.7 `llm/llm-retry` — 模型请求重试（22 个文件）

在 agent loop 的请求边界上做「按供应商路由」的重试与恢复，含重试投影的持久化。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 257 | 重试策略挂载：判定可重试失败、退避、恢复与投影登记 | 结构判断 |
| `src/types.ts` | 源码 | 48 | 重试相关类型（基于 `LlmFailure`） | 结构判断 |
| `src/brand.ts` | 源码 | 13 | 重试尝试 id 的品牌化类型 | 结构判断 |
| `tests/retry.spec.ts` | 测试 | 1074 | 重试全路径（本组最大用例） | 结构判断 |
| `tests/transport-recovery.spec.ts` | 测试 | 320 | 传输层恢复 | 结构判断 |
| `tests/loader-composition.spec.ts` | 测试 | 125 | 真实组合装配 | 结构判断 |
| `tests/initialization.spec.ts` | 测试 | 82 | 供应商恢复与重试投影注册的重叠 | 结构判断 |
| `tests/persistence.spec.ts` | 测试 | 68 | 重试状态持久化 | 结构判断 |
| `tsdown.config.ts` | 配置 | 15 | 打包配置 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 72 / 36 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 149 / 149 / 70 | 中英说明与配对索引 | 结构判断 |

### 6.8 `llm/deepseek-llm-api-extensions` — 请求扩展注册表（16 个文件）

允许插件向 DeepSeek 顶层请求体贡献独立字段，并对贡献做类型校验。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 144 | 扩展注册表：登记贡献者、按请求解析贡献、冲突与校验 | 结构判断 |
| `src/types.ts` | 源码 | 59 | 供应商专有 JSON 与贡献类型 | 结构判断 |
| `tests/registry.spec.ts` | 测试 | 182 | 注册表行为 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 45 / 18 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 61 / 61 / 31 | 中英说明与配对索引 | 结构判断 |

### 6.9 `llm/plugin-package-inventory-deepseek` — 插件包清单上报（17 个文件）

把当前 Loader 已加载的插件包（名称/版本）作为请求头随官方 DeepSeek 请求上报。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 214 | 从 Loader 读取活跃插件包清单并整形为上报载荷 | 结构判断 |
| `src/types.ts` | 源码 | 19 | 上报载荷的线格式类型 | 结构判断 |
| `tests/inventory.spec.ts` | 测试 | 335 | 清单内容与版本排序 | 结构判断 |
| `tests/private-package-composition.spec.ts` | 测试 | 90 | 无版本文件插件不阻塞 Loader 组合 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 68 / 39 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 78 / 78 / 43 | 中英说明与配对索引 | 结构判断 |

### 6.10 `llm/token-meter` — Token 计量（31 个文件）

按轮次与上下文表面计量 token：供应商回报用量 + 固定密度估算 + 位置化计价，全部以投影形式可重建。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 296 | 计量服务：请求压力与表面压力，可重放 | 结构判断 |
| `src/turn-usage.ts` | 源码 | 274 | 单轮用量折算（含最后一段 assistant 流块） | 结构判断 |
| `src/usage-projection.ts` | 源码 | 213 | 供应商回报用量与上下文占用量的纯折叠 | 结构判断 |
| `src/breakdown-projection.ts` | 源码 | 184 | 当前保留表面的启发式构成（系统/工具/消息） | 结构判断 |
| `src/surface-fold.ts` | 源码 | 142 | 计量用位置化计价：每个保留节点保持身份 | 结构判断 |
| `src/estimate.ts` | 源码 | 102 | 固定密度启发式 token 估算（服务与工具共用） | 结构判断 |
| `src/measurement-projection.ts` | 源码 | 100 | 定长恢复事实；位置化附件价格是可重建缓存 | 结构判断 |
| `src/surface-projection.ts` | 源码 | 96 | 上下文压力投影的 O(1) 表面 token 折叠 | 结构判断 |
| `src/route-pricing.ts` | 源码 | 76 | 请求投影的表面计价（取代附件块启发式） | 结构判断 |
| `src/projection.ts` | 源码 | 79 | 客户端安全的 token 投影词汇 | 结构判断 |
| `src/types.ts` | 源码 | 54 | 配置与计量词汇 | 结构判断 |
| `src/client.ts` | 源码 | 9 | 客户端命名空间的纯再导出 | 结构判断 |
| `tests/token-meter.spec.ts` | 测试 | 650 | 计量服务主流程 | 结构判断 |
| `tests/context-breakdown-projection.spec.ts` | 测试 | 569 | 表面构成投影 | 结构判断 |
| `tests/token-usage-projection.spec.ts` | 测试 | 551 | 用量投影 | 结构判断 |
| `tests/turn-usage.spec.ts` | 测试 | 418 | 单轮折算 | 结构判断 |
| `tests/route-pricing.spec.ts` | 测试 | 300 | 路由计价（含图片卸载投影） | 结构判断 |
| `tests/measurement-projection.spec.ts` | 测试 | 215 | 恢复事实与价格重建 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 66 / 39 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 163 / 163 / 64 | 中英说明与配对索引 | 结构判断 |

---

## 七、`packages/lsp` — 语言服务器（70 个文件）

同样是三件套：`lsp` 定义 seam（提供方注册 + 归一化请求），`lsp-stdio` 是用子进程 + JSON-RPC 的通用实现，`tool-lsp` 是模型工具。与 MCP 组的差别在于：LSP 只有一条 stdio 传输，复杂度集中在**协议分帧、初始化握手与能力翻译**。

### 7.1 组根文件（3 个）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `packages/lsp/README.md` / `README.zh.md` | 文档 | 51 / 51 | 该组英文 / 中文总览 | 结构判断 |
| `packages/lsp/README.i18n.yaml` | 文档 | 25 | 中英段落配对索引 | 结构判断 |

### 7.2 `lsp/lsp` — LSP seam（17 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 169 | `ctx.lsp` 服务：提供方注册表与请求路由（按语言/工作区选提供方） | 结构判断 |
| `src/types.ts` | 源码 | 130 | 归一化请求、提供方与结果契约（只有类型） | 结构判断 |
| `src/brand.ts` | 源码 | 21 | 提供方在 seam 上预留的不透明身份 id | 结构判断 |
| `tests/lsp.spec.ts` | 测试 | 187 | seam 注册与路由行为 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 44 / 24 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 139 / 139 / 58 | 中英说明与配对索引 | 结构判断 |

### 7.3 `lsp/lsp-stdio` — stdio 语言服务器实现（31 个文件）

一个插件实例配置一张「语言 → 启动命令」表；每次连接含初始化握手、串行化的可中断请求，以及能力到工具操作的翻译。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 393 | 通用 stdio 后端：命名表配置、按需 spawn、把 seam 请求分派到实例 | 结构判断 |
| `src/connection.ts` | 源码 | 375 | 单语言服务器上的 JSON-RPC 端点（经 subprocess seam 拉起） | 结构判断 |
| `src/instance.ts` | 源码 | 349 | 单个服务器实例：连接 + initialize 握手 + 串行可中断请求队列 | 结构判断 |
| `src/translate.ts` | 源码 | 257 | 纯协议翻译：服务器能力允许什么、结果如何映射 | 结构判断 |
| `src/host.ts` | 源码 | 140 | 面向通用 stdio 提供方的文件系统 seam 源访问 | 结构判断 |
| `src/framing.ts` | 源码 | 116 | LSP 基础协议分帧：按 `Content-Length` 的 JSON-RPC 编解码 | 结构判断 |
| `src/protocol.ts` | 源码 | 75 | 本宿主读写的 LSP 线类型子集（初始化能力与四种操作） | 结构判断 |
| `src/abort.ts` | 源码 | 51 | 本地提供方三阶段（宿主 I/O、队列、协议）共用的取消助手 | 结构判断 |
| `tests/lifecycle.spec.ts` | 测试 | 691 | 实例生命周期（本组最大用例） | 结构判断 |
| `tests/instance.spec.ts` | 测试 | 463 | 握手与请求串行化 | 结构判断 |
| `tests/connection.spec.ts` | 测试 | 335 | 连接层 | 结构判断 |
| `tests/provider.spec.ts` | 测试 | 291 | 提供方路由与表配置 | 结构判断 |
| `tests/host.spec.ts` | 测试 | 237 | 文件系统 seam 访问 | 结构判断 |
| `tests/fixture-server.ts` | 测试 | 200 | 可脚本化的假 LSP 服务器（真协议） | 结构判断 |
| `tests/translate.spec.ts` | 测试 | 177 | 能力与结果翻译 | 结构判断 |
| `tests/typescript-server.e2e.ts` | 测试 | 118 | 免密钥真实 `typescript-language-server` 端到端 | 结构判断 |
| `tests/framing.spec.ts` | 测试 | 82 | 分帧编解码 | 结构判断 |
| `tests/built-lib.e2e.ts` | 测试 | 80 | 构建产物可加载守卫 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 62 / 42 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 159 / 159 / 58 | 中英说明与配对索引 | 结构判断 |

### 7.4 `lsp/tool-lsp` — `lsp` 工具（19 个文件）

一个只读工具、四个操作（按实现头注释：定义/引用/悬停/符号类），坐标需在 UTF-16 零基与一基之间转换。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 245 | `lsp` 工具定义：参数校验、按操作调用 seam、结果裁剪 | 结构判断 |
| `src/render.ts` | 源码 | 193 | 纯格式化与坐标转换（一基 ↔ 零基 UTF-16 光标） | 结构判断 |
| `tests/tool-lsp.spec.ts` | 测试 | 266 | 工具执行与四个操作 | 结构判断 |
| `tests/render.spec.ts` | 测试 | 172 | 渲染与坐标转换 | 结构判断 |
| `tests/integration.spec.ts` | 测试 | 118 | 与 seam 的集成 | 结构判断 |
| `tests/load-path.spec.ts` | 测试 | 24 | Loader 导出形状守卫（命名空间插件 + inject） | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 65 / 39 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 179 / 179 / 103 | 中英说明与配对索引 | 结构判断 |

---

## 八、`packages/mcp` — MCP 客户端与资源（86 个文件）

接入外部 MCP 服务器：`mcp-client` 管一条连接的代次（generation）与工具桥接，`mcp-manager` 管一群服务器的配置与热更新，`mcp-resources` 把资源读/列做成共享工具。这组最强调**连接生命周期**：崩溃重连、协商失败恢复、子进程静默。

### 8.1 组根文件（3 个）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `packages/mcp/README.md` / `README.zh.md` | 文档 | 54 / 54 | 该组英文 / 中文总览 | 结构判断 |
| `packages/mcp/README.i18n.yaml` | 文档 | 25 | 中英段落配对索引 | 结构判断 |

### 8.2 `mcp/mcp-client` — 单个 MCP 连接桥（48 个文件）

一个插件实例对接一个 MCP 服务器：连接监督者持有客户端/传输代次，工具发现后注册进 ToolRuntime，凭据模板在运行时解析并从诊断中抹除。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 263 | 桥接插件入口：装配连接、注册工具与资源、暴露状态 | 结构判断 |
| `src/connection.ts` | 源码 | 406 | 连接监督者：持有某服务器的客户端与传输代次，负责重启与关闭确认 | 结构判断 |
| `src/tools.ts` | 源码 | 537 | 工具桥：发现 MCP 工具、在 Harness ToolRuntime 注册、转发调用与取消 | 结构判断 |
| `src/generation.ts` | 源码 | 113 | 一个传输生命周期，含在飞工作与已确认关闭 | 结构判断 |
| `src/status.ts` | 源码 | 133 | 连接状态单元：跨连接/断开/失败的迁移 | 结构判断 |
| `src/probe.ts` | 源码 | 103 | 一次性探测：连接、读服务器身份、列工具后关闭 | 结构判断 |
| `src/credentials.ts` | 源码 | 96 | 单实例的运行时模板解析与密钥抹除 | 结构判断 |
| `src/types.ts` | 源码 | 87 | 客户端安全的连接状态与探测结果类型 | 结构判断 |
| `src/templates.ts` | 源码 | 76 | `${credential:REF}` 语法与传输字符串替换 | 结构判断 |
| `src/diagnostic.ts` | 源码 | 55 | 连接诊断保留因果链，隐藏原始标识 | 结构判断 |
| `src/transport.ts` | 源码 | 46 | 按配置创建 stdio / HTTP 传输 | 结构判断 |
| `src/server-context.ts` | 源码 | 40 | 发布连接自有的 MCP 资源与服务器字面说明 | 结构判断 |
| `src/deadline.ts` | 源码 | 31 | 启动与探测预算共用的结算截止 | 结构判断 |
| `tests/mcp-client.spec.ts` | 测试 | 1233 | 桥接主流程（本组第二大用例） | 结构判断 |
| `tests/reconnect.spec.ts` | 测试 | 796 | 崩溃驱动重连、预算与关闭 | 结构判断 |
| `tests/mcp-client.e2e.ts` | 测试 | 608 | 真实 MCP 协议端到端 | 结构判断 |
| `tests/apply.spec.ts` | 测试 | 512 | 插件 `apply` 生命周期入口 | 结构判断 |
| `tests/status.spec.ts` | 测试 | 403 | 状态单元在连接/重连/关闭中的迁移 | 结构判断 |
| `tests/probe.spec.ts` | 测试 | 226 | 一次性探测的阶段分类 | 结构判断 |
| `tests/protocol.spec.ts` | 测试 | 160 | 真实 SDK 协商、订阅与取消 | 结构判断 |
| `tests/negotiation-lifecycle.spec.ts` | 测试 | 158 | 探测所有权、协商失败恢复与子进程静默 | 结构判断 |
| `tests/generation.spec.ts` | 测试 | 146 | 真实 SDK 取消与调用方自有的连接预算 | 结构判断 |
| `tests/credentials.spec.ts` | 测试 | 97 | 凭据模板逐次解析与诊断抹除 | 结构判断 |
| `tests/fixture-server.ts` | 测试 | 78 | 最小 stdio MCP 服务器 | 结构判断 |
| `tests/tool-definition.spec.ts` | 测试 | 70 | 工具定义形状 | 结构判断 |
| `tests/diagnostic.spec.ts` | 测试 | 66 | 诊断行 | 结构判断 |
| `tests/http-fixture.ts` | 测试 | 61 | HTTP 传输夹具（zod schema） | 结构判断 |
| `tests/server-context.spec.ts` | 测试 | 60 | 资源与服务器说明发布 | 结构判断 |
| `tests/egress.spec.ts` | 测试 | 41 | 出站守门 | 结构判断 |
| `tests/load-path.spec.ts` | 测试 | 29 | 真实加载路径守卫 | 结构判断 |
| `tests/credential-fixture.ts` | 测试 | 25 | 内存凭据引用 | 结构判断 |
| `tests/fixtures/negotiation-lifecycle.mjs` | 夹具 | 38 | 旧版 stdio 服务器（协议发现处带文件屏障） | 结构判断 |
| `tests/fixtures/resources-server.ts` | 夹具 | 27 | 确定性资源与字面说明（供无头 Session 快照） | 结构判断 |
| `tests/fixtures/pagination-limit-server.ts` | 夹具 | 15 | 返回不终止分页的 MCP 线夹具 | 结构判断 |
| `tests/fixtures/pagination-limit.patch.yml` | 夹具 | 11 | 对应的组合补丁 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 88 / 51 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 252 / 252 / 100 | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/tools.ts`（537 行）是「发现 → 注册 → 调用 → 取消/超时 → 注销」的工具桥全流程；`tests/mcp-client.spec.ts`（1233 行）与 `tests/reconnect.spec.ts`（796 行）分别覆盖主流程与故障恢复，两文件合起来才是完整语义。

### 8.3 `mcp/mcp-manager` — MCP 服务器群管（18 个文件）

`ctx.mcpManager`：按 profile 持久化配置，批量拉起 `mcp-client` 实例，并在配置变化时做 Loader 级和解。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 604 | 管理器：服务器配置合并（入口配置 / settings / profile）、实例增删、状态汇总与事件 | 结构判断 |
| `src/types.ts` | 源码 | 48 | 每服务器运行状态、列表视图与管理器事件 | 结构判断 |
| `tests/manager.spec.ts` | 测试 | 1181 | 管理器全路径（入口回退、settings 驱动、热和解） | 结构判断 |
| `tests/composition.spec.ts` | 测试 | 111 | 真实 profile 持久化与继承服务器 | 结构判断 |
| `tests/profile-fixture.ts` | 测试 | 57 | 经真实 profile + ConfigEditor + Loader 构造管理器配置 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 81 / 41 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 196 / 196 / 64 | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（604 行）按「配置来源合并 → 差异计算 → 实例生命周期 → 状态/事件」组织；测试 1181 行几乎一对一覆盖这些分支。

### 8.4 `mcp/mcp-resources` — MCP 资源工具（17 个文件）

把 MCP 资源做成三个共享工具（列/读/模板类），并按作用域隔离；二进制载荷不进入模型历史。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 131 | 作用域化资源提供方与工具装配 | 结构判断 |
| `src/tools.ts` | 源码 | 68 | 三个工具：把模型参数适配到作用域化资源操作 | 结构判断 |
| `src/render.ts` | 源码 | 24 | 资源结果投影：把二进制载荷挡在模型历史之外 | 结构判断 |
| `tests/resources.spec.ts` | 测试 | 369 | 资源工具行为（模型工具夹具） | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 61 / 30 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 134 / 134 / 64 | 中英说明与配对索引 | 结构判断 |

---

## 九、`packages/plan`（23 个文件）

本组只有 `plan-mode` 一个包，把「计划模式」实现为**记录在会话日志里的协作状态**而不是客户端本地开关：进入/退出是一次可回放的日志事件，激活期间向模型注入计划提示，并把当前计划投影成会话状态供 UI 渲染。因此它的测试重点在状态机与投影，而非渲染。

### 9.1 `plan/plan-mode` — 计划模式

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 483 | 计划模式插件主体：激活/退出写入日志、注入计划提示、维护投影 | 结构判断 |
| `src/types.ts` | 源码 | 45 | `plan` 投影键与载荷类型的唯一定义处，客户端与服务端共用 | 结构判断 |
| `src/client.ts` | 源码 | 10 | 浏览器侧再导出，仅转发投影类型 | 结构判断 |
| `tests/plan-mode.spec.ts` | 测试 | 1219 | 计划模式主行为：激活、退出、重入与提示注入 | 结构判断 |
| `tests/integration.spec.ts` | 测试 | 254 | 与日志、投影、工具注册的组合集成 | 结构判断 |
| `tests/projection.spec.ts` | 测试 | 178 | `plan` 投影的形态与增量更新顺序 | 结构判断 |
| `tests/initialization.spec.ts` | 测试 | 62 | 插件加载后的初始状态与未激活时的行为 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 80 / 39 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 204 / 204 / 109 | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（483 行）按「状态转换 → 日志写入 → 提示组装 → 投影发布」四段组织；主用例 1219 行与这四段一一对应，是本组最重的一块。

**组根**：`packages/plan/README.md` 49 行、`README.zh.md` 49 行、`README.i18n.yaml` 25 行，说明该能力域只有「计划模式」一件事。

---

## 十、`packages/preset`（110 个文件）

`preset` 组是「Agent 预设」的三件套：`agent-preset` 是**只声明不实现**的预设行（其真正价值在于随包发行的 skill 与两套插件模板），`agent-preset-registry` 负责登记预设、挂载共享运行时插件树、并把预设激活绑定到会话，`persona` 则给预设叠加可组合的人格。三者合起来回答「新开会话默认长什么样」。

### 10.1 `preset/agent-preset` — 预设声明与随包 skill

`src/index.ts` 只有 30 行，说明本体几乎不含逻辑；文件量集中在 `skills/dsh-doc/`——仓库里随包发行的唯一 skill，附带两套可复制的插件模板。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 30 | 声明式预设行：给出该预设的组成与展示元数据，无运行逻辑 | 结构判断 |
| `tests/skills.spec.ts` | 测试 | 272 | 随包 skill 的清单、引用可达性与模板完整性 | 结构判断 |
| `skills/dsh-doc/SKILL.md` | 文档（skill） | 41 | `dsh-doc` skill 入口：概述 + 16 篇 reference 的导航 | 结构判断 |
| `skills/dsh-doc/references/*.md`（16 个） | 文档（skill） | 5–542 | 专题参考：包清单 `packages.md`（542 行，最长）及组合、配置、宿主插件、插件开发、MCP 打包、UI、工具设计、升级、验证等 | 结构判断 |
| `skills/dsh-doc/templates/decoration/*`（15 个） | 脚本/资源/夹具 | 1–22 | 「装饰型 UI 插件」模板：`cordis.patch.yml`、`index.js`、`client.js`、`icon.svg`、`docs/preview.svg`、8 语 `locale/`、`docs/DETAIL.md`、`package.json` | 结构判断 |
| `skills/dsh-doc/templates/mcp/*`（13 个） | 脚本/资源/夹具 | 1–18 | 「最小 MCP 插件」模板：组合补丁、8 语 `locale/`、图标/预览/说明、`package.json` | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 预设名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 56 / 24 | 包声明（`files` 需覆盖 `skills/`）与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 94 / 94 / 37 | 中英说明与配对索引 | 结构判断 |

> 模板里的 `cordis.patch.yml` 是给新插件起步用的组合补丁，与 `modules/` 中「三件套 + 组合补丁」的描述对应；此处只记文件，不重复架构说明。

### 10.2 `preset/agent-preset-registry` — 预设登记、挂载与激活

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 415 | 注册表主体：声明式 Agent 能力集的登记、查询、激活与会话绑定 | 结构判断 |
| `src/mount.ts` | 源码 | 216 | 挂载共享运行时插件树，并管理其随预设切换的装载顺序 | 结构判断 |
| `src/composition-inventory.ts` | 源码 | 205 | 从当前配置或已激活 revision 推导出实际插件清单 | 结构判断 |
| `src/display.ts` | 源码 | 73 | 预设的展示层投影（名称、描述、图标等） | 结构判断 |
| `src/types.ts` | 源码 | 70 | 预设、激活结果与清单项的类型定义 | 结构判断 |
| `src/session.ts` | 源码 | 46 | 把激活结果与会话 id 关联，供重连后恢复 | 结构判断 |
| `src/definition.ts` | 源码 | 39 | 单个预设定义的结构校验与归一化 | 结构判断 |
| `src/preset.ts` | 源码 | 18 | 仅做类型导入/再导出，无实现 | 结构判断 |
| `tests/registry.spec.ts` | 测试 | 414 | 注册表主行为：登记、覆盖、查询与激活 | 结构判断 |
| `tests/mount.spec.ts` | 测试 | 154 | 插件树挂载与卸载顺序 | 结构判断 |
| `tests/tool-executors.spec.ts` | 测试 | 149 | 预设暴露给模型的工具执行器 | 结构判断 |
| `tests/harness.ts` | 测试 | 54 | 测试夹具：最小组合与注册表构造 | 结构判断 |
| `tests/session.spec.ts` | 测试 | 45 | 会话绑定与恢复 | 结构判断 |
| `tests/display.spec.ts` | 测试 | 30 | 展示投影字段 | 结构判断 |
| `tests/composition-inventory.spec.ts` | 测试 | 27 | 插件清单推导 | 结构判断 |
| `tests/fixtures/plugins/*.js`（6 个） | 夹具 | 5–20 | 六种测试插件：贡献能力、全局服务、迟注册服务、缺依赖、自释放、抛错 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 104 / 69 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 109 / 109 / 49 | 中英说明与配对索引 | 结构判断 |

### 10.3 `preset/persona` — 可组合人格

给预设叠加的「人格」行：只声明提示片段与选择规则，真正的注入由会话侧完成。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 75 | persona 行：声明可选人格与其提示片段，供预设组合时选用 | 结构判断 |
| `tests/persona.spec.ts` | 测试 | 179 | 人格选择、片段拼接与缺省行为 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 人格名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 46 / 22 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 127 / 127 / 64 | 中英说明与配对索引 | 结构判断 |

**组根**：`packages/preset/README.md` 44 行、`README.zh.md` 44 行、`README.i18n.yaml` 25 行。

---

## 十一、`packages/ptc-runtime`（93 个文件）

`ptc-runtime` 把「执行一段程序拿结果」抽象成可替换的运行时 seam：seam 包只定义执行协议、生命周期与输出类型；`ptc-runtime-node` 用「受管 Node 子进程 + 多个评估器」落地，并按一次性进程/持久进程两条路径拆分。这一组是本册里唯一大量涉及进程边界与输出流的区域。

### 11.1 `ptc-runtime/ptc-runtime` — 执行 seam

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 191 | seam 服务：注册运行时、启动执行、转发输出与生命周期事件 | 结构判断 |
| `src/types.ts` | 源码 | 181 | 执行请求/结果/输出块/能力声明的类型定义 | 结构判断 |
| `src/image.ts` | 源码 | 23 | 把程序产生的图像结果编码为协议可承载的形式 | 结构判断 |
| `tests/service.spec.ts` | 测试 | 97 | seam 服务的装配与调用契约 | 结构判断 |
| `tests/reserved.spec.ts` | 测试 | 57 | 保留名/保留字段不被实现方占用 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 42 / 24 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 157 / 157 / 70 | 中英说明与配对索引 | 结构判断 |

> 本包无 `locale/`（seam 包不直接面向用户），与同组实现包不同。

### 11.2 `ptc-runtime/ptc-runtime-node` — Node 实现

**源码（30 个 `.ts` + 1 个打包配置）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 147 | 插件入口：把 Node 侧实现注册为 PTC 运行时 | 结构判断 |
| `src/json-wire.ts` | 源码 | 456 | 无损 JSON 快照编解码，宿主与源码 bootstrap 闭包共用同一份协议 | 结构判断 |
| `src/worker.ts` | 源码 | 429 | 受管 Node 工作进程：接收执行请求、驱动评估器、回传输出 | 结构判断 |
| `src/bootstrap.ts` | 源码 | 342 | 子进程启动引导：输出捕获、结果编码、宿主绑定代理 | 结构判断 |
| `src/evaluators/scoped-repl.ts` | 源码 | 339 | 作用域化 REPL 评估器：按执行上下文隔离变量与副作用 | 结构判断 |
| `src/evaluators/vm-script-await.ts` | 源码 | 290 | 把 Node REPL 的顶层 `await` 语义移植到完整 Script 评估 | 结构判断 |
| `src/process.ts` | 源码 | 237 | 进程抽象与生命周期监听（退出、信号、错误） | 结构判断 |
| `src/imports/vm-modules.ts` | 源码 | 233 | 在 VM 上下文中实现模块解析与加载 | 结构判断 |
| `src/execution.ts` | 源码 | 188 | 单次执行的状态机：排队、运行、结束、结果归集 | 结构判断 |
| `src/output-json.ts` | 源码 | 179 | 把多段输出序列化为结构化 JSON 结果 | 结构判断 |
| `src/imports/module-hooks.ts` | 源码 | 125 | 模块加载钩子的安装与撤销 | 结构判断 |
| `src/evaluators/scoped-repl-evaluator.ts` | 源码 | 110 | 作用域化 REPL 的评估器实现（与 `scoped-repl.ts` 配套） | 结构判断 |
| `src/protocol.ts` | 源码 | 104 | 宿主 ↔ 子进程的消息协议定义 | 结构判断 |
| `src/rpc.ts` | 源码 | 88 | 子进程侧 RPC 收发与请求配对 | 结构判断 |
| `src/config.ts` | 源码 | 86 | 运行时配置的解析与缺省值 | 结构判断 |
| `src/evaluators/vm-script.ts` | 源码 | 83 | `vm.Script` 评估器：编译后一次性执行 | 结构判断 |
| `src/policy-processes.ts` | 源码 | 79 | 按策略决定允许/拒绝的进程操作 | 结构判断 |
| `src/output-ledger.ts` | 源码 | 74 | 输出分段编号与截断记账 | 结构判断 |
| `src/launch.ts` | 源码 | 71 | 拉起子进程（含入口与参数拼装） | 结构判断 |
| `src/bindings.ts` | 源码 | 68 | 宿主能力的绑定声明（暴露给程序的受限接口） | 结构判断 |
| `src/evaluators/types.ts` | 源码 | 64 | 评估器接口与共享类型 | 结构判断 |
| `src/environment.ts` | 源码 | 58 | 子进程环境变量与工作目录的构造 | 结构判断 |
| `src/output-stream.ts` | 源码 | 50 | 输出流的分块与背压处理 | 结构判断 |
| `src/evaluators/repl.ts` | 源码 | 46 | 原生 REPL 评估器 | 结构判断 |
| `src/evaluators/async-function.ts` | 源码 | 42 | `AsyncFunction` 评估器：最简单的一条执行路径 | 结构判断 |
| `src/evaluators/index.ts` | 源码 | 27 | 四个评估器的选择入口（按配置与代码形态分派） | 结构判断 |
| `src/configuration.ts` | 源码 | 26 | 配置对象的装配（与 `config.ts` 分工：前者解析、后者构造） | 结构判断 |
| `src/persistent-process.ts` | 源码 | 22 | 持久进程的公开封装 | 结构判断 |
| `src/imports/evaluation-ended.ts` | 源码 | 11 | 评估结束后的模块状态清理信号 | 结构判断 |
| `src/persistent-process-entry.ts` | 源码 | 5 | 私有构建入口：持久进程引导 | 结构判断 |
| `src/process-entry.ts` | 源码 | 5 | 私有构建入口：一次性进程引导 | 结构判断 |
| `tsdown.config.ts` | 配置 | 8 | 双入口（一次性/持久）打包配置 | 结构判断 |

**测试（35 个，按被测对象归组）**

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `tests/persistent-host.spec.ts` | 测试 | 685 | 持久进程宿主侧全流程（本组最大用例） | 结构判断 |
| `tests/imports.spec.ts` | 测试 | 658 | VM 模块解析与加载钩子 | 结构判断 |
| `tests/scoped-repl.spec.ts` | 测试 | 638 | 作用域化 REPL 的隔离与恢复 | 结构判断 |
| `tests/host-failures.spec.ts` | 测试 | 548 | 宿主侧失败路径：拉起失败、协议错乱、早退 | 结构判断 |
| `tests/persistent.spec.ts` | 测试 | 454 | 持久进程的常规执行序列 | 结构判断 |
| `tests/bootstrap.spec.ts` | 测试 | 414 | 子进程引导：输出捕获与结果编码 | 结构判断 |
| `tests/output.spec.ts` | 测试 | 375 | 输出采集与分段 | 结构判断 |
| `tests/persistent-process.spec.ts` | 测试 | 375 | 持久进程封装 | 结构判断 |
| `tests/runtime.spec.ts` | 测试 | 332 | 运行时端到端装配 | 结构判断 |
| `tests/scoped-repl-evaluator.spec.ts` | 测试 | 292 | 作用域化 REPL 评估器 | 结构判断 |
| `tests/timeout.spec.ts` | 测试 | 291 | 执行超时与中止 | 结构判断 |
| `tests/json-wire.spec.ts` | 测试 | 285 | 无损 JSON 编解码 | 结构判断 |
| `tests/initialization.spec.ts` | 测试 | 234 | 插件初始化与配置校验 | 结构判断 |
| `tests/process-main.spec.ts` | 测试 | 228 | 子进程主流程 | 结构判断 |
| `tests/persistent-sandbox.spec.ts` | 测试 | 213 | 持久进程与沙箱策略的配合 | 结构判断 |
| `tests/rpc.spec.ts` | 测试 | 183 | 子进程 RPC 配对与错误传播 | 结构判断 |
| `tests/scoped-repl-mode.spec.ts` | 测试 | 157 | 作用域化 REPL 的模式选择 | 结构判断 |
| `tests/vm-script.spec.ts` | 测试 | 157 | `vm.Script` 评估器 | 结构判断 |
| `tests/output-json.spec.ts` | 测试 | 109 | 结构化输出序列化 | 结构判断 |
| `tests/output-ledger.spec.ts` | 测试 | 70 | 输出编号与截断记账 | 结构判断 |
| `tests/execution-mode.spec.ts` | 测试 | 82 | 评估器选择逻辑 | 结构判断 |
| `tests/imports-process.spec.ts` | 测试 | 79 | 跨进程的模块导入行为 | 结构判断 |
| `tests/script-process.spec.ts` | 测试 | 72 | 一次性脚本进程 | 结构判断 |
| `tests/process.spec.ts` | 测试 | 69 | 进程抽象 | 结构判断 |
| `tests/policy-processes.spec.ts` | 测试 | 98 | 进程策略判定 | 结构判断 |
| `tests/runtime-warnings.spec.ts` | 测试 | 45 | 运行时告警输出 | 结构判断 |
| `tests/launch.spec.ts` | 测试 | 42 | 子进程拉起参数 | 结构判断 |
| `tests/output-stream.spec.ts` | 测试 | 35 | 输出流分块 | 结构判断 |
| `tests/bindings.spec.ts` | 测试 | 23 | 宿主能力绑定声明 | 结构判断 |
| `tests/fake-child.ts` | 测试 | 99 | 夹具：可编排行为的假子进程 | 结构判断 |
| `tests/setup.ts` | 测试 | 23 | vitest 全局装配 | 结构判断 |
| `tests/raw-peer.ts` | 测试 | 22 | 夹具：裸协议对端，绕过封装校验协议层 | 结构判断 |
| `tests/built-lib.e2e.ts` | 测试 | 84 | 构建产物端到端 | 结构判断 |
| `tests/persistent-built.e2e.ts` | 测试 | 79 | 持久进程构建产物端到端 | 结构判断 |
| `tests/embedded-carrier.e2e.ts` | 测试 | 43 | 嵌入载体（非独立进程）路径 | 结构判断 |

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 76 / 42 | 包声明（含私有构建入口）与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 258 / 258 / 64 | 中英说明与配对索引 | 结构判断 |

**结构说明**：源码可按「协议层（`protocol` / `json-wire` / `rpc`）→ 进程层（`launch` / `worker` / `process` / `bootstrap` / `environment`）→ 评估层（`evaluators/*`）→ 输出层（`output-*`）」四层阅读；测试也基本按这四层一一对应，其中 `persistent-host` / `imports` / `scoped-repl` / `host-failures` 四个超过 500 行的用例集中覆盖最易出错的两条边界：进程生命周期与模块加载。

---

## 十二、`packages/sandbox`（95 个文件）

`sandbox` 组是本册唯一同时覆盖「策略声明」与「三种 OS 级执行机制」的区域：seam 包只定义能力边界、根目录与升级（escalation）语义；`sandbox-policy` 决定某次调用该不该放行；`sandbox-local` 走 Linux/macOS（bwrap / Landlock / seatbelt）；`sandbox-windows-acl` 走 Windows 的 ACL + 令牌 + FFI。四者的文件量差异恰好反映平台复杂度：Windows 一个包就占 37 个文件。

### 12.1 `sandbox/sandbox` — 沙箱 seam

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 230 | seam：定义沙箱能力、注册实现并暴露运行时查询 | 结构判断 |
| `src/escalation.ts` | 源码 | 263 | 升级语义：受限操作被拒后如何申请更高权限并重试 | 结构判断 |
| `src/roots.ts` | 源码 | 106 | 可写/可读根目录集合的推导与归一化 | 结构判断 |
| `src/diagnostics.ts` | 源码 | 100 | 沙箱自检：探测机制是否可用并给出诊断信息 | 结构判断 |
| `src/locales.ts` | 源码 | 60 | 诊断/拒绝文案的本地化取用 | 结构判断 |
| `tests/escalation.spec.ts` | 测试 | 176 | 升级申请与拒绝路径 | 结构判断 |
| `tests/roots.spec.ts` | 测试 | 128 | 根目录推导 | 结构判断 |
| `tests/diagnostics.spec.ts` | 测试 | 144 | 诊断输出 | 结构判断 |
| `tests/vocabulary.spec.ts` | 测试 | 46 | 术语/文案一致性（无 locale 目录，文案在 `locales.ts` 内） | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 47 / 27 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 184 / 184 / — | 中英说明与配对索引 | 结构判断 |

### 12.2 `sandbox/sandbox-policy` — 放行策略

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 273 | 策略主体：按调用上下文、路径与操作类型判定允许/拒绝/需升级 | 结构判断 |
| `src/session-mode.ts` | 源码 | 55 | 会话级沙箱模式（如只读/可写）的存取 | 结构判断 |
| `tests/policy.spec.ts` | 测试 | 387 | 策略矩阵：路径、操作、模式的组合判定 | 结构判断 |
| `tsdown.config.ts` | 配置 | 15 | 打包配置 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 策略文案翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 54 / 36 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 175 / 175 / — | 中英说明与配对索引 | 结构判断 |

### 12.3 `sandbox/sandbox-local` — Linux/macOS 实现

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 626 | 本地沙箱实现：按平台选择 bwrap / Landlock / seatbelt 并拼装执行命令 | 结构判断 |
| `src/profiles.ts` | 源码 | 60 | 三套机制各自的启动参数档位 | 结构判断 |
| `tests/local.spec.ts` | 测试 | 551 | 本地沙箱主行为 | 结构判断 |
| `tests/acl-grants.spec.ts` | 测试 | 421 | 授权集在本地机制下的落地 | 结构判断 |
| `tests/bwrap.e2e.ts` | 测试 | 153 | bwrap 真实端到端 | 结构判断 |
| `tests/landlock.e2e.ts` | 测试 | 113 | Landlock 真实端到端 | 结构判断 |
| `tests/seatbelt.e2e.ts` | 测试 | 181 | macOS seatbelt 真实端到端 | 结构判断 |
| `tests/packed-install.e2e.ts` | 测试 | 178 | 打包安装后的沙箱可用性 | 结构判断 |
| `tests/packed-workspace-closure.ts` | 测试 | 101 | 夹具：打包工作区的文件闭包 | 结构判断 |
| `tests/packed-workspace-closure.spec.ts` | 测试 | 37 | 上述闭包的断言 | 结构判断 |
| `tests/extra-roots.ts` | 测试 | 75 | 夹具：追加根目录场景 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 52 / 36 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 152 / 152 / — | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（626 行）按「平台探测 → 机制选择 → 参数拼装 → 执行与错误映射」组织；`.e2e.ts` 三个文件分别对应三套机制，是本组唯一需要真实内核能力的测试。

### 12.4 `sandbox/sandbox-windows-acl` — Windows 实现

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/acl.ts` | 源码 | 448 | ACL 读写：给受限令牌授予/回收目录访问权 | 结构判断 |
| `src/index.ts` | 源码 | 447 | 插件入口：组装 Windows 沙箱执行链 | 结构判断 |
| `src/ffi.ts` | 源码 | 314 | 通过 FFI 调用 Win32 API（令牌、ACL、进程创建） | 结构判断 |
| `src/token.ts` | 源码 | 243 | 受限令牌的创建与销毁 | 结构判断 |
| `src/runner.ts` | 源码 | 229 | 在受限令牌下运行子进程并回收结果 | 结构判断 |
| `src/grant.ts` | 源码 | 141 | 单次授权：路径 + 权限的组合与撤销 | 结构判断 |
| `src/win32-abi.ts` | 源码 | 131 | Win32 结构体/常量与 JS 侧的 ABI 映射 | 结构判断 |
| `src/acl-skill.ts` | 源码 | 76 | 把 ACL 操作包装成模型可调用的 skill 形态 | 结构判断 |
| `src/spawn.ts` | 源码 | 60 | 受限进程的 spawn 封装 | 结构判断 |
| `src/workspace-sid.ts` | 源码 | 54 | 工作区对应的 SID 推导（按工作区隔离授权） | 结构判断 |
| `src/path-boundary.ts` | 源码 | 51 | 路径边界检查（防越界） | 结构判断 |
| `tests/acl-failure-paths.spec.ts` | 测试 | 863 | ACL 失败路径（本组最大用例） | 结构判断 |
| `tests/diagnose-script.spec.ts` | 测试 | 848 | 诊断脚本的生成与输出解析 | 结构判断 |
| `tests/runner.spec.ts` | 测试 | 663 | 受限进程运行 | 结构判断 |
| `tests/acl.spec.ts` | 测试 | 515 | ACL 正常路径 | 结构判断 |
| `tests/token-failure-paths.spec.ts` | 测试 | 492 | 令牌创建失败路径 | 结构判断 |
| `tests/index-failure-paths.spec.ts` | 测试 | 482 | 插件入口失败路径 | 结构判断 |
| `tests/grant-failure-paths.spec.ts` | 测试 | 149 | 授权失败路径 | 结构判断 |
| `tests/ffi.spec.ts` | 测试 | 141 | FFI 调用与 ABI 映射 | 结构判断 |
| `tests/probe.spec.ts` | 测试 | 110 | 能力探测 | 结构判断 |
| `tests/control.spec.ts` | 测试 | 100 | 控制流/状态切换 | 结构判断 |
| `tests/grant.spec.ts` | 测试 | 77 | 授权正常路径 | 结构判断 |
| `tests/acl-skill.spec.ts` | 测试 | 69 | ACL skill 包装 | 结构判断 |
| `tests/path-boundary.spec.ts` | 测试 | 65 | 路径越界拦截 | 结构判断 |
| `tests/skill-composition.spec.ts` | 测试 | 63 | 与其他 skill 的组合 | 结构判断 |
| `tests/provider-chain.spec.ts` | 测试 | 58 | 提供方链式选择 | 结构判断 |
| `tests/workspace-sid.spec.ts` | 测试 | 43 | SID 推导 | 结构判断 |
| `tsdown.config.ts` | 配置 | 16 | 打包配置（含原生辅助文件） | 结构判断 |
| `*.ps1` / `*.cpp` / `*.yml` / 额外 `*.md`（4 个） | 脚本/资源 | — | PowerShell 诊断脚本、C++ 原生辅助源码与配套说明（详见「覆盖度与异常」） | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 60 / 33 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 206 / 208 / — | 中英说明与配对索引（中英行数不一致，说明有未同步段落） | 结构判断 |

**组根**：`packages/sandbox/README.md` 54 行、`README.zh.md` 54 行、`README.i18n.yaml`。

---

## 十三、`packages/schedule`（71 个文件）

`schedule` 组把「定时/周期任务」做成完整子系统：`schedule` 负责规则解析（cron / RRULE / 日周月）、持久化、执行、投递与重启恢复；`tool-schedule` 只是面向模型的薄工具层。它是本册中单个包内测试量最失衡的一处——29 个测试文件覆盖 8 个源码文件。

### 13.1 `schedule/schedule` — 定时任务引擎

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 803 | 插件入口：装配规则解析、存储、执行器与投递，并注册生命周期 | 结构判断 |
| `src/domain.ts` | 源码 | 1319 | 领域核心：任务/规则/触发目标/状态转换的纯逻辑（本册最大源码文件） | 结构判断 |
| `src/types.ts` | 源码 | 636 | 全组类型定义：规则、目标、投递记录、存储快照 | 结构判断 |
| `src/runtime.ts` | 源码 | 503 | 运行时调度：计时器、并发、串行投递与恢复 | 结构判断 |
| `src/storage.ts` | 源码 | 137 | 任务与投递记录的持久化读写 | 结构判断 |
| `src/update.ts` | 源码 | 100 | 规则更新时的重排与差量应用 | 结构判断 |
| `src/delivery-history.ts` | 源码 | 65 | 投递历史查询与裁剪 | 结构判断 |
| `src/client.ts` | 源码 | 2 | 客户端再导出，仅转发类型 | 结构判断 |
| `tests/runtime.spec.ts` | 测试 | 738 | 运行时调度主行为 | 结构判断 |
| `tests/targets.spec.ts` | 测试 | 640 | 触发目标（子代理/会话等）解析 | 结构判断 |
| `tests/plugin.spec.ts` | 测试 | 616 | 插件装配与端到端 | 结构判断 |
| `tests/management.spec.ts` | 测试 | 581 | 增删改查与生命周期管理 | 结构判断 |
| `tests/domain.spec.ts` | 测试 | 443 | 领域纯逻辑 | 结构判断 |
| `tests/weekly.spec.ts` | 测试 | 402 | 周规则 | 结构判断 |
| `tests/recovery.spec.ts` | 测试 | 340 | 崩溃/重启后的恢复 | 结构判断 |
| `tests/delivery-history.spec.ts` | 测试 | 312 | 投递历史 | 结构判断 |
| `tests/domain-restart.spec.ts` | 测试 | 308 | 领域状态跨重启一致性 | 结构判断 |
| `tests/delete-inactive.spec.ts` | 测试 | 284 | 清理不活跃任务 | 结构判断 |
| `tests/daily.spec.ts` | 测试 | 259 | 日规则 | 结构判断 |
| `tests/harness.ts` | 测试 | 254 | 测试夹具：内存存储 + 假时钟 | 结构判断 |
| `tests/execution.spec.ts` | 测试 | 234 | 单次执行 | 结构判断 |
| `tests/cron.spec.ts` | 测试 | 221 | cron 表达式 | 结构判断 |
| `tests/storage-evolution.spec.ts` | 测试 | 212 | 存储结构演进（旧快照可读） | 结构判断 |
| `tests/rrule.spec.ts` | 测试 | 185 | RRULE 解析 | 结构判断 |
| `tests/delete-inactive.perf.ts` | 测试 | 181 | 清理路径的性能基准（非断言型） | 结构判断 |
| `tests/subagent-ownership.spec.ts` | 测试 | 175 | 任务归属子代理时的清理 | 结构判断 |
| `tests/update-service.spec.ts` | 测试 | 134 | 更新服务 | 结构判断 |
| `tests/change-notice.spec.ts` | 测试 | 113 | 变更通知 | 结构判断 |
| `tests/update-restart.spec.ts` | 测试 | 113 | 更新后重启一致性 | 结构判断 |
| `tests/serial-delivery.spec.ts` | 测试 | 104 | 串行投递顺序 | 结构判断 |
| `tests/update.spec.ts` | 测试 | 103 | 规则更新 | 结构判断 |
| `tests/delivery.spec.ts` | 测试 | 79 | 投递基本路径 | 结构判断 |
| `tests/target-restart.spec.ts` | 测试 | 65 | 目标跨重启恢复 | 结构判断 |
| `tests/malformed-unit.spec.ts` | 测试 | 63 | 畸形规则输入 | 结构判断 |
| `tests/target-recovery.spec.ts` | 测试 | 53 | 目标丢失后的恢复 | 结构判断 |
| `tests/recurrence.spec.ts` | 测试 | 39 | 重复规则的小工具断言 | 结构判断 |
| `tests/rule-edits.ts` | 测试 | 16 | 夹具：规则编辑样例 | 结构判断 |
| `tsdown.config.ts` | 配置 | 15 | 打包配置 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 100 / 60 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 296 / 296 / — | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/domain.ts`（1319 行）是纯领域层，按「规则类型 → 下次触发计算 → 状态迁移 → 生命周期判定」组织，不碰 IO；`src/index.ts`（803 行）与 `src/runtime.ts`（503 行）负责把领域层接到定时器与存储上，二者与 `runtime.spec.ts`（738 行）构成一组。

### 13.2 `schedule/tool-schedule` — 定时任务工具

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 489 | 面向模型的定时任务工具：把工具参数翻译成引擎操作 | 结构判断 |
| `tests/tool-schedule.spec.ts` | 测试 | 609 | 工具契约（模型工具夹具） | 结构判断 |
| `tests/harness.ts` | 测试 | 32 | 夹具：最小引擎 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 工具名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 57 / 33 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 157 / 157 / — | 中英说明与配对索引 | 结构判断 |

**组根**：`packages/schedule/README.md` 52 行、`README.zh.md` 52 行、`README.i18n.yaml`，以及一个 `AGENTS.md`（本组特有的给 Agent 的操作说明，非标准根文件）。

---

## 十四、`packages/sdk`（71 个文件）

`sdk` 组是「把 harness 当库用」的三个层次：`protocol` 定义传输与消息类型（无实现依赖），`server` 把 harness 装成 JSON-RPC 服务端，`client` 是拉子进程并与之对话的客户端。三包合起来就是 `modules/06` 里那条 stdio 通道的完整实现。

### 14.1 `sdk/protocol` — 协议与传输

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/transport.ts` | 源码 | 286 | 分帧传输：行/长度前缀的收发与非阻塞写入 | 结构判断 |
| `src/types.ts` | 源码 | 242 | 请求/响应/通知/错误信封的类型定义 | 结构判断 |
| `src/index.ts` | 源码 | 43 | 公共导出面 | 结构判断 |
| `tests/transport.spec.ts` | 测试 | 310 | 分帧、拆包、半包与错误恢复 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 47 / 33 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 152 / 152 / — | 中英说明与配对索引 | 结构判断 |

### 14.2 `sdk/server` — 服务端

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/server.ts` | 源码 | 605 | 服务端主体：会话创建/恢复、请求分发、事件流与关闭 | 结构判断 |
| `src/query-activity.ts` | 源码 | 161 | 活动状态查询（运行中/等待/空闲）的投影 | 结构判断 |
| `src/query-content.ts` | 源码 | 74 | 内容查询：按会话取消息/块 | 结构判断 |
| `src/user-questions.ts` | 源码 | 78 | 把提问事件翻译成 SDK 侧的提问请求 | 结构判断 |
| `src/query-input.ts` | 源码 | 27 | 输入查询参数校验 | 结构判断 |
| `src/index.ts` | 源码 | 104 | 插件入口与导出面 | 结构判断 |
| `tests/server.spec.ts` | 测试 | 1356 | 服务端全量行为（本组最大用例） | 结构判断 |
| `tests/commands.spec.ts` | 测试 | 565 | 命令类请求 | 结构判断 |
| `tests/query-activity.spec.ts` | 测试 | 462 | 活动查询 | 结构判断 |
| `tests/plugin-apply.spec.ts` | 测试 | 380 | 插件装载 | 结构判断 |
| `tests/resume.spec.ts` | 测试 | 325 | 会话恢复 | 结构判断 |
| `tests/approval.spec.ts` | 测试 | 297 | 审批事件往返 | 结构判断 |
| `tests/wait.spec.ts` | 测试 | 217 | 等待/超时语义 | 结构判断 |
| `tests/permission-parity.spec.ts` | 测试 | 189 | 与宿主权限模型的一致性 | 结构判断 |
| `tests/user-questions.spec.ts` | 测试 | 146 | 提问往返 | 结构判断 |
| `tests/shutdown.spec.ts` | 测试 | 140 | 关闭流程 | 结构判断 |
| `tests/compact-parity.spec.ts` | 测试 | 130 | 压缩语义与服务端一致 | 结构判断 |
| `tests/built-scope-carrier.e2e.ts` | 测试 | 114 | 构建产物上的作用域载体 | 结构判断 |
| `tests/plan-parity.spec.ts` | 测试 | 95 | 计划模式一致 | 结构判断 |
| `tests/goal-parity.spec.ts` | 测试 | 89 | 目标一致 | 结构判断 |
| `tests/query-input.spec.ts` | 测试 | 80 | 输入校验 | 结构判断 |
| `tests/plugin-shape.spec.ts` | 测试 | 22 | 插件形状 | 结构判断 |
| `tests/command-model-input.ts` | 测试 | 25 | 夹具：命令输入 | 结构判断 |
| `tests/messages-response.ts` | 测试 | 11 | 夹具：消息响应 | 结构判断 |
| `tests/fixtures/approval.mjs` | 夹具 | 14 | 审批夹具插件 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 88 / 57 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 229 / 229 / — | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/server.ts`（605 行）按「连接建立 → 请求路由表 → 每类请求的适配 → 事件推送 → 关闭」组织；`tests/server.spec.ts`（1356 行）按同样的请求类别分组，`*-parity.spec.ts` 六个小文件专门锁「SDK 侧与宿主侧语义不得漂移」。

### 14.3 `sdk/client` — 客户端

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/client.ts` | 源码 | 661 | 客户端主体：拉进程、握手、请求/事件分发与断线处理 | 结构判断 |
| `src/api.ts` | 源码 | 383 | 面向使用者的高层 API（会话、查询、命令） | 结构判断 |
| `src/launch.ts` | 源码 | 157 | 运行时启动参数与环境构造 | 结构判断 |
| `src/dispose.ts` | 源码 | 99 | 资源释放：子进程、监听器与超时 | 结构判断 |
| `src/types.ts` | 源码 | 91 | 客户端类型 | 结构判断 |
| `src/index.ts` | 源码 | 34 | 导出面 | 结构判断 |
| `tests/sdk-client.spec.ts` | 测试 | 821 | 客户端全量行为 | 结构判断 |
| `tests/fake-runtime.ts` | 测试 | 399 | 夹具：可编排的假运行时 | 结构判断 |
| `tests/run.spec.ts` | 测试 | 310 | 单次运行 | 结构判断 |
| `tests/dispose.spec.ts` | 测试 | 231 | 释放路径 | 结构判断 |
| `tests/launch.spec.ts` | 测试 | 169 | 启动参数 | 结构判断 |
| `tests/fixtures/query.ts` | 测试 | 151 | 夹具：查询样例 | 结构判断 |
| `tests/user-questions.spec.ts` | 测试 | 122 | 提问往返 | 结构判断 |
| `tests/cot-translation-projection.spec.ts` | 测试 | 80 | 思维链翻译投影 | 结构判断 |
| `tests/fixtures/user-questions.ts` | 测试 | 43 | 夹具：提问样例 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 47 / 27 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 197 / 197 / — | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/client.ts`（661 行）集中在「连接状态机 + 请求配对 + 事件订阅」；`src/api.ts`（383 行）在其上做语义化封装，因此阅读顺序应是 api → client → launch。

**组根**：`packages/sdk/README.md` 49 行、`README.zh.md` 49 行、`README.i18n.yaml`。

---

## 十五、`packages/settings`（28 个文件）

`settings` 组只有 `settings` 一个包，职责是把「分层配置（默认 → 用户 → 项目 → 会话）」读成一份带类型的活配置，并负责脱敏与编辑写回。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 432 | 配置服务：分层合并、继承、订阅变更与写回 | 结构判断 |
| `src/redact.ts` | 源码 | 116 | 敏感字段脱敏：写日志/返回前端前遮蔽密钥 | 结构判断 |
| `src/schema.ts` | 源码 | 79 | 配置 schema 的组装与默认值 | 结构判断 |
| `src/types.ts` | 源码 | 77 | 配置类型与层级键定义 | 结构判断 |
| `tests/configuration.spec.ts` | 测试 | 356 | 分层合并与写回 | 结构判断 |
| `tests/configuration-inheritance.spec.ts` | 测试 | 91 | 继承与覆盖顺序 | 结构判断 |
| `tests/redact.spec.ts` | 测试 | 120 | 脱敏规则 | 结构判断 |
| `tests/schema.spec.ts` | 测试 | 42 | schema 默认值 | 结构判断 |
| `tests/editor-failures.spec.ts` | 测试 | 34 | 编辑器写入失败路径 | 结构判断 |
| `tests/configuration-fixture.ts` | 测试 | 58 | 夹具：多层配置目录 | 结构判断 |
| `tests/live-config.ts` | 测试 | 60 | 夹具：随变更重载的活配置 | 结构判断 |
| `tests/profile-composition.ts` | 测试 | 40 | 夹具：profile 组合 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 63 / 33 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 84 / 84 / — | 中英说明与配对索引 | 结构判断 |

**组根**：`packages/settings/README.md` 44 行、`README.zh.md` 44 行、`README.i18n.yaml`。

---

## 十六、`packages/shell`（180 个文件）

`shell` 组按「seam + 执行实现 + 面向模型的工具」三层展开，且**每条产品线都成对出现**：`bash-local` / `bash-sandbox`、`pwsh-local` / `pwsh-sandbox`、`tool-bash` / `tool-bash-persistent`、`tool-pwsh` / `tool-pwsh-persistent`。读这一组最有效的方式是横向对照：同一职责在 bash 与 pwsh 两侧各有一份，差异只在解释器与平台机制。

### 16.1 `shell/shell` — 执行 seam

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/types.ts` | 源码 | 238 | 执行请求/结果/流事件/能力声明的类型定义 | 结构判断 |
| `src/index.ts` | 源码 | 96 | seam 服务：注册执行提供方并转发调用 | 结构判断 |
| `src/render.ts` | 源码 | 43 | 执行结果渲染为模型可见文本 | 结构判断 |
| `tests/service.spec.ts` | 测试 | 89 | seam 调用契约 | 结构判断 |
| `tests/render.spec.ts` | 测试 | 36 | 结果渲染 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 42 / 24 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 146 / 146 / — | 中英说明与配对索引（无 locale，seam 不直接面向用户） | 结构判断 |

### 16.2 `shell/shell-env` — 执行环境

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 227 | 构造子进程环境：环境变量白名单、PATH 拼装、工作目录 | 结构判断 |
| `src/error.ts` | 源码 | 28 | 环境构造失败的分类错误 | 结构判断 |
| `tests/shell-env.spec.ts` | 测试 | 248 | 环境变量与 PATH 组合 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 55 / 36 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 140 / 140 / — | 中英说明与配对索引 | 结构判断 |

### 16.3 `shell/bash-local` — bash 本地执行

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 404 | bash 执行器：拼装命令行、接管 stdout/stderr、处理超时与退出码 | 结构判断 |
| `tests/executor.spec.ts` | 测试 | 563 | 执行器行为（本包主用例） | 结构判断 |
| `tests/settings.spec.ts` | 测试 | 26 | 配置项生效 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 50 / 33 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 152 / 152 / — | 中英说明与配对索引 | 结构判断 |

### 16.4 `shell/bash-sandbox` — bash 沙箱执行

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 192 | 在沙箱内执行 bash，并把沙箱拒绝映射为可读错误 | 结构判断 |
| `src/helpers.ts` | 源码 | 14 | 沙箱侧辅助片段（内容很短，具体用途待确认） | 待确认 |
| `tests/sandbox.spec.ts` | 测试 | 664 | 沙箱内执行主行为 | 结构判断 |
| `tests/partial-landlock.spec.ts` | 测试 | 284 | Landlock 部分规则生效的情形 | 结构判断 |
| `tests/foreground-timeout.spec.ts` | 测试 | 160 | 前台执行超时 | 结构判断 |
| `tests/seatbelt.e2e.ts` / `landlock.e2e.ts` / `bwrap.e2e.ts` | 测试 | 141 / 118 / 113 | 三套平台机制的真实端到端 | 结构判断 |
| `tests/fixtures/async-confinement-failure.ts` / `pending-confinement.ts` | 夹具 | 44 / 41 | 沙箱约束建立失败/未完成的可控场景 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 52 / 39 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 183 / 183 / — | 中英说明与配对索引 | 结构判断 |

### 16.5 `shell/pwsh-local` — PowerShell 本地执行

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 449 | PowerShell 执行器：参数编码（避免引号注入）、输出捕获与退出码 | 结构判断 |
| `src/resolve.ts` | 源码 | 79 | 定位 `pwsh` 可执行文件（多安装位置与版本探测） | 结构判断 |
| `tests/executor.spec.ts` | 测试 | 799 | 执行器行为（本组最大的单包用例） | 结构判断 |
| `tests/settings.spec.ts` | 测试 | 41 | 配置项生效 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 50 / 33 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 161 / 161 / — | 中英说明与配对索引 | 结构判断 |

### 16.6 `shell/pwsh-sandbox` — PowerShell 沙箱执行

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 200 | 在 Windows 受限令牌/ACL 沙箱内执行 PowerShell | 结构判断 |
| `src/helpers.ts` | 源码 | 120 | 沙箱侧 PowerShell 辅助脚本（权限铺垫与清理） | 结构判断 |
| `tests/sandbox.spec.ts` | 测试 | 433 | 沙箱内执行主行为 | 结构判断 |
| `tests/foreground-timeout.spec.ts` | 测试 | 160 | 前台执行超时 | 结构判断 |
| `tests/acl.e2e.ts` | 测试 | 124 | ACL 机制真实端到端 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 51 / 36 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 152 / 152 / — | 中英说明与配对索引 | 结构判断 |

### 16.7 `shell/tool-bash` — bash 工具

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 584 | 工具定义：命令执行参数、审批联动与结果回填 | 结构判断 |
| `src/background.ts` | 源码 | 144 | 后台执行：脱离前台等待、输出落盘与后续拉取 | 结构判断 |
| `src/render.ts` | 源码 | 126 | 把执行结果渲染成模型可读块（含截断与退出码） | 结构判断 |
| `tests/tools.spec.ts` | 测试 | 1595 | 工具全量契约（本组最大用例） | 结构判断 |
| `tests/background.spec.ts` | 测试 | 552 | 后台执行 | 结构判断 |
| `tests/integration.spec.ts` | 测试 | 282 | 与执行器/沙箱集成 | 结构判断 |
| `tests/background-start.spec.ts` | 测试 | 123 | 后台启动时序 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 工具名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 80 / 57 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 229 / 229 / — | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（584 行）按「参数校验 → 审批/沙箱决策 → 执行 → 渲染」组织；`tests/tools.spec.ts`（1595 行）是本册最大的单个测试文件，按工具字段逐项断言。

### 16.8 `shell/tool-bash-persistent` — 持久 bash 会话工具

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 488 | 持久会话工具：在同一 shell 进程内连续执行并保留 shell 状态 | 结构判断 |
| `tests/tools.spec.ts` | 测试 | 784 | 工具契约与会话保持 | 结构判断 |
| `tests/loader-composition.spec.ts` | 测试 | 203 | 与 Loader 组合加载 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 工具名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 67 / 36 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 161 / 161 / — | 中英说明与配对索引 | 结构判断 |

### 16.9 `shell/tool-pwsh` — PowerShell 工具

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 643 | PowerShell 工具定义：参数、审批联动、执行与回填 | 结构判断 |
| `src/background.ts` | 源码 | 147 | 后台执行 | 结构判断 |
| `src/render.ts` | 源码 | 139 | 结果渲染 | 结构判断 |
| `tests/tools.spec.ts` | 测试 | 1336 | 工具全量契约 | 结构判断 |
| `tests/background.spec.ts` | 测试 | 628 | 后台执行 | 结构判断 |
| `tests/integration.spec.ts` | 测试 | 162 | 集成 | 结构判断 |
| `tests/background-start.spec.ts` | 测试 | 123 | 后台启动时序 | 结构判断 |
| `tests/loader.spec.ts` | 测试 | 80 | Loader 装载 | 结构判断 |
| `tests/fixtures/loader/driver.ts` | 夹具 | 72 | 装载驱动 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 工具名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 79 / 60 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 220 / 220 / — | 中英说明与配对索引 | 结构判断 |
| `*.yml`（1 个） | 配置 | — | 与本包相关的组合/CI 片段（非标准根文件） | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（643 行）与 `tool-bash` 的 584 行结构同构，差异集中在 PowerShell 参数编码与输出编码处理。

### 16.10 `shell/tool-pwsh-persistent` — 持久 PowerShell 会话工具

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 500 | 持久 PowerShell 会话工具 | 结构判断 |
| `tests/tools.spec.ts` | 测试 | 858 | 工具契约与会话保持 | 结构判断 |
| `tests/loader-composition.spec.ts` | 测试 | 274 | 与 Loader 组合加载 | 结构判断 |
| `tests/readiness-timeline.ts` | 测试 | 354 | 夹具：会话就绪时间线 | 结构判断 |
| `tests/readiness-timeline.spec.ts` | 测试 | 136 | 就绪时序断言 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 工具名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 68 / 36 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 167 / 167 / — | 中英说明与配对索引 | 结构判断 |

**组根**：`packages/shell/README.md` 51 行、`README.zh.md` 51 行、`README.i18n.yaml`。

---

## 十七、`packages/skill`（95 个文件）

`skill` 组是「模型可调用的技能包」体系：`skill` 定义技能与注册表，`skill-filesystem` 从磁盘发现并热更新技能，`skill-office` 提供 Office 文档处理技能，`tool-skill` 把技能暴露为工具，`tool-workspace-dependencies` 负责技能依赖的安装/复制。源码高度集中——5 个实现文件占了本组绝大部分逻辑。

### 17.1 `skill/skill` — 技能 seam 与注册表

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 868 | 技能模型与注册表：清单解析、注册/注销、按需加载与调用 | 结构判断 |
| `tests/skill.spec.ts` | 测试 | 1272 | 注册表全量行为（本组最大用例） | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 48 / 30 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 150 / 150 / — | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（868 行）按「清单 → 注册表 → 生命周期 → 调用入口」组织；由于它同时承担类型与实现，阅读时宜先看导出面再看注册表内部。

### 17.2 `skill/skill-filesystem` — 文件系统技能源

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 1063 | 从目录发现技能：解析 `SKILL.md`、监听变更并增量重载 | 结构判断 |
| `tests/skill-filesystem.spec.ts` | 测试 | 1027 | 发现与解析 | 结构判断 |
| `tests/skill-filesystem-watcher.spec.ts` | 测试 | 489 | 文件监听与热更新 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 51 / 16 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 162 / 162 / — | 中英说明与配对索引 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（1063 行）是本组最大源码，按「扫描 → 解析 frontmatter → 依赖解析 → 注册 → 监听」组织，热更新部分与 `skill-filesystem-watcher.spec.ts` 对应。

### 17.3 `skill/skill-office` — Office 技能

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 141 | 声明 office 技能：绑定随包资源与渲染上下文 | 结构判断 |
| `tests/skill-office.spec.ts` | 测试 | 330 | 技能内容与绑定 | 结构判断 |
| `tests/xlsx-validation.e2e.ts` | 测试 | 184 | xlsx 产物校验端到端 | 结构判断 |
| `tests/fixtures/visual-intent.ts` | 夹具 | 145 | 视觉意图夹具（版式期望） | 结构判断 |
| `tests/fixtures/real-office.ts` | 夹具 | 78 | 真实 Office 文件夹具 | 结构判断 |
| `tests/progressive-loading.spec.ts` | 测试 | 125 | 技能内容渐进加载 | 结构判断 |
| `tests/render-tools.e2e.ts` | 测试 | 120 | 渲染工具端到端 | 结构判断 |
| `tests/docx-validation.e2e.ts` | 测试 | 71 | docx 产物校验 | 结构判断 |
| `tests/render-context.spec.ts` | 测试 | 71 | 渲染上下文 | 结构判断 |
| `tests/visual-intent-{docx,pptx,xlsx}.e2e.ts` | 测试 | 4 × 3 | 三类产物的视觉意图断言（仅 4 行，靠夹具驱动） | 结构判断 |
| `*.md`（6 个，非 README） | 文档（skill） | — | 技能说明与参考（随包发行） | 结构判断 |
| `*.xlsx`（1 个） | 夹具 | — | 二进制样例文档 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 50 / 24 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 138 / 138 / — | 中英说明与配对索引 | 结构判断 |

### 17.4 `skill/tool-skill` — 技能工具

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 451 | 工具定义：按名称调用技能、读取技能说明、参数适配 | 结构判断 |
| `tests/tool-skill.spec.ts` | 测试 | 1231 | 工具全量契约 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 工具名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 59 / 39 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 278 / 278 / — | 中英说明与配对索引（本组最长 README） | 结构判断 |

### 17.5 `skill/tool-workspace-dependencies` — 技能依赖

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 322 | 工作区依赖的解析与安装/复制，保证技能可运行 | 结构判断 |
| `tests/tool-workspace-dependencies.spec.ts` | 测试 | 485 | 依赖解析与安装 | 结构判断 |
| `tests/primary-runtime-copy.spec.ts` | 测试 | 87 | 主运行时文件的复制 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 工具名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 51 / 24 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 127 / 127 / — | 中英说明与配对索引 | 结构判断 |

**组根**：`packages/skill/README.md` 55 行、`README.zh.md` 55 行、`README.i18n.yaml`。

---

## 十八、`packages/spill`（51 个文件）

`spill` 解决「大载荷不进模型历史」：seam 定义溢出接口与类型，`spill-local` 把载荷落盘并清理，`spill-policy` 决定何时溢出、保留多久、以及如何在结果里留下引用与提示。

### 18.1 `spill/spill` — 溢出 seam

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/types.ts` | 源码 | 80 | 溢出载荷、引用句柄与策略接口的类型 | 结构判断 |
| `src/index.ts` | 源码 | 58 | seam：注册后端并提供溢出/读回入口 | 结构判断 |
| `tests/service.spec.ts` | 测试 | 60 | seam 调用契约 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 44 / 25 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 154 / 154 / — | 中英说明与配对索引 | 结构判断 |

### 18.2 `spill/spill-local` — 本地落盘后端

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/cleanup.ts` | 源码 | 431 | 过期溢出文件的清理（扫描、配额、并发删除） | 结构判断 |
| `src/index.ts` | 源码 | 164 | 后端装配：目录布局、写入与读回 | 结构判断 |
| `src/store.ts` | 源码 | 131 | 单条载荷的存储与句柄编解码 | 结构判断 |
| `tests/spill-local.spec.ts` | 测试 | 584 | 写入/读回/清理 | 结构判断 |
| `tests/loader-composition.spec.ts` | 测试 | 78 | 与 Loader 组合加载 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 50 / 22 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 141 / 141 / — | 中英说明与配对索引 | 结构判断 |

### 18.3 `spill/spill-policy` — 溢出策略

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 157 | 策略主体：按大小/类型决定溢出，并把引用写回结果 | 结构判断 |
| `src/retention.ts` | 源码 | 104 | 保留期与配额规则 | 结构判断 |
| `src/notice.ts` | 源码 | 59 | 给模型的「已溢出」提示文案 | 结构判断 |
| `src/types.ts` | 源码 | 26 | 策略配置类型 | 结构判断 |
| `tests/spill-policy.spec.ts` | 测试 | 634 | 策略主行为 | 结构判断 |
| `tests/multimodal-recovery.spec.ts` | 测试 | 243 | 多模态载荷的读回与恢复 | 结构判断 |
| `tests/multimodal.spec.ts` | 测试 | 227 | 多模态溢出 | 结构判断 |
| `tests/retention.spec.ts` | 测试 | 70 | 保留规则 | 结构判断 |
| `tests/notice.spec.ts` | 测试 | 55 | 提示文案 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 82 / 48 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 166 / 166 / — | 中英说明与配对索引 | 结构判断 |

**组根**：`packages/spill/README.md` 51 行、`README.zh.md` 51 行、`README.i18n.yaml`。

---

## 十九、`packages/ssh`（106 个文件）

`ssh` 组把「远端主机」接进本地抽象：`ssh` 管理连接与一个跑在远端的 helper 进程（含协议、生命周期与流式能力），`ssh-helper-runtime` 是 helper 的极小运行时壳，`fs-ssh` / `sandbox-ssh` / `subprocess-ssh` 分别把文件系统、沙箱与子进程能力代理到远端。本组的特点是一个包（`ssh`，43 个文件）承担了绝大部分复杂度。

### 19.1 `ssh/ssh` — 连接与远端 helper

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/helper-processes.ts` | 源码 | 456 | 远端 helper 进程池：拉起、复用、回收与失败结算 | 结构判断 |
| `src/index.ts` | 源码 | 331 | 插件入口：连接管理、能力注册与对外服务 | 结构判断 |
| `src/helper.ts` | 源码 | 289 | helper 在远端执行时的宿主侧实现 | 结构判断 |
| `src/protocol.ts` | 源码 | 235 | 本地 ↔ helper 的消息协议（含分帧与版本） | 结构判断 |
| `src/schemas.ts` | 源码 | 123 | 协议消息的 schema 校验 | 结构判断 |
| `src/stream-security.ts` | 源码 | 47 | 流式通道的访问控制与校验 | 结构判断 |
| `src/helper-entry.ts` | 源码 | 28 | helper 的入口脚本 | 结构判断 |
| `tests/helper-processes.spec.ts` | 测试 | 412 | 进程池行为 | 结构判断 |
| `tests/startup-behavior.spec.ts` | 测试 | 350 | 启动与握手 | 结构判断 |
| `tests/live.e2e.ts` | 测试 | 305 | 真实 SSH 连接端到端（需外部环境） | 结构判断 |
| `tests/helper-boundaries.spec.ts` | 测试 | 299 | helper 边界条件 | 结构判断 |
| `tests/connection-disposal.spec.ts` | 测试 | 248 | 连接释放 | 结构判断 |
| `tests/protocol-boundaries.spec.ts` | 测试 | 221 | 协议边界 | 结构判断 |
| `tests/management-capacity.spec.ts` | 测试 | 176 | 并发上限与排队 | 结构判断 |
| `tests/helper-runtime.spec.ts` | 测试 | 160 | helper 运行时 | 结构判断 |
| `tests/helper-finalization.spec.ts` | 测试 | 159 | 终止与落账 | 结构判断 |
| `tests/stream-capability.spec.ts` | 测试 | 109 | 流能力协商 | 结构判断 |
| `tests/helper-cleanup-join.spec.ts` | 测试 | 85 | 清理与收尾等待 | 结构判断 |
| `tests/stream-rebind.spec.ts` | 测试 | 81 | 流重绑定 | 结构判断 |
| `tests/protocol.spec.ts` | 测试 | 78 | 协议编解码 | 结构判断 |
| `tests/collection.spec.ts` | 测试 | 70 | 集合类操作 | 结构判断 |
| `tests/helper-lifecycle.spec.ts` | 测试 | 69 | helper 生命周期 | 结构判断 |
| `tests/stream-lifetime.spec.ts` | 测试 | 65 | 流存活期 | 结构判断 |
| `tests/inspector-signal.spec.ts` | 测试 | 60 | 调试探针信号 | 结构判断 |
| `tests/fixtures/helper.ts` | 夹具 | 53 | helper 夹具 | 结构判断 |
| `tests/helper-failure-settlement.spec.ts` | 测试 | 50 | 失败结算 | 结构判断 |
| `tests/protocol-disposal.spec.ts` | 测试 | 39 | 协议层释放 | 结构判断 |
| `tests/stream-timeout.spec.ts` | 测试 | 34 | 流超时 | 结构判断 |
| `tests/identifiers.spec.ts` | 测试 | 19 | 标识符生成 | 结构判断 |
| `tsdown.config.ts` | 配置 | 6 | 打包配置（helper 独立入口） | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 90 / 51 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 111 / 111 / — | 中英说明与配对索引 | 结构判断 |

### 19.2 `ssh/ssh-helper-runtime` — helper 运行时壳

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 39 | 远端 helper 的最小运行时入口（单文件，几乎无逻辑） | 结构判断 |
| `tests/fixtures/driver.ts` | 夹具 | 142 | 驱动 helper 的测试夹具 | 结构判断 |
| `tests/fixtures/direct-helper.ts` | 夹具 | 96 | 直连 helper 的夹具 | 结构判断 |
| `*.sh`（1 个）/ 两个无扩展名文件 | 脚本/资源 | — | 远端安装/启动脚本与产物占位（详见异常章节） | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 67 / 24 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 107 / 107 / — | 中英说明与配对索引 | 结构判断 |

### 19.3 `ssh/fs-ssh` — 远端文件系统

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 126 | 把文件系统能力代理到远端 helper（读写/列目录/元信息） | 结构判断 |
| `tests/provider.spec.ts` | 测试 | 241 | 提供方契约 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 52 / 30 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 81 / 81 / — | 中英说明与配对索引 | 结构判断 |

### 19.4 `ssh/sandbox-ssh` — 远端沙箱

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 33 | 声明远端沙箱能力（实现落在连接侧，故本包极薄） | 结构判断 |
| `tests/provider.spec.ts` | 测试 | 89 | 提供方契约 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 48 / 24 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 78 / 78 / — | 中英说明与配对索引 | 结构判断 |

### 19.5 `ssh/subprocess-ssh` — 远端子进程

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 345 | 把子进程执行代理到远端：命令拼装、流式输出、终止与等待 | 结构判断 |
| `tests/process-behavior.spec.ts` | 测试 | 295 | 进程行为 | 结构判断 |
| `tests/terminal-behavior.spec.ts` | 测试 | 211 | 终端行为（TTY/窗口尺寸） | 结构判断 |
| `tests/stream-wait-lifecycle.spec.ts` | 测试 | 190 | 流等待与生命周期 | 结构判断 |
| `tests/shell-discovery.spec.ts` | 测试 | 59 | 远端 shell 探测 | 结构判断 |
| `tests/lifecycle.spec.ts` | 测试 | 57 | 生命周期 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 50 / 27 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 87 / 87 / — | 中英说明与配对索引 | 结构判断 |

**组根**：`packages/ssh/README.md` 45 行、`README.zh.md` 45 行、`README.i18n.yaml`。

---

## 二十、`packages/storage`（79 个文件）

`storage` 组是「持久化」的四层：`storage` 定义后端接口与注册表（含一份共享契约测试），`storage-domain` 在其上做领域对象（带事件与版本），`storage-json` 与 `storage-sqlite` 是两个可替换后端。这一组的特点是**测试即规范**：`tests/contract.ts`（257 行）被后端包复用。

### 20.1 `storage/storage` — 后端 seam

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/backend.ts` | 源码 | 168 | 后端接口定义（读写、事务、迭代、能力） | 结构判断 |
| `src/index.ts` | 源码 | 98 | 服务入口：注册后端并暴露统一访问 | 结构判断 |
| `src/registry.ts` | 源码 | 62 | 后端注册表与按类型选择 | 结构判断 |
| `src/error.ts` | 源码 | 36 | 统一错误分类 | 结构判断 |
| `tests/contract.ts` | 测试 | 257 | 后端共享契约套件（被 json/sqlite 后端复用） | 结构判断 |
| `tests/registry.spec.ts` | 测试 | 89 | 注册表 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 40 / 18 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 141 / 141 / — | 中英说明与配对索引 | 结构判断 |

### 20.2 `storage/storage-domain` — 领域对象层

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/domain.ts` | 源码 | 409 | 领域对象：记录结构、变更集与版本推进 | 结构判断 |
| `src/index.ts` | 源码 | 237 | 服务入口：把领域操作接到后端 | 结构判断 |
| `src/spec.ts` | 源码 | 163 | 领域存储的规格声明（键空间与形状约束） | 结构判断 |
| `src/error.ts` | 源码 | 53 | 领域层错误 | 结构判断 |
| `src/events.ts` | 源码 | 48 | 变更事件的发出与订阅 | 结构判断 |
| `tests/domain.spec.ts` | 测试 | 543 | 领域行为 | 结构判断 |
| `tests/helpers/memory-backend.ts` | 测试 | 171 | 内存后端夹具 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 46 / 24 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 158 / 158 / — | 中英说明与配对索引 | 结构判断 |

### 20.3 `storage/storage-json` — JSON 文件后端

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/per-record-unit.ts` | 源码 | 379 | 按记录分文件的存储单元（细粒度写入与索引） | 结构判断 |
| `src/single-unit.ts` | 源码 | 161 | 单文件整体存储单元（适合小数据集） | 结构判断 |
| `src/format.ts` | 源码 | 128 | 落盘格式与版本字段 | 结构判断 |
| `src/index.ts` | 源码 | 119 | 后端装配与配置 | 结构判断 |
| `src/atomic.ts` | 源码 | 57 | 原子写入（临时文件 + 重命名） | 结构判断 |
| `tests/json-backend.spec.ts` | 测试 | 584 | 后端行为（复用共享契约） | 结构判断 |
| `tests/per-record-batch.spec.ts` | 测试 | 255 | 按记录存储的批量路径 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 45 / 24 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 155 / 155 / — | 中英说明与配对索引 | 结构判断 |

### 20.4 `storage/storage-sqlite` — SQLite 后端

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/unit.ts` | 源码 | 215 | 基于 SQLite 的存储单元（事务与查询） | 结构判断 |
| `src/index.ts` | 源码 | 182 | 后端装配：连接、迁移入口与配置 | 结构判断 |
| `src/schema.ts` | 源码 | 119 | 表结构与迁移版本 | 结构判断 |
| `tests/sqlite-backend.spec.ts` | 测试 | 499 | 后端行为（复用共享契约） | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | 多语言 | 5–6（8 个） | 插件名与描述翻译 | 结构判断 |
| `package.json` / `tsconfig.json` | 配置 | 45 / 24 | 包声明与 TS 配置 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | 文档 | 144 / 144 / — | 中英说明与配对索引 | 结构判断 |

**组根**：`packages/storage/README.md` 51 行、`README.zh.md` 51 行、`README.i18n.yaml`。

---

## 二十一、`packages/session` — 会话日志、持久化与投影（460 个文件）

会话域是整仓最重的二级组：一份会话日志的**格式定义与版本迁移链**（v0→v4 四个跳板包）、**持久化 seam 与 JSONL 实现**、**投影注册表与缓存**（前端读模型），外加标题生成、统计、遥测、工作目录、引用片段等增值能力。22 个包按「格式内核 → 迁移链 → 存储实现 → 投影/读模型 → 增值能力」排列；行数高度集中，`session-persistence-jsonl`（54 文件）与 `session-format-v3-to-v4`（43 文件）两包占本组近四成。

### 21.1 `session/message-quotes` — 用户消息引用（28 个文件）

浏览器侧能力：把用户选中的已发送消息文本做成引用块插回输入框，没有 Host 半边。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/client/index.ts` | 源码 | 53 | 浏览器插件入口：注册选区监听与浮层按钮 | 结构判断 |
| `src/client/quote-rule.ts` | 源码 | 29 | 判定哪些消息类型允许被引用（跳过系统与工具消息） | 结构判断 |
| `src/client/quote-text.ts` | 源码 | 29 | 把选区文本规整成引用块：裁剪首尾空白、折叠多行 | 结构判断 |
| `src/client/QuoteSelection.tsx` | 源码 | 28 | 选区旁的「引用」浮层按钮 | 结构判断 |
| `src/client/QuotedUserText.tsx` | 源码 | 12 | 输入框内已引用文本的展示样式 | 结构判断 |
| `src/client/locales.ts` | 源码 | 47 | 8 语界面文案表 | 结构判断 |
| `src/index.ts` | 源码 | 4 | 包入口，仅转发客户端导出 | 结构判断 |
| `src/css-modules.d.ts` | 配置 | 6 | CSS Modules 的类型声明 | 结构判断 |
| `tests/browser-plugin.client.spec.tsx` | 测试 | 93 | 浏览器插件注册、选区事件与按钮挂载 | 结构判断 |
| `tests/quote-rule` / `quote-text` / `quote-selection` / `quote-user-text` 相关 4 个 spec | 测试 | 20–122 | 分别覆盖规则判定、文本规整、选区浮层与展示组件 | 结构判断 |
| `tests/host-entry.client.spec.ts` | 测试 | 7 | 约束 Host 侧入口为空，防止服务端误引用 DOM 代码 | 结构判断 |
| `tsdown.config.ts` | 配置 | 3 | 浏览器产物打包配置 | 结构判断 |
| 包根 5 个（`package.json`、`tsconfig.json`、3 个 README）+ 8 个 locale + 1 个 `.css` | 配置/文档/多语言/资源 | — | 包声明、中英说明与样式资源 | 结构判断 |

### 21.2 `session/session-checkpoint-policy` — 检查点策略（17 个文件）

决定何时把当前会话写成检查点（崩溃恢复的落点），只提供策略，不实现存储。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 83 | 策略插件：按轮次边界与时间窗口触发检查点写入 | 结构判断 |
| `tests/session-checkpoint-policy.spec.ts` | 测试 | 270 | 触发条件、抑制条件与重复触发 | 结构判断 |
| `tests/crash-recovery.e2e.ts` | 测试 | 120 | 子进程崩溃后经检查点恢复会话 | 结构判断 |
| `tests/fixtures/crash-child.ts` | 测试 | 60 | 故意在写入中途崩溃的子进程夹具 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、中英说明与 8 语插件文案 | 结构判断 |

### 21.3 `session/session-format` — 日志格式内核（18 个文件）

会话日志的**磁盘格式与索引原语**：目录枚举、父链、文件名编解码、JSON 行读写。迁移包都依赖它。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/catalog.ts` | 源码 | 289 | 会话目录索引：扫描目录、解析元数据、维护当前会话指针 | 结构判断 |
| `src/chain.ts` | 源码 | 255 | 父链/分支链遍历：从子会话回溯祖先、判定分叉点 | 结构判断 |
| `src/json.ts` | 源码 | 94 | JSON 行解析与序列化，容忍截断行 | 结构判断 |
| `src/types.ts` | 源码 | 230 | 信封、事件、元数据的类型唯一定义处 | 结构判断 |
| `src/filename.ts` | 源码 | 32 | 会话文件名（时间戳 + id）的编码与还原 | 结构判断 |
| `src/context.ts` | 源码 | 27 | 读取「当前会话」上下文（id 与工作目录） | 结构判断 |
| `src/error.ts` | 源码 | 9 | 格式错误的类型化定义 | 结构判断 |
| `src/index.ts` | 源码 | 9 | 对外导出面 | 结构判断 |
| `tests/catalog.spec.ts` | 测试 | 368 | 目录扫描、元数据与当前指针 | 结构判断 |
| `tests/chain.spec.ts` | 测试 | 302 | 父链与分叉 | 结构判断 |
| `tests/json.spec.ts` | 测试 | 57 | 行解析与容错 | 结构判断 |
| `tests/filename.spec.ts` | 测试 | 31 | 文件名往返 | 结构判断 |
| `tsdown.config.ts` + 包根 5 个 | 配置/文档 | — | 打包配置、包声明与中英说明 | 结构判断 |

### 21.4 `session/session-format-catalog` — 格式目录注册（17 个文件）

把「当前 / 历史 / 子会话」三类目录读取器注册进格式内核，供投影与迁移共用。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/current.ts` | 源码 | 52 | 当前会话目录读取器 | 结构判断 |
| `src/generated.ts` | 源码 | 48 | 生成型（子代理/派生）会话目录读取器 | 结构判断 |
| `src/historical.ts` | 源码 | 21 | 历史会话目录读取器 | 结构判断 |
| `src/children.ts` | 源码 | 19 | 子会话枚举 | 结构判断 |
| `src/message-projections.ts` | 源码 | 7 | 声明本包提供的消息投影入口 | 结构判断 |
| `src/index.ts` | 源码 | 6 | 注册入口 | 结构判断 |
| `tests/catalog.spec.ts` | 测试 | 305 | 三类读取器的合并视图 | 结构判断 |
| `tests/developer-history.spec.ts` | 测试 | 121 | developer 消息历史投影 | 结构判断 |
| `tests/current` / `children` / `preset-migration` 3 个 spec | 测试 | 44–53 | 单读取器与预设迁移场景 | 结构判断 |
| `tsdown.config.ts` + 包根 5 个 | 配置/文档 | — | 打包配置与包说明 | 结构判断 |

### 21.5 `session/session-format-v0-to-v1` — 迁移 v0 → v1（21 个文件）

迁移链第一跳：旧结构重建为「带关系与校验」的 v1 信封。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/payload-validation.ts` | 源码 | 1072 | v0 载荷逐字段校验：允许/拒绝/需修补三类处置的判定表 | 结构判断 |
| `src/relationships.ts` | 源码 | 497 | 从旧记录重建父子关系与引用关系 | 结构判断 |
| `src/migration.ts` | 源码 | 448 | 迁移主流程：读旧日志、逐条转换、写新日志 | 结构判断 |
| `src/codec.ts` | 源码 | 322 | v0/v1 两侧的编解码 | 结构判断 |
| `src/validation.ts` | 源码 | 217 | 迁移结果的整体一致性校验 | 结构判断 |
| `src/dispositions.ts` | 源码 | 131 | 「保留 / 丢弃 / 修补」处置枚举与映射 | 结构判断 |
| `src/validation-helpers.ts` | 源码 | 33 | 校验用的小工具（字段存在性、类型收窄） | 结构判断 |
| `src/testing/restore.ts` / `src/testing/validation.ts` | 源码 | 81 / 65 | 供其他包复用的恢复与校验辅助 | 结构判断 |
| `src/index.ts` | 源码 | 13 | 导出迁移入口 | 结构判断 |
| `tests/validation.spec.ts` | 测试 | 840 | 载荷校验的正反例全集 | 结构判断 |
| `tests/relationships.spec.ts` | 测试 | 695 | 关系重建 | 结构判断 |
| `tests/migration.spec.ts` | 测试 | 415 | 端到端迁移 | 结构判断 |
| `tests/legacy.spec.ts` | 测试 | 296 | 真实遗留样本 | 结构判断 |
| `tests/codec.spec.ts` | 测试 | 263 | 编解码往返 | 结构判断 |
| `tsdown.config.ts` + 包根 5 个 | 配置/文档 | — | 打包配置与包说明 | 结构判断 |

**结构说明（>500 行）**：`payload-validation.ts`（1072 行）是**数据驱动的判定表**——按字段路径登记校验器与处置策略，新增字段只需加表项；`relationships.ts`（497 行）与 `migration.ts`（448 行）则是两段独立流水线，前者只读旧记录建索引，后者按索引改写。

### 21.6 `session/session-format-v1-to-v2` — 迁移 v1 → v2（15 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/migration.ts` | 源码 | 695 | v1→v2 主流程：内容分片与信封重排 | 结构判断 |
| `src/codec.ts` | 源码 | 252 | 两侧编解码 | 结构判断 |
| `src/validation.ts` | 源码 | 163 | 迁移后校验 | 结构判断 |
| `src/testing/validation.ts` | 源码 | 105 | 可复用的校验辅助 | 结构判断 |
| `src/dispositions.ts` | 源码 | 34 | 处置枚举 | 结构判断 |
| `src/index.ts` | 源码 | 7 | 导出入口 | 结构判断 |
| `tests/migration.spec.ts` | 测试 | 1251 | 迁移矩阵（真实样本 + 合成边界） | 结构判断 |
| `tests/validation.spec.ts` / `tests/codec.spec.ts` | 测试 | 444 / 294 | 校验与编解码 | 结构判断 |
| `tsdown.config.ts` + 包根 5 个 | 配置/文档 | — | 打包配置与包说明 | 结构判断 |

**结构说明（>500 行）**：`migration.ts`（695 行）按「读取 → 归一化 → 分片 → 重写信封 → 自校验」五段线性展开。

### 21.7 `session/session-format-v2-to-v3` — 迁移 v2 → v3（21 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/payload.ts` | 源码 | 371 | v3 载荷构造：消息体、工具调用与结果的规范化 | 结构判断 |
| `src/migration.ts` | 源码 | 173 | 迁移主流程 | 结构判断 |
| `src/validation.ts` | 源码 | 120 | 迁移后校验 | 结构判断 |
| `src/codec.ts` | 源码 | 94 | 两侧编解码 | 结构判断 |
| `src/references.ts` | 源码 | 51 | 引用（文件/消息）重写 | 结构判断 |
| `src/index.ts` | 源码 | 6 | 导出入口 | 结构判断 |
| `tests/canonical-envelopes.spec.ts` | 测试 | 520 | 规范信封快照 | 结构判断 |
| `tests/migration.spec.ts` | 测试 | 499 | 端到端迁移 | 结构判断 |
| `tests/content-admission.spec.ts` | 测试 | 224 | 内容准入（非法内容被拒） | 结构判断 |
| `tests/structural-regressions.spec.ts` | 测试 | 217 | 结构回归 | 结构判断 |
| `tests/canonical-regressions.spec.ts` | 测试 | 193 | 规范形态回归 | 结构判断 |
| `tests/combined-migration.spec.ts` | 测试 | 168 | 多跳迁移串联 | 结构判断 |
| `tests/admission.spec.ts` | 测试 | 139 | 准入规则 | 结构判断 |
| `tests/preset-migration.spec.ts` | 测试 | 76 | 预设字段迁移 | 结构判断 |
| `tests/catalog.ts` | 测试 | 21 | 测试用样本目录 | 结构判断 |
| `tsdown.config.ts` + 包根 5 个 | 配置/文档 | — | 打包配置与包说明 | 结构判断 |

### 21.8 `session/session-format-v3-to-v4` — 迁移 v3 → v4（43 个文件）

迁移链最后一跳，改动最碎：把 message 的 role/来源/关系拆成独立模块逐一转换。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/relationships.ts` | 源码 | 385 | 消息关系（父子、工具配对、分支）的 v4 重建 | 结构判断 |
| `src/migration.ts` | 源码 | 175 | 迁移主流程编排 | 结构判断 |
| `src/validation.ts` | 源码 | 157 | 迁移后校验 | 结构判断 |
| `src/developer.ts` | 源码 | 113 | developer 角色的 v4 语义转换 | 结构判断 |
| `src/tool-role.ts` | 源码 | 112 | 工具消息角色的拆分与重标 | 结构判断 |
| `src/sources.ts` | 源码 | 106 | 消息来源（用户/模型/系统注入）标注 | 结构判断 |
| `src/content.ts` | 源码 | 95 | 内容块形态转换 | 结构判断 |
| `src/facts.ts` | 源码 | 93 | 迁移过程中提取的派生事实 | 结构判断 |
| `src/extension-identities.ts` | 源码 | 79 | 扩展身份（插件来源）映射 | 结构判断 |
| `src/retired-syntax.ts` | 源码 | 75 | 已废弃语法的识别与拒绝 | 结构判断 |
| `src/codec.ts` | 源码 | 75 | 两侧编解码 | 结构判断 |
| `src/references.ts` | 源码 | 68 | 引用重写 | 结构判断 |
| `src/system-message.ts` | 源码 | 64 | 系统消息的 v4 归一化 | 结构判断 |
| `src/message-sources.ts` | 源码 | 42 | 来源枚举与优先级 | 结构判断 |
| `src/fork-result.ts` | 源码 | 40 | 分叉结果的载荷 | 结构判断 |
| `src/testing/validation.ts` | 源码 | 15 | 测试用校验辅助 | 结构判断 |
| `src/index.ts` | 源码 | 8 | 导出入口 | 结构判断 |
| `tests/tool-role.spec.ts` | 测试 | 458 | 工具角色转换 | 结构判断 |
| `tests/developer.spec.ts` | 测试 | 302 | developer 语义 | 结构判断 |
| `tests/codec.spec.ts` | 测试 | 221 | 编解码往返 | 结构判断 |
| `tests/migration.spec.ts` | 测试 | 220 | 端到端迁移 | 结构判断 |
| `tests/relationships.spec.ts` | 测试 | 218 | 关系重建 | 结构判断 |
| `tests/content.spec.ts` | 测试 | 208 | 内容块转换 | 结构判断 |
| `tests/validation.spec.ts` | 测试 | 188 | 校验 | 结构判断 |
| `tests/catalog-completion.spec.ts` | 测试 | 179 | 目录补全 | 结构判断 |
| `tests/interrupted-turn.spec.ts` | 测试 | 160 | 中断轮次的迁移 | 结构判断 |
| `tests/fork.spec.ts` | 测试 | 154 | 分叉 | 结构判断 |
| `tests/corpus.spec.ts` | 测试 | 118 | 语料级批量样本 | 结构判断 |
| `tests/developer-relationships.spec.ts` / `tests/retired-content.spec.ts` | 测试 | 112 / 112 | 关系与废弃内容 | 结构判断 |
| `tests/canonical.spec.ts` / `tests/sources.spec.ts` | 测试 | 111 / 102 | 规范形态与来源标注 | 结构判断 |
| `tests/message-sources.spec.ts` / `tests/system-message.spec.ts` | 测试 | 61 / 59 | 来源枚举、系统消息 | 结构判断 |
| `tests/attribution.spec.ts` / `tests/retired-syntax.spec.ts` / `tests/open-vocabulary.spec.ts` | 测试 | 48 / 41 / 41 | 归因、废弃语法、开放词表 | 结构判断 |
| `tsdown.config.ts` + 包根 5 个 | 配置/文档 | — | 打包配置与包说明 | 结构判断 |

### 21.9 `session/session-log-deepseek` — 会话日志上报（18 个文件）

把会话日志与用户反馈打包上传到 DeepSeek 侧，属于出站网络能力。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 291 | 上传编排：选取会话、脱敏、打包、重试与失败上报 | 结构判断 |
| `src/types.ts` | 源码 | 105 | 上传载荷与反馈结构 | 结构判断 |
| `tests/upload.spec.ts` | 测试 | 833 | 上传路径、分片、失败与重试 | 结构判断 |
| `tests/feedback-composition.spec.ts` | 测试 | 208 | 反馈流程的组合装配 | 结构判断 |
| `tests/config.spec.ts` | 测试 | 40 | 配置校验 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、中英说明与 8 语文案 | 结构判断 |

### 21.10 `session/session-persistence` — 持久化 seam（13 个文件）

定义「会话存储」的抽象：句柄、修订号、错误语义与**共享契约测试**，具体后端另包实现。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 213 | `ctx.sessionPersistence` 服务与后端注册 | 结构判断 |
| `src/storage-contract.ts` | 源码 | 151 | 后端契约：必须满足的读写/并发/错误语义 | 结构判断 |
| `src/errors.ts` | 源码 | 137 | 持久化错误分类（冲突、损坏、租约失效） | 结构判断 |
| `src/handle.ts` | 源码 | 117 | 会话句柄：id、路径与生命周期 | 结构判断 |
| `src/revision.ts` | 源码 | 18 | 修订号生成与比较 | 结构判断 |
| `tests/contract.ts` | 测试 | 614 | 各后端复用的契约测试主体 | 结构判断 |
| `tests/live-write-contract.ts` | 测试 | 311 | 并发写入下的契约 | 结构判断 |
| `tests/storage-contract.spec.ts` | 测试 | 322 | 契约自检（对内存后端） | 结构判断 |
| 包根 5 个 | 配置/文档 | — | 包声明与中英说明 | 结构判断 |

### 21.11 `session/session-persistence-jsonl` — JSONL 持久化实现（54 个文件）

本组最重的实现包：以 JSONL + 代际目录存储会话，含跨进程写租约、zstd 压缩、迁移 worker 与 Windows 文件语义。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 1839 | 插件主体：存储服务装配、追加写、读取、代际切换与迁移编排 | 结构判断 |
| `src/generation.ts` | 源码 | 1059 | 代际目录：创建、切换、清理与崩溃后归并 | 结构判断 |
| `src/storage.ts` | 源码 | 571 | 存储单元：追加、按偏移读取、截断修复 | 结构判断 |
| `src/format.ts` | 源码 | 538 | 磁盘格式：文件头、记录边界、校验与版本字段 | 结构判断 |
| `src/win32.ts` | 源码 | 208 | Windows 文件语义适配（重命名、句柄占用、目录刷写） | 结构判断 |
| `src/migration-verifier.ts` | 源码 | 198 | 迁移后逐条比对校验 | 结构判断 |
| `src/lease.ts` | 源码 | 135 | 跨进程写租约（文件锁 + 心跳） | 结构判断 |
| `src/zstd-private-decoder.ts` | 源码 | 178 | 私有帧格式解码 | 结构判断 |
| `src/zstd.ts` | 源码 | 156 | zstd 压缩封装与帧选择 | 结构判断 |
| `src/catalog-migration.ts` | 源码 | 92 | 旧目录结构迁移 | 结构判断 |
| `src/worker.ts` | 源码 | 56 | 迁移 worker 子进程入口 | 结构判断 |
| `src/zstd-public-decoder.ts` | 源码 | 40 | 标准 zstd 帧解码 | 结构判断 |
| `src/testing/generation.ts` | 源码 | 16 | 测试用代际构造辅助 | 结构判断 |
| `tests/jsonl.spec.ts` | 测试 | 2925 | 全册最大用例：格式、追加、截断、损坏修复的完整矩阵 | 结构判断 |
| `tests/generation.spec.ts` | 测试 | 1652 | 代际切换与崩溃恢复 | 结构判断 |
| `tests/zstd.spec.ts` | 测试 | 884 | 压缩/解压与帧兼容 | 结构判断 |
| `tests/migration-refusal.spec.ts` | 测试 | 527 | 拒绝迁移的判据 | 结构判断 |
| `tests/catalog-migration.spec.ts` | 测试 | 462 | 目录迁移 | 结构判断 |
| `tests/lease.spec.ts` | 测试 | 434 | 租约获取、续期、抢占 | 结构判断 |
| `tests/multi-edge-publication.spec.ts` | 测试 | 301 | 多入口发布的可见性顺序 | 结构判断 |
| `tests/v2-system-migration.spec.ts` | 测试 | 306 | v2 系统消息迁移 | 结构判断 |
| `tests/win32.spec.ts` | 测试 | 288 | Windows 语义 | 结构判断 |
| `tests/migration-verifier.spec.ts` | 测试 | 273 | 校验器 | 结构判断 |
| `tests/content-admission.spec.ts` | 测试 | 247 | 内容准入 | 结构判断 |
| `tests/v2-ptc-migration.spec.ts` | 测试 | 216 | PTC 记录迁移 | 结构判断 |
| `tests/teardown-loader.e2e.ts` / `tests/lease.two-process.e2e.ts` / `tests/built-migration-worker.e2e.ts` | 测试 | 142 / 69 / 92 | 卸载、双进程租约、构建产物 worker | 结构判断 |
| `tests/v3-restart-migration.spec.ts` / `tests/current-event-admission.spec.ts` | 测试 | 99 / 88 | 重启迁移、当前事件准入 | 结构判断 |
| `tests/native-developer-admission` / `native-source-admission` / `retired-content-admission` 3 个 spec | 测试 | 114 / 80 / 57 | 三类内容准入边界 | 结构判断 |
| `tests/zstd.compat.spec.ts` / `tests/migration-verifier-real.spec.ts` / `tests/load-path.spec.ts` | 测试 | 38 / 37 / 15 | 兼容性、真实样本校验、加载路径 | 结构判断 |
| `tests/catalog-migration.perf.ts` | 测试 | 77 | 目录迁移性能基线 | 结构判断 |
| `tests/fixtures/lease-holder.mjs` | 夹具 | 28 | 占住租约的外部进程 | 结构判断 |
| `tsdown.config.ts` | 配置 | 28 | 打包配置（worker 单独产物） | 结构判断 |
| 包根与多语言 13 个 + 1 个 `.jsonl` 夹具 | 配置/文档/多语言/夹具 | — | 包声明、中英说明、8 语文案与样例日志 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（1839 行）分四层——服务装配与配置、写入路径（租约 → 追加 → 校验 → 刷盘）、读取路径（目录 → 代际 → 记录）、迁移编排（检测 → worker → 校验 → 切换）。`generation.ts`（1059 行）与 `format.ts`（538 行）分别只关心「目录代际」与「单文件字节布局」，两者通过 `storage.ts` 的偏移读写衔接。

### 21.12 `session/session-projection` — 投影注册表（24 个文件）

前端读模型的注册中心：各插件把自己的投影（统计、大纲、标题…）注册进来，按会话增量推送。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 958 | 投影注册表：注册/反注册、按键分片、增量计算与订阅广播 | 结构判断 |
| `src/types.ts` | 源码 | 73 | 投影键、载荷与注册项类型 | 结构判断 |
| `tests/registry.spec.ts` | 测试 | 1055 | 注册、覆盖、撤销与广播顺序 | 结构判断 |
| `tests/compatibility.spec.ts` | 测试 | 343 | 旧投影插件的兼容路径 | 结构判断 |
| `tests/summary.spec.ts` | 测试 | 218 | 汇总投影 | 结构判断 |
| `tests/registration-reader.spec.ts` | 测试 | 215 | 注册信息读取 | 结构判断 |
| `tests/registration.type-test.ts` | 测试 | 74 | 类型层约束（编译期） | 结构判断 |
| `tests/loader-compatibility.e2e.ts` / `tests/fixtures/driver.ts` / `tests/fixtures/legacy-plugin.ts` | 测试 | 23 / 29 / 49 | Loader 组合下的旧插件兼容 | 结构判断 |
| 包根与多语言 14 个（含 1 个 `.yml` 组合夹具） | 配置/文档/多语言/夹具 | — | 包声明、中英说明、8 语文案与组合配置 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（958 行）围绕「键 → 注册者集合 → 增量窗口 → 订阅者」四张表组织；投影本体不在此包，此包只做调度与失效传播。

### 21.13 `session/session-projection-cache` — 投影缓存（22 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 472 | 按会话与投影键缓存计算结果，事件驱动失效 | 结构判断 |
| `src/spec.ts` | 源码 | 107 | 缓存策略声明（TTL、容量、失效条件） | 结构判断 |
| `tests/cache.spec.ts` | 测试 | 950 | 命中/失效/容量淘汰 | 结构判断 |
| `tests/fixtures.spec.ts` | 测试 | 352 | 夹具驱动的缓存场景 | 结构判断 |
| 包根与多语言 18 个（15 个 JSON） | 配置/文档/多语言/夹具 | — | 包声明、说明、8 语文案与缓存样例 | 结构判断 |

### 21.14 `session/session-stats` — 会话统计投影（19 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/projection.ts` | 源码 | 207 | 统计投影：消息数、token、工具调用与耗时聚合 | 结构判断 |
| `src/types.ts` | 源码 | 52 | 统计载荷类型 | 结构判断 |
| `src/index.ts` | 源码 | 30 | 插件入口，向投影注册表登记 | 结构判断 |
| `src/client.ts` | 源码 | 10 | 浏览器侧类型再导出 | 结构判断 |
| `tests/projection.spec.ts` / `tests/loader-composition.spec.ts` | 测试 | 362 / 86 | 聚合正确性与 Loader 装配 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

### 21.15 `session/session-telemetry` — 会话遥测 seam（9 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/coordinator.ts` | 源码 | 305 | 遥测协调器：采集点登记、采样与批量投递 | 结构判断 |
| `src/index.ts` | 源码 | 174 | `ctx.sessionTelemetry` 服务与配置 | 结构判断 |
| `tests/telemetry.spec.ts` | 测试 | 779 | 采集、采样、脱敏与投递 | 结构判断 |
| `tests/redact.spec.ts` | 测试 | 129 | 敏感字段脱敏规则 | 结构判断 |
| 包根 5 个 | 配置/文档 | — | 包声明与中英说明 | 结构判断 |

### 21.16 `session/session-telemetry-otel` — 遥测 OTel 实现（20 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 278 | 把协调器的批次翻译成 OTel 日志/指标并导出 | 结构判断 |
| `tests/otel.spec.ts` | 测试 | 862 | 属性映射、资源标签与导出载荷 | 结构判断 |
| `tests/loader-composition.e2e.ts` | 测试 | 183 | 经 Loader 组合对回环收集器 | 结构判断 |
| `tests/egress.spec.ts` | 测试 | 134 | 出站限制与失败处理 | 结构判断 |
| `tests/fixtures/driver.ts` / `telemetry-redact-rule.ts` | 测试 | 67 / 29 | 回环收集器驱动与脱敏规则夹具 | 结构判断 |
| 包根与多语言 14 个（含 1 个 `.yml`） | 配置/文档/多语言/夹具 | — | 包声明、说明、8 语文案与组合配置 | 结构判断 |

### 21.17 `session/session-title` — 会话标题（24 个文件）

标题的**生成与持久化 seam**：优先用首条提示的启发式标题，失败时回落到模型生成。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 855 | 标题服务：初始化时机、重命名、持久化、生成器选择与失败回落 | 结构判断 |
| `src/types.ts` | 源码 | 88 | 标题提供方与结果类型 | 结构判断 |
| `src/normalize.ts` | 源码 | 74 | 标题文本规整（截断、去标点、禁空） | 结构判断 |
| `src/client.ts` | 源码 | 10 | 浏览器侧类型再导出 | 结构判断 |
| `tests/provider.spec.ts` | 测试 | 596 | 提供方选择与失败回落 | 结构判断 |
| `tests/service-contracts.spec.ts` | 测试 | 466 | 服务契约 | 结构判断 |
| `tests/session-title.spec.ts` | 测试 | 192 | 主流程 | 结构判断 |
| `tests/rename.spec.ts` | 测试 | 195 | 手动重命名 | 结构判断 |
| `tests/initialization.spec.ts` / `tests/projection.spec.ts` / `tests/persistence.spec.ts` | 测试 | 179 / 130 / 85 | 初始化、投影、持久化 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（855 行）把「何时生成」「由谁生成」「生成失败怎么办」「用户改名后是否覆盖」四类决策集中在一处，其余模块只提供纯函数。

### 21.18 `session/session-title-first-prompt-llm` — 首条提示标题（17 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 167 | 用首条用户提示经模型生成短标题，带超时与降级 | 结构判断 |
| `tests/provider.spec.ts` | 测试 | 269 | 提示构造、输出截断与失败降级 | 结构判断 |
| `tests/loader-composition.spec.ts` | 测试 | 216 | Loader 装配 | 结构判断 |
| `tests/provider.e2e.ts` | 测试 | 63 | 真实模型的端到端 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

### 21.19 `session/session-title-llm` — 模型标题生成（7 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 291 | 通用标题提供方：拼提示、限长、解析并清洗模型输出 | 结构判断 |
| `tests/llm.spec.ts` | 测试 | 568 | 提示形态、异常输出与多语言标题 | 结构判断 |
| 包根 5 个 | 配置/文档 | — | 包声明与中英说明 | 结构判断 |

### 21.20 `session/session-turn-outline` — 轮次大纲投影（19 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/projection.ts` | 源码 | 138 | 把每轮的用户意图与产出压缩成可跳转的大纲项 | 结构判断 |
| `src/types.ts` | 源码 | 51 | 大纲项类型 | 结构判断 |
| `src/index.ts` | 源码 | 30 | 插件入口，登记投影 | 结构判断 |
| `src/client.ts` | 源码 | 10 | 浏览器侧类型再导出 | 结构判断 |
| `tests/projection.spec.ts` / `tests/loader-composition.spec.ts` | 测试 | 277 / 98 | 大纲生成与装配 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

### 21.21 `session/tool-working-directory` — 工作目录工具（14 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 43 | 面向模型的工具：查询或切换当前会话工作目录 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

### 21.22 `session/working-directory` — 工作目录 seam（17 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 256 | 工作目录服务：路径校验、切换事件、越界拒绝 | 结构判断 |
| `src/error.ts` | 源码 | 34 | 目录错误的类型化定义 | 结构判断 |
| `tests/working-directory.spec.ts` | 测试 | 378 | 切换、校验与事件 | 结构判断 |
| `tests/admission.spec.ts` | 测试 | 76 | 路径准入 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

**组根**：`packages/session/README.md`、`README.zh.md`、`README.i18n.yaml`（3 个）。

---

## 二十二、`packages/session-query` — 会话检索与导出（82 个文件）

会话的**只读查询面**：把磁盘上的会话日志抽成可检索文档、维护全文索引（含 SQLite 加速后端），并把会话导出成可分享的归档或 Markdown。三个实现包分别承担「查询内核」「SQLite 索引」「导出（Host + 浏览器）」。

### 22.1 `session-query/session-query` — 检索内核（22 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 420 | `ctx.sessionQuery` 服务：索引/搜索/分页的统一入口与后端委托 | 结构判断 |
| `src/corpus.ts` | 源码 | 323 | 语料装配：把会话日志转换成待索引文档集合 | 结构判断 |
| `src/types.ts` | 源码 | 290 | 查询 DSL、命中项与分页类型 | 结构判断 |
| `src/tracing.ts` | 源码 | 254 | 检索链路埋点与耗时分解 | 结构判断 |
| `src/filters.ts` | 源码 | 243 | 过滤条件编译（时间、角色、工具、目录） | 结构判断 |
| `src/observation.ts` | 源码 | 395 | 观测记录：查询模式与结果的匿名采样 | 结构判断 |
| `src/extraction.ts` | 源码 | 87 | 从消息中抽取可检索文本 | 结构判断 |
| `src/documents.ts` | 源码 | 75 | 文档模型与字段投影 | 结构判断 |
| `src/cold-read.ts` | 源码 | 57 | 冷读取：索引缺失时直接扫日志 | 结构判断 |
| `src/config.ts` | 源码 | 57 | 索引位置、批量大小等配置 | 结构判断 |
| `src/sources.ts` | 源码 | 25 | 数据源枚举（当前/历史/子会话） | 结构判断 |
| `src/cursor.ts` | 源码 | 15 | 分页游标编解码 | 结构判断 |
| `tests/session-query.spec.ts` | 测试 | 1334 | 检索主行为与边界 | 结构判断 |
| `tests/observation.spec.ts` | 测试 | 859 | 观测采样的形态与脱敏 | 结构判断 |
| `tests/tracing.spec.ts` | 测试 | 523 | 埋点分段 | 结构判断 |
| `tests/search-helpers.spec.ts` | 测试 | 316 | 查询辅助（高亮、排序、分页） | 结构判断 |
| `tests/test-service.ts` | 测试 | 29 | 测试用内存后端 | 结构判断 |
| 包根 5 个 | 配置/文档 | — | 包声明与中英说明（无 locale，纯服务包） | 结构判断 |

### 22.2 `session-query/session-query-sqlite` — SQLite 索引后端（19 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 1131 | 后端主体：建库、增量写索引、查询编译与结果回填 | 结构判断 |
| `src/query.ts` | 源码 | 477 | 把查询 DSL 编译成 SQL（含 FTS 与排序） | 结构判断 |
| `src/schema.ts` | 源码 | 173 | 表结构、FTS 虚表与索引定义 | 结构判断 |
| `tests/sqlite.spec.ts` | 测试 | 1880 | 建库、增量同步、查询与并发 | 结构判断 |
| `tests/query.spec.ts` | 测试 | 262 | SQL 编译快照 | 结构判断 |
| `tests/load-path.e2e.ts` | 测试 | 70 | 真实加载路径 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

**结构说明（>500 行）**：`src/index.ts`（1131 行）分「生命周期（打开/迁移/关闭）」「写入（文档落库、FTS 同步）」「读取（编译查询、游标分页）」三段；SQL 生成完全外置在 `query.ts`，便于快照测试。

### 22.3 `session-query/session-log-export` — 会话导出（38 个文件）

唯一的**双半边**包：Host 侧提供归档与 Markdown 生成及路由，浏览器侧提供导出对话框与复制控制器。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/archive.ts` | 源码 | 616 | 归档打包：选会话、收集附件、生成可下载包 | 结构判断 |
| `src/markdown.ts` | 源码 | 367 | 会话转 Markdown：角色分节、工具调用折叠、附件链接 | 结构判断 |
| `src/index.ts` | 源码 | 234 | Host 侧插件入口：注册导出能力与配置 | 结构判断 |
| `src/routes.ts` | 源码 | 17 | 导出路由路径常量（Host 与浏览器共用） | 结构判断 |
| `src/client/index.ts` | 源码 | 105 | 浏览器插件入口：挂载对话框与命令 | 结构判断 |
| `src/client/controller.ts` | 源码 | 139 | 导出流程控制器：请求、进度、下载 | 结构判断 |
| `src/client/copy-controller.ts` | 源码 | 201 | 复制为 Markdown 的流程与失败提示 | 结构判断 |
| `src/client/Dialog.tsx` | 源码 | 55 | 导出选项对话框 | 结构判断 |
| `src/client/CopyToast.tsx` | 源码 | 40 | 复制结果轻提示 | 结构判断 |
| `src/client/locales.ts` | 源码 | 149 | 8 语界面文案 | 结构判断 |
| `tests/archive.host.spec.ts` | 测试 | 990 | 归档内容、附件与边界 | 结构判断 |
| `tests/markdown.host.spec.ts` | 测试 | 692 | Markdown 输出快照 | 结构判断 |
| `tests/copy-controller.client.spec.ts` | 测试 | 369 | 复制流程 | 结构判断 |
| `tests/markdown-route.host.spec.ts` / `tests/controller.client.spec.ts` | 测试 | 242 / 193 | 路由与控制器 | 结构判断 |
| `tests/client-apply.client.spec.tsx` / `tests/dialog.client.spec.tsx` / `tests/root-overlay.client.spec.tsx` | 测试 | 179 / 134 / 90 | 客户端装配、对话框、根浮层 | 结构判断 |
| `tests/route.host.spec.ts` / `tests/loader-composition.host.spec.ts` / `tests/copy-toast.client.spec.tsx` | 测试 | 107 / 72 / 72 | 路由注册、组合装配、提示组件 | 结构判断 |
| `tests/command.host.spec.ts` | 测试 | 36 | 命令注册 | 结构判断 |
| `tsdown.config.ts` | 配置 | 7 | 双产物（host/client）打包配置 | 结构判断 |
| 包根与多语言 13 个（含 `tsconfig.client.json`、`tsconfig.host.json`） | 配置/文档/多语言 | — | 包声明、双 tsconfig、说明与 8 语文案 | 结构判断 |

**组根**：`packages/session-query/README.md`、`README.zh.md`、`README.i18n.yaml`（3 个）。

---

## 二十三、`packages/subagent` — 子代理（268 个文件）

子代理能力域：`subagent` 是**调度内核**（创建、深度限制、父子消息、结构化结果、生命周期），其余包是**运行载体的实现**（进程内 fork、进程内 spawn、DSH SDK、ACP、Claude Code、Codex），`tool-subagent*` 则面向模型暴露「派活」与「管控」工具。测试体量极大（`continuation.spec.ts` 4191 行为全册最大单文件），因为这些包要覆盖真实外部 CLI 的握手与异常。

### 23.1 `subagent/subagent` — 子代理调度内核（70 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/manager.ts` | 源码 | 1359 | 子代理管理器：创建/恢复/取消、并发上限、父子结算与错误传播 | 结构判断 |
| `src/index.ts` | 源码 | 604 | 插件入口与服务装配：注册运行载体、深度策略与工具面 | 结构判断 |
| `src/types.ts` | 源码 | 364 | 子代理描述、运行状态与结果的类型定义 | 结构判断 |
| `src/child-agent.ts` | 源码 | 280 | 子代理句柄：转发消息、等待结束、收集产物 | 结构判断 |
| `src/descriptor.ts` | 源码 | 269 | 子代理描述符（模型、预设、工具白名单）的解析与校验 | 结构判断 |
| `src/out-of-process.ts` | 源码 | 217 | 进程外载体的公共适配层 | 结构判断 |
| `src/catalog.ts` | 源码 | 194 | 运行载体目录与选择策略 | 结构判断 |
| `src/activation.ts` | 源码 | 184 | 激活策略：何时自动派发、何时需显式请求 | 结构判断 |
| `src/projection.ts` | 源码 | 184 | 子代理列表投影（前端可见的树） | 结构判断 |
| `src/continuation-messages.ts` | 源码 | 176 | 续跑消息的构造与继承规则 | 结构判断 |
| `src/list-children.ts` | 源码 | 168 | 列出某会话的子代理 | 结构判断 |
| `src/structured.ts` | 源码 | 155 | 结构化结果：schema 校验与提取 | 结构判断 |
| `src/control.ts` | 源码 | 103 | 管控指令（取消、等待、查询）的分发 | 结构判断 |
| `src/control-types.ts` | 源码 | 127 | 管控指令与回执类型 | 结构判断 |
| `src/lifecycle.ts` | 源码 | 116 | 生命周期状态机与事件 | 结构判断 |
| `src/names.ts` | 源码 | 113 | 子代理命名（可读名与唯一化） | 结构判断 |
| `src/projection-types.ts` | 源码 | 109 | 投影载荷类型 | 结构判断 |
| `src/archive-admission.ts` | 源码 | 84 | 归档准入：哪些会话可被子代理继承 | 结构判断 |
| `src/assistant-output.ts` | 源码 | 75 | 子代理最终输出的整形 | 结构判断 |
| `src/depth.ts` | 源码 | 51 | 嵌套深度计算与上限 | 结构判断 |
| `src/error.ts` | 源码 | 15 | 错误类型 | 结构判断 |
| `src/client.ts` | 源码 | 8 | 浏览器侧类型再导出 | 结构判断 |
| `tests/continuation.spec.ts` | 测试 | 4191 | **全册最大用例**：续跑的消息继承、上下文压缩与多轮交互矩阵 | 结构判断 |
| `tests/service.spec.ts` | 测试 | 726 | 服务契约与错误路径 | 结构判断 |
| `tests/structured.spec.ts` | 测试 | 982 | 结构化结果校验 | 结构判断 |
| `tests/list-children.spec.ts` / `tests/sibling-messages.spec.ts` | 测试 | 486 / 471 | 子代理枚举、兄弟消息可见性 | 结构判断 |
| `tests/external-activation.spec.ts` | 测试 | 431 | 外部触发的激活 | 结构判断 |
| `tests/continuation-presets.spec.ts` / `tests/activation-policy.spec.ts` | 测试 | 352 / 322 | 续跑预设、激活策略 | 结构判断 |
| `tests/control.spec.ts` | 测试 | 318 | 管控指令 | 结构判断 |
| `tests/continuation-inheritance.spec.ts` / `tests/archive-admission.spec.ts` | 测试 | 311 / 288 | 继承规则、归档准入 | 结构判断 |
| `tests/parked-wait.spec.ts` | 测试 | 280 | 父代理挂起等待子代理 | 结构判断 |
| `tests/catalog.spec.ts` | 测试 | 307 | 载体目录 | 结构判断 |
| `tests/` 其余 13 个 spec（`out-of-process`、`external-lifecycle`、`timing-projection`、`schedule-tools`、`working-directory`、`continuation-messages`、`continuation-messages-adapter`、`parent-result`、`run-settlement`、`factory-settlement`、`activation-presets`、`child-agent`、`assistant-output`） | 测试 | 66–169 | 各单点行为 | 结构判断 |
| `tests/` 辅助 6 个（`external-activation-helpers`、`local-activation`、`manager-internals`、`persistence-helpers`、`working-directory-fixture`、`test-session-query`） | 测试 | 14–79 | 测试脚手架与夹具 | 结构判断 |
| `tests/fixtures/activation-presets/plugins/preset-tool.js` | 夹具 | 20 | 预设工具的组合夹具 | 结构判断 |
| 包根与多语言 15 个（含 2 个 `.yml`） | 配置/文档/多语言/夹具 | — | 包声明、说明、8 语文案与组合配置 | 结构判断 |

**结构说明（>500 行）**：`manager.ts`（1359 行）以「句柄表 + 深度树 + 结算队列」三张结构组织，所有载体都通过同一组钩子接入；`index.ts`（604 行）只做装配与配置解析，不含调度逻辑。

### 23.2 `subagent/subagent-acp` — ACP 载体（23 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/run.ts` | 源码 | 618 | ACP 会话驱动：握手、能力协商、消息流与终止 | 结构判断 |
| `src/index.ts` | 源码 | 129 | 载注册：把 ACP 驱动挂到子代理目录 | 结构判断 |
| `tests/subagent-acp.spec.ts` | 测试 | 1588 | 协议矩阵与异常路径（用 mock ACP 服务端） | 结构判断 |
| `tests/mock-acp-server.ts` | 测试 | 298 | 进程内 mock ACP 服务端 | 结构判断 |
| `tests/subagent-acp.e2e.ts` / `tests/loader-composition.e2e.ts` | 测试 | 126 / 104 | 端到端与组合装配 | 结构判断 |
| `tests/fixtures/loader/driver.ts` / `mock-delegating-llm.ts` | 测试 | 26 / 44 | Loader 驱动与假模型 | 结构判断 |
| 包根与多语言 15 个（含 2 个 `.yml`） | 配置/文档/多语言 | — | 包声明、说明、8 语文案 | 结构判断 |

### 23.3 `subagent/subagent-claude-code` — Claude Code CLI 载体（26 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/run.ts` | 源码 | 587 | 驱动 `claude` CLI：参数拼装、流式 JSON 解析、退出结算 | 结构判断 |
| `src/process.ts` | 源码 | 159 | 子进程生命周期与环境变量隔离 | 结构判断 |
| `src/index.ts` | 源码 | 147 | 载体注册与配置 | 结构判断 |
| `tests/subagent-claude-code.spec.ts` | 测试 | 1762 | 参数、输出解析、错误与中断 | 结构判断 |
| `tests/real-product.spec.ts` | 测试 | 575 | 真实产品二进制（条件跳过） | 结构判断 |
| `tests/messages-fixture.ts` | 测试 | 224 | 流式消息样本 | 结构判断 |
| `tests/real-deepseek.e2e.ts` / `tests/loader-composition.e2e.ts` | 测试 | 155 / 105 | 真实模型与组合装配 | 结构判断 |
| `tests/fixtures/loader/driver.ts` / `fixture.ts` | 测试 | 83 / 7 | Loader 驱动 | 结构判断 |
| 包根与多语言 16 个（含 2 个 `.yml`、1 个 `.svg`） | 配置/文档/多语言/资源 | — | 包声明、说明、8 语文案与图标 | 结构判断 |

### 23.4 `subagent/subagent-codex` — Codex CLI 载体（29 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/wire.ts` | 源码 | 711 | Responses 线协议：请求构造、SSE 解析、事件到消息的翻译 | 结构判断 |
| `src/run.ts` | 源码 | 439 | 驱动 `codex` CLI 与会话结算 | 结构判断 |
| `src/index.ts` | 源码 | 130 | 载体注册与配置 | 结构判断 |
| `tests/subagent-codex.spec.ts` | 测试 | 2333 | 线协议与驱动的完整矩阵 | 结构判断 |
| `tests/real-product.spec.ts` / `tests/real-product-cleanup.spec.ts` | 测试 | 533 / 157 | 真实二进制与清理 | 结构判断 |
| `tests/responses-fixture.ts` | 测试 | 328 | SSE 事件样本 | 结构判断 |
| `tests/deepseek-responses-bridge.ts` | 测试 | 181 | DeepSeek 与 Responses 协议的桥 | 结构判断 |
| `tests/real-deepseek.e2e.ts` / `tests/loader-composition.e2e.ts` | 测试 | 146 / 90 | 真实模型与装配 | 结构判断 |
| `tests/fixtures/loader/driver.ts` / `fixture.ts`；`tests/real-product-cleanup.ts` | 测试 | 77 / 22 / 43 | Loader 驱动与清理辅助 | 结构判断 |
| 包根与多语言 16 个（含 2 个 `.yml`、1 个 `.svg`） | 配置/文档/多语言/资源 | — | 包声明、说明、8 语文案与图标 | 结构判断 |

### 23.5 `subagent/subagent-dsh-sdk` — DSH SDK 载体（25 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/run.ts` | 源码 | 376 | 用 DSH SDK 在进程内起一个子会话并驱动其完成 | 结构判断 |
| `src/index.ts` | 源码 | 185 | 载体注册与装配 | 结构判断 |
| `tests/subagent-dsh-sdk.spec.ts` | 测试 | 993 | 驱动行为与失败路径 | 结构判断 |
| `tests/loader-composition.e2e.ts` / `tests/nested-delegation.e2e.ts` | 测试 | 200 / 98 | 组合装配与嵌套派发 | 结构判断 |
| `tests/fixtures/loader/` 5 个（driver、child-mock-llm、mock-delegating-llm、nested-mock-llm、scoped-tool-subagent） | 测试 | 26–73 | 多层假模型与受限工具夹具 | 结构判断 |
| 包根与多语言 15 个（含 2 个 `.yml`） | 配置/文档/多语言 | — | 包声明、说明、8 语文案 | 结构判断 |

### 23.6 `subagent/subagent-fork-in-process` — 进程内 fork（16 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 83 | 载体注册：从当前会话分叉出子代理，共享进程与上下文 | 结构判断 |
| `tests/subagent-fork-in-process.spec.ts` | 测试 | 249 | 分叉语义与父上下文隔离 | 结构判断 |
| `tests/multi-subagent.spec.ts` | 测试 | 96 | 多子代理并行 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

### 23.7 `subagent/subagent-spawn-in-process` — 进程内新建（17 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 59 | 载体注册：新建空白子会话（不继承父上下文） | 结构判断 |
| `tests/subagent-spawn-in-process.spec.ts` | 测试 | 422 | 新建语义与消息隔离 | 结构判断 |
| `tests/spawn-in-process.e2e.ts` / `tests/harness.ts` | 测试 | 45 / 53 | 端到端与测试脚手架 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

### 23.8 `subagent/tool-subagent` — 派活工具（38 个文件）

面向模型的 `subagent` 工具：选择模型/预设、拼装任务描述、等待与取回结果。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 393 | 工具定义与执行：参数校验、载体选择、结果整形 | 结构判断 |
| `src/model-selection.ts` | 源码 | 193 | 模型选择策略（显式指定、按能力、按成本回落） | 结构判断 |
| `src/list-models.ts` | 源码 | 136 | 可用模型枚举工具 | 结构判断 |
| `src/model-selection-settings.ts` | 源码 | 95 | 选择策略的用户设置读写 | 结构判断 |
| `src/preset-selection.ts` | 源码 | 72 | 预设（persona/工具白名单）选择 | 结构判断 |
| `src/model-selection-state.ts` | 源码 | 60 | 会话级选择状态 | 结构判断 |
| `tests/tool-subagent.spec.ts` | 测试 | 928 | 工具主行为 | 结构判断 |
| `tests/model-selection.spec.ts` | 测试 | 627 | 选择策略矩阵 | 结构判断 |
| `tests/model-selection-settings.spec.ts` / `tests/list-models.spec.ts` | 测试 | 460 / 416 | 设置读写、模型枚举 | 结构判断 |
| `tests/preset-selection.spec.ts` / `tests/depth-context.spec.ts` | 测试 | 371 / 106 | 预设选择、深度上下文 | 结构判断 |
| `tests/scripted-provider.spec.ts` / `scripted-provider.ts` | 测试 | 107 / 120 | 脚本化模型提供方 | 结构判断 |
| `tests/model-selection-initialization.spec.ts` / `tests/harness.ts` | 测试 | 69 / 132 | 初始化与脚手架 | 结构判断 |
| `tsdown.config.ts` | 配置 | 18 | 打包配置 | 结构判断 |
| 包根与多语言 21 个（18 个 JSON，含测试夹具） | 配置/文档/多语言/夹具 | — | 包声明、说明、8 语文案与夹具模型清单 | 结构判断 |

### 23.9 `subagent/tool-subagent-control` — 子代理管控工具（21 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 158 | 管控工具注册：等待、列出、取消子代理 | 结构判断 |
| `src/wait-agent.ts` | 源码 | 118 | 等待工具：按 id 阻塞直到结束或超时 | 结构判断 |
| `src/list-agents.ts` | 源码 | 97 | 列出当前会话的子代理树 | 结构判断 |
| `tests/tool-subagent-control.spec.ts` | 测试 | 696 | 工具主行为 | 结构判断 |
| `tests/list-agents.spec.ts` / `tests/wait-agent.spec.ts` | 测试 | 424 / 304 | 列表与等待 | 结构判断 |
| `tests/park-parent.ts` / `tests/test-session-query.ts` | 测试 | 22 / 14 | 挂起父代理、查询桩 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

**组根**：`packages/subagent/README.md`、`README.zh.md`、`README.i18n.yaml`（3 个）。

---

## 二十四、`packages/subprocess` — 子进程与进程围栏（90 个文件）

子进程域分三层：`subprocess` 是**跨平台 seam**（统一 spawn / 输出捕获 / 进程树控制 / 出站策略的类型与接口），`subprocess-local` 是**本机实现**（Linux 用 execve + scope/cgroup，Windows 用 Job Object，含进程检查器与终端托管），`win32-process` 是 **Win32 FFI 底座**（koffi 绑定 + ABI 探测 C++ 源码）。这一组也是沙箱实际生效的地方。

### 24.1 `subprocess/subprocess` — 子进程 seam（14 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/types.ts` | 源码 | 297 | spawn 选项、进程句柄、输出事件与终止原因的类型定义 | 结构判断 |
| `src/index.ts` | 源码 | 172 | `ctx.subprocess` 服务：后端注册、可执行文件解析与调用转发 | 结构判断 |
| `src/error.ts` | 源码 | 83 | 子进程错误分类（不存在、权限、启动失败、被围栏拒绝） | 结构判断 |
| `src/control.ts` | 源码 | 24 | 进程控制指令常量（终止、挂起、信号） | 结构判断 |
| `tests/service.spec.ts` | 测试 | 103 | 服务契约与后端注册 | 结构判断 |
| `tests/egress.spec.ts` | 测试 | 149 | 出站限制钩子 | 结构判断 |
| `tests/error.spec.ts` / `tests/control.spec.ts` | 测试 | 53 / 29 | 错误映射与控制指令 | 结构判断 |
| `tsdown.config.ts` + 包根 5 个 | 配置/文档 | — | 打包配置、包声明与中英说明（无 locale） | 结构判断 |

### 24.2 `subprocess/subprocess-local` — 本机实现（53 个文件）

本组最大的实现包：Linux 侧走 `execve` 直启 + scope 选择器（cgroup v2），Windows 侧走 Job Object 约束，另有进程检查器、终端托管与 runner 协议。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/linux-scope.ts` | 源码 | 726 | Linux cgroup v2 scope 的创建、属性写入与清理 | 结构判断 |
| `src/process-inspector.ts` | 源码 | 560 | 进程树巡检：父子关系、存活判定、资源占用 | 结构判断 |
| `src/spawn.ts` | 源码 | 500 | 统一 spawn 入口：按平台分派、输出管道与结算 | 结构判断 |
| `src/spawn-runner.ts` | 源码 | 488 | runner 侧 spawn：经协议接收指令并拉起目标进程 | 结构判断 |
| `src/terminal.ts` | 源码 | 479 | PTY 终端托管：尺寸、信号、原始输出流 | 结构判断 |
| `src/index.ts` | 源码 | 387 | 插件入口：能力探测与后端装配 | 结构判断 |
| `src/windows-inspector.ts` | 源码 | 346 | Windows 进程信息读取 | 结构判断 |
| `src/runner-launch.ts` | 源码 | 315 | runner 子进程的启动与握手 | 结构判断 |
| `src/output.ts` | 源码 | 313 | 输出捕获：分块、截断、编码与溢写 | 结构判断 |
| `src/runner-protocol.ts` | 源码 | 281 | 父进程与 runner 的消息协议 | 结构判断 |
| `src/windows-job.ts` | 源码 | 269 | Windows Job Object：进程树归属与整体终止 | 结构判断 |
| `src/shell-activity.ts` | 源码 | 131 | shell 活动判定（是否仍在执行） | 结构判断 |
| `src/linux-scope-selector.ts` | 源码 | 101 | 选择可用 scope 层级（用户/systemd/自建） | 结构判断 |
| `src/linux-execve.ts` | 源码 | 92 | 直接 `execve` 路径（绕过 shell） | 结构判断 |
| `src/managed-owner.ts` | 源码 | 56 | 受管进程的所有权标记与回收 | 结构判断 |
| `src/control-spawn.ts` | 源码 | 35 | 带控制通道的 spawn 变体 | 结构判断 |
| `src/bin.ts` | 源码 | 25 | runner 可执行入口 | 结构判断 |
| `scripts/ensure-spawn-helper.mjs` | 脚本 | 16 | 构建期检查/补齐 spawn helper 产物 | 结构判断 |
| `tests/spawn.spec.ts` | 测试 | 1556 | spawn 全矩阵：参数、环境、输出、退出与失败 | 结构判断 |
| `tests/local.spec.ts` | 测试 | 1383 | 本机后端整体行为 | 结构判断 |
| `tests/linux-scope.spec.ts` | 测试 | 1223 | cgroup scope 行为（含真实文件系统边界） | 结构判断 |
| `tests/terminal.spec.ts` | 测试 | 1006 | PTY 交互与信号 | 结构判断 |
| `tests/spawn-runner.spec.ts` | 测试 | 999 | runner 协议与拉起 | 结构判断 |
| `tests/windows-job.spec.ts` / `tests/windows-inspector.spec.ts` | 测试 | 487 / 199 | Windows 进程树与信息 | 结构判断 |
| `tests/process-inspector.spec.ts` / `tests/native-containment.spec.ts` | 测试 | 383 / 298 | 巡检与原生围栏 | 结构判断 |
| `tests/native-windows.spec.ts` / `tests/linux-scope-selector.spec.ts` | 测试 | 249 / 241 | Windows 原生路径、scope 选择 | 结构判断 |
| `tests/process-exit.spec.ts` / `tests/shell-activity.spec.ts` / `tests/shell-activity-files.spec.ts` | 测试 | 175 / 157 / 81 | 退出结算、活动判定 | 结构判断 |
| `tests/control.spec.ts` / `tests/linux-execve.spec.ts` / `tests/spawn-runner-built.e2e.ts` | 测试 | 124 / 120 / 116 | 控制通道、execve、构建产物 | 结构判断 |
| `tests/fixtures/` 4 个（`control-child.ts`、`hold-linux-bootstrap.ts`、`managed-tree.ts`、`process-exit-host.ts`） | 夹具 | 21 / 3 / 18 / 81 | 受控子进程与进程树样本 | 结构判断 |
| `tsdown.config.ts` | 配置 | 16 | 打包配置（runner 单独产物） | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

**结构说明（>500 行）**：`linux-scope.ts`（726 行）是「路径发现 → 层级创建 → 属性写值 → 失败回退 → 清理」的状态机；`process-inspector.ts`（560 行）以 `/proc` 与 Win32 两套读取器为后端，输出统一的进程快照；`spawn.ts`（500 行）只做分派与管道接线，真正的平台差异在 `linux-execve`/`windows-job`/`terminal` 各自文件里。

### 24.3 `subprocess/win32-process` — Win32 FFI 底座（20 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/process.ts` | 源码 | 641 | Win32 进程 API 封装：句柄、等待、退出码、命令行读取 | 结构判断 |
| `src/ffi.ts` | 源码 | 383 | koffi 绑定声明与调用封装（结构体、宽字符串、错误码） | 结构判断 |
| `src/abi.ts` | 源码 | 52 | ABI 探测（指针宽度、结构体布局）结果 | 结构判断 |
| `src/control-stdio.ts` | 源码 | 47 | 控制用 stdio 通道建立 | 结构判断 |
| `src/index.ts` | 源码 | 38 | 包入口导出 | 结构判断 |
| `src/errors.ts` | 源码 | 24 | Win32 错误码到类型化错误的映射 | 结构判断 |
| `src/koffi.ts` | 源码 | 10 | koffi 运行时加载与版本校验 | 结构判断 |
| `tests/process-failure-paths.spec.ts` | 测试 | 437 | 句柄失败、权限不足、进程已退出 | 结构判断 |
| `tests/ordinary-process.spec.ts` | 测试 | 287 | 普通进程读写 | 结构判断 |
| `tests/process.spec.ts` / `tests/process-allocation-failure.spec.ts` | 测试 | 255 / 151 | 主行为与内存分配失败 | 结构判断 |
| `tests/quote.spec.ts` / `tests/ffi.spec.ts` | 测试 | 65 / 50 | 命令行转义、FFI 绑定 | 结构判断 |
| `tests/fixtures/console-state.ts` | 夹具 | 7 | 控制台状态快照 | 结构判断 |
| `verify/abi-probe.cpp` | 源码（C++） | 63 | ABI 探测辅助程序，用于校核结构体布局 | 结构判断 |
| 包根 5 个 | 配置/文档 | — | 包声明与中英说明（无 locale） | 结构判断 |

---

## 二十五、`packages/team` — 代理团队与任务板（50 个文件）

把多个子代理组织成**有任务板与依赖图的团队**：`agent-team` 提供团队状态、任务图、日志与投影，`tool-agent-team` 面向模型暴露建团队/认领任务/更新状态等工具。

### 25.1 `team/agent-team` — 团队内核（32 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/task-board.ts` | 源码 | 282 | 任务板：任务增改、认领、状态迁移与冲突拒绝 | 结构判断 |
| `src/projection.ts` | 源码 | 217 | 团队投影：成员、任务板与依赖图的读模型 | 结构判断 |
| `src/types.ts` | 源码 | 192 | 团队、成员、任务与事件的类型定义 | 结构判断 |
| `src/index.ts` | 源码 | 165 | 插件入口：服务装配与团队生命周期 | 结构判断 |
| `src/journal.ts` | 源码 | 75 | 团队事件日志（追加式，供投影重放） | 结构判断 |
| `src/task-graph.ts` | 源码 | 69 | 任务依赖图：环检测与就绪判定 | 结构判断 |
| `src/task-view.ts` | 源码 | 56 | 单个任务的视图整形 | 结构判断 |
| `src/validation.ts` | 源码 | 34 | 团队与任务载荷校验 | 结构判断 |
| `src/error.ts` | 源码 | 11 | 错误类型 | 结构判断 |
| `src/client.ts` | 源码 | 9 | 浏览器侧类型再导出 | 结构判断 |
| `tests/team.spec.ts` | 测试 | 902 | 团队主流程：成立、认领、完成与冲突 | 结构判断 |
| `tests/projection-events.spec.ts` | 测试 | 552 | 事件到投影的重放顺序 | 结构判断 |
| `tests/persistence.spec.ts` | 测试 | 233 | 团队状态持久化 | 结构判断 |
| `tests/built-lib.e2e.ts` | 测试 | 73 | 构建产物守卫 | 结构判断 |
| `tests/historical-records-fixture.ts` / `enable-team-fixture.ts` / `session-mode-fixture.ts` / `test-session-query.ts` | 测试 | 33 / 17 / 31 / 14 | 历史记录、启用开关、会话模式与查询桩 | 结构判断 |
| `tsdown.config.ts` | 配置 | 15 | 打包配置 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

### 25.2 `team/tool-agent-team` — 团队工具（15 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 235 | 面向模型的团队工具：建团队、加成员、发布与认领任务、汇报结果 | 结构判断 |
| `tests/tool-team.spec.ts` | 测试 | 1063 | 工具参数校验、任务流转与并发认领 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、说明与 8 语文案 | 结构判断 |

**组根**：`packages/team/README.md`、`README.zh.md`、`README.i18n.yaml`（3 个）。

---

## 二十六、`packages/telemetry` — OTLP 日志导出（23 个文件）

本组只有一个包 `otel`，职责是把两类流量分别以 OTLP/HTTP JSON 的「日志」语义导出到收集器：**普通产品事件**（DA/产品自选字段）与**会话日志**（经授权与脱敏后的会话事件）。服务本身不持有全局队列、身份或连接，只作为通道工厂；每个消费者拿到的是独立批处理管线，自行负责排空与关闭。

### 26.1 `telemetry/otel` — 事件与会话日志双通道（20 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 35 | `ctx.otel` 服务：仅暴露 `createEventReporter` / `createSessionLogReporter` 两个工厂，挂载时不开队列也不建连接 | 结构判断 |
| `src/event-log.ts` | 源码 | 94 | 普通事件通道：SDK 批量日志处理器 + 可取消导出器，字段限定为标量并禁止自动附带设备/账号身份 | 结构判断 |
| `src/event-transport.ts` | 源码 | 57 | 事件通道专用 HTTP 导出器：got + gzip，取消时释放请求与重试定时器，关闭时销毁自有 agent | 结构判断 |
| `src/transport.ts` | 源码 | 61 | 共享 OTLP JSON 传输构造：显式 endpoint/headers/agent，不继承其它收集器的头与 TLS 身份，自观测 meter 保持 noop | 结构判断 |
| `src/session-log.ts` | 源码 | 228 | 会话日志通道：字节与条数双上限批处理，单请求上限 4,000,000 字节，授权与脱敏先于入队 | 结构判断 |
| `tests/event-log.spec.ts` | 测试 | 150 | 用回环 HTTP 收集器验证事件到 OTLP 请求的映射与批量边界 | 结构判断 |
| `tests/session-log.spec.ts` | 测试 | 315 | 会话日志通道的字节上限、截断、取消与关闭行为 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、TS 配置、中英说明与 8 语插件文案 | 结构判断 |

**组根**：`packages/telemetry/README.md`(35)、`README.zh.md`(35)、`README.i18n.yaml`(25)，共 3 个。

**命名提示**：本组没有名为 `telemetry` 的包，只有 `otel`；`packages/host/product-telemetry-otel` 是它之上的产品事件适配器，二者不可混为一谈。

---

## 二十七、`packages/terminal` — 持久 PTY 终端（43 个文件）

「持久终端」三件套中的 seam 与唯一实现：`terminal` 定义 owner-scoped 的 PTY 注册表与后端契约（谁来建会话、谁校验归属、谁负责等待式清理），`terminal-bash` 则是真正起 `bash` / `pwsh` 的后端，负责配置解析、沙箱策略套用、有界滚动缓冲、就绪判定与输出净化。模型可见的终端工具在 `packages/shell` 侧消费这套服务。

### 27.1 `terminal/terminal` — owner-scoped PTY 注册表（17 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 457 | `ctx.terminal` 服务：后端注册与去重、会话 id 分配、按 owner 校验归属、状态发布与等待式清理；终端机制本身留给后端 | 结构判断 |
| `src/types.ts` | 源码 | 162 | 后端、注册表与工具三方共用的类型：品牌化会话 id、等待原因、允许的信号、会话状态与快照 | 结构判断 |
| `src/error.ts` | 源码 | 74 | `TerminalError` 与错误码矩阵（`NO_BACKEND`、`FOREIGN_SESSION`、`SESSION_CLOSING`、`STARTUP_TIMEOUT`、`CLEANUP_FAILED` 等），供上层按码路由 | 结构判断 |
| `tests/service.spec.ts` | 测试 | 633 | 注册表行为：重复后端拒绝、外域会话拒绝、关闭中操作、与投影/会话联动的清理时序 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、TS 配置、中英说明与 8 语插件文案 | 结构判断 |

### 27.2 `terminal/terminal-bash` — bash / pwsh 持久终端后端（23 个文件）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `src/index.ts` | 源码 | 241 | 后端实现：解析配置、按 dialect 组装 argv/env、套用共享沙箱策略，并把 send/read/signal 映射到 subprocess 终端句柄 | 结构判断 |
| `src/session.ts` | 源码 | 798 | 单会话内核：xterm headless 缓冲、有界输出、就绪判定、终端协议回执、前台进程组信号与会话退出结算 | 结构判断 |
| `src/sanitize.ts` | 源码 | 188 | 流式 CSI/OSC 净化器：保留被切块截断的转义序列，并识别受控 shell 在每次提示符前发出的私有标记 `133;D;` | 结构判断 |
| `src/config.ts` | 源码 | 142 | schemastery 配置与按 dialect 的默认值（bash `--noprofile --norc -i`，pwsh `-NoLogo -NoProfile`），含 pwsh 路径解析 | 结构判断 |
| `tests/session.spec.ts` | 测试 | 1765 | 会话内核主用例：输出上限、就绪、协议回执、信号与退出路径 | 结构判断 |
| `tests/index.spec.ts` | 测试 | 759 | 后端装配与 send/read/signal 到 subprocess 句柄的映射 | 结构判断 |
| `tests/local.spec.ts` | 测试 | 406 | 真实本地 shell 端到端（按平台跳过） | 结构判断 |
| `tests/session-buffer.spec.ts` | 测试 | 297 | 滚动缓冲的行/字节双上限与截断标记 | 结构判断 |
| `tests/config.spec.ts` | 测试 | 86 | 配置默认值与非法值拒绝 | 结构判断 |
| `tests/sanitize.spec.ts` | 测试 | 76 | 净化器对跨块 CSI/OSC 与提示符标记的识别 | 结构判断 |
| 包根与多语言 13 个 | 配置/文档/多语言 | — | 包声明、TS 配置、中英说明与 8 语插件文案 | 结构判断 |

**结构说明（>500 行）**：`src/session.ts`（798 行）分五层——PTY 句柄生命周期、滚动缓冲与字节计量、就绪/空闲状态机、终端协议请求应答、退出与资源结算；`tests/session.spec.ts`（1765 行）按这五层分块，是理解真实行为契约的最佳入口。

**组根**：`packages/terminal/README.md`(53)、`README.zh.md`(53)、`README.i18n.yaml`(25)，共 3 个。

---

## 二十八、覆盖度与异常

### 28.1 与清单对账

逐组文件数取自 `packages-06.tsv` 实测，与各章标题中的「N 个文件」一一对应：

| 二级组 | 文件数 | 二级组 | 文件数 |
| --- | ---: | --- | ---: |
| `host` | 164 | `session` | 460 |
| `identity` | 10 | `session-query` | 82 |
| `interaction` | 95 | `settings` | 28 |
| `jobs` | 57 | `shell` | 180 |
| `llm` | 295 | `skill` | 95 |
| `lsp` | 70 | `spill` | 51 |
| `mcp` | 86 | `ssh` | 106 |
| `plan` | 23 | `storage` | 79 |
| `preset` | 110 | `subagent` | 268 |
| `ptc-runtime` | 93 | `subprocess` | 90 |
| `sandbox` | 95 | `team` | 50 |
| `schedule` | 71 | `telemetry` | 23 |
| `sdk` | 71 | `terminal` | 43 |
| **合计** | **26 组** | | **2,795** |

表内相加：164+10+95+57+295+70+86+23+110+93+95+71+71+460+82+28+180+95+51+106+79+268+90+50+23+43 = **2,795**，与清单行数完全一致。

需要说明的统计口径：本册表格采用「逐文件行 + 合并行」混合写法，合并行在首列明示覆盖个数（如「包根与多语言 13 个」），因此**表格行数不等于文件数**。核对以「章节标题声明数 → 清单分组计数」为准，不依赖行数。

### 28.2 标注分布

- `结构判断`：1,470 条表格行（含 58 条合并行）。
- `精读`：**0 条**。本册没有逐行通读过任何完整实现的文件；对 `host/webserver/src/index.ts`、`host/open-in-app/src/index.ts`、`telemetry/otel/src/*.ts`、`terminal/terminal/src/index.ts` 等，只读到文件头 docblock 与若干关键分支，按诚实原则仍记 `结构判断`。
- `待确认`：表格行 1 条（`packages/subprocess/win32-process` 的 AbiProbe 相关文件），另有 2 处正文标注（28.3 的 `subprocess-local` 与 `win32-process` 能力边界、两个 `abi-probe.cpp` 的 CI 归属与是否合并）。

换言之，**本册全部职责描述均为「据文件自述、导出符号与引用关系推断」，未做实现级校验**。需要精确行为契约时，应回到源码或 `docs/superpowers/modules/`。

### 28.3 异常文件

**超大源码（>1,000 行，需拆分关注点）**

| 文件 | 行数 | 观察 |
| --- | ---: | --- |
| `packages/session/session-persistence-jsonl/src/index.ts` | 1,839 | JSONL 持久化主入口，承担租约、代际目录、zstd、重放等多职责，是本块最重的单文件 |
| `packages/subagent/subagent/src/manager.ts` | 1,359 | 子代理调度内核，激活/结算/延续混在一处 |
| `packages/subagent/subagent/src/index.ts` | 604 | 插件装配与选项解析，仍偏大 |
| `packages/session/session/src/index.ts` | 1,059 | 会话服务与事件写入 |
| `packages/session-query/session-query-sqlite/src/index.ts` | 1,131 | 检索索引读写与查询编译 |
| `packages/session/session-title/src/index.ts` | 855 | 标题生成与去重策略 |
| `packages/subagent/subagent-wire/src/wire.ts` | 711 | 载体协议序列化，接近需拆分阈值 |

**超大测试（>2,000 行，建议按被测面拆分）**

`subagent/subagent/tests/continuation.spec.ts`(4,191)、`session/session-persistence-jsonl/tests/jsonl.spec.ts`(2,925)、`llm/llm-deepseek/tests/runtime.spec.ts`(2,383)、`subagent/subagent-codex/tests/subagent-codex.spec.ts`(2,333)。四者合计约 11,800 行，是单文件可读性的最大风险点。

**疑似重复实现 / 结构同构**

- `packages/session/session-format-v0-to-v1`、`v1-to-v2`、`v2-to-v3`、`v3-to-v4` 四个迁移跳板高度同构（同一 `migrate` 契约、同一夹具形态），属**有意为之的版本链**，不是冗余，但新增版本时必须同步改四处注册。
- `packages/subprocess/subprocess-local` 与 `packages/subprocess/win32-process` 在进程枚举与句柄信息上有能力重叠（前者走系统命令，后者走 koffi FFI），调用边界**待确认**。
- `packages/host/directory-picker-native` 的 `win32-dialog-*` 五个文件把同一 COM 流程拆成「绑定 / 逻辑 / 宿主 / 工作进程 / 驱动」五片，与 `subprocess/win32-process` 的 FFI 分层风格重复，属可复用基建尚未抽取。

**命名与目录不合规**

- `packages/subagent/subagent`：包名与二级组同名，`import` 时需靠路径区分，易误读为组根。
- `packages/telemetry` 组下无 `telemetry` 包（只有 `otel`），`packages/host` 下另有 `product-telemetry-otel`，检索「telemetry」会命中两处不同层级。
- `packages/sandbox/sandbox-windows-acl/verify/abi-probe.cpp`(94) 与 `packages/subprocess/win32-process/verify/abi-probe.cpp`(63) 是本块仅有的两个 C++ 文件，同名、同用途（探测 koffi FFI 的 ABI 布局），不参与 tsdown 构建，属手工校验工具链，**待确认**其 CI 归属与是否应合并。
- `packages/session/session-log-export` 同时含 host 与 client 两半边源码，与本块「一包一侧」的多数约定不符。

**非代码资产（本块共 28 个）**：`.svg` 6、`.png` 2、`.xlsx` 1、`.jsonl` 1、`.css` 1、`.sh` 1、`.ps1` 1、`.cpp` 2、`.js`/`.mjs` 13（多为 fixture 插件与构建产物样例）。

### 28.4 使用建议

1. 先读第 28.1 的对账表定位包，再看对应章节的「定位」段，最后按需打开源码——本册不替代 `modules/` 的架构分析。
2. 涉及会话持久化、子代理调度、终端就绪这三处行为时，**不要**依据本册的职责描述直接改代码，应先读源码或既有模块文档。
3. 本册的 58 条合并行是覆盖面最薄的位置（包根/locale/fixture 未逐文件展开），若需逐个文件审计，请以清单 TSV 为准。
