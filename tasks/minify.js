const gulp = require('gulp')
const uglify = require('gulp-uglify')
const cssmin = require('gulp-cssmin')
const rename = require('gulp-rename')

gulp.task('minify', [
  'minify:js',
  'minify:css'
])

gulp.task('minify:js', [ 'webpack' ], function() {
  return gulp.src([
    'dist/*.js',
    '!dist/*.min.js' // avoid double minify
  ])
    .pipe(uglify({
      preserveComments: 'some' // keep comments starting with !
    }))
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('dist/'))
})

gulp.task('minify:css', [ 'webpack' ], function() {
  return gulp.src([
    'dist/*.css',
    '!dist/*.min.css' // avoid double minify
  ])
    .pipe(cssmin())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('dist/'))
})
