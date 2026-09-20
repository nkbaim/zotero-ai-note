# Changelog

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
