const gulp = require('gulp')
const gutil = require('gulp-util')
const eslint = require('gulp-eslint')
const tslint = require('gulp-tslint')
const tsLintLib = require('tslint')
const ts = require('typescript')

const tslintProgram = tsLintLib.Linter.createProgram('./tsconfig.json')

gulp.task('lint', [
  'lint:src',
  'lint:dts',
  'lint:built',
  'lint:node',
  'lint:tests'
])

gulp.task('lint:src', function() {
  return gulp.src('src/**/*.ts')
    .pipe(
      tslint({ // will use tslint.json
        formatter: 'verbose',
        program: tslintProgram // for type-checking rules
      })
    )
    .pipe(tslint.report())
})

// lints the TypeScript definitions file
// from https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
gulp.task('lint:dts', [ 'ts-types' ], function(done) {
  let program = ts.createProgram([ 'dist/scheduler.d.ts' ], {
    noEmitOnError: true,
    noImplicitAny: true, // makes sure all types are defined. the whole point!
    // we need paths for resolving core, but paths requires baseUrl,
    // and if we make baseUrl the project root, tsc starts compiling ALL .ts files,
    // so start in a subdir to avoid this.
    baseUrl: 'dist',
    paths: {
      fullcalendar: [ '../fullcalendar/dist/fullcalendar.d.ts' ]
    }
  })
  let emitResult = program.emit()
  if (emitResult.emitSkipped) { // error?
    emitResult.diagnostics.forEach(function(diagnostic) {
      if (diagnostic.file) {
        let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
        let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        gutil.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
      } else {
        gutil.log(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`)
      }
    })
    done('There are .d.ts linting problems.')
  } else {
    done() // success
  }
})

gulp.task('lint:built', [ 'webpack' ], function() {
  return gulp.src([
    'dist/*.js',
    '!dist/*.min.js'
  ])
    .pipe(
      eslint({ // only checks that globals are properly accessed
        parserOptions: { 'ecmaVersion': 3 }, // for IE9
        envs: [ 'browser', 'commonjs', 'amd' ],
        rules: { 'no-undef': 2 }
      })
    )
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

gulp.task('lint:node', function() {
  return gulp.src([
    '*.js', // config files in root
    'tasks/**/*.js'
  ])
    .pipe(
      eslint({
        configFile: 'eslint.json',
        envs: [ 'node' ]
      })
    )
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

gulp.task('lint:tests', function() {
  return gulp.src('tests/**/*.js')
    .pipe(
      eslint({
        configFile: 'eslint.json',
        envs: [ 'browser', 'jasmine', 'jquery' ],
        globals: [
          'moment',
          'pushOptions',
          'describeOptions',
          'describeTimezones',
          'describeValues',
          'initCalendar',
          'currentCalendar',
          'spyOnMethod',
          'spyCall',
          'oneCall'
        ]
      })
    )
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})
