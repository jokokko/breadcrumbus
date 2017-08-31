'use strict';

(function () {
    let app = angular.module("crumbapp", []);

    app.directive("ngClickonenter", [ClickOnEnter]);
    app.factory("port", [PortFactory]);
    app.service("navigateService", [NavigateService]);
    app.service("settingsService", [SettingsService]);
    app.controller("crumbctrl", ["$scope", "navigateService", "settingsService", "port", CrumbCtrl]);
    app.filter("shouldHideCrumb", [FilterFactory]);

    function ClickOnEnter() {

        return (scope, element) => {
            element.bind("keydown", function (event) {
                if (event.keyCode === 13) {
                    element.triggerHandler('click');
                }
            });
        };
    }

    function FilterFactory() {

        const hide = ["/", "#", "&"];

        return (items) => {

            return items.filter(item => {
                return item.display && item.display.length > 0 && !hide.includes(item.display);
            });
        };
    }

    function PortFactory() {
        if (typeof(browser) !== 'undefined') {
            return browser.runtime.connect({name: contracts.Port});
        }
        return {
            postMessage: () => {
            },
            onMessage: {
                addListener: () => {
                }
            }
        }
    }

    function SettingsService() {
        let settings = {};

        settings[contracts.OptionBreadcrumbHorizontal] = true;
        settings[contracts.OptionBreadcrumbVertical] = false;

        return {
            get: async () => {

                if (typeof(browser) === 'undefined') {
                    return settings;
                }

                return browser.storage.sync.get(settings);
            }
        }
    }

    function NavigateService() {
        return {
            currentTab: async () => {
                if (typeof(browser) === 'undefined') {
                    return [{url: "http://localhost.local/path/more?query=value&more=stuff#hash", id: 0}];
                }
                return browser.tabs.query({currentWindow: true, active: true});
            }
        }
    }

    class UriPart {
        constructor(partType, part, display = null) {
            this.partType = partType;
            this.part = part;
            this.display = display || part;
        }
    }

    function CrumbCtrl($scope, navigateService, settingsService, port) {

        let ctx = this;
        let handlers = {};

        ctx.$scope = $scope;
        ctx.settings = null;
        ctx.navigateService = navigateService;
        ctx.settingsService = settingsService;
        ctx.port = port;
        ctx.partCollections = [];
        ctx.navigate = ctx.navigate.bind(this);

        handlers[contracts.OpenURLCompleted] = () => {
            window.close();
        };

        port.onMessage.addListener(e => {
            let handler = handlers[e.event];
            if (handler) {
                handler(e, port);
            }
        });

        ctx.$onInit = async function () {
            let currentTab = await ctx.navigateService.currentTab();

            if (!currentTab) {
                return;
            }

            ctx.settings = await ctx.settingsService.get();

            ctx.partCollections = currentTab.map(currentTab => {
                let uri = new URL(currentTab.url);
                let host = new UriPart(contracts.UriPartHost, uri.origin, uri.hostname);
                let path = uri.pathname.split(/(?=\/)/g);

                let pathParts = path.map((item) => {
                    return new UriPart(contracts.UriParthPath, item);
                });

                let searchParts = uri.search.split(/(?=&)/g).map((item) => {
                    return new UriPart(contracts.UriPartSearch, item);
                });

                let hash = new UriPart(contracts.UriPartHash, uri.hash);

                return {
                    uriParts: [host, ...pathParts, ...searchParts, hash],
                    uri: uri,
                    id: currentTab.id
                }
            });

            $scope.$digest();
        };
    }

    CrumbCtrl.prototype.navigate = function (collection, part) {
        let ctx = this;

        let index = collection.uriParts.indexOf(part);
        let items = collection.uriParts.slice(0, index + 1);
        let target = items.reduce((uri, current) => {
            return uri + current.part;
        }, "");

        ctx.port.postMessage({command: contracts.OpenURL, payload: {tabId: collection.id, uri: target}});
    };
})(window);