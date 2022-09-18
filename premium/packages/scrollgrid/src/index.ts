import { createPlugin, config } from '@fullcalendar/core'

import { default as premiumCommonPlugin } from '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates
// ensure ambient declarations
import '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates

import { ScrollGrid } from './ScrollGrid.js'

export { ScrollGrid }
export { setScrollFromLeftEdge } from './scroll-left-norm.js'

export default createPlugin({
  deps: [
    premiumCommonPlugin,
  ],
  scrollGridImpl: ScrollGrid,
})

config.SCROLLGRID_RESIZE_INTERVAL = 500
