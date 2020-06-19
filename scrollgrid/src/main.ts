import { createPlugin } from '@fullcalendar/common'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import '@fullcalendar/premium-common' // ensure ambient declarations
import { ScrollGrid } from './ScrollGrid'

export { ScrollGrid }
export { setScrollFromStartingEdge } from './scroll-left-norm'

export default createPlugin({
  deps: [
    premiumCommonPlugin
  ],
  scrollGridImpl: ScrollGrid
})
