# Changelog

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
