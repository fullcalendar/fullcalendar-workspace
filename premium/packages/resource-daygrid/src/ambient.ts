// all dependencies except core
import '@fullcalendar/daygrid'
import '@fullcalendar/premium-common'
import '@fullcalendar/resource'

import { ResourceDayGridOptions, ResourceDayGridOptionsRefined } from './options.js'

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends ResourceDayGridOptions {}
  interface BaseOptionsRefined extends ResourceDayGridOptionsRefined {}
}
