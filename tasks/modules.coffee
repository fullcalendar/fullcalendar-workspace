gulp = require('gulp')
concat = require('gulp-concat')
template = require('gulp-template')
coffee = require('gulp-coffee')
sourcemaps = require('gulp-sourcemaps')
plumber = require('gulp-plumber')
del = require('del')
_ = require('lodash')

# project configs
packageConf = require('../package.json')
srcConf = require('../src.json')

# generates js/css files in dist directory
gulp.task 'modules',
	_.map srcConf, (srcFiles, distFile) ->
		'modules:' + distFile

# generates js/css/sourcemap files in dist directory
gulp.task 'modules:dev',
	_.map srcConf, (srcFiles, distFile) ->
		'modules:dev:' + distFile

# watches source files and generates js/css/sourcemaps
gulp.task 'modules:watch',
	_.map srcConf, (srcFiles, distFile) ->
		'modules:watch:' + distFile

# deletes all generated js/css files in the dist directory
gulp.task 'modules:clean', ->
	del('dist/*.{js,css,map}')

# build tasks for coffeescript files that compile to JS
defineCoffeeTasks = (srcFiles, distFile) ->

	gulp.task 'modules:' + distFile, ->
		gulp.src(srcFiles, { cwd: 'src/', base: 'src/' })
			.pipe(plumber()) # affects future streams
			.pipe(concat(distFile)) # will be renamed
			.pipe(coffee({ bare: true }))
			.pipe(template(packageConf))
			.pipe(gulp.dest('dist/'))

	gulp.task 'modules:dev:' + distFile, ->
		gulp.src(srcFiles, { cwd: 'src/', base: 'src/' })
			.pipe(plumber()) # affects future streams
			.pipe(sourcemaps.init())
			.pipe(concat(distFile)) # will be renamed
			.pipe(coffee({ bare: true }))
			.pipe(sourcemaps.write('.', {
				includeContent: false,
				sourceRoot: '../src/' # relative to outputted file in dist
			}))
			.pipe(gulp.dest('dist/'))

# build tasks for files that are simple concatenations
defineConcatTasks = (srcFiles, distFile) ->

	gulp.task 'modules:' + distFile, ->
		gulp.src(srcFiles, { cwd: 'src/', base: 'src/' })
			.pipe(plumber()) # affects future streams
			.pipe(concat(distFile))
			.pipe(template(packageConf))
			.pipe(gulp.dest('dist/'))

	gulp.task 'modules:dev:' + distFile, ->
		gulp.src(srcFiles, { cwd: 'src/', base: 'src/' })
			.pipe(plumber()) # affects future streams
			.pipe(sourcemaps.init())
			.pipe(concat(distFile))
			.pipe(sourcemaps.write('.', {
				includeContent: false,
				sourceRoot: '../src/' # relative to outputted file in dist
			}))
			.pipe(gulp.dest('dist/'))

# loop the distFile:srcFiles map
_.forEach srcConf, (srcFiles, distFile) ->

	if /.coffee$/.test(distFile)
		defineCoffeeTasks(srcFiles, distFile)
	else
		defineConcatTasks(srcFiles, distFile)

	gulp.task 'modules:watch:' + distFile, [ 'modules:dev:' + distFile ], ->
		gulp.watch(srcFiles, { cwd: 'src/' }, [ 'modules:dev:' + distFile ])
