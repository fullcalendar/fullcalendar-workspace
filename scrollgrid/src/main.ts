import { createPlugin } from '@fullcalendar/common'

import premiumCommonPlugin from '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates
// ensure ambient declarations
import '@fullcalendar/premium-common' // eslint-disable-line import/no-duplicates

import { ScrollGrid } from './ScrollGrid'

export { ScrollGrid }
export { setScrollFromStartingEdge } from './scroll-left-norm'

export default createPlugin({
  deps: [
    premiumCommonPlugin,
  ],
  scrollGridImpl: ScrollGrid,
})
