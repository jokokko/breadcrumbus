/* eslint-env mocha */
/* global chai, expect */

(function () {

    chai.config.truncateThreshold = 0;

    const data = [
        {
            scenario: "three part TLD",
            uri: "https://service.signin.service.gov.uk/start?query=value&something=other#hash",
            expected:
                [
                    "https://service.signin.service.gov.uk",
                    "https://signin.service.gov.uk",
                    "https://service.signin.service.gov.uk/start",
                    "https://service.signin.service.gov.uk/start?query=value",
                    "https://service.signin.service.gov.uk/start?query=value&something=other",
                    "https://service.signin.service.gov.uk/start?query=value&something=other#hash"
                ]
        },
        {
            scenario: "single part TLD",
            uri: "http://www.google.fi/",
            expected:
                [
                    "http://www.google.fi",
                    "http://google.fi"
                ]
        },
        {
            scenario: "single part TLD",
            uri: "http://something.local/",
            expected:
                [
                    "http://something.local",
                ]
        },
        {
            scenario: "single part TLD",
            uri: "http://something.local/#hash",
            expected:
                [
                    "http://something.local",
                    "http://something.local/#hash",
                ]
        },
        {
            scenario: "single part TLD",
            uri: "http://something.local/?query",
            expected:
                [
                    "http://something.local",
                    "http://something.local/?query"
                ]
        },
        {
            scenario: "single part TLD",
            uri: "http://something.local/?query=value",
            expected:
                [
                    "http://something.local",
                    "http://something.local/?query=value"
                ]
        },
        {
            scenario: "non-existent multipart TLD",
            uri: "ftp://something.non.existent",
            expected:
                [
                    "ftp://something.non.existent"
                ]
        }
    ];

    let ctx = this;

    beforeEach(() => {
        angular.mock.module('crumbapp');
        angular.mock.inject(function (uriService) {
            ctx.sut = uriService;
        });
    });

    data.forEach(t => {
        describe('uriService', () => {

            it(`should handle ${t.scenario} in ${t.uri} by producing parts \n\t${t.expected.join("\n\t")}`, () => {

                let parts = ctx.sut.get(t.uri);

                let uris = parts.uriParts.map(p => {
                    return p.part;
                });

                expect(uris).to.include.ordered.members(t.expected);

            });
        });
    });

}());