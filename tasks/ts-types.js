const gulp = require('gulp')
const gutil = require('gulp-util')
const watch = require('gulp-watch') // better than gulp.watch because detects new files
const generateDts = require('dts-generator').default

gulp.task('ts-types', exec)

/*
Waits for scheduler.js to be created/modified before computing,
to avoid competing with and slowing down main build watcher.
*/
gulp.task('ts-types:watch', function() {
  watch('dist/scheduler.js', exec)
})

function exec() {
  gutil.log('Computing TypeScript definitions file...')
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
    gutil.log('Wrote TypeScript definitions file.')
  })
}
