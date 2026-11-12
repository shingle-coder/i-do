# packages-07 与 misc 逐文件职责

> 覆盖清单：`docs/superpowers/inventory/packages-07.tsv`（771 个文件）与 `docs/superpowers/inventory/misc.tsv`（914 个文件），合计 1,685 个文件。 > 配套文档：`docs/superpowers/inventory/00-index.md`（字段定义与统计口径）、`docs/superpowers/modules/`（架构分析，本文不复述）。 > 盘点对象：`D:\ai\deepseek\i-do` · 撰写时间：2026-11-12 · 本文为只读盘点的产物，未修改任何源码与配置。

## 一、标注规则

每个文件的职责都来自一次明确的判断路径，本文用三种标记区分证据强度：

| 标记 | 含义 | 判定标准 |
| --- | --- | --- |
| `精读` | 实际打开过文件正文，职责依据来自内容本身 | 读过入口导出、关键函数体、注释或测试断言；职责描述能对应到具体实现细节 |
| `结构判断` | 未逐行读正文，职责由外部证据推定 | 依据路径、包名与包 README、同名测试、被谁 import、被哪条 npm script 或 CI job 调用 |
| `待确认` | 证据不足 | 职责列直接写「待确认」，并给出可查证的方向，不做猜测 |

原则：

1. `结构判断` 不伪装成 `精读`。凡只读片段（如前 30 行）者一律计为 `结构判断`。
2. 拿不准写「待确认」，不编造调用方、不编造补丁内容。
3. 每节末尾给出该节的 `精读/结构判断/待确认` 数量，全文汇总见文末对账节。

## 二、列与折叠规则

表格列为 `文件 | 类型 | 行数 | 职责`。类型取扩展名去掉点后的短名（`ts`、`mjs`、`json`、`md`、`yml`、`patch` 等），无扩展名写「无扩展名」。

为控制篇幅，做三类折叠，规则固定、可核算：

| 折叠 | 规则 | 说明 |
| --- | --- | --- |
| 三件套 | `README.md` / `README.zh.md` / `README.i18n.yaml` 并入一行 | 三者由 `scripts/verify-translation-pairing.ts` 门禁绑定，职责必然同源；行数列写三者行数 |
| 测试夹具 | `tests/fixtures/**` 内同类小文件（json/jsonl/yml/md）合并为一行 | 行数列写「N 个文件 / 合计 M 行」，具体路径在职责里点名代表文件 |
| 构建产物 | 同一包内的 `tsconfig.json`、`tsdown.config.ts` 等 5–10 行配置各自成行 | 不折叠，因为它们的键值差异本身有信息量 |

折叠只合并「同一对象的不同语言/不同样例」，不合并不同职责的文件。第七节给出「清单行数 → 文档行数 → 折叠掉的条目数」的完整对账。

## 三、与 `modules/` 的分工

`docs/superpowers/modules/` 回答「这一层为什么这样设计」，本文只回答「这个文件是什么、谁调用它、改它要注意什么」。凡是 `modules/` 已经深入分析过的机制（如 storage 的分层、workspace 的规范化路径），本文只在定位段一句话带过并给出链接，不重复展开。

## 四、packages-07 覆盖范围

该清单是按分组贪心装箱的结果，包含 7 个分组：`test-support`、`todo`、`typert`、`util`、`web`、`workflow`、`workspace`。前六组在本文件第一部分按包分节，最后一组 `workspace` 一并列入。`packages/` 顶层散落文件不在本清单内（属 `packages-01.tsv`）。

## 五、packages/test-support

226 个文件，是全仓最大的测试基础设施集合。它只被 `*.spec.ts` 引用，不进入任何产品产物的运行时依赖。八个子包按「拦截层」分工：`llm-mock-server` 在 HTTP 层伪造模型服务，`llm-replay` 在适配器层回放录制的响应，`session-snapshot` 在会话层比对整轮交互快照，`remote-mock` 在 RPC 层伪造宿主能力，`client-runtime` 在渲染层搭出可断言的客户端环境，`agent-loop-testkit`、`loader-smoke`、`tool-testkit` 分别提供循环驱动、启动冒烟与工具调用骨架。改动的连带影响面很窄，但一旦改坏，全仓测试会集体「假通过」，因此三件套 README 里都写明了「不要用 mock 掩盖真实行为」。

### 5.1 agent-loop-testkit

驱动机器人循环的最小测试套件：给一段输入、一个脚本化的模型，断言循环产出的消息序列，不启动宿主、不连网络。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 61 | 声明包名、导出入口与对 `@deepseek-ai/dsh-core-tools` 等宿主包的 peer 依赖 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 330 | 中英文档对；说明「用脚本化模型驱动循环」的用法与边界，`i18n.yaml` 存摘要映射供翻译门禁校验 | 结构判断 |
| `src/index.ts` | ts | 106 | 包唯一入口，导出驱动函数与类型，把 `inbox`、`model` 拼成一个可直接 `await` 的循环 | 结构判断 |
| `src/inbox.ts` | ts | 74 | 模拟用户输入队列，按序把待处理消息喂给 Agent Loop 并记录消费位置 | 结构判断 |
| `src/model.ts` | ts | 13 | 极简模型桩，只返回预置的响应片段，用于不关心模型细节的循环测试 | 结构判断 |
| `src/working-directory-fixture.ts` | ts | 18 | 创建临时工作目录并在用例结束后清理，避免测试间互相污染 | 结构判断 |
| `tests/agent-loop-testkit.spec.ts` | ts | 173 | 自测：验证 inbox 消费顺序、模型桩返回值与临时目录清理 | 结构判断 |
| `tsconfig.json` | json | 51 | 继承根 `tsconfig.base.json`，额外声明测试目录与 `composite` 引用 | 结构判断 |

### 5.2 client-runtime

在 Node 或 jsdom 里搭出一个「客户端已组装完毕」的运行环境：注册模块、伪造 remote 代理、提供会话与工作区夹具，让 `packages/client/*` 的组件测试不必启动真实桌面端。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 101 | 声明双重导出（浏览器/Node 条件）、对 `vue` 与客户端包的 peer 依赖，以及 `tsdown` 构建入口 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 390 | 中英文档对；讲清「assembly」概念、两种运行环境差异与常见断言写法 | 结构判断 |
| `src/index.ts` | ts | 490 | 总入口，汇总导出组装器、夹具、快照工具与访问控制助手 | 结构判断 |
| `src/access.ts` | ts | 95 | 模拟权限/授权状态，按角色返回可见功能集合，供 UI 条件渲染用例使用 | 结构判断 |
| `src/assembly/index.ts` | ts | 14 | 组装层的聚合出口，只做再导出，决定对外暴露哪些组装 API | 结构判断 |
| `src/assembly/bundle-roster.ts` | ts | 167 | 维护「官方插件包清单」在测试侧的镜像，断言 bundle 内模块与清单一致 | 结构判断 |
| `src/assembly/modules.ts` | ts | 80 | 把模块声明解析成可注入的注册项，是组装流程的第一步 | 结构判断 |
| `src/assembly/remote-default-responses.ts` | ts | 64 | 为未显式打桩的 remote 方法提供默认响应，避免用例因遗漏桩而崩 | 结构判断 |
| `src/assembly/remote-proxies.ts` | ts | 87 | 生成 remote 代理对象，把调用转发到桩函数并记录调用轨迹 | 结构判断 |
| `src/assembly/roster.ts` | ts | 163 | 插件名册：登记可用插件、其配置形态与依赖关系，供组装时校验 | 结构判断 |
| `src/assembly/test-client.ts` | ts | 388 | 核心组装器：串联模块、代理、名册，产出一个可挂载的测试客户端实例 | 结构判断 |
| `src/assembly/vitest.ts` | ts | 60 | 与 vitest 的桥接层，注册全局钩子并在用例结束后销毁客户端 | 结构判断 |
| `src/config-form.ts` | ts | 61 | 构造插件配置表单的初始值与校验结果，供设置页用例断言 | 结构判断 |
| `src/context-menu.ts` | ts | 17 | 右键菜单项的极简工厂，供菜单渲染测试复用 | 结构判断 |
| `src/fixtures.ts` | ts | 119 | 通用夹具集合：会话、消息、工具调用等结构的构造器 | 结构判断 |
| `src/locale-env.ts` | ts | 29 | 设置测试语言环境，保证文案断言不随宿主语言漂移 | 结构判断 |
| `src/remote.ts` | ts | 103 | remote 调用的类型化封装，统一超时与错误形态便于断言 | 结构判断 |
| `src/sessions.ts` | ts | 844 | 会话夹具工厂：构造多轮、多工具、含压缩或中断的会话状态。结构：前段是状态构造器，中段是增量事件追加，后段是「预期视图」投影，供 UI 断言用 | 结构判断 |
| `src/snapshot.ts` | ts | 89 | 对客户端渲染结果做结构快照与比较，屏蔽时间戳等不稳定字段 | 结构判断 |
| `src/translate.ts` | ts | 32 | 测试用翻译桩，返回 key 本身或固定语言，避免加载真实语言包 | 结构判断 |
| `src/workspaces.ts` | ts | 210 | 工作区夹具：伪造项目列表、当前目录与文件树，供工作区浏览器用例使用 | 结构判断 |
| `tests/__snapshots__/runtime.client.spec.tsx.snap` | snap | 39 | `runtime.client.spec.tsx` 的序列化快照，记录初始渲染结构 | 结构判断 |
| `tests/runtime.client.spec.tsx` | tsx | 946 | 被测对象 `src/assembly/test-client.ts`：端到端验证组装后客户端的挂载、交互与销毁 | 结构判断 |
| `tests/access.client.spec.ts` | ts | 82 | 被测对象 `src/access.ts`：不同角色下的功能可见性 | 结构判断 |
| `tests/assembly-bundle-roster.client.spec.ts` | ts | 345 | 被测对象 `assembly/bundle-roster.ts`：清单与真实 bundle 的一致性、缺失项报错 | 结构判断 |
| `tests/assembly-dependencies.client.spec.ts` | ts | 37 | 被测对象 `assembly/roster.ts`：插件依赖缺环时应拒绝组装 | 结构判断 |
| `tests/assembly-modules.client.spec.ts` | ts | 109 | 被测对象 `assembly/modules.ts`：模块声明到注册项的转换与非法输入处理 | 结构判断 |
| `tests/assembly-plan.client.spec.ts` | ts | 22 | 被测对象 `assembly/index.ts`：组装计划的最小形状断言 | 结构判断 |
| `tests/assembly-remote-proxies.client.spec.ts` | ts | 104 | 被测对象 `assembly/remote-proxies.ts`：代理转发、调用记录与异常透传 | 结构判断 |
| `tests/assembly-roster.client.spec.ts` | ts | 112 | 被测对象 `assembly/roster.ts`：名册登记、重复登记与配置形态校验 | 结构判断 |
| `tests/assembly-test-client.client.spec.ts` | ts | 283 | 被测对象 `assembly/test-client.ts`：浏览器环境下的组装与事件流 | 结构判断 |
| `tests/assembly-test-client-node.client.spec.ts` | ts | 150 | 同上，Node 环境分支：验证无 DOM 时的降级路径 | 结构判断 |
| `tests/assembly-vitest.client.spec.ts` | ts | 64 | 被测对象 `assembly/vitest.ts`：钩子注册与销毁时序 | 结构判断 |
| `tests/context-menu.client.spec.tsx` | tsx | 20 | 被测对象 `src/context-menu.ts`：菜单项渲染冒烟 | 结构判断 |
| `tests/helpers.client.spec.tsx` | tsx | 225 | 被测对象 `src/fixtures.ts` 等夹具：夹具自身的形状与稳定性 | 结构判断 |
| `tests/remote.client.spec.ts` | ts | 61 | 被测对象 `src/remote.ts`：超时、错误包装与返回值类型 | 结构判断 |
| `tsconfig.json` | json | 97 | 客户端编译面配置，含 `jsx` 与 DOM lib 设置 | 结构判断 |
| `tsdown.config.ts` | ts | 6 | 打包配置，按 `DSH_BUILD_FACE` 区分浏览器/Node 产物 | 结构判断 |

### 5.3 llm-mock-server

一个可独立启动的 HTTP 服务，按剧本返回 OpenAI/Anthropic 风格响应，支持流式分片与故障注入。根 `package.json` 的 `mock:llm` 直接调用其 `src/bin.ts`。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 声明 `bin` 入口与零运行时依赖，保证可被 `node` 直接执行 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 400 | 中英文档对；列出剧本语法、故障注入参数与端口约定 | 结构判断 |
| `src/bin.ts` | ts | 50 | 命令行可执行入口，解析参数后启动服务并打印监听地址；`pnpm mock:llm` 走这里 | 结构判断 |
| `src/cli.ts` | ts | 213 | 参数解析与校验层，把 `--port`、`--script`、`--fail` 等翻译成服务配置 | 结构判断 |
| `src/index.ts` | ts | 755 | 服务主体：路由、剧本调度、流式分片写出与错误注入。结构：前段是请求解析与路由表，中段是剧本状态机，后段是 SSE/chunked 写出与生命周期收尾 | 结构判断 |
| `tests/cli.spec.ts` | ts | 128 | 被测对象 `src/cli.ts`：参数边界、非法值与默认值 | 结构判断 |
| `tests/server.spec.ts` | ts | 361 | 被测对象 `src/index.ts`：流式分片、非流式响应、故障注入与并发隔离 | 结构判断 |
| `tsconfig.json` | json | 10 | 极简配置，仅编译 `src` | 结构判断 |
| `tsdown.config.ts` | ts | 9 | 打包为单文件可执行脚本，供 `mock:llm` 直接运行 | 结构判断 |

### 5.4 llm-replay

把真实模型交互录制成文件、测试时逐条回放：同一请求必须命中同一响应，未命中即失败。它是「无密钥回归」的基石。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 55 | 声明对 LLM 适配器接口的依赖与导出，供各 provider 包在测试中替换实现 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 385 | 中英文档对；说明录制/回放/刷新三种模式与文件布局 | 结构判断 |
| `src/index.ts` | ts | 1211 | 回放适配器实现：请求指纹、响应查找、录制写盘与不匹配诊断。结构：前半是适配器接口实现与指纹计算，中间是录制/回放两条路径，后半是错误报告与快照归一化 | 结构判断 |
| `tests/llm-replay.spec.ts` | ts | 2317 | 被测对象 `src/index.ts`：指纹稳定性、跨格式回放、缺录制时的报错文案、刷新模式 | 结构判断 |
| `tests/session-format-corpus.spec.ts` | ts | 138 | 跨会话格式（v2/v3/v4）语料的回放一致性，防止格式升级打断老录制 | 结构判断 |
| `tests/session-format-corpus-inventory.ts` | ts | 72 | 上述用例的语料清单，集中声明要覆盖的格式与样例路径 | 结构判断 |
| `tsconfig.json` | json | 33 | 含 `tests` 目录的编译配置 | 结构判断 |

### 5.5 loader-smoke

启动冒烟工具：真的把插件加载器跑起来，断言插件被发现、初始化并按预期失败或成功，用来兜住「装了但起不来」这类 CI 抓不到的问题。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 52 | 声明对 loader 与 CLI 的依赖，导出启动助手 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 368 | 中英文档对；说明冒烟用例的判定标准与生产 profile 的差异 | 结构判断 |
| `src/index.ts` | ts | 259 | 入口：启动一次加载器、收集诊断、返回可断言的结果对象 | 结构判断 |
| `src/agent-turn.ts` | ts | 116 | 驱动一轮 Agent 交互并等待落盘，验证「加载完成后真的能对话」 | 结构判断 |
| `tests/agent-turn.spec.ts` | ts | 210 | 被测对象 `src/agent-turn.ts`：一轮对话的完整链路与落盘结果 | 结构判断 |
| `tests/example-launch.spec.ts` | ts | 116 | 被测对象 `src/index.ts`：示例插件从启动到就绪的路径 | 结构判断 |
| `tests/loader-smoke.spec.ts` | ts | 140 | 被测对象 `src/index.ts`：加载失败、超时与诊断信息格式 | 结构判断 |
| `tests/fixtures/success.ts` / `fail.ts` / `hang.ts` | ts | 26 | 三个最小插件桩，分别立即成功、立即失败、永不返回，用于覆盖加载器三种终态 | 结构判断 |
| `tests/fixtures/headless-driver.ts` / `cli-mock-llm.ts` / `production-profile.ts` | ts | 249 | 无头驱动、假模型服务与生产 profile 三件夹具，让冒烟用例不依赖真实模型与桌面端 | 结构判断 |
| `tsconfig.json` | json | 27 | 编译配置，含夹具目录 | 结构判断 |

### 5.6 remote-mock

宿主 RPC 的假实现：定义一套「服务 + 方法」的桩，支持 unary、流式与服务端推送，让客户端测试不启动 Electron 主进程。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 46 | 声明零依赖与浏览器/Node 双导出 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 355 | 中英文档对；讲解桩注册方式、流式语义与代理用法 | 结构判断 |
| `src/index.ts` | ts | 17 | 聚合出口，再导出 mock、代理与日志工具 | 结构判断 |
| `src/remote-mock.ts` | ts | 413 | 核心：服务/方法注册表、调用分发、参数校验与返回值包装 | 结构判断 |
| `src/remote-proxy.ts` | ts | 29 | 按注册表生成类型化代理，调用方像用真实 remote 一样书写 | 结构判断 |
| `src/streams.ts` | ts | 339 | 流式通道模拟：分片推送、背压、取消与错误终止 | 结构判断 |
| `src/log.ts` | ts | 131 | 调用日志：记录每次 RPC 的名称、参数、耗时，供断言与排障 | 结构判断 |
| `tests/unary.client.spec.ts` | ts | 107 | 被测对象 `src/remote-mock.ts`：一元调用的分发与错误路径 | 结构判断 |
| `tests/streams.client.spec.ts` | ts | 217 | 被测对象 `src/streams.ts`：分片顺序、取消与异常终止 | 结构判断 |
| `tests/proxy.client.spec.ts` | ts | 272 | 被测对象 `src/remote-proxy.ts`：代理生成与方法名映射 | 结构判断 |
| `tests/proxy-types.client.spec.ts` | ts | 186 | 代理的类型层断言：签名与真实 remote 定义保持一致 | 结构判断 |
| `tests/rpc.client.spec.ts` | ts | 126 | 端到端 RPC：注册、调用、日志三者串联 | 结构判断 |
| `tsconfig.json` | json | 21 | 浏览器面编译配置 | 结构判断 |
| `tsdown.config.ts` | ts | 6 | 双面打包配置 | 结构判断 |

### 5.7 session-snapshot

会话级快照框架：跑一轮真实会话，把系统提示、工具 schema、消息流、产物目录、落盘文件全部归一化后与期望文件比对。它是「模型行为回归」的唯一入口，`test:snapshot` 系列命令都指向它。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 64 | 声明对 boot、session、test-support 其余包的依赖，导出 suite 与 harness | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 425 | 中英文档对；定义快照目录布局、录制/刷新流程与归一化白名单 | 结构判断 |
| `src/index.ts` | ts | 120 | 入口：导出 `defineSuite`、`runSuite` 等 API 与类型 | 结构判断 |
| `src/suite.ts` | ts | 1764 | 用例框架主体：场景声明、录制/回放/比对三种模式、期望文件读写、失败诊断。结构：前段是 suite 定义与类型，中段是执行与三种模式分支，后段是诊断输出与差异定位技巧 | 结构判断 |
| `src/harness.ts` | ts | 846 | 启动真实宿主：加载插件、注入模型、驱动对话，产出可归一化的原始轨迹。结构：初始化、驱动循环、采集与收尾四段 | 结构判断 |
| `src/normalize.ts` | ts | 665 | 归一化器：抹掉时间戳、随机 ID、绝对路径等不稳定字段，保证快照可比 | 结构判断 |
| `src/launcher.ts` | ts | 465 | 子进程启动器：按 profile 拉起 CLI/插件宿主并回收输出，支持超时终止 | 结构判断 |
| `src/manifest.ts` | ts | 432 | 快照清单：记录一个场景包含哪些期望文件、各自格式与版本 | 结构判断 |
| `src/session-files.ts` | ts | 253 | 会话文件读写助手，处理 jsonl 分段、v2/v3/v4 布局差异 | 结构判断 |
| `src/identity.ts` | ts | 135 | 场景身份与版本标识，保证同一场景跨格式升级后仍可对应 | 结构判断 |
| `src/workspace.ts` | ts | 116 | 临时工作区准备与产物收集，比较会话对文件的真实改动 | 结构判断 |
| `tests/fixtures/*.ts`（21 个） | ts | 1169 | 场景夹具：子代理并发与围栏、工作区上下文压缩、PTC 模式切换、沙箱与授权等。代表文件 `fake-acp-agent.ts`（283 行）、`subagent-durability-failure.ts`（156 行） | 结构判断 |
| `tests/fixtures/record-suite/*`（24 个） | json/jsonl/yml/md | 115 | 录制模式用例：`rec-child` 子代理、`rec-pin` 固定轮、`rec-skip` 跳过回放三类，各含会话、行为脚本与期望输出 | 结构判断 |
| `tests/fixtures/suite/*`（48 个） | json/jsonl/yml/md | 251 | 回放模式六个场景：`authored-error`、`blocked-log`、`no-model`、`pin-turn`、`plain-turn`、`shared-pin`，覆盖报错、无模型、固定轮与共享前缀 | 结构判断 |
| `tests/suite.spec.ts` | ts | 1642 | 被测对象 `src/suite.ts`：三种模式的状态机、期望文件缺失与差异报告 | 结构判断 |
| `tests/harness.spec.ts` | ts | 1446 | 被测对象 `src/harness.ts`：启动、驱动、采集各阶段与失败回收 | 结构判断 |
| `tests/normalize.spec.ts` | ts | 1323 | 被测对象 `src/normalize.ts`：逐类不稳定字段的抹除规则与幂等性 | 结构判断 |
| `tests/manifest.spec.ts` | ts | 207 | 被测对象 `src/manifest.ts`：清单解析、版本兼容与缺项报错 | 结构判断 |
| `tests/identity.spec.ts` | ts | 123 | 被测对象 `src/identity.ts`：身份计算与格式升级后的稳定性 | 结构判断 |
| `tests/storage-policy.spec.ts` | ts | 77 | 被测对象 `src/session-files.ts`：落盘位置策略与越界写入拦截 | 结构判断 |
| `tests/workspace.spec.ts` | ts | 76 | 被测对象 `src/workspace.ts`：临时目录准备与产物比对 | 结构判断 |
| `tsconfig.json` | json | 30 | 编译配置，含 `tests` 与 `fixtures` | 结构判断 |

### 5.8 tool-testkit

工具调用的最小骨架：注册一个假工具、接受一次调用、返回结构化结果，用来断言工具协议本身而非具体工具。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 43 | 声明对工具协议包的依赖与导出 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 255 | 中英文档对；说明假工具的注册与断言方式 | 结构判断 |
| `src/index.ts` | ts | 92 | 入口：假工具工厂与调用记录器 | 结构判断 |
| `tests/model-call.spec.ts` | ts | 41 | 被测对象 `src/index.ts`：模型发起调用到结果回填的闭环 | 结构判断 |
| `tsconfig.json` | json | 21 | 编译配置 | 结构判断 |

### 5.9 包组自身

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 156 | 组级说明：八个子包的取舍原则，以及「mock 到什么程度算合格」的判据 | 结构判断 |

**本节统计**：覆盖 226 个文件，文档 114 行（折叠 112 条：README 三件套 9 组折 18 条、测试夹具 94 个折 94 条）。`精读` 0、`结构判断` 114、`待确认` 0。

## 六、packages/todo

23 个文件，只有一个工具包 `tool-todo`：让模型读写会话内的待办清单。它是「最小完整工具包」的样板——带 locale、带客户端投影、带四种维度的测试，新增工具时通常照它抄结构。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 123 | 组级说明：待办工具为何不做持久化、与会话生命周期的关系 | 结构判断 |
| `tool-todo/package.json` | json | 66 | 声明工具包元信息、locale 资源与对工具协议包的依赖 | 结构判断 |
| `tool-todo/README.md` / `README.zh.md` / `README.i18n.yaml` | md | 430 | 中英文档对；列出工具参数、返回结构与模型使用建议 | 结构判断 |
| `tool-todo/locale/{de,en,es,fr,ja,pt,ru,zh}.json` | json | 47 | 八个语种的工具描述与提示文案，`en` 为基准（5 行），其余为译文的 6 行（含语言标记） | 结构判断 |
| `tool-todo/src/index.ts` | ts | 213 | 工具定义主体：参数 schema、增删改查四个动作、对会话状态的读写 | 结构判断 |
| `tool-todo/src/types.ts` | ts | 48 | 待办项与会话内状态的结构定义，供工具与客户端投影共用 | 结构判断 |
| `tool-todo/src/client.ts` | ts | 10 | 客户端侧的轻量导出，只暴露投影所需类型，避免把宿主逻辑带进浏览器 | 结构判断 |
| `tool-todo/tests/tool-todo.spec.ts` | ts | 307 | 被测对象 `src/index.ts`：四个动作的参数校验、状态变更与错误返回 | 结构判断 |
| `tool-todo/tests/projection.spec.ts` | ts | 118 | 被测对象 `src/client.ts`：待办状态到 UI 投影的字段映射 | 结构判断 |
| `tool-todo/tests/integration.spec.ts` | ts | 101 | 端到端：模型调用工具后，会话消息与待办状态同步更新 | 结构判断 |
| `tool-todo/tests/loader-composition.spec.ts` | ts | 149 | 与插件加载器的组合：工具被正确注册、locale 被正确解析 | 结构判断 |
| `tool-todo/tsconfig.json` | json | 33 | 含 `tests` 的编译配置 | 结构判断 |

**本节统计**：覆盖 23 个文件，文档 12 行（折叠 11 条：README 三件套 2 组折 4 条、locale 8 个折 7 条）。`精读` 0、`结构判断` 12、`待确认` 0。

## 七、packages/typert

118 个文件，远程类型系统：用 TypeScript 类型作为唯一真源，生成宿主与客户端之间 RPC 的运行时校验器、代理与文档。四个包构成一条流水线——`protocol` 定义线上格式，`generator` 在构建期把 `.d.ts` 分析成类型模型并生成代码，`loader` 在启动期按需加载生成物，`registry` 在运行期登记服务并做调用分发。改动 `protocol` 会同时影响另外三个包，是全仓耦合度最高的工具链之一。

### 7.1 typert/generator

构建期类型分析器：读 tsconfig 项目、解析 `.d.ts`、产出类型模型、再渲染成校验器与代理源码。`tsdown-plugin.ts` 让它挂进各包的打包流程，`worker.ts` 把重活挪到子进程。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 51 | 声明对 TypeScript 编译器 API 的运行时依赖与 CLI 导出 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 415 | 中英文档对；讲清「类型模型 → 生成物」的输入输出与调试方式 | 结构判断 |
| `src/index.ts` | ts | 17 | 生成器公共入口，只再导出编排函数与类型 | 结构判断 |
| `src/analyzer.ts` | ts | 3471 | 类型分析核心：遍历类型、解析泛型与联合、处理循环引用、构建模型树。结构：前段是 TypeChecker 封装，中段按类型种类分派（对象/联合/字面量/工具类型），后段是模型归一化与错误诊断 | 结构判断 |
| `src/model.ts` | ts | 447 | 类型模型的数据结构与不变量校验，是分析器与渲染器之间的契约 | 结构判断 |
| `src/emitter.ts` | ts | 1234 | 从模型生成运行时校验代码。结构：按模型节点分派生成器，末尾统一做导入去重与格式化 | 结构判断 |
| `src/renderer.ts` | ts | 365 | 生成可读文档/类型声明文本，与 `emitter` 的运行时代码互补 | 结构判断 |
| `src/cordis-catalog.ts` | ts | 1069 | 生成 Cordis 插件与服务的目录页数据，是 `docs/cordis-api` 的输入 | 结构判断 |
| `src/workspace.ts` | ts | 214 | 解析 tsconfig 项目引用图，确定要分析哪些包与文件的顺序 | 结构判断 |
| `src/build-output-guard.ts` | ts | 225 | 防止把生成物误写进源码目录：校验输出路径、拒绝覆盖非生成文件 | 结构判断 |
| `src/tool-schema.ts` | ts | 152 | 从模型提取工具参数 schema，供 `gen-tool-catalog` 与运行时校验共用 | 结构判断 |
| `src/tsdown-plugin.ts` | ts | 279 | tsdown 插件：在打包前后自动跑生成、把产物并入 bundle | 结构判断 |
| `src/artifact-files.ts` | ts | 59 | 生成物文件命名与目录约定，保证多包同构 | 结构判断 |
| `src/worker.ts` | ts | 66 | 子进程入口，接收分析任务并回传模型，避免阻塞主构建 | 结构判断 |
| `tests/.generated-model-O7FJNT/host.mjs`、`tests/.generated-model-qwn8sk/host.mjs` | mjs | 620 | 两次测试运行留下的生成物缓存，内容完全相同（各 310 行），属临时产物而非源码 | 结构判断 |
| `tests/__snapshots__/type-model.spec.ts.snap` | snap | 6492 | 类型模型的序列化快照，是分析器行为的最终判据；体量大是因为覆盖了所有类型分支 | 结构判断 |
| `tests/type-model.spec.ts` | ts | 1752 | 被测对象 `src/analyzer.ts`：各类 TypeScript 类型到模型的映射 | 结构判断 |
| `tests/type-model-workspace.ts` | ts | 317 | 上述用例的项目搭建助手，按需生成临时 tsconfig 与源文件 | 结构判断 |
| `tests/remote-model.spec.ts` | ts | 1189 | 被测对象 `src/analyzer.ts`：跨包 remote 类型（client↔host）的解析 | 结构判断 |
| `tests/remote-metadata.spec.ts` | ts | 970 | 被测对象 `src/analyzer.ts`：类型元数据（属性、可选性、默认值）的保留 | 结构判断 |
| `tests/schema-emitter.spec.ts` | ts | 974 | 被测对象 `src/emitter.ts`：生成代码的语法正确性与运行时行为 | 结构判断 |
| `tests/renderer.spec.ts` | ts | 198 | 被测对象 `src/renderer.ts`：文本渲染格式与转义 | 结构判断 |
| `tests/cordis-catalog.spec.ts` | ts | 136 | 被测对象 `src/cordis-catalog.ts`：目录数据的字段与排序 | 结构判断 |
| `tests/cordis-catalog-contract.spec.ts` | ts | 343 | 目录数据与真实插件声明的一致性契约 | 结构判断 |
| `tests/tools-catalog.spec.ts` | ts | 82 | 被测对象 `src/tool-schema.ts`：工具 schema 提取 | 结构判断 |
| `tests/tsdown-plugin.spec.ts` | ts | 407 | 被测对象 `src/tsdown-plugin.ts`：钩子时序、产物合并与失败回滚 | 结构判断 |
| `tests/tsdown-plugin-worker.spec.ts` | ts | 49 | 被测对象 `src/worker.ts`：子进程任务的分发与回传 | 结构判断 |
| `tests/remote-module.ts` | ts | 22 | remote 用例的模块声明助手，被上述两个 remote 用例共用 | 结构判断 |
| `tests/fixtures/remote-model/**`（12 个） | ts/json/d.ts | 315 | 跨包 remote 测试项目：`domain` 与 `remote` 两包 + 协议声明 `typert-protocol.d.ts`（156 行） | 结构判断 |
| `tests/fixtures/type-model/**`（17 个） | ts/json/d.ts | 543 | 单包类型测试项目：`client`/`host`/`write` 三个包与五份 tsconfig，覆盖不同编译面 | 结构判断 |
| `tsconfig.json` | json | 18 | 生成器自身编译配置 | 结构判断 |

### 7.2 typert/loader

启动期加载器：按包名找到生成物，在隔离作用域里求值并缓存，同时提供「懒加载失败时报出原始栈」的诊断。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 51 | 声明导出与 locale 资源 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 314 | 中英文档对；说明加载时机、缓存键与失败诊断 | 结构判断 |
| `src/index.ts` | ts | 507 | 加载器主体：路径解析、模块求值、缓存与错误包装。结构：前半是解析与缓存，后半是诊断信息拼装 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | json | 47 | 八个语种的加载失败提示文案 | 结构判断 |
| `tests/loader.spec.ts` | ts | 814 | 被测对象 `src/index.ts`：缓存命中、并发加载、缺失生成物与诊断文本 | 结构判断 |
| `tests/lazy-info.spec.ts` | ts | 35 | 懒加载信息对象的形状与惰性求值时机 | 结构判断 |
| `tsconfig.json` | json | 30 | 编译配置 | 结构判断 |

### 7.3 typert/protocol

线上协议：定义 remote 调用的信封、错误码、所有权语义与访问控制标记。它是宿主与客户端唯一的共享契约，`types.ts` 近千行，改一处即改全链路。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 51 | 声明零运行时依赖，保证宿主与客户端都能引 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 419 | 中英文档对；定义信封字段、错误分类与版本兼容规则 | 结构判断 |
| `src/index.ts` | ts | 488 | 协议入口：信封构造/解析、错误工厂、类型守卫 | 结构判断 |
| `src/types.ts` | ts | 957 | 协议类型总表：调用、返回、流事件、错误、所有权与访问标记。结构：按「请求/响应/流/错误/元信息」五段组织，每段先类型后守卫 | 结构判断 |
| `src/remote-error.ts` | ts | 49 | 错误类型与错误码映射，保证跨进程错误可还原 | 结构判断 |
| `src/remote-info.ts` | ts | 161 | 服务/方法元信息结构，供 registry 登记与客户端发现 | 结构判断 |
| `src/remote-access.ts` | ts | 38 | 访问控制标记（只读、需授权等）的定义与判定 | 结构判断 |
| `src/json-value.ts` | ts | 53 | 可序列化 JSON 值的类型与校验，拒绝函数、Symbol 等线上不可传值 | 结构判断 |
| `src/owned-value.ts` | ts | 39 | 「所有权」包装：标记值由哪一侧持有，防止跨端误改 | 结构判断 |
| `src/principal.ts` | ts | 17 | 调用主体（principal）的最小标识结构 | 结构判断 |
| `tests/protocol.spec.ts` | ts | 500 | 被测对象 `src/index.ts` 与 `types.ts`：信封往返、错误还原、非法输入 | 结构判断 |
| `tests/remote-access.spec.ts` | ts | 267 | 被测对象 `src/remote-access.ts`：访问标记的组合与拒绝路径 | 结构判断 |
| `tests/remote-info.spec.ts` | ts | 230 | 被测对象 `src/remote-info.ts`：元信息解析与兼容性 | 结构判断 |
| `tests/owned-value.spec.ts` | ts | 27 | 被测对象 `src/owned-value.ts`：所有权标记的传递规则 | 结构判断 |
| `tests/built-runtime.e2e.ts` | ts | 61 | 端到端：在构建产物上验证协议可用，而非仅源码 | 结构判断 |
| `tests/fixtures/source-launch.ts` | ts | 32 | 从源码启动被测运行时的夹具 | 结构判断 |
| `tsconfig.json` | json | 21 | 编译配置 | 结构判断 |

### 7.4 typert/registry

运行期服务登记与调用分发：把实现注册成「服务.方法」，按协议做参数校验、主体鉴权与错误包装，是 remote 调用的最后一跳。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 68 | 声明导出、locale 与对 `protocol` 的依赖 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 335 | 中英文档对；说明注册 API、生命周期与并发语义 | 结构判断 |
| `src/index.ts` | ts | 27 | 入口：再导出服务、类型与客户端助手 | 结构判断 |
| `src/service.ts` | ts | 817 | 登记与分发核心：服务表、方法调用链、鉴权、校验、错误归一。结构：注册段、查找段、调用段、观测段四段 | 结构判断 |
| `src/types.ts` | ts | 118 | registry 自身的类型：注册项、调用上下文、结果包装 | 结构判断 |
| `src/client/index.ts` | ts | 15 | 客户端侧入口，只导出代理类型与调用助手 | 结构判断 |
| `locale/{de,en,es,fr,ja,pt,ru,zh}.json` | json | 47 | 八个语种的调用错误提示 | 结构判断 |
| `tests/typert.spec.ts` | ts | 780 | 被测对象 `src/service.ts`：注册冲突、方法调用、鉴权失败与错误穿透 | 结构判断 |
| `tsconfig.json` | json | 21 | 编译配置 | 结构判断 |
| `tsdown.config.ts` | ts | 3 | 极简打包配置，复用根默认值 | 结构判断 |

### 7.5 包组自身

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 129 | 组级说明：四包流水线的顺序与「类型是唯一真源」的约束 | 结构判断 |

**本节统计**：覆盖 118 个文件，文档 66 行（折叠 52 条：README 三件套 5 组折 10 条、locale 16 个折 14 条、测试夹具 29 个折 27 条、生成物缓存 2 个折 1 条）。`精读` 0、`结构判断` 66、`待确认` 0。

## 八、packages/util

210 个文件，23 个零业务依赖的基座包。它们的共同约束是：不 import 任何 `packages/` 下的其它业务包，只依赖 Node 内置模块，因此可以被宿主、客户端、测试三侧同时引用。每个包的形状高度一致（`package.json` + README 三件套 + `src/index.ts` + `tests/*.spec.ts` + `tsconfig.json`），差异只在于是否有多文件拆分。下面按包分节，定位一句话，逐文件列职责。

### 8.1 util/atomic-write

原子写入：写临时文件、`fsync`、再 `rename`，保证崩溃时目标文件要么是旧内容要么是新内容。所有需要「不能写一半」的落盘都走它。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单，声明零依赖与导出入口 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 329 | 中英文档对；说明同目录临时文件、权限继承与 Windows 语义差异 | 结构判断 |
| `src/index.ts` | ts | 273 | 原子写实现：临时文件命名、写入与 `fsync`、`rename`、失败清理、目录创建 | 结构判断 |
| `tests/atomic-write.spec.ts` | ts | 510 | 被测对象 `src/index.ts`：并发写、崩溃点模拟、权限与跨设备回退 | 结构判断 |
| `tsconfig.json` | json | 10 | 编译配置 | 结构判断 |

### 8.2 util/brand

产品品牌常量：名称、appId、协议前缀等唯一出处，避免字符串散落。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 260 | 中英文档对；声明「品牌值只在此处定义」的约束 | 结构判断 |
| `src/index.ts` | ts | 39 | 导出产品名、appId、URL scheme 与文件扩展名等常量 | 结构判断 |
| `tests/brand.spec.ts` | ts | 13 | 断言常量符合命名规范（小写、无反斜杠等） | 结构判断 |
| `tsconfig.json` | json | 10 | 编译配置 | 结构判断 |

### 8.3 util/chunked-list

把长列表切成固定大小的块，用于分批渲染与分批请求。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 41 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 219 | 中英文档对；说明块大小语义与末块处理 | 结构判断 |
| `src/index.ts` | ts | 58 | 切块函数与边界处理（空列表、块大于长度） | 结构判断 |
| `tests/chunked-list.spec.ts` | ts | 59 | 被测对象 `src/index.ts`：块数与末块长度 | 结构判断 |
| `tsconfig.json` | json | 11 | 编译配置 | 结构判断 |

### 8.4 util/code-language

代码语言识别与规范化：把文件扩展名、语言别名映射到统一的语言标识，供高亮与工具判断使用。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 121 | 中英文档对；列出支持的标识与别名映射规则 | 结构判断 |
| `src/index.ts` | ts | 233 | 扩展名/别名到语言标识的映射表与规范化函数 | 结构判断 |
| `tests/code-language.spec.ts` | ts | 174 | 被测对象 `src/index.ts`：别名归一、未知语言回退 | 结构判断 |
| `tsconfig.json` | json | 10 | 编译配置 | 结构判断 |

### 8.5 util/crypto

加密与标识生成：UUID、哈希、常量时间比较等小工具。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 172 | 中英文档对；强调「不是通用密码学库」的边界 | 结构判断 |
| `src/index.ts` | ts | 41 | UUID 生成与短标识函数，内部使用 `node:crypto` | 结构判断 |
| `tests/uuid.spec.ts` | ts | 37 | 被测对象 `src/index.ts`：格式、唯一性与版本位 | 结构判断 |
| `tsconfig.json` | json | 10 | 编译配置 | 结构判断 |

### 8.6 util/deque

双端队列：两端 O(1) 增删，用于需要「先进先出但偶尔从尾部剔除」的窗口缓冲。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 252 | 中英文档对；给出与数组 `shift` 的复杂度对比 | 结构判断 |
| `src/index.ts` | ts | 95 | 环形缓冲实现与容量增长策略 | 结构判断 |
| `benchmarks/drain.ts` | ts | 36 | 出队吞吐基准，用于验证扩容策略没有退化 | 结构判断 |
| `tests/deque.spec.ts` | ts | 94 | 被测对象 `src/index.ts`：两端操作、扩容、清空 | 结构判断 |
| `tsconfig.json` | json | 11 | 编译配置 | 结构判断 |

### 8.7 util/error

错误基类与归类助手：把任意抛出物归一成带 `code` 的错误对象。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 186 | 中英文档对；说明错误码约定与不可重试判定 | 结构判断 |
| `src/index.ts` | ts | 22 | 错误基类与 `toError` 归一函数 | 结构判断 |
| `tests/error.spec.ts` | ts | 19 | 被测对象 `src/index.ts`：非 Error 抛出物的包装 | 结构判断 |
| `tsconfig.json` | json | 10 | 编译配置 | 结构判断 |

### 8.8 util/file-drag

拖拽文件的名称与路径处理：从 `DataTransfer` 里提取真实路径、去重、按平台修正分隔符。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 42 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 111 | 中英文档对；说明浏览器安全限制下的降级行为 | 结构判断 |
| `src/index.ts` | ts | 76 | 拖拽项到路径的解析与去重 | 结构判断 |
| `tests/names.spec.ts` | ts | 31 | 被测对象 `src/index.ts`：重名文件与非法字符 | 结构判断 |
| `tsconfig.json` | json | 15 | 含 DOM lib 的编译配置 | 结构判断 |

### 8.9 util/home-paths

用户目录布局：数据目录、配置目录、日志目录的唯一计算入口，区分开发/生产与便携模式。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 301 | 中英文档对；按平台列出目录位置与覆盖用的环境变量 | 结构判断 |
| `src/index.ts` | ts | 197 | 平台分支与目录解析，含 `DSH_HOME` 类环境变量优先级 | 结构判断 |
| `tests/home-paths.spec.ts` | ts | 135 | 被测对象 `src/index.ts`：三平台路径、环境变量覆盖与非法值 | 结构判断 |
| `tsconfig.json` | json | 10 | 编译配置 | 结构判断 |

### 8.10 util/http-proxy

HTTP 代理安装与匹配策略：把 `fetch`/`http` 请求按规则分流到代理，支持 no-proxy 列表与本地回环豁免。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 41 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 305 | 中英文档对；列出匹配优先级与「回环不走代理」的安全理由 | 结构判断 |
| `src/index.ts` | ts | 26 | 入口，再导出安装函数与策略类型 | 结构判断 |
| `src/install.ts` | ts | 368 | 安装/还原全局代理钩子，覆盖 `http`、`https`、`fetch` 三条路径且保证幂等 | 结构判断 |
| `src/policy.ts` | ts | 343 | 匹配策略：按主机、端口、协议判定是否走代理，含通配与否定规则 | 结构判断 |
| `tests/install.spec.ts` | ts | 458 | 被测对象 `src/install.ts`：安装、重复安装、还原与异常后清理 | 结构判断 |
| `tests/install-http1.spec.ts` | ts | 146 | 同上，HTTP/1 专属分支与 socket 复用 | 结构判断 |
| `tests/policy.spec.ts` | ts | 242 | 被测对象 `src/policy.ts`：规则优先级、否定与默认值 | 结构判断 |
| `tests/matcher-parity.spec.ts` | ts | 75 | 策略匹配与 Node 内置 matcher 的一致性对照 | 结构判断 |
| `tsconfig.json` | json | 10 | 编译配置 | 结构判断 |

### 8.11 util/launch-environment

启动环境构造：把父进程环境、用户配置与测试覆盖合并成子进程可用的 `env`，并剔除敏感变量。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 279 | 中英文档对；列出被剔除的变量与合并顺序 | 结构判断 |
| `src/index.ts` | ts | 137 | 环境合并、白名单/黑名单过滤与调试变量注入 | 结构判断 |
| `tests/launch-environment.spec.ts` | ts | 87 | 被测对象 `src/index.ts`：合并优先级与敏感变量剔除 | 结构判断 |
| `tsconfig.json` | json | 15 | 编译配置 | 结构判断 |

### 8.12 util/lazy-require

延迟 `require`：把 CJS 依赖的加载推迟到首次使用，缩短启动时间并允许可选依赖缺失。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 212 | 中英文档对；说明 ESM 下的限制与缓存语义 | 结构判断 |
| `src/index.ts` | ts | 24 | `createRequire` 封装与懒加载工厂 | 结构判断 |
| `tests/fixtures/value.cjs` | cjs | 2 | 被懒加载的最小 CJS 模块 | 结构判断 |
| `tests/index.spec.ts` | ts | 27 | 被测对象 `src/index.ts`：只加载一次、缺失依赖的报错 | 结构判断 |
| `tsconfig.json` | json | 11 | 编译配置 | 结构判断 |

### 8.13 util/native-command

「用系统默认程序打开文件/URL」的跨平台实现：macOS 走 `open`、Windows 走 shell 关联、Linux 走 xdg 查询，并处理文件管理器定位。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 43 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 300 | 中英文档对；按平台列出打开方式与失败降级 | 结构判断 |
| `src/index.ts` | ts | 27 | 入口，再导出打开器与文件关联查询 | 结构判断 |
| `src/path-opener.ts` | ts | 308 | 统一的打开/定位入口，按平台分派并处理路径存在性校验 | 结构判断 |
| `src/file-applications.ts` | ts | 200 | 跨平台「某扩展名默认由谁打开」的公共逻辑与缓存 | 结构判断 |
| `src/file-applications-linux.ts` | ts | 66 | Linux 侧解析 `xdg-mime` 输出 | 结构判断 |
| `src/file-applications-windows.ts` | ts | 276 | Windows 侧读注册表关联与 ProgID | 结构判断 |
| `src/desktop-entry.ts` | ts | 76 | 解析 `.desktop` 文件，供 Linux 定位器使用 | 结构判断 |
| `src/host-environment.ts` | ts | 21 | 判定当前是否具备桌面环境（有无 `DISPLAY` 等） | 结构判断 |
| `src/runner.ts` | ts | 44 | 子进程执行封装，统一超时与错误码 | 结构判断 |
| `src/types.ts` | ts | 34 | 打开结果与应用信息的类型定义 | 结构判断 |
| `tests/path-opener.spec.ts` | ts | 494 | 被测对象 `src/path-opener.ts`：三平台分派、路径不存在与命令失败 | 结构判断 |
| `tests/file-applications.spec.ts` | ts | 185 | 被测对象 `src/file-applications.ts`：缓存与回退顺序 | 结构判断 |
| `tests/file-applications-linux.spec.ts` | ts | 64 | Linux 分支：`xdg-mime` 输出解析（桩） | 结构判断 |
| `tests/file-applications-linux-native.spec.ts` | ts | 59 | Linux 分支：真实调用系统命令的集成用例 | 结构判断 |
| `tests/file-applications-windows.spec.ts` | ts | 114 | Windows 分支：注册表读取与 ProgID 归一 | 结构判断 |
| `tests/host-environment.spec.ts` | ts | 19 | 被测对象 `src/host-environment.ts`：桌面环境判定 | 结构判断 |
| `tests/native-command.spec.ts` | ts | 43 | 包级冒烟：入口导出完整 | 结构判断 |
| `tsconfig.json` | json | 10 | 编译配置 | 结构判断 |

### 8.14 util/official-bundles

官方插件包目录：声明哪些插件随产品内置、各自版本与加载入口。`catalog.generated.ts` 由 `scripts/gen-official-bundle-catalog.ts` 生成。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 41 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 230 | 中英文档对；说明内置包与市场包的区别 | 结构判断 |
| `src/index.ts` | ts | 24 | 入口，再导出目录与查询函数 | 结构判断 |
| `src/bundles.ts` | ts | 78 | bundle 定义类型与按名称查找 | 结构判断 |
| `src/catalog.generated.ts` | ts | 23 | 生成物：内置包清单元数据，禁止手改 | 结构判断 |
| `src/plugin-manager.ts` | ts | 78 | 判定某插件是否属于官方内置、应走哪条安装路径 | 结构判断 |
| `tests/official-bundles.spec.ts` | ts | 32 | 被测对象 `src/index.ts`：生成目录与声明一致 | 结构判断 |
| `tsconfig.json` | json | 15 | 编译配置 | 结构判断 |

### 8.15 util/output-retention

输出保留策略：长任务输出按「保留头尾、截断中间」压缩，并给出截断标记与原始长度。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 401 | 中英文档对；给出各策略的保留比例与选择建议 | 结构判断 |
| `src/index.ts` | ts | 460 | 策略实现：按行/字节/时间窗口三种裁剪，含二进制与超大单行保护 | 结构判断 |
| `tests/output-retention.spec.ts` | ts | 409 | 被测对象 `src/index.ts`：边界长度、超长单行与标记格式 | 结构判断 |
| `tsconfig.json` | json | 10 | 编译配置 | 结构判断 |

### 8.16 util/package-manifest

包清单模型：`package.json` 的字段子集与校验，供插件安装与市场流程判定合法性。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 249 | 中英文档对；列出必填字段与版本范围语法 | 结构判断 |
| `src/index.ts` | ts | 15 | 入口，再导出解析函数与类型 | 结构判断 |
| `src/types.ts` | ts | 100 | 清单类型定义与字段校验（含 engines、exports 等） | 结构判断 |
| `tsconfig.json` | json | 11 | 编译配置 | 结构判断 |

### 8.17 util/plugin-detail

插件详情的数据组装：把清单、README、图标与仓库信息合成一份供详情页展示的结构。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 43 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 248 | 中英文档对；说明字段来源与缺失时的占位 | 结构判断 |
| `src/index.ts` | ts | 13 | 入口，再导出组装函数 | 结构判断 |
| `src/document.ts` | ts | 140 | 读取 README 并抽取标题、摘要与语言 | 结构判断 |
| `src/files.ts` | ts | 283 | 收集插件目录内的图标、截图等资源并给出相对路径 | 结构判断 |
| `src/response.ts` | ts | 37 | 详情响应结构组装与字段裁剪 | 结构判断 |
| `src/types.ts` | ts | 12 | 详情结构类型 | 结构判断 |
| `tests/document.spec.ts` | ts | 92 | 被测对象 `src/document.ts`：摘要抽取与多语言 README | 结构判断 |
| `tests/files.spec.ts` | ts | 160 | 被测对象 `src/files.ts`：资源发现、缺失与越界路径 | 结构判断 |
| `tsconfig.json` | json | 10 | 编译配置 | 结构判断 |

### 8.18 util/plugin-market-index

插件市场索引：把多个来源的插件清单合并、去重、排序成客户端可消费的索引。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 43 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 186 | 中英文档对；说明索引版本与增量合并规则 | 结构判断 |
| `src/index.ts` | ts | 334 | 合并、去重、按热度排序与版本比较 | 结构判断 |
| `src/types.ts` | ts | 111 | 索引条目与来源的类型定义 | 结构判断 |
| `tests/plugin-market-index.spec.ts` | ts | 312 | 被测对象 `src/index.ts`：重复条目、版本回退与排序稳定性 | 结构判断 |
| `tsconfig.json` | json | 14 | 编译配置 | 结构判断 |

### 8.19 util/ripgrep

`rg` 调用封装：定位随包分发的二进制、拼参数、把流式输出解析成匹配结果。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 43 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 195 | 中英文档对；列出支持的搜索模式与二进制查找顺序 | 结构判断 |
| `src/index.ts` | ts | 109 | 二进制路径解析与参数构造，输出流解析 | 结构判断 |
| `tests/path.spec.ts` | ts | 90 | 被测对象二进制查找：平台后缀与缺失回退 | 结构判断 |
| `tests/stream.spec.ts` | ts | 99 | 被测对象输出解析：多行匹配、无匹配与截断 | 结构判断 |
| `tsconfig.json` | json | 21 | 编译配置 | 结构判断 |

### 8.20 util/time

时间原语集合：时刻、时长、cron、RRULE 与重复规则。是全仓唯一允许做时间运算的地方，业务代码不得自己算时区。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 43 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 289 | 中英文档对；声明时区策略与 DST 处理原则 | 结构判断 |
| `src/index.ts` | ts | 50 | 入口，再导出五类时间 API | 结构判断 |
| `src/instant.ts` | ts | 313 | 时刻表示与运算：解析、格式化、比较、时区偏移 | 结构判断 |
| `src/duration.ts` | ts | 110 | 时长表示与人类可读格式化 | 结构判断 |
| `src/cron.ts` | ts | 492 | cron 表达式解析与下次触发计算，含 DST 跳变处理 | 结构判断 |
| `src/rrule.ts` | ts | 689 | iCalendar RRULE 子集实现。结构：解析段、展开段（按频率分派）、边界收束段 | 结构判断 |
| `src/recurrence.ts` | ts | 54 | 重复规则的高层封装，统一 cron 与 RRULE 两种来源 | 结构判断 |
| `tests/time.spec.ts` | ts | 29 | 包级冒烟：入口导出 | 结构判断 |
| `tests/instant.spec.ts` | ts | 265 | 被测对象 `src/instant.ts`：时区、跨日与 DST | 结构判断 |
| `tests/duration.spec.ts` | ts | 105 | 被测对象 `src/duration.ts`：格式化与解析往返 | 结构判断 |
| `tests/cron.spec.ts` | ts | 360 | 被测对象 `src/cron.ts`：字段边界、下次触发与 DST | 结构判断 |
| `tests/rrule.spec.ts` | ts | 387 | 被测对象 `src/rrule.ts`：各频率、间隔与终止条件 | 结构判断 |
| `tests/recurrence.spec.ts` | ts | 104 | 被测对象 `src/recurrence.ts`：两种来源的统一行为 | 结构判断 |
| `tsconfig.json` | json | 11 | 编译配置 | 结构判断 |

### 8.21 util/timeout

超时与取消：给 Promise 加可中止的时限，区分「超时」「主动取消」「底层失败」三种结局。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 370 | 中英文档对；说明信号传递与资源清理责任 | 结构判断 |
| `src/index.ts` | ts | 212 | 超时包装、`AbortSignal` 组合与三种结局的错误类型 | 结构判断 |
| `tests/timeout.spec.ts` | ts | 306 | 被测对象 `src/index.ts`：竞态、清理与嵌套超时 | 结构判断 |
| `tsconfig.json` | json | 10 | 编译配置 | 结构判断 |

### 8.22 util/values

值判定与流式 JSON 解析：类型守卫、深比较，以及从半截文本里增量解析 JSON（模型流式输出的关键）。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 250 | 中英文档对；说明部分 JSON 的容错范围与已知不支持项 | 结构判断 |
| `src/index.ts` | ts | 293 | 类型守卫、深比较与空值归一 | 结构判断 |
| `src/partial-json.ts` | ts | 666 | 增量 JSON 解析器：状态机逐字符消费，允许未闭合字符串/数组/对象。结构：词法段、状态机段、补全与错误恢复段 | 结构判断 |
| `tests/partial-json.spec.ts` | ts | 1260 | 被测对象 `src/partial-json.ts`：逐前缀截断、转义、嵌套与恢复 | 结构判断 |
| `tests/weak-map-with-values.spec.ts` | ts | 57 | 值映射助手（同值集合的弱引用存储）行为 | 结构判断 |
| `tsconfig.json` | json | 11 | 编译配置 | 结构判断 |

### 8.23 util/workspace-path

工作区路径与文件地址：把绝对路径转成可展示、可点击的地址（含媒体 URL），以及反解。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 38 | 包清单 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 123 | 中英文档对；说明地址协议与跨平台分隔符归一 | 结构判断 |
| `src/index.ts` | ts | 124 | 路径归一、相对化与可展示文本生成 | 结构判断 |
| `src/file-address.ts` | ts | 112 | 文件地址（含行号锚点与媒体 URL）的构造与解析 | 结构判断 |
| `tests/index.spec.ts` | ts | 99 | 被测对象 `src/index.ts`：Windows 盘符、UNC 与相对路径 | 结构判断 |
| `tests/file-address.spec.ts` | ts | 120 | 被测对象 `src/file-address.ts`：往返一致与非法输入 | 结构判断 |
| `tests/file-media-url.spec.ts` | ts | 32 | 媒体 URL 的编码与查询参数 | 结构判断 |
| `tsconfig.json` | json | 10 | 编译配置 | 结构判断 |

### 8.24 包组自身

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 163 | 组级说明：23 个包的准入标准（零业务依赖、无跨包引用）与新增包的检查清单 | 结构判断 |

**本节统计**：覆盖 210 个文件，文档 162 行（折叠 48 条：README 三件套 24 组折 48 条）。`精读` 0、`结构判断` 162、`待确认` 0。

## 九、packages/web

让模型「能上网」的能力层。分两半：`tool-web` 是模型看得见的那个工具（参数、截断、把抓回来的 HTML 转成 Markdown）；其余四个包是可替换的提供方——`web` 定接口，`web-fetch-http` 用本机 HTTP 客户端抓页面，`web-search-deepseek` 走 DeepSeek 搜索端点，`web-deepseek-api` 提供统一的传输与凭据解析。工具层不认识具体厂商，提供方层不认识工具参数，换搜索源不需要动工具。

### 9.1 包组自身

组级文档只做导航与准入说明，没有代码。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `AGENTS.md` | md | 5 | 指向仓库根 `AGENTS.md` 的短指针，交代本组编辑约束。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 53 | 组级说明：五个包的分层（工具 / 抽象 / 提供方）与装配顺序。 | 结构判断 |

### 9.2 web/tool-web

模型侧 `web` 工具的实现：一次调用要么抓页面、要么搜网页，两条路径共用同一套参数校验与结果截断。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 68 | 包清单与 DSH 插件元数据（工具名、依赖的提供方服务）。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 293 | 中英文档对：工具契约、截断阈值、超长结果落盘的引用格式。 | 结构判断 |
| `locale/*.json`（8 个） | json | 5–6 | 八语言工具描述与参数文案，直接进模型可见的 tool description。 | 结构判断 |
| `src/index.ts` | ts | 103 | 工具注册入口：解析配置、把请求按 `fetch`/`search` 分派给对应提供方。 | 结构判断 |
| `src/fetch.ts` | ts | 517 | 抓取路径：URL 与协议校验、重定向跟随、HTML→Markdown 转换、按字节截断。结构：校验段、转换段、截断与落盘段。 | 结构判断 |
| `src/search.ts` | ts | 415 | 搜索路径：查询构造、结果去重、按条目数与字符数拼装摘要。 | 结构判断 |
| `src/trust.ts` | ts | 7 | turndown 的 `trust` 判定常量，决定哪些标签在转换时保留。 | 结构判断 |
| `src/turndown-plugin-gfm.d.ts` | ts | 12 | 第三方 GFM 插件的类型声明补丁，无运行时代码。 | 结构判断 |
| `tests/tool-web.spec.ts` | ts | 1316 | 主用例集：参数校验、错误码映射、截断边界、落盘引用。 | 结构判断 |
| `tests/integration.spec.ts` | ts | 205 | 工具整体链路：真实入口 + mock 提供方，覆盖 fetch 与 search 两条分支。 | 结构判断 |
| `tests/spill.spec.ts` | ts | 112 | 超长结果落盘：文件命名、引用文本、再次读取。 | 结构判断 |
| `tests/load-path.spec.ts` | ts | 43 | 插件按包入口解析与加载的路径正确性。 | 结构判断 |
| `tsconfig.json` | json | 37 | 编译配置。 | 结构判断 |

### 9.3 web/web

提供方抽象层：只定义接口、类型与错误码，不实现任何出站请求。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | --- | --- | --- |
| `package.json` | json | 65 | 包清单：导出提供方接口与注册服务名。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 211 | 中英文档对：`fetch` 与 `search` 两个提供方契约、注册优先级、错误码语义。 | 结构判断 |
| `locale/*.json`（8 个） | json | 5–6 | 八语言错误文案（提供方缺失、请求被拒等）。 | 结构判断 |
| `src/index.ts` | ts | 305 | 提供方注册与解析：按名字取实现，缺省回退与缺失时报错。 | 结构判断 |
| `src/types.ts` | ts | 202 | 请求/响应结构与错误码枚举，工具层与提供方层共用的唯一契约。 | 结构判断 |
| `tests/web.spec.ts` | ts | 394 | 被测对象 `src/index.ts`：注册、覆盖、缺省解析与错误分支。 | 结构判断 |
| `tsconfig.json` | json | 30 | 编译配置。 | 结构判断 |

### 9.4 web/web-deepseek-api

DeepSeek 自家接口的接入层：凭据从哪来、请求怎么发、失败怎么归类，与「搜什么、抓什么」解耦。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | --- | --- | --- |
| `package.json` | json | 74 | 包清单与插件元数据（配置 schema、依赖的凭据服务）。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 140 | 中英文档对：配置字段、凭据解析顺序、出站域名范围。 | 结构判断 |
| `locale/*.json`（8 个） | json | 5–6 | 八语言错误与提示文案。 | 结构判断 |
| `src/index.ts` | ts | 389 | 插件入口：读配置、解析凭据、组装 transport，并把两个能力注册为提供方。 | 结构判断 |
| `src/transport.ts` | ts | 431 | HTTP 传输：超时、重试与退避、错误分类（可重试/不可重试/凭据失效）。 | 结构判断 |
| `src/search.ts` | ts | 169 | 搜索端点封装：请求体构造与响应映射。 | 结构判断 |
| `src/fetch.ts` | ts | 63 | 抓取端点封装：提交 URL、取回正文。 | 结构判断 |
| `tests/credential-resolution.spec.ts` | ts | 733 | 被测对象凭据解析：配置 / 环境变量 / 凭据存储三层优先级与缺省失败。 | 结构判断 |
| `tests/transport.spec.ts` | ts | 484 | 被测对象 `src/transport.ts`：重试次数、退避、超时与错误映射。 | 结构判断 |
| `tests/search.spec.ts` | ts | 292 | 被测对象 `src/search.ts`：请求体与响应映射。 | 结构判断 |
| `tests/composition.spec.ts` | ts | 168 | 插件装配：与 `web` 抽象层组合后的解析结果。 | 结构判断 |
| `tests/redirect.spec.ts` | ts | 129 | 重定向处理与跳转上限。 | 结构判断 |
| `tests/credentials.spec.ts` | ts | 92 | 凭据对象的构造与脱敏输出。 | 结构判断 |
| `tests/fetch.spec.ts` | ts | 76 | 被测对象 `src/fetch.ts`：端点参数与返回结构。 | 结构判断 |
| `tests/egress.spec.ts` | ts | 41 | 出站域名白名单：非白名单主机被拒。 | 结构判断 |
| `tests/web-deepseek-api.e2e.ts` | ts | 27 | 端到端冒烟：真实插件入口跑通一次调用。 | 结构判断 |
| `tests/routes.ts` | ts | 48 | 测试夹具：mock 服务的路由表，被上述用例复用（无扩展名之外的产物）。 | 结构判断 |
| `tests/guidance.ts` | ts | 14 | 测试夹具：错误提示文案的中英文断言样本。 | 结构判断 |
| `tsconfig.json` | json | 55 | 编译配置。 | 结构判断 |

### 9.5 web/web-fetch-http

通用 HTTP 抓取提供方：不依赖厂商，直接用本机网络取页面，因此把「能抓什么」收敛成一份出站策略。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | --- | --- | --- |
| `package.json` | json | 49 | 包清单：把本包实现注册为默认 `fetch` 提供方。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 148 | 中英文档对：允许的协议、拒绝的主机段、体积与重定向上限。 | 结构判断 |
| `locale/*.json`（8 个） | json | 5–6 | 八语言拒绝与失败文案。 | 结构判断 |
| `src/index.ts` | ts | 94 | 插件入口：读取策略配置并注册提供方。 | 结构判断 |
| `src/policy.ts` | ts | 125 | 出站策略：协议白名单、回环/私网地址拒绝、大小与超时上限。 | 结构判断 |
| `src/provider.ts` | ts | 259 | 单次请求实现：发起请求、跟随重定向、按内容类型取正文。 | 结构判断 |
| `tests/fetch-http.spec.ts` | ts | 555 | 主用例：策略拒绝、内容类型分支、截断与错误映射。 | 结构判断 |
| `tests/proxy.spec.ts` | ts | 111 | 代理设置（来自启动环境）是否被正确透传给请求。 | 结构判断 |
| `tsconfig.json` | json | 27 | 编译配置。 | 结构判断 |

### 9.6 web/web-search-deepseek

DeepSeek 搜索提供方：把「一次搜索」翻译成端点请求，并把返回结果整理成模型可读的条目。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | --- | --- | --- |
| `package.json` | json | 64 | 包清单与插件元数据（配置 schema、注册的提供方名）。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 200 | 中英文档对：结果条数与字符预算、站点过滤、失败重试语义。 | 结构判断 |
| `locale/*.json`（8 个） | json | 5–6 | 八语言提示与错误文案。 | 结构判断 |
| `src/index.ts` | ts | 185 | 插件入口：校验配置、注册提供方，暴露可配置项给设置页。 | 结构判断 |
| `src/provider.ts` | ts | 462 | 搜索实现：查询构造、分页、结果映射与去重。 | 结构判断 |
| `src/types.ts` | ts | 49 | 本提供方私有的请求/响应结构。 | 结构判断 |
| `tests/deepseek.spec.ts` | ts | 1035 | 主用例：查询构造、结果映射、去重、条数与字符预算。 | 结构判断 |
| `tests/settings.spec.ts` | ts | 78 | 设置项读写对运行时行为的影响。 | 结构判断 |
| `tests/redirect.spec.ts` | ts | 129 | 与 `web-deepseek-api` 同名同长度，疑为复制；重定向处理。 | 结构判断 |
| `tests/egress.spec.ts` | ts | 40 | 出站域名限制：非允许主机被拒。 | 结构判断 |
| `tests/deepseek.e2e.ts` | ts | 39 | 端到端冒烟：真实配置下的单次搜索。 | 结构判断 |
| `tsconfig.json` | json | 43 | 编译配置。 | 结构判断 |

**本节统计**：覆盖 109 个文件，文档 62 行（折叠 47 条：README 三件套 6 组折 12 条、locale 5 组共 40 个折 35 条）。`精读` 0、`结构判断` 62、`待确认` 0。

## 十、packages/workflow

工作流能力分三层：`workflow` 是领域层（定义、持久化、运行时接口），`tool-workflow` 是模型侧的创作与执行工具，`workflow-ptc` 是把工作流放进隔离执行环境（realm）里跑的那一层，含 host 与 guest 两侧代码。三者版本节奏不同：领域层改格式，工具层改参数，ptc 层改沙箱协议。

### 10.1 包组自身

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 53 | 组级说明：三层职责边界与「定义」与「运行」的分离。 | 结构判断 |

### 10.2 workflow/tool-workflow

模型侧工具：把一次结构化请求翻译成工作流定义，或触发一次运行并取回结果。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 70 | 包清单与插件元数据（工具名与参数 schema 入口）。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 186 | 中英文档对：工具动作集合、参数约束、返回值形态。 | 结构判断 |
| `locale/*.json`（8 个） | json | 5–6 | 八语言工具描述与参数文案，进模型可见的 tool description。 | 结构判断 |
| `src/index.ts` | ts | 487 | 工具实现主体：动作分派、参数校验、调用领域层并格式化结果。 | 结构判断 |
| `src/record.ts` | ts | 64 | 单次运行记录的读写与状态字段。 | 结构判断 |
| `src/types.ts` | ts | 64 | 工具私有参数与结果类型。 | 结构判断 |
| `tests/tool-workflow.spec.ts` | ts | 725 | 被测对象 `src/index.ts`：各动作的正常路径、参数错误与失败回传。 | 结构判断 |
| `tsconfig.json` | json | 42 | 编译配置。 | 结构判断 |

### 10.3 workflow/workflow

领域层：工作流定义的结构、持久化单元与运行时接口，不含具体执行器。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 51 | 包清单：导出领域服务与存储单元声明。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 142 | 中英文档对：定义格式、版本、与运行时提供方的接缝。 | 结构判断 |
| `src/index.ts` | ts | 203 | 领域服务：工作流的增删查改、列表与版本迁移入口。 | 结构判断 |
| `src/types.ts` | ts | 131 | 定义结构（节点、边、参数绑定）与领域错误码。 | 结构判断 |
| `src/runtime-types.ts` | ts | 49 | 运行时提供方接口，供 `workflow-ptc` 之类实现。 | 结构判断 |
| `tests/workflow.spec.ts` | ts | 129 | 被测对象 `src/index.ts`：CRUD、版本不匹配与非法定义。 | 结构判断 |
| `tsconfig.json` | json | 30 | 编译配置。 | 结构判断 |

### 10.4 workflow/workflow-ptc

工作流在隔离环境中执行的那一层：`host.ts` 跑在宿主侧管生命周期，`guest*.ts` 是从源码内联出来的 guest 侧代码，`realm.ts` 负责隔离边界。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 79 | 包清单与插件元数据（运行时注册、构建期生成 guest 源码）。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 169 | 中英文档对：realm 隔离边界、guest 可用 API、失败与超时语义。 | 结构判断 |
| `locale/*.json`（8 个） | json | 5–6 | 八语言运行期错误与提示文案。 | 结构判断 |
| `src/index.ts` | ts | 192 | 插件入口：注册运行时提供方，接线 host 与 realm。 | 结构判断 |
| `src/host.ts` | ts | 323 | 宿主侧编排：创建 realm、注入能力、驱动 guest 执行并回收。 | 结构判断 |
| `src/realm.ts` | ts | 147 | 隔离边界：realm 的创建、权限收敛与销毁。 | 结构判断 |
| `src/runtime.ts` | ts | 367 | 运行时实现：按定义调度步骤、串联输入输出、传播错误。 | 结构判断 |
| `src/guest.ts` | ts | 75 | guest 侧入口源码（构建期被打包成字符串注入 realm）。 | 结构判断 |
| `src/guest-source.ts` | ts | 4 | 构建产物：guest 打包后的内联字符串。42 KB / 4 行，属生成文件，不应手改。 | 结构判断 |
| `src/guest-types.ts` | ts | 59 | guest 与 host 之间的消息类型定义。 | 结构判断 |
| `src/meta.ts` | ts | 82 | 包元数据与 guest 源码版本戳，供运行期校验一致性。 | 结构判断 |
| `src/types.ts` | ts | 90 | 本包私有类型。 | 结构判断 |
| `tests/workflow-ptc.spec.ts` | ts | 1040 | 主用例：定义驱动执行、步骤失败、超时与资源上限。 | 结构判断 |
| `tests/guest.spec.ts` | ts | 353 | 被测对象 `src/guest.ts`：在模拟 realm 内的行为。 | 结构判断 |
| `tests/host.spec.ts` | ts | 321 | 被测对象 `src/host.ts`：realm 生命周期与能力注入。 | 结构判断 |
| `tests/realm.spec.ts` | ts | 145 | 被测对象 `src/realm.ts`：隔离边界与越权调用被拒。 | 结构判断 |
| `tests/integration.spec.ts` | ts | 115 | 三层串联：领域定义 → 运行时 → realm 结果回传。 | 结构判断 |
| `tests/meta.spec.ts` | ts | 89 | guest 源码版本戳与实际注入内容的一致性校验。 | 结构判断 |
| `tests/source-runtime.compat.spec.ts` | ts | 64 | 源码态运行时与构建产物运行时的行为一致性。 | 结构判断 |
| `tests/egress.spec.ts` | ts | 44 | 隔离环境内禁止的出站访问。 | 结构判断 |
| `tests/built-runtime.e2e.ts` | ts | 83 | 端到端：用构建产物跑一个最小工作流。 | 结构判断 |
| `tests/workflow-ptc.e2e.ts` | ts | 88 | 端到端：真实插件装配下的完整调用链。 | 结构判断 |
| `tests/setup.ts` | ts | 56 | 测试环境准备（realm 模拟与全局清理），被同目录用例引用。 | 结构判断 |
| `tsconfig.json` | json | 57 | 编译配置。 | 结构判断 |
| `tsdown.config.ts` | ts | 12 | 打包配置：额外产出 guest 内联源码。 | 结构判断 |

**本节统计**：覆盖 63 个文件，文档 41 行（折叠 22 条：README 三件套 4 组折 8 条、locale 2 组共 16 个折 14 条）。`精读` 0、`结构判断` 41、`待确认` 0。

## 十一、packages/workspace

GUI 的项目列表：一条记录等于一个已存在的绝对目录，会话按运行目录归组。这一层对模型完全不可见——不注册工具、不注入提示、不写会话事件。它要守住的是「注册不等于拥有」：移除项目不动磁盘，规范化路径用 `realpath` 定唯一性。

### 11.1 包组自身

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 49 | 组级说明：本组只有一个包，指向子系统文档。 | 结构判断 |

### 11.2 workspace/workspace

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 59 | 包清单：声明存储单元、依赖的会话持久化服务。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 190 | 中英文档对：最小插件组合、首次初始化条件、隐藏与移除的语义差异。 | 结构判断 |
| `locale/*.json`（8 个） | json | 5–6 | 八语言界面文案（项目列表、隐藏/恢复、初始化失败提示）。 | 结构判断 |
| `src/index.ts` | ts | 931 | 领域服务主体。结构：存储单元与迁移声明段 → 创建/移除/排序的串行化队列段 → 会话归组与头部索引校验段 → `initializeDefault` 首次初始化段 → 隐藏/恢复与 activity/stop 事件段。 | 结构判断 |
| `src/entity.ts` | ts | 222 | 工作区实体与不变量（身份保持、名称取请求目录末段、时间戳）。 | 结构判断 |
| `src/paths.ts` | ts | 57 | 路径规范化与校验：拒绝相对路径、盘符相对路径、不存在路径与文件。 | 结构判断 |
| `src/spec.ts` | ts | 84 | 领域规范声明：表结构、当前版本、可兼容版本与迁移入口。 | 结构判断 |
| `src/types.ts` | ts | 153 | 对外类型、事件载荷与错误码。 | 结构判断 |
| `tests/workspace.spec.ts` | ts | 1586 | 主用例集。结构：创建与规范化段 → 首次初始化段 → 会话归组与悬空路径段 → 隐藏/恢复/移除段 → 并发与中断恢复段。 | 结构判断 |
| `tsconfig.json` | json | 39 | 编译配置。 | 结构判断 |

**本节统计**：覆盖 22 个文件，文档 11 行（折叠 11 条：README 三件套 2 组折 4 条、locale 1 组共 8 个折 7 条）。`精读` 0、`结构判断` 11、`待确认` 0。

## 十二、packages-07 与 misc 的分界

到这里 `packages-07.tsv` 的 771 个文件已全部覆盖（226 + 23 + 118 + 210 + 109 + 63 + 22）。以下各节转向 `misc.tsv`——即 `packages/` 之外的仓库其余部分，按顶层目录分节。

需要强调一点：`misc.tsv` 的 914 个文件里，`scripts` 一家占 465 个（超过一半），而剩余 449 个分散在 11 个顶层目录中，规模差异极大（`benchmarks` 48 个、`native` 79 个、`patches` 12 个、`.claude` 只有 1 个）。因此下面各节的详细程度不齐：`scripts`、`patches`、`.github` 三个目录逐个交代，`.claude`、`.ssh` 这种只有一个文件的只写一段。

## 十三、根目录散落文件（48 个）

仓库根不只是一个清单文件。这里同时承担四件事：定义整个 monorepo 的构建与测试矩阵（`tsconfig.*`、`vitest.*`、`tsdown.config.ts`）、锁定工具链版本（`package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`）、承载对外承诺（`LICENSE`、`SAFETY`、`CONTRIBUTING`、`BRAND_GUIDELINES`）、以及给人和 agent 读的工作约定（`AGENTS.md`、`CLAUDE.md`）。改这里的一个字段往往影响全部 21,197 个文件，所以下面按「影响面」排序而非字母序。

### 13.1 依赖与工作区

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 314 | 根包 `@deepseek-ai/dsh-root`（`0.2.2-rc.2`，private，`type: module`）。定义 `workspaces` 六条 glob、`engines.node>=24.9.0`、`packageManager: pnpm@11.28.5`，以及约 300 条 scripts——是「一个工程动作叫什么」的唯一真源，`scripts/` 下每个入口脚本都要能在这里找回调用点。 | 精读 |
| `pnpm-lock.yaml` | yaml | 34860 | pnpm 锁文件，全仓库最大文本文件（1.2 MB）。含全部依赖的解析结果与补丁摘要，`patches/` 下的 12 个补丁通过 `patchedDependencies` 在此落地。 | 结构判断 |
| `pnpm-workspace.yaml` | yaml | 124 | 工作区声明与 pnpm 全局设置（含 `patchedDependencies` 的补丁登记）。 | 结构判断 |
| `.env` | txt | 42 | 本地开发用环境变量样例（42 行）。**注意**：该文件被纳入了盘点统计，说明它以常规文件存在于仓库中；是否含真实凭据需在使用前确认。 | 待确认 |
| `Makefile` | txt | 35 | 薄封装，把常用 pnpm 命令收成短目标，供习惯 make 的开发者使用。 | 结构判断 |
| `pytest.ini` | txt | 5 | Python 侧测试配置（`python/`、`scripts/*.py` 共用），主要是测试路径与选项。 | 结构判断 |

### 13.2 TypeScript 构建矩阵

根目录有 6 个 `tsconfig`，按「宿主 / 客户端 / 浏览器」三面切分，再由 CI 与 `scripts/build.ts` 组合调用。改动任一 `references` 都会改变全仓增量编译的边界。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `tsconfig.json` | json | 15 | 顶层入口，只做 `references` 聚合，不含编译选项。 | 结构判断 |
| `tsconfig.base.json` | json | 632 | 全仓共用编译选项基座（严格性、模块解析、路径别名、`composite` 等）。行数最多的配置，别名表占大头。 | 结构判断 |
| `tsconfig.host.json` | json | 610 | 宿主侧（Node）工程引用清单，`build:lib:host` 直接以它为入口编译。 | 结构判断 |
| `tsconfig.client.json` | json | 176 | 客户端侧（浏览器）工程引用清单，`build:lib:client` 与 `typecheck:contracts-ready` 使用。 | 结构判断 |
| `tsconfig.base.client.json` | json | 13 | 客户端专用选项覆盖（DOM lib、JSX 等）。 | 结构判断 |
| `tsconfig.node.base.json` | json | 7 | Node 侧选项覆盖（模块目标与 `types`）。 | 结构判断 |
| `tsdown.config.ts` | ts | 36 | 打包器配置：按 `DSH_BUILD_FACE` 环境变量切换 host/client 两套产物。 | 结构判断 |

### 13.3 测试矩阵

测试按「跑什么」拆成 8 个 vitest 配置，`package.json` 里每个 `test:*` 脚本对应其中一个。这种拆法是为了让门禁可以只跑受影响的那一类，而不是每次都全量。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `vitest.config.ts` | ts | 439 | 主配置：工程划分、环境（node/jsdom）、别名、覆盖率阈值。行数偏高是因为内联了分包与排除规则。 | 结构判断 |
| `vitest.shared.ts` | ts | 42 | 8 个配置共享的片段（别名、超时、序列化器），避免各配置漂移。 | 结构判断 |
| `vitest.e2e.config.ts` | ts | 62 | 端到端用例（`*.e2e.ts`），`test:e2e` 使用。 | 结构判断 |
| `vitest.expected.config.ts` | ts | 19 | 期望值快照用例，`test:expected` 使用。 | 结构判断 |
| `vitest.bench.config.ts` | ts | 30 | 微基准用例，`test:bench:built` 链路使用。 | 结构判断 |
| `vitest.snapshot.config.ts` | ts | 73 | 快照录制/刷新/校验三态用例，`test:snapshot`、`test:snapshot:record`、`test:snapshot:refresh` 共用。 | 结构判断 |
| `vitest.web.config.ts` | ts | 37 | Web 前端用例，CI 的 web 快照门禁使用。 | 结构判断 |
| `vitest.web.perf.config.ts` | ts | 21 | Web 性能用例（阈值断言）。 | 结构判断 |
| `vitest.web-stress.config.ts` | ts | 15 | Web 压力用例，独立配置以便不默认跑。 | 结构判断 |

### 13.4 代码质量与编辑约定

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `.oxlintrc.json` | json | 358 | 全仓 lint 规则集，`scripts/run-oxlint.ts .` 读取。 | 结构判断 |
| `.oxlintrc.staged.json` | json | 22 | 暂存文件的精简规则集，`lint:fix` 先跑它再跑全量，避免未提交代码触发无关告警。 | 结构判断 |
| `.jscpd.json` | json | 15 | 重复代码检测配置，`pnpm duplication` 使用（范围 `packages` + `scripts`）。 | 结构判断 |
| `.editorconfig` | txt | 8 | 缩进、换行符、字符集约定。 | 结构判断 |
| `.gitattributes` | txt | 27 | 换行符归一与二进制标记，防止跨平台 diff 噪声。 | 结构判断 |
| `.gitignore` | txt | 55 | 忽略清单：构建产物、缓存、本地会话数据。 | 结构判断 |
| `.rgignore` | txt | 2 | ripgrep 忽略项，供 `packages/util/ripgrep` 与本地搜索使用。 | 结构判断 |
| `lefthook.yml` | yaml | 49 | Git 钩子定义（pre-commit 走 staged lint、commit-msg 校验格式），由 `scripts/install-lefthook.mjs` 在 `postinstall` 安装。 | 结构判断 |

### 13.5 面向人与 agent 的约定文档

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `AGENTS.md` | md | 189 | 仓库级 agent 工作约定：目录心智模型、构建与门禁命令、改动禁区、提交与文档要求。各子目录的 `AGENTS.md` 都以它为根。 | 结构判断 |
| `CLAUDE.md` | md | 1 | 仅 9 字节，疑为指向 `AGENTS.md` 的占位符。内容不足以判断意图，按异常记录。 | 待确认 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 61 | 项目门面：定位、快速开始、最小可运行命令、文档入口；`.i18n.yaml` 是中英配对清单，`verify-translation-pairing` 门禁据此校验。 | 结构判断 |
| `CONTRIBUTING.md` / `CONTRIBUTING.zh.md` / `CONTRIBUTING.i18n.yaml` | md | 23 | 贡献流程：分支、提交格式、必须通过的门禁、文档更新要求。 | 结构判断 |
| `SAFETY.md` / `SAFETY.zh.md` / `SAFETY.i18n.yaml` | md | 27 | 安全模型与使用边界声明：能做什么、明确不承诺什么。 | 结构判断 |
| `BRAND_GUIDELINES.md` / `BRAND_GUIDELINES.zh.md` / `BRAND_GUIDELINES.i18n.yaml` | md | 12 | 品牌使用规范：名称、图标、配色与禁止用法。 | 结构判断 |
| `BENCHMARK.md` | md | 3 | 指向 `benchmarks/` 的短指针。 | 结构判断 |
| `THIRD_PARTY_NOTICES.md` | md | 323 | 第三方许可证汇总，由 `gen-third-party-notices` 生成，发布产物随附。 | 结构判断 |
| `LICENSE` | txt | 21 | MIT 许可证正文。 | 结构判断 |
| `.gitlab-ci.yml` | yaml | 191 | GitLab CI 流水线定义。仓库同时存在 `.github/workflows`，两套 CI 并存，需确认哪套是当前有效门禁。 | 待确认 |

**本节统计**：覆盖 48 个文件，文档 40 行（折叠 8 条：README、CONTRIBUTING、SAFETY、BRAND_GUIDELINES 四组三件套各折 2 条）。`精读` 1（`package.json`）、`结构判断` 36、`待确认` 3（`.env`、`CLAUDE.md`、`.gitlab-ci.yml` 各占一行）。校验：1 + 36 + 3 = 40 ✓。

## 十四、.claude、.ssh、.trae

三个「工具目录」，共同点是都不参与构建产物，只影响人（或 agent）的工作方式。`.ssh` 里有一个真实私钥文件，这是本次盘点中最需要处置的发现。

### 14.1 .claude

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `skills` | 无扩展名 | 1 | 17 字节，是一个指向外部 skills 目录的指针文件而非目录内容。内容不足以判断指向目标，按异常记录。 | 待确认 |

### 14.2 .ssh

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `119.29.173.147.pem` | pem | 27 | 27 行 PEM 结构，按扩展名与行数判断为私钥文件（主机 `119.29.173.147`）。**以文件形式存在于仓库内**，属高危项，应确认是否已进入提交历史并轮换。 | 结构判断 |

### 14.3 .trae/documents

历史文档编写计划，是本次 `docs/superpowers/` 系列文档的上游输入。保留它们可以追溯「为什么这样分章」。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `02-tools-execution-plan.md` | md | 53 | 工具与执行链路的文档编写计划。 | 结构判断 |
| `06-hosts-and-sdks-文档编写计划.md` | md | 117 | 宿主与 SDK 部分的文档计划，含章节拆分与取材范围。 | 结构判断 |
| `08-infrastructure-doc-plan.md` | md | 43 | 基础设施章（`packages/util`、`storage`、`scripts` 等）的文档计划，与 `modules/08-infrastructure.md` 对应。 | 结构判断 |
| `agent-runtime-doc-plan.md` | md | 153 | Agent 运行时章的文档计划，篇幅最大，说明该章取材最复杂。 | 结构判断 |
| `consistency-review-plan.md` | md | 136 | 全仓一致性复核计划（术语、编号、交叉引用）。 | 结构判断 |
| `plugin-ecosystem-doc-plan.md` | md | 52 | 插件生态章的文档计划。 | 结构判断 |

**本节统计**：覆盖 8 个文件，文档 8 行（无折叠）。`精读` 0、`结构判断` 6、`待确认` 2。

## 十五、.github（67 个）

仓库的协作自动化层，分五块：模板（issue / PR）、三个自研机器人（issue 生命周期、PR 预览体积、加权审批）、Python 辅助脚本，以及 34 条 GitHub Actions 工作流。工作流的触发条件已逐条核对 `on:` 段，下表中「触发」列即取自该段；其余字段未逐行读完，故一律标 `结构判断`。

一条值得注意的观察：发布类工作流普遍分成「package（打包，`workflow_dispatch` 传 `source_ref`）」与「publish/rollout（发布，传上一步的 `package_run_id`）」两段，中间靠 run id 串联。这种拆法让「构建」与「对外发布」可以分别重跑。

### 15.1 顶层与模板

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `AGENTS.md` | md | 11 | 本目录的 agent 约定，指向根 `AGENTS.md` 并补充 CI 改动要求。 | 结构判断 |
| `dependabot.yml` | yaml | 45 | 依赖自动升级配置：按生态分组、限制并发 PR 数。 | 结构判断 |
| `pull_request_template.md` | md | 34 | PR 模板：变更说明、影响面、门禁自检清单。 | 结构判断 |
| `ISSUE_TEMPLATE/bug.md` | md | 25 | Bug 报告模板，含复现步骤与环境字段。 | 结构判断 |
| `ISSUE_TEMPLATE/feature.md` | md | 13 | 功能请求模板。 | 结构判断 |
| `ISSUE_TEMPLATE/task.md` | md | 13 | 任务模板，供内部拆解使用。 | 结构判断 |
| `ISSUE_TEMPLATE/config.yml` | yaml | 1 | issue 模板选择器配置（单行）。 | 结构判断 |

### 15.2 issue-management

一套自研的 issue/PR 规则机器人。逻辑在 `.mjs`，配置在 JSON，测试用 `node --test` 跑，对应根 `package.json` 的 `test:issue-management`。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `rules.mjs` | mjs | 303 | 规则引擎：把配置表达成可判定的条件，产出「该打什么标、该不该关」。 | 结构判断 |
| `github.mjs` | mjs | 300 | GitHub API 封装：读 issue/PR、写标签与评论、限流重试。 | 结构判断 |
| `lifecycle.mjs` | mjs | 155 | 生命周期推进：新开、待补信息、已确认、已关闭之间的状态迁移。 | 结构判断 |
| `pull-request.mjs` | mjs | 126 | PR 侧规则：标题格式、关联 issue、必须项检查。 | 结构判断 |
| `policy.mjs` | mjs | 29 | 入口：读配置、按事件类型分派到 lifecycle 或 pull-request。 | 结构判断 |
| `config.json` | json | 19 | 标签定义、状态机阈值与豁免名单。 | 结构判断 |
| `selective-preflight.json` | json | 1 | 单行的预检开关或豁免清单。 | 待确认 |
| `policy.test.mjs` | mjs | 1176 | 规则引擎的主测试集，`test:issue-management` 直接执行。篇幅大是因为逐条枚举了规则分支。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 95 | 中英文档对：状态机图示、配置字段、如何本地跑测试。 | 结构判断 |

### 15.3 preview-sizing

给 PR 生成「预览体积」报告，回答「这次改动让包变大多少」。只有文档，没有可执行代码——说明实际计算在别处（`build-preview-cloudflare.yml` 调用的脚本），本目录只放约定。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 35 | 中英文档对：体积报告的口径、阈值与在 PR 上的呈现形式。 | 结构判断 |

### 15.4 review-ownership

加权审批制度：不是「两个人 approve 就行」，而是按作者对改动文件的既有贡献度加权，防止自己批自己或刷审批。审批策略由 `approval-policy.json` 配置，判定逻辑在 `check-approval.mjs`，三条测试对应根 `package.json` 的 `test:approval-policy`。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `check-approval.mjs` | mjs | 687 | 审批判定主体：汇总 approve 记录、按作者权重折算、与策略阈值比较并给出结论。 | 结构判断 |
| `blame-ownership.mjs` | mjs | 86 | 从 `git blame` 结果统计每个作者对每个文件的贡献占比。 | 结构判断 |
| `author-weight.mjs` | mjs | 62 | 作者权重的计算与归一（含新人与外部贡献者的保底处理）。 | 结构判断 |
| `blame-production.py` | py | 135 | 生产环境用的 blame 采集脚本，`blame-ownership.mjs` 的数据来源。 | 结构判断 |
| `approval-policy.json` | json | 12 | 审批策略：所需权重、豁免标签、受保护路径。 | 结构判断 |
| `requirements.txt` | txt | 1 | 单个 Python 依赖声明。 | 结构判断 |
| `check-approval.test.mjs` | mjs | 1316 | 审批判定的主测试集（`test:approval-policy` 之一）。 | 结构判断 |
| `blame-ownership.test.mjs` | mjs | 52 | blame 聚合的单元测试。 | 结构判断 |
| `author-weight.test.mjs` | mjs | 47 | 权重计算的单元测试。 | 结构判断 |
| `test_blame_production.py` | py | 221 | `blame-production.py` 的 pytest 用例。 | 结构判断 |
| `.gitignore` | txt | 1 | 忽略本地生成的 blame 缓存。 | 结构判断 |
| `README.md` | md | 63 | 制度说明：为什么加权、权重怎么算、如何申诉。 | 结构判断 |

### 15.5 workflows（34 条）

按用途分四组：门禁（CI / 静态检查 / 平台矩阵）、发布（桌面包、Python、SSH helper、node addon、vendor）、PR 辅助（体积预览、审批、issue 策略）、以及一次性运维。

**门禁类**

| 文件 | 类型 | 行数 | 职责 | 触发 | 标注 |
| --- | --- | ---: | --- | --- | --- |
| `ci.yml` | yml | 584 | 主 CI：静态检查、类型检查、单元测试与覆盖率分区。 | `pull_request` | 结构判断 |
| `ci-master.yml` | yml | 532 | master 上的完整套件，可按 `suite` 输入手动补跑。 | `push: [master]`、`workflow_dispatch` | 结构判断 |
| `ci-windows.yml` | yml | 270 | Windows 平台门禁。 | `pull_request` | 结构判断 |
| `ci-python.yml` | yml | 87 | Python 侧测试（pytest）。 | `pull_request` | 结构判断 |
| `sandbox.yml` | yml | 168 | 沙箱相关测试，只在 master 上跑，避免拖慢 PR。 | `push: [master]` | 结构判断 |
| `node-addon-system.yml` | yml | 170 | 原生 node addon 的构建与测试，按路径过滤只在本目录变更时触发。 | `pull_request`（`paths`: `native/system/**` 与本目录） | 结构判断 |
| `e2e.yml` | yml | 127 | 端到端套件，含定时任务；同时支持手动触发。 | `workflow_dispatch`、`push: [main, master]`、`pull_request`、`schedule` | 结构判断 |
| `expected-filenames.yml` | yml | 28 | 文件名合规检查（匹配 `*golden*` 的文件必须有对应期望值），排除 `vendor/**`。 | `pull_request`（按路径过滤） | 结构判断 |

**发布类（打包与对外发布分离）**

| 文件 | 类型 | 行数 | 职责 | 触发 | 标注 |
| --- | --- | ---: | --- | --- | --- |
| `macos-package.yml` | yml | 224 | macOS arm64 桌面包构建，按 `source_ref` 支持测试/生产两档。 | `workflow_dispatch` | 结构判断 |
| `macos-intel-package.yml` | yml | 227 | macOS x64 桌面包构建，参数同 arm64。 | `workflow_dispatch` | 结构判断 |
| `windows-package.yml` | yml | 269 | Windows x64 桌面包构建。 | `workflow_dispatch` | 结构判断 |
| `desktop-publish.yml` | yml | 267 | 取某个打包 run 的产物对外发布，环境与 release id 沿用原包。 | `workflow_dispatch`（输入 `package_run_id`） | 结构判断 |
| `desktop-rollout.yml` | yml | 263 | 已发布版本的灰度推进。 | `workflow_dispatch`（输入 `package_run_id`） | 结构判断 |
| `release.yml` | yml | 190 | 发布前校验（版本、变更记录、可发布性）。 | `pull_request`、`push: [master]`、`workflow_dispatch` | 结构判断 |
| `release-publish.yml` | yml | 182 | 校验通过后执行实际发布；可复用 CUA helper 的既有产物。 | `workflow_dispatch`（输入 `cua_run_id`） | 结构判断 |
| `release-vendor.yml` | yml | 107 | `vendor/` 内 9 个 Cordis 包的发布校验。 | `pull_request`、`push: [master]`、`workflow_dispatch` | 结构判断 |
| `release-vendor-publish.yml` | yml | 126 | vendor 包发布到 npm，`dist-tag` 留空为 latest。 | `workflow_dispatch` | 结构判断 |
| `python-release.yml` | yml | 248 | 构建并（可选）发布 Python wheel，`publish` 必须从 `python-v*` tag 运行。 | `workflow_dispatch` | 结构判断 |
| `build-exe-for-python-sdk.yml` | yml | 530 | 把 Python SDK 打成五个平台的可执行文件，可复用。 | `workflow_call`（`targets` 为空则全打） | 结构判断 |
| `build-exe-for-ssh-helper.yml` | yml | 127 | SSH helper 的四个 Node 24 原生目标构建，可复用。 | `workflow_call` | 结构判断 |
| `publish-ssh-helper.yml` | yml | 101 | 把已校验的 SSH helper 归档发到 GitHub Release。 | `workflow_dispatch`（须在匹配的 `dsh-v*` tag 上） | 结构判断 |
| `node-addon-system-release.yml` | yml | 188 | 把打好的 node addon tarball 发到 npm。 | `workflow_dispatch`（须在 `node-addon-system-v*` tag 上） | 结构判断 |
| `cua-helper-package.yml` | yml | 109 | CUA helper 打包（macOS），`preset` 选择本机签名配置。 | `workflow_dispatch` | 结构判断 |
| `cua-helper-package-windows.yml` | yml | 107 | CUA helper 打包（Windows），可被其他工作流复用并回传产物号。 | `workflow_dispatch`、`workflow_call` | 结构判断 |

**PR 辅助与治理**

| 文件 | 类型 | 行数 | 职责 | 触发 | 标注 |
| --- | --- | ---: | --- | --- | --- |
| `build-preview-cloudflare.yml` | yml | 196 | 为 PR 构建 Web 预览并部署到 Cloudflare；同一 PR 内新构建覆盖旧构建。 | `pull_request`（opened/synchronize/reopened） | 结构判断 |
| `issue-policy.yml` | yml | 58 | PR 侧的 issue 关联与标题规则检查。 | `pull_request`（8 种类型）、`pull_request_review: [submitted]` | 结构判断 |
| `issue-lifecycle.yml` | yml | 57 | issue 状态机推进。 | `issues`（opened/edited/labeled 等） | 结构判断 |
| `weighted-approval.yml` | yml | 87 | 加权审批主流程。 | `pull_request_target`（含 draft 切换与 edited）、`issue_comment`、`workflow_run` | 结构判断 |
| `weighted-approval-review-event.yml` | yml | 18 | 只处理 review 事件的轻量分支，与上一条分工。 | `pull_request_review`（submitted/edited/dismissed） | 结构判断 |
| `pr-check-after-approve.yml` | yml | 62 | 审批通过后再跑必须项检查。 | `pull_request_target`（限 master 与 `release/dsh-x.y.z`）、`pull_request_review`（submitted/dismissed） | 结构判断 |
| `pr-check-on-head-branch.yml` | yml | 130 | 在 PR 头分支上校验（含 review_requested、auto_merge 等事件）。 | `pull_request_target`（限 master 与发布分支） | 结构判断 |
| `pr-check-on-base-branch.yml` | yml | 30 | 合入后在基线分支上复检。 | `push`（master 与发布分支）、`workflow_dispatch` | 结构判断 |
| `pi-ai-provider-e2e.yml` | yml | 72 | 对 pi-ai 提供方的真实端点冒烟，需指定 Azure OpenAI 模型。 | `workflow_dispatch` | 结构判断 |
| `docs-pages.yml` | yml | 93 | 构建文档站并发布到 GitHub Pages，串行执行不取消进行中的部署。 | `workflow_dispatch` | 结构判断 |

**本节统计**：覆盖 67 个文件，文档 63 行（折叠 4 条：issue-management、preview-sizing 的 README 三件套各折 2 条）。`精读` 0、`结构判断` 62、`待确认` 1。校验：62 + 1 = 63 ✓。

## 十六、benchmarks（48 个）

不是一组孤立的计时脚本，而是「按用户路径设门禁」的性能工程：每个场景目录都对应一条真实的交互路径（会话打开、长会话浏览、断流重连、对话折叠、终端 IO、用户输入、Agent 续跑），共用一套机器档案与缩放报告机制，让同一份用例在开发者笔记本和 CI 机器上得出可比结论。业务代码不引用这里，反向依赖为单向：`benchmarks` 依赖 `packages/*`，`packages/*` 不知道它存在。

### 16.1 组级

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `AGENTS.md` | md | 18 | 本目录的 agent 约定：新增基准的准入条件与命名规范。 | 结构判断 |
| `package.json` | json | 55 | 基准包的清单与脚本入口，被 `build:bench` 与 `test:bench:built` 调用。 | 结构判断 |
| `tsdown.config.ts` | ts | 76 | 基准产物打包配置：把 worker 与 bench 分别打成可独立执行的 bundle。 | 结构判断 |

### 16.2 共享支撑

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `support/built-worker.ts` | ts | 102 | 在构建产物里定位并启动 worker 的通用入口。 | 结构判断 |
| `support/machine-profiles.ts` | ts | 58 | 机器档案：按 CPU/内存档位给出预期基线，避免跨机比较失真。 | 结构判断 |
| `support/calibration.ts` | ts | 15 | 开跑前的校准系数计算，把绝对耗时折算成可比数值。 | 结构判断 |
| `support/scaling-report.ts` | ts | 308 | 结果汇总：按输入规模拟合曲线并输出可读报告（含 HTML 片段）。 | 结构判断 |

### 16.3 场景

每个场景目录的结构一致：`*.bench.ts` 是在宿主侧跑的主用例，`*.worker.ts` 是被打进去执行的被测负载，合成数据生成器独立成文件。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `active-stream-reconnect/README.md` / `README.zh.md` / `README.i18n.yaml` | md | 7 | 中英文档对：流重建连场景的度量口径（首字节、恢复耗时）。 | 结构判断 |
| `active-stream-reconnect/reconnect.bench.client.ts` | ts | 63 | 主用例：模拟断流后重连，记录恢复响应时间。 | 结构判断 |
| `active-stream-reconnect/reconnect.worker.client.ts` | ts | 49 | 浏览器侧被测负载（`client` 后缀表示面向 DOM 环境）。 | 结构判断 |
| `agent-continuation/README.md` / `README.zh.md` / `README.i18n.yaml` | md | 33 | 中英文档对：Agent 续跑场景的输入构造与预期复杂度。 | 结构判断 |
| `agent-continuation/agent-continuation.bench.ts` | ts | 238 | 主用例：长历史下继续对话的耗时与内存。 | 结构判断 |
| `agent-continuation/agent-continuation.worker.ts` | ts | 142 | 被测负载：驱动一次续跑。 | 结构判断 |
| `agent-continuation/child-catalog.worker.ts` | ts | 116 | 子代理目录查询的负载分支。 | 结构判断 |
| `agent-continuation/profile-continuation.worker.ts` | ts | 88 | 带 profile（指令集）场景下的续跑负载。 | 结构判断 |
| `agent-continuation/workload.ts` | ts | 114 | 场景参数与负载定义的公共部分。 | 结构判断 |
| `agent-continuation/profile-adapter.ts` | ts | 42 | 把 profile 数据适配成负载可用的形状。 | 结构判断 |
| `agent-continuation/synthetic-history.bench.ts` | ts | 39 | 合成历史生成的耗时基准（为其他用例提供输入）。 | 结构判断 |
| `conversation-fold/conversation-fold.bench.client.ts` | ts | 179 | 主用例：对话折叠的帧耗时。 | 结构判断 |
| `conversation-fold/conversation-fold.worker.client.ts` | ts | 394 | 折叠负载：大量消息节点下的重排计算。 | 结构判断 |
| `long-session-browser/README.md` / `README.zh.md` / `README.i18n.yaml` | md | 19 | 中英文档对：长会话浏览的规模档位与指标。 | 结构判断 |
| `long-session-browser/long-session.bench.ts` | ts | 454 | 主用例：超长会话的打开、滚动与渲染。 | 结构判断 |
| `long-session-browser/synthetic-history.ts` | ts | 95 | 生成指定规模的合成会话历史。 | 结构判断 |
| `session-corpus/README.md` / `README.zh.md` / `README.i18n.yaml` | md | 39 | 中英文档对：语料库型基准的输入来源与形状。 | 结构判断 |
| `session-corpus/session-corpus.bench.ts` | ts | 340 | 主用例：整库加载与索引。 | 结构判断 |
| `session-corpus/session-corpus.worker.ts` | ts | 402 | 被测负载：批量读取与解析会话。 | 结构判断 |
| `session-corpus/projection-list.bench.ts` | ts | 99 | 投影列表的构建耗时。 | 结构判断 |
| `session-corpus/projection-list.worker.ts` | ts | 315 | 投影列表负载。 | 结构判断 |
| `session-corpus/synthetic-corpus.ts` | ts | 484 | 按形状参数生成合成语料（本目录最大文件）。 | 结构判断 |
| `session-corpus/corpus-shape.ts` | ts | 76 | 语料形状定义（消息数、工具调用比例、附件分布）。 | 结构判断 |
| `session-corpus/session-controller.ts` | ts | 32 | 承载会话的控制层，供 bench 与 worker 共用。 | 结构判断 |
| `session-open/session-open.bench.ts` | ts | 495 | 主用例：单会话打开的端到端耗时。 | 结构判断 |
| `session-open/session-open.worker.ts` | ts | 314 | 被测负载：从持久化加载一份会话。 | 结构判断 |
| `session-open/synthetic-released-v0-session.ts` | ts | 205 | 构造「已发布版本 v0 格式」的会话样本，用于验证兼容路径不退化。 | 结构判断 |
| `session-open/session-open.constants.ts` | ts | 12 | 规模常量（会话条数、消息数档位）。 | 结构判断 |
| `terminal-io/terminal-io.bench.ts` | ts | 88 | 主用例：终端输入输出的往返耗时。 | 结构判断 |
| `terminal-io/terminal-io.worker.ts` | ts | 107 | 终端 IO 负载。 | 结构判断 |
| `terminal-io/session-adapter.ts` | ts | 2 | 仅 2 行的适配器，判断为转导出存根；是否仍被引用待确认。 | 待确认 |
| `user-text/user-text.bench.client.ts` | ts | 195 | 主用例：用户输入路径的处理耗时。 | 结构判断 |
| `user-text/user-text.worker.client.ts` | ts | 416 | 浏览器侧被测负载（文本解析与预处理）。 | 结构判断 |

**本节统计**：覆盖 48 个文件，文档 40 行（折叠 8 条：README 三件套 4 组各折 2 条）。`精读` 0、`结构判断` 39、`待确认` 1。校验：39 + 1 = 40 ✓。

## 十七、native（79 个）

`native/` 只做一件事：给 Node 侧一个可靠的文件锁（flock）与进程启动器，并把它按「主包 + 每平台一个预编译包」的形态发布。`native/system/packages/entry` 是唯一的源码包（C + TS），其余四个平台目录只有 `package.json`、`prebuilds.json` 与许可证——**源码不在仓库里**，由 CI 在对应平台编译后回填。这解释了为什么本地 `pnpm test` 前必须跑 `build:native-system`。

### 17.1 顶层

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 11 | 中英文档对：本目录只含 system 一个子项目，指向其文档。 | 结构判断 |

### 17.2 native/system 组级与文档

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 34 | `@deepseek-ai/dsh-system` 主包清单：`optionalDependencies` 按平台挂四个预编译包。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 41 | 中英文档对：安装方式、支持矩阵入口、本地构建命令。 | 结构判断 |
| `AGENTS.md` | md | 28 | 本目录的 agent 约定：C 代码与平台包的改动规范。 | 结构判断 |
| `.gitignore` | txt | 13 | 忽略本地编译产物与 `prebuilds` 中间物。 | 结构判断 |
| `LICENSE` | txt | 28 | 本子项目许可证正文。 | 结构判断 |
| `tsconfig.json` | json | 11 | 工程入口，聚合 `entry` 包。 | 结构判断 |
| `tsconfig.base.json` | json | 11 | 编译选项基座。 | 结构判断 |
| `docs/architecture.md` | md | 25 | 架构说明：JS 入口 → N-API 绑定 → C 实现的调用链。 | 结构判断 |
| `docs/cli-contract.md` | md | 34 | 启动器二进制的命令行契约（参数、退出码、信号）。 | 结构判断 |
| `docs/flock-contract.md` | md | 36 | 文件锁语义契约：阻塞/非阻塞、继承、超时、跨进程行为。 | 结构判断 |
| `docs/naming.md` | md | 30 | 包名、平台三元组与产物命名的对应规则。 | 结构判断 |
| `docs/packaging.md` | md | 26 | 打包流程：预编译产物如何组装进平台包。 | 结构判断 |
| `docs/release.md` | md | 63 | 发布流程：版本推进、tag 规则、发布前校验项。篇幅最长，是运维主参考。 | 结构判断 |
| `docs/support-matrix.md` | md | 14 | 支持的平台与 Node 版本矩阵。 | 结构判断 |

### 17.3 native/system/scripts

这一组脚本是发布链路的全部实现，与根 `package.json` 的 `build:native-system` 及 `.github/workflows/node-addon-system*.yml` 配合使用。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `build.ts` | ts | 92 | 本地构建入口，`build:native-system` 以 `--host-addon-only` 调用，只编译当前平台。 | 结构判断 |
| `assemble-prebuilds.mjs` | mjs | 54 | 把各平台产物汇总成 `prebuilds.json` 描述的文件集合。 | 结构判断 |
| `build-test-oracle.mjs` | mjs | 23 | 构建测试用的对照实现（oracle），供 `test/fixtures/flock-oracle.c` 比对。 | 结构判断 |
| `bump-release.mjs` | mjs | 91 | 版本推进：改主包与四个平台包的版本号。 | 结构判断 |
| `commit-release.mjs` | mjs | 42 | 版本变更的提交与打 tag。 | 结构判断 |
| `github-matrix.mjs` | mjs | 69 | 生成 CI 的构建矩阵（平台 × Node 版本）。 | 结构判断 |
| `pack-release.mjs` | mjs | 118 | 打 tarball，供 `node-addon-system-release.yml` 发布。 | 结构判断 |
| `publish-release.mjs` | mjs | 165 | 发布编排：按平台顺序发 npm，失败即停。 | 结构判断 |
| `repo.mjs` | mjs | 122 | 仓库路径与 git 操作的公共封装。 | 结构判断 |
| `verify-entry-lib.mjs` | mjs | 28 | 校验 `entry` 包的 JS 产物可加载。 | 结构判断 |
| `verify-launcher-binary.mjs` | mjs | 30 | 校验启动器二进制存在且可执行。 | 结构判断 |
| `verify-packed-install.mjs` | mjs | 238 | 端到端校验：装 tarball、跑一次锁操作，确认发布物可用。 | 结构判断 |
| `verify-release.mjs` | mjs | 54 | 发布前的一致性检查（版本、产物、矩阵齐全）。 | 结构判断 |

### 17.4 native/system/packages/entry（源码包）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 46 | 源码包清单：构建脚本、N-API 目标、导出映射。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 15 | 中英文档对：本包提供锁与启动器两类能力。 | 结构判断 |
| `src/main.c` | c | 298 | C 侧实现：锁原语与启动器入口，按平台条件编译。 | 结构判断 |
| `src/flock.c` | c | 164 | flock 的跨平台实现（POSIX `flock` 与 Windows 文件锁）。 | 结构判断 |
| `src/index.ts` | ts | 127 | JS 入口：加载绑定、导出同步/异步锁 API 与启动器。 | 结构判断 |
| `src/flock.ts` | ts | 57 | 锁 API 的 TS 封装与句柄生命周期管理。 | 结构判断 |
| `tsconfig.json` | json | 11 | 编译配置。 | 结构判断 |

### 17.5 平台预编译包（darwin-arm64 / darwin-x64 / linux-arm64 / linux-x64）

四个目录结构相同，都只有清单、预编译描述、许可证与文档，无源码。`prebuilds.json` 的行数差异（darwin 6 行、linux 24 行）说明 Linux 侧需要更多产物（含不同 libc 组合），Darwin 侧依赖系统库。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `darwin-arm64/` `package.json` + `prebuilds.json` + `LICENSE` + `README` 三件套 | json/md | 6 / 6 / 28 / 9 | 6 个文件：清单（`os`/`cpu` 约束）、产物描述、许可证、文档。 | 结构判断 |
| `darwin-x64/` 同上 | json/md | 6 / 6 / 28 / 9 | 6 个文件，结构同 arm64。 | 结构判断 |
| `linux-arm64/` 同上 | json/md | 24 / 6 / 28 / 11 | 6 个文件；`prebuilds.json` 24 行，产物条目多于 Darwin。 | 结构判断 |
| `linux-x64/` 同上 | json/md | 24 / 6 / 28 / 11 | 6 个文件，结构同 linux-arm64。 | 结构判断 |

### 17.6 native/system/test

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `flock.test.js` | js | 423 | 锁语义的主测试：阻塞、非阻塞、超时、跨进程与错误注入。 | 结构判断 |
| `launcher.test.js` | js | 137 | 启动器行为：参数透传、退出码、信号处理。 | 结构判断 |
| `package-matrix.test.js` | js | 186 | 四个平台包的清单一致性（版本、`os`/`cpu`、依赖关系）。 | 结构判断 |
| `release-packing.test.js` | js | 151 | 打包与发布产物结构校验。 | 结构判断 |
| `entry.test.js` | js | 80 | `entry` 包导出面与基本调用。 | 结构判断 |
| `link-platform.mjs` | mjs | 10 | 测试前把当前平台的预编译包软链到期望位置。 | 结构判断 |
| `fixtures/*`（8 个） | js/c | — | 测试夹具 8 个：`flock-*.js` 覆盖子进程、worker、回调抛错、继承句柄与 IO 子进程场景，`flock-oracle.c` 是对照实现。 | 结构判断 |

**本节统计**：覆盖 79 个文件，表格 46 行（折叠 33 条：README 三件套 3 组折 6 条、平台预编译包 24 个并入 4 行折 20 条、测试夹具 8 个并入 1 行折 7 条）。`精读` 0、`结构判断` 79、`待确认` 0。

## 十八、patches（12 个）

`patches/` 里的 12 个文件全部登记在根 `pnpm-workspace.yaml` 的 `patchedDependencies` 段，是「上游不修、又不能 fork」的定点补丁。它们有一个共同的脆弱点：**9 个只改构建产物**（`dist/`、`lib-es5/`、`prelude/`、`out/`），上游一旦调整产物文件名或 bundle 形态，补丁就在 `pnpm install` 阶段直接 apply 失败。因此这一节的职责描述精确到「改了哪个函数、为什么改」，而不是「修了个 bug」。

上游同步时最需要盯的三组耦合：`mdast-util-gfm-autolink-literal` + `micromark-extension-gfm-autolink-literal`（同一条 CJK 断句修复的两层），`@fortune-sheet/core` + `@fortune-sheet/react`（只读模式的底层与组件层），以及 `node-pty` + 打包后的可执行文件布局。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `@botiverse__oar@0.67.0.patch` | patch | 163 | 修 `@botiverse/oar@0.67.0`，8 个文件。三处：① `launch-args.js` + `launch.js` 原本无条件追加 `--dangerously-skip-permissions`，会覆盖用户显式传入的 `--permission-mode`，改为检测到该参数存在时不再追加；② Codex 运行时 `initialize` 请求失败时补 `client.kill()` 与 `await client.exited`，避免握手失败留下僵尸子进程；③ `InstallationProbe` 与 `readExecutableVersion` 增加可选 `env` 叠加参数，让安装探测能在受控环境变量下执行。 | 精读 |
| `@earendil-works__pi-ai@1.3.0.patch` | patch | 100 | 修 `@earendil-works/pi-ai@1.3.0`，6 个 provider 适配文件。给工具调用补 Gemini 的 `thought_signature` 往返：流式解析时把 `extra_content.google.thought_signature` 存入 block，转回请求时再写进 `extra_content`。缺这一步，Gemini 的 OpenAI 兼容端点会拒绝重放带工具调用的历史。顺带删掉几处重复的 `parseStreamingJson` 赋值。 | 精读 |
| `@electron__osx-sign@1.3.3.patch` | patch | 26 | 修 `@electron/osx-sign@1.3.3`，cjs/esm 两份 `util.js`。`walkAsync` 里 `fs.stat` 改 `fs.lstat`：签名遍历不再跟随符号链接，避免把链接目标（可能在工作目录之外）纳入签名与哈希计算。 | 精读 |
| `@fortune-sheet__core@1.0.4.patch` | patch | 76 | 修 `@fortune-sheet/core@1.0.4` 的两份 dist 产物。三处：`rangeValueToHtml` 用 lodash `_.escape` 替换自有 `escapeHTMLTag`；`allowEdit === false` 时编辑入口直接返回；只读模式下触控板双指滚动按 pixel delta 同时作用于 X/Y 轴并回写 `ctx.scrollLeft/scrollTop`，与 React 侧受控滚动条保持一致。 | 精读 |
| `@fortune-sheet__react@1.0.4.patch` | patch | 138 | 修 `@fortune-sheet/react@1.0.4` 的两份 dist 产物，与上一条配套补只读模式。四处：FxEditor 只读时改用 `textContent` 写入公式值（避免 HTML 注入与富文本样式）；活动区域改为回读当前 sheet 的 `luckysheet_select_save` 而非清空；SheetTab 判断是否显示滚动按钮时把左右导航按钮宽度计入可用宽度；SheetItem / SheetListItem 同步同一处选择状态修复。 | 精读 |
| `@yao-pkg__pkg@6.21.0.patch` | patch | 165 | 修 `@yao-pkg/pkg@6.21.0`，2 个文件。① `lib-es5/sea-assets.js` 把 Brotli 压缩质量从默认 11 降到 6，体积增幅 <12%，构建时间约为原来的 1/40（补丁注释原文）；② `prelude/sea-bootstrap.bundle.js` 新增 `writeFileAtomic`，用同目录临时文件 + rename 写入 SEA 内嵌原生模块，避免并发进程读到半写文件（注释点名 Linux `SIGBUS` 与 macOS "Library not loaded"）。其余 hunk 是同一改动在 bundle 内的镜像，这也是文件达 402 KB 的原因。 | 精读 |
| `app-builder-lib@26.17.0.patch` | patch | 27 | 修 `app-builder-lib@26.17.0`。给 DMG 的 `format` 枚举补上 `ULMO`（lzfse 压缩、只读 UDIF），同步改 `out/options/macOptions.d.ts` 与 `scheme.json`。只放宽类型与配置校验，不改打包逻辑；能否真正产出 `ULMO` 取决于 macOS 的 `hdiutil`。 | 精读 |
| `exceljs@4.4.0.patch` | patch | 806 | 修 `exceljs@4.4.0`，7 个文件，是唯一带实质重构的补丁。把读取路径从「按固定文件名猜」（`xl/worksheets/sheetN.xml`、`xl/commentsN.xml` 等）改为**按 OPC 关系解析**：启用 saxes 命名空间模式并把前缀归一化为 xforms 期望的规范名；新增 `_resolvePart` 做相对路径解析、拒绝越界与 `TargetMode=External`；拒绝大小写冲突的重复 part 与缺失 part；`_readXmlEntry` 按 BOM 识别 UTF-8 / UTF-16LE / UTF-16BE；注释与 VML 的关联改为按关系类型查找（不再拼 `../name.xml` 这类字符串键）；对缺失工作表/关系由静默 `return` 改为抛错。另把 `package.json` 的 `browser` 从 `dist/exceljs.min.js` 改为 `dist/exceljs.js`，否则浏览器构建用的是未打补丁的压缩版。改动镜像进 `dist/exceljs.js`。 | 精读 |
| `lexical@0.49.0.patch` | patch | 58 | 修 `lexical@0.49.0`，5 个文件（4 份 dist 产物 + `src/LexicalUtils.ts`）。唯一实质改动在 `scrollIntoViewIfNeeded`：`visualViewport.offsetTop` 改为 `visualViewport.pageTop - defaultView.scrollY`，使软键盘顶起页面后的滚动计算与 `getBoundingClientRect` 处于同一坐标系。补丁 648 KB 而只有 58 行，是因为 prod 产物被压成单行，一个 hunk 头 `@@ -9,2 +9,2 @@` 就对应整段压缩代码。 | 精读 |
| `mdast-util-gfm-autolink-literal@2.0.1.patch` | patch | 14 | 修 `mdast-util-gfm-autolink-literal@2.0.1`（单文件 `lib/index.js`）。URL 自动链接正则从 `(https?:\/\/\|www(?=\.))([-.\w]+)([^ \t\r\n]*)` 收紧为「ASCII 可打印字符 + 非标点/非符号/非空白的非 ASCII」，让中文句读（`。`、`，`、全角空格）成为链接的终止符。 | 精读 |
| `micromark-extension-gfm-autolink-literal@2.1.0.patch` | patch | 198 | 修 `micromark-extension-gfm-autolink-literal@2.1.0`，`dev/lib/syntax.js` 与 `lib/syntax.js` 两份。上一条在 tokenizer 层的对应改动：新增 `nonAsciiPunctuation(code)`（`code > 127` 且 `unicodePunctuation`），在 path 与 trail 两处与 `unicodeWhitespace` 并列为终止条件；新增 `astralPunctuation` 构造处理代理对，避免增补平面字符（emoji 等）被截断。扫描器与转换器必须成对升级，只打一个会出现「渲染端断句、解析端不断句」。 | 精读 |
| `node-pty@1.2.0-beta.15.patch` | patch | 45 | 修 `node-pty@1.2.0-beta.15`，2 个文件。① `unixTerminal.js` 的 `spawn-helper` 路径改为三级回退：`DSH_NODE_PTY_SPAWN_HELPER` 环境变量 → `process.execPath + '-spawn-helper'` → 原 `native.dir` 方案，为 SEA/exe 打包后「helper 已不在 JS 文件旁边」的布局准备；② `windowsPtyAgent.js` 在 `kill` 后立即 `_conoutSocketWorker.dispose()`，避免进程已退出、不再产生输出时 worker 永久挂起。 | 精读 |

补丁侧的三个注意点：

1. `DSH_NODE_PTY_SPAWN_HELPER` 在当前仓库内**只出现在补丁文本本身**（全仓 grep 仅 1 处命中），没有生产者。说明它依赖打包运行时或上层启动器注入；谁设置它、设置在什么路径，本轮未找到证据，标 **待确认**。
2. `exceljs` 的 806 行不能机械 rebase——它重写了读取主循环的控制流（`entryName` 分派 → `partTypes` 分派），升级上游时必须重跑 xlsx 读取用例，而不是只看补丁能否 apply。
3. `lexical`、`@fortune-sheet/*` 补丁只落在 dist 压缩产物上，diff 行数与真实改动量不成比例；评审时看 `src/` 或 hunk 头所在函数名，不要看行数。

**本节统计**：覆盖 12 个文件，表格 12 行（折叠 0 条）。`精读` 12、`结构判断` 0、`待确认` 1（`DSH_NODE_PTY_SPAWN_HELPER` 的注入方）。

## 十九、python（69 个）

`python/` 下是两个**独立发布**的 Python 包，不是一个 SDK 包加一个内部目录：

- `sdk` → `deepseek-harness-sdk` / `deepseek_harness`：纯客户端。它不启动模型，只通过 stdio 上的 newline-delimited JSON-RPC 驱动 `dsh --profile sdk`，对外暴露「高层回合 API（`DeepSeekHarness` / `Session` / `RunResult`）+ 低层协议客户端（`HarnessClient`）」两层。
- `sdk-runtime` → `deepseek-harness-runtime-bin` / `deepseek_harness_runtime`：载体包。真正装进去的是单文件 `dsh` 可执行文件与原生 sidecar（ripgrep、macOS `-spawn-helper`），目标机不需要 Node。

两者可以不同版本运行，但有一条硬约定：**每次启动都必须显式指定 Harness home**，Python 侧不会静默读 `~/.dsh`。构建来自 `scripts/build-exe-for-python-sdk.ts` 与 CI `build-exe-for-python-sdk.yml`，发布走 `python-release.yml`（要求 `python-v*` tag）。

### 19.1 python 顶层

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 20 | 两个包的分工表与行为约定：SDK 默认启动打包运行时、显式 home、运行时同时打包 `dsh web` 资产。 | 精读 |
| `development.md` / `development.zh.md` / `development.i18n.yaml` | md | 106 | 贡献者流程：构建运行时产物、校验两个包、源码模式开发、分发。 | 结构判断 |

### 19.2 python/sdk 顶层

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `pyproject.toml` | toml | 39 | `deepseek-harness-sdk` 的包元数据、Python 版本下限与 pydantic 依赖。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 152 | SDK 参考：运行时选择、profile、补丁与外部插件管理的完整说明。 | 结构判断 |

### 19.3 python/sdk/src/deepseek_harness

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `__init__.py` | py | 28 | 公开导出面：高层 4 个类型 + 协议客户端 3 个类型 + `SdkProtocolError` + 8 个协议模型。 | 精读 |
| `api.py` | py | 335 | 高层回合 API：`DeepSeekHarness` 管进程生命周期与 session 创建/恢复，`Session.run` 把一次 prompt 收敛成 `RunResult`；内部 `_RunActivity` 靠 inbox receipt 判断「这一轮结束了没有」。 | 结构判断 |
| `client.py` | py | 735 | 低层 JSON-RPC 客户端：拉起子进程、按行分帧、请求/通知/服务端请求三条通道分发、订阅与审批应答。结构：前段是配置与进程启动，中段是 `_query`/`request` 与通知订阅，后段是服务端问询（`next_request`/`respond`）与原始帧读写。 | 结构判断 |
| `errors.py` | py | 23 | 唯一异常类型 `SdkProtocolError`，覆盖非零退出、非法帧与协议违约。 | 结构判断 |
| `models.py` | py | 107 | 协议 pydantic 模型：`InitializeResponse`、`Notification`、`IncomingRequest`、审批与用户提问的请求/结果类型。 | 结构判断 |
| `office.py` | py | 219 | Office 文档能力：`render_images` / `convert` / `recalculate` 三个入口，统一经子进程调用原生 office CLI，并把 `_CliFailure` 翻译成带退出码的 `OfficeError`。 | 结构判断 |

### 19.4 python/sdk/examples

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | --- | --- | --- |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 115 | 六个示例的意图、前置条件与运行方式。 | 结构判断 |
| `minimal.py` | py | 50 | 最小可运行示例：选 `sdk-minimal` profile 跑一轮并把输出打到终端。 | 结构判断 |
| `compact.py` | py | 54 | 会话压缩（compaction）示例。 | 结构判断 |
| `goal.py` | py | 65 | 目标（goal）的创建与推进示例。 | 结构判断 |
| `manage_plugins.py` | py | 55 | 运行时插件的增删查示例。 | 结构判断 |
| `permission.py` | py | 45 | 审批/权限回调的接法示例。 | 结构判断 |
| `plan.py` | py | 173 | 计划模式（plan）的完整交互，六个示例里篇幅最长。 | 结构判断 |

### 19.5 python/sdk/tests

测试全部按被测对象命名，三组分别对应「协议与进程」「功能模块」「打包与投影」。`expected/*.json` 是投影结果的期望快照，`fixtures/office_cli.py` 是 office 子进程的替身。

#### 19.5.1 协议与进程控制

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `test_client.py` | py | 1203 | 被测对象 `client.py`：分帧、请求超时、通知订阅、服务端问询应答、错误帧与进程异常退出。结构：按「连接 → 请求/通知 → 服务端请求 → 故障」四段组织，占全节近半篇幅。 | 结构判断 |
| `test_run.py` | py | 454 | 被测对象 `api.py` 的 `Session.run`：回合成败、通知收集与 `RunResult` 字段完整性。 | 结构判断 |
| `test_resume.py` | py | 58 | 被测对象 `api.py` 的会话恢复路径。 | 结构判断 |
| `test_runtime_resolution.py` | py | 419 | 被测对象 `sdk-runtime` 的运行时解析：exe 载体、`DSH_RUNTIME_MODE=node` 开发载体、平台/架构标签与缺失报错。 | 结构判断 |
| `test_bundled_runtime.py` | py | 106 | 打包运行时的端到端可用性（可执行文件存在、命令语法一致）。 | 结构判断 |
| `manual_sdk_agent_smoke.py` | py | 130 | 手工冒烟：真实跑一轮 agent，不属于 `pytest` 自动集合。 | 结构判断 |
| `manual_sdk_shutdown_smoke.py` | py | 36 | 手工冒烟：验证关闭流程不留子进程。 | 结构判断 |
| `run_installed_commands.py` | py | 69 | 对已安装的 `dsh` 控制台命令做一轮命令面检查。 | 结构判断 |

#### 19.5.2 功能模块

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `test_commands_runtime.py` | py | 671 | 被测对象：slash 命令的运行时行为（注册、解析、执行与错误）。 | 结构判断 |
| `test_command_attachments_runtime.py` | py | 285 | 被测对象：命令携带附件时的上下行传递。 | 结构判断 |
| `test_approval.py` | py | 55 | 被测对象：审批请求的模型与序列化形状。 | 结构判断 |
| `test_approval_runtime.py` | py | 52 | 被测对象：审批在真实运行时里的往返。 | 结构判断 |
| `test_user_questions.py` | py | 242 | 被测对象：`UserQuestionHandler` 的提问/作答流程与多选答案。 | 结构判断 |
| `test_goal_runtime.py` | py | 173 | 被测对象：goal 插件的运行时推进与状态。 | 结构判断 |
| `test_goal_result_text_runtime.py` | py | 29 | 被测对象：goal 结果文本的拼装。 | 结构判断 |
| `test_goal_example.py` | py | 138 | `examples/goal.py` 的可运行性。 | 结构判断 |
| `test_plan_input.py` | py | 323 | 被测对象：plan 模式的输入构造与校验。 | 结构判断 |
| `test_plan_input_posix.py` | py | 53 | 同上，POSIX 路径分支。 | 结构判断 |
| `test_plan_runtime.py` | py | 264 | 被测对象：plan 模式在运行时的交互序列。 | 结构判断 |
| `test_plan_example.py` | py | 82 | `examples/plan.py` 的可运行性。 | 结构判断 |
| `test_office.py` | py | 101 | 被测对象 `office.py`：三个入口的调用参数与结果模型。 | 结构判断 |
| `test_office_interrupts.py` | py | 106 | 被测对象：office 子进程被中断时的错误分类。 | 结构判断 |
| `test_office_render.py` | py | 126 | 被测对象：`render_images` 的图片与区域结果。 | 结构判断 |
| `test_working_directory.py` | py | 54 | 被测对象：工作目录的读取与切换。 | 结构判断 |

#### 19.5.3 投影、打包与发布

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `test_cot_translation_projection.py` | py | 83 | 被测对象：思维链翻译投影，对照 `expected/cot-translation-projection.json`。 | 结构判断 |
| `test_account_provider_snapshot.py` | py | 35 | 被测对象：账号 provider 登出后的投影，对照 `expected/account-provider-signout.json`。 | 结构判断 |
| `expected/account-provider-signout.json` / `cot-translation-projection.json` / `team-mode-projection.json` | json | 11 / 106 / 48 | 三个投影快照；`team-mode-projection.json` 当前没有同名用例引用，标 **待确认**（可能由 TS 侧快照测试共用）。 | 结构判断 |
| `fixtures/office_cli.py` | py | 48 | office 子进程替身：按参数返回固定结果或固定失败码。 | 结构判断 |
| `test_release_version.py` | py | 199 | 被测对象：两个包与运行时产物的版本一致性。 | 结构判断 |
| `test_macos_deployment_target.py` | py | 66 | 被测对象：macOS 产物的 deployment target 下限。 | 结构判断 |
| `test_smoke_model.py` | py | 785 | 端到端冒烟：用真实模型路径跑通 SDK 全链路。结构：前半是场景表驱动的用例矩阵，后半是断言与清理；是本节第二长的文件，也是唯一依赖网络/凭据的用例，CI 中应被跳过（**待确认**实际开关）。 | 结构判断 |

### 19.6 python/sdk-runtime

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `pyproject.toml` | toml | 41 | `deepseek-harness-runtime-bin` 元数据；声明包数据与平台 wheel 的附加关系。 | 结构判断 |
| `package.json` | json | 168 | 运行时包的 Node 侧清单：构建脚本入口、平台矩阵、随包分发的 sidecar 清单。 | 结构判断 |
| `platforms.json` | json | 22 | 支持的 `platform-arch` 组合表，供构建脚本与运行时解析共用。 | 结构判断 |
| `hatch_build.py` | py | 108 | 构建钩子：把 `runtime/` 下的可执行文件与 sidecar 打进 wheel，并排除开发用的 `runtime/node/`。 | 结构判断 |
| `runtime-bootstrap.mjs` | mjs | 112 | 开发载体的启动器：`node runtime/node/runtime-bootstrap.mjs` 拉起当前源码构建的 dsh。 | 结构判断 |
| `README.md` / `README.zh.md` / `README.i18n.yaml` | md | 69 | 运行时载体参考：两种载体（exe / node）、选择规则与获取途径。 | 结构判断 |
| `src/deepseek_harness_runtime/__init__.py` | py | 222 | 运行时定位与执行：`bundled_package_dir` / `bundled_runtime_path` / `resolve_bundled_launch_args`，按平台标签拼可执行文件名并做存在性校验。 | 结构判断 |
| `src/deepseek_harness_runtime/_resources.py` | py | 116 | 资源校验与 office 启动参数：`validate_resources` / `validate_downloads` / `office_launch_args`。 | 结构判断 |
| `src/deepseek_harness_runtime/deepseek-harness-runtime.json` | json | 1 | 包元数据标记文件（单行 JSON），`bundled_package_dir` 以它的存在判断包是否完整。 | 结构判断 |

**本节统计**：覆盖 69 个文件，表格 57 行（折叠 12 条：README 三件套 5 组折 10 条、`expected` 3 个快照并入 1 行折 2 条）。`精读` 2（`python/README.md` 三件套、`python/sdk/**/__init__.py`）、`结构判断` 55、`待确认` 0（另有两处职责内注明「待确认」，但整行仍按证据标为 `结构判断`：`team-mode-projection.json` 的引用方、`test_smoke_model.py` 的网络开关）。校验：2 + 55 = 57 ✓。

## 二十、scripts（465 个）

`scripts/` 是仓库唯一的「编排层」：它不产出产品代码，而是把散落在 `packages/`、`apps/`、`native/`、`website/` 里的构建、校验、生成动作收敛成可重复执行的入口。三个事实决定了怎么读这个目录：

1. **唯一 CI 入口是门禁脚本**。`.github/workflows/*.yml` 只调用 `tsx scripts/run-gates.ts <gate>`，不直接调用单个校验脚本；因此判断一个脚本「是否在 CI 里跑」要顺着 `run-gates.ts` 的 gate 表看，而不是在 workflow 里搜文件名。
2. **本地入口是 npm script**。根 `package.json` 的 `check:*`、`gen-*`、`verify-*`、`release:*`、`test:*` 把 200 余个脚本各绑了一个名字，`pnpm <name>` 是最短调用路径。
3. **测试文件由 vitest glob 覆盖**。`vitest.config.ts` 的 `testIncludes` 含 `'scripts/**/*.spec.ts'`，所以本目录 176 个 `*.spec.ts` 不会被逐条登记进任何 npm script，却仍然在 `pnpm test` 中执行——这一点是后文「疑似失效脚本」判定的关键前提。

根目录 363 个文件（203 个非测试 + 160 个测试），另有 10 个子目录共 102 个文件。以下按职能分组，组内按文件名排序；每行末尾的「调用点」列写明它被哪条 npm script 或哪个 gate 触发，没有调用点的写「无直接入口」。

### 20.1 导览与门禁编排

`run-gates.ts` 是整个 CI 的中枢，其余文件是它的输入（gate 表、覆盖面清单、平台准备脚本）或它的补充入口（本地预检、Windows 兼容层）。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `AGENTS.md` | md | 5 | 该目录的 AI 协作约束短文件，指明脚本改动需同步的门禁与文档。 | 结构判断 |
| `run-gates.ts` | ts | 1762 | 门禁总控：注册全部 gate（`ci-primary`、`ci-static`、`ci-coverage`、`ci-unit`、`ci-bench`、`ci-snapshot`、`ci-artifacts`、`ci-consumers`、`doc-quick`、`doc-sync`、`hygiene`、`i18n`、`node-compat`、`ci-windows-blocking` 等），按顺序串起子命令并在首个失败处中断。结构：前段是 gate 定义表与步骤构造器，中段是各 gate 的步骤序列，后段是 CLI 参数解析、日志着色与退出码归一。调用点：`check:*`、`test:docs`、`doc-sync`、`hygiene`。 | 结构判断 |
| `change-scope.ts` | ts | 248 | 从 git 变更文件推算受影响的范围，供门禁裁剪与人工判断「这次改动要跑哪些 gate」。调用点：`pnpm change-scope`。 | 结构判断 |
| `pre-merge-check.ts` | ts | 140 | 合并前的本地预检组合，串起变更范围与必跑门禁。调用点：无直接入口（本地手动）。 | 结构判断 |
| `parallelism.ts` | ts | 44 | 统一测试/构建并行度：读取机器核数并施加 `LOCAL_TEST_PARALLELISM_CAP`，被 `vitest.config.ts` 与覆盖率分区共用。调用点：被配置 import。 | 结构判断 |
| `run-ci-bench.ts` | ts | 28 | 基准门禁的薄封装，在 CI 环境变量下启动基准套件。调用点：由 `run-gates.ts` 的 `ci-bench` 分支调用。 | 结构判断 |
| `wine-windows-gates.sh` | sh | 296 | 在 Wine 上跑 Windows 专属门禁的兼容层；CI 的 Linux lane 用它覆盖 Windows 才有的行为。调用点：`pnpm check:windows-wine`。 | 结构判断 |
| `prepare-ci-bubblewrap.sh` | sh | 34 | 在 CI 容器里准备 bubblewrap 沙箱（Linux 上的文件系统隔离依赖）。调用点：由 Linux CI job 的前置步骤执行。 | 结构判断 |
| `prepare-linux-node-pty.sh` | sh | 23 | 准备 `node-pty` 在 Linux 下的编译依赖，供原生模块构建。调用点：由 Linux CI job 前置执行。 | 结构判断 |
| `ci-compatible-toolcache.mjs` | mjs | 8 | 把 CI 缓存目录映射成工具链期望的路径，规避 runner 间路径差异。调用点：由 workflow 的 setup 步骤执行。 | 结构判断 |
| `desktop-archive-workflow-test.ts` | ts | 28 | 桌面端归档流程的最小可执行验证，给 workflow 的打包步骤提供本地替身。调用点：无直接入口。 | 结构判断 |
| `check-expected-filenames.sh` | sh | 26 | 校验期望文件命名规范（避免 `*.expected.json` 之类后缀漂移）。调用点：无直接入口，**待确认**是否已被 TS 版校验取代。 | 待确认 |
| `check-vendor-manifest.sh` | sh | 17 | 校验 `vendor/` 清单文件与实际目录一致。调用点：无直接入口，**待确认**与 `rescope-vendor:check` 的职责边界。 | 待确认 |
| `slot-walk.ts` | ts | 432 | 遍历 UI 插槽树并输出结构，供客户端插槽相关校验复用。调用点：被其他脚本 import。 | 结构判断 |

### 20.2 覆盖率基础设施

覆盖率门禁需要「分区、豁免、定位、诊断」四件事，这里每个文件负责一件。它们共同决定 `ci-coverage` 的耗时与报告形态。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `coverage-partitions.ts` | ts | 756 | 覆盖率分区的核心：按包与测试族切分 suite，给出超时与并发参数；导出 `COVERAGE_PARTITION_MODE_ENV`、`COVERAGE_TEST_TIMEOUT_ENV` 供 vitest 配置读取。调用点：被 `vitest.config.ts` 与 `run-coverage-partitions.ts` import。 | 结构判断 |
| `run-coverage-partitions.ts` | ts | 25 | 按分区逐个跑覆盖率并汇总，是 `test:coverage:partitioned` 的入口。调用点：`test:coverage:partitioned`。 | 结构判断 |
| `coverage-exempt.ts` | ts | 64 | 维护「不纳入覆盖率的重型 suite」白名单（`coverageExemptHeavySuites`、`COVERAGE_EXEMPT_ENV`），并在注释里写明成员约定。调用点：被 `vitest.config.ts` import。 | 结构判断 |
| `coverage-canonical-locations.ts` | ts | 94 | 把覆盖率报告里的路径归一成仓库相对路径，消除绝对路径与盘符差异。调用点：被 reporters 复用。 | 结构判断 |
| `coverage-uncovered-locations.cjs` | cjs | 121 | 自定义 vitest reporter，按「未覆盖位置」而不是「未覆盖文件」聚合输出。调用点：`vitest.config.ts` 以 `fileURLToPath` 加载。 | 结构判断 |
| `coverage-file-times.ts` | ts | 43 | 记录每个文件的耗时，用于反推慢测试并调整分区。调用点：被覆盖率脚本 import。 | 结构判断 |
| `coverage-fork-diagnostics.ts` | ts | 85 | 覆盖率子进程异常（OOM、被信号杀掉）时的诊断输出。调用点：被分区脚本 import。 | 结构判断 |

本组用例依赖的四个夹具（`fixtures/coverage-fork.config.ts`、`coverage-fork.fixture.ts`、`coverage-fork-exit.cjs`、`lane-test-budget.fixture.ts`）统一登记在 20.18，此处不重复列。

### 20.3 构建、清理与产物分析

这一组把「源码 → 可发布产物」拆成可单独执行的步骤：类型工程装配、库打包、产物裁剪分析、发布前体检、vendor 重命名。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `build.ts` | ts | 194 | 构建总入口，按 `--scope`（`artifacts`/`check`/`typecheck`）与 `--profile`（`official`）分派到不同构建链。调用点：`build`、`build:artifacts`、`build:check`、`build:official`、`typecheck`。 | 结构判断 |
| `clean.ts` | ts | 244 | 清理构建产物与缓存：按类型列出待删目录，默认 dry-run，`--force` 才真删。调用点：`pnpm clean`。 | 结构判断 |
| `compile-referenced-projects.ts` | ts | 269 | 按 TS project references 把依赖工程先编出来，解决「直接 `tsc -b` 会重复编译」的问题。调用点：`build:lib:host`、`lint`、`lint:fix`、`doc-typecheck`。 | 结构判断 |
| `ts-project.ts` | ts | 151 | 解析 `tsconfig` 的 references、路径别名与编译面（host/client），供上面三个脚本共用。调用点：被 import。 | 结构判断 |
| `project-reference-faces.ts` | ts | 129 | 定义「编译面」（face）概念：同一份源码在 host 与 client 两套 `tsconfig` 下的不同可见性。调用点：被 import。 | 结构判断 |
| `client-build-environment.ts` | ts | 413 | 客户端构建环境的集中声明（目标平台、注入的环境变量、条件导出开关），保证各包构建时读到同一份定义。调用点：被构建脚本与 `types/client-build-environment` 共享。 | 结构判断 |
| `browser-bundled-externals.ts` | ts | 183 | 维护「浏览器包中必须保持 external 的模块」清单，防止把宿主依赖打进前端产物。调用点：被打包配置 import。 | 结构判断 |
| `bundle-input-isolation.ts` | ts | 96 | 校验各 bundle 的入口互不交叉，避免一个 bundle 意外吞掉另一个 bundle 的模块。调用点：被打包配置 import。 | 结构判断 |
| `web-product-bundle-isolation.ts` | ts | 199 | 同上，针对 `web` 产品形态：确保 `dsh web` 的产物不引用桌面端专属模块。调用点：被 web 构建链 import。 | 结构判断 |
| `attribute-chunk-bytes.mjs` | mjs | — | 把 chunk 体积归因到具体模块，用于回答「这个包为什么这么大」。调用点：无直接入口（分析工具）。 | 结构判断 |
| `executable-packaging.ts` | ts | 82 | 单文件可执行（SEA/pkg）的打包参数与环境装配。调用点：被 exe 构建脚本 import。 | 结构判断 |
| `executable-native-pty.ts` | ts | 45 | 单文件可执行里 `node-pty` 原生模块的落位与加载路径处理。调用点：被 exe 构建脚本 import。 | 结构判断 |
| `rescope-vendor.ts` | ts | 773 | 把 `vendor/` 下上游包整体重命名为 `@deepseek-ai` 作用域：改写 `package.json`、导入语句与文档引用。结构：前缀是包清单与改名映射，中段是文件遍历与文本替换，后段是 `--check` 模式的差异报告。调用点：`rescope-vendor`、`rescope-vendor:check`。 | 结构判断 |
| `publint-all.ts` | ts | 245 | 对全部待发布包跑 publint，汇总 `exports`/`types` 的规范性问题。调用点：`pnpm publint`。 | 结构判断 |
| `publint-browser-format.ts` | ts | 16 | publint 的浏览器条件导出规则补充，判定 `browser` 字段与 `exports` 是否自洽。调用点：被 `publint-all.ts` import。 | 结构判断 |
| `publication-payload.ts` | ts | 17 | 定义「一个包发布时实际会带上哪些文件」的判定规则，供发布与体积校验共用。调用点：被 import。 | 结构判断 |
| `publish-npm-baseline.ts` | ts | 1070 | 生成/比对 npm 安装基线：把一组包按版本装进临时目录，记录解析结果作为回归基线。结构：前段是包选择与版本约束，中段是安装与解析，后段是基线写盘与差异报告。调用点：`publish:npm-baseline`。 | 结构判断 |
| `npm-baseline-packages.ts` | ts | 26 | 基线包清单：哪些包纳入 npm 解析基线。调用点：被 `publish-npm-baseline.ts` import。 | 结构判断 |
| `npm-platform.ts` | ts | 21 | npm 平台标签（`os`/`cpu`/`libc`）到内部命名的映射。调用点：被发布脚本 import。 | 结构判断 |
| `pnpm-invocation.ts` | ts | 21 | 统一 pnpm 调用方式（含 Windows 下的 `pnpm.cmd` 差异）。调用点：被多个脚本 import。 | 结构判断 |
| `python-runtime-deploy.pnpmfile.mjs` / `.d.mts` | mjs / mts | 25 / 15 | 部署闭包专用的 pnpmfile：拦截依赖解析，把运行时需要的包固定在部署目录内。调用点：被 python 运行时构建链以 `--pnpmfile` 传入。 | 结构判断 |
| `libreoffice-packages.mjs` / `.d.mts` | mjs / mts | 80 / 17 | LibreOffice sidecar 的包清单与下载元数据，供 office 渲染资源准备使用。调用点：被 office 资源构建导入。 | 结构判断 |

### 20.4 Python 运行时与本地原生构建

这组把 TypeScript 仓的产物打成一个不依赖 Node 的 Python wheel/单文件可执行，是「Python SDK 能用」的前提。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `build-exe-for-python-sdk.ts` | ts | 630 | Python 运行时构建总控：部署闭包 → 单文件 exe → 平台 wheel → 随包 sidecar 装配。结构：前段是阶段编排，中段是平台矩阵与产物命名，后段是校验与清单写盘。调用点：`build-exe-for-python-sdk` 及相关 npm 入口（见 `build-exe-for-python-sdk-*` 分阶段脚本）。 | 结构判断 |
| `build-exe-for-python-sdk-staging.ts` | ts | 103 | 阶段一：把 deploy 闭包与资源拷进 staging 目录，保证后续打包输入稳定。调用点：被总控调用。 | 结构判断 |
| `build-exe-for-python-sdk-resources.ts` | ts | 17 | 阶段二：准备 ripgrep、spawn-helper 等 sidecar 资源。调用点：被总控调用。 | 结构判断 |
| `build-exe-for-python-sdk-office.ts` | ts | 63 | 阶段三：单独构建 Office 引擎 sidecar（体积大、更新频率低，与主运行时解耦）。调用点：被总控或 office 专用入口调用。 | 结构判断 |
| `build-exe-for-ssh-helper.ts` | ts | 176 | 构建 SSH helper 原生可执行，并产出与主包分离的产物供 `ssh-helper/` 目录校验。调用点：被发布/构建链调用。 | 结构判断 |
| `build-python-release.py` | py | 295 | 从 Python 侧驱动 release：构建两个 wheel、校验元数据、生成发布清单。调用点：发布流程中手动/CI 调用。 | 结构判断 |
| `smoke-python-runtime.py` | py | 3279 | Python 运行时冒烟：启动打包好的可执行，跑多组会话场景并比对快照。结构：前半是场景表与运行器，中段是按能力划分的用例组（最小会话、工具调用、恢复、计划、goal、office 等），后段是快照比对与差异输出。调用点：由 Python 侧测试与 CI 的 exe job 调用。 | 结构判断 |
| `check-macos-deployment-target.py` | py | 111 | 校验 macOS 产物的 deployment target 不低于声明下限。调用点：macOS 打包后置检查。 | 结构判断 |

### 20.5 依赖、包政策与源码用法分析

这一组回答「谁能依赖谁」「发布形态是否合法」「某段源码到底用了什么」，是 monorepo 边界的主要执法者。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `check-workspace-constraints.ts` | ts | 742 | 工作区约束总校验：包命名、目录层级、workspace glob 归属、禁止的跨层依赖。结构：前段是约束声明，中段是逐包扫描，后段是违例汇总。调用点：`pnpm constraints`。 | 结构判断 |
| `package-dependency-policy.ts` | ts | 139 | 依赖政策的具体规则集（允许的依赖方向、必须用 peer 的场景），被上面的脚本消费。调用点：被 import。 | 结构判断 |
| `package-graph.ts` | ts | 168 | 构建包依赖图，供环检测与影响面分析。调用点：被 `change-scope.ts` 等 import。 | 结构判断 |
| `product-package-policy.ts` | ts | 51 | 「产品包」的准入规则：哪些包可以进最终产物、哪些只能作为开发依赖。调用点：被 import。 | 结构判断 |
| `experimental-package-policy.ts` | ts | 127 | `experimental/` 下包的特殊政策：可放宽稳定性要求，但不得被稳定包直接依赖。调用点：被 import。 | 结构判断 |
| `plugin-entry-existing-exports.ts` | ts | 259 | 记录各插件入口「已经导出过什么」，防止插件入口在重排时丢导出。调用点：被 `verify-plugin-entry-exports.ts` import。 | 结构判断 |
| `plugin-record-catalog.ts` | ts | 133 | 插件登记目录的数据结构：把插件名、入口、能力位聚成可校验的目录。调用点：被 `verify-plugin-record-callers.ts` 等 import。 | 结构判断 |
| `workspace-package-globs.ts` | ts | 11 | `pnpm-workspace.yaml` 六条 glob 的单一事实源，供脚本判断某路径是否属工作区。调用点：被 import。 | 结构判断 |
| `source-parse-uses.ts` | ts | 225 | 用 TS AST 找出源码对某模块/符号的实际引用位置，是多项「用法」校验的公共底座。调用点：被 import。 | 结构判断 |
| `package-source-uses.worker.ts` | ts | 44 | 上面解析器的 worker 入口，把大仓扫描并行化。调用点：被 `source-parse-uses.ts` 调用。 | 结构判断 |
| `type-equiv.manifest.json` | json | 2962 | 类型等价校验的清单：声明哪些跨包类型必须保持结构一致。调用点：`verify-type-equiv` 读取。 | 结构判断 |
| `type-equiv-prefilter.ts` | ts | 19 | 先按清单筛出需要深比对的文件，避免全量比对。调用点：被 `verify-type-equiv.ts` import。 | 结构判断 |
| `no-unknown-casts.baseline.json` | json | 1957 | `as unknown as` 断言的基线快照，新增一处就必须改基线。调用点：`verify-no-unknown-casts` 读取。 | 结构判断 |
| `doc-budgets.manifest.json` | json | 9 | 文档篇幅预算（每篇允许的最大行数/字数）。调用点：`verify-doc-budgets` 读取。 | 结构判断 |
| `translation-pairing.manifest.json` | json | 26 | 翻译配对白名单/例外表，供翻译门禁豁免特定文件。调用点：`translation-pairing` 读取。 | 结构判断 |
| `typert-faces.ts` | ts | 5 | typert 两个编译面（host/client）的常量声明。调用点：被 import。 | 结构判断 |
| `typert-workspace.fixture.ts` | ts | 106 | typert 校验用的最小工作区夹具。调用点：被测试与生成器 import。 | 结构判断 |
| `volatile-config.fixture.ts` | ts | 11 | 「易变配置」夹具：演示哪些配置字段允许在运行时变化。调用点：被测试 import。 | 结构判断 |
| `fixture-file.ts` | ts | 15 | 生成临时夹具文件的工具函数（建、写、清理）。调用点：被多处测试 import。 | 结构判断 |
| `repo-files.ts` | ts | 295 | 仓库文件遍历的公共实现：遵守 `.gitignore`、跳过构建产物，供各校验脚本复用。调用点：被 import。 | 结构判断 |

### 20.6 代码生成器（gen-*）

这一组是「把仓库事实写成文件」的工具。除 `gen-cordis-api.ts` 是纯再导出外，每个生成器都遵循同一约定：默认写盘，加 `--check` 只比对不写盘（对应 `verify-*` npm script），CI 用 `--check` 模式防止生成物与源码漂移。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `gen-client-catalog.ts` | ts | 614 | 生成客户端包与组件的目录文档，供文档站与校验共用。调用点：`gen-client-catalog`、`verify-client-catalog`（`--check`）。 | 结构判断 |
| `gen-cli-help.ts` | ts | 315 | 从 CLI 命令定义生成帮助文本快照，保证 `--help` 与文档一致。调用点：`gen-cli-help`、`verify-cli-help`。 | 结构判断 |
| `gen-config-catalog.ts` | ts | 1123 | 生成全仓配置项目录（key、类型、默认值、生效范围）。结构：前段收集各包导出的配置 schema，中段做去重与归一，后段渲染成 Markdown/JSON 双份。调用点：`gen-config-catalog`、`verify-config-catalog`。 | 结构判断 |
| `gen-cordis-api.ts` | ts | 9 | 极薄再导出，把 Cordis 的 API 清单转出给 `index.ts` 风格的消费方。调用点：`gen-cordis-api`、`verify-cordis-api`。 | 结构判断 |
| `gen-cordis-catalog.ts` | ts | 1480 | 生成 Cordis 事件/服务/生命周期钩子的总目录，是本组最大的生成器。结构：前段扫描 `vendor/` 与各包的装饰器声明，中段按子系统分片，后段渲染并做一致性断言。调用点：`gen-cordis-catalog`、`verify-cordis-catalog`。 | 结构判断 |
| `gen-cordis-inspect-catalog.ts` | ts | 91 | 生成 `cordis inspect` 子命令用的反射目录（运行时可在不加载包的情况下列出服务）。调用点：`gen-cordis-inspect-catalog`、`verify-cordis-inspect-catalog`。 | 结构判断 |
| `gen-dependency-catalog.ts` | ts | 304 | 生成第三方依赖目录：包名、版本、许可证、被谁使用。调用点：`gen-dependency-catalog`、`verify-dependency-catalog`。 | 结构判断 |
| `gen-doc-graphs.ts` | ts | 1941 | 生成文档里的架构图与模块关系图（Mermaid），是全目录最长的生成器。结构：前段读包依赖图与文档元数据，中段把关系折算成图（模块图、调用图、子系统图），后段写 Mermaid 片段并校验被引用位置。调用点：`gen-doc-graphs`、`verify-doc-graphs`，间接受 `docs:build` 影响。 | 结构判断 |
| `generate-typert.ts` | ts | 132 | 从 `typert` 的类型模型生成运行时可用的反射数据。调用点：无直接 npm 入口，**待确认**是否由 typert 构建脚本内部调用。 | 待确认 |
| `gen-module-graph.ts` | ts | 191 | 生成模块级依赖图（谁 import 谁），供架构文档与环检测使用。调用点：`gen-module-graph`、`verify-module-graph`。 | 结构判断 |
| `gen-official-bundle-catalog.ts` | ts | 137 | 生成「官方插件 bundle」清单，与客户端组装用例里的 roster 对应。调用点：`gen-official-bundle-catalog`、`verify-official-bundle-catalog`。 | 结构判断 |
| `gen-persistence-catalog.ts` | ts | 267 | 生成持久化目录：各类持久化文件的位置、格式版本与迁移关系。调用点：`gen-persistence-catalog`、`verify-persistence-catalog`。 | 结构判断 |
| `gen-plugin-packages.ts` | ts | 83 | 生成插件包索引，把插件名映射到包路径与入口。调用点：`gen-plugin-packages`、`verify-plugin-packages`。 | 结构判断 |
| `gen-session-format-catalog.ts` | ts | 261 | 生成会话格式目录：每个版本的字段增删与兼容策略。调用点：`gen-session-format-catalog`、`verify-session-format-catalog`。 | 结构判断 |
| `gen-third-party-notices.ts` | ts | 884 | 生成第三方声明（NOTICE/许可证聚合），是发布合规的必需产物。调用点：`gen-third-party-notices`、`verify-third-party-notices`。 | 结构判断 |
| `gen-tool-catalog.ts` | ts | 981 | 生成工具目录：每个工具的入参、权限与所属插件，供文档与模型可见性校验共用。调用点：`gen-tool-catalog`、`verify-tool-catalog`。 | 结构判断 |
| `gen-translation-brief.ts` | ts | 331 | 生成翻译任务简报（哪些段落待译、上下文是什么）。调用点：`gen-translation-brief`。 | 结构判断 |
| `gen-tsconfig-paths.ts` | ts | 239 | 从工作区包清单生成根 `tsconfig` 的 `paths` 映射，避免手写别名漂移。调用点：`gen-tsconfig-paths`、`verify-tsconfig-paths`。 | 结构判断 |
| `gen-workflow-guest.ts` | ts | 72 | 生成 workflow 子进程侧的 guest 入口代码。调用点：`gen-workflow-guest`、`verify-workflow-guest`。 | 结构判断 |

### 20.7 门禁校验脚本（verify-*）

49 个校验脚本，共同特征是「读仓库事实 → 与规则比对 → 非零退出即失败」。它们全部被 `run-gates.ts` 的某个 gate 引用，或直接被同名 npm script 调用。下表按执法对象分四组。

#### 20.7.1 包形态、依赖与发布

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `verify-package-dependencies.ts` | ts | 1106 | 全仓依赖合法性的主校验：跨层依赖、未声明依赖、循环依赖、版本对齐。结构：前段建立包图与允许矩阵，中段逐包比对 `package.json` 与源码 import，后段按违例类型分组报错。调用点：`verify-package-dependencies`。 | 结构判断 |
| `verify-package-meta.ts` | ts | 285 | 校验每个包的元数据完整性（`description`、`license`、`repository`、`exports` 必备字段）。调用点：`verify-package-meta`。 | 结构判断 |
| `verify-package-paths.ts` | ts | 113 | 校验 `package.json` 里声明的入口文件真实存在且落在包目录内。调用点：`verify-package-paths`。 | 结构判断 |
| `verify-package-readme-summaries.ts` | ts | 77 | 校验每个包 README 的首段摘要存在且不与目录文档重复。调用点：`verify-package-readme-summaries`。 | 结构判断 |
| `verify-package-readme-model-experience.ts` | ts | 658 | 校验 README 中「模型体验」章节的结构与必备小节，是面向模型的文档规范。调用点：`verify-package-readme-model-experience`。 | 结构判断 |
| `verify-package-readme-limitations.ts` | ts | 96 | 校验包 README 是否声明已知限制，防止把限制藏进代码注释。调用点：`verify-package-readme-limitations`。 | 结构判断 |
| `verify-export-jsdoc.ts` | ts | 607 | 校验公开导出的 JSDoc：摘要、`@param`、`@returns` 是否齐全，对应「方法必须有中文注释」类规范。调用点：`verify-export-jsdoc`。 | 结构判断 |
| `verify-plugin-entry-exports.ts` | ts | 485 | 校验插件入口没有丢失既有导出（对照 `plugin-entry-existing-exports.ts` 的记录）。调用点：`verify-plugin-entry-exports`。 | 结构判断 |
| `verify-plugin-record-callers.ts` | ts | 293 | 校验插件登记表中的每一项都有真实调用方，防止登记了却没人用。调用点：`verify-plugin-record-callers`。 | 结构判断 |
| `verify-optional-dependency-imports.ts` | ts | 213 | 校验 `optionalDependencies` 的引用都包在 try/catch 或条件加载里，避免缺包时启动即崩。调用点：`verify-optional-dependency-imports`。 | 结构判断 |
| `verify-npm-install-layout.ts` | ts | 277 | 校验按 npm 安装后的目录布局与 pnpm 工作区一致（发布形态回归）。调用点：`verify-npm-install-layout`。 | 结构判断 |
| `verify-node-next-types.ts` | ts | 164 | 校验对 `node:` 前缀与 `@types/node` 下一主版本的用法不越界。调用点：`verify-node-next-types`。 | 结构判断 |
| `verify-runtime-closure.ts` | ts | 237 | 校验运行时依赖闭包完整：产物运行所需的包都在闭包里，不多不少。调用点：`verify-runtime-closure`。 | 结构判断 |
| `verify-dsh-package-licenses.ts` | ts | 89 | 校验包内 `LICENSE` 与 `package.json` 的 `license` 字段一致。调用点：`verify-dsh-package-licenses`。 | 结构判断 |
| `verify-version-sync.ts` | ts | 210 | 校验跨包版本一致性：内部依赖的版本范围必须能解析到工作区内版本。调用点：`verify-version-sync`。 | 结构判断 |
| `verify-default-product-isolation.ts` | ts | 413 | 校验默认产品形态不引用实验性或其它产品形态的专属模块。调用点：`verify-default-product-isolation`。 | 结构判断 |
| `verify-product-use.ts` | ts | 314 | 校验「产品包只能通过公开入口使用依赖包」，禁止深路径 import。调用点：`verify-product-use`。 | 结构判断 |
| `verify-application-entrypoints.ts` | ts | 204 | 校验 `apps/*` 的入口只做装配，不含业务逻辑，也不被其他包反向依赖。调用点：`verify-application-entrypoints`。 | 结构判断 |
| `verify-config-source-ownership.ts` | ts | 56 | 校验每个配置项只有一个「属主」来源，防止同一 key 被两处定义。调用点：`verify-config-source-ownership`。 | 结构判断 |

#### 20.7.2 客户端与前端

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `verify-client-packages.ts` | ts | 781 | 客户端包规范总校验：目录结构、导出面、样式隔离、是否误引 Node 内置模块。结构：前段是规则表，中段逐包扫描，后段按规则分组报告。调用点：`verify-client-packages`。 | 结构判断 |
| `verify-client-domain-graph.ts` | ts | 104 | 校验客户端模块的分层图（domain → view → widget），禁止反向依赖。调用点：`verify-client-domain-graph`。 | 结构判断 |
| `verify-client-route-resolution.ts` | ts | 339 | 校验路由声明能被正确解析（含惰性加载与权限守卫的组合）。调用点：`verify-client-route-resolution`。 | 结构判断 |
| `verify-client-ui-i18n.ts` | ts | 361 | 校验客户端 UI 文案全部走 i18n key，没有硬编码字符串。调用点：`verify-client-ui-i18n`，并属 `check:i18n` gate。 | 结构判断 |
| `verify-no-bare-dispatcher.ts` | ts | 225 | 禁止直接使用裸 dispatcher，必须走带类型与权限的封装层。调用点：`verify-no-bare-dispatcher`。 | 结构判断 |
| `verify-no-top-level-await.ts` | ts | 267 | 禁止在会被同步加载的模块里写顶层 `await`，避免影响启动时序。调用点：`verify-no-top-level-await`。 | 结构判断 |
| `verify-locale-metadata.ts` | ts | 81 | 校验语言包元数据（语言码、显示名、回退链）完整。调用点：`verify-locale-metadata`。 | 结构判断 |
| `verify-skill-invocation-metadata.ts` | ts | 122 | 校验技能声明的触发元数据（名称、描述、参数）与实际调用方式一致。调用点：`verify-skill-invocation-metadata`。 | 结构判断 |

#### 20.7.3 文档与翻译

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `verify-doc-budgets.ts` | ts | 58 | 按 `doc-budgets.manifest.json` 校验各文档不超篇幅预算。调用点：`verify-doc-budgets`。 | 结构判断 |
| `verify-doc-refs.ts` | ts | 45 | 校验文档里引用的符号/配置项真实存在。调用点：`verify-doc-refs`。 | 结构判断 |
| `verify-doc-site-fragments.ts` | ts | 181 | 校验文档站构建后每个片段可被正确挂载（无孤立片段、无断链）。调用点：`verify-doc-site-fragments`，`docs:build` 末尾执行。 | 结构判断 |
| `verify-md-links.ts` | ts | 256 | 全仓 Markdown 链接可达性校验（相对路径 + 锚点）。调用点：`verify-md-links`。 | 结构判断 |
| `verify-md-wrap.ts` | ts | 87 | 校验 Markdown 行宽与折行规范，避免长行破坏 diff 可读性。调用点：`verify-md-wrap`。 | 结构判断 |
| `verify-mermaid.ts` | ts | 106 | 校验文档内 Mermaid 语法可解析，防止图在站点上渲染失败。调用点：`verify-mermaid`。 | 结构判断 |
| `verify-concrete-terms.ts` | ts | 105 | 禁止文档使用「若干」「相关」等模糊措辞，强制写具体名词。调用点：`verify-concrete-terms`。 | 结构判断 |
| `verify-public-repository-links.ts` | ts | 99 | 校验公开仓库链接指向的路径真实存在且不泄露内部地址。调用点：`verify-public-repository-links`。 | 结构判断 |
| `verify-repository-references.ts` | ts | 157 | 校验文档与配置中的仓库引用（owner/repo、分支名）与当前仓库一致。调用点：`verify-repository-references`。 | 结构判断 |
| `verify-subsystem-pages.ts` | ts | 137 | 校验每个子系统都有对应文档页，且页面挂进了导航。调用点：`verify-subsystem-pages`。 | 结构判断 |
| `verify-upgrade-guides.ts` | ts | 143 | 校验破坏性变更都有升级指南段落。调用点：`verify-upgrade-guides`。 | 结构判断 |
| `verify-translation-pairing.ts` | ts | 368 | 翻译配对门禁：每个 `README.md` 必须有 `README.zh.md` 与 `README.i18n.yaml`，且摘要一致。调用点：`verify-translation-pairing`。 | 结构判断 |
| `verify-translation-prompt.ts` | ts | 98 | 校验翻译提示词模板的结构稳定（占位符不缺失），防止生成任务错位。调用点：`verify-translation-prompt`。 | 结构判断 |

#### 20.7.4 仓库卫生、类型与专项

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `verify-no-unknown-casts.ts` | ts | 186 | 对照 `no-unknown-casts.baseline.json` 校验 `as unknown as` 只减不增。调用点：`verify-no-unknown-casts`。 | 结构判断 |
| `verify-type-equiv.ts` | ts | 396 | 校验跨包重复声明的类型结构一致（对照 `type-equiv.manifest.json`）。调用点：`verify-type-equiv`。 | 结构判断 |
| `verify-cordis-config.ts` | ts | 586 | 校验 Cordis 配置文件的 schema、引用与加载顺序合法。调用点：`verify-cordis-config`。 | 结构判断 |
| `verify-v3-event-vocabulary.ts` | ts | 105 | 校验 v3 事件词表：事件名与载荷字段不得在格式升级中悄悄增删。调用点：`verify-v3-event-vocabulary`。 | 结构判断 |
| `verify-ssh-helper-artifact.ts` | ts | 167 | 校验 SSH helper 产物完整性（可执行位、sidecar、签名元数据）。调用点：`verify-ssh-helper-artifact` 相关构建校验。 | 结构判断 |
| `verify-ssh-helper-ssh.ts` | ts | 108 | 用真实 ssh 连接验证 helper 的协议行为。调用点：无直接 npm 入口，由构建/发布流程调用，**待确认**具体 gate。 | 待确认 |
| `verify-agent-note-classification.ts` | ts | 27 | 校验 agent note 的分类标签取值合法。调用点：`verify-agent-note-classification`。 | 结构判断 |
| `verify-agent-note-format.ts` | ts | 94 | 校验 agent note 文件格式（标题层级、必备字段）。调用点：`verify-agent-note-format`。 | 结构判断 |
| `verify-archived-agent-notes.ts` | ts | 115 | 校验归档 note 的索引与实际文件一致。调用点：`verify-archived-agent-notes`。 | 结构判断 |

### 20.8 Cordis 专项工具

Cordis 是内置的插件运行时，这组脚本负责读它的配置、走它的加载树、生成它的目录。与 `packages/` 侧的区别是：这里只读不写运行时，产出的是分析结果与目录文件。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `cordis-config-files.ts` | ts | 18 | 列出仓库中所有 Cordis 配置文件的路径，供其余脚本遍历。调用点：被 import。 | 结构判断 |
| `cordis-core-api.ts` | ts | 433 | 从 Cordis 核心包提取公开 API 面（服务、事件、上下文方法），供目录生成与 API 校验使用。调用点：被 `gen-cordis-catalog.ts` 等 import。 | 结构判断 |
| `cordis-walk.ts` | ts | 102 | 遍历 Cordis 插件树（含 `include` 展开与条件加载），产出扁平的插件清单。调用点：被 import。 | 结构判断 |
| `cordis-yaml.ts` | ts | 78 | Cordis 配置的 YAML 解析与规范化，处理注释保留与键序。调用点：被 import。 | 结构判断 |

### 20.9 持久化、会话与迁移

持久化是格式演进最频繁的区域，这组文件把「格式定义、变更记录、迁移、快照」拆开。字段级说明在 `modules/` 的持久化章节，这里只登记每个文件的职责与入口。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `persistence-schema.ts` | ts | 512 | 持久化 schema 的运行时模型与校验器，是整组的地基。调用点：被 `render-persistence-schema.ts` 等 import。 | 结构判断 |
| `persistence-schema-model.ts` | ts | 378 | schema 的中间表示：字段、版本、默认值与迁移钩子的数据结构。调用点：被 import。 | 结构判断 |
| `render-persistence-schema.ts` | ts | 319 | 把 schema 渲染成文档（字段表 + 版本矩阵）。调用点：无直接 npm 入口，由文档生成链调用，**待确认**具体 gate。 | 待确认 |
| `persistence-changes.ts` | ts | 935 | 生成持久化变更记录：按版本列出字段增删与兼容性结论，是发布说明的原料。结构：前段读 schema 差异，中段按版本归档，后段渲染 Markdown 并做 `--check` 比对。调用点：`persistence-changes`、`verify-persistence-changes`。 | 结构判断 |
| `persistence-review.ts` | ts | 230 | 面向评审者的摘要：把本次变更折算成「需要谁看、看什么」。调用点：`pnpm persistence-review`。 | 结构判断 |
| `persistence-formats.ts` | ts | 230 | 各持久化格式（会话、索引、投影）的版本声明与兼容矩阵。调用点：`verify-persistence-formats`。 | 结构判断 |
| `persistence-format-facts.ts` | ts | 78 | 格式事实的采集：从源码注释与常量里抽出实际版本号，供上面的矩阵校验。调用点：被 import。 | 结构判断 |
| `persistence-releases.ts` | ts | 257 | 发布维度的持久化视图：哪个版本引入了哪个格式。调用点：`verify-persistence-releases`。 | 结构判断 |
| `persistence-release-facts.ts` | ts | 95 | 发布事实采集（tag 与版本对应），供上一文件使用。调用点：被 import。 | 结构判断 |
| `persistence-artifacts.ts` | ts | 55 | 声明持久化产物的落盘位置与命名规则。调用点：被 import。 | 结构判断 |
| `persistence-finalization.ts` | ts | 168 | 写入的收尾流程：临时文件、fsync、原子 rename，防止半写文件。调用点：被运行时与迁移脚本共用。 | 结构判断 |
| `persistence-catalog-source.ts` | ts | 311 | 为 `gen-persistence-catalog.ts` 收集源码侧事实（类型、字段、默认值）。调用点：被生成器 import。 | 结构判断 |
| `persistence-catalog-text.ts` | ts | 63 | 持久化目录的文案模板与排版。调用点：被生成器 import。 | 结构判断 |
| `persistence-source-annotations.ts` | ts | 81 | 解析源码里的持久化注解标记，供上面两个文件消费。调用点：被 import。 | 结构判断 |
| `persistence-source-metadata.ts` | ts | 18 | 持久化元数据的常量表（文件名、版本前缀）。调用点：被 import。 | 结构判断 |
| `persistence-source-policy.ts` | ts | 69 | 持久化源码的书写政策：哪些字段必须带版本注解、哪些禁止裸 JSON。调用点：被 import。 | 结构判断 |
| `historical-schema-region.ts` | ts | 17 | 标记「历史 schema 区段」的边界，供迁移工具跳过，避免误改老版本定义。调用点：被 import。 | 结构判断 |
| `migrate-sessions-to-v4.ts` | ts | 303 | 把 v2/v3 会话文件迁移到 v4，逐条重写事件并保留原文件备份。调用点：`migrate:sessions-to-v4`。 | 结构判断 |
| `migrate-packed-session-fixtures.ts` | ts | 21 | 批量迁移打包进测试的会话夹具，保证夹具与新格式同步。调用点：`migrate:packed-session-fixtures`。 | 结构判断 |
| `migration-failure-summary.ts` | ts | 43 | 迁移失败时的归类摘要（哪类文件、哪种错误），避免逐条刷屏。调用点：被迁移脚本 import。 | 结构判断 |
| `session-fixture-layout.ts` | ts | 294 | 会话夹具的目录布局约定：哪个目录放哪个版本的样例。调用点：被快照与迁移脚本 import。 | 结构判断 |
| `session-snapshot-corpus.corpus.ts` | ts | 216 | 会话快照语料库的定义：跨格式、跨场景的样例清单。调用点：被 `vitest.snapshot.config.ts` 与会话格式测试 import。 | 结构判断 |
| `session-snapshot-corpus-policy.ts` | ts | 114 | 语料库的准入政策：新增样例必须覆盖哪些字段与终态。调用点：被语料测试 import。 | 结构判断 |
| `snapshot-shell-path.ts` | ts | 30 | 快照用例的 shell 路径归一（Windows/POSIX 差异）。调用点：被快照测试 import。 | 结构判断 |
| `snapshot-spill-locators.ts` | ts | 66 | 定位快照「溢出文件」（大字段被拆到旁路文件）的位置。调用点：被快照测试 import。 | 结构判断 |
| `snapshot-workspace-parent.ts` | ts | 46 | 为快照用例准备父级工作区目录，处理路径深度限制。调用点：被快照测试 import。 | 结构判断 |

### 20.10 翻译与文档工具链

文档站与双语文档的生产线：Markdown 解析 → 翻译配对 → 提示词生成 → 站点构建 → 链接校验。校验侧的 `verify-md-*` 见 20.7.3，这里只放生成与解析侧。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `markdown.ts` | ts | 277 | 仓库内 Markdown 的公共解析与遍历工具（标题树、代码块、链接提取）。调用点：被多处 import。 | 结构判断 |
| `jsdoc.ts` | ts | 201 | 从 TS 源码抽出 JSDoc 结构，供 `verify-export-jsdoc.ts` 与目录生成共用。调用点：被 import。 | 结构判断 |
| `paired-markdown-derivatives.ts` | ts | 63 | 管理「同源多语言文件」的派生关系（如 `README.md` 与其 `.zh.md`）。调用点：被翻译门禁 import。 | 结构判断 |
| `translation-pairing.ts` | ts | 421 | 翻译配对的核心算法：按段落指纹把原文与译文对齐，找出缺失/错位段落。调用点：被 `verify-translation-pairing.ts` import。 | 结构判断 |
| `translation-pairing-record.ts` | ts | 299 | 配对结果的持久化记录，支持增量校验。调用点：被 `translation-pairing.ts` import。 | 结构判断 |
| `translation-pairing-git.ts` | ts | 60 | 用 git 历史判断配对文件的新旧，决定哪些需要重验。调用点：被 `translation-pairing.ts` import。 | 结构判断 |
| `translation-prompt.ts` | ts | 259 | 翻译提示词的组装：术语表、上下文、格式约束。调用点：被 `gen-translation-brief.ts` 与 `verify-translation-prompt.ts` 共用。 | 结构判断 |
| `translation-brief.ts` | ts | 512 | 翻译简报的渲染：把待译段落与上下文排成可直接投喂的文本。调用点：被 `gen-translation-brief.ts` import。 | 结构判断 |
| `translation-links.ts` | ts | 384 | 处理翻译文档内的链接改写（`xxx.zh.md` 与 `xxx.md` 的互相指向）。调用点：被翻译门禁 import。 | 结构判断 |
| `shipped-locales.ts` | ts | 23 | 随包分发的语言清单，是客户端与文档站共用的单一事实源。调用点：被 import。 | 结构判断 |
| `doc-typecheck.ts` | ts | 255 | 对文档里的代码片段做类型检查，防止示例代码失效。调用点：`doc-typecheck:contracts-ready`。 | 结构判断 |
| `doc-typecheck-paths.ts` | ts | 37 | 挑选纳入文档类型检查的路径集合。调用点：被 `doc-typecheck.ts` import。 | 结构判断 |
| `project-doc-site.ts` | ts | 577 | 文档站的页面模型：导航、分组、页面元数据与重定向。调用点：被 `website/build.ts` 与 `docs:check` 使用。 | 结构判断 |
| `stage-dsh-docs.ts` | ts | 185 | 把仓库文档按站点结构拷进 staging 目录，供 VitePress 构建。调用点：被 `website/build.ts` 调用。 | 结构判断 |

### 20.11 测试环境与共享辅助

被 `vitest.config.ts` 的 `setupFiles`/`include` 直接点名，或作为夹具池被多个 spec 引用。它们不进产物的运行时。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `test-dom-environment.ts` | ts | 41 | jsdom 环境的全局装配（补齐 `matchMedia`、`ResizeObserver` 等缺口）。调用点：被 `vitest.config.ts` 的 setup 引用。 | 结构判断 |
| `test-proxy-environment.ts` | ts | 63 | 测试期的代理环境处理：清除继承的 `HTTP(S)_PROXY`，避免请求被劫持。调用点：被 `vitest.config.ts` 的 `testIncludes` 之外的环境段引用。 | 结构判断 |
| `test-official-listing-guard.ts` | ts | 22 | 防止测试误触官方清单（如真实插件市场的网络调用）。调用点：被 `vitest.config.ts` 环境段引用。 | 结构判断 |
| `test-non-loopback-address.ts` | ts | 70 | 断言测试只绑定 loopback 地址，防止 CI 端口被外部占用或探测。调用点：被测试 import。 | 结构判断 |
| `test-fixture-cleanup.ts` | ts | 49 | 统一清理临时夹具目录，注册进程退出钩子。调用点：被测试 import。 | 结构判断 |

### 20.12 agent note 工具链

`docs/agent-notes/` 是一套给 AI 协作者的决策记录，格式与归档由脚本强制。三个 verify 见 20.7.4，这里放生成侧。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `agent-note-tree.ts` | ts | 83 | 扫描 `docs/agent-notes/` 并建树（主题 → 笔记），供索引生成与归档校验使用。调用点：被 import。 | 结构判断 |
| `archived-agent-notes.ts` | ts | 204 | 归档逻辑：把过期笔记移入归档目录并维护索引，保留原始路径映射。调用点：无直接 npm 入口（手动维护），**待确认**是否有 CI 调用。 | 待确认 |

### 20.13 开发者工具、基准与演示

本地开发体验与性能观测相关的一次性工具。这些脚本的共性是「不在 CI 关键路径上」，但断了会直接降低日常效率。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `dev-web.ts` | ts | 440 | 本地起 web 形态的开发服务：监听源码变更并触发增量构建。调用点：`dev:web`。 | 结构判断 |
| `dev-bundle-registry.ts` | ts | 173 | 开发态 bundle 注册表：把本地构建产物注册进运行时，避免每次全量打包。调用点：`dev:bundle-registry`。 | 结构判断 |
| `local-bundle-registry.ts` | ts | 929 | 本地 bundle 注册表的持久化与解析实现，支持多份构建并存。调用点：被 `dev-bundle-registry.ts` import。 | 结构判断 |
| `install-lefthook.mjs` | mjs | 769 | `postinstall` 钩子：检测并安装 git hooks（lefthook），缺失时给出可操作的提示而不是静默跳过。调用点：`postinstall`。 | 结构判断 |
| `run-oxlint.ts` | ts | 112 | 统一 oxlint 调用：按契约配置过滤规则、聚合输出并给出可读的规则指纹。调用点：`lint:contracts-ready`、`lint:fix:contracts-ready`。 | 结构判断 |
| `benchmark-npm-resolution.ts` | ts | 553 | 基准：测量 pnpm 解析一组依赖的耗时与内存，用于评估解析策略改动。调用点：`benchmark:npm-resolution`。 | 结构判断 |
| `benchmark-next-package-dependency.ts` | ts | 271 | 基准：对比「下一版依赖布局」与当前布局的安装成本。调用点：`benchmark:npm-resolution:next`。 | 结构判断 |
| `run-bench-suite.ts` | ts | 70 | 基准套件的运行器，按 `build:bench` 产物执行并汇总。调用点：`test:bench:built`。 | 结构判断 |
| `run-memory-pressure-bench.ts` | ts | 147 | 内存压力基准：在受限堆下跑关键路径，观测峰值与回收行为。调用点：`test:bench:memory`。 | 结构判断 |
| `run-web-snapshots.ts` | ts | 46 | 在 CI 中跑 web 快照用例，处理截图与基线比对。调用点：`test:web:ci`。 | 结构判断 |
| `demo-ptc.mjs` | mjs | 19 | PTC（程序化工具调用）的最小演示脚本。调用点：`demo:ptc`。 | 结构判断 |

### 20.14 根目录测试文件（160 个）

`scripts/` 根目录的 363 个文件里有 160 个是 `*.spec.ts`。它们不需要在 `package.json` 里单独挂一条 script：`vitest.config.ts` 的 `testIncludes` 含 `scripts/**/*.spec.ts`，常规 `pnpm test` 会全部跑到，因此**不属于**第二十一节要讨论的「疑似失效」。命名上与同目录同名脚本一一对应（`X.spec.ts` 测 `X.ts`）；有三类例外需要单独记住：`generate-typert.spec.ts` 对应 `generate-typert.ts` 而非 `gen-typert.ts`；`*-workflow.spec.ts` 测的是 `.github/workflows/*.yml` 的静态结构而非某个 ts 脚本；`.compat.spec.ts` 测的是下游消费者视角的兼容契约。

下表按被测对象归组，`职责` 列写「测什么 + 主要断言方向」，行数为该 spec 自身的行数。

**20.14.1 门禁校验 `verify-*`（33 个）**

这 33 个用例是 20.7 节各 `verify-*` 脚本的「元测试」：脚本本身做仓库扫描，spec 用临时仓库或内联夹具验证「合法输入通过、违规输入必须报错」，防止门禁退化成永远为真的空壳。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `verify-package-dependencies.spec.ts` | ts | 1284 | 测 `verify-package-dependencies.ts`：依赖声明与 import 的双向一致性，覆盖漏声明、多声明、dev→prod 越界与可选依赖豁免 | 结构判断 |
| `verify-package-meta.spec.ts` | ts | 685 | 测 `verify-package-meta.ts`：包名、导出、files 字段与发布清单的元数据完整性 | 结构判断 |
| `verify-client-packages.spec.ts` | ts | 527 | 测 `verify-client-packages.ts`：客户端包的分层、命名与依赖方向约束 | 结构判断 |
| `verify-default-product-isolation.spec.ts` | ts | 493 | 测 `verify-default-product-isolation.ts`：默认产品面上不得泄漏实验性包与内部入口 | 结构判断 |
| `verify-plugin-entry-exports.spec.ts` | ts | 346 | 测 `verify-plugin-entry-exports.ts`：插件入口只能导出白名单内的符号 | 结构判断 |
| `verify-plugin-record-callers.spec.ts` | ts | 328 | 测 `verify-plugin-record-callers.ts`：插件记录目录中的每个条目都必须有真实调用方 | 结构判断 |
| `verify-product-use.spec.ts` | ts | 301 | 测 `verify-product-use.ts`：产品代码只能使用允许的产品面接口 | 结构判断 |
| `verify-repository-references.spec.ts` | ts | 287 | 测 `verify-repository-references.ts`：文档与配置中的仓库引用（URL、分支、路径）不得指向已失效目标 | 结构判断 |
| `verify-no-unknown-casts.spec.ts` | ts | 263 | 测 `verify-no-unknown-casts.ts`：禁止 `as unknown as` 逃逸，按基线比对新增项 | 结构判断 |
| `verify-upgrade-guides.spec.ts` | ts | 228 | 测 `verify-upgrade-guides.ts`：升级指南必须覆盖所有破坏性变更条目 | 结构判断 |
| `verify-no-top-level-await.spec.ts` | ts | 220 | 测 `verify-no-top-level-await.ts`：除白名单外禁止顶层 await，保证加载期确定性 | 结构判断 |
| `verify-client-route-resolution.spec.ts` | ts | 199 | 测 `verify-client-route-resolution.ts`：客户端路由声明与页面文件必须一一对应 | 结构判断 |
| `verify-runtime-closure.spec.ts` | ts | 183 | 测 `verify-runtime-closure.ts`：运行时依赖闭包完整，无悬空 import | 结构判断 |
| `verify-concrete-terms.spec.ts` | ts | 179 | 测 `verify-concrete-terms.ts`：文档禁用模糊措辞，必须落到具体术语 | 结构判断 |
| `verify-cordis-config.spec.ts` | ts | 170 | 测 `verify-cordis-config.ts`：Cordis 配置文件的 schema 与引用有效 | 结构判断 |
| `verify-locale-metadata.spec.ts` | ts | 155 | 测 `verify-locale-metadata.ts`：语言包元数据（名称、方向、回退链）齐全 | 结构判断 |
| `verify-npm-install-layout.spec.ts` | ts | 150 | 测 `verify-npm-install-layout.ts`：npm 安装后的目录布局符合预期 | 结构判断 |
| `verify-v3-event-vocabulary.spec.ts` | ts | 146 | 测 `verify-v3-event-vocabulary.ts`：v3 事件名不得出现在 v4 代码与文档中 | 结构判断 |
| `verify-no-bare-dispatcher.spec.ts` | ts | 143 | 测 `verify-no-bare-dispatcher.ts`：禁止绕过封装直接使用底层 dispatcher | 结构判断 |
| `verify-md-links.spec.ts` | ts | 142 | 测 `verify-md-links.ts`：Markdown 链接与锚点可达 | 结构判断 |
| `verify-application-entrypoints.spec.ts` | ts | 135 | 测 `verify-application-entrypoints.ts`：应用入口文件与注册表一致 | 结构判断 |
| `verify-version-sync.spec.ts` | ts | 133 | 测 `verify-version-sync.ts`：各包版本与根版本、锁文件保持同步 | 结构判断 |
| `verify-optional-dependency-imports.spec.ts` | ts | 130 | 测 `verify-optional-dependency-imports.ts`：可选依赖的 import 必须包在守卫里 | 结构判断 |
| `verify-subsystem-pages.spec.ts` | ts | 123 | 测 `verify-subsystem-pages.ts`：每个子系统都必须有对应文档页 | 结构判断 |
| `verify-doc-site-fragments.spec.ts` | ts | 97 | 测 `verify-doc-site-fragments.ts`：文档站点片段拼装无缺块、无重复 | 结构判断 |
| `verify-client-ui-i18n.spec.ts` | ts | 81 | 测 `verify-client-ui-i18n.ts`：客户端硬编码文案不得绕过 i18n | 结构判断 |
| `verify-package-paths.spec.ts` | ts | 73 | 测 `verify-package-paths.ts`：包内相对路径引用不得越出包根 | 结构判断 |
| `verify-dsh-package-licenses.spec.ts` | ts | 59 | 测 `verify-dsh-package-licenses.ts`：各包 license 字段与许可证文件一致 | 结构判断 |
| `verify-skill-invocation-metadata.spec.ts` | ts | 53 | 测 `verify-skill-invocation-metadata.ts`：Skill 调用元数据的必填字段完整 | 结构判断 |
| `verify-package-readme-summaries.spec.ts` | ts | 46 | 测 `verify-package-readme-summaries.ts`：包 README 摘要长度与格式在预算内 | 结构判断 |
| `verify-public-repository-links.spec.ts` | ts | 45 | 测 `verify-public-repository-links.ts`：公开仓库链接不得指向内部地址 | 结构判断 |
| `verify-config-source-ownership.spec.ts` | ts | 30 | 测 `verify-config-source-ownership.ts`：每个配置项必须有唯一归属方 | 结构判断 |
| `verify-client-domain-graph.spec.ts` | ts | 14 | 测 `verify-client-domain-graph.ts`：客户端领域图无环的最小断言 | 结构判断 |

**20.14.2 生成器 `gen-*`（12 个）**

每条 spec 的核心断言是「生成结果稳定」：同一输入两次生成必须逐字节一致，且 `--check` 模式下仓库现状与重新生成的内容相同。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `gen-cli-help.spec.ts` | ts | 155 | 测 `gen-cli-help.ts`：命令行帮助文本与命令定义同步，参数改动必须反映到帮助里 | 结构判断 |
| `gen-client-catalog.spec.ts` | ts | 268 | 测 `gen-client-catalog.ts`：客户端目录清单生成，覆盖新增/删除模块后的重算 | 结构判断 |
| `gen-config-catalog.spec.ts` | ts | 303 | 测 `gen-config-catalog.ts`：配置项目录与 schema 的一致性 | 结构判断 |
| `gen-cordis-catalog-partition.spec.ts` | ts | 211 | 测 `gen-cordis-catalog.ts` 的分区逻辑：清单按包分片且各片边界稳定 | 结构判断 |
| `gen-dependency-catalog.spec.ts` | ts | 188 | 测 `gen-dependency-catalog.ts`：依赖目录与锁文件解析结果一致 | 结构判断 |
| `gen-doc-graphs.spec.ts` | ts | 165 | 测 `gen-doc-graphs.ts`：文档关系图生成，覆盖孤立节点与环检测 | 结构判断 |
| `generate-typert.spec.ts` | ts | 195 | 测 `generate-typert.ts`：类型擦除产物与源类型声明等价 | 结构判断 |
| `gen-official-bundle-catalog.spec.ts` | ts | 148 | 测 `gen-official-bundle-catalog.ts`：官方 bundle 目录与插件包清单一致 | 结构判断 |
| `gen-session-format-catalog.spec.ts` | ts | 167 | 测 `gen-session-format-catalog.ts`：会话格式目录随 schema 升级刷新 | 结构判断 |
| `gen-third-party-notices.spec.ts` | ts | 511 | 测 `gen-third-party-notices.ts`：第三方许可清单完整、去重且排序稳定 | 结构判断 |
| `gen-tsconfig-paths.spec.ts` | ts | 96 | 测 `gen-tsconfig-paths.ts`：路径别名只覆盖真实存在的包 | 结构判断 |
| `gen-workflow-guest.spec.ts` | ts | 43 | 测 `gen-workflow-guest.ts`：工作流 guest 代码生成的最小用例 | 结构判断 |

**20.14.3 持久化、会话与迁移（13 个）**

对应 20.9 节。共同点是「格式一旦写错就会毁掉用户历史会话」，因此每条用例都包含旧格式输入与升级后读回的往返断言。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `persistence-changes.spec.ts` | ts | 1133 | 测 `persistence-changes.ts`：变更集的合并、冲突检测与幂等重放 | 结构判断 |
| `persistence-schema.spec.ts` | ts | 549 | 测 `persistence-schema.ts`：schema 定义与运行时校验一致，非法输入被拒 | 结构判断 |
| `persistence-formats.spec.ts` | ts | 484 | 测 `persistence-formats.ts`：各版本格式的识别、转换与回退 | 结构判断 |
| `migrate-sessions-to-v4.spec.ts` | ts | 450 | 测 `migrate-sessions-to-v4.ts`：v2/v3 会话迁移到 v4 的完整链路与失败回滚 | 结构判断 |
| `persistence-releases.spec.ts` | ts | 400 | 测 `persistence-releases.ts`：版本发布记录与产物校验 | 结构判断 |
| `render-persistence-schema.spec.ts` | ts | 349 | 测 `render-persistence-schema.ts`：schema 渲染文本与源定义同步 | 结构判断 |
| `session-fixture-layout.spec.ts` | ts | 236 | 测 `session-fixture-layout.ts`：会话夹具目录布局计算，覆盖跨平台路径差异 | 结构判断 |
| `persistence-review.spec.ts` | ts | 136 | 测 `persistence-review.ts`：变更评审输出的分类与摘要 | 结构判断 |
| `persistence-schema-snapshot.spec.ts` | ts | 133 | 测 schema 快照：schema 变更必须同步刷新快照，防止静默破坏兼容 | 结构判断 |
| `persistence-schema-model.spec.ts` | ts | 109 | 测 `persistence-schema-model.ts`：模型层到 schema 的映射 | 结构判断 |
| `persistence-developer.spec.ts` | ts | 68 | 测 `persistence-developer.ts`：开发者模式下的调试入口 | 结构判断 |
| `persistence-epoch-header.spec.ts` | ts | 49 | 测 `persistence-epoch-header.ts`：epoch 头的读写与版本不匹配拒绝 | 结构判断 |
| `migration-failure-summary.spec.ts` | ts | 45 | 测 `migration-failure-summary.ts`：迁移失败时汇总的条目数与可读性 | 结构判断 |

**20.14.4 翻译与文档工具链（13 个）**

对应 20.10 节。这批用例的判定标准多为「文案与结构」，因此断言对象是字符串与文件配对，不涉及运行时时序。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `project-doc-site.spec.ts` | ts | 855 | 测 `project-doc-site.ts`：文档站点导航、侧栏与页面登记的完整性 | 结构判断 |
| `translation-pairing.spec.ts` | ts | 621 | 测 `translation-pairing.ts`：中英文配对缺失、过期与内容漂移的判定 | 结构判断 |
| `doc-standard.spec.ts` | ts | 463 | 测文档规范：标题层级、术语表引用与禁用句式 | 结构判断 |
| `locale-dictionary-parity.spec.ts` | ts | 407 | 测各语言字典键集合的一致性，防止漏译键悄悄回退到英文 | 结构判断 |
| `translation-brief.spec.ts` | ts | 287 | 测 `translation-brief.ts`：翻译简报的分节、术语与上下文摘录 | 结构判断 |
| `translation-links.spec.ts` | ts | 281 | 测 `translation-links.ts`：跨语言链接改写与锚点保留 | 结构判断 |
| `translation-prompt.spec.ts` | ts | 234 | 测 `translation-prompt.ts`：提示词拼装顺序与变量替换 | 结构判断 |
| `stage-dsh-docs.spec.ts` | ts | 137 | 测 `stage-dsh-docs.ts`：文档搬运到发布目录时的路径映射 | 结构判断 |
| `paired-markdown-derivatives.spec.ts` | ts | 66 | 测 `paired-markdown-derivatives.ts`：由主文档派生的摘要/索引同步更新 | 结构判断 |
| `shipped-locales.spec.ts` | ts | 44 | 测 `shipped-locales.ts`：随包发行的语言清单与构建产物一致 | 结构判断 |
| `markdown.spec.ts` | ts | 38 | 测 `markdown.ts`：标题提取、代码块围栏与链接解析等基础解析 | 结构判断 |
| `doc-typecheck-paths.spec.ts` | ts | 35 | 测 `doc-typecheck-paths.ts`：待类型检查的文档路径集合 | 结构判断 |
| `translation-prompt.expected.spec.ts` | ts | 32 | 把 `snapshots/translation-prompt-v4/request-response.expected.json` 与当前提示词产物比对，锁定格式版本 | 结构判断 |

**20.14.5 Cordis、loader 与 vendor（12 个）**

对应 20.8 节与 22 节。Cordis 是内置的插件内核，这些用例覆盖配置解析、生命周期与热更三条主线。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `loader-volatile-update.spec.ts` | ts | 636 | 测 loader 的易变配置更新：热更时哪些字段可改、哪些必须重启 | 结构判断 |
| `rescope-vendor.spec.ts` | ts | 228 | 测 `rescope-vendor.ts`：`@deepseek-ai` 作用域重写的覆盖面与幂等性 | 结构判断 |
| `cordis-include-journal.spec.ts` | ts | 204 | 测 include 插件的变更日志：并入/移除顺序与去重 | 结构判断 |
| `cordis-core-lifecycle.spec.ts` | ts | 188 | 测 Cordis 核心生命周期：加载、就绪、销毁的时序与异常路径 | 结构判断 |
| `cordis-entry-commit.spec.ts` | ts | 119 | 测入口提交逻辑：配置变更何时真正生效 | 结构判断 |
| `loader-config-diff.spec.ts` | ts | 109 | 测 loader 配置差分：变更集的最小化与冲突提示 | 结构判断 |
| `cordis-loader-resolve.spec.ts` | ts | 104 | 测 loader 的模块解析：别名、缺失包与循环依赖 | 结构判断 |
| `cordis-timer.spec.ts` | ts | 101 | 测 timer 插件的调度精度与销毁清理 | 结构判断 |
| `cordis-config-access.spec.ts` | ts | 92 | 测配置访问器的默认值、继承与越权读写 | 结构判断 |
| `cordis-core-api.spec.ts` | ts | 49 | 测 Cordis 对外 API 的签名稳定性 | 结构判断 |
| `cordis-config-files.spec.ts` | ts | 36 | 测配置文件发现顺序与优先级 | 结构判断 |
| `cordis-vendor-hmr-include.spec.ts` | ts | 44 | 测 hmr 与 include 在 vendor 内的协同：热更后 include 关系不丢 | 结构判断 |

**20.14.6 构建、打包与产物（18 个）**

对应 20.3 节。判定标准是「产物字节与结构」，常见断言是「同一输入两次构建结果一致」与「产物内不得出现某类符号」。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `client-bundle-purity.spec.ts` | ts | 654 | 测客户端 bundle 纯净性：不得打入 Node 内置模块与服务端专用依赖 | 结构判断 |
| `client-bundle-css.spec.ts` | ts | 547 | 测客户端 CSS 打包：样式归属、去重与顺序稳定 | 结构判断 |
| `compile-referenced-projects.spec.ts` | ts | 419 | 测 `compile-referenced-projects.ts`：项目引用图展开与增量编译范围 | 结构判断 |
| `client-build-environment.client.spec.ts` | ts | 343 | 测 `client-build-environment.ts`：构建面（浏览器/Node）切换时的环境常量 | 结构判断 |
| `optional-bundles.spec.ts` | ts | 286 | 测可选 bundle 的裁剪：未启用的 bundle 不得出现在产物里 | 结构判断 |
| `web-product-bundle-isolation.spec.ts` | ts | 271 | 测 `web-product-bundle-isolation.ts`：web 产品面与桌面面的模块隔离 | 结构判断 |
| `browser-bundled-externals.spec.ts` | ts | 174 | 测 `browser-bundled-externals.ts`：外部依赖的白名单与实际 external 声明一致 | 结构判断 |
| `build.spec.ts` | ts | 129 | 测 `build.ts`：主构建编排的阶段顺序与失败短路 | 结构判断 |
| `clean.spec.ts` | ts | 139 | 测 `clean.ts`：清理范围精确，不误删源码与缓存 | 结构判断 |
| `request-input-types.spec.ts` | ts | 112 | 测请求输入类型生成：类型声明与运行时校验同源 | 结构判断 |
| `project-reference-faces.spec.ts` | ts | 100 | 测 `project-reference-faces.ts`：编译面划分与引用方向 | 结构判断 |
| `pkg-sea-compression.spec.ts` | ts | 94 | 测 SEA 单文件可执行的压缩参数与可启动性 | 结构判断 |
| `executable-packaging.spec.ts` | ts | 64 | 测 `executable-packaging.ts`：可执行产物的命名、权限与随附文件 | 结构判断 |
| `client-tsconfig.spec.ts` | ts | 38 | 测客户端 tsconfig 的键值与分层继承 | 结构判断 |
| `client-asset-types.spec.ts` | ts | 32 | 测客户端资源类型声明（图片、字体等模块 shim） | 结构判断 |
| `python-runtime-deploy.spec.ts` | ts | 35 | 测 `python-runtime-deploy.pnpmfile.mjs`：部署闭包的依赖裁剪规则 | 结构判断 |
| `python-runtime-download.spec.ts` | ts | 198 | 测 Python 运行时资源下载：校验和、断点与失败清理 | 结构判断 |
| `cua-macos-signing.spec.ts` | ts | 11 | 测 macOS CUA 助手产物的签名参数拼装 | 结构判断 |

**20.14.7 Python 单文件可执行构建（6 个）**

对应 20.4 节的 `build-exe-for-python-sdk*.ts`。六个 spec 与六个实现文件一一对应，最小的 `-assets` 只有 32 行。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `build-exe-for-python-sdk.spec.ts` | ts | 206 | 测主编排：产物命名、平台矩阵与产物落位 | 结构判断 |
| `build-exe-for-python-sdk-office.spec.ts` | ts | 148 | 测 `-office.ts`：Office sidecar 的收集与去重 | 结构判断 |
| `build-exe-for-python-sdk-staging.spec.ts` | ts | 122 | 测 `-staging.ts`：暂存目录的构造与清理 | 结构判断 |
| `build-exe-for-python-sdk-native-pty.spec.ts` | ts | 67 | 测 `-native-pty.ts`：spawn-helper 与原生模块的随附规则 | 结构判断 |
| `build-exe-for-python-sdk-resources.spec.ts` | ts | 47 | 测 `-resources.ts`：资源清单与校验和文件生成 | 结构判断 |
| `build-exe-for-python-sdk-assets.spec.ts` | ts | 32 | 测前端静态资源复制：只复制产物目录内的白名单 | 结构判断 |

**20.14.8 覆盖率与测试预算（5 个）**

对应 20.2 节。这批用例决定「覆盖率门禁本身是否可信」，因此大量断言围绕分区边界与豁免名单。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `coverage-partitions.spec.ts` | ts | 777 | 测 `coverage-partitions.ts`：分区划分、每分区文件归属唯一且总和覆盖全仓 | 结构判断 |
| `coverage-fork-diagnostics.spec.ts` | ts | 335 | 测 `coverage-fork-diagnostics.ts`：fork 进程异常退出的诊断信息与该归因的用例 | 结构判断 |
| `lane-test-budget.spec.ts` | ts | 122 | 测泳道测试时长预算：超预算时给出可定位的用例清单 | 结构判断 |
| `coverage-file-times.spec.ts` | ts | 70 | 测 `coverage-file-times.ts`：按文件统计耗时并生成排序结果 | 结构判断 |
| `coverage-exempt.spec.ts` | ts | 62 | 测 `coverage-exempt.ts`：豁免项必须写明理由，过期豁免被识别 | 结构判断 |

**20.14.9 CI 与发布工作流（11 个）**

`*-workflow.spec.ts` 直接解析 `.github/workflows/*.yml` 的 YAML 结构，断言触发条件、权限与关键步骤；`ci-workflow.spec.ts` 1,852 行是其中最大的一份，等于给整套 CI 加了结构测试。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `ci-workflow.spec.ts` | ts | 1852 | 测全部 CI 工作流：触发条件、job 依赖、权限与门禁命令的一致性 | 结构判断 |
| `windows-package-workflow.spec.ts` | ts | 223 | 测 Windows 打包工作流：签名步骤、产物上传与失败重试 | 结构判断 |
| `ci-compatible-selfhosted.spec.ts` | ts | 193 | 测自托管 runner 上的兼容工作流：标签、并发与缓存策略 | 结构判断 |
| `python-snapshot-workflow-order.spec.ts` | ts | 191 | 测 Python 快照工作流的步骤顺序：必须先构建运行时再跑快照 | 结构判断 |
| `macos-package-workflow.spec.ts` | ts | 114 | 测 macOS 打包工作流：公证、stapling 与产物命名 | 结构判断 |
| `desktop-publish-workflow.spec.ts` | ts | 103 | 测桌面端发布工作流：版本来源、渠道与回滚入口 | 结构判断 |
| `preview-workflow.spec.ts` | ts | 83 | 测预览发布工作流的触发与清理 | 结构判断 |
| `pre-merge-check.spec.ts` | ts | 72 | 测 `pre-merge-check.ts`：合并前必跑项与跳过条件 | 结构判断 |
| `desktop-package-source.spec.ts` | ts | 61 | 测桌面端打包输入的源码范围 | 结构判断 |
| `desktop-package-forms.spec.ts` | ts | 23 | 测桌面端产物形态（安装包/免安装包）的枚举与命名 | 结构判断 |
| `parallelism.spec.ts` | ts | 23 | 测 `parallelism.ts`：并发度计算在 CPU 与内存约束下的取值 | 结构判断 |

**20.14.10 包形态与发布策略（10 个）**

这一组守的是「对外承诺」：包图、版本基线、publint 规则与插件记录目录。改动一处包边界通常会同时打破这里的两三条断言。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `plugin-record-catalog.spec.ts` | ts | 230 | 测 `plugin-record-catalog.ts`：插件记录条目的必填字段与引用有效 | 结构判断 |
| `publint-all.spec.ts` | ts | 183 | 测 `publint-all.ts`：publint 报告的聚合与失败阈值 | 结构判断 |
| `npm-baseline-packages.spec.ts` | ts | 73 | 测 `npm-baseline-packages.ts`：基线包清单与发布包集合一致 | 结构判断 |
| `package-graph.spec.ts` | ts | 72 | 测 `package-graph.ts`：包依赖图无环、分层合法 | 结构判断 |
| `plugin-preview-assets.spec.ts` | ts | 67 | 测插件预览资源：清单存在且体积在预算内 | 结构判断 |
| `experimental-package-policy.spec.ts` | ts | 38 | 测 `experimental-package-policy.ts`：实验性包不得被稳定包依赖 | 结构判断 |
| `pnpm-invocation.spec.ts` | ts | 33 | 测 `pnpm-invocation.ts`：跨平台调用 pnpm 的参数拼装 | 结构判断 |
| `type-equiv-prefilter.spec.ts` | ts | 33 | 测 `type-equiv-prefilter.ts`：类型等价检查的预筛选，避免全量比对 | 结构判断 |
| `workspace-package-globs.spec.ts` | ts | 23 | 测 `workspace-package-globs.ts`：workspace glob 能命中全部包目录 | 结构判断 |
| `publication-payload.spec.ts` | ts | 18 | 测 `publication-payload.ts`：发布载荷字段完整 | 结构判断 |

**20.14.11 会话快照与溢出（6 个）**

快照基建的边界条件：路径在不同工作区深度下都要正确，溢出落盘的位置不能随 cwd 漂移。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `snapshot-http-fixtures.spec.ts` | ts | 203 | 测 HTTP 快照夹具：请求录制、响应裁剪与不稳定字段归一 | 结构判断 |
| `session-snapshot-corpus-policy.spec.ts` | ts | 146 | 测语料策略：哪些会话进入快照、哪些必须排除 | 结构判断 |
| `snapshot-workspace-parent.spec.ts` | ts | 78 | 测 `snapshot-workspace-parent.ts`：工作区父目录推导在深层路径下正确 | 结构判断 |
| `snapshot-spill-locators.spec.ts` | ts | 72 | 测 `snapshot-spill-locators.ts`：溢出文件定位与回收 | 结构判断 |
| `session-query-spill-command.spec.ts` | ts | 67 | 测会话查询溢出命令的参数与输出格式 | 结构判断 |
| `snapshot-shell-path.spec.ts` | ts | 42 | 测 `snapshot-shell-path.ts`：shell 路径归一化，屏蔽平台差异 | 结构判断 |

**20.14.12 其余工具与兼容契约（21 个）**

不成组的一次性工具用例。其中 `run-gates.spec.ts`（1,463 行）与 `install-lefthook.spec.ts`（882 行）体量最大，分别守门禁调度与 git hook 安装。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `run-gates.spec.ts` | ts | 1463 | 测 `run-gates.ts`：门禁名到步骤序列的映射、跳过条件与失败传播 | 结构判断 |
| `install-lefthook.spec.ts` | ts | 882 | 测 `install-lefthook.mjs`：hook 安装、已有 hook 冲突与降级提示 | 结构判断 |
| `check-workspace-constraints.spec.ts` | ts | 664 | 测 `check-workspace-constraints.ts`：约束表达式解析与违规定位 | 结构判断 |
| `local-bundle-registry.spec.ts` | ts | 559 | 测 `local-bundle-registry.ts`：多份构建并存时的选择与回退 | 结构判断 |
| `oxlint-contract.spec.ts` | ts | 503 | 测 oxlint 契约规则：禁用模式必须命中、允许模式必须放行 | 结构判断 |
| `repo-files.spec.ts` | ts | 265 | 测 `repo-files.ts`：仓库文件遍历的忽略规则与排序稳定性 | 结构判断 |
| `change-scope.spec.ts` | ts | 241 | 测 `change-scope.ts`：按改动路径推导受影响的门禁集合 | 结构判断 |
| `dev-web.spec.ts` | ts | 220 | 测 `dev-web.ts`：开发服务的路由与增量构建触发 | 结构判断 |
| `archived-agent-notes.spec.ts` | ts | 153 | 测 `archived-agent-notes.ts`：归档笔记的索引与链接有效 | 结构判断 |
| `volatile-config.spec.ts` | ts | 151 | 测 `volatile-config.ts`：易变配置项的标记与比较（忽略字段） | 结构判断 |
| `benchmark-npm-resolution.spec.ts` | ts | 200 | 测基准脚本自身的取样与汇总逻辑，避免测出假数字 | 结构判断 |
| `benchmark-next-package-dependency.spec.ts` | ts | 125 | 同上，针对「下一版依赖布局」对比 | 结构判断 |
| `lint-rule-fingerprint.spec.ts` | ts | 98 | 测规则指纹计算：规则集变更必须改变指纹 | 结构判断 |
| `run-oxlint.spec.ts` | ts | 55 | 测 `run-oxlint.ts`：参数透传与输出聚合 | 结构判断 |
| `run-memory-pressure-bench.spec.ts` | ts | 44 | 测内存压力基准的受限堆设置与结果格式 | 结构判断 |
| `test-non-loopback-address.spec.ts` | ts | 57 | 测测试用非回环地址探测，供网络隔离用例使用 | 结构判断 |
| `test-proxy-environment.spec.ts` | ts | 44 | 测代理环境变量的构造与清理 | 结构判断 |
| `test-official-listing-guard.spec.ts` | ts | 26 | 测官方清单守卫：非官方条目必须被拦 | 结构判断 |
| `libreoffice-engine.spec.ts` | ts | 24 | 测 `libreoffice-packages.mjs`：引擎包名与版本锁定 | 结构判断 |
| `vitest-environment.compat.spec.ts` | ts | 32 | 兼容契约：测试环境的浏览器/Node 双面行为一致 | 结构判断 |
| `command-entrypoints.compat.spec.ts` | ts | 24 | 兼容契约：命令行入口的注册与发现方式保持向后可用 | 结构判断 |

**20.14 小计**：160 个文件，表格 160 行，折叠 0 条；`精读` 0、`结构判断` 160、`待确认` 0。

### 20.15 `scripts/brand/`（1 个）

品牌资产渲染目录。只有一个脚本，没有测试，也不在 CI 关键路径上——它属于「改了品牌就要手动跑一次」的工具。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `render-icons.mjs` | mjs | 490 | 把品牌源图渲染成桌面端各平台图标（`.ico`/`.icns`/png 尺寸族）。调用点：根 `package.json` 的 `brand:icons`；`.github/workflows` 中无引用，属人工触发。 | 结构判断 |

**20.15 小计**：1 个文件，表格 1 行，折叠 0 条；`精读` 0、`结构判断` 1、`待确认` 0。

### 20.16 `scripts/cua-helper/`（13 个）

CUA（Computer Use Agent）助手产物的打包流水线：先算出打包输入，再从多平台构建产物里挑出本次要用的那一个，装成可分发的 zip/tarball，最后跑一遍真机冒烟。CI 入口是 `cua-helper-package.yml`（依次执行 `build-inputs.ts` → `select-artifact.ts` → `package.ts`）与 `cua-helper-package-windows.yml`（拼出含 `dsh-cua-windows.exe` 与 `cua-helper.json` 的扁平 zip）。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `build-inputs.ts` | ts | 169 | 计算打包输入清单：平台、目标产物名、依赖的构建 job 输出路径。调用点：`cua-helper-package.yml` 第 72 行。 | 结构判断 |
| `select-artifact.ts` | ts | 210 | 从一次工作流的多个产物中按元数据选出与当前平台/构建键匹配的那份，选不中即失败。调用点：`cua-helper-package.yml` 第 80 行。 | 结构判断 |
| `package.ts` | ts | 108 | 把选中的产物打成最终分发包（`--out` 指定输出目录）。调用点：`cua-helper-package.yml` 第 94 行。 | 结构判断 |
| `payload.ts` | ts | 123 | 生成分发包内的载荷清单（文件列表与校验和）。调用点：被 `package.ts` import（待确认具体导出）。 | 结构判断 |
| `stage.ts` | ts | 13 | 极薄的暂存步骤：把待打包文件放进临时目录，供 `package.ts` 复用。调用点：被 `package.ts` import。 | 结构判断 |
| `verify-tarball.ts` | ts | 24 | 打包后自检：解开 tarball 断言必需文件齐全。调用点：被 `package.ts` 调用（待确认）。 | 结构判断 |
| `build-inputs.spec.ts` | ts | 295 | 被测对象 `build-inputs.ts`：输入清单在平台矩阵下的取值与缺失报错 | 结构判断 |
| `select-artifact.spec.ts` | ts | 290 | 被测对象 `select-artifact.ts`：多产物匹配、无匹配与歧义匹配 | 结构判断 |
| `payload.spec.ts` | ts | 140 | 被测对象 `payload.ts`：清单条目与校验和格式 | 结构判断 |
| `package.spec.ts` | ts | 115 | 被测对象 `package.ts`：输出目录布局与重复打包的幂等性 | 结构判断 |
| `smoke.py` | py | 107 | 打包后的真机冒烟：解包、启动助手、发一次最小指令并校验返回 | 结构判断 |
| `test_smoke.py` | py | 93 | `smoke.py` 的自测，用假可执行文件验证冒烟流程的判定分支 | 结构判断 |
| `smoke.spec.ts` | ts | 13 | 从 TS 侧触发 Python 冒烟的薄包装用例 | 结构判断 |

**20.16 小计**：13 个文件，表格 13 行，折叠 0 条；`精读` 0、`结构判断` 13、`待确认` 0（`payload.ts`、`verify-tarball.ts` 的精确调用关系未逐行核对，已在职责列注明）。

### 20.17 `scripts/dependency-catalog/`（2 个）

`docs/dependency-catalog.json` 的输入数据。`gen-dependency-catalog.ts` 顶部把这两个文件写成常量 `LOCK` 与 `METADATA`，输出到 `docs/dependency-catalog.json`，并由 `verify-dependency-catalog`（`--check`）在 CI 里防止漂移。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package-lock.json` | json | 8539 | 一次公开 npm 解析的完整锁文件快照，用来在不联网的情况下复现依赖树。**超大文件**（344 KB），不要在编辑器里直接打开。 | 结构判断 |
| `resolution.json` | json | 9 | 锁文件的元信息（解析时间、registry、工具版本），生成器用它校验锁文件来源合法 | 结构判断 |

**20.17 小计**：2 个文件，表格 2 行，折叠 0 条；`精读` 0、`结构判断` 2、`待确认` 0。

### 20.18 `scripts/fixtures/`（23 个）

被测试与冒烟脚本引用的共享样例。它们不是产品代码，但删除任何一条都会让对应用例失败，因此单列一节说明「谁在用」。`tests/fixtures/**` 的通用折叠规则在这里不适用——这些文件在顶层 `fixtures/`，且引用方各不相同。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `coverage-fork.config.ts` | ts | 18 | 供覆盖率 fork 诊断用例启动 vitest 的最小配置；被 `coverage-fork-diagnostics.spec.ts` 作为 `--config` 传入 | 结构判断 |
| `coverage-fork.fixture.ts` | ts | 15 | 前述配置唯一覆盖的源文件，用来断言「被统计到的文件集合恰好是它」 | 结构判断 |
| `coverage-fork-exit.cjs` | cjs | 2 | fork 子进程的非零退出触发器，构造崩溃场景 | 结构判断 |
| `lane-test-budget.fixture.ts` | ts | 32 | 泳道测试时长预算用例的被测样例，含可预期的慢用例 | 结构判断 |
| `office-render.py` | py | 118 | Office 渲染检查脚本，被 `smoke-python-runtime.py`（第 1110 行）与 `python/sdk/tests/test_office_render.py` 通过 `runpy` 加载 | 结构判断 |
| `office-render/color-blocks.docx` | docx | — | 渲染夹具：三色块表格文档 | 结构判断 |
| `office-render/color-blocks.pptx` | pptx | — | 渲染夹具：三色块幻灯片 | 结构判断 |
| `office-render/color-blocks.xlsx` | xlsx | — | 渲染夹具：三色块工作簿；三者合计 5 KB，用于断言转换产物数量为 3 | 结构判断 |
| `python-snapshot-workflow-order.mjs` | mjs | 64 | 被 `python-snapshot-workflow-order.spec.ts` 直接 import，提供工作流步骤顺序的测试数据 | 结构判断 |
| `python-snapshot-tool.mjs` | mjs | 45 | Python 快照工具样例（待确认具体引用方） | 待确认 |
| `python-snapshot-image-offload.mjs` | mjs | 43 | Python 快照的图片外置样例（待确认具体引用方） | 待确认 |
| `python-sdk-dynamic-tools.mjs` | mjs | 28 | Python SDK 动态工具注册样例（待确认具体引用方） | 待确认 |
| `python-sdk-office.mjs` | mjs | 25 | Python SDK 调用 Office 能力的样例（待确认具体引用方） | 待确认 |
| `python-sdk-in-history-prompt.mjs` | mjs | 18 | 验证历史消息进入提示词的样例（待确认具体引用方） | 待确认 |
| `python-sdk-authoring-clock.mjs` | mjs | 8 | 最小样例：注入可控时钟，用于断言时间相关输出 | 结构判断 |
| `translation-prompt/examples/product.md` / `product.zh.md` | md | 44 | 翻译提示词样例：产品说明文档的中英对 | 结构判断 |
| `translation-prompt/examples/rules.md` / `rules.zh.md` | md | 30 | 翻译提示词样例：规则类文档的中英对 | 结构判断 |
| `translation-prompt/examples/agent-note.md` / `agent-note.zh.md` | md | 34 | 翻译提示词样例：agent note 的中英对（单语路径也被 `verify-translation-prompt.ts` 单独引用） | 结构判断 |
| `translation-prompt/snapshot-note.md` | md | 7 | 快照比对用的源文档，短到可以人工核对提示词拼装 | 结构判断 |
| `translation-prompt/response.txt` | txt | 23 | 录制的模型响应，供 `verify-translation-prompt.ts` 做确定性回放 | 结构判断 |

**20.18 小计**：23 个文件，表格 20 行（折叠 3 条：`product`、`rules`、`agent-note` 各一对中英文件并一行）；`精读` 0、`结构判断` 18、`待确认` 5。

### 20.19 `scripts/primary-runtime/`（6 个）

主运行时（CPython + 依赖 wheel + Node + pnpm）的锁定与准备。`lock.json` 是事实来源：构建脚本按它下载、`gen-third-party-notices.ts` 按它生成许可清单、`smoke.py` 按它验证装出来的解释器可用。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `lock.json` | json | 180 | 主运行时各发行版（CPython、pip、wheel 依赖）的版本与下载校验和。被 `build-exe-for-python-sdk.ts`（第 22 行）与 `gen-third-party-notices.ts`（第 16 行）import。 | 结构判断 |
| `prepare.ts` | ts | 298 | 按 `lock.json` 准备主运行时目录：下载、解压、校验，并调用 `prunePrimaryRuntimePythonTests` 裁剪测试文件。调用点：`prepare:primary-runtime`。 | 结构判断 |
| `prune-python-tests.ts` | ts | 41 | 从运行时里删掉 `test/`、`tests/` 等只用于 CPython 自测的目录，压缩分发包体积。调用点：被 `prepare.ts` 第 16 行 import。 | 结构判断 |
| `smoke.py` | py | 127 | 主运行时冒烟：用装好的解释器跑最小导入与 Office 依赖检查。调用点：被 `smoke-python-runtime.py` 第 1014 行以 `-I -B` 方式启动。 | 结构判断 |
| `prepare.spec.ts` | ts | 187 | 被测对象 `prepare.ts`：下载清单缺失、校验和不符与解压布局 | 结构判断 |
| `prune-python-tests.spec.ts` | ts | 85 | 被测对象 `prune-python-tests.ts`：只删测试目录，不误删 `site-packages` 下的运行时文件 | 结构判断 |

**20.19 小计**：6 个文件，表格 6 行，折叠 0 条；`精读` 0、`结构判断` 6、`待确认` 0。

### 20.20 `scripts/release/`（15 个）

发布流水线的实现层。六个 npm script 直接对应：`release:dsh`/`release:vendor` → `bump.ts`，`release:verify` → `verify.ts`，`release:pack` → `pack.ts`，`release:verify-packed-install` → `verify-packed-install.ts`，`release:publish` → `publish.ts`。其余文件是它们共用的库与自测。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `bump.ts` | ts | 416 | 版本提升：按 `--family`（`dsh`/`vendor`）改版本号、同步内部依赖范围与锁文件。调用点：`release:dsh`、`release:vendor`。 | 结构判断 |
| `families.ts` | ts | 504 | 包族定义：哪些包属于同一发布族、版本如何联动、哪些包必须同步。 | 结构判断 |
| `verify.ts` | ts | 117 | 发布前校验：版本一致、依赖范围合法、仓库干净。调用点：`release:verify`。 | 结构判断 |
| `pack.ts` | ts | 123 | 打发布包：按包族产出 tarball 并生成清单。调用点：`release:pack`。 | 结构判断 |
| `tarball.ts` | ts | 63 | tarball 命名与内容校验的共用逻辑，被 `pack.ts` 与 `verify-packed-install.ts` 复用。 | 结构判断 |
| `publish.ts` | ts | 242 | 发布到 npm registry：按拓扑顺序推送、失败即停并报告已发布项。调用点：`release:publish`。 | 结构判断 |
| `verify-packed-install.ts` | ts | 134 | 把打好的 tarball 装进干净目录并断言可启动、依赖完整。调用点：`release:verify-packed-install`。 | 结构判断 |
| `process.ts` | ts | 129 | 子进程封装：统一的超时、输出捕获与失败上抛，供上述步骤调用外部命令。 | 结构判断 |
| `installed-product-isolation.ts` | ts | 73 | 安装后隔离检查：断言默认产品面不引入实验性包（与 `verify-default-product-isolation.ts` 同向但作用于安装产物）。 | 结构判断 |
| `families.spec.ts` | ts | 522 | 被测对象 `families.ts`：包族划分、联动版本与非法组合 | 结构判断 |
| `pack.spec.ts` | ts | 377 | 被测对象 `pack.ts`：tarball 内容、命名与清单一致性 | 结构判断 |
| `publish.spec.ts` | ts | 331 | 被测对象 `publish.ts`：顺序、失败短路与已发布回滚提示 | 结构判断 |
| `installed-product-isolation.spec.ts` | ts | 108 | 被测对象 `installed-product-isolation.ts`：越界依赖必须被拦 | 结构判断 |
| `verify-packed-install.spec.ts` | ts | 99 | 被测对象 `verify-packed-install.ts`：缺文件、启动失败的判定 | 结构判断 |
| `process.spec.ts` | ts | 51 | 被测对象 `process.ts`：超时与错误输出透传 | 结构判断 |

**20.20 小计**：15 个文件，表格 15 行，折叠 0 条；`精读` 0、`结构判断` 15、`待确认` 0。

### 20.21 `scripts/snapshots/`（32 个）

Python 单文件运行时的会话快照语料：每个子目录对应一类场景，`session.v*.jsonl` 是录制好的会话，`result.json` / `model-visible.json` / `requests.json` 是期望产出。它们由 `smoke-python-runtime.py` 在 CI 里回放比对，格式细节见 20.4 节与 `modules/` 的会话格式分析。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `python-sdk-single-exe/advanced/result.json` | json | 4936 | 高级用例（多工具、多轮）的期望结果，是语料里最大的单文件 | 结构判断 |
| `python-sdk-single-exe/advanced/session*.jsonl` | jsonl | 445 | 4 组会话的 v2/v3/v4 三份格式，共 9 个文件，用于验证迁移与回放一致 | 结构判断 |
| `python-sdk-single-exe/advanced-ptc/result.json` | json | 2310 | 程序化工具调用场景的期望结果 | 结构判断 |
| `python-sdk-single-exe/advanced-ptc/session.v4.jsonl` | jsonl | 50 | 该场景的 v4 会话录制 | 结构判断 |
| `python-sdk-single-exe/authoring/model-visible.json` | json | 35 | 创作场景下模型可见内容的期望值 | 结构判断 |
| `python-sdk-single-exe/authoring/win-x64/model-visible.json` | json | 35 | 同上，Windows x64 平台差异副本 | 结构判断 |
| `python-sdk-single-exe/dynamic-tools/tool-history.json` | json | 269 | 动态注册工具后的历史记录期望 | 结构判断 |
| `python-sdk-single-exe/minimal/model-visible.json` | json | 254 | 最小场景的模型可见内容 | 结构判断 |
| `python-sdk-single-exe/minimal/win-x64/model-visible.json` | json | 254 | 同上，Windows 副本 | 结构判断 |
| `python-sdk-single-exe/minimal-in-history/prompt-history.json` | json | 31 | 最小场景的历史进入提示词断言 | 结构判断 |
| `python-sdk-single-exe/restart/{requests,result,resume}.json` | json | 166 | 重启续跑场景：请求序列、结果与恢复点 | 结构判断 |
| `python-sdk-single-exe/restart/session.*.jsonl` | jsonl | 106 | 重启场景的两组 6 份会话录制（v2/v3/v4） | 结构判断 |
| `python-sdk-single-exe/scheduler-recovery/{requests,result}.json` | json | 187 | 调度器崩溃恢复场景的期望请求与结果 | 结构判断 |
| `python-sdk-single-exe/scheduler-recovery/session.v*.jsonl` | jsonl | 62 | 该场景的 v3/v4 录制 | 结构判断 |
| `translation-prompt-v4/request-response.expected.json` | json | 44 | 翻译提示词 v4 的录制请求/响应，被 `translation-prompt.expected.spec.ts` 锁定 | 结构判断 |

**20.21 小计**：32 个文件，表格 15 行（折叠 17 条：`advanced` 的 9 个 jsonl 并 1 行、`restart` 的 3 个 json 并 1 行与 6 个 jsonl 并 1 行、`scheduler-recovery` 的 2 个 json 并 1 行与 2 个 jsonl 并 1 行，其余 6 个单文件各占一行）；`精读` 0、`结构判断` 32、`待确认` 0。

### 20.22 `scripts/ssh-helper/`（6 个）

SSH 助手产物的构建库，被顶层 `build-exe-for-ssh-helper.ts` 与 `verify-ssh-helper-*.ts` 复用。CI 入口是 `build-exe-for-ssh-helper.yml`（矩阵构建 → `verify-ssh-helper-artifact` → landlock 后端复验 → `verify-ssh-helper-ssh` 真连）。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `artifact.ts` | ts | 88 | 助手产物归档：命名、打包 tar.gz、写入平台元数据 | 结构判断 |
| `native.ts` | ts | 74 | 原生依赖（pty/spawn-helper）的收集与随附规则 | 结构判断 |
| `probe.ts` | ts | 42 | 探测目标平台能力（沙箱可用性、内核特性），决定验收集合 | 结构判断 |
| `release.ts` | ts | 76 | 发布助手产物：校验和、上传路径与版本标记 | 结构判断 |
| `worker-probe.ts` | ts | 67 | 在受限环境中探测 worker 是否可启动，供 landlock 验收用 | 结构判断 |
| `artifact.spec.ts` | ts | 117 | 被测对象 `artifact.ts`：归档内容、命名与元数据字段 | 结构判断 |

**20.22 小计**：6 个文件，表格 6 行，折叠 0 条；`精读` 0、`结构判断` 6、`待确认` 0。

### 20.23 `scripts/tests/`（2 个）

跨工作流的断言用例，测的不是某个 ts 脚本，而是 CI 配置在多平台、多触发途径下的一致性。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `ci-master-platforms.spec.ts` | ts | 166 | 断言 `ci-master` 工作流的平台矩阵完整（三平台 × 双架构），且各平台都跑到阻塞门禁 | 结构判断 |
| `ci-release-selfhosted.spec.ts` | ts | 325 | 断言自托管发布工作流的 runner 标签、权限与产物上传步骤符合发布契约 | 结构判断 |

**20.23 小计**：2 个文件，表格 2 行，折叠 0 条；`精读` 0、`结构判断` 2、`待确认` 0。

### 20.24 `scripts/types/`（2 个）

给非 TS 产物提供类型声明的垫片目录，`tsconfig` 通过 `typeRoots`/`paths` 引入。改动这两个文件会直接影响客户端构建面与资源导入的类型检查。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `client-assets/index.d.ts` | ts | 30 | 声明图片、字体、样式等资源模块的导入类型，让 `import icon from './a.svg'` 通过类型检查 | 结构判断 |
| `client-build-environment/index.d.ts` | ts | 7 | 声明客户端构建期注入的全局常量（构建面、版本等） | 结构判断 |

**20.24 小计**：2 个文件，表格 2 行，折叠 0 条；`精读` 0、`结构判断` 2、`待确认` 0。

**第二十节总计**：覆盖 465 个文件，表格 443 行，折叠 22 条（20.3 的两组 `.mjs` + `.d.mts` 各并一行，折 2；20.18 的三对中英样例各并一行，折 3；20.21 的快照文件按目录合并，折 17）。校验：443 + 22 = 465 ✓。`精读` 0（本节全部为路径 + 调用点 + 命名推断，未逐行读正文）、`结构判断` 432、`待确认` 11。校验：432 + 11 = 443 ✓。

## 二十一、疑似失效脚本

这一节不重复文件职责（职责见第二十节），只回答一个问题：`scripts/` 下 465 个文件里，哪些已经没有任何调用方，可以安全清理？

### 21.1 判据与做法

「有没有被调用」不能靠文件名 grep 判断，因为 `run-gates.ts` 引的是 **npm script 名**而不是文件名。采用四层判据：

| 层 | 证据 | 说明 |
| --- | --- | --- |
| 1 | 根 `package.json` 的 `scripts` 对象 | 逐条解析后建立「脚本文件 → npm script 名」的双向映射。直接对 `package.json` 原文做字符串包含会误命中（`build` 会命中 `build:lib`），必须解析成对象再比对值 |
| 2 | `.github/workflows/*.yml` 全文 | 同时搜 npm script 名与文件路径，因为少数 workflow 直接 `bash scripts/xxx.sh` |
| 3 | `scripts/run-gates.ts` 的调用表 | `pnpmScript(label, 'npm-script-name')` 与 `pnpmExec(...)`；门禁是绝大多数脚本的唯一触发点 |
| 4 | 其它脚本的 `import` 与配置文件路径数组 | 库模块没有独立入口，只能靠引用方存活；`vitest*.config.ts` 里还有一批以字符串路径登记的插件文件 |

补充：`vitest.config.ts` 的 `testIncludes` 含 `'scripts/**/*.spec.ts'`，因此第二十节 20.14 登记的 160 个根目录测试文件由常规 `pnpm test` 覆盖，**不属于**失效范畴，本文不把它们列入下表。

### 21.2 结论一：没有「零引用」文件

四个看起来零引用的文件都查到了动态契约：

| 文件 | 承接方 | 证据 |
| --- | --- | --- |
| `coverage-uncovered-locations.cjs` | `vitest.config.ts` | 第 16 行 `fileURLToPath(new URL('./scripts/coverage-uncovered-locations.cjs', import.meta.url))`，作为覆盖率 location reporter 传给 vitest |
| `test-dom-environment.ts` | `vitest.config.ts` | 第 205 / 225 / 245 行三处环境声明数组中的字符串路径 |
| `test-proxy-environment.ts` | `vitest.config.ts` | 同上，与 `test-dom-environment.ts` 并列出现 |
| `session-snapshot-corpus.corpus.ts` | `vitest.snapshot.config.ts` | 第 52 行 `'scripts/session-snapshot-corpus.corpus.ts'`，作为快照语料清单 |

因此**不能**以「搜不到 import」为由删除任何 `scripts/` 文件。

### 21.3 结论二：17 个有入口、但门禁与 CI 都不调用

下表文件都有自己的 npm script 或 import 引用，但两者既不在 `run-gates.ts` 的调用表里，也没出现在任何 workflow 中。它们是**人工/本地入口**，不是死代码，但也不受 CI 保护（`translation-brief.ts` 属 import-only，列在此处是为了避免被误判为孤立文件）。

| 文件 | 类型 | 行数 | 职责与处置建议 | 标注 |
| --- | --- | ---: | --- | --- |
| `publish-npm-baseline.ts` | ts | 1070 | 入口 `publish:npm-baseline`。本机一次性发布脚本：pack 与 publish 在同一进程完成，需人工认证与重试，且排除 vendor。[npm-release-sequences Agent Note](../../../.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md) 明确记录「不能作为 CI 发布基础」，其 tarball 校验与已安装产物探针已被搬运复用。结构：包选择与版本约束 → 安装与解析 → 基线写盘与差异报告。**建议保留并标注「仅本机」** | 结构判断 |
| `gen-third-party-notices.ts` | ts | 884 | 入口 `gen-third-party-notices` / `--check` 版 `verify-third-party-notices`。生成 `THIRD_PARTY_NOTICES.md`；虽然不在 CI 直接调用，但 `gen-third-party-notices.spec.ts` 在测试 lane 断言「已提交字节与生成结果一致」，属于**间接门禁**。结构：输入收集（workspace 依赖 + 官方 payload + Python 发行版）→ 许可证解析 → 排序去重渲染 | 结构判断 |
| `install-lefthook.mjs` | mjs | 769 | 入口 `postinstall`，`pnpm install` 后自动执行，因此永远不会「没人调用」；同时被 `docs/development.md` 记为手工重装方式。结构：worktree 探测 → hook 路径安全校验 → 钩子写入或降级提示 | 结构判断 |
| `benchmark-npm-resolution.ts` | ts | 553 | 入口 `benchmark:npm-resolution`，但同时被 `verify-npm-install-layout.ts`（第 11 行）与 `gen-dependency-catalog.ts`（第 8 行）import，实际是「基准 + 共享工具库」双重身份。**不可删**。结构：包选择 → 隔离安装 → 解析耗时/内存采样 → 汇总输出 | 结构判断 |
| `translation-brief.ts` | ts | 512 | 无独立 npm 入口，被 `gen-translation-brief.ts` import；职责见 20.x 翻译工具组。**属于库模块，不在清理范围** | 结构判断 |
| `benchmark-next-package-dependency.ts` | ts | 271 | 入口 `benchmark:npm-resolution:next`。对照组基准，验证下一代依赖解析策略；仅本机跑，无门禁。**保留，标注实验性** | 结构判断 |
| `change-scope.ts` | ts | 248 | 入口 `change-scope`。按 git 变更路径推算受影响门禁集合；调用方是 `.agents/skills/dsh-pre-push-checks/SKILL.md` 的推前检查流程，属**人工工作流入口**，非 CI | 结构判断 |
| `persistence-review.ts` | ts | 230 | 入口 `persistence-review`。持久化 schema 变更的评审摘要工具，调用方是 `docs/cookbook/reviewing-persistence-type-changes*.md` 的双语手册。**保留** | 结构判断 |
| `dev-bundle-registry.ts` | ts | 173 | 入口 `dev:bundle-registry`。开发态 bundle 注册表写入工具；[build-artifacts-check-split Agent Note](../../../.agents/notes/implemented/process/2026-10-11-build-artifacts-check-split.md) 把它列为需要 `build` 先行的消费者。**保留** | 结构判断 |
| `run-memory-pressure-bench.ts` | ts | 147 | 入口 `test:bench:memory`，在 4/8 GiB 无 swap 的 cgroup 中重跑固定基准清单，见 [memory-limited-benchmarks Agent Note](../../../.agents/notes/implemented/testing/2026-10-07-memory-limited-benchmarks.md)。**保留** | 结构判断 |
| `verify-v3-event-vocabulary.ts` | ts | 105 | 入口 `verify-v3-event-vocabulary`，只在 `docs/cookbook/adding-a-session-format-version*.md` 中作为一次性校验步骤出现。**待确认**：是否有意从门禁移除（若 v3 已冻结，此脚本可归档） | 待确认 |
| `run-bench-suite.ts` | ts | 70 | 入口 `test:bench:built`（`test:bench` 的第二段）。**注意**：`run-gates.ts` 的 `ci-bench` lane 走的是 `run-ci-bench.ts`，不是本文件，两者不要混淆 | 结构判断 |
| `gen-translation-brief.ts` | ts | 331 | 入口 `gen-translation-brief`，被 `.agents/skills/dsh-translate-docs/SKILL.md` 作为翻译工作流命令引用，属人工/agent 工作流 | 结构判断 |
| `migrate-sessions-to-v4.ts` | ts | 303 | 入口 `migrate:sessions-to-v4`。一次性会话格式迁移，`migrate-sessions-to-v4.spec.ts` 仍覆盖其 `runMigrationJobs` 与 `--help`。迁移窗口结束后可连同 spec 一起归档。**待确认归档时点** | 结构判断 |
| `migrate-packed-session-fixtures.ts` | ts | 21 | 入口 `migrate:packed-session-fixtures`。21 行的薄封装，把已有 packed 夹具批量转成新格式，属一次性脚本 | 结构判断 |
| `gen-cordis-api.ts` | ts | 9 | 入口 `gen-cordis-api` / `verify-cordis-api`。**精读全文**：9 行兼容壳，注释写明「Compatibility entry point for the unified Typert-backed Cordis catalog projection」，正文只有 `import { main } from './gen-cordis-catalog.ts'` 加一次 `main()`。`gen-cordis-inspect-catalog.ts` 生成物的 banner 里仍保留本命令名（第 75–76 行做字符串替换），说明它是一条影子入口。**建议保留**：删掉会让已发布的生成物 banner 指向不存在的命令 | 精读 |
| `demo-ptc.mjs` | mjs | 19 | 入口 `demo:ptc`，同时被 `verify-application-entrypoints.ts`（第 58 行）登记为必须存在的 `dsh-wrapper`，门禁会校验它启动的是 `apps/cli/src/bin.ts` 而不是包入口。**间接门禁，不可删** | 结构判断 |

### 21.4 处置建议汇总

| 分组 | 文件 | 建议 |
| --- | --- | --- |
| 间接门禁（删了会挂） | `gen-third-party-notices.ts`、`demo-ptc.mjs`、`benchmark-npm-resolution.ts`、`translation-brief.ts`、`install-lefthook.mjs` | 保留，不清理 |
| 人工工作流入口 | `change-scope.ts`、`persistence-review.ts`、`gen-translation-brief.ts`、`dev-bundle-registry.ts`、`publish-npm-baseline.ts` | 保留，建议在 `scripts/AGENTS` 类文档里集中登记「哪个 skill / cookbook 在用它」 |
| 本地基准 | `benchmark-next-package-dependency.ts`、`run-bench-suite.ts`、`run-memory-pressure-bench.ts` | 保留；`run-ci-bench.ts` 才是 CI 路径 |
| 一次性迁移 | `migrate-sessions-to-v4.ts`、`migrate-packed-session-fixtures.ts` | 迁移窗口关闭后归档（含 spec） |
| 待确认 | `verify-v3-event-vocabulary.ts` | 先确认 v3 是否已冻结；若已冻结，转归档 |
| 兼容壳 | `gen-cordis-api.ts` | 保留（生成物 banner 依赖命令名存在） |

**本节统计**：本节为横向可达性分析，**不新增清单覆盖计数**（所涉 21 个文件均在第二十节登记过）。表格共 27 行（21.2 四条、21.3 十七条、21.4 六条）；`精读` 1（`gen-cordis-api.ts` 全文 9 行）、`结构判断` 19、`待确认` 1。结论：**0 个文件完全无引用，无一可直接删除**。

## 二十二、vendor（81 个）

Cordis 框架及其基础库的**源码内嵌副本**。它们不走 npm 依赖，而是作为 pnpm workspace 成员（`vendor/*`）参与构建，理由写在 [vendor/README.md](file:///D:/ai/deepseek/i-do/vendor/README.md) 首段：让 harness 完整拥有框架层，做到可审计、可打补丁、可钉版本。

三条全局约定，改这批文件前必须知道：

1. **不要随手改 `vendor/*/src/`**。每一处与上游的偏离都必须在 `vendor/README.md` 的「Local modifications」里登记，带稳定编号（当前下一个编号是 V28），且编号不得复用。`tsconfig.json` 是例外——它们按单体仓库的构建形状重新生成，允许因类型检查策略调整而改动。
2. **构建时才重命名作用域**。所有包都以 `@deepseek-ai` 作用域发布（`cordis` → `@deepseek-ai/cordis`，`@cordisjs/plugin-loader` → `@deepseek-ai/cordis-plugin-loader`），由 `scripts/rescope-vendor.ts` 统一改写，门禁侧对应 `pnpm rescope-vendor --check`。同步上游后要重新执行 `pnpm run rescope-vendor --apply`，否则包名与引用会分叉。
3. **上游同步是「覆盖 + 重放」**：按 manifest 表里的 commit 检出上游，拷 `src/`（以及变化了的 `bin.js`/`README.md`/`LICENSE`），再逐条重放本地修改；上游已修好的条目要在日志里删除而不是留着。

九个包的分工与文件见下。每个包的 `LICENSE` 均为上游 MIT 原文 21 行、内容一致，本节不逐条登记，按每包 1 条合并计入覆盖（共折 9 条）。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `AGENTS.md` | md | 7 | 给 agent 的目录级约束：禁止随意改 `src/`，偏离必须登记到 README 的修改日志 | 精读 |
| `CLAUDE.md` | md | 1 | 只写 `AGENTS.md` 一行，作为其他工具的入口重定向 | 精读 |
| `README.md` | md | 67 | 本目录的权威文档：manifest（目录 / npm 名 / 上游名 / 版本 / 仓库 / commit）、V1–V27 本地修改日志、resolver adaptations、五步同步流程 | 精读 |

### 22.1 cordis（14 个）

框架内核：上下文树、生命周期、事件、注册表、服务与反射。`Fiber` 是并发卸载与重入释放的核心，本地有三处加固（V6）。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `bin.js` | js | 16 | 极薄的 CLI 垫片，把命令转给 `src/` 的导出，供上游的 `cordis` 可执行名使用 | 结构判断 |
| `package.json` | json | 51 | 作用域名与发布元数据；`files` 含 `src`（V16，否则 export map 会指向 tarball 里不存在的文件） | 结构判断 |
| `README.md` | md | 115 | 上游框架概念文档（Context / Fiber / Service / Effect），保留原文 | 结构判断 |
| `src/context.ts` | ts | 146 | `Context` 类与其接口：服务注册、插件声明、子上下文派生；本地补了 `@param`/`@returns` 契约注释（V7） | 结构判断 |
| `src/events.ts` | ts | 371 | `EventsService`：`on`/`emit`/`waterfall`/`bail`/`parallel` 的分发与短路语义 | 结构判断 |
| `src/fiber.ts` | ts | 820 | 生命周期引擎：fiber 状态机、effect 收集与逆序释放、重入卸载。**结构**：前段状态与 effect 容器 → 中段 setup/dispose 交错规则 → 后段父子 fiber 与依赖声明。本地加固见 V6（setup 期间开始的卸载会等待 setup 与其清理；`UNLOADING` 期拒绝新建 effect） | 结构判断 |
| `src/index.ts` | ts | 16 | 包入口，再导出 `Context`、服务与类型，决定框架对外的公共面 | 结构判断 |
| `src/logger.ts` | ts | 276 | `LoggerService`：分级日志、命名空间与下游 sink 的注册点 | 结构判断 |
| `src/reflect.ts` | ts | 436 | `ReflectService`：跨上下文显式查找服务/插件，处理隔离边界 | 结构判断 |
| `src/registry.ts` | ts | 337 | `RegistryService`：插件条目的注册与依赖解析表 | 结构判断 |
| `src/service.ts` | ts | 115 | `Service` 基类：服务实例的注入与生命周期绑定 | 结构判断 |
| `src/utils.ts` | ts | 294 | 内部工具：可迭代清理、错误聚合、类型守卫 | 结构判断 |
| `tsconfig.json` | json | 23 | 按单体仓库形状重新生成（V3）：继承根 `tsconfig.base.json`、产物进 `lib/types`、声明 project references | 结构判断 |

### 22.2 cosmokit（11 个）

框架的通用工具库，无框架依赖。V22 为它引入了「不可变引用」与 `deepEqual` 的引用语义，这是 volatile 配置机制的底座。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 32 | 作用域名与导出；无运行时依赖 | 结构判断 |
| `README.md` | md | 30 | 上游工具库说明 | 结构判断 |
| `src/index.ts` | ts | 12 | 聚合出口，按模块再导出 | 结构判断 |
| `src/array.ts` | ts | 42 | 数组工具：分块、去重、稳定遍历 | 结构判断 |
| `src/misc.ts` | ts | 78 | 杂项：`deepEqual`（严格模式按引用比较、数组逐槽、环保守处理、URL 按规范化 href）、不可变引用工具（V22） | 结构判断 |
| `src/string.ts` | ts | 113 | 字符串工具：命名风格转换、转义与截断 | 结构判断 |
| `src/time.ts` | ts | 92 | 时间格式化与时长解析 | 结构判断 |
| `src/types.ts` | ts | 168 | 公共类型谓词与工具类型 | 结构判断 |
| `src/volatile.ts` | ts | 86 | volatile（跨热重载保留）引用的枚举与提交机制，供 Schemastery 与 Loader 使用（V22） | 结构判断 |
| `tsconfig.json` | json | 15 | 重新生成的单体仓库编译配置 | 结构判断 |

### 22.3 group（5 个）

Cordis 的 `Group` 插件在本仓库里的全部内容就是**一次再导出**——真正的实现住在 `loader` 的 `Group` 类里，本包只为保留上游的包名与导入路径。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 36 | 作用域名与对 `@deepseek-ai/cordis-plugin-loader` 的依赖 | 结构判断 |
| `README.md` | md | 21 | 上游说明，指出 Group 用于把条目分层组织 | 结构判断 |
| `src/index.ts` | ts | 3 | 全文只有 `import { Group } from '@deepseek-ai/cordis-plugin-loader'` 与 `export default Group`，是纯兼容壳 | 精读 |
| `tsconfig.json` | json | 23 | 重新生成的编译配置 | 结构判断 |

### 22.4 hmr（6 个）

热重载提供方的实现。上游依赖的 YAML i18n 钩子没有内嵌，因此本地删掉了 `src/locales/`（V1）；模块监听的真实路径与就绪时序也有本地修正（V9）。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 59 | 作用域名；`esbuild` 为直接 dev 依赖（只为 `BuildFailure` 类型） | 结构判断 |
| `README.md` | md | 51 | 上游说明：文件变更 → 重载条目 → 报告构建失败 | 结构判断 |
| `src/index.ts` | ts | 428 | HMR 主体：监听配置与模块、realpath 归一（Windows 短名/别名，V9）、`ignoreInitial` 避免启动自触发、成功后替换模块命名空间 | 结构判断 |
| `src/error.ts` | ts | 36 | `BuildFailure` 类型的来源与失败日志格式化（V7 补了注释） | 结构判断 |
| `tsconfig.json` | json | 35 | 重新生成的编译配置，含 `esbuild` 类型引用 | 结构判断 |

### 22.5 include（7 个）

`include` 插件负责把外部文件当作条目树的一层「追加配置」载入，并维护一份写盘日志。本地改动集中在持久化语义上（V11 导出修补算法与 `!!js` 方言；V14 让 `flush()`/`stop()` 对未保存变更报错而非静默丢弃）。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 40 | 作用域名与对 loader 的依赖 | 结构判断 |
| `README.md` | md | 53 | 上游说明：Include 的条目来源、刷新与补丁语义 | 结构判断 |
| `src/index.ts` | ts | 465 | Include 插件主体：加载条目、合并补丁、刷新子条目。导出上游 `applyPatches` 为 `applyEntryPatches`、`!!js` 方言为 `entryListSchema`，供 `dsh --dump-config` 复用同一算法（V11） | 结构判断 |
| `src/journal.ts` | ts | 242 | 写盘日志：记录对宿主配置文件做过的补丁，供 `flush()` 重试与冲突检测（V14） | 结构判断 |
| `src/patch.ts` | ts | 261 | 补丁算法本体的移植，处理条目的增删改与顺序 | 结构判断 |
| `tsconfig.json` | json | 27 | 重新生成的编译配置 | 结构判断 |

### 22.6 loader（14 个）

条目树的加载器：读配置、解析插件、维护 `EntryTree`、决定重挂还是原地更新。本地改动最多——V22 的 volatile 更新、V23 的模块命名空间保留、V25 的生命周期适配、V26/V27 的两个 tree 修正，另有 resolver 的两处适配（浏览器 external 与包作用域缓存键）。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | --- | --- | --- |
| `package.json` | json | 45 | 作用域名；对 `@deepseek-ai/schemastery` 的类型依赖（V22 新增）与 `node-addon-require-builtin` 版本约束 | 结构判断 |
| `README.md` | md | 71 | 上游说明 + 本地追加：`moduleNamespace` 字段与 volatile 更新行为 | 结构判断 |
| `src/index.ts` | ts | 219 | Loader 插件入口：持有 `EntryTree`、转发配置、声明 `loader/volatile-update` 事件 | 结构判断 |
| `src/internal.ts` | ts | 144 | 内部符号与跨模块共享的私有约定 | 结构判断 |
| `src/resolve.ts` | ts | 75 | 模块解析：浏览器外部化用默认导入、包作用域缓存键按 `path.resolve()` 归一 | 结构判断 |
| `src/config/diff.ts` | ts | 45 | `equalExceptVolatile`：递归跳过固定 volatile 路径的严格比较，只做纯函数判断、不执行配置钩子（V22） | 结构判断 |
| `src/config/entry.ts` | ts | 239 | `Entry`：配置更新、重挂、volatile 提交（`_commitVolatile` 走 `Fiber.resolveConfig()`），并保留 `moduleNamespace`（V23） | 结构判断 |
| `src/config/group.ts` | ts | 89 | `Group` 条目：分组容器，真正的类定义在此，`vendor/group` 只是再导出 | 结构判断 |
| `src/config/isolate.ts` | ts | 176 | 隔离域：为条目提供独立的模块/服务视图，含 `declare module './entry.ts'` 的类型扩展（V4） | 结构判断 |
| `src/config/tree.ts` | ts | 205 | `EntryTree`：条目增删改与跨树移动；本地修了跨树移动的注册迁移（V26，回挪上游 #271）并允许显式 id 含 `:`（V27） | 结构判断 |
| `src/config/utils.ts` | ts | 32 | 配置层的小工具 | 结构判断 |
| `tsconfig.json` | json | 27 | 重新生成的编译配置 | 结构判断 |
| `tsdown.config.ts` | ts | 16 | 本仓库自有的打包形状覆盖（V5 同类），上游没有此文件 | 结构判断 |

### 22.7 logger-console（8 个）

把框架日志写到控制台。拆了 Node 与浏览器两个入口，是九个包里唯一有双产物形状的。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 42 | 作用域名；条件导出区分 node/browser | 结构判断 |
| `README.md` | md | 35 | 上游说明：日志级别与输出格式 | 结构判断 |
| `src/index.ts` | ts | 28 | Node 入口：拼接输出、注册 sink | 结构判断 |
| `src/browser.ts` | ts | 17 | 浏览器入口：降级到 `console`，不引入 Node 专有模块 | 结构判断 |
| `src/shared.ts` | ts | 100 | 两端共用的格式化（级别着色、命名空间前缀） | 结构判断 |
| `tsconfig.json` | json | 26 | 重新生成的编译配置 | 结构判断 |
| `tsdown.config.ts` | ts | 24 | 自有打包覆盖：ESM+CJS 双输出、node/browser 分离入口（V5） | 结构判断 |

### 22.8 schemastery（6 个）

配置 schema 库，整包只有一个 962 行的实现文件。V22 为它加了 `.volatile()`、可选/默认值推断、序列化元数据与引用感知的 `simplify`，是配置热重载能保留引用的关键。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 39 | 作用域名；`type: module` + 条件导出（V10，避免并发导入落到 CJS 入口引发 `ERR_REQUIRE_ESM_RACE_CONDITION`） | 结构判断 |
| `README.md` | md | 393 | 上游 API 文档，本地补了 volatile 与默认值推断章节 | 结构判断 |
| `src/index.ts` | ts | 962 | 全部实现：schema 构造器、校验、`simplify`/`unparse`、volatile 节点与序列化。**结构**：前段类型与 `Schema` 类 → 中段各基本类型的解码/校验 → 后段组合子、默认值与序列化 | 结构判断 |
| `tsconfig.json` | json | 21 | 重新生成的编译配置 | 结构判断 |
| `tsdown.config.ts` | ts | 17 | 自有打包覆盖（V5 同类） | 结构判断 |

### 22.9 timer（7 个）

基于框架生命周期的定时器服务，条目卸载时自动清理。上游包没有 README，本地这份是自写的；`locale/` 两个 json 是本仓库新增（V24）。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 40 | 作用域名；导出并发布 `locale/` 资源 | 结构判断 |
| `README.md` | md | 38 | 本地撰写的说明（上游无 README）：`setTimeout`/`setInterval` 的生命周期绑定 | 结构判断 |
| `src/index.ts` | ts | 153 | `TimerService`：定时注册、句柄回收、卸载时批量清理 | 结构判断 |
| `locale/en.json` | json | 5 | 设置页插件清单里的英文标题与描述（V24） | 结构判断 |
| `locale/zh.json` | json | 6 | 同上中文版 | 结构判断 |
| `tsconfig.json` | json | 23 | 重新生成的编译配置 | 结构判断 |

**第二十二节小计**：覆盖 81 个文件，表格 72 行，折叠 9 条（九个包各有一份内容相同的上游 `LICENSE`，每包并 1 条）。校验：72 + 9 = 81 ✓。`精读` 4（`AGENTS.md`、`CLAUDE.md`、`README.md`、`group/src/index.ts`）、`结构判断` 68、`待确认` 0。校验：4 + 68 = 72 ✓。

## 二十三、website（37 个）

文档站适配层，包名 `@deepseek-ai/website`，private、`type: module`、版本 `0.0.1`。它**不持有任何文档正文**：正文仍在各层自己的 `docs/` 目录，`website/docs.ts` 是一份发布清单，把选定页面投影成两套 locale 的路由树，投影产物写在被忽略的 `.generated/`。构建产物 `.dist/` 里除了 HTML，还有每条路由的 raw-Markdown 孪生（URL 去掉尾斜杠加 `.md`）与根级 `llms.txt`，两者都在构建时由清单推导，从不落盘成源文件。

三个根 `package.json` 入口决定它何时被调用：`docs:dev`（`vitepress dev .`，127.0.0.1:5173）、`docs:build`（`tsx website/build.ts` 串 `verify-doc-site-fragments`）、`docs:check`（先跑 8 个 spec，再跑 `docs:build`）。`run-gates.ts` 在 `windows-site` 门禁里用 `pnpmScript('windows-site', 'docs:build')` 调用，文档构建默认走 MPA 变体（第 524 行 `docsBuildScript: 'docs:build:mpa'`、第 849 行 `docs-site-build`）。因此改这一棵子树必须能过 `pnpm docs:check`，它同时拒绝 `website/` 下新增未忽略的 Markdown。

### 23.1 顶层文件（6 个）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `package.json` | json | 24 | 声明 `@deepseek-ai/website`、三条 scripts（`dev`/`build`/`preview`）与 vitepress、mermaid、panzoom、cytoscape 等 12 个 devDependencies | 精读 |
| `AGENTS.md` | md | 25 | 本子树的唯一维护型 Markdown，规定「内容不进这棵树」、`.generated/`/`.cache/`/`.dist/` 不得编辑提交、输出目录清理的三条安全约束，以及各查看器的行为边界 | 精读 |
| `build.ts` | ts | 86 | 生产构建入口，包装 `vitepress build`：`cleanDocSiteOutput` 在 VitePress 解析出 `outDir` 后、写文件前删掉旧产物，并要求该目录的词法路径与最近已存在的父目录 realpath 都不逃出站点根；符号链接形态的输出只 `unlink` 不递归；CLI 侧只接受零参数或 `--mpa` | 精读 |
| `docs.ts` | ts | 599 | 发布清单：`DocsPage` 描述每页的 locale、源 Markdown 路径、路由、侧栏归属与排序、outline 深度、`sourceAliases`（目录型 index 页的别名）；`MirroredPage`/`PairedPage` 区分「同源投两套 locale」与「`foo.md`/`foo.zh.md` 成对」，后者缺译文时两条路由都投影已有源，不做复制 | 结构判断 |
| `raw-markdown.ts` | ts | 52 | 开发服务器中间件，把 `.md` 路由与 `llms.txt` 以原文返回；靠 `sec-fetch-dest` 把脚本 import 让回 Vite，只有带 `dsh-raw=1` 的显式请求才 404 未发布路径 | 精读 |
| `.gitignore` | gitignore | 4 | 忽略 `.generated/`、`.cache/`、`.dist/` 与 node_modules | 结构判断 |

### 23.2 `.vitepress`（13 个）

站点配置与主题扩展。配置侧在模块顶层直接执行 `projectDocs()`，即「import 即投影」，因此任何加载配置的动作都会先刷新 `.generated/`。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `config.ts` | ts | 386 | VitePress 主配置：按 `orderedPages` 分组成侧栏（只有显式给 `collapsed` 才渲染可折叠，展开的组必须省略该键）、导航栏与 guide 侧栏共用模块链接、中英双 locale、注入 Mermaid 插件与 raw-markdown 中间件 | 结构判断 |
| `code-groups.ts` | ts | 34 | 两件事：`codeGroupFallbackHead` 在 MPA 构建里补一段样式，把所有命令块摊开并隐藏不可用的 tab 与复制按钮；`isolateCodeGroupRadios` 劫持 `container_code-group_open` 渲染规则，把原生 tab 条包进独立 `<form>`，避免搜索摘要清掉页面上的平台选择 | 精读 |
| `theme/index.ts` | ts | 70 | 主题入口，`extends: DefaultTheme` 并重写 Layout：挂载时创建 `DocumentTables`、延迟 `import()` 三个查看器、校正 hydration 插入控件后的初始 hash 位置；`onContentUpdated` 刷新表格、`watch` 路由/语言/主题刷新图表与图片、卸载时统一 dispose；`doc-before` 槽按 frontmatter 的 `rawMarkdownPath` 决定是否渲染 Markdown 动作条 | 精读 |
| `theme/media-viewer.ts` | ts | 232 | 图表与图片共用的全屏模态：pan/zoom 控制器、焦点管理、滚动锁、中英文案与键盘/滚轮交互 | 结构判断 |
| `theme/mermaid-viewer.ts` | ts | 98 | Mermaid 图表查看器，负责 SVG 隔离与「源 SVG 被替换即关闭当前视图」 | 结构判断 |
| `theme/image-viewer.ts` | ts | 127 | 独立内容图片查看器；只接管「已加载、alt 非空、独占段落」的图片，行内、链接、装饰性与 `data-no-zoom` 保持原交互，100% 按钮暴露原始尺寸 | 结构判断 |
| `theme/page-markdown-actions.ts` | ts | 215 | 当前页 Markdown 动作条（复制/查看），每个实例只拥有自己页面的请求；复制走 `?dsh-raw=1`，状态机含 `copying`/`copied`/`requestFailed`/`clipboardFailed` | 结构判断 |
| `theme/table-filter.ts` | ts | 171 | 长表格（≥10 数据行）的文本筛选与页面滚动表头；匹配可见单元格文本、忽略大小写与首尾空格，清空后恢复原始行与链接顺序 | 结构判断 |
| `theme/media-viewer.css` | css | 149 | 共享模态的布局、层级与焦点样式 | 结构判断 |
| `theme/page-markdown-actions.css` | css | 144 | 动作条样式 | 结构判断 |
| `theme/table-filter.css` | css | 100 | 筛选控件与吸顶表头样式 | 结构判断 |
| `theme/code-group.css` | css | 10 | code-group tab 条与复制按钮的基础样式修正 | 结构判断 |
| `theme/css.d.ts` | ts | 2 | 声明 `*.css` 模块的类型，让 `import './x.css'` 通过 tsc | 结构判断 |

### 23.3 `public`（2 个）

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `favicon.svg` | svg | 13 | 站点图标，VitePress 原样拷贝到产物根 | 结构判断 |
| `wordmark.svg` | svg | 15 | 页头品牌字标 | 结构判断 |

### 23.4 `tests`（16 个）

6 个 spec 全部由根 `docs:check` 显式点名执行（`scripts/project-doc-site.spec.ts` 与 `scripts/verify-doc-site-fragments.spec.ts` 也在同一串里，但不属本清单）。10 个 `tests/expected/*.html` 是主题渲染的期望产物，中英各一份，按被测对象成对折叠成 5 行。

| 文件 | 类型 | 行数 | 职责 | 标注 |
| --- | --- | ---: | --- | --- |
| `tests/page-markdown-actions.spec.ts` | ts | 479 | 被测对象 `theme/page-markdown-actions.ts`：复制与查看两类请求的发送、状态迁移、失败分支与组件生命周期 | 结构判断 |
| `tests/image-viewer.spec.ts` | ts | 350 | 被测对象 `theme/image-viewer.ts`：哪些图片被接管、alt/段落/`data-no-zoom` 的筛选条件、打开关闭与 100% 尺寸 | 结构判断 |
| `tests/mermaid-viewer.spec.ts` | ts | 274 | 被测对象 `theme/mermaid-viewer.ts`：异步渲染图表的接入、SVG 替换时自动关闭 | 结构判断 |
| `tests/table-filter.spec.ts` | ts | 249 | 被测对象 `theme/table-filter.ts`：10 行阈值、大小写与空格归一、清空还原、控件与吸顶表头生命周期 | 结构判断 |
| `tests/raw-markdown.spec.ts` | ts | 83 | 被测对象 `raw-markdown.ts`：`sec-fetch-dest` 分流、`dsh-raw=1` 的 404 语义、`llms.txt` 与 `.md` 的 Content-Type | 结构判断 |
| `tests/code-groups.spec.ts` | ts | 71 | 被测对象 `code-groups.ts`：MPA 兜底样式是否注入、`<form>` 包裹是否命中预期标记 | 结构判断 |
| `tests/expected/image-viewer.{en-US,zh-CN}.html` | html | 3 + 3 | 图片查看器两种语言的期望 HTML 快照（各 3 行、字节数 2,304 / 2,293） | 结构判断 |
| `tests/expected/page-markdown-actions.{en-US,zh-CN}.html` | html | 1 + 1 | 动作条两种语言的期望 HTML（1,114 / 1,118 B） | 结构判断 |
| `tests/expected/page-markdown-menu.{en-US,zh-CN}.html` | html | 1 + 1 | 动作条展开菜单的期望 HTML（3,035 / 3,077 B），与上一行同属 `page-markdown-actions` 的两个渲染态 | 结构判断 |
| `tests/expected/page-markdown-static.{en-US,zh-CN}.html` | html | 1 + 1 | 动作条静态态的期望 HTML（498 / 519 B） | 结构判断 |
| `tests/expected/table-filter.{en-US,zh-CN}.html` | html | 1 + 1 | 表格筛选控件的期望 HTML（283 / 289 B） | 结构判断 |

**第二十三节小计**：覆盖 37 个文件，表格 32 行，折叠 5 条（`tests/expected/` 的 10 个 HTML 按被测对象成对折成 5 行）。校验：32 + 5 = 37 ✓。`精读` 6（`package.json`、`AGENTS.md`、`build.ts`、`raw-markdown.ts`、`code-groups.ts`、`theme/index.ts`）、`结构判断` 26、`待确认` 0。校验：6 + 26 = 32 ✓。

## 二十四、对账与异常

本节只做核算，不新增覆盖。三张表分别回答：清单行数对不对得上、证据强度如何分布、哪些文件值得单独盯。

### 24.1 覆盖对账

清单侧实测：`packages-07.tsv` 771 个数据行、`misc.tsv` 914 个数据行，合计 **1,685**。文档侧表格 1,281 行，折叠 404 条，1,281 + 404 = 1,685 ✓。

| 节 | 目录 / 分组 | 清单文件数 | 表格行数 | 折叠条数 | 校验 |
| --- | --- | ---: | ---: | ---: | --- |
| 五 | `packages/test-support` | 226 | 114 | 112 | 114 + 112 = 226 ✓ |
| 六 | `packages/todo` | 23 | 12 | 11 | 12 + 11 = 23 ✓ |
| 七 | `packages/typert` | 118 | 66 | 52 | 66 + 52 = 118 ✓ |
| 八 | `packages/util` | 210 | 162 | 48 | 162 + 48 = 210 ✓ |
| 九 | `packages/web` | 109 | 62 | 47 | 62 + 47 = 109 ✓ |
| 十 | `packages/workflow` | 63 | 41 | 22 | 41 + 22 = 63 ✓ |
| 十一 | `packages/workspace` | 22 | 11 | 11 | 11 + 11 = 22 ✓ |
| 十三 | 根目录散落文件 | 48 | 40 | 8 | 40 + 8 = 48 ✓ |
| 十四 | `.claude` / `.ssh` / `.trae` | 8 | 8 | 0 | 8 + 0 = 8 ✓ |
| 十五 | `.github` | 67 | 63 | 4 | 63 + 4 = 67 ✓ |
| 十六 | `benchmarks` | 48 | 40 | 8 | 40 + 8 = 48 ✓ |
| 十七 | `native` | 79 | 46 | 33 | 46 + 33 = 79 ✓ |
| 十八 | `patches` | 12 | 12 | 0 | 12 + 0 = 12 ✓ |
| 十九 | `python` | 69 | 57 | 12 | 57 + 12 = 69 ✓ |
| 二十 | `scripts` | 465 | 443 | 22 | 443 + 22 = 465 ✓ |
| 二十二 | `vendor` | 81 | 72 | 9 | 72 + 9 = 81 ✓ |
| 二十三 | `website` | 37 | 32 | 5 | 32 + 5 = 37 ✓ |
| — | **合计** | **1,685** | **1,281** | **404** | **1,281 + 404 = 1,685 ✓** |

分组小计也对得上：`packages-07` = 771（第五～十一节 468 行 + 303 条折叠）；`misc` = 914，其中第十三～十九节 331 个（266 行 + 65 条折叠）、第二十节 465（443 + 22）、第二十二节 81（72 + 9）、第二十三节 37（32 + 5）。

第二十一节（疑似失效脚本）是横向可达性分析，所涉 21 个文件已在第二十节登记，本节不计入覆盖。

### 24.2 标注分布

| 标注 | 表格行数 | 占比 | 说明 |
| --- | ---: | ---: | --- |
| `精读` | 25 | 1.95% | 集中在 `patches`（12）、`website`（6）、`vendor`（4）、`python`（2）、根目录（1） |
| `结构判断` | 1,239 | 96.71% | 主体；依据为路径、包 README、同名测试与调用点 |
| `待确认` | 17 | 1.33% | 逐行为：根目录 3、`.trae` 1、`.github` 1、`benchmarks` 1、`scripts` 11 |
| **合计** | **1,281** | 100% | — |

按文件计，`精读` 覆盖 25 / 1,685 ≈ 1.48%。这个比例偏低是刻意的：本任务的产出是文件级索引，不是源码评审；凡没有真正打开正文的行，一律没有标 `精读`。`scripts` 一节 443 行全部是 `结构判断`，因为其职责靠「文件 → npm script 名 → `run-gates.ts` / workflow」两层映射确定，读正文并不会提高结论的可靠性。

### 24.3 异常文件

以下四类按「值得后续单独处理」筛选，不重复正文职责。

**（1）超大文件**——行数或体积显著超出同类，阅读与审查成本高。

| 文件 | 行数 / 字节 | 为什么标出来 |
| --- | ---: | --- |
| `pnpm-lock.yaml` | 34,860 / 1,219,598 | 全仓最大文本；锁文件冲突时不可手工合并，只能重生成 |
| `scripts/dependency-catalog/package-lock.json` | 8,539 / 344,527 | 与根 `pnpm-lock.yaml` 并存的第二套锁文件，版本漂移风险点 |
| `packages/typert/generator/tests/__snapshots__/type-model.spec.ts.snap` | 6,492 / 229,377 | 快照测试基线，模型形状一变即整文件重写 |
| `scripts/snapshots/python-sdk-single-exe/advanced/result.json` | 4,936 / 127,650 | 快照夹具而非源码，属预期的大文件 |
| `packages/typert/generator/src/analyzer.ts` | 3,471 / 152,018 | 本节最长的产品源码，类型模型分析的主要复杂度所在 |
| `scripts/smoke-python-runtime.py` | 3,279 / 158,356 | 单文件冒烟脚本，跨语言维护 |
| `scripts/type-equiv.manifest.json` | 2,962 / 91,254 | 数据清单，改动需整表复核 |
| `packages/test-support/llm-replay/tests/llm-replay.spec.ts` | 2,317 / 99,890 | 测试文件超过 2 千行，失败定位成本高 |
| `scripts/no-unknown-casts.baseline.json` | 1,957 / 106,682 | 基线只应递减，增长即意味着放宽门禁 |
| `scripts/gen-doc-graphs.ts` | 1,941 / 88,099 | 生成器与产物渲染耦合在一个文件里 |
| `scripts/ci-workflow.spec.ts` | 1,852 / 105,044 | 用测试守护 workflow 文本，规则密集 |
| `scripts/run-gates.ts` | 1,762 / 77,190 | 门禁总调度，任何 gate 解析都要读它 |
| `scripts/gen-cordis-catalog.ts` | 1,480 / 76,240 | Cordis 目录生成的唯一实现 |
| `python/sdk/tests/test_client.py` | 1,203 | Python 侧最大测试文件 |
| `patches/exceljs@4.4.0.patch` | 806 | 补丁本体接近源码量级，上游一升级就要重做 |
| `patches/lexical@0.49.0.patch` | 58 / 647,960 | 行数少但字节极大：单行超长的打包产物整段替换，diff 不可读 |
| `patches/@yao-pkg__pkg@6.21.0.patch` | 165 / 402,321 | 同上，针对 pkg 打包器的产物 | 

**（2）疑似废弃 / 低价值存活**——不重复第二十一节的 17 条清单，只补三类「结构上可疑」。

| 文件 | 现象 |
| --- | --- |
| `vendor/group/src/index.ts` | 3 行纯转发（`export default Group`），包的存在意义只在保留上游包名；删改都要连带 manifest |
| `scripts/gen-cordis-api.ts` | 9 行兼容壳，真实现已迁到 `gen-cordis-catalog.ts`；只因生成物 banner 仍引用该命令名而保留 |
| `scripts/translation-brief.ts` | 512 行，无 npm script 入口，靠 import 被调用；属「有代码无入口」的形态 |

**（3）命名与风格不统一**——不是缺陷，但会让「按扩展名找脚本」的检索失效。

| 现象 | 例子 |
| --- | --- |
| `scripts/` 下五种执行形态混放 | `.ts`（主流，经 `tsx`）、`.mjs`、`.cjs`（仅 `coverage-uncovered-locations.cjs`）、`.sh`（`wine-windows-gates.sh` 等门禁）、`.py`（`smoke-python-runtime.py`） |
| 同一门禁两种实现风格 | `run-gates.ts` 里的 `pnpmScript` 间接调用 vs `wine-windows-gates.sh` 由 workflow 直接 `bash` 调用 |
| 生成器与校验器靠命名配对 | `gen-*` / `verify-*` 成对出现，`--check` 只比对不落盘；配对关系没有任何清单文件登记，只能靠命名推断 |
| Python 侧下划线命名 | `test_smoke_model.py`、`test_client.py` 属该语言惯例，**不**列为问题，此处仅说明与 TS 侧 kebab-case 的差异 |

**（4）重复实现 / 双入口**——同一职责存在两条并行路径。

| 对象 A | 对象 B | 关系 |
| --- | --- | --- |
| `scripts/run-ci-bench.ts`（`ci-bench`） | `scripts/run-bench-suite.ts`（`test:bench:built`） | 两套基准入口，前者进 CI，后者面向已构建产物；改基准口径必须同时看 |
| `scripts/gen-cordis-catalog.ts` | `scripts/gen-cordis-api.ts` | 真实现 + 兼容壳，后者只转发 |
| `scripts/gen-translation-brief.ts` | `scripts/translation-brief.ts` | 生成器与库函数拆分，前者写盘、后者被 import |
| `patches/` 与 `vendor/` 的本地修改 | 补丁文件修三方依赖，vendor 内直接改源码 | 两种「改上游」的手段并存；vendor 的偏离必须登记 `vendor/README.md` 的 V 编号，补丁则靠文件名与 pnpm patch 机制追溯 |

### 24.4 `packages/client/ui-theme` 交界核对

按约定核对本份是否重复登记了该包的 9 个交界文件。结论：**没有重复登记，也没有漏登记，因为这 9 个文件根本不在本份的两张清单里**。

- `packages-02.tsv` 含 9 行 `packages/client/ui-theme/*`：8 个 `locale/*.json` 加 `package.json`。
- `packages-03.tsv` 含 64 行：`README` 三件套、`src/**`、`tests/**`、三份 `tsconfig*.json`、`tsdown.config.ts`。
- `packages-07.tsv` 与 `misc.tsv` 对 `ui-theme` 的命中数均为 **0**；本文件全文对 `ui-theme` 的命中数也是 **0**。
- 需要留意的一处同名干扰：`packages-07.tsv` 里有 3 行 `packages/typert/generator/tests/fixtures/type-model/packages/client/*`，那是 Typert 类型模型的测试夹具，路径里带 `packages/client` 但与被盘点的客户端包无关，已在第七节按夹具登记，不构成重复。

### 24.5 最终报告

**覆盖**：1,685 / 1,685，无遗漏行。`packages-07` 771 行、`misc.tsv` 914 行全部落到具体表格行或明确的折叠组；每一节的「清单文件数 = 表格行数 + 折叠条数」均已逐节校验通过。

**证据强度**：`精读` 25（1.95%）、`结构判断` 1,239（96.71%）、`待确认` 17（1.33%）。`精读` 的分布偏斜是有意的——`patches`（12 个补丁全部读过 hunk 头与目标包）、`website`（6 个入口/中间件/渲染钩子）、`vendor`（4 个说明性文件与小入口），都是「读正文才能说准」的位置；`scripts`、`packages/*` 的绝大多数文件靠调用点推断已经足够，读正文只会增加成本而不增加确定性。

**异常**：超大文件 17 个（最大 `pnpm-lock.yaml` 34,860 行）；疑似废弃 3 个结构可疑项，加上第二十一节 17 条「有入口但门禁与 CI 都不调用」，合计 20 个候选，其中 **0 个零引用**、无一可直接删除；命名风格 4 类；双入口 4 组。上游同步时优先看 `patches/` 与 `vendor/README.md` 的 V 编号——这两处是唯一「改了上游」的地方，也是升级最容易静默丢失的地方。

**边界**：本文只做文件级索引，不重复 `docs/superpowers/modules/` 的架构分析；`packages/` 顶层散落文件属 `packages-01.tsv`，第八～十一节只覆盖 `packages-07` 内的四个分组。

**改动范围**：本次盘点只新增本文件，未修改任何源码、配置或清单。收尾时 `git -C D:\ai\deepseek\i-do status --porcelain` 实测为：`M docs/superpowers/file-notes/packages-e-misc.md`（本文）、`?? .trae/`，以及 `M pnpm-lock.yaml`、`M website/package.json`、`M website/.vitepress/config.ts` 三处**非本任务产生**的既有改动（内容是为 Mermaid 懒加载补 `fastdom` 依赖与 Vite `optimizeDeps` 预打包），与本次只读盘点无关，未触碰。
