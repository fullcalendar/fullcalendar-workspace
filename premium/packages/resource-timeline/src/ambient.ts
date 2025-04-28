// all dependencies except core
import '@fullcalendar/premium-common'
import '@fullcalendar/resource'
import '@fullcalendar/scrollgrid'
import '@fullcalendar/timeline'

import { ResourceTimelineOptions, ResourceTimelineOptionsRefined } from './options.js'


declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends ResourceTimelineOptions {}
  interface BaseOptionsRefined extends ResourceTimelineOptionsRefined {}
}
