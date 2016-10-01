gulp = require('gulp')
uglify = require('gulp-uglify')
cssmin = require('gulp-cssmin')
rename = require('gulp-rename')
del = require('del')

gulp.task('minify', [
	'minify:js'
	'minify:css'
])

gulp.task 'minify:clean', ->
	del('dist/*.min.{js,css}')

# minifies the core modules's js
gulp.task 'minify:js', [ 'modules' ], ->
	gulp.src([
		'dist/*.js'
		'!dist/*.min.js' # avoid double minify
	])
	.pipe(uglify({
		preserveComments: 'some' # keep comments starting with !
	}))
	.pipe(rename({ extname: '.min.js' }))
	.pipe(gulp.dest('dist/'))

# minifies the core modules's css
gulp.task 'minify:css', [ 'modules' ], ->
	gulp.src([
		'dist/*.css'
		'!dist/*.min.css' # avoid double minify
	])
	.pipe(cssmin())
	.pipe(rename({ extname: '.min.css' }))
	.pipe(gulp.dest('dist/'))
