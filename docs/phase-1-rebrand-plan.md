# i-do 一期二开方案

本文档定义在 [deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 基础上做二次开发（下称“二开”）的第一期实施方案，覆盖品牌换标、产品更名、域名替换与仓库迁移。

- 代码基线：`d:/ai/deepseek/deepseek-harness`（`master`，版本 `0.2.2-rc.2`）
- 二开工作区：`d:/ai/deepseek/i-do`
- 目标仓库（主）：`https://cnb.cool/zxui/ido`
- 目标仓库（GitHub 镜像）：`https://github.com/shingle-coder/i-do`
- 目标域名：`i-do.net`（另含 `www.i-do.net`）
- 部署服务器：`119.29.173.147`（`root`，密钥 `.ssh/119.29.173.147.pem`）
- 本地配置：`.env`（已被 `.gitignore` 忽略，禁止入库）

## 1. 一期目标与边界

### 1.1 本期必须完成

1. 更换 logo 与图标（桌面端、托盘、Web/PWA、文档站、安装器）。
2. 产品名称改为 `i-do`，域名改为 `i-do.net`。
3. 仓库迁移到 `https://cnb.cool/zxui/ido`，用本地工作树覆盖线上既有内容。

### 1.2 本期不做（保留到二期）

- 不重命名内部 npm 包作用域：`@deepseek-ai/dsh-*` 全部保留，避免 398 个 workspace 包、发布链路与快照测试连锁改动。
- 不改 SDK/API/会话格式，不修改上游 `docs/architecture.md` 描述的机制。
- 不改默认模型供应商配置（首期仍使用 DeepSeek 模型）。
- 不做上游持续同步自动化（先记录基线 commit，人工择机 merge）。

### 1.3 需业务方确认的决策点

| 编号 | 决策 | 建议默认值 |
| --- | --- | --- |
| D1 | CLI 命令名是否由 `dsh` 改为 `ido` | 一期保留 `dsh`，二期再评估（影响所有脚本、文档、profile 启动方式） |
| D2 | 自定义协议 `dsh://` 是否改为 `ido://` | 本期改为 `ido://`（仅桌面端，改动面小） |
| D3 | 安装包文件名前缀 | `i-do-${version}-${os}-${arch}` |
| D4 | 自动更新/下载域名 | `https://download.i-do.net` |
| D5 | 强制更新策略源 | `https://policy.i-do.net`（与登录来源同域时按实际部署调整） |
| D6 | 应用标识 appId | `net.i-do.desktop` |
| D7 | 是否保留 “DeepSeek” 品牌字样 | 产品界面全部替换为 i-do；模型供应商名称保留 DeepSeek（合规如实标注） |
| D8 | 线上仓库覆盖确认 | 覆盖不可逆，执行前需书面确认 cnb 仓库现有内容可丢弃 |

## 2. 现状盘点：品牌触点清单

### 2.1 桌面端（Electron）

| 触点 | 位置 | 当前值 |
| --- | --- | --- |
| 产品名 | `apps/desktop/scripts/electron-builder-config.mjs:119` | `DeepSeek Harness` |
| 安装包名 | 同文件 `:123` | `deepseek-harness-${version}-${os}-${arch}` |
| Windows 图标 | 同文件 `:248` | `resources/icon-windows.png` |
| macOS 图标 | 同文件 `:167` | `resources/icon-macos.png` |
| 打包附带图标 | 同文件 `:162-164` | `icon.png`、`tray.ico` |
| NSIS 卸载显示名 | 同文件 `:262` | `${productName}` |
| 安装器侧栏图 | 同文件 `:263-264` | `<build>/installer-ui/uninstaller-sidebar.bmp` |
| 应用标识 | 环境变量 `DSH_DESKTOP_APP_ID`（`.env.windows` / `.env.macos`） | `com.deepseek.dsh` |
| 图标源文件 | `apps/desktop/resources/` | `icon.svg`、`icon-windows.svg`、`icon-macos.svg`、三个 PNG、`tray-windows.ico` |
| 托盘图标生成 | `apps/desktop/scripts/render-tray-icon.ts` | 由 `icon-windows.svg` 光栅化 |
| 协议注册 | `apps/desktop/src/main.ts:1488-1491` | `dsh://open` |
| 界面文案（中英） | `apps/desktop/src/locale.ts`（约 34-155 英文、229-271 中文） | `DeepSeek Harness` / `DeepSeek Harness 无法使用` 等 |
| 安装器多语言文案 | `apps/desktop/installer/locales/*.json`（8 种语言，每种 3 处） | `DeepSeek Harness` |
| 包元信息 | `apps/desktop/package.json` | `@deepseek-ai/dsh-desktop`、作者为 DeepSeek 公司 |

### 2.2 Web / PWA

| 触点 | 位置 | 说明 |
| --- | --- | --- |
| Web 应用图标 | `apps/web/scripts/render-app-icons.ts` | 从 `apps/desktop/resources/icon.svg` 光栅化生成 PWA 图标 |
| 页面 favicon | `apps/web/index.html:11` | `/favicon.svg` |

### 2.3 文档站

| 触点 | 位置 | 当前值 |
| --- | --- | --- |
| 站点标题/描述 | `website/.vitepress/config.ts:179-180` | `DeepSeek Harness` / `用于构建 Agent Harness 的插件化 SDK` |
| 导航栏 logo | 同文件 `:184-189`、`:261-262` | 内联 `website/public/wordmark.svg` |
| favicon | 同文件 `:277` + `website/public/favicon.svg` | — |
| GitHub 链接 | 同文件 `:161`、`:168`、`:331` | `https://github.com/deepseek-ai/deepseek-harness` |
| 站点 base | 同文件 `:175` | `DOCS_BASE`，默认 `/` |

### 2.4 服务端点与域名

| 触点 | 位置 | 当前值 |
| --- | --- | --- |
| 生产下载固定源 | `apps/desktop/scripts/desktop-auto-update-environment.mjs:29` | `https://download.deepseek.com` |
| 固定安装包文件名 | 同文件 `desktopLatestInstallerFilename()` | `dsh-latest-windows-x64.exe` 等 |
| 测试/生产 COS 与 Origin | `apps/desktop/.env.windows.example`、`.env.macos.example`、`apps/desktop/config/{windows,macos}-packaging/*.env.example` | 占位 |
| 策略源 | 同上 `DSH_DESKTOP_MANDATORY_UPDATE_{TEST,PROD}_ORIGIN` | 占位 |
| 仓库地址（发布元数据） | 各 `package.json` 的 `repository` 字段 | `github.com/deepseek-ai/deepseek-harness` |

### 2.5 现有品牌素材

`d:/ai/deepseek/i-do/docs/logo/` 现有素材（已核对尺寸与像素格式）：

| 文件 | 实测规格 | 可直接用于 | 不可用于 / 需转换 |
| --- | --- | --- | --- |
| `logo.png` | 1024×1024，32bpp ARGB，243.6 KB | 桌面端三个应用图标（`icon.png`、`icon-windows.png`、`icon-macos.png`）的源图；Web/PWA 图标光栅化源 | — |
| `logo.ico` | **单帧** 256×256，32bpp，1056.1 KB | Windows 应用图标兜底 | 托盘（需 16/20/24/32/48 多尺寸）、任务栏小图标清晰度 |
| `favicon.ico` | **单帧** 128×128，32bpp，66.1 KB | 临时占位 | 文档站 favicon 需要 SVG；浏览器多尺寸显示建议 16/32/48 |

已生成的矢量与派生素材（由 `logo.png` 自动描摹，非手工重绘；颜色取自原图采样）：

| 文件 | 规格 | 用途 |
| --- | --- | --- |
| `icon.svg` | 1104×1104，圆角底板 (40,32) + 图形 | PWA 图标光栅化源（`apps/web/scripts/render-app-icons.ts` 依赖该画布与内缩） |
| `icon-windows.svg` | 1024×1024，含 `<g id="tray-glyph">` | 托盘图标渲染源（`render-tray-icon.ts` 在该组上叠加 1.2 倍变换） |
| `icon-macos.svg` | 1104×1104，圆角底板 | macOS 应用图标源 |
| `icon.png` / `icon-windows.png` / `icon-macos.png` | 1104 / 1024 / 1024 | 直接替换 `apps/desktop/resources/` 下同名 PNG |
| `tray-windows.ico` | 16/20/24/32/40/48/64 七帧 | 直接替换 `apps/desktop/resources/tray-windows.ico` |
| `wordmark.svg` | 196×64，`currentColor` | 文档站导航栏字标（替换 `website/public/wordmark.svg`） |

生成方式：由 `scripts/brand/render-icons.mjs` 对 `logo.png` 二值化后取行进方块轮廓，经 RDP 抽稀与 Catmull-Rom 平滑转贝塞尔；品牌色沿用原图采样值 `#4180B5 → #4E9FC6 → #63B7D9`。底板沿用上游图标的浅色圆角底（`#F4F9FC → #E3F0F8`），使桌面图标与 Web/PWA 图标结构一致。换图后重跑该脚本即可整体再生成。

仍未覆盖的素材：`favicon.ico` 仍为单帧 128×128，若文档站采用 SVG favicon 可忽略；若需要 ICO 版本，从 `logo.png` 生成 16/32/48 多帧即可。

## 3. 仓库搭建与远程覆盖

### 3.1 建立二开工作区（已完成）

当前状态：`d:/ai/deepseek/i-do` 已从本地基线 `git clone --local` 建立，分支 `master`，基线提交 `e8f7b93a34`，保留完整上游历史；`origin` 仍指向本地基线路径，等待切换到 cnb。工作区已包含：

- 上游完整源码（不含 `node_modules`、构建产物）
- `docs/logo/` 品牌素材与本文档
- `scripts/brand/render-icons.mjs` 图标生成工具
- `.env`、`.ssh/`（均不入库）

以下为同一流程的通用说明，供重建工作区时参考：

- **方式 A（已采用，保留上游历史）**：从本地基线克隆，再替换 remote。
- **方式 B（历史干净）**：`git init` 新仓库，首个提交为完整源码导入。

```powershell
# 1. 备份现有 i-do/docs（logo 素材）
Move-Item D:\ai\deepseek\i-do\docs D:\ai\deepseek\i-do-docs-backup

# 2. 克隆基线（保留 .git 与上游历史；node_modules 与构建产物由 .gitignore 排除）
git clone --local D:\ai\deepseek\deepseek-harness D:\ai\deepseek\i-do

# 3. 恢复 docs 素材
Move-Item D:\ai\deepseek\i-do-docs-backup D:\ai\deepseek\i-do\docs
```

### 3.2 切换远程并覆盖

```powershell
cd D:\ai\deepseek\i-do

# 先把原 origin 留作上游备份（只读比对用）
git remote rename origin upstream

# 主仓库
git remote add origin https://cnb.cool/zxui/ido.git

# GitHub 镜像仓库
git remote add github https://github.com/shingle-coder/i-do.git

# 覆盖前：把线上现状抓下来备份，避免误覆盖后无法回溯
git fetch origin
git tag backup/cnb-before-overwrite origin/HEAD 2>$null

# 用本地覆盖线上（确认 D8 已批准后执行）
git push --force origin master

# 同步到 GitHub 镜像（同样覆盖）
git push --force github master
```

要点：

- `--force` 会重写线上历史，执行前必须完成 D8 确认与 `backup/cnb-before-overwrite` 备份；GitHub 镜像同样会被覆盖。
- cnb 默认分支若是 `main`，需改为 `git push --force origin master:main` 或在仓库设置里调整默认分支。
- 若仓库开启了分支保护，需先在 cnb / GitHub 控制台临时关闭，推送完成后再恢复。
- 认证使用 cnb 访问令牌与 GitHub PAT（存放于 `.env` 的 `VITE_GIT_REPO`、`GITHUB_TOKEN`），不要把令牌写入 remote URL 或提交历史。

### 3.3 首次提交策略

品牌改动建议单独成 commit，便于回滚与上游对比：

1. `chore: import deepseek-harness baseline for i-do`
2. `feat(brand): rename product to i-do and replace icons`
3. `feat(brand): point service origins to i-do.net`
4. `docs: add phase-1 fork plan`

### 3.4 部署与服务配置

所有敏感值只存放在工作区根的 `.env`（`.gitignore` 已忽略），文档与代码只引用变量名。

| 分组 | 变量 | 用途 |
| --- | --- | --- |
| 代码仓库 | `GITHUB_REPOSITORY`、`GITHUB_TOKEN` | GitHub 镜像地址与推送凭据 |
| 代码仓库 | `CNB_REPOSITORY`、`VITE_GIT_REPO` | CNB 地址；后者含访问令牌，供 Vite 构建期读取 |
| 站点 | `SITE_DOMAIN`、`SITE_WWW_DOMAIN` | `i-do.net`、`www.i-do.net` |
| 腾讯云 | `TENCENT_SECRET_ID`、`TENCENT_SECRET_KEY` | 云 API 凭据（与 COS 凭据同源） |
| COS | `COS_BUCKET_IDO`、`COS_REGION_IDO` | 与 `www.i-do.net` / `i-do.net` 绑定的静态站存储桶；凭据复用 `TENCENT_SECRET_ID` / `TENCENT_SECRET_KEY` |
| 部署 | `DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_PORT` | 服务器地址与登录用户 |
| 部署 | `DEPLOY_PASSWORD`、`DEPLOY_SSH_KEY` | 登录凭据；密钥文件为 `.ssh/119.29.173.147.pem`，已加入 `.git/info/exclude` |
| 数据库 | `PRISMA_DATABASE_URL` | PostgreSQL 连接串（`ido` 库） |
| 模型 | `DEEPSEEK_API_KEY` | 模型调用凭据 |
| 其他 | `IMA_API_KEY`、`IMA_CLIENT_ID` | IMA 服务凭据 |

安全要求：

- `.env`、`.ssh/` 均不得入库；`.ssh/` 已写入 `.git/info/exclude`，`.env` 由仓库 `.gitignore` 覆盖。
- 上述凭据曾以明文形式散落记录，建议在仓库公开或协作扩大前统一轮换，并改为部署平台的环境变量注入。
- 文档、日志、CI 输出中只允许出现变量名，不得回显取值。

## 4. 品牌替换实施步骤

### 4.1 阶段一：应用标识

1. `apps/desktop/scripts/electron-builder-config.mjs`
   - `productName: 'i-do'`
   - `artifactName: 'i-do-${version}-${os}-${arch}${output.suffix}.${ext}'`
2. `apps/desktop/.env.windows` / `.env.macos`（以及 `config/*-packaging/*.env.example`）
   - `DSH_DESKTOP_APP_ID=net.i-do.desktop`（appId 校验要求反向域名，`i-do` 含连字符合法）
3. `apps/desktop/src/main.ts`
   - 协议注册与处理：`dsh` → `ido`，`dsh://open` → `ido://open`
4. `apps/desktop/package.json`
   - `description` 改为 i-do 描述；`author` 按新主体填写
5. 注意副作用：`productName` 变化会改变安装目录、开始菜单名称、卸载项与 userData 目录（当前为 `%APPDATA%\@deepseek-ai\dsh-desktop`）。老用户体验迁移需单独说明，必要时增加数据目录迁移逻辑（可放二期）。

### 4.2 阶段二：图标与 logo

素材准备（已工具化）：

工具：`scripts/brand/render-icons.mjs`（Node ESM，无构建步骤）。读取源位图后描摹轮廓，直接写出桌面端资源与文档站字标，并生成预览图。

```powershell
node scripts/brand/render-icons.mjs

# 指定输入输出
node scripts/brand/render-icons.mjs --source docs/logo/logo.png --output apps/desktop/resources
```

可选参数：`--source` 源位图、`--output` 桌面资源目录（默认 `apps/desktop/resources`）、`--wordmark` 字标路径（默认 `website/public/wordmark.svg`）、`--preview` 预览目录（默认 `docs/logo`）、`--sharp` sharp 模块目录（依赖尚未安装时使用）。

建议在根 `package.json` 增加：`"brand:icons": "node scripts/brand/render-icons.mjs"`。

1. 工具输出：`icon.svg`（1104 画布，PWA 图标源）、`icon-windows.svg`（1024 画布，含 `tray-glyph`）、`icon-macos.svg`（1104 画布）、三个同名 PNG、`tray-windows.ico`（7 帧）、`website/public/wordmark.svg`，以及 `docs/logo/preview-*.png`。
   electron-builder 的 Windows/macOS 应用图标读 1024 PNG（`electron-builder-config.mjs:167/248`），`icon.png` 另作为运行时资源被复制进安装目录（`:162`）。
2. 校验托盘链路：`icon-windows.svg` 必须保留 `<g id="tray-glyph">` 且该组不得自带 `transform`（`render-tray-icon.ts` 会插入 1.2 倍放大，重复属性会导致 XML 解析失败）。工具已按该结构输出，可用 `pnpm --filter @deepseek-ai/dsh-desktop run render:tray-icon` 复核。
3. 文档站字标使用 `currentColor`，保持 `config.ts:184-189` 的内联替换逻辑不变。
4. Web/PWA 图标：运行 `apps/web/scripts/render-app-icons.ts` 从新的 `icon.svg` 重新产出。
5. 安装器侧栏：`uninstaller-sidebar.bmp` 由构建目录生成，需确认生成脚本是否内嵌旧 logo；若有，替换生成源。

验收：`icon-windows.png` 在 Windows 资源管理器中显示正常；托盘图标在 16/24/32 缩放下不糊；macOS Dock 图标无白边；浏览器标签页 favicon 正确。

### 4.3 阶段三：域名与服务端点

1. `apps/desktop/scripts/desktop-auto-update-environment.mjs`
   - `UPDATE_ENVIRONMENTS.production.fixedOrigin` → `https://download.i-do.net`
   - `desktopLatestInstallerFilename()` 前缀 `dsh-latest-` → `ido-latest-`
   - `releasePrefix` 中的 `dsh-desk` 视部署需要改名（会改变 COS 对象键，需与运维同步）
2. 环境模板与预设
   - `DSH_DESKTOP_MANDATORY_UPDATE_PROD_ORIGIN=https://policy.i-do.net`
   - `DOWNLOAD_TEST_ORIGIN` / `DOWNLOAD_PROD_*` 按 i-do 的 COS 桶与 CDN 填写
   - Web 登录来源白名单 `allowedAuthOrigins` 指向 i-do 站点
3. 文档站
   - `DOCS_BASE` 按部署路径设置（例如 `https://i-do.net/docs` 时填 `/docs/`）
   - `config.ts:161/168/331` 的仓库链接改为 `https://cnb.cool/zxui/ido`
4. 各 `package.json` 的 `repository.url` 改为 cnb 地址（发布元数据一致性，`pnpm hygiene` 会检查）

域名落地前提（需运维确认）：`i-do.net` 的 DNS 解析、TLS 证书、CDN 回源、COS 桶与访问策略、上传凭据。

### 4.4 阶段四：文案与本地化

1. `apps/desktop/src/locale.ts`：英文与中文两套字典中的产品名、关于面板、欢迎页、更新提示、退出确认全部替换。
2. `apps/desktop/installer/locales/*.json`：8 种语言各 3 处 `DeepSeek Harness`。
3. `README.md` / `README.zh.md`、`apps/desktop/README*.md`、`docs/` 首页与关键指南的产品名与仓库链接。
4. 文档站标题与描述：`website/.vitepress/config.ts:179-180`。
5. 界面文案需经 typed 字典与 `t` 输出，仓库内 `verify-client-ui-i18n` 会拒绝硬编码文案。

### 4.5 阶段五：构建与验证

```powershell
pnpm install
pnpm typecheck
pnpm build                       # build:artifacts + build:check
pnpm package:desktop:win:x64:unsigned   # 本机未签名包
pnpm docs:check
```

必查项：

- [ ] `pnpm build` 通过（含 `build:check`）
- [ ] 未签名 Windows 包可安装、可启动、窗口标题与图标正确
- [ ] 安装目录、开始菜单、卸载项显示为 `i-do`
- [ ] 托盘图标、协议 `ido://` 生效
- [ ] 文档站标题、字标、favicon、仓库链接均为 i-do
- [ ] `pnpm docs:check` 通过（Windows 下符号链接用例需要开发者模式）
- [ ] 受影响的快照测试更新（产品名进入模型/用户可见输出时必须同步快照）

## 5. 风险与注意事项

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| `--force` 覆盖 cnb 线上仓库 | 线上历史不可恢复 | 先 `git fetch` 打备份 tag；确认 D8 |
| 品牌合规 | 保留 DeepSeek 名称/图标属于侵权风险 | 一期必须清除全部 DeepSeek 视觉与名称（模型名除外） |
| 图标源与实现不一致 | 托盘渲染报错或图标发虚 | 已生成 SVG 源与多帧 ICO；替换后运行 `render:tray-icon` 与 `render:app-icons` 复核 |
| userData 目录变化 | 老用户本地会话不可见 | 出一期迁移说明，或在主进程加目录迁移 |
| 自动更新对象键改名 | 已发布版本更新链路断裂 | 与运维同步 `releasePrefix`，必要时保留旧键兼容 |
| 上游持续演进 | 合并冲突 | 记录基线 commit，品牌改动集中到少量文件并单独成提交 |
| Windows 签名 | 未签名包无法分发 | 一期仅本机验证，签名证书与签名流程延后 |

## 6. 交付物

1. 本文档：`d:/ai/deepseek/i-do/docs/phase-1-rebrand-plan.md`
2. 品牌替换后的工作树，提交到 `https://cnb.cool/zxui/ido`
3. 一个可安装、可启动的 i-do Windows 未签名安装包
4. 品牌触点核对表（实施完成后逐项打勾）

## 7. 附录：关键命令速查

```powershell
# 构建与类型检查
pnpm build
pnpm typecheck

# 桌面端未签名打包（国内镜像加速）
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
$env:ELECTRON_BUILDER_BINARIES_MIRROR='https://registry.npmmirror.com/-/binary/electron-builder-binaries/'
pnpm package:desktop:win:x64:unsigned

# 图标重生成
pnpm --filter @deepseek-ai/dsh-desktop run render:tray-icon
pnpm --filter @deepseek-ai/web exec tsx scripts/render-app-icons.ts

# 文档站
pnpm docs:dev
pnpm docs:check

# 仓库
git remote -v
git push --force origin master
```
