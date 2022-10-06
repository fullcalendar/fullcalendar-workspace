const path = require('path')

module.exports = function(config) {
  const pkgDir = process.cwd()
  const builtFile = path.join(pkgDir, 'dist/index.js')

  config.set({
    files: [
      require.resolve('jquery'),
      require.resolve('jasmine-jquery'),
      require.resolve('jquery-simulate'),
      require.resolve('components-jqueryui'),
      builtFile,
    ],
    preprocessors: {
      [builtFile]: ['sourcemap'],
    },

    plugins: [
      require('karma-chrome-launcher'),
      require('karma-jasmine'),
      require('karma-sourcemap-loader'),
      require('karma-verbose-reporter'),
    ],

    // frameworks to use
    frameworks: ['jasmine'],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage', 'verbose'
    reporters: ['dots'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    customLaunchers: {
      ChromeHeadless_custom: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox', // needed for TravisCI: https://docs.travis-ci.com/user/chrome#Sandboxing
          '--window-size=1280,1696', // some tests only work with larger window (w?, h?)
        ],
      },
    },
  })
}
