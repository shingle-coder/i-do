# i-do

English | [中文](README.zh.md)

i-do is an agent workspace built on the open-source [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) agent harness.

It keeps the upstream **everything-is-a-plugin** architecture and Cordis runtime, and ships a rebranded desktop application, web UI, and documentation site for the i-do deployment.

Documentation: [https://i-do.net](https://i-do.net)

## Developer preview

i-do is in _developer preview_ and iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

Review the safety notice in [SAFETY.md](SAFETY.md) before running the project.

<a id="run"></a>

## Run

<a id="run-from-source"></a>

### From source

```sh
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm run build` prepares the repository artifacts. `pnpm dsh web` uses those built artifacts without rebuilding.

## Fork notes

This repository is a second development of DeepSeek Harness. The phase-one scope covers artwork replacement, product naming, and service origins; the plan lives in `docs/superpowers/phase-1-rebrand-plan.md`.

Brand assets are generated from `docs/logo/logo.png`:

```sh
node scripts/brand/render-icons.mjs
```

## Community and support

- Primary repository: [cnb.cool/zxui/ido](https://cnb.cool/zxui/ido)
- Mirror repository: [github.com/shingle-coder/i-do](https://github.com/shingle-coder/i-do)
- Deployment domain: [i-do.net](https://i-do.net)

## Contributing

See [AGENTS.md](AGENTS.md) for repository rules and [docs/development.md](docs/development.md) for the development guide.

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Attribution

i-do is derived from DeepSeek Harness by DeepSeek AI. The original project and its MIT license are preserved in this repository; upstream documentation and design notes remain the work of their authors.
