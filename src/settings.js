'use strict';

let addinSettings = {};

(async (api) => {

    let settings = {};

    const browserDefined = typeof(browser) !== 'undefined';

    let storage = browserDefined ? browser.storage.sync : {};

    settings[contracts.OptionBreadcrumbHorizontal] = true;
    settings[contracts.OptionBreadcrumbVertical] = false;
    settings[contracts.OptionHidePageAction] = false;

    let noSyncStorage = (e) => {
        return e.message && e.message.indexOf("webextensions.storage.sync.enabled") > -1;
    };

    api.set = async (value) => {
        if (!browserDefined) {
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
        if (!browserDefined) {
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