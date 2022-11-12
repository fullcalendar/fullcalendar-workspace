import { createPlugin } from '@fullcalendar/core/internal'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import { ScrollGrid } from './ScrollGrid.js'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
  scrollGridImpl: ScrollGrid,
})
