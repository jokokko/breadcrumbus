'use strict';

(async () => {

    let actions = {};
    let handlers = {};

    ((api) => {

        let listener = null;

        let pageAction = (tabId, _, tab) => {
            if (!tab.url.match(/^about:/)) {
                browser.pageAction.show(tab.id);
            }
        };

        api.setState = (remove) => {
            remove && listener && listener() && (listener = null);
            !remove && !listener &&
            browser.tabs.onUpdated.addListener(pageAction) === undefined &&
            (listener = () => {
                browser.tabs.onUpdated.removeListener(pageAction);
                return true;
        });
        };
    })(actions);

    handlers[contracts.SettingsUpdated] = async (request) => {
        actions.setState(request.payload[contracts.OptionHidePageAction]);
    };

    browser.runtime.onMessage.addListener((m) => {
        let handler = handlers[m.event];
        if (handler) {
            handler(m);
        }
    });

    let settings = await addinSettings.get();
    actions.setState(settings[contracts.OptionHidePageAction]);
})();