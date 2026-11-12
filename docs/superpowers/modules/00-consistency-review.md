# 00 · 模块分册交叉核对报告

核对对象：[项目总览](../project-overview.md) 与 8 篇模块分册（[01](01-agent-runtime.md) / [02](02-tools-execution.md) / [03](03-models-and-config.md) / [04](04-web-client.md) / [05](05-plugin-ecosystem.md) / [06](06-hosts-and-sdks.md) / [07](07-collaboration-scheduling.md) / [08](08-infrastructure.md)）。

核对方式：只读文档与源码，不修改任何源码。凡涉及数值或机制的争议，均回到源码取行号判定。标记「已修」的条目已直接改写对应文档；标记「待作者判断」的只登记、不改原文。

---

## 1. 模块边界冲突

### 1.1 `packages/jobs` 双归属（重叠）

- **涉及**：02 §1 模块地图（`packages/jobs/*` 与 `job_output` / `job_list` / `job_kill`）、02 §5.2 后台作业；07 §1 六组包职责表、07 §5 后台作业。
- **问题**：两篇都把自己写成 jobs 的归属方，且没有任何一篇声明「语义归谁、工具面归谁」。合并成一本手册时会出现两套描述。
- **建议处理**：明确切分——07 拥有 `ctx.jobs` 服务语义（登记、轮询、取消、保留预算、所有权移交），02 只保留「`tool-jobs` 三个工具如何暴露执行面」并指回 07 §5。待作者确认后再改。

### 1.2 `spill` 无归属（真空）

- **涉及**：07 §1/§6（`ctx.spillStore`，超预算工具结果落盘）；01 §2.1（compaction 含「工具结果裁剪」）；02 第 3 行取证目录未含 `packages/spill`，但 §5 讨论工具结果体积。
- **问题**：真正落地 spill 的是 07，但 01 与 02 都描述了「工具结果被裁掉」这一相邻事实，却都不说「落盘见 07」，形成读者视角的真空。
- **建议处理**：以 07 为唯一归属；在 01 §2.1 与 02 的相关小节各加一句「超预算结果外溢到磁盘见 [07 §6](07-collaboration-scheduling.md)」。待作者确认。

### 1.3 `packages/experimental/*` 双覆盖（重叠）

- **涉及**：02 第 3 行（取证范围含 `packages/experimental/*` 实现包）；05 第 7 节（约 60 个 experimental 包、默认关闭、需显式启用）。
- **问题**：02 以「工具实现包可能落在 experimental」为由整体纳入范围，05 以「插件生态分组」为由整章覆盖，两处对同一批包给出不同粒度的描述，且 02 未限定只讲承载工具的那部分。
- **建议处理**：02 限定为「承载工具/执行器实现的 experimental 包」，05 §7 保留全量清单与启用方式，并互相加一句指路。待作者确认。

### 1.4 子代理与 workflow 的派生边界（重叠）

- **涉及**：01 §1（明示不负责 `packages/subagent`）、01 §7.3（workflow 的 `maxConcurrentAgents`、`maxTotalAgents`）；07 §2（派生、容量、生命周期）。
- **问题**：01 一方面把子代理派生推给 07，另一方面又在 workflow 章节描述「并发派生多少个 Agent」的配额，读者无法判断配额实现归谁。
- **建议处理**：01 §7.3 保留「编排脚本的配额参数」，并补一句「实际派发与容量控制见 [07 §2.3](07-collaboration-scheduling.md)」。待作者确认。

### 1.5 `agent/pre-step` 钩子的定义方与消费方（重叠）

- **涉及**：01 §2.1/§4（钩子协议、checkpoint 使用点）；07 §9 共享钩子表（`workspace/session-activity`、`workspace/session-stop`、`agent/pre-step`）。
- **问题**：两篇都把这个 waterfall 当自己的接口来描述，07 未声明「协议定义在 01」。
- **建议处理**：07 §9 增加一句「钩子签名与调用时序以 [01 §4](01-agent-runtime.md) 为准」。待作者确认。

### 1.6 Slot 与 Client 插件注册（重叠）

- **涉及**：04 §2 Slot 拼装机制（五种基数、三种作用域）；05 §5.2 Client 插件声明、§5.3「能注册什么」明确写「Slot / UI 贡献 → Client 插件通过 Slot 注册渲染点（`ui-cordis` 等）」。
- **问题**：这不是真空，而是两篇都承认 Client 插件可以注册 Slot，但 04 没有提到「注册入口来自 05 的 `dsh.client` 声明」，05 也没有把机制细节交回 04，导致同一动作有两份不完整说明。
- **建议处理**：04 §2 开头补一句「Slot 的宿主由 [05 §5.2](05-plugin-ecosystem.md) 的 `dsh.client` 声明装载」；05 §5.3 该行改为「注册机制见 [04 §2](04-web-client.md)」。待作者确认。

### 1.7 权限预设与审批界面（三方视角交叉）

- **涉及**：02 §3.3（预设表、保留名）、04 §5.1（`interaction` 表，含 `permission-presets` → `ctx.permissionPresets`，并声明「不渲染任何界面」）、04 §5.5（浏览器拥有审批面板）、07 §2.5（子代理权限冻结）。
- **问题**：04 §5.1 说 interaction「不渲染任何界面」，而 §5.5 又说浏览器拥有审批面板；两处若不连读，会让人以为审批 UI 无人负责。02 与 07 各自重述了预设/冻结规则，也没有互指。
- **建议处理**：04 §5.1 补「面板本身由 `client/ui-approval` 渲染，见 §5.5」；02 §3.3 与 07 §2.5 互相加一句交叉引用。待作者确认。

### 1.8 端口与凭据（03 / 06）

- **涉及**：06 §2.4 端口归属、06 §11 关键索引（`ctx.connection` 信任模型与凭据归 06）；03 §4 凭据管理（模型提供方 API Key、`CredentialRef`）。
- **问题**：两处的「凭据」是同名不同义（传输层 token / Cookie 对 模型 API Key），且互不引用，读者容易误以为 03 覆盖了 Web 鉴权，或 06 覆盖了模型密钥。
- **处理建议**：03 §4 开头限定「本节的凭据指模型提供方密钥，不含 Web/Desktop 的传输凭据」；06 §11 该行补「模型密钥见 [03 §4](03-models-and-config.md)」。待作者确认。

---

## 2. 事实互相矛盾（附源码判定）

### 2.1 patch 分层顺序：06 与 05/总览冲突 —— **06 错误，已修**

- **涉及**：06 §3.4「profile boot 与 patch 分层」；05 §3.1 五档表；[总览](../project-overview.md) §4.1。
- **原表述（06）**：`bundle 层 → profile 用户层 → --patch overlay → home patch / telemetry`，并称依据是 `profile-boot.ts` 3-9 行注释。
- **判定依据**：
  - [`profile-context.ts`](../../../packages/boot/app-boot/src/profile-context.ts) 70-85 行 `readProfilePatches()` 的实际拼接顺序为：bundle patches → profile 自身 patch → `$DSH_HOME/cordis.patch.yml` → `context.overlays`（`--patch`）→ telemetry patch。
  - [`profile-boot.ts`](../../../apps/cli/src/profile-boot.ts) 202-236 行 `composeProfile()` 的注释同义，并说明 home 层「outranks the per-profile layer」。
  - `profile-boot.ts` 顶部模块注释确实省略了 home 层，这是 06 误引的来源。
- **结论**：05 §3.1 正确，06 把 `--patch` 与 home 层次序写反。
- **处理**：**已修** 06 §3.4，改为五档正确顺序，出处改为 `profile-context.ts` 70-85 行，并加注「`profile-boot.ts` 顶部注释省略 home 层，以实现为准」。

### 2.2 Web 默认端口：总览「待确认」与 06「3080」冲突 —— **06 正确，已修**

- **涉及**：[总览](../project-overview.md) §12 第 1 条（原列待确认）；06 §2.4、§11、§14.2。
- **判定依据**：`packages/bundle/web-app/cordis.patch.yml` 177-189 行的 `port: 3080`；`packages/bundle/web-app/src/startup.ts` 115-117 行的绑定逻辑。Desktop Host 另用 `--port 0` 由 OS 分配（06 §2.4）。
- **处理**：**已修** 总览——§4.2 载体表的 Web 行补「默认绑定 `127.0.0.1:3080`，`--host` / `--port` 可覆盖」；§12 该条移入「已核清」并指向 [06 §2.4](06-hosts-and-sdks.md)。

### 2.3 原生工具执行器默认并发：仅 02 给出数值，无冲突 —— 已确认

- **涉及**：02 §1、§3.2（默认最多 10 路）。
- **判定依据**：[`tool-executor-native/src/index.ts`](../../../packages/core/tool-executor-native/src/index.ts) 11 行：`maxParallel: () => number = () => 10`。
- **结论**：02 正确，其他分册未给出不同值，不构成矛盾。

### 2.4 子代理并发：07 的 8 与 01 的 min(16, cores-2) —— 非矛盾，口径不同

- **涉及**：07 §2.3（`maxDepth` 默认 1、`maxActiveSubagents` 默认 8）；01 §7.3（workflow `maxConcurrentAgents` 0 → min(16, cores-2)、`maxTotalAgents` 1000）。
- **判定依据**：[`subagent/src/index.ts`](../../../packages/subagent/subagent/src/index.ts) 194-198 行 `maxDepth ... default(1)`、`maxActiveSubagents ... default(8)`；01 的数值来自 workflow 包自身的调度配额。
- **结论**：两组数值不在同一层——07 是「子代理树内同时驻留数」，01 是「单次 workflow 脚本内并发派生数」。不是矛盾，但读者极易混淆。
- **处理**：不改原文；建议 01 §7.3 与 07 §2.3 各加一句口径说明（待作者判断）。

### 2.5 Checkpoint 三点的措辞：总览与 01 不一致 —— **01 更准确，已修**

- **涉及**：[总览](../project-overview.md) §5.2 第 7 步、§6.4（第 201 行「一致性」条目）、§8.1；01 §4.4。
- **原表述（总览）**：「模型请求、顶层工具副作用、完成的 step 后落盘」；01 为「模型请求前、顶层工具执行前、step 开始前」。
- **判定依据**：[`session-checkpoint-policy/src/index.ts`](../../../packages/session/session-checkpoint-policy/src/index.ts) 1-5 行模块注释与 60-83 行实现：`llm/stream` 在适配器派发前 flush、`tools/execute` 仅顶层（`exec.parent === undefined`）在工具体前 flush、`agent/pre-step` 在下一请求边界 flush。
- **结论**：落盘发生在「副作用之前」，01 的措辞正确；总览的「后」会造成时序误解。
- **处理**：**已修** 总览三处，统一为「模型请求前（`llm/stream`）、顶层工具执行前（`tools/execute`）、step 开始前（`agent/pre-step`）」。

### 2.6 权限预设保留名：02 与 07 不矛盾 —— 已确认

- **涉及**：02 §3.3（`custom` / `auto` 为保留名，不能作配置预设名）；07 §2.5（子代理只透传 `auto` 或 `danger-full-access`）。
- **判定依据**：[`permission-presets/src/index.ts`](../../../packages/interaction/permission-presets/src/index.ts) 64-90 行：`CUSTOM_PRESET = 'custom'`（派生状态，不可配置）、`AUTO_PRESET = 'auto'`（Auto 审阅集成的固定身份）、`AUTO_PRESET_SPEC = { sandbox: 'danger-full-access', approval: 'ask' }`；构造函数对两者出现在 `presets` 表中直接抛错。
- **结论**：`auto` 是运行期身份而非配置项，07 的「透传 auto」与 02 的「不能命名预设」同时成立。

### 2.7 06 §14.1 链接计数过期 —— 已修

- **问题**：本轮在 06 §3.4 新增 2 条唯一链接（`./05-plugin-ecosystem.md`、`packages/boot/app-boot/src/profile-context.ts`），原「共 39 条」失效。
- **处理**：**已修** 06 §14.1 改为 41 条，并补两行校验记录。

---

## 3. 待确认项已被别篇解答

| # | 原待确认位置 | 结论与依据 | 处理 |
|---|---|---|---|
| 3.1 | [总览](../project-overview.md) §12：Web 默认端口 | [06 §2.4](06-hosts-and-sdks.md) 给出 `127.0.0.1:3080` 及源码出处 | **已修**：§4.2 补充，§12 移入「已核清」 |
| 3.2 | 总览 §12：experimental 是否默认装载 | [05 §2 表格与 §7](05-plugin-ecosystem.md)：默认关闭，需在插件管理器「官方」分组显式启用 | **已修**：移入「已核清」并指路 |
| 3.3 | 总览 §12：模型提供方完整清单 | [03 §2.3](03-models-and-config.md)：42 个 pi-ai 内置提供方（构建期快照） | **已修**：移入「已核清」并指路 |
| 3.4 | 03 §9 第 5 条：埋点是否有非 UI 关闭途径 | [05 §3.1](05-plugin-ecosystem.md) 与 [08 §8](08-infrastructure.md) 的部署 workflow 均使用 `DSH_TELEMETRY_DISABLED=1`；源码同 3.5 | **已修**：改为已核条目 |
| 3.5 | 05 §10 第 3 条：telemetry 补丁注入条件 | 本轮源码：[`profile-context.ts`](../../../packages/boot/app-boot/src/profile-context.ts) 39、52-55、74-85 行——所有 profile 形态都最后追加，`DSH_TELEMETRY_DISABLED` 非空或缺少该行时不追加 | **已修**：改为已核条目 |
| 3.6 | 04 §8 第 7 条：包内 `README.zh.md` 是否存在 | 本轮链接校验：04 全部相对链接 `Test-Path` 通过 | **已修**：改为已核条目 |
| 3.7 | 01 §11 第 6 条：`openAt` 取值集合 | [05 §3.3](05-plugin-ecosystem.md) 只证明 web-app 用 `openAt: never`，未给出完整取值集合 | 部分已答，保留原文 |
| 3.8 | 02 §9 第 8 条：审批 UI 语义归谁 | [04 §5.5](04-web-client.md) 边界表明确「审批面板、输入区接管、按钮文案」归浏览器 | 归属已答、具体语义未答，保留原文 |
| 3.9 | 04 §8 第 2 条：boot-client 的「必需 / 可选」判定 | [05 §5.2](05-plugin-ecosystem.md) 给出 Client 插件声明的 `inject` / `optional` 字段，但启动审计分级仍未覆盖 | 部分已答，保留原文 |
| 3.10 | 07 §10 第 2 条：jobs 是否存在 wait 型工具 | [02 §1](02-tools-execution.md) 工具清单为 `job_output` / `job_list` / `job_kill`，确认无 wait 工具 | 部分已答，保留原文 |
| 3.11 | 07 §10 第 4 条：spill 文件与 sandbox 的关系 | [02 §4](02-tools-execution.md) 说明 fs 工具受 sandbox 约束，但未覆盖 spill 根目录越界读取 | 部分已答，保留原文 |
| 3.12 | 06 §13 第 2 条：ACP 分帧 | 06 自身 §8 已确认 SDK 侧为 `\n` 分帧，ACP `codec.ts` 仍未逐行确认 | 自答一半，保留原文 |

---

## 4. 重复描述

### 4.1 patch 三层叠加被四篇重述

- **涉及**：总览 §4.1、05 §3.1（权威详述）、06 §3.4（原为第二份完整重述）、03 未涉及。
- **现状**：05 与 06 各写一份层序表，措辞不同（「五档」对「四段」）；总览又写一份简化版。
- **建议**：05 保持唯一权威；总览只留顺序摘要；06 改为「三层语义 + 指回 05」。本轮已把 06 压缩为指向 05 并只保留实现出处。待作者决定是否进一步删减总览。

### 4.2 `$DSH_HOME` 与默认值

- **涉及**：03 §4.1/§5（`$DSH_HOME`、`~/.dsh`、`.credentials.yaml`、`.anonymous-user-id`）、05 §3.1（home 级 patch 路径）、06（profile 路径）、08 §home-paths。
- **问题**：默认值三处一致，但「谁定义 home 路径」没有单一出处，08 的 `home-paths` 才是实现。
- **建议**：08 为权威，其余篇首次出现时指回 08。待作者确认。

### 4.3 checkpoint 被三处描述

- **涉及**：总览 §5.2、§8.1；01 §4.4；07 §9 共享钩子表。
- **现状**：本轮已把总览措辞与 01 对齐；07 仍以「钩子表」形式出现一次。
- **建议**：01 §4.4 为权威，07 只保留钩子名不重复时序。待作者确认。

### 4.4 权限预设规则三处各写一遍

- **涉及**：02 §3.3（表与保留名）、04 §5.1（interaction 表）、07 §2.5（子代理冻结规则）。
- **问题**：02 与 07 都复述了 `sandbox` / `approval` 组合，详略不同；04 的表格又列一次插件映射。
- **建议**：02 为权威，07 只写「子代理的特殊冻结」，04 只写「UI 从哪个服务取值」。待作者确认。

### 4.5 端口 3080 在 06 内重复三次

- **涉及**：06 §2.4（归属）、§11（索引）、§14.2（验证说明）。
- **建议**：§14.2 只保留「未改源码、Desktop 用 `--port 0`」的声明，删掉重复的 3080。待作者确认。

### 4.6 四组「并发数」分散且无对照

- **涉及**：02（原生执行器 10 路/批）、01 §7.3（workflow min(16, cores-2)）、07 §2.3（子代理驻留 8）、07 §5.2（jobs 每 owner 10）。
- **问题**：四个「10/8/16」出现在不同篇，语义层级不同（批次并发 / 脚本派生 / 树内驻留 / 后台作业），单看任一篇都可能误用。
- **建议**：在 07 或 02 增加一张跨篇对照表；本轮仅在报告中说明，不改原文。

---

## 5. 死链复核

对 9 篇逐条解析 `](目标)`，排除 `http(s)` / `mailto:` / 纯锚点，按文档所在目录 resolve 后 `Test-Path -LiteralPath`：

- 修改前：全部通过（06 §14.1 记录的 `native/system/packages/entry/index.ts` 已在早前修正为 `entry/src/index.ts`）。
- 修改后（本文件落盘后的最终复跑，覆盖总览 + `00`~`08` 全部 10 个文件）：**0 死链**。各篇唯一相对链接数为：总览 18、01 56、02 60、03 50、04 31、05 27、06 41、07 51、08 57，与本文件 §6 总表一致；06 的 41 条亦与其 §14.1 自述计数一致。
- 04 §8 原唯一的未通过项 `./00-consistency-review.md` 已随本文件创建而解析成功。
- 本轮新增链接（06 §3.4 的 `profile-context.ts`、`05-plugin-ecosystem.md`，05 §10 的 `profile-context.ts`，03 §9 的 `05` / `08`，总览 §12 的 `05` / `03` / `06`，报告内全部章节互链）均已校验为 `True`。
- 提示：本文件正文用反引号示例写法 `](目标)` 会被朴素正则误判为一条链接，实际是行内代码，非死链；本报告真实相对链接共 16 条，全部通过。

---

## 6. 统计总表

| 文档 | `##` 章节数 | 唯一相对链接数 | 待确认条数 | 本次已核清 |
|---|---:|---:|---:|---:|
| [项目总览](../project-overview.md) | 12 | 18 | 2 | 3 |
| [01 · Agent 运行时](01-agent-runtime.md) | 12 | 56 | 7 | 0 |
| [02 · 工具与执行](02-tools-execution.md) | 9 | 60 | 8 | 0 |
| [03 · 模型与配置](03-models-and-config.md) | 9 | 50 | 8 | 1 |
| [04 · Web 客户端](04-web-client.md) | 8 | 31 | 8 | 1 |
| [05 · 插件生态](05-plugin-ecosystem.md) | 10 | 27 | 6 | 1 |
| [06 · 载体与 SDK](06-hosts-and-sdks.md) | 14 | 41 | 7 | 0 |
| [07 · 协作与调度](07-collaboration-scheduling.md) | 10 | 51 | 6 | 0 |
| [08 · 基础设施](08-infrastructure.md) | 12 | 57 | 6 | 0 |

> 「唯一相对链接数」按去重后的相对路径计；重复出现的同一路径只计一次。「待确认条数」为各篇待确认章节的现存条目数（含已标注「已核」但保留编号的条目）。06 的待确认章节以表格呈现，共 7 行。

---

## 7. 修改记录（只改文档，未改源码）

| # | 文件 | 位置 | 修改内容 |
|---|---|---|---|
| 1 | [06-hosts-and-sdks.md](06-hosts-and-sdks.md) | §3.4 | 修正 patch 层序为 `bundle → profile → home → --patch → telemetry`；出处改为 `profile-context.ts` 70-85 行；加注 `profile-boot.ts` 顶部注释省略 home 层 |
| 2 | [06-hosts-and-sdks.md](06-hosts-and-sdks.md) | §14.1 | 链接计数 39 → 41，补 `05-plugin-ecosystem.md` 与 `profile-context.ts` 两行校验记录 |
| 3 | [project-overview.md](../project-overview.md) | §4.1 | bundle 层合并表述，补第 5 档 telemetry 补丁，标注权威实现位置 |
| 4 | [project-overview.md](../project-overview.md) | §4.2 | Web 载体行补默认绑定 `127.0.0.1:3080` 与覆盖参数，指向 06 §2.4 |
| 5 | [project-overview.md](../project-overview.md) | §5.2 / §8.1 / checkpoint 条目 | 三处 checkpoint 措辞统一为「模型请求前 / 顶层工具执行前 / step 开始前」 |
| 6 | [project-overview.md](../project-overview.md) | §12 | 删除已过期的端口待确认；将端口、experimental 默认值、模型提供方清单移入「已核清」并指路 |
| 7 | [03-models-and-config.md](03-models-and-config.md) | §9 第 5 条 | 埋点非 UI 关闭途径改为已核：`DSH_TELEMETRY_DISABLED`，引用 05 / 08 |
| 8 | [05-plugin-ecosystem.md](05-plugin-ecosystem.md) | §10 第 3 条 | telemetry 补丁注入条件改为已核，附源码行号 |
| 9 | [04-web-client.md](04-web-client.md) | §8 第 7 条 | README 存在性改为已核（链接校验通过） |

**未改、留给作者的条目**：1.1–1.8 的边界切分建议、2.4 的并发口径说明、4.1–4.6 的重复内容合并策略。
