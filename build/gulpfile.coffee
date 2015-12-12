del = require('del')
path = require('path')
karmaServer = require('karma').server
_ = require('underscore')
moment = require('moment')
gulp = require('gulp')
filter = require('gulp-filter')
rename = require('gulp-rename')
replace = require('gulp-replace')
template = require('gulp-template')
plumber = require('gulp-plumber') # for routing error messages to stdout
concat = require('gulp-concat')
coffee = require('gulp-coffee')
sourcemaps = require('gulp-sourcemaps')
uglify = require('gulp-uglify')
cssmin = require('gulp-cssmin')
zip = require('gulp-zip')
bump = require('gulp-bump')
runSequence = require('run-sequence') # for chaining tasks in serial

# our configs (paths are relative to this script)
# NOTE: all other paths are relative to the *project root*
packageInfo = require('../package.json')
srcConfig = require('./src.conf')

# parsed command line arguments
argv = require('yargs').argv


# Main
# ----------------------------------------------------------------------------------------------------------------------


gulp.task 'default', [ 'dist' ]
gulp.task 'compile', [ 'compileJs', 'compileCss' ]
gulp.task 'minify', [ 'minifyJs', 'minifyCss' ]
gulp.task 'clean', [ 'cleanDist', 'cleanZip' ]
gulp.task 'watch', [ 'watchJs', 'watchCss' ]


# Dist (generates built JS/CSS and ZIP)
# ----------------------------------------------------------------------------------------------------------------------


gulp.task 'dist', (cb) ->
	runSequence('cleanDist', 'buildDist', cb)


gulp.task 'cleanDist', (cb) ->
	del('dist/*', cb)


gulp.task 'buildDist', [ 'compile', 'minify', 'zip' ]


# JS
# ----------------------------------------------------------------------------------------------------------------------


gulp.task 'compileJs', ->
	gulp.src srcConfig.scripts, { cwd: 'src/', base: 'src/' }
		.pipe plumber() # affects future streams
		.pipe concat('scheduler.coffee')
		.pipe coffee({ bare: true })
		.pipe template(getSrcTemplateVars()) # replaces <%= %> variables
		.pipe gulp.dest('dist/')

###
Will generate sourcemaps for coffee->JS, but won't replace <%= %> variables
###
gulp.task 'compileDevJs', ->
	gulp.src srcConfig.scripts, { cwd: 'src/', base: 'src/' }
		.pipe plumber() # affects future streams
		.pipe sourcemaps.init()
		.pipe concat('scheduler.coffee')
		.pipe coffee({ bare: true })
		.pipe sourcemaps.write('.', {
				includeContent: false,
				sourceRoot: '../src/' # relative to outputted file in dist
			})
		.pipe gulp.dest('dist/')


gulp.task 'minifyJs', [ 'compileJs' ], ->
	gulp.src [ 'dist/*.js', '!*.min.js' ] # matches unminified files
		.pipe uglify({ preserveComments: 'some' }) # keep comments starting with !
		.pipe rename({ extname: '.min.js' })
		.pipe gulp.dest('dist/')


gulp.task 'watchJs', [ 'compileDevJs' ], -> # will do an initial compile
	gulp.watch(
		srcConfig.scripts # TODO: also watch the conf file and reload
		{ cwd: 'src/' }
		[ 'compileDevJs' ]
	)


# CSS
# ----------------------------------------------------------------------------------------------------------------------


gulp.task 'compileCss', ->
	gulp.src srcConfig.stylesheets, { cwd: 'src/', base: 'src/' }
		.pipe concat('scheduler.css')
		.pipe template(getSrcTemplateVars()) # replaces <%= %> variables
		.pipe gulp.dest('dist/')


gulp.task 'minifyCss', ['compileCss'], ->
	gulp.src [ 'dist/*.css', '!*.min.css' ] # matches unminified files
		.pipe cssmin()
		.pipe rename({ extname: '.min.css' })
		.pipe gulp.dest('dist/')


gulp.task 'watchCss', [ 'compileCss' ], -> # will do an initial compile
	gulp.watch(
		srcConfig.stylesheets
		{ cwd: 'src/' }
		[ 'compileCss' ]
	)


# ZIP
# ----------------------------------------------------------------------------------------------------------------------


TRANSFER_DIR = 'build/temp/' + packageInfo.name + '-' + packageInfo.version + '/'
ZIP_FILENAME = packageInfo.name + '-' + packageInfo.version + '.zip'


gulp.task 'zip', (cb) ->
	runSequence('cleanZip', 'buildZip', cb)


gulp.task 'cleanZip', (cb) ->
	del([ TRANSFER_DIR, ZIP_FILENAME ], cb)


gulp.task 'buildZip', [
		'transferPackage'
		'transferDeps'
		'transferTheme'
		'transferMisc'
		'transferDemos'
	], ->
		gulp.src(TRANSFER_DIR + '**/*', { base: 'build/temp/' })
			.pipe zip(ZIP_FILENAME)
			.pipe gulp.dest('dist/')


# Transfering files into temp directory, for ZIP
# ----------------------------------------------------------------------------------------------------------------------


gulp.task 'transferPackage', [ 'compile', 'minify' ], ->
	gulp.src 'dist/*.{css,js}' # matches unminified and minified files
		.pipe gulp.dest(TRANSFER_DIR)


gulp.task 'transferDeps', ->
	gulp.src([
			'lib/moment/min/moment.min.js'
			'lib/jquery/dist/jquery.min.js'
			'lib/jquery-ui/jquery-ui.min.js'
			'lib/fullcalendar/dist/fullcalendar.min.js'
			'lib/fullcalendar/dist/fullcalendar.min.css'
			'lib/fullcalendar/dist/fullcalendar.print.css'
			'lib/fullcalendar/dist/gcal.js'
		])
		.pipe gulp.dest(TRANSFER_DIR + 'lib/')


gulp.task 'transferTheme', ->
	gulp.src([
			'jquery-ui.min.css'
			'images/*'
		], {
			cwd: 'lib/jquery-ui/themes/cupertino/'
			base: 'lib/jquery-ui/themes/cupertino/'
		})
		.pipe gulp.dest(TRANSFER_DIR + 'lib/cupertino/')


gulp.task 'transferMisc', ->
	gulp.src [ 'LICENSE.*', 'CHANGELOG.*' ]
		.pipe rename({ extname: '.txt' })
		.pipe gulp.dest(TRANSFER_DIR)


# Transfering *demo* files
# ----------------------------------------------------------------------------------------------------------------------


gulp.task 'transferDemos', ->
	htmlFileFilter = filter('*.html')

	gulp.src('**/*', {
			cwd: 'demos/'
			base: 'demos/'
		})
		.pipe htmlFileFilter
		.pipe demoPathReplace
		.pipe htmlFileFilter.restore()
		.pipe gulp.dest(TRANSFER_DIR + 'demos/')


demoPathReplace = replace(
	/((?:src|href)=['"])([^'"]*)(['"])/g
	(m0, m1, m2, m3) ->
		m1 + transformDemoPath(m2) + m3
)


transformDemoPath = (path) ->
	path = path.replace('../lib/moment/moment.js', '../lib/moment.min.js')
	path = path.replace('../lib/jquery/dist/jquery.js', '../lib/jquery.min.js')
	path = path.replace('../lib/jquery-ui/jquery-ui.js', '../lib/jquery-ui.min.js')
	path = path.replace('../lib/jquery-ui/themes/cupertino/', '../lib/cupertino/')
	path = path.replace('../lib/fullcalendar/dist/', '../lib/')
	path = path.replace('../dist/', '../')
	path = path.replace('/fullcalendar.css', '/fullcalendar.min.css')
	path = path.replace('/fullcalendar.js', '/fullcalendar.min.js')
	path = path.replace('/scheduler.css', '/scheduler.min.css')
	path = path.replace('/scheduler.js', '/scheduler.min.js')
	path


# Automated Testing
# ----------------------------------------------------------------------------------------------------------------------

KARMA_CONFIG_FILE = path.join(__dirname, 'karma.conf.coffee') # was getting confused with relative URLs

###
Runs a server, outputs a URL to visit
###
gulp.task 'karma', ->
	karmaServer.start
		configFile: KARMA_CONFIG_FILE
		singleRun: false
		autoWatch: true

###
Runs headlessly and continuously, watching files
###
gulp.task 'karmaHeadless', ->
	karmaServer.start
		configFile: KARMA_CONFIG_FILE
		browsers: [ 'PhantomJS_custom' ]
		singleRun: false
		autoWatch: true

###
Runs headlessly once, then exits
###
gulp.task 'karmaSingle', ->
	karmaServer.start
		configFile: KARMA_CONFIG_FILE
		browsers: [ 'PhantomJS_custom' ]
		singleRun: true
		autoWatch: false


# Release
# ----------------------------------------------------------------------------------------------------------------------

###
Bump the version in the *.json files, based on command line args
###
gulp.task 'bump', ->
	bumpOptions =
		if argv.version
			{ version: argv.version }
		else
			{ type: argv.type or 'patch' }
	gulp.src [ 'package.json', 'bower.json' ]
		.pipe bump(bumpOptions)
		.pipe gulp.dest('./')


# Utils
# ----------------------------------------------------------------------------------------------------------------------

getSrcTemplateVars = ->
	releaseDate =
		if argv['release-date']
			moment(argv['release-date'])
		else
			moment()
	_.extend {}, packageInfo
		releaseDate: releaseDate.format('YYYY-MM-DD')
