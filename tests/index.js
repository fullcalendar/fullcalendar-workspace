
require('./globals.js')
require('./moment.js')
require('./simulate.js')

var context = require.context(
  '.',
  true, // recursive?
  /[^/]+\/[^/]+\.(js|ts)$/ // inside subdirectory
)

context.keys().forEach(context)
