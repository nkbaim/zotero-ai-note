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
  "extensions.zotero-ai-note.zhipu.apiKey": "zhipu-key",
  "extensions.zotero-ai-note.zhipu.baseURL": "https://open.bigmodel.cn/api/paas/v4",
  "extensions.zotero-ai-note.zhipu.model": "glm-4.7-flash",
  "extensions.zotero-ai-note.mimo.apiKey": "mimo-key",
  "extensions.zotero-ai-note.mimo.baseURL": "https://api.xiaomimimo.com/v1",
  "extensions.zotero-ai-note.mimo.model": "mimo-v2.6-pro",
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
let currentName = "Alice <Admin>";
let currentUsername = "alice";
const requestHistory = [];
const queuedResponses = [];
const allSections = ["研究概览", "研究问题", "方法与数据", "主要发现", "创新与亮点", "局限性", "可复用的启示", "关键词"];
const completeSummary = allSections.map((section) => `## ${section}\n内容`).join("\n\n");
const preferenceReads = [];
const sandbox = {
  rootURI: "file:///test/",
  Services: { env: { get: () => "" } },
  Zotero: {
    Users: {
      getCurrentName: () => currentName,
      getCurrentUsername: () => currentUsername
    },
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
          response: queuedResponses.shift() || {
            choices: [{ finish_reason: "stop", message: {
              content: body.messages[0].content === "Reply with exactly: OK" ? "OK" : completeSummary
            } }],
            usage: { prompt_tokens: 120, completion_tokens: 30, total_tokens: 150 }
          }
        };
      }
    }
  }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("content/zotero-ai-note.js", "utf8"), sandbox);

const plugin = sandbox.Zotero.ZoteroAINote;
const preferenceElements = {
  "zotero-ai-note-provider": { value: "deepseek" },
  "zotero-ai-note-test-status": { textContent: "", style: {} },
  ...Object.fromEntries(["deepseek", "qwen", "zhipu", "mimo"].map((id) => [
    `zotero-ai-note-${id}-settings`, { hidden: id !== "deepseek" }
  ]))
};
const preferenceSandbox = {
  window: {},
  document: { getElementById: (id) => preferenceElements[id] },
  Zotero: sandbox.Zotero
};
vm.createContext(preferenceSandbox);
vm.runInContext(fs.readFileSync("content/preferences.js", "utf8"), preferenceSandbox);
const preferenceUI = preferenceSandbox.window.ZoteroAINotePreferences;
preferences["extensions.zotero-ai-note.provider"] = "qwen";
preferenceUI.init();
assert.equal(preferenceElements["zotero-ai-note-provider"].value, "qwen");
assert.equal(preferenceElements["zotero-ai-note-qwen-settings"].hidden, false);
assert.equal(preferenceElements["zotero-ai-note-deepseek-settings"].hidden, true);
preferenceElements["zotero-ai-note-provider"].value = "zhipu";
preferenceUI.updateProviderVisibility();
assert.equal(preferenceElements["zotero-ai-note-zhipu-settings"].hidden, false);
assert.equal(preferenceElements["zotero-ai-note-qwen-settings"].hidden, true);
preferences["extensions.zotero-ai-note.provider"] = "deepseek";
const html = plugin.markdownToNoteHTML(
  "## 主要发现\n- **有效** <script>alert(1)</script>\n1. `AUC` 为 0.91",
  { truncated: true, originalLength: 200000, generatedAt: new Date("2026-09-22T09:30:00+08:00") }
);

assert.match(html, /生成人：Alice &lt;Admin&gt;/);
assert.match(html, /生成时间：2026/);
assert.match(html, /所用模型：DeepSeek \/ deepseek-flash/);
assert.ok(html.indexOf("<h1>AI 文献总结</h1>") < html.indexOf("生成人："));
assert.ok(html.indexOf("所用模型：") < html.indexOf("<h3>主要发现</h3>"));
assert.equal(html.match(/DeepSeek \/ deepseek-flash/g).length, 1);
assert.match(html, /<h3>主要发现<\/h3>/);
assert.match(html, /<strong>有效<\/strong>/);
assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(html, /<script>/);
assert.match(html, /<code>AUC<\/code>/);
assert.match(html, /200,000/);
currentName = "";
assert.match(plugin.markdownToNoteHTML("内容"), /生成人：alice/);
currentUsername = "";
assert.match(plugin.markdownToNoteHTML("内容"), /生成人：当前用户/);
currentName = "Alice <Admin>";
currentUsername = "alice";
const warnedHtml = plugin.markdownToNoteHTML("## 研究概览\n部分内容", {
  warning: "⚠️ 内容被截断 <script>alert(1)</script>",
  provider: { label: "DeepSeek", model: "deepseek-flash" }
});
assert.match(warnedHtml, /⚠️ 内容被截断 &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.ok(warnedHtml.indexOf("所用模型：DeepSeek / deepseek-flash") < warnedHtml.indexOf("部分内容"));
assert.ok(warnedHtml.indexOf("部分内容") < warnedHtml.indexOf("本笔记由 AI 自动生成"));
assert.ok(warnedHtml.indexOf("本笔记由 AI 自动生成") < warnedHtml.indexOf("⚠️ 内容被截断"));
assert.ok(warnedHtml.indexOf("⚠️ 内容被截断") < warnedHtml.indexOf("</div>"));

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
  assert.equal(summaryResult.warning, null);
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
  assert.match(body.messages[0].content, /2250 token/);
  assert.match(body.messages[0].content, /每节约 281 token/);

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

  preferences["extensions.zotero-ai-note.provider"] = "zhipu";
  const zhipu = plugin.getProviderConfig();
  assert.equal(zhipu.label, "智谱 GLM");
  assert.equal(zhipu.model, "glm-4.7-flash");
  assert.equal(zhipu.baseURL, "https://open.bigmodel.cn/api/paas/v4");
  await plugin.requestSummary({
    item: {
      getField: () => "",
      getCreators: () => []
    },
    text: "Zhipu PDF text",
    truncated: false,
    originalLength: 15,
    provider: zhipu
  });
  assert.equal(lastRequest.url, "https://open.bigmodel.cn/api/paas/v4/chat/completions");
  assert.equal(lastRequest.options.headers.Authorization, "Bearer zhipu-key");
  const zhipuBody = JSON.parse(lastRequest.options.body);
  assert.equal(zhipuBody.model, "glm-4.7-flash");
  assert.deepEqual(zhipuBody.thinking, { type: "disabled" });

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
  await plugin.testProviderConnection(zhipu);
  const zhipuConnectionBody = JSON.parse(lastRequest.options.body);
  assert.equal(zhipuConnectionBody.model, "glm-4.7-flash");
  assert.deepEqual(zhipuConnectionBody.thinking, { type: "disabled" });
  const glm53 = { ...zhipu, model: "glm-5.3" };
  await plugin.testProviderConnection(glm53);
  const glm53ConnectionBody = JSON.parse(lastRequest.options.body);
  assert.deepEqual(glm53ConnectionBody.thinking, { type: "enabled" });
  assert.equal(glm53ConnectionBody.reasoning_effort, "low");
  await plugin.requestSummary({
    item: { getField: () => "", getCreators: () => [] },
    text: "GLM-5.3 PDF text",
    truncated: false,
    originalLength: 16,
    provider: glm53
  });
  const glm53SummaryBody = JSON.parse(lastRequest.options.body);
  assert.deepEqual(glm53SummaryBody.thinking, { type: "enabled" });
  assert.equal(glm53SummaryBody.reasoning_effort, "low");
  const request = sandbox.Zotero.HTTP.request;
  sandbox.Zotero.HTTP.request = async () => {
    const xmlhttp = {
      status: 400,
      response: { error: { message: "model not available" } },
      get responseText() { throw new Error("responseText getter should not be read"); }
    };
    throw { xmlhttp, message: "HTTP 400" };
  };
  try {
    await assert.rejects(plugin.testProviderConnection(glm53),
      /智谱 GLM API 请求失败（HTTP 400）：model not available/);
  } finally {
    sandbox.Zotero.HTTP.request = request;
  }
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

  queuedResponses.push({
    choices: [{ finish_reason: "stop", message: { content: "## 研究概览\n简洁概览\n## 关键词\n术语" } }],
    usage: { prompt_tokens: 110, completion_tokens: 80 }
  });
  const focusedStart = requestHistory.length;
  const seenUsage = [];
  const focused = await plugin.requestSummary({
    item: { getField: () => "", getCreators: () => [] },
    text: "PDF text",
    truncated: false,
    originalLength: 8,
    provider: deepseek,
    sections: ["研究概览", "关键词"],
    onUsage: (usage) => seenUsage.push(usage)
  });
  assert.equal(requestHistory.length - focusedStart, 1);
  assert.equal(focused.summary, "## 研究概览\n简洁概览\n## 关键词\n术语");
  assert.equal(focused.usage.input, 110);
  assert.equal(focused.usage.output, 80);
  assert.equal(seenUsage.length, 1);
  assert.match(JSON.parse(requestHistory[focusedStart].options.body).messages[0].content, /每节约 1125 token/);
  assert.deepEqual(Array.from(plugin.missingSummarySections(focused.summary, ["研究概览", "关键词"])), []);
  assert.deepEqual(Array.from(plugin.missingSummarySections("## 研究概览\n有内容", ["研究概览", "关键词"])), ["关键词"]);

  queuedResponses.push({ choices: [{ finish_reason: "stop", message: { content: "## 研究概览\n概览" } }] });
  const incompleteStart = requestHistory.length;
  const incomplete = await plugin.requestSummary({
    item: { getField: () => "", getCreators: () => [] },
    text: "PDF text",
    truncated: false,
    originalLength: 8,
    provider: deepseek,
    sections: ["研究概览", "关键词"]
  });
  assert.equal(incomplete.summary, "## 研究概览\n概览");
  assert.match(incomplete.warning, /未完整覆盖所选章节：关键词/);
  assert.match(incomplete.warning, /减少“笔记内容”的勾选项/);
  assert.equal(requestHistory.length - incompleteStart, 1);

  queuedResponses.push({ choices: [{ finish_reason: "length", message: { content: "## 研究概览\n截断" } }] });
  const truncatedStart = requestHistory.length;
  const truncated = await plugin.requestSummary({
    item: { getField: () => "", getCreators: () => [] },
    text: "PDF text",
    truncated: false,
    originalLength: 8,
    provider: deepseek,
    sections: ["研究概览", "关键词"]
  });
  assert.match(truncated.warning, /模型输出可能已被截断/);
  assert.match(truncated.warning, /未完整覆盖所选章节：关键词/);
  assert.equal(requestHistory.length - truncatedStart, 1);

  queuedResponses.push({ choices: [{ finish_reason: "length", message: { content: "" } }] });
  const emptyLength = await plugin.requestSummary({
    item: { getField: () => "", getCreators: () => [] },
    text: "PDF text",
    truncated: false,
    originalLength: 8,
    provider: deepseek,
    sections: ["研究概览"]
  });
  assert.equal(emptyLength.summary, "");
  assert.match(emptyLength.warning, /本次未返回可用正文/);

  queuedResponses.push({ choices: [{ finish_reason: "stop", message: { content: "" } }] });
  await assert.rejects(plugin.requestSummary({
    item: { getField: () => "", getCreators: () => [] },
    text: "PDF text",
    truncated: false,
    originalLength: 8,
    provider: deepseek,
    sections: ["研究概览"]
  }), /未返回总结内容/);

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
