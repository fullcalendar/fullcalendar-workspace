
path = require('path')

module.exports = (config) ->

	config.set

		basePath: path.join(__dirname, '..')

		frameworks: [ 'jasmine' ]

		files: [
			'lib/moment/moment.js'
			'lib/jquery/dist/jquery.js'
			'lib/fullcalendar/dist/fullcalendar.js'
			'lib/fullcalendar/dist/fullcalendar.css'
			'dist/scheduler.js'
			'dist/scheduler.css'

			'lib/jasmine-jquery/lib/jasmine-jquery.js'
			'lib/jasmine-fixture/dist/jasmine-fixture.js'
			'lib/jquery-simulate/jquery.simulate.js'
			'lib/jquery-ui/jquery-ui.js'

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

			{ pattern: 'dist/*.js.map', included: false }
			{ pattern: 'src/**/*.coffee', included: false }
			{ pattern: 'tests/json/*', included: false }
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