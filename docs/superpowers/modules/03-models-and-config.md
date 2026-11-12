# 03 · 模型接入、配置、凭据与可观测

> 本文是 [项目总览](../project-overview.md) 的模块分册，只覆盖「模型接入 / 配置 / 凭据 / 身份 / 遥测 / typert」这一条纵向链路。> 结论全部来自以下目录的实际代码与包内 README：`packages/llm`、`packages/credentials`、`packages/settings`、`packages/telemetry`、`packages/typert`、`packages/identity`。> 无法从代码直接确认的内容集中放在第 9 节「待确认」，正文不做推测。

## 1. 模块地图

| 目录 | 关键包 | 职责 | 入口 |
|---|---|---|---|
| `packages/llm/llm` | `@deepseek-ai/dsh-llm` | 提供方无关的模型请求 seam：路由注册、调用准备、流式归一、模型目录与发现、失败分类 | [index.ts](../../../packages/llm/llm/src/index.ts) |
| `packages/llm/llm-deepseek` | `@deepseek-ai/dsh-llm-deepseek` | DeepSeek Messages 协议的共享实现：请求构造、SSE、响应翻译、Files API、图片预算 | [adapter.ts](../../../packages/llm/llm-deepseek/src/adapter.ts) |
| `packages/llm/llm-deepseek-api-key` | `@deepseek-ai/dsh-llm-deepseek-api-key` | 以 API Key 凭据接入官方端点，注册路由 `deepseek-official` | [index.ts](../../../packages/llm/llm-deepseek-api-key/src/index.ts) |
| `packages/llm/llm-deepseek-account` | `@deepseek-ai/dsh-llm-deepseek-account` | 以账号 OAuth 凭据接入官方端点，注册路由 `deepseek-account` | [index.ts](../../../packages/llm/llm-deepseek-account/src/index.ts) |
| `packages/llm/llm-pi-ai` | `@deepseek-ai/dsh-llm-pi-ai` | 基于 pi-ai 的通用多提供方适配器，按 settings 中的 provider profile 注册路由 | [index.ts](../../../packages/llm/llm-pi-ai/src/index.ts) |
| `packages/llm/llm-retry` | `@deepseek-ai/dsh-llm-retry` | Agent 失败步骤的重试执行器（外层重试，不是适配器内重试） | [index.ts](../../../packages/llm/llm-retry/src/index.ts) |
| `packages/llm/token-meter` | `@deepseek-ai/dsh-token-meter` | 基于会话事件回放的 token 计量插件 | [index.ts](../../../packages/llm/token-meter/src/index.ts) |
| `packages/llm/deepseek-llm-api-extensions` | `@deepseek-ai/dsh-deepseek-llm-api-extensions` | 官方 DeepSeek 请求顶层字段的扩展注册表 `ctx.deepseekLlmApiExtensions` | [index.ts](../../../packages/llm/deepseek-llm-api-extensions/src/index.ts) |
| `packages/llm/plugin-package-inventory-deepseek` | `@deepseek-ai/dsh-plugin-package-inventory-deepseek` | 向官方请求注入 `dsh_plugin_packages` 活跃包清单 | [index.ts](../../../packages/llm/plugin-package-inventory-deepseek/src/index.ts) |
| `packages/credentials/credentials` | `@deepseek-ai/dsh-credentials` | 凭据服务的抽象接口：引用、解析、存在性查询 | [index.ts](../../../packages/credentials/credentials/src/index.ts) |
| `packages/credentials/credentials-local` | `@deepseek-ai/dsh-credentials-local` | 本地凭据文件实现（`$DSH_HOME/.credentials.yaml`） | [index.ts](../../../packages/credentials/credentials-local/src/index.ts) |
| `packages/settings/settings` | `@deepseek-ai/dsh-settings` | 分层设置：schema、命名空间、用户/项目/会话层合并、密钥角色、脱敏 | [index.ts](../../../packages/settings/settings/src/index.ts) |
| `packages/identity/anonymous-user-id` | `@deepseek-ai/dsh-anonymous-user-id` | 匿名实例标识（不用于账号体系） | [index.ts](../../../packages/identity/anonymous-user-id/src/index.ts) |
| `packages/telemetry/otel` | `@deepseek-ai/dsh-telemetry-otel` | 通用 OpenTelemetry 遥测服务 | [index.ts](../../../packages/telemetry/otel/src/index.ts) |
| `packages/typert/*` | `@deepseek-ai/dsh-typert-*` | 跨进程/跨端类型协议与代码生成工具链 | [registry](../../../packages/typert/registry/README.zh.md) |

关键结论先放在前面：

- **模型接入是「一条路由一个适配器」**。路由名（如 `deepseek-official`、`anthropic`）由适配器注册时声明，调用方只传 `provider + model`，服务据此选适配器。
- **适配器内部不做重试**。一次 `stream()` 就是一次提供方尝试；重试在 Agent 失败的步骤级别由 `dsh-llm-retry` 完成，两者职责分离。
- **凭据与设置严格分层**。`settings` 管「配置值」，`credentials` 管「密钥值」；设置里只允许出现密钥引用（环境变量名 / 凭据引用），真值只存在于凭据存储。
- **遥测是可选装配**：产品埋点默认开启并可单独关闭；会话内容日志必须显式同意后才会上传。

## 2. 模型接入层

### 2.1 分层

```
调用方（agent-loop / 压缩 / 标题生成 / 自动审查 等）
        │  ctx.llm.stream({ provider, model, messages, ... })
        ▼
@deepseek-ai/dsh-llm（LlmRuntime）        ← 提供方无关服务
        │  路由查表 → 取适配器 → adapter.stream(options)
        ▼
适配器（llm-deepseek-* / llm-pi-ai）      ← 协议实现
        │  HTTP / SSE / 供应商 SDK
        ▼
提供方 HTTP API
```

- 服务层负责：路由合法性、模型解析、调用前校验（`prepareCall`）、流式 chunk 归一、失败分类、模型目录与发现事件的广播。
- 适配器层负责：把统一的 `Message[]` 翻译成供应商 wire 格式、解析流式响应、把供应商错误映射成稳定的失败码。

### 2.2 路由注册与适配器契约

适配器继承 `LlmAdapter`，实现三个能力：

| 方法 | 作用 |
|---|---|
| `listModels(provider)` | 返回该路由可见的模型目录（`ModelCatalogEntry[]`） |
| `resolveModel(provider, model)` | 解析单个模型的容量、模态、图像预算等元信息 |
| `stream(options)` | 发起一次流式请求，产出 `StreamChunk` |

注册入口（`LlmService`）：

| 接口 | 用途 |
|---|---|
| `registerAdapter(routes, adapter)` | 一次认领一组路由；返回带 `dispose()` / `replace(routes)` 的句柄 |
| `registerConfigurableProviders(entries)` | 向设置界面暴露「可配置提供方目录」，支持在 settings 中新增自定义路由 |
| `registerModelDiscovery(namespace, discover)` | 允许按路由动态拉取远端模型列表（如 `/models`） |
| `prepareCall(provider, model, signal)` | 在真正发请求前完成配置解析与校验，供 UI/预检使用 |

要点：

- 一个路由只能被一个适配器拥有。重复注册会抛 `DUPLICATE_ADAPTER`；同一适配器重复注册同一组路由是幂等的。
- 注册时捕获**路由集合**与各路由的**重试策略**；配置变化时若路由集合变化必须重新注册（`replace`），仅策略变化可以原地更新。
- 注册成功/变更后广播 `llm/adapters-updated`；模型目录变化广播 `llm/models-updated(provider)`；每次调用触发 `llm/stream` 事件（供日志/遥测旁路观测）。

### 2.3 已确认的内置提供方

| 路由 | 适配器 | 凭据形态 | 说明 |
|---|---|---|---|
| `deepseek-official` | `llm-deepseek-api-key` | API Key（默认环境变量 `DEEPSEEK_API_KEY`） | 官方 DeepSeek，Messages 协议 |
| `deepseek-account` | `llm-deepseek-account` | 账号 OAuth 凭据 | 官方 DeepSeek，账号登录态 |
| 目录提供方 id（如 `anthropic`、`openai`、`google`、`xai`…） | `llm-pi-ai` | 由 profile 的 `apiKeyEnv` 指向的环境变量 | 通过 pi-ai 接入第三方 |
| 自定义路由 | `llm-pi-ai` | 同上 | profile 自带 `api`、`baseURL`、模型目录 |

`llm-pi-ai` 的路由**不是硬编码清单**，而是「已安装 pi-ai 提供方目录 ∪ 当前 settings profile 声明的路由」。判定方式：读取 [provider-data.generated.ts](../../../packages/llm/llm-pi-ai/src/provider-data.generated.ts)，该文件由 pi-ai 目录生成。

当前目录快照共 **42 个提供方**：

```
amazon-bedrock, ant-ling, anthropic, azure, baseten, cerebras,
cloudflare-ai-gateway, cloudflare-workers-ai, deepseek, fireworks,
github-copilot, google, google-vertex, groq, huggingface, kimi-coding,
meta, minimax, minimax-cn, mistral, moonshotai, moonshotai-cn, nvidia,
openai, openai-codex, opencode, opencode-go, openrouter,
qwen-token-plan, qwen-token-plan-cn, qwen-token-plan-individual,
radius, together, typesafe, vercel-ai-gateway, xai, xiaomi,
xiaomi-token-plan-ams, xiaomi-token-plan-cn, xiaomi-token-plan-sgp,
zai, zai-coding-cn
```

其中 `openai-codex` 没有默认环境变量（走 OAuth 登录），其余条目都带有默认 `apiKeyEnv` 与 `baseURL`。

### 2.4 请求与响应转换（DeepSeek Messages 路径）

`llm-deepseek` 是官方协议的唯一实现，`api-key` 与 `account` 两个插件只是「共享实现 + 不同凭据来源」。

请求构造：

1. `GenerateOptions.messages` 已经是「提供方视角」的有序消息（`RequestMessage[]`），由 `dsh-agent-loop` 从会话历史推导；一次性调用可额外传 `system`。
2. 适配器把统一内容块映射成 Messages 内容块：`text` / `reasoning` / `image` / `file` / `tool-call` / `tool-addition` / `tool-removal`。
3. `systemPromptUpdate: 'in-history'` 表示系统提示词随历史消息一起发送；`toolUpdate: 'addition-only'` 表示工具集合只允许增量变更。
4. `reasoningEffort`（`off | low | high | max`）与 `maxTokens` 按「请求显式值 > 模型目录值 > 适配器默认值」解析。
5. 序列化完成后，`ctx.deepseekLlmApiExtensions.prepare(request)` 会把各插件注册的顶层字段（如 `dsh_session_log`、`dsh_plugin_packages`）合并进请求体；字段贡献失败只省略该字段，不阻断请求。

响应转换：

- SSE 事件按行解析（`sse.ts`），忽略心跳与未知事件，保留 `request-id` 等诊断头。
- 内容块生命周期：`block-start → text-delta / reasoning-delta / tool-call-delta → block-end`。
- 用量：`usage` chunk 携带 `TokenUsage`，字段为：

| 字段 | 含义 |
|---|---|
| `inputTokens` | 输入 token |
| `outputTokens` | 输出 token |
| `totalTokens?` | 提供方总计（不可得时省略） |
| `cacheReadTokens?` | 命中缓存的输入 |
| `cacheWriteTokens?` | 写入缓存的输入 |
| `reasoningTokens?` | 思考 token |

- 结束：必定恰好一个 `finish` chunk，`reason ∈ {stop, tool-calls, max-tokens, aborted, error}`，成功时可带 `replayState`（用于重放/审计）。

### 2.5 流式处理

- 服务层对调用方暴露 `AsyncIterable<StreamChunk>`；「一次 stream 调用 = 一次提供方尝试」。
- 适配器必须保证：无论正常结束、取消还是异常，最终都只产生一个终态（`finish` 或抛出失败），不会出现「半截流」。
- 空闲超时：`streamIdleTimeoutMs` 默认 **300000 ms（5 分钟）**，只统计「有未完成读取」的空闲时间，避免长思考被误杀。
- 取消：调用方通过 `AbortSignal` 取消；服务与适配器都必须把取消映射为 `aborted` 终态，而不是错误。

### 2.6 重试、降级与超时

分三层，不要混淆：

| 层 | 位置 | 行为 |
|---|---|---|
| 适配器请求重试 | `retryPolicy`（路由级配置） | 只对可重试的提供方错误生效；默认「normal 模式、5 次重试」；`providerRetryAfterMs` 可覆盖退避 |
| Agent 步骤重试 | `dsh-llm-retry` | 当一步 agent 执行失败时，按指数退避重试整个失败步骤；可通过事件观测与关闭 |
| 模型降级/切换 | 调用方（会话模型选择） | 没有「自动降级到备用模型」的通用机制；切换模型是显式的会话级选择（见第 3 节） |

失败分类（`LlmFailure`，稳定机器码）：

| 码 | 含义 |
|---|---|
| `NO_ADAPTER` | 路由没有适配器 |
| `MISSING_CREDENTIAL` / `INVALID_CREDENTIAL` | 凭据缺失 / 不可用 |
| `AUTH` | 提供方鉴权失败 |
| `RATE_LIMIT` | 限流 |
| `QUOTA` / `ACCOUNT_QUOTA` | 额度耗尽 |
| `CONTEXT_WINDOW_EXCEEDED` | 超出上下文窗口 |
| `IMAGE_OFFLOAD_REQUIRED` | 请求图片超限，需要先卸载最旧的图片 |
| `HTTP_<status>` | 其他 HTTP 失败 |

`LlmFailure` 同时携带 `message`、`status?`、`providerRetryAfterMs?`、`requestId?`，供 UI 与重试策略判断。

### 2.7 token 计量

`dsh-token-meter` 不拦截请求，而是**回放会话事件**统计 token：读取 `usage` 记录、按模型归属汇总，供状态栏/成本展示使用。它与遥测无关，属于本地计算。

## 3. 模型选择与路由

### 3.1 默认模型从哪来

优先级（高 → 低）：

1. **会话/Agent 显式选择**：会话创建或切换时写入的 `provider + model`。
2. **Agent 默认模型服务**：`packages/core/agent-default-model` 提供的默认模型解析（设置项 + 内置回退）。
3. **适配器目录的第一项**（作为最终兜底展示，不是隐式路由）。

内置 DeepSeek 默认目录（`DEFAULT_MODELS`）：

| 模型 id | 展示名 | 上下文 | 输入模态 | 特性 |
|---|---|---:|---|---|
| `deepseek-flash` | DeepSeek-V4.1-Flash | 1,048,576 | text, image | `systemPromptUpdate: in-history`、`toolUpdate: addition-only` |
| `deepseek-v4-pro` | DeepSeek-V4-Pro | 1,048,576 | text | 更强 agentic coding / 难题推理，成本更高 |

`models` 设置可以整体替换该目录；部署方也可以只覆盖容量字段。

### 3.2 能否按场景切换

可以，且是**调用方显式指定**，不是自动路由：

| 场景 | 选择方式 | purpose |
|---|---|---|
| 主对话 | 会话模型 | 省略（普通请求） |
| 上下文压缩 | 压缩插件自身的模型配置 | `compaction` |
| 自动审查 | 审查插件的模型配置 | `auto-review` |
| 会话标题生成 | 标题生成插件 | 专用 purpose（见 `session-title-llm`） |
| 插件主导的辅助调用 | 插件传 `purpose` 字符串 | 由插件自定义 |

`purpose` 会一路透传到适配器与扩展注册表，便于诊断与计费归类；服务本身**不会**因为 `purpose` 改变路由。

### 3.3 模型解析

- `resolveModel(provider, model)` 返回容量与模态；未知模型时使用适配器默认值（DeepSeek：上下文 1,000,000、输出上限 256,000；pi-ai：上下文 1,000,000、输出上限 128,000、模态 `['text']`）。
- 图像能力采用「保守声明」：未声明的模型按纯文本处理，宁可提前拒绝图片，也不让请求在提供方处中途失败。

## 4. 凭据管理

### 4.1 `credentials` 与 `settings` 的职责划分

两个包的分界线是「**引用**」与「**真值**」，代码里写在 [credentials/src/index.ts](../../../packages/credentials/credentials/src/index.ts) 的模块头注释上：

> Settings and composition files carry *references* to secrets — environment-variable names — while providers own the actual values and their storage. Consumers resolve a reference once per operation, so a changed credential reaches the next operation without any plugin restart.

| 维度 | `settings`（`@deepseek-ai/dsh-settings`） | `credentials`（`@deepseek-ai/dsh-credentials`） |
|---|---|---|
| 存放内容 | 普通配置值 + 密钥的**引用**（环境变量名） | 密钥的真值、提供方环境变量、授权 payload |
| 落盘位置 | profile / 用户设置文档 | `$DSH_HOME/.credentials.yaml`（由 local 提供方决定） |
| 跨 wire 行为 | `role('secret')` 字段被剥离，只回传 `{ path, set }` | 只回传 `configured / source / writable / masked`，永不回传值 |
| 变更通知 | `settings/document-updated` | `credentials/reference-updated` / `credentials/record-updated` |
| 生命周期 | 每次读取描述符时合并各层 | 每次操作重新解析，**不跨操作缓存** |

因此「设置里能不能写 API Key」的答案是：设置里只写**变量名**，实际值必须落在凭据存储；设置界面渲染的是一个只写输入框（`RedactedSecret.set` 告诉它「这一格当前有没有值」）。

### 4.2 两个互不重叠的键空间

[types.ts](../../../packages/credentials/credentials/src/types.ts) 用 branded 类型把两者在编译期分开：

| 类型 | 语法 | 语义 | 例子 |
|---|---|---|---|
| `CredentialRef` | POSIX 环境变量名，正则 `^[A-Za-z_][A-Za-z0-9_]*$` | 「按名字取一个密钥」 | `DEEPSEEK_API_KEY` |
| `CredentialKey` | `<scope>/<id>` | 「按所有者寻址一条记录」 | `llm-pi-ai/openai-codex` |

`CredentialKey` 的 `scope` 是**注册的插件名**，不是领域名。代码注释给出的理由很具体：记录 payload 由所有者自定义格式，如果两个插件服务同一个提供方名，就会互相读串；同时 `/` 让两个键空间在语法上不相交，不会碰撞。

配套的字符串工具（同在 `credentials` 包的 `index.ts` 导出）：`credentialRef`、`isCredentialRefName`、`isCredentialKeySegment`、`credentialKey`、`parseCredentialKey`、`credentialKeyScope`、`credentialKeyId`。

### 4.3 服务接口

`ctx.credentials` 是抽象服务（`CredentialProvider extends Service`，服务名 `credentials`），只定义契约，不决定存储：

| 方法 | 作用 |
|---|---|
| `resolve(ref)` | 解析出 `{ value, source }`；未配置时返回空 |
| `describe(ref)` | 返回 `CredentialInfo`（不含值） |
| `set(ref, value)` / `unset(ref)` | 写入 / 移除引用值 |
| `readRecord(key)` | 读出某条记录（所有者自己解释 payload） |
| `describeRecord(key)` | 返回 `CredentialRecordInfo { configured, kind?, writable }` |
| `listRecords()` | 列出 `CredentialRecordEntry { key, kind }` |
| `modifyRecord(key, mutate)` / `deleteRecord(key)` | 读-改-写 / 删除记录 |

两个事件（声明在 `types.ts` 的 `Events` 接口）：

- `credentials/reference-updated(ref)`：`set`、`unset` 或外部编辑被观察到时触发。
- `credentials/record-updated(key)`：记录写入、删除或外部编辑时触发。

两者分开是因为键语法不相交，合并成一个事件会让监听器无法判断主语属于哪个空间。监听器抛错或 reject 会被包含并记录日志，不影响已提交操作的结果。

关键语义：**空存储值等于未配置**。`set` 传空字符串会被拒绝；移除密钥的方式是删除条目，而不是置空。

### 4.4 本地存储：位置、格式、权限

实现方是 [`@deepseek-ai/dsh-credentials-local`](../../../packages/credentials/credentials-local/README.zh.md)。

配置项：

| 字段 | 默认值 | 含义 |
|---|---|---|
| `path` | `<harness home>/.credentials.yaml` | 凭据文件位置 |
| `dshHome` | `$DSH_HOME` 或 `~/.dsh` | `path` 缺省时使用的 home |
| `watch` | `true` | 磁盘变化自动重载 |
| `debounceMs` | `100` | 重载防抖（毫秒） |

文件是带版本的 YAML，只有两个键空间分节：

```yaml
version: 1

refs:
  DEEPSEEK_API_KEY: sk-…

records:
  llm-pi-ai/openai-codex:
    kind: grant
    payload: { type: oauth, access: …, refresh: …, expires: 1786000000000 }
  llm-pi-ai/amazon-bedrock:
    kind: api-key
    env: { AWS_PROFILE: prod }
  llm-pi-ai/amazon-bedrock-dev:
    kind: api-key        # 既无 key 也无 env：所有者确认走环境自身凭据链
```

权限与健壮性：

- 创建时只允许属主访问；POSIX 上**拒绝加载**其他用户可读的文件，错误提示 `chmod 600`。
- Windows 没有可检查的 mode，跳过该检查而不是伪造。
- 未知顶层键保留在磁盘上并告警（只有 `refs` / `records` 会被解析）；非 mapping 根、类型错误、空值、未知记录标签、重复键、坏 YAML 在启动时直接失败；运行期热重载失败则保留最后可用快照并告警。
- 诊断信息只携带错误码与位置，**绝不引用出错行的值**——因为那一行就是机密本身。
- 运行时迁移不执行：只有启动时可把无 `version` 的旧扁平布局就地升级为 `refs:` 结构。

### 4.5 读取流程与优先级

`resolve` / `describe` 按固定顺序查，先有值者胜：

| 优先级 | 来源 | 是否可写 | 说明 |
|---:|---|---|---|
| 1 | 存储文件（`refs`） | 是 | `set`/`unset` 写这里 |
| 2 | 启动时的环境变量 | 否 | 启动器环境**快照**，启动后再 export 不可见 |
| 3 | 项目 `.env`（`<invocation cwd>/.env`） | 否 | |
| 4 | `$DSH_HOME/.env` | 否 | 最后兜底 |

两个容易踩的点：

- 环境层来自启动快照而非 `process.env`，更改环境变量需要重启。
- 由于「保存总是写到胜出层」，`describe` 对引用通常报 `writable: true`，`source` 指明当前由哪一层提供值。

### 4.6 防泄露做了哪些事（字段级）

| 载体 | 是否含真值 | 具体字段 |
|---|---|---|
| `CredentialInfo`（`describe` 返回值） | 否 | `configured: boolean`、`source?: string`、`writable: boolean`、`masked?: string` |
| `CredentialRecordInfo`（`describeRecord`） | 否 | `configured: boolean`、`kind?: 'api-key' \| 'grant'`、`writable: boolean` |
| 设置描述符（`role('secret')` 字段） | 否 | 值被替换为 `undefined`，另附 `RedactedSecret { path: string[], set: boolean }` |
| 错误与诊断 | 否 | 只有错误码 + 位置；不打印值 |
| 配置界面 | 否 | 只写输入框，提交时用 `mutate` 保留未重述的秘密 |

`masked` 的精确规则（`credentials-local` README）：

1. 在**首个** `-` 或 `_` 之后划分「提供商标识」与「密钥部分」；没有分隔符则不划分标识。
2. 只有当密钥部分还剩**至少 8 个隐藏码点**时，才显示「标识 + 前 5 + 后 4」码点。
3. 否则整串遮蔽，**包括标识**。
4. 计数与切片用 `Array.from` 按 Unicode 码点，组合序列不按字素处理。
5. 环境后备值不带 `masked` 字段（只有磁盘存储的值才有脱敏预览）。

脱敏的实现位置是 [settings/src/redact.ts](../../../packages/settings/settings/src/redact.ts)：`redactSecrets(schema, value)` 深度遍历 schemastery 节点，遇到 `meta.role === 'secret'` 就记录路径并返回 `undefined`；覆盖 `object` / `dict` / `array` / `union` / `intersect` / `transform`；union 各分支保守剥离（任一分支声明为 secret 即剥离）；不修改输入对象。远程读取设置时强制 `redactSecrets: true`（见 [docs/subsystems/settings.zh.md](../../subsystems/settings.zh.md) 的 `ctx.settingsController`），因此 `role('secret')` 字段不可能搭乘响应离开 Host。

**诚实的边界**：文件权限无法向 agent 隔离机密。agent 的工具进程以同一 OS 用户运行，读该文件与读用户其他文件没有区别。产品的缓解措施是「不把文件路径交给 agent」「不把密钥载入环境变量」——即要提高门槛必须刻意去读一个没被告知的路径。这是审慎，不是安全边界；需要真正隔离的部署应当换用 OS 钥匙串 / KMS 类提供方（仓库中目前仅有文件提供方，见第 9 节）。

### 4.7 记录：`api-key` 与 `grant`

`CredentialRecord` 是判别联合：

| 类型 | 字段 | 用途 |
|---|---|---|
| `ApiKeyRecord` | `kind: 'api-key'`、`key?: string`、`env?: Readonly<Record<string,string>>` | harness 自己理解的凭据：一个密钥、一组提供方环境变量，或（两者皆空时）所有者确认走环境自身发现链 |
| `GrantRecord` | `kind: 'grant'`、`payload: unknown` | 一次授权的结果，**逐字保留**给所有者；seam 从不读取、校验或改写 payload |

`GrantRecord` 的唯一约束是 payload 必须能经受 JSON 往返（进出两个方向都强制），存储会拒绝无法逐字读回的值。

这正是 `deepseek-account` 这条路由的落地方式：OAuth 授权由 [`@deepseek-ai/dsh-deepseek-account`](../../../packages/llm/llm-deepseek-account/src/index.ts) 自己管理并把结果作为 grant 记录存放，`llm` 层只按路由取用，不解释内容。

## 5. `identity`：匿名实例标识

`packages/identity` 下只有一个包 [`@deepseek-ai/dsh-anonymous-user-id`](../../../packages/identity/anonymous-user-id/README.zh.md)，实现极窄：**一个安装实例一个随机 UUID**。

### 5.1 存储与生成

| 项 | 事实 |
|---|---|
| 文件 | `$DSH_HOME/.anonymous-user-id`（`DSH_HOME` 默认 `~/.dsh`） |
| 内容 | 裸 UUID 一行 |
| 生成 | `crypto.randomUUID()`，**绝不派生**自硬件、账号或路径 |
| 记忆化 | 按解析后的路径记忆化，同步可用 |
| 并发 | `wx` 独占创建；落败方重新读取已有值 |
| 损坏 | 内容不可解析时重新生成并覆盖 |
| 写失败 | 仍返回进程内可用 id（best-effort 持久化，不阻断启动） |

### 5.2 外发用途（同一 id，三处）

1. 会话遥测的 OTel Resource `user.id`。
2. 反馈提交的确认信息。
3. 发往 DeepSeek 的请求头 `x-deepseek-harness-user-id`。

### 5.3 身份 / 账号 / 租户边界

- **没有多租户模型**。`identity` 目录里不存在组织、租户、工作区、成员等概念；代码中也没有租户隔离逻辑。
- **没有账号体系**。这里只有「匿名安装实例 id」。真正的账号身份以 **DeepSeek 账号 OAuth 凭据**的形式存在，属于 `llm-deepseek-account` + 凭据存储，不属于 `identity`。
- 因此边界是「安装实例」：删除该文件即更换身份；不同 `DSH_HOME` 之间不共享 id，也无法跨 home 关联。
- 该 id 是随机的、不可反查的，但它本身是**稳定标识符**——同一 home 的所有外发都带同一个值，这一点在隐私评估时应当如实计入。

## 6. `telemetry`：采集什么、发到哪、怎么关

### 6.1 四层结构

| 层次 | 包 | 角色 |
|---|---|---|
| 通用服务 | [`@deepseek-ai/dsh-telemetry-otel`](../../../packages/telemetry/otel/README.zh.md) | 创建 `event` / `session-log` 两条独立通道（各自 exporter、Resource、scope、队列） |
| 产品埋点导出 | [`@deepseek-ai/dsh-host-product-telemetry-otel`](../../../packages/host/product-telemetry-otel/README.zh.md) | 把 `ProductTelemetryRecord` 发到产品 OTLP 端点 |
| 产品埋点采集 | [`@deepseek-ai/dsh-client-product-analytics`](../../../packages/client/product-analytics/README.zh.md) | 桌面端采集器，产出上面的记录 |
| 会话内容日志 | [`@deepseek-ai/dsh-session-telemetry-otel`](../../../packages/session/session-telemetry-otel/README.zh.md) | 显式同意后上传会话事件 |

`dsh-telemetry-otel` 本身**不采集任何东西**：没有部署默认端点、不安装全局 OTel provider、不记录 exporter/processor 自身的观测指标；Header 必须显式提供，不继承环境里的授权头或 TLS 身份。服务名与版本由调用方必填。

### 6.2 产品埋点：字段级清单

每条记录是 `ProductTelemetryRecord`：事件名 + 字符串 body + Unix 毫秒时间戳；属性只允许标量或单层对象。

**每条事件都带**：

| 字段 | 内容 |
|---|---|
| `device_id` | 设备标识 |
| `user_id` | 匿名实例 id（第 5 节的 UUID） |
| `app_version` | 应用版本 |

**环境静态字段**（首次接收时采样一次并缓存）：

| 字段 | 说明 |
|---|---|
| `os_name` / `os_version` / `os_version_full` / `os_build` | 操作系统 |
| `os_arch` / `app_arch` | 系统架构、应用架构 |
| `cpu_model` / `cpu_logical_count` / `cpu_physical_core_count` | CPU |
| `memory_total_bytes` | 总内存 |
| `missing_fields` | 采不到的字段清单，格式 `field=reason`，reason ∈ `unavailable` / `invalid-value` / `query-failed` / `timeout` / `output-limit` / `unsupported` |

采样超时 5000 ms、输出上限 16384 字节。

**明确排除**：API key、账户令牌、提示词、模型回复、主机名、机器 UUID。

**交互与业务字段**：`msg_type`（`default` / `queue` / `steer`）、显式思考强度、`run_mode`、`is_new_session`、`agent_preset`（`creator` / `ptc` / `minimal` / `standard` / `other`）、`plugin_type`（`plugin` / `bundle`）、`is_success`、`error_reason`（`user_cancelled` / `unknown_result`）。

`input_value` 会做粗粒度脱敏，退化为 `[git]` / `[url]` / `[path-or-other]` 三类占位；按钮位置上报 `position`（`sidebar` / `sidebar_more` / `titlebar`）。

**上报目标**：

- `endpoint` 默认 `https://dsh-otel-collector.deepseeksvc.com/v1/logs`
- `channel` 默认 `dsh_otel_report`，作为 `x-channel` 请求头发送（这是该通道唯一的自定义头）

**队列与超时**：`maxExportBatchSize` 512、`maxQueueSize` 2048、`scheduledDelayMillis` 30000、`timeoutMillis` 15000、`exportTimeoutMillis` 20000、`shutdownTimeoutMillis` 21000。已知限制：纯内存队列、无持久 outbox、无入仓确认。

### 6.3 产品埋点的开关

- 桌面端默认启用；Web 客户端**不装配**该插件。
- 开关是 settings 命名空间 `product-analytics` 的 `enabled`，默认 `true`，**当前没有用户可操作的 UI 入口**（README 原文：无用户操作入口）。
- 关闭后的行为：停止新采集与身份读取；已入队事件仍可能继续导出；渲染进程后续发送失败会直接丢弃。

### 6.4 会话遥测：默认只上传反馈

[会话遥测包](../../../packages/session/session-telemetry-otel/README.zh.md) 的共享级别只有两档：

| 模式 | 行为 |
|---|---|
| `FEEDBACK_ONLY`（默认） | 只有**新的显式反馈授权**才会触发上传 |
| `DISABLED` | 完全不构造传输通道 |

代码明确拒绝 `FULL`（全量上传模式不存在）。上报的 `sharing` 属性取值是 `feedback-only` 或 `disabled`。

**字段级**：

| 位置 | 内容 |
|---|---|
| `eventName` | 固定 `session-log` |
| `attributes.sessionId` | 会话 id |
| `attributes.content` | 完整事件 envelope + 脱敏后的 `event.data` JSON 字符串 |
| 保留键 | `session.id`、`event.seq`、`event.type` |
| OTel Resource | 应用名/版本 + 匿名 `user.id`（第 5 节的 UUID） |
| OTel scope | 包名与版本 |

授权规则：只认**新的**显式反馈；父子会话之间不继承授权；模型请求、请求头、会话创建/恢复、HMR 都不构成捕获授权；直接调用 `ctx.sessionTelemetry.emit()` 在任何模式下都是空操作。

**上报目标**：默认同样是 `https://dsh-otel-collector.deepseeksvc.com/v1/logs`，可被 `DSH_TELEMETRY_OTLP_URL` 覆盖；该通道**不隐式添加** channel 头。

**传输参数**：`shutdownTimeoutMillis` 默认 3000；`maxRequestBytes` 默认 4,000,000（只能调低）；processor 默认队列 2048、单请求最多 512 条、调度延迟 1000 ms、请求监测期限 30000 ms。关闭期限到达会丢弃剩余队列，在途请求可能完成，所以大前缀可能只发出一部分——这是评估「反馈里到底传了什么」时必须知道的偏差。

### 6.5 关闭方式一览

| 目标 | 做法 | 生效范围 |
|---|---|---|
| 停产品埋点 | `product-analytics` 命名空间的 `enabled = false` | 桌面端；已入队事件仍可能导出 |
| 停会话内容上传 | 不授予反馈授权，或把共享级别设为 `DISABLED` | 会话遥测通道完全不存在 |
| 改上报端点 | `DSH_TELEMETRY_OTLP_URL`（会话通道）；产品埋点走插件 `endpoint` 配置 | 分别生效 |
| 不装配 | 组合中不加载对应插件 | 最彻底 |

## 7. `typert` 的实际作用

`packages/typert` 不是业务模块，而是**跨进程类型安全 RPC 的代码生成与运行时注册工具链**。它解决的问题是：Host 侧（Node）与 Client 侧（浏览器/渲染进程）各自编译，如何保证同一个 `ctx.remote.*` 方法在两侧的签名、schema 与调用约定完全一致。

### 7.1 四个包

| 包 | 名称 | 职责 |
|---|---|---|
| [protocol](../../../packages/typert/protocol/package.json) | `@deepseek-ai/dsh-typert-protocol` | 与编译器无关的 Remote 元数据与 Typert provider 协议（纯类型 + zod） |
| [registry](../../../packages/typert/registry/package.json) | `@deepseek-ai/dsh-typert-registry` | 运行期注册表：生成的包反射信息与 Zod schema 的落点，带 client 出口 |
| [generator](../../../packages/typert/generator/package.json) | `@deepseek-ai/dsh-typert-generator` | TypeScript 工程分析 + 模型驱动的产物生成器，提供 tsdown 插件 |
| [loader](../../../packages/typert/loader/package.json) | `@deepseek-ai/dsh-typert-loader` | 把生成的 Typert 贡献接入 Cordis Loader |

### 7.2 关键类型

| 类型 | 关键字段 | 说明 |
|---|---|---|
| `TypertLookupDefinition` | `key`、`parameter`、`wire`、`hostTypeSymbol`、`wireTypeSymbol` | 一个「按 key 查表」的定义单元 |
| `TypertLookupMap` / `TypertContextMap` | — | 声明合并入口，业务包靠 `declare module` 补充自己的能力 |
| `InvocationDescriptor` | `id`、`service`、`namespace`、`method`、`implementation?`、`mode?: 'stream'`、`invocation` | 一次远程调用的完整描述 |
| `TypertCodec` | strict（带 `typeSymbol`，可选 `encode`/`decode` 处理字节）与 `src-json` | 值在 wire 上的编解码约定 |
| `TypertSchema` | — | 只保证解析能力；读元数据/schema 不会发起网络调用 |

两条约束值得单独记：

1. **请求只发送 endpoint 与具名 `args`**，实现细节不上 wire。
2. **取消不进 `args`**，而是走带外 carrier signal——避免把控制信号混进业务参数，也避免两侧对 `args` 形状产生分歧。

### 7.3 生成产物入口

业务包通过三个出口消费生成结果：`./typert`、`./remote`、`./client/typert`。它们分别对应「Host 侧反射信息」「Remote 契约声明」「Client 侧调用桩」。`mode: 'stream'` 的 descriptor 对应流式方法，其余为一次性请求。

对本分册而言，`ctx.remote.settings`、`ctx.remote.credentials` 这些远程命名空间就是 typert 生成的产物——这也解释了为什么设置读取可以强制 `redactSecrets: true`：脱敏是 Host 侧实现的，Client 拿到的类型里根本没有「密钥值」这一位。

## 8. 关键接口 / 类型 / 文件索引

### 8.1 `packages/llm`

| 文件 | 职责 |
|---|---|
| [llm/src/index.ts](../../../packages/llm/llm/src/index.ts) | `LlmRuntime` / `LlmService`：路由注册（`registerAdapter` / `registerConfigurableProviders` / `registerModelDiscovery`）、`prepareCall`、事件广播 |
| [llm/src/types.ts](../../../packages/llm/llm/src/types.ts) | `StreamChunk` 各变体、`FinishReasonMap`、`TokenUsage`、`GenerateOptions`、`LlmCallControls`、失败码 |
| [llm/src/retry-policy.ts](../../../packages/llm/llm/src/retry-policy.ts) | 路由级 `retryPolicy` 的默认值与判定 |
| [llm/src/error.ts](../../../packages/llm/llm/src/error.ts) | `LlmFailure` 构造与分类 |
| [llm/src/call-config.ts](../../../packages/llm/llm/src/call-config.ts) | `PrepareCall` / `ConfigureCall`：纯函数、请求前校验、深冻结 controls |
| [llm-deepseek/src/adapter.ts](../../../packages/llm/llm-deepseek/src/adapter.ts) | DeepSeek Messages 适配器主体 |
| [llm-deepseek/src/sse.ts](../../../packages/llm/llm-deepseek/src/sse.ts) | SSE 逐行解析与事件归一 |
| [llm-deepseek/src/models.ts](../../../packages/llm/llm-deepseek/src/models.ts) / [defaults.ts](../../../packages/llm/llm-deepseek/src/defaults.ts) | 官方模型目录与默认容量 |
| [llm-deepseek-api-key/src/index.ts](../../../packages/llm/llm-deepseek-api-key/src/index.ts) | 注册路由 `deepseek-official` |
| [llm-deepseek-account/src/index.ts](../../../packages/llm/llm-deepseek-account/src/index.ts) | 注册路由 `deepseek-account` |
| [llm-pi-ai/src/index.ts](../../../packages/llm/llm-pi-ai/src/index.ts) / [provider.ts](../../../packages/llm/llm-pi-ai/src/provider.ts) | pi-ai 通用适配器与提供方封装 |
| [llm-pi-ai/src/provider-data.generated.ts](../../../packages/llm/llm-pi-ai/src/provider-data.generated.ts) | 构建期生成的提供方清单（第 2.3 节 42 项的来源） |
| [llm-retry/README.zh.md](../../../packages/llm/llm-retry/README.zh.md) | Agent 步骤级重试 |
| [token-meter/README.zh.md](../../../packages/llm/token-meter/README.zh.md) | 事件回放式 token 计量 |

### 8.2 `packages/credentials` / `packages/settings`

| 文件 | 职责 |
|---|---|
| [credentials/src/index.ts](../../../packages/credentials/credentials/src/index.ts) | 凭据服务抽象 + 键构造工具 + 事件声明 |
| [credentials/src/types.ts](../../../packages/credentials/credentials/src/types.ts) | `CredentialRef`、`CredentialKey`、`ApiKeyRecord`、`GrantRecord`、`CredentialInfo` |
| [credentials-local/src/index.ts](../../../packages/credentials/credentials-local/src/index.ts) | 文件提供方：层解析、严格解析、写锁、watcher、权限检查 |
| [settings/src/index.ts](../../../packages/settings/settings/src/index.ts) | `SettingsForms`：`configure` / `describe` / `update` / `replace` / `mutate` |
| [settings/src/redact.ts](../../../packages/settings/settings/src/redact.ts) | `redactSecrets`、`RedactedSecret`、`RedactedValue` |
| [docs/subsystems/credentials.zh.md](../../subsystems/credentials.zh.md) / [settings.zh.md](../../subsystems/settings.zh.md) | 子系统级参考 |

### 8.3 `packages/identity` / `packages/telemetry`

| 文件 | 职责 |
|---|---|
| [identity/anonymous-user-id/src/index.ts](../../../packages/identity/anonymous-user-id/src/index.ts) | 匿名 UUID 的读取、生成、持久化 |
| [telemetry/otel/src/index.ts](../../../packages/telemetry/otel/src/index.ts) | `ctx.otel.createEventReporter` / `createSessionLogReporter` |
| [telemetry/otel/src/event-log.ts](../../../packages/telemetry/otel/src/event-log.ts) / [session-log.ts](../../../packages/telemetry/otel/src/session-log.ts) | 两条通道各自的 reporter |
| [telemetry/otel/src/transport.ts](../../../packages/telemetry/otel/src/transport.ts) | OTLP 传输与环境头处理 |
| [host/product-telemetry-otel/src/index.ts](../../../packages/host/product-telemetry-otel/src/index.ts) | `ctx.productTelemetry.emit` 实现 |
| [docs/subsystems/otel.zh.md](../../subsystems/otel.zh.md) / [product-telemetry.zh.md](../../subsystems/product-telemetry.zh.md) / [session-telemetry.zh.md](../../subsystems/session-telemetry.zh.md) | 子系统级参考 |

## 9. 待确认

以下内容无法从当前代码静态确认，或需要按版本复核：

1. **pi-ai 提供方清单的时效性**。第 2.3 节的 42 项是 `provider-data.generated.ts` 的当前快照，该文件由构建期从 pi-ai 目录生成；升级 pi-ai 后数量与名称会变化。判定方式不变：运行时可用路由 = 已安装 pi-ai 提供方目录 ∪ 当前 settings profile 声明的自定义路由。
2. **各路由的 `retryPolicy` 差异**。已确认存在默认的 normal 模式（5 次重试）与 `providerRetryAfterMs` 覆盖机制，但未逐个适配器核对是否存在自定义策略。
3. **`streamIdleTimeoutMs` 的取值**。DeepSeek 适配器默认 300000 ms；包内 README 另提到过更短的「空闲提示」阈值，两者是否为同一参数尚未核实。
4. **`x-deepseek-harness-user-id` 的发送覆盖面**。已确认这是匿名 id 的三处用途之一，但未确认是否所有官方端点请求都携带、以及是否可关闭。
5. ~~产品埋点是否提供任何非 UI 的关闭途径（如环境变量）~~ —— **已核（跨分册）**：`DSH_TELEMETRY_DISABLED` 非空即可，`app-boot` 的 `readProfilePatches()` 会跳过 telemetry 补丁；仓库的文档部署 workflow 即以 `DSH_TELEMETRY_DISABLED=1` 运行（见 [05 §3.1](./05-plugin-ecosystem.md)、[08 §8](./08-infrastructure.md)）。
6. **租户/账号体系**。`packages/identity` 中不存在多租户或组织模型；若产品层在别处实现，本分册未覆盖。
7. **OS 钥匙串 / KMS 类凭据提供方**。`credentials-local` 的 README 将其列为延后项，仓库中目前只有文件提供方。
8. **遥测端点的部署归属与留存策略**。代码只给出默认 URL 与超时/批量参数，不包含服务端留存期限。
