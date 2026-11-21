# iDo

iDo 是一款桌面 AI 智能体客户端，基于 DeepSeek Harness 构建。

本仓库只发布构建好的安装包与本说明，不包含项目源代码。

## 下载

- 最新版本：[Releases](https://github.com/shingle-coder/i-do/releases/latest)
- 当前版本：[v0.2.2-rc.2（Windows x64，未签名）](https://github.com/shingle-coder/i-do/releases/tag/desktop-v0.2.2-rc.2)

| 文件 | 说明 |
| --- | --- |
| `iDo-0.2.2-rc.2-win-x64-unsigned.exe` | Windows x64 安装包（322 MB） |
| `iDo-0.2.2-rc.2-win-x64-unsigned.exe.blockmap` | 增量更新使用的块映射文件 |

## 系统要求

- Windows 10 或 Windows 11，x64
- 约 1 GB 可用磁盘空间

## 安装

1. 下载 `iDo-0.2.2-rc.2-win-x64-unsigned.exe`。
2. 运行安装包。
3. 该构建未做代码签名，Windows SmartScreen 可能提示「未知发布者」，选择「更多信息」后点击「仍要运行」。
4. 按安装向导完成安装。

## 校验

安装包 SHA-256：

```text
7ADBD5334BED27259AEDE350CB199B7C052B86F623284BCFD2637A9938FD70AF
```

在 PowerShell 中校验：

```powershell
Get-FileHash -Algorithm SHA256 .\iDo-0.2.2-rc.2-win-x64-unsigned.exe
```

## 说明

- 当前版本为未签名测试构建，仅用于内部试用。
- 源代码与开发说明不在此仓库发布。
