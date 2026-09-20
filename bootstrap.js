var chromeHandle;

function install() {}

async function startup({ id, rootURI }) {
  await Zotero.initializationPromise;

  const addonManagerStartup = Cc["@mozilla.org/addons/addon-manager-startup;1"]
    .getService(Ci.amIAddonManagerStartup);
  chromeHandle = addonManagerStartup.registerChrome(
    Services.io.newURI(`${rootURI}manifest.json`),
    [["content", "zotero-ai-note", "content/"]]
  );

  const context = { rootURI };
  context._globalThis = context;
  Services.scriptloader.loadSubScript(
    `${rootURI}content/zotero-ai-note.js`,
    context
  );

  Zotero.PreferencePanes.register({
    pluginID: id,
    src: `${rootURI}content/preferences.xhtml`,
    scripts: [`${rootURI}content/preferences.js`],
    label: "Zotero AI Note",
    image: `${rootURI}icon.svg`
  });

  await Zotero.ZoteroAINote.startup();
}

function onMainWindowLoad() {}

function onMainWindowUnload() {}

function shutdown(_data, reason) {
  if (reason === APP_SHUTDOWN) return;
  Zotero.ZoteroAINote?.shutdown();
  delete Zotero.ZoteroAINote;
  chromeHandle?.destruct();
  chromeHandle = null;
}

function uninstall() {}
