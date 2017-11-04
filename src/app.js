'use strict';

(function () {
    let app = angular.module("crumbapp", []);

    app.directive("ngClickonenter", [ClickOnEnter]);
    app.directive("ngOnmiddletclick", [OnMiddleClick]);
    app.factory("port", [PortFactory]);
    app.service("uriService", [UriService]);
    app.service("navigateService", [NavigateService]);
    app.service("settingsService", [SettingsService]);
    app.controller("crumbctrl", ["$scope", "navigateService", "settingsService", "port", "uriService", CrumbCtrl]);
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

    function OnMiddleClick() {

        return {
            scope: {
                middleAction: "&middleAction"
            },
            link: (scope, element) => {
                element.bind("mousedown", function (event) {
                    if (event.which === 2) {
                        scope.middleAction();
                    }
                });
            }
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

    function UriService() {
        return {
            get: (url) => {
                let uri = new URL(url);
                let host = new UriPart(contracts.UriPartHost, uri.origin, uri.hostname);
                let path = uri.pathname.split(/(?=\/)/g).filter(t => t.length > 1);
                let protocol = `${uri.protocol}//`;

                let parsedUri = psl.parse(uri.hostname);
                let subdomains = [];

                if (parsedUri.subdomain)
                {
                    let subdomainParts = parsedUri.subdomain.split(".");

                    subdomains = subdomainParts.map((t, i, a) => {
                        return new UriPart(contracts.UriPartSubdomain, `${protocol}${[t, ...a.slice(i+1)].join(".")}.${parsedUri.domain}`, `${t}.`);
                    });

                    host = new UriPart(contracts.UriPartHost, `${protocol}${parsedUri.domain}`, parsedUri.domain)
                }

                let pathParts = path.length > 0 ? path.reduce((acc, item) => {
                    acc.items.push(new UriPart(contracts.UriParthPath, acc.uri = acc.uri += item, item));
                    return acc;
                }, { items: [], uri: uri.origin }).items : [];

                let search = uri.search.split(/(?=&)/g).filter(t => t.length > 1);

                let searchParts = search.length > 0 ? search.reduce((acc, item) => {
                    acc.items.push(new UriPart(contracts.UriPartSearch, acc.uri = acc.uri += item, item));
                    return acc;
                },  { items: [], uri: `${uri.origin}${uri.pathname}` }).items : [];

                let hash = uri.hash === "" ? [] : [ new UriPart(contracts.UriPartHash, `${uri.origin}${uri.pathname}${uri.search}${uri.hash}`, uri.hash) ];

                return {
                    uriParts: [...subdomains, host, ...pathParts, ...searchParts, ...hash],
                    uri: uri
                }
            }
        }
    }

    function SettingsService() {
        return {
            get: async () => {

                return addinSettings.get();
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

    function CrumbCtrl($scope, navigateService, settingsService, port, uriService) {

        let ctx = this;
        let handlers = {};

        ctx.$scope = $scope;
        ctx.settings = null;
        ctx.navigateService = navigateService;
        ctx.settingsService = settingsService;
        ctx.port = port;
        ctx.partCollections = [];
        ctx.uriService = uriService;
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
                let ctx = this;

                let parts = ctx.uriService.get(currentTab.url);
                parts.id = currentTab.id;
                return parts;
            });

            $scope.$digest();
        };
    }

    CrumbCtrl.prototype.navigate = function (collection, part, newTab = false) {
        let ctx = this;

        ctx.port.postMessage({command: contracts.OpenURL, payload: {tabId: collection.id, uri: part.part, newTab: newTab }});
    };
})(window);