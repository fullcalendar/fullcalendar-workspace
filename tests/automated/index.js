
require('fullcalendar/tests/automated/globals')
require('fullcalendar/tests/automated/lib/moment')
require('fullcalendar/tests/automated/lib/dom-geom')
require('fullcalendar/tests/automated/lib/simulate')

var context = require.context(
  '.',
  true, // recursive?
  /\.(js|ts)$/
)

context.keys().forEach(context)
