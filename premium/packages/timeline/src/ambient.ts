// all dependencies except core
import '@fullcalendar/premium-common'
import '@fullcalendar/scrollgrid'

import { TimelineOptions, TimelineOptionsRefined } from './options.js'

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends TimelineOptions {}
  interface BaseOptionsRefined extends TimelineOptionsRefined {}
}
