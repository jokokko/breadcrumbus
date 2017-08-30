'use strict';

(function () {
    let app = angular.module("crumbapp", []);

    app.service("navigateService", [NavigateService]);
    app.service("settingsService", [SettingsService]);
    app.controller("crumbctrl", ["$scope", "navigateService", "settingsService", CrumbCtrl]);
    app.filter("shouldHideCrumb", [FilterFactory]);

    function FilterFactory() {

        const hide = ["/", "#", "&"];

        return (items) => {

            return items.filter(item => {
                return item.display && item.display.length > 0 && !hide.includes(item.display);
            });
        };
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
                    return [{ url: "http://localhost.local/path/more?query=value&more=stuff#hash", id: 0 }];
                }
                return browser.tabs.query({currentWindow: true, active: true});
            },
            navigate: (id, uri) => {
                if (typeof(browser) === 'undefined') {
                    return Promise.resolve(true);
                }
                return browser.tabs.update(id,{
                    active: true,
                    url: uri
                }).then(() => {
                    return true;
                }).catch(() => {
                    return false;
                });
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

    function CrumbCtrl($scope, navigateService, settingsService) {

        let ctx = this;

        ctx.$scope = $scope;
        ctx.settings = null;
        ctx.navigateService = navigateService;
        ctx.settingsService = settingsService;
        ctx.partCollections = [];
        ctx.navigate = ctx.navigate.bind(this);

        ctx.$onInit = async function () {
            let currentTab = await ctx.navigateService.currentTab();

            if (!currentTab)
            {
                return;
            }

            ctx.settings = await ctx.settingsService.get();

            ctx.partCollections = currentTab.map(currentTab =>
            {
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

    CrumbCtrl.prototype.navigate = async function (collection, part) {
        let ctx = this;

        let index = collection.uriParts.indexOf(part);
        let items = collection.uriParts.slice(0, index+1);
        let target = items.reduce((uri, current) => {
            return uri + current.part;
        }, "");

        let navigated = await ctx.navigateService.navigate(collection.id, target);

        if (navigated)
        {
            window.close();
        }
    };
})(window);