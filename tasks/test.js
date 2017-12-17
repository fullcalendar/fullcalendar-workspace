const path = require('path')
const del = require('del')
const gulp = require('gulp')
const KarmaServer = require('karma').Server

const karmaConfigPath = path.join(__dirname, '../karma.config.js')

// runs a server, outputs a URL to visit.
// expects dist to be compiled or watcher to be running.
gulp.task('test', function() {
  new KarmaServer({
    configFile: karmaConfigPath,
    singleRun: false,
    autoWatch: true
  }, function(exitCode) { // plays best with developing from command line
    process.exit(exitCode)
  }).start()
})

// runs headlessly and continuously, watching files.
// expects dist to be compiled or watcher to be running.
gulp.task('test:headless', function() {
  new KarmaServer({
    configFile: karmaConfigPath,
    browsers: [ 'PhantomJS_custom' ],
    singleRun: false,
    autoWatch: true
  }, function(exitCode) { // plays best with developing from command line
    process.exit(exitCode)
  }).start()
})

// runs headlessly once, then exits
gulp.task('test:single', [ 'webpack' ], function(done) {
  new KarmaServer({
    configFile: karmaConfigPath,
    browsers: [ 'PhantomJS_custom' ],
    singleRun: true,
    autoWatch: false
  }).on('run_complete', function(browsers, results) { // plays best with CI and other tasks
    done(results.exitCode)
  }).start()
})

// copy files into the main repo in prep for running the main repo's tests
gulp.task('test-side-effects:install', [ 'webpack' ], function(done) {
  gulp.src([
    'dist/*.{js,css,map}',
    'tests/gpl-key.js' // so that the warning message doesn't show up
  ])
    .pipe(
      gulp.dest('fullcalendar/tmp/test-side-effects/')
    )
})

gulp.task('test-side-effects:clean', function(done) {
  return del([ 'fullcalendar/tmp/test-side-effects/' ])
})
