import { createPlugin } from '@fullcalendar/core/internal'
import premiumCommonPlugin from '@fullcalendar/premium-common'
import { contextInit } from './global-handlers.js'
import './index.css'

export default createPlugin({
  name: '<%= pkgName %>',
  premiumReleaseDate: '<%= releaseDate %>',
  deps: [premiumCommonPlugin],
  contextInit,
})
