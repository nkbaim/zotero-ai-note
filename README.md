<p align="center">
  <img src="icon.svg" alt="Zotero AI Note 图标" width="128" height="128">
</p>

<h1 align="center">Zotero AI Note</h1>

<p align="center">
  使用 Qwen 或 DeepSeek 阅读 Zotero 中所选文献的 PDF，并自动生成结构化子笔记。
</p>

<p align="center">
  <a href="https://github.com/nkbaim/zotero-ai-note/releases/latest"><img src="https://img.shields.io/github/v/release/nkbaim/zotero-ai-note" alt="最新版本"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/nkbaim/zotero-ai-note" alt="MIT License"></a>
  <a href="https://github.com/nkbaim/zotero-ai-note/graphs/contributors"><img src="https://img.shields.io/github/contributors/nkbaim/zotero-ai-note" alt="贡献者"></a>
</p>

<p align="center">
  <a href="https://github.com/nkbaim/zotero-ai-note/releases/latest">下载最新版</a> ·
  <a href="https://github.com/nkbaim/zotero-ai-note/issues">问题反馈</a> ·
  <a href="CONTRIBUTING.md">参与贡献</a>
</p>

## 功能

- 在 Zotero 文献列表中一次选择一篇或多篇文献进行总结
- 支持直接选择文献下的 PDF 附件
- 使用 Zotero 内置 PDF 文本提取能力，不上传 PDF 文件本身
- 支持 DeepSeek 和 Qwen（阿里云百炼）两种 API 服务
- 两个服务分别保存 API Key、API 地址和模型名，切换时无需重复填写
- 设置页可发送一个极短请求，验证当前 API Key、地址和模型是否可用
- 自动生成研究概览、研究问题、方法与数据、主要发现、创新亮点、局限性、启示和关键词
- 为每篇成功处理的文献创建 Zotero 子笔记
- 长文献保留开头与结尾，并在笔记中明确标注截断情况
- 扫描版 PDF 无可提取文本时提示先进行 OCR
- 对模型输出进行 HTML 转义，避免把未经处理的 HTML 写入笔记

## 兼容性

- Zotero 9
- macOS、Windows 和 Linux
- 需要能够访问所配置 AI 服务的网络环境

插件清单采用 Zotero 9 推荐的兼容范围：`8.999` 至 `9.0.*`。

## 安装

1. 从 [Releases](https://github.com/nkbaim/zotero-ai-note/releases/latest) 下载最新的 `zotero-ai-note-*.xpi`。
2. 在 Zotero 中打开“工具 → 插件”。
3. 点击右上角齿轮按钮，选择“从文件安装插件”。
4. 选择下载的 `.xpi` 文件完成安装。

升级时直接安装新版 XPI 即可，已有设置会保留。

## 配置

打开“Zotero 设置 → Zotero AI Note”。

### DeepSeek

默认配置：

| 设置 | 默认值 |
|---|---|
| API 地址 | `https://api.deepseek.com` |
| 模型 | `deepseek-flash` |
| 环境变量 | `DEEPSEEK_API_KEY` |

在 DeepSeek 开放平台创建 API Key 后填入设置页。也可以在启动 Zotero 前设置 `DEEPSEEK_API_KEY`；环境变量优先于设置页中的值。

### Qwen（阿里云百炼）

默认配置：

| 设置 | 默认值 |
|---|---|
| API 地址 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 模型 | `qwen-plus` |
| 环境变量 | `DASHSCOPE_API_KEY` |

阿里云百炼不同地域或业务空间可能要求使用包含 Workspace ID 的专属 API 地址。请按照百炼控制台给出的 OpenAI 兼容地址修改设置。环境变量 `DASHSCOPE_API_KEY` 同样优先于设置页中的值。

### 验证连接

1. 选择 DeepSeek 或 Qwen。
2. 填写对应的 API Key、API 地址和模型名。
3. 点击“测试当前模型连接”。

插件会发送一个仅要求返回 `OK` 的短请求。成功时显示实际服务和模型；失败时显示 HTTP 状态或 API 返回的错误信息。该操作可能产生极少量 API 费用。

## 使用方法

1. 在 Zotero 中选中一篇或多篇带 PDF 附件的文献。
2. 右键选择“使用 AI 总结 PDF 并添加笔记”。
3. 等待右下角进度提示完成。
4. 展开文献条目，在其子笔记中查看“AI 文献总结”。

如果直接选中一个 PDF 附件，插件会将笔记添加到该 PDF 的父文献条目下。没有 PDF 的条目会被跳过。

## 笔记内容

默认提示词要求模型依次输出：

1. 研究概览
2. 研究问题
3. 方法与数据
4. 主要发现
5. 创新与亮点
6. 局限性
7. 可复用的启示
8. 关键词

笔记底部会记录实际使用的服务、模型，以及 PDF 文本是否被截断。AI 生成内容可能有误，请对照原文核验样本量、效应量、统计结果和结论。

## PDF 处理方式

插件优先调用 `Zotero.PDFWorker.getFullText()` 提取 PDF 文本，失败时尝试读取 Zotero 的全文索引缓存。

- 默认最多发送 `120000` 个字符，可在设置中调整为 `10000–500000`。
- 超过限制时保留约 65% 的开头和 35% 的结尾。
- 图片型或扫描型 PDF 没有文本层时，需要先使用 Zotero 或其他工具完成 OCR。

## 隐私与安全

处理文献时，以下内容会直接发送到当前选择的 AI API：

- 从 PDF 提取的文本
- 题名、作者、日期、期刊或出版社、DOI

插件不会把 PDF 文件本身上传到项目作者的服务器，不包含遥测，也不会在源码中保存 API Key。

如果通过设置页填写 API Key，它会保存在本机 Zotero 首选项中，但不会被插件加密。请勿处理不允许发送给第三方服务的敏感、保密或受限制文献。

## 常见问题

### 已选择 Qwen，却提示需要 DeepSeek API Key

请升级到 `0.2.3` 或更高版本。早期版本读取 Zotero 全局首选项时缺少作用域参数，会错误回退到 DeepSeek。

### 测试连接返回 401 或 403

检查 API Key 是否正确、是否属于当前地域或业务空间，并确认账号具有所选模型的调用权限。

### 测试连接返回 404

检查 API 地址。设置中应填写基础地址；填写完整的 `/chat/completions` 地址也受支持。

### 测试连接返回模型不存在

模型名必须与当前 API 服务和地域支持的名称完全一致。DeepSeek 与 Qwen 的模型名不可在对方的官方 API 地址上直接互换。

### 提示 PDF 没有可提取文本

PDF 很可能是扫描件或文本层损坏。完成 OCR 后重新运行总结。

### API 请求超时

检查网络代理和 API 地址。连接测试超时为 30 秒，完整文献总结超时为 180 秒。

## 从源码构建

需要 `bash`、`node`、`python3`、`zip` 和 `shasum`：

```bash
./scripts/check.sh
./scripts/build.sh
```

安装包生成在 `dist/`：

```text
dist/zotero-ai-note-<version>.xpi
```

检查脚本会验证清单和更新清单版本、JavaScript 语法、设置页 XML、格式化与 API 请求测试，以及源码中是否存在疑似硬编码 API Key。

## 项目结构

```text
zotero-ai-note/
├── .github/workflows/release.yml
├── bootstrap.js
├── manifest.json
├── updates.json
├── prefs.js
├── icon.svg
├── content/
│   ├── zotero-ai-note.js
│   ├── preferences.js
│   └── preferences.xhtml
├── tests/
│   └── format.test.js
└── scripts/
    ├── check.sh
    └── build.sh
```

## 发布流程

创建与 `manifest.json` 版本一致的标签，例如 `v0.2.3`。GitHub Actions 会运行检查、构建 XPI，并创建对应的 GitHub Release。

## 贡献者

- [Yang Du (@nkbaim)](https://github.com/nkbaim) — 创建者与维护者

欢迎提交问题和改进建议。代码贡献流程请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)，贡献者名单见 [CONTRIBUTORS.md](CONTRIBUTORS.md)。

## 许可证

本项目采用 [MIT License](LICENSE)。允许使用、复制、修改、合并、发布和分发，但须保留原版权及许可声明。
