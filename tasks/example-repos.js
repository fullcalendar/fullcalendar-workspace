const gulp = require('gulp')
const shell = require('gulp-shell')

// try to build example repos
gulp.task('example-repos:build', [ 'webpack', 'ts-types' ], shell.task(
  './bin/build-example-repos.sh'
))
