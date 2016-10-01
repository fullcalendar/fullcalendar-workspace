module.exports = (config) ->
	config.set

		basePath: ''

		frameworks: [ 'jasmine' ]

		files: [
			# dependencies for main lib
			'node_modules/moment/moment.js'
			'node_modules/jquery/dist/jquery.js'
			'node_modules/components-jqueryui/jquery-ui.js'
			'node_modules/components-jqueryui/themes/cupertino/jquery-ui.css'
			'node_modules/fullcalendar/dist/fullcalendar.js'
			'node_modules/fullcalendar/dist/fullcalendar.css'

			# main lib files
			'dist/scheduler.js'
			'dist/scheduler.css'

			# dependencies for tests
			'node_modules/native-promise-only/lib/npo.src.js'
			'node_modules/jasmine-jquery/lib/jasmine-jquery.js'
			'node_modules/jasmine-fixture/dist/jasmine-fixture.js'
			'node_modules/jquery-simulate/jquery.simulate.js'

			'tests/util/base.css'
			'tests/util/util.coffee'
			'tests/util/util-more.js'
			'tests/util/geom.coffee'
			'tests/util/day-grid.coffee'
			'tests/util/time-grid.coffee'
			'tests/util/column.coffee'
			'tests/util/timeline.coffee'
			'tests/util/moment.js'
			'tests/util/simulate.js'
			'tests/*.coffee'

			# serve misc files
			{
				included: false # don't immediately execute
				nocache: true # don't let the webserver cache
				pattern: '{' + [
					'tests/json' # data requested by tests
				].join(',') + '}/**/*'
			}

			# serve misc files, but don't watch
			{
				included: false # don't immediately execute
				nocache: true # don't let the webserver cache
				watched: false # don't let changes trigger tests to restart
				pattern: '{' + [
					'dist' # for sourcemap files
					'src' # for files referenced by sourcemaps
					'node_modules' # 3rd party lib dependencies, like jquery-ui theme images
				].join(',') + '}/**/*'
			}
		]

		preprocessors:
			'tests/**/*.coffee': [ 'coffee' ]

		coffeePreprocessor:
			options:
				bare: true
				sourceMap: true
			transformPath: (path) ->
				path.replace(/\.coffee$/, '.js')

		customLaunchers:
			PhantomJS_custom:
				base: 'PhantomJS'
				options:
					viewportSize:
						width: 1024
						height: 768

		reporters: [ 'dots' ]
