import { createPlugin, config } from '@fullcalendar/common'

import premiumCommonPlugin from '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates
// ensure ambient declarations
import '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates

import { ScrollGrid } from './ScrollGrid'

export { ScrollGrid }
export { setScrollFromLeftEdge } from './scroll-left-norm'

export default createPlugin({
  deps: [
    premiumCommonPlugin,
  ],
  scrollGridImpl: ScrollGrid,
})

config.SCROLLGRID_RESIZE_INTERVAL = 500
