
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

			'tests/util/base.css'
			'tests/util/util.coffee'
			'tests/util/geom.coffee'
			'tests/util/vresource.coffee'
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
