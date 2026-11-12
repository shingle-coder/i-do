# apps 与 snapshots 文件职责盘点

> 对应清单：`docs/superpowers/inventory/apps.tsv`（1,611 行）、`docs/superpowers/inventory/snapshots.tsv`（1,974 行）。 > 本文只做记录与判断，不修改任何被盘点文件。

## 标注规则

| 标注 | 含义 |
|---|---|
| 精读 | 完整读过该文件的实现主体，或读完全部导出符号并确认调用关系 |
| 结构判断 | 只读了文件头注释、导出符号名与所在目录；职责由命名和调用点推断，未逐行确认 |
| 待确认 | 现有证据不足以给出可靠结论，需后续核对 |

补充约定：

- 行数为清单记录的物理行数；二进制与资源文件标 `—`。
- "职责"一句话说明这个文件解决什么问题，不复述文件名。
- 同一机制的 `.mjs` 实现 + `.d.mts` 类型声明合并为一行（声明文件不单独占行），行数取实现文件。
- 测试的 `expected/`、`fixtures/`、`__snapshots__/` 作为测试资产归组说明，不逐文件展开。
- 本文不评价代码质量，只记录职责；发现的可疑点集中在文末"异常项"。

## 一、总览

| 应用 | 文件数 | 说明 |
|---|---:|---|
| `apps/desktop` | 698 | Electron 桌面壳 + Windows 安装器 + macOS/Windows 打包、签名、发布工具链 + 更新器 |
| `apps/web` | 673 | 浏览器端应用（源码只有 4 个文件，主体在 `packages/`），测试资产占绝大多数 |
| `apps/cli` | 203 | `dsh` 命令行入口与 profile 启动、配置导出、插件管理 |
| `apps/plugin-market-generator` | 20 | 生成插件市场索引的独立命令行工具 |
| `apps/desktop-host` | 17 | 桌面安装包内置的私有 Host：把 Web 应用拉起来并把 URL 交给 Electron |
| 合计 | 1,611 | 与清单行数一致 |

---

## 二、apps/desktop

### 2.1 根目录

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `main.ts`（src，见 2.9） | — | — | — |
| `package.json` | 95 | 结构判断 | 桌面包元数据、脚本入口与 Electron 相关依赖声明 |
| `tsconfig.json` | 11 | 结构判断 | 解决方案式引用，分别指向 host 与 client 两套编译配置 |
| `tsconfig.host.json` | 54 | 结构判断 | 主进程/预加载（Node）侧编译目标与类型范围 |
| `tsconfig.client.json` | 26 | 结构判断 | 欢迎窗口渲染层（DOM/React）编译配置 |
| `tsdown.config.ts` | 113 | 结构判断 | 用 tsdown 打包主进程与各 preload 入口，产出 CJS/ESM 组合 |
| `electron-builder.config.mjs` | 5 | 结构判断 | 仅从 `scripts/electron-builder-config.mjs` 再导出，保持根配置发现路径 |
| `electron-builder.config.d.mts` | 85 | 结构判断 | 上者的类型声明，描述 `PRODUCT_NAME` 等导出契约 |
| `.env.windows` | 12 | 结构判断 | 本机 Windows 打包用的实际环境变量文件（示例之外的本地副本） |
| `.env.windows.example` | 47 | 结构判断 | Windows 打包环境变量样例：签名、发布目标、策略开关 |
| `.env.macos.example` | 62 | 结构判断 | macOS 打包环境变量样例：签名身份、公证、渠道 |
| `README.md` / `README.zh.md` | 407 | 结构判断 | 桌面端架构、打包、发布与更新机制的完整说明（中英同构） |
| `README.i18n.yaml` | 79 | 结构判断 | 中英 README 的翻译配对清单，供校验脚本使用 |

### 2.2 config（环境与发布模板）

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `config/windows-packaging/production.env.example` | 9 | 结构判断 | Windows 正式渠道的签名/发布变量模板 |
| `config/windows-packaging/test.env.example` | 15 | 结构判断 | Windows 测试渠道变量模板 |
| `config/windows-packaging/windows-signing.env.example` | 7 | 结构判断 | 仅签名环节所需的证书与时间戳服务变量 |
| `config/macos-packaging/production.env.example` | 10 | 结构判断 | macOS 正式渠道签名与公证变量模板 |
| `config/macos-packaging/test.env.example` | 15 | 结构判断 | macOS 测试渠道变量模板 |
| `config/macos-packaging/macos-signing.env.example` | 9 | 结构判断 | 仅签名/公证环节的证书、App Store Connect 凭据模板 |
| `config/publishing/windows/production.json.example` | 12 | 结构判断 | Windows 正式发布目标（对象存储、渠道元数据）示例 |
| `config/publishing/windows/test.json.example` | 8 | 结构判断 | Windows 测试发布目标示例 |
| `config/publishing/macos/production.json.example` | 13 | 结构判断 | macOS 正式发布目标示例 |
| `config/publishing/macos/test.json.example` | 9 | 结构判断 | macOS 测试发布目标示例 |

### 2.3 cli 与 windows-signing（薄封装与文档）

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `cli/dsh` | 14 | 结构判断 | POSIX 下转调安装包内 `dsh` 可执行文件的启动脚本 |
| `cli/dsh.cmd` | 5 | 结构判断 | Windows 下等价启动脚本 |
| `cli/link-entry.c` | 18 | 结构判断 | 供命令链接安装使用的小型 C 入口，避免依赖 shell 解析 |
| `windows-signing/README.md` / `.zh.md` | 127 | 结构判断 | Windows 代码签名方案、证书缓存与故障处理说明 |
| `windows-signing/README.i18n.yaml` | 46 | 结构判断 | 上述文档的翻译配对清单 |

### 2.4 resources（品牌与托盘资源）

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `resources/icon.svg` / `icon.png` | 33 / — | 结构判断 | 应用主图标矢量源与导出位图 |
| `resources/icon-macos.svg` / `.png` | 33 / — | 结构判断 | macOS 规格（圆角安全边距）图标源与导出位图 |
| `resources/icon-windows.svg` / `.png` | 33 / — | 结构判断 | Windows 规格图标源与导出位图 |
| `resources/tray-windows.ico` | — | 结构判断 | Windows 托盘多尺寸 ICO |

### 2.5 renderer（独立渲染文档）

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `renderer/welcome.html` | 17 | 结构判断 | 原生欢迎窗口的 HTML 容器，挂载 React 渲染层 |
| `renderer/welcome.css` | 343 | 结构判断 | 欢迎窗口完整样式（含深浅色与平台差异） |
| `renderer/assets/welcome-brand.svg` | 26 | 结构判断 | 欢迎页品牌标识 |
| `renderer/assets/window-material.css` | 11 | 结构判断 | 窗口材质（半透明/毛玻璃）变量定义 |
| `renderer/shell-theme.js` | 6 | 结构判断 | 把主题标记写入根元素，供所有渲染文档共享 |
| `renderer/policy-login-loading.html` | 48 | 结构判断 | 策略登录页加载态，避免白屏 |
| `renderer/update-dialog.html` / `.css` / `.js` | 24 / 42 / 61 | 结构判断 | 可选更新的独立确认对话框：结构、样式、交互 |
| `renderer/update-close.svg` | 8 | 结构判断 | 对话框关闭图标 |
| `renderer/mandatory-update.html` / `.css` / `.js` | 40 / 19 / 118 | 结构判断 | 强制更新阻断页：不可跳过的提示、下载与重试 |
| `renderer/mandatory-update-frame.js` | 42 | 结构判断 | 在强制更新页与主进程之间转发不含业务权限的窗口消息 |

### 2.6 installer（Windows 安装器）

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `installer/pages.nsh` | 386 | 结构判断 | NSIS 自定义页面序列（目录选择、进度、完成、重启提示） |
| `installer/path.nsh` | 169 | 结构判断 | 安装目录解析、合法性与占用校验 |
| `installer/theme.nsh` | 97 | 结构判断 | 安装器视觉主题（颜色、字体、控件度量） |
| `installer/drawing.nsh` | 120 | 结构判断 | 安装器自绘控件与背景绘制宏 |
| `installer/lifecycle.nsh` | 90 | 结构判断 | 安装/升级/卸载生命周期钩子与旧版本处理 |
| `installer/uninstall.nsh` | 36 | 结构判断 | 卸载流程入口与注册表清理 |
| `installer/extract.h` | 104 | 结构判断 | 解压阶段的 C 侧接口声明 |
| `installer/extract-report.h` | 331 | 结构判断 | 解压进度与失败诊断上报 |
| `installer/progress.h` | 61 | 结构判断 | 进度条状态机接口 |
| `installer/restart-banner.h` / `restart-status.h` / `restart-text.h` | 131 / 147 / 62 | 结构判断 | 重启提示横幅、状态与文案的 C 侧实现 |
| `installer/directory-report.h` | 25 | 结构判断 | 目录选择结果的诊断输出 |
| `installer/uninstall-data.h` | 167 | 结构判断 | 卸载时用户数据保留/清理策略 |
| `installer/window-frame.cpp` | 454 | 结构判断 | 无边框安装器窗口的 C++ 实现（命中、拖拽、绘制） |
| `installer/locales/*.json`（8 种语言） | 41 各 | 结构判断 | 安装器界面文案，8 语言同结构 |
| `installer/assets/brand*.png` | — | 结构判断 | 安装器品牌图（深浅色、2x） |
| `installer/assets/uninstaller-sidebar.png` | — | 结构判断 | 卸载器侧栏插图 |

### 2.7 publishing（发布说明）

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `publishing/README.md` / `.zh.md` | 94 | 结构判断 | 桌面产物发布流程、渠道与回滚说明 |
| `publishing/README.i18n.yaml` | 37 | 结构判断 | 翻译配对清单 |
| `publishing/ci/README.md` / `.zh.md` | 128 | 结构判断 | CI 中发布/保留/回滚流水线的操作说明 |
| `publishing/ci/README.i18n.yaml` | 40 | 结构判断 | 翻译配对清单 |

### 2.8 docs/diagnostics

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `docs/diagnostics/README.md` / `.zh.md` | 76 | 结构判断 | 桌面崩溃与启动失败的诊断信息采集说明 |
| `docs/diagnostics/README.i18n.yaml` | 28 | 结构判断 | 翻译配对清单 |

### 2.9 src（Electron 主进程、preload、欢迎窗口）

超过 500 行的文件先给结构说明，再进入总表。

- `src/main.ts`（1,619 行）：进程级编排。结构为：顶部单例/日志/崩溃恢复初始化 → 一批启动期辅助函数（`currentDesktopLocale`、`quitWithoutConfirmation`、`persistCrashReport`、`reportFatal`、`runtimeResources`、`developmentPrimaryRuntime`、`chromeFallbackFill`、`platformLoginUrl`）→ `createWindow` 统一创建主/欢迎/平台窗口 → 巨型 `main()`（约 1,200 行）按序完成单实例、profile 初始化、Host 启动、窗口与 IPC 注册、托盘、更新调度 → 末尾 `claimDesktopSingleInstance` 兜底聚焦。
- `src/locale.ts`（1,606 行）：8 套语言字典（en/zh/ja/es/fr/de/ru/pt，各约 190 行）加 `dictionaries` 映射，再导出 `resolveDesktopLocale`、`resolveDesktopStartupLocale`、`formatDesktopMessage`、`desktopUpdateReadyConfirmation`。类型安全靠字典同构而非 schema。

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `src/main.ts` | 1,619 | 精读（结构） | Electron 壳的总装配：窗口、协议、单实例、托盘、Host 生命周期与更新入口 |
| `src/locale.ts` | 1,606 | 精读（结构） | 桌面壳全部静态文案的类型化多语言字典与本地化消息格式化 |
| `src/host-process.ts` | 382 | 精读 | 以 Node 模式子进程拉起共享 Web 应用（Host），并管理其退出与重启 |
| `src/host-protocol.ts` | 4 | 结构判断 | Desktop 与 Host 之间协议版本/发布元数据常量 |
| `src/backend-controller.ts` | 157 | 结构判断 | 独立于窗口的后端启停所有权，保证停服时进入静默状态 |
| `src/account-backend.ts` | 138 | 结构判断 | 原生账号命令与 Gateway 状态流；凭据不下发渲染层 |
| `src/platform-view.ts` | 273 | 结构判断 | 受账号生命周期约束的隔离 Platform 文档视图 |
| `src/preload-app.ts` | 135 | 结构判断 | 主窗口 preload：按来源限定启动能力、目录选择、文件路径与更新确认 |
| `src/preload-browser.ts` | 32 | 结构判断 | 侧栏浏览器的租约式操作与单窗口事件订阅 |
| `src/preload-menu.ts` | 113 | 结构判断 | Windows 标题栏菜单文案与原生弹出锚点，与 Web 客户端隔离 |
| `src/preload-platform.ts` | 33 | 结构判断 | 在文档根标记平台标识，供共享 Web 样式做桌面专属作用域 |
| `src/preload-platform-account.ts` | 45 | 结构判断 | 平台初始化时一次性注入凭据；token 读取不再走 IPC |
| `src/preload-theme.ts` | 34 | 结构判断 | 把 Web 主题源同步到 Electron 原生主题（标题栏、登录页） |
| `src/preload-windows.ts` | 62 | 结构判断 | 让 Windows 右键菜单与标题栏配色跟随文档状态 |
| `src/preload-welcome.ts` | 29 | 结构判断 | 欢迎窗口的本地化文案与只写凭据动作 |
| `src/preload-mandatory.ts` / `preload-mandatory-overlay.ts` | 16 / 85 | 结构判断 | 强制更新弹窗的独立桥接，以及在主窗口内容区挂载该文档 |
| `src/preload-update-dialog.ts` | 14 | 结构判断 | 可选更新对话框的只读响应桥 |
| `src/ipc.ts` | 128 | 结构判断 | 以类型化通道收口 Electron 壳对外暴露的全部操作 |
| `src/platform-ipc.ts` | 12 | 结构判断 | Platform 桥的通道名共享常量 |
| `src/mandatory-update-ipc.ts` | 4 | 结构判断 | 免依赖的强制更新通道名，供沙箱化 preload 复用 |
| `src/mandatory-update-policy.ts` | 240 | 结构判断 | 强制更新判定与本地业务流量解耦的策略计算 |
| `src/mandatory-update-window.ts` | 411 | 结构判断 | 壳所有的阻断式策略窗口；仅显式操作才授权下载或跳转 |
| `src/update-coordinator.ts` | 287 | 结构判断 | 用户授权后的单版本下载与独立安装编排 |
| `src/update-schedule.ts` | 105 | 结构判断 | 普通更新源轮询，与策略查询、用户授权传输分离 |
| `src/update-settings.ts` | 52 | 结构判断 | 按渠道给出默认值与失败策略，写入共享壳设置 |
| `src/update-configuration.ts` | 45 | 结构判断 | 把更新设置读取失败归类为可展示的安全提示 |
| `src/update-channel.ts` | 18 | 结构判断 | 从已安装清单解析出封存的更新渠道 |
| `src/update-dialog.ts` | 195 | 结构判断 | 主进程持有的可选更新确认；关闭或替换对话框不等于同意安装 |
| `src/update-window.ts` | 34 | 结构判断 | 更新确认前的原生窗口准备（可中断 Host） |
| `src/update-overlay.ts` | 83 | 结构判断 | 更新文档与宿主窗口共享原生窗口与输入生命周期 |
| `src/update-presentation.ts` | 58 | 结构判断 | 供 Web 本地化的可选更新状态指示提供语义内容 |
| `src/update-error.ts` | 29 | 结构判断 | 更新准备失败的本地化文案与诊断分栏展示 |
| `src/update-journal.ts` | 74 | 结构判断 | 安装目录之外的择机资格取证，不含原始诊断或请求数据 |
| `src/update-attention.ts` | 74 | 结构判断 | 尽力而为的后台提示，不授予更新或中止任务权限 |
| `src/update-cleanup-log.ts` | 29 | 结构判断 | 记录未能删除的过期更新文件的诊断 |
| `src/updates/electron-updater/channel.ts` | 14 | 结构判断 | 在 electron-updater 设置渠道之后施加的渠道策略 |
| `src/updates/electron-updater/discard.ts` | 62 | 结构判断 | 仅在自有检查与下载落定后回收 electron-updater 6.x 目标 |
| `src/updates/electron-updater/http-executor.ts` | 53 | 结构判断 | 检查、全量下载与 blockmap 的 Electron 原生空闲超时 |
| `src/runtime-tree.ts` | 239 | 结构判断 | 随桌面版本携带的可迁移、带完整性记录的运行时包树 |
| `src/release.ts` | 35 | 结构判断 | 壳与内置 dsh 运行时共享的不可变版本标识 |
| `src/core-package-set.ts` | 183 | 结构判断 | 提供 Desktop 自有 dsh 运行时与私有 Host 的已签名本地 npm 包集合 |
| `src/project-manager.ts` | 175 | 结构判断 | Desktop profile 初始化与原生故障恢复 |
| `src/settings.ts` | 26 | 结构判断 | 可选壳偏好的启动期策略，独立于 Host |
| `src/settings-file.ts` | 166 | 结构判断 | 共享壳设置文件读写；读到无副作用，单字段失败互不影响 |
| `src/keybindings.ts` | 27 | 结构判断 | 设备本地快捷键偏好，写入经单一串行协调器 |
| `src/keyboard.ts` | 261 | 结构判断 | 窗口级快捷键 IPC 与物理按键派发/录制期间的原生菜单拦截 |
| `src/locale-cache.ts` | 38 | 结构判断 | 最近一次确认的壳语言，Host 起不来时仍可用 |
| `src/paths.ts` | 22 | 结构判断 | Electron 管理的桌面安装各路径归属 |
| `src/duration-env.ts` | 16 | 结构判断 | 从进程环境读取毫秒级时长设置 |
| `src/device-info.ts` | 34 | 结构判断 | 随反馈问卷上报的本机描述信息 |
| `src/client-metadata.ts` | 29 | 结构判断 | 单次 Platform 账号调用使用的桌面客户端标识 |
| `src/single-instance.ts` | 26 | 结构判断 | 在任何 profile 生命周期开始前抢占单实例所有权 |
| `src/background-notice.ts` | 56 | 结构判断 | 首次隐藏到托盘前的 Windows 一次性确认 |
| `src/tray.ts` | 48 | 结构判断 | Windows 托盘：隐藏窗口的常驻入口与显式退出 |
| `src/quit-confirmation.ts` | 96 | 结构判断 | 原生退出确认；仅当 Host 报告无可中断工作才静默退出 |
| `src/fatal-recovery.ts` | 148 | 结构判断 | 单个桌面进程首次致命失败的原生恢复 |
| `src/startup-error.ts` | 13 | 结构判断 | 可序列化的桌面启动失败诊断 |
| `src/crash-report.ts` | 189 | 结构判断 | 崩溃报告收集与落盘；主进程在致命路径调用（上传链路待确认） |
| `src/operation-history.ts` | 120 | 结构判断 | 桌面自有插件操作历史的有界、可取消读取 |
| `src/operation-journal.ts` | 208 | 结构判断 | 已投影操作诊断的单壳有界持久化 |
| `src/operation-report.ts` | 62 | 结构判断 | 仅在独立基础报告生成后追加的尽力而为操作历史 |
| `src/operation-report-job.ts` | 106 | 结构判断 | 辅助报告 worker 的生命周期（完成含 worker 退出） |
| `src/operation-report-worker.ts` | 36 | 结构判断 | 隔离的辅助报告 I/O，壳负责终止并观察退出 |
| `src/browser-guests.ts` | 170 | 结构判断 | 侧栏 webview 访客的主进程所有权与固定隔离策略 |
| `src/web-document.ts` | 113 | 结构判断 | 本地 Web 文档与带认证的 HTTP 转发 |
| `src/welcome-window.ts` | 132 | 结构判断 | 原生欢迎窗口及其仅展示渲染层的承载 |
| `src/welcome-backend.ts` | 159 | 结构判断 | 欢迎流程的原生操作，复用 Web 认证与 RPC |
| `src/welcome-api.ts` | 75 | 结构判断 | 暴露给隔离欢迎渲染层的操作集合 |
| `src/client/welcome.tsx` | 19 | 结构判断 | 在 Electron 显示欢迎窗口前挂载本地 React 渲染层 |
| `src/client/WelcomePage.tsx` | 225 | 结构判断 | 欢迎页展示层；账号与凭据操作留在 preload |
| `src/client/styles.d.ts` | 2 | 结构判断 | 欢迎渲染层引用的样式表模块声明 |
| `src/command-installation.ts` | 268 | 结构判断 | 可逆的命令链接所有权；不跟随也不覆盖被改动的命令条目 |
| `src/command-management.ts` | 239 | 结构判断 | 原生命令管理对话框；仅固定安装位置进入 worker |
| `src/command-manager-entry.ts` | 46 | 结构判断 | 私有命令管理 worker；macOS 变更目标在提权前固定 |
| `src/owned-directory.ts` | 26 | 结构判断 | 事务清理时只解链目录链接、不进入目标 |
| `src/directory-picker.ts` | 30 | 结构判断 | 本地渲染层可用的工作目录选择对话框 |
| `src/file-actions.ts` | 192 | 结构判断 | 可信窗口的 Chromium 下载与剪贴板兜底读取 |
| `src/file-drag.ts` | 167 | 结构判断 | 仅对产品主框架与活动 Host 授权的原生复制拖拽 |
| `src/file-drag-files.ts` | 121 | 结构判断 | 应用自有的临时导出与获授权借用文件的原生拖拽载体 |
| `src/microphone-permissions.ts` | 31 | 结构判断 | 麦克风权限仅归主应用框架与操作系统 |
| `src/login-shell-environment.ts` | 185 | 结构判断 | POSIX 下登录 shell 环境继承，补齐会话管理器未带入的变量 |
| `src/node-environment.ts` | 18 | 结构判断 | Electron Node 模式启动，私有启动器仅限包安装场景 |
| `src/policy-test-auth.ts` | 159 | 结构判断 | 显式配置的测试策略请求所需的进程级隔离 Feishu Cookie |
| `src/windows-layout.ts` | 4 | 结构判断 | Windows 主窗口标题栏的共享几何常量 |

### 2.10 scripts（195 个文件）

桌面壳的构建、打包、签名、公证、上传、发布、回滚与资格测试工具链。此处按子系统分表，`.mjs` + `.d.mts` 已合并；所有条目均为 `结构判断`（依据文件头注释与命名）。

#### 2.10.1 构建与打包编排

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `package-target.ts` | 571 | 结构判断 | 单个发布目标的完整打包流程：按目标平台组织 Electron 与 `dsh` 架构匹配的产物。结构：目标定义与参数校验 → 运行时准备 → 主包/资源装配 → 平台后处理（macOS 双份签名应用、Windows NSIS）→ 产物校验与清单输出。 |
| `electron-builder-config.mjs` | 288 | 结构判断 | electron-builder 配置工厂，按目标平台生成 files/asar/extraResources 等段落 |
| `package-macos.ts` | 136 | 结构判断 | 从两份独立签名的应用副本分别产出 ZIP 与 DMG |
| `packaging-run.mjs` | 180 | 结构判断 | 持久化脱敏后的打包证据，并负责终止本次打包拥有的子进程 |
| `packaging-step.mjs` | 49 | 结构判断 | 把进程内阶段与 Apple 工具阶段写入同一份打包日志 |
| `prepare-package-set.ts` | 200 | 结构判断 | 挑选并复制本地 npm tarball 闭包，供桌面运行时使用 |
| `pack-local-packages.ts` | 28 | 结构判断 | 为未签名的本地桌面构建准备本地品牌的 DSH 包 |
| `prepare-dsh.ts` | 197 | 结构判断 | 发布前物化完整生产运行时 |
| `prepare-runtime.ts` | 78 | 结构判断 | 准备桌面资源并在各步骤完成后发布其版本信息 |
| `prepare-primary-runtime.ts` | 35 | 结构判断 | 解析桌面资源位置，并做带签名感知的校验 |
| `prepare-runtime-manifests.ts` | 26 | 结构判断 | 在序列化前应用 electron-builder 的依赖元数据清理 |
| `prepare-runtime-patches.ts` | 125 | 结构判断 | 暂存显式选定的桌面补丁，且不修改工作区 |
| `prepare-cli.ts` | 17 | 结构判断 | 打包复用已安装 Electron 的终端启动脚本 |
| `prepare-command-link.ts` | 21 | 结构判断 | 构建用于精确路径命令软链安装的 macOS 辅助程序 |
| `runtime-file-policy.ts` | 48 | 结构判断 | 定义已安装生产 npm 包在桌面上需要省略的文件 |
| `runtime-patch-policy.ts` | 29 | 结构判断 | 选择工作区与运行时专用依赖的桌面侧策略 |
| `windows-asar-unpack.mjs` | 70 | 结构判断 | 让准备好的 Windows PE 文件留在 ASAR 之外，且不改变上游布局 |
| `windows-directory-installer.mjs` | 98 | 结构判断 | 改造固定版本 NSIS 模板，以暂存并重命名完整应用目录 |
| `windows-package-settings.mjs` | 23 | 结构判断 | 解析 Windows 打包并发度与归档压缩方式 |
| `installer-locales.mjs` | 77 | 结构判断 | 按语言加载 NSIS 打包、原生界面共用的 JSON 文案资源 |
| `installer.nsh` | 260 | 结构判断 | Windows 安装器主脚本：安装、升级、卸载与快捷方式写入 |
| `installer-directories.nsh` | 224 | 结构判断 | 安装目录选择与目录结构约定的 NSIS 宏集合 |
| `restart-banner.nsh` | 26 | 结构判断 | 安装器重启提示条的原生界面片段 |
| `macos-entitlements.plist` | 14 | 结构判断 | macOS 应用签名所需的能力声明 |
| `jit-entitlements.plist` | 3 | 结构判断 | JIT 相关的最小 entitlements 集合 |
| `node-x64-entitlements.plist` | 3 | 结构判断 | x64 Node 运行时的 entitlements |
| `node-bin/node`、`node-bin/node.cmd` | 3/3 | 结构判断 | 指向 Electron 内嵌 Node 的 POSIX / Windows 启动垫片 |
| `render-tray-icon.ts` | 123 | 结构判断 | 按主题与平台渲染托盘图标资源 |

#### 2.10.2 版本、环境与配置解析

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `desktop-auto-update-environment.mjs` | 211 | 结构判断 | 解析桌面自动更新渠道与其腾讯 COS 目标 |
| `desktop-build-commit.mjs` | 57 | 结构判断 | 记录构建来源提交，以及检出是否带未提交改动 |
| `desktop-build-paths.mjs` | 128 | 结构判断 | 解析目标专属的桌面输出目录与共享下载/包缓存 |
| `desktop-build-version.mjs` | 104 | 结构判断 | 在一次打包上传流程中携带构建版本的环境变量契约 |
| `desktop-build-version-discovery.ts` | 156 | 结构判断 | 从仓库与 CI 环境推导构建版本 |
| `desktop-bundle-imports.mjs` | 90 | 结构判断 | 声明桌面包可留给运行时解析的裸模块说明符 |
| `desktop-ci-version.mjs` | 35 | 结构判断 | 为手动桌面 CI 构建解析版本，不触碰发布存储 |
| `desktop-file-settings.mjs` | 40 | 结构判断 | 读取文件自有的打包设置，且不加载打包依赖 |
| `desktop-package-environment.mjs` | 158 | 结构判断 | 在不加载打包依赖的前提下选择本地测试默认值或平台发布设置 |
| `desktop-policy-environment.mjs` | 44 | 结构判断 | 从与部署相同的来源解析强制更新策略服务地址 |
| `desktop-release-environment.mjs` | 121 | 结构判断 | 解析打包环境提供的公开发布标识 |
| `desktop-toolchain-preflight.ts` | 102 | 结构判断 | 打包前检查工具链是否满足目标平台要求 |
| `prepare-macos-ci.mjs` | 28 | 结构判断 | 校验机器自有的 macOS 签名设置并记录清单 |
| `prepare-windows-ci.mjs` | 30 | 结构判断 | 解析手动 Windows 构建版本并校验所选设置 |
| `read-desktop-app-key.mjs` | 14 | 结构判断 | 在 Environment 之后把机器 App key 交给 token action |

#### 2.10.3 发布、上传与渠道运营

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `desktop-upload-plan.ts` | 300 | 结构判断 | 在任何网络请求前校验打包后的更新产物与上传计划 |
| `desktop-upload-run.ts` | 126 | 结构判断 | 为测试与生产上传生成可持久化、不含凭据的证据 |
| `desktop-publish.ts` | 132 | 结构判断 | 通过比对对象字节恢复中断的桌面发布 |
| `desktop-publish-config.ts` | 46 | 结构判断 | 独立于上传与发布读取公开部署设置 |
| `desktop-publish-cos.ts` | 83 | 结构判断 | 可续传桌面发布的 COS 传输层，鉴权由调用方负责 |
| `desktop-publish-record.ts` | 133 | 结构判断 | 机器本地渠道互斥与持久、无凭据的发布记录 |
| `desktop-publish-route.ts` | 70 | 结构判断 | 校验打包任务成功并路由到发布动作 |
| `desktop-publish-tag.ts` | 71 | 结构判断 | 使用显式提供的提交创建不可变桌面发布标签 |
| `desktop-publish-targets.ts` | 18 | 结构判断 | 已批准的打包工作流与机器发布目标清单 |
| `desktop-publish-qualification.mjs` | 15 | 结构判断 | 说明被保留的调试包为何不能进入任一发布通道 |
| `desktop-publication-failure.ts` | 61 | 结构判断 | 发布诊断与时长统计共用的安全失败详情 |
| `desktop-publication-summary.ts` | 81 | 结构判断 | 为 GitHub 原生部署界面渲染已验证的发布计划 |
| `desktop-cos.ts` | 54 | 结构判断 | 桌面更新对象共用的腾讯 COS 客户端构造 |
| `cos-operation.ts` | 44 | 结构判断 | 单次资格 COS 操作的总超时与请求清理 |
| `desktop-edgeone.ts` | 73 | 结构判断 | 提交一次生产固定安装包缓存刷新到 EdgeOne |
| `desktop-purge-recovery.ts` | 149 | 结构判断 | 在结果不明时恢复固定 URL 缓存刷新，且不重复提交 |
| `desktop-release-store.ts` | 158 | 结构判断 | 在一次性 runner 之外保留不可变的桌面构建文件 |
| `desktop-release-tag.ts` | 80 | 结构判断 | 发布标签相关校验与标签内容生成 |
| `desktop-rollback.ts` | 58 | 结构判断 | 在不重传二进制的前提下恢复历史更新源 |
| `desktop-rollout.ts` | 127 | 结构判断 | 只修改已发布桌面包的灰度百分比 |
| `desktop-website-installer.ts` | 116 | 结构判断 | 校验一个生产安装包并在上传期间持有其文件句柄 |
| `upload-target.ts` | 177 | 结构判断 | 上传桌面产物到 COS 并刷新生产固定下载地址 |
| `retain-desktop-ci.ts` | 99 | 结构判断 | 保留已完成的 CI 包，供后续手动发布 |
| `archive-desktop-ci.ts` | 49 | 结构判断 | 生成经验证的安装包 ZIP 并把路径交给 Actions 上传步骤 |
| `resolve-desktop-publish-ci.ts` | 86 | 结构判断 | 选出一次成功打包尝试及其原始运行记录 |
| `resolve-retained-desktop-publish-ci.ts` | 64 | 结构判断 | 从原机器的保留记录中解析发布设置 |
| `publish-desktop-ci.ts` | 140 | 结构判断 | 发布由准备作业选出的保留包 |
| `publish-desktop-rollout-ci.ts` | 136 | 结构判断 | 提升已发布桌面包灰度比例的 Actions 入口 |
| `publish-website-ci.ts` | 130 | 结构判断 | 可独立恢复的官网安装包上传 Actions 入口 |
| `preflight-desktop-publish.mjs` | 47 | 结构判断 | 在安装发布依赖前拒绝可识别的调试产物 |
| `preflight-desktop-publish-local.mjs` | 43 | 结构判断 | 在依赖安装前拒绝缺失的本地发布配置 |
| `verify-retained-desktop.ts` | 45 | 结构判断 | 重新校验保留安装包的签名，不执行它们 |
| `verify-published-windows.ps1` | 16 | 结构判断 | 对已发布 Windows 产物做签名与完整性抽查 |
| `upload-with-credentials.ps1` | 152 | 结构判断 | 带凭据的上传包装脚本 |

#### 2.10.4 Windows 签名与证书缓存

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `windows-sign.mjs` | 328 | 结构判断 | Windows 签名主流程：提交文件、等待结果并核验签名。结构：签名工具调用封装 → 超时与重试 → 结果解析 → 失败分类。 |
| `windows-sign.cmd` | 17 | 结构判断 | 调用签名工具的 Windows 批处理入口 |
| `windows-signature-batch.mjs` | 57 | 结构判断 | 有界的公钥校验批次，每一行输出都必须可验证 |
| `windows-signature-cache.mjs` | 220 | 结构判断 | 缓存完整已签名文件；条目损坏时中止调用方 |
| `windows-signature-cache-directory.mjs` | 38 | 结构判断 | 解析并校验当前账户共享的运行时签名缓存目录 |
| `windows-signature-cache-directory.ps1` | 40 | 结构判断 | 缓存目录的 PowerShell 侧查询与迁移辅助 |
| `manage-windows-signature-cache.mjs` | 28 | 结构判断 | 当前账户下的缓存迁移与存储检查 |
| `windows-runtime-signature.mjs` | 199 | 结构判断 | 检查运行时签名并保留字节一致的副本 |
| `windows-signing-stage.mjs` | 62 | 结构判断 | 串行化完整的签名与缓存维护阶段 |
| `windows-signing-state.mjs` | 49 | 结构判断 | 持久化按用户的硬件签名互斥状态 |
| `windows-timestamp.mjs` | 107 | 结构判断 | 在隔离副本上补时间戳，且不重复校验 |
| `sign-primary-runtime.ts` | 96 | 结构判断 | 在执行前签名 Windows 运行时，保留厂商原始签名 |
| `windows-token-identity.ts` | 87 | 结构判断 | 在不提供 PIN、不调用硬件的情况下比对 CSP 公钥材料 |
| `windows-token-public-key.cs` + `.ps1` | 94/4 | 结构判断 | 通过既有 SafeNet CSP 只读取公钥材料 |

#### 2.10.5 macOS 签名与公证

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `macos-notarization-proxy.ts` | 223 | 结构判断 | 打包期间临时把 Apple 工具流量切到可用的 macOS 代理 |
| `verify-macos-signature.mjs` | 214 | 结构判断 | 签名运行时并验证打包产物携带预期签名 |
| `macos-signature-cache.ts` | 121 | 结构判断 | 按文件内容与证书复用已验证的独立签名 |
| `macos-signature-cache-directory.mjs` | 38 | 结构判断 | 解析可选的机器自有签名存储位置 |
| `macos-cache-policy.ts` | 61 | 结构判断 | 把可复用的精简 Mach-O 签名绑定到实际证书 |
| `macos-signing-keychain.mjs` | 85 | 结构判断 | 为一次打包持有临时 PKCS#12 签名身份 |
| `macos-runtime.ts` | 102 | 结构判断 | 在外层桌面应用签名前先签最终原生运行时文件 |
| `macos-app-update-config.mjs` | 91 | 结构判断 | 写入并校验封装进 macOS 应用的更新源配置 |
| `macos-package-settings.mjs` | 52 | 结构判断 | 解析文件自有的 macOS 并发度与分阶段代理设置 |
| `macos-runner-service.sh` | 61 | 结构判断 | macOS 打包 runner 的服务包装脚本 |
| `logged-notarytool.mjs` | 87 | 结构判断 | 把 electron-notarize 的提交/等待拆成可分别计时的两步 |
| `notarize-macos.mjs` | 15 | 结构判断 | 保留 electron-notarize 签名检查与 stapling 的包装 |
| `notarize-macos-disk-images.mjs` | 30 | 结构判断 | 在 electron-builder 之后对 macOS 磁盘映像做公证与资格校验 |

#### 2.10.6 已安装更新（installed-update）资格链

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `installed-update-qualification.ts` | 278 | 结构判断 | 操作员资格材料的本地分配与日志检查 |
| `installed-update-publication.ts` | 217 | 结构判断 | 把不可变资格上传与显式授权的发布分开 |
| `installed-update-package-content.ts` | 125 | 结构判断 | 从解压后的安装包核验身份与更新配置 |
| `installed-update-packaging.ts` | 122 | 结构判断 | 监督一次显式确认的资格构建 |
| `installed-update-cos.ts` | 112 | 结构判断 | 固定的测试 COS 传输；写权限由调用方另行授权 |
| `installed-update-signature.mjs` | 77 | 结构判断 | 在不调用 SignTool 的前提下校验给定可执行文件 |
| `installed-update-distribution.ts` | 74 | 结构判断 | 校验本地资格载荷字节并准备独立分发 |
| `installed-update-builder.ts` | 40 | 结构判断 | 在不削弱正常构建的前提下选择隔离的资格输入 |
| `installed-update-identity.mjs` | 27 | 结构判断 | 在产出前只配置资格包的运行身份 |
| `installed-update-network.ps1` | 89 | 结构判断 | 已安装更新资格用的网络故障注入脚本 |
| `package-installed-update.ts` | 30 | 结构判断 | 仅操作员可用的已签名打包入口，默认不启动安装 |
| `prepare-installed-update.ts` | 60 | 结构判断 | 分配资格材料或检查日志 |
| `prepare-installed-update-application.ts` | 95 | 结构判断 | 冻结构建出的 main、preload、renderer 与 bootstrap |
| `prepare-installed-update-bootstrap.ts` | 29 | 结构判断 | 准备不启动应用的不可变按运行引导文件 |
| `prepare-installed-update-network.ts` | 62 | 结构判断 | 为一次操作员自有的防火墙故障做准备 |
| `prepare-installed-update-runtime.ts` | 71 | 结构判断 | 把已验证运行时复制进隔离的版本绑定资格目录 |
| `publish-installed-update.ts` | 40 | 结构判断 | 分离测试二进制上传与固定更新源的操作员入口 |
| `verify-installed-update-package.ts` | 125 | 结构判断 | 校验已签名安装包字节并解出其载荷 |
| `build-installed-update-worker.mjs` | 29 | 结构判断 | 内部构建子进程，依赖父进程版本绑定的打包记录 |

#### 2.10.7 冒烟、手工验证与运行时校验

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `smoke-runtime.ts` | 239 | 结构判断 | 在没有用户数据的前提下启动物化后的目标运行时 |
| `smoke-packaged-runtime.ts` | 23 | 结构判断 | 校验装配后的应用，包含原生 Office 组件 |
| `smoke-prepared-runtime.ts` | 49 | 结构判断 | 用私有原生缓存与 Harness 检查载荷与 Host 启动 |
| `smoke-windows.ps1` | 57 | 结构判断 | Windows 冒烟入口脚本 |
| `smoke-installer-directories.ps1` | 169 | 结构判断 | 安装目录行为的冒烟验证 |
| `test-host-updates.ts` | 54 | 结构判断 | 在私有开发环境中运行已构建的 Host 任务保护逻辑 |
| `test-local-updater.mjs` | 38 | 结构判断 | 用真实 Electron 下载验证已构建的更新协调器 |
| `test-signed-updates.mjs` | 72 | 结构判断 | 从本地可执行输入发起真实 Electron 下载 |
| `test-update-channels.mjs` | 29 | 结构判断 | 用 Electron 与固定版本验证渠道切换 |
| `test-windows-installer.mjs` | 154 | 结构判断 | 走生产 NSIS 流程构建隔离的原生载荷 |
| `test-windows-update-signature.mjs` | 80 | 结构判断 | 用给定文件做真实 NSIS 发布者验证 |
| `test-workspace-updates.ts` | 81 | 结构判断 | 在私有应用中运行编译后的 Electron 主入口 |
| `verify-runtime-archive.ts` | 53 | 结构判断 | 用 ASAR 记录校验运行时字节与可执行位 |
| `command-path.ps1` | 150 | 结构判断 | 命令查找路径的 PowerShell 探测脚本 |

#### 2.10.8 Windows runner 与本地开发

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `dev.ts` | 130 | 结构判断 | 构建并启动未打包的 Electron 壳，连接当前工作区 |
| `development-app.ts` | 85 | 结构判断 | 加载当前工作区的 macOS 开发应用包 |
| `development-project.ts` | 169 | 结构判断 | 准备未打包开发所需的临时 npm 工程视图 |
| `flock-entry.ts` | 94 | 结构判断 | 首次使用时加载 POSIX flock 入口，避免拖慢打包入口 |
| `windows-runner-launcher.cs` | 75 | 结构判断 | 编译为 GUI 程序，使任务计划程序不弹出控制台窗口 |
| `windows-runner-task.ps1` | 138 | 结构判断 | Windows runner 的计划任务注册与执行 |
| `windows-runner-network.ps1` | 80 | 结构判断 | Windows runner 的网络代理配置 |
| `run-windows-runner-task.ps1` | 36 | 结构判断 | 以任务方式运行 runner |
| `run-windows-runner-network-process.ps1` | 138 | 结构判断 | 以独立进程运行 runner 网络包装 |
| `windows-packaging-priority.ps1` | 59 | 结构判断 | 提升打包进程优先级 |
| `setup-windows-packaging.ps1` | 49 | 结构判断 | Windows 打包机器的初始化 |
| `setup-macos-packaging.mjs` | 34 | 结构判断 | 准备私有机器目录与模板，不注册凭据 |
| `start-macos-packaging-runner.sh` | 42 | 结构判断 | 启动 macOS 打包 runner |
| `start-windows-packaging-runner.ps1` | 42 | 结构判断 | 启动 Windows 打包 runner |
| `prepare-windows-installer.ps1` | 86 | 结构判断 | 准备 Windows 安装器构建所需的输入 |

### 2.11 tests（327 个文件）

213 个根目录测试文件按被测对象归组如下；59 个 `expected/`、32 个 `fixtures/`、8 个 `updates/`、9 个 `installed-update/`、3 个 `signing-concurrency/`、2 个 `helpers/`、1 个 `__snapshots__/` 另表说明。分组内的文件未逐个展开，代表文件列只列能定位主题的样本。

| 主题 | 文件数 | 代表文件与说明 |
|---|---:|---|
| 更新协调与更新界面 | 16 | `update-coordinator.spec.ts`(451)、`update-dialog.spec.ts`(269)、`update-error-renderer.spec.ts`(301)、`update-schedule.spec.ts`(186)、`mandatory-update-window.spec.ts`(429)、`mandatory-update-policy.spec.ts`(222)，覆盖渠道切换、调度、日志、丢弃、呈现与强制更新窗口 |
| 已安装更新资格 | 12 | `installed-update-qualification.spec.ts`(254)、`installed-update-package-content.spec.ts`(272)、`installed-update-cos.spec.ts`(204)、`installed-update-publication.spec.ts`(179)，与 2.10.6 的脚本一一对应 |
| 发布、上传与渠道运营 | 26 | `desktop-upload-plan.spec.ts`(359)、`desktop-rollout.spec.ts`(408)、`desktop-upload-run.spec.ts`(204)、`upload-target.spec.ts`(145)、`upload-with-credentials.spec.ts`(152)、`desktop-publish-*.spec.ts`(8 个)，覆盖预检、路由、标签、记录、回滚、缓存刷新 |
| 签名、公证与时间戳 | 30 | `windows-sign.spec.ts`(397)、`primary-runtime-signing.spec.ts`(342)、`macos-signature.spec.ts`(300)、`macos-notarization-proxy.spec.ts`(273)、`windows-signature-cache.spec.ts`(269)、`windows-signing-experiment.spec.ts`(288)、`windows-signing-concurrency.spec.ts`(235)，另含 `windows-signing-concurrency.perf.ts`(209) |
| 打包与运行时准备 | 28 | `package-target-stages.spec.ts`(424)、`package-target.spec.ts`(159)、`runtime-preparation.spec.ts`(213)、`prepare-package-set.spec.ts`(164)、`runtime-tree.spec.ts`(130)、`pack-local-packages.spec.ts`(125)，覆盖目标阶段、包集、补丁、清单与运行时文件策略 |
| 主进程壳层 | 38 | `main-startup.spec.ts`(3145)、`platform-view.spec.ts`(515)、`host-process.spec.ts`(363)、`fatal-recovery.spec.ts`(351)、`project-manager.spec.ts`(332)、`keyboard.spec.ts`(830)、`settings-file.spec.ts`(222)，覆盖启动、单实例、托盘、退出确认、设置与本地化 |
| preload 与隔离层 | 8 | `preload-app.spec.ts`(313)、`preload-menu.client.spec.ts`(143)、`preload-mandatory-overlay.spec.ts`(105)、`preload.e2e.ts`(92)、`platform-preload.e2e.ts`(83)，按 preload 分层各一条 |
| 欢迎流程 | 6 | `welcome-renderer.client.spec.tsx`(343)、`welcome-startup.spec.ts`(312)、`welcome-window.spec.ts`(210)、`welcome-flow.e2e.ts`(151)、`welcome-host.spec.ts`(127) |
| 命令安装与管理 | 4 | `command-installation.spec.ts`(271)、`command-manager-flow.spec.ts`(162)、`command-management.spec.ts`(39)、`command-path.spec.ts`(24) |
| 文件与目录操作 | 7 | `file-actions.spec.ts`(213)、`file-drag.spec.ts`(165)、`file-drag-release.spec.ts`(93)、`file-drag-files.spec.ts`(67)、`shell-file-selection.spec.ts`(110)、`directory-picker.spec.ts`(82)、`owned-directory.spec.ts`(53) |
| Windows 安装器与平台细节 | 14 | `windows-asar-unpack.spec.ts`(373)、`installer-packaging.spec.ts`(127)、`windows-package-preset.spec.ts`(125)、`installer-locales.spec.ts`(77)、`windows-cli-signals.spec.ts`(79)、`windows-pty-exit.spec.ts`(15)，以及 7 个 `.cpp`/`.ps1` 原生界面与冒烟脚本（`windows-installer-smoke.ps1` 277、`windows-installer-ui.ps1` 258） |
| 账号、后端与运维 | 20 | `account-backend.spec.ts`(103)、`backend-controller.spec.ts`(175)、`crash-report.spec.ts`(117)、`operation-history.spec.ts`(172)、`operation-journal.spec.ts`(115)、`policy-test-auth.spec.ts`(177)、`login-shell-environment.spec.ts`(187)、`flock-entry.spec.ts`(114)、`development-project.spec.ts`(125)、`cli-launcher.spec.ts`(87) |
| 构建环境与版本解析 | 9 | `desktop-package-environment.spec.ts`(390)、`desktop-package-selection.spec.ts`(159)、`desktop-build-version-discovery.spec.ts`(92)、`desktop-bundle-imports.spec.ts`(121)、`desktop-auto-update-environment.spec.ts`(140) |
| 冒烟与内置资源 | 6 | `office-resources.e2e.ts`(100)、`installed-docs-asar.built.e2e.ts`(93)、`acl-skill.built.e2e.ts`(78)、`cua-optional-package.spec.ts`(133)、`ptc-runtime.spec.ts`(50)、`packaged-runtime-verification.spec.ts`(63) |
| 其余单点测试 | 5 | `device-info`、`keybindings`、`locale`、`locale-cache`、`settings`、`shell-theme`、`single-instance`、`tray`、`tray-icon`、`web-document`、`node-environment`、`microphone-permissions`、`profile-mcp`、`quit-confirmation` 等未被上述主题吸收的条目 |

测试资产：

| 目录 | 文件数 | 说明 |
|---|---:|---|
| `expected/` | 59 | golden 文本/JSON：菜单与命令的 en-US/zh-CN 文案、fatal 对话框、发布计划 Markdown、COS 拒绝响应、稳定版/测试版上传清单、欢迎页 10 种状态的终端文本、`windows-installer.json`、`windows-uninstall.json` |
| `fixtures/` | 32 | 假更新服务器（`update-server.mjs`、`artifact-update-server.mjs`）、`local-updater.mjs`(390)、`workspace-updates.mjs`(437)、`workspace-update-host.mjs`、`host-update-qualification.mjs`(206)、NSIS 故障注入脚本、`windows-token-public-key-fake.cs` |
| `updates/electron-updater/` | 8 | 记录 electron-updater 已验证版本的清单与升级脚本（`qualification.mjs` 140、`versions.mjs` 53、`verified-versions.json`，另 3 个 README） |
| `installed-update/` | 9 | 资格链操作手册（3 组 README × 中英 + i18n 配置），非测试代码 |
| `signing-concurrency/` | 3 | 签名并发实验的操作说明（README 三件套） |
| `helpers/` | 2 | `windows-signing-corpus.ts`(52)、`windows-signing-experiment.ts`(70)，签名实验的被测代码集 |
| `__snapshots__/` | 1 | `preload-menu.client.spec.ts.snap`(5)，菜单结构快照 |

### 2.12 desktop-host（17 个文件）

`apps/desktop-host` 是安装包里内置的私有 Host 进程：它按 Node 模式启动共享 Web 应用，把监听 URL 与生命周期交回 Electron。

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `src/index.ts` | 151 | 精读 | Host 主流程：解析启动参数、装配平台会话与诊断、拉起 Web 服务并把 URL 回报给父进程。 |
| `src/cli.ts` | 43 | 结构判断 | 宿主命令行参数解析入口。 |
| `src/fatal-diagnostic.ts` | 59 | 结构判断 | 宿主启动失败时的结构化诊断输出。 |
| `src/operation-diagnostics.ts` | 34 | 结构判断 | 把操作状态汇总为可上报的诊断快照。 |
| `src/platform-session.ts` | 36 | 结构判断 | 宿主视角的平台会话状态持有。 |
| `src/quit-inspection.ts` | 40 | 结构判断 | 退出前检查是否存在阻止退出的活动任务。 |
| `src/update-tasks.ts` | 62 | 结构判断 | 宿主侧更新任务的登记与保护。 |
| `src/file-drag.ts` | 64 | 结构判断 | 宿主进程内的文件拖拽授权判断。 |
| `src/windows-cli-signals.ts` | 23 | 结构判断 | Windows 控制台信号的接管与转发。 |
| `tests/*.spec.ts`（5 个） | 435 | 结构判断 | 与上述模块一一对应的单元测试（`fatal-diagnostic` 105、`file-drag` 82、`operation-diagnostics` 41、`platform-session` 104、`quit-inspection` 103）。 |
| `package.json`、`tsconfig.json`、`tsdown.config.ts` | 102 | 结构判断 | 包元数据、编译配置与打包入口（3 个文件合并）。 |

### 2.13 plugin-market-generator（20 个文件）

独立命令行工具，扫描插件包并生成插件市场索引。

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `src/generate.ts` | 377 | 精读 | 生成主流程：发现候选包 → 读取元数据与指标 → 组装索引文件。结构：参数与来源装配 → 逐包抓取 → 元数据归一 → 写出索引。 |
| `src/fetchers.ts` | 264 | 结构判断 | 从 npm / GitHub 等来源抓取包信息的适配器集合。 |
| `src/metadata.ts` | 234 | 结构判断 | 把不同来源的包元数据归一为市场条目字段。 |
| `src/packages.ts` | 207 | 结构判断 | 工作区内插件包的枚举与筛选。 |
| `src/files.ts` | 129 | 结构判断 | 索引与附件的读写（含格式化与稳定排序）。 |
| `src/cli.ts` | 116 | 结构判断 | 命令行参数、子命令与退出码。 |
| `src/metrics.ts` | 74 | 结构判断 | 下载量、星标等市场指标的采集。 |
| `src/sources.ts` | 48 | 结构判断 | 数据来源声明与优先级。 |
| `src/bin.ts` | 4 | 结构判断 | 可执行入口垫片。 |
| `tests/*.spec.ts` + `support.ts`（6 个） | 1085 | 结构判断 | `generate`(321)、`discovery`(306)、`git`(198)、`metrics`(140)、`cli`(75) 及公共测试支持(45)。 |
| `package.json`、`tsconfig.json`、`README.md`/`README.zh.md`/`README.i18n.yaml` | 300 | 结构判断 | 包元数据、编译配置与三语文档（6 个文件合并）。 |

### 2.14 cli（203 个文件）

`dsh` 命令行的全部实现与 profile 测试矩阵。`src/` 是唯一逻辑所在，`tests/profiles/` 占 137 个文件，主要是各 profile 的 e2e 与 golden。

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `src/profile-boot.ts` | 366 | 精读 | profile 启动核心：解析 profile 目录、加载 cordis 组合、注入补丁并交给运行时。 |
| `src/args.ts` | 216 | 结构判断 | 命令行参数解析、子命令分派与帮助文本。 |
| `src/plugin.ts` | 108 | 结构判断 | `dsh plugin` 子命令：插件安装、启用与配置写入。 |
| `src/bin.ts` | 78 | 结构判断 | 可执行入口：定位构建产物并转入 profile 启动。 |
| `src/process-shutdown.ts` | 77 | 结构判断 | 统一的进程退出路径与信号处理。 |
| `src/dump-config.ts` | 76 | 结构判断 | 导出解析后的有效配置。 |
| `src/startup-diagnostics.ts` | 68 | 结构判断 | 启动失败时的诊断汇总与用户可读输出。 |
| `src/dump-config-schema.ts` | 48 | 结构判断 | 导出配置的 JSON Schema。 |
| `src/installed-bin.ts` | 28 | 结构判断 | 已安装二进制的路径解析与版本一致性检查。 |
| `src/sdk-source.cordis.patch.yml` | 5 | 结构判断 | 开发期把 SDK 指向源码的 cordis 补丁。 |
| `composition.md` | 315 | 结构判断 | 说明 CLI 如何组装 cordis 组合（profile、补丁、插件）的文档。 |
| `config/examples/*.yml`（5 个） | 48 | 结构判断 | 可直接复制的 profile 组合示例：记忆 MCP 三种后端、PTC、团队模式。 |
| `reference/README*.md` + i18n（3 个） | 327 | 结构判断 | 面向使用者的命令与配置参考手册。 |
| `README.md`/`README.zh.md`/`README.i18n.yaml` | 165 | 结构判断 | 包说明三件套。 |
| `package.json`、`tsconfig.json`、`tsdown.config.ts` | 289 | 结构判断 | 包元数据（含大量脚本）、编译与打包配置。 |
| `tests/*`（26 个根测试） | 约 5200 | 结构判断 | 参数、profile 初始化、插件、退出、启动诊断等单元/兼容测试；体量最大的是 `built-bin.e2e.ts`(1346)、`web-agent-presets.e2e.ts`(1414)、`github-webhook-real.e2e.ts`(481)、`dump-config-schema.expected.e2e.ts`(420)、`optional-bundle-transitions.e2e.ts`(353) |
| `tests/expected/`（2 个） | 647 | 结构判断 | `dump-config-schema.json`(615) 与 `launcher-help.txt`(32) 两份 golden。 |
| `tests/fixtures/`（13 个） | 约 500 | 结构判断 | 各类 `.cordis.yml` 组合、假 MCP/LLM 驱动、`dsh-badge`、`github-webhook`、`web-browser-open` 等场景装置。 |
| `tests/profiles/`（137 个） | 约 11000 | 结构判断 | 按 profile 分组的 e2e 矩阵，见下表。 |

`tests/profiles/` 内部结构：

| 子目录 | 文件数 | 说明 |
|---|---:|---|
| `headless/` | 78 | 无头 profile：9 个 `*.patch.yml` 场景补丁 + 23 个 e2e（`headless.expected.e2e.ts` 1430 最大）、`profile-resolution.ts`(314)、`ptc.e2e.ts`(416)，以及 `expected/` 下 30 余份 stdout/session golden 与 `fixtures/` 下的假 LLM、子代理与工作区恢复装置 |
| `acp/` | 23 | ACP 协议 profile：控制面、升级、钩子、目标、图片卸载、清理，配套 `goal-expected/` 的 input/replay/session/stdout 四件套 |
| `sdk/` | 17 | SDK profile：`keyless-smoke.e2e.ts`(659)、插件管理、桌面工具、检查点、调度恢复、工具对等性 |
| `web/` | 13 | Web profile：`web-failure-matrix.expected.e2e.ts`(487)、`public-url.expected.e2e.ts`(356)、`web-best-effort-startup.expected.e2e.ts`(380)、运行时名单隔离 |
| 根级 | 6 | `official-installer-packed.e2e.ts`(199)、`packed-installation.ts`(190)、`official-installer-observer.mjs`(117)、`AGENTS.md`、`subagent-preset-switch.overlay.yml`、`fixtures/official-installer-observer.mjs` |

### 2.15 web（673 个文件）

源码只有 4 个文件，其余全是构建脚本、静态资源与 653 个测试资产。测试矩阵的体量（`tests/expected/` 305 份 golden）说明这一层主要靠 UI 快照回归。

| 文件 | 行数 | 标注 | 职责 |
|---|---:|---|---|
| `vite.config.ts` | 264 | 结构判断 | Vite 构建配置：入口、别名、产物拆分与开发代理。 |
| `tsconfig.json` | 281 | 结构判断 | 编译配置，覆盖源码、测试与 stress 目录。 |
| `product-isolation.ts` | 105 | 结构判断 | 默认产品的隔离边界定义，构建期注入使用。 |
| `scripts/render-app-icons.ts` | 189 | 结构判断 | 由单一图标源渲染各平台尺寸的应用图标。 |
| `src/main.ts` | 40 | 精读 | 浏览器入口：挂载共享 Web 应用并注入产品上下文。 |
| `src/node-module-stub.ts` | 12 | 结构判断 | 浏览器构建中替换 Node 内建模块的空实现。 |
| `src/preview.ts` | 14 | 结构判断 | 预览模式入口，仅用于本地渲染检查。 |
| `src/vite-env.d.ts` | 1 | 结构判断 | Vite 环境类型引用。 |
| `katex-fonts.ts` | 33 | 结构判断 | 打包 KaTeX 字体清单，供离线渲染使用。 |
| `stress-tests/reasoning-chunks.stress.ts` | 235 | 结构判断 | 推理分块流式渲染的压力场景。 |
| `index.html` | 18 | 结构判断 | 单页应用 HTML 宿主。 |
| `public/`（7 个） | — | 结构判断 | `manifest.webmanifest`、明暗 favicon、192/512 与 maskable 图标、apple-touch-icon（二进制一行带过）。 |
| `package.json`、`.npmignore` | 82 | 结构判断 | 包元数据与发布忽略规则（2 个文件合并）。 |

#### 2.15.1 tests（653 个文件）

分布：根目录 279、`expected/` 305、`fixtures/` 52、`snapshots/` 16、`support/` 1。

根目录 279 个文件按主题归组（含 5 个 `.snapshot.ts` 快照驱动、若干 `.ts` 辅助与 3 个 README）：

| 主题 | 文件数 | 说明与代表文件 |
|---|---:|---|
| 会话与对话流 | 46 | `chat-scroll-contract.e2e.ts`(2001)、`seeded-history.e2e.ts`(958)、`chat-long-interactions`、`chat-fold-opened-group`、`interrupted-turn`、`steering.e2e.ts`(698)、`message-actions.e2e.ts`(522)、`queue-actions.e2e.ts`(500)、`idle-submission-handoff` 等 |
| 工具调用与执行 | 36 | `tool-details`、`bash-abort-row`、`shell-command-details`、`ptc-round`、`ptc-escalation`、`web-search-round`、`workflow-run`、`skill-tool-row`、`command-image-envelope`、`search-empty-include` 等 |
| 界面与交互 | 24 | `focus-rings.e2e.ts`(529)、`menu-position`、`menu-material`、`anchored-panels`、`window-drag-coverage.e2e.ts`(1017)、`window-drag-inheritance`、`composer-tab-geometry.e2e.ts`(487)、`hover-input`、`caption-overlays` 等 |
| 智能体、子代理与规划 | 20 | `agent-team-panel.e2e.ts`(1027)、`subagent-conversation.e2e.ts`(1120)、`subagent-summary`、`subagent-interrupt`、`plan-review.e2e.ts`(463)、`goal-bar`、`agent-preset-selection.e2e.ts`(530) 等 |
| 设置与偏好 | 16 | `settings-chrome.e2e.ts`(1256)、`models-settings.e2e.ts`(861)、`default-model.e2e.ts`(660)、`settings-appearance`、`settings-import`、`remote-settings`、`developer-tools-settings`、`simplify` 系列 |
| 插件与市场 | 16 | `plugin-manager.e2e.ts`(1592)、`forge-panel.e2e.ts`(2538)、`plugin-install-approve/cancel/github/registry`、`plugin-hmr-lifecycle`、`plugin-sticky-motion`、`japanese-plugin-metadata` |
| Markdown 与富内容 | 11 | `markdown-wide-table.e2e.ts`(582)、`rich-text-quotes.e2e.ts`(650)、`math-rendering`、`thinking-markdown`、`autolink-cjk-punctuation`、`markdown-images`、`code-card-layout`、`rich-text` 链接系列 |
| 欢迎、引导与账号 | 10 | `desktop-onboarding.e2e.ts`(514)、`onboarding-deepseek-config`、`onboarding-native`、`onboarding-usable-provider`、`account-login`、`creator-persona`、`home-whale` |
| 文件、工作区与终端 | 10 | `file-browser.e2e.ts`(693)、`document-preview.e2e.ts`(1892)、`workspace-management.e2e.ts`(1076)、`workspace-recency`、`worktree-opt-in`、`sidebar-terminal.e2e.ts`(713)、`pwsh-terminal.e2e.ts` |
| 侧栏、导航与布局 | 10 | `navigation-panes.e2e.ts`(886)、`sidebar-right.e2e.ts`(1438)、`sidebar-drawer.e2e.ts`(737)、`sidebar-alignment.e2e.ts`(655)、`sidebar-scrollbar.e2e.ts`(572)、`layout-bottom`、`lifecycle-chrome.e2e.ts`(650) |
| 桌面宿主集成 | 9 | `desktop-updates`、`desktop-channel`、`desktop-locale`、`desktop-boot.spec.ts`、`preview-boot`、`pwa-manifest`、`public-mount`、`app-icons`、`vite-entry` |
| 通知、提醒与统计 | 9 | `bonus-notice.e2e.ts`(866)、`quota-notice`、`max-tokens-notice`、`subagent-result-notice`、`context-meter`、`client-ui-stats-panel`、`stats-paged-history`、`stats-truncated-tooltip` |
| 权限与审批 | 8 | `access-confirmation`、`cua-optin`、`cua-permissions`、`cua-run-code`、`auto-review-approval`、`auto-review-denial`、`permission-policy-context`、`approval-composer` |
| 快捷方式 | 5 | `shortcuts.e2e.ts`(458)、`shortcuts-desktop.e2e.ts`(446)、`shortcuts-panels`、`shortcuts-workspace`、`shortcuts-fixed` |
| 调度与时间 | 6 | `schedule-after.e2e.ts`(1456)、`schedule-header`、`schedule-manual`、`schedule-phone`、`schedule-pickers`、`clock`/`pinned-clock` |
| 网络、服务与运行时 | 5 | `connection-recovery`、`server-restart`、`hmr-live`、`startup-rpc-budget`、`shipped-composition.e2e.ts`(1114) |
| 语音与输入增强 | 4 | `voice-input`、`voice-setup`、`voice-download`、`composer-paste-routing` |
| 测试基建与文档 | 8 | `scaffold.ts`(1812)、`support.ts`(481)、`assembled-boot.ts`、`assembled-remote.ts`(459)、`support-timezone`、`png-size.ts`、3 个 README |
| 其它单点 | 29 | 上述未吸收的独立场景，如 `cold-blank-session`、`fork-mid-turn`、`replay-round-trip`、`session-log-upload`、`trajectory-virtualization`、`user-text-secret-mask`、`web-search-round` 等 |

资产目录：

| 目录 | 文件数 | 说明 |
|---|---:|---|
| `expected/` | 305 | 按场景命名的 golden 目录：`forge-panel`(28)、`plugin-manager`(14)、`shortcuts`(13)、`models-settings`(13)、`desktop-onboarding`(10)、`sidebar-terminal`(8)、`settings-chrome`(7)、`shortcuts-desktop`(7)，其余多为 1–6 个文件的小目录（DOM 快照、locator 文本、裁剪图） |
| `fixtures/` | 52 | `plugins/`(30) 的假插件包、`office/`(6，含 592.5 KB 的 `preview.ppt` 大二进制)、`model-badge`、`plugin-market`、`account-login`、`markdown-colon-file-links` 等最小场景装置 |
| `snapshots/` | 16 | 非 e2e 的组件级快照：`agent-team-panel`(8)、`subagent-summary`(3)、`live-job-stream`(2)，其余 3 个单文件 |
| `support/` | 1 | 浏览器测试的公共支撑模块 |
| 5 个 `*.snapshot.ts` | 5 | `code-language`、`message-feedback-protocol`、`minimal-preset`(559)、`preset-migration`、`subagent-fork-schedule`，仅在 lib 模式下被 `vitest.snapshot.config.ts` 纳入 |

---

## 三、snapshots

### 3.1 这些快照是什么

`snapshots/` 不是 vitest 的 `__snapshots__` 序列化基线，而是**录制回放语料库（corpus）**：每个场景目录提交一份真实的 Session JSONL 记录，它同时承担两个身份——

1. **回放输入**：replay 时把已录制的模型响应喂给被测进程，从而在**不需要 API key** 的情况下跑完整链路；
2. **期望输出**：`record` / `refresh` 写回时，序列化后的新会话必须与提交的 JSONL 逐条对齐，因此它又是 golden 文件。

`snapshots/AGENTS.md` 用一句话定义了这个约束：「committed session JSONL is replay input and expected persisted output」。配套的三条硬规则是：

- 被测进程必须经 `dsh` CLI、以 shipped profile 启动，禁止另造入口或隐藏模式；
- 提交的会话是**归一化不动点**——易变 ID 替换为保持关系的 token，system prompt 与 tool schema 替换为 token 并落到可读 sidecar；
- 工作区种子留在场景内，改变工作区的场景要提交 `workspace.expected/` 作为独立 oracle。

### 3.2 谁生成、什么时候用

生成与使用由根 `package.json` 的脚本严格分离，配置在 `vitest.snapshot.config.ts`：

| 命令 | 模式 | 是否写盘 | 说明 |
|---|---|---|---|
| `npm run test:snapshot` | `replay`（默认） | 否 | 日常/CI 主通道，keyless；replay 下 `fileParallelism` 才开启（`maxConcurrency` 默认 `min(5, availableParallelism())`） |
| `npm run test:snapshot:record` | `record` | 是（`--update`） | 唯一会调真实 API 的模式；先 `process.loadEnvFile('.env')` 读根 `.env`；串行执行以节省配额并避免写坏 expected |
| `npm run test:snapshot:refresh` | `refresh` | 是 | 回放已提交脚本，把磁盘上的易变值收获后写回 expected；同样串行 |
| `npm run test:web:built` | — | 否 | `vitest.web.config.ts`，浏览器快照的构建产物模式 |
| `npm run test:web:refresh` | `refresh` | 是 | 先 `build` 再刷新 web 快照 |
| `npm run test:web:ci` | — | 否 | `tsx scripts/run-web-snapshots.ts` 的统一入口 |
| `npm run test:expected` / `:refresh` | — | 取决于模式 | 非会话类 expected（ARIA、几何、CLI 输出等）归各自 app/package，走这条通道 |

`vitest.snapshot.config.ts` 的 `include` 决定谁由语料库通道驱动：`snapshots/**/*.snapshot.ts` 恒定纳入；`apps/web/tests/**/*.snapshot.ts`（5 个文件）**仅在 `DSH_EXAMPLE_MODE=lib` 时**纳入——源码模式是零构建路径，lib 模式必须先 build 才能执行生成的客户端 bundle。另外 `scripts/session-snapshot-corpus.corpus.ts` 本身也作为一条测试纳入，它不跑业务，只校验语料库的所有权与存储不变量。

每个场景的 `snapshot.yml` 用 `recording: live | authored` 标注来源：全库 **authored 231 / live 82**。authored 指人工编排或裁剪过的稳定脚本，live 指真实模型录制。

### 3.3 规模与目录聚合

| profile | 场景数（含 `snapshot.yml`） | 文件数 | 体积 | 驱动文件 | 说明 |
|---|---:|---:|---:|---|---|
| `snapshots/acp` | 9 | 66 | 0.2 MB | `acp/acp.snapshot.ts` | ACP（Agent Client Protocol）客户端会话：取消、工具调用升级、审批等协议往返 |
| `snapshots/sdk` | 40 | 290 | 2.3 MB | `sdk/sdk.snapshot.ts` | SDK 层协议：plan-review、multi-turn 等，附带 `legacy-context.patch.yml` 这类版本补丁 |
| `snapshots/session` | 190 | 1,217 | 7.1 MB | `session/headless.snapshot.ts` | headless 会话全链路，语料主体；代际最复杂，另有 `loopback-fixture-server.mjs` 回环服务 |
| `snapshots/web` | 74 | 400 | 2.2 MB | `apps/web/tests/*.snapshot.ts`（5 个） | 浏览器端装配后的整链快照，UI 文本/ARIA expected 占比最高 |
| 根级 | — | 1 | — | — | `snapshots/AGENTS.md` 语料库规约 |
| **合计** | **313** | **1,974** | **11.8 MB** | | 与清单 1,974 行一致 |

二级条目共 318 个 = 313 个场景目录 + 5 个散落文件（`acp/acp.snapshot.ts`、`sdk/sdk.snapshot.ts`、`sdk/legacy-context.patch.yml`、`session/headless.snapshot.ts`、`session/loopback-fixture-server.mjs`）。

按扩展名：

| 类型 | 数量 | 分布说明 |
|---|---:|---|
| `.jsonl` | 694 | 会话记录本体；session 446、sdk 123、web 92、acp 33 |
| `.yml` | 600 | 其中 `snapshot.yml` 313（每场景一份清单），其余 287 为场景配置/覆盖片段 |
| `.md` | 308 | `*.expected.md` 285（含 96 个 `system*.md` 提示词/schema 归一化副本）、每目录 `AGENTS.md` 13、`SKILL.md` 4、其他 6 |
| `.json` | 191 | `tool-schemas.expected.json` 95、`*.override.json` 46、普通 `*.json` 37、多轮 `*.N.expected.json` 13 |
| `.txt` | 79 | `task` 13、`input` 6、`notes` 6、`witness` 5、`data`/`config` 各 4 等小型文本断言 |
| `.mjs` | 51 | 场景内 `fixture` / `driver` / `client-fixture` / `provider-fixture` 等假实现 |
| `.ts` | 14 | 快照驱动与适配器 |
| `.empty` | 9 | 空工作区结果的忽略标记（不是空目录） |
| `.png` | 9 | UI 裁剪断言图 |
| `.mts` / `.sh` | 3 / 2 | 类型化辅助与少量 shell 装置 |
| 其他 14 | 14 | `.gitignore` 2、`.stop_fired` 2、`.js` 2、`.gitkeep` 1、`.svg` 1、`.docx` 1、`.gif` 1、`.local` 1、`.dsh-project` 1、`.posttool-blocked` 1、无扩展名 1 |

### 3.4 场景目录内部的文件构成

以 `snapshots/sdk/plan-review` 与 `snapshots/session/empty-response-retry` 为例，一个场景目录的典型构成：

| 文件形态 | 作用 |
|---|---|
| `snapshot.yml` | 场景清单：`version`、`scenario`、`profile`、`composition`、`recording`、`header.{class,pin,changes,promptChanges}`，必要时加 `sessionFormat.{version,coverage}` 与 `workspace.final` |
| `session[.vN].jsonl` | 父会话记录；`session.<ordinal>[.vN].jsonl` 为子代理/子会话 |
| `system*.md`、`tool-schemas.expected.json` | 提示词与工具 schema 的可读 sidecar，会话里对应位置替换为 token |
| `*.expected.md` / `*.expected.json` | 渲染层断言（UI 文本、轨迹、snippet 等） |
| `*.override.json` | 对上游 fixture 的局部覆盖，避免整份复制 |
| `workspace.expected/` + `.empty` | 工作区终态 oracle；空结果只留 `.empty` 标记 |
| `*.mjs` / `*.ts` | 场景私有 fixture server、故障注入驱动 |

`composition` 字段标出装配形态，前几位是 `default` 70、`web-default` 52、`ptc` 13、`acp-default` 9、`sdk-desktop` 7、`image` 6。

### 3.5 会话代际与选择规则

- 文件名带格式版本：v0 省略 `.v0`，正版本写小写 `.vN`，且**文件名必须与会话头里的版本一致**。
- 同一角色允许保留多代共存；**replay / record / refresh 一律选择数值最高的一代**。record 与 refresh 只新增版本化输出，绝不重命名或删除已提交代际；裁剪属于评审后的人工策展。
- 仅当场景需要保留历史代际或已下线工具时，才在 `snapshot.yml` 里显式声明 `sessionFormat`（全库仅 **10 个**场景），声明后该角色所有被选代际都必须等于声明版本，且 record/refresh 不再改写它。
- session profile 的实际代际分布：**v0 16 / v1 1 / v2 92 / v3 126 / v4 211**（当前格式 `SESSION_FORMAT_VERSION = 4`）。v0–v2 是迁移覆盖语料，不是遗留垃圾。
- 13 个场景持有超过 3 个会话文件，最多 9 个（`subagent-depth-two-rejection`、`subagent-parallel`、`ralph-loop`、`advanced-toolchain`、`advanced-toolchain-runtime`）。

### 3.6 有没有生命周期管理

有治理、但**没有自动 GC**。三层机制：

1. **门禁测试**：`scripts/session-snapshot-corpus.corpus.ts`（216 行）在语料库通道里作为一条测试运行，解析全部清单、校验文件名与头部一致、校验 sidecar 与别名链接目标、校验工作区 oracle 完整性。
2. **策略函数**：`scripts/session-snapshot-corpus-policy.ts` 的 `assertSnapshotCorpusPolicy()` 给出量化上限与必需覆盖：

| 常量 | 值 | 含义 |
|---|---|---|
| `RETAINED_BASELINE_VERSION` | 3 | 直接升级覆盖必须保留 v3 输入 |
| `MAX_RETAINED_ROLES` | 13 | 历史代际角色总数上限（含 native 与 PTC Office 的已下线工具录制） |
| `REQUIRED_V0_COVERAGE` | `multi-hop`、`packed-row`、`retry-failure`、`shipped-profile` | v0 必须覆盖的行为面 |
| `REQUIRED_ADJACENT_COVERAGE` | `adjacent-migration` | v1–v3 各自的相邻迁移覆盖 |

  另有三条强制约束：selected 代际只能是 baseline v3 或 current v4；`baseline + current > retained`（baseline/current 必须占多数）；`retainedRoles ≤ 13`。

3. **人工策展**：`AGENTS.md` 要求「每次 record/refresh 产生的 JSONL、prompt、schema、protocol、UI、workspace diff 都必须评审后再提交」。清理靠删除代际与调整 `sessionFormat` 声明，由人决定。

结论：这套语料库是**受策略约束的手工策展集合**，随 `SESSION_FORMAT_VERSION` 升版而阶段性膨胀，靠上限与必需覆盖项防止无限增长，但没有按时间或体积的自动淘汰。

### 3.7 与 `apps/web/tests` 快照的关系

`apps/web/tests` 下的 305 个 `expected/` 资产与 `snapshots/web` 是两条不同通道：前者由 `vitest.web.config.ts` / `test:expected` 驱动，用于浏览器 e2e 的 DOM、ARIA、裁剪图断言；后者进入语料库通道，只有 5 个 `*.snapshot.ts` 在 lib 模式下被纳入语料库运行。二者共享 `apps/web/tests/fixtures/` 与 `support/`，但 expected 目录不互通。

---

## 四、覆盖核对

| 范围 | 清单行数 | 本文覆盖 | 核对方式 |
|---|---:|---:|---|
| `apps/desktop` | 698 | 698 | 2.1–2.11 逐目录统计：根 13 + config 10 + cli/windows-signing 5 + resources 5 + renderer 13 + installer 32 + publishing 6 + docs 3 + src 86 + scripts 195 + tests 327 = 698 |
| `apps/web` | 673 | 673 | 2.15：非测试 18 + tests 653 + 根 2；tests = 根 279 + expected 305 + fixtures 52 + snapshots 16 + support 1 |
| `apps/cli` | 203 | 203 | 2.14：src 10 + 根 7 + config/examples 5 + reference 3 + tests 26 + expected 2 + fixtures 13 + profiles 137 |
| `apps/plugin-market-generator` | 20 | 20 | 2.13 单表列全 |
| `apps/desktop-host` | 17 | 17 | 2.12 单表列全 |
| **apps 合计** | **1,611** | **1,611** | 与清单行数一致，无缺失、无重复 |
| `snapshots/acp` | 66 | 66 | 3.3 聚合 |
| `snapshots/sdk` | 290 | 290 | 3.3 聚合 |
| `snapshots/session` | 1,217 | 1,217 | 3.3 聚合 |
| `snapshots/web` | 400 | 400 | 3.3 聚合 |
| `snapshots/AGENTS.md` | 1 | 1 | 3.1 引用 |
| **snapshots 合计** | **1,974** | **1,974** | 66 + 290 + 1,217 + 400 + 1 = 1,974 |

- 全量存在性校验：对清单每一行做 `Test-Path`，缺失 0 个（apps 与 snapshots 均通过）。
- 标注分布：apps 部分 `精读` 6 个（`desktop/src/main.ts`、`desktop/src/locale.ts` 为结构级精读，`desktop/src/host-process.ts`、`desktop-host/src/index.ts`、`cli/src/profile-boot.ts`、`plugin-market-generator/src/generate.ts`、`web/src/main.ts`），其余为 `结构判断`；snapshots 部分以 `snapshot.yml`、`AGENTS.md`、`vitest.snapshot.config.ts`、`session-snapshot-corpus*.ts` 为依据做聚合判断，没有逐个打开 694 个 JSONL。

---

## 五、异常项

以下只记录规模与结构上的可疑点，不评价代码质量。

### 5.1 超大源码

| 文件 | 行数 | 现象 |
|---|---:|---|
| `apps/desktop/src/main.ts` | 1,619 | 单个 `main()` 约 1,200 行，串起单实例、Host 启动、窗口、IPC、托盘、更新调度；拆分成本高但职责确实是进程级编排 |
| `apps/desktop/src/locale.ts` | 1,606 | 8 语言字典（各约 190 行）与格式化逻辑同文件，靠字典同构保证类型安全，无 schema 校验 |
| `apps/web/vite.config.ts` | 264 | 构建入口承载了较多产品隔离与产物路径逻辑 |
| `apps/web/tsconfig.json` | 281 | 配置体量异常，疑似含逐包 paths 枚举 |

### 5.2 超大测试

| 文件 | 行数 |
|---|---:|
| `apps/desktop/tests/main-startup.spec.ts` | 3,145 |
| `apps/web/tests/forge-panel.e2e.ts` | 2,538 |
| `apps/web/tests/chat-scroll-contract.e2e.ts` | 2,001 |
| `apps/web/tests/document-preview.e2e.ts` | 1,892 |
| `apps/web/tests/scaffold.ts`（测试基建） | 1,812 |
| `apps/web/tests/schedule-after.e2e.ts` | 1,456 |
| `apps/web/tests/sidebar-right.e2e.ts` | 1,438 |
| `apps/web/tests/headless.expected.e2e.ts` | 1,430 |
| `apps/web/tests/web-agent-presets.e2e.ts` | 1,414 |

`scaffold.ts` 1,812 行意味着测试基建本身已成规模；`main-startup.spec.ts` 3,145 行是仓库最大单文件测试。

### 5.3 超大快照资产

| 文件 | 体积 | 说明 |
|---|---:|---|
| `snapshots/sdk/plan-review/tool-schemas.expected.json` | 215.2 KB | 全库最大文件，工具 schema 全量展开 |
| `snapshots/session/cua-native/session.v4.jsonl` | 140.2 KB | 单会话记录最大 |
| `snapshots/sdk/sdk.snapshot.ts` | 90.4 KB | 驱动脚本本身接近千行级 |
| `snapshots/web/creation-recommendations/tool-schemas.expected.json` | 87.8 KB | 与下条**同为 87.8 KB** |
| `snapshots/web/plugin-recommendations/tool-schemas.expected.json` | 87.8 KB | 与上条同尺寸，疑似同源复制（两个场景共享工具集），是否为冗余：待确认 |
| `snapshots/session/headless.snapshot.ts` | 81.7 KB | session profile 唯一驱动 |
| `snapshots/web/tests/fixtures/office/preview.ppt` | 592.5 KB | 清单中最大文件，二进制 fixture |

### 5.4 多代并存

- 13 个 session 场景保留 >3 个会话文件，5 个场景达 9 个；配合 v0–v4 五代分布，语料库体积主要由历史代际贡献。
- 这属于 `session-snapshot-corpus-policy.ts` 允许且有约束的行为，**不是废弃**，但意味着任何格式升版都会持续加权体积；上限 13 个历史角色是当前唯一刹车。

### 5.5 疑似重复实现

- `apps/desktop/src` 的更新子系统被拆为 `update-*.ts` 15 个 + `updates/electron-updater/` 3 个（`channel`、`discard`、`http-executor`），粒度极细（`update-cleanup-log.ts` 29 行、`update-channel.ts` 18 行、`update-error.ts` 29 行）。是否可合并：待确认（单职责划分看起来是有意为之）。
- `apps/web/tests/fixtures/plugins/` 30 个假插件包与 `apps/web/tests/expected/plugin-manager/` 14 个期望文件存在场景对应，是否每个 fixture 都被引用：待确认。
- `snapshots/web/creation-recommendations` 与 `plugin-recommendations` 的 `tool-schemas.expected.json` 同尺寸，见 5.3。

### 5.6 运行时残留与本地实值文件

- 场景目录里出现 `.stop_fired` 2、`.posttool-blocked` 1、`.local` 1、`.dsh-project` 1、`.gitkeep` 1——这些更像测试运行痕迹或临时状态被提交，是否为有意 fixture：待确认。
- `apps/desktop/.env.windows`（12 行）是样例之外的**本地实值**环境变量文件，与 `.env.windows.example` 并存；是否含真实签名/发布凭据：待确认（本次未读内容，建议核对是否应被忽略）。

### 5.7 信息缺口

- `apps/desktop/src/crash-report.ts`、`apps/cli/src/profile-boot.ts` 以及 `apps/desktop/scripts` 下若干 PowerShell 脚本无文件头注释，职责由调用点推断，标注为 `结构判断`。
- `apps/web/tests` 的「其它单点」29 个文件主题分散（`fork-mid-turn`、`cold-blank-session`、`replay-round-trip` 等），未再细分，如需更细归组需二次确认。
- `snapshots/sdk/legacy-context.patch.yml` 的用途只由文件名与同目录 `multi-turn` 场景推断，未见显式引用，标 `待确认`。

