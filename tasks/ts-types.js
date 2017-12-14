const gulp = require('gulp')
const generateDts = require('dts-generator').default

gulp.task('ts-types', function() {
  return generateDts({
    project: '.', // where the tsconfig is
    name: 'fullcalendar-scheduler',
    main: 'fullcalendar-scheduler/src/main',
    exclude: [
      'node_modules/**/*',
      'fullcalendar/**/*' // don't bake in the core defs
    ],
    out: 'dist/scheduler.d.ts'
  })
})

gulp.task('ts-types:watch', [ 'ts-types' ], function() {
  return gulp.watch('src/**/*.ts', [ 'ts-types' ])
})
