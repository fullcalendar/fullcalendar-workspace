import { createPlugin } from '@fullcalendar/common'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import { ScrollGrid } from './ScrollGrid'

export { ScrollGrid }
export { setScrollFromStartingEdge } from './scroll-left-norm'

export default createPlugin({
  deps: [
    premiumCommonPlugin
  ],
  scrollGridImpl: ScrollGrid
})
