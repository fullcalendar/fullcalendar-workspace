import { createPlugin, config } from '@fullcalendar/core'

import { default as premiumCommonPlugin } from '@fullcalendar/premium-common'
// ensure ambient declarations
import '@fullcalendar/premium-common'

import { ScrollGrid } from './ScrollGrid.js'

export { ScrollGrid }
export { setScrollFromLeftEdge } from './scroll-left-norm.js'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [
    premiumCommonPlugin,
  ],
  scrollGridImpl: ScrollGrid,
})

config.SCROLLGRID_RESIZE_INTERVAL = 500
