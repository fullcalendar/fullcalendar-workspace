const gulp = require('gulp')
const rename = require('gulp-rename')
const filter = require('gulp-filter')
const modify = require('gulp-modify-file')
const zip = require('gulp-zip')

// determines the name of the ZIP file
const packageConf = require('../package.json')
const packageId = packageConf.name + '-' + packageConf.version

gulp.task('archive', [
  'archive:dist',
  'archive:misc',
  'archive:deps',
  'archive:demos'
], function() {
  // make the zip, with a single root directory of a similar name
  return gulp.src(`tmp/${packageId}/**/*`, { base: 'tmp/' })
    .pipe(zip(packageId + '.zip'))
    .pipe(gulp.dest('dist/'))
})

gulp.task('archive:dist', [ 'dist' ], function() {
  return gulp.src('dist/*.{js,css}') // matches unminified and minified files
    .pipe(gulp.dest(`tmp/${packageId}/`))
})

gulp.task('archive:misc', function() {
  return gulp.src([
    'LICENSE.*',
    'CHANGELOG.*',
    'CONTRIBUTING.*'
  ])
    .pipe(rename({ extname: '.txt' }))
    .pipe(gulp.dest(`tmp/${packageId}/`))
})

gulp.task('archive:deps', function() {
  return gulp.src([
    'node_modules/moment/min/moment.min.js',
    'node_modules/superagent/superagent.js',
    'node_modules/jquery/dist/jquery.min.js', // only for draggable example
    'node_modules/components-jqueryui/jquery-ui.min.js', // "
    'fullcalendar/dist/fullcalendar.min.js',
    'fullcalendar/dist/fullcalendar.min.css',
    'fullcalendar/dist/plugins/gcal.min.js',
    'fullcalendar/dist/jquery-ui-draggable.min.js'
  ])
    .pipe(gulp.dest(`tmp/${packageId}/lib/`))
})

// transfers demo files, transforming their paths to dependencies
gulp.task('archive:demos', function() {
  return gulp.src('**/*', { cwd: 'demos/', base: 'demos/' })
    .pipe(htmlFileFilter)
    .pipe(demoPathModify)
    .pipe(htmlFileFilter.restore) // pipe thru files that didn't match htmlFileFilter
    .pipe(gulp.dest(`tmp/${packageId}/demos/`))
})

const htmlFileFilter = filter('*.html', { restore: true })
const demoPathModify = modify(function(content) {
  return content.replace(
    /((?:src|href)=['"])([^'"]*)(['"])/g,
    function(m0, m1, m2, m3) {
      return m1 + transformDemoPath(m2) + m3
    }
  )
})

const transformDemoPath = function(path) {
  // reroot 3rd party libs
  path = path.replace('../node_modules/moment/', '../lib/')
  path = path.replace('../node_modules/superagent/', '../lib/')
  path = path.replace('../node_modules/jquery/dist/', '../lib/')
  path = path.replace('../node_modules/components-jqueryui/', '../lib/')
  path = path.replace('../fullcalendar/dist/', '../lib/')

  // reroot dist files to archive root
  path = path.replace('../dist/', '../')

  if (
    !/\.min\.(js|css)$/.test(path) && // not already minified
    !/^\w/.test(path) && // reference to demo util js/css file
    path !== '../lib/superagent.js' // doesn't have a .min.js, but that's okay
  ) {
    // use minified
    path = path.replace(/\/([^/]*)\.(js|css)$/, '/$1.min.$2')
  }

  return path
}
