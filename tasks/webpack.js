const gulp = require('gulp')
const webpack = require('webpack-stream')
const filter = require('gulp-filter')
const modify = require('gulp-modify-file')
const packageConfig = require('../package.json')
const webpackConfig = require('../webpack.config')


gulp.task('webpack', function() {
  return createStream()
})

gulp.task('webpack:dev', function() {
  return createStream(true)
})

gulp.task('webpack:watch', function() {
  return createStream(true, true)
})


function createStream(isDev, isWatch) {
  return gulp.src([]) // don't pass in any files. webpack handles that
    .pipe(
      webpack(Object.assign({}, webpackConfig, {
        devtool: isDev ? 'source-map' : false, // also 'inline-source-map'
        watch: isWatch || false
      }))
    )
    .pipe(
      // don't write bogus .css.js(.map) files webpack created for standalone css outputs
      filter([ '**', '!**/*.css.js*' ])
    )
    .pipe(
      // populate <%= %> variables in source code
      modify(function(content) {
        return content.replace(
          /<%=\s*(\w+)\s*%>/g,
          function(match, p1) {
            return packageConfig[p1]
          }
        )
      })
    )
    .pipe(
      gulp.dest(webpackConfig.output.path)
    )
}
