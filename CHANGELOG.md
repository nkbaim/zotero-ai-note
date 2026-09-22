# Changelog

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
