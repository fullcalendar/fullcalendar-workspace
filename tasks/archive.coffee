gulp = require('gulp')
rename = require('gulp-rename')
filter = require('gulp-filter')
replace = require('gulp-replace')
zip = require('gulp-zip')
del = require('del')

# determines the name of the ZIP file
packageConf = require('../package.json')
packageId = packageConf.name + '-' + packageConf.version

gulp.task 'archive', [
	'archive:dist'
	'archive:misc'
	'archive:deps'
	'archive:demos'
], ->
	# make the zip, with a single root directory of a similar name
	gulp.src('tmp/' + packageId + '/**/*', { base: 'tmp/' })
		.pipe(zip(packageId + '.zip'))
		.pipe(gulp.dest('dist/'))

gulp.task 'archive:clean', ->
	del([
		'tmp/' + packageId + '/'
		'dist/' + packageId + '.zip'
	])

gulp.task 'archive:dist', [ 'modules', 'minify' ], ->
	gulp.src('dist/*.{js,css}') # matches unminified and minified files
		.pipe(gulp.dest('tmp/' + packageId + '/'))

gulp.task 'archive:misc', ->
	gulp.src([
		'LICENSE.*',
		'CHANGELOG.*',
		'CONTRIBUTING.*'
	])
	.pipe(rename({ extname: '.txt' }))
	.pipe(gulp.dest('tmp/' + packageId + '/'))

gulp.task 'archive:deps', [ 'archive:jqui:theme' ], ->
	gulp.src([
		'node_modules/moment/min/moment.min.js'
		'node_modules/jquery/dist/jquery.min.js'
		'node_modules/components-jqueryui/jquery-ui.min.js'
		'node_modules/fullcalendar/dist/fullcalendar.min.js'
		'node_modules/fullcalendar/dist/fullcalendar.min.css'
	])
	.pipe(gulp.dest('tmp/' + packageId + '/lib/'))

# transfers a single jQuery UI theme
gulp.task 'archive:jqui:theme', ->
	gulp.src([
		'jquery-ui.min.css'
		'images/*'
	], {
		cwd: 'node_modules/components-jqueryui/themes/cupertino/'
		base: 'node_modules/components-jqueryui/themes/'
	})
	.pipe(gulp.dest('tmp/' + packageId + '/lib/'))

# transfers demo files, transforming their paths to dependencies
gulp.task 'archive:demos', ->
	gulp.src('**/*', { cwd: 'demos/', base: 'demos/' })
		.pipe(htmlFileFilter)
		.pipe(demoPathReplace)
		.pipe(htmlFileFilter.restore) # pipe thru files that didn't match htmlFileFilter
		.pipe(gulp.dest('tmp/' + packageId + '/demos/'))

htmlFileFilter = filter('*.html', { restore: true })
demoPathReplace = replace(
	/((?:src|href)=['"])([^'"]*)(['"])/g
	(m0, m1, m2, m3) ->
		m1 + transformDemoPath(m2) + m3
)

transformDemoPath = (path) ->
	# reroot 3rd party libs
	path = path.replace('../node_modules/moment/', '../lib/')
	path = path.replace('../node_modules/jquery/dist/', '../lib/')
	path = path.replace('../node_modules/components-jqueryui/themes/cupertino/', '../lib/cupertino/') # must be first
	path = path.replace('../node_modules/components-jqueryui/', '../lib/')
	path = path.replace('../node_modules/fullcalendar/dist/', '../lib/')

	# reroot dist files to archive root
	path = path.replace('../dist/', '../')

	# always use minified
	# won't mutate .print.css thankfully
	path = path.replace(/\/([^\.]+)\.(js|css)/, '/$1.min.$2')

	path
