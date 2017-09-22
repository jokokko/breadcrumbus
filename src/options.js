'use strict';

(function () {
    let app = angular.module("tabsapp", []);

    app.service("settingsService", [SettingsService]);
    app.controller("settingsctrl", ["$scope", "settingsService", SettingsCtrl]);

    function SettingsService() {
        return {
            get: async () => {
                return addinSettings.get();
            },
            set: async (value) => {
                return addinSettings.set(value);
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
            let ctx = this;
            ctx.settings = await ctx.settingsService.get();
            $scope.$digest();
        };
    }

    SettingsCtrl.prototype.save = async function() {
        let ctx = this;
        await ctx.settingsService.set(ctx.settings);
        await browser.runtime.sendMessage({event: contracts.SettingsUpdated, payload: ctx.settings });
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
            },{
                'key': contracts.OptionHidePageAction,
                'label': browser.i18n.getMessage('option_hide_page_action'),
            }]
        }];

})(window);