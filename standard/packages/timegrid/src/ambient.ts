import { TimeGridOptions, TimeGridOptionsRefined } from './options.js'

// all dependencies except core
import '@fullcalendar/daygrid'

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends TimeGridOptions {}
  interface BaseOptionsRefined extends TimeGridOptionsRefined {}
}
