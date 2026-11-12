# i-do

[English](README.md) | 中文

i-do 是基于开源 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 智能体框架构建的 agent 工作台。

它保留上游**一切皆插件**的架构与 Cordis 运行时，并为 i-do 站点提供替换过品牌标识的桌面应用、Web UI 与文档站。

文档：[https://i-do.net](https://i-do.net)

## 开发者预览

i-do 处于 _开发者预览_ 阶段，正在快速迭代。**未来将出现破坏兼容性的变更。**

运行本项目前，请阅读 [SAFETY.zh.md](SAFETY.zh.md) 中的安全说明。

## 运行

### 从源码运行

```sh
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` 会准备仓库产物。`pnpm dsh web` 直接使用这些已构建产物，不会重新构建。

## 二开说明

本仓库是 DeepSeek Harness 的二次开发。一期范围包括品牌换标、产品改名与服务源切换，方案见 `docs/superpowers/phase-1-rebrand-plan.md`。

品牌资源由 `docs/logo/logo.png` 生成：

```sh
node scripts/brand/render-icons.mjs
```

## 社区与支持

- 主仓库：[cnb.cool/zxui/ido](https://cnb.cool/zxui/ido)
- 镜像仓库：[github.com/shingle-coder/i-do](https://github.com/shingle-coder/i-do)
- 部署域名：[i-do.net](https://i-do.net)

## 参与贡献

仓库规则见 [AGENTS.md](AGENTS.md)，开发指南见 [docs/development.zh.md](docs/development.zh.md)。

## 许可证

[MIT](LICENSE)

第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 致谢

i-do 源自 DeepSeek AI 的 DeepSeek Harness。本仓库保留原项目及其 MIT 许可证；上游文档与设计说明的著作权归原作者所有。
