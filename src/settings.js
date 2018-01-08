'use strict';

let addinSettings = {};

(async (api) => {

    let settings = {};

    const browserDefined = typeof(browser) !== 'undefined';

    let storage = browserDefined ? browser.storage.sync : {};

    settings[contracts.OptionBreadcrumbHorizontal] = true;
    settings[contracts.OptionBreadcrumbVertical] = false;
    settings[contracts.OptionHidePageAction] = false;
    settings[contracts.OptionTheme] = "original";

    let noSyncStorage = (e) => {
        return e.message && e.message.indexOf("webextensions.storage.sync.enabled") > -1;
    };

    api.set = !browserDefined ? () => { return true; } : async (value) => {
        try {
            let result = await storage.set(value);
            settings = value;
            return result;
        } catch (e) {
            if (noSyncStorage(e))
            {
                storage = browser.storage.local;
                let result = api.set(value);
                settings = value;
                return result;
            }
        }
    };

    api.get = !browserDefined ? () => { return settings; } : async () => {
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