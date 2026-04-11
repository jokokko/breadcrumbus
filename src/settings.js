'use strict';

const addinSettings = (() => {
  const defaults = {
    [contracts.OptionBreadcrumbHorizontal]: true,
    [contracts.OptionBreadcrumbVertical]:   false,
    [contracts.OptionHidePageAction]:       false,
    [contracts.OptionTheme]:                'original',
  };

  let storage = browser.storage.sync;

  const noSyncStorage = (e) =>
    e.message && e.message.includes('webextensions.storage.sync.enabled');

  return {
    get: async () => {
      try {
        return await storage.get(defaults);
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
})();
