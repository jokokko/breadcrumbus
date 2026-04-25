'use strict';

const browser = globalThis.browser ?? globalThis.chrome;

// ── Contracts ──────────────────────────────────────────────────────────────────
const contracts = {
  Port: 'PortBreadcrumbus',
  OpenURL: 'OpenURL',
  OpenURLCompleted: 'OpenURLCompleted',
  SettingsUpdated: 'SettingsUpdated',
  UriPartSubdomain: 'UriPartSubdomain',
  UriPartHost: 'UriPartHost',
  UriParthPath: 'UriParthPath',
  UriPartSearch: 'UriPartSearch',
  UriPartHash: 'UriPartHash',
  OptionBreadcrumbVertical: 'optionBreadcrumbVertical',
  OptionBreadcrumbHorizontal: 'optionBreadcrumbHorizontal',
  OptionHidePageAction: 'optionHidePageAction',
  OptionTheme: 'OptionTheme',
};

// ── Settings ───────────────────────────────────────────────────────────────────
const defaultSettings = {
  [contracts.OptionBreadcrumbHorizontal]: true,
  [contracts.OptionBreadcrumbVertical]: false,
  [contracts.OptionHidePageAction]: false,
  [contracts.OptionTheme]: 'original',
};

let storage = browser.storage.sync;

const noSyncStorage = (e) =>
  e.message && e.message.includes('webextensions.storage.sync.enabled');

const addinSettings = {
  get: async () => {
    try {
      return await storage.get(defaultSettings);
    } catch (e) {
      if (noSyncStorage(e)) {
        storage = browser.storage.local;
        return addinSettings.get();
      }
      throw e;
    }
  },
  set: async (value) => {
    try {
      return await storage.set(value);
    } catch (e) {
      if (noSyncStorage(e)) {
        storage = browser.storage.local;
        return addinSettings.set(value);
      }
      throw e;
    }
  },
};

// ── URL navigation handler ─────────────────────────────────────────────────────
browser.runtime.onConnect.addListener((port) => {
  if (port.name !== contracts.Port) return;

  port.onMessage.addListener(async (m) => {
    if (m.command !== contracts.OpenURL) return;

    const { tabId, uri, container, newTab } = m.payload;
    let updated;

    if (newTab) {
      const params = { active: true, url: uri };
      if (container) params.cookieStoreId = container;
      updated = await browser.tabs.create(params);
    } else {
      updated = await browser.tabs.update(tabId, { active: true, url: uri });
    }

    if (updated) {
      port.postMessage({ event: contracts.OpenURLCompleted });
    }
  });
});

// ── Page / browser action visibility ──────────────────────────────────────────
let settings = null;

const shouldDisable = (tab) => /^about:/.test(tab.url);

async function setActionState(tabId, tab) {
  try {
    if (!settings) settings = await addinSettings.get();

    if (shouldDisable(tab)) {
      await browser.action.disable(tabId);
      return;
    }

    const theme = settings[contracts.OptionTheme];
    await browser.action.setIcon({ tabId, path: { 32: `resources/themes/${theme}/icon-32.png` } });
    await browser.action.enable(tabId);

    if (browser.pageAction) {
      if (!settings[contracts.OptionHidePageAction]) {
        await browser.pageAction.setIcon({ tabId, path: { 32: `resources/themes/${theme}/icon-32-bw.png` } });
        await browser.pageAction.show(tabId);
      } else {
        await browser.pageAction.hide(tabId);
      }
    }
  } catch (e) {
    console.error('Setting page action state:', e);
  }
}

async function refreshAllTabs(nextSettings = null) {
  settings = nextSettings ?? await addinSettings.get();
  const theme = settings[contracts.OptionTheme];
  await browser.action.setIcon({ path: { 32: `resources/themes/${theme}/icon-32.png` } });

  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    await setActionState(tab.id, tab);
  }
}

browser.tabs.onUpdated.addListener(async (tabId, _, tab) => {
  await setActionState(tabId, tab);
});

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await browser.tabs.get(tabId);
  await setActionState(tabId, tab);
});

browser.runtime.onMessage.addListener(async (m) => {
  if (m.event === contracts.SettingsUpdated) {
    await refreshAllTabs(m.payload);
  }
});

// Initialize on startup
refreshAllTabs().catch((e) => console.error('Initializing action state:', e));
