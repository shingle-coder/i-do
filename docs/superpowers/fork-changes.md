# iDo 二开修改清单

本文件记录 `d:/ai/deepseek/i-do` 相对上游 `deepseek-harness` 的全部改动，用于在同步上游后快速核对、补回二开功能。

配套文档：[一期二开方案](phase-1-rebrand-plan.md)。

## 1. 仓库与分支关系

| 仓库 | 路径 | 分支 | 角色 | 同步方式 |
| --- | --- | --- | --- | --- |
| 上游 | `https://github.com/deepseek-ai/deepseek-harness` | `master` | 只读基准，禁止改 | `git fetch upstream` / `upstream` remote |
| 本地基线 | `d:/ai/deepseek/deepseek-harness` | `master` | 上游镜像，保持与 GitHub 一致，不做二开提交 | `git pull` 后仅供本地比对 |
| 二开主仓库 | `d:/ai/deepseek/i-do` | `main` | 所有二开改动只在这里 | `origin` = cnb，`github` = 镜像 |

约定：

- 基线目录只用于比对和复刻，任何品牌改动都不提交到基线。
- 二开仓库保留上游完整提交历史，`upstream` 指向 GitHub 上游，`baseline` 指向本地基线目录。

## 2. 上游同步流程

```powershell
cd D:\ai\deepseek\i-do

git fetch upstream
git merge upstream/master        # 或按需 rebase

# 冲突按第 4 节规则处理后，重新生成派生资源
node scripts/brand/render-icons.mjs
pnpm --filter @deepseek-ai/dsh-web-frontend run render:app-icons

# 校验
pnpm run test:docs
pnpm run verify-translation-pairing README.md
```

同步后必须逐项确认第 3 节清单仍然成立；派生资源（图标、PWA 图标、字标）一律以「重跑脚本」为准，不要手工改回上游文件。

## 3. 修改清单

状态说明：已落地 = 已在 `main` 分支；计划中 = 一期尚未实施。

| 类别 | 涉及文件 | 改动 | 状态 | 冲突风险 |
| --- | --- | --- | --- | --- |
| 桌面图标 | `apps/desktop/resources/icon.svg`、`icon-windows.svg`、`icon-macos.svg` | 换成 iDo 图形，保留底板与 `filter` 组结构 | 已落地 | 上游若调整 `render-app-icons.ts` 依赖的组标记则需同步生成器 |
| 桌面位图 | `apps/desktop/resources/icon.png`、`icon-windows.png`、`icon-macos.png` | 由图标脚本生成的 1104/1024 位图 | 已落地 | 上游更新位图时取我方 |
| 托盘图标 | `apps/desktop/resources/tray-windows.ico` | 7 帧（16-64）iDo 托盘图标 | 已落地 | 低 |
| Web 图标 | `apps/web/public/icon-192.png`、`icon-512.png`、`icon-maskable-512.png`、`apple-touch-icon.png` | 由 `render-app-icons` 从新底板生成 | 已落地 | 上游重新生成时需重跑脚本 |
| 文档站字标 | `website/public/wordmark.svg` | iDo 字标，`currentColor` | 已落地 | 低 |
| 品牌工具 | `scripts/brand/render-icons.mjs` | 从 `docs/logo/logo.png` 描摹并生成全部图标资产 | 已落地 | 与上游脚本无交集 |
| 品牌素材 | `docs/logo/**` | 源图、衍生 SVG/PNG/ICO、预览图 | 已落地 | 低 |
| 文档 | `README.md`、`README.zh.md`、`README.i18n.yaml` | 改写为 iDo 项目说明并重录配对记录 | 已落地 | **高**，上游 README 持续更新 |
| 文档门禁 | `scripts/translation-pairing.manifest.json` | 追加 `docs/superpowers/**` 两条排除项 | 已落地 | 中，上游可能改动同文件 |
| 安装器品牌图 | `apps/desktop/installer/assets/brand*.png`、`uninstaller-sidebar.png` | 圆形底板 + iDo 字标的组合图（600×196、2 倍图、深浅两套）与卸载侧栏图 | 已落地 | 低 |
| 应用侧栏品牌 | `packages/client/ui-primitives/src/BrandMark.tsx`、`packages/client/ui-sidebar/src/client/SidebarRoot.tsx`、`packages/client/locale/src/locales/{zh,en}.ts` | 侧栏回退标识改用 iDo 图形，文案改为 `iDo 本地构建` / `iDo Local Build` | 已落地 | 中，上游改动侧栏品牌 slot 时需同步 |
| 依赖升级 | `.github/dependabot.yml` | 两个生态设置 `open-pull-requests-limit: 0`，镜像仓库不接收升级 PR | 已落地 | 低 |
| 二开文档 | `docs/superpowers/**` | 方案与修改清单 | 已落地 | 低 |
| 产品名 | `apps/desktop/scripts/electron-builder-config.mjs` | `PRODUCT_NAME` 常量，`productName`、安装包名、协议名、麦克风用途说明统一引用 | 已落地 | 中 |
| 产品名引用 | `apps/desktop/scripts/{smoke-packaged-runtime,package-target,package-macos,verify-retained-desktop,development-app}` | 移除 `DeepSeek Harness(.app/.exe)` 硬编码，改为 `${PRODUCT_NAME}` | 已落地 | 低 |
| 应用标识 | `apps/desktop/.env.windows`、`.env.macos`、`config/*-packaging/*.env.example` | `DSH_DESKTOP_APP_ID` 改为 `net.i-do.desktop` | 已落地 | 低 |
| 协议 | `apps/desktop/src/main.ts` | `dsh://` 改为 `ido://` | 计划中 | 中 |
| 界面文案 | `apps/desktop/src/locale.ts` | 8 种语言的产品名、关于菜单、欢迎页、托盘/退出/更新标题统一为 iDo；`applicationName` 取自 `aboutProduct` | 已落地 | **高**，上游持续改文案 |
| 欢迎页品牌 | `apps/desktop/renderer/assets/welcome-brand.svg` | 由鲸鱼 + deepseek 字标改为 iDo 标志与字标，深浅色随 `prefers-color-scheme` | 已落地 | 低 |
| Web 标题与图标 | `apps/web/index.html`、`apps/web/public/manifest.webmanifest`、`apps/web/public/favicon*.svg`、`apps/web/vite.config.ts`、`scripts/client-build-environment.ts` | 标题改为 `iDo` / `iDo Local Build`，PWA 名称、favicon 换成 iDo | 已落地 | 中 |
| 客户端产品名 | `packages/client/ui-settings-account`、`ui-settings-models`、`ui-plugin-manager`、`ui-sidebar-documentpreview` 的 locales | 设置、账号、模型预览、插件安装提示、Office 预览中的产品名改为 iDo | 已落地 | 中 |
| 安装器文案 | `apps/desktop/installer/locales/*.json` | 8 种语言共 24 处产品名替换为 iDo | 已落地 | 中 |
| 服务端点 | `apps/desktop/scripts/desktop-auto-update-environment.mjs` | 生产下载源、安装包前缀改为 iDo | 计划中 | 中 |
| 发布元数据 | 各 `package.json` 的 `repository.url` | 指向 iDo 仓库 | 计划中 | 低 |
| 文档站配置 | `website/.vitepress/config.ts` | 标题、描述、仓库链接、`DOCS_BASE` | 计划中 | 中 |

## 4. 冲突处理规则

1. **派生资源以脚本为准**：`apps/desktop/resources/*`、`apps/web/public/icon-*.png`、`apple-touch-icon.png`、`website/public/wordmark.svg` 冲突时保留任一版本都可以，随后重跑第 2 节两条命令覆盖。
2. **图标结构契约不可丢**：`icon.svg` 必须保留 `filter0_d`（阴影组）与 `filter1_ddi`（图形组）两个包裹，`icon-windows.svg` 必须保留无 `transform` 的 `tray-glyph` 组，否则 `render-app-icons.ts` 与 `render-tray-icon.ts` 会直接抛错。
3. **README 冲突**：以 iDo 版本为准；上游新增的章节按需人工摘取并本地化，处理完重跑 `verify-translation-pairing --write README.md`。
4. **manifest 冲突**：保留上游新增项，并确保 `docs/superpowers/phase-1-rebrand-plan.md`、`docs/superpowers/fork-changes.md` 两条排除项存在。
5. **品牌文案冲突**：`locale.ts`、`installer/locales/*.json` 取我方，但需要跟随上游新增的 key 补齐翻译，避免缺键回退英文。
6. **机制代码不改**：`packages/**`、`docs/architecture.md` 与上游保持一致，二开只在应用层与资源层。
7. **Dependabot 保持关闭**：同步后确认 `.github/dependabot.yml` 两个生态仍带 `open-pull-requests-limit: 0`，否则镜像仓库会重新产生升级分支与 PR。

## 5. 同步后的校验

```powershell
pnpm install
pnpm run test:docs
pnpm exec vitest run apps/web/tests/app-icons.spec.ts apps/desktop/tests/installer-packaging.spec.ts
pnpm package:desktop:win:x64:unsigned
```

预期：文档门禁全绿；`app-icons` 与安装器打包用例通过；安装包内图标、托盘图标、安装界面名称均为 iDo。

## 6. 变更记录

| 日期 | 内容 |
| --- | --- |
| 2026-11-12 | 建立二开仓库与主干分支；替换桌面图标、托盘图标、Web 安装图标、文档站字标；改写中英文 README 并通过文档门禁 |
| 2026-11-12 | 应用侧栏品牌替换为 iDo：新增 `BrandMark` 原语，侧栏回退标识与本地构建文案改为 iDo，同步侧栏快照与 Web 启动预期用例 |
| 2026-11-12 | 应用菜单「关于」、关于面板、欢迎页标志与文案、托盘/退出/更新标题、Web 标题与 PWA 名称、favicon、客户端设置与插件提示统一为 iDo；同步桌面与 Web 期望文件 |
