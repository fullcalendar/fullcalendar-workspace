import { createPlugin } from '@fullcalendar/core'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import { ScrollGrid } from './ScrollGrid.js'
import './ambient.js'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
  scrollGridImpl: ScrollGrid,
})
