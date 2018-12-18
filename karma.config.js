
module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: [ 'jasmine' ],

    files: [
      // dependencies for main lib
      'node_modules/moment/moment.js',
      'node_modules/superagent/superagent.js',
      'node_modules/jquery/dist/jquery.js',
      'node_modules/components-jqueryui/jquery-ui.js',
      'node_modules/components-jqueryui/themes/cupertino/jquery-ui.css',

      'fullcalendar/dist/fullcalendar.js',
      'fullcalendar/dist/locales-all.js',
      'fullcalendar/dist/fullcalendar.css',

      // main lib files
      'dist/scheduler.js',
      'dist/scheduler.css',

      // dependencies for tests
      'node_modules/xhr-mock/dist/xhr-mock.js', // TODO: should include this via require(), but .d.ts problems
      'node_modules/native-promise-only/lib/npo.src.js',
      'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
      'node_modules/jasmine-fixture/dist/jasmine-fixture.js',
      'node_modules/jquery-simulate/jquery.simulate.js',

      'tests/automated/base.css',
      'tmp/automated-tests.js',

      { // serve all other files
        pattern: '**/*',
        included: false, // don't immediately execute
        nocache: true, // don't let the webserver cache
        watched: false // don't let changes trigger tests to restart
      }
    ],

    preprocessors: {
      '**/*.js': [ 'sourcemap' ]
    },

    customLaunchers: {
      ChromeHeadless_custom: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox', // needed for TravisCI: https://docs.travis-ci.com/user/chrome#Sandboxing
          '--window-size=1280,1696' // some tests only work with larger window (w?, h?)
        ]
      }
    },

    reporters: [ 'dots' ]
  })
}
