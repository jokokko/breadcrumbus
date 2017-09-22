'use strict';

let addinSettings = {};

(async (api) => {

    let settings = {};
    let storage = browser.storage.sync;

    settings[contracts.OptionBreadcrumbHorizontal] = true;
    settings[contracts.OptionBreadcrumbVertical] = false;
    settings[contracts.OptionHidePageAction] = false;

    let noSyncStorage = (e) => {
        return e.message && e.message.indexOf("webextensions.storage.sync.enabled") > -1;
    };

    api.set = async (value) => {
        if (typeof(browser) === 'undefined') {
            return true;
        }

        try {
            await storage.set(value);
        } catch (e) {
            if (noSyncStorage(e))
            {
                storage = browser.storage.local;
                return api.set(value);
            }
        }
    };

    api.get = async () => {
        if (typeof(browser) === 'undefined') {
            return settings;
        }

        try {
            return await storage.get(settings);
        } catch (e) {
            if (noSyncStorage(e))
            {
                storage = browser.storage.local;
                return api.get();
            }
        }
    };

    return api;

})(addinSettings);