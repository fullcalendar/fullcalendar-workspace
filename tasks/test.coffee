gulp = require('gulp')
path = require('path')
KarmaServer = require('karma').Server

karmaConf = path.join(__dirname, '../karma.conf.coffee') # was getting confused with relative URLs

# runs a server, outputs a URL to visit.
# we want sourcemaps (modules:dev).
gulp.task 'test', [ 'modules:dev' ], (done) ->
	new KarmaServer {
		configFile: karmaConf
		singleRun: false
		autoWatch: true
	}, (exitCode) -> # plays best with developing from command line
		process.exit(exitCode)
	.start()

# runs headlessly and continuously, watching files
gulp.task 'test:headless', [ 'modules' ], (done) ->
	new KarmaServer {
		configFile: karmaConf
		browsers: [ 'PhantomJS_custom' ]
		singleRun: false
		autoWatch: true
	}, (exitCode) -> # plays best with developing from command line
		process.exit(exitCode)
	.start()

# runs headlessly once, then exits
gulp.task 'test:single', [ 'modules' ], (done) ->
	new KarmaServer {
		configFile: karmaConf
		browsers: [ 'PhantomJS_custom' ]
		singleRun: true
		autoWatch: false
	}
	.on 'run_complete', (browsers, results) -> # plays best with CI and other tasks
		done(results.exitCode)
	.start()
