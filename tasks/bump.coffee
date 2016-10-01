gulp = require('gulp')
gutil = require('gulp-util')
modify = require('gulp-modify')
moment = require('moment')

# parsed command line arguments
argv = require('yargs').argv

# modifies the package.json file in-place with new release-specific values.
# called from the command-line.
gulp.task 'bump', (done) ->
	if !argv.version
		gutil.log('Please specify a command line --version argument.')
		done(1) # error code
	else 
		gulp.src('package.json')
			.pipe(modify({
				fileModifier: (file, content) ->
					obj = JSON.parse(content)

					obj.releaseDate = moment().format('YYYY-MM-DD') # always do current date
					obj.version = argv.version # from command line

					JSON.stringify(obj, null, '  ') # indent using two spaces
			}))
			.pipe(gulp.dest('./')) # overwrite itself!
