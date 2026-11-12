# i-do 文件清单索引（第一阶段盘点）

> 配套文档：`docs/superpowers/目录结构.md`（目录树与逐目录职责说明） 盘点时间：2026-11-12 · 盘点对象 `D:\ai\deepseek\i-do` 本目录下的 14 个 TSV 是逐文件明细，本文件说明它们怎么切、怎么读，并汇总全部统计数字。

---

## 一、统计口径

**目录排除**（目录名命中任一项，整棵子树跳过）：

```
node_modules  .git  dist  build  coverage  .turbo  .next  out  .cache tmp  __pycache__  .venv  venv  target  .desktop-build  .dsh-build  lib
```

**扩展名排除**：`.map`、`.tsbuildinfo`、`.pyc`、`.tgz`、`.log`、`.lock`

**统计方式**：`[System.IO.Directory]::EnumerateFiles` 配显式栈做一次深度优先遍历，剪枝在目录入栈时判定；文件字节取 `FileInfo.Length`；行数只对文本文件统计（二进制判定 = 扩展名黑名单 + 文件头 8192 字节 NUL 探测），文本按 4 MB 分块数换行符，末尾无换行补 1。目录共 2,947 个，目录树中显示的是含全部后代的递归值。单位 1 KB = 1024 B、1 MB = 1024 KB。

口径与基线的差异（7,881 个文件的来源）见 `docs/superpowers/目录结构.md` 第 1.3 节，此处不重复。

---

## 二、字段与切块方式

### 2.1 TSV 字段

| 列 | 含义 |
| --- | --- |
| 相对路径 | 相对仓库根，统一用正斜杠 `/` |
| 字节 | 文件长度（字节） |
| 行数 | 文本文件的行数；**二进制文件留空**，空值不等于 0 行 |
| 扩展名 | 含前导点（如 `.ts`）；无扩展名时留空 |
| 一级目录 | 顶层目录名；仓库根目录下的散落文件记为 `.` |
| 二级目录 | 顶层目录下的第一层子目录名；文件直接位于顶层目录时留空 |

编码为 UTF-8（带 BOM）、Tab 分隔，可直接用 Excel 打开；14 个文件合计 21,197 行数据。

### 2.2 切块规则

按「一级目录 / 二级目录」分组 → 分组名升序排列 → 贪心装箱，每块最多 **2,999 行数据 + 1 行表头 = 3,000 行**，保证一个子代理可以整块读完而不必分批。同一分组默认不被拆散，唯一例外是 `packages/client`（3,369 个文件）超过单块上限，被拆到 `packages-02.tsv` 与 `packages-03.tsv` 两块，读取时需连读。

`misc.tsv` 收纳除 `packages`、`.agents`、`snapshots`、`apps`、`docs` 之外的全部剩余分组，包含 51 个分组：根目录散落文件（1 组）、`.claude`（1 组）、`.github`（6 组）、`.ssh`（1 组）、`.trae`（1 组）、`benchmarks`（10 组）、`native`（2 组）、`patches`（1 组）、`python`（3 组）、`scripts`（11 组）、`vendor`（10 组）、`website`（4 组）。

---

## 三、切块清单（14 块）

| 文件 | 覆盖分组 | 数据行数 | 字节 |
| --- | --- | ---: | ---: |
| packages-01.tsv | packages/acp, packages/ 顶层文件, packages/api, packages/attachment, packages/boot, packages/browser-use, ... 共 7 组 | 799 | 6.4 MB |
| packages-02.tsv | packages/client | 2999 | 20.8 MB |
| packages-03.tsv | packages/client | 370 | 3.3 MB |
| packages-04.tsv | packages/compaction, packages/computer-use, packages/context, packages/core, packages/credentials, packages/deliverables, ... 共 7 组 | 707 | 4.9 MB |
| packages-05.tsv | packages/experimental, packages/extensions, packages/feedback, packages/fs, packages/goal, packages/guard | 2949 | 21.5 MB |
| packages-06.tsv | packages/host, packages/identity, packages/interaction, packages/jobs, packages/llm, packages/lsp, ... 共 26 组 | 2795 | 16.9 MB |
| packages-07.tsv | packages/test-support, packages/todo, packages/typert, packages/util, packages/web, packages/workflow, ... 共 7 组 | 771 | 4.8 MB |
| agents-01.tsv | .agents/notes | 2999 | 13.7 MB |
| agents-02.tsv | .agents/notes | 1092 | 6.0 MB |
| agents-03.tsv | .agents/skills | 50 | 373.9 KB |
| snapshots.tsv | snapshots/acp, snapshots/ 顶层文件, snapshots/sdk, snapshots/session, snapshots/web | 1974 | 11.8 MB |
| apps.tsv | apps/cli, apps/desktop, apps/desktop-host, apps/plugin-market-generator, apps/web | 1611 | 10.8 MB |
| docs.tsv | docs/ 顶层文件, docs/assets, docs/cookbook, docs/cordis-api, docs/cordis-tutorial, docs/defensive-patterns, ... 共 14 组 | 1167 | 14.2 MB |
| misc.tsv | .claude/ 顶层文件, 根目录, .github/ 顶层文件, .github/ISSUE_TEMPLATE, .github/issue-management, .github/preview-sizing, ... 共 51 组 | 914 | 9.7 MB |

注：上表「覆盖分组」列在分组超过 6 个时会截断显示，完整范围以 2.2 节的说明为准。全部 14 块的数据行数合计 21,197，与文件总数一致。

---

## 四、统计摘要

### 4.1 总量

| 指标 | 数值 |
| --- | ---: |
| 文件总数 | 21,197 |
| 总字节 | 152,091,917（145.0 MB） |
| 文本文件 | 21,114 |
| 二进制文件 | 83 |
| 文本总行数 | 2,493,863 |
| 目录节点 | 2,947 |
| 平均文件大小 | 7.0 KB |

### 4.2 按一级目录分布

| 一级目录 | 文件数 | 字节 | 文本行数 | 文件数占比 |
| --- | ---: | ---: | ---: | ---: |
| packages | 11,390 | 78.6 MB | 1,585,429 | 53.73% |
| .agents | 4,141 | 20.1 MB | 173,743 | 19.54% |
| snapshots | 1,974 | 11.8 MB | 130,875 | 9.31% |
| apps | 1,611 | 10.8 MB | 189,607 | 7.60% |
| docs | 1,167 | 14.2 MB | 211,484 | 5.51% |
| scripts | 465 | 5.2 MB | 115,843 | 2.19% |
| vendor | 81 | 329.7 KB | 9,080 | 0.38% |
| native | 79 | 176.1 KB | 4,011 | 0.37% |
| python | 69 | 495.7 KB | 10,365 | 0.33% |
| .github | 67 | 496.5 KB | 11,284 | 0.32% |
| 根目录 | 48 | 1.4 MB | 39,181 | 0.23% |
| benchmarks | 48 | 314.7 KB | 6,487 | 0.23% |
| website | 37 | 184.0 KB | 4,076 | 0.17% |
| patches | 12 | 1.1 MB | 1,816 | 0.06% |
| .trae | 6 | 53.9 KB | 554 | 0.03% |
| .ssh | 1 | 1.6 KB | 27 | 0.00% |
| .claude | 1 | 17 B | 1 | 0.00% |

### 4.3 按扩展名 Top 20

| 扩展名 | 文件数 | 字节 | 文件数占比 |
| --- | ---: | ---: | ---: |
| .ts | 6,328 | 61.1 MB | 29.85% |
| .md | 5,194 | 38.5 MB | 24.50% |
| .json | 3,718 | 8.6 MB | 17.54% |
| .yaml | 2,193 | 3.8 MB | 10.35% |
| .tsx | 869 | 9.9 MB | 4.10% |
| .jsonl | 782 | 7.6 MB | 3.69% |
| .yml | 774 | 717.0 KB | 3.65% |
| .css | 269 | 1.0 MB | 1.27% |
| .txt | 218 | 98.1 KB | 1.03% |
| .mjs | 216 | 905.8 KB | 1.02% |
| .py | 85 | 1,019.3 KB | 0.40% |
| .svg | 78 | 2.9 MB | 0.37% |
| .swift | 62 | 435.8 KB | 0.29% |
| .mts | 51 | 57.7 KB | 0.24% |
| .js | 42 | 82.4 KB | 0.20% |
| .png | 39 | 1.7 MB | 0.18% |
| .cs | 29 | 211.9 KB | 0.14% |
| .ps1 | 29 | 209.2 KB | 0.14% |
| （无扩展名） | 26 | 46.5 KB | 0.12% |
| .xlsx | 16 | 125.5 KB | 0.08% |

前 5 类（`.ts`、`.md`、`.json`、`.yaml`、`.tsx`）合计 18,302 个文件，占全部的 86.34%，是一个以 TypeScript + Markdown 为主的仓库。

### 4.4 最大的 30 个文件

| 文件 | 大小 | 行数 |
| --- | ---: | ---: |
| pnpm-lock.yaml | 1.2 MB | 34,860 |
| docs/logo/logo.ico | 1.0 MB | - |
| packages/extensions/tool-cordis/src/api-catalog.ts | 774.8 KB | 10,946 |
| patches/lexical@0.49.0.patch | 632.8 KB | 58 |
| apps/web/tests/fixtures/office/preview.ppt | 592.5 KB | - |
| packages/client/ui-settings-account/src/client/assets/onboarding-welcome.webp | 405.4 KB | - |
| packages/client/ui-settings-account/src/client/assets/onboarding-welcome-dark.webp | 398.5 KB | - |
| patches/@yao-pkg__pkg@6.21.0.patch | 392.9 KB | 165 |
| packages/client/ui-settings-account/src/client/assets/onboarding-welcome-zh.webp | 383.5 KB | - |
| packages/client/ui-settings-account/src/client/assets/onboarding-welcome-zh-dark.webp | 381.0 KB | - |
| .agents/notes/archived/manifest.json | 377.6 KB | 2,786 |
| docs/persistence-catalog.md | 358.0 KB | 9,426 |
| docs/persistence-catalog.zh.md | 356.2 KB | 9,428 |
| scripts/dependency-catalog/package-lock.json | 336.5 KB | 8,539 |
| packages/extensions/cordis-client-runner/src/client/slot-catalog.ts | 316.0 KB | 5,782 |
| packages/experimental/ptc-runtime-python/tests/runtime.spec.ts | 290.7 KB | 5,862 |
| packages/experimental/personalized-recommendations/docs/preview.svg | 277.2 KB | 36 |
| packages/context/agent-instructions/tests/agent-instructions.spec.ts | 275.3 KB | 6,586 |
| docs/config-catalog.zh.md | 247.7 KB | 5,310 |
| docs/config-catalog.md | 247.7 KB | 5,308 |
| docs/logo/logo.png | 243.6 KB | - |
| packages/client/ui-chat/tests/chat-view.client.spec.tsx | 230.6 KB | 4,918 |
| packages/typert/generator/tests/__snapshots__/type-model.spec.ts.snap | 224.0 KB | 6,492 |
| packages/client/ui-settings-account/src/client/assets/onboarding-recharge-zh-dark.webp | 219.5 KB | - |
| docs/persistence-schema.json | 215.3 KB | 1,347 |
| snapshots/sdk/plan-review/tool-schemas.expected.json | 215.2 KB | 4,688 |
| packages/experimental/client-ui-forge/src/client/locales.ts | 206.5 KB | 3,446 |
| docs/assets/ui-design-review/modal-grouping-comparison.png | 203.2 KB | - |
| packages/client/ui-settings-account/src/client/assets/onboarding-recharge-dark.webp | 201.9 KB | - |
| packages/client/ui-plugin-manager/tests/components.client.spec.tsx | 198.4 KB | 3,129 |

行数为 `-` 的是二进制文件。体积榜前 30 中，二进制资产（图标、图片、Office 样例）占 10 个，锁文件与补丁文件占 4 个，其余为源码与文档。

### 4.5 行数最多的 30 个源码文件

统计范围为非二进制文件，按行数降序。该榜中 20 个是 `*.spec.ts` / `*.spec.tsx` / `*.e2e.ts` 测试文件，另有 1 个位于 `tests/` 下的夹具，两者合计 21 个——榜单前 30 里测试相关文件占了七成，说明超大用例集中是这份代码库的显著特征。

| 文件 | 行数 | 大小 |
| --- | ---: | ---: |
| packages/extensions/tool-cordis/src/api-catalog.ts | 10,946 | 774.8 KB |
| packages/context/agent-instructions/tests/agent-instructions.spec.ts | 6,586 | 275.3 KB |
| packages/experimental/ptc-runtime-python/tests/runtime.spec.ts | 5,862 | 290.7 KB |
| packages/extensions/cordis-client-runner/src/client/slot-catalog.ts | 5,782 | 316.0 KB |
| packages/client/ui-chat/tests/chat-view.client.spec.tsx | 4,918 | 230.6 KB |
| packages/experimental/liveshare/tests/viewer-fixture.client.ts | 4,474 | 185.3 KB |
| packages/subagent/subagent/tests/continuation.spec.ts | 4,191 | 193.8 KB |
| packages/client/ui-trajectory/src/client/TrajectoryTable.tsx | 3,607 | 135.3 KB |
| packages/api/gateway/tests/gateway.client.spec.ts | 3,477 | 143.1 KB |
| packages/typert/generator/src/analyzer.ts | 3,471 | 148.5 KB |
| packages/experimental/client-ui-forge/src/client/locales.ts | 3,446 | 206.5 KB |
| scripts/smoke-python-runtime.py | 3,279 | 154.6 KB |
| packages/client/ui-conversation/src/client/locales.ts | 3,191 | 165.3 KB |
| packages/core/tools/tests/tools.spec.ts | 3,160 | 121.6 KB |
| packages/client/ui-chat/tests/conversation-node-definitions.client.spec.ts | 3,155 | 135.4 KB |
| apps/desktop/tests/main-startup.spec.ts | 3,145 | 167.1 KB |
| packages/client/ui-plugin-manager/tests/components.client.spec.tsx | 3,129 | 198.4 KB |
| packages/core/tool-executor-ptc/tests/ptc.spec.ts | 3,076 | 143.6 KB |
| packages/session/session-persistence-jsonl/tests/jsonl.spec.ts | 2,925 | 133.2 KB |
| packages/client/ui-workspace/tests/workspace-browser.client.spec.tsx | 2,838 | 138.6 KB |
| packages/boot/app-boot/tests/profile-resolution.spec.ts | 2,710 | 136.1 KB |
| packages/client/ui-settings-models/tests/components.client.spec.tsx | 2,669 | 131.0 KB |
| packages/experimental/ptc-runtime-python/py/bootstrap.py | 2,575 | 134.3 KB |
| packages/compaction/compaction-basic/tests/compaction-basic.spec.ts | 2,557 | 100.1 KB |
| apps/web/tests/forge-panel.e2e.ts | 2,538 | 164.3 KB |
| packages/boot/plugin-manager/tests/manager.spec.ts | 2,524 | 164.3 KB |
| packages/client/ui-schedule/tests/task-manager-page.client.spec.tsx | 2,497 | 137.1 KB |
| packages/experimental/client-ui-forge/tests/changes-tab.client.spec.tsx | 2,479 | 139.1 KB |
| packages/client/ui-plugin-manager/tests/manager-store.client.spec.ts | 2,428 | 131.3 KB |
| packages/client/ui-plugin-manager/src/client/locales.ts | 2,385 | 169.5 KB |

---

## 五、异常提示

1. **二进制文件的行数留空**（83 个），统计行数时需要先过滤空值，否则会把二进制当成 0 行文件参与排序。
2. **`packages/client` 横跨两块**（`packages-02.tsv` 2,999 行 + `packages-03.tsv` 370 行），任何按目录汇总的逻辑都必须合并这两块。
3. **`.ssh` 下的 PEM 私钥已计入清单**：1 个以主机 IP 命名的私钥文件（1,678 字节）不在排除规则内，已出现在 `misc.tsv`；清单只记录路径与大小，不含内容。是否应移出仓库或补入排除规则需人工确认。
4. **`.claude` 只有 1 个 17 字节的指针文件**（指向 `../.agents/skills`），扩展名为空属于正常情况，不是统计缺陷。
5. **`lib` 目录未计入**：与基线的 7,881 个文件差异全部来自这里，若需与基线对齐，把 `lib` 从排除规则去掉重跑即可。

---

## 六、后续消费建议

- 需要「某个目录里都有什么」：先看 `docs/superpowers/目录结构.md` 对应章节的目录树，再按分组名在本目录找到对应 TSV。
- 需要「某个文件多大、多少行」：直接在 TSV 里按相对路径检索，不必再扫盘。
- 需要「评估某块的阅读成本」：字节数用于估算上下文占用，行数用于估算逐行阅读的时间，两者在 `00-index.md` 4.2–4.5 节已给出全局分布。
- 单块最多 3,000 行，可整块读入；`misc.tsv` 虽然覆盖 51 个分组，但仍是一次可读完的规模（914 行）。
