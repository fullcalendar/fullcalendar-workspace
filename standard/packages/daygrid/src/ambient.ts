import { DayGridOptions, DayGridOptionsRefined } from './options.js'

declare module '@fullcalendar/core/internal' {
  interface BaseOptions extends DayGridOptions {}
  interface BaseOptionsRefined extends DayGridOptionsRefined {}
}
