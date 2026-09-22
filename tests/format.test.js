const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const preferences = {
  "extensions.zotero-ai-note.provider": "deepseek",
  "extensions.zotero-ai-note.deepseek.apiKey": "deepseek-key",
  "extensions.zotero-ai-note.deepseek.baseURL": "https://api.deepseek.com/",
  "extensions.zotero-ai-note.deepseek.model": "deepseek-flash",
  "extensions.zotero-ai-note.qwen.apiKey": "qwen-key",
  "extensions.zotero-ai-note.qwen.baseURL": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "extensions.zotero-ai-note.qwen.model": "qwen-plus",
  "extensions.zotero-ai-note.language": "中文",
  "extensions.zotero-ai-note.maxChars": 10000,
  "extensions.zotero-ai-note.maxOutputTokens": 3000,
  "extensions.zotero-ai-note.sections.overview": true,
  "extensions.zotero-ai-note.sections.question": true,
  "extensions.zotero-ai-note.sections.methods": true,
  "extensions.zotero-ai-note.sections.findings": true,
  "extensions.zotero-ai-note.sections.highlights": true,
  "extensions.zotero-ai-note.sections.limitations": true,
  "extensions.zotero-ai-note.sections.implications": true,
  "extensions.zotero-ai-note.sections.keywords": true
};
let lastRequest;
const requestHistory = [];
const queuedResponses = [];
const allSections = ["研究概览", "研究问题", "方法与数据", "主要发现", "创新与亮点", "局限性", "可复用的启示", "关键词"];
const completeSummary = allSections.map((section) => `## ${section}\n内容`).join("\n\n");
const preferenceReads = [];
const sandbox = {
  rootURI: "file:///test/",
  Services: { env: { get: () => "" } },
  Zotero: {
    Prefs: {
      get: (key, global) => {
        preferenceReads.push({ key, global });
        return preferences[key];
      }
    },
    HTTP: {
      request: async (method, url, options) => {
        lastRequest = { method, url, options };
        requestHistory.push(lastRequest);
        const body = JSON.parse(options.body);
        return {
          responseText: JSON.stringify(queuedResponses.shift() || {
            choices: [{ finish_reason: "stop", message: {
              content: body.messages[0].content === "Reply with exactly: OK" ? "OK" : completeSummary
            } }],
            usage: { prompt_tokens: 120, completion_tokens: 30, total_tokens: 150 }
          })
        };
      }
    }
  }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("content/zotero-ai-note.js", "utf8"), sandbox);

const plugin = sandbox.Zotero.ZoteroAINote;
const html = plugin.markdownToNoteHTML(
  "## 主要发现\n- **有效** <script>alert(1)</script>\n1. `AUC` 为 0.91",
  { truncated: true, originalLength: 200000 }
);

assert.match(html, /<h3>主要发现<\/h3>/);
assert.match(html, /<strong>有效<\/strong>/);
assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(html, /<script>/);
assert.match(html, /<code>AUC<\/code>/);
assert.match(html, /200,000/);

(async () => {
  const deepseek = plugin.getProviderConfig();
  const summaryResult = await plugin.requestSummary({
    item: {
      getField: (field) => ({ title: "Test", date: "2026" })[field] || "",
      getCreators: () => [{ firstName: "Ada", lastName: "Lovelace" }]
    },
    text: "PDF text",
    truncated: false,
    originalLength: 8,
    provider: deepseek
  });
  assert.equal(summaryResult.summary, completeSummary);
  assert.equal(summaryResult.usage.input, 120);
  assert.equal(summaryResult.usage.output, 30);
  assert.equal(lastRequest.method, "POST");
  assert.equal(lastRequest.url, "https://api.deepseek.com/chat/completions");
  assert.equal(lastRequest.options.headers.Authorization, "Bearer deepseek-key");
  const body = JSON.parse(lastRequest.options.body);
  assert.equal(body.model, "deepseek-flash");
  assert.equal(body.max_tokens, 3000);
  assert.deepEqual(body.thinking, { type: "disabled" });
  assert.match(body.messages[1].content, /PDF text/);
  assert.match(body.messages[0].content, /## 研究概览、## 研究问题、## 方法与数据/);
  assert.match(body.messages[0].content, /2400 个 token/);

  preferences["extensions.zotero-ai-note.sections.keywords"] = false;
  await plugin.requestSummary({
    item: {
      getField: () => "",
      getCreators: () => []
    },
    text: "PDF text without keywords",
    truncated: false,
    originalLength: 25,
    provider: deepseek
  });
  assert.doesNotMatch(JSON.parse(lastRequest.options.body).messages[0].content, /关键词/);

  preferences["extensions.zotero-ai-note.provider"] = "qwen";
  const qwen = plugin.getProviderConfig();
  await plugin.requestSummary({
    item: {
      getField: () => "",
      getCreators: () => []
    },
    text: "Qwen PDF text",
    truncated: false,
    originalLength: 13,
    provider: qwen
  });
  assert.equal(lastRequest.url, "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions");
  assert.equal(lastRequest.options.headers.Authorization, "Bearer qwen-key");
  const qwenBody = JSON.parse(lastRequest.options.body);
  assert.equal(qwenBody.model, "qwen-plus");
  assert.equal(qwenBody.thinking, undefined);

  const connectionReply = await plugin.testProviderConnection(qwen);
  assert.equal(connectionReply, "OK");
  const connectionBody = JSON.parse(lastRequest.options.body);
  assert.equal(connectionBody.max_tokens, 512);
  assert.equal(connectionBody.messages[0].content, "Reply with exactly: OK");
  assert.equal(connectionBody.thinking, undefined);
  assert.equal(lastRequest.options.timeout, 30000);

  await plugin.testProviderConnection(deepseek);
  const deepseekConnectionBody = JSON.parse(lastRequest.options.body);
  assert.deepEqual(deepseekConnectionBody.thinking, { type: "disabled" });
  assert.equal(plugin.extractAssistantText({
    choices: [{ message: { content: [{ type: "text", text: " OK " }] } }]
  }), "OK");
  const alternateUsage = plugin.getTokenUsage({
    usage: { input_tokens: 55, output_tokens: 12 }
  });
  assert.equal(alternateUsage.input, 55);
  assert.equal(alternateUsage.output, 12);
  assert.equal(plugin.getTokenUsage({}), null);
  assert.match(plugin.emptyResponseMessage(deepseek, {
    choices: [{ finish_reason: "length", message: { content: null, reasoning_content: "thinking" } }],
    usage: { completion_tokens_details: { reasoning_tokens: 512 } }
  }, "文本内容"), /finish_reason=length.*推理 tokens=512.*仅返回了推理内容/);

  preferences["extensions.zotero-ai-note.maxOutputTokens"] = 4500;
  assert.equal(plugin.getMaxOutputTokens(), 4500);
  preferences["extensions.zotero-ai-note.maxOutputTokens"] = 20000;
  assert.equal(plugin.getMaxOutputTokens(), 16000);
  preferences["extensions.zotero-ai-note.maxOutputTokens"] = 3000;

  queuedResponses.push(
    {
      choices: [{ finish_reason: "length", message: { content: "## 研究概览\n过长的内容" } }],
      usage: { prompt_tokens: 100, completion_tokens: 3000 }
    },
    {
      choices: [{ finish_reason: "stop", message: { content: "## 研究概览\n简洁概览\n## 关键词\n术语" } }],
      usage: { prompt_tokens: 110, completion_tokens: 80 }
    }
  );
  const retryStart = requestHistory.length;
  const seenUsage = [];
  let retryNotices = 0;
  const retried = await plugin.requestSummary({
    item: { getField: () => "", getCreators: () => [] },
    text: "PDF text",
    truncated: false,
    originalLength: 8,
    provider: deepseek,
    sections: ["研究概览", "关键词"],
    onRetry: () => retryNotices++,
    onUsage: (usage) => seenUsage.push(usage)
  });
  assert.equal(requestHistory.length - retryStart, 2);
  assert.equal(retryNotices, 1);
  assert.equal(retried.summary, "## 研究概览\n简洁概览\n## 关键词\n术语");
  assert.equal(retried.usage.input, 210);
  assert.equal(retried.usage.output, 3080);
  assert.equal(seenUsage.length, 2);
  assert.match(JSON.parse(requestHistory[retryStart + 1].options.body).messages[0].content, /1800 个 token/);
  assert.deepEqual(Array.from(plugin.missingSummarySections(retried.summary, ["研究概览", "关键词"])), []);
  assert.deepEqual(Array.from(plugin.missingSummarySections("## 研究概览\n有内容", ["研究概览", "关键词"])), ["关键词"]);

  queuedResponses.push(
    { choices: [{ finish_reason: "stop", message: { content: "## 研究概览\n概览" } }] },
    { choices: [{ finish_reason: "stop", message: { content: "## 研究概览\n概览\n## 关键词\n术语" } }] }
  );
  const incompleteStart = requestHistory.length;
  await plugin.requestSummary({
    item: { getField: () => "", getCreators: () => [] },
    text: "PDF text",
    truncated: false,
    originalLength: 8,
    provider: deepseek,
    sections: ["研究概览", "关键词"]
  });
  assert.equal(requestHistory.length - incompleteStart, 2);

  queuedResponses.push(
    { choices: [{ finish_reason: "length", message: { content: "## 研究概览\n截断" } }] },
    { choices: [{ finish_reason: "length", message: { content: "## 研究概览\n仍然截断" } }] }
  );
  await assert.rejects(plugin.requestSummary({
    item: { getField: () => "", getCreators: () => [] },
    text: "PDF text",
    truncated: false,
    originalLength: 8,
    provider: deepseek,
    sections: ["研究概览", "关键词"]
  }), /未保存不完整的笔记/);

  assert.ok(preferenceReads.length > 0);
  assert.ok(preferenceReads.every(({ global }) => global === true));

  for (const key of Object.keys(preferences).filter((key) => key.includes(".sections."))) {
    preferences[key] = false;
  }
  await assert.rejects(
    plugin.requestSummary({
      item: { getField: () => "", getCreators: () => [] },
      text: "PDF text",
      truncated: false,
      originalLength: 8,
      provider: qwen
    }),
    /至少需要选择一个笔记部分/
  );

  sandbox.Zotero.PDFWorker = {
    getFullText: async () => ({ text: "A".repeat(12000) })
  };
  const extracted = await plugin.extractPDFText({ id: 1, key: "TEST" });
  assert.equal(extracted.truncated, true);
  assert.equal(extracted.originalLength, 12000);
  assert.match(extracted.text, /中间内容因长度限制已省略/);

  console.log("Format and API tests passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
