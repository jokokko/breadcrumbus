'use strict';

let root = {};

(function () {
    let handlers = {};

    handlers[contracts.OpenURL] = async function (request, port) {

        let payload = request.payload;

        let updated = false;

        if (payload.newTab) {
            updated = await browser.tabs.create({
                active: true,
                url: payload.uri,
                cookieStoreId: payload.container
            });
        }
        else {
            updated = await browser.tabs.update(payload.tabId, {
                active: true,
                url: payload.uri
            });
        }

        if (updated) {
            port.postMessage({event: contracts.OpenURLCompleted});
        }
    };

    function connected(p) {
        if (p.name === contracts.Port)
            p.onMessage.addListener(function (m) {
                let handler = handlers[m.command];
                if (handler) {
                    handler(m, p);
                }
            });
    }

    browser.runtime.onConnect.addListener(connected);
})(root);