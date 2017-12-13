const path = require('path')
const { CheckerPlugin } = require('awesome-typescript-loader') // for https://github.com/webpack/webpack/issues/3460

module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: [ 'jasmine' ],

    files: [
      // dependencies for main lib
      'node_modules/moment/moment.js',
      'node_modules/jquery/dist/jquery.js',
      'node_modules/components-jqueryui/jquery-ui.js',
      'node_modules/components-jqueryui/themes/cupertino/jquery-ui.css',

      'fullcalendar/dist/fullcalendar.js',
      'fullcalendar/dist/locale-all.js',
      'fullcalendar/dist/fullcalendar.css',

      // main lib files
      'dist/scheduler.js',
      'dist/scheduler.css',

      // dependencies for tests
      'node_modules/native-promise-only/lib/npo.src.js',
      'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
      'node_modules/jasmine-fixture/dist/jasmine-fixture.js',
      'node_modules/jquery-simulate/jquery.simulate.js',
      'node_modules/jquery-mockjax/dist/jquery.mockjax.js',

      'tests/base.css',
      'tests/globals.js',
      'tests/moment.js',
      'tests/simulate.js',
      'tests/index.js',

      { // serve all other files
        pattern: '**/*',
        included: false, // don't immediately execute
        nocache: true, // don't let the webserver cache
        watched: false // don't let changes trigger tests to restart
      }
    ],

    preprocessors: {
      'tests/*.js': [ 'webpack', 'sourcemap' ]
    },

    webpack: {
      resolve: {
        extensions: [ '.js', '.ts' ]
      },
      module: {
        rules: [
          {
            test: /\.(js|ts)$/,
            loader: 'awesome-typescript-loader',
            options: {
              configFileName: path.resolve(__dirname, 'tests/tsconfig.json')
            }
          }
        ]
      },
      plugins: [ new CheckerPlugin() ],
      externals: {
        fullcalendar: { root: 'FullCalendar' }
      },
      devtool: 'inline-source-map'
    },

    customLaunchers: {
      PhantomJS_custom: {
        base: 'PhantomJS',
        options: {
          viewportSize: {
            width: 1024,
            height: 768
          }
        }
      }
    },

    reporters: [ 'dots' ]
  })
}
