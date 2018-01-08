'use strict';

(async () => {

    let handlers = {};
    let settings = await addinSettings.get();

    (() => {

        const stateShouldDisable = (tab) => tab.url.match(/^about:/) !== null;
        let stateMap = {};

        Object.defineProperty(this, "themeBrowserAction", {
            get() {
                return { "path": {
                        32: `resources/themes/${settings[contracts.OptionTheme]}/icon-32.png`
                    } }
            }
        });

        Object.defineProperty(this, "themePageAction", {
            get() {
                return { "path": {
                        32: `resources/themes/${settings[contracts.OptionTheme]}/icon-32-bw.png`
                    } }
            }
        });

        stateMap[false] = async (tabId) => {
                await browser.browserAction.setIcon(this.themeBrowserAction);
                await browser.browserAction.enable(tabId);
                if (!settings[contracts.OptionHidePageAction]) {
                    let theme = Object.assign({tabId: tabId}, this.themePageAction);
                    await browser.pageAction.setIcon(theme);
                    await browser.pageAction.show(tabId);
                } else {
                    await browser.pageAction.hide(tabId);
                }
            };

        stateMap[true] = async (tabId) => await browser.browserAction.disable(tabId);

        let pageAction =  async (tabId, _, tab) => {
                try {
                    stateMap[stateShouldDisable(tab)](tabId)
                } catch (e) {
                    console.log(`Setting state ${e}`);
                }
        };

        browser.tabs.onUpdated.addListener(pageAction)
    })();

    handlers[contracts.SettingsUpdated] = async (request) => {
        settings = request.payload;
    };

    browser.runtime.onMessage.addListener((m) => {
        let handler = handlers[m.event];
        if (handler) {
            handler(m);
        }
    });
})();