
module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: [ 'jasmine' ],

    files: [

      'node_modules/moment/moment.js',
      'node_modules/superagent/superagent.js',
      'node_modules/jquery/dist/jquery.js',
      'node_modules/components-jqueryui/jquery-ui.js',
      'node_modules/components-jqueryui/themes/cupertino/jquery-ui.css',
      { pattern: 'node_modules/components-jqueryui/themes/cupertino/images/**', included: false, nocache: true, watched: false },
      'node_modules/xhr-mock/dist/xhr-mock.js',
      'node_modules/native-promise-only/lib/npo.src.js',
      'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
      'node_modules/jasmine-fixture/dist/jasmine-fixture.js',
      'node_modules/jquery-simulate/jquery.simulate.js',

      // files from main project
      'fullcalendar/dist/fullcalendar/main.+(js|css)',
      'fullcalendar/dist/fullcalendar-basic/main.+(js|css)',
      'fullcalendar/dist/fullcalendar-agenda/main.+(js|css)',
      'fullcalendar/dist/fullcalendar-list/main.+(js|css)',

      // plugin files (ordering matters because of dependencies)
      'dist/fullcalendar-timeline/main.+(js|css)',
      'dist/fullcalendar-resources/main.+(js|css)',
      'dist/fullcalendar-resource-basic/main.+(js|css)',
      'dist/fullcalendar-resource-agenda/main.+(js|css)',
      'dist/fullcalendar-resource-timeline/main.+(js|css)',
      { pattern: 'dist/*/*.map', included: false, nocache: true, watched: false },

      'tests/automated/base.css',
      { pattern: 'tests/automated/json/**', included: false, nocache: true, watched: false },
      'tmp/automated-tests.js',
      { pattern: 'tmp/automated-tests.js.map', included: false, nocache: true, watched: false }
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
