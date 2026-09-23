window.ZoteroAINotePreferences = {
  init() {
    const provider = document.getElementById("zotero-ai-note-provider");
    const saved = Zotero.Prefs.get("extensions.zotero-ai-note.provider", true);
    if (["deepseek", "qwen", "zhipu", "mimo"].includes(saved)) provider.value = saved;
    this.updateProviderVisibility();
  },

  updateProviderVisibility() {
    const selected = document.getElementById("zotero-ai-note-provider").value;
    for (const providerID of ["deepseek", "qwen", "zhipu", "mimo"]) {
      document.getElementById(`zotero-ai-note-${providerID}-settings`).hidden = providerID !== selected;
    }
    this.setStatus(document.getElementById("zotero-ai-note-test-status"), "", false);
  },

  openExternalLink(event) {
    event.preventDefault();
    Zotero.launchURL(event.currentTarget.href);
  },

  async testConnection() {
    const button = document.getElementById("zotero-ai-note-test-connection");
    const status = document.getElementById("zotero-ai-note-test-status");
    const providerID = document.getElementById("zotero-ai-note-provider").value;
    const labels = {
      deepseek: "DeepSeek",
      qwen: "Qwen",
      zhipu: "智谱 GLM",
      mimo: "MiMo（小米）"
    };
    const label = labels[providerID] || labels.deepseek;
    const savedConfig = Zotero.ZoteroAINote.getProviderConfig();
    const apiKey = document.getElementById(`zotero-ai-note-${providerID}-api-key`).value.trim()
      || (savedConfig.id === providerID ? savedConfig.apiKey : "");
    const baseURL = document.getElementById(`zotero-ai-note-${providerID}-base-url`).value.trim();
    const model = document.getElementById(`zotero-ai-note-${providerID}-model`).value.trim();

    if (!apiKey || !baseURL || !model) {
      this.setStatus(status, `请完整填写 ${label} 的 API Key、API 地址和模型名。`, true);
      return;
    }

    button.disabled = true;
    button.label = "正在测试…";
    this.setStatus(status, `正在连接 ${label}…`, false);

    try {
      const reply = await Zotero.ZoteroAINote.testProviderConnection({
        id: providerID,
        label,
        apiKey,
        baseURL,
        model
      });
      const preview = reply.replace(/\s+/g, " ").slice(0, 80);
      this.setStatus(status, `连接成功：${label} / ${model}${preview ? `（${preview}）` : ""}`, false, true);
    } catch (error) {
      this.setStatus(status, `连接失败：${error?.message || String(error)}`, true);
    } finally {
      button.disabled = false;
      button.label = "测试当前模型连接";
    }
  },

  setStatus(element, message, isError, isSuccess = false) {
    element.textContent = message;
    element.style.color = isError
      ? "var(--fill-danger, #c62828)"
      : isSuccess
        ? "var(--fill-success, #2e7d32)"
        : "var(--fill-secondary, currentColor)";
  }
};
