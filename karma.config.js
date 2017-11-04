module.exports = function(config) {
    config.set({
        frameworks: ['mocha', 'chai'],
        files: [
            'src/external/angular.min.js',
            'node_modules/angular-mocks/angular-mocks.js',
            'src/external/psl.min.js',
            'src/contracts.js',
            'src/settings.js',
            'src/app.js',
            'test/*.spec.js'
        ],
        reporters: ['spec'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['FirefoxHeadless'],
        customLaunchers: {
            FirefoxHeadless: {
                base: 'Firefox',
                flags: [ '-headless' ],
            },
        },
        autoWatch: false,
        singleRun: true,
        concurrency: Infinity
    })
};
