import { createPlugin } from '@fullcalendar/common'
import { ScrollGrid } from './ScrollGrid'

export { ScrollGrid }
export { setScrollFromStartingEdge } from './scroll-left-norm'

export default createPlugin({
  scrollGridImpl: ScrollGrid
})
