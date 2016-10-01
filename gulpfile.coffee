gulp = require('gulp')
del = require('del')

require('./tasks/modules')
require('./tasks/archive')
require('./tasks/minify')
require('./tasks/test')

# when running just `gulp`
gulp.task('default', [ 'dist' ])

# everything needed for running demos and developing
gulp.task('dev', [ 'modules:dev' ])

# watch anything that needs to be built (JS and CSS)
gulp.task('watch', [ 'modules:watch' ])

# generates all files that end up in package manager release
gulp.task('dist', [
	'modules'
	'minify'
])

# like dist, but runs tests and linting, and generates archive
gulp.task('release', [
	'dist'
	'archive'
	'test:single' # headless, single run
])

gulp.task 'clean', [
	'modules:clean'
	'minify:clean'
	'archive:clean'
], ->
	del([ # kill these directories, and anything leftover in them
		'dist/'
		'tmp/'
	])
