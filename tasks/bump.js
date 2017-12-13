const gulp = require('gulp')
const gutil = require('gulp-util')
const modify = require('gulp-modify-file')
const moment = require('moment')

// parsed command line arguments
const { argv } = require('yargs')

// modifies the package.json file in-place with new release-specific values.
// called from the command-line.
gulp.task('bump', function(done) {
  if (!argv.version) {
    gutil.log('Please specify a command line --version argument.')
    done(1) // error code
  } else {
    return gulp.src('package.json')
      .pipe(
        modify(function(content) {
          const obj = JSON.parse(content)

          obj.releaseDate = moment().format('YYYY-MM-DD') // always do current date
          obj.version = argv.version // from command line

          return JSON.stringify(obj, null, '  ') // indent using two spaces
        })
      )
      .pipe(gulp.dest('./')) // overwrite itself!
  }
})
