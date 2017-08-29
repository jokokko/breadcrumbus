'use strict';

(function () {
    let app = angular.module("tabsapp", []);

    app.service("settingsService", [SettingsService]);
    app.controller("settingsctrl", ["$scope", "settingsService", SettingsCtrl]);

    function SettingsService() {
        let settings = {};

        settings[contracts.OptionBreadcrumbHorizontal] = true;
        settings[contracts.OptionBreadcrumbVertical] = false;

        return {
            get: async () => {

                return browser.storage.sync.get(settings);
            }
        }
    }

    function SettingsCtrl($scope, settingsService) {
        let ctx = this;
        ctx.settings = {};
        ctx.settingsService = settingsService;
        ctx.categories = categories;
        ctx.save = ctx.save.bind(this);

        ctx.$onInit = async function () {
            ctx.settings = await ctx.settingsService.get();
            $scope.$digest();
        };
    }

    SettingsCtrl.prototype.save = function () {
        let ctx = this;
        browser.storage.sync.set(ctx.settings);
    };

    const categories = [
        {
            'label': browser.i18n.getMessage('general'),
            'options': [{
                'key': contracts.OptionBreadcrumbVertical,
                'label': browser.i18n.getMessage('option_show_crumbs_vertical'),
            }, {
                'key': contracts.OptionBreadcrumbHorizontal,
                'label': browser.i18n.getMessage('option_show_crumbs_horizontal'),
            }]
        }];

})(window);