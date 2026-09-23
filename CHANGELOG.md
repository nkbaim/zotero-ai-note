# Changelog

## 0.2.16 — 2026-09-23

### 本次更新

- 进一步缩小设置卡片之间的间隔和标题顶部留白，让“总结设置”“笔记内容”“关于”更紧凑地接续“AI 模型”。

## 0.2.15 — 2026-09-23

### 本次更新

- 将服务选择、所选服务的 API 配置和连接测试合并到同一个“AI 模型”面板；连接测试位于 API 配置之后。
- 统一各设置面板的顶部内边距与面板间距，减少“总结设置”“笔记内容”和“关于”前的空白。

## 0.2.14 — 2026-09-23

### 本次更新

- 修正模型服务 API Key 提示语的左侧对齐。
- 固定输出语言下拉框宽度，避免设置页样式将其拉伸至整行。
- 为“关于”链接添加 Zotero 外部浏览器打开行为，并缩小说明行的间距。

## 0.2.13 — 2026-09-23

### 本次更新

- 在插件设置页新增“关于”面板，显示当前版本、GitHub 仓库、版本发布、问题反馈和许可证链接。
- 将 API Key 本机保存但不加密的提示移到当前服务配置卡片底部，并以小字显示。
- 统一下拉选择框样式并限制宽度，避免占满设置面板。

## 0.2.12 — 2026-09-23

### 本次更新

- 模型设置页只显示“当前服务”对应的配置卡片，切换 DeepSeek、Qwen 或智谱 GLM 时即时更新，其他服务的设置仍会保留。
- 移除智谱 GLM 卡片中的默认模型提示语。
- 修复智谱请求失败时读取 `responseText` 导致的二次异常；现在会显示 HTTP 状态和 API 原本返回的错误信息。
- 对 `glm-5.3`（及同系列模型）按智谱要求启用思考模式，并使用 `low` 思考强度，避免因发送不支持的“关闭思考”参数而直接被 API 拒绝。其他智谱模型维持原有设置。

### 注意

- GLM-5.3 的思考 token 仍会占用输出额度；若笔记内容不完整，可提高输出上限或减少所选章节。
- 未使用用户凭据进行真实 API 调用验证；若仍失败，连接测试现在会显示更具体的服务端原因，请检查账户、模型权限及 API 地址。

## 0.2.11 — 2026-09-23

### 本次更新

- 新增智谱 GLM 服务，可在 AI 模型设置中独立填写 API Key、API 地址和模型。
- 智谱默认模型为 `glm-4.7-flash`（GLM-4.7-Flash），默认 API 地址为 `https://open.bigmodel.cn/api/paas/v4`，也支持环境变量 `ZHIPU_API_KEY`。
- 连接测试现在支持 DeepSeek、Qwen 和智谱 GLM 三种服务。
- 智谱总结和连接测试默认关闭思考模式，把输出额度留给可见的笔记正文。
- 美化模型设置页：服务选择、测试状态、各服务凭据和总结选项采用卡片式分组、统一输入框和间距。

## 0.2.10 — 2026-09-22

### 本次更新

- 在 AI 笔记标题下显示生成人、生成时间，以及实际使用的服务与模型。
- 生成人优先取当前 Zotero 用户姓名，其次取账号用户名；未登录时显示“当前用户”。生成时间使用本地时间。
- 从笔记底部移除重复的模型信息；截断或缺章提醒仍保留在笔记最底部。

## 0.2.9 — 2026-09-22

### 本次更新

- 当模型输出触及上限，或结果缺少所选章节时，保留已经生成的内容并创建 Zotero 子笔记，不再把这类情况当作整篇失败。
- 在笔记**最底部**标明可能截断或缺少的章节，并提示可以减少“笔记内容”勾选项、提高输出 token 上限后重新生成。
- 进度窗口将不完整笔记计入“已保存”，同时单独显示数量；每篇仍只请求 API 一次，不自动重试。
- GitHub Release 现在直接展示本版本的文字修改说明。

### 注意

- 输出上限或章节完整性仍受所选模型影响；请核对笔记底部提示和论文原文。
- 若 API 正常结束却完全没有正文，仍会报错，而不是创建空白笔记。

## 0.2.8 — 2026-09-22

- Tell the model the configured output limit and per-section budget in the first request, targeting 75% of the limit.
- Remove automatic retry to avoid an extra API call when a summary is truncated or incomplete.
- Continue rejecting incomplete summaries instead of saving partial notes.

## 0.2.7 — 2026-09-22

- Add a per-paper output-token limit in settings (default 3000, range 1000–16000).
- Ask models to distribute the output budget across all selected note sections.
- Retry once with a shorter target when output is cut off or a selected section is missing.
- Reject incomplete summaries instead of saving a truncated child note; count token usage for both attempts.

## 0.2.6 — 2026-09-20

- Show input and output token usage after each paper finishes.
- Keep a running token total for the current batch and show the final total in the progress window.
- Support both Chat Completions (`prompt_tokens` / `completion_tokens`) and Responses-style (`input_tokens` / `output_tokens`) usage fields.
- Report when an API response omits usage data instead of estimating it.

## 0.2.5 — 2026-09-20

- Disable DeepSeek thinking mode for connection tests and paper summaries so reasoning tokens cannot consume the entire output allowance.
- Increase the connection-test output allowance and support text-part response arrays.
- Include safe response diagnostics such as `finish_reason` and reasoning-token usage when an API returns no visible text.

## 0.2.4 — 2026-09-20

- Add eight persistent note-section checkboxes to the settings page, enabled by default.
- Generate only the selected sections and preserve their configured order.
- Stop before sending an API request when no note section is selected.

## 0.2.3 — 2026-09-20

- Add DeepSeek and Qwen provider selection with separate credentials and endpoints.
- Add an in-settings connection test for the selected provider and model.
- Fix Zotero global preference reads that incorrectly fell back to DeepSeek.
- Add batch PDF summarization, structured child notes, long-document truncation notices, and indexed-full-text fallback.
- Add Zotero 9 compatibility metadata and update manifest support.
