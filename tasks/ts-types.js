const gulp = require('gulp')
const gutil = require('gulp-util')
const generateDts = require('dts-generator').default

gulp.task('ts-types', exec)

gulp.task('ts-types:slow', function() {
  setTimeout(exec, 5000)
})

/*
don't want to compete with and slow down the mission-critical webpack watch task,
so use the deprioritized version of the task.
*/
gulp.task('ts-types:watch', [ 'ts-types:slow' ], function() {
  gulp.watch('src/**/*.ts', ['ts-types:slow'])
})

function exec() {
  return generateDts({
    project: '.', // where the tsconfig is
    name: 'fullcalendar-scheduler',
    main: 'fullcalendar-scheduler/src/main',
    exclude: [
      'node_modules/**/*',
      'fullcalendar/**/*' // don't bake in the core defs
    ],
    out: 'dist/scheduler.d.ts'
  }).then(function() {
    gutil.log('wrote TypeScript definitions file')
  })
}
