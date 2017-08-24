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
defineJsTasks = (srcFiles, jsDistFile) ->
	coffeeDistFile = jsDistFile.replace(/.js$/, '.coffee')

	coffeeSrcFiles = srcFiles.filter (srcFile) ->
		/.coffee$/.test(srcFile)

	jsSrcFiles = srcFiles.filter (srcFile) ->
		/.js$/.test(srcFile)

	jsSrcFiles = jsSrcFiles.map (srcFile) ->
		'src/' + srcFile

	if coffeeSrcFiles.length
		jsSrcFiles.push('tmp/compiled-coffee/' + jsDistFile)

	# coffee, with sourcemaps
	gulp.task 'modules:dev:' + coffeeDistFile, ->
		gulp.src(coffeeSrcFiles, { cwd: 'src/', base: 'src/' })
			.pipe(plumber()) # affects future streams
			.pipe(sourcemaps.init())
			.pipe(concat(coffeeDistFile)) # will be renamed
			.pipe(coffee({ bare: true }))
			.pipe(sourcemaps.write()) # writes inline
			.pipe(gulp.dest('tmp/compiled-coffee/'))

	# coffee
	gulp.task 'modules:' + coffeeDistFile, ->
		gulp.src(coffeeSrcFiles, { cwd: 'src/', base: 'src/' })
			.pipe(plumber()) # affects future streams
			.pipe(concat(coffeeDistFile)) # will be renamed
			.pipe(coffee({ bare: true }))
			.pipe(gulp.dest('tmp/compiled-coffee/'))

	# js, with sourcemaps
	gulp.task 'modules:dev:' + jsDistFile, [ 'modules:dev:' + coffeeDistFile ], ->
		gulp.src(jsSrcFiles, { cwd: '.', base: '.' })
			.pipe(plumber()) # affects future streams
			.pipe(sourcemaps.init({ loadMaps: true })) # load coffeescript sourcemaps
			.pipe(concat(jsDistFile, { newLine: '\n;;\n' })) # will be renamed
			.pipe(sourcemaps.write()) # writes inline
			.pipe(gulp.dest('dist/'))

	# js
	gulp.task 'modules:' + jsDistFile, [ 'modules:' + coffeeDistFile ], ->
		gulp.src(jsSrcFiles, { cwd: '.', base: '.' })
			.pipe(plumber()) # affects future streams
			.pipe(concat(jsDistFile, { newLine: '\n;;\n' })) # will be renamed
			.pipe(template(packageConf))
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
			.pipe(sourcemaps.write())
			.pipe(gulp.dest('dist/'))

# loop the distFile:srcFiles map
_.forEach srcConf, (srcFiles, distFile) ->

	if /.js$/.test(distFile)
		defineJsTasks(srcFiles, distFile)
	else
		defineConcatTasks(srcFiles, distFile)

	gulp.task 'modules:watch:' + distFile, [ 'modules:dev:' + distFile ], ->
		gulp.watch(srcFiles, { cwd: 'src/' }, [ 'modules:dev:' + distFile ])
