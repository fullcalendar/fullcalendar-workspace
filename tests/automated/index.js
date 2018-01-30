
require('fullcalendar/tests/globals')
require('fullcalendar/tests/lib/moment')
require('fullcalendar/tests/lib/dom-geom')
require('fullcalendar/tests/lib/simulate')

var context = require.context(
  '.',
  true, // recursive?
  /[^/]+\/[^/]+\.(js|ts)$/ // inside subdirectory
)

context.keys().forEach(context)
